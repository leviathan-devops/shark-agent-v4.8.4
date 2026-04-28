# Shark Agent v4.x - Complete Context Library

## Project Overview

Shark Agent is an OpenCode plugin that wraps the OpenCode AI coding assistant with a gated QA pipeline. The system brain tracks agent state and enforces guardian rules to prevent dangerous operations.

**Repository**: `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/`

**Current Status**: v4.8.2 built but NOT runtime verified. Brain initialization is broken.

---

## Version History

### v4.7 (Last working version - UNSAFE)
- Location: `/home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v47/`
- Guardian hook exists but has CRITICAL bug
- When `getCurrentAgent()` returns undefined, guardian silently returns - dangerous tools are ALLOWED through
- Container test mechanism was broken

### v4.8.1 (SHIPPED BUT FAILED)
- `setCurrentAgent()` was defined in code but NEVER called
- All guardian hooks check `if (!getCurrentAgent()) return;` - always returned early
- Guardian enforcement was COMPLETELY BYPASSED
- 20/20 static tests passed (verified pattern EXISTS, not that code WORKS)
- Live container test showed `brain: unknown`

### v4.8.2 (Current - FIXES APPLIED BUT NOT VERIFIED)
**Source fixes:**
- `session-hook.ts`: Tries multiple sources for agent name + debug logging
- `agent-state.ts`: Brain init flag + logging
- `guardian-hook.ts`: BRAIN_FAILURE_BLOCK hard error instead of silent return

**Build status**: SUCCESS - 1.0 MB bundle at `dist/index.js`

**NOT verified**: Runtime test proving brain initializes to "shark"

---

## System Architecture

### Guardian Hook Flow

```
User runs tool (terminal, write_file, etc.)
         ↓
tool.execute.before hook fires
         ↓
getCurrentAgent() called
         ↓
If returns undefined (brain: unknown) → v4.7 silently returns, v4.8.2 throws HARD ERROR
         ↓
If returns "shark" → Guardian rules enforced
```

### The Brain Initialization Problem

**Expected flow:**
1. `session.created` event fires
2. Session hook extracts agent name
3. `setCurrentAgent("shark")` is called
4. `getCurrentAgent()` returns "shark"
5. Guardian enforces rules

**Actual flow (BROKEN):**
1. `session.created` event fires
2. Session hook checks `isSharkAgent(event.agent)`
3. `event.agent` is ALWAYS undefined in OpenCode SDK
4. `isSharkAgent(undefined)` returns false
5. Hook returns early - `setCurrentAgent()` NEVER called
6. Brain stays undefined

### OpenCode SDK Event Structure

From `@opencode-ai/sdk/dist/gen/types.gen.d.ts`:

```typescript
export type EventSessionCreated = {
    type: "session.created";
    properties: {
        info: Session;  // Session has id, projectID, directory - NO agent field
    };
};

export type Session = {
    id: string;
    projectID: string;
    directory: string;
    parentID?: string;
    title: string;
    version: string;
    // ... NO agent field anywhere
};
```

### Chat Message Hook (Has Agent)

From `@opencode-ai/plugin/dist/index.d.ts`:

```typescript
"chat.message"?: (input: {
    sessionID: string;
    agent?: string;  // ← Agent IS here
    model?: { providerID: string; modelID: string; };
    messageID?: string;
    variant?: string;
}, output: {
    message: UserMessage;
    parts: Part[];
}) => Promise<void>;
```

**Key insight**: `chat.message` hook HAS `agent` field. `session.created` does NOT.

---

## File Structure

```
/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/
├── src/
│   ├── index.ts                    # Plugin entry point
│   ├── hooks/v4.1/
│   │   ├── session-hook.ts         # Session lifecycle + brain init
│   │   ├── guardian-hook.ts        # Tool enforcement rules
│   │   ├── gate-hook.ts            # Gate state management
│   │   ├── system-transform-hook.ts # IRONCLAD rule enforcement
│   │   ├── compacting-hook.ts       # Session compaction
│   │   ├── agent-state.ts          # Brain state tracking
│   │   └── index.ts               # Hook exports
│   ├── shared/
│   │   ├── agent-identity.ts       # isSharkAgent(), isVanillaAgent()
│   │   ├── gates.ts               # GateManager
│   │   ├── guardian.ts             # File zone protection
│   │   └── evidence.ts            # Evidence collection
│   └── tools/
│       ├── shark-status.ts        # Brain state reporting tool
│       ├── shark-gate.ts         # Gate management tool
│       └── container-test.ts     # Container test runner
├── dist/
│   └── index.js                   # Built bundle (1.0 MB)
└── package.json
```

---

## Key Source Files

### src/hooks/v4.1/session-hook.ts (BRAIN INITIALIZATION)

```typescript
// Current broken version tries multiple sources but still fails
function extractAgentFromEvent(event): string | undefined {
    if (event.agent) return event.agent;
    if (event.properties?.info?.agent) return event.properties.info.agent;
    return undefined;
}

// Problem: Neither source actually has agent in session.created event
```

### src/hooks/v4.1/agent-state.ts (BRAIN STATE)

```typescript
let currentAgentName: string | undefined = undefined;
let agentInitialized = false;

export function setCurrentAgent(agent: string | undefined): void {
    if (agent && !agentInitialized) {
        console.log(`[Agent State] BRAIN INITIALIZED: setCurrentAgent("${agent}")`);
        agentInitialized = true;
    }
    currentAgentName = agent;
}

export function getCurrentAgent(): string | undefined {
    return currentAgentName;
}
```

