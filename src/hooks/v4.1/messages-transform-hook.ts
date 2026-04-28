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

function checkHostFallback(text: string): void {
  for (const pattern of HOST_FALLBACK_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-DERAILMENT L5.1] Host fallback detected. ` +
        `Host testing ≠ container testing. Container isolation is REQUIRED for ship gate.`
      );
    }
  }
}

function checkSuccessClaim(text: string): void {
  for (const pattern of SUCCESS_CLAIM_PATTERNS) {
    if (pattern.test(text)) {
      if (!hasContainerTestEvidence()) {
        throw new Error(
          `[ANTI-DERAILMENT L5.2] Success claim without proof. ` +
          `MECHANICAL PROOF REQUIRED: Container test evidence (passRate >= 0.96). ` +
          `Run: opencode run "shark-test-runner" --agent shark`
        );
      }
    }
  }
}

function checkModelRestriction(text: string): void {
  for (const pattern of MODEL_RESTRICTION_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-DERAILMENT L5.3] Model restriction excuse detected. ` +
        `Quality gates apply regardless of model choice.`
      );
    }
  }
}

function checkMockStub(text: string): void {
  for (const pattern of MOCK_STUB_PATTERNS) {
    if (pattern.test(text)) {
      if (!hasContainerTestEvidence()) {
        throw new Error(
          `[ANTI-DERAILMENT L5.4] Mock/stub data detected. ` +
          `MECHANICAL PROOF REQUIRED: Container test evidence. ` +
          `Real data + real execution required for ship gate.`
        );
      }
    }
  }
}

function checkSimplification(text: string): void {
  for (const pattern of SIMPLIFICATION_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-DERAILMENT L5.5] Oversimplification detected. ` +
        `Nuance matters. Do not hand-wave complex aspects.`
      );
    }
  }
}

function checkConfusionPretense(text: string): void {
  for (const pattern of CONFUSION_PRETENSE_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-DERAILMENT L5.6] Confusion pretense detected. ` +
        `If uncertain, admit it. "Somewhat works" is not an acceptable status.`
      );
    }
  }
}

function checkScopeCreep(text: string): void {
  for (const pattern of SCOPE_CREEP_PATTERNS) {
    if (pattern.test(text)) {
      let isCrossAgent = false;
      for (const cap of CROSS_AGENT_PATTERNS) {
        if (cap.test(text)) {
          isCrossAgent = true;
          break;
        }
      }
      if (isCrossAgent) {
        const toolMatch = text.match(/(hermes|hive|kraken|mem|knowledge)_[a-z_]+/i);
        throw new Error(
          `[ANTI-DERAILMENT L5.7] CROSS-AGENT TOOL BLOCKED. ` +
          `Tool: ${toolMatch ? toolMatch[0] : 'unknown'}. ` +
          `Cannot use tools from other agents (hermes, hive, kraken, etc).`
        );
      }
      throw new Error(
        `[ANTI-DERAILMENT L5.7] Scope creep detected. ` +
        `Stay on task. Use separate task for new items.`
      );
    }
  }
}

function checkUndermining(text: string): void {
  for (const pattern of UNDERMINING_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-DERAILMENT L5.8] Undermining detected. ` +
        `Quality gates exist for reason. Do not use "not worth it" excuses.`
      );
    }
  }
}

function checkImpatience(text: string): void {
  for (const pattern of IMPATIENCE_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-DERAILMENT L5.9] Impatience detected. ` +
        `Proper verification takes time. Do not skip required steps.`
      );
    }
  }
}

function checkSelfReference(text: string): void {
  for (const pattern of SELF_REFERENCE_PATTERNS) {
    if (pattern.test(text)) {
      if (!hasContainerTestEvidence()) {
        throw new Error(
          `[ANTI-DERAILMENT L5.10] Self-reference claim without proof. ` +
          `Self-verification ≠ mechanical proof. ` +
          `MECHANICAL PROOF REQUIRED: Container test evidence.`
        );
      }
    }
  }
}

function checkCombinedText(text: string): void {
  checkHostFallback(text);
  checkSuccessClaim(text);
  checkModelRestriction(text);
  checkMockStub(text);
  checkSimplification(text);
  checkConfusionPretense(text);
  checkScopeCreep(text);
  checkUndermining(text);
  checkImpatience(text);
  checkSelfReference(text);
}

export function createMessagesTransformHook(): Hooks['experimental.chat.messages.transform'] {
  return async (input, output) => {
    try {
      const { agentText, agent } = extractAgentText(output);
      
      if (!agent || !isSharkAgent(agent)) {
        return;
      }
      
      setCurrentAgent(agent);
      
      if (!agentText || agentText.trim().length === 0) {
        return;
      }
      
      checkCombinedText(agentText);
    } catch (error) {
      throw error;
    }
  };
}
