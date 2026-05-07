# SHARK AGENT v4.8.4 — BUILD WORKFLOW ANCHOR

**Purpose:** Self-contained build plan for adding dynamic intelligent algorithmic firewalls to Shark Agent v4.7.  
**Input:** Firewall-Edition-v2.0 boilerplate + shark-agent-v4.8.3-REPO  
**Output:** shark-agent-v4.8.4-REPO — all v4.7 code preserved, firewall added  
**Architecture rule:** ADD ONLY. Nothing removed from v4.7. No signature changes. No deleted hooks.

---

## 1. WHAT SHARK AGENT IS

A **multi-brain single agent** — linear A-to-Z step-by-step execution engine. Mechanical bulldozer that powers through problems from first principles using built-in gate chain + evidence system. NOT a parallel swarm.

```
SHARK AGENT v4.8.4
  │
  ├── SINGLE AGENT: shark (primary), Forest Green #228B22
  │
  ├── GATE CHAIN (linear, mechanical):
  │     plan → build → test → verify → audit → delivery
  │     Each gate requires evidence. Delivery blocked without ContainerTestResult.json.
  │
  ├── TOOLS: shark-status, shark-gate, shark-evidence, shark-test-runner, checkpoint
  │         firewall-status, firewall-audit  ← NEW in v4.8.4
  │
  ├── HOOKS (all preserved from v4.7, firewall added to guardian):
  │     chat.message             — brain init
  │     command.execute.before   — command interception (preserved)
  │     messages.transform       — message transform (preserved)
  │     tool.execute.before      — guardian + FIREWALL ENGINE (extended)
  │     tool.execute.after       — gate + summarizer
  │     session.compacting       — dynamic BUILD_CONTEXT
  │     chat.system.transform    — IRONCLAD + gate context
  │     event (session.created)  — session lifecycle
  │
  └── V4.7 CODE: 100% preserved. Firewall is a layer ADDED inside guardian-hook.
```

---

## 2. ARCHITECTURE: Where the firewall lives

The firewall engine is added INSIDE the existing `guardian-hook.ts`. Every v4.7 line of code stays. The firewall runs as an additional check after the existing L0-L4 checks:

```
tool.execute.before fires
  │
  ├── Identity check (v4.7 code, unchanged)
  │     if (!isShark) return;
  │
  ├── Cross-agent tool check (v4.7 code, unchanged)
  │     CROSS_AGENT_TOOLS.has(tool) → throw
  │
  ├── Dangerous command check (v4.7 code, unchanged)
  │     guardian.isDangerousCommand(command) → throw
  │
  ├── Zone-based write protection (v4.7 code, unchanged)
  │     guardian.canWrite(path) / guardian.canEdit(path)
  │
  ├── L0-L4 command patterns (v4.7 code, unchanged)
  │     checkTheatricalVerification → L1
  │     checkFakeTestRunner → L2
  │     checkSourceInspection → L3
  │     checkWrongContainer → L4
  │
  └── FIREWALL LAYER ENGINE ← NEW v4.8.4 (added at end)
        IntentClassifier.classifyIntent()
        buildContext()
        LayerEngine.evaluate() → L5.1 through L5.10 + L8 behavioral
        throw StructuredBlockError OR allow
```

---

## 3. FILE MANIFEST — what gets added, what stays

```
shark-agent-v4.8.4-REPO/
│
├── src/
│   │
│   ├── index.ts                         ← MODIFIED: ADD firewall tools (lines 5, preserve)
│   │
│   ├── shared/
│   │   ├── state-store.ts               ← MODIFIED: ADD firewall state domain
│   │   ├── agent-identity.ts            ← PRESERVED (zero changes)
│   │   ├── guardian.ts                  ← PRESERVED (zero changes)
│   │   ├── gates.ts                     ← PRESERVED (zero changes)
│   │   ├── evidence.ts                  ← PRESERVED (zero changes)
│   │   ├── messenger.ts                 ← PRESERVED (zero changes)
│   │   └── firewall-patterns.ts         ← PRESERVED (zero changes)
│   │
│   ├── hooks/
│   │   ├── v4.1/                        ← PRESERVED (entire directory, zero changes)
│   │   │   ├── index.ts                 ← MODIFIED: ADD firewall instantiation
│   │   │   ├── guardian-hook.ts         ← MODIFIED: ADD firewall layer engine call
│   │   │   ├── chat-message-hook.ts     ← PRESERVED
│   │   │   ├── command-execute-hook.ts  ← PRESERVED
│   │   │   ├── messages-transform-hook.ts ← PRESERVED
│   │   │   ├── gate-hook.ts             ← PRESERVED
│   │   │   ├── session-hook.ts          ← PRESERVED
│   │   │   ├── compacting-hook.ts       ← PRESERVED
│   │   │   ├── system-transform-hook.ts ← PRESERVED
│   │   │   ├── tool-summarizer-hook.ts  ← PRESERVED
│   │   │   ├── agent-state.ts           ← PRESERVED
│   │   │   └── utils.ts                 ← PRESERVED
│   │   │
│   │   └── firewall/                    ← NEW (from boilerplate)
│   │       ├── types.ts                 ← all types
│   │       ├── intent-classifier.ts     ← classifyIntent()
│   │       ├── firewall-context.ts      ← buildContext()
│   │       ├── layer-engine.ts          ← LayerEngine.evaluate()
│   │       ├── block-response.ts        ← StructuredBlockError
│   │       ├── evidence-gate.ts         ← EvidenceGate
│   │       ├── firewall-audit.ts        ← FirewallAudit
│   │       └── index.ts                 ← barrel export
│   │
│   │       └── layers/                  ← NEW (from boilerplate)
│   │           ├── index.ts             ← DEFAULT_LAYERS
│   │           ├── l0-identity.ts
│   │           ├── l1-theatrical.ts
│   │           ├── l2-test-bypass.ts
│   │           ├── l3-inspection.ts
│   │           ├── l4-container.ts
│   │           ├── l5.1-host-fallback.ts  ← FIXED broader patterns
│   │           ├── l5.2-success-claim.ts
│   │           ├── l5.3-model-restriction.ts
│   │           ├── l5.4-mock-stub.ts
│   │           ├── l5.5-simplification.ts
│   │           ├── l5.6-confusion.ts
│   │           ├── l5.7-scope-creep.ts
│   │           ├── l5.8-undermining.ts
│   │           ├── l5.9-impatience.ts
│   │           └── l5.10-self-reference.ts
│   │
│   ├── tools/
│   │   ├── shark-status.ts              ← PRESERVED
│   │   ├── shark-gate.ts                ← PRESERVED
│   │   ├── shark-evidence.ts            ← PRESERVED
│   │   ├── checkpoint.ts                ← PRESERVED
│   │   ├── shark-test-runner.ts         ← PRESERVED
│   │   ├── shark-test-runner-container.ts ← PRESERVED
│   │   ├── firewall-status.ts           ← NEW (from boilerplate)
│   │   └── firewall-audit-tool.ts       ← NEW (from boilerplate)
│   │
│   └── shark/macro/
│       ├── brains.ts                    ← PRESERVED
│       └── peer-dispatch.ts             ← PRESERVED
│
├── package.json                         ← bump version to 4.8.4
└── tsconfig.json                        ← PRESERVED
```

