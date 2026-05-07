# SHARK AGENT v4.8.4 — VERSION HISTORY
## Restorable Build Stages

**Purpose:** This document tracks the version history of Shark Agent ship packages, allowing restoration to specific build stages if corruption occurs.

---

## VERSION OVERVIEW

| Version | Name | Purpose | Status |
|---------|------|---------|--------|
| v1 | Base Agent | Initial shark implementation | DEPRECATED |
| v2 | Anti-Laundering Foundation | L5.11 patterns, basic laundering blocks | SUPERSEDED |
| v3 | Intelligent Firewall Overhaul | Full contextual gates, agent isolation, semantic validation | **CURRENT** |

---

## V1: Base Agent (Deprecated)
**Location:** N/A (deprecated)
**Purpose:** Initial shark implementation without advanced firewall

**Characteristics:**
- No L5.11 anti-laundering
- No contextual gate awareness
- Basic tool blocking only

**Do not use for new builds.**

---

## V2: Anti-Laundering Foundation
**Location:** `ship-package-v2/`
**Purpose:** First major firewall upgrade - introduced L5.11 patterns

**Characteristics:**
- ✅ LAUNDERING_PATTERNS array (5 initial patterns)
- ✅ messages-transform hook with L5.11 detection
- ✅ Session-based agent tracking (agent-state.ts)
- ❌ No contextual gate awareness
- ❌ No agent isolation
- ❌ No semantic evidence validation

**Restoration:**
```bash
cp ship-package-v2/dist/index.js /path/to/plugins/shark-agent/dist/index.js
```

**Incremental upgrade path to v3:**
1. Add CONTEXTUAL_FIREWALL_RULES to firewall-patterns.ts
2. Implement evaluateContextualRule() in guardian-hook.ts
3. Add agent isolation (if (!sessionAgent) return;)
4. Add EvidenceGate for semantic validation

---

## V3: Intelligent Firewall Overhaul (Current)
**Location:** `ship-package-v3-final/`
**Purpose:** Full contextual enforcement with agent isolation

**Characteristics:**
- ✅ Contextual Gate Awareness (L0-L4 change behavior per currentGate)
- ✅ Agent Isolation (fail-open for non-Shark agents)
- ✅ Semantic Evidence Validation (passRate >= 0.96)
- ✅ Zone-based Protection (L6)
- ✅ Expanded L5.11 patterns (13 patterns)
- ✅ Launder-blocking verified (13/13 tests pass)
- ✅ Zero Kraken orchestrator patterns in bundle

**Bundle Hash:** dc172fd5b512a19c86283743a505a300

**Verification:**
```bash
bun run SHARK_V4.8.4_VERIFICATION_HARNESS.ts
# Expected: 13/13 tests passed
```

---

## ROLLBACK PROCEDURE

If v3 becomes corrupted:

1. **Immediate rollback to v2:**
   ```bash
   cp ship-package-v2/dist/index.js /path/to/plugins/shark-agent/dist/index.js
   ```

2. **Incremental v2 → v3 rebuild:**
   - Apply v3 changes one at a time
   - Run verification harness after each change
   - Do NOT skip steps - each incremental change must pass tests

3. **Full rebuild from T2_clean_slate:**
   ```bash
   # Use the .md prompt files in T2_clean_slate/
   # 01_BUILD_WORKFLOW_ANCHOR.md - workflow structure
   # 02_CLEAN_SLATE_BUILD_PROMPT.md - clean rebuild instructions
   # 03_SELF_CONTAINED_BUILD_PROMPT.md - complete self-contained build
   ```

---

## VERSION-SPECIFIC DOCUMENTATION

- `ship-package-v2/README.md` - V2 overview and limitations
- `ship-package-v2/BUILD_LOG.md` - V2 engineering history
- `ship-package-v3-final/README.md` - V3 features and installation
- `ship-package-v3-final/BUILD_LOG.md` - V3 engineering history

---

## BUNDLE VERIFICATION

Each version's bundle can be verified by its hash:

| Version | File | Hash |
|---------|------|------|
| v2 | ship-package-v2/dist/index.js | (same as v3 - v2 was incremental overlay) |
| v3 | ship-package-v3-final/dist/index.js | dc172fd5b512a19c86283743a505a300 |

---

**Last Updated:** 2026-05-07
**Current Stable:** v3