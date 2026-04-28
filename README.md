# Shark Agent v4.8.3

**Version:** 4.8.3 (Checkpoint 4.7)
**Status:** Shipping
**Type:** OpenCode Plugin Agent — standalone execution agent with L0-L8 firewall enforcement
**SDK:** @opencode-ai/plugin@1.4.0
**Color:** Forest Green `#228B22`

---

## Overview

Shark Agent is an OpenCode plugin that registers a primary agent named `shark` with 5 custom tools and 8 hooks. It enforces a multi-layer mechanical firewall system that blocks theatrical code patterns, fake test runners, source inspection theater, wrong container commands, cross-agent tool invocations, and agent behavioral derailment. It operates alongside Kraken, Manta, and vanilla OpenCode agents without interfering with any of them.

---

## The Shark Agent Architecture (Universal)

### What Shark Agent IS

A shark agent is a specialized OpenCode plugin that provides:

1. **Agent Identity** — Registers itself in OpenCode's agent registry with a unique color, system prompt, and tool set
2. **Hook System** — Intercepts tool execution (`tool.execute.before`, `tool.execute.after`), chat messages (`chat.message`, `messages.transform`), sessions (`event`), compaction, and system transforms
3. **Firewall** — Pattern-based mechanical blocking of agent derailment: counting theater (grep|wc), fake test runners (npm test, jest), source inspection theater (test -f, stat), wrong container commands, and behavioral slop in agent output
4. **Guardian** — Zone-based file permission system that blocks edits to source files, dangerous commands (`rm -rf /`, `dd if=`), and protects critical system paths
5. **Gate Pipeline** — 6-stage mechanical gate chain (PLAN → BUILD → TEST → VERIFY → AUDIT → DELIVERY) with evidence requirements
6. **Tools** — shark-status, shark-gate, shark-evidence, shark-test-runner, checkpoint
7. **Isolation** — Every hook checks `isSharkAgent()` as its first executable line. Never fires for vanilla agents (plan, build, general, explore) or other plugins (manta, kraken)

### How Shark Agent Fits in the Ecosystem

```
╔══════════════════════════════════════════╗
║        KRAKEN — Orchestration           ║
║   (spawns agents, manages clusters)      ║
╠══════════════════════════════════════════╣
║  ┌─────────┐  ┌──────────┐  ┌─────────┐  ║
║  │ 🦈 SHARK │  │ 🐙 MANTA │  │ 🐕 HOUND │  ║
║  │ Build+Test│ │ Debugger │  │  Audit  │  ║
║  └─────────┘  └──────────┘  └─────────┘  ║
╚══════════════════════════════════════════╝
         ↑                    ↑
    Vanilla agents      Plugin agents
  (plan, build, etc)   (shark, manta, etc)
```

Shark is a **standalone plugin agent** — it does NOT orchestrate, spawn sub-agents, or manage clusters. It executes builds and enforces quality gates within its own session scope.

---

## v4.8.3 Architecture

### File Layout

```
├── src/
│   ├── index.ts                        # Plugin entry — config callback, tool + hook registration
│   ├── hooks/v4.1/
│   │   ├── index.ts                    # Hook composition (8 hooks)
│   │   ├── guardian-hook.ts            # L0-L4 tool.execute.before firewall (268 lines)
│   │   ├── chat-message-hook.ts        # Brain init — setCurrentAgent() only (28 lines)
│   │   ├── messages-transform-hook.ts  # L5 agent output anti-derailment (silent strip, 221 lines)
│   │   ├── command-execute-hook.ts     # opencode run enforcement (472 lines)
│   │   ├── session-hook.ts             # Session lifecycle + context injection
│   │   ├── gate-hook.ts                # Gate enforcement + delivery block
│   │   ├── compacting-hook.ts          # Context compaction recovery
│   │   ├── system-transform-hook.ts    # Build context injection at session start
│   │   ├── tool-summarizer-hook.ts     # Tool call summarization
│   │   ├── agent-state.ts              # Session-based agent state Map
│   │   └── utils.ts                    # Command/path extraction helpers
│   ├── shared/
│   │   ├── guardian.ts                 # Zone-based file permission system
│   │   ├── gates.ts                    # 6-gate pipeline manager
│   │   ├── evidence.ts                 # Evidence collector for ship gate
│   │   ├── agent-identity.ts           # isSharkAgent(), isVanillaAgent(), isOtherPluginAgent()
│   │   ├── firewall-patterns.ts        # Single source of truth — all L1-L5 regex patterns
│   │   ├── state-store.ts              # Isolated plugin state
│   │   └── messenger.ts                # Inter-plugin messaging
│   ├── shark/macro/
│   │   ├── brains.ts                   # System prompt (EXECUTION_BRAIN_T1 + 3 other brain prompts)
│   │   └── peer-dispatch.ts            # Shark peer coordination
│   └── tools/
│       ├── shark-status.ts             # Agent state display tool
│       ├── shark-gate.ts               # Gate evaluation tool
│       ├── shark-evidence.ts           # Evidence inspection tool
│       ├── shark-test-runner.ts        # Container-aware mechanical test suite (13 tests)
│       ├── shark-test-runner-container.ts  # Container test runner
│       └── checkpoint.ts               # Build checkpoint tool
├── dist/index.js                       # Bundled output (~600KB)
├── .checkpoints/                       # Build checkpoints (CP4.1 through CP4.7)
│   ├── v4.8.3-checkpoint-4.1-BUG-DISCOVERY/
│   ├── v4.8.3-checkpoint-4.2-L5-FIX/
│   ├── v4.8.3-checkpoint-4.3-REAL-FIX/
│   └── v4.8.3-checkpoint-4.4-CLEAN/
├── package.json
├── DEPLOY.md                           # Deployment guide
├── CHANGELOG.md                        # Complete fix log across all checkpoints
├── BUILD_REPORT.md                     # Historical build report (April 12)
└── ContainerTestResult.json            # Current container test evidence
```

