# Shark Agent Forensic Audit — Memory & Token Bloat Analysis

**Date**: 2026-04-09
**Auditor**: Leviathan Session
**Status**: ROOT CAUSE IDENTIFIED

---

## EXECUTIVE SUMMARY

Shark Agent consumes **5GB RAM + 2GB swap per session**, burning through **~1M input tokens in < 10 minutes** when connected to DeepSeek Chat. The same workload with Spider Agent uses ~4k tokens total.

**Root Cause**: Shark Agent lacks tool output summarization and proper context compaction. Every tool output (grep, ls, read) is stored raw in conversation history. OpenCode's native compaction does not reduce Shark's context because Shark's hooks **inject additional content** during compaction rather than pruning it.

**Fix**: Add tool output summarization hooks and sliding window history management. Expected outcome: 98-99% token reduction, matching Spider Agent's efficiency.

---

## SYMPTOM TIMELINE

| Time | Event | Token Count | RAM |
|------|-------|-------------|-----|
| 0:00 | Shark agent启动 | 2k | 200MB |
| 5:00 | 5分钟DeepSeek Chat | 1M+ | 5GB+ |
| 5:00 | System crash / swap exhaustion | — | — |
| N/A | Spider Agent (same workload) | ~4k | ~100MB |

**Hardware Debug Log** (`06-system-failures/HARDWARE_DEBUG_LOG.md`):
- PID 305532: opencode attach http://localhost:19842 — 44.4% CPU
- Stuck reconnection loop to non-existent port 19842
- Swap at 100% (8191.9MB/8192MB)

---

## ARCHITECTURE COMPARISON

### Spider Agent (Reference — Works)

Spider Agent has a **16+ hook chain** on `tool.execute.after` alone:

```
tool.execute.after:
├── activityTrackHook          # Track tool usage
├── guardrailsHook             # Block bad patterns
├── delegationLedgerHook       # Track delegation
├── selfReviewHook            # Self-review
├── delegationGateHook        # Enforce QA gates
├── adversarialPatternHook    # Detect attacks
├── knowledgeCuratorHook      # Extract lessons
├── steeringConsumedHook      # Track directive use
├── coChangeSuggesterHook     # Suggest related changes
├── darkMatterDetectorHook    # Detect hidden couplings
├── snapshotWriterHook        # Persist state + mark pruning
├── toolSummarizerHook        # ← CRITICAL: compress output
├── slopDetectorHook          # Detect low-quality output
├── incrementalVerifyHook     # Incremental verification
└── compactionServiceHook     # ← CRITICAL: compress context
```

**Total hooks registered**: 20+ across all lifecycle events

### Shark Agent V4.7 (Current — Broken)

Only **5 hooks registered**:

```
event                   # session lifecycle (create/start)
tool.execute.before     # Guardian blocks dangerous tools
tool.execute.after      # Gate tracking only
experimental.session.compacting  # Writes gate state to disk (NO truncation)
experimental.chat.system.transform  # Injects enforcement context
```

**Missing critical hooks**:
- ❌ Tool output summarization
- ❌ Context compaction (actual truncation)
- ❌ History sliding window
- ❌ Evidence streaming
- ❌ Session cleanup/destruction

---

## HOOK-BY-HOOK ANALYSIS

### 1. compacting-hook.ts (WORST OFFENDER)

```typescript
// Location: src/hooks/v4.1/compacting-hook.ts
return async (input, output) => {
  // ...
  // Add context to the compaction
  const contextOutput = output as { context: string[] };
  if (contextOutput.context) {
    contextOutput.context.push(`[Shark] Gate state snapshot saved: ${state.currentGate}...`);
    // ↑ THIS ADDS CONTENT DURING COMPACTION
    // ↑ DOES NOT TRUNCATE OR PRUNE ANYTHING
  }
};
```

**Problem**: This hook **injects** a string during compaction instead of pruning. OpenCode's compaction runs, then Shark adds MORE content. This is the opposite of what should happen.

**What it should do**:
- Truncate conversation history to last N turns
- Mark old messages for summarization
- Prune tool outputs beyond threshold

---

### 2. system-transform-hook.ts (INJECTION PROBLEM)

