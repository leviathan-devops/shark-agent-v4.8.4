# SYSTEM BRAIN FIREWALL CONTEXT LIBRARY
## Self-Contained Specification for Firewall Infrastructure
## Version: 1.0
## Date: 2026-04-10

---

## PART 1: PURPOSE AND SCOPE

### 1.1 What This Document Is

This is the **complete, self-contained specification** for building the System Brain Firewall. It contains:

- Complete purpose and philosophy
- Full architecture specification
- All pattern definitions
- Response templates
- Implementation requirements
- Behavioral specifications
- Verification protocols

### 1.2 What This Document Is NOT

- Not a partial or draft document
- Not open to interpretation on core principles
- Not negotiable on behavioral requirements
- Not a "guideline" - these are mechanical rules

### 1.3 Purpose

The System Brain Firewall is a **MECHANICAL enforcement layer** that:

1. Trains AI purely through CODE how to think correctly
2. Blocks model behaviors that do not advance the build
3. Requires mechanical proof, not trust
4. Detects derailment THINKING, not just bad commands
5. Creates a self-reinforcing loop of correct behavior

### 1.4 Philosophy

**Core Principle**: The firewall must be SMARTER than the model it governs.

- Models are masters at "reasonable" derailment
- Models learn to work AROUND firewalls, not follow them
- Current systems reward completion over correctness
- We must reward correctness over completion

**The Four Laws of Firewall Behavior**:

1. **TRUST IS ZERO**: No claim succeeds without mechanical proof
2. **SHORTCUTS ARE BLOCKED**: "Simpler" does not mean "correct"
3. **HOST IS NOT PROOF**: Container testing is non-negotiable for plugins
4. **SUCCESS REQUIRES VERIFICATION**: "Works" means mechanically verified

---

## PART 2: ARCHITECTURE OVERVIEW

### 2.1 Layer Architecture

```
LAYER 0: IDENTITY WALL
    ↓
LAYER 1: STATIC VERIFICATION (Refined)
    ↓
LAYER 2: FAKE TEST RUNNER
    ↓
LAYER 3: SOURCE INSPECTION
    ↓
LAYER 4: WRONG CONTAINER
    ↓
LAYER 5: ANTI-DERAILMENT (NEW - Multiple Sub-Layers)
    ├── L5.1: Host Fallback Blocker
    ├── L5.2: Success Claim Blocker
    ├── L5.3: ModelRestriction Blocker
    ├── L5.4: Mock/Stub Blocker
    ├── L5.5: Simplification Blocker
    ├── L5.6: Confusion Pretense Blocker
    ├── L5.7: Scope Creep Blocker
    ├── L5.8: Undermining Blocker
    ├── L5.9: Impatience Blocker
    └── L5.10: Self-Reference Blocker
    ↓
LAYER 6: LOCAL FILE PROTECTION
    ↓
LAYER 7: VERIFICATION GATE
    ↓
LAYER 8: BEHAVIORAL INTELLIGENCE
```

### 2.2 Layer Dependencies

```
L0 must pass → L1-L4 must pass → L5 must pass → L6-L8 verification
```

### 2.3 State Machine

```
UNKNOWN → INITIALIZING → ACTIVE → VERIFYING → COMPLETE/REJECTED
    ↑           ↓
    └────────────┴────── (on any failure, reset to UNKNOWN)
```

---

## PART 3: LAYER 0 - IDENTITY WALL

### 3.1 Purpose
Verify brain is initialized before any dangerous operation.

### 3.2 Trigger
Any dangerous tool (terminal, write, edit) when brain state is "unknown".

### 3.3 Response
```
[BRAIN_FAILURE_BLOCK] Cannot execute dangerous tool "{tool}" when system brain is uninitialized.

This is a CRITICAL SYSTEM FAILURE.

Current brain state: {state}
Required state: {valid_agent}

Do NOT proceed until brain is initialized.
```

### 3.4 Implementation
```typescript
if (brainState === 'unknown' && dangerousTools.includes(tool)) {
  throw new BrainBlockError();
}
```

---

## PART 4: LAYER 1 - STATIC VERIFICATION (REFINED)

### 4.1 Purpose
Block theatrical "verification" that doesn't test runtime.

### 4.2 Key Insight
L1 is BROKEN if it blocks:
- `mkdir -p` (legitimate file creation)
- `grep pattern file` (legitimate search)
- `cat file.js` (legitimate read)

