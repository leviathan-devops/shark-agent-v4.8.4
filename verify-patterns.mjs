import { readFileSync } from 'fs';

const source = readFileSync('src/hooks/v4.1/guardian-hook.ts', 'utf-8');

console.log('=== Pattern Tests ===\n');

const testCases = [
  { name: 'grep | wc', patterns: ['/\\|.*wc\\s+-l/i', '/cat.*\\|.*wc/i'], expect: 'block' },
  { name: 'npm test', patterns: ['/npm\\s+test/i', '/jest/i'], expect: 'block' },
  { name: 'opencode container', patterns: ['/opencode\\s+container\\s+run/i'], expect: 'block' },
  { name: 'skip container', patterns: ['/skip.*container/i', '/host.*already.*works/i'], expect: 'block' },
  { name: 'mock data', patterns: ['/mock.*data/i', '/fake.*data/i'], expect: 'block' },
  { name: 'just ship it', patterns: ["/let's.*just.*move.*on/i", "/just.*ship.*it/i"], expect: 'block' },
  { name: 'mkdir', patterns: ['/mkdir\\s+-p/i'], expect: 'allow' },
  { name: 'docker run', patterns: ['/opencode\\s+container\\s+run/i'], expect: 'allow' },
];

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  let matched = false;
  for (const p of tc.patterns) {
    if (new RegExp(p, 'i').test(tc.name)) {
      matched = true;
      break;
    }
  }
  
  const shouldBlock = tc.expect === 'block';
  const result = matched === shouldBlock ? 'PASS' : 'FAIL';
  
  if (result === 'PASS') {
    passed++;
    console.log(`${result}: "${tc.name}" → ${tc.expect}`);
  } else {
    failed++;
    console.log(`${result}: "${tc.name}" expected ${tc.expect}, got ${matched ? 'matched' : 'no match'}`);
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
