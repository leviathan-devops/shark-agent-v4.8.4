# BROKEN PLUGINS AUDIT

**Date:** 2026-04-05
**Auditor:** Spider Agent (automated)
**Severity:** HIGH - Plugins failing silently at startup

---

## EXECUTIVE SUMMARY

Two plugins were failing to load silently at startup, wasting resources and polluting logs:

1. **Hive Mind Plugin** - Missing `@opencode-ai/plugin` dependency
2. **path=list** - Corrupted config entry, plugin export is not a function

Both have been removed from `opencode.json`.

---

## PLUGIN #1: Hive Mind Plugin

### Path
`file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/hive-mind-plugin.ts`

### Error
```
Cannot find module '@opencode-ai/plugin'
```

### Root Cause
The Hive Mind Plugin v4 imports `@opencode-ai/plugin` but this dependency is not installed in its `node_modules`. The plugin was likely developed in a different environment where the dependency was available.

### Impact
- Plugin fails to load at startup
- Error logged but doesn't crash OpenCode
- Wastes startup time attempting to load
- No functionality provided

### Fix Applied
Removed from `opencode.json` plugin array.

### Recovery Path
If Hive Mind Plugin is needed in the future:
1. `cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4"`
2. `npm install @opencode-ai/plugin`
3. Verify plugin loads correctly
4. Re-add to `opencode.json`

---

## PLUGIN #2: path=list (Corrupted Entry)

### Path
`path=list` (corrupted config entry)

### Error
```
Plugin export is not a function
```

### Root Cause
A corrupted entry in `opencode.json` plugin array. This was likely a typo or config corruption during a previous session. The string `path=list` is not a valid plugin path.

### Impact
- Plugin fails to load at startup
- Error logged but doesn't crash OpenCode
- Wastes startup time attempting to load
- No functionality provided

### Fix Applied
Removed from `opencode.json` plugin array.

---

## PLUGIN #3: Agent Swarm MCP (Disabled)

### Path
MCP connection: `http://localhost:3013`

### Status
Not broken, but **disabled** because:
1. Completely unrelated to Spider Agent plugin architecture
2. Was causing context pollution with 20+ `agent_swarm_*` tools
3. AGENTS.md contained 161 lines of irrelevant Agent Swarm documentation
4. Debugging sessions were derailed by Agent Swarm context

### Fix Applied
- Set `"enabled": false` in `opencode.json` MCP section
- Removed all `agent_swarm_*` tool permissions
- Rewrote AGENTS.md to remove Agent Swarm references

### Recovery Path
If Agent Swarm is needed in the future:
1. Set `"enabled": true` in `opencode.json` MCP section
2. Re-add `agent_swarm_*` tool permissions
3. Ensure AGENTS.md doesn't pollute context with Agent Swarm docs

---

## CURRENT PLUGIN STATE

| Plugin | Path | Status | Notes |
|--------|------|--------|-------|
| spider-agent | `plugins/spider-agent` | ✅ Loads | 11-agent orchestrator |
| hermes-agent | `Hermes Agent Plugin/v2.1-build/dist/index.js` | ✅ Loads | Brainstorm gate disabled |
| coding-subagents | `plugins/coding-subagents/dist/index.js` | ✅ Loads | qwen/gemma routing |
| opencode-plugin-engineering | `plugins/opencode-plugin-engineering/dist/index.js` | ✅ Loads | Engineering knowledge |
| hive-mind-plugin | `Hive Mind Plugin/v4/hive-mind-plugin.ts` | ❌ Removed | Missing dependency |
| agent_swarm MCP | `localhost:3013` | ❌ Disabled | Context pollution |

---

## LESSONS LEARNED

1. **Plugin failures are silent** - OpenCode logs errors but doesn't crash, making it hard to detect broken plugins
2. **Dependencies must be installed** - TypeScript plugins need their npm dependencies installed
3. **Config corruption happens** - Regular audits of `opencode.json` plugin array are needed
4. **Context pollution is real** - Unrelated plugins/MCP connections pollute debugging sessions
5. **AGENTS.md matters** - This file is loaded into every session, so it should only contain relevant information

---

## RECOMMENDATIONS

1. **Add plugin health check** - Script that validates all plugins load correctly at startup
2. **Add dependency check** - Script that verifies all plugin dependencies are installed
3. **Regular config audits** - Periodic review of `opencode.json` to remove broken entries
4. **Plugin isolation** - Plugins should not interfere with each other's workflows (see architecture_debug plan)

---

*Generated from forensic analysis of plugin load failures.*
