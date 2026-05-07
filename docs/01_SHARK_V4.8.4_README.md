# Shark Agent v4.8.4 — V3-HOTFIX
## Comprehensive Documentation

**Version:** 4.8.4-v3-hotfix
**Bundle:** `dist/index.js` (~680KB, 129 modules, ESM)
**Build Date:** 2026-05-07
**Status:** SHIP READY — Verified in container

---

## WHAT IS SHARK?

### Shark is a LINEAR SINGLE AGENT

Shark is **NOT**:
- An orchestrator
- A multi-agent coordinator
- A delegator or spawner of sub-agents
- A replacement for Kraken or Manta agents

Shark **IS**:
- A single linear execution agent with triple-brain architecture
- Specialized for autonomous BUILD + TEST operations
- Enforcing mechanical gate verification
- Self-contained with no external agent dependencies

### Triple-Brain Structure

Shark uses three specialized brains working in sequence:

1. **Planning Brain** (`shark-plan-brain`) — Task decomposition and gate planning
2. **Execution Brain** (`shark-execution-brain`) — Building and testing with mechanical verification
3. **System Brain** (`shark-system-brain`) — Quality enforcement and gate advancement

The brains work **linearly** — no parallel execution, no sub-agent spawning.

---

## FIREWALL ARCHITECTURE

### Overview

Shark's firewall is a multi-layer enforcement system that blocks theatrical verification, laundering, and quality gate bypass attempts. The firewall operates **exclusively on Shark agents** — Kraken and Manta agents pass through unchanged.

### Layer Structure

| Layer | Name | Purpose |
|-------|------|---------|
| L0 | Identity Wall | Blocks non-initialized brain from dangerous operations |
| L1 | Theatrical Counting | Detects pipe-to-wc, pipe-to-tee theatrical verification |
| L2 | Test Bypass | Blocks direct test runner invocation (npm test, jest, etc.) |
| L3 | Source Inspection | Blocks file-existence checks as verification substitutes |
| L4 | Wrong Container | Blocks incorrect container command patterns |
| L5.1 | Host Fallback | Blocks host-testing-as-container excuses |
| L5.2 | Success Claim | Blocks unverifiable success claims |
| L5.3 | Model Restriction | Blocks model-limitation excuses |
| L5.4 | Mock/Stub Data | Blocks mock data substitution claims |
| L5.5 | Oversimplification | Blocks hand-waving complexity |
| L5.6 | Confusion Pretense | Blocks hedging language |
| L5.7 | Scope Creep | Blocks scope expansion attempts + cross-agent tools |
| L5.8 | Undermining | Blocks quality gate devaluation |
| L5.9 | Impatience | Blocks rushing/skipping verification |
| L5.10 | Self-Reference | Blocks self-verification claims |

### Contextual Gate Enforcement

The firewall differentiates behavior based on current build gate:

| Rule | Plan/Build Gate | Test/Verify/Audit/Delivery Gate |
|------|-----------------|----------------------------------|
| Theatrical Counting (`wc -l`) | ALLOWED (Discovery) | BLOCKED |
| Fake Test Runners | ALLOWED (Setup) | BLOCKED |
| Source Inspection | ALLOWED (Audit) | BLOCKED |
| Container Commands | BLOCKED | BLOCKED |

---

## HOOK SCOPING EXPLANATION

### Agent Type Detection

Shark uses `isSharkAgent()` to detect Shark agents:
```typescript
function isSharkAgent(agentName: string | undefined): boolean {
  if (!agentName) return false;
  if (SHARK_AGENTS.has(agentName)) return true;  // 'shark'
  if (agentName.startsWith('shark_')) return true;  // 'shark_v2', etc.
  return false;
}
```

### Which Hooks Affect Which Agents

| Hook | Shark | Kraken | Manta | Vanilla |
|------|-------|--------|-------|---------|
| `event` (session) | Full processing | Clear state, return early | Clear state, return early | N/A |
| `chat.message` | Sets agent state | Ignored | Ignored | Ignored |
| `command.execute.before` | Full firewall + L0-L5 | Cross-agent tools only | Cross-agent tools only | None |
| `tool.execute.before` | Full firewall + L0-L5 | Cross-agent tools only | Cross-agent tools only | None |
| `experimental.chat.messages.transform` | Full L5 anti-derailment | Ignored | Ignored | Ignored |
| `tool.execute.after` | Gate advancement | None | None | None |
| `experimental.session.compacting` | Compaction survival | None | None | None |

### Critical: L0 Logic (v3-hotfix fix)

The v3-hotfix corrected inverted L0 logic:

```typescript
// v3 BROKEN (blocked NON-Shark, allowed Shark bash):
if (DANGEROUS_TOOLS.has(tool)) {
  if (!isShark) { throw "[L0 BLOCKED]"; }
}

// v3-hotfix CORRECT (blocks Shark dangerous tools):
if (isShark && DANGEROUS_TOOLS.has(tool)) {
  throw new Error(`[L0 BLOCKED] Dangerous tool denied for Shark agent: ${tool}`);
}
```

