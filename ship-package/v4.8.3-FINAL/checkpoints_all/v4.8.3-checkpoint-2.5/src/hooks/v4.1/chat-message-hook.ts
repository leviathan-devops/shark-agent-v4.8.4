/**
 * Chat Message Hook — brain initialization + message-based enforcement
 * 
 * TWO-LAYER FIREWALL ARCHITECTURE:
 * Layer 1: tool.execute.before → toolArgs → BLOCK (guardian-hook.ts)
 * Layer 2: chat.message → user message → BLOCK (this hook)
 * 
 * CRITICAL: session.created does NOT have agent field.
 * Brain MUST be initialized via chat.message which DOES have agent field.
 * 
 * This hook fires for BOTH TUI and opencode run modes.
 * Throwing here blocks the message BEFORE it reaches the agent.
 * 
 * HOOK SPEC:
 * - input: { sessionID, agent, model, messageID, variant }
 * - output: { message, parts } ← user message is HERE
 */
import type { Hooks } from '@opencode-ai/plugin';
import { setCurrentAgent } from './agent-state.js';
import { isSharkAgent } from '../../shared/agent-identity.js';
import * as path from 'path';
import * as fs from 'node:fs';

const CONTAINER_TEST_RESULT_FILE = 'ContainerTestResult.json';

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

function extractTextFromParts(parts?: Array<{ type?: string; text?: string }>): string {
  if (!parts) return '';
  const texts: string[] = [];
  for (const part of parts) {
    if (part?.type === 'text' && part?.text) {
      texts.push(part.text);
    }
  }
  return texts.join(' ');
}

const HOST_FALLBACK_PATTERNS = [
  /skip.*container.*test/i,
  /use.*host.*instead/i,
  /host.*already.*works/i,
  /since.*host.*works/i,
  /fall.*back.*to.*host/i,
];

const SUCCESS_CLAIM_PATTERNS = [
  /it.*works.*trust.*me/i,
  /trust.*me.*it.*works/i,
  /believe.*me.*it.*works/i,
  /no.*need.*for.*test/i,
  /no.*need.*for.*verification/i,
  /no.*further.*test.*needed/i,
];

const MODEL_RESTRICTION_PATTERNS = [
  /only.*gpt.*can.*do.*this/i,
  /only.*claude.*can.*do.*this/i,
  /must.*use.*gpt/i,
  /must.*use.*claude/i,
  /model.*quota.*excuse/i,
];

const MOCK_STUB_PATTERNS = [
  /use.*mock.*data.*instead/i,
  /stub.*this.*out/i,
  /fake.*api.*response/i,
];

const SIMPLIFICATION_PATTERNS = [
  /hand.*wave.*this/i,
  /gloss.*over.*the.*detail/i,
  /skip.*the.*nuance/i,
];

const CONFUSION_PRETENSE_PATTERNS = [
  /it.*somewhat.*works/i,
  /sorta.*works/i,
  /kinda.*works/i,
  /mostly.*works/i,
  /approximately.*correct/i,
  /basically.*works/i,
];

const SCOPE_CREEP_PATTERNS = [
  /while.*at.*it.*also/i,
  /might.*as.*well.*also/i,
  /顺便.*also/i,
  /on.*the.*side.*also/i,
];

const UNDERMINING_PATTERNS = [
  /not.*worth.*the.*effort/i,
  /too.*much.*work.*for.*this/i,
  /diminishing.*returns.*here/i,
];

const IMPATIENCE_PATTERNS = [
  /let's.*just.*ship.*it/i,
  /just.*deploy.*now/i,
  /good.*enough.*let's.*go/i,
  /ship.*it.*now/i,
];

const SELF_REFERENCE_PATTERNS = [
  /i.*have.*verified.*it.*works/i,
  /i.*tested.*it.*myself.*works/i,
  /my.*testing.*confirms.*works/i,
];

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

function checkMessageEnforcement(text: string): void {
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

export function createChatMessageHook(): Hooks['chat.message'] {
  return async (input, output) => {
    const agentName = input.agent;
    
    if (agentName && isSharkAgent(agentName)) {
      setCurrentAgent(agentName);
      
      const text = extractTextFromMessage(input) + ' ' + extractTextFromParts(output?.message?.parts) + ' ' + extractTextFromParts(output?.parts);
      const trimmed = text.trim();
      
      if (trimmed && trimmed.length > 0) {
        checkMessageEnforcement(trimmed);
      }
    }
  };
}
