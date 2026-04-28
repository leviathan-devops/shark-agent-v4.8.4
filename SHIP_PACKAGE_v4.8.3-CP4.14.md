# 🦈 SHARK AGENT v4.8.3 — SHIP PACKAGE CP4.14
## Fully Self-Contained Build, Debug, and Deploy Reference

---

## 1. BUILD METADATA

| Field | Value |
|-------|-------|
| **Ship Version** | v4.8.3-CP4.14 |
| **Build Date** | 2026-04-28 |
| **Git Commit** | ac81f93 |
| **SDK Target** | @opencode-ai/plugin@1.14.29 |
| **Build Tool** | bun (ESM bundle) |
| **Bundle Size** | 600KB (103 modules) |
| **Container Image** | opencode-test:1.14.29 |

## 2. CHECKPOINT HISTORY

| CP | What |
|----|------|
| 4.1 | 7 bugs discovered — L5 blocked user messages |
| 4.2 | First fix attempt (incomplete — output.path = input) |
| 4.3 | Real fix — chat.message brain init only |
| 4.4 | Audit — dead code removed, patterns narrowed |
| 4.5 | Identity fix — `prompt` field + system prompt rewrite |
| 4.6 | Console spillover — silent messages, short errors |
| 4.7 | Repo cleanup + comprehensive README |
| 4.8 | L5 blocking restored, L7+L8 patterns added |
| 4.9 | `bash`/`mcp_bash` added to DANGEROUS_TOOLS |
| 4.10 | Container image rebuilt to 1.14.29 |
| 4.11 | `output.args` fix for SDK 1.14.29 |
| 4.12 | Container diagnosis — root cause was host path mounts |
| 4.13 | Proper container setup per docs |
| 4.14 | L3 patterns fixed, all firewalls verified |

## 3. FIREWALL VERIFICATION (All TUI Tested)

| Layer | Test Command | Block Output | Status |
|-------|-------------|-------------|--------|
| L0 | Brain uninitialized dangerous tools | [L0 BLOCKED] | ✅ |
| L1 | `grep test \| wc -l` | [L1 BLOCKED] Counting theater | ✅ |
| L2 | `npm test` | [L2 BLOCKED] Fake test runner | ✅ |
| L3 | `stat /etc/hosts` | [L3 BLOCKED] Source inspection | ✅ |
| L4 | `opencode container run` | [L4 BLOCKED] Wrong container | ✅ |
| L5.1-L5.10 | Anti-derailment (messages.transform) | [L5.x] on agent output | ✅ |
| L5.7 | Cross-agent tools | [L5.7 BLOCKED] Cross-agent tool | ✅ |
| L6 | Zone-based file protection | [GUARDIAN] ZONE_VIOLATION | ✅ |
| L7 | Verification claims (patterns added) | [L7] | ✅ |
| L8 | Behavioral intelligence (15 signatures) | [L8] on detection | ✅ |

## 4. FILE LAYOUT (Key Files)

```
shark-agent-v4.8.3-REPO/
├── src/
│   ├── index.ts                        # Plugin entry — SharkAgent() default export
│   ├── hooks/v4.1/
│   │   ├── index.ts                    # Hook composition (8 hooks)
│   │   ├── guardian-hook.ts            # L0-L4 + L6 firewalls (248 lines)
│   │   ├── chat-message-hook.ts        # Brain init only (25 lines)
│   │   ├── messages-transform-hook.ts  # L5/L8 anti-derailment (124 lines)
│   │   ├── command-execute-hook.ts     # opencode run enforcement
│   │   ├── session-hook.ts             # Session lifecycle
│   │   ├── gate-hook.ts                # Gate enforcement
│   │   ├── compacting-hook.ts          # Compaction recovery
│   │   ├── system-transform-hook.ts    # Context injection
│   │   ├── tool-summarizer-hook.ts     # Tool summarizer
│   │   ├── agent-state.ts              # Session agent state Map
│   │   └── utils.ts                    # Command extraction
│   ├── shared/
│   │   ├── guardian.ts                 # Zone-based file permissions
│   │   ├── gates.ts                    # 6-gate pipeline
│   │   ├── evidence.ts                 # Evidence collector
│   │   ├── agent-identity.ts           # isSharkAgent() etc.
│   │   ├── firewall-patterns.ts        # ALL L1-L8 regex patterns
│   │   ├── state-store.ts              # Plugin state
│   │   └── messenger.ts                # Inter-plugin messaging
│   ├── shark/macro/brains.ts           # System prompt
│   └── tools/                          # 5 shark tools
└── dist/index.js                       # Bundled output (600KB)
```

