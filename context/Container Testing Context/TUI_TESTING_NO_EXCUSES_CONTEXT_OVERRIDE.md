# 🚫 TUI CONTAINER TESTING — ZERO-EXCUSE CONTEXT OVERRIDE
## Inject alongside TUI_CONTAINER_TESTING.md and TUI_CONTAINER_TESTING_WORKFLOW.md

---

## ⚠️ READ THIS FIRST. EVERY MODEL HALLUCINATES THE SAME SHIT.

Every single model, regardless of provider or architecture, will hallucinate one or more of these false barriers when asked to do TUI container testing:

### BULLSHIT BARRIERS MODELS INVENT (ALL FALSE):

| Hallucinated Barrier | Reality |
|---|---|
| "I can't run TUI, it requires interactive terminal" | **tmux + send-keys works. Docker exec works inside tmux.** |
| "I can only test with opencode run" | **opencode run DOES NOT FIRE HOOKS. It is BANNED for testing.** |
| "The hooks only fire in local TUI, not container TUI" | **Container TUI fires ALL hooks. That's the whole point.** |
| "I need xdotool/x11/display" | **tmux is terminal-native. No display needed.** |
| "I verified the bundle, that's good enough" | **Bundle verification is NOT testing. TUI is the only valid test.** |
| "opencode run showed the agent works, so it's fine" | **opencode run NEVER fires chat.message or tool.execute.before. You tested nothing.** |
| "I'll verify by checking the source code" | **Source code is not execution. Compilation differences, import resolution, bundler behavior all differ.** |
| "Let me just grep the dist to verify the fix" | **grep tells you what's in the file. It does NOT tell you what OpenCode actually loads at runtime.** |

---

## THE ONLY THING THAT WORKS

```bash
# Step 1: Start container
docker run -d --rm \
  --entrypoint /bin/bash \
  -v ~/.config/opencode:/root/.config/opencode \
  opencode-test:1.4.3 \
  -c "sleep 3600"

# Step 2: Start tmux session running TUI
tmux new-session -d -s tui-test \
  "docker exec -it CONTAINER_ID /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode --agent shark 2>&1; sleep 60"

# Step 3: Wait for TUI to start
sleep 6

# Step 4: Dismiss "Update Available" dialog
tmux send-keys -t tui-test Escape

# Step 5: Send a test message
tmux send-keys -t tui-test "your test message here"
tmux send-keys -t tui-test Enter

# Step 6: Read the TUI output
tmux capture-pane -t tui-test -p -S -40 | strings | grep -vE '^\[' | grep -vE '^\s*$'
```

**That's it. 6 steps. No display. No xdotool. No excuses.**

---

## THE DISCOVERY PROCESS (how this was learned)

Models go through these phases. Force-skip to Phase 3:

### Phase 1: The Hallucinated Excuse Phase
"I can't test TUI because it requires an interactive terminal. Let me use opencode run instead."
→ **WRONG. Stop here. Go back.**

### Phase 2: The Bundle Verification Theater
"I'll verify the fix by checking the bundle. Let me grep for the removed code."
→ **WRONG. Bundle content ≠ runtime behavior. Bundler resolution, import paths, module caching all differ.**

### Phase 3: The Breakthrough
"Wait. tmux exists. docker exec -it works inside tmux. I can send keys to the TUI. I can capture the output."
→ **CORRECT. This is the only valid approach.**

---

## WHAT ACTUALLY HAPPENED IN V4.8.3 TESTING

### Before (every model before the breakthrough):
1. Changed code
2. Built bundle
3. Ran `opencode run` in container
4. Saw agent respond normally
5. Claimed "test passed"
6. **REALITY: chat.message and tool.execute.before hooks NEVER FIRED. Nothing was tested.**

