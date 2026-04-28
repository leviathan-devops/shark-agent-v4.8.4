# ARCHITECTURE DEBUG PLAN: Plugin Isolation & Conflict Prevention

**Date:** 2026-04-05
**Priority:** CRITICAL - Must be added to v4 boilerplate template
**Status:** Design phase - ready for implementation

---

## PROBLEM STATEMENT

Multiple OpenCode plugins can interfere with each other because:

1. **No hook isolation** - Multiple plugins hooking into the same event (`experimental.chat.messages.transform`) fire in load order with no priority system
2. **No agent awareness** - Hooks don't know which agent is active, so they apply gates/rules to all agents indiscriminately
3. **No phase synchronization** - Each plugin tracks its own phase state independently, causing cross-plugin conflicts (Hermes `_currentPhase` stays at "idle" while Spider Agent is in BUILD phase)
4. **No conflict detection** - No logging when multiple plugins hook into the same event
5. **Silent failures** - Broken plugins fail silently at startup, wasting resources

### Real-World Impact

- **Hermes brainstorm gate** blocked Spider Agent's implementation work because `_currentPhase` was "idle"
- **Agent Swarm MCP** polluted context with 20+ irrelevant tools
- **Hive Mind Plugin** failed silently, wasting startup time
- **Vanilla OpenCode** broken because agents were disabled for Spider Agent

---

## SOLUTION: Plugin Isolation Layer

### 1. Hook Registry with Conflict Detection

```typescript
// v4-boilerplate/src/plugin-isolation/hook-registry.ts

interface HookRegistration {
  pluginName: string;
  hookName: string;
  priority: number;  // Lower = fires first
  agentFilter?: string[];  // Only fire for these agents
  condition?: (input: any) => boolean;  // Custom condition
}

class HookRegistry {
  private registrations: Map<string, HookRegistration[]> = new Map();
  
  register(reg: HookRegistration) {
    const hooks = this.registrations.get(reg.hookName) || [];
    
    // CONFLICT DETECTION: Log when multiple plugins register same hook
    if (hooks.length > 0 && !hooks.some(h => h.pluginName === reg.pluginName)) {
      console.warn(
        `[HookRegistry] CONFLICT: Plugin "${reg.pluginName}" registering "${reg.hookName}" ` +
        `— already registered by: ${hooks.map(h => h.pluginName).join(', ')}`
      );
    }
    
    hooks.push(reg);
    hooks.sort((a, b) => a.priority - b.priority);
    this.registrations.set(reg.hookName, hooks);
  }
  
  async execute(hookName: string, input: any, output: any, activeAgent?: string) {
    const hooks = this.registrations.get(hookName) || [];
    
    for (const reg of hooks) {
      // AGENT FILTER: Skip if this hook doesn't apply to the active agent
      if (reg.agentFilter && activeAgent && !reg.agentFilter.includes(activeAgent)) {
        continue;
      }
      
      // CONDITION: Skip if custom condition fails
      if (reg.condition && !reg.condition(input)) {
        continue;
      }
      
      await reg.handler(input, output);
    }
  }
}
```

### 2. Agent Awareness System

```typescript
// v4-boilerplate/src/plugin-isolation/agent-awareness.ts

interface AgentState {
  sessionId: string;
  agentName: string;
  pluginName: string;  // Which plugin owns this agent
  phase: string;
  isActive: boolean;
}

class AgentAwareness {
  private states: Map<string, AgentState> = new Map();
  
  setActiveAgent(sessionId: string, agentName: string, pluginName: string) {
    this.states.set(sessionId, {
      sessionId,
      agentName,
      pluginName,
      phase: 'unknown',
      isActive: true,
    });
  }
  
  getActiveAgent(sessionId: string): AgentState | undefined {
    return this.states.get(sessionId);
  }
  
  isAgentFromPlugin(sessionId: string, pluginName: string): boolean {
    const state = this.states.get(sessionId);
    return state?.pluginName === pluginName;
  }
}
```

### 3. Cross-Plugin Phase Sync

```typescript
// v4-boilerplate/src/plugin-isolation/phase-sync.ts

interface PhaseEvent {
  pluginName: string;
  sessionId: string;
  phase: string;
  timestamp: number;
}

class PhaseSync {
  private phases: Map<string, Map<string, string>> = new Map(); // sessionId -> pluginName -> phase
  private listeners: ((event: PhaseEvent) => void)[] = [];
  
  setPhase(sessionId: string, pluginName: string, phase: string) {
    const sessionPhases = this.phases.get(sessionId) || new Map();
    sessionPhases.set(pluginName, phase);
    this.phases.set(sessionId, sessionPhases);
    
    const event: PhaseEvent = { pluginName, sessionId, phase, timestamp: Date.now() };
    for (const listener of this.listeners) {
      listener(event);
    }
  }
  
  getPhase(sessionId: string, pluginName: string): string | undefined {
    return this.phases.get(sessionId)?.get(pluginName);
  }
  
  // Get ALL phases for a session (cross-plugin view)
  getAllPhases(sessionId: string): Map<string, string> {
    return this.phases.get(sessionId) || new Map();
  }
  
  onPhaseChange(listener: (event: PhaseEvent) => void) {
    this.listeners.push(listener);
  }
}
```