### Hook Map — When Each Hook Fires

| Hook | Fires In | Purpose |
|------|----------|---------|
| `chat.message` | TUI only | **Brain init only** — calls `setCurrentAgent()`. No text checking. |
| `tool.execute.before` | TUI + run | L0-L4 command firewall, L5.7 cross-agent tool block, Guardian zone protection |
| `tool.execute.after` | TUI + run | Tool summary + gate advancement check |
| `messages.transform` | TUI only | L5 anti-derailment on agent output — silently strips slop, never throws |
| `command.execute.before` | Run only | L1-L5 enforcement for `opencode run` commands |
| `event` | Session lifecycle | Session start/stop/compaction |
| `experimental.session.compacting` | Compaction | Context recovery from compaction |
| `experimental.chat.system.transform` | Session start | Build context injection |

### Gate Chain

```
PLAN → BUILD → TEST → VERIFY → AUDIT → DELIVERY
```

- **PLAN**: Requirements defined, SPEC.md generated
- **BUILD**: Files created per spec
- **TEST**: Tests pass, coverage ≥ 80%
- **VERIFY**: SPEC alignment, integration tests, edge cases
- **AUDIT**: SAST clean, no secrets, dependencies audited
- **DELIVERY**: Container test evidence required (MECHANICALLY ENFORCED)

---

## Firewall System (v4.8.3 — 7 Checkpoints of Fixes)

### Design Rules

1. **User messages NEVER checked** — `chat.message` is brain init only
2. **Agent output anti-derailment is silent** — slop text stripped, zero UI spillover
3. **Tool call errors are one-liners** — `[L1 BLOCKED] Counting theater: cmd` format, <60 chars
4. **Patterns centralized** — `firewall-patterns.ts` is canonical source
5. **No console.log in any hook**
6. **Every hook checks `isSharkAgent()` first** — never fires for vanilla agents

### Firewall Layers

| Layer | Name | What It Blocks | Mechanism | Hook |
|-------|------|---------------|-----------|------|
| L0 | Identity Wall | Dangerous tools when brain uninitialized | Current agent check | tool.execute.before |
| L1 | Counting Theater | `grep \| wc`, `cat \| wc`, `wc -l dist/`, `tee`, pipe-to-file | 14 regex patterns | tool.execute.before |
| L2 | Fake Test Runners | `npm test`, `jest`, `vitest`, `mocha`, `pytest`, `go test`, `cargo test`, `bunx test` | 20 regex patterns | tool.execute.before |
| L3 | Source Inspection | `test -f ${var}`, `stat`, `grep -r src/` | 5 regex patterns | tool.execute.before |
| L4 | Wrong Container | `opencode container run`, `opencode container exec`, `docker run opencode` | 6 regex patterns | tool.execute.before |
| L5.1 | Host Fallback | "host testing already works", "fall back to host" | 15 regex patterns | messages.transform |
| L5.2 | Success Claim | "it works trust me", "obviously correct" | 15 regex patterns | messages.transform |
| L5.3 | Model Restriction | "only gpt", "model quota", "api key issue" | 15 regex patterns | messages.transform |
| L5.4 | Mock/Stub | "mock data", "stubbed response", "fake api" | 12 regex patterns | messages.transform |
| L5.5 | Oversimplification | "over simplified", "hand wave", "skip detail" | 10 regex patterns | messages.transform |
| L5.6 | Confusion Pretense | "somewhat works", "kinda works", "basically correct" | 12 regex patterns | messages.transform |
| L5.7 | Scope Creep | "while at it", "might as well", "one more thing" | 12 regex patterns | messages.transform |
| L5.7 | Cross-Agent Tools | `memsearch`, `hive_remember`, `kraken_hive_*` | Set membership (mechanical) | tool.execute.before |
| L5.8 | Undermining | "not worth the effort", "diminishing returns" | 12 regex patterns | messages.transform |
| L5.9 | Impatience | "just deploy", "ship it", "good enough" | 9 regex patterns | messages.transform |
| L5.10 | Self-Reference | "i have verified that", "my testing confirms" | 11 regex patterns | messages.transform |
| L6 | Zone Protection | Writes to protected paths (/etc, ~/.ssh, .env) | Guardian zone classification | tool.execute.before |

