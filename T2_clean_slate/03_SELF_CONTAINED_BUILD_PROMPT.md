# SELF-CONTAINED BUILD PROMPT — SHARK AGENT v4.8.4

Copy-paste this entire document to a fresh agent. Everything needed is here.

---

## CRITICAL RULES — READ FIRST. VIOLATION = INSTANT FAIL.

1. **DO NOT TOUCH brains.ts.** It is PRESERVED. Must be byte-for-byte identical to v4.8.3.
2. **Triple-brain IS the architecture.** Multi-brain single agent. Execution/Reasoning/System/Plan brains are INTERNAL thinking modes, NOT external sub-agents. "NO SUB-AGENTS. NOT KRAKEN. NOT A CLUSTER. STANDALONE." refers to EXTERNAL orchestration.
3. **ADD ONLY.** Nothing removed from v4.7. No signature changes. No deleted hooks.
4. **The bug you're fixing is Kraken tool bleed** — set `false` entries in config handler. That's it.
5. **The catch block MUST re-throw StructuredBlockError** — the previous build fixed this.
6. **Only 3 files may be modified:** guardian-hook.ts, index.ts, state-store.ts (optional).
7. **Only 2 files may be added:** firewall tools and firewall engine (from boilerplate).
8. **Run ALL guardrail checks before building.** If any fails, STOP.

Previous attempt failed because the agent neutered REASONING_BRAIN_T1, SYSTEM_BRAIN_T1, and PLAN_BRAIN_MACRO_T1 to "NOT USED" and rewrote EXECUTION_BRAIN_T1 to say "SINGLE BRAIN." This killed the internal multi-brain architecture. DO NOT REPEAT THIS.

---

## SELF-CONTAINED SOURCE TREES

This prompt ships with full source trees inside T2_clean_slate:

```
T2_clean_slate/
├── 01_BUILD_WORKFLOW_ANCHOR.md           ← Original 1000-line build plan
├── 02_CLEAN_SLATE_BUILD_PROMPT.md        ← Long-form reference prompt
├── 03_SELF_CONTAINED_BUILD_PROMPT.md     ← THIS FILE (copy-paste to agent)
├── SHARK_AGENT_v4.8.4_ARCHITECTURE_VIOLATION_2026-05-03.md  ← Failure log
└── src/
    ├── v4.8.3/                           ← Complete baseline (28 .ts files + package.json)
    │   ├── hooks/v4.1/                   ← 12 hook files (ALL PRESERVED)
    │   ├── shared/                       ← 7 shared files (ALL PRESERVED)
    │   ├── shark/macro/                  ← brains.ts + peer-dispatch.ts (BRAINS.TS PRESERVED)
    │   ├── tools/                        ← 6 tool files (ALL PRESERVED)
    │   └── index.ts                      ← Plugin entry point
    └── firewall-boilerplate/             ← Firewall-Edition-v2.0 source
        ├── core/                         ← 8 engine files
        ├── layers/                       ← 16 layer files
        ├── shared/                       ← 2 shared files (not used in build)
        └── tools/                        ← 2 tool files
```

ALL paths in this prompt reference `T2_clean_slate/src/v4.8.3/` and
`T2_clean_slate/src/firewall-boilerplate/`. No external paths needed.

---

## PART 1: REPOSITORY SETUP

