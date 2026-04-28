/**
 * Shark Hooks — V4.7
 * 
 * V4.7: Guardian is now MECHANICAL ENFORCEMENT with source file protection.
 */
import type { Hooks } from '@opencode-ai/plugin';
import { Guardian } from '../shared/guardian.js';
import { GateManager } from '../shared/gates.js';
import { EvidenceCollector } from '../shared/evidence.js';
import { createGuardianHook } from './guardian-hook.js';
import { createGateHook } from './gate-hook.js';
import { createSessionHook } from './session-hook.js';
import { createCompactingHook } from './compacting-hook.js';
import { createSystemTransformHook } from './system-transform-hook.js';
import type { SharkPeerDispatch } from '../shark/macro/peer-dispatch.js';

export function createSharkHooks(
  guardian: Guardian,
  gateManager: GateManager,
  evidenceCollector: EvidenceCollector,
  peerDispatch?: SharkPeerDispatch
): Hooks {
  return {
    event: createSessionHook(gateManager, evidenceCollector, peerDispatch),
    'tool.execute.before': createGuardianHook(guardian),
    'tool.execute.after': createGateHook(gateManager, evidenceCollector, peerDispatch, guardian),
    'experimental.session.compacting': createCompactingHook(gateManager),
    'experimental.chat.system.transform': createSystemTransformHook(gateManager, peerDispatch),
  };
}
