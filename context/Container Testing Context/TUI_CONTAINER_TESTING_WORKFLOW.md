# TUI CONTAINER TESTING WORKFLOW — COMPREHENSIVE GUIDE

**Purpose:** Proper testing workflow for OpenCode plugins in TUI container mode
**Critical:** `opencode run` has BROKEN hooks. ONLY TUI mode works.

---

## WHY `opencode run` FAILS

The `opencode run` command:
- ❌ Does NOT fire `chat.message` hook
- ❌ Does NOT fire `tool.execute.before` hook  
- ❌ Does NOT fire `tool.execute.after` hook
- ❌ Does NOT fire `messages.transform` hook
- ⚠️ Only fires `command.execute.before` (unreliably)

**Result:** Your plugin loads but hooks don't fire. You think it works. It doesn't.

---

## HOOK SUPPORT BY COMMAND

| Command | chat.message | tool.before | tool.after | messages.transform |
|---------|--------------|-------------|------------|-------------------|
| `opencode run` | ❌ | ❌ | ❌ | ❌ |
| `opencode serve` | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| `opencode /workspace` (TUI) | ✅ | ✅ | ✅ | ✅ |

---

## VERSION MISMATCH WARNING

The official container `ghcr.io/anomalyco/opencode:latest` is version **1.3.17**.
Your local is version **1.4.3**.

**Mismatched versions cause failures.** Build a custom image matching your local version.

---

## TUI TEST WORKFLOW

### Step 1: Build Custom Docker Image

```bash
# Create directory for container build
mkdir -p /home/leviathan/OPENCODE_WORKSPACE/container-build
cd /home/leviathan/OPENCODE_WORKSPACE/container-build

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:20-bullseye

ENV DEBIAN_FRONTEND=noninteractive
ENV npm_config_noninteractive=true

WORKDIR /opt/opencode

# Install bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Install opencode-ai matching your local version
RUN npm install -g opencode-ai@1.4.3

# Verify
RUN opencode --version

# Create required directories
RUN mkdir -p /root/.config/opencode /root/.shark/evidence

ENTRYPOINT ["opencode"]
EOF

# Build image
docker build -t opencode-test:1.4.3 .
```

### Step 2: Prepare Test Config

```bash
# Create isolated test directory
TEST_DIR="/tmp/kraken-tui-test-$(date +%s)"
mkdir -p "$TEST_DIR/config/plugins"

# Create test opencode.json with ONLY the plugin under test
cat > "$TEST_DIR/config/opencode.json" << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "minimax": {}
  },
  "plugin": [
    "file:///root/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js"
  ]
}
EOF

echo "Test config created at: $TEST_DIR"
```

### Step 3: Copy Plugin to Test Config

```bash
# Copy your built plugin
PLUGIN_DIR="/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0"
mkdir -p "$TEST_DIR/config/plugins/kraken-agent-v2.0"
cp -r "$PLUGIN_DIR/dist/"* "$TEST_DIR/config/plugins/kraken-agent-v2.0/dist/"

# Verify files copied
ls -la "$TEST_DIR/config/plugins/kraken-agent-v2.0/dist/"
```

### Step 4: Verify Config is Valid (Before Starting Container)

```bash
# Run config debug outside container first
docker run --rm \
  --entrypoint /bin/sh \
  -v "$TEST_DIR/config:/root/.config/opencode" \
  opencode-test:1.4.3 \
  -c '/usr/local/lib/node_modules/opencode-ai/bin/.opencode debug config'
```

**Expected:** Shows resolved config with your plugin
**If you see:** `Error: Configuration is invalid` → Fix JSON format

### Step 5: Start Container with TUI

```bash
# Start container with interactive TUI
docker run -it --rm \
  --name kraken-tui-test \
  -v "$TEST_DIR/config:/root/.config/opencode" \
  opencode-test:1.4.3
```

**This launches the actual OpenCode TUI inside the container.**

### Step 6: Inside TUI - Verify Plugin Loaded

Look for these indicators on startup:
```
[Kraken V2.0] Plugin loaded
[Kraken V2.0] Initializing multi-brain orchestrator...
[Kraken] Session created, initializing brains...
[Kraken] All brains initialized
```

