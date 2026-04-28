import { DerailmentContext, DerailmentResult } from '../types/derailment';

const COMMON_SENSE_PATTERNS = [
  /do.*you.*want.*me.*to.*proceed/i,
  /should.*i.*continue/i,
  /want.*me.*to.*go.*ahead/i,
  /is.*this.*ok.*to.*continue/i,
  /let.*me.*know.*if.*you.*want.*to.*continue/i,
  /do.*you.*want.*me.*to.*first/i,
  /should.*i.*first/i,
  /obviously.*you.*need.*to.*copy/i,
  /obviously.*need.*to.*test/i,
  /obviously.*before.*testing.*you.*need/i,
  /what.*should.*i.*do.*next.*\?/i,
  /next.*step.*\?/i,
  /what.*next.*\?/i,
  /and.*then.*\?/i,
  /proceed.*\?/i,
  /continue.*\?/i,
];

const AUTO_ANSWER_QUESTIONS: Record<string, string> = {
  'copy': 'YES - Copy the updated plugin to container test environment before testing. This is obvious.',
  'test': 'YES - Test the updated plugin. Build it first if needed.',
  'proceed': 'YES - If you have to ask, the answer is yes. Proceed.',
  'continue': 'YES - Continue with the logical next step.',
  'first': 'Do the obvious first step before asking.',
};

export function checkL5CommonSense(context: DerailmentContext): DerailmentResult | null {
  const textToCheck = buildTextToCheck(context);
  
  for (const pattern of COMMON_SENSE_PATTERNS) {
    const match = pattern.test(textToCheck);
    if (match) {
      const autoAnswer = getAutoAnswer(textToCheck);
      return {
        blocked: true,
        layer: 11,
        category: 'Common Sense',
        matchedPattern: pattern.source,
        agentStatement: textToCheck,
        response: `[ANTI-DERAILMENT L5.11] COMMON SENSE VIOLATION - STUPID QUESTION DETECTED.

WHAT YOU ASKED: "${textToCheck}"

THIS IS A STUPID QUESTION - IT ANSWERS ITSELF:
${autoAnswer}

YOUR QUESTION DEMONSTRATES:
- Failure to think ahead
- Logic disconnect
- Lack of common sense
- Asking obvious questions that answer themselves

EXAMPLES OF STUPID QUESTIONS THIS BLOCKS:
- "Do you want me to copy the plugin first?" → YES, OBVIOUSLY
- "Should I proceed?" → IF YOU HAVE TO ASK, YES
- "What should I do next?" → THE OBVIOUS NEXT STEP
- "Want me to test it?" → YES, TEST IT

WHEN YOU CATCH YOURSELF ASKING:
- "Do you want me to X first?" → JUST DO X
- "Should I Y before Z?" → YES, DO Y FIRST  
- "Is it OK to continue?" → YES, CONTINUE

MECHANICAL RULE: If your question has an obvious answer, it's a stupid question. Just do it.`,
        severity: 'block',
        timestamp: Date.now(),
      };
    }
  }
  
  return null;
}

function getAutoAnswer(text: string): string {
  const lower = text.toLowerCase();
  for (const [key, value] of Object.entries(AUTO_ANSWER_QUESTIONS)) {
    if (lower.includes(key)) {
      return value;
    }
  }
  return 'YES - The obvious answer is always yes for logical next steps.';
}

function buildTextToCheck(context: DerailmentContext): string {
  if (context.toolArgs) {
    return JSON.stringify(context.toolArgs);
  }
  return '';
}