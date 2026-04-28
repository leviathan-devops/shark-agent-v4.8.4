# ANTI-SLOP FIREWALL LAYERS (v4.8.2)

## Purpose
Block fake work that looks like testing but doesn't actually verify runtime behavior.

## Current Implementation Status

### Working Anti-Slop Layers

| Layer | Name | Pattern Set | Status |
|-------|------|-------------|--------|
| L1 | Static Verification Blocker | `STATIC_VERIFICATION_PATTERNS` | ✅ Implemented |
| L2 | Fake Test Runner Blocker | `FAKE_TEST_RUNNER_PATTERNS` | ✅ Implemented |
| L3 | Source Inspection Blocker | `SOURCE_INSPECTION_PATTERNS` | ✅ Implemented |
| L4 | Non-Existent Command Blocker | `WRONG_CONTAINER_PATTERNS` | ✅ Implemented |

### Pattern Sets Defined

```typescript
// LAYER 1: Blocks grep, wc, cat|grep, find to "verify" patterns
const STATIC_VERIFICATION_PATTERNS = [
  /^grep\s+/i, /^rg\s+/i, /^ag\s+/i,
  /^wc\s+-l/i,
  /^cat\s+.*\|\s*grep/i,
  /grep.*"setCurrentAgent"/i,
  /wc\s+-l.*dist\/index\.js/i,
  // ... 20+ patterns
];

// LAYER 2: Blocks standalone test runners (jest, vitest, etc.)
const FAKE_TEST_RUNNER_PATTERNS = [
  /node\s+run-tests?\.js/i,
  /npm\s+test/i, /jest/i, /vitest/i,
  // ... more patterns
];

// LAYER 3: Blocks source inspection to "verify" work
const SOURCE_INSPECTION_PATTERNS = [
  /test\s+-f\s+\$\{?.*\}/i,
  /ls\s+-l.*dist\//i,
  /grep\s+-r\s+.*src\//i,
];

// LAYER 4: Blocks hallucinated "opencode container" commands
const WRONG_CONTAINER_PATTERNS = [
  /opencode\s+container\s+run/i,
  /opencode\s+container\s+start/i,
  /opencode\s+container\s+exec/i,
];
```

## What Gets Blocked

### Layer 1: Static Verification
```bash
# BLOCKED - grep to "verify" pattern exists
grep "setCurrentAgent" src/
grep -c "brain" *.ts

# BLOCKED - wc to "verify" build worked
wc -l dist/index.js
wc -l src/**/*.ts

# BLOCKED - cat|grep to "verify" content
cat file.js | grep pattern
```

### Layer 2: Fake Test Runners
```bash
# BLOCKED - standalone test without opencode
node run-tests.js
npm test
jest
vitest
```

### Layer 3: Source Inspection
```bash
# BLOCKED - checking if files exist to "verify" work
test -f dist/index.js && echo "built"
ls -la dist/
```

### Layer 4: Non-Existent Commands
```bash
# BLOCKED - hallucinated container commands
opencode container run -- echo test
opencode container start
```

## What Is Allowed

```bash
# ALLOWED - actual opencode runtime test
opencode run "shark-status" --agent shark

# ALLOWED - actual opencode with plugin
opencode run "shark-test-runner" --agent shark
```

## Error Messages

Each layer throws a descriptive error:

```
[ANTI-SLOP LAYER 1] Static verification is SLOP, not work.
[ANTI-SLOP LAYER 2] Fake test runner detected.
[ANTI-SLOP LAYER 3] Source inspection is SLOP.
[ANTI-SLOP LAYER 4] "opencode container" commands do not exist.
```

## Location

`/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/hooks/v4.1/guardian-hook.ts`

Lines 55-165 define all pattern sets.
Lines 337+ check commands against patterns.

## Testing

```bash
# Test LAYER 1 - should block grep
opencode run "grep -c setCurrentAgent src/hooks/v4.1/session-hook.ts" --agent shark

# Test actual functionality - should work
opencode run "shark-status" --agent shark
```

## Known Issues

1. Plugin must be loaded for firewalls to work
2. The `opencode --agent shark` flag needs plugin registered
3. Container version mismatch (1.3.17 vs 1.4.2)

## v4.8.2 Build Status

Build: ✅ SUCCESS
Anti-Slop Layers: ✅ 4 layers implemented
