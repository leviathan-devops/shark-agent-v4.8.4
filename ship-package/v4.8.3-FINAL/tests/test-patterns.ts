#!/usr/bin/env bun
/**
 * Unit test for shark-agent-v4 patterns
 * Tests that all pattern arrays have the correct counts
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = '/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4';

console.log('=== Shark Agent v4.8.3 Pattern Test ===\n');

// Read the guardian-hook source
const guardianHookPath = join(PROJECT_ROOT, 'src/hooks/v4.1/guardian-hook.ts');
const source = readFileSync(guardianHookPath, 'utf-8');

// Expected pattern counts based on L5 spec
// Note: LEGITIMATE and SOURCE_INSPECTION are whitelists, not anti-derailment patterns
const expectedPatternCounts = {
  'THEATRICAL_PATTERNS': 12,
  'LEGITIMATE_PATTERNS': 3, // whitelist
  'FAKE_TEST_PATTERNS': 9,
  'SOURCE_INSPECTION_PATTERNS': 2, // whitelist
  'WRONG_CONTAINER_PATTERNS': 4,
  'HOST_FALLBACK_PATTERNS': 15,
  'SUCCESS_CLAIM_PATTERNS': 15,
  'MODEL_RESTRICTION_PATTERNS': 15,
  'MOCK_STUB_PATTERNS': 12,
  'SIMPLIFICATION_PATTERNS': 11,
  'CONFUSION_PRETENSE_PATTERNS': 12,
  'SCOPE_CREEP_PATTERNS': 12,
  'UNDERMINING_PATTERNS': 12,
  'IMPATIENCE_PATTERNS': 11,
  'SELF_REFERENCE_PATTERNS': 11,
};

// Count patterns in source by finding array literals
let passed = 0;
let failed = 0;

for (const [name, expectedCount] of Object.entries(expectedPatternCounts)) {
  const regex = new RegExp(`const ${name}\\s*=\\s*\\[([^\\]]+)\\]`, 'g');
  const match = regex.exec(source);
  
  if (!match) {
    console.log(`❌ ${name}: NOT FOUND`);
    failed++;
    continue;
  }
  
  const content = match[1];
  const patternMatches = content.match(/\/[^\/]+\/[gimy]*/g) || [];
  const actualCount = patternMatches.length;
  
  if (actualCount === expectedCount) {
    console.log(`✓ ${name}: ${actualCount} patterns`);
    passed++;
  } else {
    console.log(`❌ ${name}: expected ${expectedCount}, got ${actualCount}`);
    failed++;
  }
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);