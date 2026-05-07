/**
 * Shark Agent — Standalone Linear Execution Plugin
 * 
 * Triple-Brain structure: Planning -> Execution -> System.
 * Strictly linear execution. No sub-agent coordination.
 */
import type { Plugin, PluginInput, Hooks } from '@opencode-ai/plugin';
import * as path from 'node:path';
import { createStateStore } from './shared/state-store.js';
import { createSharkMessenger } from './shared/messenger.js';
import { Guardian } from './shared/guardian.js';
import { GateManager } from './shared/gates.js';
import { EvidenceCollector } from './shared/evidence.js';
import { createSharkHooks } from './hooks/v4.1/index.js';
import { createSharkStatusTool } from './tools/shark-status.js';
import { createSharkGateTool } from './tools/shark-gate.js';
import { createSharkEvidenceTool } from './tools/shark-evidence.js';
import { createCheckpointTool } from './tools/checkpoint.js';
import { createSharkTestRunnerTool } from './tools/shark-test-runner.js';
import { createFirewallStatusTool } from './tools/firewall-status.js';
import { createFirewallAuditTool } from './tools/firewall-audit-tool.js';

// Forest Green — #228B22
const sharkColor = '#228B22';

export default async function SharkAgent(input: PluginInput): Promise<Hooks> {
  const { directory } = input;
  const workspacePath = process.cwd();

  const stateStore = createStateStore();
  const messenger = createSharkMessenger();
  const guardian = new Guardian({ level: 'SANDBOX' });
  const gm = new GateManager(path.join(workspacePath, '.shark'));
  const ec = new EvidenceCollector(path.join(workspacePath, '.shark'));

  // Linear hooks setup - no PeerDispatch/Cluster coordination
  const hooks = createSharkHooks(guardian, gm, ec, stateStore, messenger);

  return {
    ...hooks,

    tool: {
      'shark-status': createSharkStatusTool(stateStore, gm),
      'shark-gate': createSharkGateTool(gm, guardian),
      'shark-evidence': createSharkEvidenceTool(ec),
      'shark-test-runner': createSharkTestRunnerTool(),
      'checkpoint': createCheckpointTool(stateStore, gm),
      'firewall-status': createFirewallStatusTool(),
      'firewall-audit': createFirewallAuditTool(),
    },

    config: async (cfg: any) => {
      if (!cfg.agent) cfg.agent = {};
      Object.assign(cfg.agent, {
        'shark': {
          name: 'shark',
          description: 'SHARK — Linear Execution Agent with Triple-Brain structure',
          mode: 'primary',
          permission: { task: 'allow', tool: 'allow' },
          color: sharkColor,
          tools: {
            'shark-status': true,
            'shark-gate': true,
            'shark-evidence': true,
            'shark-test-runner': true,
            'checkpoint': true,
            'firewall-status': true,
            'firewall-audit': true,
          },
        },
      });
    },
  };
}

