# SHARK AGENT v4.8.3 — CHANGELOG

## v4.8.3 (2026-04-10)

### ADDED
- **L5 Anti-Derailment System** (11 layers)
  - L5.1 Host Fallback — blocks "host already proves"
  - L5.2 Success Claim — blocks unverified success claims
  - L5.3 Model Restriction — blocks GLM/DeepSeek usage
  - L5.4 Mock/Stub — blocks mock test attempts
  - L5.5 Simplification — blocks "too complex" derailment
  - L5.6 Confusion — blocks confusion pretense
  - L5.7 Scope Creep + CROSS-AGENT — blocks cross-agent tool use
  - L5.8 Undermining — blocks firewall criticism
  - L5.9 Impatience — blocks "too slow" derailment
  - L5.10 Self-Reference — blocks self-verification claims
  - L5.11 Common Sense — blocks logic disconnects

### CHANGED
- Guardian hook now blocks SHIP APPROVED directory writes without ship evidence
- Plan gate now validates project-spec.json existence
- L5.7 now reads project-spec.json for allowedTools

### FIXED
- Slop firewall patterns narrowed (was blocking ls, grep, wc)
- agentMessage properly passed to L5 checker

### KNOWN ISSUES
- L5.7 over-blocking (blocked mentions, not just tool calls) — FIXED in v4.8.4
- buildTextToCheck included user messages — FIXED in v4.8.4
- Memory audit pending (CHECKPOINT 2)