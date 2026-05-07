/**
 * Chat Message Hook — brain initialization ONLY
 * 
 * V4.8.3 CP4.16.1: REMOVED L5/L8 checks. chat.message ONLY fires for user
 * messages (output.message.role is ALWAYS "user" at runtime). Agent output
 * text checking moved to messages-transform-hook.ts which fires with both
 * user and assistant messages (confirmed via container TUI testing).
 */
import type { Hooks } from '@opencode-ai/plugin';
import { setCurrentAgent } from './agent-state.js';
import { isSharkAgent } from '../../shared/agent-identity.js';

export function createChatMessageHook(): Hooks['chat.message'] {
  return async (input, output) => {
    const { agent, sessionID } = input as { agent?: string; sessionID?: string };

    if (agent && isSharkAgent(agent)) {
      setCurrentAgent(agent, sessionID);
    }
  };
}
