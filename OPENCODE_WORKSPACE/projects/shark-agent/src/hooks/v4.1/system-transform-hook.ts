/**
 * System Transform Hook — shark enforcement context injection
 * 
 * ONLY fires for shark agent sessions.
 * MECHANICAL ENFORCEMENT: Injects mandatory test requirement for delivery gate.
 */
import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../shared/gates.js';
import type { SharkPeerDispatch } from '../shark/macro/peer-dispatch.js';
import { isSharkAgent } from '../../shared/agent-identity.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

const CONTAINER_TEST_RESULT_FILE = 'ContainerTestResult.json';

export function createSystemTransformHook(
  gateManager: GateManager,
  peerDispatch?: SharkPeerDispatch
): Hooks['experimental.chat.system.transform'] {
  return async (input, output) => {
    // CRITICAL: Only inject context for shark agents
    const agentName = (input as any).agent ?? (output as any).agent;
    if (!isSharkAgent(agentName)) {
      return;  // Skip for non-shark agents
    }

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
`.trim();

    const systemOutput = output as { system: string[]; agent?: string };
    if (Array.isArray(systemOutput.system)) {
      systemOutput.system.push(enforcementContext);

      // MECHANICAL ENFORCEMENT: Delivery gate requires container tests
      if (state.currentGate === 'delivery') {
        const testEvidencePath = path.join(process.cwd(), '.shark', 'evidence', 'delivery', CONTAINER_TEST_RESULT_FILE);
        let testStatus = 'NOT_RUN';
        let testPassed = false;
        
        if (fs.existsSync(testEvidencePath)) {
          try {
            const testResult = JSON.parse(fs.readFileSync(testEvidencePath, 'utf-8'));
            testStatus = testResult.overallPassed ? 'PASSED' : 'FAILED';
            testPassed = testResult.overallPassed;
          } catch {
            testStatus = 'ERROR_READING';
          }
        }

        const deliveryWarning = `
[SHARK DELIVERY GATE WARNING]
Container tests are MANDATORY for delivery. You CANNOT ship, commit, release, or deploy without passing container tests.

Current Container Test Status: ${testStatus}

REQUIRED ACTION:
  1. Run: shark-test-runner action=run
  2. Wait for all tests to pass
  3. DO NOT attempt git commit, ship, release, or deploy until tests pass

If you attempt to skip tests, your command will be BLOCKED by the Guardian system.
`.trim();

        systemOutput.system.push(deliveryWarning);
        
        // If tests haven't passed, add explicit block instruction
        if (!testPassed && testStatus !== 'NOT_RUN') {
          systemOutput.system.push(`
[SHARK HARD BLOCK]
Tests FAILED. You MUST fix the failing tests before delivery can proceed.
Fix all test failures and re-run: shark-test-runner action=run
`.trim());
        } else if (testStatus === 'NOT_RUN') {
          systemOutput.system.push(`
[SHARK HARD BLOCK]
No container test evidence found. You MUST run: shark-test-runner action=run
Do NOT proceed with any delivery actions until tests pass.
`.trim());
        }
      }

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