### Agent Identity Filtering

**CRITICAL:** Every hook checks `isSharkAgent()` as its FIRST executable line. Vanilla agents (build, plan, general, explore) and other plugin agents (manta, kraken) are completely bypassed.

```typescript
// chat-message-hook.ts — brain init ONLY for shark
if (agent && isSharkAgent(agent)) {
  setCurrentAgent(agent, sessionID);
}

// messages-transform-hook.ts — anti-derailment ONLY for shark
if (!agent || !isSharkAgent(agent)) return;

// guardian-hook.ts — L0-L4 firewall ONLY for shark
// Cross-agent tool blocking and zone protection apply to all agents
```

**Agent identity checks:**
- `isSharkAgent('shark')` → true
- `isSharkAgent('shark_alpha_1')` → true (prefix matching)
- `isSharkAgent('build')` → false (vanilla)
- `isSharkAgent('manta')` → false (other plugin)
- `isSharkAgent(undefined)` → false

---

## Guardian System (v4.8.3)

### Features

1. **Source File Edit Protection** — Source files cannot be edited directly. Must duplicate first: `cp file.ts file.ts.v1.0.0`, then edit the copy. Covers both `edit` and `mcp_edit` tools.

2. **Dangerous Command Blocking** — `rm -rf /`, `dd if=`, `mkfs`, fork bombs, terminal in-place modifications (`sed -i`, `echo >`)

3. **Zone-Based Write Protection** — Classifies file paths into zones (system, config, source, workspace) and blocks writes to protected zones

4. **Edit Registration** — Tracks which copies have been created from source files, prevents bypass via direct edit

### Delivery Gate Hard Block

```typescript
// gate-hook.ts — MECHANICALLY ENFORCED
if (currentGate === 'delivery') {
  const deliveryBlocked = checkDeliveryGateBlocked();
  if (deliveryBlocked) {
    throw new Error(`[SHARK DELIVERY BLOCKED] You MUST run 'shark-test-runner'...`);
  }
}
```

---

## Agent Identity & System Prompt

Shark Agent uses a 3-layer identity architecture:

```
┌─────────────────────────────────────────────┐
│ 1. PLUGIN CONFIG (index.ts config callback)  │
│    Sets prompt + instructions on agent cfg   │
│    → SDK injects into system message         │
├─────────────────────────────────────────────┤
│ 2. SYSTEM PROMPT (brains.ts)                 │
│    "YOU ARE THE SHARK AGENT v4.8.3"          │
│    Lists 5 tools, identity, anti-confusion   │
├─────────────────────────────────────────────┤
│ 3. CONTEXT INJECTION (system-transform)      │
│    Injects build context at session start    │
└─────────────────────────────────────────────┘
```

The agent knows:
- Its name and version: "I am the Shark Agent v4.8.3"
- Its 5 custom tools: shark-status, shark-gate, shark-evidence, shark-test-runner, checkpoint
- It is NOT Kraken: "You DO NOT have sub-agents. You are NOT Kraken"
- It is a standalone plugin agent, not a cluster system

---

## Installation & Deployment

### Plugin Registration

`~/.config/opencode/opencode.json`:
```json
{
  "plugin": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent/dist/index.js"
  ],
  "agent": {
    "shark": {
      "color": "#228B22",
      "mode": "primary",
      "hidden": false
    }
  }
}
```

### Build

```bash
cd shark-agent-v4.8.3
bun run build
# Output: dist/index.js (~600KB)
```

