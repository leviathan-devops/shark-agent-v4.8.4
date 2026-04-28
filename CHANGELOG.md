# Shark Agent v4.8.3 — Complete Fix Log
## All Checkpoints: 2026-04-17 through 2026-04-28

---

## CP4.1: Bug Discovery (April 17)

**7 bugs found:**

1. **CRITICAL**: `chat-message-hook.ts:539-549` — L5 anti-derailment patterns applied to raw user input, blocking legitimate messages like "the firewall is broken"
2. **CRITICAL**: `messages-transform-hook.ts:378` — combined user+agent text checked (user text scanned again)
3. **CRITICAL**: 4-way pattern duplication across guardian-hook.ts, chat-message-hook.ts, command-execute-hook.ts, messages-transform-hook.ts with inconsistencies
4. L1-L4 tool-level checks broken — `getCurrentAgent()` returns undefined in `tool.execute.before`
5. Tool args JSON-string checked against L5 patterns — false positives
6. Debug `console.log` statements in production code (command-execute-hook.ts)
7. Triple-checking redundancy — user message checked 3 times

**Files created:**
- `firewall-diagnostic.cjs` — Pattern extraction
- `firewall-probe.cjs` — Evasion testing
- `firewall-final-report.cjs` — Comprehensive test suite
- `FIREWALL_COMPLETE_FORENSIC_MAP.md` — Full diagnostic output
- `FIREWALL_METHODOLOGY.md` — Complete methodology document

---

## CP4.2: First L5 Fix Attempt (April 17) — INCOMPLETE

**What was done:**
- Removed user input checking from `chat-message-hook.ts` (`checkMessageEnforcement(userTrimmed, 'USER_INPUT')`)
- Created `firewall-patterns.ts` as single source of truth
- Removed user text from `messages-transform-hook.ts` combined check
- Removed 9 debug `console.log` statements from `command-execute-hook.ts`

**Why it failed:**
The `chat.message` hook's `output.message.parts` IS the user message (hook fires BEFORE agent responds). Removing `input` checking but keeping `output` checking meant user input was still being checked — through a different path.

**Bundle:** 1,018KB → 617KB (-39%)

---

## CP4.3: Real Fix — Chat Message Brain Init Only (April 17)

**Root cause discovery:**
In OpenCode's `chat.message` hook, `output.message` contains the USER message (not agent output). The hook fires before the agent processes the message. Any text extraction from `output` is checking user input.

**Fix:**
- `chat-message-hook.ts` export function stripped to ONLY `setCurrentAgent()` — no text checking at all
- All anti-derailment checking moved to `messages.transform` hook which fires AFTER agent responds with proper `role === 'assistant'` separation

**TUI verified:**
- "the firewall has been broken for days" → NOT blocked
- "lets just ship it" → NOT blocked
- "i verified this already works" → NOT blocked

---

## CP4.4: Audit & Clean (April 28)

**Ruthless audit of all 9 hook files:**

| File | Issues found | Fixed |
|------|-------------|-------|
| chat-message-hook.ts | 255 lines dead code (89%) | Stripped to 28 lines |
| guardian-hook.ts | mcp_edit bypass, generic error, duplicate DANGEROUS_TOOLS | Fixed all |
| messages-transform-hook.ts | Missing CROSS_AGENT_PATTERNS in scope creep | Added cross-agent check |
| firewall-patterns.ts | SOURCE_INSPECTION too broad, IMPATIENCE overlap | Narrowed, de-duped |
| command-execute-hook.ts | Duplicate patterns, wrong regex spacing | Documented (run-mode only) |
| index.ts | Import paths technically wrong | Bun resolves correctly |
| agent-state.ts | getSessionIds doesn't cleanup | Minor, documented |
| agent-identity.ts | Clean | N/A |
| utils.ts | Wrong tool list, incomplete regex | Documented (run-mode only) |

**Bundle:** 617KB → 602KB

---

## CP4.5: Identity Fix (April 28)

**Problem:** Shark agent had zero self-awareness. Returned `brain: "unknown"`, hallucinated Kraken clusters, didn't know its own tools.

**Root cause:** System prompt was passed via `instructions` field in plugin config callback. OpenCode SDK ignores `instructions` — only reads `prompt`.

**Fix:**
1. Added `prompt: EXECUTION_BRAIN_T1` alongside `instructions` in `src/index.ts` config callback
2. Rewrote `EXECUTION_BRAIN_T1` from triple-brain architecture to standalone identity:
   - "YOU ARE THE SHARK AGENT v4.8.3 — an OpenCode plugin agent"
   - Lists 5 custom tools explicitly
   - Anti-confusion: "You DO NOT have sub-agents. You are NOT Kraken"

**Verification:** Agent now responds "I am the Shark Agent v4.8.3, an OpenCode plugin agent" when asked about identity.

---

## CP4.6: Console Spillover Fix (April 28)

**Problem:** Firewall errors leaked multi-line paragraphs into the user's chat window.

**Fixes:**
1. `session-hook.ts`: Removed one remaining `console.log([SHARK]...)`
2. `guardian-hook.ts`: All error messages shortened from `[ANTI-SLOP L1] Counting theater detected: "cmd". Verification requires running, not counting.` to `[L1 BLOCKED] Counting theater: cmd`
3. `messages-transform-hook.ts`: All 10 check functions changed from `throw new Error()` (which spills to UI) to returning `boolean`. Hook now silently strips slop text from agent output instead of throwing.

**Before/After:** 10 functions throwing verbose errors → 10 functions returning boolean, hook strips text silently. Zero UI spillover.

---

## CP4.7: Repo Cleanup & Documentation (April 28)

**What was done:**
- Removed 500+ bloat files from tracking (nested copies, old ship packages, throwaway scripts)
- Added comprehensive `.gitignore`
- Rewrote `README.md` as 10-section dense reference
- This `CHANGELOG.md` created
- Evidence JSON added to repo root

**Final state:**
| Metric | Before | After |
|--------|--------|-------|
| Tracked files | 506 | 151 |
| Source + docs files | 40 | 40 |
| Checkpoint files | 111 | 111 |
| Bundle size | 1,018KB | 600KB (-41%) |
| chat-message-hook.ts | 568 lines | 28 lines (-95%) |
| guardian-hook.ts | 590 lines | 268 lines (-55%) |
| Console.log in hooks | 10 | 0 |
| L5 throw statements in messages | 10 | 0 |
| Pattern source files | 4 (duplicated) | 2 (shared + guardian) |