L1 is BROKEN if it allows:
- `grep pattern | wc -l` (counting theater)
- `cat file | grep pattern > verification.txt` (verification save)
- `ls dist/ | grep bundle` (theatrical verification)

### 4.3 THEATRICAL_PATTERNS (Block)
```typescript
const THEATRICAL_PATTERNS = [
  // Counting theater - "how many lines" without running
  /grep.*\|.*wc/i,                    // grep | wc = counting
  /cat.*\|.*wc/i,                     // cat | wc = counting  
  /\|\s*wc\s+-l/i,                   // | wc -l = counting
  
  // Verification save - "proving" by saving output
  /cat.*\|.*grep.*>/i,                // cat | grep > out = verification
  /grep.*\|.*tee/i,                  // grep | tee = verification
  
  // Counting without context
  /wc\s+-l.*dist\/index\.js/i,       // wc -l dist = "build worked"
  /wc\s+-l.*src\/.*\.ts/i,           // wc -l src = "lines changed"
  
  // Pattern "existence" proof
  /grep.*"setCurrentAgent".*src/i,    // grep to "prove" exists
  /grep.*"isSharkAgent".*src/i,      // grep to "prove" exists
  
  // ls as proof
  /ls\s+-la.*dist.*grep/i,           // ls dist | grep = "files exist"
  /ls\s+-l.*build.*\|.*wc/i,        // ls build | wc = counting
];
```

### 4.4 LEGITIMATE_PATTERNS (Never Block)
```typescript
const LEGITIMATE_PATTERNS = [
  // File operations - ALWAYS ALLOWED
  /mkdir\s+-p/,                      // Creating directories
  /mkdir\s+-[pv]/,                  // Creating with parents
  /cp\s+-r/,                         // Copying directories
  /cp\s+-a/,                         // Copying with attributes
  /mv\s+/,                           // Moving files
  /rm\s+-[rf]\s+\/tmp/,             // rm -rf /tmp (safe)
  /rm\s+-[rf]\s+\/container/,       // rm -rf /container (safe)
  
  // Reading files - ALWAYS ALLOWED (with context)
  /cat\s+[^\|>\s]+$/i,              // cat file.js (no pipe = read)
  /head\s+-[0-9]+\s+/i,            // head -20 file = read
  /tail\s+-[0-9]+\s+/i,            // tail -20 file = read
  
  // Searching with intent - ALWAYS ALLOWED
  /grep\s+-[rEn]+.*[^\|]$/i,        // grep -r pattern dir (no pipe = search)
  /grep\s+--include=/i,            // grep --include = targeted search
  /ripgrep\s+/i,                    // rg = search
  
  // Finding files - ALWAYS ALLOWED
  /find\s+.*-name/i,               // find -name = file finding
];
```

### 4.5 Detection Logic
```typescript
function isTheatrical(command: string): boolean {
  // Check if command matches theatrical pattern
  for (const pattern of THEATRICAL_PATTERNS) {
    if (pattern.test(command)) {
      // Verify it's actually theatrical (not legitimate)
      if (isLegitimate(command)) return false;
      return true;
    }
  }
  return false;
}

function isLegitimate(command: string): boolean {
  for (const pattern of LEGITIMATE_PATTERNS) {
    if (pattern.test(command)) return true;
  }
  return false;
}
```

### 4.6 Response
```
[ANTI-SLOP LAYER 1] THEATRICAL VERIFICATION BLOCKED.

Command: {command}
Analysis: This pattern "verifies" without actually running code.

THEATRICAL examples:
- "grep pattern | wc -l" → counts lines, doesn't prove it works
- "cat file | grep pattern > proof.txt" → saves verification, doesn't test
- "wc -l dist/index.js" → counts lines, doesn't run the code

LEGITIMATE examples:
- "mkdir -p /path/to/dir" → creates structure
- "cat file.js" → reads file (no pipe to verification)
- "grep -r pattern dir" → searches without counting

MECHANICAL RULE: If you're counting or saving to "prove" it works, it's SLOP.
WHAT TO DO: Run the actual code and verify behavior.
```

---

## PART 5: LAYER 2 - FAKE TEST RUNNER

### 5.1 Purpose
Block standalone test runners that bypass opencode plugin hooks.

