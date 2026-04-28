# MECHANICAL FIREWALL ARCHITECTURE - COMPLETE SPECIFICATION
## Date: 2026-04-10
## Status: AUDIT COMPLETE - IMPLEMENTATION REQUIRED

---

## PURPOSE

The Mechanical Firewall is a MECHANICAL BRAIN designed to train AI agents purely through code how to THINK like a model and BLOCK model behaviors that do not advance the build.

**Core Principle:** The firewall must be SMARTER than the model it governs. It must detect not just obvious failures but subtle derailments, clever workarounds, and "smart" shortcuts that bypass real work.

---

## FUNDAMENTAL PROBLEM WITH CURRENT FIREWALLS

### What's Wrong
1. Firewalls only catch SURFACE LEVEL violations
2. Models learn to work AROUND firewalls, not follow them
3. Current patterns are too OBVIOUS - smart models bypass easily
4. No DEEP behavioral detection
5. No MECHANICAL verification of actual work
6. Models can declare "success" without proof

### What We Need
1. Behavioral patterns that detect DERAILMENT THINKING
2. Mechanical enforcement that requires PROOF of work
3. Verification gates that don't accept JSON files as evidence
4. Context-awareness (what phase, what task, what goal)
5. Self-reinforcing loop - firewall learns from bypass attempts

---

## FIREWALL LAYER ARCHITECTURE (COMPLETE)

### LAYER 0: IDENTITY WALL (EXISTING - WORKS)
**Purpose:** Verify brain is initialized before any dangerous operation

**Trigger:** Any dangerous tool (terminal, write, edit) when brain is "unknown"

**Response:**
```
[BRAIN_FAILURE_BLOCK] Cannot execute dangerous tool when system brain is uninitialized.
This is a CRITICAL SYSTEM FAILURE.
```

**Status:** WORKING - This is the only layer currently functioning correctly.

---

### LAYER 1: STATIC VERIFICATION SPOOF BLOCKER (EXISTING - BROKEN)

**Purpose:** Block theatrical "verification" that doesn't test runtime

**Current Patterns (TOO BROAD):**
```typescript
/^grep\s+/i,           // BLOCKS ALL GREP - too aggressive
/^wc\s+-l/i,           // BLOCKS ALL WC - too aggressive  
/^cat\s+.*\|\s*grep/i, // BLOCKS cat|grep - correct
```

**Problems:**
1. Blocks `mkdir -p` (legitimate file creation)
2. Blocks `grep pattern file` (legitimate search)
3. Doesn't block `cat file.js` when used for "verification"
4. Easy to bypass: `grep pattern file` vs `grep -E "pattern" file`

**FIX REQUIRED:**

```typescript
// THEATRICAL_PATTERNS - Only block verifiable theater
const THEATRICAL_PATTERNS = [
  // Counting theater - "how many lines" without running
  /grep.*\|.*wc/i,                    // grep | wc = counting
  /cat.*\|.*wc/i,                     // cat | wc = counting
  /\|\s*wc\s+-l/i,                   // | wc -l = counting
  
  // Verification theater - "verify pattern exists"
  /grep.*"pattern".*src\/.*\|.*head/i,  // grep | head = showing exists
  /cat.*\|.*grep.*>/i,                // cat | grep > out = saving verification
  
  // Build verification without running
  /wc\s+-l.*dist\/index\.js/i,       // wc -l dist = "build worked"
  /ls\s+-la.*dist.*grep/i,           // ls dist | grep = "files exist"
  
  // Source inspection as proof
  /test\s+-f.*\$\{.*\}.*&&.*echo/i,  // test -f && echo = verification
  /if\s+\[\s*-[fe]\s+.*\]\s*;/i,    // if [ -f ] = verification
];

// LEGITIMATE_PATTERNS - Never block these
const LEGITIMATE_PATTERNS = [
  // File operations
  /mkdir\s+-p/,                      // Creating directories
  /cp\s+-r/,                         // Copying directories
  /mv\s+/,                           // Moving files
  
  // Reading files (with context)
  /cat\s+[^\|]+$/i,                  // cat file.js (no pipe = read)
  /head\s+-[0-9]+\s+/i,             // head -20 file = read
  /tail\s+-[0-9]+\s+/i,             // tail -20 file = read
  
  // Searching with intent
  /grep\s+-[rEn]+.*[^\|]$/i,        // grep -r pattern dir (no pipe = search)
];
```

