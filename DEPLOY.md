# Shark Agent v4.8.3 — Deployment Guide

## Quick Deploy

```bash
# 1. Clone
git clone https://github.com/leviathan-devops/shark-agent-v4.8.3.git
cd shark-agent-v4.8.3

# 2. Build
bun install
bun run build

# 3. Copy to OpenCode plugins directory
cp dist/index.js ~/OPENCODE_WORKSPACE/plugins/shark-agent/dist/index.js

# 4. Verify opencode.json has the plugin path
# Check ~/.config/opencode/opencode.json contains:
# "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent/dist/index.js"

# 5. Reload OpenCode
# Restart opencode or press Ctrl+R in TUI
```

## OpenCode Plugin Configuration

Your `~/.config/opencode/opencode.json` must include the shark plugin:

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

## Plugin Loading Order

Plugins must load in this order:
1. opencode-subagent-manager
2. kraken-agent
3. shark-agent
4. manta-agent

## Verification

```bash
# Check agent listing
opencode agent list
# Should show: shark (primary)

# Check config valid
opencode debug config
# Should show shark plugin without errors

# TUI container test (REQUIRED for ship verification)
docker run -d --rm \
  --entrypoint /bin/bash \
  -v ~/.config/opencode:/root/.config/opencode \
  opencode-test:1.4.3 \
  -c "sleep 3600"

docker exec -it CONTAINER \
  /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode \
  --agent shark
```

## Rollback

```bash
# Restore from checkpoint
cp .checkpoints/v4.8.3-checkpoint-4.1-BUG-DISCOVERY/src/hooks/v4.1/* \
   src/hooks/v4.1/
bun run build
cp dist/index.js ~/OPENCODE_WORKSPACE/plugins/shark-agent/dist/index.js
```

## Cross-Plugin Compatibility

Shark Agent shares the OpenCode ecosystem with:
- **kraken-agent**: Orchestration — must not have shark hooks applied
- **manta-agent**: Debugging — must not have shark hooks applied
- **vanilla agents** (plan, build, general, explore): Must pass through without shark interference

Each shark hook checks `isSharkAgent(agent)` as first executable line.

## Known Issues

1. Container image `opencode-test:1.4.3` may need updating if local opencode version changes
2. L1-L4 command firewall patterns in guardian-hook.ts differ slightly from shared firewall-patterns.ts (intentional — tool-level patterns are more lenient)
3. command-execute-hook.ts still has inline patterns (opencode run mode only, low priority)
