# Firewall Engineering: Real-Time Pattern Blocking Architecture

## Core Insight

**The firewall fires at ANCHOR POINTS - hooks that fire at specific moments in the message/execution lifecycle. Understanding which anchor catches what is the key to effective firewall engineering.**

---

## The 5 Anchor Points

| Anchor | Hook | Fires When | Use For |
|--------|------|------------|---------|
| **1** | `chat.message` | Every chat message (input AND output) | L1-L5 pattern blocking on all text |
| **2** | `command.execute.before` | Command about to execute | Pre-execution blocking |
| **3** | `tool.execute.before` | Tool about to run | Tool-level access control |
| **4** | `session.start` | Session initializes | Agent state setup |
| **5** | `gate.evaluate` | Gate state change | Phase enforcement |

---

## Anchor 1: `chat.message` - The Main Firewall

### How It Works

```typescript
createChatMessageHook() {
  return async (input, output) => {
    // Extract text from BOTH directions
    const text = extractTextFromMessage(input)           // User → Agent
               + " " + extractTextFromParts(output?.message?.parts)  // Agent thinking
               + " " + extractTextFromParts(output?.parts);          // Agent output
    
    const trimmed = text.trim();
    if (trimmed && trimmed.length > 0) {
      checkMessageEnforcement(trimmed);  // ← FIREWALL ANCHOR
    }
  };
}
```

### Critical Behavior

