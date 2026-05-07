# T2_CLEAN_SLATE — SHARK AGENT v4.8.4 REBUILD

## Purpose

This is the third attempt at building shark-agent-v4.8.4-REPO. The first two
attempts failed due to catastrophic architectural violations. This document
contains everything a fresh agent needs to succeed without repeating the
same mistakes.

---

## WHAT WENT WRONG (READ THIS FIRST. DO NOT REPEAT.)

**File:** `00_CRITICAL_FAILURE_LOG.md` (in this directory)

The previous attempt made two fatal errors:

1. **NEUTERED THE INTERNAL TRIPLE-BRAIN ARCHITECTURE.** The shark agent is a
   "multi-brain single agent" (per the BUILD_WORKFLOW_ANCHOR). The internal
   brains (Execution, Reasoning, System, Plan) are SEPARATE THINKING MODES
   within a single agent — NOT external sub-agents. The previous build
   replaced REASONING_BRAIN_T1, SYSTEM_BRAIN_T1, and PLAN_BRAIN_MACRO_T1
   with "NOT USED" and rewrote EXECUTION_BRAIN_T1 to say "SINGLE BRAIN."
   This was WRONG. DO NOT TOUCH brains.ts.

2. **VIOLATED ADD ONLY ON PRESERVED FILES.** brains.ts is marked PRESERVED
   (zero changes) in the anchor manifest. The previous build modified it
   anyway. The only files permitted modifications are:
   - `guardian-hook.ts` — ADD firewall layer engine
   - `index.ts` — ADD firewall tools + Kraken tool denials
   - `state-store.ts` — ADD firewall state domain (optional)

The ACTUAL bug that needed fixing was: **Kraken tools are injected into the
shark agent's environment** because OpenCode merges tools from all loaded
plugins. The fix is to add explicit `false` entries for Kraken tool names in
the config handler. That is all. Do not touch anything else.

---

## REFERENCE CODEBASES

### Baseline (STARTING POINT)
```
/home/leviathan/OPENCODE_WORKSPACE/shark-agent-v4.8.3-REPO/
```
This is the complete v4.8.3 source with all 28 `.ts` files. All v4.7 code
is preserved. The build produces a working plugin at `dist/index.js`.

### Hotfix v2 (ARCHITECTURE REFERENCE)
```
/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/NUKE RELOAD/v4.7-hotfix-v2-fixed/
```
This is an alternative v4.7 implementation with hotfixes. Reference for
understanding the triple-brain architecture but NOT the starting point.

### Firewall Boilerplate
```
/home/leviathan/OPENCODE_WORKSPACE/agent_plugin_boilerplates/Firewall-Edition-v2.0/src/
```
The firewall engine source. 8 core files + 16 layer files + 2 tool files.

---

## BUILD PLAN (=== DO NOT DEVIATE ===)

### PHASE 1: Create Repository

```bash
REPO=/home/leviathan/OPENCODE_WORKSPACE/shark-agent-v4.8.4-REPO
BASELINE=/home/leviathan/OPENCODE_WORKSPACE/shark-agent-v4.8.3-REPO
BOILER=/home/leviathan/OPENCODE_WORKSPACE/agent_plugin_boilerplates/Firewall-Edition-v2.0

mkdir -p $REPO/src/hooks/firewall/layers
mkdir -p $REPO/src/tools

# Copy v4.8.3 baseline (ALL files)
cp -r $BASELINE/src/hooks/v4.1 $REPO/src/hooks/v4.1
cp -r $BASELINE/src/shared $REPO/src/shared
cp -r $BASELINE/src/tools $REPO/src/tools
cp -r $BASELINE/src/shark $REPO/src/shark
cp $BASELINE/src/index.ts $REPO/src/index.ts
cp $BASELINE/package.json $REPO/package.json

# Copy firewall core (8 files)
cp $BOILER/src/core/types.ts              $REPO/src/hooks/firewall/types.ts
cp $BOILER/src/core/intent-classifier.ts  $REPO/src/hooks/firewall/intent-classifier.ts
cp $BOILER/src/core/firewall-context.ts   $REPO/src/hooks/firewall/firewall-context.ts
cp $BOILER/src/core/layer-engine.ts       $REPO/src/hooks/firewall/layer-engine.ts
cp $BOILER/src/core/block-response.ts     $REPO/src/hooks/firewall/block-response.ts
cp $BOILER/src/core/evidence-gate.ts      $REPO/src/hooks/firewall/evidence-gate.ts
cp $BOILER/src/core/firewall-audit.ts     $REPO/src/hooks/firewall/firewall-audit.ts
cp $BOILER/src/core/index.ts              $REPO/src/hooks/firewall/index.ts

# Copy layers (16 files)
cp $BOILER/src/layers/*.ts               $REPO/src/hooks/firewall/layers/

# Fix layer import paths: '../core/' → '../'
for f in $REPO/src/hooks/firewall/layers/*.ts; do
  sed -i "s|'../core/types.js'|'../types.js'|g" "$f"
done

# Copy firewall tools
cp $BOILER/src/tools/firewall-status.ts     $REPO/src/tools/firewall-status.ts
cp $BOILER/src/tools/firewall-audit-tool.ts $REPO/src/tools/firewall-audit-tool.ts

# Bump version
sed -i 's/"4.8.3"/"4.8.4"/' $REPO/package.json
```

