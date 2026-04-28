# Parallel Peer Brain Execution in V4 Boilerplate

> **Ground truth source:** `/home/leviathan/OPENCODE_WORKSPACE/shark-agent-rebirth/shark-context/`
> This document describes the Shark Macro (triple-brain parallel peer) architecture as defined in the shark-context library — not a hypothetical design.

## The Core Concept

**Parallel Peer Brain Execution** is a multi-brain coordination pattern where three brains operate as peers — simultaneously and independently — rather than as a parent-child hierarchy where one brain delegates to another.

Instead of the classic sequential pattern:

```
Brain A (plans) → finishes → signals → Brain B (executes) → Brain A (reviews)
```

You get three brains racing concurrently, each owning a domain of state:

```
Execution Brain ────────────────────────────────→ writes to execution-state, quality-state
                ←────── reads thinking-state ────┘ (context injected by Reasoning)
                ←────── reads plan-state ─────────┘

Reasoning Brain ────────────────────────────────→ writes to thinking-state, context-bridge
                ←────── reads all states (read-only)

System Brain   ────────────────────────────────→ writes to workflow-state, security-state
                ←────── reads all states (read-only)
```

All three brains run concurrently. They coordinate through shared state domains and priority messages, not through sequential handoffs. They synchronize only at workflow gates.

---

## Why This Pattern Exists

### The Sequential Dual-Brain Problem

Traditional dual-brain setups have a fundamental latency problem:

```
Sequential:
Plan Brain thinks (planning) → finishes → signals → Build Brain starts (execution)

Timeline:
[==== Plan Brain planning phase (slow, expensive) ====][== Build Brain execution ==]

Wasted: Build Brain sits idle during Plan Brain's entire planning phase.
```

A reasoning model doing strategic planning takes 30-60s per task. A fast execution model could have spent that time writing code. Sequential execution leaves the executor starving.

### The Parallel Peer Solution

```
Parallel Peer:
Execution Brain ───── runs continuously ────────────→ owns execution-state
Reasoning Brain ───── runs simultaneously ───────────→ owns thinking-state
System Brain   ─────── runs simultaneously ───────────→ owns workflow-state

Timeline:
[========== Execution Brain executing (parallel) ==================]
[== Reasoning (parallel) ==][== more reasoning ==]
[== System watching (parallel) ==][== more watching ==]

Both advance concurrently through their own domains.
Synchronize only at gates — never at arbitrary points.
```

The executor starts working immediately — it doesn't wait for the full plan. The reasoning brain monitors for gaps and injects context dynamically. The system brain watches all domains and enforces gates in real-time. No brain idles while another works.

---

## The Three Brains: Shark Macro

Based on `shark-context/REFERENCE/BRAIN_MODELS.md` and `shark-context/REFERENCE/ARCHITECTURE.md`:

### Execution Brain (Primary Agent)

```
ROLE: Primary autonomous execution, steamrolls the build
PRIORITY: 100 (highest)
CAN OVERRIDE: true

DOMAIN OWNERSHIP:
  - execution-state (writes)
  - quality-state (writes)

READS:
  - plan-state (from Planning or Reasoning)
  - thinking-state (from Reasoning Brain — injected context)

BEHAVIOR: Aggressive, fast, full autonomy within scope
TOOLS: All execution tools, file operations, terminal, build tools
```

### Reasoning Brain (Floating 2nd Brain / Context Bridge)

```
ROLE: On-demand intelligence, dynamic T1/T2 context management
PRIORITY: 90
CAN OVERRIDE: false

DOMAIN OWNERSHIP:
  - thinking-state (writes)
  - context-bridge (writes)

READS:
  - ALL domains (read-only observation)

BEHAVIOR: Analytical, on-demand (not continuous)
CONTEXT: T1 + T2 (full reference, manages its own synthesis)

FUNCTIONS:
  1. Context Gap Detection
     - Monitors Execution Brain T1
     - Notices when Execution needs context it doesn't have
     - Gets missing T2 from knowledge base
     - Synthesizes relevant patterns
     - Injects into thinking-state for Execution to read

  2. Auto-Debug (60% of errors fixed automatically)
     - Analyzes error patterns from execution-state
     - Matches against known error signatures
     - Applies automatic fixes
     - Reports back to Execution Brain

  3. T2 Synthesis
     - Takes raw T2 from knowledge base
     - Synthesizes into context-relevant pieces
     - Delivers exactly what Execution needs
```

### System Brain (Watchdog / Enforcer)

```
ROLE: Active derailment detection, real-time enforcement, gate evaluation
PRIORITY: 80 (lowest — enforces, doesn't drive)
CAN OVERRIDE: true (can block Execution if needed)

DOMAIN OWNERSHIP:
  - workflow-state (writes)
  - security-state (writes)

READS:
  - ALL domains (read-only observation)

BEHAVIOR: Defensive, maximum vigilance, active enforcement (not passive)

FUNCTIONS:
  1. Derailment Detection
     - Monitors all three brains for domain violations
     - Detects scope creep, guardian breaches
     - Catches premature "done" declarations
     - Identifies when brains drift from their roles

  2. Real-Time Fix Application
     - When derailment detected → applies fix immediately
     - Sends priority message to offending brain
     - Blocks until correction made
     - Reports to all brains

  3. Gate Enforcement
     - Evaluates gate criteria before phase transitions
     - Blocks transition until all criteria met
     - Collects evidence for evidence-type criteria
     - Can force auto-debug on failed gates

  4. Escalation Triggering
     - When auto-fix impossible → escalates to human
     - Formats escalation with full context
     - Provides recommended actions
     - Blocks further execution until resolved
```

