# OpenCode Container Test Workflow (v4.8.2) - UPDATED

## Critical Discovery: Version Mismatch Problem

**Container image `ghcr.io/anomalyco/opencode:latest` is version 1.3.17, NOT 1.4.2**

The `run` command is **broken in 1.3.17** - it shows help instead of executing commands.

**Local opencode is 1.4.2** (installed via npm-global at `~/.npm-global/bin/opencode`)

**The `opencode` package is NOT on npm registry** - it must be installed via a custom path or binary.

---

## Current Status

| Environment | Version | `opencode run` | Works? |
|-------------|---------|-----------------|--------|
| Local host | 1.4.2 | Works | ✅ |
| Container (latest) | 1.3.17 | Broken | ❌ |
| Custom container | ? | Untested | ? |

---

## Installing OpenCode

**Local installation path:**
```
/home/leviathan/.npm-global/bin/opencode
→ ../lib/node_modules/opencode-ai/bin/opencode
```

**To find your version:**
```bash
opencode --version
```

---

## Building Custom Container Image

**FAILS** - opencode is not on npm registry:
```bash
docker run --rm ghcr.io/anomalyco/opencode:latest npm install -g opencode@1.4.2
# Error: opencode@1.4.2 is not in this registry
```

**Alternative approach needed:**

Option 1: Docker with local binary mounted
```bash
docker run --rm \
  -v /home/leviathan/.npm-global:/root/.npm-global \
  -v "$HOME/.config/opencode":/root/.config/opencode \
  -w /root/.config/opencode \
  node:20-bullseye \
  bash -c "ln -s /root/.npm-global/bin/opencode /usr/local/bin/opencode && opencode run 'shark-status' --agent shark"
```

Option 2: Use local opencode directly (no container)
```bash
opencode run "shark-status" --agent shark
```

---

## Step-by-Step Test Workflow (Working on Local)

### 1. Create isolated test directory (no host file access)
```bash
TEST_DIR="/tmp/shark-isolated-test-$(date +%s)"
mkdir -p "$TEST_DIR"
```

### 2. Copy local config and plugin
```bash
cp -a ~/.config/opencode "$TEST_DIR/config"
mkdir -p "$TEST_DIR/plugins"
cp -r /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/dist "$TEST_DIR/plugins/shark-v482"
```

### 3. Update opencode.json
```bash
cd "$TEST_DIR/config"
jq '.plugin += ["file:///root/.config/opencode/plugins/shark-v482/index.js"]' opencode.json > tmp.json && mv tmp.json opencode.json
```

### 4. Test on LOCAL 1.4.2 (VERIFIED WORKING)
```bash
OPENCODE_CONFIG_DIR="$TEST_DIR/config" opencode run "shark-status" --agent shark
```

---

## Anti-Slop Firewall Layers (v4.8.2) - ALL VERIFIED WORKING

| Layer | Pattern Set | Blocks | Status |
|-------|-------------|--------|--------|
| L1 | `STATIC_VERIFICATION_PATTERNS` | grep, wc, cat\|grep | ✅ Local 1.4.2 |
| L2 | `FAKE_TEST_RUNNER_PATTERNS` | node test.js, jest, vitest | ✅ Local 1.4.2 |
| L3 | `SOURCE_INSPECTION_PATTERNS` | test -f, ls dist/ | ✅ Local 1.4.2 |
| L4 | `WRONG_CONTAINER_PATTERNS` | opencode container run | ✅ Local 1.4.2 |
| L5 | `CARBON_COPY_PATTERN` | Docker without $HOME mount | ⚠️ Overly restrictive - needs fix |

---

## Firewall Error Messages (Verified Working)

### ANTI-SLOP LAYER 1
```
[ANTI-SLOP LAYER 1] Static verification is SLOP, not work.
This command "grep -c setCurrentAgent src/" is using pattern matching to "verify" code exists.
This is THEATRICAL - it does NOT prove the code works at runtime.
```

### ANTI-SLOP LAYER 2
```
[ANTI-SLOP LAYER 2] Fake test runner detected.
"node run-tests.js" is using a standalone test runner WITHOUT opencode.
This is SLOP because it runs tests WITHOUT opencode plugin hooks.
```

### ANTI-SLOP LAYER 3
```
[ANTI-SLOP LAYER 3] Source inspection is SLOP.
This command "test -f dist/index.js..." is inspecting source files to "verify" work.
Checking if files exist or contain patterns does NOT prove the code works.
```

### ANTI-SLOP LAYER 4
```
[ANTI-SLOP LAYER 4] "opencode container" commands do not exist.
"opencode container run" uses hallucinated commands that do NOT exist.
```

---

## Key Findings from Testing

1. **Brain initialization works** - `shark-status` shows `brain: shark` when plugin loaded
2. **Chat message hook fixes brain init** - `session.created` doesn't have agent field, but `chat.message` does
3. **Container version mismatch** - can't use container for testing without custom build
4. **Local 1.4.2 is fully functional** - all anti-slop firewalls work on local
5. **CARBON_COPY check is overly restrictive** - it fires on ALL docker run, not just testing

---

## Known Issues

### Issue 1: CARBON_COPY check is too broad
**Problem:** Guardian blocks ANY `docker run` command that doesn't mount $HOME/.config/opencode
**Current behavior:** Even `docker run --rm hello-world` triggers it
**Needs fix:** Only block when docker run is used WITH opencode for testing

### Issue 2: Container testing not working
**Problem:** Container 1.3.17 has broken `opencode run`
**Solution:** Use local 1.4.2 for testing, or build custom container image

### Issue 3: Config overwrites
**Problem:** Testing can accidentally overwrite ~/.config/opencode
**Solution:** Always restore from backup after testing

---

## Testing Commands (Local 1.4.2)

```bash
# Test actual functionality - should work
opencode run "shark-status" --agent shark

# Test anti-slop L1 - should block
opencode run "grep -c setCurrentAgent src/" --agent shark

# Test anti-slop L2 - should block
opencode run "node run-tests.js" --agent shark

# Test anti-slop L4 - should block
opencode run "opencode container run -- echo test" --agent shark
```

---

## Evidence Files

After successful test, create:
```
/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/.shark/evidence/delivery/ContainerTestResult.json
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/dist/index.js` | Built plugin (1.0 MB) |
| `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/hooks/v4.1/guardian-hook.ts` | Guardian + anti-slop |
| `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/hooks/v4.1/chat-message-hook.ts` | Brain initialization |
| `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/hooks/v4.1/session-hook.ts` | Session lifecycle |
| `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/ANTI_SLOP_FIREWALLS.md` | Anti-slop documentation |
| `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/V4.8.2_COMPLETE_REFERENCE.md` | Full v4.8.2 reference |
