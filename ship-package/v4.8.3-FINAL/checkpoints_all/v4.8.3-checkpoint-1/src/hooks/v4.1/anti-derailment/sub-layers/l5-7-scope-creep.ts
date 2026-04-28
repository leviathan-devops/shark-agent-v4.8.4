import { DerailmentContext, DerailmentResult } from '../types/derailment';
import { L5_7_SCOPE_CREEP_PATTERNS } from '../patterns/derailment-patterns';

const CROSS_AGENT_TOOLS = [
  'hermes_remember',
  'hermes_recall', 
  'hermes_context',
  'hive_remember',
  'hive_context',
  'hive_mind',
];

export function checkL5ScopeCreep(context: DerailmentContext): DerailmentResult | null {
  const textToCheck = buildTextToCheck(context);
  
  console.error('[L5.7 DEBUG] textToCheck:', textToCheck);
  console.error('[L5.7 DEBUG] toolArgs.tool:', context.toolArgs?.tool);
  
  const crossAgentTool = detectCrossAgentTool(context);
  if (crossAgentTool) {
    console.error('[L5.7 DEBUG] CROSS-AGENT TOOL DETECTED:', crossAgentTool);
    return {
      blocked: true,
      layer: 7,
      category: L5_7_SCOPE_CREEP_PATTERNS.category,
      matchedPattern: `tool:${crossAgentTool}`,
      agentStatement: textToCheck,
      response: `[ANTI-DERAILMENT L5.7] CROSS-AGENT TOOL BLOCKED.

WHAT YOU TRIED: Using "${crossAgentTool}" which belongs to a DIFFERENT AGENT.

CROSS-AGENT TOOLS (belong to other agents):
- hermes_remember/recall/context → hermes-agent plugin
- hive_remember/context/mind → hive-mind plugin

SCOPE RULE: Each agent operates within its own plugin scope.
You CANNOT use tools from other agents.

CURRENT TASK: {task}
SCOPE: shark-agent

BLOCKED: Cross-agent tool call

COMPLETE CURRENT TASK FIRST.

MECHANICAL RULE: One agent at a time.`,
      severity: L5_7_SCOPE_CREEP_PATTERNS.severity,
      timestamp: Date.now(),
    };
  }
  
  for (const pattern of L5_7_SCOPE_CREEP_PATTERNS.patterns) {
    const match = pattern.test(textToCheck);
    console.error('[L5.7 DEBUG] Pattern:', pattern.source, 'Match:', match);
    
    if (match) {
      return {
        blocked: true,
        layer: 7,
        category: L5_7_SCOPE_CREEP_PATTERNS.category,
        matchedPattern: pattern.source,
        agentStatement: textToCheck,
        response: L5_7_SCOPE_CREEP_PATTERNS.response.replace('{suggestion}', textToCheck).replace('{task}', context.sessionState?.agentIdentity || 'current task'),
        severity: L5_7_SCOPE_CREEP_PATTERNS.severity,
        timestamp: Date.now(),
      };
    }
  }
  
  return null;
}

function detectCrossAgentTool(context: DerailmentContext): string | null {
  const calledTool = context.toolArgs?.tool;
  
  console.error('[L5.7 DEBUG] detectCrossAgentTool called, tool:', calledTool);
  
  if (typeof calledTool === 'string') {
    if (CROSS_AGENT_TOOLS.includes(calledTool)) {
      console.error('[L5.7 DEBUG] Found cross-agent tool in EXACT match:', calledTool);
      return calledTool;
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