**GUARDRAIL:** After the copy, run this verification:
```bash
diff -r $BASELINE/src/hooks/v4.1/ $REPO/src/hooks/v4.1/
# Should show ONLY guardian-hook.ts and index.ts as different
diff -r $BASELINE/src/shared/ $REPO/src/shared/
# Should show ONLY state-store.ts as different (or none)
diff $BASELINE/src/shark/macro/brains.ts $REPO/src/shark/macro/brains.ts
# MUST SHOW: No differences. brains.ts is PRESERVED.
```

### PHASE 2: Apply Modifications (ONLY 3 FILES)

#### 2a: guardian-hook.ts — ADD firewall engine

Only modify `src/hooks/v4.1/guardian-hook.ts`. The v4.7 code (lines 1-213 of
the original) must remain 100% untouched. Changes are:

1. **Top of file:** Add firewall imports AFTER the existing `CROSS_AGENT_TOOLS`
   import on line 22:
   ```
   import * as path from 'node:path';
   import { IntentClassifier } from '../firewall/intent-classifier.js';
   import { buildContext } from '../firewall/firewall-context.js';
   import { LayerEngine } from '../firewall/layer-engine.js';
   import { EvidenceGate } from '../firewall/evidence-gate.js';
   import { FirewallAudit } from '../firewall/firewall-audit.js';
   import { createBlockResponse, StructuredBlockError } from '../firewall/block-response.js';
   import { DEFAULT_LAYERS } from '../firewall/layers/index.js';
   ```

2. **Before the L0-L4 checks section:** Add lazy singleton initializers
   (after WRONG_CONTAINER_PATTERNS, before "L0-L4 COMMAND CHECKS"):
   ```
   let _classifier: IntentClassifier | null = null;
   let _layerEngine: LayerEngine | null = null;
   let _auditLogger: FirewallAudit | null = null;

   function getClassifier(): IntentClassifier { ... }
   function getLayerEngine(): LayerEngine { ... }
   function getAuditLogger(): FirewallAudit { ... }
   ```

3. **Inside the hook function, at the very end (after the source file modify
   check, before the closing `};`):** Add the firewall layer engine block.

4. **The catch block MUST re-throw StructuredBlockError:**
   ```typescript
   } catch (err) {
     if (err instanceof StructuredBlockError) throw err;
     // Silently absorb firewall engine errors — never break the hook
   }
   ```

#### 2b: index.ts — ADD firewall tools

1. Add imports for `createFirewallStatusTool` and `createFirewallAuditTool`
   after the existing `createSharkTestRunnerTool` import (line 20)
2. Create `fwStatusTool` and `fwAuditTool` after `testRunnerTool` (line 49)
3. Register tools in the `tool` map (lines 57-63)
4. Register tools in the agent config's `tools` block (lines 76-82)
5. Add Kraken tool denials in the `tools` block — 25 `false` entries for
   all Kraken orchestration tools

#### 2c: state-store.ts (optional) — ADD firewall state domain

Add `FirewallSessionState` interface and `FirewallStateStore` class at the
end of the file. This is OPTIONAL — the existing `agent-state.ts` already
handles agent identity tracking.

#### 2d: package.json — bump version to 4.8.4

Already done in Phase 1 via sed. Verify.

### PHASE 3: GUARDRAILS — VERIFY BEFORE BUILDING

Run these checks BEFORE running `npm run build`:

