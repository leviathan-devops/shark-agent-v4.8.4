# OpenCode Plugin Hook Architecture Map

**Date:** 2026-04-02
**Purpose:** Debug and understand plugin/agent architecture for spider-agent and similar plugins

---

## Overview

OpenCode plugins register lifecycle hooks that fire at specific points during agent execution. Hooks are registered via `hooks` object returned by `createHooks()`.

### Hook Execution Order

```
1. command.execute.before
2. tool.execute.before
3. [TOOL EXECUTION]
4. tool.execute.after
5. chat.message
6. experimental.chat.messages.transform
7. experimental.chat.system.transform
```

---

## Hook Registry

### 1. command.execute.before

**File:** `dist/index.js` ~68801
**Function:** `safeHook(commandHandler)`

**Purpose:** Agent command dispatcher - identifies which agent mode is active

**Key Behavior:**
- Receives `input.agent` to determine current agent mode
- Sets `spiderState.activeAgent` for session
- Handles agent switching (spider, build, plan, etc.)
- **Critical for agent isolation** - determines if spider or vanilla mode

**Code Location:** Line 54456 (commandHandler function)

**Session Effects:**
- `spiderState.activeAgent.set(sessionID, agentName)`
- `session.delegationActive = !isArchitect`
- `recordPhaseAgentDispatch()`

---

### 2. tool.execute.before

**File:** `dist/index.js` ~68802
**Function:** Async hook function

**Purpose:** Pre-tool execution guardrails and state management

**Key Behavior:**
- Auto-registers session if not in `activeAgent` (COMMENTED OUT - was causing build agent blocking)
- Checks for stale delegations
- Runs guardrails hooks
- **NEW: Model response timeout check** - detects if model silent > 3 minutes

**Code Location:** Lines 68802-68855

**Sub-Hooks Called:**
```javascript
await safeHook(guardrailsHooks.toolBefore)(input, output);
await safeHook(scopeGuardHook.toolBefore)(input, output);
await safeHook(delegationGateHooks.toolBefore)(input, output);
await safeHook(activityHooks.toolBefore)(input, output);
```

**Model Timeout Logic (NEW):**
```javascript
if (session_check && checkModelResponseTimeout(session_check)) {
  // Trigger model fallback if silent > 3 minutes
  spiderAgents[baseAgentName].model = fallbackModel;
}
```

---

### 3. tool.execute.after

**File:** `dist/index.js` ~68850
**Function:** Async hook function

**Purpose:** Post-tool execution processing, delegation tracking, scope validation

**Code Location:** Lines 68850-68953

**Sub-Hooks Called:**
```javascript
await safeHook(delegationLedgerHook.toolAfter)(input, output);
await safeHook(selfReviewHook.toolAfter)(input, output);
await safeHook(delegationGateHooks.toolAfter)(input, output);
await safeHook(knowledgeCuratorHook)(input, output);
await safeHook(hivePromoterHook)(input, output);
await safeHook(steeringConsumedHook)(input, output);
await safeHook(coChangeSuggesterHook)(input, output);
await safeHook(darkMatterDetectorHook)(input, output);
```

**Key Behaviors:**
- Tracks modified files via `handleDelegatedWriteTracking()`
- Scope violation detection (`scopeGuardHook`)
- Delegation chain management
- Session state cleanup

---

### 4. chat.message

**File:** `dist/index.js` ~68980
**Function:** `safeHook(async (input, output) => {...})`

**Purpose:** Agent chat message handler - main agent loop driver

**Key Behavior:**
- Invoked when user sends a chat message
- Manages agent session lifecycle
- Handles delegation handoffs between agents

**Session Tracking:**
- `spiderState.activeAgent`
- `spiderState.agentSessions`
- `spiderState.delegationChains`

---

### 5. experimental.chat.messages.transform

**File:** `dist/index.js` ~54704 (messagesTransform)
**Function:** `safeHook(async (_input, output) => {...})`

**Purpose:** Transform chat messages before sending to model

**Key Behavior:**
- **Track model response time** (NEW) - updates `session.lastModelResponseTime` on assistant messages
- System message injection (SPIDER CONFIG hints)
- Behavioral guidance replacement for low-capability models
- Agent awareness context injection
- Adversarial detection pair monitoring
- Phase preflight check injection
- Retrospective injection