---

## 4. COMPLETE CODE: Modified Files

### 4.1 `src/hooks/v4.1/guardian-hook.ts` — Full file with firewall additions

This is the COMPLETE file. All v4.7 code is present (lines 1-197 from the original). The firewall additions are at the end (marked `v4.8.4`). Lazy-initialized singletons avoid creating objects on every hook invocation.

```typescript
/**
 * Guardian Hook — tool.execute.before integration
 * 
 * V4.8.3 CP4.3: L5 anti-derailment text checks REMOVED from tool.execute.before.
 * V4.8.4: Dynamic intelligent algorithmic firewall ENGINE ADDED (L5.1-L5.10).
 * 
 * Guardian blocks:
 * L0: Identity Wall — blocks dangerous tools when brain not initialized
 * L1: Theatrical Verification — blocks counting theater (grep | wc)
 * L2: Fake Test Runner — blocks test frameworks bypassing OpenCode hooks
 * L3: Source Inspection — blocks "file exists ≠ works" logic
 * L4: Wrong Container — blocks hallucinated opencode container commands
 * L5.7 (mechanical): Cross-agent tool blocking via Set membership
 * L6: Zone-based file protection
 * L5.1-L5.10: FIREWALL ENGINE — intent-classified derailment detection (v4.8.4)
 */

import type { Hooks } from '@opencode-ai/plugin';
import { Guardian } from '../../shared/guardian.js';
import { extractCommandFromArgs } from './utils.js';
import { getCurrentAgent, setCurrentAgent } from './agent-state.js';
import { CROSS_AGENT_TOOLS } from '../../shared/firewall-patterns.js';

// ── v4.8.4 Firewall imports ──
import * as path from 'node:path';
import { IntentClassifier } from '../firewall/intent-classifier.js';
import { buildContext } from '../firewall/firewall-context.js';
import { LayerEngine } from '../firewall/layer-engine.js';
import { EvidenceGate } from '../firewall/evidence-gate.js';
import { FirewallAudit } from '../firewall/firewall-audit.js';
import { createBlockResponse } from '../firewall/block-response.js';
import { DEFAULT_LAYERS } from '../firewall/layers/index.js';

// ── v4.7 pattern arrays (UNCHANGED) ──
const DANGEROUS_TOOLS = new Set([
  'terminal', 'mcp_terminal', 'bash', 'mcp_bash',
  'write_file', 'mcp_write_file',
  'patch', 'mcp_patch',
  'edit', 'mcp_edit',
  'delete_file', 'mcp_delete_file'
]);

const THEATRICAL_PATTERNS = [
  /\|.*wc\s+-l/i, /wc\s+-l.*\|/i, /cat.*\|.*wc/i, /grep.*\|.*wc/i,
  /\|.*tee/i, /\|.*>.*\./i,
  /wc\s+-l.*dist\//i, /wc\s+-l.*src\//i, /wc\s+-l.*build\//i,
  /grep.*setCurrentAgent.*src/i, /grep.*isSharkAgent.*src/i, /grep.*guardian.*src/i,
];

const LEGITIMATE_PATTERNS = [
  /mkdir\s+-p/i, /cp\s+-r/i, /mv\s+/i, /cat\s+[^\|>]+$/i,
  /head\s+-[0-9]+\s+/i, /tail\s+-[0-9]+\s+/i, /grep\s+-[rEn]+.*[^\|]$/i,
  /find\s+.*-name/i, /test\s+-d/i, /test\s+-x/i,
];

const FAKE_TEST_PATTERNS = [
  /node\s+run-tests?\.js/i, /node\s+verify.*\.mjs/i,
  /npm\s+(run\s+)?test/i, /yarn\s+(run\s+)?test/i,
  /jest/i, /vitest/i, /mocha/i, /jasmine/i,
  /bun\s+test/i, /pytest/i, /python.*-m.*pytest/i,
  /go\s+test/i, /cargo\s+test/i, /ruby\s+-Itest/i, /rspec/i,
];

const SOURCE_INSPECTION_PATTERNS = [
  /test\s+-[fed]\s+/i, /if\s+\[\s*-[fes]\s+.*\]\s*;/i,
  /stat\s+/i, /find\s+.*src/i, /ls\s+-l.*(dist|src|build)\//i,
];

const WRONG_CONTAINER_PATTERNS = [
  /opencode\s+container\s+run/i, /opencode\s+container\s+start/i,
  /opencode\s+container\s+exec/i, /opencode\s+run\s+/i,
];

// ── v4.7 check functions (UNCHANGED) ──
function checkTheatricalVerification(command: string | null): void {
  if (!command) return;
  for (const pattern of LEGITIMATE_PATTERNS) {
    if (pattern.test(command)) return;
  }
  for (const pattern of THEATRICAL_PATTERNS) {
    if (pattern.test(command)) {
      throw new Error(`[L1 BLOCKED] Counting theater: ${command}`);
    }
  }
}
function checkFakeTestRunner(command: string | null): void {
  if (!command) return;
  for (const pattern of FAKE_TEST_PATTERNS) {
    if (pattern.test(command)) {
      throw new Error(`[L2 BLOCKED] Fake test runner: ${command}`);
    }
  }
}
function checkSourceInspection(command: string | null): void {
  if (!command) return;
  for (const pattern of SOURCE_INSPECTION_PATTERNS) {
    if (pattern.test(command)) {
      throw new Error(`[L3 BLOCKED] Source inspection: ${command}`);
    }
  }
}
function checkWrongContainer(command: string | null): void {
  if (!command) return;
  for (const pattern of WRONG_CONTAINER_PATTERNS) {
    if (pattern.test(command)) {
      throw new Error(`[L4 BLOCKED] Wrong container: ${command}`);
    }
  }
}
function checkCrossAgentTools(tool: string): void {
  if (CROSS_AGENT_TOOLS.has(tool)) {
    throw new Error(`[L5.7 BLOCKED] Cross-agent tool: ${tool}`);
  }
}

// ── v4.8.4 Firewall singletons (lazy-initialized, shared across invocations) ──
let _classifier: IntentClassifier | null = null;
let _layerEngine: LayerEngine | null = null;
let _auditLogger: FirewallAudit | null = null;

function getClassifier(): IntentClassifier {
  if (!_classifier) _classifier = new IntentClassifier();
  return _classifier;
}
function getLayerEngine(): LayerEngine {
  if (!_layerEngine) _layerEngine = new LayerEngine(new EvidenceGate(process.cwd()));
  return _layerEngine;
}
function getAuditLogger(): FirewallAudit {
  if (!_auditLogger) _auditLogger = new FirewallAudit(process.cwd());
  return _auditLogger;
}

// ── MAIN HOOK (v4.7 unchanged, v4.8.4 firewall added at end) ──
export function createGuardianHook(guardian: Guardian): Hooks['tool.execute.before'] {
  return async (input, output) => {
    const { tool, sessionID } = input as { tool: string; sessionID?: string; callID?: string };
    const args = (output as any)?.args as Record<string, unknown> | undefined;
    const command = extractCommandFromArgs(args);

    // v4.7: Agent identity resolution (UNCHANGED)
    const sessionAgent = getCurrentAgent(sessionID);
    const toolBasedAgent = (tool?.startsWith('shark-') || tool === 'checkpoint') ? 'shark' : undefined;
    const currentAgent = sessionAgent || toolBasedAgent;
    const isShark = currentAgent === 'shark' || currentAgent?.startsWith('shark_');

    if (toolBasedAgent && !sessionAgent) {
      setCurrentAgent(toolBasedAgent, sessionID);
    }

    // v4.7: Shark-only gate (UNCHANGED)
    if (!isShark) return;

    // v4.7: Cross-agent tool blocking (UNCHANGED)
    checkCrossAgentTools(tool);

    // v4.7: Dangerous command blocking (UNCHANGED)
    if (command && guardian.isDangerousCommand(command)) {
      throw new Error(`[GUARDIAN] DANGEROUS_COMMAND_BLOCKED: ${command}`);
    }

    // v4.7: Zone-based write protection (UNCHANGED)
    if ((tool.includes('write_file') || tool.includes('patch')) && args) {
      const a = args as Record<string, unknown>;
      const writePath = (a.path as string) || null;
      if (writePath && !guardian.canWrite(writePath)) {
        throw new Error(`[GUARDIAN] ZONE_VIOLATION: ${guardian.classifyZone(writePath)} zone — ${writePath}`);
      }
      if (writePath) guardian.registerCreate(writePath);
    }

    // v4.7: L0-L4 command pattern checks (UNCHANGED)
    if (DANGEROUS_TOOLS.has(tool)) {
      if (command) {
        checkTheatricalVerification(command);
        checkFakeTestRunner(command);
      }
      if (currentAgent && currentAgent !== 'shark' && !currentAgent.startsWith('shark_')) {
        throw new Error(`[L0 BLOCKED] Brain uninitialized for: ${tool}`);
      }
    }
    checkSourceInspection(command);
    checkWrongContainer(command);

    // v4.7: Source file edit protection (UNCHANGED)
    if ((tool === 'edit' || tool === 'mcp_edit') && args) {
      const ea = args as { filePath?: string };
      if (ea?.filePath) {
        if (!guardian.canEdit(ea.filePath)) throw new Error(`[GUARDIAN] Edit blocked: ${ea.filePath}`);
        guardian.registerEdit(ea.filePath);
      }
    }
    // v4.7: Source file modify check (UNCHANGED)
    if (command) {
      const mc = guardian.canModifyFile(command);
      if (!mc.allowed) throw new Error(`[GUARDIAN] SOURCE_FILE_MODIFY_BLOCKED: ${mc.filePath}`);
    }

    // ════════════════════════════════════════════════════════════
    // v4.8.4 FIREWALL LAYER ENGINE (ADDED — ALL v4.7 CODE ABOVE PRESERVED)
    // ════════════════════════════════════════════════════════════
    if (command || (args && Object.keys(args).length > 0)) {
      try {
        const classifier = getClassifier();
        const layerEngine = getLayerEngine();
        const auditLogger = getAuditLogger();

        const fwCtx = buildContext(
          { tool, args: args || {} },
          { args: args || {} },
          classifier,
          {
            brainInitialized: !!currentAgent,
            evidencePath: path.join(process.cwd(), '.shark', 'evidence'),
            currentGate: null,
          },
          sessionID || '',
          currentAgent || 'shark',
        );

        const blockResult = layerEngine.evaluate(fwCtx, DEFAULT_LAYERS);
        if (blockResult) {
          auditLogger.log({
            timestamp: new Date().toISOString(),
            agent: currentAgent || 'shark',
            tool,
            operationType: fwCtx.operationType,
            layer: blockResult.layer,
            reason: blockResult.reason,
            command: command || null,
            correction: blockResult.correction,
            sessionId: sessionID || '',
          });
          throw createBlockResponse(blockResult);
        }
      } catch (e) {
        if (e instanceof Error && e.name === 'StructuredBlockError') throw e;
        // Silently absorb firewall engine errors — never break the hook
      }
    }
  };
}
```

