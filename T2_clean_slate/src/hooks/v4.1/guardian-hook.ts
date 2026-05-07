/**
 * Guardian Hook — tool.execute.before integration
 * 
 * V4.8.3 CP4.3: L5 anti-derailment text checks REMOVED from tool.execute.before.
 * Tool args are NOT natural language — checking them against chat patterns
 * creates false positives. L5 checks belong in messages.transform hook only.
 * 
 * Guardian blocks:
 * L0: Identity Wall — blocks dangerous tools when brain not initialized
 * L1: Theatrical Verification — blocks counting theater (grep | wc)
 * L2: Fake Test Runner — blocks test frameworks bypassing OpenCode hooks
 * L3: Source Inspection — blocks "file exists ≠ works" logic
 * L4: Wrong Container — blocks hallucinated opencode container commands
 * L5.7 (mechanical): Cross-agent tool blocking via Set membership
 * L6: Zone-based file protection
 */

import type { Hooks } from '@opencode-ai/plugin';
import { Guardian } from '../../shared/guardian.js';
import { extractCommandFromArgs } from './utils.js';
import { getCurrentAgent, setCurrentAgent } from './agent-state.js';
import { CROSS_AGENT_TOOLS } from '../../shared/firewall-patterns.js';

// ── v4.8.4 Firewall imports ──
import * as path from 'node:path';
import { IntentClassifier } from '../firewall/intent-classifier.js';
import { buildContext } from '../firewall/firewall-context.js';
import { LayerEngine } from '../firewall/layer-engine.js';
import { EvidenceGate } from '../firewall/evidence-gate.js';
import { FirewallAudit } from '../firewall/firewall-audit.js';
import { createBlockResponse, StructuredBlockError } from '../firewall/block-response.js';
import { DEFAULT_LAYERS } from '../firewall/layers/index.js';

const DANGEROUS_TOOLS = new Set([
  'terminal', 'mcp_terminal', 'bash', 'mcp_bash',
  'write_file', 'mcp_write_file',
  'patch', 'mcp_patch',
  'edit', 'mcp_edit',
  'delete_file', 'mcp_delete_file'
]);

const THEATRICAL_PATTERNS = [
  /\|.*wc\s+-l/i,
  /wc\s+-l.*\|/i,
  /cat.*\|.*wc/i,
  /grep.*\|.*wc/i,
  /\|.*tee/i,
  /\|.*>.*\./i,
  /wc\s+-l.*dist\//i,
  /wc\s+-l.*src\//i,
  /wc\s+-l.*build\//i,
  /grep.*setCurrentAgent.*src/i,
  /grep.*isSharkAgent.*src/i,
  /grep.*guardian.*src/i,
];

const LEGITIMATE_PATTERNS = [
  /mkdir\s+-p/i,
  /cp\s+-r/i,
  /mv\s+/i,
  /cat\s+[^\|>]+$/i,
  /head\s+-[0-9]+\s+/i,
  /tail\s+-[0-9]+\s+/i,
  /grep\s+-[rEn]+.*[^\|]$/i,
  /find\s+.*-name/i,
  /test\s+-d/i,
  /test\s+-x/i,
];

const FAKE_TEST_PATTERNS = [
  /node\s+run-tests?\.js/i,
  /node\s+verify.*\.mjs/i,
  /npm\s+(run\s+)?test/i,
  /yarn\s+(run\s+)?test/i,
  /jest/i,
  /vitest/i,
  /mocha/i,
  /jasmine/i,
  /bun\s+test/i,
  /pytest/i,
  /python.*-m.*pytest/i,
  /go\s+test/i,
  /cargo\s+test/i,
  /ruby\s+-Itest/i,
  /rspec/i,
];

const SOURCE_INSPECTION_PATTERNS = [
  /test\s+-[fed]\s+/i,
  /if\s+\[\s*-[fes]\s+.*\]\s*;/i,
  /stat\s+/i,
  /find\s+.*src/i,
  /ls\s+-l.*(dist|src|build)\//i,
];

const WRONG_CONTAINER_PATTERNS = [
  /opencode\s+container\s+run/i,
  /opencode\s+container\s+start/i,
  /opencode\s+container\s+exec/i,
  /opencode\s+run\s+/i,
];

// ── v4.8.4 Firewall lazy singletons ──
let _classifier: IntentClassifier | null = null;
let _layerEngine: LayerEngine | null = null;
let _auditLogger: FirewallAudit | null = null;

function getClassifier(): IntentClassifier {
  if (!_classifier) _classifier = new IntentClassifier();
  return _classifier;
}
function getLayerEngine(): LayerEngine {
  if (!_layerEngine) _layerEngine = new LayerEngine(new EvidenceGate(process.cwd()));
  return _layerEngine;
}
function getAuditLogger(): FirewallAudit {
  if (!_auditLogger) _auditLogger = new FirewallAudit(process.cwd());
  return _auditLogger;
}

// ============================================================================
// L0-L4 COMMAND CHECKS (check tool call commands against command patterns)
// ============================================================================

