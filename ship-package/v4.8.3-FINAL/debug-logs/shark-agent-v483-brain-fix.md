# Shark Agent v4.8.3 Brain Initialization Fix

## Problem

v4.8.1 shipped with `setCurrentAgent()` defined but never called, causing all guardian hooks to exit early at the identity wall check. This was a **critical ship failure** that bypassed all guardian enforcement.

## Root Cause

The session hook checks `if (!isSharkAgent(event.agent))` BEFORE calling `setCurrentAgent()`. If the event doesn't contain agent info in the expected format, the hook returns early and the brain is never initialized.

## What Changed in v4.8.3

### 1. Session Hook (`session-hook.ts`)

**Before:**
```typescript
const event = input.event as { type?: string; sessionId?: string; agent?: string };
if (!isSharkAgent(event.agent)) {
  return;  // Early exit if not shark agent
}
setCurrentAgent(event.agent);  // Only called if isSharkAgent passes
```

**After:**
```typescript
interface SessionEvent {
  type: string;
  agent?: string;  // Try direct agent field
  sessionId?: string;
  properties?: {
    info?: {
      id?: string;
      agent?: string;  // Try nested info.agent field
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Multiple extraction points for agent name
function extractAgentFromEvent(event: SessionEvent): string | undefined {
  if (typeof event.agent === 'string') {
    return event.agent;
  }
  if (event.properties?.info?.agent) {
    return event.properties.info.agent as string;
  }
  return undefined;
}

// Also check SHARK_AGENT environment variable as fallback
```

Added debug logging to trace what's being received.

### 2. Agent State (`agent-state.ts`)

**Before:**
```typescript
let currentAgentName: string | undefined = undefined;

export function setCurrentAgent(agent: string | undefined): void {
  currentAgentName = agent;
}
```

**After:**
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

export function isBrainInitialized(): boolean {
  return agentInitialized;
}
```

### 3. Guardian Hook (`guardian-hook.ts`)

**Before:**
```typescript
// LAYER 1: IDENTITY WALL - Check FIRST
if (!getCurrentAgent()) {
  return;  // Silent exit - dangerous!
}
```

**After:**
```typescript
// LAYER 1: IDENTITY WALL - Check FIRST
const currentAgent = getCurrentAgent();

// MECHANICAL SYSTEM: Brain state verification
if (!currentAgent) {
  console.error('[Guardian CRITICAL] brain: unknown - setCurrentAgent() was never called!');
  
  // HARD BLOCK for dangerous tools
  const dangerousTools = ['terminal', 'mcp_terminal', 'bash', 'write_file', ...];
  if (dangerousTools.includes(tool)) {
    throw new Error(`[BRAIN_FAILURE_BLOCK] Cannot execute dangerous tool "${tool}" when system brain is uninitialized.
      ...
      Current brain state: unknown
      ...
    `);
  }
  
  // Allow read-only tools but log warning
  return;
}
```

## New Guardian Blocks Added

1. **BRAIN_FAILURE_BLOCK**: Hard blocks dangerous tools when brain is unknown (uninitialized)
2. **BRAIN_INIT_LOGGING**: Logs brain initialization state changes

## Mechanical Systems Summary

| System | Purpose |
|--------|---------|
| Multi-source agent extraction | Try multiple event fields + env var |
| Debug logging | Trace session hook execution |
| Brain init flag | Track if setCurrentAgent was ever called |
| Brain failure block | Block dangerous tools when brain unknown |

## Testing Required

1. Session hook receives `session.created` event - brain should be initialized
2. Guardian hook receives first tool call - brain state should be "shark"
3. If brain is unknown - dangerous tools should be blocked with clear error

## Key Learnings

1. **Static pattern checks don't prove runtime behavior** - 20/20 tests passed but brain: unknown at runtime
2. **Silent failures are dangerous** - Guardian returning early without warning was a hidden bug
3. **Multiple agent sources** - OpenCode may pass agent via different event fields

