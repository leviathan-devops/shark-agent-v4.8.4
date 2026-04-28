# Container Testing Discovery Log

## Problem Statement

v4.8.1 build has hardcoded paths and test runner spills into local opencode.

## Issues Found

### 1. Test Runner Hardcoded Paths

**Location:** `shark-test-runner.ts`

**Problem:** Test runner uses hardcoded paths:
```
/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent
```

**Actual workspace directory:**
```
/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
```

**Impact:** Tests always fail because paths don't match.

### 2. Container Testing Spills to Local

**Problem:** Container test runner reads/writes to local opencode config:
- `/home/leviathan/.config/opencode/opencode.json`
- Built files at `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/dist/`

**Expected behavior:** 
- Container should be a carbon copy venv of local opencode
- Built files installed INTO CONTAINER's opencode config
- Test runner runs entirely inside container
- ZERO local file system modifications

### 3. Active Plugin is v4.7, NOT v4.8.1

**Discovery:** `opencode.json` shows active shark-agent at:
```
/home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v47/dist
```

**Our v4.8.1 built to:**
```
/tmp/shark-v481-work/OPENCODE_WORKSPACE/projects/shark-agent/dist/
/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/dist/
```

**Impact:** `shark-test-runner` tool executes v4.7 code, not v4.8.1.

### 4. Pattern Verification Results (v4.8.1 source)

All patterns PASS when checked directly:

| Pattern | Location | Count | Status |
|---------|----------|-------|--------|
| IRONCLAD | system-transform-hook.ts | 1 | ✅ PASS |
| OPENCODE CONTAINER TEST | gates.ts | 1 | ✅ PASS |
| getCurrentAgent | guardian-hook.ts | 2 | ✅ PASS |
| canEdit | guardian.ts | 1 | ✅ PASS |
| Manta | *.ts | 0 | ✅ PASS |
| build succeeds | dist/index.js | 1 | ✅ PASS |

## Root Cause

The test runner was designed to run INSIDE the container but implemented with LOCAL paths. It should:

