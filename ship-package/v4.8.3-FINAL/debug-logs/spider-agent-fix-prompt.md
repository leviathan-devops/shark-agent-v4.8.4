# Spider Agent Fix Task - Add Agent Isolation

## Problem
Spider agent hooks fire for ALL agents, not just spider agents. This causes:
- Cross-plugin contamination (spider telemetry/events in shark sessions)
- Hardware bloat from excessive writes
- UI spillover

## Required Fix

### 1. Create Agent Identity Module

Create `src/shared/agent-identity.ts`:
```typescript
const SPIDER_AGENTS = new Set(['spider', 'architect', 'coder', 'reviewer', 'test-engineer', 'sme', 'designer', 'explorer']);
const SPIDER_PREFIX = 'spider_';

export function isSpiderAgent(agentName: string | undefined): boolean {
  if (!agentName) return false;
  if (SPIDER_AGENTS.has(agentName)) return true;
  if (agentName.startsWith(SPIDER_PREFIX)) return true;
  return false;
}

export function isVanillaOrOtherAgent(agentName: string | undefined): boolean {
  return !isSpiderAgent(agentName);
}
```

### 2. Create Agent State Module

Create `src/hooks/agent-state.ts`:
```typescript
let currentAgentName: string | undefined = undefined;

export function setCurrentAgent(agent: string | undefined): void {
  currentAgentName = agent;
}

export function getCurrentAgent(): string | undefined {
  return currentAgentName;
}

export function clearCurrentAgent(): void {
  currentAgentName = undefined;
}
```

### 3. Update All Hooks to Check Agent

In every hook (chat.message, tool.execute.before, event, etc.), ADD at the start:

```typescript
import { isSpiderAgent, isVanillaOrOtherAgent } from '../shared/agent-identity.js';
import { getCurrentAgent, setCurrentAgent } from './agent-state.js';

// At hook start:
if (!isSpiderAgent(input.agent) && !isSpiderAgent(getCurrentAgent())) {
  return; // Only process spider sessions
}
```

### 4. Remove console.log/error/warn

All console.* calls cause UI spillover. Either remove them or use silent logging.

### 5. Use .swarm instead of .Spider for telemetry

Spider should write to `.swarm/` (its own directory), not `.Spider/` (shared workspace root).

## Key Hooks to Update (priority order):
1. `chat.message` - Main entry point
2. `tool.execute.before/after` - Tool tracking  
3. `event` - Session events
4. `experimental.chat.messages.transform` - Message transform
5. All telemetry/heartbeat functions

## Verification
After fix:
- Spider should only write to `.swarm/` directory
- Shark/Manta sessions should not trigger spider hooks
- No console logs in UI from spider