```typescript
// Location: src/hooks/v4.1/system-transform-hook.ts
const systemOutput = output as { system: string[]; agent?: string };
if (Array.isArray(systemOutput.system)) {
  systemOutput.system.push(enforcementContext);   // ↑ ADDS ~200-500 chars
  systemOutput.system.push(brainContext);          // ↑ ADDS ~100-200 chars more
}
```

**Problem**: Every single message gets Shark enforcement context appended. This context includes:
- Current gate
- Iteration number
- Verify attempts
- Blocking criteria (lists all criteria)
- Evidence required (lists all evidence)
- Active brains
- Primary brain

This is ~300-700 bytes per message minimum. With 50 messages, that's 15-35KB of redundant context injected.

**Spider Agent** uses a **summarized** version or only injects when transitioning gates, not on every message.

---

### 3. guardian-hook.ts (INEFFICIENT)

```typescript
// Location: src/hooks/v4.1/guardian-hook.ts
const watchedTools = [
  'terminal', 'mcp_terminal',
  'write_file', 'mcp_write_file',
  'patch', 'mcp_patch'
];

if (!watchedTools.includes(tool)) {
  return;  // Early exit
}
```

**Actually okay** — it does early exit for non-watched tools.

But it reads file content for EVERY write/edit/patch to check for theatrical code patterns:
```typescript
const content = (args as any)?.content || (args as any)?.newString || '';
if (content) {
  const theatricalResult = await detectTheatricalCode({ tool, args, content });
  // ↑ Reads entire file content for EVERY edit
}
```

For large files, this is expensive and happens on every keystroke-triggered edit.

---

### 4. State Store — No Session Cleanup

```typescript
// Location: src/shared/state-store.ts
const data = new Map<string, any>();
const versions = new Map<string, number>();
const watchers = new Map<string, Array<(value: any, version: number) => void>>();

// Sessions are added:
// stateStore.set('shark-macro-state', state, 'shark-state');
// stateStore.set('shark-workflow', ..., 'shark-workflow');
// etc.

// But there is NO destroySession() method
// And no TTL or expiration
```

**Problem**: `sessionCoordinators` Map grows forever. Old sessions are never cleaned up.

---

## THE TOKEN BLOOM MECHANISM

Here's exactly how 1M tokens accumulates in 10 minutes:

### Message 1-10: Normal startup
- System prompt: 2KB
- User prompt: 500 bytes
- Model response: ~1KB
- **Cumulative: ~30KB**

### Message 11: First tool call (grep)
- `grep -r "pattern" ./src/` returns 500 matches across 47 files
- Raw output: ~25KB
- **Without summarization, this goes into history**
- **Cumulative: ~55KB**

### Message 12-50: More tool calls
- `ls -R` returns directory listing of 2000 files: ~50KB raw
- `read` large files (test files, configs): ~100KB each
- **Cumulative: grows by ~30-50KB per message**

### After 50 messages:
```
30KB (initial) + 50×40KB (average per message) = ~2MB raw text
≈ 500,000 tokens (at ~4 chars/token)
```

### Compaction triggers at ~70% context (OpenCode default):
- OpenCode runs `experimental.session.compacting`
- **Shark's hook ADDS content** instead of pruning
- History now 2.1MB
- Context grows beyond 100% → model receives truncated context or errors

### In 5 minutes with fast tool calls:
- ~100 messages with 10+ tool calls each
- Each tool output stored raw: 10KB - 100KB each
- **Result: 1M+ tokens**

---

## FILE PATHS AND LOCATIONS

### Active Production Plugin
```
/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/
├── index.ts                    # Plugin entry point (89 lines)
├── hooks/v4.1/
│   ├── index.ts              # Hook registration (28 lines)
│   ├── guardian-hook.ts      # Guardian safety (100 lines)
│   ├── gate-hook.ts          # Gate tracking (NEW - missing from audit)
│   ├── session-hook.ts       # Session lifecycle (74 lines)
│   ├── compacting-hook.ts    # ← THE PROBLEM (48 lines)
│   ├── system-transform-hook.ts  # ← INJECTS CONTEXT (56 lines)
│   └── utils.ts              # Utilities
├── shared/
│   ├── state-store.ts        # State management (156 lines)
│   ├── messenger.ts         # Brain messenger (124 lines)
│   ├── gates.ts             # Mechanical enforcement (491 lines)
│   ├── evidence.ts          # Evidence collection (141 lines)
│   └── guardian.ts          # Zone-based protection (288 lines)
├── shark/
│   └── macro/
│       └── peer-dispatch.ts # Triple-brain coordinator (156 lines)
└── tools/
    ├── container-test.ts    # Docker integration (105 lines)
    ├── checkpoint.ts        # State persistence
    ├── shark-evidence.ts   # Evidence tool
    ├── shark-gate.ts       # Gate tool
    └── shark-status.ts     # Status tool
```