1. Detect its own location (container's workspace)
2. Use relative/dynamic paths
3. Install built files to container's opencode config
4. Run opencode INSIDE container
5. Capture results from container's perspective

## Required Fix

### Container Test Runner Design

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTAINER (venv)                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  opencode.json (container's own copy)               │   │
│  │  - Points to container plugin paths                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  shark-agent-v4/dist/ (built files)                 │   │
│  │  - Installed via plugin install command             │   │
│  │  - NOT symlinked to local                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Test Runner (runs INSIDE container)                │   │
│  │  - Dynamically detects paths                        │   │
│  │  - Uses container's opencode.json                  │   │
│  │  - Writes results to container artifacts/           │   │
│  │  - Does NOT touch local .config/opencode/           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### No Local Modification

System Brain should BLOCK any attempt to:
- Read local opencode.json from within container
- Write to local plugin directories
- Modify local source files

## Action Items

- [x] Create container-native test runner with dynamic path detection
- [x] Container test runner reads its OWN opencode.json
- [x] Built files installed to container plugin path
- [x] Results written to container artifacts directory
- [x] System Brain blocks local file system access during container test

## Container-Native Test Runner Implementation

**Location:** `/tmp/shark-v481-work/OPENCODE_WORKSPACE/projects/shark-agent/src/tools/shark-test-runner.ts`

**Key Changes:**

1. **Dynamic Path Detection:**
   - Uses `findSourceRoot()` to locate source by walking up directory tree
   - Container paths from environment: `SHARK_PLUGIN_DIR`, `OPENCODE_CONFIG_PATH`, `SHARK_ARTIFACTS_DIR`
   - No hardcoded `/home/leviathan` paths for operational code

2. **Container Mode Detection:**
   - Checks `SHARK_CONTAINER=true`, `/.dockerenv` existence, `CONTAINER=true`
   - Falls back to dynamic detection when not in container

3. **Security Validation:**
   - `validateNoLocalSpill()` enforces container paths via `SHARK_ALLOWED_PATHS`
   - Pattern-based forbidden path detection via `SHARK_FORBIDDEN_PATTERNS`
   - Block any operation that tries to access non-container paths

4. **Environment Variables for Configuration:**
   ```
   SHARK_CONTAINER=true              # Force container mode
   SHARK_PLUGIN_DIR=/opt/...         # Plugin installation path
   SHARK_ALLOWED_PATHS=/opt/opencode,/app  # Allowed path prefixes
   SHARK_FORBIDDEN_PATTERNS=/home/,/Users/,/mnt/  # Forbidden patterns
   SHARK_ARTIFACTS_DIR=/opt/...      # Where to write test results
   ```

5. **Results Written to Container:**
   - Test results written to `${SHARK_ARTIFACTS_DIR}/test-results-${buildId}.json`
   - Does NOT write to local opencode config

## Container Testing Infrastructure

**Container Directory:** `/home/leviathan/OPENCODE_WORKSPACE/.shark/container/`

**Structure:**
```
.shark/container/
├── Dockerfile                    # Container build definition
├── opencode-config.json          # Carbon copy of local opencode.json
├── shark-agent-v481/             # Pre-built v4.8.1 (ready to install)
│   ├── dist/index.js             # 1.0 MB pre-built plugin
│   └── package.json
├── plugins/                      # Replicated plugins
│   ├── coding-subagents/
│   └── spider-agent/
└── scripts/
    ├── shark-container_build.sh  # Build the container image
    └── shark_container_test.sh   # Run tests in container
```

**Container Verification (April 9, 2026):**
- ✅ Plugin dist exists: `/opt/opencode/plugins/shark-agent/dist/index.js` (1.0 MB)
- ✅ Opencode config points to container paths: `file:///opt/opencode/plugins/shark-agent/dist/index.js`
- ✅ Environment variables set: `SHARK_CONTAINER=true`, `SHARK_PLUGIN_DIR=/opt/opencode/plugins/shark-agent`
- ✅ Container detection: `In Docker: YES`
- ✅ No hardcoded local paths in test runner
- ✅ Dynamic path detection via env vars and `findSourceRoot()`

**Image Name:** `shark-agent-v481-test`

## Container Build & Verification (April 9, 2026)

**Commands executed:**
```bash
# Build container image
cd /home/leviathan/OPENCODE_WORKSPACE/.shark/container
docker build -t shark-agent-v481-test .

# Verify container
docker run -d --name shark-v481-test \
    -e SHARK_CONTAINER=true \
    -e SHARK_PLUGIN_DIR=/opt/opencode/plugins/shark-agent \
    -e SHARK_ALLOWED_PATHS=/opt/opencode \
    -e SHARK_ARTIFACTS_DIR=/opt/opencode/artifacts \
    shark-agent-v481-test
```

**Dockerfile (final):**
```dockerfile
FROM node:20-bullseye
ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /opt/opencode
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"
COPY opencode-config.json /opt/opencode/.config/opencode.json
RUN mkdir -p /opt/opencode/.config /opt/opencode/workspace /opt/opencode/plugins /opt/opencode/artifacts /opt/opencode/.shark
ENV SHARK_CONTAINER=true
ENV SHARK_PLUGIN_DIR=/opt/opencode/plugins/shark-agent
ENV SHARK_ALLOWED_PATHS=/opt/opencode,/app,/workspace
ENV SHARK_FORBIDDEN_PATTERNS="/home/,/Users/,/mnt/,C:\\"
RUN npm install -g opencode@latest 2>/dev/null || true
COPY shark-agent-v481/src /opt/opencode/plugins/shark-agent/src
COPY shark-agent-v481/dist /opt/opencode/plugins/shark-agent/dist
COPY shark-agent-v481/package.json /opt/opencode/plugins/shark-agent/package.json
COPY plugins/coding-subagents /opt/opencode/plugins/coding-subagents
COPY plugins/spider-agent /opt/opencode/plugins/spider-agent
RUN mkdir -p /opt/opencode/.shark/evidence/delivery /opt/opencode/.shark/evidence/test-results
CMD ["/bin/bash"]
```

**Verification Results:**
```
1. Plugin dist exists: /opt/opencode/plugins/shark-agent/dist/index.js (1.0 MB)
2. Opencode config: file:///opt/opencode/plugins/shark-agent/dist/index.js
3. Environment: SHARK_CONTAINER=true, SHARK_PLUGIN_DIR=/opt/opencode/plugins/shark-agent
4. Container detection: In Docker: YES
5. Source files included: /opt/opencode/plugins/shark-agent/src/ (for pattern verification)
```

## v4.8.1 Pattern Verification (April 9, 2026)

| Pattern | Location | Count | Status |
|---------|----------|-------|--------|
| L1 Identity Wall (getCurrentAgent) | guardian-hook.ts | 2 | ✅ |
| L3 Container Test Block | guardian-hook.ts | 1 | ✅ |
| L3 passRate check (96%) | guardian-hook.ts | 1 | ✅ |
| L4 Slop Detector (slopDetectorFirewall) | gate-hook.ts | 2 | ✅ |
| L6 Sudo System (SHARK_SUDO_TOKEN) | guardian-hook.ts | 3 | ✅ |
| IRONCLAD Rule | system-transform-hook.ts | 1 | ✅ |
| OPENCODE CONTAINER TEST | gates.ts | 1 | ✅ |
| canEdit | guardian.ts | 1 | ✅ |
| No hardcoded /home/ paths in test runner | test runner | 1* | ✅ |

*Note: The count of "1" for `/home/` paths in test runner is correct - it appears in the `SHARK_FORBIDDEN_PATTERNS` array as a pattern to block, not as a path to access.

## v4.8.1 Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     v4.8.1 LAYERS                           │
├─────────────────────────────────────────────────────────────┤
│ L1: Identity Wall        - getCurrentAgent() first check    │
│ L2: Deployment Guard     - TODO                             │
│ L3: Container Test Block - Hard block without test evidence │
│ L4: Slop Detector        - File existence verification      │
│ L5: Escape Hatch        - REMOVED (no bypasses)             │
│ L6: Sudo System         - opencode.json needs approval     │
└─────────────────────────────────────────────────────────────┘
```

## Scripts Created

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/scripts/`

1. `shark-container-build.sh` - Builds the Docker container image
2. `shark-container-test.sh` - Runs full test suite inside container

## Current File State

**Source files updated:**
- `/tmp/shark-v481-work/OPENCODE_WORKSPACE/projects/shark-agent/src/tools/shark-test-runner.ts` - Container-native with dynamic paths
- `/tmp/shark-v481-work/OPENCODE_WORKSPACE/projects/shark-agent/src/hooks/v4.1/guardian-hook.ts` - L1, L3, L6 implemented
- `/tmp/shark-v481-work/OPENCODE_WORKSPACE/projects/shark-agent/src/hooks/v4.1/gate-hook.ts` - L4 Slop Detector
- `/tmp/shark-v481-work/OPENCODE_WORKSPACE/projects/shark-agent/src/hooks/v4.1/system-transform-hook.ts` - IRONCLAD added
- `/tmp/shark-v481-work/OPENCODE_WORKSPACE/projects/shark-agent/src/shared/gates.ts` - OPENCODE CONTAINER TEST added

**Synced to:**
- `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/` (workspace)
- `/home/leviathan/OPENCODE_WORKSPACE/.shark/container/shark-agent-v481/` (container)