**Code Location:** Lines 54704-57589

**Key Transformations:**
```javascript
// Model response tracking (NEW)
if (session && messages.some(m => m.info?.role === 'assistant')) {
  session.lastModelResponseTime = Date.now();
}

// SPIDER CONFIG injection for coder/test_engineer
if (baseRole === "coder" || baseRole === "test_engineer") {
  tryInject(`[SPIDER CONFIG] You must NOT run build, test, lint...`);
}

// Budget warning injection for architect
if (isArchitect_cb) {
  output.system.push(`[FOR: architect] ${budgetWarning}`);
}
```

---

### 6. experimental.chat.system.transform

**File:** `dist/index.js` ~55624
**Function:** `safeHook(async (_input, output) => {...})`

**Purpose:** Transform system messages (similar to messagesTransform but for system)

**Key Behavior:**
- Agent awareness context extraction
- SPIDER CONFIG hints injection
- Phase preflight check injection
- Retrospective injection
- Budget warning injection

---

## Session State Structure

```javascript
{
  agentName: string,           // e.g., "spider_coder", "build"
  sessionId: string,
  delegationActive: boolean,   // true when sub-agent is working
  declaredCoderScope: string[], // files coder is allowed to modify
  modifiedFilesThisCoderTask: string[],
  lastAgentEventTime: number,
  model_fallback_index: number, // fallback retry count
  modelFallbackExhausted: boolean,
  lastModelResponseTime: number, // NEW: timestamp of last model response
  turboMode: boolean,
  phaseAgentsDispatched: Set,
  taskWorkflowStates: Map,
  pendingAdvisoryMessages: string[],
  ...
}
```

---

## Agent Isolation Architecture

### The Problem
Spider-agent was blocking vanilla `build`/`plan` agents because:
1. `tool.execute.before` auto-registered ALL sessions as "spider"
2. File authority rules were applied universally
3. `build`/`plan` agents had no entries in `AGENT_AUTHORITY_RULES`

### The Solution

**1. isSpiderSubAgent() function:**
```javascript
function isSpiderSubAgent(agentName) {
  const stripped = stripKnownSpiderPrefix(agentName);
  const spiderAgents = ["spider", "coder", "reviewer", ...];
  return spiderAgents.includes(stripped);
}
```

**2. checkFileAuthority bypass for vanilla agents:**
```javascript
function checkFileAuthority(agentName, filePath, cwd) {
  if (!isSpiderSubAgent(agentName)) {
    return { allowed: true }; // Vanilla agents have full access
  }
  // ... spider sub-agent authority rules
}
```

**3. AGENT_AUTHORITY_RULES entries for vanilla agents:**
```javascript
build: { /* full access */ },
plan: { /* full access */ }
```

---

## Model Fallback Architecture

### Original Problem
Fallback only triggered on error message pattern match:
```javascript
if (TRANSIENT_MODEL_ERROR_PATTERN.test(errorContent) && ...) {
  // fallback
}
```
Silent hang (rate limit with no error) = no fallback

### NEW Solution: Model Response Timeout

**1. Track model responses:**
```javascript
// In messagesTransform
if (session && messages.some(m => m.info?.role === 'assistant')) {
  session.lastModelResponseTime = Date.now();
}
```

**2. Detect silent model:**
```javascript
function checkModelResponseTimeout(session) {
  if (session.lastModelResponseTime > 0 && 
      (Date.now() - session.lastModelResponseTime) > 180000) {
    return true; // Silent > 3 minutes
  }
  return false;
}
```

**3. Trigger fallback in toolBefore:**
```javascript
if (checkModelResponseTimeout(session_check)) {
  spiderAgents[baseAgentName].model = fallbackModels[0];
  console.warn(`[Spider] MODEL FALLBACK: Model silent >3min...`);
}
```

---

## Key Functions

| Function | Purpose | Location |
|----------|---------|----------|
| `stripKnownSpiderPrefix()` | Remove spider prefix (e.g., "spider_coder" → "coder") | Line 14469 |
| `isSpiderSubAgent()` | Check if agent is spider sub-agent | Line 53751 |
| `checkFileAuthority()` | Validate file write permissions | Line 53758 |
| `checkModelResponseTimeout()` | Detect model silence timeout | Line 53827 |
| `getModelForAgent()` | Get model from config or default | Line 44437 |
| `resolveFallbackModel()` | Get fallback model by index | Line 44449 |
| `ensureAgentSession()` | Create/get session state | Line 41478 |

