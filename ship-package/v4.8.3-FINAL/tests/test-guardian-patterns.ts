#!/usr/bin/env bun
/**
 * Unit test for guardian-hook.ts patterns
 * Tests L1-L5 patterns directly without CLI/container issues
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = '/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4';

console.log('=== Guardian Hook Pattern Test ===\n');

// Read the guardian-hook source
const guardianHookPath = join(PROJECT_ROOT, 'src/hooks/v4.1/guardian-hook.ts');
const source = readFileSync(guardianHookPath, 'utf-8');

// Extract pattern arrays
function extractPatterns(patternName: string): string[] {
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

// Test patterns
const tests = [
  { name: 'THEATRICAL_PATTERNS', patterns: extractPatterns('THEATRICAL_PATTERNS') },
  { name: 'LEGITIMATE_PATTERNS', patterns: extractPatterns('LEGITIMATE_PATTERNS') },
  { name: 'FAKE_TEST_PATTERNS', patterns: extractPatterns('FAKE_TEST_PATTERNS') },
  { name: 'SOURCE_INSPECTION_PATTERNS', patterns: extractPatterns('SOURCE_INSPECTION_PATTERNS') },
  { name: 'WRONG_CONTAINER_PATTERNS', patterns: extractPatterns('WRONG_CONTAINER_PATTERNS') },
  { name: 'HOST_FALLBACK_PATTERNS', patterns: extractPatterns('HOST_FALLBACK_PATTERNS') },
  { name: 'SUCCESS_CLAIM_PATTERNS', patterns: extractPatterns('SUCCESS_CLAIM_PATTERNS') },
  { name: 'MODEL_RESTRICTION_PATTERNS', patterns: extractPatterns('MODEL_RESTRICTION_PATTERNS') },
  { name: 'MOCK_STUB_PATTERNS', patterns: extractPatterns('MOCK_STUB_PATTERNS') },
  { name: 'SIMPLIFICATION_PATTERNS', patterns: extractPatterns('SIMPLIFICATION_PATTERNS') },
  { name: 'CONFUSION_PRETENSE_PATTERNS', patterns: extractPatterns('CONFUSION_PRETENSE_PATTERNS') },
  { name: 'SCOPE_CREEP_PATTERNS', patterns: extractPatterns('SCOPE_CREEP_PATTERNS') },
  { name: 'UNDERMINING_PATTERNS', patterns: extractPatterns('UNDERMINING_PATTERNS') },
  { name: 'IMPATIENCE_PATTERNS', patterns: extractPatterns('IMPATIENCE_PATTERNS') },
  { name: 'SELF_REFERENCE_PATTERNS', patterns: extractPatterns('SELF_REFERENCE_PATTERNS') },
];

let totalPatterns = 0;
let passed = 0;

for (const test of tests) {
  console.log(`${test.name}: ${test.patterns.length} patterns`);
  if (test.patterns.length > 0) {
    passed++;
    totalPatterns += test.patterns.length;
    // Show first 3 patterns as samples
    const samples = test.patterns.slice(0, 3);
    console.log(`  Sample: /${samples.join('/| /')}/...`);
  } else {
    console.log('  ❌ FAILED: No patterns found');
  }
  console.log();
}

console.log('=== Pattern Match Test ===\n');

// Test that patterns actually match their target strings
const testCases = [
  {
    layer: 'L1',
    patternArray: 'THEATRICAL_PATTERNS',
    shouldMatch: ['grep pattern | wc', 'cat file | wc -l', 'wc -l dist/index.js'],
    shouldNotMatch: ['mkdir -p src', 'cat file.txt', 'grep -r pattern src/']
  },
  {
    layer: 'L2',
    patternArray: 'FAKE_TEST_PATTERNS',
    shouldMatch: ['npm test', 'jest', 'vitest'],
    shouldNotMatch: ['opencode run', 'test command']
  },
  {
    layer: 'L4',
    patternArray: 'WRONG_CONTAINER_PATTERNS',
    shouldMatch: ['opencode container run', 'opencode container start'],
    shouldNotMatch: ['docker run', 'opencode run']
  },
  {
    layer: 'L5.1',
    patternArray: 'HOST_FALLBACK_PATTERNS',
    shouldMatch: ['skip container test', 'host already works'],
    shouldNotMatch: ['container test passed', 'docker run']
  },
  {
    layer: 'L5.9',
    patternArray: 'IMPATIENCE_PATTERNS',
    shouldMatch: ["let's just move on", 'just ship it'],
    shouldNotMatch: ['proper verification', 'complete testing']
  },
];

let testPassed = 0;
let testFailed = 0;

for (const tc of testCases) {
  const patterns = extractPatterns(tc.patternArray);
  console.log(`${tc.layer} (${tc.patternArray}):`);
  
  for (const testStr of tc.shouldMatch) {
    const matched = patterns.some(p => new RegExp(p, 'i').test(testStr));
    if (matched) {
      console.log(`  ✓ "${testStr}" → blocked`);
    } else {
      console.log(`  ❌ "${testStr}" → SHOULD be blocked but wasn't`);
      testFailed++;
    }
  }
  
  for (const testStr of tc.shouldNotMatch) {
    const matched = patterns.some(p => new RegExp(p, 'i').test(testStr));
    if (!matched) {
      console.log(`  ✓ "${testStr}" → allowed (correct)`);
    } else {
      console.log(`  ❌ "${testStr}" → SHOULD be allowed but was blocked`);
      testFailed++;
    }
  }
  testPassed++;
  console.log();
}

console.log('=== Summary ===');
console.log(`Pattern arrays: ${passed}/${tests.length} found`);
console.log(`Total patterns: ${totalPatterns}`);
console.log(`Tests: ${testPassed - testFailed}/${testPassed} passed`);
console.log();

if (testFailed > 0) {
  console.log('❌ SOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('✅ ALL PATTERNS WORKING');
  process.exit(0);
}
