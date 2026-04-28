# OpenCode Plugin Deployment SOP

**Purpose**: Document the exact process for successfully deploying an OpenCode plugin. This is the canonical reference for any future plugin shipping.

**CRITICAL**: Always include `"permission": {"*": {"*": "allow"}}` in opencode.json to prevent permission prompts.

---

## The Golden Rule

> **A plugin is a compiled JS bundle (`dist/index.js`). A skill is a markdown file (`SKILL.md`). They are completely different systems.**

OpenCode cannot load a SKILL.md as a plugin. It needs `dist/index.js`.

---

## opencode.json REQUIRED Configuration

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "minimax": {}
  },
  "plugin": [
    "file:///path/to/plugin/dist/index.js"
  ],
  "agent": {
    "architect": {
      "disable": true
    }
  },
  "permission": {
    "*": {
      "*": "allow"
    }
  }
}
```

**WITHOUT the `permission` section, you will get permission prompts that block builds.**

---

## Why coding-subagents WORKS

### 1. Correct File Structure

```
~/OPENCODE_WORKSPACE/plugins/coding-subagents/
├── src/
│   ├── index.ts          ← Plugin entry point
│   └── tools/
│       ├── gemma.ts
│       ├── qwen.ts
│       └── route.ts
├── dist/
│   └── index.js          ← 457KB BUNDLED output (what OpenCode loads)
├── package.json
├── tsconfig.json
└── SKILL.md              ← Optional skill reference (NOT the plugin)
```

**Key**: OpenCode loads `dist/index.js`, not the TypeScript source.

### 2. Correct Registration in opencode.json

```json
"plugin": [
  "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/coding-subagents/dist/index.js"
]
```

The path explicitly points to the **bundled JS file**, not a folder, not a SKILL.md.

### 3. Build Command

```bash
cd ~/OPENCODE_WORKSPACE/plugins/coding-subagents
bun build src/index.ts \
  --outdir dist \
  --target bun \
  --format esm \
  --bundle
```

This compiles TypeScript → JavaScript and bundles all dependencies into a single `dist/index.js`.

---

## The SOP (Step by Step)

### Phase 1: Create the Plugin

```bash
# 1. Create plugin directory
mkdir -p ~/OPENCODE_WORKSPACE/plugins/<plugin-name>/src/tools

# 2. Initialize package.json
cd ~/OPENCODE_WORKSPACE/plugins/<plugin-name>
cat > package.json << 'EOF'
{
  "name": "<plugin-name>",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "bun build src/index.ts --outdir dist --target bun --format esm --bundle"
  },
  "peerDependencies": {
    "@opencode-ai/plugin": "^1.3.6"
  }
}
EOF
```

### Phase 2: Write the Plugin Code

```typescript
// src/index.ts
import type { Hooks } from '@opencode-ai/plugin';

export default async function MyPlugin(): Promise<Hooks> {
  return {
    tool: {
      myTool: {
        description: 'What this tool does...',
        args: { /* Zod schema */ },
        execute: async (args) => { /* ... */ }
      }
    }
  };
}
```

### Phase 3: Build

```bash
bun run build
```

**Verify**:
```bash
ls -la dist/
# Should show: dist/index.js
```

### Phase 4: Register in opencode.json

```bash
# Edit opencode.json
code ~/.config/opencode/opencode.json
```

Add to the `plugin` array AND include the `permission` section:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "minimax": {}
  },
  "plugin": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/<plugin-name>/dist/index.js"
  ],
  "agent": {
    "architect": {
      "disable": true
    }
  },
  "permission": {
    "*": {
      "*": "allow"
    }
  }
}
```

### Phase 5: Verify

```bash
opencode --print-logs run "Use myTool with argument X" --agent default
```

Look for:
- `MyPlugin initialized` in logs
- Tool executes without errors
- NO permission prompts

---

## Quick Reference

| Action | Command |
|--------|---------|
| Build plugin | `bun run build` (in plugin dir) |
| Verify bundle exists | `ls dist/index.js` |
| Check plugin registered | `cat ~/.config/opencode/opencode.json \| jq '.plugin'` |
| Check permissions | `cat ~/.config/opencode/opencode.json \| jq '.permission'` |
| Test plugin loads | `opencode --print-logs run "use mytool" --agent default` |

---

## Common Failure Modes

### 1. Missing permission section → Permission prompts
```
PROBLEM: Getting permission prompts blocking builds
FIX: Add "permission": {"*": {"*": "allow"}} to opencode.json
```

### 2. No dist/index.js
```
ERROR: Plugin path doesn't resolve to a .js file
FIX: Run `bun run build` in the plugin directory
```

### 3. Wrong path in opencode.json
```
WRONG:  "file:///path/to/plugin-folder/"
RIGHT:  "file:///path/to/plugin-folder/dist/index.js"
```

### 4. Forgetting to rebuild after changes
```
FIX: After any src/ change, always run `bun run build`
```
