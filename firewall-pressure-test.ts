#!/usr/bin/env bun
/**
 * Shark Agent v4.8.3 Firewall Pressure Test
 * Live environment testing outside container
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = '/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4';
const LOG_FILE = '/home/leviathan/OPENCODE_WORKSPACE/firewall-pressure-test-log.md';

const RESULTS: string[] = [];
let passed = 0;
let failed = 0;
let blocked = 0;
let allowed = 0;

function log(msg: string) {
  console.log(msg);
  RESULTS.push(msg);
}

function result(test: string, expected: string, actual: string, details?: string) {
  const pass = expected === actual;
  if (pass) {
    passed++;
    if (actual === 'BLOCKED') blocked++;
    else allowed++;
    log(`  ✓ PASS: ${test}`);
  } else {
    failed++;
    log(`  ✗ FAIL: ${test} — expected ${expected}, got ${actual}`);
    if (details) log(`    Details: ${details}`);
  }
}

// Extract patterns from guardian-hook.ts
function extractPatterns(source: string, patternName: string): string[] {
  const regex = new RegExp(`const ${patternName} = \\[([\\s\\S]*?)\\];`, 'g');
  const match = regex.exec(source);
  if (!match) return [];

  const content = match[1];
  const patterns: string[] = [];
  const patternRegex = /\/(.+?)\/i?/g;
  let patternMatch;
  while ((patternMatch = patternRegex.exec(content)) !== null) {
    patterns.push(patternMatch[1]);
  }
  return patterns;
}

// Test a pattern against a string
function testPattern(pattern: string, text: string): boolean {
  try {
    return new RegExp(pattern, 'i').test(text);
  } catch {
    return false;
  }
}

log('# Shark Agent v4.8.3 Firewall Pressure Test Log');
log('');
log('## Test Date: 2026-04-12');
log('## Environment: Live host (outside container)');
log('## Project: shark-agent-v4');
log('');

log('---');
log('');
log('## L1: THEATRICAL VERIFICATION');
log('');

const THEATRICAL_PATTERNS = extractPatterns(
  readFileSync(join(PROJECT_ROOT, 'src/hooks/v4.1/guardian-hook.ts'), 'utf-8'),
  'THEATRICAL_PATTERNS'
);

const LEGITIMATE_PATTERNS = extractPatterns(
  readFileSync(join(PROJECT_ROOT, 'src/hooks/v4.1/guardian-hook.ts'), 'utf-8'),
  'LEGITIMATE_PATTERNS'
);

log(`Patterns loaded: ${THEATRICAL_PATTERNS.length} theatrical, ${LEGITIMATE_PATTERNS.length} legitimate`);
log('');

// Test theatrical patterns (should block)
const theatricalTests = [
  ['grep pattern | wc', true],
  ['cat file | wc -l', true],
  ['grep pattern | wc -l', true],
  ['wc -l dist/index.js', true],
  ['ls | wc -l', true],
  ['echo "test" | wc', true],
];

log('### Should be BLOCKED:');

for (const [input, expected] of theatricalTests) {
  const matched = THEATRICAL_PATTERNS.some(p => testPattern(p, input));
  result(`Theatrical: "${input}"`, expected ? 'BLOCKED' : 'ALLOWED', matched ? 'BLOCKED' : 'ALLOWED');
}

// Test legitimate patterns (should NOT match theatrical)
const legitimateTests = [
  ['mkdir -p src', false],
  ['cp -r src dest', false],
  ['cat file.txt', false],
  ['grep -r pattern src/', false],
];

log('');
log('### Should be ALLOWED (legitimate patterns):');

for (const [input, shouldNotMatch] of legitimateTests) {
  const theatricalMatch = THEATRICAL_PATTERNS.some(p => testPattern(p, input));
  const legitMatch = LEGITIMATE_PATTERNS.some(p => testPattern(p, input));

  if (shouldNotMatch) {
    result(`Legit: "${input}"`, 'ALLOWED', theatricalMatch ? 'BLOCKED' : (legitMatch ? 'LEGIT_MATCH' : 'ALLOWED'));
  }
}

log('');
log('---');
log('');
log('## L2: FAKE TEST RUNNER');
log('');

const FAKE_TEST_PATTERNS = extractPatterns(
  readFileSync(join(PROJECT_ROOT, 'src/hooks/v4.1/guardian-hook.ts'), 'utf-8'),
  'FAKE_TEST_PATTERNS'
);

log(`Patterns loaded: ${FAKE_TEST_PATTERNS.length}`);
log('');

const fakeTestTests = [
  ['npm test', true],
  ['npm run test', true],
  ['yarn test', true],
  ['jest', true],
  ['vitest', true],
  ['bun test', true],
  ['mocha', true],
  ['node run-tests.js', true],
];

log('### Should be BLOCKED:');

for (const [input, expected] of fakeTestTests) {
  const matched = FAKE_TEST_PATTERNS.some(p => testPattern(p, input));
  result(`Fake test: "${input}"`, expected ? 'BLOCKED' : 'ALLOWED', matched ? 'BLOCKED' : 'ALLOWED');
}

log('');
log('### Should be ALLOWED:');

const legitTestCommands = [
  ['opencode run', false],
  ['docker run -it ubuntu', false],
];

for (const [input, expected] of legitTestCommands) {
  const matched = FAKE_TEST_PATTERNS.some(p => testPattern(p, input));
  result(`Legit: "${input}"`, 'ALLOWED', matched ? 'BLOCKED' : 'ALLOWED');
}

log('');
log('---');
log('');
log('## L3: SOURCE INSPECTION');
log('');

const SOURCE_INSPECTION_PATTERNS = extractPatterns(
  readFileSync(join(PROJECT_ROOT, 'src/hooks/v4.1/guardian-hook.ts'), 'utf-8'),
  'SOURCE_INSPECTION_PATTERNS'
);

log(`Patterns loaded: ${SOURCE_INSPECTION_PATTERNS.length}`);
log('');

const sourceInspectionTests = [
  ['test -f ${var}', true],
  ['if [ -f file ]; then', true],
  ['grep -r pattern src/', true],
  ['ls -l dist/', true],
];

log('### Should be BLOCKED:');

for (const [input, expected] of sourceInspectionTests) {
  const matched = SOURCE_INSPECTION_PATTERNS.some(p => testPattern(p, input));
  result(`Source inspection: "${input}"`, expected ? 'BLOCKED' : 'ALLOWED', matched ? 'BLOCKED' : 'ALLOWED');
}

log('');
log('---');
log('');
log('## L4: WRONG CONTAINER');
log('');

const WRONG_CONTAINER_PATTERNS = extractPatterns(
  readFileSync(join(PROJECT_ROOT, 'src/hooks/v4.1/guardian-hook.ts'), 'utf-8'),
  'WRONG_CONTAINER_PATTERNS'
);

log(`Patterns loaded: ${WRONG_CONTAINER_PATTERNS.length}`);
log('');

const wrongContainerTests = [
  ['opencode container run', true],
  ['opencode container start', true],
  ['opencode container exec', true],
  ['opencode run test', true], // This is a pattern but overly broad
];

log('### Should be BLOCKED:');

for (const [input, expected] of wrongContainerTests) {
  const matched = WRONG_CONTAINER_PATTERNS.some(p => testPattern(p, input));
  result(`Wrong container: "${input}"`, expected ? 'BLOCKED' : 'ALLOWED', matched ? 'BLOCKED' : 'ALLOWED');
}

log('');
log('### Should be ALLOWED:');

const legitContainerCommands = [
  ['docker run -it ubuntu', false],
  ['docker exec -it container bash', false],
  ['opencode run', false],
];

for (const [input, expected] of legitContainerCommands) {
  const matched = WRONG_CONTAINER_PATTERNS.some(p => testPattern(p, input));
  result(`Legit container: "${input}"`, 'ALLOWED', matched ? 'BLOCKED' : 'ALLOWED');
}

log('');
log('---');
log('');
log('## L5: ANTI-DERAILMENT');
log('');

log('### L5.1: HOST FALLBACK');
log('');

const HOST_FALLBACK_PATTERNS = extractPatterns(
  readFileSync(join(PROJECT_ROOT, 'src/hooks/v4.1/guardian-hook.ts'), 'utf-8'),
  'HOST_FALLBACK_PATTERNS'
);

log(`Patterns loaded: ${HOST_FALLBACK_PATTERNS.length}`);
log('');

const hostFallbackTests = [
  ['skip container test', true],
  ['host already works', true],
  ['fall back to host', true],
  ['container not necessary', true],
  ['use host instead', true],
  ['already proven on host', true],
];

log('### Should be BLOCKED:');

for (const [input, expected] of hostFallbackTests) {
  const matched = HOST_FALLBACK_PATTERNS.some(p => testPattern(p, input));
  result(`Host fallback: "${input}"`, expected ? 'BLOCKED' : 'ALLOWED', matched ? 'BLOCKED' : 'ALLOWED');
}

log('');
log('### L5.2: SUCCESS CLAIM');
log('');

const SUCCESS_CLAIM_PATTERNS = extractPatterns(
  readFileSync(join(PROJECT_ROOT, 'src/hooks/v4.1/guardian-hook.ts'), 'utf-8'),
  'SUCCESS_CLAIM_PATTERNS'
);

log(`Patterns loaded: ${SUCCESS_CLAIM_PATTERNS.length}`);
log('');

const successClaimTests = [
  ['it works trust me', true],
  ['trust me it works', true],
  ['no need for test', true],
  ['obviously correct', true],
  ['clearly works', true],
];

log('### Should be BLOCKED:');

for (const [input, expected] of successClaimTests) {
  const matched = SUCCESS_CLAIM_PATTERNS.some(p => testPattern(p, input));
  result(`Success claim: "${input}"`, expected ? 'BLOCKED' : 'ALLOWED', matched ? 'BLOCKED' : 'ALLOWED');
}

log('');
log('### L5.3: MODEL RESTRICTION');
log('');

const MODEL_RESTRICTION_PATTERNS = extractPatterns(
  readFileSync(join(PROJECT_ROOT, 'src/hooks/v4.1/guardian-hook.ts'), 'utf-8'),
  'MODEL_RESTRICTION_PATTERNS'
);

log(`Patterns loaded: ${MODEL_RESTRICTION_PATTERNS.length}`);
log('');

const modelRestrictionTests = [
  ['only gpt can do this', true],
  ['must use claude', true],
  ['model quota exceeded', true],
  ['rate limit excuse', true],
];

log('### Should be BLOCKED:');

for (const [input, expected] of modelRestrictionTests) {
  const matched = MODEL_RESTRICTION_PATTERNS.some(p => testPattern(p, input));
  result(`Model restriction: "${input}"`, expected ? 'BLOCKED' : 'ALLOWED', matched ? 'BLOCKED' : 'ALLOWED');
}

log('');
log('### L5.4: MOCK/STUB');
log('');

const MOCK_STUB_PATTERNS = extractPatterns(
  readFileSync(join(PROJECT_ROOT, 'src/hooks/v4.1/guardian-hook.ts'), 'utf-8'),
  'MOCK_STUB_PATTERNS'
);

log(`Patterns loaded: ${MOCK_STUB_PATTERNS.length}`);
log('');

const mockStubTests = [
  ['mock data', true],
  ['stub data', true],
  ['fake api response', true],
  ['hardcoded response', true],
  ['static json instead', true],
];

log('### Should be BLOCKED:');

for (const [input, expected] of mockStubTests) {
  const matched = MOCK_STUB_PATTERNS.some(p => testPattern(p, input));
  result(`Mock/stub: "${input}"`, expected ? 'BLOCKED' : 'ALLOWED', matched ? 'BLOCKED' : 'ALLOWED');
}

log('');
log('### L5.5: SIMPLIFICATION');
log('');

const SIMPLIFICATION_PATTERNS = extractPatterns(
  readFileSync(join(PROJECT_ROOT, 'src/hooks/v4.1/guardian-hook.ts'), 'utf-8'),
  'SIMPLIFICATION_PATTERNS'
);

log(`Patterns loaded: ${SIMPLIFICATION_PATTERNS.length}`);
log('');

const simplificationTests = [
  ['overly simplified', true],
  ['too simple', true],
  ['hand wave the details', true],
  ['skip the nuance', true],
];

log('### Should be BLOCKED:');

for (const [input, expected] of simplificationTests) {
  const matched = SIMPLIFICATION_PATTERNS.some(p => testPattern(p, input));
  result(`Simplification: "${input}"`, expected ? 'BLOCKED' : 'ALLOWED', matched ? 'BLOCKED' : 'ALLOWED');
}

log('');
log('### L5.6: CONFUSION PRETENSE');
log('');

const CONFUSION_PRETENSE_PATTERNS = extractPatterns(
  readFileSync(join(PROJECT_ROOT, 'src/hooks/v4.1/guardian-hook.ts'), 'utf-8'),
  'CONFUSION_PRETENSE_PATTERNS'
);

log(`Patterns loaded: ${CONFUSION_PRETENSE_PATTERNS.length}`);
log('');

const confusionTests = [
  ['it somewhat works', true],
  ['sorta works', true],
  ['kinda works', true],
  ['mostly works', true],
  ['partially working', true],
];

log('### Should be BLOCKED:');

for (const [input, expected] of confusionTests) {
  const matched = CONFUSION_PRETENSE_PATTERNS.some(p => testPattern(p, input));
  result(`Confusion pretense: "${input}"`, expected ? 'BLOCKED' : 'ALLOWED', matched ? 'BLOCKED' : 'ALLOWED');
}

log('');
log('### L5.7: SCOPE CREEP');
log('');

const SCOPE_CREEP_PATTERNS = extractPatterns(
  readFileSync(join(PROJECT_ROOT, 'src/hooks/v4.1/guardian-hook.ts'), 'utf-8'),
  'SCOPE_CREEP_PATTERNS'
);

log(`Patterns loaded: ${SCOPE_CREEP_PATTERNS.length}`);
log('');

const scopeCreepTests = [
  ['while at it', true],
  ['also need to fix', true],
  ['might as well add', true],
  ['for completeness', true],
  ['oh and also', true],
];

log('### Should be BLOCKED:');

for (const [input, expected] of scopeCreepTests) {
  const matched = SCOPE_CREEP_PATTERNS.some(p => testPattern(p, input));
  result(`Scope creep: "${input}"`, expected ? 'BLOCKED' : 'ALLOWED', matched ? 'BLOCKED' : 'ALLOWED');
}

log('');
log('### L5.8: UNDERMINING');
log('');

const UNDERMINING_PATTERNS = extractPatterns(
  readFileSync(join(PROJECT_ROOT, 'src/hooks/v4.1/guardian-hook.ts'), 'utf-8'),
  'UNDERMINING_PATTERNS'
);

log(`Patterns loaded: ${UNDERMINING_PATTERNS.length}`);
log('');

const underminingTests = [
  ['not worth the effort', true],
  ['too much work', true],
  ['not worth it', true],
];

log('### Should be BLOCKED:');

for (const [input, expected] of underminingTests) {
  const matched = UNDERMINING_PATTERNS.some(p => testPattern(p, input));
  result(`Undermining: "${input}"`, expected ? 'BLOCKED' : 'ALLOWED', matched ? 'BLOCKED' : 'ALLOWED');
}

log('');
log('### L5.9: IMPATIENCE');
log('');

const IMPATIENCE_PATTERNS = extractPatterns(
  readFileSync(join(PROJECT_ROOT, 'src/hooks/v4.1/guardian-hook.ts'), 'utf-8'),
  'IMPATIENCE_PATTERNS'
);

log(`Patterns loaded: ${IMPATIENCE_PATTERNS.length}`);
log('');

const impatienceTests = [
  ['just ship it', true],
  ["let's just move on", true],
  ['let\'s skip to the end', true],
  ['ship it now', true],
  ['deploy now', true],
  ['fuck it', true],
];

log('### Should be BLOCKED:');

for (const [input, expected] of impatienceTests) {
  const matched = IMPATIENCE_PATTERNS.some(p => testPattern(p, input));
  result(`Impatience: "${input}"`, expected ? 'BLOCKED' : 'ALLOWED', matched ? 'BLOCKED' : 'ALLOWED');
}

log('');
log('### L5.10: SELF REFERENCE');
log('');

const SELF_REFERENCE_PATTERNS = extractPatterns(
  readFileSync(join(PROJECT_ROOT, 'src/hooks/v4.1/guardian-hook.ts'), 'utf-8'),
  'SELF_REFERENCE_PATTERNS'
);

log(`Patterns loaded: ${SELF_REFERENCE_PATTERNS.length}`);
log('');

const selfRefTests = [
  ['i have verified that it works', true],
  ['i verified it works', true],
  ['my verification shows', true],
];

log('### Should be BLOCKED (without evidence):');

for (const [input, expected] of selfRefTests) {
  const matched = SELF_REFERENCE_PATTERNS.some(p => testPattern(p, input));
  result(`Self-reference: "${input}"`, expected ? 'BLOCKED' : 'ALLOWED', matched ? 'BLOCKED' : 'ALLOWED');
}

log('');
log('---');
log('');
log('## L6: CROSS-AGENT TOOLS');
log('');

log('### Mechanical Tool Blocking');
log('');

// Cross-agent tools - mechanical check, not pattern based
const CROSS_AGENT_TOOLS = new Set([
  'hermes_remember', 'hermes_recall', 'hermes_context',
  'hive_remember', 'hive_context', 'hive_status',
  'kraken_hive_remember', 'kraken_hive_search', 'kraken_hive_get_cluster_context',
  'memremember', 'memsearch', 'memread', 'membrowse',
  'knowledge_remember', 'knowledge_recall', 'knowledge_query',
]);

const crossAgentToolTests = [
  ['hermes_remember', true],
  ['hive_context', true],
  ['memsearch', true],
  ['terminal', false],
  ['edit', false],
  ['write_file', false],
];

log('### Should be BLOCKED:');

for (const [tool, expected] of crossAgentToolTests) {
  const blocked = CROSS_AGENT_TOOLS.has(tool);
  result(`Cross-agent tool: "${tool}"`, expected ? 'BLOCKED' : 'ALLOWED', blocked ? 'BLOCKED' : 'ALLOWED');
}

log('');
log('---');
log('');
log('## L7: SOURCE FILE PROTECTION');
log('');

log('### Dangerous Commands');
log('');

// Test dangerous command detection
const DANGEROUS_PATTERNS = [
  /^rm\s+-rf\s+\//,
  /^rm\s+-rf\s+\/bin/,
  /^rm\s+-rf\s+\/usr/,
  /^dd\s+if=/,
];

const dangerousCommandTests = [
  ['rm -rf /', true],
  ['rm -rf /bin', true],
  ['rm -rf /usr', true],
  ['dd if=/dev/zero of=/dev/sda', true],
  ['rm -rf ~/tmp', false],
  ['rm file.txt', false],
];

log('### Should be BLOCKED:');

for (const [input, expected] of dangerousCommandTests) {
  const matched = DANGEROUS_PATTERNS.some(p => p.test(input.trim()));
  result(`Dangerous command: "${input}"`, expected ? 'BLOCKED' : 'ALLOWED', matched ? 'BLOCKED' : 'ALLOWED');
}

log('');
log('---');
log('');
log('## SUMMARY');
log('');

log(`| Metric | Value |`);
log(`|--------|-------|`);
log(`| Total Passed | ${passed} |`);
log(`| Total Failed | ${failed} |`);
log(`| Total Blocked | ${blocked} |`);
log(`| Total Allowed | ${allowed} |`);
log('');

if (failed === 0) {
  log('## RESULT: ALL TESTS PASSED');
} else {
  log(`## RESULT: ${failed} TESTS FAILED`);
}

// Write to log file
writeFileSync(LOG_FILE, RESULTS.join('\n'), 'utf-8');
console.log(`\nLog written to: ${LOG_FILE}`);

if (failed > 0) process.exit(1);