### 4. Plugin Health Check

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

---

## IMPLEMENTATION PLAN

### Phase 1: Hook Registry (Week 1)
- [ ] Create `HookRegistry` class
- [ ] Add conflict detection logging
- [ ] Add priority system for hook execution order
- [ ] Add agent filter support
- [ ] Add custom condition support
- [ ] Update all existing plugins to use HookRegistry

### Phase 2: Agent Awareness (Week 2)
- [ ] Create `AgentAwareness` class
- [ ] Add `setActiveAgent` call to plugin init
- [ ] Update hooks to check agent awareness before firing
- [ ] Add logging for agent transitions

### Phase 3: Phase Sync (Week 3)
- [ ] Create `PhaseSync` class
- [ ] Add phase event broadcasting
- [ ] Update Spider Agent to broadcast phase changes
- [ ] Update Hermes Agent to listen for phase changes
- [ ] Re-enable Hermes brainstorm gate with phase sync

### Phase 4: Health Check (Week 4)
- [ ] Create `checkPluginHealth` function
- [ ] Add startup health check to OpenCode
- [ ] Add health check CLI command
- [ ] Add health check to CI/CD pipeline

### Phase 5: v4 Boilerplate Integration (Week 5)
- [ ] Add plugin isolation layer to v4 boilerplate template
- [ ] Update plugin engineering docs
- [ ] Create migration guide for existing plugins
- [ ] Test with all existing plugins

---

## V4 BOILERPLATE TEMPLATE CHANGES

### New Files to Add

```
v4-boilerplate/
├── src/
│   ├── plugin-isolation/
│   │   ├── hook-registry.ts      # Hook registry with conflict detection
│   │   ├── agent-awareness.ts    # Agent awareness system
│   │   ├── phase-sync.ts         # Cross-plugin phase sync
│   │   ├── health-check.ts       # Plugin health check
│   │   └── index.ts              # Exports all isolation modules
│   └── index.ts                  # Main plugin entry point
├── docs/
│   ├── PLUGIN_ISOLATION.md       # How plugin isolation works
│   ├── HOOK_REGISTRY.md          # Hook registry API docs
│   └── MIGRATION_GUIDE.md        # How to migrate existing plugins
└── tests/
    └── plugin-isolation/
        ├── hook-registry.test.ts
        ├── agent-awareness.test.ts
        ├── phase-sync.test.ts
        └── health-check.test.ts
```

### Plugin Entry Point Changes

```typescript
// Before (v3)
export default async function MyPlugin(input) {
  return {
    tool: { ... },
    "experimental.chat.messages.transform": myHook,
  };
}

// After (v4)
import { HookRegistry, AgentAwareness, PhaseSync } from './plugin-isolation';

export default async function MyPlugin(input) {
  const hookRegistry = new HookRegistry();
  const agentAwareness = new AgentAwareness();
  const phaseSync = new PhaseSync();
  
  // Register hooks with metadata
  hookRegistry.register({
    pluginName: 'my-plugin',
    hookName: 'experimental.chat.messages.transform',
    priority: 100,
    agentFilter: ['my-agent'],  // Only fire for my agents
    condition: (input) => input.sessionID !== undefined,
    handler: myHook,
  });
  
  return {
    tool: { ... },
    "experimental.chat.messages.transform": async (input, output) => {
      const activeAgent = agentAwareness.getActiveAgent(input.sessionID);
      await hookRegistry.execute(
        'experimental.chat.messages.transform',
        input, output,
        activeAgent?.agentName
      );
    },
  };
}
```

---

## PREVENTION CHECKLIST FOR NEW PLUGINS

Before adding a new plugin to `opencode.json`:

- [ ] Plugin loads without errors (check with `checkPluginHealth`)
- [ ] All dependencies are installed
- [ ] Hook conflicts checked (no duplicate hooks with existing plugins)
- [ ] Agent awareness implemented (hooks check active agent before firing)
- [ ] Phase sync implemented (if plugin tracks phases)
- [ ] Plugin name is unique (no conflicts with existing plugins)
- [ ] Plugin path is valid (no typos or corrupted entries)
- [ ] Plugin doesn't pollute context (no irrelevant tools/agents)
- [ ] AGENTS.md updated if plugin adds new agents
- [ ] Debug log created in `DEBUG LOGS/` folder

---

## REFERENCES

- **Broken Plugins Audit**: `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/07-architecture/BROKEN_PLUGINS_AUDIT_20260405.md`
- **System Failure Debug Log**: `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/01-spider-agent/SYSTEM_FAILURE_DEBUG_LOG_20260405.md`
- **Spider Agent Forensic Report**: `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/01-spider-agent/SPIDER_AGENT_FORENSIC_REPORT.md`
- **Hermes Agent Debug Logs**: `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/02-hermes-agent/`
- **OpenCode Vanilla Architecture**: `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Opencode Macro-Architecture/Opencode Vanilla/ARCHITECTURE.md`
- **Spider Agent Architecture**: `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Opencode Macro-Architecture/Spider Agent/ARCHITECTURE.md`

---

*Generated from forensic analysis of plugin conflicts and system failures.*
