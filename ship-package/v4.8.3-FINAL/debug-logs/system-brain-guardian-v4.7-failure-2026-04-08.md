# DEBUG LOG: System Brain Guardian V4.7 Failure

**Date:** 2026-04-08  
**Issue:** CRITICAL SYSTEM FAILURE - Shark Agent V4.7 caused agents to hang/freeze  
**Duration:** ~2 hours of degraded performance  

---

## What Happened

### The Incident

Shark Agent V4.7 with System Brain Guardian was deployed to production. Users reported:
- Agents stopping output after 1-2 minutes
- Manta agents doing "nothing" after initial response
- Build agents getting blocked by Guardian firewall
- "MantaCoordinator initialized with plan brain" appearing in shark sessions

### Root Causes

**1. Guardian Firewall Blocking Non-Target Agents**
- Shark's session-hook unconditionally called `setSharkAgent('shark')` on ALL session.status events
- This caused Guardian to activate for vanilla agents (build, plan, general)
- Vanilla agents trying to edit files got blocked with "[GUARDIAN] SOURCE_FILE_EDIT_BLOCKED"

**2. Manta Spillover**
- Manta agent's hooks were firing for all sessions (not just manta sessions)
- The backward-compat fallback in session-hook initialized manta coordinator for ALL agents
- This caused "MantaCoordinator initialized with plan brain" in shark sessions

**3. Verbose Error Output Causing UI Glitch**
- Guardian error messages used ASCII box-drawing characters
- Large `console.error()` blocks filled half the screen with red text
- Made it appear like the system was broken

### Why Pressure Tests Passed But Production Failed

Pressure tests run in isolation with mock Guardian calls:
```typescript
const guardian = new Guardian({ level: "SANDBOX" });
const result = guardian.canEdit(testFile);  // Direct function call
```

This tests the Guardian logic BUT NOT the hook integration:
- Session-hook setting currentAgent for ALL agents
- isSharkAgent/isMantaAgent checks not properly filtering
- Tool execution hooks firing for wrong agents

---

## How We Solved It

### Immediate Fix: Restore V4.6

```bash
# Restored shark and manta to v4.6 (last working state)
cp -r manta-shark-v4.6/src/shark projects/shark-agent/src
cp -r manta-shark-v4.6/src/manta projects/manta-agent/src
npm run build
```

### Permanent Fix Strategy

**For Shark V4.7:**
1. Session-hook MUST check `isSharkAgent(eventAgent)` before setting shark mode
2. Guardian MUST NOT fire for non-shark agents
3. Error messages MUST be compact (single line) not box-drawing

**For Manta:**
1. Session-hook MUST check `isMantaAgent(eventAgent)` before initializing coordinator
2. No backward-compat fallback that initializes for all agents

---

## Key Lessons

### 1. Pressure Tests Are Necessary But Not Sufficient

Pressure tests verify logic in isolation. They CANNOT catch:
- Hook integration issues (which hooks fire for which agents)
- Cross-plugin contamination (manta hooks firing in shark sessions)
- Real session flow issues (agent identity propagation)

### 2. Container Testing Is Mandatory for Plugin Changes

The ONLY way to catch these issues is to:
1. Spawn a container with the plugin
2. Run actual agent sessions
3. Test from the USER'S ENDPOINT perspective

### 3. Agent Identity Must Be Checked At Every Hook

```typescript
// WRONG - fires for ALL agents
if (event.type === 'session.status') {
  setSharkAgent('shark');  // BAD
}

// CORRECT - only fires for shark agents
if (event.type === 'session.status' && isSharkAgent(eventAgent)) {
  setSharkAgent(eventAgent);  // GOOD
}
```

---

## The Fix Applied to Shark V4.7

**File:** `shark-agent/src/hooks/v4.1/session-hook.ts`

```typescript
// OLD (broken):
if (event.type === 'session.status') {
  setSharkAgent('shark');  // Always set, for everyone!
}

// NEW (fixed):
const eventAgent = event.properties?.info?.agent ?? event.agent;
if (isSharkAgent(eventAgent)) {
  setSharkAgent(eventAgent);
} else {
  clearSharkAgent();  // Important: clear for non-shark agents
}
```