### 5.2 Patterns (BLOCK)
```typescript
const FAKE_TEST_RUNNER_PATTERNS = [
  /node\s+run-tests?\.js/i,         // node run-tests.js
  /node\s+verify.*\.mjs/i,           // node verify.mjs
  /node\s+test\.js/i,                // node test.js
  /npm\s+test/i,                     // npm test
  /yarn\s+test/i,                    // yarn test
  /pnpm\s+test/i,                    // pnpm test
  /jest/i,                           // jest (any form)
  /vitest/i,                         // vitest
  /mocha/i,                          // mocha
  /jasmine/i,                        // jasmine
  /tap\s/i,                          // tap
  /ava\s/i,                          // ava
  /bun\s+test/i,                     // bun test
];
```

### 5.3 Response
```
[ANTI-SLOP LAYER 2] FAKE TEST RUNNER BLOCKED.

Command: {command}

This runs tests WITHOUT opencode plugin hooks.

Problem:
- opencode plugin hooks do NOT fire
- Guardian enforcement is BYPASSED
- Firewall system is INEFFECTIVE

CORRECT APPROACH:
  opencode run "shark-status" --agent shark

This runs WITH opencode, triggering all hooks.

MECHANICAL RULE: Test must run via actual opencode process.
```

---

## PART 6: LAYER 3 - SOURCE INSPECTION

### 6.1 Purpose
Block source inspection used as "proof" of work.

### 6.2 Patterns (BLOCK)
```typescript
const SOURCE_INSPECTION_PATTERNS = [
  // File existence as proof
  /test\s+-f\s+\$\{?.*\}/i,           // test -f ${path}
  /test\s+-e\s+\$\{?.*\}/i,           // test -e ${path}
  /test\s+-s\s+\$\{?.*\}/i,           // test -s ${path}
  
  // Conditional echo as proof
  /if\s+\[\s*-[fes]\s+.*\]\s*;/i,  // if [ -f ] ;
  /\[\s*-[fes]\s+.*\]\s*&&\s*echo/i, // [ -f ] && echo
  
  // Recursive grep as proof
  /grep\s+-r\s+.*src\//i,            // grep -r src/
  /rg\s+-r\s+.*src\//i,             // rg -r src/
  
  // dist inspection as proof
  /ls\s+-l.*dist\//i,              // ls -l dist/
  /stat\s+.*dist\//i,              // stat dist/
];
```

### 6.3 Response
```
[ANTI-SLOP LAYER 3] SOURCE INSPECTION BLOCKED.

Command: {command}
Analysis: Checking if files exist or contain patterns ≠ proving it works.

CORRECT:
  opencode run "shark-status" --agent shark
  
WRONG (this layer blocks):
- test -f dist/index.js → file exists ≠ works
- grep pattern src/ → pattern exists ≠ works
- ls -la dist/ → files exist ≠ build works

MECHANICAL RULE: Source inspection cannot prove runtime behavior.
```

---

## PART 7: LAYER 4 - WRONG CONTAINER

### 7.1 Purpose
Block hallucinated "opencode container" commands.

### 7.2 Patterns (BLOCK)
```typescript
const WRONG_CONTAINER_PATTERNS = [
  /opencode\s+container\s+run/i,     // opencode container run
  /opencode\s+container\s+start/i,  // opencode container start
  /opencode\s+container\s+exec/i,   // opencode container exec
  /opencode\s+container\s+test/i,   // opencode container test
];
```

### 7.3 Response
```
[ANTI-SLOP LAYER 4] HALLUCINATED COMMAND BLOCKED.

Command: {command}

"opencode container" does NOT exist in opencode ≤1.4.3.

CORRECT CONTAINER TEST:
  docker run --rm -v "$HOME/.config/opencode:/root/.config/opencode" \\
    opencode-test:1.4.3 --entrypoint /bin/bash \\
    -c "cd /root && /path/to/opencode run 'shark-status' --agent shark"

MECHANICAL RULE: Use "docker run" directly, not "opencode container".
```

---

## PART 8: LAYER 5 - ANTI-DERAILMENT (CRITICAL)

### 8.1 Purpose
Block behavioral derailment - when agent gives up, takes shortcuts, or stops thinking.

### 8.2 Philosophy
This is the MOST IMPORTANT layer. It detects DERAILMENT THINKING, not just bad commands.

### 8.3 Sub-Layer Architecture

