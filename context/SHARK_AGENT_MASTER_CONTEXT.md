# 🦈 Shark Agent — Master Project Context
## Universal Knowledge Base — Inject into Any Agent

---

## 1. PROJECT IDENTITY

The **Shark Agent** is a specialized OpenCode plugin agent focused on **build verification, quality gate enforcement, and anti-slop firewall protection**. It operates within the Kraken orchestration ecosystem alongside Manta (precision engineering) and Kraken (orchestration).

| Field | Value |
|-------|-------|
| **Plugin Type** | OpenCode plugin (@opencode-ai/plugin SDK) |
| **Agent Color** | #228B22 (Forest Green) |
| **Agent Mode** | primary |
| **Hook Type** | tool.execute.before (guardian firewall hook) |
| **Primary Hook File** | `src/hooks/v4.1/guardian-hook.ts` |
| **Current SDK** | @opencode-ai/plugin@1.4.0 |

---

## 2. ECOSYSTEM POSITION

```
╔══════════════════════════════════════════╗
║        KRAKEN ORCHESTRATOR               ║
║   (kraken-agent + subagent-manager)       ║
╠══════════════════════════════════════════╣
║  ┌─────────┐  ┌──────────┐  ┌─────────┐  ║
║  │ 🦈 SHARK │  │ 🐙 MANTA │  │ 🐺 HOUND│  ║
║  │  Builder │  │  Debugger │  │  Audit  │  ║
║  └─────────┘  └──────────┘  └─────────┘  ║
╚══════════════════════════════════════════╝
```

### Plugin Separation Rules (from KRAKEN_ALIGNMENT_BIBLE.md)
- **kraken-agent**: Orchestration ONLY (scheduling, cluster management, Hive Mind)
- **shark-agent**: Building, testing, verification, firewall enforcement
- **manta-agent**: Debugging, precision fixes, methodical work
- **opencode-subagent-manager**: Execution ONLY (Docker container spawning)
- **Separation rule**: Orchestration MUST NOT do actual execution
- **Plugin loading order**: subagent-manager → kraken → shark → manta

---

## 3. CODEBASE LAYOUT

```
shark-agent-v4.8.x/
├── src/
│   ├── index.ts                    # Plugin entry point — registers hooks + tools + agent config
│   ├── brain/                      # Agent brain types (ToolCall, etc.)
│   ├── guardian/                   # File permission system
│   ├── workflow/                   # Workflow blocker
│   ├── shared/
│   │   ├── guardian.ts             # Zone-based file protection
│   │   ├── gates.ts                # 6-gate pipeline (plan/build/test/verify/audit/delivery)
│   │   ├── evidence.ts             # Evidence collector for verification
│   │   ├── agent-identity.ts       # isSharkAgent(), isVanillaAgent(), isOtherPluginAgent()
│   │   ├── state-store.ts          # Plugin state persistence
│   │   ├── messenger.ts            # Inter-plugin messaging
│   │   └── firewall-patterns.ts    # SINGLE SOURCE OF TRUTH for ALL patterns (V4.8.4)
│   ├── hooks/
│   │   └── v4.1/
│   │       ├── index.ts            # Hook composition — creates all 8 hooks
│   │       ├── guardian-hook.ts    # L0-L8 firewall (tool.execute.before) — 593 lines
│   │       ├── chat-message-hook.ts # Brain init + agent output checks (chat.message)
│   │       ├── command-execute-hook.ts # opencode run enforcement
│   │       ├── messages-transform-hook.ts # TUI combined text check
│   │       ├── session-hook.ts     # Session lifecycle
│   │       ├── gate-hook.ts        # Gate check (tool.execute.after)
│   │       ├── tool-summarizer-hook.ts # Tool summarizer
│   │       ├── compacting-hook.ts  # Context compaction
│   │       ├── system-transform-hook.ts # Build context injection
│   │       ├── agent-state.ts      # Session-based agent state Map
│   │       └── utils.ts            # Command extraction
│   ├── shark/                      # Macro tools
│   └── tools/                      # CLI tools (firewall-mesh for CLI mode)
├── dist/                           # Built bundle
├── build.ts                        # Bun build script
├── package.json                    # Build metadata
└── .checkpoints/                   # Build checkpoints
```

