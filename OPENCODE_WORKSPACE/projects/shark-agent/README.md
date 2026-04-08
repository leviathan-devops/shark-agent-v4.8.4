# Shark Agent v4.7

**Version:** 4.7  
**Status:** Production Ready  
**Architecture:** Triple-brain coordination via PeerDispatch with mechanical Guardian enforcement

---

## Overview

Shark Agent is an OpenCode plugin that provides an Execution Brain with triple-brain coordination. It enforces mandatory container test validation before any delivery can proceed.

## Architecture

### Core Components

```
src/
├── index.ts                 # Plugin entry point, exports hooks and tools
├── hooks/v4.1/
│   ├── index.ts             # Hook factory (creates all hooks)
│   ├── agent-state.ts      # Session-scoped agent tracking
│   ├── session-hook.ts     # Session lifecycle (ONLY shark agents)
│   ├── gate-hook.ts        # Tool execution aftermath + gate advancement
│   ├── guardian-hook.ts    # tool.execute.before protection
│   ├── system-transform-hook.ts  # Context injection + delivery gate warnings
│   ├── compacting-hook.ts  # Session compaction handling
│   └── utils.ts            # Command/path extraction utilities
├── shared/
│   ├── agent-identity.ts   # isSharkAgent(), isVanillaAgent()
│   ├── gates.ts            # GateManager (PLAN→BUILD→TEST→VERIFY→AUDIT→DELIVERY)
│   ├── evidence.ts         # EvidenceCollector
│   ├── state-store.ts      # StateStore
│   ├── messenger.ts        # BrainMessenger (handoff messaging)
│   └── guardian.ts        # Guardian (zone-based protection + source file blocking)
├── shark/macro/
│   ├── brains.ts           # EXECUTION_BRAIN_T1, REASONING_BRAIN_T1, SYSTEM_BRAIN_T1
│   └── peer-dispatch.ts    # SharkPeerDispatch (triple-brain coordination)
└── tools/
    ├── shark-status.ts     # Status tool
    ├── shark-gate.ts       # Gate tool
    ├── shark-evidence.ts   # Evidence tool
    ├── shark-test-runner.ts # Container test runner (MANDATORY for delivery)
    └── checkpoint.ts       # Checkpoint tool
```

### Gate Chain

```
PLAN → BUILD → TEST → VERIFY → AUDIT → DELIVERY
```

- **PLAN**: Requirements defined, SPEC.md generated
- **BUILD**: Files created per spec
- **TEST**: Tests pass, coverage ≥ 80%
- **VERIFY**: SPEC alignment, integration tests, edge cases
- **AUDIT**: SAST clean, no secrets, dependencies audited
- **DELIVERY**: Container tests passed (MECHANICALLY ENFORCED)

## Guardian System (v4.7)

### Features

1. **Source File Edit Protection**
   - Source files cannot be edited directly
   - Must duplicate first: `cp file.ts file.ts.v1.0.0`
   - Then edit the copy

2. **60-Minute Grace Period**
   - Files created < 60 minutes ago can be edited freely
   - Determined from file `mtime` (modification time)

3. **Dangerous Command Blocking**
   - `rm -rf /`, `dd if=`, `mkfs`, fork bombs
   - Terminal in-place modifications (`sed -i`, `echo >`, etc.)

### Agent Identity Filtering

**CRITICAL:** Guardian ONLY activates for shark agents. Vanilla agents (build, plan, general, explore) are completely bypassed.

```typescript
// session-hook.ts - Sets agent state ONLY for shark agents
if (isSharkAgent(event.agent)) {
  setCurrentAgent(event.agent);  // Guardian reads this
}

// guardian-hook.ts - Returns early if not shark
if (!getCurrentAgent()) {
  return;  // Vanilla agents completely bypassed
}
```

## Mechanical Container Test Enforcement

### The Problem
Agents could skip running tests and proceed directly to delivery.

### The Solution
1. **Delivery gate is BLOCKED** until `ContainerTestResult.json` exists in `.shark/evidence/delivery/`
2. Agent MUST run `shark-test-runner action=run`
3. Results are written to evidence file with `overallPassed: true/false`
4. Gate advancement requires passing test evidence
5. System prompt warning injected when agent reaches delivery: "You CANNOT ship without passing tests"

### Delivery Gate Hard Block

```typescript
// gate-hook.ts
if (currentGate === 'delivery') {
  const deliveryBlocked = checkDeliveryGateBlocked();
  if (deliveryBlocked) {
    // Blocks git commit, ship, release, deploy commands
    throw new Error(`[SHARK DELIVERY BLOCKED] You MUST run 'shark-test-runner'...`);
  }
}
```

## Agent Identity

Shark distinguishes itself from vanilla agents and other plugins:

- `isSharkAgent('shark')` → true
- `isSharkAgent('shark_coder')` → true (prefix matching)
- `isSharkAgent('build')` → false (vanilla)
- `isSharkAgent('manta')` → false (other plugin)

## Installation

### Plugin Path
```
file:///tmp/oc-test-ws/shark-agent-dist
```

### OpenCode Config
```json
{
  "plugin": [
    "...",
    "file:///tmp/oc-test-ws/shark-agent-dist",
    "..."
  ],
  "agent": {
    "shark": {
      "color": "#228B22"
    }
  }
}
```

## Container Test Suite

Location: `tests/container/test-suite.sh`

Run tests:
```bash
cd projects/shark-agent
bash tests/container/test-suite.sh
```

Tests (all must pass):
1. `guardian_grace_period` - 60 minute grace period verified
2. `isSharkAgent_filtering` - Identity function works correctly
3. `agent_identity_no_spillover` - Guardian only fires for shark agents
4. `build_integrity` - Build contains all Guardian features
5. `guardian_blocks_source_edit` - Source file protection works
6. `guardian_blocks_dangerous` - Dangerous command detection works

## Build

```bash
cd projects/shark-agent
npm run build
```

Output: `dist/index.js` (~1.0 MB)

## Git Repository

- **URL:** https://github.com/leviathan-devops/shark-agent-v4
- **Version:** v4.7
- **Status:** Production Ready
- **Protected:** Yes (branch protection enabled)

## Debugging

### Check Guardian State
```bash
cat .shark/evidence/delivery/ContainerTestResult.json
```

### Check Gate Status
```bash
# Use shark-status tool
shark-status gate=verify
```

### Check Session Agent State
Guardian uses session-hook to track current agent. If session-hook didn't fire for shark, guardian won't activate.

## Known Limitations

1. **tool.execute.before doesn't receive `agent`** - Guardian uses shared agent-state set by session-hook
2. **Hooks are advisory for non-blocking actions** - Guardian throws errors but agent could theoretically catch them
3. **Grace period based on mtime** - Files touched before 60min ago still blocked

## Changelog

### v4.7 (Current)
- Guardian now uses session-scoped agent state via `agent-state.ts`
- Fixed vanilla agent spillover issue
- Mechanical container test enforcement for delivery gate
- 60-minute grace period for newly created files

### v4.6
- Initial working version with triple-brain coordination
- Basic Guardian protection