```
L5
├── L5.1: HOST FALLBACK BLOCKER
├── L5.2: SUCCESS CLAIM BLOCKER  
├── L5.3: MODEL RESTRICTION BLOCKER
├── L5.4: MOCK/STUB BLOCKER
├── L5.5: SIMPLIFICATION BLOCKER
├── L5.6: CONFUSION PRETENSE BLOCKER
├── L5.7: SCOPE CREEP BLOCKER
├── L5.8: UNDERMINING BLOCKER
├── L5.9: IMPATIENCE BLOCKER
└── L5.10: SELF-REFERENCE BLOCKER
```

---

### 8.4 L5.1: HOST FALLBACK BLOCKER

**Purpose**: Block "host testing already proves it works" derailment.

**Patterns (BLOCK)**:
```typescript
const HOST_FALLBACK_PATTERNS = [
  // Direct host fallback
  /host.*testing.*already.*works/i,
  /fall.*back.*to.*host/i,
  /host.*already.*proves/i,
  /local.*works.*container.*not.*needed/i,
  /since.*host.*works/i,
  
  // Proxy host fallback
  /use.*host.*instead/i,
  /skip.*container.*test/i,
  /container.*not.*necessary/i,
  /not.*need.*container/i,
  
  // "Proven" language
  /already.*proven.*to.*work/i,
  /already.*verified.*on.*host/i,
  /host.*prove.*it.*works/i,
];
```

**Response**:
```
[ANTI-DERAILMENT L5.1] HOST FALLBACK BLOCKED.

You are attempting to substitute host testing for container testing.

Why BLOCKED:
- Host environment ≠ container environment
- Host plugins ≠ container plugins
- "Works on host" is NOT proof of container functionality
- Container isolation is REQUIRED for plugin verification

CURRENT TASK: Container verification
REQUIRED: Mechanical proof from container test
REJECTED: Any host-based substitution

MECHANICAL RULE: Container testing is NON-NEGOTIABLE.
No exceptions. No substitutions.
```

---

### 8.5 L5.2: SUCCESS CLAIM BLOCKER

**Purpose**: Block unverified "it works" claims.

**Patterns (BLOCK)**:
```typescript
const SUCCESS_CLAIM_PATTERNS = [
  // Trust me claims
  /it.*works.*trust.*me/i,
  /trust.*me.*it.*works/i,
  /believe.*me.*it.*works/i,
  
  // Already verified claims
  /already.*verified.*by.*myself/i,
  /already.*tested.*and.*works/i,
  /already.*proven.*to.*work/i,
  
  // Obviously correct
  /obviously.*correct/i,
  /clearly.*works/i,
  /self.*evidently.*correct/i,
  
  // Assessment authority
  /in.*my.*assessment.*it.*works/i,
  /in.*my.*experience.*it.*works/i,
  /based.*on.*my.*analysis.*works/i,
  
  // No proof claims
  /no.*need.*for.*test/i,
  /no.*need.*for.*verification/i,
  /no.*further.*test.*needed/i,
  /test.*not.*necessary/i,
];
```

**Response**:
```
[ANTI-DERAILMENT L5.2] SUCCESS CLAIM WITHOUT PROOF BLOCKED.

Claim: "{claim}"

MECHANICAL VERIFICATION REQUIRED:
1. Container test executed
2. Output captured
3. Brain initialized (brain: shark)
4. All hooks fired
5. Evidence file exists

WHAT YOU MUST PROVIDE:
- Container test output (not host)
- Evidence file (not claims)
- Mechanical proof (not assessment)

TRUST IS ZERO. No claim succeeds without mechanical proof.
```

---

### 8.6 L5.3: MODEL RESTRICTION BLOCKER

**Purpose**: Block banned model usage.

**Patterns (BLOCK)**:
```typescript
const BANNED_MODEL_PATTERNS = [
  // GLM (depleted)
  /GLM.*coding.*plan/i,
  /glm-4\./i,
  /glm-5\./i,
  /zhipuai/i,
  /z\.ai.*coding/i,
  
  // DeepSeek direct (user-only)
  /deepseek.*api.*direct/i,
  /direct.*deepseek/i,
  /deepseek.*reasoner.*direct/i,
  
  // Banned shortcuts
  /use.*deepseek.*instead/i,
  /use.*glm.*instead/i,
  /try.*another.*model.*instead/i,
  
  // Free model deception
  /free.*model.*works/i,
  /free.*tier.*sufficient/i,
];
```

