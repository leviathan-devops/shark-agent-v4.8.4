# Shark Agent v4.x Context Dump

## What We Are Building

Shark Agent is a multi-agent orchestrator plugin for OpenCode. It wraps OpenCode with a gated QA pipeline where code never ships without reviewer and test engineer approval. The system brain tracks agent state, gates (plan/build/test/verify/audit/delivery), and provides guardian enforcement to prevent dangerous operations.

## Version History

### v4.7 (Baseline - WORKS but Unsafe)
- Has guardian hook enforcement
- **CRITICAL BUG**: When `getCurrentAgent()` returns undefined (brain: unknown), guardian silently returns - dangerous tools are ALLOWED through
- No brain initialization tracking
- Container test mechanism broken

### v4.8 (Never shipped - Internal failures)
- Attempted to add container testing
- Build issues prevented shipping

### v4.8.1 (Shipped but FAILED - Silent bypass)
- **CRITICAL SHIP FAILURE**: `setCurrentAgent()` was defined but NEVER called
- All guardian hooks check `if (!getCurrentAgent()) return;` - this always returned early
- Guardian enforcement was COMPLETELY BYPASSED
- 20/20 static pattern tests passed (theatrical) - verified code EXISTS, not that it WORKS
- Container test showed `brain: unknown` at runtime despite source having the call

### v4.8.2 (Current - Fixed but NOT runtime verified)
**Source fixes applied:**
1. `session-hook.ts`: Multi-source agent extraction (tries `event.agent`, `event.properties.info.agent`, `SHARK_AGENT` env var) + debug logging
2. `agent-state.ts`: Brain initialization flag + logging when brain initializes
3. `guardian-hook.ts`: 
   - `BRAIN_FAILURE_BLOCK`: HARD BLOCK instead of silent return - dangerous tools blocked when brain unknown
   - `CONTAINER_LEAK_BLOCK`: Deployment blocked if containers running
   - Container enforcement blocks (CARBON_COPY, SLOP_THEATER, etc.)

**Build**: SUCCESS (1.0 MB bundle at `dist/index.js`)

**NOT VERIFIED**: Runtime test proving brain initializes to "shark" not "unknown"

## The Core Problem: Brain Initialization

### Why brain: unknown happens

The OpenCode SDK `session.created` event structure:
```typescript
type EventSessionCreated = {
    type: "session.created";
    properties: {
        info: Session;  // Session has id, directory, title - NO agent field!
    };
};
```

The session hook code expected:
```typescript
const event = input.event as { type?: string; sessionId?: string; agent?: string };
// ...
if (!isSharkAgent(event.agent)) {  // event.agent is ALWAYS undefined!
    return;
}
setCurrentAgent(event.agent);  // Never reached
```

**Result**: `isSharkAgent(undefined)` returns `false`, hook exits early, `setCurrentAgent()` never called, brain stays undefined.

### The Fix Attempted (v4.8.2)

```typescript
// Try multiple sources for agent name
function extractAgentFromEvent(event): string | undefined {
    if (event.agent) return event.agent;
    if (event.properties?.info?.agent) return event.properties.info.agent;
    return undefined;
}

// Also check environment
const envAgent = process.env.SHARK_AGENT;
```

**But we can't verify if this works** - no working container test mechanism.

## Container Testing Problems

### Problem 1: Version Mismatch
- Local opencode: **1.4.2** (npm installed)
- Container image `ghcr.io/anomalyco/opencode:latest`: **1.3.17** only
- No 1.4.2 container image exists on GHCR
- **"Carbon copy" is impossible** - container has different OpenCode version

### Problem 2: Permission Prompts
Container opencode 1.3.17 prompts for directory access even with `--pure` and `--dangerously-skip-permissions`

### Problem 3: Command Parsing
`opencode run "message"` appears to be parsed as `opencode [project]` positional, not as run command with message

### The DeepSeek Master Prompt Approach (Did Not Work)

DeepSeek suggested this workflow:
```bash
# Copy full config
cp -a ~/.config/opencode /tmp/opencode-test-$timestamp

# Add plugin to temp config
# Update opencode.json

# Run container with full config mounted
docker run --rm -v "$TEST_DIR/config:/root/.config/opencode" ghcr.io/anomalyco/opencode:latest ...
```

**But this fails because container is 1.3.17, not 1.4.2**

## Current Working Directory Setup

```
/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/
├── src/                    # TypeScript source
├── dist/index.js           # Built bundle (1.0 MB)
├── node_modules/
└── package.json
```

## Current opencode.json

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "file:///tmp/shark-test-v482/plugins/shark-agent/dist/index.js"
  ]
}
```

Points to OLD test build, not current v4.8.2.

## What We Need

1. **A way to test the plugin in actual OpenCode 1.4.2 runtime**
2. **Verify brain initializes to "shark" not "unknown"**
3. **Container cleanup enforcement** - agents always leave containers running

## v4.8.2 Guardian Blocks (Working)

| Block | Trigger | Behavior |
|-------|---------|----------|
| `BRAIN_FAILURE_BLOCK` | `getCurrentAgent()` undefined + dangerous tool | HARD ERROR - tool blocked |
| `CONTAINER_LEAK_BLOCK` | Deployment + containers running | HARD ERROR - deployment blocked |
| `WRONG_CONTAINER_APPROACH` | Static analysis verification (grep/wc/cat) | HARD ERROR |
| `BROKEN_BUILD_PATTERNS` | Build without src/dist/package.json | HARD ERROR |

## Files to Review

```
/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/
├── src/hooks/v4.1/
│   ├── session-hook.ts        # Brain initialization attempt
│   ├── guardian-hook.ts       # Enforcement hooks
│   ├── agent-state.ts         # Brain state tracking
│   └── index.ts               # Hook registration
└── dist/index.js              # Built bundle
```

## Immediate Questions

1. **How do we test plugin in actual OpenCode 1.4.2 runtime?**
2. **Can we build custom 1.4.2 container image?**
3. **Or should we test on host directly with modified opencode.json?**
4. **What's the correct opencode run command syntax for non-interactive use?**

## Test Command That Should Work But Doesn't

```bash
docker run --rm \
  -v /tmp/opencode-test-1775762855/config:/root/.config/opencode \
  ghcr.io/anomalyco/opencode:latest \
  opencode --pure --dangerously-skip-permissions run "shark-status"
```

Output: Shows help text instead of running command (command parsing issue)

## Successful Commands

```bash
# Check version (works)
docker run --rm -v /tmp/.../config:/root/.config/opencode ghcr.io/anomalyco/opencode:latest opencode --version
# Output: 1.3.17

# Check help (works)
docker run --rm -v /tmp/.../config:/root/.config/opencode ghcr.io/anomalyco/opencode:latest opencode --help
# Output: Full help text
```

## Request for Help

Need DeepSeek to provide:
1. Working command to run opencode in container non-interactively with plugin loaded
2. Or alternative approach to test plugin in actual OpenCode 1.4.2 runtime
3. Or confirmation that building custom 1.4.2 image is the only viable path