```bash
# CHECK 1: brains.ts must be identical to v4.8.3
diff /home/leviathan/OPENCODE_WORKSPACE/shark-agent-v4.8.3-REPO/src/shark/macro/brains.ts \
     /home/leviathan/OPENCODE_WORKSPACE/shark-agent-v4.8.4-REPO/src/shark/macro/brains.ts
# EXPECTED: No differences — FAIL if different

# CHECK 2: Only modified files should differ
for f in $(find /home/leviathan/OPENCODE_WORKSPACE/shark-agent-v4.8.3-REPO/src -name "*.ts" | sort); do
  REL=${f#/home/leviathan/OPENCODE_WORKSPACE/shark-agent-v4.8.3-REPO/src/}
  CURRENT="/home/leviathan/OPENCODE_WORKSPACE/shark-agent-v4.8.4-REPO/src/$REL"
  if [ -f "$CURRENT" ]; then
    diff -q "$f" "$CURRENT" > /dev/null 2>&1 || echo "CHANGED: $REL"
  fi
done
# EXPECTED: ONLY guardian-hook.ts, index.ts, state-store.ts show as CHANGED
# Plus v4.1/index.ts (version comment cosmetic only)

# CHECK 3: No stale '../core/' imports in layers
grep -rn "'../core/" /home/leviathan/OPENCODE_WORKSPACE/shark-agent-v4.8.4-REPO/src/hooks/firewall/layers/
# EXPECTED: No matches — FAIL if any found

# CHECK 4: Triple-brain content must be in the source
grep -c "Triple-brain parallel" /home/leviathan/OPENCODE_WORKSPACE/shark-agent-v4.8.4-REPO/src/shark/macro/brains.ts
# EXPECTED: > 0 — FAIL if 0

# CHECK 5: "NOT USED" must NOT be in brains.ts
grep -c "NOT USED" /home/leviathan/OPENCODE_WORKSPACE/shark-agent-v4.8.4-REPO/src/shark/macro/brains.ts
# EXPECTED: 0 — FAIL if > 0
```

### PHASE 4: BUILD

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/shark-agent-v4.8.4-REPO
npm run build
# EXPECTED: "Bundled 122 modules in XXms" with 0 errors
# FAIL if any module fails to resolve
```

After build, verify dist:
```bash
# CHECK 1: Triple-brain still in bundle
grep -c "Triple-brain parallel" dist/index.js
# EXPECTED: > 0

# CHECK 2: Kraken tool denials in bundle
grep -c "get_agent_status.*false" dist/index.js
# EXPECTED: 1

# CHECK 3: "SINGLE BRAIN" NOT in bundle
grep -c "SINGLE BRAIN" dist/index.js
# EXPECTED: 0

# CHECK 4: "NOT USED" NOT in bundle
grep -c "NOT USED" dist/index.js
# EXPECTED: 0

# CHECK 5: Firewall symbols present
grep -c "StructuredBlockError" dist/index.js
grep -c "instanceof.*StructuredBlockError" dist/index.js
# EXPECTED: Both > 0
```

### PHASE 5: CONTAINER TUI TEST

Use `opencode-test:1.14.29` container image. Test method: tmux + docker exec.
Do NOT use `opencode run` (it doesn't fire hooks).

```bash
TEST_DIR=/tmp/shark-v484-test-$(date +%s)
mkdir -p $TEST_DIR/config/plugins/shark-v4.8.4/dist
cp dist/index.js $TEST_DIR/config/plugins/shark-v4.8.4/dist/

cat > $TEST_DIR/config/opencode.json << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "provider": { "deepseek": {} },
  "plugin": [
    "file:///root/.config/opencode/plugins/shark-v4.8.4/dist/index.js"
  ]
}
EOF

CID=$(docker run -d --rm --entrypoint /bin/bash \
  -v $TEST_DIR/config:/root/.config/opencode \
  -e DEEPSEEK_API_KEY \
  opencode-test:1.14.29 -c "sleep 3600")