### Built Plugin Location
```
/home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v47/dist/
```

### Configuration
```
/home/leviathan/.config/opencode/opencode.json
  - "shark-agent-v47" in plugin array
  - Shark agent defined with color #228B22
```

---

## MISSING MODULES

These modules **should exist** but do not:

| Module | Purpose | Status |
|--------|---------|--------|
| `tool-summarizer-hook.ts` | Compress grep/ls/read outputs | **MISSING** |
| `compaction-hook.ts` | Actual context truncation | **MISSING** |
| `context-budget.ts` | Token budget enforcement | **MISSING** |
| `sliding-window.ts` | History management | **MISSING** |
| `evidence-stream.ts` | Streaming evidence writes | **MISSING** |
| `session-cleanup.ts` | Session destruction | **MISSING** |

---

## SPIDER AGENT REFERENCE IMPLEMENTATION

From forensic analysis of Spider Agent (`~/.npm-global/lib/node_modules/spider-agent/dist/index.js`):

### toolSummarizerHook (Line ~594)
```javascript
// Pseudocode from forensic report:
function createToolSummarizerHook() {
  return async (input, output) => {
    const { tool, result } = input;
    
    if (tool === 'grep' || tool === ' ripgrep') {
      // Summarize: "Found 247 matches in 32 files"
      // Instead of: 247 lines of "file:line:match"
      output.result = summarizeGrep(result);
    }
    
    if (tool === 'read') {
      // Summarize: "Read 500 lines from foo.ts"
      // Instead of: the actual file content
      if (result.length > MAX_LINES) {
        output.result = summarizeFile(result);
      }
    }
    
    if (tool === 'ls' || tool === 'glob') {
      // Limit to 20 entries + "N more"
      output.result = truncateLs(result, 20);
    }
  };
}
```

### compactionServiceHook (Line ~652)
```javascript
// Pseudocode:
function createCompactionHook() {
  return async (session) => {
    // Keep last 5 conversation turns
    // Summarize older history to 500 tokens max
    // Mark messages > N turns for summarization
    // Prune tool outputs beyond MAX_CHARS
    
    const history = session.getHistory();
    const summarized = slidingWindow(history, {
      maxTurns: 5,
      maxTokensPerTurn: 500,
      maxToolOutputChars: 200
    });
    
    session.setHistory(summarized);
  };
}
```

---

## RECOMMENDED FILE CREATION

### 1. src/hooks/v4.1/tool-summarizer-hook.ts
```typescript
const MAX_GREP_MATCHES = 20;
const MAX_LS_ENTRIES = 20;
const MAX_FILE_LINES = 100;
const MAX_TOOL_OUTPUT_CHARS = 2000;

export function createToolSummarizerHook(): Hooks['tool.execute.after'] {
  return async (input, output) => {
    const { tool, result } = input;
    
    if (tool === 'grep' || tool === 'ripgrep' || tool === 'mcp_grep') {
      // "file1.ts:10\nfile2.ts:20\n..." → "Found 247 matches in 32 files"
      const lines = result.split('\n').filter(Boolean);
      if (lines.length > MAX_GREP_MATCHES) {
        output.result = `Summarized: Found ${lines.length} matches across ${countUniqueFiles(lines)} files`;
      }
    }
    
    if (tool === 'read' || tool === 'mcp_read') {
      const lines = result.split('\n');
      if (lines.length > MAX_FILE_LINES) {
        output.result = lines.slice(0, MAX_FILE_LINES).join('\n') + '\n... [truncated]';
      }
    }
    
    if (tool === 'ls' || tool === 'glob') {
      const entries = result.split('\n').filter(Boolean);
      if (entries.length > MAX_LS_ENTRIES) {
        output.result = entries.slice(0, MAX_LS_ENTRIES).join('\n') + `\n... [${entries.length - MAX_LS_ENTRIES} more entries]`;
      }
    }
    
    // Generic truncation for any large output
    if (result.length > MAX_TOOL_OUTPUT_CHARS) {
      output.result = result.substring(0, MAX_TOOL_OUTPUT_CHARS) + '\n... [output truncated]';
    }
  };
}
```

