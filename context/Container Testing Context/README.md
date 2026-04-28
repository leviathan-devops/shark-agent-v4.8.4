# Container Testing Context Library — Index

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Container Testing Context/`

## Master Reference

| File | Description |
|------|-------------|
| `CONTAINER_TESTING_MASTER_REFERENCE.md` | **START HERE** - Complete consolidated guide |

## Source Documents

| File | Description |
|------|-------------|
| `OPENCODE_CONTAINER_MASTER_PROMPT.md` | Carbon-copy container setup instructions |
| `opencode-container-testing-plan.md` | Step-by-step test workflow |
| `OPENCODE_CONTAINER_TEST_WORKFLOW.md` | v4.8.2 working workflow |
| `CONTAINER_VERSION_MISMATCH.md` | Version compatibility issues |
| `container_testing_discovery.md` | Discovery log with critical findings |
| `CONTAINER_TEST_SUCCESS.md` | v4.8.2 success report |
| `CONTAINER_TEST_WORKFLOW_COMPLETE.md` | Complete workflow documentation |

## Evidence Files

| File | Description |
|------|-------------|
| `ContainerTestResult.json` | Test results JSON schema |
| `container-test-evidence-2026-04-10.json` | Detailed test evidence |

---

## Quick Start

1. Read `CONTAINER_TESTING_MASTER_REFERENCE.md` first
2. Follow the Container Test Workflow section
3. Use test commands by layer to verify each firewall layer
4. Collect evidence in `.shark/evidence/delivery/ContainerTestResult.json`

---

## Key Commands

```bash
# Build plugin
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
bun build src/index.ts --outdir dist --target bun --format esm --bundle

# Copy to test
cp dist/index.js /tmp/shark-container-test/plugins/shark-agent-v4.8.3-test/dist/index.js

# Restart container
docker kill $(docker ps -q --filter "name=shark-v483") 2>/dev/null
docker run --rm -d --name shark-v483-test \
  --entrypoint /bin/bash \
  -v /tmp/shark-container-test-full/config:/root/.config/opencode \
  -v /tmp/shark-container-test/plugins:/root/.config/opencode/plugins \
  opencode-test:1.4.3 -c "sleep infinity"

# Test
docker exec shark-v483-test /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode run "Call shark-status" --agent shark -m opencode/big-pickle
```

---

## Related Context Libraries

| Context | Location |
|---------|----------|
| Firewall Engineering | `../Active Context/KRAKEN_SHARK_FIREWALL_ENGINEERING_CONTEXT.md` |
| Kraken System Prompt | `../Active Context/KRAKEN_SYSTEM_PROMPT.md` |
| v4.7-hotfix-v3 Source | `/home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/` |