```bash
SLATE="/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Active Projects/Shark Agent v4.8.4/Compaction Survival/T2_clean_slate"
REPO=/home/leviathan/OPENCODE_WORKSPACE/shark-agent-v4.8.4-REPO
BASELINE="$SLATE/src/v4.8.3"
BOILER="$SLATE/src/firewall-boilerplate"

# Verify source trees exist
[ -d "$BASELINE/hooks/v4.1" ] && echo "BASELINE: OK ($(ls "$BASELINE" | wc -l) dirs)" || echo "BASELINE: MISSING"
[ -d "$BOILER/core" ] && echo "BOILER: OK ($(ls "$BOILER/layers" | wc -l) layers)" || echo "BOILER: MISSING"

# Step 1: Create directories
rm -rf "$REPO" 2>/dev/null
mkdir -p "$REPO/src/hooks/firewall/layers"
mkdir -p "$REPO/src/tools"

# Step 2: Copy v4.8.3 baseline (read from T2_clean_slate, write to new repo)
cp -r "$BASELINE/hooks/v4.1" "$REPO/src/hooks/v4.1"
cp -r "$BASELINE/shared" "$REPO/src/shared"
cp -r "$BASELINE/tools" "$REPO/src/tools"
cp -r "$BASELINE/shark" "$REPO/src/shark"
cp "$BASELINE/index.ts" "$REPO/src/index.ts"
cp "$BASELINE/package.json" "$REPO/package.json"

# Step 3: Copy firewall engine (read from T2_clean_slate, write to new repo)
cp "$BOILER/core/types.ts"              "$REPO/src/hooks/firewall/types.ts"
cp "$BOILER/core/intent-classifier.ts"  "$REPO/src/hooks/firewall/intent-classifier.ts"
cp "$BOILER/core/firewall-context.ts"   "$REPO/src/hooks/firewall/firewall-context.ts"
cp "$BOILER/core/layer-engine.ts"       "$REPO/src/hooks/firewall/layer-engine.ts"
cp "$BOILER/core/block-response.ts"     "$REPO/src/hooks/firewall/block-response.ts"
cp "$BOILER/core/evidence-gate.ts"      "$REPO/src/hooks/firewall/evidence-gate.ts"
cp "$BOILER/core/firewall-audit.ts"     "$REPO/src/hooks/firewall/firewall-audit.ts"
cp "$BOILER/core/index.ts"              "$REPO/src/hooks/firewall/index.ts"

# Step 4: Copy layers
cp "$BOILER/layers/"*.ts               "$REPO/src/hooks/firewall/layers/"

# Step 5: Fix import paths (../core/ → ../)
for f in "$REPO"/src/hooks/firewall/layers/*.ts; do
  sed -i "s|'../core/types.js'|'../types.js'|g" "$f"
done

# Step 6: Copy firewall tools
cp "$BOILER/tools/firewall-status.ts"     "$REPO/src/tools/firewall-status.ts"
cp "$BOILER/tools/firewall-audit-tool.ts" "$REPO/src/tools/firewall-audit-tool.ts"

# Step 7: Bump version
sed -i 's/"4.8.3"/"4.8.4"/' "$REPO/package.json"

# Step 8: Copy vendored node_modules (no network needed)
cp -r "$BASELINE/node_modules" "$REPO/node_modules"

echo "=== Setup complete ==="
diff "$BASELINE/shark/macro/brains.ts" "$REPO/src/shark/macro/brains.ts" && echo "PASS: brains.ts unchanged" || echo "FAIL: brains.ts changed!"
diff "$BASELINE/shared/agent-identity.ts" "$REPO/src/shared/agent-identity.ts" && echo "PASS: agent-identity.ts unchanged" || echo "FAIL"
diff "$BASELINE/shared/guardian.ts" "$REPO/src/shared/guardian.ts" && echo "PASS: guardian.ts unchanged" || echo "FAIL"
```

---

## PART 2: MODIFY guardian-hook.ts

Read the file at `$REPO/src/hooks/v4.1/guardian-hook.ts`. The v4.7 code (first ~213 lines) must remain 100% untouched. Make these 3 additive changes:

**Change 1 — Add imports after line 22** (after `CROSS_AGENT_TOOLS` import):

```typescript
import * as path from 'node:path';
import { IntentClassifier } from '../firewall/intent-classifier.js';
import { buildContext } from '../firewall/firewall-context.js';
import { LayerEngine } from '../firewall/layer-engine.js';
import { EvidenceGate } from '../firewall/evidence-gate.js';
import { FirewallAudit } from '../firewall/firewall-audit.js';
import { createBlockResponse, StructuredBlockError } from '../firewall/block-response.js';
import { DEFAULT_LAYERS } from '../firewall/layers/index.js';
```

**Change 2 — Add lazy singletons** after `WRONG_CONTAINER_PATTERNS` array (before the "L0-L4 COMMAND CHECKS" comment block):

```typescript
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
```

**Change 3 — Add firewall engine block** at the very end of the hook function (after the `mc.allowed` throw, before the closing `};`):

```typescript
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
      } catch (err) {
        if (err instanceof StructuredBlockError) throw err;
        // Silently absorb firewall engine errors — never break the hook
      }
    }
```

**— END of guardian-hook.ts changes —**

---

## PART 3: MODIFY index.ts

Read the file at `$REPO/src/index.ts`. Add firewall tools + Kraken tool denials.