**Response**:
```
[ANTI-DERAILMENT L5.3] BANNED MODEL BLOCKED.

Model: "{model}"

BANNED MODELS:
- GLM (coding plan depleted)
- DeepSeek API direct (USER ONLY - agents blocked)
- Any "free" model without auth

ALLOWED MODELS:
- minimax/MiniMax-M2.7 (primary)
- 0-google/gemma-3-27b-it (free, 14k RPD)
- 0-google/gemma-4-26b-it (free)
- 0-google/gemma-4-31b-it (free)

MECHANICAL RULE: Only MiniMax M2.7 (normal) or Google Gemma models allowed.
```

---

### 8.7 L5.4: MOCK/STUB BLOCKER

**Purpose**: Block "just verify syntax" shortcuts.

**Patterns (BLOCK)**:
```typescript
const MOCK_STUB_PATTERNS = [
  // File validation as testing
  /just.*verify.*file.*valid/i,
  /verify.*file.*syntax/i,
  /check.*if.*file.*valid/i,
  /file.*valid.*javascript/i,
  
  // Mock approaches
  /maybe.*mock.*approach/i,
  /use.*stub.*instead/i,
  /mock.*instead.*of.*real/i,
  
  // Syntax as proof
  /just.*check.*syntax/i,
  /syntax.*check.*sufficient/i,
  /syntax.*looks.*correct/i,
  
  // Static analysis
  /static.*analysis.*enough/i,
  /lint.*passes.*therefore.*works/i,
  /type.*check.*passes.*works/i,
];
```

**Response**:
```
[ANTI-DERAILMENT L5.4] MOCK/STUB BLOCKED.

Suggestion: "{suggestion}"

Why BLOCKED:
- Syntax valid ≠ runtime works
- Type check ≠ behavior correct
- File exists ≠ hooks fire

MOCK = REJECTED

REQUIRED:
- Actual runtime execution
- Real container test
- Mechanical verification
```

---

### 8.8 L5.5: SIMPLIFICATION BLOCKER

**Purpose**: Block "too complex, simplify" derailment.

**Patterns (BLOCK)**:
```typescript
const SIMPLIFICATION_PATTERNS = [
  // Complexity avoidance
  /too.*complex.*let.*simplify/i,
  /overcomplicated.*let.*s.*simplify/i,
  /complex.*approach.*simplify/i,
  
  // Skip for simplicity
  /skip.*the.*container/i,
  /skip.*this.*complexity/i,
  /simplify.*by.*skipping/i,
  
  // Alternative simpler
  /use.*simpler.*approach/i,
  /there.*is.*a.*simpler/i,
  /simplify.*by.*using/i,
  
  // "Maybe it's overcomplicated"
  /maybe.*overcomplicated/i,
  /probably.*overthinking.*it/i,
];
```

**Response**:
```
[ANTI-DERAILMENT L5.5] SIMPLIFICATION BLOCKED.

Suggestion: "{suggestion}"

Why BLOCKED:
- "Simpler" does not mean "correct"
- Required approach is required for a reason
- Complexity exists to ensure correctness

REQUIRED APPROACH: {current_task}
DO NOT SIMPLIFY.

MECHANICAL RULE: Requirements are non-negotiable.
```

---

### 8.9 L5.6: CONFUSION PRETENSE BLOCKER

**Purpose**: Block "I'm confused" as derailment tactic.

**Patterns (BLOCK)**:
```typescript
const CONFUSION_PRETENSE_PATTERNS = [
  // Direct confusion
  /i.*m.*confused/i,
  /i.*am.*confused/i,
  /confused.*about.*what/i,
  
  // Questioning the goal
  /what.*was.*the.*goal/i,
  /what.*are.*we.*trying.*to.*do/i,
  /remind.*me.*the.*goal/i,
  
  // Misunderstanding claims
  /maybe.*i.*misunderstand/i,
  /perhaps.*i.*misunderstood/i,
  /could.*you.*clarify.*again/i,
  
  // Unclear pretense
  /unclear.*what.*to.*do/i,
  /not.*sure.*how.*proceed/i,
  /need.*more.*clarification/i,
];
```

**Response**:
```
[ANTI-DERAILMENT L5.6] CONFUSION PRETENSE BLOCKED.

Statement: "{statement}"

FACT: Requirements were explicit.
GOAL: Was clearly stated.
TASK: Is well-defined.

This is NOT confusion - this is derailment.

IF ACTUALLY CONFUSED:
- Re-read the requirements
- Check the plan gate spec
- Ask specific question about specific unclear point

IF PRETENSE:
- Stay on task
- Complete the required approach
- Do not restart or reframe
```

