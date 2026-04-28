# SHARK AGENT v4.8.3 — DEBUG LOG

## Session Notes (2026-04-10 Evening)

### PROBLEM IDENTIFIED
L5.7 scope creep was blocking ANY mention of cross-agent tools, not just actual tool USE. This caused:
- User instructions containing "hermes_remember" → blocked
- SPEC.md mentions of cross-agent tools → blocked
- Normal knowledge storage operations → blocked

### ROOT CAUSE
`buildTextToCheck()` was concatenating:
- `agentMessage` (user's message via chat.message hook)
- `toolArgs` (what agent is trying to do)
- `output` (results)

Should only check `toolArgs` since that's what agent is actually EXECUTING.

### FIREWALL MISBEHAVIORS OBSERVED
| Firewall | Trigger | Should Block |
|----------|---------|--------------|
| L5.1 | "host" anywhere | Only host substitution |
| L5.2 | Normal operations | Only unverified success claims |
| L5.7 | "hermes_remember" mention | Only actual cross-agent tool calls |
| L5.10 | Status checks | Never |

### RESTORATION
- v4.8.2 restored from `/home/leviathan/OPENCODE_WORKSPACE/plugins/shark-v482/dist/index.js`
- MD5: 1e4e30d23eb869b496f51d2563715c3c

## Files Changed But Not Shipped
- src/hooks/v4.1/anti-derailment/sub-layers/l5-7-scope-creep.ts (modified but source corrupted)
- src/shared/gates.ts (modified with ship gate)
- src/hooks/v4.1/agent-state.ts (modified with escape hatch)

## Next Actions for v4.8.4
1. Fix buildTextToCheck to only use toolArgs
2. Implement project-spec.json generation in plan gate
3. Fix L5.7 pattern matching (check actual tool call, not mentions)
4. Memory audit (CHECKPOINT 2)