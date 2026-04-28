# TUI CONTAINER TESTING - THE ONLY VALID TEST

**`opencode run` IS BROKEN. USE TUI MODE.**

---

## WHY `opencode run` FAILS

The `opencode run` command:
- Does NOT fire `chat.message` hook
- Does NOT fire `tool.execute.before` hook
- Does NOT fire `tool.execute.after` hook
- Does NOT fire `messages.transform` hook
- Only fires `command.execute.before` (unreliably)

**Result:** Your plugin loads but hooks don't fire. You think it works. It doesn't.

---

## HOOK SUPPORT BY COMMAND

| Command | chat.message | tool.before | tool.after | messages.transform |
|---------|--------------|------------|------------|-------------------|
| `opencode run` | ❌ | ❌ | ❌ | ❌ |
| `opencode serve` | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| `opencode /workspace` (TUI) | ✅ | ✅ | ✅ | ✅ |

---

## TUI TEST WORKFLOW

### Step 1: Build Custom Docker Image

The official `ghcr.io/anomalyco/opencode:latest` is version 1.3.17. Your local is 1.4.3. **Mismatch causes failures.**

```bash
# Clone OpenCode
git clone https://github.com/anomalyco/opencode.git opencode-test
cd opencode-test

# Build image matching your local version
docker build -t opencode-test:local .
```

### Step 2: Prepare Test Config

```bash
TEST_DIR="/tmp/tui-test-$(date +%s)"
mkdir -p "$TEST_DIR/config/plugins"

# Copy your local OpenCode config as base
cp -a ~/.config/opencode "$TEST_DIR/config"

# Backup current config
cp ~/.config/opencode/opencode.json ~/.config/opencode/opencode.json.backup

# Create test config with ONLY the plugin under test
cat > "$TEST_DIR/config/opencode.json" << 'EOF'
{
  "plugin": [
    "file:///root/.config/opencode/plugins/my-plugin/dist/index.js"
  ]
}
EOF
```

### Step 3: Copy Plugin

```bash
mkdir -p "$TEST_DIR/config/plugins/my-plugin"
cp -r /path/to/plugin/dist/* "$TEST_DIR/config/plugins/my-plugin/dist/"
```

### Step 4: Start Container

```bash
docker run --rm -d \
  --name tui-test \
  -v "$TEST_DIR/config":/root/.config/opencode \
  opencode-test:local \
  sleep infinity
```

### Step 5: Launch TUI

```bash
docker exec -it tui-test \
  /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode \
  --agent my-agent
```

**IMPORTANT:** Use the full path to the binary inside the container. Don't just run `opencode`.

### Step 6: Test in TUI

Inside the container, test:

1. **Agent in tab toggle?** Look for your agent name
2. **Tool works?** Run `/my-status` or a basic command
3. **Guardian fires?** Try a blocked pattern
4. **Memory stable?** Run `free -h`

### Step 7: Cleanup

```bash
docker kill tui-test
rm -rf "$TEST_DIR"
```

---

## CROSS-PLUGIN TESTING

After testing your plugin alone, test with others:

```bash
# Update config with BOTH plugins
cat > "$TEST_DIR/config/opencode.json" << 'EOF'
{
  "plugin": [
    "file:///root/.config/opencode/plugins/manta/dist/index.js",
    "file:///root/.config/opencode/plugins/my-plugin/dist/index.js"
  ]
}
EOF

# Restart container and test:
# - Both agents in tab toggle?
# - Manta still works?
# - My plugin still works?
# - No conflicts?
```

---

## MEMORY TESTING

```bash
# Before plugin load
docker exec tui-test free -h

# After plugin load  
docker exec tui-test free -h

# If > 80% used: DO NOT SHIP
```

---

## COMMON FAILURES IN TUI TEST

| Symptom | Cause | Fix |
|---------|-------|-----|
| TUI won't start | Version mismatch | Build custom image |
| Agent not in dropdown | `config` callback failed | Check callback syntax |
| Tools don't work | Hooks not firing | Use TUI, not `run` |
| Container crashes | Memory issue | Check free -h |
| Permission error | Path issue | Use full absolute paths |

---

## TEST ARTIFACTS TO CAPTURE

- Container startup logs
- TUI session output
- Memory before/after
- Screenshot of tab toggle

---

**END OF TUI TESTING GUIDE**
