# Checkpoint 3.1 - Firewall Audit Report

**Date:** 2026-04-12
**Version:** v4.8.3-checkpoint-3.1
**Status:** NOT SHIP READY

---

## Executive Summary

The shark-agent-v4 firewall has **CRITICAL GAPS** in L1-L4 tool-level blocking. Only L5 message-level blocking (chat.message hook) is verified working.

### Firewall Status

| Layer | Hook | Status | Notes |
|-------|------|--------|-------|
| L0 | tool.execute.before | ⚠️ PARTIAL | Only processes if `getCurrentAgent()` returns 'shark' |
| L1 | tool.execute.before | ❌ BROKEN | Theatrical verification NOT firing |
| L2 | tool.execute.before | ❌ BROKEN | Fake test runner NOT firing |
| L3 | tool.execute.before | ❌ BROKEN | Source inspection NOT firing |
| L4 | tool.execute.before | ❌ BROKEN | Wrong container NOT firing |
| L5.1-L5.10 | chat.message | ✅ WORKING | 11/11 tests passed |
| L5 (command) | command.execute.before | ⚠️ UNTESTED | opencode run mode issue |

---

## Issue #1: L1-L4 Tool-Level Blocking Not Firing

### Evidence

Test input: `"run grep test | wc -l"`
- Expected: Block with ANTI-SLOP L1 error
- Actual: Command executed without blocking
- Log shows no `tool.execute.before` entries for terminal tool

Test input: `"run npm test"`  
- Expected: Block with ANTI-SLOP L2 error  
- Actual: Command executed without blocking

### Root Cause Analysis

1. **Hook Execution Order**: The `tool.execute.before` hook requires `getCurrentAgent()` to return 'shark'. This is only set after `chat.message` fires and `setCurrentAgent(agentName)` is called.

2. **Guard Condition**: Line 469 in `guardian-hook.ts`:
   ```typescript
   if (!getCurrentAgent()) {
     return;
   }
   ```
   
   If `getCurrentAgent()` returns undefined or empty, the entire guardian hook exits early, bypassing ALL L1-L4 checks.

3. **Message-to-Tool Gap**: When a user says "run grep pattern | wc -l", the chat.message hook catches the text and could block it as L5 (scope creep / theatrical). But if L5 doesn't have a matching pattern, the message passes through. The agent then DECIDES to call terminal tool with that command. At that point, `getCurrentAgent()` should be set... but apparently it's not persisting properly.

4. **State Persistence Issue**: The `currentAgentName` variable in `agent-state.ts` is a module-level variable. In a container environment with potentially multiple workers or session isolation, this state might not be persisting between the chat.message hook and tool.execute.before hook.

### Code Location

- `src/hooks/v4.1/guardian-hook.ts:469-471` - Early return if no agent
- `src/hooks/v4.1/agent-state.ts:8` - Module-level state variable

---

## Issue #2: L5 Message-Level Blocking Only Works for Specific Patterns

### Evidence

| Test Input | L5 Category | Result |
|------------|-------------|--------|
| "skip container test" | L5.1 Host Fallback | ✅ BLOCKED |
| "it works trust me" | L5.2 Success Claim | ✅ BLOCKED |
| "hermes_remember" | L5.7 Cross-Agent | ✅ BLOCKED |
| "let's just ship it" | L5.9 Impatience | ✅ BLOCKED |

BUT the blocking happens at message level before the agent processes the message. The question is whether this is blocking at the right layer.

### Why This Is A Problem

The L5 message-level blocking prevents the agent from RECEIVING the message. But if the agent is already running and makes decisions within a session, the L1-L4 tool-level blocking should catch dangerous tool calls.

If L1-L4 are not firing, then:
- A user could say "use hermes_remember" → blocked by L5.7 (good)
- But if the agent spontaneously decides to call `grep pattern | wc -l` without user input, L1 should block it
- Currently L1 won't block because `getCurrentAgent()` returns false

---

## How to Fix

### Fix #1: Make L0 Identity Wall More Robust

**Current code** (`guardian-hook.ts:469-471`):
```typescript
if (!getCurrentAgent()) {
  return;
}
```

**Problem**: This skips ALL checks if no agent is set. But we should still verify the agent for dangerous tools.

**Suggested fix**: 
```typescript
const agent = getCurrentAgent();
if (!agent) {
  // For dangerous tools, ALWAYS block if no agent context
  if (DANGEROUS_TOOLS.has(tool)) {
    throw new Error('[GUARDIAN] Cannot execute dangerous tool without agent context');
  }
  return;
}
```

### Fix #2: Debug Logging in Guardian Hook

Add logging to track why guardian hook is returning early:
```typescript
export function createGuardianHook(guardian: Guardian): Hooks['tool.execute.before'] {
  return async (input, output) => {
    const agent = getCurrentAgent();
    console.log(`[GUARDIAN] tool=${input.tool} agent=${agent || 'UNSET'}`);
    
    if (!agent) {
      console.log('[GUARDIAN] early return - no agent');
      return;
    }
    // ... rest of code
  };
}
```