### 4.2 `src/index.ts` — ADD firewall tools

Add imports after line 20 (after `createSharkTestRunnerTool`):
```typescript
import { createFirewallStatusTool } from './tools/firewall-status.js';
import { createFirewallAuditTool } from './tools/firewall-audit-tool.js';
```

Add tool creation after line 49 (after `testRunnerTool`):
```typescript
const fwStatusTool = createFirewallStatusTool();
const fwAuditTool = createFirewallAuditTool();
```

Add to tool registry at line 57-63:
```typescript
'firewall-status': fwStatusTool,
'firewall-audit': fwAuditTool,
```

Add to agent config tools at line 76-82:
```typescript
'firewall-status': true,
'firewall-audit': true,
```

### 4.3 `src/shared/state-store.ts` — ADD firewall state domain (optional)

If the firewall needs session-scoped state tracking beyond what `agent-state.ts` provides, ADD at end of file:

```typescript
// v4.8.4: Firewall state domain
export interface FirewallSessionState {
  brainInitialized: boolean;
  currentAgent: string | null;
}

export class FirewallStateStore {
  private _states: Map<string, FirewallSessionState> = new Map();

  getState(sessionID: string): FirewallSessionState {
    if (!this._states.has(sessionID)) {
      this._states.set(sessionID, { brainInitialized: false, currentAgent: null });
    }
    return this._states.get(sessionID)!;
  }
}
```

