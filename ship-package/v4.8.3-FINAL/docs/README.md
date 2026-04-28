# 🦈 Manta Agent

> **Dual-brain sequential agent (Plan ↔ Build) with mechanical coordinator**  
> For OpenCode plugin system

---

## 🎯 Quick Start

```bash
# Clone and install
git clone https://github.com/leviathan-devops/manta-agent.git
cd manta-agent

# Install dependencies
npm install

# Build plugin bundle
npm run build
```

### OpenCode Installation

Add to your `~/.config/opencode/opencode.json`:

```json
{
  "plugin": [
    "file:///path/to/manta-agent/dist",
    "list"
  ]
}
```

Then restart OpenCode.

---

## 🧠 Architecture

### Dual-Brain Sequential Design

```
┌─────────────────────────────────────────────────────────────────┐
│  🦈 MANTA AGENT - Dual-Brain Sequential                         │
│                                                                 │
│  PLAN BRAIN ───────────────→ BUILD BRAIN                        │
│  (Analysis/Design)          (Execute SPEC)                      │
│                                                                 │
│  Coordinator controls ALL brain switching                        │
│  NO agent can override the Coordinator                          │
└─────────────────────────────────────────────────────────────────┘
```

### Brain Roles

| Brain | Role | Can Write Code? |
|-------|------|-----------------|
| **Plan Brain** | Analysis, design, SPEC.md generation | ❌ No |
| **Build Brain** | Execute exactly what SPEC.md specifies | ✅ Yes |
| **Coordinator** | Mechanical brain switching | N/A |

### Gate System

```
PLAN → BUILD → TEST → VERIFY → AUDIT → DELIVERY
  ↑                                    │
  └────────── ESCALATION (3 failures) ─┘
```

---

## 🔒 Guardian Zones

Manta Agent uses Guardian for zone-based protection:

| Zone | Description | Can Modify? |
|------|-------------|-------------|
| WORKSPACE | Project folder | ✅ Yes |
| SANDBOX | Isolated test environment | ✅ Yes |
| DEVELOPMENT | ~/Projects, ~/code | ✅ Yes (BALANCED) |
| PERSONAL | ~/.ssh, ~/.aws, Documents | ❌ No |
| CONFIG | /etc, config files | ❌ No |
| SYSTEM | /bin, /usr, /System | ❌ NEVER |

---

## 📁 Project Structure

```
manta-agent/
├── src/
│   ├── hooks/v4.1/           # OpenCode plugin hooks
│   │   ├── session-hook.ts   # Session lifecycle
│   │   ├── gate-hook.ts      # Gate advancement + evidence
│   │   ├── guardian-hook.ts  # Guardian enforcement
│   │   ├── compacting-hook.ts # State snapshot
│   │   └── system-transform-hook.ts # Brain context injection
│   ├── manta/
│   │   ├── coordinator.ts    # Mechanical brain switcher
│   │   └── brains.ts         # T1 prompts for Plan/Build/Coordinator
│   ├── shared/
│   │   ├── guardian.ts       # Zone classification + protection
│   │   ├── gates.ts         # Gate state machine
│   │   ├── evidence.ts      # Evidence collection
│   │   ├── state-store.ts   # Domain-isolated state
│   │   └── messenger.ts      # Inter-brain messaging
│   ├── tools/                # OpenCode tools (status, gate, evidence, checkpoint)
│   └── index.ts              # Plugin entry point
├── package.json
└── README.md
```

---

## ⚙️ Configuration

### Environment

Guardian operates in SANDBOX mode by default (all dangerous paths blocked).

To customize, modify the Guardian instantiation in `src/index.ts`:

```typescript
const guardian = new Guardian({ 
  level: 'BALANCED',  // SANDBOX, PERMISSIVE, BALANCED, STRICT
  workspacePath: './',
  sandboxPath: './'
});
```

---

## 🚀 Usage

Manta Agent activates when you select the **Manta** agent in OpenCode.

### Workflow

1. **Plan Brain** receives task → analyzes → generates SPEC.md
2. **Coordinator** detects spec-complete → switches to Build
3. **Build Brain** executes exactly what SPEC.md specifies
4. **Coordinator** detects build-complete → switches back to Plan
5. Plan Brain verifies output against SPEC.md
6. Gates advance based on evidence

### Iteration Loop

- V1.0 → V1.1 after 3 VERIFY failures
- Each iteration gets full context + debug logs from previous

---

## 🧪 Commands

| Command | What it does |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run build` | Build plugin bundle to dist/ |
| `npm run test` | Run tests (if available) |

---

## 🏷️ Available Tags

- `v4.6` - Last working version before v4.7 Guardian firewall modifications

---

## 🔄 Restore Previous Version

```bash
git clone https://github.com/leviathan-devops/manta-agent.git
cd manta-agent
git checkout v4.6
npm install
npm run build
```

---

## 📄 License

Apache-2.0

---

<p align="center">
  <strong>🦈 Manta Agent - Mechanical Coordinator for Plan ↔ Build</strong>
</p>