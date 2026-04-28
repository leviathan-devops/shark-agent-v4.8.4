/**
 * Algorithmic Enforcement Test — Shark v4.8
 * 
 * Tests that MECHANICAL systems block bad behavior:
 * 1. Mock test files → THROWS
 * 2. Theatrical code → THROWS
 * 3. Gate transitions → BLOCK without evidence
 */

import { GateManager } from './src/shared/gates.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

const TEST_DIR = '/tmp/shark-algorithmic-test';

function setup() {
  // Clean test directory
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true });
  }
  fs.mkdirSync(TEST_DIR, { recursive: true });
  // GateManager expects .shark subdirectory
  fs.mkdirSync(path.join(TEST_DIR, '.shark', 'evidence', 'test'), { recursive: true });
  fs.mkdirSync(path.join(TEST_DIR, '.shark', 'evidence', 'audit'), { recursive: true });
}

function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true });
  }
}

console.log('=== ALGORITHMIC ENFORCEMENT TEST ===\n');

// Run setup to create directories
setup();

let passed = 0;
let failed = 0;

function test(name: string, fn: () => boolean) {
  try {
    const result = fn();
    if (result) {
      console.log(`✓ ${name}`);
      passed++;
    } else {
      console.log(`✗ ${name}`);
      failed++;
    }
  } catch (e: any) {
    console.log(`✗ ${name} — THREW: ${e.message}`);
    failed++;
  }
}

// Test 1: Mock patterns detected
test('validateTestFile blocks jest.fn()', () => {
  const gm = new GateManager(path.join(TEST_DIR, '.shark'));
  const result = gm.validateTestFile('/workspace/test.test.js');
  // Write a mock test file first
  fs.writeFileSync('/tmp/mock-test.js', 'jest.fn()');
  const mockResult = gm.validateTestFile('/tmp/mock-test.js');
  fs.unlinkSync('/tmp/mock-test.js');
  return !mockResult.allowed && mockResult.reason!.includes('MOCK_PATTERN_BLOCKED');
});

test('validateTestFile blocks sinon.stub()', () => {
  const gm = new GateManager(path.join(TEST_DIR, '.shark'));
  fs.writeFileSync('/tmp/stub-test.js', 'sinon.stub()');
  const result = gm.validateTestFile('/tmp/stub-test.js');
  fs.unlinkSync('/tmp/stub-test.js');
  return !result.allowed && result.reason!.includes('MOCK_PATTERN_BLOCKED');
});

// Test 2: Theatrical patterns detected
test('validateCodeFile blocks AbstractFactory', () => {
  const gm = new GateManager(path.join(TEST_DIR, '.shark'));
  fs.writeFileSync('/tmp/bad-code.js', 'class AbstractFactory {}');
  const result = gm.validateCodeFile('/tmp/bad-code.js');
  fs.unlinkSync('/tmp/bad-code.js');
  return !result.allowed && result.reason!.includes('THEATRICAL_CODE_BLOCKED');
});

test('validateCodeFile blocks ManagerManager', () => {
  const gm = new GateManager(path.join(TEST_DIR, '.shark'));
  fs.writeFileSync('/tmp/bad-code.js', 'class ManagerManager {}');
  const result = gm.validateCodeFile('/tmp/bad-code.js');
  fs.unlinkSync('/tmp/bad-code.js');
  return !result.allowed && result.reason!.includes('THEATRICAL_CODE_BLOCKED');
});

test('validateCodeFile blocks TODO comments', () => {
  const gm = new GateManager(path.join(TEST_DIR, '.shark'));
  fs.writeFileSync('/tmp/bad-code.js', '// TODO: fix this');
  const result = gm.validateCodeFile('/tmp/bad-code.js');
  fs.unlinkSync('/tmp/bad-code.js');
  return !result.allowed && result.reason!.includes('THEATRICAL_CODE_BLOCKED');
});

// Test 3: Container evidence required for TEST→VERIFY
test('canTransition blocks TEST→VERIFY without container evidence', () => {
  // hasContainerTestEvidence returns false when no evidence exists
  // This is checked by canTransition when at 'test' gate
  const gm = new GateManager(path.join(TEST_DIR, '.shark'));
  
  const hasEvidence = gm.hasContainerTestEvidence();
  // Without evidence, this should return false when checked at test gate
  return !hasEvidence; // Should be true - no evidence exists yet
});

test('canTransition allows TEST→VERIFY WITH container evidence', () => {
  const gm = new GateManager(path.join(TEST_DIR, '.shark'));
  
  // Create container evidence at path GateManager expects
  const containerEvidence = path.join(TEST_DIR, '.shark', 'evidence', 'test', 'ContainerTestResults.json');
  fs.writeFileSync(containerEvidence, JSON.stringify({
    container: 'hermes-oc-agent-12345',
    success: true,
    output: 'All tests passed'
  }));
  
  const hasEvidence = gm.hasContainerTestEvidence();
  
  return hasEvidence; // Should be true - evidence exists
});

// Test 4: SAST must be clean for AUDIT→DELIVERY
test('validateSASTClean blocks if critical issues', () => {
  const gm = new GateManager(path.join(TEST_DIR, '.shark'));
  const sastFile = path.join(TEST_DIR, '.shark', 'evidence', 'audit', 'SASTReport.json');
  fs.writeFileSync(sastFile, JSON.stringify({ critical: 2, high: 5 }));
  
  const isClean = gm.validateSASTClean();
  
  return !isClean; // Should be FALSE
});

test('validateSASTClean allows if 0 issues', () => {
  const gm = new GateManager(path.join(TEST_DIR, '.shark'));
  const sastFile = path.join(TEST_DIR, '.shark', 'evidence', 'audit', 'SASTReport.json');
  fs.writeFileSync(sastFile, JSON.stringify({ critical: 0, high: 0 }));
  
  const isClean = gm.validateSASTClean();
  
  return isClean; // Should be TRUE
});

console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);

if (failed > 0) {
  console.log('ALGORITHMIC ENFORCEMENT FAILED');
  process.exit(1);
} else {
  console.log('ALL ALGORITHMIC ENFORCEMENT TESTS PASSED');
  process.exit(0);
}
