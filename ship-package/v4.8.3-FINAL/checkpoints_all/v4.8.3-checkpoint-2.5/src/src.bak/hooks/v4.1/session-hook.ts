/**
 * Session Hook — shark session lifecycle
 * 
 * Sets shark agent mode when a shark session is detected.
 */
import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../shared/gates.js';
import { EvidenceCollector } from '../shared/evidence.js';
import type { SharkPeerDispatch } from '../shark/macro/peer-dispatch.js';
import { isSharkAgent } from '../../shared/agent-identity';
import { setSharkAgent, clearSharkAgent } from './guardian-hook.js';
import * as path from 'node:path';
import * as fs from 'node:fs';

export function createSessionHook(
  gateManager: GateManager,
  _evidenceCollector: EvidenceCollector,
  peerDispatch?: SharkPeerDispatch
): Hooks['event'] {
  return async (input) => {
    const event = input.event as Record<string, any>;
    
    if (!event?.type) return;

    // Only set shark mode if this is actually a shark agent
    const eventAgent = event.properties?.info?.agent ?? event.agent;
    if (isSharkAgent(eventAgent)) {
      setSharkAgent(eventAgent);
    } else {
      clearSharkAgent();
    }
  };
}

async function handleSessionCreated(
  sessionID: string,
  gateManager: GateManager,
  peerDispatch?: SharkPeerDispatch
): Promise<void> {
  // Initialize fresh gate state
  gateManager.restore({
    currentGate: 'plan',
    gateStatus: {
      plan: 'pending',
      build: 'pending',
      test: 'pending',
      verify: 'pending',
      audit: 'pending',
      delivery: 'pending',
    },
    verifyAttempts: 0,
    currentIteration: 'V1.0',
    iterationAttempts: {},
  });

  // Initialize ONLY shark peer dispatch
  if (peerDispatch) {
    peerDispatch.initialize();
  }

  // Ensure .shark directory exists
  const sharkDir = path.join(process.cwd(), '.shark');
  try {
    await fs.promises.mkdir(sharkDir, { recursive: true });
    await fs.promises.mkdir(path.join(sharkDir, 'evidence'), { recursive: true });
    await fs.promises.mkdir(path.join(sharkDir, 'checkpoints'), { recursive: true });
  } catch (err) {
    console.error(`[Shark] Failed to create .shark directory: ${err}`);
  }
}
