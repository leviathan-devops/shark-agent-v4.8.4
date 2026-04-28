# CROSS-PLUGIN ARCHITECTURE AUDIT
## Comprehensive Analysis of Plugin Conflicts, Isolation, and Synchronization

**Date:** 2026-04-05
**Version:** 1.0
**Status:** CRITICAL - Requires v4 Boilerplate Fix

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [OpenCode Plugin System Architecture](#2-opencode-plugin-system-architecture)
3. [Hook System Deep Dive](#3-hook-system-deep-dive)
4. [Agent System Architecture](#4-agent-system-architecture)
5. [Hermes Agent Plugin Analysis](#5-hermes-agent-plugin-analysis)
6. [Spider Agent Plugin Analysis](#6-spider-agent-plugin-analysis)
7. [Cross-Plugin Conflict Mechanisms](#7-cross-plugin-conflict-mechanisms)
8. [Root Cause Analysis](#8-root-cause-analysis)
9. [Plugin Isolation Patterns](#9-plugin-isolation-patterns)
10. [Debugging Guide](#10-debugging-guide)
11. [v4 Boilerplate Architecture](#11-v4-boilerplate-architecture)
12. [Migration Guide](#12-migration-guide)

---

## 1. EXECUTIVE SUMMARY

### The Problem

When multiple custom agent plugins are loaded in OpenCode, they interfere with each other and with vanilla OpenCode because:

1. **No Hook Isolation** - All plugins' hooks fire on the same events regardless of which agent is active
2. **No Phase Synchronization** - Each plugin tracks its own phase state independently
3. **No Agent Awareness** - Hooks don't know which agent is currently active
4. **Silent Failures** - Broken plugins fail without notification
5. **State Leakage** - Module-level globals leak state between sessions

### Real-World Impact

| Incident | Cause | Effect |
|----------|-------|--------|
| Spider Agent blocked by Hermes | Hermes `_currentPhase` stays "idle" while Spider runs | `[HARD-GATE BLOCKED]` injected into every response |
| Vanilla agents broken | Agents disabled for Spider Agent | No fallback when Spider is off |
| Agent Swarm context pollution | 20+ tools loaded for unused system | Debugging sessions flooded with irrelevant context |
| Write blocking | Plugin auto-registers vanilla agents | Build agent can't write files |

---

## 2. OPENCODE PLUGIN SYSTEM ARCHITECTURE

### 2.1 Plugin Type Definition

**Source:** `packages/plugin/src/index.ts`

```typescript
export type Plugin = (
  input: PluginInput,
  options?: PluginOptions
) => Promise<Hooks>

export type PluginInput = {
  client: ReturnType<typeof createOpencodeClient>
  project: Project
  directory: string
  worktree: string
  serverUrl: URL
  $: BunShell
}
```

### 2.2 Plugin Loading Order

1. Global config: `~/.config/opencode/`
2. Project config: `.opencode/plugins/`
3. NPM packages (via `plugin:` specifier)
4. Config array in `opencode.json`

**Critical:** Plugins load in order specified in `opencode.json` array. No priority system exists.

### 2.3 Plugin Output (Hooks)

```typescript
export type Hooks = {
  // Lifecycle
  event?: (input: { event: Event }) => Promise<void>
  config?: (input: Config) => Promise<void>
  
  // Tool registration
  tool?: { [key: string]: ToolDefinition }
  
  // Agent registration
  agent?: Agent[]
  
  // Auth
  auth?: AuthHook
  
  // Provider
  provider?: ProviderHook
  
  // Chat hooks
  "chat.message"?: ChatHook
  "chat.params"?: ChatParamsHook
  "chat.headers"?: ChatHeadersHook
  
  // Permission
  "permission.ask"?: PermissionHook
  
  // Command
  "command.execute.before"?: CommandHook
  
  // Tool execution
  "tool.execute.before"?: ToolBeforeHook
  "tool.execute.after"?: ToolAfterHook
  "tool.definition"?: ToolDefHook
  
  // Shell
  "shell.env"?: ShellEnvHook
  
  // Experimental
  "experimental.chat.messages.transform"?: MessagesTransformHook
  "experimental.chat.system.transform"?: SystemTransformHook
  "experimental.session.compacting"?: CompactingHook
  "experimental.text.complete"?: TextCompleteHook
}
```

---

## 3. HOOK SYSTEM DEEP DIVE

### 3.1 Hook Execution Order

| Order | Hook | When |
|-------|------|-------|
| 1 | `config` | On config load |
| 2 | `event` | Any system event |
| 3 | `provider` | Provider resolution |
| 4 | `auth` | Auth setup |
| 5 | `chat.message` | New message received |
| 6 | `chat.params` | Before LLM call |
| 7 | `chat.headers` | Before LLM call |
| 8 | `tool.definition` | Before tool list sent to LLM |
| 9 | `tool.execute.before` | Before each tool call |
| 10 | Tool execution | The tool itself |
| 11 | `tool.execute.after` | After each tool call |
| 12 | `command.execute.before` | Before command execution |
| 13 | `shell.env` | Shell environment injection |
| 14 | `permission.ask` | Permission prompts |
| 15 | `experimental.chat.messages.transform` | Message transformation |
| 16 | `experimental.chat.system.transform` | System prompt modification |
| 17 | `experimental.session.compacting` | Session compaction |
| 18 | `experimental.text.complete` | Text completion post-processing |

### 3.2 Critical Hooks for Agent Plugins

#### `tool.execute.before`

```typescript
"tool.execute.before"?: (
  input: {
    tool: string        // e.g., "read", "write", "bash"
    sessionID: string
    callID: string
  },
  output: {
    args: any           // Modify tool arguments here
  }
) => Promise<void>
```

**Use Cases:**
- Validate tool arguments
- Block tool execution (throw error)
- Inject additional context
- Auto-register agents

#### `experimental.chat.messages.transform`

```typescript
"experimental.chat.messages.transform"?: (
  input: {},
  output: {
    messages: {
      info: Message
      parts: Part[]
    }[]
  }
) => Promise<void>
```

**Use Cases:**
- Inject reminders into user messages
- Modify conversation history
- Block content (Hermes brainstorm gate)
- Add phase indicators

#### `experimental.chat.system.transform`

```typescript
"experimental.chat.system.transform"?: (
  input: {
    sessionID?: string
    model: Model
  },
  output: {
    system: string[]     // Array of system prompt strings
  }
) => Promise<void>
```

**Use Cases:**
- Inject agent-specific system prompts
- Add context reminders
- Modify model behavior

### 3.3 The Hook Composition Problem

When multiple plugins register the same hook:

```typescript
// Plugin A
"experimental.chat.messages.transform": handlerA

// Plugin B  
"experimental.chat.messages.transform": handlerB

// OpenCode executes BOTH in load order
// No isolation, no priority, no agent awareness
```

**Result:** Handler from Plugin A affects output from Plugin B's agents.

---

## 4. AGENT SYSTEM ARCHITECTURE

### 4.1 Agent Modes

| Mode | UI Visible | Purpose |
|------|-----------|---------|
| `"primary"` | Yes — dropdown | Main agents user can select |
| `"subagent"` | No — hidden | Delegated agents, internal only |
| `"all"` | Yes — everywhere | Universal agents (default for custom) |

### 4.2 Built-in Agents

| Agent | Mode | Hidden | Purpose |
|-------|------|--------|---------|
| `build` | `primary` | No | Default agent. Full tool access. |
| `plan` | `primary` | No | Read-only planning mode. |
| `general` | `subagent` | No | General-purpose research agent. |
| `explore` | `subagent` | No | Fast codebase exploration. |
| `compaction` | `primary` | Yes | Internal: session compaction. |
| `title` | `primary` | Yes | Internal: generate session titles. |
| `summary` | `primary` | Yes | Internal: generate session summaries. |

### 4.3 Agent Registration Flow

```typescript
// 1. Built-in agents defined in Agent.layer
// 2. Config `agent` field merged on top
// 3. Custom agents from config added
// 4. Agents with `disable: true` removed

for (const [key, value] of Object.entries(cfg.agent ?? {})) {
  if (value.disable) { delete agents[key]; continue }
  // Override: model, variant, prompt, description, temperature, topP, mode, color, hidden, name, steps, options, permission
}
```

### 4.4 Session and Agent Tracking

OpenCode tracks:
- `session.agentName` - The active agent for the session
- `session.agentMode` - primary/subagent/all

**Critical:** OpenCode does NOT expose which plugin owns the active agent.

---

## 5. HERMES AGENT PLUGIN ANALYSIS

### 5.1 Plugin Structure

**Source:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/`

```
Hermes Agent Plugin/
├── src/
│   ├── index.ts              # Main plugin entry
│   ├── agents/               # 15+ agent prompts
│   ├── hooks/                # 25+ hook implementations
│   ├── tools/                # Quality, security, analysis tools
│   └── config/              # Configuration loader
├── dist/
│   └── index.js             # Bundled output
└── package.json
```

### 5.2 Hermes Hooks

**File:** `src/index.ts`

```typescript
const messageTransform = composeHandlers([
  createBrainstormGateHook(),        // BLOCKS CODE IN BRAINSTORM
  createPlanValidatorHook(),         // VALIDATES PLAN PATTERNS
  createStrictWriteDisciplineHook(), // ENFORCES WRITE DISCIPLINE
  createAdversarialCheckHook(),      // DETECTS PROMPT INJECTION
  createAdversarialDetectorHook(),   // DETECTS ADVERSARIAL INPUT
  createAntiRationalizationHook(),   // BLOCKS RATIONALIZATION
  createIntentMarkerHook(),          // MARKS USER INTENT
]);

const toolBefore = composeHandlers([
  createTddEnforcerHook(),           // ENFORCES TDD
  createDelegationGateHook(),        // VALIDATES DELEGATION
  createGuardrailsHook(),            // APPLIES GUARDRAILS
  createScopeGuardHook(),            // ENFORCES SCOPE
]);

const toolAfter = composeHandlers([
  createPhaseMonitorHook(),          // MONITORS PHASE CHANGES
  createActivityHook(),             // TRACKS ACTIVITY
  createDelegationLedgerHook(),     // RECORDS DELEGATIONS
  createKnowledgeCuratorHook(),       // CURATES KNOWLEDGE
  createSnapshotWriterHook(),        // WRITES SNAPSHOTS
  createDebuggingSpiralHook(),      // DETECTS DEBUG LOOPS
  createRippleCheckHook(),           // CHECKS RIPPLE EFFECTS
  createSupervisorIngestHook(),      // INGESTS TO SUPERVISOR
  createDriftVerifierHook(),         // VERIFIES DRIFT
]);
```

### 5.3 The Brainstorm Gate (CONFLICT SOURCE)

**File:** `src/hooks/brainstorm-gate.ts`

```typescript
let _currentPhase: string = PHASES.IDLE;  // MODULE-LEVEL GLOBAL!

export function getCurrentPhase(): string {
  return _currentPhase;
}

export function setCurrentPhase(phase: string): void {
  _currentPhase = phase;
}

export function createBrainstormGateHook() {
  return async (input, output) => {
    const phase = getCurrentPhase();
    
    // PROBLEM: phase is ALWAYS "idle" when Spider Agent is running
    // because Spider Agent doesn't call setCurrentPhase()
    if (phase !== PHASES.IDLE && phase !== PHASES.ANALYZE) {
      return;  // Never returns because phase is always "idle"
    }
    
    // This ALWAYS fires when Spider Agent is active
    const hasCodeBlocks = /```[\s\S]*?```/.test(content);
    if (hasCodeBlocks) {
      // INJECTS BLOCK MESSAGE INTO SPIDER AGENT OUTPUT
      parts[textPartIndex].text = `${originalText}
      
[HARD-GATE BLOCKED] You are in the BRAINSTORM phase...`;
    }
  };
}
```

### 5.4 Why the Brainstorm Gate Breaks Spider Agent

1. **Hermes `_currentPhase` initialized to `"idle"` on plugin load**
2. **Spider Agent has its own phase system** (SPECIFY/PLAN/EXECUTE)
3. **Spider Agent never calls `setCurrentPhase()`** - it doesn't know about Hermes
4. **Hermes phase stays `"idle"` forever** while Spider Agent runs
5. **Brainstorm gate fires on EVERY Spider Agent response**
6. **Block message injected into every response containing code**

### 5.5 Phase Monitor Hook

```typescript
// Only Hermes agents trigger phase transitions
// Spider Agent's phases are invisible to Hermes
createPhaseMonitorHook() {
  return async (input, output) => {
    // Monitors Hermes agent phase transitions
    // Does NOT monitor Spider Agent phases
  };
}
```

---

## 6. SPIDER AGENT PLUGIN ANALYSIS

### 6.1 Plugin Structure

**Source:** `/home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent/`

```
spider-agent/
├── dist/
│   └── index.js             # Bundled output (69K lines)
├── src/
│   ├── hooks/               # Hook implementations
│   ├── agents/              # Agent prompts
│   ├── tools/               # Spider-specific tools
│   └── index.ts             # Main plugin
└── package.json
```

### 6.2 Spider Agent Hooks

**File:** `dist/index.js` (lines 68700-68800)

```typescript
const messageTransform = composeHandlers([
  // Only fires when architect is active (GOOD!)
  pipelineHook["experimental.chat.messages.transform"],
  contextBudgetHandler,
  guardrailsHooks.messagesTransform,
  delegationGateHooks.messagesTransform,
  delegationSanitizerHook,
  knowledgeInjectorHook,
]);

const toolBefore = composeHandlers([
  // Checks activeAgent before applying (GOOD!)
  async (input, output) => {
    const activeAgent = spiderState.activeAgent.get(input.sessionID);
    // Only applies to Spider sub-agents
    if (activeAgent && isSpiderSubAgent(activeAgent)) {
      // Apply Spider-specific logic
    }
  },
]);
```

### 6.3 Spider Agent's Vanilla Agent Bypass (GOOD!)

**File:** `dist/index.js` (line 54527)

```typescript
// In delegation tracker hook
if (agentName && !isSpiderSubAgent(agentName)) {
  return;  // Bypasses for vanilla agents
}
```

**This is the CORRECT pattern** - Spider Agent checks if the agent is a Spider sub-agent before applying its logic.

### 6.4 Spider Agent Phase System

Spider Agent uses its own phase system completely separate from Hermes:

```typescript
// MODE: SPECIFY - Requirements gathering
// MODE: PLAN - Planning
// MODE: EXECUTE - Implementation
// MODE: CLARIFY - Clarification
// MODE: RESUME - Continue existing work
```

**Stored in:**
- `.Spider/plan.md` - Current plan with tasks
- `.Spider/spec.md` - Current specification
- `spiderState.activeAgent` - Map of session → active agent
- `spiderState.agentSessions` - Map of session → session state

### 6.5 Spider Agent's Agent Awareness

**File:** `dist/index.js` (lines 68838-68848)

```typescript
// tool.execute.before hook
const activeAgent = spiderState.activeAgent.get(input.sessionID);
if (session && activeAgent && activeAgent !== ORCHESTRATOR_NAME) {
  // Only applies to Spider sub-agents
  const stripActive = stripKnownSpiderPrefix(activeAgent);
  if (stripActive !== ORCHESTRATOR_NAME) {
    // Apply Spider-specific logic
  }
}
```

**This is the CORRECT pattern** - Spider Agent checks `activeAgent` before applying its logic.

---

## 7. CROSS-PLUGIN CONFLICT MECHANISMS

### 7.1 Hook Conflict Matrix

| Hook | Spider Agent | Hermes Agent | Conflict? |
|------|-------------|--------------|-----------|
| `tool.execute.before` | ✅ Has agent check | ❌ No agent check | YES |
| `tool.execute.after` | ✅ Has agent check | ❌ No agent check | YES |
| `experimental.chat.messages.transform` | ✅ Has agent check | ❌ No agent check | YES |
| `experimental.chat.system.transform` | ✅ Has plugin check | ❌ No check | YES |
| `permission.ask` | ❌ Not used | ❌ Not used | NO |

### 7.2 State Conflict Points

| State | Spider Agent | Hermes Agent | Problem |
|-------|------------|--------------|---------|
| Phase | Own system (SPECIFY/PLAN/EXECUTE) | `_currentPhase` global | No sync |
| Active Agent | `spiderState.activeAgent` Map | Not tracked | No visibility |
| Session State | `spiderState.agentSessions` Map | Not tracked | No visibility |

### 7.3 The Phase Synchronization Problem

```
HERMES STATE:
  _currentPhase = "idle" (never changes when Spider runs)

SPIDER STATE:
  .Spider/plan.md exists
  Mode = "EXECUTE"
  
RESULT:
  Hermes thinks we're in "idle" phase
  Hermes brainstorms gate fires
  Spider gets blocked
```

### 7.4 Module-Level State Leakage

```typescript
// Hermes - module-level global
let _currentPhase: string = PHASES.IDLE;

// Spider - module-level global
const spiderState = {
  activeAgent: new Map(),
  agentSessions: new Map(),
  delegationChains: new Map(),
  // ...
};
```

**Problem:** These globals persist across sessions and plugins. If two plugins use the same global name, they conflict.

---

## 8. ROOT CAUSE ANALYSIS

### 8.1 Why Hermes Breaks Spider Agent

| Cause | Description | Fix Required |
|-------|-------------|--------------|
| No agent awareness | `createBrainstormGateHook()` doesn't check which agent is active | Add agent check |
| Phase never changes | `_currentPhase` stays "idle" because Spider doesn't call `setCurrentPhase()` | Implement cross-plugin phase sync or disable gate |
| Gate fires on all agents | The hook has no filtering logic | Add `if (isSpiderAgent()) return;` |

### 8.2 Why Vanilla OpenCode Breaks

| Cause | Description | Fix Required |
|-------|-------------|--------------|
| Agents disabled | `architect`, `explore`, `general` all set to `disable: true` | Re-enable in config |
| Permission too open | `"*": { "*": "allow" }` removes safety guards | Use default ruleset |
| No fallback | When Spider is off, no agents are available | Keep vanilla agents enabled |

### 8.3 Why Agent Swarm Pollutes Context

| Cause | Description | Fix Required |
|-------|-------------|--------------|
| MCP loaded | `agent_swarm` MCP connection enabled | Disable MCP |
| 20+ tools registered | All `agent_swarm_*` tools available | Remove tool permissions |
| AGENTS.md too long | 161 lines of irrelevant docs | Rewrite AGENTS.md |

---

## 9. PLUGIN ISOLATION PATTERNS

### 9.1 Pattern 1: Agent-Aware Hooks (Spider Agent - CORRECT)

```typescript
// In tool.execute.before
"tool.execute.before": async (input, output) => {
  const activeAgent = spiderState.activeAgent.get(input.sessionID);
  
  // Only apply to Spider sub-agents
  if (!activeAgent || !isSpiderSubAgent(activeAgent)) {
    return;  // Bypass for vanilla agents
  }
  
  // Apply Spider-specific logic...
}
```

**Why it works:** Hook checks the active agent before applying logic.

### 9.2 Pattern 2: Session-Based State (Spider Agent - CORRECT)

```typescript
// Spider uses Map-based state keyed by sessionID
const spiderState = {
  activeAgent: new Map(),  // sessionID → agentName
  agentSessions: new Map(), // sessionID → sessionState
};

// Access pattern
const activeAgent = spiderState.activeAgent.get(sessionID);
```

**Why it works:** State is isolated per-session, not global.

### 9.3 Pattern 3: Plugin-Named Constants (Spider Agent - CORRECT)

```typescript
const ORCHESTRATOR_NAME = "architect";
const AGENT_PREFIX = "spider_";

// Check if agent belongs to this plugin
function isSpiderSubAgent(agentName: string): boolean {
  return agentName?.startsWith(AGENT_PREFIX) || 
         agentName === ORCHESTRATOR_NAME;
}
```

**Why it works:** Naming convention prevents conflicts.

### 9.4 Pattern 4: Agent Filtering in System Transform (Spider Agent - CORRECT)

```typescript
// In experimental.chat.system.transform
if (agent && agent !== "architect") {
  return;  // Only applies to architect
}
```

**Why it works:** Explicit agent check before applying.

### 9.5 Anti-Pattern 1: Global Phase State (Hermes - WRONG)

```typescript
// Module-level global
let _currentPhase: string = PHASES.IDLE;

export function createBrainstormGateHook() {
  return async (input, output) => {
    const phase = getCurrentPhase();  // Always returns "idle" for Spider
    if (phase !== PHASES.IDLE) return;
    // Block code...
  };
}
```

**Why it breaks:** Phase is global, never syncs with other plugins.

### 9.6 Anti-Pattern 2: No Agent Filtering (Hermes - WRONG)

```typescript
export function createBrainstormGateHook() {
  return async (input, output) => {
    // NO CHECK for which agent is active!
    if (hasCodeBlocks) {
      // Block ALL agents, not just Hermes agents
    }
  };
}
```

**Why it breaks:** Hook fires for ALL agents, not just Hermes.

---

## 10. DEBUGGING GUIDE

### 10.1 Detecting Plugin Conflicts

**Symptom:** Output contains unexpected messages like `[HARD-GATE BLOCKED]`

**Check:**
```bash
# Search for the message source
grep -rn "HARD-GATE BLOCKED" /path/to/plugins/

# Check which plugin registered the hook
grep -rn "experimental.chat.messages.transform" /path/to/plugins/
```

### 10.2 Checking Active Agent

**Symptom:** Hook fires for wrong agent

**Check:**
```bash
# Search for active agent tracking
grep -rn "activeAgent" /path/to/plugin/

# Check if hook filters by agent
grep -rn "agent.*===" /path/to/plugin/hooks/
```

### 10.3 Verifying Phase State

**Symptom:** Phase-dependent logic doesn't work

**Check:**
```bash
# Search for phase tracking
grep -rn "_currentPhase\|getCurrentPhase\|setCurrentPhase" /path/to/plugin/

# Check if phase is ever set
grep -rn "setCurrentPhase" /path/to/plugin/
```

### 10.4 Session Isolation Check

**Symptom:** State leaks between sessions

**Check:**
```bash
# Search for module-level state
grep -rn "new Map()\|new Set()" /path/to/plugin/src/

# Check if state is keyed by sessionID
grep -rn "sessionID" /path/to/plugin/src/
```

---

## 11. V4 BOILERPLATE ARCHITECTURE

### 11.1 Hook Registry with Agent Awareness

```typescript
// v4-boilerplate/src/plugin-isolation/hook-registry.ts

interface HookRegistration {
  pluginName: string;
  hookName: string;
  priority: number;
  agentFilter?: string[];     // Only fire for these agents
  condition?: (input: any) => boolean;
}

class HookRegistry {
  private registrations: Map<string, HookRegistration[]> = new Map();
  
  register(reg: HookRegistration) {
    const hooks = this.registrations.get(reg.hookName) || [];
    
    // CONFLICT DETECTION
    if (hooks.length > 0) {
      console.warn(`[HookRegistry] CONFLICT: ${reg.pluginName} → ${reg.hookName}`);
    }
    
    hooks.push(reg);
    hooks.sort((a, b) => a.priority - b.priority);
    this.registrations.set(reg.hookName, hooks);
  }
  
  async execute(hookName: string, input: any, output: any, context: {
    sessionID: string;
    agentName: string;
    pluginName: string;
  }) {
    const hooks = this.registrations.get(hookName) || [];
    
    for (const reg of hooks) {
      // AGENT FILTER
      if (reg.agentFilter && !reg.agentFilter.includes(context.agentName)) {
        continue;
      }
      
      // CONDITION
      if (reg.condition && !reg.condition(input)) {
        continue;
      }
      
      await reg.handler(input, output);
    }
  }
}
```

### 11.2 Cross-Plugin Phase Sync

```typescript
// v4-boilerplate/src/plugin-isolation/phase-sync.ts

interface PhaseEvent {
  pluginName: string;
  sessionID: string;
  phase: string;
  timestamp: number;
}

class PhaseSync {
  private phases: Map<string, Map<string, string>> = new Map();
  private listeners: ((event: PhaseEvent) => void)[] = [];
  
  setPhase(sessionID: string, pluginName: string, phase: string) {
    const sessionPhases = this.phases.get(sessionID) || new Map();
    sessionPhases.set(pluginName, phase);
    this.phases.set(sessionID, sessionPhases);
    
    // Notify listeners
    for (const listener of this.listeners) {
      listener({ pluginName, sessionID, phase, timestamp: Date.now() });
    }
  }
  
  getPhase(sessionID: string, pluginName: string): string | undefined {
    return this.phases.get(sessionID)?.get(pluginName);
  }
  
  getAllPhases(sessionID: string): Map<string, string> {
    return this.phases.get(sessionID) || new Map();
  }
}
```

### 11.3 Plugin Health Check

```typescript
// v4-boilerplate/src/plugin-isolation/health-check.ts

interface PluginHealth {
  name: string;
  path: string;
  status: 'loaded' | 'failed' | 'disabled';
  error?: string;
  hooksRegistered: string[];
  loadTime: number;
}

async function checkPluginHealth(plugins: string[]): Promise<PluginHealth[]> {
  const results: PluginHealth[] = [];
  
  for (const pluginPath of plugins) {
    const start = Date.now();
    try {
      const plugin = await import(pluginPath);
      const hooks = Object.keys(plugin.default ? await plugin.default({}) : {});
      results.push({
        name: pluginPath.split('/').pop() || pluginPath,
        path: pluginPath,
        status: 'loaded',
        hooksRegistered: hooks,
        loadTime: Date.now() - start,
      });
    } catch (error) {
      results.push({
        name: pluginPath.split('/').pop() || pluginPath,
        path: pluginPath,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        hooksRegistered: [],
        loadTime: Date.now() - start,
      });
    }
  }
  
  return results;
}
```

### 11.4 v4 Plugin Entry Point Template

```typescript
// v4-boilerplate/src/index.ts

import { HookRegistry, PhaseSync, AgentAwareness } from './plugin-isolation';

const hookRegistry = new HookRegistry();
const phaseSync = new PhaseSync();
const agentAwareness = new AgentAwareness();

export default async function MyPlugin(input) {
  const PLUGIN_NAME = 'my-plugin';
  const AGENT_PREFIX = 'my_';
  
  // Register hooks with metadata
  hookRegistry.register({
    pluginName: PLUGIN_NAME,
    hookName: 'experimental.chat.messages.transform',
    priority: 100,
    agentFilter: [`${AGENT_PREFIX}agent1`, `${AGENT_PREFIX}agent2`],
    handler: async (input, output) => {
      // Only fires for my-plugin's agents
    },
  });
  
  // Track agent activation
  hookRegistry.register({
    pluginName: PLUGIN_NAME,
    hookName: 'tool.execute.before',
    priority: 50,
    agentFilter: null,  // Fires for all, but checks inside
    handler: async (input, output) => {
      const agent = agentAwareness.getAgent(input.sessionID);
      if (!agent?.startsWith(AGENT_PREFIX)) return;
      // Apply plugin logic...
    },
  });
  
  return {
    name: PLUGIN_NAME,
    agent: [...],
    tool: {...},
    "experimental.chat.messages.transform": async (input, output) => {
      const agent = agentAwareness.getAgent(input.sessionID);
      await hookRegistry.execute(
        'experimental.chat.messages.transform',
        input, output,
        { sessionID: input.sessionID, agentName: agent, pluginName: PLUGIN_NAME }
      );
    },
  };
}
```

---

## 12. MIGRATION GUIDE

### 12.1 Migrating a v3 Plugin to v4

**Before (v3):**
```typescript
let _currentPhase = 'idle';

export default async function MyPlugin(input) {
  return {
    tool: {...},
    "experimental.chat.messages.transform": async (input, output) => {
      // No agent check - fires for ALL agents
      if (_currentPhase === 'idle' && hasCode) {
        block();
      }
    },
  };
}
```

**After (v4):**
```typescript
import { HookRegistry, PhaseSync } from './plugin-isolation';

const phaseSync = new PhaseSync();
const hookRegistry = new HookRegistry();

export default async function MyPlugin(input) {
  hookRegistry.register({
    pluginName: 'my-plugin',
    hookName: 'experimental.chat.messages.transform',
    priority: 100,
    agentFilter: ['my_agent1', 'my_agent2'],  // Only my agents
    handler: async (input, output) => {
      // Safe to apply logic
    },
  });
  
  return {
    tool: {...},
    "experimental.chat.messages.transform": async (input, output) => {
      const agent = getActiveAgent(input.sessionID);
      await hookRegistry.execute(
        'experimental.chat.messages.transform',
        input, output,
        { sessionID: input.sessionID, agentName: agent, pluginName: 'my-plugin' }
      );
    },
  };
}
```

### 12.2 Adding Phase Sync

**Before:**
```typescript
let _currentPhase = 'idle';  // Global state!
```

**After:**
```typescript
import { PhaseSync } from './plugin-isolation';

const phaseSync = new PhaseSync();

// When phase changes
phaseSync.setPhase(sessionID, 'my-plugin', 'planning');

// When checking phase
const allPhases = phaseSync.getAllPhases(sessionID);
// { 'my-plugin': 'planning', 'other-plugin': 'executing' }
```

### 12.3 Adding Health Checks

**In plugin init:**
```typescript
import { checkPluginHealth } from './plugin-isolation';

const health = await checkPluginHealth(['./my-plugin.js']);
if (health.status === 'failed') {
  console.error(`Plugin failed to load: ${health.error}`);
}
```

---

## APPENDIX A: QUICK REFERENCE

### Hook Safety Checklist

- [ ] Does `tool.execute.before` check `activeAgent`?
- [ ] Does `experimental.chat.messages.transform` check which agent is active?
- [ ] Is phase state stored per-session, not global?
- [ ] Are module-level globals avoided or namespaced?
- [ ] Does the plugin have a naming convention for its agents?
- [ ] Are vanilla agents bypassed explicitly?

### Conflict Detection Commands

```bash
# Find all hooks in a plugin
grep -rn "experimental.chat.messages.transform\|tool.execute.before" /path/to/plugin/

# Check for agent filtering
grep -rn "activeAgent\|agentName\|isSpiderSubAgent" /path/to/plugin/

# Check for phase tracking
grep -rn "_currentPhase\|getCurrentPhase\|setCurrentPhase" /path/to/plugin/

# Find module-level globals
grep -rn "^let \|^var \|^const " /path/to/plugin/src/
```

---

*Generated from forensic analysis of Hermes Agent Plugin, Spider Agent Plugin, and OpenCode Vanilla architecture.*