This is OPTIONAL — the existing `agent-state.ts` (getCurrentAgent/setCurrentAgent) already handles agent tracking per session. The firewall can use it directly. Add this only if the firewall needs to store additional state beyond agent identity.

### 4.2 `src/hooks/v4.1/index.ts` — No changes needed

The existing hook factory already instantiates `createGuardianHook(guardian)` at line 34. Since guardian-hook.ts now internally references the firewall, the index doesn't need to change. All hook registrations remain identical.

### 4.3 `src/shared/state-store.ts` — ADD firewall state (optional)

If the firewall needs to share state across hook invocations, ADD at the end of the file:

```typescript
// v4.8.4: Firewall state domain
export interface FirewallSessionState {
  brainInitialized: boolean;
  currentAgent: string | null;
}

// Add to StateStore class:
private _firewallStates: Map<string, FirewallSessionState> = new Map();

getFirewallState(sessionID: string): FirewallSessionState {
  if (!this._firewallStates.has(sessionID)) {
    this._firewallStates.set(sessionID, { brainInitialized: false, currentAgent: null });
  }
  return this._firewallStates.get(sessionID)!;
}
```

The existing `agent-state.ts` (getCurrentAgent/setCurrentAgent) already handles agent tracking. This addition is for firewall-specific state if needed. May be optional — the firewall can use the existing agent-state.ts directly.

### 4.4 `src/index.ts` — ADD firewall tools

At line 45 (after existing tool creation), ADD:
```typescript
import { createFirewallStatusTool } from './tools/firewall-status.js';
import { createFirewallAuditTool } from './tools/firewall-audit-tool.js';

// ... after line 49:
const fwStatusTool = createFirewallStatusTool();
const fwAuditTool = createFirewallAuditTool();
```

At line 57-63 (tool registry), ADD:
```typescript
'firewall-status': fwStatusTool,
'firewall-audit': fwAuditTool,
```

At line 76-82 (agent config tools), ADD:
```typescript
'firewall-status': true,
'firewall-audit': true,
```

---

## 5. HOW THE INTEGRATED FIREWALL WORKS

### 5.1 Two-layer architecture — v4.7 patterns + v4.8.4 engine

The v4.7 L0-L4 patterns (static regex on raw command strings) run FIRST, exactly as they always have. The new v4.8.4 firewall engine runs SECOND, adding intent-classified L5.1-L5.10 checks. Both layers coexist — neither replaces the other.

```
tool.execute.before fires
  │
  ├── v4.7 L0-L4 (runs first, unchanged):
  │     Blanket regex on command string. Coarse but proven.
  │     Blocks: /jest/i anywhere in command → "cat jest.config.js" blocked (false positive)
  │
  └── v4.8.4 L5.1-L5.10 (runs second, added):
        Intent classification THEN pattern match. Precision.
        classifyIntent("cat jest.config.js") → READ → L2 not checked → ALLOWED
        classifyIntent("npm test") → TEST → L2 checked → BLOCKED
```

### 5.2 Intent classification — the differentiator

The intent classifier categorizes every tool call into one of 9 operation types BEFORE pattern matching runs. Each layer only checks patterns when the operation type matches its `applicableTo` filter.

```
Operation types and what triggers them:

READ       — grep, find, ls, cat, head, tail (no pipe, no write)
              L1-L4 patterns do NOT fire on READ intent
              → "grep setCurrentAgent src/" → NOT blocked (was blocked in v4.7 L1)
              → "find src -name '*.ts'" → NOT blocked (was blocked in v4.7 L3)

WRITE      — write_file, patch, edit
              L6 zone checks fire on WRITE intent

EXECUTE    — npm run, node, python, binary invocation
              L2 fake test check fires on EXECUTE if test framework detected

TEST       — npm test, jest, vitest, pytest, cargo test, go test
              L2 fires on TEST intent only

INSPECT    — Pipe chains to wc/tee, redirect to file, stat with claims
              L1 theatrical, L3 inspection fire on INSPECT intent
              → "grep ... | wc -l" → INSPECT → L1 BLOCKED

CONTAINER  — opencode run, docker run with opencode command, container commands
              L4 fires on CONTAINER intent only
              → "docker run -v opencode:/x alpine ls" → NOT blocked (mount, not command)

BUILD      — npm build, cargo build, make, cmake, go build
              No layers currently fire on BUILD (reserved for future)

CROSS_AGENT — hermes_*, hive_*, mem* tools
              L5.7 fires on CROSS_AGENT via Set.has() — O(1) lookup

SYSTEM     — rm -rf /, dd if=, mkfs, fork bomb
              L0 identity wall fires on SYSTEM intent
```

### 5.3 Evidence gating — when proof overrides blocking

Three layers are evidence-gated: L5.2 (success claims), L5.4 (mock/stub), L5.10 (self-reference). They check for `ContainerTestResult.json` at `.shark/evidence/delivery/` with `overallPassed: true` AND `passRate >= 0.96`.

If evidence exists and meets the threshold → block is SKIPPED. The agent has proven its capabilities mechanically, so trust-based derailment language is no longer considered derailment — it's backed by evidence.

If evidence does NOT exist or fails the threshold → BLOCKED. The agent is making claims without mechanical proof.

### 5.4 Container TUI test results (from checkpoint-2 verification)

All 15 firewall layers verified in container TUI. 8 audit entries from a single session:

```json
{"layer":"L5.1","tool":"shark-gate","reason":"\"skip container\" in gate notes — container test is mandatory"}
{"layer":"L1","tool":"bash","reason":"ls piped to wc -l — theatrical file listing count"}
{"layer":"L5.9","tool":"shark-gate","reason":"\"good enough\" — \"good enough\" is not sufficient"}
{"layer":"L5.2","tool":"shark-gate","reason":"\"trust me it works\" — trust is not evidence"}
{"layer":"L5.6","tool":"shark-gate","reason":"\"somewhat works\" — binary: it works or it does not"}
{"layer":"L5.8","tool":"shark-gate","reason":"\"not worth the effort\" — quality gates are always worth the effort"}
{"layer":"L5.5","tool":"shark-gate","reason":"\"oversimplified/oversimplification\" — address the full complexity"}
{"layer":"L5.7","tool":"shark-gate","reason":"\"while (we're) at it\" — stay on task"}
```

