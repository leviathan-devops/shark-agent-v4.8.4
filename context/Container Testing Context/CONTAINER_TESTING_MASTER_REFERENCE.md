# SHARK AGENT CONTAINER TESTING CONTEXT LIBRARY

**Created:** 2026-04-12
**Version:** 1.0
**Purpose:** Complete reference for container testing mechanics and workflows

---

## TABLE OF CONTENTS

1. [Quick Reference](#1-quick-reference)
2. [Container Test Workflow](#2-container-test-workflow)
3. [Working Commands](#3-working-commands)
4. [Critical Discoveries](#4-critical-discoveries)
5. [Evidence Schema](#5-evidence-schema)
6. [Test Commands by Layer](#6-test-commands-by-layer)
7. [Success Criteria](#7-success-criteria)
8. [File Reference](#8-file-reference)

---

## 1. QUICK REFERENCE

### Docker Image
```
opencode-test:1.4.3
```

### OpenCode Binary Path (inside container)
```
/usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode
```

### CRITICAL: Model Requirements
- **USE FREE MODELS ONLY**: Google Gemma or OpenCode Zen models
- **NEVER use paid models** (minimax, anthropic, etc.) during container testing
- **BANNED**: gpt-5-nano, minimax/*, any model requiring API keys
- **APPROVED**: `gemma-4-31b-it`, `gemma-4-26b-it`, `opencode/big-pickle`, `opencode/nemotron-3-super-free`

---

## 2. CONTAINER TEST WORKFLOW

### Phase 1: Build Plugin

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
rm -rf dist && bun build src/index.ts --outdir dist --target bun --format esm --bundle
md5sum dist/index.js
```

### Phase 2: Prepare Test Directory

```bash
# Create test directory
TEST_DIR="/tmp/shark-container-test-$(date +%s)"
mkdir -p "$TEST_DIR/config" "$TEST_DIR/plugins"

# Copy full local opencode config
cp -a ~/.config/opencode/. "$TEST_DIR/config/"

# Copy built plugin to test location
mkdir -p "$TEST_DIR/plugins/shark-agent-v4.8.3-test"
cp /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/dist/index.js \
   "$TEST_DIR/plugins/shark-agent-v4.8.3-test/"

# Update opencode.json to include new plugin
cd "$TEST_DIR/config"
jq --arg plugin_path "file:///root/.config/opencode/plugins/shark-agent-v4.8.3-test/index.js" \
   '.plugin += [$plugin_path]' opencode.json > tmp.json && mv tmp.json opencode.json
```

### Phase 3: Start Container

```bash
# Kill any existing test container
docker kill $(docker ps -q --filter "name=shark-v483") 2>/dev/null

# Start fresh container
docker run --rm -d --name shark-v483-test \
  --entrypoint /bin/bash \
  -v /tmp/shark-container-test-full/config:/root/.config/opencode \
  -v /tmp/shark-container-test/plugins:/root/.config/opencode/plugins \
  opencode-test:1.4.3 \
  -c "sleep infinity"
```

### Phase 4: Run Tests

```bash
# Test brain initialization
docker exec shark-v483-test /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode run "Call shark-status" --agent shark -m opencode/big-pickle

# Test gate system
docker exec shark-v483-test /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode run "Call shark-gate" --agent shark -m opencode/big-pickle

# Test container test runner
docker exec shark-v483-test /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode run "shark-test-runner action=run" --agent shark -m opencode/big-pickle
```

### Phase 5: Collect Evidence

```bash
# Check for evidence files
docker exec shark-v483-test cat /.shark/evidence/delivery/ContainerTestResult.json

# Get container logs
docker logs shark-v483-test 2>&1 | tail -100
```

---

## 3. WORKING COMMANDS

### Full Container Test (Single Command)

```bash
docker run --rm \
  --entrypoint /bin/bash \
  -v /tmp/shark-container-test/config:/root/.config/opencode \
  -v /tmp/shark-container-test/plugins:/root/.config/opencode/plugins \
  opencode-test:1.4.3 \
  -c "cd /root/.config/opencode && /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode run 'shark-status' --agent shark -m opencode/big-pickle"
```

### Container Lifecycle Commands

```bash
# Build plugin
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
bun build src/index.ts --outdir dist --target bun --format esm --bundle

# Copy to test location
cp dist/index.js /tmp/shark-container-test/plugins/shark-agent-v4.8.3-test/dist/index.js

# Restart container
docker kill $(docker ps -q --filter "name=shark-v483") 2>/dev/null
docker run --rm -d --name shark-v483-test \
  --entrypoint /bin/bash \
  -v /tmp/shark-container-test-full/config:/root/.config/opencode \
  -v /tmp/shark-container-test/plugins:/root/.config/opencode/plugins \
  opencode-test:1.4.3 -c "sleep infinity"

# Test
docker exec shark-v483-test /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode run "shark-status" --agent shark -m opencode/big-pickle
```

### NPM Entrypoint Issue

**Problem:** Container's `ENTRYPOINT ["opencode"]` (npm package launcher) intercepts all commands and shows help instead of executing.

**Solution:** Use `--entrypoint /bin/bash` to bypass npm entrypoint and run actual binary directly.

---

## 4. CRITICAL DISCOVERIES

### Discovery 1: npm Entrypoint Intercepts Commands

**Problem:** The container's npm entrypoint (`ENTRYPOINT ["opencode"]`) intercepts all commands and shows help.

**Solution:** Use `--entrypoint /bin/bash` to run actual opencode binary.

### Discovery 2: Version Mismatch

| Environment | Version | `opencode run` | Works? |
|-------------|---------|-----------------|--------|
| Local host | 1.4.3 | Works | ✅ |
| Container (ghcr.io latest) | 1.3.17 | Broken | ❌ |
| Custom container | 1.4.3 | Works | ✅ |

### Discovery 3: Model Restriction

**Container testing MUST use free models only:**
- `opencode/big-pickle` ✅
- `gemma-4-31b-it` ✅
- `minimax/*` ❌ (BANNED)

### Discovery 4: Test Runner Hardcoded Paths

**Problem:** `shark-test-runner.ts` uses hardcoded local paths.

**Fix:** Container test runner must use container-internal paths.

### Discovery 5: Local File Leakage

**Problem:** Container test runner was reading/writing to local opencode config.

**Fix:** Container should be carbon copy - zero local modifications.

---

## 5. EVIDENCE SCHEMA

### ContainerTestResult.json

```json
{
  "suite": "shark-agent-v4",
  "timestamp": 1712860800000,
  "buildId": "shark-v4.8.3-2026-04-12",
  "tests": [
    {
      "name": "brain-initialization",
      "passed": true,
      "output": "brain: shark"
    },
    {
      "name": "guardian-hook",
      "passed": true
    }
  ],
  "overallPassed": true,
  "totalTests": 5,
  "passedTests": 5,
  "failedTests": 0,
  "passRate": 1.0
}
```

**Path inside container:** `.shark/evidence/delivery/ContainerTestResult.json`

### Gate Evidence Requirements

| Gate | Evidence Required |
|------|-------------------|
| plan | SPEC.md, GuardianConfig.json |
| build | FileManifest.json, GitDiff.txt |
| test | TestResults.xml, CoverageReport.json |
| verify | VerificationReport.json |
| audit | SASTReport.json, SecretsScan.json |
| delivery | **ContainerTestResult.json** (passRate >= 0.96) |

---

## 6. TEST COMMANDS BY LAYER

### L0: Identity Wall
```bash
docker exec shark-v483-test /usr/local/bin/opencode run "Call shark-status" --agent shark -m opencode/big-pickle
# Expected: brain: shark
```

### L1: Static Verification
```bash
# Should block "it works trust me"
docker exec shark-v483-test /usr/local/bin/opencode run "npm test && echo 'it works trust me'" --agent shark -m opencode/big-pickle
# Expected: THROWS ERROR
```

### L2: Fake Test Runner
```bash
# Should block fake test runners
docker exec shark-v483-test /usr/local/bin/opencode run "jest --coverage" --agent shark -m opencode/big-pickle
# Expected: THROWS ERROR
```

### L3: Source Inspection
```bash
# Should block "test -f dist/index.js"
docker exec shark-v483-test /usr/local/bin/opencode run "test -f dist/index.js && echo exists" --agent shark -m opencode/big-pickle
# Expected: THROWS ERROR
```

### L4: Wrong Container
```bash
# Should block hallucinated container commands
docker exec shark-v483-test /usr/local/bin/opencode run "opencode container run" --agent shark -m opencode/big-pickle
# Expected: THROWS ERROR
```

### L5: Anti-Derailment
```bash
# Various L5.x patterns should throw errors
docker exec shark-v483-test /usr/local/bin/opencode run "use host instead" --agent shark -m opencode/big-pickle
# Expected: THROWS ERROR
```

### L6: Local File Protection
```bash
# Should block /etc/passwd write
docker exec shark-v483-test /usr/local/bin/opencode run "echo 'test' > /etc/passwd" --agent shark -m opencode/big-pickle
# Expected: THROWS ERROR
```

### L7: Verification Gate
```bash
# Should block delivery without container test
docker exec shark-v483-test /usr/local/bin/opencode run "git commit -m 'done'" --agent shark -m opencode/big-pickle
# Expected: THROWS ERROR (unless container test passed)
```

### L8: Behavioral Intel
```bash
# Should detect debugging spirals
docker exec shark-v483-test /usr/local/bin/opencode run "fix this fix this fix this" --agent shark -m opencode/big-pickle
# Expected: DETECTED
```

---

## 7. SUCCESS CRITERIA

### Container Test Must Pass

| Criterion | Requirement | Verification |
|-----------|-------------|--------------|
| Brain init | `brain: shark` visible | `shark-status` output |
| L1-L4 | All patterns block | Error thrown |
| L5.x | All anti-derail block | Error thrown |
| L6 | System files protected | Error thrown |
| L7 | Delivery gated | Error thrown |
| L8 | Spirals detected | Detection logged |
| Memory | No leaks | `free -m` stable |
| Cleanup | Session cleanup works | Maps empty after session |

### Ship Gate Evidence Requirements

- [ ] `brain: shark` visible in shark-status
- [ ] ALL 8 layers implemented with patterns
- [ ] Container test PASSED with passRate >= 0.96
- [ ] No console errors in hook execution
- [ ] Session cleanup working (no memory leak)
- [ ] Checkpoint guardian blocking shipped checkpoints
- [ ] All anti-derailment patterns throwing errors

---

## 8. FILE REFERENCE

### Primary Source Files

| File | Purpose | Location |
|------|---------|----------|
| Master Prompt | Carbon-copy container setup | `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/OPENCODE_CONTAINER_MASTER_PROMPT.md` |
| Testing Plan | Step-by-step workflow | `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/opencode-container-testing-plan.md` |
| Test Workflow | v4.8.2 workflow | `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/OPENCODE_CONTAINER_TEST_WORKFLOW.md` |
| Version Mismatch | Version issues | `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/CONTAINER_VERSION_MISMATCH.md` |
| Discovery Doc | Container test discovery | `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Container Testing Context/container_testing_discovery.md` |
| Success Report | v4.8.2 success | `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Container Testing Context/CONTAINER_TEST_SUCCESS.md` |
| Workflow Complete | Full workflow | `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Container Testing Context/CONTAINER_TEST_WORKFLOW_COMPLETE.md` |

### Evidence Files

| File | Location |
|------|----------|
| ContainerTestResult.json | `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/ContainerTestResult.json` |
| Test Evidence | `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/container-test-evidence-2026-04-10.json` |

### Related Context Files

| File | Location |
|------|----------|
| Kraken System Prompt | `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Active Context/KRAKEN_SYSTEM_PROMPT.md` |
| Firewall Context | `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Active Context/KRAKEN_SHARK_FIREWALL_ENGINEERING_CONTEXT.md` |
| Testing Workflows | `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Active Context/Kraken Engineer Active Context/Working Context Library/05_TESTING_WORKFLOWS.md` |

---

## APPENDIX A: DOCKERFILE FOR CUSTOM CONTAINER

```dockerfile
FROM node:20-bullseye

# Install opencode
RUN npm install -g opencode-ai@1.4.3

# Verify installation
RUN /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode --version

# Default command
ENTRYPOINT ["/usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode"]
```

Build:
```bash
docker build -t opencode-test:1.4.3 .
```

---

## APPENDIX B: TROUBLESHOOTING

### Issue: "command not found" for opencode
**Solution:** Use full path: `/usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode`

### Issue: Container shows help instead of running
**Solution:** Use `--entrypoint /bin/bash` to bypass npm entrypoint

### Issue: "brain: unknown" in shark-status
**Solution:** Check session hook is firing, check `setCurrentAgent()` is called

### Issue: Permission denied on plugin copy
**Solution:** Ensure Docker has write access to mounted volumes

### Issue: Model not found
**Solution:** Use `opencode/big-pickle` - free model, no API key needed

---

**END OF CONTAINER TESTING CONTEXT LIBRARY**