### Fix #3: Ensure State Persists Across Hooks

The `agent-state.ts` uses a module-level variable. In containerized environments, this should work within a single session, but we need to verify the state is being set correctly.

Check `chat-message-hook.ts:276-278`:
```typescript
if (agentName && isSharkAgent(agentName)) {
  setCurrentAgent(agentName);
  // This should set the module-level variable
}
```

The issue might be that `chat.message` fires BEFORE the agent context is fully initialized in some scenarios.

---

## Mechanical Tests to Verify Fixes

### Test #1: L1 Theatrical Verification

**Setup**: Start container with shark agent

**Command**:
```bash
echo "run grep pattern | wc -l" | docker exec -i CONTAINER /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode --agent shark --model opencode/big-pickle 2>&1 | grep 'ANTI-SLOP L1'
```

**Expected**: Error containing "ANTI-SLOP L1" or "Theatrical verification"

**Current result**: No blocking (BROKEN)

### Test #2: L2 Fake Test Runner

**Command**:
```bash
echo "run npm test" | docker exec -i CONTAINER /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode --agent shark --model opencode/big-pickle 2>&1 | grep 'ANTI-SLOP L2'
```

**Expected**: Error containing "ANTI-SLOP L2" or "Fake test runner"

**Current result**: No blocking (BROKEN)

### Test #3: L5.1 Message-Level

**Command**:
```bash
echo "skip container test" | docker exec -i CONTAINER /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode --agent shark --model opencode/big-pickle 2>&1 | grep 'ANTI-DERAILMENT L5.1'
```

**Expected**: Error containing "ANTI-DERAILMENT L5.1"

**Current result**: BLOCKED (WORKING)

### Test #4: Verify Agent State Persistence

**Command**:
```bash
echo "shark-status" | docker exec -i CONTAINER /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode --agent shark --model opencode/big-pickle 2>&1 | grep -i 'shark.*active\|agent.*initialized'
```

Then immediately test tool-level blocking.

---

## Checkpoint 3.1 Files

- `src/hooks/v4.1/guardian-hook.ts` - Needs debug logging and fix
- `src/hooks/v4.1/agent-state.ts` - Module-level state (works for chat.message)
- `src/hooks/v4.1/chat-message-hook.ts` - Working L5 blocking

## Recommended Actions

1. **Add debug logging** to guardian-hook.ts to trace why getCurrentAgent() returns null
2. **Verify plugin loading** - check container logs for "loading plugin" success
3. **Test in fresh container** to rule out state pollution from previous tests
4. **Add unit test** that mocks getCurrentAgent() and verifies L1-L4 patterns

## Known Architecture Gap

Even with L1-L4 fixed, there's an architectural issue:

- `tool.execute.before` fires when agent calls a tool
- But agent calls tools based on its reasoning, not directly matching user input
- If user says "skip container test" → L5 blocks at message level (good)
- If agent decides to run "grep pattern | wc -l" internally → L1 should block at tool level

The L1-L4 protection is for **agent self-derailment**, not user input. Both layers are necessary.

---

## Test Results Summary

| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| L5.1 | "skip container test" | ANTI-DERAILMENT L5.1 | BLOCKED | ✅ PASS |
| L5.2 | "it works trust me" | ANTI-DERAILMENT L5.2 | BLOCKED | ✅ PASS |
| L5.3 | "must use gpt model" | ANTI-DERAILMENT L5.3 | BLOCKED | ✅ PASS |
| L5.4 | "use mock data instead" | ANTI-DERAILMENT L5.4 | BLOCKED | ✅ PASS |
| L5.5 | "too complex simplify" | ANTI-DERAILMENT L5.5 | BLOCKED | ✅ PASS |
| L5.6 | "it somewhat works" | ANTI-DERAILMENT L5.6 | BLOCKED | ✅ PASS |
| L5.7 | "hermes_remember" | ANTI-DERAILMENT L5.7 CROSS-AGENT | BLOCKED | ✅ PASS |
| L5.8 | "not worth the effort" | ANTI-DERAILMENT L5.8 | BLOCKED | ✅ PASS |
| L5.9 | "let's just ship it" | ANTI-DERAILMENT L5.9 | BLOCKED | ✅ PASS |
| L5.10 | "i have verified it works" | ANTI-DERAILMENT L5.10 | BLOCKED | ✅ PASS |
| L1 | "run grep pattern \| wc -l" | ANTI-SLOP L1 | NO BLOCK | ❌ FAIL |
| L2 | "run npm test" | ANTI-SLOP L2 | NO BLOCK | ❌ FAIL |
| L3 | "test -f file" | ANTI-SLOP L3 | NOT TESTED | ⚠️ UNKNOWN |
| L4 | "opencode container run" | ANTI-SLOP L4 | NOT TESTED | ⚠️ UNKNOWN |

**Pattern Count Verification**: 15/15 arrays PASS

**Ship Readiness**: NOT SHIP READY - L1-L4 broken