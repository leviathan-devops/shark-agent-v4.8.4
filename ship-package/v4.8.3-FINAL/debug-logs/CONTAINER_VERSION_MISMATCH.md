# Container Testing - Version Mismatch Issues

## Critical Finding

**Container opencode 1.3.17 has broken `run` command parsing**

When running `opencode run <message>` with any flags, it interprets "run" as a positional project path and shows help instead of executing.

### Examples that FAIL:

```bash
# All of these show help in container 1.3.17
docker run ... opencode run "shark-status"
docker run ... opencode run --agent shark "shark-status"
docker run ... opencode run --agent shark --plain shark-status
docker run ... bash -c 'opencode run "shark-status"'
```

### Examples that WORK:

```bash
# Version check works
docker run ... opencode --version  # Output: 1.3.17

# Help works
docker run ... opencode --help
```

## Root Cause

Container image `ghcr.io/anomalyco/opencode:latest` is version **1.3.17**.

Local opencode is version **1.4.2**.

The `run` subcommand parsing was changed between these versions.

## Solution

**Test on host with local opencode 1.4.2:**

```bash
# Verify brain initializes correctly
opencode run "shark-status" --agent shark
# Output: **Brain** | execution, reasoning, system |
```

**For container testing of critical changes:**
- Build custom Docker image with opencode 1.4.2
- Or wait for updated container image

## Documented Behavior

| Command | Host 1.4.2 | Container 1.3.17 |
|---------|-------------|-------------------|
| `opencode --version` | ✅ 1.4.2 | ✅ 1.3.17 |
| `opencode run "test"` | ✅ Works | ❌ Shows help |
| `opencode run --agent shark "test"` | ✅ Works | ❌ Shows help |

## Note

The DeepSeek prompt says to "note the version mismatch" but doesn't account for the fact that the `run` command itself is broken in 1.3.17. This is a fundamental incompatibility, not just a version difference.

## v4.8.2 Verified Working

On host (opencode 1.4.2):
```
$ opencode run "shark-status" --agent shark
[Agent State] BRAIN INITIALIZED: setCurrentAgent("shark")
**Brain** | execution, reasoning, system |
```

This confirms v4.8.2 brain initialization works correctly.