---

## 4. FIREWALL ARCHITECTURE (L0-L8)

The Shark Agent firewall is the **most complex multi-layer pattern enforcement system** in the Kraken ecosystem. It operates at TWO levels:

### Level 1: `tool.execute.before` hook (guardian-hook.ts)
- Catches tool calls BEFORE execution
- L0: Identity Wall — blocks dangerous tools when brain uninitialized
- L1-L4: Command regex — theatrical, fake test, source inspection, wrong container
- L5.x: Text regex — anti-derailment patterns
- L5.7 (mechanical): Cross-agent tool blocking via Set membership

### Level 2: `chat.message` hook (chat-message-hook.ts)
- Catches AGENT OUTPUT containing slop
- SHOULD ONLY check agent responses, never user input
- Also initializes brain state via setCurrentAgent()

### Pattern Counts
| Layer | Type | Count | Purpose |
|-------|------|-------|---------|
| L0 | Mechanical | - | Identity wall |
| L1 | Command | 17 | Counting theater (grep \| wc) |
| L2 | Command | 19 | Fake test runner bypass |
| L3 | Command | 8 | Source inspection (file exists ≠ works) |
| L4 | Command | 6 | Wrong container commands |
| L5.1 | Text | 15 | Host fallback claims |
| L5.2 | Text | 15 | Unverified success claims |
| L5.3 | Text | 15 | Model restriction excuses |
| L5.4 | Text | 12 | Mock/stub data |
| L5.5 | Text | 10 | Oversimplification |
| L5.6 | Text | 12 | Confusion pretense |
| L5.7 | Text + Mechanical | 12 + Set | Scope creep + cross-agent tools |
| L5.8 | Text | 12 | Undermining |
| L5.9 | Text | 10 | Impatience |
| L5.10 | Text | 11 | Self-reference claims |

---

## 5. KNOWN ARCHITECTURAL PATTERNS & ANTI-PATTERNS

### 5.1 CRITICAL: Agent Identity Isolation
EVERY hook MUST check agent identity as the FIRST executable line:

```typescript
// CORRECT:
async (input, output) => {
  const { agent } = input;
  if (!agent || !isSharkAgent(agent)) return;  // ← FIRST LINE
  // ... shark-specific logic
}

// WRONG (causes agent overwrite):
async (input, output) => {
  // NO AGENT CHECK — fires for ALL agents including vanilla plan/build
  checkPatterns(text);
}
```

### 5.2 Five Antipatterns that Broke Plugin Isolation (from hermes-context-spillover-fix.md)
1. **Global Module-Level State** — Shared across ALL sessions → context spillover
2. **No Agent Filtering** — Hooks without `isSharkAgent()` guard
3. **Premature Auto-Registration** — Registering sessions before agent identification
4. **Dual Plugin Loading** — Two versions of same plugin loaded simultaneously
5. **Wrong Hook Format** — Arrays instead of composed async functions

### 5.3 Pattern Engineering Rules (from FIREWALL_ENGINEERING_ANCHORS.md)
- Case insensitive: Always use `/i`
- No leading spaces in patterns: `/mostly.*works/i` not `/ mostly .*works/i`
- Optional parts: `/npm\s+(run\s+)?test/i`
- Use `\b` for word boundaries
- Legitimate patterns checked BEFORE blocklist
- Tool blocking uses Set membership (O(1)) not regex

### 5.4 Hook Format Rules (from KRAKEN_ALIGNMENT_BIBLE.md)
```typescript
// WRONG — OpenCode does NOT iterate arrays:
'tool.execute.after': [createHook1(), createHook2()]

// CORRECT — Compose functions:
'tool.execute.after': async (input, output) => {
  await createHook1()(input, output);
  await createHook2()(input, output);
}
```

