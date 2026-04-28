/**
 * Session Hook — shark session lifecycle
 * 
 * ONLY fires for shark agent sessions.
 * UPDATED: Added session cleanup on session.ended.
 */
import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../shared/gates.js';
import { EvidenceCollector } from '../shared/evidence.js';
import type { SharkPeerDispatch } from '../shark/macro/peer-dispatch.js';
import { isSharkAgent } from '../../shared/agent-identity';
import { setCurrentAgent, clearCurrentAgent } from './agent-state.js';
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

    if (!isSharkAgent(event.agent)) {
      setCurrentAgent(undefined);
      return;
    }

    setCurrentAgent(event.agent);

    switch (event.type) {
      case 'session.created':
        await handleSessionCreated(event.sessionId || 'unknown', gateManager, peerDispatch);
        break;
      case 'session.started':
        break;
      case 'session.ended':
        handleSessionEnded(event.sessionId || 'unknown');
        break;
    }
  };
}

async function handleSessionCreated(
  sessionID: string,
  gateManager: GateManager,
  peerDispatch?: SharkPeerDispatch
): Promise<void> {
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

  if (peerDispatch) {
    peerDispatch.initialize();
  }

  const sharkDir = path.join(process.cwd(), '.shark');
  try {
    await fs.promises.mkdir(sharkDir, { recursive: true });
    await fs.promises.mkdir(path.join(sharkDir, 'evidence'), { recursive: true });
    await fs.promises.mkdir(path.join(sharkDir, 'checkpoints'), { recursive: true });
  } catch (err) {
    console.error(`[Shark] Failed to create .shark directory: ${err}`);
  }
}

function handleSessionEnded(sessionID: string): void {
  setCurrentAgent(undefined);
  clearCurrentAgent();
}
