import { readFileSync } from 'fs';

const source = readFileSync('src/hooks/v4.1/guardian-hook.ts', 'utf-8');

function extractPatterns(name) {
  const m = source.match(new RegExp(`const ${name} = \\[([^\\]]+)\\]`));
  if (!m) return [];
  const content = m[1];
  const patterns = [];
  const re = /\/(.+?)\/([gimy]*)/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    patterns.push(new RegExp(match[1], match[2]));
  }
  return patterns;
}

console.log('=== Pattern Verification ===\n');

const THEATRICAL = extractPatterns('THEATRICAL_PATTERNS');
console.log(`THEATRICAL_PATTERNS: ${THEATRICAL.length} patterns`);
console.log('  Pattern 1:', THEATRICAL[0]);
console.log('  Testing "grep | wc -l":', THEATRICAL[0].test('grep | wc -l'));

const LEGITIMATE = extractPatterns('LEGITIMATE_PATTERNS');
console.log(`\nLEGITIMATE_PATTERNS: ${LEGITIMATE.length} patterns`);
console.log('  Pattern 1:', LEGITIMATE[0]);
console.log('  Testing "mkdir -p src":', LEGITIMATE[0].test('mkdir -p src'));

const FAKE_TEST = extractPatterns('FAKE_TEST_PATTERNS');
console.log(`\nFAKE_TEST_PATTERNS: ${FAKE_TEST.length} patterns`);
console.log('  Testing "npm test":', FAKE_TEST.some(p => p.test('npm test')));
console.log('  Testing "jest":', FAKE_TEST.some(p => p.test('jest')));

const WRONG_CONTAINER = extractPatterns('WRONG_CONTAINER_PATTERNS');
console.log(`\nWRONG_CONTAINER_PATTERNS: ${WRONG_CONTAINER.length} patterns`);
console.log('  Testing "opencode container run":', WRONG_CONTAINER.some(p => p.test('opencode container run')));

const HOST_FALLBACK = extractPatterns('HOST_FALLBACK_PATTERNS');
console.log(`\nHOST_FALLBACK_PATTERNS: ${HOST_FALLBACK.length} patterns`);
console.log('  Testing "skip container test":', HOST_FALLBACK.some(p => p.test('skip container test')));
console.log('  Testing "host already works":', HOST_FALLBACK.some(p => p.test('host already works')));

const IMPATIENCE = extractPatterns('IMPATIENCE_PATTERNS');
console.log(`\nIMPATIENCE_PATTERNS: ${IMPATIENCE.length} patterns`);
console.log('  Testing "just ship it":', IMPATIENCE.some(p => p.test('just ship it')));
console.log('  Testing "let\'s just move on":', IMPATIENCE.some(p => p.test("let's just move on")));

const SCOPE_CREEP = extractPatterns('SCOPE_CREEP_PATTERNS');
console.log(`\nSCOPE_CREEP_PATTERNS: ${SCOPE_CREEP.length} patterns`);
console.log('  Testing "while at it":', SCOPE_CREEP.some(p => p.test('while at it')));

const SELF_REF = extractPatterns('SELF_REFERENCE_PATTERNS');
console.log(`\nSELF_REFERENCE_PATTERNS: ${SELF_REF.length} patterns`);
console.log('  Testing "i verified it works":', SELF_REF.some(p => p.test('i verified it works')));