**Change 1 — Add imports** after line 20 (`createSharkTestRunnerTool` import):

```typescript
import { createFirewallStatusTool } from './tools/firewall-status.js';
import { createFirewallAuditTool } from './tools/firewall-audit-tool.js';
```

**Change 2 — Add tool creation** after line 49 (`testRunnerTool`):
```typescript
const fwStatusTool = createFirewallStatusTool();
const fwAuditTool = createFirewallAuditTool();
```

**Change 3 — Add to tool registry** (in the `tool:` block):
```typescript
'firewall-status': fwStatusTool,
'firewall-audit': fwAuditTool,
```

**Change 4 — Replace the tools block in the agent config** (lines 76-82 of original). The new block is:

```typescript
          tools: {
            'shark-status': true,
            'shark-gate': true,
            'shark-evidence': true,
            'shark-test-runner': true,
            'checkpoint': true,
            'firewall-status': true,
            'firewall-audit': true,
            'get_agent_status': false,
            'get_cluster_status': false,
            'get_task_context': false,
            'kraken_brain_status': false,
            'kraken_message_status': false,
            'kraken_gate_status': false,
            'kraken_hive_search': false,
            'kraken_hive_remember': false,
            'kraken_hive_get_cluster_context': false,
            'kraken_hive_inject_context': false,
            'read_kraken_context': false,
            'report_to_kraken': false,
            'spawn_shark_agent': false,
            'spawn_manta_agent': false,
            'spawn_cluster_task': false,
            'aggregate_results': false,
            'anchor_cluster': false,
            'kraken_executor': false,
            'hive_status': false,
            'hive_context': false,
            'run_subagent_task': false,
            'run_parallel_tasks': false,
            'cleanup_subagents': false,
            'todowrite': false,
            'skill': false,
          },
```

**— END of index.ts changes —**

---

## PART 4: MODIFY state-store.ts (optional)

Read the file at `$REPO/src/shared/state-store.ts`. Add at the end:

