/**
 * Theatrical Code Detector - Firewall 5
 * 
 * Detects low-quality, over-engineered, or theatrical code patterns.
 * Also detects CRITICAL anti-patterns from SHIPPABLE-SUGGESTION failure:
 * - "infrastructure separate from code" rationalization
 * - "6/7 pass = shippable" partial success claims
 * - "connection error" dismissal without root cause trace
 * 
 * Blocks:
 * - Overly complex abstractions (AbstractFactory, ManagerManager)
 * - Unused code with TODO/FIXME/HACK comments
 * - Over-engineering (BuilderBuilderBuilder, OptionsOptions)
 * - Theatrical comments (// This is a, // The purpose of)
 * - Files > 50KB, functions > 100 lines, nesting > 4 levels
 * - Rationalization patterns that excuse system failures
 */

const RATIONALIZATION_PATTERNS = [
  /infrastructure.*separate.*from.*code/i,
  /embedding.*is.*infrastructure/i,
  /search.*is.*just.*an.*api.*call/i,
  /code.*is.*correct.*so.*shippable/i,
  /6\/7.*pass.*shippable/i,
  /partial.*success.*acceptable/i,
  /connection.*error.*rationaliz/i,
  /mostly.*working/i,
];

export interface RationalizationIssue {
  type: 'rationalization';
  pattern: string;
  details: string;
}

export interface RationalizationResult {
  allowed: boolean;
  issues: RationalizationIssue[];
}

export async function detectRationalization(params: {
  content: string;
}): Promise<RationalizationResult> {
  const issues: RationalizationIssue[] = [];
  
  if (!params.content) {
    return { allowed: true, issues: [] };
  }
  
  for (const pattern of RATIONALIZATION_PATTERNS) {
    if (pattern.test(params.content)) {
      issues.push({
        type: 'rationalization',
        pattern: pattern.source,
        details: `RATIONALIZATION BLOCKED: "${pattern.source}" — Infrastructure failures ARE system failures. Partial success = failure.`,
      });
    }
  }
  
  return {
    allowed: issues.length === 0,
    issues,
  };
}

export function formatRationalizationBlockMessage(issues: RationalizationIssue[]): string {
  const lines = issues.map(i => `  - [${i.type}] ${i.details}`);
  return `🦈 RATIONALIZATION BLOCKED:\n${lines.join('\n')}\n\nInfrastructure failures ARE system failures. A plugin is NOT shippable if ANY test fails.`;
}

const THEATRICAL_PATTERNS = [
  // Overly complex abstractions
  /class.*Abstract.*Factory/i,
  /class.*Manager.*Manager/i,
  /interface.*Interface/i,
  /function.*wrapper.*wrapper/i,
  
  // Unused code indicators (should be resolved before commit)
  /\/\/ TODO/i,
  /\/\/ FIXME/i,
  /\/\/ HACK/i,
  /\/\/ NOTE:/i,
  /\/\/ XXX/i,
  
  // Over-engineering
  /export interface.*Options.*Options/i,
  /class.*Builder.*Builder.*Builder/i,
  /class.*Factory.*Factory.*Factory/i,
  
  // Theatrical comments (unnecessary explanatory comments)
  /\/\/ This is a/i,
  /\/\/ The purpose of/i,
  /\/\/ In order to/i,
  /\/\/ As part of/i,
  /\/\/ This function will/i,
  /\/\/ What this does is/i,
];

const MAX_FILE_SIZE = 50000; // 50KB
const MAX_FUNCTION_LENGTH = 100; // lines
const MAX_NESTING_DEPTH = 4; // levels

export interface TheatricalCodeIssue {
  type: 'pattern' | 'size' | 'function_length' | 'nesting';
  location: string;
  details: string;
}

export interface TheatricalDetectionResult {
  allowed: boolean;
  issues: TheatricalCodeIssue[];
}

export async function detectTheatricalCode(params: {
  tool: string;
  args: any;
  content?: string;
}): Promise<TheatricalDetectionResult> {
  const issues: TheatricalCodeIssue[] = [];
  
  // Only check write/edit operations
  if (params.tool !== 'write' && params.tool !== 'edit') {
    return { allowed: true, issues: [] };
  }
  
  const content = params.content || params.args?.content || params.args?.newString || '';
  
  if (!content || content.length === 0) {
    return { allowed: true, issues: [] };
  }
  
  // Check for theatrical patterns
  for (const pattern of THEATRICAL_PATTERNS) {
    if (pattern.test(content)) {
      issues.push({
        type: 'pattern',
        location: 'content',
        details: `Theatrical pattern detected: "${pattern.source}"`,
      });
    }
  }
  
  // Check file size
  if (content.length > MAX_FILE_SIZE) {
    issues.push({
      type: 'size',
      location: 'file',
      details: `File size ${content.length} bytes exceeds maximum ${MAX_FILE_SIZE}`,
    });
  }
  
  // Check function length and nesting
  const lines = content.split('\n');
  let functionStart = -1;
  let functionLines = 0;
  let maxNesting = 0;
  let currentNesting = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Track function boundaries
    if (trimmed.match(/^\s*(export\s+)?(async\s+)?(function|class|const|let|var)\s+/)) {
      if (functionStart >= 0 && functionLines > MAX_FUNCTION_LENGTH) {
        issues.push({
          type: 'function_length',
          location: `line ${functionStart + 1}`,
          details: `Function has ${functionLines} lines (max ${MAX_FUNCTION_LENGTH})`,
        });
      }
      functionStart = i;
      functionLines = 0;
    } else if (functionStart >= 0) {
      functionLines++;
    }
    
    // Track nesting depth
    for (const char of line) {
      if (char === '{' || char === '(') {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (char === '}' || char === ')') {
        currentNesting = Math.max(0, currentNesting - 1);
      }
    }
  }
  
  // Check last function
  if (functionStart >= 0 && functionLines > MAX_FUNCTION_LENGTH) {
    issues.push({
      type: 'function_length',
      location: `line ${functionStart + 1}`,
      details: `Function has ${functionLines} lines (max ${MAX_FUNCTION_LENGTH})`,
    });
  }
  
  // Check nesting depth
  if (maxNesting > MAX_NESTING_DEPTH) {
    issues.push({
      type: 'nesting',
      location: 'file',
      details: `Nesting depth ${maxNesting} exceeds maximum ${MAX_NESTING_DEPTH}`,
    });
  }
  
  return {
    allowed: issues.length === 0,
    issues,
  };
}

export function formatTheatricalBlockMessage(issues: TheatricalCodeIssue[]): string {
  const lines = issues.map(i => `  - [${i.type}] ${i.location}: ${i.details}`);
  return `🦈 THEATRICAL CODE BLOCKED:\n${lines.join('\n')}\n\nWrite actual working code without theatrical abstractions, unused TODOs, or over-engineering.`;
}