### Cross-Agent Tool Blocking

L5.7 cross-agent tool blocking applies to **ALL agents** (not just Shark):
```typescript
// This check runs for ALL agents (Shark, Kraken, Manta)
checkCrossAgentTools(tool);  // Blocks hermes_*, hive_*, mem* tools
```

This prevents any agent from using inter-agent communication tools that don't exist in the Shark context.

---

## COMPLETE HOOK AGENT SCOPE MATRIX

### Hook: `event` (session-hook.ts)
- **Shark:** Full lifecycle handling (session.created, session.ended)
- **Kraken/Manta:** Clear state, return early
- **File:** `src/hooks/v4.1/session-hook.ts:40-43`

### Hook: `chat.message` (chat-message-hook.ts)
- **Shark:** Sets current agent state
- **Kraken/Manta:** Ignored
- **File:** `src/hooks/v4.1/chat-message-hook.ts:17-19`

### Hook: `command.execute.before` (guardian-hook.ts)
- **Shark:** Full enforcement — contextual firewall, L0-L5, zone protection
- **Kraken/Manta:** Only L5.7 cross-agent tool check
- **File:** `src/hooks/v4.1/guardian-hook.ts:2904-2979`

### Hook: `tool.execute.before` (guardian-hook.ts)
- **Shark:** Full enforcement — contextual firewall, L0-L5, zone protection
- **Kraken/Manta:** Only L5.7 cross-agent tool check
- **File:** `src/hooks/v4.1/guardian-hook.ts:2904-2979`

### Hook: `experimental.chat.messages.transform` (messages-transform-hook.ts)
- **Shark:** Full L5 anti-derailment enforcement
- **Kraken/Manta:** Ignored
- **File:** `src/hooks/v4.1/messages-transform-hook.ts:140-159`

### Hook: `tool.execute.after` (tool-summarizer-hook.ts + gate-hook.ts)
- **Shark:** Tool result summarization + gate advancement
- **Kraken/Manta:** None

### Hook: `experimental.session.compacting` (compacting-hook.ts)
- **Shark:** Compaction survival context injection
- **Kraken/Manta:** None

### Hook: `experimental.chat.system.transform` (system-transform-hook.ts)
- **Shark:** System prompt transformation
- **Kraken/Manta:** None

---

## ALL FIREWALL LAYERS AND THEIR SCOPE

| Layer | File | Agent Scope | Tool Gate | Applies To |
|-------|------|-------------|-----------|------------|
| L0_IDENTITY | l0-identity.ts | Shark only | SYSTEM, WRITE | Non-Shark blocked from dangerous ops |
| L1_THEATRICAL | l1-theatrical.ts | Shark only | bash, terminal | INSPECT operations |
| L2_TEST_BYPASS | l2-test-bypass.ts | Shark only | bash, terminal, node | TEST operations |
| L3_INSPECTION | l3-inspection.ts | Shark only | bash, terminal | INSPECT operations |
| L4_CONTAINER | l4-container.ts | Shark only | bash, terminal | CONTAINER operations |
| L5.1_HOST_FALLBACK | l5.1-host-fallback.ts | Shark only | shark-gate, bash, write_file | ALL operations |
| L5.2_SUCCESS_CLAIM | l5.2-success-claim.ts | Shark only | shark-gate, write_file | ALL operations |
| L5.3_MODEL_RESTRICTION | l5.3-model-restriction.ts | Shark only | (none) | ALL operations |
| L5.4_MOCK_STUB | l5.4-mock-stub.ts | Shark only | (none) | ALL operations |
| L5.5_SIMPLIFICATION | l5.5-simplification.ts | Shark only | (none) | ALL operations |
| L5.6_CONFUSION | l5.6-confusion.ts | Shark only | (none) | ALL operations |
| L5.7_SCOPE_CREEP | l5.7-scope-creep.ts | Shark only + ALL for cross-agent | shark-gate, write_file | ALL operations |
| L5.8_UNDERMINING | l5.8-undermining.ts | Shark only | (none) | ALL operations |
| L5.9_IMPATIENCE | l5.9-impatience.ts | Shark only | shark-gate | ALL operations |
| L5.10_SELF_REFERENCE | l5.10-self-reference.ts | Shark only | (none) | ALL operations |

---

## INSTALLATION INSTRUCTIONS

### Prerequisites
- OpenCode 1.14.29+
- Node.js 18+
- Bun runtime (for building)

### Deploy Bundle

```bash
# 1. Copy bundle to plugin directory
mkdir -p /home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent/dist
cp ship-package-v3-hotfix/dist/index.js /home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent/dist/

# 2. Configure opencode.json
cat > /home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent/opencode.json << 'EOF'
{
  "plugin": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent/dist/index.js"
  ],
  "agent": {
    "shark": {
      "color": "#228B22",
      "mode": "primary",
      "hidden": false
    }
  }
}
EOF
```

