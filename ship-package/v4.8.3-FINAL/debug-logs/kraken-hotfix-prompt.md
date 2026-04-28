# KRAKEN ENGINEER TASK: Fix Cross-Plugin Memory Leaks & Agent Isolation

## Problem

Kraken-agent-v1.1's Shark/Manta plugins are causing:
1. **Hardware exhaustion** - Only 3 shark sessions consume resources that should handle 20+
2. **Plugin overwrite** - Kraken's Shark/Manta hooks fire for ALL agents, not just their own
3. **UI spillover** - 19+ console.log/error/warn calls in Manta spill into UI
4. **State leakage** - Module-level globals never reset between sessions

## Current Bad State

`~/.config/opencode/opencode.json` has:
```json
"plugin": [
  "file:///home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.1/shark-agent/dist/index.js",  // OLD - no hotfixes
  "file:///home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.1/manta-agent/dist/index.js", // OLD - no hotfixes
  ...
]
```

## Required Fix

### Option A: Link to Existing Hotfix Plugins (RECOMMENDED)

Update kraken to USE the standalone hotfix plugins instead of its built-in Shark/Manta:

```json
"plugin": [
  // Remove kraken's internal shark-agent and manta-agent
  // Add links to the hotfix versions:
  "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/dist/index.js",
  "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/manta-agent-v1.3.5-hotfix/dist/index.js",
]
```

### Option B: Apply Hotfixes to Kraken's Versions

If keeping Shark/Manta inside kraken, apply these fixes to kraken-agent-v1.1:

**1. Memory Leak Fixes (MUST HAVE):**

- `shared/messenger.ts` - Add `cleanup()` method:
  ```typescript
  cleanup(): void {
    this.queues.clear();
    this.pendingAcks.clear();
    this.receivedAcks.clear();
  }
  ```

- `shared/state-store.ts` - Add `cleanup()` method:
  ```typescript
  cleanup(): void {
    this.data.clear();
    this.versions.clear();
    this.watchers.clear();
  }

- `hooks/v4.1/session-hook.ts` - Call cleanup on session.ended:
  ```typescript
  case 'session.ended':
    stateStore.cleanup();
    messenger.cleanup();
    // Also reset module-level state:
    lastDeliveryBlocked = false;
    dirCreationAttempted = false;
    resetSystemTransformState();
    resetGateHookState();
    break;
  ```

- `hooks/v4.1/gate-hook.ts` - Add reset function:
  ```typescript
  let lastDeliveryBlocked = false;
  export function resetGateHookState(): void {
    lastDeliveryBlocked = false;
  }
  ```

- `hooks/v4.1/system-transform-hook.ts` - Add reset function

**2. Agent Isolation Fix (MUST HAVE):**

All hooks must check `isSharkAgent()` or `isMantaAgent()` BEFORE executing. For CLI mode, use `getCurrentAgent()` from `agent-state.ts` (create this file if missing).

**3. Remove ALL console.log/error/warn calls**

Every console.* call in hooks files causes UI spillover. Either:
- Remove them entirely, OR
- Replace with a silent logging mechanism that doesn't output to stdout

**4. Remove Duplicate Plugin Registration**

Kraken should NOT re-register Shark/Manta as agents if they're already registered by the hotfix plugins. Check that `index.ts` doesn't duplicate agent definitions.

## Hotfix Plugin Locations

- **Shark v4.7-hotfix-v3**: `/home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/dist/index.js`
- **Manta v1.3.5-hotfix**: `/home/leviathan/OPENCODE_WORKSPACE/plugins/manta-agent-v1.3.5-hotfix/dist/index.js`

## Verification

After fix:
1. Run 15 commands in a shark session - memory should grow <500MB (was 1822MB)
2. Run 3 parallel shark sessions - hardware should NOT exhaust
3. UI should NOT show any console logs from Shark/Manta
4. Other agents (spider, plan, build) should work normally