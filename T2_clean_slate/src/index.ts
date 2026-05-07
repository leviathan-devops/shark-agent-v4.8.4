/**
 * Shark Agent — Standalone Plugin
 * 
 * Execution Brain with triple-brain coordination via PeerDispatch.
 * Isolated state: shark-state domain.
 */
import type { Plugin, PluginInput, Hooks } from '@opencode-ai/plugin';
import * as path from 'node:path';
import { createStateStore } from './shared/state-store.js';
import { createSharkMessenger } from './shared/messenger.js';
import { Guardian } from './shared/guardian.js';
import { GateManager } from './shared/gates.js';
import { EvidenceCollector } from './shared/evidence.js';
import { SharkPeerDispatch } from './shark/macro/peer-dispatch.js';
import { EXECUTION_BRAIN_T1 } from './shark/macro/brains.js';
import { createSharkStatusTool } from './tools/shark-status.js';
import { createSharkGateTool } from './tools/shark-gate.js';
import { createSharkEvidenceTool } from './tools/shark-evidence.js';
import { createCheckpointTool } from './tools/checkpoint.js';
import { createSharkTestRunnerTool } from './tools/shark-test-runner.js';
import { createFirewallStatusTool } from './tools/firewall-status.js';
import { createFirewallAuditTool } from './tools/firewall-audit-tool.js';
import { createSharkHooks } from './hooks/v4.1/index.js';

// Forest Green — #228B22
const sharkColor = '#228B22';

export default async function SharkAgent(input: PluginInput): Promise<Hooks> {
  const { directory } = input;
  const workspacePath = process.cwd();

  // ISOLATED instances — NOT shared with any other plugin
  const stateStore = createStateStore();
  const messenger = createSharkMessenger();
  const guardian = new Guardian({ level: 'SANDBOX' });
  const gm = new GateManager(path.join(workspacePath, '.shark'));
  const ec = new EvidenceCollector(path.join(workspacePath, '.shark'));

  // Shark-specific peer dispatch
  const peerDispatch = new SharkPeerDispatch({
    stateStore,
    messenger,
    gateManager: gm,
  });

  // Tools
  const statusTool = createSharkStatusTool(stateStore, gm);
  const gateTool = createSharkGateTool(gm, guardian);
  const evidenceTool = createSharkEvidenceTool(ec);
  const checkpointTool = createCheckpointTool(stateStore, gm);
  const testRunnerTool = createSharkTestRunnerTool();
  const fwStatusTool = createFirewallStatusTool();
  const fwAuditTool = createFirewallAuditTool();

  // Hooks with shark peer dispatch
  const hooks = createSharkHooks(guardian, gm, ec, peerDispatch, stateStore, messenger);

  return {
    ...hooks,

    tool: {
      'shark-status': statusTool,
      'shark-gate': gateTool,
      'shark-evidence': evidenceTool,
      'shark-test-runner': testRunnerTool,
      'checkpoint': checkpointTool,
      'firewall-status': fwStatusTool,
      'firewall-audit': fwAuditTool,
    },

    config: async (cfg: any) => {
      if (!cfg.agent) cfg.agent = {};
      Object.assign(cfg.agent, {
        'shark': {
          name: 'shark',
          description: 'SHARK — Execution Brain with triple-brain coordination',
          prompt: EXECUTION_BRAIN_T1,
          instructions: EXECUTION_BRAIN_T1,
          mode: 'primary',
          permission: { task: 'allow' },
          color: sharkColor,
          tools: {
            'shark-status': true,
            'shark-gate': true,
            'shark-evidence': true,
            'shark-test-runner': true,
            'checkpoint': true,
            'firewall-status': true,
            'firewall-audit': true,
            'get_agent_status': false,
            'get_cluster_status': false,
            'get_task_context': false,
            'kraken_brain_status': false,
            'kraken_message_status': false,
            'kraken_gate_status': false,
            'kraken_hive_search': false,
            'kraken_hive_remember': false,
            'kraken_hive_get_cluster_context': false,
            'kraken_hive_inject_context': false,
            'read_kraken_context': false,
            'report_to_kraken': false,
            'spawn_shark_agent': false,
            'spawn_manta_agent': false,
            'spawn_cluster_task': false,
            'aggregate_results': false,
            'anchor_cluster': false,
            'kraken_executor': false,
            'hive_status': false,
            'hive_context': false,
            'run_subagent_task': false,
            'run_parallel_tasks': false,
            'cleanup_subagents': false,
            'todowrite': false,
            'skill': false,
          },
        },
      });
    },
  };
}
