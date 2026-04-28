# Shark Agent V4.7 — Build Journey Documentation

**Created:** 2026-04-08  
**Current Version:** V4.7  
**Status:** Active Development  

---

## Table of Contents

1. [Origin Story: The Three Pillars](#1-origin-story-the-three-pillars)
2. [Guardian Firewall - The Foundation](#2-guardian-firewall---the-foundation)
3. [Original Shark Agent Architecture](#3-original-shark-agent-architecture)
4. [Shark Frankenstein - The Unification](#4-shark-frankenstein---the-unification)
5. [OpenCode Plugin Evolution (V4.0 - V4.7)](#5-opencode-plugin-evolution-v40---v47)
6. [Manta-Shark Split (V4.6)](#6-manta-shark-split-v46)
7. [V4.7 System Brain Guardian Upgrade](#7-v47-system-brain-guardian-upgrade)
8. [Current Architecture](#8-current-architecture)
9. [Key Lessons & Patterns](#9-key-lessons--patterns)

---

## 1. Origin Story: The Three Pillars

The system you are currently in (Shark Agent V4.7) is the product of a multi-year evolution driven by one core insight: **AI agents without mechanical constraints produce hallucinated outputs and theatrical (mock/simulate/placeholder) code**.

The build journey traces through three foundational repositories:

### 1.1 The Three Original Repositories

| Repository | URL | Purpose |
|------------|-----|---------|
| **Guardian Firewall** | https://github.com/leviathan-devops/guardian-firewall | Zone-based filesystem protection system |
| **Shark Agent** | https://github.com/leviathan-devops/shark-agent | Dual-brain agent architecture (local + cloud reasoning) |
| **Shark Frankenstein** | Local evolution of shark-agent | Unification of safety stack with OpenCode integration |

### 1.2 The Core Problem Being Solved

```
AI Autonomy (Water) + No Constraints = Hallucination, Theatrical Code, Scope Drift

AI Autonomy (Water) + Mechanical Enforcement (Riverbanks) = Constrained Flow with Purpose
```

This "Earth Density & River Flow" philosophy became the foundation of all architectural decisions.

---

## 2. Guardian Firewall - The Foundation

**Repository:** https://github.com/leviathan-devops/guardian-firewall

### 2.1 Purpose
The Guardian Firewall provides zone-based filesystem protection that prevents agents from performing dangerous or unauthorized file operations.

### 2.2 Zone Classification System

| Zone | Paths | Access Level |
|------|-------|--------------|
| **ZONE_SYSTEM** | `/etc`, `/usr`, `/boot`, `/lib`, `/root`, `/proc`, `/sys`, `/dev` | READ ONLY (blocks writes) |
| **ZONE_PROJECT** | Current project directory | FULL access |
| **ZONE_TEMP** | `/tmp/`, `/var/tmp/` | FULL with auto-cleanup |
| **ZONE_USER** | `~/Documents/`, `~/Downloads/`, etc. | READ/WRITE with confirmation |
| **ZONE_CUSTOM** | User-defined | Configurable |

### 2.3 Key Files
- `src/guardian/index.ts` - Main entry point
- `src/guardian/zone-classifier.ts` - Zone determination logic
- `src/guardian/operation-validator.ts` - Operation permission logic
- `src/guardian/audit-logger.ts` - Security audit logging

### 2.4 Integration Pattern
Guardian connects to **ToolExecutor** (the Constitutional Anchor) as a pre-operation hook. Every file operation passes through this check before execution.

---

## 3. Original Shark Agent Architecture

**Repository:** https://github.com/leviathan-devops/shark-agent

### 3.1 Dual-Brain Architecture

The original Shark Agent implemented a sophisticated dual-brain system separating reasoning from execution:

**Micro Engineer (Free/Local Operations):**
- **Thinker/Planner**: DeepSeek Chat (API-based reasoning) — used exclusively for planning
- **Doer/Executor**: vLLM Qwen 2.5 Coder 7B AWQ (local, zero-cost) — lobotomized execution engine

**Macro Engineer (Paid/Cloud Operations):**
- **Primary Brain**: GLM 5 (128K context window)
- **Advisory Brain**: DeepSeek R1 (complex reasoning tasks)

### 3.2 Key Innovations

1. **ToolExecutor as Constitutional Anchor**: Single chokepoint through which ALL agent actions flow, enabling mechanical enforcement of all safety systems.

2. **Five-Step Workflow Enforcement (Brick Wall)**:
   - PLAN → BUILD → TEST → VERIFY → SHIP
   - Each step requires concrete evidence to proceed
   - Agents cannot progress without proof

3. **AutoDebug System**: 47+ pattern-based error fixes, ~60% auto-fix rate for common development errors.

4. **Anti-Slop Focus**: Targets theatrical code (mock/simulate/placeholder) with warnings only, preserving legitimate development workflows.

---

## 4. Shark Frankenstein - The Unification

Shark Frankenstein represents the evolution where:
- Original Shark Agent's dual-brain architecture
- Guardian Firewall's filesystem protection
- New safety stack innovations (FirewallMesh, StagnationDetector, WorkflowBlocker)

...were integrated into a cohesive system with OpenCode as the orchestration layer.

### 4.1 Safety Stack (4-Layer Mechanical Enforcement)

| Layer | Component | Purpose |
|-------|-----------|---------|
| **Layer 1** | Guardian | Filesystem path protection |
| **Layer 2** | FirewallMesh | Parallel security screening (4 firewalls in parallel, <50ms overhead) |
| **Layer 3** | StagnationDetector | Loop prevention (3 identical failures → escalation) |
| **Layer 4** | WorkflowBlocker | PLAN→BUILD→TEST→VERIFY→SHIP brick wall |

### 4.2 Key Architecture: ToolExecutor as Constitutional Anchor

Every tool call flows through ToolExecutor, enabling:
- Pre-operation safety checks (Guardian, FirewallMesh)
- Post-operation evidence collection (GateManager, EvidenceCollector)
- Loop detection (StagnationDetector)
- Workflow enforcement (WorkflowBlocker)

---

## 5. OpenCode Plugin Evolution (V4.0 - V4.7)

### 5.1 V4.0 — The Inert Shell

**Date:** 2026-04-05  
**Status:** Archived as `shark-agent-v4.0.ts`

The V4.0 shell defined all primitives but was functionally inert:
- Guardian class defined but not wired
- GateManager defined but not connected
- EvidenceCollector defined but not used
- Coordinators (MicroCoordinator, MacroPeerDispatch) existed as classes but never invoked

**Key Issues:**
- Evidence written to wrong directory (plugin directory instead of workspace)
- Conflicting prompts in brain T1 concatenation
- Zod dependency runtime crashes

### 5.2 V4.1 — Functional Mechanical Enforcer

**Date:** 2026-04-06  
**Build Report:** `shark-agent-v4.1-build-report-2026-04-06.md`

**Changes:**
- Hooks wired via OpenCode plugin hook system (`experimental.*` prefix hooks)
- Evidence path fixed: `process.cwd() + '/.shark/'` (NOT plugin directory)
- Gate advancement automated via `tool.execute.after`
- Guardian advisory logging implemented

**Critical Discovery:** OpenCode hooks return `Promise<void>`, NOT `Promise<{ blocked?: boolean }>`. Guardian can only log warnings, cannot block. Agent self-rejection via T1 prompts became critical.

### 5.3 V4.2 — Honest Architecture

**Date:** 2026-04-06  
**Build Report:** `shark-agent-v4.2-build-report-2026-04-06.md`

**Changes:**
- Guardian documented as ADVISORY-ONLY (console.error for dangerous commands)
- Coordinator stubs replaced with honest TODO placeholders
- TypeScript verified with `npx tsc --noEmit` (0 errors)

### 5.4 V4.3 — Documentation Precision

**Date:** 2026-04-06  
**Build Report:** `shark-agent-v4.3-build-report-2026-04-06.md`

**Changes:**
- Build report accuracy fixes (removed unauthorized version commitments)
- Verification sections now show actual command output

### 5.5 V4.4 — Critical Enforcement Fixes

**Date:** 2026-04-06  
**Build Report:** `shark-agent-v4.4-build-report-2026-04-06.md`

**Critical Fixes:**
1. **MANDATORY SELF-REJECTION** added to all brain T1 prompts
2. **Dead coordinator code removed** (coordinator.ts and peer-dispatch.ts didn't exist)
3. **Iteration loop wired** — `handleVerifyFailure()` was called in gate-hook.ts

### 5.6 V4.5 — Mechanical Brain Switching

**Date:** 2026-04-07  
**Build Report:** `shark-agent-v4.5-build-report-2026-04-06.md`  
**Audit:** `shark-agent-v4-audit-002-v4.5.md`

**New Components:**
- `MicroCoordinator` class created (mechanical Plan↔Build brain switcher)
- `MacroPeerDispatch` class created (triple-brain coordination manager)
- `session-hook.ts` for coordinator initialization
- `system-transform-hook.ts` for brain context injection

**Architecture:**
```
shark-micro                    shark-macro
┌─────────────────┐            ┌─────────────────┐
│   Plan Brain    │◄──────────►│ Execution Brain │
│   (T1 prompt)   │  Mechanical │   (T1 prompt)   │
└────────┬────────┘  Switching  └────────┬────────┘
         │                     ◄──────────┼──────────┐
         ▼                               ▼          ▼
┌─────────────────┐            ┌─────────────────────────────┐
│ MicroCoordinator │            │    MacroPeerDispatch       │
│  - switchToPlan  │            │  - injectContext()         │
│  - switchToBuild │            │  - onGateTransition()      │
└────────┬────────┘            └──────────────┬──────────────┘
         │                                      │
         ▼                                      ▼
┌─────────────────────────────────────────────────────────────┐
│                        Hooks                                │
│  event: session.created → coordinator.init()                 │
│  tool.execute.before: Guardian (dangerous command check)     │
│  tool.execute.after: Gate advancement + evidence collection  │
│  experimental.chat.system.transform: Enforcement context       │
└─────────────────────────────────────────────────────────────┘
```

**Audit Findings (94.7% pass rate):**
- MICRO: 18/19 exercises passed (e014 timeout issue)
- MACRO: 7/19 passed (37% - script path quoting bug caused false passes)

### 5.7 V4.6 — Manta/Shark Split

**Date:** 2026-04-07  
**Build Report:** `manta-shark-v4.6/reports/MANTA_SHARK_AGENT_BUILD_REPORT.md`

**Critical Issue Fixed:** Cross-agent hook activation bug
- Hooks were firing for ALL agents, not just shark/manta
- `[MantaCoordinator] Initialized` appearing in spider agent sessions
- Solution: Agent identity filtering (`isMantaAgent`, `isSharkAgent`)

**Files Created:**
- `src/shared/agent-identity.ts` (both manta and shark variants)

**Files Modified:**
- All 5 hooks per plugin updated with identity checks

**Runtime Testing Results:**
- Vanilla agents (plan, build, general, explorer): 8/8 PASSED (no spillover)
- Manta agent: 5/5 PASSED
- Shark agent: 4/4 PASSED

---

## 6. V4.7 System Brain Guardian Upgrade

**Status:** DRAFT (Prerequisite: V4.6 completion)  
**Build Prompt:** `shark-agent-v4.7-system-brain-guardian-upgrade.md`

### 6.1 Purpose
Upgrade Guardian to **MECHANICALLY BLOCK** direct edits to source files. Every edit must follow: Copy → Version → Edit Copy workflow.

### 6.2 The Ironclad Rule

```
OVERWRITE = DESTROY. ALWAYS COPY, NAME WITH ITERATION, THEN EDIT.
```

### 6.3 Source File Definition

A **source file** is ANY file that meets ALL:
1. Exists in workspace before current Shark session began
2. Has source file extension (.ts, .js, .py, .rs, .go, etc.)
3. Shark agent has NO edit history for this file in session
4. File is NOT created by Shark agent in this session

### 6.4 Required Workflow

```
STEP 1: IDENTIFY source file (no edit history in session)
         ↓
STEP 2: DUPLICATE the file with version suffix
         Original: src/utils.ts
         Copy: src/utils.ts.v1.0.0
         ↓
STEP 3: VERIFY copy was created
         ↓
STEP 4: EDIT the COPY only
         → NEVER use edit tool on src/utils.ts
         ↓
STEP 5: CONFIRM edit was applied to copy
         ↓
STEP 6: Optionally REPLACE original if copy is verified working
```

### 6.5 Edit History Tracking

GuardianState maintains:
- `editedFiles: Set<string>` — files Shark has edited in session
- `createdFiles: Set<string>` — files Shark has created in session

```typescript
function canEdit(filePath: string): { allowed: boolean; reason?: string } {
  if (guardianState.createdFiles.has(filePath)) return { allowed: true };
  if (guardianState.editedFiles.has(filePath)) return { allowed: true };
  return { allowed: false, reason: 'SOURCE_FILE_NO_EDIT_HISTORY' };
}
```

### 6.6 Exclusion List (Not Source Files)

- Files created by Shark in session
- Files with no extension (Makefile, Dockerfile)
- Config files: `package.json`, `tsconfig.json`, `Cargo.toml`, etc.
- Files in `/tests/` or `/test/` directories
- Build output (`/dist/`, `/build/`, `/out/`)
- Node modules

---

## 7. Current Architecture

### 7.1 Shark Agent V4.7 Plugin Structure

```
shark-agent-v4.7/
├── src/
│   ├── index.ts                    # Plugin entry point
│   ├── shark/
│   │   ├── micro/
│   │   │   ├── coordinator.ts     # Mechanical Plan↔Build switcher
│   │   │   └── brains.ts          # Plan Brain + Build Brain T1
│   │   ├── macro/
│   │   │   ├── peer-dispatch.ts   # Triple-brain coordinator
│   │   │   └── brains.ts          # Execution + Reasoning + System T1
│   │   └── shared/
│   │       ├── state-store.ts     # Domain ownership state
│   │       ├── messenger.ts       # Priority messaging
│   │       ├── guardian.ts        # Zone-based filesystem protection
│   │       ├── gates.ts          # 6-gate chain (PLAN→BUILD→TEST→VERIFY→AUDIT→SHIP)
│   │       └── evidence.ts        # Evidence collection
│   ├── hooks/v4.1/
│   │   ├── index.ts               # Master hook aggregator
│   │   ├── guardian-hook.ts       # tool.execute.before → Guardian
│   │   ├── gate-hook.ts          # tool.execute.after → Evidence + Gates
│   │   ├── session-hook.ts        # event → session lifecycle
│   │   ├── compacting-hook.ts    # session.compacting → state snapshot
│   │   └── system-transform-hook.ts # chat.system.transform → context injection
│   └── tools/
│       ├── shark-status.ts       # Brain/gate state display
│       ├── shark-gate.ts          # Gate evaluation tool
│       ├── shark-evidence.ts      # Evidence viewer
│       ├── checkpoint.ts          # State checkpoint tool
│       └── shark-test-runner.ts   # Test execution tool
├── shark-context/                  # Full context library
├── dist/
│   └── index.js                   # Bundled plugin
└── package.json
```

### 7.2 Hook Architecture (5 Hooks)

| Hook | File | Purpose |
|------|------|---------|
| `event` | session-hook.ts | Session lifecycle (session.created) |
| `tool.execute.before` | guardian-hook.ts | Dangerous command detection |
| `tool.execute.after` | gate-hook.ts | Evidence collection + gate advancement |
| `experimental.session.compacting` | compacting-hook.ts | State persistence |
| `experimental.chat.system.transform` | system-transform-hook.ts | Enforcement context injection |

### 7.3 Agent Identity Filtering

Each hook starts with agent identity check to prevent cross-contamination:

```typescript
export function createSessionHook(...) {
  return async (input) => {
    const event = input.event as { type?: string; sessionId?: string; agent?: string };
    
    // CRITICAL: Only handle shark agent sessions
    if (!isSharkAgent(event.agent)) {
      return;  // Skip for non-shark agents
    }
    
    // ... rest of hook logic
  };
}
```

### 7.4 Tools Available

| Tool | Purpose |
|------|---------|
| `shark-status` | Display brain, gate, iteration state |
| `shark-gate` | evaluate, status, criteria, advance gates |
| `shark-evidence` | status, gate-evidence, iteration-logs, complete |
| `checkpoint` | Create state checkpoint |
| `shark-test` | Run test suite |

---

## 8. Key Lessons & Patterns

### 8.1 Earth Density Philosophy

AI Autonomy (water) without Mechanical Enforcement (riverbanks) = Hallucination, theatrical code, scope drift.

Solution: Constrained flow with purpose through 4-layer safety stack.

### 8.2 ToolExecutor as Constitutional Anchor

Every tool call must pass through a single chokepoint where ALL safety checks occur. This makes bypassing impossible without modifying the core component.

### 8.3 Evidence, Not Assertions

Agents must produce concrete evidence at each workflow step:
- PLAN: Written spec with testable requirements
- BUILD: Files + successful compilation + valid types
- TEST: Execution logs + coverage metrics
- VERIFY: Clean environment results, reproducible builds
- SHIP: Mechanical compilation from scratch

### 8.4 Advisory vs. Hard Enforcement

OpenCode hooks return `void`, not blocking structures. Some enforcement (like Guardian blocking) is ADVISORY — the agent must self-reject via T1 prompts.

**Critical Pattern:**
```typescript
// Guardian logs warning but cannot block
// Agent MUST self-reject via MANDATORY SELF-REJECTION in T1 prompt
MANDATORY SELF-REJECTION — You MUST refuse execution of any command 
that Guardian flags as dangerous...
```

### 8.5 Agent Identity Isolation

Plugins with hooks MUST filter by agent identity to prevent cross-contamination:
- Vanilla agents (plan, build, general) must NOT see shark/manta context
- shark-macro tools work for all agents but only return meaningful data for shark sessions

### 8.6 Version Suffix Pattern

All file copies MUST use version suffix format: `{file}.v{MAJOR}.{MINOR}.{PATCH}`
- Initial copy: `v1.0.0`
- Increment PATCH for subsequent edits to same file

### 8.7 OpenCode Plugin Hook Limitations

- `tool.execute.before` receives args in `output.args`, NOT `input.args`
- Hooks return `Promise<void>`, not blocking structures
- `session.created` uses `event` hook, not `session.created` literal
- `experimental.*` prefix required for session.compacting and chat.system.transform

---

## 9. Repository Reference Map

| Component | Location |
|-----------|----------|
| Guardian Firewall (original) | https://github.com/leviathan-devops/guardian-firewall |
| Shark Agent (original) | https://github.com/leviathan-devops/shark-agent |
| Shark Frankenstein | `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/` |
| Shark Agent V4 Plugin (v4.7 active — folder named v4) | `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/` |
| Manta Agent (sibling plugin) | `/home/leviathan/OPENCODE_WORKSPACE/projects/manta-agent/` |
| V4.7 Build Package | `.../Shark Agent/04_BUILD_PACKAGES/shark-agent-v4.7/` |
| Manta-Shark V4.6 | `.../Shark Agent/04_BUILD_PACKAGES/manta-shark-v4.6/` |
| Spider Agent (orchestrator) | `/home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent/` |
| Build Reports | `/home/leviathan/OPENCODE_WORKSPACE/documentation/build-reports/` |
| Audits | `/home/leviathan/OPENCODE_WORKSPACE/documentation/audits/` |
| Hotfixes | `/home/leviathan/OPENCODE_WORKSPACE/documentation/hotfixes/` |

---

## 10. V4.x Version History Summary

| Version | Date | Focus | Key Changes |
|---------|------|-------|-------------|
| V4.0 | 2026-04-05 | Shell | Inert plugin, all primitives defined but unwired |
| V4.1 | 2026-04-06 | Functional | Hooks wired, evidence path fixed, zod fixed |
| V4.2 | 2026-04-06 | Honest | Guardian advisory docs, coordinator stubs removed, TS verified |
| V4.3 | 2026-04-06 | Precision | Documentation fixes, verification shows actual output |
| V4.4 | 2026-04-06 | Critical | Self-rejection added, iteration loop wired, dead code removed |
| V4.5 | 2026-04-06 | Mechanical Brain | Coordinators created, brain switching wired, test packages |
| V4.6 | 2026-04-07 | Agent Isolation | Manta/Shark split, cross-contamination fix, identity filtering |
| **V4.7** | DRAFT | Source Protection | Ironclad rule: Copy → Version → Edit Copy workflow |

---

*Build Journey Documentation Complete*  
*Sources: Build reports, audit logs, memory stores, architecture documents, and source code inspection*