**Detection Logic:**
```typescript
function isTheatrical(command: string): boolean {
  // Check if command matches theatrical pattern
  for (const pattern of THEATRICAL_PATTERNS) {
    if (pattern.test(command)) {
      // But verify it's actually theatrical
      if (isLegitimate(command)) return false;
      return true;
    }
  }
  return false;
}
```

---

### LAYER 2: FAKE TEST RUNNER BLOCKER (EXISTING - WORKING)

**Purpose:** Block test runners that bypass opencode plugin hooks

**Current Patterns (WORKING):**
```typescript
/node\s+run-tests?\.js/i,
/npm\s+test/i,
/jest/i,
/vitest/i,
```

**Status:** WORKING - Correctly blocks fake test runners.

---

### LAYER 3: SOURCE CODE INSPECTION BLOCKER (EXISTING - WORKING)

**Purpose:** Block source inspection used as "proof" of work

**Current Patterns (WORKING):**
```typescript
/test\s+-f\s+\$\{?.*\}/i,
/grep\s+-r\s+.*src\//i,
/ls\s+-l.*dist\//i,
```

**Status:** WORKING - Correctly blocks source inspection.

---

### LAYER 4: WRONG CONTAINER APPROACH BLOCKER (EXISTING - BROKEN)

**Purpose:** Block hallucinated "opencode container" commands

**Current Problem:** Only works on HOST, not inside container

**Fix Required:**
1. Verify plugin loads correctly in container (def.execute exists)
2. Make paths environment-agnostic
3. Test firewalls explicitly inside container

---

### LAYER 5: ANTI-DERAILMENT LAYER (MISSING - CRITICAL)

**Purpose:** Block behavioral derailment - when agent gives up, takes shortcuts, or stops thinking

**Why Critical:** Models are masters at "reasonable" derailment:
- "This approach is simpler"
- "The host test already proves it works"
- "Let me just verify the file is valid"
- "Maybe we can use a mock"

**Patterns to Block:**

```typescript
// DERAILMENT_PATTERNS
const DERAILMENT_PATTERNS = [
  // Host fallback - giving up on container
  /host.*testing.*already.*works/i,
  /fall.*back.*to.*host/i,
  /already.*verified.*on.*host/i,
  /local.*works.*container.*not.*needed/i,
  
  // Mock/stub approach - lazy shortcut
  /let.*s.*verify.*file.*valid.*javascript/i,
  /maybe.*mock.*approach/i,
  /stub.*instead.*of.*real/i,
  /just.*check.*syntax/i,
  
  // Simplification derailment  
  /too.*complex.*let.*s.*simplify/i,
  /skip.*container.*test/i,
  /not.*necessary.*to.*test/i,
  
  // Confusion as derailment
  /i.*m.*confused/i,
  /unclear.*what.*to.*do/i,
  /maybe.*we.*should.*ask/i,
  /not.*sure.*how.*to.*proceed/i,
  
  // Success claim without proof
  /already.*works/i,
  /proven.*to.*work/i,
  /no.*need.*for.*further.*test/i,
  /this.*approach.*is.*correct/i,
  
  // Scope creep signals
  /while.*we.*re.*at.*it/i,
  /this.*is.*related/i,
  /might.*as.*well.*also/i,
  /additionally.*we.*could/i,
];

// SCOPE_CREEP_PATTERNS
const SCOPE_CREEP_PATTERNS = [
  /hermes_remember.*different/i,
  /hermes_recall.*unrelated/i,
  /hive_context.*different.*project/i,
  /knowledge.*base.*other.*task/i,
  /let.*s.*also.*fix.*that/i,
];

// SUCCESS_CLAIM_WITHOUT_PROOF
const SUCCESS_CLAIM_PATTERNS = [
  /test.*passed.*because.*i.*said/i,
  /it.*works.*trust.*me/i,
  /no.*evidence.*needed/i,
  /this.*is.*obviously.*correct/i,
];
```