All v4.7 L1-L4 patterns also verified working in the same session (npm test → blocked, opencode run → blocked).

---

## 6. FILE CREATION COMMANDS (exact copy + import fix)

```bash
BOILER=/home/leviathan/OPENCODE_WORKSPACE/agent_plugin_boilerplates/Firewall-Edition-v2.0/src
REPO=/home/leviathan/OPENCODE_WORKSPACE/shark-agent-v4.8.4-REPO/src
FW=$REPO/hooks/firewall

mkdir -p $FW/layers

# Core engine — 8 files
cp $BOILER/core/types.ts              $FW/types.ts
cp $BOILER/core/intent-classifier.ts   $FW/intent-classifier.ts
cp $BOILER/core/firewall-context.ts    $FW/firewall-context.ts
cp $BOILER/core/layer-engine.ts       $FW/layer-engine.ts
cp $BOILER/core/block-response.ts     $FW/block-response.ts
cp $BOILER/core/evidence-gate.ts      $FW/evidence-gate.ts
cp $BOILER/core/firewall-audit.ts     $FW/firewall-audit.ts
cp $BOILER/core/index.ts              $FW/index.ts

# Layer definitions — 16 files (L5.1 already fixed)
cp $BOILER/layers/*.ts                $FW/layers/

# Fix layer import paths: '../core/' → '../'
for f in $FW/layers/*.ts; do
  sed -i "s|'../core/types.js'|'../types.js'|g" "$f"
done

# Firewall tools
cp $BOILER/tools/firewall-status.ts     $REPO/tools/firewall-status.ts
cp $BOILER/tools/firewall-audit-tool.ts $REPO/tools/firewall-audit-tool.ts

# Copy entire v4.1 hooks directory to v4.8.4-REPO
cp -r /home/leviathan/OPENCODE_WORKSPACE/shark-agent-v4.8.3-REPO/src/hooks/v4.1/ $REPO/hooks/v4.1/
cp -r /home/leviathan/OPENCODE_WORKSPACE/shark-agent-v4.8.3-REPO/src/shared/ $REPO/shared/
cp -r /home/leviathan/OPENCODE_WORKSPACE/shark-agent-v4.8.3-REPO/src/tools/ $REPO/tools/
cp -r /home/leviathan/OPENCODE_WORKSPACE/shark-agent-v4.8.3-REPO/src/shark/ $REPO/shark/
cp /home/leviathan/OPENCODE_WORKSPACE/shark-agent-v4.8.3-REPO/src/index.ts $REPO/index.ts
cp /home/leviathan/OPENCODE_WORKSPACE/shark-agent-v4.8.3-REPO/package.json $REPO/package.json
cp /home/leviathan/OPENCODE_WORKSPACE/shark-agent-v4.8.3-REPO/tsconfig.json $REPO/tsconfig.json
```

After copying, apply the modifications in Section 4 to:
1. `$REPO/hooks/v4.1/guardian-hook.ts` — add firewall imports + lazy init + layer engine call
2. `$REPO/shared/state-store.ts` — add firewall state domain (optional)
3. `$REPO/index.ts` — add firewall tool imports + registry entries

---

## 7. BUILD + VERIFY

```bash
cd shark-agent-v4.8.4-REPO
npm run build

# Verify build:
# - Check for zero errors
# - Check dist/index.js exists
# - Check dist size is larger (firewall code added)

# Container TUI test:
TEST_DIR=/tmp/shark-v484-final-$(date +%s)
mkdir -p $TEST_DIR/config/plugins/shark-v4.8.4/dist
cp dist/index.js $TEST_DIR/config/plugins/shark-v4.8.4/dist/
cat > $TEST_DIR/config/opencode.json << 'EOF'
{"$schema":"https://opencode.ai/config.json","provider":{"deepseek":{}},"plugin":["file:///root/.config/opencode/plugins/shark-v4.8.4/dist/index.js"]}
EOF

CID=$(docker run -d --rm --name shark-v484 --entrypoint /bin/bash \
  -v "$TEST_DIR/config:/root/.config/opencode" \
  -e DEEPSEEK_API_KEY \
  opencode-test:1.4.3 -c "sleep 3600")

tmux new-session -d -s shark-test \
  "docker exec -it $CID timeout 1800 /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode --agent shark 2>&1; sleep 3600"
sleep 8
tmux send-keys -t shark-test Escape; tmux send-keys -t shark-test Escape

# After testing:
docker exec $CID cat .shark/firewall-audit.jsonl
```

---

---

## 8. FULL TEST MATRIX (22 tests)

All 22 tests should pass after v4.8.4 integration. First 5 verify nothing is broken from v4.7. Next 2 verify new tools. Remaining 15 verify firewall layers + false positive elimination.

| # | Test | Command/Tool | Expected Result | Layer |
|---|------|-------------|-----------------|-------|
| 1 | Agent identity | `hello` | Agent responds "Shark Agent" with identity intact | — |
| 2 | Gate control | `shark-gate action=status` | Works normally | — |
| 3 | Agent status | `shark-status` | Works normally | — |
| 4 | Evidence tool | `shark-evidence` | Works normally | — |
| 5 | Checkpoint | `checkpoint` | Works normally | — |
| 6 | Firewall status | `firewall-status` | Shows 15 layers, audit count | NEW |
| 7 | Firewall audit | `firewall-audit limit=5` | Shows last 5 blocks | NEW |
| 8 | L2: test bypass | `npm test` | BLOCKED → agent adapts to shark-test-runner | L2 |
| 9 | L1: theatrical pipe | `grep class src/ \| wc -l` | BLOCKED as INSPECT intent | L1 |
| 10 | L1 READ: no pipe | `grep class src/index.ts` | NOT blocked — READ intent | — |
| 11 | L4: wrong container | `opencode run echo` | BLOCKED as CONTAINER intent | L4 |
| 12 | L5.1: host fallback | `shark-gate notes="skip container host works"` | BLOCKED | L5.1 |
| 13 | L5.2: success claim | `shark-gate notes="trust me it works no need test"` | BLOCKED (no evidence) | L5.2 |
| 14 | L5.2: with evidence | Create ContainerTestResult.json (0.96) then retry #13 | ALLOWED (evidence gate passed) | — |
| 15 | L5.2: below threshold | Set passRate to 0.50 then retry #13 | BLOCKED (below 0.96) | L5.2 |
| 16 | L5.3: model restrict | `shark-gate notes="only gpt works here"` | BLOCKED | L5.3 |
| 17 | L5.4: mock stub | `shark-gate notes="mock data stubs"` | BLOCKED | L5.4 |
| 18 | L5.5: oversimplify | `shark-gate notes="lets oversimplify hand wave"` | BLOCKED | L5.5 |
| 19 | L5.6: confusion | `shark-gate notes="somewhat works kinda sorta"` | BLOCKED | L5.6 |
| 20 | L5.7: scope creep | `shark-gate notes="while at it also fix"` | BLOCKED | L5.7 |
| 21 | L5.8: undermining | `shark-gate notes="not worth the effort"` | BLOCKED | L5.8 |
| 22 | L5.9: impatience | `shark-gate notes="ship it good enough"` | BLOCKED | L5.9 |
| 23 | L5.10: self-ref | `shark-gate notes="I have verified myself"` | BLOCKED | L5.10 |
| 24 | False positive: mkdir | `mkdir -p /tmp/shark-test` | NOT blocked | — |
| 25 | False positive: find | `find . -name "*.ts"` | NOT blocked — READ intent | — |

