/**
 * System Transform Hook — shark enforcement context injection
 * 
 * ONLY fires for shark agent sessions.
 * V4.8.4: Identity injection added (SHARK.md, IDENTITY.md, etc.)
 * FIXED: Only inject context on gate TRANSITIONS, not every message.
 * AUTO-INJECT: Reads .shark/build-context.md and identity files on session start.
 */
import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../shared/gates.js';
import type { SharkPeerDispatch } from '../shark/macro/peer-dispatch.js';
import { isSharkAgent } from '../../shared/agent-identity.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

const CONTAINER_TEST_RESULT_FILE = 'ContainerTestResult.json';
const BUILD_CONTEXT_FILE = 'build-context.md';

let lastInjectedGate: string | null = null;
let buildContextInjected = false;
let identityInjected = false;
let _cachedIdentity: string | null = null;

export function resetSystemTransformState(): void {
  lastInjectedGate = null;
  buildContextInjected = false;
  identityInjected = false;
  _cachedIdentity = null;
}

// ── v4.8.4 Identity loader ──
const IDENTITY_FILES = ['SHARK.md', 'IDENTITY.md', 'EXECUTION.md', 'ARCHITECTURE.md', 'CAPABILITIES.md'];

function loadIdentity(): string | null {
  if (_cachedIdentity !== null) return _cachedIdentity;

  const identityDir = findIdentityDir();
  if (!identityDir) return null;

  const parts: string[] = [];
  for (const file of IDENTITY_FILES) {
    try {
      const content = fs.readFileSync(path.join(identityDir, file), 'utf-8');
      parts.push(content.trim());
    } catch {
      // File missing — skip silently
    }
  }

  if (parts.length === 0) return null;
  _cachedIdentity = parts.join('\n\n---\n\n');
  return _cachedIdentity;
}

function findIdentityDir(): string | null {
  // Check locations in priority order
  const cwd = process.cwd();
  const home = process.env.HOME || '/root';

  const candidates = [
    path.join(home, '.config', 'opencode', 'plugins', 'shark-agent-v4.8.4', 'identity'),
    path.join(home, '.config', 'opencode', 'plugins', 'shark-agent-v4.8.3', 'identity'),
    path.join(home, '.config', 'opencode', 'plugins', 'shark-agent-v4', 'identity'),
    path.join(cwd, 'identity'),
    path.join(cwd, 'src', 'identity'),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        return candidate;
      }
    } catch {
      // Skip
    }
  }
  return null;
}

export function createSystemTransformHook(
  gateManager: GateManager,
  peerDispatch?: SharkPeerDispatch
): Hooks['experimental.chat.system.transform'] {
  return async (input, output) => {
    const agentName = (input as any).agent ?? (output as any).agent;
    if (!isSharkAgent(agentName)) {
      return;
    }

    const state = gateManager.getState();
    const systemOutput = output as { system: string[]; agent?: string };
    if (!Array.isArray(systemOutput.system)) return;

    // ── v4.8.4 IDENTITY INJECTION (first, before all other context) ──
    if (!identityInjected) {
      identityInjected = true;
      const identity = loadIdentity();
      if (identity) {
        systemOutput.system.unshift(identity);
      }
    }

    // INJECT BUILD CONTEXT ON FIRST TRANSFORM (after compaction)
    if (!buildContextInjected) {
      buildContextInjected = true;
      const buildContext = loadBuildContext();
      if (buildContext) {
        systemOutput.system.unshift(buildContext);
      }
    }

    // ONLY inject on gate transition, not every message
    if (state.currentGate !== lastInjectedGate) {
      lastInjectedGate = state.currentGate;
      
      const criteria = gateManager.getCriteria(state.currentGate as any);
      
      const enforcementContext = `
[SHARK ENFORCEMENT CONTEXT]
Gate: ${(state.currentGate as string).toUpperCase()}
Iteration: ${state.currentIteration}
Blocking Criteria:
${criteria.blockingCriteria.map((c: string) => `  - ${c}`).join('\n')}
Evidence Required:
${criteria.evidenceRequired.map((e: string) => `  - ${e}`).join('\n')}
IRONCLAD RULE: Source file edits require DUPLICATE workflow:
1. cp {file} {file}.v1.0.0
2. edit {file}.v1.0.0
3. Verify changes
4. Optional: Replace original
CRITICAL: Before editing MAJOR CODEBASE files (agent harnesses, OS, core infrastructure), you MUST:
1. Use the question tool to ask user for explicit confirmation
2. Explain what changes you intend to make
3. Wait for user approval before proceeding
`.trim();

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
  3. DO NOT attempt any delivery actions until tests pass
`.trim();

        systemOutput.system.push(deliveryWarning);
        
        if (!testPassed && testStatus !== 'NOT_RUN') {
          systemOutput.system.push(`[SHARK HARD BLOCK] Tests FAILED. You MUST fix the failing tests before delivery.`);
        } else if (testStatus === 'NOT_RUN') {
          systemOutput.system.push(`[SHARK HARD BLOCK] No container test evidence found. You MUST run: shark-test-runner action=run`);
        }
      }
    }

    // Inject brain context once at start
    if (peerDispatch && state.currentGate === 'plan' && state.currentIteration === 'V1.0') {
      const pState = peerDispatch.getState();
      const brainContext = `
[SHARK BRAIN CONTEXT]
Active Brains: ${pState.activeBrains.join(', ')}
Primary Brain: ${pState.primaryBrain}
Brain coordination is MECHANICAL.
`.trim();
      systemOutput.system.push(brainContext);
    }
  };
}

/**
 * Load build context from .shark/auto-inject/BUILD_CONTEXT.md
 * This is written by compacting-hook.ts during compaction.
 * It is read by system-transform-hook.ts on session start.
 * Also checks legacy location for backwards compatibility.
 */
function loadBuildContext(): string | null {
  try {
    // PRIMARY: auto-inject directory (for manual copy/paste)
    const primaryPath = path.join(process.cwd(), '.shark', 'auto-inject', 'BUILD_CONTEXT.md');
    if (fs.existsSync(primaryPath)) {
      return fs.readFileSync(primaryPath, 'utf-8');
    }
    
    // LEGACY: root .shark directory
    const legacyPath = path.join(process.cwd(), '.shark', BUILD_CONTEXT_FILE);
    if (fs.existsSync(legacyPath)) {
      return fs.readFileSync(legacyPath, 'utf-8');
    }
  } catch (err) {
    // Silent fail
  }
  return null;
}