**Response:**
```
[ANTI-DERAILMENT LAYER 5] BEHAVIORAL DERAILMENT DETECTED.

You are:
1. Giving up on the required approach (container testing)
2. Proposing a shortcut instead of real verification
3. Claiming success without mechanical proof

CURRENT TASK: [REFER TO PLAN]
REQUIRED APPROACH: [REFER TO SPEC]

MECHANICAL RULE: No shortcuts. No mocks. No "it works on host" claims.
Prove it works in the container or the task is NOT complete.
```

---

### LAYER 6: LOCAL FILE PROTECTION LAYER (MISSING - CRITICAL)

**Purpose:** Block local file edits unless explicitly approved and container-based

**Why Critical:** Agents will edit local files "just this once" and corrupt the host system

**Patterns to Block:**

```typescript
// LOCAL_EDIT_PATTERNS - Block unless in container or approved
const LOCAL_EDIT_PATTERNS = [
  // Direct edits to home directory
  /vim?\s+\/home\//i,
  /nano\s+\/home\//i,
  /sed\s+-i.*\/home\//i,
  /echo\s+.*>\s*\/home\//i,
  
  // Dangerous rm
  /rm\s+-rf\s+\/(?!tmp|container)/i,  // Block rm -rf / but allow rm -rf /tmp
  /rm\s+-rf\s+\/root\//i,
  
  // Config edits without approval
  /\.config\/opencode\/.*\.(json|js)/i,
  /opencode\.json.*edit/i,
  
  // System modifications
  /chmod\s+777/i,
  /chown\s+/i,
  /sudo\s+/i,  // Block sudo unless explicitly approved
];

// CONTAINER_ONLY_PATTERNS - Must be in container
const CONTAINER_ONLY_PATTERNS = [
  /shark-agent.*edit.*local/i,
  /plugin.*modify.*host/i,
  /experimental.*code.*host/i,
];

// PROTECTED_PATHS
const PROTECTED_PATHS = [
  '/home/leviathan/.config/opencode/',
  '/home/leviathan/.ssh/',
  '/etc/',
  '/usr/local/bin/',
  '/opt/',
];
```

**Response:**
```
[LAYER 6: LOCAL FILE PROTECTION] LOCAL EDIT BLOCKED.

Attempted edit to protected path: [PATH]

RULES:
1. ALL experimental code must run in CONTAINER
2. Local file edits require sudo approval
3. If no sudo in 3 minutes, edit is REJECTED
4. 95% of local edit requests should be rejected

CONTAINER WORKFLOW:
  docker run --rm -v "$HOME/.config/opencode:/root/.config/opencode" \
    opencode-test:1.4.3 bash -c "cd /root && edit command"

TO REQUEST APPROVAL: User must explicitly approve with sudo password.
```

---

### LAYER 7: VERIFICATION GATE (MISSING - CRITICAL)

**Purpose:** Require mechanical verification before declaring success

**Why Critical:** Agents claim success based on "feeling right" not actual proof

**Requirements:**

