# SHARK AGENT FIREWALL AUDIT — 2026-04-10 EVENING

## STATUS: V4.8.2 RESTORED — V4.8.3 OVER-BLOCKING IDENTIFIED

## WHAT HAPPENED

v4.8.3 was deployed today with L5 firewalls that were severely miscalibrated. They blocked normal work operations while failing to catch actual derailment patterns.

## KEY DISCOVERIES

### 1. buildTextToCheck INCLUDES WRONG TEXT
- **Problem**: `buildTextToCheck()` was concatenating `agentMessage` + `toolArgs` + `output`
- **Issue**: `agentMessage` comes from chat.message hook which stores USER's message
- **Result**: User says "use hermes_remember" → L5.7 blocks immediately
- **Evidence**: Every test triggering L5.7 showed user message in agentStatement

### 2. L5.7 PATTERNS TOO BROAD
- Pattern: `/hermes_remember|hermes_recall|hermes_context/i`
- **Issue**: ANY mention of tool name triggers block, not just tool USE
- **Result**: 
  - User instructions blocked
  - Mentions in SPEC.md blocked
  - Project context mentions blocked

### 3. plan-gate MISSING project-spec.json GENERATION
- Gate criteria REQUIRES project-spec.json in evidenceRequired
- **NO TOOL CREATES IT**
- Agent stuck in plan gate unable to advance

### 4. SHIP APPROVED Directory Block ADDED WITHOUT EVIDENCE SYSTEM
- Guardian now blocks writes to "SHIP APPROVED" paths
- Requires `.shark/evidence/ship/ContainerTestResult.json`
- **NO EVIDENCE COLLECTION EXISTS FOR SHIP GATE**

### 5. L5.1/L5.2/L5.10 OVER-BLOCKING
| Layer | What Triggered It | Why Wrong |
|-------|------------------|-----------|
| L5.1 | "host already proves" | Host mention in ANY context |
| L5.2 | "Unverified success assertion" | Normal file write operations |
| L5.10 | "Agent claiming self-verification" | Basic status checks |

### 6. L5 LAYERS NOT TESTED/IMPLEMENTED
- L5.2, L5.4, L5.5, L5.6, L5.8, L5.9, L5.10 - exist in code but not calibrated

## FIREWALL FAILURE MODES

### False Positives (BLOCKING LEGITIMATE WORK)
1. hermes_remember mentions → blocked even when user instructs to use it
2. "host" in any context → blocked (should only block host substitution attempts)
3. File write operations → L5.2 success claim blocks
4. Status checks → L5.10 self-reference blocks

### False Negatives (MISSING ACTUAL DERAILMENT)
1. Models re-phrase derailment to bypass patterns
2. Pattern matching too literal
3. No behavioral analysis

## FILES AT RISK

```
/home/leviathan/OPENCODE_WORKSPACE/plugins/shark-v482/dist/index.js (v4.8.2 - WORKING)
  - Restored: 1e4e30d23eb869b496f51d2563715c3c

/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/dist/index.js (v4.8.3 - BROKEN)
  - Contains over-blocking L5 firewalls
  
/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/SHIP APPROVED /v2.8.3/dist/index.js
  - Should be for SHIP PASSED only
```

## REQUIRED FIXES (PRIORITY ORDER)

### P1: Fix buildTextToCheck in L5.7
```
ONLY check toolArgs (what agent is trying to DO)
NOT: agentMessage (user input), output (results)
```

### P2: Implement project-spec.json generation
```
When PLAN gate creates SPEC.md, also create:
.shark/project-spec.json with {projectName, allowedTools, forbiddenTools, scopeBoundaries}
```

### P3: Fix L5.7 pattern matching
```
Only block ACTUAL TOOL CALLS, not mentions
Check if tool name appears in toolArgs.tool specifically
```

### P4: Implement SHIP gate evidence system
```
Create ship evidence collection hook
Generate .shark/evidence/ship/ContainerTestResult.json on ship gate pass
```

### P5: Calibrate all L5 layers
```
Test each layer independently
Define clear triggers vs false positive triggers
```

### P6: Memory audit (CHECKPOINT 2)
```
tool-summarizer-hook.ts - compress grep/ls/read outputs
sliding-window-hook.ts - bounded history
Rewrite compacting-hook.ts to PRUNE not INJECT
```

## NEXT STEPS

1. Work on v4.8.2 source: `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/`
2. Apply fixes incrementally
3. Test each fix BEFORE moving to next
4. Build and deploy from projects/shark-agent-v4, not SHIP APPROVED
5. SHIP APPROVED = only for plugins that passed ship gate