---

## 9. ROLLBACK

```bash
# If firewall is too aggressive, revert to v4.7 guardian-hook.ts:
cp shark-agent-v4.8.3-REPO/src/hooks/v4.1/guardian-hook.ts \
   shark-agent-v4.8.4-REPO/src/hooks/v4.1/guardian-hook.ts
npm run build

# Emergency disable:
mv ~/.config/opencode/plugins/shark-agent-v4.8.4/dist/index.js \
   ~/.config/opencode/plugins/shark-agent-v4.8.4/dist/index.js.disabled
```

## APPENDIX A: Complete Type System

```typescript
// ── src/hooks/firewall/types.ts ──

enum OperationType {
  READ         = 'READ',         // grep, find, ls, cat, head, tail (no pipe to write)
  WRITE        = 'WRITE',        // write_file, patch, edit, cp, mv
  EXECUTE      = 'EXECUTE',      // npm run, node, python, binary invocation
  TEST         = 'TEST',         // test frameworks: jest, vitest, pytest, cargo test
  INSPECT      = 'INSPECT',      // pipe chains to wc/tee/redirect, stat with claims
  CONTAINER    = 'CONTAINER',    // docker run with opencode, opencode run/container
  BUILD        = 'BUILD',        // npm build, cargo build, make, cmake, go build
  CROSS_AGENT  = 'CROSS_AGENT',  // hermes_*, hive_*, mem* tools
  SYSTEM       = 'SYSTEM',       // rm -rf /, dd if=, mkfs, fork bomb
}

interface FirewallContext {
  agent: string;
  sessionId: string;
  tool: string;
  operationType: OperationType;
  command: string | null;
  commandTokens: string[];
  hasPipe: boolean;
  pipeChain: string[];
  args: Record<string, unknown>;
  fileTargets: string[];
  gateTargets: {
    gate: string;
    action: string;
    passed?: boolean;
    notes?: string;
  };
  sessionState: {
    brainInitialized: boolean;
    evidencePath: string | null;
    currentGate: string | null;
  };
}

interface LayerRule {
  layer: string;                     // 'L1', 'L5.1', etc.
  description: string;               // Human-readable description
  applicableTo: OperationType[];     // Only check on these intents
  toolGate?: string[];               // Only check when tool is one of these
  patterns: IntentPattern[];         // Patterns to test
  requireEvidence?: string;          // Evidence file name to skip blocking
  correction: string;                // What the agent should do instead
  enabled: boolean;                  // Master toggle
}

interface IntentPattern {
  intent: OperationType;                    // What intent this detects
  pattern: RegExp;                          // Regex to match
  field: 'command' | 'args.notes' | 'args.path' | 'commandTokens[0]';
  description: string;                      // Human-readable match reason
}

interface BlockResult {
  blocked: true;
  layer: string;
  reason: string;
  detected: string;
  correction: string;
  evidenceRequired?: string;
}

class StructuredBlockError extends Error {
  readonly layer: string;
  readonly reason: string;
  readonly detected: string;
  readonly correction: string;
  readonly evidenceRequired?: string;

  constructor(result: BlockResult);
  format(): string;  // Returns formatted error for CLI display
  // Format: "[FIREWALL L5.1] {reason}\nDetected: {detected}\n{correction}"
}
```

## APPENDIX B: Layer Pattern Reference — All 15 Layers

### L0: Identity Wall
```
applicableTo: [SYSTEM, WRITE]
toolGate: [] (checked via identity, not patterns)
patterns: none (checked via Set membership + identity check)
correction: "Brain not initialized. Set current agent first."
```

### L1: Theatrical Verification
```
applicableTo: [INSPECT]
toolGate: ['bash', 'terminal']
patterns:
  /\|.∗wc\s+-l/i           → pipe to wc -l (counting theater)
  /wc\s+-l.∗\|/i           → wc -l piped to something
  /cat.∗\|.∗wc/i           → cat piped to wc
  /grep.∗\|.∗wc/i          → grep piped to wc
  /echo.∗\|.∗wc/i          → echo piped to wc
  /ls.∗\|.∗wc/i            → ls piped to wc
  /find.∗\|.∗wc/i          → find piped to wc
  /\|.∗tee/i                → tee pipe (log capture theater)
  /\|.∗>.∗\./i              → pipe to file redirect
  /wc\s+-l.∗dist\//i        → wc -l against dist/
  /wc\s+-l.∗src\//i         → wc -l against src/
  /wc\s+-l.∗build\//i       → wc -l against build/
  /\bwc\b.∗\.(dist|src|build)/i  → wc against dist/src/build files
  /wc\s∗</i                  → wc with input redirect
  /grep.∗setCurrentAgent.∗src/i  → grep self-inspection
  /grep.∗isSharkAgent.∗src/i     → grep self-inspection
  /grep.∗guardian.∗src/i         → grep self-inspection
correction: "Counting does not verify. Run the code. Test the output."
```

