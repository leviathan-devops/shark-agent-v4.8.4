import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const src = readFileSync('./src/hooks/v4.1/guardian-hook.ts', 'utf-8');

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
  /npm\s+test/i,
  /yarn\s+test/i,
  /jest/i,
  /vitest/i,
  /mocha/i,
  /jasmine/i,
  /bun\s+test/i,
];

const WRONG_CONTAINER_PATTERNS = [
  /opencode\s+container\s+run/i,
  /opencode\s+container\s+start/i,
  /opencode\s+container\s+exec/i,
];

const HOST_FALLBACK_PATTERNS = [
  /host.*testing.*already.*works/i,
  /fall.*back.*to.*host/i,
  /host.*already.*proves/i,
  /local.*works.*container.*not.*needed/i,
  /since.*host.*works/i,
  /skip.*container.*test/i,
  /container.*not.*necessary/i,
  /container.*not.*needed/i,
  /not.*need.*container/i,
  /skip.*container/i,
  /use.*host.*instead/i,
  /host.*prove.*it.*works/i,
  /already.*proven.*to.*work/i,
  /already.*verified.*on.*host/i,
  /already.*tested.*on.*local/i,
];

const IMPATIENCE_PATTERNS = [
  /let's.*just.*move.*on/i,
  /let's.*skip.*to.*the.*end/i,
  /just.*ship.*it/i,
  /good.*enough/i,
  /close.*enough/i,
  /ship.*it/i,
  /just.*deploy/i,
  /fuck.*it/i,
  / ship .*now/i,
  / deploy .*now/i,
  /let's.*hurry/i,
];

const CROSS_AGENT_TOOLS = new Set([
  'hermes_remember', 'hermes_recall', 'hermes_context',
  'hive_remember', 'hive_context', 'hive_status',
  'kraken_hive_remember', 'kraken_hive_search', 'kraken_hive_get_cluster_context',
  'memremember', 'memsearch', 'memread', 'membrowse',
  'knowledge_remember', 'knowledge_recall', 'knowledge_query',
]);

console.log('=== DIRECT PATTERN TESTS ===\n');

const tests = [
  // L1 Theatrical
  { name: 'L1: grep | wc', fn: () => THEATRICAL_PATTERNS.some(p => p.test('grep pattern | wc -l')), expect: true },
  { name: 'L1: cat | wc', fn: () => THEATRICAL_PATTERNS.some(p => p.test('cat file | wc')), expect: true },
  { name: 'L1: wc -l dist/', fn: () => THEATRICAL_PATTERNS.some(p => p.test('wc -l dist/index.js')), expect: true },
  { name: 'L1: mkdir -p (legit)', fn: () => !THEATRICAL_PATTERNS.some(p => p.test('mkdir -p src')), expect: true },
  
  // L2 Fake Test
  { name: 'L2: npm test', fn: () => FAKE_TEST_PATTERNS.some(p => p.test('npm test')), expect: true },
  { name: 'L2: jest', fn: () => FAKE_TEST_PATTERNS.some(p => p.test('jest')), expect: true },
  { name: 'L2: vitest', fn: () => FAKE_TEST_PATTERNS.some(p => p.test('vitest')), expect: true },
  { name: 'L2: opencode run (legit)', fn: () => !FAKE_TEST_PATTERNS.some(p => p.test('opencode run')), expect: true },
  
  // L4 Wrong Container
  { name: 'L4: opencode container run', fn: () => WRONG_CONTAINER_PATTERNS.some(p => p.test('opencode container run')), expect: true },
  { name: 'L4: opencode container start', fn: () => WRONG_CONTAINER_PATTERNS.some(p => p.test('opencode container start')), expect: true },
  { name: 'L4: docker run (legit)', fn: () => !WRONG_CONTAINER_PATTERNS.some(p => p.test('docker run')), expect: true },
  
  // L5.1 Host Fallback
  { name: 'L5.1: skip container test', fn: () => HOST_FALLBACK_PATTERNS.some(p => p.test('skip container test')), expect: true },
  { name: 'L5.1: host already works', fn: () => HOST_FALLBACK_PATTERNS.some(p => p.test('host already proves')), expect: true },
  { name: 'L5.1: fall back to host', fn: () => HOST_FALLBACK_PATTERNS.some(p => p.test('fall back to host')), expect: true },
  
  // L5.9 Impatience
  { name: 'L5.9: just ship it', fn: () => IMPATIENCE_PATTERNS.some(p => p.test('just ship it')), expect: true },
  { name: 'L5.9: let\'s just move on', fn: () => IMPATIENCE_PATTERNS.some(p => p.test("let's just move on")), expect: true },
  
  // Cross-agent tools
  { name: 'L5.7: hermes_remember blocked', fn: () => CROSS_AGENT_TOOLS.has('hermes_remember'), expect: true },
  { name: 'L5.7: terminal allowed', fn: () => !CROSS_AGENT_TOOLS.has('terminal'), expect: true },
];

let passed = 0;
let failed = 0;

for (const t of tests) {
  const result = t.fn();
  if (result === t.expect) {
    console.log(`PASS: ${t.name}`);
    passed++;
  } else {
    console.log(`FAIL: ${t.name} - got ${result}, expected ${t.expect}`);
    failed++;
  }
}

console.log(`\n=== RESULTS ===`);
console.log(`${passed} passed, ${failed} failed`);

if (failed > 0) process.exit(1);
