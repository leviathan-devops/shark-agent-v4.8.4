/**
 * Session Hook — shark session lifecycle
 * 
 * ONLY fires for shark agent sessions.
 */
import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../shared/gates.js';
import { EvidenceCollector } from '../shared/evidence.js';
import type { SharkPeerDispatch } from '../shark/macro/peer-dispatch.js';
import { isSharkAgent } from '../../shared/agent-identity';
import * as path from 'node:path';
import * as fs from 'node:fs';

export function createSessionHook(
  gateManager: GateManager,
  _evidenceCollector: EvidenceCollector,
  peerDispatch?: SharkPeerDispatch
): Hooks['event'] {
  return async (input) => {
    const event = input.event as { type?: string; sessionId?: string; agent?: string };
    
    if (!event?.type) return;

    // CRITICAL: Only handle shark agent sessions
    if (!isSharkAgent(event.agent)) {
      return;  // Skip for non-shark agents
    }

    switch (event.type) {
      case 'session.created':
        await handleSessionCreated(event.sessionId || 'unknown', gateManager, peerDispatch);
        break;
      case 'session.started':
        break;
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
