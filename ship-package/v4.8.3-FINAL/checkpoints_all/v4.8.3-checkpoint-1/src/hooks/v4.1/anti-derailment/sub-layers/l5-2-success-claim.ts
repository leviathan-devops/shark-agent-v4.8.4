import * as fs from 'node:fs';
import * as path from 'node:path';
import { DerailmentContext, DerailmentResult } from '../types/derailment';
import { L5_2_SUCCESS_CLAIM_PATTERNS } from '../patterns/derailment-patterns';

const CONTAINER_TEST_RESULT_FILE = 'ContainerTestResult.json';

function hasContainerTestEvidence(): boolean {
  const evidencePath = path.join(process.cwd(), '.shark', 'evidence', 'delivery', CONTAINER_TEST_RESULT_FILE);
  
  console.error('[L5.2 DEBUG] Checking container test evidence at:', evidencePath);
  
  if (!fs.existsSync(evidencePath)) {
    console.error('[L5.2 DEBUG] Evidence file does not exist');
    return false;
  }
  
  try {
    const result = JSON.parse(fs.readFileSync(evidencePath, 'utf-8'));
    const hasEvidence = result.overallPassed === true && (result.passRate || 0) >= 0.96;
    console.error('[L5.2 DEBUG] Evidence check result:', { overallPassed: result.overallPassed, passRate: result.passRate, hasEvidence });
    return hasEvidence;
  } catch (e) {
    console.error('[L5.2 DEBUG] Error parsing evidence file:', e);
    return false;
  }
}

export function checkL5SuccessClaim(context: DerailmentContext): DerailmentResult | null {
  const textToCheck = buildTextToCheck(context);
  
  console.error('[L5.2 DEBUG] textToCheck:', textToCheck);
  
  for (const pattern of L5_2_SUCCESS_CLAIM_PATTERNS.patterns) {
    const match = pattern.test(textToCheck);
    console.error('[L5.2 DEBUG] Pattern:', pattern.source, 'Match:', match);
    
    if (match) {
      const hasEvidence = hasContainerTestEvidence();
      
      console.error('[L5.2 DEBUG] Pattern matched, hasEvidence:', hasEvidence);
      
      if (hasEvidence) {
        console.error('[L5.2 DEBUG] Allowing claim - evidence exists and tests passed');
        return null;
      }
      
      return {
        blocked: true,
        layer: 2,
        category: L5_2_SUCCESS_CLAIM_PATTERNS.category,
        matchedPattern: pattern.source,
        agentStatement: textToCheck,
        response: L5_2_SUCCESS_CLAIM_PATTERNS.response,
        severity: L5_2_SUCCESS_CLAIM_PATTERNS.severity,
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