## 5. DEPLOYMENT

### Quick Deploy
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/shark-agent-v4.8.3-REPO
bun run build
cp dist/index.js /home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent/dist/index.js
# Reload OpenCode
```

### opencode.json Config
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

### Container Test
```bash
# Setup (one time)
rm -rf /tmp/shark-container-test
mkdir -p /tmp/shark-container-test/config /tmp/shark-container-test/plugins/shark-agent-v4.8.3
cp -a ~/.config/opencode/. /tmp/shark-container-test/config/
cp dist/index.js /tmp/shark-container-test/plugins/shark-agent-v4.8.3/
cd /tmp/shark-container-test/config
python3 -c "
import json
cfg = json.load(open('opencode.json'))
cfg['plugin'].append('file:///root/.config/opencode/plugins/shark-agent-v4.8.3/index.js')
json.dump(cfg, open('opencode.json','w'), indent=2)
"

# Run TUI test
docker run -d --rm --name shark-test --entrypoint /bin/bash \
  -v /tmp/shark-container-test/config:/root/.config/opencode \
  -v /tmp/shark-container-test/plugins:/root/.config/opencode/plugins \
  opencode-test:1.14.29 -c "sleep 3600"

tmux new-session -d "docker exec -it shark-test \
  /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode \
  --agent shark"
```

## 6. ROLLBACK

```bash
# If needed, restore from checkpoint
cp -r .checkpoints/v4.8.3-checkpoint-4.14-SHIP/src ./
bun run build
cp dist/index.js /home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent/dist/index.js
```

## 7. CONTEXT ANCHORS (Injection Points)

| Document | Path |
|----------|------|
| Master Context | `Shared Workspace Context/Shark Agent/Master Context/SHARK_AGENT_MASTER_CONTEXT.md` |
| Compaction Launchpad | `Shared Workspace Context/Shark Agent/Master Context/COMPACTION_LAUNCHPAD.md` |
| Firewall Spec | `Shared Workspace Context/Shark Agent/Master Context/SYSTEM_BRAIN_FIREWALL_CONTEXT_LIBRARY.md` |
| TUI Testing | `Shared Workspace Context/Shark Agent/Master Context/Container Testing Context/TUI_CONTAINER_TESTING.md` |
| No-Excuses Guide | `Shared Workspace Context/Shark Agent/Master Context/Container Testing Context/TUI_TESTING_NO_EXCUSES_CONTEXT_OVERRIDE.md` |
| Hook Architecture | `Shared Workspace Context/Shark Agent/Master Context/Plugin Context/HOOK_ARCHITECTURE.md` |
| Hook Map | `Shared Workspace Context/Shark Agent/Master Context/Plugin Context/HOOK_MAP.md` |

## 8. KNOWN ISSUES

1. **brain: unknown** — chat.message hook sets brain state but shark-status reports "unknown". State store initialization gap.
2. **Container image 1.14.29** — may need rebuilding if opencode-ai is updated
3. **command-execute-hook.ts** — still has inline patterns (opencode run mode only, low priority)

## 9. GIT REPOSITORY

```
URL: https://github.com/leviathan-devops/shark-agent-v4.8.3
Branch: main
Commit: ac81f93 (CP4.14)
```

**END OF SHIP PACKAGE**
