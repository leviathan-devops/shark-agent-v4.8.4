# MASTER PROMPT: Carbon‑Copy Container for OpenCode Plugin Testing

Use this prompt to instruct any agent (or yourself) on how to create a **containerized OpenCode runtime environment** that replicates the user's local OpenCode as closely as possible. This environment is used to **pre‑ship test plugins** – catching conflicts, verifying brain initialization, and ensuring all mechanical firewalls work – before deploying to the live OpenCode instance.

---

## 1. Core Principles (Must Follow)

- **No `opencode container` commands** – they do not exist in OpenCode ≤1.4.2. Use **plain Docker**.
- **Carbon copy** the user's local OpenCode configuration (including all active plugins) into the container.
- **Add the new plugin** to that copied configuration – do not overwrite existing plugins.
- **Use the same OpenCode version** as the user's local version if possible; otherwise, use the **latest available** and note the mismatch.
- **All testing runs inside the container** – zero modifications to the host's config or files.
- **Containers are automatically cleaned up** after the test (`--rm` flag).

---

## 2. Step‑by‑Step Mechanical Process

### 2.1 Gather Local OpenCode Information

```bash
# Get OpenCode version
opencode --version

# Locate config directory
echo "$HOME/.config/opencode"

# List installed plugins
cat ~/.config/opencode/opencode.json | jq '.plugin'
```

### 2.2 Create Temporary Workspace

```bash
TEST_DIR="/tmp/opencode-test-$(date +%s)"
mkdir -p "$TEST_DIR"
```

### 2.3 Copy Entire Local Config

```bash
cp -a ~/.config/opencode "$TEST_DIR/config"
```

### 2.4 Prepare New Plugin

```bash
mkdir -p "$TEST_DIR/config/plugins/new-plugin"
cp -r /path/to/plugin/dist/* "$TEST_DIR/config/plugins/new-plugin/"
```

### 2.5 Update opencode.json

```bash
cd "$TEST_DIR/config"
jq '.plugin += ["file:///root/.config/opencode/plugins/new-plugin/index.js"]' opencode.json > tmp.json && mv tmp.json opencode.json
```

### 2.6 Determine Docker Image

```bash
# Check container version
docker run --rm ghcr.io/anomalyco/opencode:latest opencode --version
```

### 2.7 Run Container Test

**Non‑interactive:**
```bash
docker run --rm \
  -v "$TEST_DIR/config":/root/.config/opencode \
  -w /root/.config/opencode \
  ghcr.io/anomalyco/opencode:latest \
  opencode run "shark-status" --plain
```

**Interactive:**
```bash
docker run --rm -it \
  -v "$TEST_DIR/config":/root/.config/opencode \
  -w /root/.config/opencode \
  ghcr.io/anomalyco/opencode:latest \
  bash
```

### 2.8 Verify Plugin Loading

```bash
opencode run "shark-status" --plain
# Should show brain: shark NOT brain: unknown
```

### 2.9 Capture Evidence

```bash
mkdir -p "$TEST_DIR/artifacts"
docker run --rm \
  -v "$TEST_DIR/config":/root/.config/opencode \
  -v "$TEST_DIR/artifacts":/artifacts \
  -w /root/.config/opencode \
  ghcr.io/anomalyco/opencode:latest \
  bash -c "opencode run 'shark-status' --plain > /artifacts/test-output.log 2>&1 && echo 'PASS' > /artifacts/result.txt"
```

---

## 3. Debugging

| Problem | Solution |
|---------|----------|
| Shows help instead of running | Use `opencode run "message" --plain` |
| Plugin not loaded | Check path in opencode.json matches mounted location |
| Version mismatch | Note in test report, use latest available |

---

## 4. Ship Gate Requirements

Evidence file `.shark/evidence/container-test.json` must contain:
- Timestamp
- Plugin version
- Docker image ID
- Output showing `brain: shark`

---

## 5. Quick Test Command

```bash
PLUGIN_SRC="/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/dist"
TEST_DIR="/tmp/opencode-test-$(date +%s)"
mkdir -p "$TEST_DIR"
cp -a ~/.config/opencode "$TEST_DIR/config"
mkdir -p "$TEST_DIR/config/plugins/shark-v482"
cp -r "$PLUGIN_SRC"/* "$TEST_DIR/config/plugins/shark-v482/"
cd "$TEST_DIR/config"
jq '.plugin += ["file:///root/.config/opencode/plugins/shark-v482/index.js"]' opencode.json > tmp.json && mv tmp.json opencode.json
docker run --rm -v "$TEST_DIR/config":/root/.config/opencode -w /root/.config/opencode ghcr.io/anomalyco/opencode:latest opencode run "shark-status" --plain
```

---

## 6. Version Info

- **Local opencode**: 1.4.2 (npm installed)
- **Container image**: ghcr.io/anomalyco/opencode:latest = 1.3.17
- **Version mismatch**: YES - container is 1.3.17, local is 1.4.2

## 7. Current Plugin Location

**v4.8.2 built bundle**: `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/dist/index.js`
