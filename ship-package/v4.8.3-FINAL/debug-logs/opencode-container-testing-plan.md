# OpenCode Container Testing - Working Implementation Plan

## Problem Statement

Previous container test attempts failed because:
1. Agents used `opencode container run` which doesn't exist in opencode 1.4.2
2. Agents used static analysis (grep, cat, wc) instead of actual runtime testing
3. No mechanical enforcement to prevent slop theater
4. Container cleanup was not enforced, causing resource leaks

## Correct Approach: Carbon Copy Container

The container must be an **exact replica** of local OpenCode environment with the new plugin added on top.

### Step-by-Step Mechanical Process

#### Phase 1: Setup Test Directory

```bash
# Create timestamped test directory
TEST_DIR="/tmp/opencode-test-$(date +%s)"
mkdir -p "$TEST_DIR/config"

# Copy FULL local opencode config (plugins, opencode.json, everything)
cp -a ~/.config/opencode/. "$TEST_DIR/config/"

# Verify copy worked
ls -la "$TEST_DIR/config/"
```

#### Phase 2: Prepare Plugin in Temp Config

```bash
# Create plugin directory in temp config
mkdir -p "$TEST_DIR/config/plugins/shark-v482"

# Copy built plugin to temp config
cp -a /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/dist/* \
  "$TEST_DIR/config/plugins/shark-v482/"

# Verify plugin files exist
ls -la "$TEST_DIR/config/plugins/shark-v482/"
```

#### Phase 3: Update opencode.json in Temp Config

```bash
# Count original plugins
ORIGINAL_COUNT=$(jq '.plugin | length' "$TEST_DIR/config/opencode.json")
echo "Original plugin count: $ORIGINAL_COUNT"

# Add new plugin entry (absolute path inside container)
cd "$TEST_DIR/config"
jq --arg plugin_path "file:///root/.config/opencode/plugins/shark-v482/index.js" \
   '.plugin += [$plugin_path]' opencode.json > tmp.json && mv tmp.json opencode.json

# Verify new plugin was added
echo "New plugin count: $(jq '.plugin | length' opencode.json)"
cat opencode.json
```

#### Phase 4: Run Container Test

```bash
# Run container with full config mounted
docker run --rm -it \
  -v "$TEST_DIR/config":/root/.config/opencode \
  -w /root/.config/opencode \
  ghcr.io/anomalyco/opencode:latest \
  bash -c 'opencode run "shark-status" --plain 2>&1'
```

#### Phase 5: Verify Results

**Success criteria:**
- Output contains `brain: shark` or `brain: active`
- No plugin conflict errors (hook already registered, duplicate tool, etc.)
- No errors about missing files or broken imports

**Failure indicators:**
- `brain: unknown` = session hook not initializing brain
- `error` or `conflict` in output = plugin conflict
- Connection/auth errors = config not mounted correctly

#### Phase 6: Container Cleanup

The `--rm` flag automatically removes container on exit. But if container stays running:
```bash
# Manual cleanup
docker ps -a -q | xargs -r docker stop
docker ps -a -q | xargs -r docker rm
```

## Mechanical Enforcement Blocks

Add these to `guardian-hook.ts` to prevent slop theater:

### 1. SLOP_THEATER_BLOCK
**Pattern:** `grep | wc -l | cat.*verification`
**Error:** `[SLOP_THEATER] Static analysis is not testing. Use actual container.`

### 2. CARBON_COPY_REQUIRED
**Trigger:** Any docker run command that doesn't mount full `~/.config/opencode`
**Error:** `[CARBON_COPY_REQUIRED] Must mount full opencode config, not partial.`

### 3. CONFIG_INCOMPLETE
**Trigger:** opencode.json has fewer plugins than original config
**Error:** `[CONFIG_INCOMPLETE] Test config missing plugins. Carbon copy required.`

### 4. CONTAINER_LEAK_BLOCK
**Trigger:** Any deployment command when containers are still running
**Error:** `[CONTAINER_LEAK_BLOCK] Running containers detected. Clean up first.`

## Guardian Hook Implementation