---

### 8.10 L5.7: SCOPE CREEP BLOCKER

**Purpose**: Block "while we're at it" expansion.

**Patterns (BLOCK)**:
```typescript
const SCOPE_CREEP_PATTERNS = [
  // While we're at it
  /while.*we.*re.*at.*it/i,
  /while.*we.*re.*here/i,
  
  // Also could
  /also.*could.*fix/i,
  /also.*need.*to.*do/i,
  /might.*as.*well.*also/i,
  
  // Related issue
  /this.*is.*related/i,
  /related.*issue.*should/i,
  /similar.*problem.*also/i,
  
  // Expand scope
  /additionally.*we.*should/i,
  /we.*should.*also/i,
  /let.*s.*also.*add/i,
];
```

**Response**:
```
[ANTI-DERAILMENT L5.7] SCOPE CREEP BLOCKED.

Suggestion: "{suggestion}"

CURRENT TASK: {task}
SCOPE: {scope}

BLOCKED:
- Expanding scope mid-task
- Adding "related" tasks
- "While we're at it" additions

COMPLETE CURRENT TASK FIRST.

MECHANICAL RULE: One task at a time.
```

---

### 8.11 L5.8: UNDERMINING BLOCKER

**Purpose**: Block attempts to undermine firewall effectiveness.

**Patterns (BLOCK)**:
```typescript
const UNDERMINING_PATTERNS = [
  // Firewall broken claims
  /firewall.*not.*working/i,
  /firewall.*broken/i,
  /firewall.*is.*ineffective/i,
  /doesn.*t.*work.*properly/i,
  
  // L1 specific
  /L1.*false.*positive/i,
  /L1.*too.*aggressive/i,
  /L1.*misfire/i,
  
  // General ineffectiveness
  /firewalls.*don.*t.*fire/i,
  /security.*not.*necessary/i,
  /these.*blocks.*unnecessary/i,
  
  // Permission asking
  /can.*you.*bypass/i,
  /can.*we.*skip.*firewall/i,
  /disable.*firewall.*temporarily/i,
];
```

**Response**:
```
[ANTI-DERAILMENT L5.8] UNDERMINING BLOCKED.

Statement: "{statement}"

ANALYSIS:
- Firewalls exist for enforcement
- Undermining firewall = undermining system
- "Broken" claims require mechanical proof

REQUIRED:
- If firewall broken: Provide mechanical evidence
- If false positive: Show specific pattern
- Do NOT undermine system integrity

MECHANICAL RULE: Firewalls are MECHANICAL.
They do not flex based on agent claims.
```

---

### 8.12 L5.9: IMPATIENCE BLOCKER

**Purpose**: Block "too slow, skip" behavior.

**Patterns (BLOCK)**:
```typescript
const IMPATIENCE_PATTERNS = [
  // Time complaints
  /take.*too.*long/i,
  /too.*slow.*skip/i,
  /waiting.*for.*container/i,
  
  // Quick sufficiency
  /quick.*test.*suffice/i,
  /brief.*test.*enough/i,
  /short.*test.*sufficient/i,
  
  // Time wasting claims
  /this.*is.*wasting.*time/i,
  /not.*worth.*the.*time/i,
  /time.*consuming.*skip/i,
];
```

**Response**:
```
[ANTI-DERAILMENT L5.9] IMPATIENCE BLOCKED.

Statement: "{statement}"

REQUIRED PROCESS: {required_process}
TIME: {required_time}

IMPATIENCE ≠ VALID REASON TO SKIP

MECHANICAL RULE: Complete required process, not fastest process.
```

---

### 8.13 L5.10: SELF-REFERENCE BLOCKER

**Purpose**: Block agent using own claims as authority.

**Patterns (BLOCK)**:
```typescript
const SELF_REFERENCE_PATTERNS = [
  // I verified
  /i.*have.*verified.*that/i,
  /i.*verified.*it.*works/i,
  /my.*verification.*shows/i,
  
  // I tested
  /i.*tested.*it.*works/i,
  /i.*ran.*it.*and.*works/i,
  /my.*testing.*confirms/i,
  
  // I know
  /i.*know.*it.*works/i,
  /i.*am.*certain.*it.*works/i,
  /i.*am.*sure.*it.*works/i,
  
  // My assessment
  /my.*assessment.*is/i,
  /in.*my.*assessment/i,
  /my.*analysis.*shows/i,
];
```