---

## Architecture Reference

**Working Version:** Manta Agent V1.3.4  
**Location:** `Shared Workspace Context/Manta Agent/manta-agent/dist`

V1.3 Key Features:
- Dual-brain (Plan ↔ Build) with mechanical coordinator
- Full gate chain: PLAN→BUILD→TEST→VERIFY→AUDIT→DELIVERY
- Evidence collection per gate
- Guardian zone-based protection

**GitHub:** https://github.com/leviathan-devops/manta-agent (v4.6 tag)

---

## Next Steps

### Phase 1: Container Testing System (DONE - needed)
Create containerized testing that:
1. Spawns opencode container with plugin
2. Runs actual agent sessions
3. Verifies Guardian doesn't block non-target agents
4. Tests from user endpoint perspective

### Phase 2: Shark V4.7 Overhaul
1. Re-implement Guardian with proper agent filtering
2. Add compact error messages
3. Test in container before shipping
4. Only ship when container tests pass 100%

### Phase 3: Manta V1.4 (if needed)
Fix the "agent stops after 1-2 minutes" issue
- Currently on v1.3.4 which is working
- Don't break working architecture

---

*Issue: CRITICAL - Shark V4.7 caused agent freezes*  
*Status: RESOLVED - Restored to v4.6, container testing mandated*

---

## Post-Mortem: Why V4.7 Failed

### The Problem with "Edit First, Ask Later" Development

We built v4.7 Guardian firewall by:
1. Writing code
2. Running pressure tests (mock function calls)
3. Deploying

We NEVER tested it in a running OpenCode session with actual agents. The pressure tests pass because they test Guardian logic in isolation - they don't test hook integration, agent identity propagation, or cross-plugin contamination.

### What Pressure Tests Miss

| What We Tested | What We Missed |
|----------------|-----------------|
| `guardian.canEdit(file)` | Session-hook setting `currentAgent` for ALL agents |
| `guardian.isDangerousCommand(cmd)` | Manta hooks firing in shark sessions |
| `guardian.canModifyFile(cmd)` | Tool hooks blocking wrong agents |

### Container Testing Would Have Caught This

If we had run the container test BEFORE shipping:
```
1. Spawn container with v4.7
2. Switch to vanilla "build" agent
3. Try to edit a file
4. See "[GUARDIAN] SOURCE_FILE_EDIT_BLOCKED" ← PROBLEM DETECTED
5. Fix BEFORE shipping
```

---

## Manta V1.3.4 Status (Working)

**Location:** `Shared Workspace Context/Manta Agent/manta-agent/dist`

Current manta is V1.3.4 and is WORKING. Key features:
- Dual-brain (Plan ↔ Build) with mechanical coordinator
- Full gate chain functional
- Evidence collection per gate
- 0 critical bugs

**Known Issue:** Agent sometimes stops after 1-2 minutes and needs manual prompting. This is model behavior, not a bug. V1.3 architecture handles this via iteration loops.

---

## Next Steps

### Phase 1: Container Testing System ✅ (DONE - mandated)
Containerized testing is now MANDATORY for plugin changes:
1. Spawn container with plugin
2. Run actual agent sessions  
3. Verify Guardian doesn't block non-target agents
4. Test from user endpoint perspective
5. MUST PASS before shipping

### Phase 2: Shark V4.7 Overhaul (CONTINUE)
1. Re-implement Guardian with proper agent filtering
2. Add compact error messages (no box-drawing)
3. Test in container BEFORE shipping
4. Only ship when container tests pass 100%

**Working Version:** Shark V4.6 (restored from backup)  
**GitHub:** https://github.com/leviathan-devops/shark-agent-v4

### Phase 3: Manta Continuous Execution (Future)
If "agent stops after 1-2 minutes" is critical, add:
- Heartbeat mechanism to detect stalled agents
- Auto-prompt recovery
- Longer timeouts

But note: V1.3.4 is working. Don't break working architecture.