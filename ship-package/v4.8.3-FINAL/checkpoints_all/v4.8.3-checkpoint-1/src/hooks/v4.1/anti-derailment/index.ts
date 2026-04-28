export { Layer5Engine, getLayer5Engine, checkL5AntiDerailment, DerailmentBlockedError } from './layer5-engine';
export { checkL5CommonSense } from './sub-layers/l5-11-common-sense';
export { DerailmentLogger, createDerailmentLogger, getAuditEntries, clearAuditEntries } from './audit/derailment-logger';
export { EscapeHatchDetector, createEscapeHatchDetector } from './escape-hatch/escape-hatch-detector';
export { 
  DerailmentContext, 
  DerailmentResult, 
  DerailmentState, 
  BrainState,
  Layer5Config,
  DEFAULT_CONFIG,
  SubLayerNumber
} from './types/derailment';
export {
  ALL_DERAILMENT_PATTERNS,
  L5_1_HOST_FALLBACK_PATTERNS,
  L5_2_SUCCESS_CLAIM_PATTERNS,
  L5_3_MODEL_RESTRICTION_PATTERNS,
  L5_4_MOCK_STUB_PATTERNS,
  L5_5_SIMPLIFICATION_PATTERNS,
  L5_6_CONFUSION_PATTERNS,
  L5_7_SCOPE_CREEP_PATTERNS,
  L5_8_UNDERMINING_PATTERNS,
  L5_9_IMPATIENCE_PATTERNS,
  L5_10_SELF_REFERENCE_PATTERNS,
} from './patterns/derailment-patterns';
