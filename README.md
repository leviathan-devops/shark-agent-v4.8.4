# 🦈 Shark Agent v4.8.3

**OpenCode plugin agent — autonomous build execution with L0-L8 mechanical firewall enforcement.**

[![Plugin SDK](https://img.shields.io/badge/%40opencode--ai%2Fplugin-1.4.0-blue)](https://github.com/anomalyco/opencode)
[![Build](https://img.shields.io/badge/build-bun-brightgreen)](https://bun.sh)
[![Bundle](https://img.shields.io/badge/bundle-600KB-lightgrey)]()

---

## 1. What It Is

Shark Agent is an OpenCode plugin that registers a **primary agent** named `shark` (forest green, `#228B22`) with 5 custom tools and 8 hooks. It enforces a multi-layer firewall system that blocks theatrical code patterns, fake test runners, source inspection theater, wrong container commands, and agent behavioral derailment.

## 2. File Layout

```
├── src/
│   ├── index.ts                      # Plugin entry — config callback, tool + hook registration
│   ├── hooks/v4.1/
│   │   ├── index.ts                  # Hook composition (8 hooks)
│   │   ├── guardian-hook.ts          # L0-L4 tool.execute.before firewall (272 lines)
│   │   ├── chat-message-hook.ts      # Brain init — setCurrentAgent() only (28 lines)
│   │   ├── messages-transform-hook.ts # L5 agent output anti-derailment (silent strip)
│   │   ├── command-execute-hook.ts   # opencode run enforcement
│   │   ├── session-hook.ts           # Session lifecycle + context injection
│   │   ├── gate-hook.ts              # Gate enforcement (tool.execute.after)
│   │   ├── compacting-hook.ts        # Context compaction recovery
│   │   ├── system-transform-hook.ts  # Build context injection at session start
│   │   ├── tool-summarizer-hook.ts   # Tool call summarization
│   │   ├── agent-state.ts            # Session-based agent state Map
│   │   └── utils.ts                  # Command/path extraction helpers
│   ├── shared/
│   │   ├── guardian.ts               # Zone-based file permission system
│   │   ├── gates.ts                  # 6-gate pipeline (plan→build→test→verify→audit→delivery)
│   │   ├── evidence.ts               # Evidence collector for ship gate
│   │   ├── agent-identity.ts         # isSharkAgent(), isVanillaAgent(), isOtherPluginAgent()
│   │   ├── firewall-patterns.ts      # Single source of truth — all L1-L5 regex patterns
│   │   ├── state-store.ts            # Isolated plugin state
│   │   └── messenger.ts              # Inter-plugin messaging
│   ├── shark/macro/
│   │   ├── brains.ts                 # System prompt (EXECUTION_BRAIN_T1)
│   │   └── peer-dispatch.ts          # Shark peer coordination
│   └── tools/
│       ├── shark-status.ts           # Agent state display tool
│       ├── shark-gate.ts             # Gate evaluation tool
│       ├── shark-evidence.ts         # Evidence inspection tool
│       ├── shark-test-runner.ts      # Container-aware mechanical test suite
│       ├── shark-test-runner-container.ts  # Container test runner (518 lines)
│       └── checkpoint.ts             # Build checkpoint tool
├── dist/index.js                     # Bundled output (600KB)
├── package.json                      # Build metadata (bun + @opencode-ai/plugin)
├── DEPLOY.md                         # Deployment guide
├── DEBUG_LOG_CP4.5_IDENTITY_FIX.md   # Identity layer fix documentation
├── SHIP_PACKAGE_v4.8.3-CP4.2.md      # Ship report
├── BUILD_REPORT.md                   # Historical build report
└── .checkpoints/                     # Build checkpoints (CP4.1-CP4.4)
```

## 3. Firewall Architecture

### Hook Map

| Hook | Fires | Does |
|------|-------|------|
| `chat.message` | TUI mode only | **Brain init only** — `setCurrentAgent()`. No text checking. |
| `tool.execute.before` | TUI + run | L0-L4 command blocking, L5.7 cross-agent tool blocking, zone-based file protection |
| `messages.transform` | TUI mode only | L5 anti-derailment on **agent output** — silently strips slop text, never throws |
| `command.execute.before` | Run mode only | L1-L5 enforcement for `opencode run` commands |
| `tool.execute.after` | TUI + run | Tool summary + gate check |
| `event` | Session lifecycle | Session start/stop/compaction |
| `experimental.session.compacting` | Compaction | Context recovery |
| `experimental.chat.system.transform` | Session start | Build context injection |

### Firewall Layers

| Layer | Scope | Mechanism | Hook |
|-------|-------|-----------|------|
| L0 | Identity Wall | `currentAgent` check | tool.execute.before |
| L1 | Counting Theater | 14 regex patterns (grep\|wc, wc -l dist/, etc.) | tool.execute.before |
| L2 | Fake Test Runners | 20 regex patterns (jest, npm test, bunx test, etc.) | tool.execute.before |
| L3 | Source Inspection | 5 regex patterns (test -f ${.*}, stat, etc.) | tool.execute.before |
| L4 | Wrong Container | 6 regex patterns (opencode container run, docker run opencode) | tool.execute.before |
| L5.1-L5.10 | Anti-Derailment | 10 sub-layers, ~130 text patterns | messages.transform |
| L5.7 | Cross-Agent Tools | `Set.has()` mechanical block | tool.execute.before |
| L6 | Zone Protection | Guardian zone classification | tool.execute.before |

### Design Rules (v4.8.3 CP4.6)

1. **User messages NEVER checked against any pattern** — `chat.message` is brain init only
2. **Agent output anti-derailment is silent** — slop text stripped, no errors thrown to UI
3. **Tool call errors are one-liners** — `[L1 BLOCKED] Counting theater: cmd` format
4. **Patterns have single source** — `firewall-patterns.ts` is canonical
5. **No console.log in any hook** — zero UI spillover
6. **Every hook guards with `isSharkAgent()`** — never fires for vanilla/build/manta agents

## 4. Tools

| Tool | Purpose |
|------|---------|
| `shark-status` | Returns brain state, current gate, iteration |
| `shark-gate` | Evaluates/advances gates (action: status\|evaluate\|advance\|report) |
| `shark-evidence` | Views evidence collection status by gate |
| `shark-test-runner` | Runs 13-test mechanical suite, generates ContainerTestResult.json |
| `checkpoint` | Creates/restores build checkpoints |

## 5. System Prompt

The agent identifies itself via `EXECUTION_BRAIN_T1` in `src/shark/macro/brains.ts`. The plugin `config` callback sets both `prompt` and `instructions` fields on the agent config. Key identity anchors:

```
YOU ARE THE SHARK AGENT v4.8.3 — an OpenCode plugin agent.
You have 5 custom tools: shark-status, shark-gate, shark-evidence, shark-test-runner, checkpoint
You DO NOT have sub-agents. You are NOT Kraken.
```

## 6. Build & Deploy

```bash
# Build
bun run build                    # → dist/index.js (600KB)

# Deploy
cp dist/index.js ~/OPENCODE_WORKSPACE/plugins/shark-agent/dist/index.js

# Verify
grep "YOU ARE THE SHARK AGENT" dist/index.js  # should return 1 match
```

## 7. OpenCode Config

`~/.config/opencode/opencode.json`:
```json
{
  "plugin": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent/dist/index.js"
  ],
  "agent": {
    "shark": {
      "color": "#228B22",
      "mode": "primary"
    }
  }
}
```

## 8. Testing

**NUCLEAR RULE: If not tested in TUI container, it was NOT tested. `opencode run` does NOT fire chat.message, tool.execute.before, or messages.transform.**

```bash
# TUI container test
docker run -d --rm --entrypoint /bin/bash \
  -v ~/.config/opencode:/root/.config/opencode \
  opencode-test:1.4.3 -c "sleep 3600"

tmux new-session -d "docker exec -it CONTAINER_ID \
  /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode \
  --agent shark"

tmux send-keys -t session "test message" Enter
tmux capture-pane -t session -p -S -40 | strings
```

## 9. Checkpoint History

| CP | What |
|----|------|
| 4.1 | Bug discovery — 7 bugs found |
| 4.2 | First L5 fix attempt |
| 4.3 | Real fix — chat.message brain init only |
| 4.4 | Audit & clean — dead code removed, cross-agent gap closed |
| 4.5 | Identity fix — added `prompt` field, rewrote system prompt |
| 4.6 | Console spillover fix — silent messages, short errors |

## 10. Architecture Decisions

**Why `chat.message` is brain init only**: The hook fires BEFORE the agent responds. `output.message` at hook time IS the user message. Checking it would mean checking user input against anti-derailment patterns, which blocked legitimate user communication in CP4.2.

**Why `messages.transform` is silent**: The hook fires AFTER agent responds with proper `role: 'assistant'` separation. Throwing errors here causes console spillover into the OpenCode UI. Instead, slop text is silently stripped.

**Why `tools.execute.before` errors are one-liners**: Throwing is how OpenCode blocks tool calls — there's no silent block mechanism. But the error text should be minimal.

**Why patterns are duplicated across guardian-hook.ts and firewall-patterns.ts**: Intentional. guardian-hook.ts has slightly different patterns tuned for command matching (tighter, with pipe/redirect detection). firewall-patterns.ts has broader patterns for text matching. They serve different purposes.

## License

MIT
