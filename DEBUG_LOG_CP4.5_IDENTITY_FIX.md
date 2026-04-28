# Shark Agent v4.8.3 — CP4.5: AGENT IDENTITY LAYER FIX
## Debug Log & Implementation Document
### Date: 2026-04-28

---

## PROBLEM

The shark agent plugin loaded successfully (tools registered, hooks firing) but the agent had **zero self-awareness**. When asked "what are you?" it would hallucinate being part of Kraken orchestration, search for clusters, list imaginary sub-agents, and return `brain: "unknown"` from shark-status.

**Root cause**: The system prompt was being passed via `instructions` field in the plugin config callback. OpenCode SDK **ignores** the `instructions` field and only reads `prompt` (or `config.prompt`). The agent received NO system prompt, defaulting to OpenCode's generic agent identity which has no knowledge of shark tools, identity, or purpose.

**Secondary cause**: The existing prompt text (`EXECUTION_BRAIN_T1`) was written for a theoretical "triple-brain" system (Execution Brain, Reasoning Brain, System Brain) that doesn't exist in standalone plugin mode. It referenced: peers, brain coordination, injected context, domain ownership — none of which are real in standalone mode.

---

## FIX IMPLEMENTED

### File 1: `src/index.ts` (line 71-72)

```typescript
// BEFORE (broken):
instructions: `${EXECUTION_BRAIN_T1}`,

// AFTER (fixed):
prompt: EXECUTION_BRAIN_T1,        // SDK reads this
instructions: EXECUTION_BRAIN_T1,  // keep both for redundancy
```

### File 2: `src/shark/macro/brains.ts` — `EXECUTION_BRAIN_T1` rewritten

**Old prompt** (~40 lines, triple-brain architecture):
- "You are the Execution Brain of Shark Agent V4"
- References: Reasoning Brain, System Brain, PeerDispatch, triple-brain parallel
- Domain ownership: execution-state, quality-state
- No mention of: actual tools, actual identity, actual capabilities

**New prompt** (~30 lines, standalone identity):
- "YOU ARE THE SHARK AGENT v4.8.3 — an OpenCode plugin agent"
- Lists 5 custom tools explicitly
- Explicit anti-confusion: "You DO NOT have sub-agents. You are NOT Kraken. You are a standalone plugin agent."
- Tells agent exactly what to say about itself
- Refers to firewalls, guardian, zones as automatic systems (agent doesn't need to think about them)

### Identity Layer Architecture

The identity layer works through THREE mechanisms:

```
┌─────────────────────────────────────────────────┐
│ 1. PLUGIN CONFIG (index.ts config callback)      │
│    Sets prompt + instructions on agent config    │
│    → SDK injects into system message             │
├─────────────────────────────────────────────────┤
│ 2. SYSTEM PROMPT (brains.ts EXECUTION_BRAIN_T1)  │
│    Defines: who I am, what I have, what I do     │
│    → Model reads this as first system message    │
├─────────────────────────────────────────────────┤
│ 3. CONTEXT INJECTION (system-transform-hook.ts)  │
│    Injects build context at session start        │
│    → Adds domain-specific knowledge             │
└─────────────────────────────────────────────────┘
```

---

## ADDING IDENTITY TO FUTURE PLUGIN AGENTS

### Step 1: Plugin Config Callback

In your `src/index.ts`, the `config` callback MUST set `prompt`:

```typescript
export default async function MyAgent(input: PluginInput): Promise<Hooks> {
  return {
    // ... hooks, tools ...
    
    config: async (cfg: any) => {
      if (!cfg.agent) cfg.agent = {};
      Object.assign(cfg.agent, {
        'my-agent': {
          name: 'my-agent',
          description: 'My custom agent',
          prompt: MY_SYSTEM_PROMPT,      // ← CRITICAL: SDK reads this
          instructions: MY_SYSTEM_PROMPT, // ← Keep both for safety
          mode: 'primary',
          color: '#HEXCOLOR',
          tools: { 'my-tool': true },
        },
      });
    },
  };
}
```

**Do NOT** use `instructions` alone — it's ignored by the SDK.

### Step 2: System Prompt Content

Your system prompt MUST include:

```typescript
export const MY_SYSTEM_PROMPT = `YOU ARE THE MY-AGENT vX.Y.Z — an OpenCode plugin agent.

YOUR IDENTITY:
- You are "my-agent" — a [primary|subagent] OpenCode agent loaded via the my-agent plugin
- Your color is #HEXCOLOR
- You have N custom tools: [list them]
- You DO NOT have sub-agents [unless you do]. You are a [standalone|orchestrator] agent.
- You are NOT [other agent names to avoid confusion]

YOUR TOOLS:
- tool-name: [description]
- tool-name: [description]

YOUR JOB:
- [primary responsibility]
- [secondary responsibility]

KEY RULES:
- [critical behavioral constraints]
- [things to NEVER do]

SELF-AWARENESS:
- When asked "what are you", say "I am the My-Agent vX.Y.Z, an OpenCode plugin agent"
- When asked about your tools, list the N custom tools above
`;
```

### Step 3: Verification

After deploying, test that the agent knows itself:

```
# In TUI:
> what are you?
Expected: "I am the Shark Agent v4.8.3, an OpenCode plugin agent"
Not: "I am an execution brain" or "I have no specific identity"

> what tools do you have?
Expected: Lists shark-status, shark-gate, shark-evidence, shark-test-runner, checkpoint
Not: Lists generic OpenCode tools without mentioning shark tools
```

---

## IDENTITY PATTERNS TO AVOID

| Anti-pattern | Why it fails |
|-------------|-------------|
| Abstract role names ("Execution Brain") | Agent doesn't know it IS that role |
| References to non-existent systems | Agent hallucinates Kraken clusters |
| Vague domain ownership | Agent can't determine its scope |
| No explicit tool listing | Agent doesn't know what's available |
| No anti-confusion statements | Agent mixes with other plugins |

| Good pattern | Why it works |
|-------------|-------------|
| "YOU ARE THE X AGENT vX.Y.Z" | Clear identity anchor |
| "Your tools: tool1, tool2, tool3" | Concrete capability list |
| "You are NOT [other agent]" | Anti-confusion guardrail |
| "When asked X, say Y" | Self-awareness scripts |

---

## VERIFICATION

```
TUI test: "what are you?"
Before: "I don't have a specific identity. I'm an AI assistant..."
After: "I am the Shark Agent v4.8.3, an OpenCode plugin agent"

TUI test: "what tools do you have?"
Before: Lists all OpenCode tools generically
After: Lists shark-status, shark-gate, etc. alongside standard tools

shark-status result:
Before: { "brain": "unknown" }
After: Should show initialized brain state
```

---

## COMMIT

```
commit 637ad1f (CP4.5)
- Added 'prompt' field alongside 'instructions' in config callback
- Rewrote EXECUTION_BRAIN_T1 to clearly identify as shark agent
- Agent now knows: its identity, its 5 tools, it is NOT kraken
- Removed references to triple-brain system that doesn't exist in standalone mode
```

**End of Debug Log — v4.8.3 CP4.5**