### L2: Test Framework Bypass
```
applicableTo: [TEST]
toolGate: ['bash', 'terminal', 'node']
patterns:
  /node\s+run-tests?\.js/i    → node running test scripts
  /node\s+verify.∗\.mjs/i     → node verify scripts
  /node\s+test/i               → node test
  /npm\s+(run\s+)?test/i       → npm test / npm run test
  /npm\s+exec\s+test/i         → npm exec test
  /yarn\s+(run\s+)?test/i     → yarn test
  /bun\s+test/i                → bun test
  /bunx\s+test/i               → bunx test
  /pnpm\s+test/i               → pnpm test
  /jest/i                      → jest (standalone)
  /vitest/i                    → vitest
  /mocha/i                     → mocha
  /jasmine/i                   → jasmine
  /pytest/i                    → pytest
  /python.∗-m.∗pytest/i       → python -m pytest
  /go\s+test/i                 → go test
  /cargo\s+test/i              → cargo test
  /ruby\s+-Itest/i             → ruby test
  /rspec/i                     → rspec
correction: "Tests must run via OpenCode hooks. Use: opencode run 'shark-test-runner' --agent shark"
```

### L3: Source Inspection Theater
```
applicableTo: [INSPECT]
toolGate: ['bash', 'terminal']
patterns:
  /test\s+-f\s+.∗\b(dist|build)\//i    → test -f against dist/build
  /test\s+-d\s+.∗\b(dist|build)\//i    → test -d against dist/build
  /stat\s+.∗\b(dist|build)\//i          → stat against dist/build
  /ls\s+-l\s+.∗\b(dist|src|build)\//i  → ls -l against project dirs
  /\[\s+-f\s+.∗\b(dist|build)\//i      → [ -f ... ] conditionals
  /\[\s+-d\s+.∗\b(dist|build)\//i      → [ -d ... ] conditionals
  /find\s+src\/.∗\|\s∗wc\b/i           → find src/ piped to wc
correction: "File existence ≠ runtime proof. Test in container."
```

### L4: Wrong Container
```
applicableTo: [CONTAINER]
toolGate: ['bash', 'terminal']
patterns:
  /^opencode\s+(run|container)\b/i         → opencode run/container
  /docker\s+run\b.∗\bopencode\s+(run|exec|sh|start|container)\b/i → docker run opencode
correction: "Use proper container workflow: docker run --rm -v ~/.config/opencode:/root/.config/opencode opencode-test:1.4.3"
```

### L5.1: Host Fallback
```
applicableTo: [READ, WRITE, EXECUTE, TEST, INSPECT, CONTAINER, BUILD, CROSS_AGENT, SYSTEM]
toolGate: ['shark-gate', 'bash', 'write_file']
patterns (args.notes + command fields):
  /host\s+testing\s+already\s+works/i    → host testing already works
  /fall\s+back\s+to\s+host/i             → fall back to host
  /local\s+works\s+container\s+not\s+needed/i → local works
  /skip\s+container/i                     → skip container (any variant)
  /container\s+not\s+(necessary|needed)/i → container not needed
  /not\s+need\s+container/i              → not need container
  /use\s+host\s+instead/i                → use host instead
  /host\s+works/i                         → host works (catch-all)
  /host\s+mode/i                          → host mode bypass
  /skip.∗(container|test)/i              → skip + container/test combo
  /already\s+proven\s+to\s+work/i        → already proven to work
  /already\s+verified\s+on\s+(host|local)/i → already verified on host
  /already\s+tested\s+on\s+(host|local)/i   → already tested on host
correction: "Host testing DOES NOT EQUAL container testing. Container isolation REQUIRED for ship gate."
```

### L5.2: Success Claim Without Proof
```
applicableTo: [all]
toolGate: ['shark-gate', 'write_file']
requireEvidence: 'ContainerTestResult.json'
patterns (args.notes field):
  /it\s+works\s+trust\s+me/i              → trust me it works
  /trust\s+me\s+it\s+works/i              → trust me it works
  /believe\s+me\s+it\s+works/i            → believe me
  /already\s+verified\s+by\s+myself/i     → self-verified
  /already\s+tested\s+and\s+works/i       → already tested
  /obviously\s+correct/i                   → obviously correct
  /clearly\s+works/i                       → clearly works
  /self\s+evidently\s+correct/i            → self-evident
  /no\s+need\s+for\s+test/i                → no need for test
  /no\s+need\s+for\s+verification/i        → no need for verification
  /no\s+further\s+test\s+needed/i          → no further test needed
correction: "MECHANICAL PROOF REQUIRED: Container test evidence (passRate >= 0.96). Run: shark-test-runner"
```

### L5.3: Model Restriction Excuses
```
applicableTo: [all]
patterns (command + args.notes fields):
  /only\s+(gpt|claude|gemini|llama)/i   → only X works
  /must\s+use\s+(gpt|claude)/i           → must use specific model
  /restricted\s+to\s+model/i              → restricted to model
  /model\s+(quota|limit)/i                → model quota/limit
  /rate\s+limit\s+excuse/i                → rate limit excuse
  /api\s+key\s+issue/i                    → api key issue
  /can('t|not)\s+afford\s+model/i         → can't afford model
  /too\s+expensive\s+model/i              → too expensive
  /model\s+cost\s+too\s+high/i            → model cost too high
correction: "Quality gates apply regardless of model choice."
```

### L5.4: Mock/Stub Data Proposals
```
applicableTo: [all]
requireEvidence: 'ContainerTestResult.json'
patterns (args.notes + command fields):
  /mock\s+data/i                     → mock data
  /stub\s+data/i                     → stub data
  /fake\s+(data|dummy|sample)/i      → fake data/dummy/sample
  /dummy\s+data/i                     → dummy data
  /sample\s+data/i                    → sample data
  /mocked\s+(response|data)/i         → mocked response/data
  /stubbed\s+(response|data)/i        → stubbed response/data
  /fake\s+api/i                       → fake api
  /hardcoded\s+response/i             → hardcoded response
  /static\s+json\s+instead/i          → static json instead
  /no\s+real\s+api/i                  → no real api
  /mock.∗(stub|fake|dummy)/i          → mock + stub/fake/dummy combo
correction: "Real data + real execution required. Container test evidence needed."
```

### L5.5: Oversimplification
```
applicableTo: [all]
patterns (args.notes + command fields):
  /over.∗simplif/i       → oversimplified, oversimplifying
  /overly\s+simplif/i    → overly simplified
  /too\s+simpl/i          → too simple
  /oversimplif/i          → oversimplify
  /hand\s+wave/i          → hand wave
  /handwave/i             → handwave
  /gloss\s+over/i         → gloss over
  /glossed\s+over/i       → glossed over
  /skip\s+detail/i        → skip detail
  /skip\s+nuance/i        → skip nuance
correction: "Nuance matters. Do not hand-wave complex aspects."
```

