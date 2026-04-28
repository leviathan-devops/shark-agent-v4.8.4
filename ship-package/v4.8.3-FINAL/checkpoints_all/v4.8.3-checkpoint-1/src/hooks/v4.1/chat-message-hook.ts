/**
 * Chat Message Hook — initializes brain when chat message received
 * 
 * This hook is critical because session.created event does NOT contain agent info.
 * The chat.message hook DOES contain agent info and fires when messages are processed.
 * We use this to properly initialize the system brain.
 */
import type { Hooks } from '@opencode-ai/plugin';
import { isSharkAgent } from '../../shared/agent-identity.js';
import { setCurrentAgent, getCurrentAgent, setLastAgentMessage } from './agent-state.js';

export function createChatMessageHook(): Hooks['chat.message'] {
  return async (input, output) => {
    const { agent } = input as { agent?: string };
    const out = output as { parts?: Array<{ type: string; text?: string }> };
    
    // Extract message from output.parts
    let message: string | undefined;
    if (out?.parts && out.parts.length > 0) {
      const textPart = out.parts.find(p => p.type === 'text' && p.text);
      message = textPart?.text;
    }
    
    // Store the agent message for L5 firewall checking
    if (message) {
      setLastAgentMessage(message);
    }
    
    // If brain already initialized, skip brain init but still store message
    if (getCurrentAgent()) {
      return;
    }
    
    // Try to initialize brain from chat.message agent field
    if (agent && isSharkAgent(agent)) {
      console.log(`[Chat Message Hook] Initializing brain from chat.message: agent=${agent}`);
      setCurrentAgent(agent);
      console.log(`[Chat Message Hook] Brain initialized: getCurrentAgent()=${getCurrentAgent()}`);
    }
  };
}
