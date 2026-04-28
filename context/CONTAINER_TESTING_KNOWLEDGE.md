# CONTAINER TESTING KNOWLEDGE
## Universal Reference for All Shark Agents

**Version:** 1.1
**Date:** 2026-04-16
**Applies to:** ALL Shark Agents

---

## CRITICAL RULES

### RULE 1: NEVER Pollute Other Project Containers
**ABSOLUTE NO-GO:**
- Never use containers belonging to other projects (kraken, shark, manta, etc.)
- Never run your tests in containers that aren't yours
- Always create a dedicated sandbox container for your work

**Why:** Polluting other containers causes cross-contamination, crashes, and session corruption.

### RULE 2: Always Use a Dedicated Sandbox
For your testing, always:
```bash
# Create NEW container just for your work
docker run -dit --name <your-project>-test leviathan/opencode:python3-enabled-1.4.3

# Run tests in your container
docker exec <your-project>-test opencode

# When done, clean up YOUR container
docker stop <your-project>-test && docker rm <your-project>-test
```

### RULE 3: DevOps Hygiene
- Clean up your containers when done
- Use descriptive container names: `<project>-test` not `test`
- Never `docker start` a container that isn't yours
- If container has unrelated project name, it's not yours

---

## PURPOSE

This document provides universal guidance for container-based testing of OpenCode plugins and agents. It should be referenced by ALL agents when container testing is required.

---

## API KEYS FOR CONTAINER TESTING

### Google API (Gemma Models)

| Key | Purpose | Model |
|-----|---------|-------|
| `AIzaSyCdzysjAXh0vmzn4vOKuMSWx1dGIjP44Z4` | Container testing | `gemma-4-26b-it` |

**Usage:**
```bash
export GOOGLE_API_KEY=AIzaSyCdzysjAXh0vmzn4vOKuMSWx1dGIjP44Z4
```

### Provider Selection

For container testing, **always prefer Gemma** over Claude/Anthropic because:
1. No API key setup required beyond the Google key
2. Gemma is available via Google AI SDK
3. Works in containers without complex permission handling

---

## CONTAINER TESTING PROTOCOL

### Step 1: Choose the Right Container

**For plugin testing:**
```bash
# Use leviathan/opencode:python3-enabled-1.4.3
docker run --rm \
  -e GOOGLE_API_KEY=AIzaSyCdzysjAXh0vmzn4vOKuMSWx1dGIjP44Z4 \
  leviathan/opencode:python3-enabled-1.4.3 \
  opencode run "your command here"
```

**For TUI testing (interactive):**
```bash
docker run -dit \
  -e GOOGLE_API_KEY=AIzaSyCdzysjAXh0vmzn4vOKuMSWx1dGIjP44Z4 \
  leviathan/opencode:python3-enabled-1.4.3
docker exec <container-name> opencode
```

### Step 2: Mount Workspaces If Needed

```bash
docker run --rm \
  -v /home/leviathan:/home/leviathan \
  -e GOOGLE_API_KEY=AIzaSyCdzysjAXh0vmzn4vOKuMSWx1dGIjP44Z4 \
  leviathan/opencode:python3-enabled-1.4.3 \
  opencode run "audit /home/leviathan/OPENCODE_WORKSPACE/projects/calculator"
```

### Step 3: Run Your Test

```bash
docker run --rm \
  -e GOOGLE_API_KEY=AIzaSyCdzysjAXh0vmzn4vOKuMSWx1dGIjP44Z4 \
  leviathan/opencode:python3-enabled-1.4.3 \
  opencode run "your test command"
```

### Step 4: Verify Results

1. Check exit code: `echo $?`
2. Check output: Should see expected response
3. Check logs if failure: `docker logs <container>`

---

## COMMON ISSUES AND RESOLUTIONS

### Issue: Permission Denied

**Problem:**
```
permission requested: external_directory (/home/leviathan/*); auto-rejecting
```

**Solution:**
- Don't mount `/home/leviathan` unless necessary
- Use workspace paths within the container
- Or run as the container's default user

### Issue: API Key Not Found

**Problem:**
```
Anthropic API key is missing
```

**Solution:**
- Use `GOOGLE_API_KEY` environment variable
- Or use `--provider=google` flag with `opencode run`

### Issue: Container Exits Immediately

**Problem:**
```
Error response from daemon: container <id> is not running
```

**Solution:**
- Don't use `-d` (detached) mode with `opencode run`
- Use `--rm` to auto-remove
- Check if image supports `opencode run` command

### Issue: Module Not Found

**Problem:**
```
Cannot find module 'dist/index.js'
```

**Solution:**
- Ensure plugin is built: `npm run build`
- Ensure plugin is deployed: `cp dist/* ~/.config/opencode/plugins/<plugin>/`

---

## CONTAINER IMAGES REFERENCE

| Image | Use Case | Notes |
|-------|----------|-------|
| `leviathan/opencode:python3-enabled-1.4.3` | General testing | Most reliable |
| `opencode-test:1.4.6` | Plugin testing | May need rebuild |
| `opencode-test:1.4.3` | Legacy testing | For older versions |

---

## VERIFICATION CHECKLIST

Before declaring a container test complete, verify:

- [ ] Container started successfully
- [ ] API key is set (if needed)
- [ ] Command executed without crash
- [ ] Output is as expected
- [ ] No permission errors
- [ ] No API key errors
- [ ] Logs are clean (if applicable)

---

## TESTING PLUGINS IN CONTAINERS

### Step 1: Deploy Plugin to Host

```bash
cp -r /path/to/plugin/dist/* ~/.config/opencode/plugins/<plugin-name>/
```

### Step 2: Mount Config to Container

```bash
docker run --rm \
  -v ~/.config/opencode:/home/leviathan/.config/opencode \
  -e GOOGLE_API_KEY=AIzaSyCdzysjAXh0vmzn4vOKuMSWx1dGIjP44Z4 \
  leviathan/opencode:python3-enabled-1.4.3 \
  opencode run "test command"
```

### Step 3: Verify Plugin Loads

```bash
opencode run "help"
# Should list plugin commands
```

---

## IMPORTANT NOTES

1. **Always use `--rm`** with `docker run --rm` for single commands to auto-cleanup
2. **Never commit API keys** to git repositories
3. **Use environment variables** for API keys, not hardcoded values
4. **Test in containers first** before declaring ship ready
5. **Gemma is preferred** for container testing due to simpler setup

---

## SECURITY REMINDERS

- API keys in this document are for testing ONLY
- Never commit these keys to version control
- Rotate keys regularly in production
- Use separate keys for development and production

---

## UPDATING THIS DOCUMENT

When API keys change or new patterns are discovered:
1. Update this document
2. Update the Master Context in Shark Agent workspace
3. Notify all agents of the change

---

## CONTACT

For issues with container testing:
1. Check this document first
2. Check the DEBUG_LOGS folder for known issues
3. Check container image documentation