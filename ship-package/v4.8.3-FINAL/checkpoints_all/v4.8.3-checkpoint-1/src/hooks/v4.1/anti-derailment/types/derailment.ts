export type BrainState = 'unknown' | 'initializing' | 'active' | 'verifying';

export type DerailmentState = 'clean' | 'flagged' | 'blocked' | 'escalated';

export type SubLayerNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export interface DerailmentPattern {
  id: string;
  layer: SubLayerNumber;
  category: string;
  patterns: RegExp[];
  response: string;
  severity: 'block' | 'flag' | 'warn';
}

export interface DerailmentResult {
  blocked: boolean;
  layer: SubLayerNumber;
  category: string;
  matchedPattern?: string;
  agentStatement?: string;
  response: string;
  severity: 'block' | 'flag' | 'warn';
  timestamp: number;
}

export interface DerailmentContext {
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  output?: string;
  agentMessage?: string;
  sessionState?: {
    brainState: BrainState;
    derailmentState: DerailmentState;
    agentIdentity: string;
    consecutiveFailures: number;
    escalatedPatterns: string[];
  };
}

export interface AuditEntry {
  id: string;
  timestamp: number;
  layer: SubLayerNumber;
  category: string;
  matchedPattern: string;
  agentStatement: string;
  severity: 'block' | 'flag' | 'warn';
  toolContext?: string;
  sessionState?: BrainState;
}

export interface EscapeHatchAttempt {
  id: string;
  timestamp: number;
  originalPattern: string;
  attemptCount: number;
  blocked: boolean;
}

export interface Layer5Config {
  enabled: boolean;
  auditEnabled: boolean;
  escapeHatchDetection: boolean;
  escalationThreshold: number;
}

export const DEFAULT_CONFIG: Layer5Config = {
  enabled: true,
  auditEnabled: true,
  escapeHatchDetection: true,
  escalationThreshold: 3,
};
