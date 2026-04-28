# DEBUG LOGS INDEX

**Last Updated:** 2026-04-05
**Purpose:** Centralized index of all debug logs, forensic reports, and failure analyses

---

## DIRECTORY STRUCTURE

```
DEBUG LOGS/
├── 01-spider-agent/          # Spider Agent debug logs
├── 02-hermes-agent/          # Hermes Agent debug logs
├── 03-hive-mind/             # Hive Mind Plugin debug logs
├── 04-opencode-vanilla/      # OpenCode Vanilla debug logs
├── 05-plugin-engineering/    # Plugin Engineering debug logs
├── 06-system-failures/       # System-wide failure logs
└── 07-architecture/          # Architecture debug plans & audits
```

---

## 01-spider-agent/

| File | Date | Description |
|------|------|-------------|
| `FALLBACK_HOTFIX_DEBUG.md` | 2026-04-02 | Model fallback hotfix debugging |
| `COMPLETE_DEBUG_LOG.md` | 2026-04-03 | Complete Spider Agent debug log |
| `SPIDER_AGENT_FORENSIC_REPORT.md` | 2026-04-03 | Forensic report on Spider Agent internals |
| `SPIDER_AGENT_FORENSIC_SOURCE_DECODED.md` | 2026-04-03 | Source code forensic analysis |
| `SYSTEM_FAILURE_DEBUG_LOG_20260405.md` | 2026-04-05 | System failure: brainstorm gate block |

## 02-hermes-agent/

| File | Date | Description |
|------|------|-------------|
| `GUARDIAN_FIREWALL_BUG_HANDOVER.md` | 2026-04-04 | Guardian firewall bug handover |
| `GUARDIAN_FIREWALL_FAILURE_LOG.md` | 2026-04-04 | Guardian firewall failure log |
| `v2.1-BUILD_DEBUG_LOG.md` | 2026-04-04 | Hermes v2.1 build debug log |
| `v2.2-BUILD_DEBUG_LOG.md` | 2026-04-04 | Hermes v2.2 build debug log |
| `v2.3-BUILD_DEBUG_LOG.md` | 2026-04-04 | Hermes v2.3 build debug log |

## 03-hive-mind/

| File | Date | Description |
|------|------|-------------|
| `HIVE-MIND-PLUGIN-FAILURE-LOG.md` | 2026-04-03 | Hive Mind plugin failure log |
| `HIVE-MIND-DEBUG-LOG-v4.md` | 2026-04-03 | Hive Mind v4 debug log |
| `HIVE-MIND-PLUGIN-FAILURE-LOG_CRITICAL.md` | 2026-04-03 | Critical failure log |
| `HIVE-MIND-DEBUG-LOG_CRITICAL.md` | 2026-04-03 | Critical debug log |

## 04-opencode-vanilla/

| File | Date | Description |
|------|------|-------------|
| `OPENCODE_CONFIG_MIGRATION_BUG_20260329.md` | 2026-03-29 | Config migration bug |
| `BUILD_AGENT_WRITE_BLOCKING_FAILURE_DEBUG_LOG.md` | 2026-04-03 | Build agent write blocking failure |
| `TAB_TOGGLE_BUILD_DEBUG_LOG.md` | 2026-04-03 | Tab toggle build debug log |
| `opencode.json.BEFORE_FIX_20260405` | 2026-04-05 | Backup of opencode.json before fixes |

## 05-plugin-engineering/

| File | Date | Description |
|------|------|-------------|
| `OPENCODE_ENGINE_FORENSIC_ANALYSIS.md` | 2026-04-03 | OpenCode engine forensic analysis |

## 06-system-failures/

| File | Date | Description |
|------|------|-------------|
| `REASONING_BRAIN_CRITICAL_FAILURE_REPORT.md` | 2026-04-01 | Reasoning brain critical failure |
| `REASONING_BRAIN_CRITICAL_FAILURE_REPORT_CRITICAL.md` | 2026-04-01 | Critical failure report (duplicate) |
| `FIREWALL_CRASH_TEST_REPORT.md` | 2026-04-02 | Firewall crash test report |
| `HARDWARE_DEBUG_LOG.md` | 2026-03-30 | Hardware debug log |

## 07-architecture/

| File | Date | Description |
|------|------|-------------|
| `BROKEN_PLUGINS_AUDIT_20260405.md` | 2026-04-05 | Audit of broken plugins (hive-mind, path=list) |
| `ARCHITECTURE_DEBUG_PLAN_PLUGIN_ISOLATION.md` | 2026-04-05 | Plugin isolation architecture plan for v4 boilerplate |
| `VERIFICATION_REPORT_20260405.md` | 2026-04-05 | Verification that all fixes work, firewall confirmed |
| `CROSS-PLUGIN-ARCHITECTURE-AUDIT.md` | 2026-04-05 | **NEW** - Comprehensive analysis of plugin conflicts, isolation, and synchronization |

---

## KEY FINDINGS SUMMARY

### Critical Issues Fixed
1. **Hermes brainstorm gate blocking Spider Agent** - DISABLED with early `return;` (line 132 of Hermes dist/index.js). The gate was blocking Spider Agent because Hermes's `_currentPhase` global stays "idle" forever while Spider Agent runs (Spider has its own phase system: SPECIFY/PLAN/EXECUTE)
2. **Agent Swarm context pollution** - Disabled MCP connection, removed 20+ tools, cleaned AGENTS.md
3. **Hive Mind Plugin silent failure** - Removed from opencode.json (missing @opencode-ai/plugin dependency)
4. **Vanilla OpenCode broken** - Re-enabled explore/general agents, fixed plan agent color

### Root Causes Identified
1. **No plugin isolation** - Multiple plugins hooking into same events without conflict detection
2. **No agent awareness** - Hermes's `createBrainstormGateHook()` doesn't check which agent is active
3. **No phase synchronization** - Each plugin tracks phases independently (Hermes: IDLE/ANALYZE/PLAN, Spider: SPECIFY/PLAN/EXECUTE)
4. **Module-level global state** - Hermes `_currentPhase` persists across sessions, never synced with Spider phases
5. **Silent plugin failures** - Broken plugins fail silently at startup

### Prevention
- See `07-architecture/CROSS-PLUGIN-ARCHITECTURE-AUDIT.md` for detailed analysis and v4 boilerplate solution

---

## HOW TO USE

1. **Debugging a plugin issue**: Start with `07-architecture/CROSS-PLUGIN-ARCHITECTURE-AUDIT.md`
2. **Understanding Spider Agent failures**: Check `01-spider-agent/`
3. **Understanding Hermes Agent failures**: Check `02-hermes-agent/`
4. **Understanding plugin architecture**: Check `07-architecture/CROSS-PLUGIN-ARCHITECTURE-AUDIT.md` (comprehensive)
5. **Adding a new plugin**: Read the prevention checklist in the architecture audit

---

*This index is automatically updated when new debug logs are added to the DEBUG LOGS folder.*