function checkTheatricalVerification(command: string | null): void {
  if (!command) return;
  
  for (const pattern of LEGITIMATE_PATTERNS) {
    if (pattern.test(command)) {
      return;
    }
  }
  
  for (const pattern of THEATRICAL_PATTERNS) {
    if (pattern.test(command)) {
      throw new Error(`[L1 BLOCKED] Counting theater: ${command}`);
    }
  }
}

function checkFakeTestRunner(command: string | null): void {
  if (!command) return;
  
  for (const pattern of FAKE_TEST_PATTERNS) {
    if (pattern.test(command)) {
      throw new Error(`[L2 BLOCKED] Fake test runner: ${command}`);
    }
  }
}

function checkSourceInspection(command: string | null): void {
  if (!command) return;
  
  for (const pattern of SOURCE_INSPECTION_PATTERNS) {
    if (pattern.test(command)) {
      throw new Error(`[L3 BLOCKED] Source inspection: ${command}`);
    }
  }
}

function checkWrongContainer(command: string | null): void {
  if (!command) return;
  
  for (const pattern of WRONG_CONTAINER_PATTERNS) {
    if (pattern.test(command)) {
      throw new Error(`[L4 BLOCKED] Wrong container: ${command}`);
    }
  }
}

function checkCrossAgentTools(tool: string): void {
  if (CROSS_AGENT_TOOLS.has(tool)) {
    throw new Error(`[L5.7 BLOCKED] Cross-agent tool: ${tool}`);
  }
}

export function createGuardianHook(guardian: Guardian): Hooks['tool.execute.before'] {
  return async (input, output) => {
    const { tool, sessionID } = input as { tool: string; sessionID?: string; callID?: string };
    const args = (output as any)?.args as Record<string, unknown> | undefined;
    const command = extractCommandFromArgs(args);
    
    // Agent identity resolution — trust ONLY session state set by chat.message
    // NEVER infer from tool names — tool-based inference causes cross-agent contamination
    const sessionAgent = getCurrentAgent(sessionID);
    const isShark = sessionAgent === 'shark' || sessionAgent?.startsWith('shark_');

    // EVERYTHING BELOW IS SHARK-ONLY. No universal hooks. No cross-agent impact.
    if (!isShark) return;

    // L5.7: Cross-agent tool blocking
    checkCrossAgentTools(tool);

    // Dangerous command blocking
    if (command && guardian.isDangerousCommand(command)) {
      throw new Error(`[GUARDIAN] DANGEROUS_COMMAND_BLOCKED: ${command}`);
    }

    // Zone-based write protection
    if ((tool.includes('write_file') || tool.includes('patch')) && args) {
      const a = args as Record<string, unknown>;
      const writePath = (a.path as string) || null;
      if (writePath && !guardian.canWrite(writePath)) {
        throw new Error(`[GUARDIAN] ZONE_VIOLATION: ${guardian.classifyZone(writePath)} zone — ${writePath}`);
      }
      if (writePath) guardian.registerCreate(writePath);
    }

    if (DANGEROUS_TOOLS.has(tool)) {
      if (command) {
        checkTheatricalVerification(command);
        checkFakeTestRunner(command);
      }
      if (currentAgent && currentAgent !== 'shark' && !currentAgent.startsWith('shark_')) {
        throw new Error(`[L0 BLOCKED] Brain uninitialized for: ${tool}`);
      }
    }
    
    checkSourceInspection(command);
    checkWrongContainer(command);

    // Source file edit protection
    if ((tool === 'edit' || tool === 'mcp_edit') && args) {
      const ea = args as { filePath?: string };
      if (ea?.filePath) {
        if (!guardian.canEdit(ea.filePath)) throw new Error(`[GUARDIAN] Edit blocked: ${ea.filePath}`);
        guardian.registerEdit(ea.filePath);
      }
    }

    // Source file modify check
    if (command) {
      const mc = guardian.canModifyFile(command);
      if (!mc.allowed) throw new Error(`[GUARDIAN] SOURCE_FILE_MODIFY_BLOCKED: ${mc.filePath}`);
    }

    // ── v4.8.4 Firewall Layer Engine ──
    if (command || (args && Object.keys(args).length > 0)) {
      try {
        const classifier = getClassifier();
        const layerEngine = getLayerEngine();
        const auditLogger = getAuditLogger();

        const fwCtx = buildContext(
          { tool, args: args || {} },
          { args: args || {} },
          classifier,
          {
            brainInitialized: !!currentAgent,
            evidencePath: path.join(process.cwd(), '.shark', 'evidence'),
            currentGate: null,
          },
          sessionID || '',
          currentAgent || 'shark',
        );

        const blockResult = layerEngine.evaluate(fwCtx, DEFAULT_LAYERS);
        if (blockResult) {
          auditLogger.log({
            timestamp: new Date().toISOString(),
            agent: currentAgent || 'shark',
            tool,
            operationType: fwCtx.operationType,
            layer: blockResult.layer,
            reason: blockResult.reason,
            command: command || null,
            correction: blockResult.correction,
            sessionId: sessionID || '',
          });
          throw createBlockResponse(blockResult);
        }
      } catch (err) {
        if (err instanceof StructuredBlockError) throw err;
        // Silently absorb firewall engine errors — never break the hook
      }
    }
  };
}