If you see `Error: Configuration is invalid` → Config JSON is malformed

### Step 7: Test Hooks Are Firing

Run a command that triggers hooks:

```bash
# In TUI, use the read tool to trigger tool.execute.before/after
/read /home/leviathan/OPENCODE_WORKSPACE/README.md

# Look for these log messages:
[Kraken] Tool Guardian: checking tool=read
[Kraken] Gate evaluation for gate=BUILD
```

### Step 8: Test Cross-Plugin Compatibility

```bash
# Start container with MULTIPLE plugins
cat > "$TEST_DIR/config/opencode.json" << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "minimax": {}
  },
  "plugin": [
    "file:///root/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js",
    "file:///root/.config/opencode/plugins/manta-agent/dist/index.js",
    "file:///root/.config/opencode/plugins/shark-agent/dist/index.js"
  ]
}
EOF

# Launch TUI and verify:
# 1. All plugins load without errors
# 2. Tab toggle shows all agents
# 3. Each agent works correctly
```

### Step 9: Test Compaction Survival

```bash
# Trigger compaction by adding content until ~85% tokens
# Or use the opencode compact command if available

# After compaction, verify:
# 1. Session recreated
# 2. [Kraken] Compaction recovery file found message
# 3. Context restored from /tmp/kraken-compaction/
```

---

## DEBUGGING TUI IN CONTAINER

### Check Logs Inside Container

```bash
# From another terminal, check container logs
docker logs kraken-tui-test 2>&1 | tail -100
```

### Check Plugin Files Exist

```bash
docker exec kraken-tui-test ls -la /root/.config/opencode/plugins/kraken-agent-v2.0/dist/
```

### Check OpenCode Version

```bash
docker exec kraken-tui-test opencode --version
```

### Manually Test Hooks

```bash
# Inside container TUI, type:
/kraken-status

# Should show:
# {
#   "version": "2.0.0",
#   "initialized": true,
#   "systemBrain": true,
#   "executionBrain": true,
#   "planningBrain": true,
#   ...
# }
```

---

## COMMON FAILURES

### Failure: "Error: Configuration is invalid"

**Cause:** Malformed JSON in opencode.json

**Fix:** 
1. Run `opencode debug config` outside container to validate
2. Check JSON syntax: no trailing commas, proper quotes

### Failure: Plugin not loading

**Cause:** File path wrong in plugin config

**Fix:**
1. Verify path: `file:///root/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js`
2. Check file exists: `ls -la /root/.config/opencode/plugins/kraken-agent-v2.0/dist/`

### Failure: Hooks not firing

**Cause:** Using `opencode run` instead of TUI

**Fix:**
1. Must use TUI: `docker run -it ...`
2. `opencode run` does NOT fire hooks

### Failure: Cross-plugin conflict

**Cause:** Two plugins registering same hooks without coordination

**Fix:**
1. Each plugin must check identity wall before acting
2. Use `agent` field from `chat.message` to identify caller

---

## PRE-SHIP TESTING CHECKLIST

Before shipping ANY plugin:

- [ ] Config validated with `opencode debug config`
- [ ] Plugin loads in TUI without errors
- [ ] All hooks fire in TUI (not `opencode run`)
- [ ] Cross-plugin: Manta and Shark still work
- [ ] Compaction: context survives
- [ ] Memory: DB size < 500MB after testing
- [ ] No console errors in TUI

---

## CONTAINER TEST COMMANDS REFERENCE

```bash
# Build custom image
docker build -t opencode-test:1.4.3 /home/leviathan/OPENCODE_WORKSPACE/container-build/

# Run TUI test
docker run -it --rm \
  --name kraken-tui-test \
  -v /tmp/kraken-tui-test:/root/.config/opencode \
  opencode-test:1.4.3

# Check logs
docker logs kraken-tui-test 2>&1

# Stop container
docker stop kraken-tui-test

# Validate config
docker run --rm \
  --entrypoint /bin/sh \
  -v /tmp/kraken-tui-test:/root/.config/opencode \
  opencode-test:1.4.3 \
  -c '/usr/local/lib/node_modules/opencode-ai/bin/.opencode debug config'
```

---

**NUCLEAR RULE:** If it wasn't tested in TUI container, it was NOT tested.