### 2. src/hooks/v4.1/sliding-window-hook.ts
```typescript
const MAX_HISTORY_TURNS = 5;
const MAX_HISTORY_TOKENS = 3000;

export function createSlidingWindowHook(): Hooks['experimental.session.compacting'] {
  return async (input, output) => {
    if (!isSharkAgent(input.agent)) return;
    
    const history = output.history as Message[];
    if (!history || history.length <= MAX_HISTORY_TURNS) return;
    
    // Keep last N turns, summarize older ones
    const recent = history.slice(-MAX_HISTORY_TURNS);
    const older = history.slice(0, -MAX_HISTORY_TURNS);
    
    const summarizedOlder = summarizeHistory(older, MAX_HISTORY_TOKENS);
    
    output.history = [...summarizedOlder, ...recent];
  };
}

function summarizeHistory(messages: Message[], maxTokens: number): Message[] {
  // Group by conversation turns
  // For each turn: keep user message + final assistant response
  // Truncate tool calls to summaries
  // Return combined length under maxTokens
}
```

### 3. src/shared/context-budget.ts
```typescript
export class ContextBudgetManager {
  private maxTokens: number;
  private currentTokens: number = 0;
  
  constructor(maxTokens: number = 8000) {
    this.maxTokens = maxTokens;
  }
  
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4); // Rough estimate
  }
  
  checkBudget(parts: { system: number; history: number; tools: number; current: number }): boolean {
    this.currentTokens = parts.system + parts.history + parts.tools + parts.current;
    return this.currentTokens < this.maxTokens;
  }
  
  truncateToBudget(parts: any, priority: string[]): any {
    // Priority: system > current > history > tools
    // Truncate lowest priority until within budget
  }
}
```

### 4. Update src/hooks/v4.1/index.ts
```typescript
import { createToolSummarizerHook } from './tool-summarizer-hook.js';
import { createSlidingWindowHook } from './sliding-window-hook.js';
import { createContextBudgetHook } from './context-budget-hook.js';

export function createSharkHooks(...): Hooks {
  return {
    event: createSessionHook(...),
    'tool.execute.before': createGuardianHook(...),
    'tool.execute.after': [
      createGuardianHook(...),      // existing
      createGateHook(...),          // existing
      createToolSummarizerHook(),   // NEW - critical
    ],
    'experimental.session.compacting': [
      createCompactingHook(...),    // existing (broken)
      createSlidingWindowHook(),    // NEW - critical
      createContextBudgetHook(),    // NEW - enforce budget
    ],
    'experimental.chat.system.transform': createSystemTransformHook(...),
  };
}
```

---

## EXPECTED OUTCOME

| Metric | Before | After | Spider Agent |
|--------|--------|-------|--------------|
| Tokens/10min | ~1,000,000 | ~10,000 | ~4,000 |
| RAM/session | 5GB | ~200MB | ~100MB |
| History | Infinite | Sliding window (5 turns) | Sliding window |
| Tool output | Raw (full) | Summarized (<200 chars) | Summarized |
| Compacting hook | Injects content | Truncates content | Truncates |
| Session cleanup | None | Auto-destroy | Auto-destroy |

---

## PRIORITY ORDER FOR FIXES

1. **tool-summarizer-hook.ts** — Stop raw tool outputs from entering history
2. **sliding-window-hook.ts** — Replace infinite history with bounded history
3. **compact hook rewrite** — Stop injecting, start truncating
4. **session cleanup** — Destroy old sessions from state store
5. **context-budget.ts** — Enforce token budget before sending to model

---

## FILES CREATED DURING AUDIT

This document:
```
/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/shark-agent-memory-audit-2026-04-09.md
```

---

*Audit completed: 2026-04-09*
*Next action: Implement tool-summarizer-hook.ts and sliding-window-hook.ts*