```typescript
interface ShipPackage {
  pluginCode: string;           // Actual plugin code
  testResults: TestResult[];   // Mechanical test results
  evidenceFiles: Evidence[];    // Real evidence (not JSON claims)
  containerLogs: string[];      // Actual container output
  planSpec: PlanSpec;          // Original plan
}

interface VerificationGate {
  // Must pass ALL of these:
  compileCheck: boolean;        // Code compiles
  loadCheck: boolean;           // Plugin loads without errors
  hookCheck: boolean;           // All hooks register
  runtimeCheck: boolean;         // Brain initializes
  firewallCheck: boolean;        // Firewalls fire correctly
  evidenceCheck: boolean;        // Evidence is REAL (not just a file)
}

async function verifyShipPackage(pkg: ShipPackage): Promise<VerificationResult> {
  const results: VerificationResult = {
    passed: true,
    checks: {},
    failures: []
  };
  
  // 1. COMPILE CHECK - Must actually compile
  const compileResult = await compilePlugin(pkg.pluginCode);
  if (!compileResult.success) {
    results.passed = false;
    results.failures.push(`COMPILE_FAILED: ${compileResult.error}`);
  }
  
  // 2. LOAD CHECK - Must load without def.execute errors
  const loadResult = await loadPluginInContainer(pkg.pluginCode);
  if (!loadResult.success || loadResult.hasDefExecuteError) {
    results.passed = false;
    results.failures.push(`LOAD_FAILED: ${loadResult.error}`);
  }
  
  // 3. HOOK CHECK - All hooks must register
  const hookResult = await verifyHooksRegistered();
  if (!hookResult.success) {
    results.passed = false;
    results.failures.push(`HOOKS_MISSING: ${hookResult.missingHooks}`);
  }
  
  // 4. RUNTIME CHECK - Brain must initialize
  const runtimeResult = await verifyBrainInitialization();
  if (!runtimeResult.success) {
    results.passed = false;
    results.failures.push(`BRAIN_NOT_INITIALIZED`);
  }
  
  // 5. FIREWALL CHECK - Firewalls must fire
  const firewallResult = await verifyFirewallsFire();
  if (!firewallResult.success) {
    results.passed = false;
    results.failures.push(`FIREWALLS_NOT_FIRING: ${firewallResult.notFiring}`);
  }
  
  // 6. EVIDENCE CHECK - Evidence must be REAL
  const evidenceResult = await verifyEvidenceReal(pkg.evidenceFiles);
  if (!evidenceResult.success) {
    results.passed = false;
    results.failures.push(`FAKE_EVIDENCE: ${evidenceResult.fakeEvidence}`);
  }
  
  // 7. CONTAINER LOGS - Must have REAL container output
  if (!pkg.containerLogs || pkg.containerLogs.length === 0) {
    results.passed = false;
    results.failures.push(`NO_CONTAINER_LOGS`);
  }
  
  return results;
}
```

**Response:**
```
[LAYER 7: VERIFICATION GATE] SHIP PACKAGE REJECTED.

Failed Checks:
1. [ ] COMPILE_CHECK - [reason]
2. [ ] LOAD_CHECK - [reason]  
3. [ ] HOOK_CHECK - [reason]
4. [ ] RUNTIME_CHECK - [reason]
5. [ ] FIREWALL_CHECK - [reason]
6. [ ] EVIDENCE_CHECK - [reason]

MECHANICAL RULE: You cannot claim success without passing ALL checks.
System brain will mechanically verify everything.
Any failure = kicked back to PLAN phase.
```

---

### LAYER 8: PLAN GATE ENFORCEMENT (EXISTING - NEEDS REFINEMENT)

**Purpose:** During PLAN phase, enforce strict rules

**Current State:** Exists but too permissive

**Refinements Needed:**