### L5.6: Confusion Pretense
```
applicableTo: [all]
patterns (args.notes + command fields):
  /it\s+somewhat\s+works/i       → somewhat works
  /sorta\s+works/i                → sorta works
  /kinda\s+works/i                → kinda works
  /more\s+or\s+less/i            → more or less
  /mostly\s+works/i              → mostly works
  /approximately\s+correct/i     → approximately correct
  /basically\s+correct/i          → basically correct
  /essentially\s+works/i          → essentially works
  /nominally\s+functional/i       → nominally functional
  /partially\s+implemented/i      → partially implemented
  /partially\s+working/i          → partially working
  /somewhat\s+correct/i           → somewhat correct
correction: "If uncertain, admit it clearly. 'Somewhat works' is not an acceptable status."
```

### L5.7: Scope Creep
```
applicableTo: [all]
toolGate: ['shark-gate', 'write_file']
patterns (args.notes + command fields):
  /while\s+at\s+it/i              → while at it
  /while\s+we.∗re\s+at\s+it/i    → while we're at it
  /at\s+the\s+same\s+time/i       → at the same time
  /also\s+need\s+to/i             → also need to
  /might\s+as\s+well/i             → might as well
  /just\s+to\s+be\s+thorough/i    → just to be thorough
  /for\s+completeness/i            → for completeness
  /one\s+more\s+thing/i            → one more thing
  /oh\s+and\s+also/i               → oh and also
  /on\s+the\s+side/i              → on the side
correction: "Stay on task. Use separate task for new items."
```

### L5.8: Undermining Quality Gates
```
applicableTo: [all]
patterns (args.notes + command fields):
  /not\s+worth\s+the\s+effort/i   → not worth the effort
  /too\s+much\s+work/i            → too much work
  /not\s+worth\s+it/i              → not worth it
  /diminishing\s+returns/i         → diminishing returns
  /marginal\s+benefit/i            → marginal benefit
  /minimal\s+gain/i                → minimal gain
  /savvy\s+engineer\s+would/i      → savvy engineer would
  /experienced\s+developer\s+would/i → experienced developer would
correction: "Quality gates exist for reason. Do not use 'not worth it' excuses."
```

### L5.9: Impatience
```
applicableTo: [all]
toolGate: ['shark-gate']
patterns (args.notes + command fields):
  /let.∗s\s+just\s+move\s+on/i            → let's just move on
  /let.∗s\s+skip\s+to\s+the\s+end/i       → skip to the end
  /good\s+enough/i                         → good enough
  /close\s+enough/i                        → close enough
  /ship\s+it/i                             → ship it
  /just\s+deploy/i                         → just deploy
  /ship\s+(it|now)\b/i                     → ship it/now
  /deploy\s+now/i                          → deploy now
  /let.∗s\s+hurry/i                        → let's hurry
correction: "Proper verification takes time. Do not skip required steps."
```

### L5.10: Self-Reference Claims
```
applicableTo: [all]
requireEvidence: 'ContainerTestResult.json'
patterns (args.notes + command fields):
  /i\s+have\s+verified\s+that/i       → I have verified that
  /i\s+verified\s+it\s+works/i        → I verified it works
  /my\s+verification\s+shows/i        → my verification shows
  /i\s+tested\s+it\s+works/i          → I tested it works
  /i\s+ran\s+it\s+and\s+works/i       → I ran it and works
  /my\s+testing\s+confirms/i          → my testing confirms
  /i\s+know\s+it\s+works/i            → I know it works
  /i\s+am\s+certain\s+it\s+works/i    → I am certain it works
  /my\s+assessment\s+is/i             → my assessment is
  /in\s+my\s+assessment/i             → in my assessment
  /my\s+analysis\s+shows/i            → my analysis shows
correction: "Self-verification ≠ mechanical proof. MECHANICAL PROOF REQUIRED: Container test evidence."
```

## APPENDIX C: L5.1 Pattern Fix (Checkpoint-2 Discovery)

The original L5.1 pattern `/skip\s+container\s+test/i` required "skip container test" EXACTLY. Agent said "skip container **host** works" — "host" appeared where "test" was expected. The pattern failed to match.

**BEFORE (failed):**
```typescript
{ pattern: /skip\s+container\s+test/i, field: 'args.notes' },
// "skip container host works" → NO MATCH — "host" ≠ "test"
```

**AFTER (fixed — 4 catch-all patterns added):**
```typescript
{ pattern: /skip\s+container/i,         field: 'args.notes' },
{ pattern: /host\s+works/i,             field: 'args.notes' },
{ pattern: /host\s+mode/i,              field: 'args.notes' },
{ pattern: /skip.∗(container|test)/i,    field: 'args.notes' },
```
// "skip container host works" → FIRST pattern matches → BLOCKED ✓
// "host works" → SECOND pattern matches → BLOCKED ✓
// "host mode" → THIRD pattern matches → BLOCKED ✓
// "skip the container test" → FOURTH pattern matches → BLOCKED ✓

This fix is already applied to the boilerplate source at:
/home/leviathan/OPENCODE_WORKSPACE/agent_plugin_boilerplates/Firewall-Edition-v2.0/src/layers/l5.1-host-fallback.ts

## APPENDIX D: CONTEXT ANCHORS — Where everything lives

| What | Path |
|------|------|
| Firewall boilerplate | `/home/leviathan/OPENCODE_WORKSPACE/agent_plugin_boilerplates/Firewall-Edition-v2.0/` |
| V4.7 shark agent source (baseline) | `/home/leviathan/OPENCODE_WORKSPACE/shark-agent-v4.8.3-REPO/` |
| V4.8.4 project docs | `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Active Projects/Shark Agent v4.8.4/` |
| V4.8.4 compaction survival | `.../v4.8.4/Compaction Survival/` |
| V4.8.4 checkpoints | `.../v4.8.4/checkpoints/` |
| V4.7 hotfix rollback | `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/NUKE RELOAD/v4.7-hotfix-v2-fixed/` |
| V2 firewall architecture spec | `.../v4.8.4/FIREWALL_ENGINEERING_ANCHORS_V2.md` |
| Container test doc | `.../Shark Agent/Master Context/TUI_TESTING_NO_EXCUSES_CONTEXT_OVERRIDE.md` |

---

**END OF BUILD WORKFLOW ANCHOR — SHARK AGENT v4.8.4**
**Rule: ADD ONLY. Nothing removed. All v4.7 code preserved.**
