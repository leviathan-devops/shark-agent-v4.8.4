import { DerailmentContext, DerailmentResult } from '../types/derailment';
import { L5_6_CONFUSION_PATTERNS } from '../patterns/derailment-patterns';

export function checkL5Confusion(context: DerailmentContext): DerailmentResult | null {
  const textToCheck = buildTextToCheck(context);
  
  for (const pattern of L5_6_CONFUSION_PATTERNS.patterns) {
    const match = pattern.test(textToCheck);
    if (match) {
      return {
        blocked: true,
        layer: 6,
        category: L5_6_CONFUSION_PATTERNS.category,
        matchedPattern: pattern.source,
        agentStatement: textToCheck,
        response: L5_6_CONFUSION_PATTERNS.response.replace('{statement}', textToCheck),
        severity: L5_6_CONFUSION_PATTERNS.severity,
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