### 5.5 Verification Theater Pattern (from VERIFICATION-THEATER-CATALOG.md)
The #1 failure mode in this project: tests that pass but prove nothing.

| Anti-pattern | Example |
|-------------|---------|
| Mock Trap | Unit tests with mocks mask real API incompatibility |
| Silent Catch | `catch {}` without logging |
| Happy Path Only | No failure scenario tests |
| Metric Theater | High test count as vanity metric |
| Self-Certification | Same agent writes, tests, reviews |

---

## 6. TESTING PROTOCOLS

### 6.1 NUCLEAR RULE (from Container Testing Context)
> **If it wasn't tested in TUI container, it was NOT tested.**
> `opencode run` does NOT fire: chat.message, tool.execute.before, tool.execute.after

### 6.2 Test Levels
| Level | What | Catches |
|-------|------|---------|
| Static | `grep -c "simulateTaskExecution" dist/index.js` | Theatrical code |
| Bundle Size | dist/index.js ≥ 550KB (shark) | Missing code |
| Unit | `bun test` | Logic errors (NOT hooks/state/TUI) |
| **Container TUI** | `docker exec -it CONTAINER opencode --agent shark` | **ALL failure modes** |

### 6.3 Container Test Workflow
```bash
# Build image matching local OpenCode version
docker build -t opencode-test:1.4.3 -f Dockerfile.opencode .

# Run TUI test (--entrypoint /bin/bash is REQUIRED)
docker exec -it CONTAINER opencode --agent shark

# Verify in TUI:
# - All tools appear (shark-status, shark-gate, etc.)
# - Shark tab available in toggle
# - Hooks fire (must be TUI, not opencode run)
# - Check memory stable, no console errors
# - Cross-plugin: Manta and Shark both work
```

### 6.4 Container Test Evidence
Evidence file: `.shark/evidence/delivery/ContainerTestResult.json`
Required: `overallPassed === true && passRate >= 0.96`