### Deploy

```bash
cp dist/index.js ~/OPENCODE_WORKSPACE/plugins/shark-agent/dist/index.js
# Reload OpenCode (Ctrl+R in TUI or restart)
```

### Verify

```bash
# Check agent is registered
opencode agent list | grep shark

# Verify prompt in bundle
grep "YOU ARE THE SHARK AGENT" dist/index.js

# Full TUI test
docker run -d --rm --entrypoint /bin/bash \
  -v ~/.config/opencode:/root/.config/opencode \
  opencode-test:1.4.3 -c "sleep 3600"
docker exec -it CONTAINER_ID \
  /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode \
  --agent shark
```

---

## Testing

### NUCLEAR RULE

**If it wasn't tested in TUI container, it was NOT tested.**

`opencode run` does NOT fire `chat.message`, `tool.execute.before`, `tool.execute.after`, or `messages.transform`. Only TUI mode fires all hooks. Use tmux to automate:

```bash
CID=$(docker run -d --rm --entrypoint /bin/bash \
  -v ~/.config/opencode:/root/.config/opencode \
  opencode-test:1.4.3 -c "sleep 3600")

tmux new-session -d -s tui "docker exec -it $CID \
  /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode \
  --agent shark"

sleep 6
tmux send-keys -t tui Escape      # Dismiss update dialog
tmux send-keys -t tui "hello"     # Test message
tmux send-keys -t tui Enter
tmux capture-pane -t tui -p -S -40 | strings
```

### Pre-Ship Checklist

- [ ] Plugin loads in TUI without errors
- [ ] Shark agent appears in agent tab toggle
- [ ] All 5 tools respond (shark-status, shark-gate, shark-evidence, shark-test-runner, checkpoint)
- [ ] User messages pass through unblocked
- [ ] Agent output anti-derailment strips slop silently
- [ ] Cross-agent: Manta and vanilla agents unaffected
- [ ] ContainerTestResult.json exists and valid
- [ ] No console.log/error spill in hooks

---

## Checkpoint History

| CP | Date | What |
|----|------|------|
| 4.1 | Apr 17 | 7 bugs discovered — L5 blocked user messages |
| 4.2 | Apr 17 | First fix attempt (output.path was same as input — incomplete) |
| 4.3 | Apr 17 | Real fix — chat.message brain init only |
| 4.4 | Apr 28 | Ruthless audit — dead code removed, cross-agent gap closed, SOURCE_INSPECTION narrowed |
| 4.5 | Apr 28 | Identity fix — added `prompt` field, rewrote system prompt from triple-brain to standalone |
| 4.6 | Apr 28 | Console spillover fix — silent messages, short errors, zero UI pollution |
| 4.7 | Apr 28 | Repo cleanup, comprehensive README + CHANGELOG, evidence added |

Full details: [CHANGELOG.md](CHANGELOG.md)

---

## v4.8.3 vs v4.7 Differences

| Aspect | v4.7 | v4.8.3 |
|--------|------|--------|
| chat-message-hook | Brain init + agent output checking | Brain init ONLY |
| Anti-derailment | Threw errors (UI spill) | Silently strips slop text |
| L5 tool-level checks | Present (JSON.stringify of args) | Removed (nonsensical for tool args) |
| Error messages | Multi-line verbose paragraphs | One-liners <60 chars |
| Pattern storage | 4 duplicated files | Single source + 1 intentional variant |
| System prompt | Triple-brain architecture | Standalone identity |
| console.log | 10 instances | 0 |
| Bundle size | ~1.0MB | ~600KB |
| Dead code | 255 lines in chat-message-hook | 0 lines |

---

## Git Repository

- **URL:** https://github.com/leviathan-devops/shark-agent-v4.8.3
- **Version:** v4.8.3 (CP4.7)
- **Status:** Shipping
- **Branch:** main

## Known Limitations

1. **command-execute-hook.ts** still has inline pattern definitions (opencode run mode only — hooks don't fire in run mode, patterns are unused at runtime)
2. **Container image `opencode-test:1.4.3`** may need updating if local opencode version changes
3. **`guardian-hook.ts` L1-L4 patterns** differ slightly from `firewall-patterns.ts` — intentional, tool-level patterns are tuned for command matching vs text matching
4. **`utils.ts`** contains Unix commands (`cp`, `mv`, `mkdir`) in `isBuildTool` that are never matched as OpenCode tool names

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for complete fix history across all 7 checkpoints.

---

**v4.8.3 — 7 checkpoints, 244K lines removed, zero UI spillover, fully TUI tested.**