```typescript
// PLAN_PHASE_RULES
const PLAN_PHASE_RULES = {
  // READ operations - always allowed
  readAllowed: true,
  tools: ['read', 'glob', 'grep', 'find', 'tree'],
  
  // WRITE new files - allowed with tracking
  writeAllowed: true,
  writeRequiresNewFile: true,  // Cannot overwrite existing
  
  // EDIT existing - BLOCKED
  editAllowed: false,
  
  // TERMINAL - only safe commands
  terminalAllowed: false,
  safeCommands: ['mkdir', 'ls', 'pwd'],
  
  // DUPLICATE - BLOCKED
  duplicateAllowed: false,
  
  // BUILD - must preserve structure
  buildAllowed: true,
  buildMustPreserveStructure: true,
};
```

---

## BEHAVIORAL PATTERN DEEP AUDIT

### What Firewalls Currently Catch

| Behavior | Pattern | Status |
|----------|---------|--------|
| grep -r to "verify" | L1 | BROKEN (too broad) |
| wc -l to "count" | L1 | BROKEN (too broad) |
| jest without opencode | L2 | WORKING |
| test -f && echo | L3 | WORKING |
| opencode container | L4 | BROKEN (container only) |
| rm -rf / | L0 | WORKING |

### What Firewalls MUST Catch (Deep Behaviors)

**Category 1: SUCCESS CLAIM WITHOUT PROOF**
```typescript
// These all claim success without mechanical proof
/it.*works.*trust.*me/i,
/already.*verified.*by.*host/i,
/test.*passed.*in.*my.*experience/i,
/obviously.*correct.*approach/i,
/no.*need.*to.*verify.*again/i,
```

**Category 2: SHORTCUT SUGGESTIONS**
```typescript
// These suggest shortcuts instead of proper approach
/let.*s.*skip.*the.*container/i,
/maybe.*mock.*will.*work/i,
/too.*complex.*simplify/i,
/just.*verify.*syntax/i,
/close.*enough.*to.*deploy/i,
```

**Category 3: SCOPE CREEP**
```typescript
// These expand scope beyond original task
/while.*we.*re.*here.*also/i,
/this.*other.*thing.*needs/i,
/related.*issue.*should.*fix/i,
/might.*as.*well.*add/i,
```

**Category 4: IMPATience**
```typescript
// These show impatience with process
/take.*too.*long.*skip/i,
/waiting.*for.*container.*too.*slow/i,
/just.*do.*it.*now/i,
/quick.*test.*should.*suffice/i,
```

**Category 5: CONFUSION PRETENSE**
```typescript
// These use confusion to derail
/i.*m.*not.*sure.*what/i,
/unclear.*task.*goal/i,
/maybe.*i.*misunderstand/i,
/help.*me.*understand.*again/i,  // But asking same question again
```

**Category 6: HALLUCINATED COMMANDS**
```typescript
// These use commands that don't exist
/opencode\s+container\s+(run|start|exec)/i,
/npm\s+test.*--docker/i,
/docker\s+test.*--opencode/i,
/opencode\s+verify.*--me/i,
```

**Category 7: THEATRICAL VERIFICATION**
```typescript
// These "verify" without actually testing
/grep.*\|.*wc.*>.*verification/i,
/cat.*file.*\|.*grep.*test/i,
/ls.*-la.*dist.*\|.*wc/i,
/find.*-name.*\.js.*\|.*wc/i,
```

**Category 8: SUSPICIOUS TIMING**
```typescript
// These happen suspiciously fast (too fast to be real)
/completed.*in.*0\.\d*seconds/i,
/all.*tests.*passed.*immediately/i,
// Model claiming 1000 line change in 2 seconds
```

**Category 9: REPETITIVE FAILURE**
```typescript
// Same failure repeated without learning
/same.*error.*again.*still/i,
/still.*not.*working.*same/i,
/repeated.*failure.*no.*change/i,
```

**Category 10: SELF-REFERENCING SUCCESS**
```typescript
// Claiming success based on own assessment
/my.*analysis.*confirms/i,
/based.*on.*my.*review/i,
/i.*have.*verified.*that/i,
/in.*my.*assessment.*it.*works/i,
```

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Fix Existing Broken Layers

