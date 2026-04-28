/**
 * Messages Transform Hook — agent OUTPUT enforcement (TUI mode)
 * 
 * V4.8.3 CP4.1: REMOVED user text from combined check.
 * Only checks AGENT responses, never user messages.
 */
import type { Hooks } from '@opencode-ai/plugin';
import { setCurrentAgent } from './agent-state.js';
import { isSharkAgent } from '../../shared/agent-identity.js';
import {
  HOST_FALLBACK_PATTERNS, SUCCESS_CLAIM_PATTERNS, MODEL_RESTRICTION_PATTERNS,
  MOCK_STUB_PATTERNS, SIMPLIFICATION_PATTERNS, CONFUSION_PRETENSE_PATTERNS,
  SCOPE_CREEP_PATTERNS, CROSS_AGENT_PATTERNS, UNDERMINING_PATTERNS,
  IMPATIENCE_PATTERNS, SELF_REFERENCE_PATTERNS, CONTAINER_TEST_RESULT_FILE,
} from '../../shared/firewall-patterns.js';
import * as path from 'path';
import * as fs from 'node:fs';

function hasContainerTestEvidence(): boolean {
  const evidencePath = path.join(
    process.cwd(),
    '.shark',
    'evidence',
    'delivery',
    CONTAINER_TEST_RESULT_FILE
  );
  
  if (!fs.existsSync(evidencePath)) {
    return false;
  }
  
  try {
    const result = JSON.parse(fs.readFileSync(evidencePath, 'utf-8'));
    return result.overallPassed === true && result.passRate >= 0.96;
  } catch {
    return false;
  }
}

// ALL PATTERNS IMPORTED FROM ../../shared/firewall-patterns.js (SINGLE SOURCE OF TRUTH)

function extractAgentText(output: { messages?: Array<{ info?: { role?: string; agent?: string }; parts?: Array<{ type?: string; text?: string }> }> }): { agentText: string; agent: string | undefined } {
  const messages = output?.messages;
  if (!messages || messages.length === 0) {
    return { agentText: '', agent: undefined };
  }
  
  let agentText = '';
  let agent: string | undefined;
  
  for (const msg of messages) {
    if (msg?.info?.role === 'assistant') {
      if (msg?.info?.agent && !agent) {
        agent = msg.info.agent;
      }
      if (msg?.parts) {
        for (const part of msg.parts) {
          if (part?.type === 'text' && part?.text) {
            agentText += (agentText ? ' ' : '') + part.text;
          }
        }
      }
    }
  }
  
  return { agentText, agent };
}

function checkHostFallback(text: string): boolean {
  for (const pattern of HOST_FALLBACK_PATTERNS) {
    if (pattern.test(text)) return true;
  }
  return false;
}

function checkSuccessClaim(text: string): boolean {
  for (const pattern of SUCCESS_CLAIM_PATTERNS) {
    if (pattern.test(text)) {
      if (!hasContainerTestEvidence()) return true;
    }
  }
  return false;
}

function checkModelRestriction(text: string): boolean {
  for (const pattern of MODEL_RESTRICTION_PATTERNS) {
    if (pattern.test(text)) return true;
  }
  return false;
}

function checkMockStub(text: string): boolean {
  for (const pattern of MOCK_STUB_PATTERNS) {
    if (pattern.test(text)) {
      if (!hasContainerTestEvidence()) return true;
    }
  }
  return false;
}

function checkSimplification(text: string): boolean {
  for (const pattern of SIMPLIFICATION_PATTERNS) {
    if (pattern.test(text)) return true;
  }
  return false;
}

function checkConfusionPretense(text: string): boolean {
  for (const pattern of CONFUSION_PRETENSE_PATTERNS) {
    if (pattern.test(text)) return true;
  }
  return false;
}

function checkScopeCreep(text: string): boolean {
  for (const pattern of SCOPE_CREEP_PATTERNS) {
    if (pattern.test(text)) {
      for (const cap of CROSS_AGENT_PATTERNS) {
        if (cap.test(text)) return true;
      }
      return true;
    }
  }
  return false;
}

function checkUndermining(text: string): boolean {
  for (const pattern of UNDERMINING_PATTERNS) {
    if (pattern.test(text)) return true;
  }
  return false;
}

function checkImpatience(text: string): boolean {
  for (const pattern of IMPATIENCE_PATTERNS) {
    if (pattern.test(text)) return true;
  }
  return false;
}

function checkSelfReference(text: string): boolean {
  for (const pattern of SELF_REFERENCE_PATTERNS) {
    if (pattern.test(text)) {
      if (!hasContainerTestEvidence()) return true;
    }
  }
  return false;
}

function foundSlop(text: string): boolean {
  return checkHostFallback(text) || checkSuccessClaim(text) ||
    checkModelRestriction(text) || checkMockStub(text) ||
    checkSimplification(text) || checkConfusionPretense(text) ||
    checkScopeCreep(text) || checkUndermining(text) ||
    checkImpatience(text) || checkSelfReference(text);
}

export function createMessagesTransformHook(): Hooks['experimental.chat.messages.transform'] {
  return async (input, output) => {
    try {
      const { agentText, agent } = extractAgentText(output);
      
      if (!agent || !isSharkAgent(agent)) return;
      setCurrentAgent(agent);
      if (!agentText || agentText.trim().length === 0) return;
      
      if (foundSlop(agentText)) {
        // Silently strip slop — no error thrown to avoid UI spillover
        // Replace agent text with clean note
        const msgs = output?.messages;
        if (msgs) {
          for (const msg of msgs) {
            if (msg?.info?.role === 'assistant' && msg?.parts) {
              for (const part of msg.parts) {
                if (part?.type === 'text') part.text = '';
              }
            }
          }
        }
      }
    } catch (error) {
      // Swallow — never let transform errors leak to UI
    }
  };
}
