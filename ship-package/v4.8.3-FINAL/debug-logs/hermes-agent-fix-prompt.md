# Hermes Agent Fix Task - Agent Isolation Improvements

## Current State
Hermes already has `isHermesAgent()` in all hooks. BUT there are issues:

## Issues Found

### 1. No Prefix Support
Current code:
```typescript
export function isHermesAgent(agentName: string | undefined): boolean {
  if (!agentName) return false;
  return HERMES_AGENTS.has(agentName);  // Only exact matches
}
```

**Problem:** Doesn't handle `hermes_coder`, `hermes_architect`, etc. prefixes.

**Fix:**
```typescript
const HERMES_PREFIX = 'hermes_';

export function isHermesAgent(agentName: string | undefined): boolean {
  if (!agentName) return false;
  if (HERMES_AGENTS.has(agentName)) return true;
  if (agentName.startsWith(HERMES_PREFIX)) return true;
  return false;
}
```

### 2. No CLI Mode Support
Hermes uses `input.agent` directly, but in CLI mode this can be undefined.

**Fix:** Add `agent-state.ts` similar to Shark:
```typescript
// src/hooks/agent-state.ts
let currentAgent: string | undefined = undefined;

export function setCurrentAgent(agent: string | undefined): void {
  currentAgent = agent;
}

export function getCurrentAgent(): string | undefined {
  return currentAgent;
}
```

Then update hooks to use fallback:
```typescript
const agent = input.agent || getCurrentAgent();
if (!isHermesAgent(agent)) return;
```

### 3. Wrong Directory Path
Earlier fix note showed: hardcoded `.Spider/evidence/` instead of `.hermes/`

**Fix:** Change all `.Spider` references to `.hermes`:
- `telemetry.ts` - `.Spider/telemetry.jsonl` → `.hermes/telemetry.jsonl`
- `evidence` paths
- Any other hardcoded paths

### 4. Remove console.* calls
All console.log/error/warn cause UI spillover. Remove or use silent logging.

## Priority Hooks to Fix
1. `src/index.ts` - Main entry, add agent-state initialization
2. `src/hooks/agent-state.ts` - NEW file
3. `src/config/agent-identity.ts` - Add prefix support
4. All hook files - Add getCurrentAgent fallback
5. Any `.Spider` → `.hermes` path fixes
6. Remove console.* calls

## Verification
After fix:
- `isHermesAgent("hermes_coder")` returns true
- CLI mode works without errors
- All writes go to `.hermes/` not `.Spider/`
- No console spillover in UI