---

## Domain Ownership (Authoritative from shark-context/ARCHITECTURE.md)

```typescript
const DOMAIN_OWNERSHIP = {
  'execution-state':  ['shark-execution', 'shark-system'],
  'thinking-state':    ['shark-reasoning', 'shark-system'],
  'context-bridge':    ['shark-reasoning'],
  'workflow-state':    ['shark-system', 'shark-reasoning'],
  'quality-state':     ['shark-execution', 'shark-system'],
  'security-state':    ['shark-system'],
  'plan-state':        ['shark-plan', 'shark-reasoning', 'shark-system'],
};
```

**Key invariant:** A brain can only write to domains it owns. All brains can read all domains (read-only observation).

---

## BrainMessenger for Priority Cross-Brain Signals

While the brains race through their domains in parallel, they occasionally need to send urgent signals. The BrainMessenger provides priority-based async messaging:

```typescript
const messenger = createBrainMessenger();

// System Brain → Execution Brain: urgent gate failure
messenger.send({
  from: 'shark-system',
  to: 'shark-execution',
  type: 'gate-failure',
  priority: 'critical',  // bypasses normal queue ordering
  payload: { gateId: 'test-gate', failure: 'Coverage below 80%' },
  requiresAck: true,
});

// Reasoning Brain → Execution Brain: context injection ready
messenger.send({
  from: 'shark-reasoning',
  to: 'shark-execution',
  type: 'context-inject',
  priority: 'high',
  payload: { thinking-state: { docker-patterns: [...] } },
  requiresAck: false,
});

// Execution Brain → System Brain: checkpoint
messenger.send({
  from: 'shark-execution',
  to: 'shark-system',
  type: 'checkpoint',
  priority: 'normal',
  payload: { phase: 'CODING', completedFiles: 12 },
  requiresAck: false,
});
```

Priority ordering: `critical > high > normal > low`

- **Critical:** Gate failures, security blocks, guardian breaches — delivered immediately
- **High:** Context injections, significant state changes
- **Normal:** Checkpoints, routine updates
- **Low:** Logging, monitoring pings

---

## Workflow Gates as Synchronization Points

The parallel brains don't completely ignore each other — they synchronize at workflow gates. Gates are the **only** blocking points:

```json
{
  "gates": [
    {
      "id": "coding-gate",
      "afterPhase": "architect-phase",
      "beforePhase": "test-phase",
      "criteria": [
        {
          "type": "evidence",
          "description": "Implementation complete and matches spec",
          "required": ["files-created", "no-guardian-violations", "lint-clean"]
        }
      ],
      "evaluatedBy": "shark-system"
    },
    {
      "id": "test-gate",
      "afterPhase": "coding-phase",
      "beforePhase": "build-phase",
      "criteria": [
        {
          "type": "evidence",
          "description": "Tests pass with adequate coverage",
          "required": ["tests-pass", "coverage-80+", "no-weak-assertions"]
        }
      ],
      "evaluatedBy": "shark-system"
    }
  ]
}
```

The gate **blocks phase transition** until all required evidence exists in shared state. But the brains themselves don't block — they keep working on whatever is in their own domain until the gate criteria are met.

---

## The Six Gates (from shark-context)

| Gate | Enforces | Blocked By |
|------|----------|------------|
| Architect | Valid spec | Unclear requirements |
| Coding | Correct impl | Scope violations |
| Test | Tests pass | No tests, coverage < 80% |
| Build | Compiles | Lint errors, type errors |
| Review | Security clean | Secrets, SAST findings |
| Delivery | Evidence archived | Incomplete evidence |

---

## Mental Model: The Race Track

Think of it like this:

```
Execution Domain (owned by Execution Brain)
  ← Execution reads plan-state to see what to build
  ← Execution writes execution-state + quality-state as work completes

Thinking Domain (owned by Reasoning Brain)
  ← Reasoning reads execution-state to detect context gaps
  ← Reasoning writes thinking-state + context-bridge when injecting

Workflow Domain (owned by System Brain)
  ← System reads all states to watch for derailments
  ← System writes workflow-state + security-state for gate results

ALL THREE BRAINS ARE ON THE TRACK AT THE SAME TIME.
They pass each other constantly.
They only stop at gates (barriers).
They never wait for each other's permission to enter their own domain.
```

---

## Shark Macro vs Shark Micro

