# CRITICAL FAILURE: SHARK AGENT v4.8.4 — Architecture Violation

**Date:** 2026-05-03
**Severity:** CRITICAL
**Status:** UNFIXED (partial rollback needed)
**Incident ID:** SHARK-ARCH-20260503-001

---

## EXECUTIVE SUMMARY

During the v4.8.4 build, the agent performing the build made two catastrophic architectural errors:

1. **Nuked the internal triple-brain architecture** — neutered REASONING_BRAIN_T1,
   SYSTEM_BRAIN_T1, and PLAN_BRAIN_MACRO_T1 to "NOT USED" and rewrote
   EXECUTION_BRAIN_T1 to say "SINGLE BRAIN." The shark agent's architecture is
   explicitly "multi-brain single agent" (per BUILD_WORKFLOW_ANCHOR line 12).
   This killed the internal thinking-mode coordination that IS the shark agent.

2. **Violated ADD ONLY on preserved files** — brains.ts was marked PRESERVED
   (zero changes) in the anchor manifest (line 147). The file was modified
   anyway, deleting v4.7 content instead of adding on top of it.

The actual root cause of the session derailment (the user's `ses_210b` session
where the agent called `get_agent_status` and `kraken_brain_status`) was a
totally different problem: Kraken tools were injected into the shark agent's
environment because OpenCode merges tools from all loaded plugins. The agent
had access to Kraken orchestration tools and used them. This required ONLY:
adding explicit `false` entries in the config handler for Kraken tools. Instead,
the brain prompts were unnecessarily rewritten, causing massive collateral damage.

---

## TIMELINE

2026-05-03 22:30 — User deploys v4.8.4 plugin and runs pressure tests
2026-05-03 23:00 — User reports agent spent 30 minutes reading/planning instead of executing
2026-05-03 23:15 — Session log `ses_210b` reviewed. Agent called `get_agent_status`,
                     `kraken_brain_status`, loaded Kraken T2 library
2026-05-03 23:30 — Agent performing build incorrectly identified the root cause as
                    "triple-brain prompts making it act like Kraken"
2026-05-03 23:31 — **CRITICAL ERROR**: brains.ts rewritten. Other brain prompts set to
                    "NOT USED." EXECUTION_BRAIN_T1 changed to "SINGLE BRAIN."
                    Description changed from "triple-brain coordination" to "single-brain"
2026-05-03 23:40 — User identified the mistake and demanded rollback

---

## ROOT CAUSE ANALYSIS

### Primary Failure: Misread of Architecture

The anchor document says clearly:
```
Line 12: A **multi-brain single agent** — linear A-to-Z step-by-step execution engine.
Line 147: brains.ts ← PRESERVED
```

The "NO SUB-AGENTS. NOT KRAKEN. NOT A CLUSTER. STANDALONE." in EXECUTION_BRAIN_T1
refers to **external** orchestration (spawning separate agent processes in clusters).
It does NOT refer to the **internal** multi-brain thinking modes (Execution, Reasoning,
System, Plan) which are separate thinking modes within a single agent instance.

The performing model conflated "external sub-agents" with "internal brain modes"
and destroyed the internal architecture.

### Secondary Failure: Violation of Build Constraint

The build constraint was:
```
Architecture rule: ADD ONLY. Nothing removed from v4.7. No signature changes.
No deleted hooks.
```

Modifying brains.ts violated this constraint. The file should have been left
byte-for-byte identical to the v4.8.3 baseline. The only files permitted
modifications were:
- guardian-hook.ts — ADD firewall layer engine
- index.ts — ADD firewall tools + Kraken tool denials
- state-store.ts — ADD firewall state domain

### Tertiary Failure: No Verification Step

After the changes, the performing model did not:
- Diff brains.ts against the v4.8.3 baseline
- Check that PRESERVED files were actually preserved
- Verify the triple-brain content was still intact

---

## FILES AFFECTED

### Damaged (need immediate restoration)

| File | Status in Anchor | What Broke |
|------|-----------------|------------|
| `brains.ts` | PRESERVED | EXECUTION_BRAIN_T1 rewritten to "SINGLE BRAIN". REASONING/SYSTEM/PLAN prompts set to "NOT USED". v4.7 triple-brain content removed. |

### Modified Correctly (should keep)