---

## Debugging Tips

### 1. Check which agent is active:
```javascript
spiderState.activeAgent.get(sessionId)  // Returns agent name or undefined
```

### 2. Check session state:
```javascript
spiderState.agentSessions.get(sessionId)  // Returns session object
```

### 3. Check model config:
```javascript
getSpiderAgents()[agentName]  // Returns { model, fallback_models, ... }
```

### 4. Enable debug output:
```bash
DEBUG_SPIDER=1 opencode --agent spider --prompt "test"
```

### 5. Common Issues

| Symptom | Likely Cause | Debug Location |
|---------|--------------|----------------|
| "WRITE BLOCKED" on build agent | Auto-registration not commented | Line 68787 |
| Fallback not triggering | Error doesn't match TRANSIENT_PATTERN | Line 52718 |
| Agent appears dead | Model rate limited, no response | Line 53827 (timeout check) |
| Config not loading | Wrong path in opencode.json | Line 426 |
| Tab toggle not working | Plugin not loaded / wrong location | opencode.json plugin array |

---

## File Authority Rules (AGENT_AUTHORITY_RULES)

```javascript
architect: {
  blockedExact: [".Spider/plan.md", ".Spider/plan.json"],
  blockedZones: ["generated"]
},
coder: {
  blockedPrefix: [".Spider/"],
  allowedPrefix: ["src/", "tests/", "docs/", "scripts/"],
  blockedZones: ["generated", "config"]
},
reviewer: {
  blockedExact: [".Spider/plan.md", ".Spider/plan.json"],
  blockedPrefix: ["src/"],
  allowedPrefix: [".Spider/evidence/", ".Spider/outputs/"],
  blockedZones: ["generated"]
},
explorer: { readOnly: true },
sme: { readOnly: true },
test_engineer: {
  blockedExact: [".Spider/plan.md", ".Spider/plan.json"],
  blockedPrefix: ["src/"],
  allowedPrefix: ["tests/", ".Spider/evidence/"],
  blockedZones: ["generated"]
},
docs: { allowedPrefix: ["docs/", ".Spider/outputs/"], blockedZones: ["generated"] },
designer: { allowedPrefix: ["docs/", ".Spider/outputs/"], blockedZones: ["generated"] },
critic: { allowedPrefix: [".Spider/evidence/"], blockedZones: ["generated"] },
build: { /* full access */ },  // NEW - vanilla agents
plan: { /* full access */ },    // NEW - vanilla agents
```

---

## Default Models (DEFAULT_MODELS)

Used when agent not found in spider-agent.json:

```javascript
DEFAULT_MODELS = {
  explorer: "opencode/trinity-large-preview-free",
  coder: "opencode/minimax-m2.5-free",
  reviewer: "opencode/big-pickle",
  test_engineer: "opencode/gpt-5-nano",
  sme: "opencode/trinity-large-preview-free",
  critic: "opencode/trinity-large-preview-free",
  critic_sounding_board: "opencode/trinity-large-preview-free",
  critic_drift_verifier: "opencode/trinity-large-preview-free",
  docs: "opencode/trinity-large-preview-free",
  designer: "opencode/trinity-large-preview-free",
  curator_init: "opencode/trinity-large-preview-free",
  curator_phase: "opencode/trinity-large-preview-free",
  default: "opencode/trinity-large-preview-free"
}
```

---

## Plugin Loading

### Config Location
`~/.config/opencode/opencode.json`

### Plugin Entry Format
```json
"plugin": [
  "file:///path/to/spider-agent",
  "hive-mind-plugin"
]
```

### spider-agent Config Location
- User: `~/.config/opencode/spider-agent.json`
- Project: `<directory>/.opencode/spider-agent.json`

---

## Change Log

| Date | Change | Description |
|------|--------|-------------|
| 2026-04-02 | Document created | Initial hook architecture map |
| 2026-04-02 | Added model timeout section | Documented silent hang detection |
| 2026-04-02 | Added agent isolation section | Documented build/plan fix |