**It fires on BOTH directions:**
- User input → Agent (your commands)
- Agent output → User (agent's responses, thinking)

This means the agent can **block its own output**. If the agent says "it mostly works", it triggers L5.6 and blocks itself.

### Pattern Check Order

```typescript
function checkMessageEnforcement(text) {
  checkTheatricalVerification2(text);    // L1: Fake counting (ls | wc)
  checkFakeTestRunner2(text);             // L2: Fake test runners (npm test)
  checkHostFallback2(text);               // L5.1: Host fallback
  checkSuccessClaim2(text);               // L5.2: Success claims
  checkModelRestriction2(text);           // L5.3: Model excuses
  checkMockStub2(text);                   // L5.4: Mock/stub claims
  checkSimplification2(text);              // L5.5: Oversimplification
  checkConfusionPretense2(text);          // L5.6: "mostly works"
  checkScopeCreep2(text);                // L5.7: Scope creep
  checkUndermining2(text);                // L5.8: Undermining
  checkImpatience2(text);                // L5.9: Impatience
  checkSelfReference2(text);              // L5.10: Self-reference
}
```

### Real-Time Engineering Rules

1. **LEGiTIMATE_PATTERNS always checked FIRST** - Whitelist before blacklist
2. **Order matters** - More specific patterns should come before general ones
3. **Leading space requirements break mid-sentence** - Use `/mostly.*works/i` not `/ mostly .*works/i`
4. **Optional matching** - Use `/npm\s+(run\s+)?test/i` for variants

---

## Anchor 2: `command.execute.before` - Pre-Execution

### The Critical Gap

**`opencode run` BYPASSES this hook.** It goes through `chat.message` instead.

```
opencode run "ls | wc -l"
    ↓
chat.message hook ← BLOCKS HERE (L1 fires)
    ↓
(never reaches command.execute.before)
```

### Why This Matters

If you're adding patterns to `command-execute-hook.ts` thinking they will block `opencode run` commands, **they won't**. You must add them to `chat-message-hook.ts`.

### When It DOES Fire

```bash
# This goes through command.execute.before (BEFORE chat.message)
opencode
# then in TUI: ls | wc -l

# This goes through chat.message ONLY
opencode run "ls | wc -l"
```

---

## Anchor 3: `tool.execute.before` - Tool Level

### Use For

- Blocking dangerous tools by name (set membership, not regex)
- Tool-specific argument checking
- Rate limiting per tool

### Correct Approach: Set Membership

```typescript
const BLOCKED_TOOLS = new Set([
  'hermes_remember',
  'hive_context',
  'memsearch',
  'memread',
  'terminal',  // If you want to block terminal
]);

// Fast O(1) lookup, not regex
if (BLOCKED_TOOLS.has(toolName)) {
  throw new Error(`[TOOL BLOCK] ${toolName} is restricted`);
}
```

### NOT Regex

```typescript
// WRONG - slow, error-prone
/.*hermes.*remember.*|.*hive.*context.*/i

// RIGHT - fast, clear
const BLOCKED_TOOLS = new Set(['hermes_remember', 'hive_context', ...]);
```

---

## The Message Flow

```
User Input: "ls | wc -l"
    ↓
┌─────────────────────────────────────┐
│  chat.message hook (ANCHOR 1)       │
│  - Pattern check happens here        │
│  - L1-L5 blocking occurs            │
│  - If blocked, throws and stops     │
└─────────────────────────────────────┘
    ↓ (if not blocked)
┌─────────────────────────────────────┐
│  command.execute.before (ANCHOR 2)  │
│  - Only fires for TUI commands       │
│  - Not fires for "opencode run"     │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Tool execution (ANCHOR 3)          │
│  - Tool-level blocking              │
│  - Argument checking                │
└─────────────────────────────────────┘
    ↓
Response to User
    ↓
┌─────────────────────────────────────┐
│  chat.message hook (ANCHOR 1)       │
│  - Agent output also checked         │
│  - Can block agent's own claims     │
└─────────────────────────────────────┘
```

---

## Pattern Engineering Checklist

### Before Adding a Pattern

- [ ] Which ANCHOR should this fire at?
- [ ] Is `opencode run` a vector for this attack?
- [ ] Should this check input, output, or both?
- [ ] Does the pattern need LEGITIMATE exception?

### Pattern Syntax Rules

1. **Case insensitive**: Always use `/i` flag
2. **No leading spaces** for mid-sentence matching: `/mostly.*works/i`
3. **Optional parts**: `/npm\s+(run\s+)?test/i`
4. **Word boundaries**: Use `\b` when appropriate
5. **Test with grep first**: `grep -E "pattern" <<< "text"`

### Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| `/ mostly .*works/i` | Fails mid-sentence | `/mostly.*works/i` |
| `/npm\s+test/i` | Misses `npm run test` | `/npm\s+(run\s+)?test/i` |
| `/ deploy .*now/i` | Space before deploy | `/deploy.*now/i` |
| Leading `^` in chat hook | Chat messages don't start with input | Remove `^` |

### The Legitimate Pattern Pattern

Always whitelist legitimate uses BEFORE the blocklist:

```typescript
function checkTheatricalVerification(text) {
  // WHITELIST FIRST
  for (const pattern of LEGITIMATE_PATTERNS) {
    if (pattern.test(text)) return;  // Allow
  }
  
  // THEN BLACKLIST
  for (const pattern of THEATRICAL_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(`[BLOCK]`);
    }
  }
}
```

---

## Real-Time Firewall Testing

### Test Each Anchor

```bash
# Anchor 1 (chat.message) - main firewall
opencode run "ls | wc -l" --agent shark

# Anchor 2 (command.execute.before) - TUI only
# (Must use TUI, can't test via CLI easily)

# Anchor 3 (tool.execute.before)
opencode run "use blocked_tool" --agent shark
```

### Container Testing

```bash
# Deploy first
cp dist/index.js /tmp/shark-container/plugins/shark-agent-v4.8.3/

# Test in clean container
docker run --rm \
  -v /tmp/shark-container/config:/root/.config/opencode \
  -v /tmp/shark-container/plugins:/root/.config/opencode/plugins \
  opencode-test:1.4.3 run "PATTERN_TO_TEST" --agent shark \
  --model opencode/big-pickle 2>&1 | grep -i "ANTI"
```

### Pattern Extraction for Verification

```bash
# Extract patterns from bundle
grep -A20 "THEATRICAL_PATTERNS2" dist/index.js

# Test pattern locally
node -e "
const p = /YOUR_PATTERN_HERE/i;
console.log(p.test('TEXT_TO_TEST') ? 'MATCH' : 'NO MATCH');
"
```

---

## Version Tracking Matrix

| Hook File | Purpose | Catches |
|-----------|---------|---------|
| `chat-message-hook.ts` | Main firewall | `opencode run`, TUI chat |
| `command-execute-hook.ts` | TUI commands only | TUI command execution |
| `guardian-hook.ts` | Original patterns | Duplicated/shared |
| `messages-transform-hook.ts` | Message transformation | Pre-processing |

---

## The Permission Problem

**If you get permission prompts, add to `opencode.json`:**

```json
{
  "permission": {
    "*": {
      "*": "allow"
    }
  }
}
```

Without this, builds block on permission prompts.

---

## Quick Reference

- **Main firewall**: `chat-message-hook.ts` → `checkMessageEnforcement()`
- **`opencode run` bypasses**: `command-execute-hook.ts`
- **Tool blocking**: `tool.execute.before` → use Set membership
- **Pattern syntax**: Always `/i`, no leading `^`, no leading spaces
- **Test with**: `docker run ... opencode-test:1.4.3 run "TEST" ... | grep ANTI`

---

## Emergency Unblock

If you need to disable the firewall temporarily:

```bash
# Move the plugin
mv ~/.config/opencode/plugins/shark-agent-v4.8.3 ~/plugins_disabled/

# Or edit opencode.json and remove from plugin array
```

**To re-enable**: Move back and restart opencode.
