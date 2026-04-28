/**
 * System Transform Hook — shark enforcement context injection
 * 
 * ONLY fires for shark agent sessions.
 */
import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../shared/gates.js';
import type { SharkPeerDispatch } from '../shark/macro/peer-dispatch.js';
import { isSharkAgent } from '../../shared/agent-identity';

export function createSystemTransformHook(
  gateManager: GateManager,
  peerDispatch?: SharkPeerDispatch
): Hooks['experimental.chat.system.transform'] {
  return async (input, output) => {
    // CRITICAL: Only inject context for shark agents
    const agentName = (input as any).agent ?? (output as any).agent;
    if (!isSharkAgent(agentName)) {
      return;  // Skip for non-shark agents
    }

    const state = gateManager.getState();
    const criteria = gateManager.getCriteria(state.currentGate as any);

    const enforcementContext = `
[SHARK ENFORCEMENT CONTEXT]
Current Gate: ${(state.currentGate as string).toUpperCase()}
Iteration: ${state.currentIteration}
Verify Attempts: ${state.verifyAttempts}/3

Blocking Criteria for ${state.currentGate}:
${criteria.blockingCriteria.map((c: string) => `  - ${c}`).join('\n')}

Evidence Required:
${criteria.evidenceRequired.map((e: string) => `  - ${e}`).join('\n')}
`.trim();

    const systemOutput = output as { system: string[]; agent?: string };
    if (Array.isArray(systemOutput.system)) {
      systemOutput.system.push(enforcementContext);

      // Inject shark brain context
      if (peerDispatch) {
        const pState = peerDispatch.getState();
        const brainContext = `
[SHARK BRAIN CONTEXT]
Active Brains: ${pState.activeBrains.join(', ')}
Primary Brain: ${pState.primaryBrain}
Brain coordination is MECHANICAL — the PeerDispatch controls coordination.
Do NOT switch brains manually. Wait for PeerDispatch signals.
`.trim();
        systemOutput.system.push(brainContext);
      }
    }
  };
}
