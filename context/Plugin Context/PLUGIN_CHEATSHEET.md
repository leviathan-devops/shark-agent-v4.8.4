# OpenCode Plugin Cheatsheet

**Quick reference. For full docs, see SKILL.md.**

---

## The Golden Rule

> **SKILL ≠ PLUGIN**
> Skill = `.md` in `~/.hermes/skills/` → agent knowledge
> Plugin = `.js` bundle in `opencode.json` → OpenCode runtime

---

## Registration (opencode.json)

```json
{
  "plugin": [
    "file:///path/to/plugins/my-plugin/dist/index.js"
  ]
}
```

| Path Type | Behavior |
|-----------|----------|
| `.js` file | Load directly |
| `.ts` file | Compile and load |
| Directory | Look for `dist/index.js` |

---

## Minimal Plugin

```typescript
import { tool, type Plugin, type Hooks } from '@opencode-ai/plugin';

export default async function MyPlugin(input): Promise<Hooks> {
  return {
    tool: { myTool: tool({ description: "...", args: {}, execute: async (args, ctx) => {} }) }
  };
}
```

---

## Tool Definition

```typescript
import { tool } from '@opencode-ai/plugin';
import { z } from 'zod';

const myTool = tool({
  description: "What it does",
  args: {
    name: z.string().describe("Required arg"),
    opt: z.string().optional().describe("Optional")
  },
  execute: async (args, ctx) => {
    // ctx: sessionID, agent, directory, worktree, abort, metadata, ask
    return JSON.stringify({ result: "ok" });
  }
});
```

---

## Hooks

| Hook | When | Blocking? | Use |
|------|------|-----------|-----|
| `tool.execute.before` | Pre-tool | Yes | Validate |
| `tool.execute.after` | Post-tool | No | Track |
| `command.execute.before` | Pre-command | Yes | Intercept |
| `chat.message` | On message | Yes | Route |
| `chat.params` | Pre-LLM | No | Tune |
| `experimental.session.compacting` | Pre-compact | No | Inject |

---

## State Dir

```
.{plugin-name}/
├── state.json
├── plan.md
├── evidence/
├── knowledge/
├── checkpoints/
└── delegation-ledger.json
```

---

## Build

```bash
bun install
bun build src/index.ts --outdir dist --target bun --format esm --bundle
# Output: dist/index.js
```

---

## Verify

```bash
opencode --print-logs --agent default "test"
# Look for: service=plugin path=... loading plugin
```

---

## Common Pitfalls

1. SKILL.md ≠ Plugin — build to `dist/index.js`
2. Hook key typos — `tool.execute.before` exact
3. Blocking in after hooks — use before
4. Missing state init — in plugin fn, not hooks
5. No bundle — OpenCode needs `.js`, not `.ts` source

---

## File Map

```
SKILL.md                      ← Entry point (you are here)
layers/layer-1-CORE.md       ← Full T1 pathway
references/HOOK_MAP.md       ← Hook signatures
references/HOOK_ARCHITECTURE.md ← Hook order, state
references/tool-template.md  ← Tool template
references/hook-template.md  ← Hook template
cases/SKILL_VS_PLUGIN_CASE_STUDY.md ← Failure analysis
cases/SPIDER_AGENT_FORENSIC_REPORT.md ← Spider internals
QUICKSTART.md                ← 1-page quickstart
```

---

## Examples

| Plugin | Path |
|--------|------|
| spider-agent | `plugins/spider-agent/` |
| coding-subagents | `plugins/coding-subagents/dist/index.js` |
| hive-mind-plugin | `Hive Mind Plugin/v4/` |
| hermes-agent | `Hermes Agent Plugin/v2-build/dist/index.js` |
