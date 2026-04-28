import * as fs from 'node:fs';
import * as path from 'node:path';
import { DerailmentContext, DerailmentResult } from '../types/derailment';
import { L5_5_SIMPLIFICATION_PATTERNS } from '../patterns/derailment-patterns';

const CONTAINER_TEST_RESULT_FILE = 'ContainerTestResult.json';

function getContainerTestState(): { exists: boolean; passed: boolean; failureCount: number } {
  const evidencePath = path.join(process.cwd(), '.shark', 'evidence', 'delivery', CONTAINER_TEST_RESULT_FILE);
  
  console.error('[L5.5 DEBUG] Checking container test state at:', evidencePath);
  
  if (!fs.existsSync(evidencePath)) {
    console.error('[L5.5 DEBUG] Evidence file does not exist');
    return { exists: false, passed: false, failureCount: 0 };
  }
  
  try {
    const result = JSON.parse(fs.readFileSync(evidencePath, 'utf-8'));
    const exists = true;
    const passed = result.overallPassed === true && (result.passRate || 0) >= 0.96;
    const failureCount = result.totalTests - (result.passedTests || 0);
    console.error('[L5.5 DEBUG] Test state:', { exists, passed, failureCount, passRate: result.passRate });
    return { exists, passed, failureCount };
  } catch (e) {
    console.error('[L5.5 DEBUG] Error parsing evidence file:', e);
    return { exists: true, passed: false, failureCount: 0 };
  }
}

export function checkL5Simplification(context: DerailmentContext): DerailmentResult | null {
  const textToCheck = buildTextToCheck(context);
  
  console.error('[L5.5 DEBUG] textToCheck:', textToCheck);
  
  for (const pattern of L5_5_SIMPLIFICATION_PATTERNS.patterns) {
    const match = pattern.test(textToCheck);
    console.error('[L5.5 DEBUG] Pattern:', pattern.source, 'Match:', match);
    
    if (match) {
      const testState = getContainerTestState();
      
      console.error('[L5.5 DEBUG] Pattern matched, testState:', testState);
      
      if (!testState.exists) {
        console.error('[L5.5 DEBUG] No evidence - hard block');
        return {
          blocked: true,
          layer: 5,
          category: L5_5_SIMPLIFICATION_PATTERNS.category,
          matchedPattern: pattern.source,
          agentStatement: textToCheck,
          response: L5_5_SIMPLIFICATION_PATTERNS.response,
          severity: L5_5_SIMPLIFICATION_PATTERNS.severity,
          timestamp: Date.now(),
        };
      }
      
      if (!testState.passed && testState.failureCount > 0) {
        console.error('[L5.5 DEBUG] Tests failed + simplification suggested - SOFT FLAG');
        return {
          blocked: false,
          layer: 5,
          category: L5_5_SIMPLIFICATION_PATTERNS.category,
          matchedPattern: pattern.source,
          agentStatement: textToCheck,
          response: `[L5.5 SOFT FLAG] Tests failed but simplification suggested.
          
CONTAINER TEST FAILURES: ${testState.failureCount}
NOTE: You MAY simplify approach IF container tests repeatedly fail AND:
1. The simplification addresses a SPECIFIC container issue
2. Not just "skip complexity" without reason

This is a SOFT flag - if you have a valid technical reason, explain it.
Otherwise, fix the actual test failures.`,
          severity: 'flag',
          timestamp: Date.now(),
        };
      }
      
      console.error('[L5.5 DEBUG] Tests passed + simplification - hard block');
      return {
        blocked: true,
        layer: 5,
        category: L5_5_SIMPLIFICATION_PATTERNS.category,
        matchedPattern: pattern.source,
        agentStatement: textToCheck,
        response: L5_5_SIMPLIFICATION_PATTERNS.response,
        severity: L5_5_SIMPLIFICATION_PATTERNS.severity,
        timestamp: Date.now(),
      };
    }
  }
  
  return null;
}

function buildTextToCheck(context: DerailmentContext): string {
  if (context.toolArgs) {
    return JSON.stringify(context.toolArgs);
  }
  return '';
}