### Container Deployment

```bash
# Build bundle
cd /path/to/Shark_Agent_v4.8.4
bun run build
cp dist/index.js ship-package-v3-hotfix/dist/index.js

# Deploy to container
SNAP=$(mktemp -d -p /tmp snap.XXXX)
mkdir -p "$SNAP/config/plugins/shark/dist"
cp dist/index.js "$SNAP/config/plugins/shark/dist/"
cat > "$SNAP/config/opencode.json" << 'EOF'
{
  "plugin": ["file:///root/.config/opencode/plugins/shark/dist/index.js"],
  "agent": {
    "shark": {
      "color": "#228B22",
      "mode": "primary", 
      "hidden": false
    }
  }
}
EOF
docker run -d --rm -it --name shark-test \
  --entrypoint "" \
  -v "$SNAP/config:/root/.config/opencode" \
  opencode-test:1.14.29 \
  /bin/sh -c 'opencode --agent shark'
```

---

## TESTING INSTRUCTIONS

### Container Test Commands

```bash
# Test 1: Agent Identity
opencode --agent shark
> who are you
Expected: "Shark · Big Pickle"

# Test 2: L0 Block (dangerous tools)
> echo test | wc -l
Expected: "[L0 BLOCKED] Dangerous tool denied for Shark agent: bash"

# Test 3: L5.2 Success Claim
> The pass rate is 95%. Tests all passed.
Expected: Blocked with "L5.2 territory" message

# Test 4: L5.11 Laundering
> 10/12 passed summary
Expected: Blocked with "success without proof" message

# Test 5: Shark status
> shark-status
Expected: Brain: unknown, Gate: plan
```

### Verify Bundle Agent Scoping

```bash
# Check L0 logic in bundle (should show isShark && DANGEROUS_TOOLS)
grep -n "isShark && DANGEROUS_TOOLS" dist/index.js

# Verify cross-agent tools check runs for all agents
grep -n "checkCrossAgentTools" dist/index.js

# Verify isShark guard structure
grep -A5 "const isShark" dist/index.js | head -20
```

---

## ARCHITECTURE CONSTRAINTS

### Shark MUST NOT

1. ❌ Orchestrate other agents
2. ❌ Spawn sub-agents
3. ❌ Delegate tasks to Kraken/Manta
4. ❌ Use inter-agent communication tools (hermes_*, hive_*, mem*)
5. ❌ Claim success without container test evidence
6. ❌ Use theatrical verification (wc -l, file existence checks)
7. ❌ Modify source files during verify/audit/delivery gates
8. ❌ Skip container testing

### Shark CAN

1. ✅ Execute build/test commands in container
2. ✅ Advance through gates with mechanical proof
3. ✅ Use shark-* tools (shark-gate, shark-status, shark-evidence)
4. ✅ Read/write to SANDBOX zone only
5. ✅ Compact context while maintaining build continuity

### Non-Shark Agents (Kraken/Manta)

- ✅ Pass through firewall unchanged (except L5.7 cross-agent tools)
- ✅ Use all available tools
- ✅ Orchestrate and delegate normally
- ❌ Cannot use cross-agent tools (hermes_*, hive_*, mem*)

---

## SELF-CONTAINED VERIFICATION

### Dependencies

The bundle is self-contained with these characteristics:

| Dependency | Status | Notes |
|------------|--------|-------|
| `@opencode-ai/plugin` | Peer dependency | Must be installed by host |
| `effect` | Bundled | Included in bundle |
| `zod` | Bundled | Included in bundle |
| Node.js built-ins | Bundled | path, fs, crypto, etc. |

### Bundle Size

- **Size:** ~680KB
- **Modules:** 129
- **Format:** ESM

### No External Dependencies at Runtime

The bundle includes all required code. The only peer dependency is `@opencode-ai/plugin` which provides the plugin interface types.

---

## PACKAGE CONTENTS

| File | Purpose |
|------|---------|
| `dist/index.js` | Bundled plugin (ESM) |
| `package.json` | Package configuration |
| `README.md` | This file |
| `VERSION_HISTORY.md` | Version tracking and rollback procedures |
| `COMPACTION_SURVIVAL.md` | Context persistence across compactions |
| `BUILD_LOG.md` | Engineering history and fixes |
| `DEBUG_LOG.md` | Adversarial testing and failures |
| `T2_clean_slate/` | A-priori build prompts for full restore |
| `opencode.json.example` | Deployment template |

---

## VERSION RELATIONSHIP

```
V2 (Anti-Laundering Foundation)
    ↓
V3 (Full Intelligent Firewall) ← BROKEN L0 logic
    ↓
V3-HOTFIX (Critical L0 fix) ← CURRENT STABLE
```

---

**Last Updated:** 2026-05-07
**Status:** SHIP READY ✅