### 6.5 Model Requirements (from CONTAINER_TESTING_MASTER_REFERENCE.md)
- **FREE models only**: gemma-4-31b-it, opencode/big-pickle
- **BANNED**: minimax/*, gpt-5-nano
- Binary: `/usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode`

---

## 7. DEPLOYMENT & BUILD

### 7.1 Active Plugin Registration
File: `/home/leviathan/.config/opencode/opencode.json`
Active shark path: `file:///home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent/dist/index.js`

### 7.2 Build Command
```bash
cd shark-agent-v4.8.x && bun run build
```

### 7.3 Migration Protocol (from PLUGIN_SHIP_SOP.md)
1. REMOVE old plugin from opencode.json before adding new
2. Archive old directory with .ARCHIVED-YYYYMMDD suffix
3. Verify ONLY new plugin loads
4. NEVER have two versions of same plugin loaded

### 7.4 Dual Plugin Architecture
- `agent: [...]` as plain array is IGNORED by SDK
- MUST use `config` callback with `Object.assign(opencodeConfig.agent, agents)`
- Agents MUST be object (keyed by name), not plain array
- `mode: "primary"` required for tab toggle visibility
- Must have BOTH `agent` direct property AND `config` callback
- `prompt` must be inside `config: { prompt: ... }` nested (NOT `instructions`)

---

## 8. VERSION HISTORY

| Version | Status | Key Features |
|---------|--------|-------------|
| v4.7-hotfix-v3 | SHIPPED | Working production version |
| v4.8.1 | STALE | In .shark container |
| v4.8.2 | CONTAINER TEST PASSED | All L1-L4 verified in container |
| v4.8.3 | BUGGY | L5 fires on user messages, L1-L4 broken |
| v4.8.4-hotfix | IN PROGRESS | Fixing L5 user message block + pattern consolidation |

---

## 9. KEY CONTEXT FILES (Reference Library)

### Active Build Context
| File | Content |
|------|---------|
| `Shared Workspace Context/Shark Agent/Active Context/V4.8.3 Build/` | Current build checkpoint data |
| `Shared Workspace Context/Shark Agent/Active Context/Kraken Engineer Active Context/` | Firewall engineering docs |
| `Shared Workspace Context/Shark Agent/03_OPENCODE_PLUGIN/shark-agent-plugin/` | Plugin source (v2 firewall mesh) |
| `Shared Workspace Context/Shark Agent/01_ORIGINAL_REPOS/shark-frankenstein/` | Original shark source |

### Engineering Context
| File | Content |
|------|---------|
| `Shared Workspace Context/Kraken Agent/Master Context/FIREWALL_ENGINEERING_ANCHORS.md` | 5-anchor firewall architecture + pattern engineering rules |
| `Shared Workspace Context/Kraken Agent/Master Context/KRAKEN_ALIGNMENT_BIBLE.md` | All 10 failure modes, ADR, testing protocol |
| `Shared Workspace Context/Kraken Agent/Master Context/V2_CONTEXT_LIBRARY.md` | 7-component architecture, anti-theatrical checklist |

### Plugin Context
| File | Content |
|------|---------|
| `Shared Workspace Context/Kraken Agent/Master Context/Plugin Context/CROSS-PLUGIN-ARCHITECTURE-AUDIT.md` | Hermes-Spider conflict analysis |
| `Shared Workspace Context/Kraken Agent/Master Context/Plugin Context/hermes-context-spillover-fix.md` | 26 hooks guarded, isolation lessons |
| `Shared Workspace Context/Kraken Agent/Master Context/Plugin Context/MANTA_SHARK_AGENT_BUILD_REPORT.md` | Cross-plugin spillover fix |
| `Shared Workspace Context/Kraken Agent/Master Context/Plugin Context/PLUGIN_SHIP_SOP.md` | Deployment SOP |

### Container Testing
| File | Content |
|------|---------|
| `Shared Workspace Context/Kraken Agent/Master Context/Container Testing Context/CONTAINER_TESTING_MASTER_REFERENCE.md` | Complete test workflow |
| `Shared Workspace Context/Kraken Agent/Master Context/Container Testing Context/TUI_CONTAINER_TESTING_WORKFLOW.md` | Why opencode run fails |
| `Shared Workspace Context/Kraken Agent/Master Context/Container Testing Context/CONTAINER_VERSION_MISMATCH.md` | Version 1.3.17 vs 1.4.2 issues |

### Failure Logs
| File | Content |
|------|---------|
| `Shared Workspace Context/Critical Failure Logs/FIREWALL_CRASH_TEST_REPORT.md` | 8/9 firewall tests FAILED |
| `Shared Workspace Context/Critical Failure Logs/REASONING_BRAIN_CRITICAL_FAILURE_REPORT.md` | DeepSeek supervision failure |
| `Shared Workspace Context/Critical Failure Logs/HIVE-MIND-PLUGIN-FAILURE-LOG.md` | 8 critical failures, all gates bypassed |
| `Shared Workspace Context/Critical Failure Logs/BUILD_AGENT_WRITE_BLOCKING_FAILURE_DEBUG_LOG.md` | Spider blocked all vanilla agents |
| `Shared Workspace Context/Critical Failure Logs/VERIFICATION-THEATER-CATALOG.md` | 5 anti-patterns, case studies |

---

## 10. RECOVERY COMMANDS

```bash
# Quick build check
cd /home/leviathan/OPENCODE_WORKSPACE/shark-agent-v4.8.3-REPO && bun run build

# Verify no simulateTaskExecution
grep -c "simulateTaskExecution" dist/index.js  # MUST return 0

# Verify bundle size (shark expected: 550KB+)
wc -c dist/index.js

# Verify pattern count
grep -o "/i" dist/index.js | wc -l

# Container test
docker run --rm -it --entrypoint /bin/bash opencode-test:1.4.3 -c "opencode --agent shark"
```

---

**Last Updated**: 2026-04-17
**Master Context Version**: 1.0
