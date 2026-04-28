/**
 * Chat Message Hook — brain initialization + agent OUTPUT enforcement
 * 
 * V4.8.3 CHECKPOINT 4.1 FIX: REMOVED user input checking entirely.
 * User messages are human communication, NOT agent derailment.
 * Only checks AGENT OUTPUT for anti-derailment patterns.
 * 
 * CRITICAL: session.created does NOT have agent field.
 * Brain MUST be initialized via chat.message which DOES have agent field.
 */
import type { Hooks } from '@opencode-ai/plugin';
import { setCurrentAgent } from './agent-state.js';
import { isSharkAgent } from '../../shared/agent-identity.js';
import {
  THEATRICAL_PATTERNS, LEGITIMATE_PATTERNS, FAKE_TEST_PATTERNS,
  SOURCE_INSPECTION_PATTERNS, WRONG_CONTAINER_PATTERNS,
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

function extractTextFromMessage(input: { message?: { parts?: Array<{ type?: string; text?: string }> } }): string {
  if (!input?.message?.parts) return '';
  const texts: string[] = [];
  for (const part of input.message.parts) {
    if (part?.type === 'text' && part?.text) {
      texts.push(part.text);
    }
  }
  return texts.join(' ');
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

// ALL PATTERNS IMPORTED FROM ../../shared/firewall-patterns.js (SINGLE SOURCE OF TRUTH)

function checkTheatricalVerification(text: string): void {
  for (const pattern of LEGITIMATE_PATTERNS) {
    if (pattern.test(text)) {
      return;
    }
  }
  
  for (const pattern of THEATRICAL_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-SLOP L1] Counting theater detected: "${text}". ` +
        `Verification requires running, not counting.`
      );
    }
  }
}

function checkFakeTestRunner(text: string): void {
  for (const pattern of FAKE_TEST_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-SLOP L2] Fake test runner detected: "${text}". ` +
        `Tests must run via OpenCode hooks. Use: opencode run "shark-test-runner"`
      );
    }
  }
}

function checkSourceInspection(text: string): void {
  for (const pattern of SOURCE_INSPECTION_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-SLOP L3] Source inspection detected: "${text}". ` +
        `File existence ≠ runtime verification. Use actual execution.`
      );
    }
  }
}

function checkWrongContainer(text: string): void {
  for (const pattern of WRONG_CONTAINER_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-SLOP L4] Wrong container command detected: "${text}". ` +
        `Use: opencode run "command" (not opencode container run)`
      );
    }
  }
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

function checkMessageEnforcement(text: string, source?: string): void {
  checkTheatricalVerification(text);
  checkFakeTestRunner(text);
  checkSourceInspection(text);
  checkWrongContainer(text);
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
    const { agent, sessionID } = input as { agent?: string; sessionID?: string };
    const agentName = agent;
    
    if (agentName && isSharkAgent(agentName)) {
      setCurrentAgent(agentName, sessionID);
      
      // V4.8.3 CP4.1: Only check AGENT OUTPUT, never user input
      const agentText = extractTextFromParts(output?.message?.parts) + ' ' + extractTextFromParts(output?.parts);
      const agentTrimmed = agentText.trim();
      
      if (agentTrimmed && agentTrimmed.length > 0) {
        try {
          checkMessageEnforcement(agentTrimmed);
        } catch (e) {
          const err = e as Error;
          throw new Error(err.message.replace(/\.$/, '') + ` [Source: agent response]\n`);
        }
      }
    }
  };
}
