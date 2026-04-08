/**
 * Session Compacting Hook — experimental.session.compacting integration
 * 
 * Snapshots gate state before context compression.
 * 
 * CRITICAL: Only fires for shark agents.
 */

import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../../shared/gates.js';
import { isSharkAgent } from '../../shared/agent-identity';
import * as path from 'node:path';
import * as fs from 'node:fs';

export function createCompactingHook(
  gateManager: GateManager
): Hooks['experimental.session.compacting'] {
  return async (input, output) => {
    const { sessionID, agent } = input;
    
    // CRITICAL: Only process shark agents
    if (!isSharkAgent(agent)) {
      return;  // Skip for non-shark agents
    }
    
    console.log(`[Shark] Session compacting: ${sessionID}`);

    const state = gateManager.getState();
    const sessionDir = path.join(process.cwd(), '.shark', 'sessions', sessionID);

    try {
      await fs.promises.mkdir(sessionDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(sessionDir, 'gate-state.json'),
        JSON.stringify(state, null, 2)
      );
      console.log(`[Shark] State snapshot saved for session ${sessionID}`);
      
      // Add context to the compaction
      const contextOutput = output as { context: string[] };
      if (contextOutput.context) {
        contextOutput.context.push(`[Shark] Gate state snapshot saved: ${state.currentGate} gate, ${state.currentIteration}`);
      }
    } catch (err) {
      console.error(`[Shark] Failed to snapshot state: ${err}`);
    }
  };
}
