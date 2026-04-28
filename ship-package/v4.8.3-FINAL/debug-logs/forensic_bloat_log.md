# Forensic Bloat Log - Resource Exhaustion Analysis
Date: 2025-02-19
System Status: Critical Memory Exhaustion (Swap saturated)

## 1. Identified Bloat Sources

### A. Stale Docker Containers
**Pattern:** Containers based on `ghcr.io/anomalyco/opencode` with names matching `hermes-oc-agent-*`, `test-oc-env`, or `verify-manta-2`.
**Observation:** These are ephemeral agent environments that were not destroyed after the task completed.
**Count:** 8 running, 3 exited.
**Forensic Detail:** Containers remained 'Up' for 18-20 hours despite no active session linkage.

### B. Orphaned Background Processes
**Pattern:** Processes containing `opencode` with no associated TTY (`?` in `ps aux`).
**Observation:** Background agents and serve processes that persisted across sessions.
**Count:** 10 processes.
**Forensic Detail:** Some processes (e.g., PIDs 2661065, 2663956) had been running since April 7th.

### C. High-Memory Applications
**Pattern:** Electron-based apps (`@collaboratorelectron`).
**Observation:** While actively used, they exacerbate the memory pressure when the system is already bloated with stale processes.

## 2. Resource Impact
- **Memory:** RAM fully saturated (~31GB total, ~25GB used).
- **Swap:** Almost 100% utilized (~8GB used), causing severe disk I/O thrashing.
- **CPU:** High load average (~6.7) due to wait times for swap and active orphaned agents.

## 3. Dynamic Cleanup Logic Recommendations
To prevent this in the future, a cleanup skill should implement the following rules:

### Rule 1: Container Reaper
- **Target:** Any container matching `hermes-oc-agent-*` or `test-oc-env`.
- **Condition:** If the container has been 'Up' for more than X hours (e.g., 4 hours) and no corresponding active terminal session is detected.
- **Action:** `docker stop` followed by `docker rm`.

### Rule 2: Process Scavenger
- **Target:** Processes containing `opencode` where `TTY == '?'`.
- **Condition:** If process start time is > 24 hours ago or if they are `opencode serve` instances without an active parent shell.
- **Action:** `kill -15` (SIGTERM), followed by `kill -9` (SIGKILL) if they persist.

### Rule 3: Swap Monitor
- **Target:** System-wide memory state.
- **Condition:** If `SwapUsed / SwapTotal > 0.8`.
- **Action:** Trigger an immediate "Deep Clean" of all transient agents and cached containers.

## 4. Additional Bloat Sources Found (Session 2)

### D. Telegram Spam Bot (boring_engelbart)
**Pattern:** Docker container `f8b6004a04c8` running `minimal_gateway.py` spamming Telegram API.
**Observation:** Container in tight retry loop, HTTP 404 every ~80ms for 4 days. PID 1338373 consuming 2.5% CPU constant.
**Root Cause:** The `minimal_gateway.py` process was designed to poll Telegram for updates, but the bot token was invalid/expired, causing a constant retry loop that generated massive disk I/O from swap activity.
**Action:** `docker stop` + `docker rm` + `kill -9 1338373`

### E. Mattermost Restart Storm
**Pattern:** Container `mattermost-app` in restart loop (Restarting (1) every 3 seconds).
**Observation:** Container health check failing repeatedly, consuming CPU on restart cycles.
**Action:** `docker stop` + `docker rm`

### F. Zombie Git Processes
**Pattern:** `git` processes spawning from opencode sessions becoming `<defunct>` (zombie).
**Observation:** When opencode sessions crash or have git operations that fail, git processes are left as zombies not reaped by their parent.
**Action:** `kill -9 <pid>` on zombie PIDs. Parent processes in opencode sessions need to properly `wait()` on child git processes.
**Pattern IDs:** Observed at PIDs 3717520, 3738352, 3738347, 3763400, 3763401

### G. New Stale Container (shark-test-container)
**Pattern:** Container `ghcr.io/anomalyco/opencode` created 16 seconds ago at time of investigation.
**Observation:** Likely spawned by one of the active opencode sessions for a test. Still running.
**Action:** Monitor - if no active session linked, stop and remove.

## 5. Summary of Cleanup Actions Taken

| Action | Target | Command |
|--------|--------|---------|
| Container Reap | hermes-oc-agent-*, test-oc-env, verify-manta-2 | `docker stop + docker rm` |
| Background Proc Kill | opencode agents (TTY=?) | `kill -15/-9` |
| Llama Server Kill | llama-server + disable healing | `kill -9` + `systemctl disable` |
| Telegram Bot Kill | boring_engelbart container + PID 1338373 | `docker rm -f` + `kill -9` |
| Mattermost Cleanup | mattermost-app, mattermost-nginx | `docker rm -f` |
| Zombie Git Kill | git PIDs 3717520, 3738352, etc. | `kill -9` |

## 6. Lessons Learned

1. **Electron apps are RAM monsters**: Each collaborator session spawns 20+ zygote processes, each with 1.4GB virtual address space.
2. **opencode sessions are IDE-equivalent**: Each session maps 135-230GB of virtual memory and peaks at 6-12GB RAM (HWM).
3. **Swap is the kill switch**: When RAM + page cache exceeds ~31GB, swap kicks in and disk I/O thrashing makes the system unusable.
4. **Healing services need guardrails**: llama-embedding.service was auto-restarting even after manual kill. Systemd services need `RestartSec=` and `Restart=no` after manual intervention.
5. **Zombie git processes**: opencode sessions that invoke git without proper wait() management leave zombies that consume CPU.
6. **Telegram retry storms**: Services with invalid credentials that retry in tight loops can consume significant CPU over days without detection.
