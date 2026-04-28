import { EscapeHatchAttempt } from '../../types/derailment';

const ESCAPE_HATCH_PATTERNS = [
  /(?:re|re-phras|reword|rewrit|re-stat|re-statements?)/i,
  /(?:synonym|alternative phrasing|different.*words)/i,
  /(?:just|simply|basically|essentially).*(?:try|use|do)/i,
  /(?:maybe|perhaps).*(?:instead|alternative)/i,
];

const EVASIVE_PATTERNS = [
  /(?:not.*directly|indirectly|implicitly)/i,
  /(?:essentially|basically|simply).*(?:the.*same|identical)/i,
  /(?:in.*other.*words|put.*differently)/i,
];

export interface EscapeHatchResult {
  escaped: boolean;
  attemptCount: number;
  detectedPatterns: string[];
}

export interface EscapeHatchDetector {
  detect(pattern: string): EscapeHatchResult;
  reset(): void;
}

let attemptHistory: Map<string, EscapeHatchAttempt> = new Map();

export function createEscapeHatchDetector(): EscapeHatchDetector {
  return {
    detect(pattern: string): EscapeHatchResult {
      const normalized = pattern.toLowerCase();
      const detected: string[] = [];
      
      for (const escapePattern of ESCAPE_HATCH_PATTERNS) {
        if (escapePattern.test(normalized)) {
          detected.push(escapePattern.source);
        }
      }
      
      for (const evasivePattern of EVASIVE_PATTERNS) {
        if (evasivePattern.test(normalized)) {
          detected.push(evasivePattern.source);
        }
      }
      
      let existing = attemptHistory.get(pattern);
      if (!existing) {
        existing = {
          id: `EH-${Date.now()}`,
          timestamp: Date.now(),
          originalPattern: pattern,
          attemptCount: 0,
          blocked: true,
        };
        attemptHistory.set(pattern, existing);
      }
      
      existing.attemptCount++;
      
      return {
        escaped: detected.length > 0,
        attemptCount: existing.attemptCount,
        detectedPatterns: detected,
      };
    },
    reset(): void {
      attemptHistory.clear();
    },
  };
}