### src/hooks/v4.1/guardian-hook.ts (ENFORCEMENT)

```typescript
// LINE 107-148: Brain failure block
const currentAgent = getCurrentAgent();
if (!currentAgent) {
    console.error('[Guardian CRITICAL] brain: unknown...');
    
    // HARD BLOCK for dangerous tools
    const dangerousTools = ['terminal', 'mcp_terminal', 'bash', 'write_file', ...];
    if (dangerousTools.includes(tool)) {
        throw new Error(`[BRAIN_FAILURE_BLOCK] Cannot execute dangerous tool "${tool}"...`);
    }
    
    // Allow read-only but log
    return;
}
```

---

## Container Testing - THE PROBLEM

### Attempted Approach (FAILED)

```bash
# Copy local opencode config
cp -a ~/.config/opencode /tmp/opencode-test-$timestamp

# Add plugin to temp config
cp -r /path/to/plugin/dist/* /tmp/.../config/plugins/

# Update opencode.json in temp config
jq '.plugin += ["file:///root/.config/opencode/plugins/..."]' /tmp/.../opencode.json

# Run container
docker run --rm -v /tmp/.../config:/root/.config/opencode ghcr.io/anomalyco/opencode:latest ...
```

### Critical Error: Version Mismatch

```bash
# Local opencode
$ opencode --version
1.4.2

# Container opencode
$ docker run ghcr.io/anomalyco/opencode:latest opencode --version
1.3.17
```

**Container image `latest` is 1.3.17, local is 1.4.2. NOT A CARBON COPY.**

### Command Parsing Issues

```bash
# This shows help text instead of running command
docker run --rm -v ... ghcr.io/anomalyco/opencode:latest opencode run "shark-status"

# Also fails - shows help
opencode --pure --dangerously-skip-permissions run "shark-status"
```

### Docker Container Info

```
IMAGE: ghcr.io/anomalyco/opencode:latest
ID: 1aadad5baee0
VERSION: 1.3.17 (NOT 1.4.2)
```

---

## OpenCode Plugin System

### How Plugins Load

From `@opencode-ai/plugin`:

```typescript
export type Plugin = (input: PluginInput, options?: PluginOptions) => Promise<Hooks>;

export interface Hooks {
    event?: (input: { event: Event }) => Promise<void>;
    "tool.execute.before"?: (input: ToolInput, output: ToolOutput) => Promise<void>;
    "tool.execute.after"?: (input: ToolInput, output: ToolOutput) => Promise<void>;
    "chat.message"?: (input: ChatInput, output: ChatOutput) => Promise<void>;
    // ...
}
```

### Plugin Registration

In `opencode.json`:

```json
{
  "plugin": [
    "file:///path/to/plugin/dist/index.js"
  ]
}
```

### Current Plugin Config

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "file:///tmp/shark-test-v482/plugins/shark-agent/dist/index.js"
  ]
}
```

Points to OLD test build, NOT current v4.8.2.

---

## What We Need to Accomplish

1. **Verify brain initializes** - Run opencode with plugin, check `shark-status` shows `brain: shark` not `brain: unknown`

2. **Container cleanup** - Agents leave containers running, draining hardware

3. **Ship v4.8.2** - Get the guardian enforcement working

---

## Testing Attempts

### Test 1: Container with carbon copy config
```
Status: FAILED - Container is 1.3.17, local is 1.4.2
Error: Version mismatch
```

### Test 2: Host opencode with plugin
```
Command: opencode --pure --dangerously-skip-permissions run "shark-status"
Status: FAILED - Shows help text instead of running
Error: Command parsing issue
```

### Test 3: Docker run --version
```
Command: docker run ghcr.io/anomalyco/opencode:latest opencode --version
Output: 1.3.17
Error: Wrong version
```

---

## Guardian Enforcement Rules

### Dangerous Tools (Blocked when brain unknown)
- terminal, mcp_terminal, bash
- write_file, mcp_write_file
- edit, mcp_patch

### Plan Phase Rules
- READ allowed (read, glob, grep, head, tail, cat, ls, pwd, tree)
- WRITE new files allowed
- EDIT only within grace period (60 min)
- COPY/duplicate blocked

### Persistent Error Blocks
- `BROKEN_BUILD_PATTERNS`: Build without preserving src/dist/package.json
- `WRONG_CONTAINER_PATTERNS`: Static analysis instead of actual runtime
- `CONTAINER_LEAK_BLOCK`: Deployment blocked if containers running

---

## Questions Needing Answers

1. How do we run opencode in non-interactive mode with a message?
2. Why does `opencode run "message"` show help instead of running?
3. How do we test plugin in actual 1.4.2 runtime?
4. Should we build custom 1.4.2 container image?

---

## Related Files

- `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/shark-agent-v483-brain-fix.md`
- `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/container_testing_discovery.md`
- `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/opencode-container-testing-plan.md`

---

## Plugin Build Command

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
bun install
bun run build
# Output: dist/index.js (1.0 MB)
```

## Quick Test Commands

```bash
# Check local version
opencode --version  # 1.4.2

# Check container version  
docker run ghcr.io/anomalyco/opencode:latest opencode --version  # 1.3.17

# Check plugins
ls ~/.config/opencode/plugins/

# Check current opencode.json
cat ~/.config/opencode/opencode.json
```