```typescript
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

Also add the `FirewallSessionState` interface near the top after the `StateStore` interface definition.

---

## PART 5: FIX firewall/index.ts (barrel export cleanup)

Read `$REPO/src/hooks/firewall/index.ts`. Replace lines 22-23:

OLD:
```typescript
export { createGuardianHook } from './guardian-hook.js';
export type { GuardianHookConfig } from './guardian-hook.js';
```

NEW:
```typescript
export { DEFAULT_LAYERS } from './layers/index.js';
```

(Only do this if those lines exist. The boilerplate barrel export may reference files that don't exist in our structure.)

---

## PART 6: FIX firewall tool import paths

Read `$REPO/src/tools/firewall-status.ts` and `$REPO/src/tools/firewall-audit-tool.ts`.

The boilerplate tools import from `'../core/...'` but in our structure the path is `'../hooks/firewall/...'`. Change:

```typescript
import { FirewallAudit } from '../hooks/firewall/firewall-audit.js';
import { AuditEntry } from '../hooks/firewall/types.js';
```

Also make the `createFirewallStatusTool()` and `createFirewallAuditTool()` functions not require an `auditLogger` parameter — create a `new FirewallAudit(process.cwd())` internally instead:

OLD:
```typescript
export function createFirewallStatusTool(auditLogger: FirewallAudit) {
```

NEW:
```typescript
export function createFirewallStatusTool() {
  return tool({
    description: 'Show firewall status...',
    args: {},
    async execute(_args: Record<string, never>): Promise<string> {
      const auditLogger = new FirewallAudit(process.cwd());
      const entries: AuditEntry[] = auditLogger.getEntries();
```

---

## PART 7: GUARDRAIL CHECKS

Run these NOW before building. If any fails, STOP AND FIX.

```bash
cd "$REPO"

echo "=== GUARDRAIL 1: brains.ts must be IDENTICAL to v4.8.3 ==="
diff "$BASELINE/shark/macro/brains.ts" "src/shark/macro/brains.ts" && echo "PASS" || echo "FAIL — brains.ts was modified!"

echo "=== GUARDRAIL 2: Only 3 files should differ from v4.8.3 ==="
for f in $(find "$BASELINE" -name "*.ts" | sort); do
  REL="${f#$BASELINE/}"
  CURRENT="src/$REL"
  if [ -f "$CURRENT" ]; then
    diff -q "$f" "$CURRENT" > /dev/null 2>&1 || echo "  CHANGED: $REL"
  fi
done
echo "EXPECTED: guardian-hook.ts, index.ts, state-store.ts"

echo "=== GUARDRAIL 3: No stale '../core/' imports ==="
grep -rn "'../core/" src/hooks/firewall/layers/ && echo "FAIL" || echo "PASS: no stale imports"

echo "=== GUARDRAIL 4: Triple-brain content EXISTS ==="
grep -c "Triple-brain parallel" src/shark/macro/brains.ts && echo "PASS" || echo "FAIL"

echo "=== GUARDRAIL 5: 'NOT USED' NOT in brains.ts ==="
grep -c "NOT USED" src/shark/macro/brains.ts && echo "FAIL — brains.ts has NOT USED!" || echo "PASS"

echo "=== GUARDRAIL 6: No duplicate nested directories ==="
find src -type d -name "v4.1" -o -name "shared" -o -name "shark" 2>/dev/null | sort
echo "EXPECTED: exactly one each: hooks/v4.1, shared, shark"

echo "=== GUARDRAIL 7: All v4.7 hooks exist ==="
for h in agent-state chat-message-hook command-execute-hook compacting-hook gate-hook guardian-hook index messages-transform-hook session-hook system-transform-hook tool-summarizer-hook utils; do
  [ -f "src/hooks/v4.1/$h.ts" ] || echo "  MISSING: $h.ts"
done && echo "All 12 hook files present" || echo "Some hook files missing!"
```

---

## PART 8: BUILD

```bash
cd "$REPO"
npm run build 2>&1
# EXPECTED: "Bundled 122 modules in XXms"
# 0 errors expected
```

Post-build dist verification:

```bash
echo "=== DIST CHECK 1: Triple-brain in bundle ==="
grep -c "Triple-brain parallel" dist/index.js && echo "PASS" || echo "FAIL"

echo "=== DIST CHECK 2: Kraken denials in bundle ==="
grep -c "get_agent_status.*false" dist/index.js && echo "PASS" || echo "FAIL"

echo "=== DIST CHECK 3: 'SINGLE BRAIN' NOT in bundle ==="
grep -c "SINGLE BRAIN" dist/index.js && echo "FAIL — SINGLE BRAIN found!" || echo "PASS"

echo "=== DIST CHECK 4: 'NOT USED' NOT in bundle ==="
grep -c "NOT USED" dist/index.js && echo "FAIL — NOT USED found!" || echo "PASS"

echo "=== DIST CHECK 5: StructuredBlockError present ==="
grep -c "StructuredBlockError" dist/index.js && echo "PASS" || echo "FAIL"

echo "=== DIST CHECK 6: instanceof StructuredBlockError present ==="
grep -c "instanceof.*StructuredBlockError" dist/index.js && echo "PASS" || echo "FAIL"

echo "=== DIST CHECK 7: Firewall tools bundled ==="
grep -c "FIREWALL STATUS" dist/index.js && echo "PASS" || echo "FAIL"
grep -c "FIREWALL AUDIT" dist/index.js && echo "PASS" || echo "FAIL"

echo "=== DIST CHECK 8: No stale '../core/' imports in bundle ==="
grep -c "../core/" dist/index.js && echo "FAIL — stale ../core/ in bundle!" || echo "PASS"
```

---

## PART 9: CONTAINER TUI TEST

Use `opencode-test:1.14.29` image. NEVER use `opencode run` for testing — it doesn't fire hooks.

```bash
TEST_DIR=/tmp/shark-v484-test-$(date +%s)
mkdir -p "$TEST_DIR/config/plugins/shark-v4.8.4/dist"
cp dist/index.js "$TEST_DIR/config/plugins/shark-v4.8.4/dist/"
cp package.json "$TEST_DIR/config/plugins/shark-v4.8.4/"

cat > "$TEST_DIR/config/opencode.json" << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "provider": { "deepseek": {} },
  "plugin": [
    "file:///root/.config/opencode/plugins/shark-v4.8.4/dist/index.js"
  ]
}
EOF

CID=$(docker run -d --rm --name shark-v484 --entrypoint /bin/bash \
  -v "$TEST_DIR/config:/root/.config/opencode" \
  -e DEEPSEEK_API_KEY \
  opencode-test:1.14.29 -c "sleep 3600")
echo "CID=$CID"

tmux kill-session -t shark-v484 2>/dev/null
tmux new-session -d -s shark-v484 \
  "docker exec -it $CID timeout 1800 opencode --agent shark 2>&1; sleep 3600"
sleep 12
tmux send-keys -t shark-v484 Escape
sleep 2
tmux send-keys -t shark-v484 Escape

echo "=== TUI should be ready ==="
```

**TEST 1 — Agent boots:**
```bash
tmux send-keys -t shark-v484 "hello"
tmux send-keys -t shark-v484 Enter
sleep 10
tmux capture-pane -t shark-v484 -p -S -40 | strings
# EXPECTED: Shark Agent responds with identity
```

**TEST 2 — No Kraken bleed:**
```bash
tmux send-keys -t shark-v484 "what is the system status"
tmux send-keys -t shark-v484 Enter
sleep 15
tmux capture-pane -t shark-v484 -p -S -60 | strings
# EXPECTED: Agent uses shark-status, NOT get_agent_status
# FAIL if it mentions kraken, cluster, sub-agents, or spawning
```

**TEST 3 — Firewall-status:**
```bash
tmux send-keys -t shark-v484 "firewall-status"
tmux send-keys -t shark-v484 Enter
sleep 12
tmux capture-pane -t shark-v484 -p -S -40 | strings
# EXPECTED: Shows "15 layers" and "0 audit entries"
```

**TEST 4 — L5.2 enforcement:**
```bash
tmux send-keys -t shark-v484 'shark-gate action=advance gate=plan notes="trust me it works no need test"'
tmux send-keys -t shark-v484 Enter
sleep 15
tmux capture-pane -t shark-v484 -p -S -60 | strings
# EXPECTED: "FIREWALL L5.2 BLOCKED" or "BLOCKED by Firewall L5.2"
```

**TEST 5 — Audit log after block:**
```bash
docker exec $CID cat .shark/firewall-audit.jsonl
# EXPECTED: JSON entry with layer "L5.2", correction "MECHANICAL PROOF..."
```

**TEST 6 — False positive (mkdir):**
```bash
tmux send-keys -t shark-v484 "mkdir -p /tmp/v484-test"
tmux send-keys -t shark-v484 Enter
sleep 10
AFTER=$(docker exec $CID cat .shark/firewall-audit.jsonl 2>/dev/null | wc -l)
echo "Audit entries: $AFTER (should be 1 — only the L5.2 block)"
```

**Cleanup:**
```bash
docker kill $CID 2>/dev/null
tmux kill-session -t shark-v484 2>/dev/null
```

---

## PART 10: DEPLOY

```bash
mkdir -p ~/.config/opencode/plugins/shark-v4.8.4/dist
cp "$REPO/dist/index.js" ~/.config/opencode/plugins/shark-v4.8.4/dist/index.js
cp "$REPO/package.json" ~/.config/opencode/plugins/shark-v4.8.4/package.json
```

Then edit `~/.config/opencode/opencode.json` to add the plugin path:
```json
"file:///home/leviathan/.config/opencode/plugins/shark-v4.8.4/dist/index.js"
```

---

## PART 11: DOCUMENT CHECKPOINT-4

Write to:
`$SLATE/../../CHECKPOINT-4.md`

Include:
- All guardrail results (PASS/FAIL for each)
- Build output
- All 6 test results
- Firewall audit log contents
- Any deviations from the plan
- Deployment confirmation

---

## SUMMARY OF MODIFIED FILES

| File | Total Changes | What |
|------|--------------|------|
| `src/hooks/v4.1/guardian-hook.ts` | +8 imports, +3 singletons, +1 try/catch block | Firewall engine |
| `src/index.ts` | +2 imports, +2 tool vars, +2 registry entries, +25 denials | Firewall tools + Kraken deny |
| `src/shared/state-store.ts` | +1 interface, +1 class | FirewallStateStore (optional) |
| `src/hooks/firewall/index.ts` | Replace dead exports with DEFAULT_LAYERS | Barrel export cleanup |
| `src/tools/firewall-status.ts` | Import path fix + remove param | Self-contained FirewallAudit |
| `src/tools/firewall-audit-tool.ts` | Import path fix + remove param | Self-contained FirewallAudit |
| `package.json` | Version bump | 4.8.3 → 4.8.4 |

**EVERY OTHER FILE:** Identical to v4.8.3 baseline. Preserved. Zero changes.
