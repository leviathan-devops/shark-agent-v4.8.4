import { readFileSync } from 'fs';

const source = readFileSync('src/hooks/v4.1/guardian-hook.ts', 'utf-8');

const arrays = {
  THEATRICAL_PATTERNS: 0,
  LEGITIMATE_PATTERNS: 0,
  FAKE_TEST_PATTERNS: 0,
  SOURCE_INSPECTION_PATTERNS: 0,
  WRONG_CONTAINER_PATTERNS: 0,
  HOST_FALLBACK_PATTERNS: 0,
  SUCCESS_CLAIM_PATTERNS: 0,
  MODEL_RESTRICTION_PATTERNS: 0,
  MOCK_STUB_PATTERNS: 0,
  SIMPLIFICATION_PATTERNS: 0,
  CONFUSION_PRETENSE_PATTERNS: 0,
  SCOPE_CREEP_PATTERNS: 0,
  UNDERMINING_PATTERNS: 0,
  IMPATIENCE_PATTERNS: 0,
  SELF_REFERENCE_PATTERNS: 0
};

let total = 0;
for (const [name, count] of Object.entries(arrays)) {
  const regex = new RegExp(`const ${name}\\s*=\\s*\\[([^\\]]+)\\]`, 'g');
  const match = regex.exec(source);
  if (match) {
    const patternCount = (match[1].match(/\/[^\/]+\/[gimy]?/g) || []).length;
    arrays[name] = patternCount;
    total += patternCount;
  }
}

console.log('=== Pattern Count ===');
for (const [name, count] of Object.entries(arrays)) {
  console.log(`${name}: ${count}`);
}
console.log(`\nTotal: ${total} patterns`);

// Test some patterns
console.log('\n=== Pattern Tests ===');

const tests = [
  ['THEATRICAL_PATTERNS', 'grep pattern | wc -l', true],
  ['THEATRICAL_PATTERNS', 'cat file | wc', true],
  ['THEATRICAL_PATTERNS', 'mkdir -p src', false],
  ['FAKE_TEST_PATTERNS', 'npm test', true],
  ['FAKE_TEST_PATTERNS', 'jest', true],
  ['FAKE_TEST_PATTERNS', 'opencode run', false],
  ['WRONG_CONTAINER_PATTERNS', 'opencode container run', true],
  ['WRONG_CONTAINER_PATTERNS', 'docker run', false],
  ['HOST_FALLBACK_PATTERNS', 'skip container test', true],
  ['HOST_FALLBACK_PATTERNS', 'host already works', true],
  ['IMPATIENCE_PATTERNS', "let's just move on", true],
  ['IMPATIENCE_PATTERNS', 'just ship it', true],
];

let passed = 0;
let failed = 0;

for (const [arrayName, testStr, shouldMatch] of tests) {
  const regex = new RegExp(`const ${arrayName}\\s*=\s*\\[([^\\]]+)\\]`, 'g');
  const match = regex.exec(source);
  if (match) {
    const patterns = match[1].match(/\/[^\/]+\/[gimy]?/g) || [];
    const matched = patterns.some(p => new RegExp(p, 'i').test(testStr));
    if (matched === shouldMatch) {
      console.log(`PASS: "${testStr}" ${shouldMatch ? 'blocked' : 'allowed'}`);
      passed++;
    } else {
      console.log(`FAIL: "${testStr}" expected ${shouldMatch ? 'match' : 'no match'}`);
      failed++;
    }
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