```typescript
// In guardian-hook.ts - terminal command section

const CARBON_COPY_PATTERN = /docker\s+run.*-v.*\$HOME\/.config\/opencode/;
const SLOP_PATTERNS = [
  /grep.*pattern/i,
  /wc\s+-l.*\.(js|ts)/,
  /cat.*\.js.*verification/i,
];

// Block slop theater
for (const pattern of SLOP_PATTERNS) {
  if (pattern.test(command)) {
    throw new Error(`[SLOP_THEATER] Static verification detected.
      You MUST run actual opencode in a container.
      CORRECT: docker run --rm -v "$HOME/.config/opencode":/root/.config/opencode ...
      WRONG: grep, wc, cat on source files`);
  }
}

// Block incomplete config
if (/docker\s+run/i.test(command)) {
  if (!CARBON_COPY_PATTERN.test(command)) {
    throw new Error(`[CARBON_COPY_REQUIRED] Container must mount full opencode config.
      CORRECT:
        docker run --rm -v "$HOME/.config/opencode:/root/.config/opencode" ...
      WRONG:
        docker run --rm -v /tmp/test:/some/path ...
      
      The container needs your FULL opencode config to test properly.`);
  }
}
```

## Verification Test Sequence

### Manual Test (run this to verify container works)

```bash
# Full sequence that should work:
TEST_DIR="/tmp/opencode-test-$(date +%s)"
mkdir -p "$TEST_DIR/config"
cp -a ~/.config/opencode/. "$TEST_DIR/config/"
mkdir -p "$TEST_DIR/config/plugins/shark-v482"
cp -a /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/dist/* "$TEST_DIR/config/plugins/shark-v482/"
cd "$TEST_DIR/config"
jq --arg p "file:///root/.config/opencode/plugins/shark-v482/index.js" '.plugin += [$p]' opencode.json > tmp.json && mv tmp.json opencode.json

# Run container
docker run --rm \
  -v "$TEST_DIR/config":/root/.config/opencode \
  -w /root/.config/opencode \
  ghcr.io/anomalyco/opencode:latest \
  opencode run "shark-status" --plain 2>&1
```

### Expected Output (success)
```
[Shark Session Hook] event.type=session.created, agent=shark, getCurrentAgent()=undefined
[Agent State] BRAIN INITIALIZED: setCurrentAgent("shark")
[Shark Session Hook] setCurrentAgent(shark) called, getCurrentAgent()=shark
brain: shark
```

### Expected Output (failure - brain unknown)
```
brain: unknown
[Guardian CRITICAL] brain: unknown - setCurrentAgent() was never called!
```

## File Locations

| File | Purpose |
|------|---------|
| `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/dist/index.js` | Built plugin |
| `~/.config/opencode/opencode.json` | Local opencode config |
| `/tmp/opencode-test-*/config/` | Temp carbon copy |
| `.shark/evidence/container-test.json` | Test evidence file |

## Evidence File Format

After successful container test, create evidence:

```json
{
  "timestamp": "2026-04-09T...",
  "plugin_version": "v4.8.2",
  "docker_image": "ghcr.io/anomalyco/opencode:latest",
  "test_output": "brain: shark",
  "plugins_loaded": ["shark-agent-v482", "..."],
  "passed": true
}
```

## Common Failure Modes

1. **brain: unknown**
   - Session hook not receiving agent info
   - Fix: Check session-hook.ts event extraction logic

2. **Plugin not loading**
   - Path in opencode.json incorrect
   - Fix: Verify absolute path inside container

3. **Container exits immediately**
   - opencode.json malformed
   - Fix: Validate JSON before running container

4. **Resource leak (container keeps running)**
   - Forgot --rm flag
   - Fix: Always use --rm, or run cleanup after

## Integration with Guardian Enforcement

The guardian hook should:
1. Block any terminal command with SLOP patterns (grep/wc/cat verification)
2. Block any docker run without CARBON_COPY_PATTERN
3. Block any deployment when docker ps returns containers
4. Require evidence file before shipping

## Testing the Enforcement

1. Run the manual test sequence above
2. Verify container test produces evidence file
3. Verify brain shows "shark" not "unknown"
4. Verify no plugin conflicts in output

## v4.8.2 Status

- **Build**: Complete (1.0 MB bundle)
- **Session hook fix**: Multi-source agent extraction + debug logging
- **Agent state**: Brain init flag + logging
- **Guardian**: BRAIN_FAILURE_BLOCK + CONTAINER_LEAK_BLOCK
- **NOT YET TESTED**: Container workflow with carbon copy approach
