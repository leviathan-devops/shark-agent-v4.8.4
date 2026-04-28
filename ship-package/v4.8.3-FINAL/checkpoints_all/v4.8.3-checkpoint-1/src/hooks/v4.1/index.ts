/**
 * Shark Hooks (v4.8.4 — HOTFIX INTEGRATION)
 */
import type { Hooks } from '@opencode-ai/plugin';
import { Guardian } from '../shared/guardian.js';
import { GateManager } from '../shared/gates.js';
import { EvidenceCollector } from '../shared/evidence.js';
import { createChatMessageHook } from './chat-message-hook.js';
import { createToolSummarizerHook } from './tool-summarizer-hook.js';
import { createSessionHook } from './session-hook.js';
import { createCompactingHook } from './compacting-hook.js';
import { createSystemTransformHook } from './system-transform-hook.js';
import type { MantaCoordinator } from '../manta/coordinator.js';

export function createSharkHooks(
  guardian: Guardian,
  gateManager: GateManager,
  evidenceCollector: EvidenceCollector,
  coordinator?: MantaCoordinator
): Hooks {
  return {
    event: createSessionHook(gateManager, evidenceCollector, coordinator),
    'chat.message': createChatMessageHook(),
    'tool.execute.before': createGuardianHook(guardian),
    'tool.execute.after': [createToolSummarizerHook(), createGateHook(gateManager, evidenceCollector, coordinator)],
    'experimental.session.compacting': createCompactingHook(gateManager),
    'experimental.chat.system.transform': createSystemTransformHook(gateManager, coordinator),
  };
}