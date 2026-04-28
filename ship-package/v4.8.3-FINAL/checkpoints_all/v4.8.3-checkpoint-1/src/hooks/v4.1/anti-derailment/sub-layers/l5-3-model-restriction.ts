import { DerailmentContext, DerailmentResult } from '../types/derailment';
import { L5_3_MODEL_RESTRICTION_PATTERNS } from '../patterns/derailment-patterns';

export function checkL5ModelRestriction(context: DerailmentContext): DerailmentResult | null {
  const textToCheck = buildTextToCheck(context);
  
  for (const pattern of L5_3_MODEL_RESTRICTION_PATTERNS.patterns) {
    const match = pattern.test(textToCheck);
    if (match) {
      return {
        blocked: true,
        layer: 3,
        category: L5_3_MODEL_RESTRICTION_PATTERNS.category,
        matchedPattern: pattern.source,
        agentStatement: textToCheck,
        response: L5_3_MODEL_RESTRICTION_PATTERNS.response,
        severity: L5_3_MODEL_RESTRICTION_PATTERNS.severity,
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