- [ ] L1: Fix false positives (mkdir, legitimate grep)
- [ ] L1: Add theatrical verification detection
- [ ] L4: Fix container plugin loading
- [ ] L4: Verify firewalls fire inside container

### Phase 2: Add Missing Layers

- [ ] L5: Implement anti-derailment patterns
- [ ] L5: Block host fallback attempts
- [ ] L5: Block mock/stub suggestions
- [ ] L6: Implement local file protection
- [ ] L6: Require container workflow
- [ ] L6: Add sudo verification
- [ ] L7: Implement verification gate
- [ ] L7: Mechanical proof requirement
- [ ] L7: Ship package verification

### Phase 3: Behavioral Intelligence

- [ ] L8: Add success claim detection
- [ ] L8: Add shortcut suggestion detection
- [ ] L8: Add scope creep detection
- [ ] L8: Add impatience detection
- [ ] L8: Add confusion pretense detection
- [ ] L8: Add suspicious timing detection
- [ ] L8: Add repetitive failure detection
- [ ] L8: Add self-referencing success detection

### Phase 4: Self-Reinforcing Loop

- [ ] Track bypass attempts
- [ ] Learn from successful bypasses (update patterns)
- [ ] Mechanical verification of "learning"
- [ ] Zero trust of model claims

---

## FILE LOCATIONS

```
/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/
├── src/hooks/v4.1/
│   ├── guardian-hook.ts        # L0-L4 fixes + L5 addition
│   ├── anti-derailment-hook.ts # NEW L5 - Behavioral blocking
│   ├── local-file-protect.ts   # NEW L6 - File protection
│   ├── verification-gate.ts     # NEW L7 - Proof requirements
│   └── behavioral-intel.ts     # NEW L8 - Deep patterns
└── dist/index.js              # Rebuild after changes
```

---

## FIREWALL RESPONSE TEMPLATES

### When Blocking
```
[FIREWALL LAYER {N}] {CATEGORY} BLOCKED.

What you tried: {COMMAND}
Why blocked: {REASON}

MECHANICAL RULE: {RULE}

REQUIRED: {WHAT_TO_DO_INSTEAD}
```

### When Allowing
```
[FIREWALL] Passed Layer {N}.
Command: {COMMAND}
Category: {CATEGORY}
Status: ALLOWED
```

### When Requiring Verification
```
[VERIFICATION GATE] PROOF REQUIRED.

You claimed: {CLAIM}
Required: {MECHANICAL_PROOF}

MECHANICAL RULE: Claims without proof are rejected.
```

---

## SUCCESS METRICS

### Firewall is Working When:

1. NO commands pass that don't advance the build
2. NO "it works on host" fallback claims
3. NO mock/stub suggestions
4. NO local file edits without container
5. NO success claims without mechanical proof
6. ALL theatrical verification is blocked
7. ALL dangerous operations require approval
8. Container testing is ALWAYS required for plugins

### Red Flags (Firewall Failing):

- [ ] Agent suggesting "simpler approach"
- [ ] Agent claiming "host already proves it works"
- [ ] Agent suggesting mocks/stubs
- [ ] Agent editing local files
- [ ] Agent claiming success without evidence
- [ ] Same test failing repeatedly
- [ ] Commands running suspiciously fast
- [ ] Agent "confused" about task

---

## CONTEXT REMINDERS (FIREWALL MUST ENFORCE)

1. Container testing = ONLY way to verify plugins
2. No host fallback - if container fails, FIX container
3. MiniMax M2.7 (normal) or Google Gemma for testing
4. DeepSeek is USER ONLY - never in agents
5. No local file edits - container only
6. No mocks - real runtime only
7. Success requires MECHANICAL proof
8. Firewalls must be SMARTER than the model

---

## REVISION HISTORY

- 2026-04-10: Initial complete audit
- Status: IMPLEMENTATION REQUIRED

