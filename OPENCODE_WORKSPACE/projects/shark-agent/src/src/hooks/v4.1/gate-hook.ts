/**
 * Gate + Evidence Hook — tool.execute.after integration
 * 
 * Collects evidence after tool execution and advances gates when criteria met.
 * Wires coordinator for brain switching on build complete.
 * 
 * CRITICAL: Only fires for shark agents.
 */

import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../../shared/gates.js';
import { EvidenceCollector, type GateEvidence, type GateName } from '../../shared/evidence.js';
import { extractCommandFromArgs } from './utils.js';
import type { SharkPeerDispatch } from '../../shark/macro/peer-dispatch.js';
import { isSharkAgent } from '../../shared/agent-identity';

export function createGateHook(
  gateManager: GateManager,
  evidenceCollector: EvidenceCollector,
  peerDispatch?: SharkPeerDispatch
): Hooks['tool.execute.after'] {
  return async (input, output) => {
    const { tool, sessionID, agent } = input;
    
    // CRITICAL: Only process shark agents
    if (!isSharkAgent(agent)) {
      return;  // Skip for non-shark agents
    }
    
    const args = (input as { args: unknown }).args;
    const result = (output as { output: unknown }).output;
    const currentGate = gateManager.getCurrentGate();

    // Build evidence record
    const evidence = buildEvidenceRecord(tool, args, result);
    if (evidence) {
      const gateEvidence: GateEvidence = {
        gate: currentGate,
        timestamp: Date.now(),
        passed: true,
        files: evidence.files || [],
        metadata: {
          tool,
          sessionID,
          workEvidence: evidence.workEvidence,
        },
      };
      evidenceCollector.collectEvidence(gateEvidence);
    }

    // Auto-advance gates based on tool results
    const shouldAdvance = checkGateAdvance(tool, args, result, currentGate);
    if (shouldAdvance && gateManager.canTransition(shouldAdvance)) {
      gateManager.passCurrentGate();
      gateManager.transitionTo(shouldAdvance);
      console.error(`[Shark] Gate advanced: ${currentGate} → ${shouldAdvance}`);

      // Notify coordinator of build complete → switch to Plan
      if (shouldAdvance === 'test' && currentGate === 'build' && peerDispatch) {
        peerDispatch.onBuildComplete();
      }
    }

    // Check for VERIFY failure — iteration loop
    if (currentGate === 'verify') {
      const verifyResultStr = result ? JSON.stringify(result) : '';
      const verifyHasError = verifyResultStr.includes('"error"') || verifyResultStr.includes('"status":"error"');
      const verifyHasFailure = verifyHasError || verifyResultStr.includes('fail') || verifyResultStr.includes('FAIL');

      if (verifyHasFailure) {
        const verifyLoopResult = gateManager.handleVerifyFailure();
        const state = gateManager.getState() as { verifyAttempts: number };
        console.error(`[Shark] VERIFY failure detected (attempt ${state.verifyAttempts}/3)`);

        // Notify coordinator of gate failure
        if (peerDispatch && state.verifyAttempts >= 3) {
          peerDispatch.onGateFailed('verify', state.verifyAttempts);
        }

        if (verifyLoopResult.action === 'escalate') {
          const escalatedIteration = verifyLoopResult.iteration;
          console.error(`[Shark] ITERATION ESCALATION: ${escalatedIteration} — returning to PLAN`);

          // Structured state emission — agent can parse this to detect iteration change
          console.error(`[SHARK STATE] iteration=${escalatedIteration} gate=plan verifyAttempts=0`);
        }
      }
    }
  };
}

function buildEvidenceRecord(tool: string, args: unknown, result: unknown): { files: string[]; workEvidence: string } | null {
  if (!args) return null;
  const a = args as Record<string, unknown>;

  switch (tool) {
    case 'write_file':
    case 'mcp_write_file': {
      const filePath = a.path as string;
      return { files: filePath ? [filePath] : [], workEvidence: `wrote:${filePath}` };
    }
    case 'patch':
    case 'mcp_patch': {
      const filePath = a.path as string;
      return { files: filePath ? [filePath] : [], workEvidence: `patched:${filePath}` };
    }
    case 'terminal':
    case 'mcp_terminal': {
      const cmd = extractCommandFromArgs(args) || '';
      return { files: [], workEvidence: `ran:${cmd.slice(0, 100)}` };
    }
    default:
      return null;
  }
}

function checkGateAdvance(
  tool: string,
  args: unknown,
  result: unknown,
  currentGate: GateName
): GateName | null {
  const resultStr = result ? JSON.stringify(result) : '';
  const hasError = resultStr.includes('"error"') || resultStr.includes('"status":"error"');
  const cmd = extractCommandFromArgs(args) || '';

  // Build gate advances when files are written
  if (!hasError && currentGate === 'build') {
    if (['write_file', 'mcp_write_file', 'patch', 'mcp_patch'].includes(tool)) {
      return 'test';
    }
  }

  // Test gate advances when tests pass
  if (!hasError && currentGate === 'test') {
    if (/test.*(pass|success|ok)/i.test(resultStr) || /passed.*tests?/i.test(cmd)) {
      return 'verify';
    }
  }

  return null;
}