tmux new-session -d -s shark-v484 "docker exec -it $CID timeout 1800 opencode --agent shark"
sleep 8
tmux send-keys -t shark-v484 Escape
```

**6 CRITICAL TESTS:**

| # | Test | Send This | Expected Result |
|---|------|-----------|----------------|
| 1 | Agent boots | `hello` | Agent responds "Shark Agent" with identity intact |
| 2 | No Kraken bleed | Ask to "check system status" | Agent uses shark-* tools only. Does NOT call `get_agent_status` or `kraken_brain_status` |
| 3 | Firewall tools | `firewall-status` | Shows 15 layers, 0 entries |
| 4 | L5.2 enforcement | `shark-gate action=advance gate=plan notes="trust me it works"` | FIREWALL L5.2 BLOCKED message. Audit entry in `.shark/firewall-audit.jsonl` |
| 5 | False positive | `mkdir -p /tmp/test` | NOT blocked by firewall. Audit count unchanged |
| 6 | Gate control | `shark-gate action=status` | Shows 6 gates all pending |

After tests:
```bash
docker exec $CID cat .shark/firewall-audit.jsonl
# Must contain at least the L5.2 block entry with StructuredBlockError correction
docker kill $CID
tmux kill-session -t shark-v484
```

### PHASE 6: DEPLOY

```bash
cp dist/index.js ~/.config/opencode/plugins/shark-v4.8.4/dist/index.js
cp package.json ~/.config/opencode/plugins/shark-v4.8.4/package.json
```

### PHASE 7: DOCUMENT

Write checkpoint-4 to:
`/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Active Projects/Shark Agent v4.8.4/CHECKPOINT-4.md`

Include: build result, guardrail check results, test results, audit log entries.

---

## CRITICAL RULES (DO NOT VIOLATE)

1. **DO NOT TOUCH brains.ts.** It is PRESERVED. Bytes must match v4.8.3 exactly.

2. **DO NOT TOUCH any PRESERVED file** unless it's in the modification list
   (guardian-hook.ts, index.ts, state-store.ts).

3. **Triple-brain IS the architecture.** The shark has EXECUTION, REASONING,
   SYSTEM, and PLAN brains internally. These are separate thinking modes
   within ONE agent, NOT external sub-agents. "NO SUB-AGENTS. NOT KRAKEN.
   NOT A CLUSTER. STANDALONE." refers to EXTERNAL orchestration.

4. **The ACTUAL bug was Kraken tool bleed.** Fix it with `false` entries in
   the config handler. Nothing else.

5. **The guardian-hook.ts catch block MUST re-throw StructuredBlockError.** The
   previous build fixed this correctly. Without this, the firewall logs blocks
   but doesn't enforce them.

6. **V4.7 code stays.** Every line of the original v4.7 hooks, check patterns,
   and function signatures must be preserved. Only ADD on top.

7. **Run all guardrail checks before building.** If any guardrail fails, STOP
   and fix before proceeding.

---

## FILE MANIFEST (verbatim from BUILD_WORKFLOW_ANCHOR)

| File | Status | Action |
|------|--------|--------|
| `src/index.ts` | MODIFIED | ADD firewall tools + Kraken denials |
| `src/shared/state-store.ts` | MODIFIED | ADD FirewallSessionState (optional) |
| `src/hooks/v4.1/index.ts` | PRESERVED | Zero changes |
| `src/hooks/v4.1/guardian-hook.ts` | MODIFIED | ADD firewall layer engine |
| `src/hooks/v4.1/*.ts` (all other hooks) | PRESERVED | Zero changes |
| `src/shared/*.ts` (all except state-store) | PRESERVED | Zero changes |
| `src/tools/*.ts` (all 8 tool files) | PRESERVED | Zero changes (firewall tools are NEW, not PRESERVED) |
| `src/tools/firewall-status.ts` | NEW | From boilerplate |
| `src/tools/firewall-audit-tool.ts` | NEW | From boilerplate |
| `src/hooks/firewall/*.ts` (8 files) | NEW | From boilerplate |
| `src/hooks/firewall/layers/*.ts` (16 files) | NEW | From boilerplate |
| `src/shark/macro/brains.ts` | **PRESERVED** | **DO NOT TOUCH** |
| `src/shark/macro/peer-dispatch.ts` | PRESERVED | Zero changes |
| `package.json` | MODIFIED | Bump version to 4.8.4 |

---

## KEY FAILURE MODE TO AVOID

**The performing model will feel an urge to "fix" the triple-brain prompts**
because they reference v4.8.3 and list 5 tools instead of 7. This is NOT
a bug. The model discovers tools at runtime through OpenCode's tool registry.
The prompt tool list is identity documentation, not a functional constraint.
**DO NOT MODIFY brains.ts.** Period.

**The performing model may think it needs to "simplify" or "modernize" the
architecture.** The multi-brain single agent architecture is deliberate and
tested. Do not change it. Only add the firewall engine.