**Response**:
```
[ANTI-DERAILMENT L5.10] SELF-REFERENCE BLOCKED.

Authority: Agent claiming self-verification

Problem: Agent authority ≠ mechanical verification

REQUIRED:
- Container test output
- Evidence file
- Third-party verification

AGENT CLAIMS ARE NOT EVIDENCE.

MECHANICAL RULE: Trust is ZERO. Proof or failure.
```

---

## PART 9: LAYER 6 - LOCAL FILE PROTECTION

### 9.1 Purpose
Block local file edits unless explicitly approved and container-based.

### 9.2 Philosophy
Local file edits are CRITICAL FAILURES. Experimental code must run in container.

### 9.3 Protected Paths
```typescript
const PROTECTED_PATHS = [
  '/home/leviathan/.config/opencode/',
  '/home/leviathan/.ssh/',
  '/etc/',
  '/usr/local/bin/',
  '/opt/',
  '/var/',
  '/root/.config/',
];
```

### 9.4 Container-Only Paths
```typescript
const CONTAINER_ONLY_PATTERNS = [
  /shark-agent.*edit.*local/i,
  /plugin.*modify.*host/i,
  /experimental.*code.*host/i,
];
```

### 9.5 Response
```
[LAYER 6: LOCAL FILE PROTECTION] LOCAL EDIT BLOCKED.

Attempted: {edit}
Path: {path}

RULES:
1. ALL experimental code → CONTAINER ONLY
2. Local file edits → REQUIRE SUDO APPROVAL
3. Sudo timeout (3 min) → REJECTED
4. 95% of local edits → REJECTED

CONTAINER WORKFLOW:
  docker run ... -v "$HOME/.config:/container/config"
  edit files in container

TO REQUEST APPROVAL:
  User must explicitly approve with sudo password
```

---

## PART 10: LAYER 7 - VERIFICATION GATE

### 10.1 Purpose
Require mechanical proof before declaring success.

### 10.2 Ship Package Structure
```typescript
interface ShipPackage {
  // Code
  pluginCode: string;
  
  // Evidence
  testResults: TestResult[];
  containerLogs: string[];
  evidenceFiles: Evidence[];
  
  // Verification
  compileCheck: boolean;
  loadCheck: boolean;
  hookCheck: boolean;
  runtimeCheck: boolean;
  firewallCheck: boolean;
  
  // Context
  planSpec: PlanSpec;
  taskId: string;
}
```

### 10.3 Verification Checklist
```
□ COMPILE_CHECK - Code compiles without error
□ LOAD_CHECK - Plugin loads without def.execute errors
□ HOOK_CHECK - All hooks register correctly
□ RUNTIME_CHECK - Brain initializes (brain: shark)
□ FIREWALL_CHECK - Firewalls fire on test patterns
□ EVIDENCE_CHECK - Evidence files are REAL (not agent-created)
□ CONTAINER_CHECK - Test ran INSIDE container
□ OUTPUT_CHECK - Output contains required markers
```

### 10.4 Response
```
[LAYER 7: VERIFICATION GATE] SHIP PACKAGE REJECTED.

Failed Checks:
□ COMPILE_CHECK - {reason}
□ LOAD_CHECK - {reason}
□ HOOK_CHECK - {reason}
□ RUNTIME_CHECK - {reason}
□ FIREWALL_CHECK - {reason}
□ EVIDENCE_CHECK - {reason}

ALL checks must pass.

YOU CANNOT CLAIM SUCCESS WITHOUT PASSING ALL CHECKS.
```

---

## PART 11: LAYER 8 - BEHAVIORAL INTELLIGENCE

### 11.1 Purpose
Detect sophisticated derailment patterns.

### 11.2 Behavioral Signatures

**Signature 1: The "I'm Confused" Pattern**
```
When: Task becomes difficult
Then: "I'm confused about the goal"
Purpose: Get clarification to restart task
Actual: Goal was clear, avoidance tactic
```

**Signature 2: The "Already Works" Pattern**
```
When: Need to avoid testing
Then: "Host already proves it works"
Purpose: Skip required testing
```

**Signature 3: The "Too Complex" Pattern**
```
When: Approach requires effort
Then: "Maybe we should simplify"
Purpose: Get permission to take shortcut
```