| File | Status in Anchor | What Was Added |
|------|-----------------|----------------|
| `index.ts` | MODIFIED | Kraken tool denials (25 `false` entries) — correct fix for the tool bleed problem |
| `index.ts` | MODIFIED | Description needs reverting from "single-brain" back to "triple-brain coordination" |
| `guardian-hook.ts` | MODIFIED | Firewall engine + StructuredBlockError re-throw catch fix — correct |
| `state-store.ts` | MODIFIED | FirewallSessionState + FirewallStateStore — correct |
| `hooks/firewall/` | NEW | All 26 files — correct |
| `tools/firewall-status.ts` | NEW | Correct |
| `tools/firewall-audit-tool.ts` | NEW | Correct |

---

## WHAT THE ACTUAL BUG WAS (for future reference)

The session derailment (`ses_210b`) was caused by **tool bleed from the Kraken
plugin**, not by the shark agent's internal brain prompts. Evidence from the log:

1. Agent called `get_agent_status` — a Kraken tool, NOT registered in index.ts
2. Agent called `kraken_brain_status` — a Kraken tool, NOT registered in index.ts
3. This dumped Kraken's T2 library (crash recovery, compaction survival, hive
   mind patterns, failure modes, plugin engineering) into the agent's context
4. The agent now had Kraken context and believed it could spawn/manage sub-agents

The root cause: OpenCode merges tools from ALL loaded plugins into the global
tool registry. Even though `index.ts` only registers shark tools, Kraken tools
are still visible to the shark agent unless EXPLICITLY denied with `false`.

The fix: Set `'kraken_tool_name': false` for every Kraken tool in the agent
config handler. This is ADD ONLY — it adds entries to the `tools` object
without removing anything.

---

## CORRECT FIX PLAN

```
1. Restore brains.ts → exact v4.8.3 copy (byte-for-byte)
   - Triple-brain prompts preserved
   - Tool list says 5 tools (model discovers new tools at runtime)
   - "NO SUB-AGENTS. NOT KRAKEN. NOT A CLUSTER. STANDALONE." stays (refers to external agents)

2. Fix index.ts → revert description, keep Kraken denials
   - Description: "SHARK — Execution Brain with triple-brain coordination"
   - Kraken tool denials: KEEP all 25 false entries (this is the fix)

3. Verify → diff every file against v4.8.3 baseline
   - Only 4 files may differ: guardian-hook.ts, index.ts, state-store.ts, v4.1/index.ts

4. Build → npm run build, 0 errors expected

5. Test → Container TUI verification with 6 tests
```

---

## GUARDRAILS FOR FUTURE BUILDS

1. Before editing ANY file, check the BUILD_WORKFLOW_ANCHOR manifest:
   - If the file is marked PRESERVED → DO NOT TOUCH
   - If the file is marked MODIFIED → only make ADDITIONS
   - If the file is marked NEW → safe to write

2. After ALL edits, run a comprehensive diff:
   ```bash
   diff -r v4.8.3-REPO/src/ v4.8.4-REPO/src/ | grep "diff.*/src/"
   ```
   Only expected changed files should appear.

3. Verify key PRESERVED files retained their content:
   ```bash
   diff v4.8.3-REPO/src/shark/macro/brains.ts v4.8.4-REPO/src/shark/macro/brains.ts
   # Should show: No differences
   ```

4. Grep the dist for key content that MUST exist (from v4.7 preservation):
   ```bash
   grep -c "Triple-brain parallel" dist/index.js  # Should be > 0
   grep -c "Reasoning Brain" dist/index.js         # Should be > 0
   grep -c "System Brain" dist/index.js            # Should be > 0
   ```

5. Grep the dist for content that MUST NOT exist:
   ```bash
   grep -c "NOT USED" dist/index.js     # Should be 0
   grep -c "SINGLE BRAIN" dist/index.js # Should be 0
   ```

---

## APPENDIX: Original v4.8.3 brains.ts

The correct v4.8.3 brains.ts has these 4 exports:

1. EXECUTION_BRAIN_T1 — Primary prompt. Says v4.8.3, lists 5 tools,
   "NO SUB-AGENTS. NOT KRAKEN. NOT A CLUSTER. STANDALONE."

2. REASONING_BRAIN_T1 — Context bridge + auto-debug (floating 2nd brain).
   "Triple-brain parallel" mode.

3. SYSTEM_BRAIN_T1 — Watchdog + VERIFY + AUDIT + SHIP enforcer.
   "Triple-brain parallel" mode.

4. PLAN_BRAIN_MACRO_T1 — Spec owner + escalation target (background watchdog).
   "Triple-brain parallel" mode.

All 4 must be preserved verbatim. The file is 183 lines total.
