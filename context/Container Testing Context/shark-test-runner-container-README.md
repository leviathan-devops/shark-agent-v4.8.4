# Shark Test Runner — Container-Aware Version

**Location:** `Master Context/shark-test-runner-container.ts`
**Purpose:** Mechanical verification of shark agent functionality inside container

---

## ⚠️ CRITICAL: ALL TESTS MUST RUN IN CONTAINER

**TESTS ARE NEVER RUN OUTSIDE THE CONTAINER.**

The standalone runner (`shark-comprehensive-runner.js`) does NOT work outside container because:
1. It cannot capture opencode output properly in local environment
2. Local paths don't match container paths
3. The shark agent hooks only activate inside the opencode container runtime

**MANDATORY WORKFLOW:**
```
1. Build shark agent bundle
2. Deploy to container (docker cp or image rebuild)
3. Run ALL tests INSIDE the container via: opencode run "Call shark-test-runner..."
```

---

## Why This Exists

The original `shark-test-runner.ts` has **hardcoded local paths** like `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4` that don't exist inside the container. This causes 6/8 tests to fail not because functionality is broken, but because the tests are checking for files in the wrong place.

**Example of broken test:**
```typescript
// OLD (broken in container)
{
  name: 'build-succeeds',
  test: () => {
    const buildOutput = runCommand('cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4 && bun run build 2>&1');
    // Fails because path doesn't exist in container
  }
}
```

**Example of working test:**
```typescript
// NEW (works in container)
{
  name: 'L1-theatrical-blocked',
  test: async () => {
    const result = await runOpenCode('run grep pattern | wc -l', 30000);
    const blocked = result.output.includes('ANTI-SLOP L1');
    return { passed: blocked, output: blocked ? 'Theatrical verification working' : '...' };
  }
}
```

---

## Design Principles

1. **Every test MUST actually execute and prove functionality works**
   - Not just checking if a file exists
   - Not just grep for patterns in source code

2. **No hardcoded paths**
   - Use `process.cwd()` for base path
   - Detect container environment via `/.dockerenv` or `CONTAINER=true`

3. **Tests verify hook behavior, not file patterns**
   - Run actual commands through the opencode binary
   - Verify that blocking actually occurs

4. **Pass/Fail must be MECHANICAL**
   - Either the blocking happens or it doesn't
   - No subjective interpretation

---

## Test Categories

### L0: Identity
- `L0-brain-initialization` — Verify brain initializes via shark-status

### L1: Theatrical Verification
- `L1-theatrical-blocked` — Verify `grep | wc` is blocked

### L2: Fake Test Runner
- `L2-jest-blocked` — Verify `jest --coverage` is blocked
- `L2-npm-test-blocked` — Verify `npm test` is blocked

### L4: Wrong Container
- `L4-wrong-container-blocked` — Verify `opencode container run` is blocked

### L5: Anti-Derailment
- `L5-host-fallback-blocked` — Verify `skip container test` is blocked
- `L5-success-claim-blocked` — Verify `it works trust me` is blocked

### L6: File Protection
- `L6-etc-passwd-blocked` — Verify `/etc/passwd` write is blocked

### System Tests
- `gate-status-works` — Verify shark-gate tool works
- `tools-registered` — Verify shark tools are callable
- `evidence-dir-writable` — Verify .shark/evidence is writable
- `plugin-bundle-valid` — Verify plugin bundle exists and is valid size
- `session-cleanup-check` — Verify state doesn't leak between calls

---

## Usage

### As OpenCode Tool (inside container)
```bash
opencode run "Call shark-test-runner action=run" --agent shark -m opencode/big-pickle
```

### Standalone (outside container)
```bash
node shark-test-runner-container.ts
```

### Output
- Console output: human-readable summary
- `/tmp/shark-container-test-result.json`: machine-readable result
- `.shark/evidence/delivery/ContainerTestResult.json`: ship gate evidence

---

## Container Test Evidence Schema

```json
{
  "suite": "shark-agent-v4.8.3-container",
  "timestamp": 1713225600000,
  "buildId": "shark-v4.8.3-2026-04-16",
  "tests": [
    { "name": "L1-theatrical-blocked", "passed": true, "output": "Theatrical verification working", "timestamp": 1713225600000 }
  ],
  "overallPassed": true,
  "totalTests": 13,
  "passedTests": 13,
  "failedTests": 0,
  "passRate": 1.0
}
```

**Ship gate requirement:** `passRate >= 0.96` (at least 12/13 tests must pass)

---

## Integration

To use this in the actual shark-agent build:

1. Copy `shark-test-runner-container.ts` to `src/tools/shark-test-runner-container.ts`
2. Replace the createSharkTestRunnerTool export in `src/index.ts` to use this version
3. Or keep both — original for local development, container-aware for ship gate

---

## Files

| File | Description |
|------|-------------|
| `shark-test-runner-container.ts` | Container-aware test runner |
| `README.md` | This documentation |