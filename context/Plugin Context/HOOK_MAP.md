# OpenCode + Spider Agent: Complete Hook Map

**Date**: 2026-04-01
**Sources**: 
- `@opencode-ai/plugin` SDK types
- `~/.npm-global/lib/node_modules/spider-agent/dist/index.js`

---

## Table of Contents

1. [Hook Reference Overview](#1-hook-reference-overview)
2. [Plugin Entry Hooks](#2-plugin-entry-hooks)
3. [Chat Hooks](#3-chat-hooks)
4. [Tool Hooks](#4-tool-hooks)
5. [Command Hooks](#5-command-hooks)
6. [Session Hooks](#6-session-hooks)
7. [Shell/Permission Hooks](#7-shellpermission-hooks)
8. [Experimental Hooks](#8-experimental-hooks)
9. [Automation Hooks](#9-automation-hooks)
10. [Spider Agent Hook Implementations](#10-spider-agent-hook-implementations)
11. [Hook Utility Functions](#11-hook-utility-functions)
12. [Hook Input/Output Types](#12-hook-inputoutput-types)
13. [Quick Reference Tables](#13-quick-reference-tables)

---

## 1. Hook Reference Overview

### What Are Hooks?

Hooks are lifecycle interception points in OpenCode that plugins can implement to:
- Intercept and transform messages
- Pre/post-process tool executions
- Modify configuration
- Register agents and commands
- Enforce policies

### Hook Return Pattern

Every hook follows this pattern:

```typescript
// Input: Data before processing
// Output: Mutable object to modify or intercept
// Return: Promise<void> (modifies output in place)

hookName: async (input: InputType, output: OutputType) => {
  // Modify output
  // Or throw to block/intercept
}
```

---

## 2. Plugin Entry Hooks

### `name` (string)

**Purpose**: Plugin identifier

```typescript
name: "opencode-swarm"
```

### `agent` (Record<string, SDKAgentConfig>)

**Purpose**: Register agents with OpenCode's agent registry

```typescript
agent: {
  architect: {
    name: "architect",
    description: "Spider orchestrator",
    model: "0-opencode-zen/qwen3.6-plus-free",
    mode: "primary",
    permission: { task: "allow" },
    tools: ["Read", "Edit", "Bash", "Grep", ...]
  },
  coder: {
    name: "coder",
    mode: "subagent",
    model: "0-opencode-zen/qwen3.6-plus-free",
    tools: ["Read", "Edit", "Bash", ...]
  }
}
```

**Line**: ~68150-68200 (Spider Agent)

### `tool` (Record<string, ToolDefinition>)

**Purpose**: Register custom tools

```typescript
tool: {
  checkpoint: tool({
    description: "Create named checkpoint",
    args: { label: z.string() },
    execute: async (args, context) => { /* ... */ }
  }),
  save_plan: tool({ /* ... */ }),
  // ...
}
```

### `config` (async function)

**Purpose**: Modify OpenCode configuration, register agents + commands

```typescript
config: async (opencodeConfig) => {
  // Inject agents
  opencodeConfig.agent = {
    ...opencodeConfig.agent,
    architect: { name: "architect", mode: "primary", ... }
  };
  
  // Register slash commands
  opencodeConfig.command = {
    swarm: { template: "/swarm $ARGUMENTS", description: "..." },
    "swarm-status": { template: "/swarm status", description: "..." }
  };
}
```

**Line**: ~68127-68268 (Spider Agent)

---

## 3. Chat Hooks

### `chat.message`

**When**: A new message is received from user

**Input**:
```typescript
{
  sessionID: string;
  agent?: string;
  model?: { providerID: string; modelID: string; };
  messageID?: string;
  variant?: string;
}
```

**Output**:
```typescript
{
  message: UserMessage;
  parts: Part[];
}
```

**Purpose**: Intercept/transform incoming messages

**Spider Agent Line**: ~68489

```javascript
"chat.message": safeHook(async (input, output) => {
  // Delegation handling
  await handleDelegation(input, output);
})
```

### `chat.params`

**When**: Before sending to LLM - modify parameters

**Input**:
```typescript
{
  sessionID: string;
  agent: string;
  model: Model;
  provider: ProviderContext;
  message: UserMessage;
}
```

**Output**:
```typescript
{
  temperature: number;
  topP: number;
  topK: number;
  options: Record<string, any>;
}
```

**Purpose**: Adjust model parameters (temperature, topP, etc.)

**Used by**: Shark Agent to adjust model params

### `chat.headers`

**When**: Before sending to LLM - modify headers

**Input**:
```typescript
{
  sessionID: string;
  agent: string;
  model: Model;
  provider: ProviderContext;
  message: UserMessage;
}
```

**Output**:
```typescript
{
  headers: Record<string, string>;
}
```

**Purpose**: Add/modify HTTP headers for LLM requests

---

## 4. Tool Hooks

### `tool.execute.before`

**When**: Before each tool execution

**Input**:
```typescript
{
  tool: string;        // Tool name (e.g., "Read", "Edit", "Bash")
  sessionID: string;
  callID: string;
}
```

**Output**:
```typescript
{
  args: any;           // Tool arguments (can modify!)
}
```

**Purpose**: Pre-execution validation, safety checks, scope enforcement

**Spider Agent implementations**:
```javascript
"tool.execute.before": [
  sessionStateHook,      // Line ~68328 - Setup session state
  guardrailsHook,         // Repetition detection, tool call limits
  delegationGateHook,     // QA gate enforcement
  scopeGuardHook,        // File path restrictions
  activityTrackHook       // Track agent activity
]
```

### `tool.execute.after`

**When**: After each tool execution

**Input**:
```typescript
{
  tool: string;
  sessionID: string;
  callID: string;
  args: any;
}
```

**Output**:
```typescript
{
  title: string;
  output: string;
  metadata: any;
}
```

**Purpose**: Post-execution processing, evidence collection, state persistence

**Spider Agent hook chain** (16+ hooks, lines ~68359-68430):

| # | Hook | Purpose |
|---|------|---------|
| 1 | `activityTrackHook` | Track what each agent is doing |
| 2 | `guardrailsHook` | Repetition/frequency checks |
| 3 | `delegationLedgerHook` | Track delegation calls |
| 4 | `selfReviewHook` | Agent self-review |
| 5 | `delegationGateHook` | Enforce QA gates |
| 6 | `adversarialPatternHook` | Detect adversarial patterns |
| 7 | `knowledgeCuratorHook` | Extract lessons from work |
| 8 | `steeringConsumedHook` | Track directive usage |
| 9 | `coChangeSuggesterHook` | Suggest related file changes |
| 10 | `darkMatterDetectorHook` | Detect hidden couplings |
| 11 | `snapshotWriterHook` | Persist state to .swarm/ |
| 12 | `toolSummarizerHook` | Summarize tool outputs |
| 13 | `slopDetectorHook` | Detect low-quality output |
| 14 | `incrementalVerifyHook` | Incremental verification |
| 15 | `compactionServiceHook` | Context compaction |
| 16 | `knowledgeInjectorHook` | Inject knowledge |

### `tool.definition`

**When**: When tool definitions are sent to LLM

**Input**:
```typescript
{
  toolID: string;
}
```

**Output**:
```typescript
{
  description: string;
  parameters: any;
}
```

**Purpose**: Modify tool descriptions/parameters dynamically

---

## 5. Command Hooks

### `command.execute.before`

**When**: Before a slash command is executed

**Input**:
```typescript
{
  command: string;      // e.g., "/swarm", "/shark"
  sessionID: string;
  arguments: string;    // Everything after command name
}
```

**Output**:
```typescript
{
  parts: Part[];        // Response parts
}
```

**Purpose**: Intercept/handle slash commands

**Spider Agent** (line ~68327):
```javascript
"command.execute.before": safeHook(commandHandler)

// commandHandler:
// 1. Parses "/swarm <subcommand> <args>"
// 2. Looks up in COMMAND_REGISTRY
// 3. Executes handler with { directory, args, sessionID, agents }
// 4. Returns result as Part[]
```

---

## 6. Session Hooks

### `experimental.session.compacting`

**When**: Before session context compaction starts

**Input**:
```typescript
{
  sessionID: string;
}
```

**Output**:
```typescript
{
  context: string[];     // Context chunks (can inject!)
  prompt?: string;
}
```

**Purpose**: Inject additional context before compaction

**Spider Agent** (lines ~51657, ~68326):
```javascript
"experimental.session.compacting": createCompactionCustomizerHook(state)
// Injects: phase info, pipeline state, current task context
```

---

## 7. Shell/Permission Hooks

### `shell.env`

**When**: Before shell command execution - modify environment

**Input**:
```typescript
{
  cwd: string;
  sessionID?: string;
  callID?: string;
}
```

**Output**:
```typescript
{
  env: Record<string, string>;
}
```

**Purpose**: Add/modify environment variables for shell commands

### `permission.ask`

**When**: A permission is requested

**Input**:
```typescript
Permission  // The permission request
```

**Output**:
```typescript
{
  status: "ask" | "deny" | "allow";
}
```

**Purpose**: Handle permission requests programmatically

---

## 8. Experimental Hooks

### `experimental.chat.messages.transform`

**When**: Transform message history before sending to LLM

**Input**:
```typescript
{}
```

**Output**:
```typescript
{
  messages: Array<{
    info: Message;
    parts: Part[];
  }>;
}
```

**Purpose**: Modify/summarize message history

**Spider Agent** (line ~68269):
```javascript
"experimental.chat.messages.transform": composeHandlers(
  createPipelineTrackerHook(),
  createContextBudgetHook(),
  createGuardrailsMessageTransform(),
  createDelegationGateMessageTransform(),
  createDelegationSanitizerHook()
)
```

### `experimental.chat.system.transform`

**When**: Transform system prompt before sending to LLM

**Input**:
```typescript
{
  sessionID?: string;
  model: Model;
}
```

**Output**:
```typescript
{
  system: string[];      // System prompt lines (can inject!)
}
```

**Purpose**: Enhance system prompt with additional context

**Spider Agent** (line ~68301):
```javascript
"experimental.chat.system.transform": composeHandlers(
  createSystemEnhancerHook(),
  heartbeatTelemetryHook()
)
```

### `experimental.text.complete`

**When**: After text completion from LLM

**Input**:
```typescript
{
  sessionID: string;
  messageID: string;
  partID: string;
}
```

**Output**:
```typescript
{
  text: string;
}
```

**Purpose**: Post-process LLM output

---

## 9. Automation Hooks

### `automation` (AutomationManager)

**Purpose**: Background automation manager for agents

**Spider Agent** (background/manager.ts):
```typescript
automation: new AutomationManager({
  directory: ctx.directory,
  agents: agents,
  config: automationConfig
})
```

---

## 10. Spider Agent Hook Implementations

### 20 Hook Creator Factories

| Factory | Purpose | Key Function |
|---------|---------|-------------|
| `createKnowledgeCuratorHook` | Extract lessons from retrospectives | `knowledgeCuratorHook` |
| `createSnapshotWriterHook` | Persist state to .swarm/ | `snapshotWriterHook` |
| `createHivePromoterHook` | Promote to Hive Mind | `hivePromoterHook` |
| `createCompactionCustomizerHook` | Context injection during compaction | `compactionCustomizerHook` |
| `createDelegationGateHook` | Enforce QA gates | `delegationGateHook` |
| `createDelegationSanitizerHook` | Clean delegation messages | `delegationSanitizerHook` |
| `createDelegationTrackerHook` | Track delegation trajectory | `delegationTrackerHook` |
| `createPhaseMonitorHook` | Monitor phase completion | `phaseMonitorHook` |
| `createPipelineTrackerHook` | Track pipeline progress | `pipelineTrackerHook` |
| `createSystemEnhancerHook` | Enhance system prompt | `systemEnhancerHook` |
| `createToolSummarizerHook` | Summarize tool outputs | `toolSummarizerHook` |
| `createCoChangeSuggesterHook` | Suggest related file changes | `coChangeSuggesterHook` |
| `createDarkMatterDetectorHook` | Detect hidden couplings | `darkMatterDetectorHook` |
| `createDelegationLedgerHook` | Ledger of delegations | `delegationLedgerHook` |
| `createIncrementalVerifyHook` | Incremental verification | `incrementalVerifyHook` |
| `createKnowledgeInjectorHook` | Inject knowledge into context | `knowledgeInjectorHook` |
| `createScopeGuardHook` | File path restrictions | `scopeGuardHook` |
| `createSelfReviewHook` | Self-review capability | `selfReviewHook` |
| `createSlopDetectorHook` | Detect low-quality output | `slopDetectorHook` |
| `createSteeringConsumedHook` | Track directive consumption | `steeringConsumedHook` |

---

## 11. Hook Utility Functions

### `safeHook(fn)` (Line ~15528)

Wraps a hook function with error catching:

```typescript
function safeHook(fn: HookFn): HookFn {
  return async (input, output) => {
    try {
      await fn(input, output);
    } catch (error) {
      // Log error but don't crash
      console.error(`Hook error:`, error);
    }
  };
}
```

### `composeHandlers(...fns)` (Line ~15543)

Chains multiple handlers:

```typescript
function composeHandlers(...fns): HookFn {
  return async (input, output) => {
    for (const fn of fns) {
      await fn(input, output);
    }
  };
}
```

---

## 12. Hook Input/Output Types

### ToolContext (for tool definitions)

```typescript
interface ToolContext {
  sessionID: string;
  messageID: string;
  agent: string;
  directory: string;      // Current project directory
  worktree: string;      // Project worktree root
  abort: AbortSignal;
  metadata(input: { title?: string; metadata?: any }): void;
  ask(input: AskInput): Promise<void>;
}

interface AskInput {
  permission: string;
  patterns: string[];
  always: string[];
  metadata: { [key: string]: any };
}
```

### SDKAgentConfig

```typescript
interface SDKAgentConfig {
  name: string;
  description?: string;
  model?: string;
  mode?: "primary" | "subagent" | "all";
  permission?: {
    task?: "allow" | "deny";
    file?: Record<string, "allow" | "deny">;
  };
  tools?: string[];
  system?: string;
}
```

### PluginInput

```typescript
interface PluginInput {
  client: ReturnType<typeof createOpencodeClient>;
  project: Project;
  directory: string;
  worktree: string;
  serverUrl: URL;
  $: BunShell;
}
```

---

## 13. Quick Reference Tables

### All Hooks by Category

| Hook | When | Input | Output |
|------|------|-------|--------|
| **Entry** |
| `name` | Plugin load | - | string |
| `agent` | Plugin load | - | Record<name, AgentConfig> |
| `tool` | Plugin load | - | Record<name, ToolDef> |
| `config` | Plugin load | Config | void (mutates) |
| **Chat** |
| `chat.message` | User message | message, parts | void (mutates) |
| `chat.params` | Pre-LLM call | session, model, provider | temperature, topP, topK |
| `chat.headers` | Pre-LLM call | session, model, provider | headers |
| **Tool** |
| `tool.execute.before` | Pre-tool | tool, session, callID | args (mutable) |
| `tool.execute.after` | Post-tool | tool, session, callID, args | title, output, metadata |
| `tool.definition` | Pre-LLM (tool def) | toolID | description, parameters |
| **Command** |
| `command.execute.before` | Pre-command | command, session, args | parts |
| **Session** |
| `experimental.session.compacting` | Pre-compaction | sessionID | context[], prompt |
| **Experimental** |
| `experimental.chat.messages.transform` | Pre-LLM (history) | - | messages[] |
| `experimental.chat.system.transform` | Pre-LLM (system) | session, model | system[] |
| `experimental.text.complete` | Post-LLM | session, message, part | text |
| **Shell** |
| `shell.env` | Pre-shell | cwd, session | env |
| **Permission** |
| `permission.ask` | Permission request | Permission | status |
| **Other** |
| `event` | Any event | Event | void |
| `auth` | Auth flow | various | various |

### Agent Modes

| Mode | UI Dropdown | @ Autocomplete | Use Case |
|------|-------------|----------------|----------|
| `"primary"` | YES | NO | Main orchestrator agents |
| `"subagent"` | NO | NO | Delegated/internal agents |
| `"all"` | YES | YES | Universal agents |

### Hook Lines in Spider Agent Bundle

| Hook | Line | Handler |
|------|------|---------|
| `config` | 68127-68268 | inline function |
| `command` shortcuts | 68127-68268 | inline |
| `command.execute.before` | 68327 | safeHook(commandHandler) |
| `experimental.chat.messages.transform` | 68269 | composeHandlers(...) |
| `experimental.chat.system.transform` | 68301 | composeHandlers(...) |
| `tool.execute.before` | 68328 | inline + 5 guards |
| `tool.execute.after` | 68359 | inline + 16+ hooks |
| `experimental.session.compacting` | 68326 | createCompactionCustomizerHook |
| `chat.message` | 68489 | safeHook(async...) |
| `safeHook` utility | 15528 | wrapper function |
| `composeHandlers` | 15543 | chain function |

### Spider Agent Tool Before Hooks (5 guards)

| # | Hook | Purpose |
|---|------|---------|
| 1 | `sessionStateHook` | Set up session state |
| 2 | `guardrailsHook` | Repetition detection, limits |
| 3 | `delegationGateHook` | QA gate enforcement |
| 4 | `scopeGuardHook` | File path restrictions |
| 5 | `activityTrackHook` | Track agent activity |

### Spider Agent Tool After Hooks (16+ hooks)

| # | Hook | Purpose |
|---|------|---------|
| 1 | `activityTrackHook` | Activity tracking |
| 2 | `guardrailsHook` | Repetition checks |
| 3 | `delegationLedgerHook` | Delegation tracking |
| 4 | `selfReviewHook` | Self-review |
| 5 | `delegationGateHook` | QA gate |
| 6 | `adversarialPatternHook` | Adversarial detection |
| 7 | `knowledgeCuratorHook` | Lesson extraction |
| 8 | `steeringConsumedHook` | Directive tracking |
| 9 | `coChangeSuggesterHook` | Related changes |
| 10 | `darkMatterDetectorHook` | Hidden couplings |
| 11 | `snapshotWriterHook` | State persistence |
| 12 | `toolSummarizerHook` | Output summarization |
| 13 | `slopDetectorHook` | Quality detection |
| 14 | `incrementalVerifyHook` | Incremental verification |
| 15 | `compactionServiceHook` | Context compaction |
| 16 | `knowledgeInjectorHook` | Knowledge injection |

---

## Usage Example: Adding a Hook to Shark Agent

```typescript
// In shark-agent-plugin/src/index.ts

return {
  // ... existing hooks ...

  "tool.execute.before": async (input, output) => {
    // 1. Safety check
    const result = await safety.checkTool(input.tool, output.args);
    if (!result.allowed) {
      throw new Error(`Safety blocked: ${result.reason}`);
    }
    
    // 2. Scope guard
    if (!scopeGuard.isAllowed(input.tool, output.args)) {
      throw new Error(`Scope violation: ${input.tool}`);
    }
    
    // 3. Track activity
    activityTracker.track(input.sessionID, input.tool);
  },

  "tool.execute.after": async (input, output) => {
    // 1. Collect evidence
    await evidenceCollector.collect(input, output);
    
    // 2. Write snapshot
    await snapshotWriter.write();
    
    // 3. Check for compaction
    if (shouldCompact()) {
      await triggerCompaction();
    }
  },

  "experimental.session.compacting": async (input, output) => {
    // Inject Shark state before compaction
    output.context.push(
      `Shark Mode: ${currentMode}`,
      `Shark State: ${JSON.stringify(state.summary)}`,
      `Active Tasks: ${activeTasks.join(', ')}`
    );
  }
};
```

---

*Hook Map compiled: 2026-04-01*
*Sources: @opencode-ai/plugin SDK, opencode-swarm bundle analysis*
