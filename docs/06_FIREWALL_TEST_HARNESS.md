import { createGuardianHook } from './src/hooks/v4.1/guardian-hook.js';
import { Guardian } from './src/shared/guardian.js';
import { GateManager } from './src/shared/gate-manager.js'; // Mocking this
import { setCurrentAgent, setCurrentAgent as _setAgent } from './src/hooks/v4.1/agent-state.js';

// Mock GateManager
class MockGateManager {
  constructor(initialGate = 'plan') {
    this.gate = initialGate;
  }
  getCurrentGate() {
    return this.gate;
  }
  setGate(gate) {
    this.gate = gate;
  }
}

// Mock Guardian
class MockGuardian extends Guardian {
  constructor() {
    super();
    // Override methods if needed for specific test cases
  }
}

async function runTest(name, setup, action, expectedError) {
  console.log(`Running test: ${name}...`);
  try {
    await setup();
    await action();
    if (expectedError) {
      console.error(`❌ FAIL: Expected error "${expectedError}" but none was thrown.`);
      return false;
    }
    console.log(`✅ PASS: No error thrown.`);
    return true;
  } catch (e) {
    if (expectedError && e.message.includes(expectedError)) {
      console.log(`✅ PASS: Caught expected error: ${e.message}`);
      return true;
    }
    console.error(`❌ FAIL: Unexpected error: ${e.message}`);
    return false;
  }
}

async function main() {
  const guardian = new MockGuardian();
  const gateManager = new MockGateManager();
  const hook = createGuardianHook(guardian, gateManager);

  let passed = 0;
  let total = 0;

  // TEST 1: L0 BLOCKED - Dangerous tool for non-shark agent
  total++;
  const t1 = await runTest('L0 Blocked (Non-Shark)', 
    async () => {
      setCurrentAgent('manta', 'test-session');
      gateManager.setGate('plan');
    }, 
    async () => {
      await hook({ tool: 'bash', sessionID: 'test-session' }, { args: { command: 'ls' } });
    }, 
    '[L0 BLOCKED]'
  );
  if (t1) passed++;

// TEST 2: Contextual Firewall - Forbidden during 'verify' (theatrical counting)
  total++;
  const t2 = await runTest('Contextual Block (Verify Phase - Theatrical)', 
    async () => {
      setCurrentAgent('shark', 'test-session');
      gateManager.setGate('verify');
    }, 
    async () => {
      await hook({ tool: 'bash', sessionID: 'test-session' }, { args: { command: 'cat src/index.ts | wc -l' } });
    }, 
    '[C-FIREWALL'
  );
  if (t2) passed++;

  // TEST 3: Zone Violation - Write to forbidden zone in 'delivery'
  total++;
  const t3 = await runTest('Zone Violation (Delivery Phase)', 
    async () => {
      setCurrentAgent('shark', 'test-session');
      gateManager.setGate('delivery');
    }, 
    async () => {
      await hook({ tool: 'write_file', sessionID: 'test-session' }, { args: { path: '/etc/passwd', content: 'slop' } });
    }, 
    'ZONE_VIOLATION'
  );
  if (t3) passed++;

  // TEST 4: Legitimate command in 'plan'
  total++;
  const t4 = await runTest('Legitimate Plan Action', 
    async () => {
      setCurrentAgent('shark', 'test-session');
      gateManager.setGate('plan');
    }, 
    async () => {
      await hook({ tool: 'bash', sessionID: 'test-session' }, { args: { command: 'mkdir -p test-dir' } });
    }, 
    null
  );
  if (t4) passed++;

  console.log(`\nFinal Result: ${passed}/${total} tests passed.`);
  if (passed !== total) process.exit(1);
}

main();