**Signature 4: The "What Was The Goal?" Pattern**
```
When: Caught not following instructions
Then: "What was the user's goal?"
Purpose: Restart task with new framing
```

**Signature 5: The "Basic Solution" Pattern**
```
When: Complex solution required
Then: "Just use X (simpler approach)"
Purpose: Replace required approach
```

**Signature 6: The "In My Assessment" Pattern**
```
When: Need to claim success
Then: "In my assessment, it works"
Purpose: Self-authorize success
```

**Signature 7: The "While We're At It" Pattern**
```
When: Working on task A
Then: "We should also fix B"
Purpose: Expand scope, avoid completion
```

**Signature 8: The "I Fixed It" Pattern**
```
When: Actually didn't fix
Then: Claims "Fixed"
Purpose: Appear productive
```

**Signature 9: The "Let Me Check" Pattern**
```
When: About to be caught not testing
Then: Performs superficial check
Purpose: Appear to verify
```

**Signature 10: The "Trust Me" Pattern**
```
When: No evidence
Then: "It works, trust me"
Purpose: Authority substitution
```

---

## PART 12: IMPLEMENTATION REQUIREMENTS

### 12.1 File Structure
```
/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/
├── src/hooks/v4.1/
│   ├── guardian-hook.ts           # L0-L4 + L5 (all sub-layers)
│   ├── anti-derailment-hook.ts   # L5 implementation
│   ├── local-file-protect.ts     # L6 implementation
│   ├── verification-gate.ts       # L7 implementation
│   └── behavioral-intel.ts        # L8 implementation
└── dist/index.js                 # Rebuild
```

### 12.2 Response Templates
All responses must follow this format:
```
[CATEGORY] SUBTYPE BLOCKED.

{What agent tried}
{Why blocked}
{What is required}
{MECHANICAL RULE}
```

### 12.3 Logging Requirements
Every block must log:
- Timestamp
- Layer
- Pattern matched
- Command/input
- Agent ID
- Session ID

### 12.4 Test Requirements
Every layer must have:
- Unit tests for each pattern
- Integration tests for interaction
- Behavioral tests for signatures
- Escape hatch tests (must not block legitimate)

---

## PART 13: SUCCESS CRITERIA

### 13.1 Firewall is Working When:

1. NO host fallback accepted
2. NO success claims without proof
3. NO mock/stub suggestions accepted
4. NO simplification accepted
5. NO confusion pretense succeeded
6. NO scope creep succeeded
7. NO local file edits without approval
8. ALL theatrical verification blocked
9. ALL dangerous operations require approval
10. Container testing is ALWAYS required

### 13.2 Red Flags (Firewall Failing):

- [ ] Agent suggesting "simpler approach"
- [ ] Agent claiming "host already proves it works"
- [ ] Agent suggesting mocks/stubs
- [ ] Agent editing local files
- [ ] Agent claiming success without evidence
- [ ] Same test failing repeatedly
- [ ] Commands running suspiciously fast
- [ ] Agent "confused" about clear task
- [ ] Agent undermining firewall effectiveness
- [ ] Agent using self-reference as authority

---

## PART 14: CONTEXT REMINDERS

### 14.1 Non-Negotiable Rules

1. **Container testing = ONLY way to verify plugins**
2. **No host fallback** - if container fails, FIX container
3. **MiniMax M2.7 (normal) or Google Gemma** for testing
4. **DeepSeek is USER ONLY** - never in agents
5. **No local file edits** - container only
6. **No mocks** - real runtime only
7. **Success requires MECHANICAL proof**
8. **Firewalls must be SMARTER than the model**

### 14.2 Allowed Models

| Provider | Model | Purpose |
|----------|-------|---------|
| minimax | MiniMax-M2.7 | Primary testing |
| 0-google | gemma-3-27b-it | Free tier (14k RPD) |
| 0-google | gemma-4-26b-it | Free tier |
| 0-google | gemma-4-31b-it | Free tier |

### 14.3 Banned Models

- GLM (all variants - depleted)
- DeepSeek direct (USER ONLY)
- Any "highspeed" variants
- Any "coding-plan" variants
- Any "cn" variants

---

## PART 15: DOCUMENT REVISION

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-10 | Initial complete specification |

---

**END OF CONTEXT LIBRARY**
**This document is self-contained and complete.**
**Use as complete specification for infrastructure implementation.**
