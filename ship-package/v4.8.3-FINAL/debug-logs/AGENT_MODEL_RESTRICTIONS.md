# AGENT MODEL RESTRICTIONS
## Date: 2026-04-10

## DeepSeek - USER ONLY
**AGENTS MUST NOT USE DeepSeek API under any circumstances.**

DeepSeek is configured in opencode.json under `deepseek-user-only` provider for USER-LEVEL access only.

### Why DeepSeek is Blocked
- DeepSeek API credentials are personal/user-level
- Agents should only use: MiniMax M2.7 (normal), Google Gemma, OpenCode Zen, OpenCode Go

### Allowed Models for Agents
| Provider | Models | Notes |
|----------|--------|-------|
| minimax | M2.7, M2.5, M2.1, M2 | Primary - MiniMax API |
| 0-google | Gemma 4 31b, 26b, Gemma 3 27b, Gemma 3 4b, Gemini Flash | FREE - Google API |
| opencode-zen | Auto-updates | Anomaly-provided |
| opencode-go | Auto-updates | Anomaly-provided |
| openrouter | Gemini Flash, Qwen Coder, Claude Haiku | Free tier |

### Models NEVER to Use in Agents
- DeepSeek (deepseek-chat, deepseek-reasoner) - USER ONLY
- Any highspeed variants
- Any "coding-plan" variants
- Any "cn" (China) variants

## Config Backup
File: `/home/leviathan/.config/opencode/opencode-master-backup.json`
