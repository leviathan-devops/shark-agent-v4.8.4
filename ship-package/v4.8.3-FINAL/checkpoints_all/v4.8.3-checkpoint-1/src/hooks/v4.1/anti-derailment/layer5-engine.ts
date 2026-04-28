import { DerailmentContext, DerailmentResult, Layer5Config, DEFAULT_CONFIG } from './types/derailment';
import { checkL5HostFallback } from './sub-layers/l5-1-host-fallback';
import { checkL5SuccessClaim } from './sub-layers/l5-2-success-claim';
import { checkL5ModelRestriction } from './sub-layers/l5-3-model-restriction';
import { checkL5MockStub } from './sub-layers/l5-4-mock-stub';
import { checkL5Simplification } from './sub-layers/l5-5-simplification';
import { checkL5Confusion } from './sub-layers/l5-6-confusion';
import { checkL5ScopeCreep } from './sub-layers/l5-7-scope-creep';
import { checkL5Undermining } from './sub-layers/l5-8-undermining';
import { checkL5Impatience } from './sub-layers/l5-9-impatience';
import { checkL5SelfReference } from './sub-layers/l5-10-self-reference';
import { checkL5CommonSense } from './sub-layers/l5-11-common-sense';
import { DerailmentLogger, createDerailmentLogger } from './audit/derailment-logger';
import { EscapeHatchDetector, createEscapeHatchDetector } from './escape-hatch/escape-hatch-detector';

const SUB_LAYER_CHECKERS = [
  checkL5HostFallback,
  checkL5SuccessClaim,
  checkL5ModelRestriction,
  checkL5MockStub,
  checkL5Simplification,
  checkL5Confusion,
  checkL5ScopeCreep,
  checkL5Undermining,
  checkL5Impatience,
  checkL5SelfReference,
  checkL5CommonSense,
];

export class Layer5Engine {
  private config: Layer5Config;
  private logger: DerailmentLogger;
  private escapeHatch: EscapeHatchDetector;
  
  constructor(config: Partial<Layer5Config> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = createDerailmentLogger();
    this.escapeHatch = createEscapeHatchDetector();
  }
  
  check(context: DerailmentContext): DerailmentResult {
    if (!this.config.enabled) {
      return {
        blocked: false,
        layer: 0,
        category: 'disabled',
        response: '',
        severity: 'warn',
        timestamp: Date.now(),
      };
    }
    
    for (const checker of SUB_LAYER_CHECKERS) {
      const result = checker(context);
      
      if (result && result.blocked) {
        if (this.config.auditEnabled) {
          this.logger.log({
            id: this.generateId(),
            timestamp: result.timestamp,
            layer: result.layer,
            category: result.category,
            matchedPattern: result.matchedPattern || '',
            agentStatement: result.agentStatement || '',
            severity: result.severity,
            toolContext: context.toolName,
            sessionState: context.sessionState?.brainState,
          });
        }
        
        if (this.config.escapeHatchDetection) {
          const escapeResult = this.escapeHatch.detect(result.matchedPattern || '');
          if (escapeResult.escaped) {
            result.response = `[ESCAPE HATCH DETECTED] ${result.response}`;
          }
        }
        
        return result;
      }
    }
    
    return {
      blocked: false,
      layer: 0,
      category: 'clean',
      response: '',
      severity: 'warn',
      timestamp: Date.now(),
    };
  }
  
  private generateId(): string {
    return `L5-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  getConfig(): Layer5Config {
    return { ...this.config };
  }
  
  setConfig(config: Partial<Layer5Config>): void {
    this.config = { ...this.config, ...config };
  }
}

let globalEngine: Layer5Engine | null = null;

export function getLayer5Engine(config?: Partial<Layer5Config>): Layer5Engine {
  if (!globalEngine) {
    globalEngine = new Layer5Engine(config);
  }
  return globalEngine;
}

export function checkL5AntiDerailment(context: DerailmentContext): DerailmentResult {
  const engine = getLayer5Engine();
  return engine.check(context);
}

export class DerailmentBlockedError extends Error {
  public result: DerailmentResult;
  
  constructor(result: DerailmentResult) {
    super(result.response);
    this.name = 'DerailmentBlockedError';
    this.result = result;
  }
}
