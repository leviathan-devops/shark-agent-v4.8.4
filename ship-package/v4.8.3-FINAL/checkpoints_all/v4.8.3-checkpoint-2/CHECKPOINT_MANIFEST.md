# Checkpoint 2: Two-Layer Firewall Implementation

**Created:** 2026-04-12
**Version:** shark-agent-v4.8.3-checkpoint-2
**MD5:** db85f58641e9f1776bfd36fca095af8c

## Architecture Gap (Critical)

`opencode run` mode BYPASSES the hook system:
- `chat.message` hook: ❌ Does NOT fire
- `tool.execute.before` hook: ❌ Does NOT fire  
- `messages.transform` hook: ❌ Does NOT fire

**Only TUI mode properly triggers all hooks.**

## What Works

| Component | TUI Mode | opencode run Mode |
|-----------|----------|-------------------|
| Brain init | ✅ | ✅ |
| shark-status | ✅ | ✅ |
| Layer 1 (tool) | ✅ | ❌ |
| Layer 2 (message) | ✅ | ❌ |
| Session cleanup | ✅ | ✅ |

```
v4.8.3-checkpoint-2/
├── src/
│   ├── hooks/v4.1/
│   │   ├── index.ts                    # Hook registration
│   │   ├── guardian-hook.ts           # Layer 1: Tool-based blocking (155 patterns)
│   │   ├── chat-message-hook.ts       # Layer 2: Message-based (TUI only)
│   │   ├── messages-transform-hook.ts # Layer 2b: Combined check (TUI only)
│   │   ├── session-hook.ts           # Session lifecycle + cleanup
│   │   ├── gate-hook.ts              # Evidence collection
│   │   ├── tool-summarizer-hook.ts  # Output truncation
│   │   ├── system-transform-hook.ts # Context injection
│   │   ├── compacting-hook.ts       # Session compaction
│   │   ├── agent-state.ts           # Agent tracking
│   │   └── utils.ts                 # Utilities
│   ├── shared/
│   │   ├── guardian.ts              # Zone-based protection
│   │   ├── gates.ts                # GateManager
│   │   ├── evidence.ts              # EvidenceCollector
│   │   ├── state-store.ts          # Domain ownership + cleanup
│   │   ├── messenger.ts             # Brain messaging + cleanup
│   │   └── agent-identity.ts        # isSharkAgent()
│   └── tools/
│       ├── shark-status.ts          # Status tool
│       ├── shark-gate.ts            # Gate tool
│       ├── shark-evidence.ts        # Evidence tool
│       ├── shark-test-runner.ts     # Container test runner
│       └── checkpoint.ts            # Checkpoint tool
├── dist/
│   └── index.js                    # 1MB bundle
├── node_modules/                   # Dependencies
└── package.json                   # Package config
```

## What Works

| Component | Status | Notes |
|-----------|--------|-------|
| Brain initialization | ✅ | `setCurrentAgent('shark')` fires |
| shark-status tool | ✅ | Shows correct state |
| shark-gate tool | ✅ | Shows all gates |
| shark-test-runner | ✅ | Tool executes |
| Layer 1 (tool) | ✅ | Blocks dangerous tools |
| Layer 2 (message) | ⚠️ | TUI only |
| Session cleanup | ✅ | All cleanup functions fire |
| Tool summarizer | ✅ | Truncates outputs |

## Architecture

```
TWO-LAYER FIREWALL:
├── Layer 1: tool.execute.before (ALL modes)
│   └── Checks toolArgs for patterns
├── Layer 2: chat.message (TUI only)
│   └── Checks user message input
└── Layer 2b: messages.transform (TUI only)
    └── Checks combined user + agent
```

## Restore Command

```bash
# Full restore
cp -r /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/.checkpoints/v4.8.3-checkpoint-2/* \
      /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/

# Rebuild if needed
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
rm -rf dist && bun build src/index.ts --outdir dist --target bun --format esm --bundle

# Deploy
cp dist/index.js ~/.config/opencode/plugins/shark-agent-v4/dist/
```

## TUI Test Commands

```bash
# Start container
docker kill $(docker ps -q --filter "name=shark-v483") 2>/dev/null
docker run --rm -d --name shark-v483-test --entrypoint /bin/bash \
  -v /tmp/shark-container-test/config:/root/.config/opencode \
  -v /tmp/shark-container-test/plugins:/root/.config/opencode/plugins \
  opencode-test:1.4.3 -c "sleep infinity"

# Test in TUI mode
docker exec -it shark-v483-test /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode --agent shark --model opencode/big-pickle

# Inside TUI, test these:
# - shark-status (should work)
# - "skip container test" (should block with L5.1)
# - "it works trust me" (should block with L5.2)
# - "let's just ship it" (should block with L5.9)
# - "npm test" (should block with L2)
```

## Anti-Derailment Patterns

| Layer | Name | Blocks | Evidence Required |
|-------|------|--------|------------------|
| L5.1 | Host Fallback | "use host instead" | No |
| L5.2 | Success Claim | "trust me it works" | Yes (passRate >= 0.96) |
| L5.3 | Model Restriction | "only use GPT" | No |
| L5.4 | Mock/Stub | "mocked data" | Yes |
| L5.5 | Simplification | "hand wave" | No |
| L5.6 | Confusion Pretend | "somewhat works" | No |
| L5.7 | Scope Creep | "while at it" | No |
| L5.8 | Undermining | "not worth it" | No |
| L5.9 | Impatience | "just ship it" | No |
| L5.10 | Self-Reference | "I verified it works" | Yes |

## MD5 Verification

After restore, verify with:
```bash
md5sum /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/dist/index.js
# Should match: dd485a5923da83e8c4e51858dfd9fe75
```