| Aspect | Shark Micro (Dual-Brain) | Shark Macro (Triple-Brain) |
|--------|--------------------------|---------------------------|
| **Brains** | 2 (Plan + Build) | 3 (Execution + Reasoning + System) |
| **Execution** | Sequential handoff | Parallel peer race |
| **Context** | Firewalled T1/T2 | Dynamic T1/T2 bridge |
| **Enforcement** | Coordinator + Guardian | System Brain active watchdog |
| **Idle time** | Build Brain idle during planning | Zero idle time |
| **Complexity** | Simple, proven | Advanced, maximum parallelism |
| **Best for** | Standard builds | Complex/long builds |

---

## OpenCode Plugin Agent Integration

When this architecture is implemented as an OpenCode plugin agent (tab toggle), the mapping is:

```
V4 Concept                    → OpenCode Plugin Implementation
───────────────────────────────────────────────────────────────────
Execution Brain               → OpenCode agent in "execution" mode
Reasoning Brain               → Background context monitor (injected)
System Brain                  → Hook-based enforcement (tool.execute.before/after)
StateStore                    → .shark/ directory + shared JSON state files
BrainMessenger                → OpenCode hooks for priority signals
Workflow Gates                → Guardian block points + hook rejections
Domain Ownership              → read_file + write_file with .shark/ path enforcement
```

The key to making this work in OpenCode:

1. **Both brain modes' tools are available simultaneously** — the OpenCode `tool.execute.before` hook acts as the enforcement layer, checking the current workflow phase and domain before allowing any tool call to proceed

2. **Reasoning Brain runs as a background context synthesizer** — it watches Execution Brain's tool calls and file operations, detects gaps, and writes synthesized context to `.shark/state/thinking-state.json`

3. **System Brain runs as hook-based enforcement** — `tool.execute.before` checks for Guardian violations, scope creep, and gate criteria before allowing operations

4. **Evidence stored in `.shark/evidence/{gate}/{timestamp}/`** — immutable proof of gate passage that all three brains can read

---

## Key Design Decisions

### Why Peer-Siblings, Not Parent-Child?

1. **No idle time:** If the executor waits for the planner, you lose parallel speedup
2. **No confirmation bias:** The reviewer is not the author — different brains own different domains
3. **Domain isolation:** A bug in reasoning can't corrupt execution state and vice versa
4. **Independent failure:** If reasoning crashes, execution keeps running

### Why Gates Instead of Message Passing?

Because message passing between brains creates sequential coupling. If Brain A must wait for Brain B's acknowledgment before proceeding, you lose parallelism. Gates are **degenerate** — all brains are already racing, the gate just says "don't proceed to the next phase until evidence exists." The evidence can be produced by any brain in any order.

### Why Domain Ownership?

Prevents chaos. Without domain ownership, two brains could write to the same state simultaneously, creating torn reads and lost updates. Domain ownership is a **capability** — a brain can only modify state in domains it owns, but can observe all domains.

---

## Evidence System (from shark-context/VERIFICATION.md)

Evidence is mandatory for all gate passages. Structure:

```
.shark/evidence/{gate-id}/{timestamp}/
├── gate-evidence.json     # Gate criteria + pass/fail
├── command-output.log     # Raw command output
├── reports/               # Additional reports
│   ├── coverage.json
│   ├── lint-report.json
│   ├── sast-report.json
│   └── audit-report.json
└── checksum.sha256       # Immutable proof
```

Evidence JSON schema:
```json
{
  "gate": "test-gate",
  "timestamp": "2026-04-05T10:24:00Z",
  "status": "PASSED",
  "criteria": {
    "testsExist": true,
    "testsPass": true,
    "coverageFloor": 80,
    "actualCoverage": 87.3
  },
  "evidence": [
    { "type": "test-output", "path": "test-output.json", "checksum": "sha256:abc123..." },
    { "type": "coverage-report", "path": "coverage/coverage.json", "checksum": "sha256:def456..." }
  ],
  "verified_by": "shark-system",
  "verified_at": "2026-04-05T10:24:05Z"
}
```

---

## Escalation Protocol (from shark-context/ESCALATION.md)

When System Brain detects an issue it cannot auto-fix:

```
═══════════════════════════════════════════════════════════════════════════
⚠ SHARK ESCALATION — [macro/system-brain]

ISSUE: {one-line summary}
SEVERITY: Critical | High | Medium

FOUND:
  Location: {file path, line number, or workflow phase}
  When: {gate/phase where detected}
  Evidence: {specific output, error message, or finding}

IMPACT:
  What happens if this ships: {consequence}
  What happens if not fixed: {risk}

AUTO-DEBUG ATTEMPTS: {number}
AUTO-FIX RESULT: {what happened}

RECOMMENDED ACTION:
  1. {specific step}
  2. {specific step}

STOP SHIP UNTIL RESOLVED.
═══════════════════════════════════════════════════════════════════════════
```

**Critical escalations (stop everything immediately):**
- Secret/API key detected in code
- SAST critical/high vulnerability
- Guardian zone breach
- Data exfiltration attempt

---

*Part of the V4 Context Library — for use with the Agent-Factory-Edition boilerplate*
*Ground truth: `/home/leviathan/OPENCODE_WORKSPACE/shark-agent-rebirth/shark-context/`*
