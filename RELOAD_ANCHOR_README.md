# SHARK AGENT v4.8.4 — NUKE RELOAD ANCHOR

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/NUKE RELOAD/v4.8.4`
**Version:** 4.8.4-v3-hotfix
**Bundle:** `dist/index.js` (668KB, 18931 lines, verified working)
**Status:** SHIP READY ✅

---

## WHAT THIS ANCHOR IS

This is the **fallback restore point** for Shark Agent v4.8.4. If the plugin ever gets corrupted, nuke-reloaded, or needs emergency recovery, use this anchor to rebuild from scratch.

**Contains:**
- `src/` — Complete TypeScript source (18 .ts files + 16 firewall layers)
- `dist/index.js` — Working bundle (rebuilt from source after L0 fix)
- `docs/` — Complete documentation (README, BUILD_LOG, DEBUG_LOG, COMPACTION_SURVIVAL, VERSION_HISTORY)
- `T2_clean_slate/` — Self-contained build prompts for full rebuild

---

## CRITICAL FIXES BAKED IN

### L0 Blocking Logic (v3-hotfix)
**Problem:** v3 bundle had INVERTED L0 logic — blocked NON-Shark, allowed Shark bash

**Fix:** `if (isShark && DANGEROUS_TOOLS.has(tool))` — blocks Shark dangerous tools

**File:** `src/hooks/v4.1/guardian-hook.ts:2914`

### Source vs Bundle Discrepancy
**Problem:** v3 bundle was built from stale source before fixes were applied

**Fix:** Rebuilt bundle from current source. Bundle now matches source.

---

## QUICK RESTORE

### Option 1: Use working bundle directly
```bash
PLUGIN_DIR="$HOME/.config/opencode/plugins/shark-agent"
mkdir -p "$PLUGIN_DIR/dist"
cp "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/NUKE RELOAD/v4.8.4/dist/index.js" "$PLUGIN_DIR/dist/index.js"
```

### Option 2: Rebuild from source
```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/NUKE RELOAD/v4.8.4"
bun run build  # if you have the build setup
# Or use T2_clean_slate/03_SELF_CONTAINED_BUILD_PROMPT.md
```

---

## DIRECTORY STRUCTURE

```
v4.8.4/
├── src/                          # Complete TypeScript source
│   ├── index.ts                  # Plugin entry point
│   ├── hooks/
│   │   ├── v4.1/                 # All hooks (guardian, session, etc.)
│   │   └── firewall/            # Firewall engine
│   │       ├── layer-engine.ts  # Core evaluation engine
│   │       ├── layers/          # L0-L5.11 layer definitions (16 files)
│   │       ├── intent-classifier.ts
│   │       ├── firewall-context.ts
│   │       ├── evidence-gate.ts
│   │       ├── firewall-audit.ts
│   │       └── block-response.ts
│   ├── shared/                   # Shared utilities
│   │   ├── guardian.ts          # Zone protection
│   │   ├── firewall-patterns.ts # Pattern definitions
│   │   ├── agent-identity.ts    # isSharkAgent()
│   │   └── ...
│   ├── tools/                   # shark-status, shark-gate, etc.
│   └── shark/macro/            # Triple-brain architecture
│       └── brains.ts            # PRESERVED — do not modify
├── dist/
│   └── index.js                 # Working bundle (668KB)
├── docs/                        # Complete documentation
│   ├── 01_SHARK_V4.8.4_README.md
│   ├── 02_BUILD_LOG.md
│   ├── 03_DEBUG_LOG.md
│   ├── 04_COMPACTION_SURVIVAL.md
│   ├── 05_VERSION_HISTORY.md
│   └── 06_FIREWALL_TEST_HARNESS.md
├── T2_clean_slate/              # Self-contained rebuild prompts
│   ├── 01_BUILD_WORKFLOW_ANCHOR.md
│   ├── 02_CLEAN_SLATE_BUILD_PROMPT.md
│   ├── 03_SELF_CONTAINED_BUILD_PROMPT.md
│   └── src/                     # Bundled baseline source
│       └── v4.8.3/             # Complete v4.8.3 baseline
│           ├── hooks/v4.1/
│           ├── shared/
│           ├── tools/
│           ├── shark/
│           └── index.ts
├── package.json
└── BUILD_AND_SHIP.md
```

---

## AGENT SCOPING (IMPORTANT)

Shark firewall ONLY affects Shark agents. Non-Shark agents (kraken, manta) pass through unchanged.

**Scoping rules:**
- `session-hook.ts` — Returns early for non-Shark agents
- `chat-message-hook.ts` — Ignores non-Shark agents
- `guardian-hook.ts` — `if (!sessionAgent) return;` + `if (isShark && DANGEROUS_TOOLS.has(tool))`
- `messages-transform-hook.ts` — `if (!isSharkAgent(msg.info.agent)) continue;`
- `command-execute-hook.ts` — `if (!isSharkAgent(agentName)) return;`

**Cross-agent tool blocking (L5.7)** applies to ALL agents (correct behavior):
- Blocks: hermes_*, hive_*, mem*, knowledge_* tools
- Prevents any agent from using inter-agent communication

---

## VERIFICATION CHECKLIST

After any restore/rebuild, verify these:

- [ ] `isShark && DANGEROUS_TOOLS.has(tool)` pattern in bundle (L0 correct)
- [ ] `getCurrentAgent(sessionID)` followed by `if (!sessionAgent) return;` (fail-open)
- [ ] `if (isShark && command)` for L2-L4 theatrical checks
- [ ] `messages-transform-hook` has `isSharkAgent()` guard
- [ ] `firewall-status` tool returns 15 layers
- [ ] Bundle has `StructuredBlockError` (firewall enforcement works)

---

## FIREWALL LAYERS (15 total)

| Layer | Name | Scope |
|-------|------|-------|
| L0 | Identity Wall | Shark only — blocks dangerous tools |
| L1 | Theatrical Counting | Shark only — blocks pipe-to-wc |
| L2 | Test Bypass | Shark only — blocks fake test runners |
| L3 | Source Inspection | Shark only — blocks file-existence-as-proof |
| L4 | Wrong Container | Shark only — blocks opencode container commands |
| L5.1 | Host Fallback | Shark only — blocks host testing excuses |
| L5.2 | Success Claim | Shark only — evidence-gated |
| L5.3 | Model Restriction | Shark only |
| L5.4 | Mock/Stub | Shark only — evidence-gated |
| L5.5 | Simplification | Shark only |
| L5.6 | Confusion | Shark only |
| L5.7 | Scope Creep | Shark + ALL (cross-agent tool blocking) |
| L5.8 | Undermining | Shark only |
| L5.9 | Impatience | Shark only |
| L5.10 | Self-Reference | Shark only — evidence-gated |
| L5.11 | Progress Laundering | Shark only — in messages-transform-hook |

---

## IF ALL ELSE FAILS — FULL REBUILD

Use `T2_clean_slate/03_SELF_CONTAINED_BUILD_PROMPT.md` — it contains:
- Complete v4.8.3 baseline source tree (no external dependencies)
- Step-by-step build instructions
- Guardrail checks to verify correctness
- Container test commands

---

**Last Updated:** 2026-05-07
**Status:** RELOAD ANCHOR READY ✅