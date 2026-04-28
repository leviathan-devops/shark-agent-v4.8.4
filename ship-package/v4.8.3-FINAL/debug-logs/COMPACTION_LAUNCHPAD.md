# Shark Agent v4.8.x - Compaction Launchpad

## READ THIS AFTER COMPACTION

This document contains ALL critical context from previous sessions. Read carefully before proceeding.

---

## What Happened (Session Summary)

### v4.7 (Baseline - UNSAFE)
- Has guardian hook enforcement but CRITICAL BUG
- When `getCurrentAgent()` returns undefined, guardian SILENTLY RETURNS
- Dangerous tools are ALLOWED through when brain is unknown

### v4.8.1 (FAILED SHIP)
- `setCurrentAgent()` was defined but NEVER called
- ALL guardian hooks bypassed because they check `if (!getCurrentAgent()) return;`
- 20/20 static tests passed (theatrical) - verified code EXISTS not that it WORKS
- Live test showed `brain: unknown`

### v4.8.2 (Current - SHIP READY)
**THE FIX:**
- Discovered `session.created` event has NO `agent` field in OpenCode SDK
- `chat.message` hook HAS `agent` field
- Created `chat-message-hook.ts` to initialize brain from chat.message
- Brain now initializes properly: `brain: shark`

**NEW ANTI-SLOP FIREWALLS:**
- Layer 1: Blocks static verification (grep/wc/cat)
- Layer 2: Blocks fake test runners (jest/vitest/node test.js)
- Layer 3: Blocks source inspection (test -f, ls dist/)
- Layer 4: Blocks non-existent commands (opencode container run)

---

## Critical Discovery: Brain Initialization

### Why brain: unknown happened

```typescript
// session.created event structure - NO agent field!
type EventSessionCreated = {
  type: "session.created";
  properties: { info: Session };  // Session has id, directory - NO agent
};
```

Our old code expected:
```typescript
const event = input.event as { type?: string; agent?: string; };
if (!isSharkAgent(event.agent)) { return; }  // event.agent ALWAYS undefined!
setCurrentAgent(event.agent);  // Never reached
```

### The fix: chat.message hook

```typescript
// chat.message HAS agent field!
"chat.message"?: (input: {
  sessionID: string;
  agent?: string;  // ← Agent IS here
}) => Promise<void>;

export function createChatMessageHook(): Hooks['chat.message'] {
  return async (input) => {
    if (getCurrentAgent()) return;  // Already initialized
    if (agent && isSharkAgent(agent)) {
      setCurrentAgent(agent);
    }
  };
}
```

---

## Verified Working (Local 1.4.2)

| Feature | Test | Result |
|---------|------|--------|
| Brain init | `opencode run "shark-status" --agent shark` | ✅ Brain: shark |
| Anti-slop L1 | `opencode run "grep -c pattern src/"` | ✅ Blocked |
| Anti-slop L2 | `opencode run "node run-tests.js"` | ✅ Blocked |
| Anti-slop L3 | `opencode run "test -f dist/index.js"` | ✅ Blocked |
| Anti-slop L4 | `opencode run "opencode container run"` | ✅ Blocked |
| BRAIN_FAILURE_BLOCK | Dangerous tools when brain unknown | ✅ Hard blocked |

---

## Known Issues

1. **CARBON_COPY check is overly restrictive**
   - Blocks ALL `docker run` commands that don't mount `$HOME/.config/opencode`
   - Need to fix to only block when testing opencode plugin

2. **Container version mismatch**
   - `ghcr.io/anomalyco/opencode:latest` is 1.3.17 (broken `run` command)
   - Local opencode is 1.4.2
   - opencode is NOT on npm registry
   - Container testing requires local opencode or custom build

3. **Config overwrites**
   - Testing can accidentally overwrite `~/.config/opencode/opencode.json`
   - Always restore from backup after testing

---

## Critical Files

| File | Purpose |
|------|---------|
| `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/dist/index.js` | Built v4.8.2 bundle |
| `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/hooks/v4.1/chat-message-hook.ts` | Brain initialization fix |
| `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/hooks/v4.1/guardian-hook.ts` | Guardian + anti-slop |
| `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/hooks/v4.1/agent-state.ts` | Brain state tracking |

---

## Testing Commands

```bash
# Test brain initialization
opencode run "shark-status" --agent shark

# Test anti-slop firewalls
opencode run "grep -c pattern src/" --agent shark
opencode run "node run-tests.js" --agent shark
opencode run "opencode container run -- echo" --agent shark
```

---

## 5-Layer Architecture (Current)

| Layer | Name | Implemented | Working |
|-------|------|-------------|---------|
| L1 | Identity Wall | ⚠️ Partial | No vanilla bypass |
| L2 | Deployment Guard | ✅ | Evidence check |
| L3 | Container Test | ⚠️ | Evidence works, container broken |
| L4 | Slop Detector | ✅ | File verification |
| L5 | Sudo System | ✅ | Config approval |

---

## Build Command

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
bun run build
# Output: dist/index.js (1.0 MB)
```

---

## What Still Needs Work

1. **Fix CARBON_COPY check** - Make it only fire when testing opencode plugin
2. **Container testing** - Find way to test in proper containerized environment
3. **Vanilla agent bypass** - Guardian should let vanilla agents through untouched
4. **Evidence file generation** - Create proper ContainerTestResult.json

---

## Emergency Recovery

If brain shows `unknown` after compaction:

1. Check if `chat-message-hook.ts` is in `index.ts`:
   ```bash
   grep "chat.message" src/hooks/v4.1/index.ts
   ```

2. Check if hook is exported:
   ```bash
   grep "createChatMessageHook" src/hooks/v4.1/index.ts
   ```

3. Rebuild if needed:
   ```bash
   cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
   bun run build
   ```

---

## Reference Documents

- `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/V4.8.2_COMPLETE_REFERENCE.md` - Full v4.8.2 reference
- `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/ANTI_SLOP_FIREWALLS.md` - Anti-slop firewall docs
- `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/OPENCODE_CONTAINER_TEST_WORKFLOW.md` - Container workflow
- `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/03_OPENCODE_PLUGIN/v4_versions/SYSTEM_BRAIN_FIREWALL_ARCHITECTURE.md` - 5-layer architecture

---

## Key Learnings

1. **Static pattern checks don't prove runtime behavior** - 20/20 tests can pass and code still be broken
2. **session.created event doesn't have agent field** - must use chat.message for brain init
3. **Container version 1.3.17 has broken run command** - local 1.4.2 works differently
4. **Agents hallucinate around hard problems** - need mechanical enforcement, not trust
5. **Silent failures are dangerous** - guardian returning early without warning was hidden bug

---

## Last Updated

2026-04-10 (Session after v4.8.2 debugging)
