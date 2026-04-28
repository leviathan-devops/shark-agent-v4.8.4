# SHARK AGENT v4.8.3 — COMPLETE HANDOVER PACKAGE

**Generated:** 2026-04-12
**Status:** ACTIVE BUILD — Checkpoint 2.5
**Current MD5:** `82bf751058e89cf5a4b753f8ab7b06cc`

---

## QUICK START

### Current Working Directory
```
/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/
```

### Latest Checkpoint (2.5)
```
/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/.checkpoints/v4.8.3-checkpoint-2.5/
MD5: 82bf751058e89cf5a4b753f8ab7b06cc
```

### Build & Deploy
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
rm -rf dist && bun build src/index.ts --outdir dist --target bun --format esm --bundle
cp dist/index.js /tmp/shark-container-test/plugins/shark-agent-v4.8.3-test/
```

### Container Test (TUI ONLY)
```bash
# Start container
docker kill $(docker ps -q --filter "name=shark-v483") 2>/dev/null
docker run --rm -d --name shark-v483-test --entrypoint /bin/bash \
  -v /tmp/shark-container-test/config:/root/.config/opencode \
  -v /tmp/shark-container-test/plugins:/root/.config/opencode/plugins \
  opencode-test:1.4.3 -c "sleep infinity"

# Test in TUI mode (NOT opencode run)
docker exec -it shark-v483-test \
  /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode \
  --agent shark --model opencode/big-pickle
```

---

## CHECKPOINT MANIFEST

| ID | Date | MD5 | Status |
|----|------|-----|--------|
| v4.8.3-checkpoint-1 | 2026-04-11 20:00 | a9bcdd2f16321dce076f675bd3932abf | Reset to hotfix-v2 |
| v4.8.3-checkpoint-2 | 2026-04-12 05:18 | db85f58641e9f1776bfd36fca095af8c | Two-layer firewall (buggy args) |
| **v4.8.3-checkpoint-2.5** | **2026-04-12 06:16** | **82bf751058e89cf5a4b753f8ab7b06cc** | **CURRENT** |

---

## WHAT WAS BUILT

### Architecture: TWO-LAYER FIREWALL

```
Layer 1: tool.execute.before → toolArgs → BLOCK
Layer 2: chat.message → user message → BLOCK (TUI only)
Layer 2b: messages.transform → response → BLOCK (TUI only)
Layer 2c: command.execute.before → opencode run → PATTERN CHECK (experimental)
```

### Hooks Registered (8 total)

| Hook | Purpose | Mode |
|------|---------|------|
| `event` | Session lifecycle + cleanup | TUI |
| `chat.message` | Brain init + pattern check | TUI |
| `command.execute.before` | opencode run pattern check | run |
| `messages.transform` | TUI response check | TUI |
| `tool.execute.before` | Tool-based blocking | TUI |
| `tool.execute.after` | Summarizer + evidence | TUI |
| `session.compacting` | Session compaction | TUI |
| `system.transform` | Context injection | TUI |

### Pattern Layers

| Layer | Patterns | Location |
|-------|----------|----------|
| L0 Identity | 10 tools | guardian-hook.ts |
| L1 Theatrical | 12 | guardian-hook.ts |
| L2 Fake Test | 9 | guardian-hook.ts |
| L3 Source Inspection | 5 | guardian-hook.ts |
| L4 Wrong Container | 4 | guardian-hook.ts |
| L5.1-L5.10 Anti-Derail | ~70 | chat+command hooks |

### Files Created/Modified

| File | Purpose |
|------|---------|
| `src/hooks/v4.1/guardian-hook.ts` | Tool-based firewall (155 patterns) |
| `src/hooks/v4.1/chat-message-hook.ts` | Message-based firewall (TUI) |
| `src/hooks/v4.1/messages-transform-hook.ts` | Response firewall (TUI) |
| `src/hooks/v4.1/command-execute-hook.ts` | opencode run patterns |
| `src/hooks/v4.1/session-hook.ts` | Session cleanup |
| `src/hooks/v4.1/index.ts` | Hook registration |

---

## CRITICAL DISCOVERIES

### 1. Architecture Gap: opencode run vs TUI

**opencode run mode** has BROKEN hooks:
- `chat.message`: ❌ Does NOT fire
- `tool.execute.before`: ❌ Does NOT fire
- `messages.transform`: ❌ Does NOT fire
- `command.execute.before`: ⚠️ Fires but unreliable

**TUI mode** has FULL hook support:
- All hooks fire correctly
- Brain initialization works
- Firewall patterns work as designed

### 2. Args Extraction Bug (FIXED in 2.5)

In `guardian-hook.ts`, args were being extracted from `output` instead of `input`:
```typescript
// WRONG (fixed):
const args = (output as { args: unknown }).args || {};