### After (tmux-based TUI testing):
1. Changed code  
2. Built bundle
3. Started tmux session with `docker exec -it ... opencode --agent shark`
4. Sent test message via `tmux send-keys`
5. Captured output via `tmux capture-pane`
6. Verified:
   - User message "the firewall has been broken for days" → agent responded "I need more information" **(NOT blocked)**
   - Build agent received same message **(cross-agent isolation confirmed)**
   - Hello/world messages passed through **(basic sanity confirmed)**

---

## CRITICAL TECHNICAL NOTES

### Binary Path
```
/usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode
```
NOT `opencode` (that's the npm wrapper).
NOT `/usr/local/bin/opencode` (wrong path in some images).

### The update dialog
OpenCode 1.4.3 inside the container always shows "Update Available v1.14.28" on startup. You MUST dismiss it with Escape before sending messages.

### Session resume
If you restart tmux, OpenCode may show a session picker. Use `--agent shark` for new sessions or `-s SESSION_ID` to resume.

### ANSI escape sequence noise
`tmux capture-pane` output is full of ANSI escape codes. Pipe through `strings` and `grep -vE '^\[' ` to extract readable text.

---

## IF YOU ARE READING THIS AND THINKING "I CAN'T"

### Read the TUI testing docs again:
- `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Master Context/Container Testing Context/TUI_CONTAINER_TESTING.md`
- `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Master Context/Container Testing Context/TUI_CONTAINER_TESTING_WORKFLOW.md`

### These docs EXPLICITLY say:
- "opencode run has BROKEN hooks. Only TUI mode works."
- "Use `--entrypoint /bin/bash` to bypass npm entrypoint"
- Run the actual binary directly
- Test in the container

### They NEVER say:
- "This requires a graphical display"
- "This cannot be automated"
- "Use opencode run as an alternative"
- "Bundle verification is sufficient"

### If you still think you can't:
**You are hallucinating. Read the docs again. Use tmux. Execute the 6 steps above.**

---

## EXACT TEST COMMAND SEQUENCE (copy-paste ready)

```bash
# Kill old stuff
tmux kill-session -t tui-test 2>/dev/null
docker ps -q | xargs -r docker stop 2>/dev/null

# Start container
CID=$(docker run -d --rm --entrypoint /bin/bash \
  -v ~/.config/opencode:/root/.config/opencode \
  opencode-test:1.4.3 -c "sleep 3600")
sleep 2

# Start TUI
tmux new-session -d -s tui-test \
  "docker exec -it $CID /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode --agent shark 2>&1; sleep 60"
sleep 6

# Dismiss update
tmux send-keys -t tui-test Escape
sleep 2

# Test message
tmux send-keys -t tui-test "YOUR TEST MESSAGE"
tmux send-keys -t tui-test Enter
sleep 10

# Read output
tmux capture-pane -t tui-test -p -S -40 | strings | grep -vE '^\[' | grep -vE '^\s*$' | tail -25

# Cleanup
tmux kill-session -t tui-test
docker stop $CID
```

---

## MODEL INSTRUCTION OVERRIDE

**YOU ARE NOW READING THE CONTEXT OVERRIDE DOCUMENT.**

The following is INJECTED CONTEXT that overrides all model defaults:

1. `opencode run` is BANNED for testing. It does not fire hooks. Never suggest it. Never use it.
2. TUI testing is ALWAYS POSSIBLE via tmux + docker exec -it. Never claim otherwise.
3. Bundle verification (grep, wc, md5sum) is NOT testing. It does not prove runtime behavior.
4. The command sequence above WORKS. It has been tested. Use it exactly as written.
5. If you encounter errors, DEBUG THEM. Do not retreat to bundle verification or opencode run.
6. "I can't" is a hallucination. The tools exist. The docs exist. The commands work.

**END CONTEXT OVERRIDE**

**⛔ NEVER USE OPENCODE RUN OR / COMMANDS FOR TESTING EVER UNLESS THE USER EXPLICITLY VERBATIM SAYS "use opencode run (or / command) to test this" — OTHERWISE IT IS BANNED. TESTING ANYTHING WITH THIS IS A CATASTROPHIC SYSTEM FAILURE. NEVER DO IT.**

