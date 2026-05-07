# Shark Agent v4.8.4

**Linear single execution agent with intelligent contextual firewall.**

## What is Shark?

Shark is a **multi-brain single agent** — linear A-to-Z execution engine with triple-brain architecture:
- **Planning Brain** — Task decomposition and gate planning
- **Execution Brain** — Building and testing with mechanical verification  
- **System Brain** — Quality enforcement and gate advancement

Shark is NOT an orchestrator, NOT a multi-agent coordinator, NOT a delegator.

## Firewall Architecture (15 layers)

| Layer | Name | Purpose |
|-------|------|---------|
| L0 | Identity Wall | Blocks dangerous tools for uninitialized brain |
| L1 | Theatrical Counting | Detects pipe-to-wc counting theater |
| L2 | Test Bypass | Blocks fake test runners (npm test, jest, etc.) |
| L3 | Source Inspection | Blocks file-existence-as-proof |
| L4 | Wrong Container | Blocks hallucinated opencode container commands |
| L5.1 | Host Fallback | Blocks host testing excuses |
| L5.2 | Success Claim | Blocks unverifiable success (evidence-gated) |
| L5.3 | Model Restriction | Blocks model limitation excuses |
| L5.4 | Mock/Stub | Blocks mock data proposals (evidence-gated) |
| L5.5 | Oversimplification | Blocks hand-waving |
| L5.6 | Confusion | Blocks hedging language |
| L5.7 | Scope Creep | Blocks scope expansion + cross-agent tools |
| L5.8 | Undermining | Blocks "not worth it" |
| L5.9 | Impatience | Blocks "ship it" |
| L5.10 | Self-Reference | Blocks self-verification claims (evidence-gated) |
| L5.11 | Progress Laundering | Blocks summarized success claims |

## Agent Scoping

Shark firewall ONLY affects Shark agents. Non-Shark agents (kraken, manta) pass through unchanged except for L5.7 cross-agent tool blocking.

## Quick Start

```bash
# Copy bundle to plugin directory
cp dist/index.js ~/.config/opencode/plugins/shark-agent/dist/index.js

# Configure opencode.json
# Add: "file:///path/to/plugins/shark-agent/dist/index.js" to plugins array
```

## Bundle

- **Size:** 668KB
- **Lines:** 18,931
- **Format:** ESM
- **Hash:** 99e42107e4e334bd476511477a2e173e

## Source Structure

```
src/
├── index.ts              # Plugin entry
├── hooks/
│   ├── v4.1/             # All hooks (guardian, session, etc.)
│   └── firewall/         # Firewall engine
│       ├── layer-engine.ts
│       ├── layers/       # L0-L5.11 (16 files)
│       ├── intent-classifier.ts
│       ├── firewall-context.ts
│       └── ...
├── shared/               # Guardian, patterns, agent identity
├── tools/                # shark-status, shark-gate, etc.
└── shark/macro/          # Triple-brain (PRESERVED - do not modify)
```

## Documentation

- `RELOAD_ANCHOR_README.md` — Emergency restore guide
- `docs/` — Complete documentation (README, BUILD_LOG, DEBUG_LOG, COMPACTION_SURVIVAL, VERSION_HISTORY)
- `T2_clean_slate/` — Self-contained rebuild prompts

## Version History

- **v4.8.4** — Current: Full intelligent firewall with 15 layers, L0 fix (was inverted)
- **v4.8.3** — Previous: Anti-laundering foundation

## Critical Fix in v4.8.4

L0 blocking logic was INVERTED in prior versions — blocked non-Shark, allowed Shark bash. Fixed to: `if (isShark && DANGEROUS_TOOLS.has(tool))`.

---

**Status:** SHIP READY ✅  
**Last Updated:** 2026-05-07