// CORRECT:
const { args } = input;
```

### 3. TUI ONLY for Container Testing

Container tests MUST use TUI mode:
```bash
# WRONG (hooks don't fire):
opencode run "test" --agent shark

# CORRECT (full hook support):
opencode --agent shark --model opencode/big-pickle
```

---

## CONTAINER TESTING CONTEXT

### CRITICAL: TUI ONLY

The `opencode run` command has **broken hook system**. TUI mode (`opencode --agent shark`) has **full hook support**.

### Approved Container Test Command

```bash
docker exec -it shark-v483-test \
  /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode \
  --agent shark --model opencode/big-pickle
```

### Container Test Evidence

Evidence stored at: `.shark/evidence/delivery/ContainerTestResult.json`
- Requires: `passRate >= 0.96`
- Blocks L5.2, L5.4, L5.10 if missing

### Docker Image
- **Image:** `opencode-test:1.4.3`
- **OpenCode binary:** `/usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode`

---

## WORKING COMPONENTS

| Component | Status | Notes |
|-----------|--------|-------|
| Brain initialization | ✅ | `setCurrentAgent('shark')` fires |
| shark-status tool | ✅ | Returns correct state |
| shark-gate tool | ✅ | Shows all gates |
| shark-test-runner | ✅ | Tool executes |
| Session cleanup | ✅ | All cleanup functions fire |
| Tool summarizer | ✅ | Truncates outputs |
| Layer 1 (tool) | ✅ TUI | Blocks dangerous commands |
| Layer 2 (message) | ✅ TUI | Anti-derailment patterns |

---

## KNOWN ISSUES

1. **opencode run mode**: Hooks don't fire properly - TUI must be used
2. **TUI testing**: Requires interactive terminal (`docker exec -it`)
3. **Patterns**: May need refinement for precision

---

## NEXT AGENT PROMPT

Continue the build from Checkpoint 2.5:

1. **Test in TUI mode** - `opencode --agent shark` (NOT `opencode run`)
2. **Verify all firewall layers work** - Test L1-L5 patterns block correctly
3. **Fix any pattern issues** - Make precise, not overbearing
4. **Save as Checkpoint 3** when complete
5. **Container test in TUI** - Run shark-test-runner via TUI

### Priority Tasks

1. Test "skip container test" → should block L5.1
2. Test "it works trust me" → should block L5.2  
3. Test "let's just ship it" → should block L5.9
4. Test "npm test" → should block L2
5. Test terminal with `grep | wc` → should block L1

### Don't Block

- Legitimate `opencode run` for other agents (build, plan, etc.)
- Normal development workflows
- Non-shark agent usage

---

## RESTORE CHECKPOINT 2.5

```bash
cp -r /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/.checkpoints/v4.8.3-checkpoint-2.5/* \
      /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/

cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
rm -rf dist && bun build src/index.ts --outdir dist --target bun --format esm --bundle

# Verify MD5: 82bf751058e89cf5a4b753f8ab7b06cc
md5sum dist/index.js
```

---

## RELATED CONTEXT FILES

- `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Active Context/KRAKEN_SHARK_FIREWALL_ENGINEERING_CONTEXT.md`
- `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Active Context/CONTAINER_TESTING_TUI_ONLY.md`
- `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Container Testing Context/`
- `/home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/` (v4.7 source reference)
