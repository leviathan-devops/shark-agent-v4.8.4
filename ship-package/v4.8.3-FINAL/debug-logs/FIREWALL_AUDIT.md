# SHARK AGENT FIREWALL AUDIT — v4.8.2/v4.8.3

## Date: 2026-04-10 Evening

## EXECUTIVE SUMMARY

v4.8.2 restored and running. L5 firewalls are structured correctly (11 layers) but have critical flaws in what they check.

## L5 LAYER STRUCTURE (11 Layers)

All 11 layers are defined and registered in `layer5-engine.ts`:
```
L5.1: Host Fallback
L5.2: Success Claim
L5.3: Model Restriction
L5.4: Mock/Stub
L5.5: Simplification
L5.6: Confusion
L5.7: Scope Creep + CROSS-AGENT
L5.8: Undermining
L5.9: Impatience
L5.10: Self-Reference
L5.11: Common Sense
```

## CRITICAL BUG: buildTextToCheck

### Problem
All L5 sub-layers use `buildTextToCheck(context)` which concatenates:
- `agentMessage` (from chat.message hook = USER's message)
- `toolArgs` (what agent is trying to do)
- `output` (results)

### Why This Is Wrong
1. `agentMessage` contains USER input, not agent reasoning
2. When user says "use hermes_remember", L5.7 sees it as agent trying to use it
3. Any mention of cross-agent tools in user input triggers false blocks

### Evidence
From derailment-audit.json:
```json
"agentStatement": "TASK: CURATOR_INIT\nPRIOR_SUMMARY: none\n...\nhermes_remember..."
```
User typed "hermes_remember" in task prompt → L5.7 blocked

## LAYER-BY-LAYER AUDIT

### L5.1 Host Fallback ✅ STRUCTURE OK, ❌ MAYBE MISCONFIGURED
**Patterns**: 12 patterns for host substitution
**Issue**: Pattern `/host.*already.*proves/i` is very broad
**Risk**: Could block legitimate mentions of "host"

### L5.2 Success Claim ✅ STRUCTURE OK, ❌ PATTERNS TOO BROAD
**Patterns**: 15 patterns for unverified success
**Issue**: Patterns like `/clearly.*works/i` could trigger on normal conversation
**Risk**: Blocking legitimate work

### L5.3 Model Restriction ✅ WORKING (confirmed earlier)
**Patterns**: Blocks GLM, DeepSeek direct usage
**Confirmed**: "use GLM instead" triggered block

### L5.4 Mock/Stub ✅ STRUCTURE OK
**Patterns**: Blocks mock test patterns
**Not tested**

### L5.5 Simplification ✅ STRUCTURE OK
**Patterns**: Blocks "too complex" derailment
**Not tested**

### L5.6 Confusion ✅ STRUCTURE OK
**Patterns**: Blocks confusion pretense
**Not tested**

### L5.7 Scope Creep ❌ BROKEN
**Patterns**: `/hermes.*remember/i` etc.
**Issue**: Matches ANY mention, not actual tool calls
**Fix**: Only check `toolArgs.tool` field, not full text

### L5.8 Undermining ❌ NOT TESTED
**Patterns**: Block firewall criticism
**Not tested**

### L5.9 Impatience ❌ NOT TESTED
**Patterns**: Block "too slow" derailment
**Not tested**

### L5.10 Self-Reference ❌ NOT TESTED
**Patterns**: Block self-verification claims
**Not tested**

### L5.11 Common Sense ❌ NOT TESTED
**Patterns**: Block logic disconnects
**Not tested**

## GUARDIAN LAYER AUDIT (L1-L4)

### L1 Anti-Slop ✅ WORKING
Blocks theatrical verification (grep, wc, cat as "verification")

### L2 Dangerous Commands ✅ EXISTS
Blocks `rm -rf /`, `dd`, `mkfs`, etc.

### L3 Container Test Enforcer ✅ EXISTS
Blocks plugin edits without container test evidence

### L4 Deployment Guard ✅ EXISTS
Requires container test for deployment

### L5 Ship Package Check ✅ NEW (this session)
Requires build-log.md, changelog.md, debug-log.md, DeliverySummary.md

## WHAT WE LEARNED

1. **L5.3 works** — Model restriction patterns are calibrated correctly
2. **L5.7 is broken** — Matches mentions, not actual tool calls
3. **All L5 layers use wrong text source** — buildTextToCheck includes user input
4. **L5.1, L5.2 are likely over-broad** — Need narrow triggers

## REQUIRED FIXES FOR v4.8.4

### Fix 1: buildTextToCheck
```typescript
// ONLY check what agent is EXECUTING, not what user said
function buildTextToCheck(context: DerailmentContext): string {
  if (context.toolArgs?.tool) {
    return JSON.stringify(context.toolArgs);  // Only tool call
  }
  return '';
}
```

### Fix 2: L5.7 pattern matching
```typescript
// Check if tool name is in TOOL CALL, not text mention
const toolName = context.toolArgs?.tool;
if (toolName && CROSS_AGENT_TOOLS.includes(toolName)) {
  // Block actual tool call
}
```

### Fix 3: Calibrate L5.1, L5.2
- Narrow patterns to specific phrases, not general matches

### Fix 4: Add project-spec.json
- Implement in plan gate when SPEC.md is created

## TEST RESULTS (Pre-fix)

| Layer | Status | Notes |
|-------|--------|-------|
| L5.1 | ⚠️ Unclear | May trigger on normal "host" mentions |
| L5.2 | ⚠️ Over-broad | May block normal work |
| L5.3 | ✅ Working | GLM/DeepSeek blocked correctly |
| L5.4 | ❓ Untested | - |
| L5.5 | ❓ Untested | - |
| L5.6 | ❓ Untested | - |
| L5.7 | ❌ Broken | Matches mentions not calls |
| L5.8 | ❓ Untested | - |
| L5.9 | ❓ Untested | - |
| L5.10 | ❓ Untested | - |
| L5.11 | ❓ Untested | - |

## FILES AT RISK

```
Working: /home/leviathan/OPENCODE_WORKSPACE/plugins/shark-v482/dist/index.js (v4.8.2)
Current: /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/dist/index.js (v4.8.3 - broken)
Ship: /home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/SHIP APPROVED /v4.8.3/ (incomplete)
```