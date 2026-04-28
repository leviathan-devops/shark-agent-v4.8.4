/**
 * System Transform Hook — shark enforcement context injection
 * 
 * This hook DOES receive agent context, unlike tool.execute.before/after.
 * We use it to set the shark agent mode for the guardian.
 */
import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../shared/gates.js';
import type { SharkPeerDispatch } from '../shark/macro/peer-dispatch.js';
import { isSharkAgent } from '../../shared/agent-identity';
import { setSharkAgent, clearSharkAgent } from './guardian-hook.js';

export function createSystemTransformHook(
  gateManager: GateManager,
  peerDispatch?: SharkPeerDispatch
): Hooks['experimental.chat.system.transform'] {
  return async (input, output) => {
    // CRITICAL: Only inject context for shark agents
    const agentName = (input as any).agent ?? (output as any).agent;
    if (!isSharkAgent(agentName)) {
      // Not a shark agent - clear shark mode
      clearSharkAgent();
      return;
    }

    // This IS a shark agent - set shark mode for guardian
    setSharkAgent(agentName);

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

IRONCLAD RULE: Source file edits require DUPLICATE workflow:
1. cp {file} {file}.v1.0.0
2. edit {file}.v1.0.0
3. Verify changes
4. Optional: Replace original

${state.currentGate === 'delivery' ? `
[SHIP GATE WARNING]
You MUST run the shark-test tool before passing the delivery gate:
  shark-test action=run
If tests fail, delivery gate will NOT pass and iteration restarts from PLAN.
`.trim() : ''}
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
