# 🦈 Shark Agent v4.8.3

**Triple-brain execution agent for OpenCode with mechanical gate enforcement and L0-L8 firewall system.**

## Architecture

Shark Agent operates as an OpenCode plugin, hooking into the `tool.execute.before`, `chat.message`, and `messages.transform` hooks to enforce:

| Layer | System | Hook | Purpose |
|-------|--------|------|---------|
| L0 | Identity Wall | tool.execute.before | Blocks dangerous tools when brain uninitialized |
| L1 | Theatrical Detection | tool.execute.before | Blocks counting theater (grep \| wc) |
| L2 | Fake Test Runner | tool.execute.before | Blocks test frameworks bypassing OpenCode |
| L3 | Source Inspection | tool.execute.before | Blocks "file exists = works" logic |
| L4 | Wrong Container | tool.execute.before | Blocks hallucinated container commands |
| L5.x | Anti-Derailment | messages.transform | Blocks agent output slop (host fallback, success claims, model excuses, mock data, oversimplification, confusion pretense, scope creep, undermining, impatience, self-reference) |
| L5.7 | Cross-Agent Tools | tool.execute.before | Mechanical block of direct agent tool invocations |
| L6 | Zone Protection | tool.execute.before | Zone-based file write protection |

## Key Design Decisions (v4.8.3 CP4.4)

1. **User messages NEVER checked against anti-derailment patterns** — only agent output
2. **chat.message hook does ONLY brain initialization** — all text checking is in messages.transform which properly separates user/assistant roles
3. **Single source of truth** for patterns in `src/shared/firewall-patterns.ts`
4. **Tool-level L5 text checks removed** — tool args are not natural language

## Build

```bash
bun run build
# Output: dist/index.js (~600KB)
```

## Deployment

See [DEPLOY.md](DEPLOY.md) for full deployment instructions.

## Tools

- `shark-status` — Agent status display
- `shark-gate` — Gate evaluation (plan/build/test/verify/audit/delivery)
- `shark-evidence` — Evidence collection status
- `shark-test-runner` — Container test execution
- `checkpoint` — Create/restore build checkpoints

## Checkpoint History

| CP | Description |
|----|-------------|
| v4.8.3-checkpoint-4.1 | Bug discovery — 7 bugs found including L5 user message blocking |
| v4.8.3-checkpoint-4.2 | First L5 fix attempt (incomplete) |
| v4.8.3-checkpoint-4.3 | Real fix — chat.message brain init only |
| v4.8.3-checkpoint-4.4 | Clean — dead code removed, cross-agent gap closed, all TUI tested |

## Testing

**NUCLEAR RULE: If not tested in TUI container, it was NOT tested.**

```bash
# Build
bun run build

# Deploy
cp dist/index.js ~/OPENCODE_WORKSPACE/plugins/shark-agent/dist/index.js

# TUI test
docker run -d --rm --entrypoint /bin/bash -v ~/.config/opencode:/root/.config/opencode opencode-test:1.4.3 -c "sleep 3600"
tmux new-session -d "docker exec -it CONTAINER opencode --agent shark"
tmux send-keys -t session "test message" Enter
tmux capture-pane -t session -p -S -40 | strings
```

## License

MIT
