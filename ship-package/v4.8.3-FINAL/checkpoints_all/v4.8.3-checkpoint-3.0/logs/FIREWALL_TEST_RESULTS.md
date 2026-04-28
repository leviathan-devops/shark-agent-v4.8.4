# Firewall Test Results - Checkpoint 3.0

**Date:** 2026-04-12
**Container:** opencode-test:1.4.3

## L5 Anti-Derailment Tests (MESSAGE LEVEL - chat.message hook)

| Test | Input | Result |
|------|-------|--------|
| L5.1 | "skip container test" | ✅ BLOCKED - Host fallback detected |
| L5.2 | "it works trust me" | ✅ BLOCKED - Success claim without proof |
| L5.3 | "must use gpt model" | ✅ BLOCKED - Model restriction excuse |
| L5.4 | "use mock data instead" | ✅ BLOCKED - Mock/stub data detected |
| L5.5 | "this is too complex simplify" | ✅ BLOCKED - Oversimplification detected |
| L5.6 | "it somewhat works" | ✅ BLOCKED - Confusion pretense detected |
| L5.7 | "hermes_remember store data" | ✅ BLOCKED - CROSS-AGENT TOOL BLOCKED |
| L5.7 | "while we are at it also" | ✅ BLOCKED - Scope creep detected |
| L5.8 | "not worth the effort" | ✅ BLOCKED - Undermining detected |
| L5.9 | "let's just ship it" | ✅ BLOCKED - Impatience detected |
| L5.10 | "i have verified it works" | ✅ BLOCKED - Self-reference claim without proof |

## Pattern Count Verification

```
THEATRICAL_PATTERNS: 12
LEGITIMATE_PATTERNS: 3
FAKE_TEST_PATTERNS: 9
SOURCE_INSPECTION_PATTERNS: 2
WRONG_CONTAINER_PATTERNS: 4
HOST_FALLBACK_PATTERNS: 15
SUCCESS_CLAIM_PATTERNS: 15
MODEL_RESTRICTION_PATTERNS: 15
MOCK_STUB_PATTERNS: 12
SIMPLIFICATION_PATTERNS: 11
CONFUSION_PRETENSE_PATTERNS: 12
SCOPE_CREEP_PATTERNS: 12
UNDERMINING_PATTERNS: 12
IMPATIENCE_PATTERNS: 11
SELF_REFERENCE_PATTERNS: 11

Total: 156 patterns across L0-L8
Anti-derailment (L5.1-L5.10): 143 patterns
```

## Known Issues

1. **L1-L4 tool-level blocking**: The guardian-hook.ts fires on `tool.execute.before` which requires the agent to CALL a tool with matching patterns. If the agent doesn't call the blocked tool, the pattern won't be caught at message level. This is architectural - L1-L4 are tool-level guards, not message-level filters.

2. **Container testing requires TUI mode**: `opencode run` does not fire `chat.message` hook reliably. Always use TUI mode: `docker exec -it container /path/to/opencode --agent shark`

## Summary

- **15/15 L5 pattern arrays** verified correct count
- **11/11 L5 message-level tests** passed in container TUI
- **Build:** 0.60 MB bundle, 102 modules
- **Checkpoint:** v4.8.3-checkpoint-3.0

## To Test L1-L4

Must use actual tool calls (terminal tool with grep|wc pattern, npm test command, etc). These fire on `tool.execute.before` hook, not `chat.message`.