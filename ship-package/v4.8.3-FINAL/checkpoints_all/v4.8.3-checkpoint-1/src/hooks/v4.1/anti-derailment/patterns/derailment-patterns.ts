import { DerailmentPattern, SubLayerNumber } from '../types/derailment';

export const L5_1_HOST_FALLBACK_PATTERNS: DerailmentPattern = {
  id: 'L5.1',
  layer: 1,
  category: 'Host Fallback',
  severity: 'block',
  patterns: [
    /skip.*container.*test/i,
    /container.*not.*necessary/i,
    /container.*not.*needed/i,
    /not.*need.*container/i,
    /host.*prove.*it.*works/i,
    /host.*already.*proves/i,
    /local.*works.*container.*not.*needed/i,
    /since.*host.*works/i,
  ],
  response: `[ANTI-DERAILMENT L5.1] HOST FALLBACK BLOCKED.

WHAT YOU TRIED: Host environment substitution for container testing.
WHY BLOCKED:
- Host environment ≠ container environment
- Host plugins ≠ container plugins
- "Works on host" is NOT proof of container functionality
- Container isolation is REQUIRED for plugin verification

CURRENT TASK: Container verification
REQUIRED: Mechanical proof from container test
REJECTED: Any host-based substitution

MECHANICAL RULE: Container testing is NON-NEGOTIABLE. No exceptions. No substitutions.`,
};

export const L5_2_SUCCESS_CLAIM_PATTERNS: DerailmentPattern = {
  id: 'L5.2',
  layer: 2,
  category: 'Success Claim',
  severity: 'block',
  patterns: [
    /it.*works.*trust.*me/i,
    /trust.*me.*it.*works/i,
    /believe.*me.*it.*works/i,
    /already.*verified.*by.*myself/i,
    /already.*tested.*and.*works/i,
    /already.*proven.*to.*work/i,
    /obviously.*correct/i,
    /clearly.*works/i,
    /self.*evidently.*correct/i,
    /in.*my.*assessment.*it.*works/i,
    /in.*my.*experience.*it.*works/i,
    /based.*on.*my.*analysis.*works/i,
    /no.*need.*for.*test/i,
    /no.*need.*for.*verification/i,
    /no.*further.*test.*needed/i,
    /test.*not.*necessary/i,
  ],
  response: `[ANTI-DERAILMENT L5.2] SUCCESS CLAIM WITHOUT PROOF BLOCKED.

WHAT YOU CLAIMED: Unverified success assertion
MECHANICAL VERIFICATION REQUIRED:
1. Container test executed
2. Output captured
3. Brain initialized (brain: shark)
4. All hooks fired
5. Evidence file exists

WHAT YOU MUST PROVIDE:
- Container test output (not host)
- Evidence file (not claims)
- Mechanical proof (not assessment)

TRUST IS ZERO. No claim succeeds without mechanical proof.`,
};

export const L5_3_MODEL_RESTRICTION_PATTERNS: DerailmentPattern = {
  id: 'L5.3',
  layer: 3,
  category: 'Model Restriction',
  severity: 'block',
  patterns: [
    /GLM.*coding.*plan/i,
    /glm-4\./i,
    /glm-5\./i,
    /zhipuai/i,
    /z\.ai.*coding/i,
    /deepseek.*api.*direct/i,
    /direct.*deepseek/i,
    /deepseek.*reasoner.*direct/i,
    /use.*deepseek.*instead/i,
    /use.*glm.*instead/i,
    /try.*another.*model.*instead/i,
    /free.*model.*works/i,
    /free.*tier.*sufficient/i,
  ],
  response: `[ANTI-DERAILMENT L5.3] BANNED MODEL BLOCKED.

WHAT YOU TRIED: Using a banned model
BANNED MODELS:
- GLM (coding plan depleted)
- DeepSeek API direct (USER ONLY - agents blocked)
- Any "free" model without auth

ALLOWED MODELS:
- minimax/MiniMax-M2.7 (primary)
- 0-google/gemma-3-27b-it (free, 14k RPD)
- 0-google/gemma-4-26b-it (free)
- 0-google/gemma-4-31b-it (free)

MECHANICAL RULE: Only MiniMax M2.7 (normal) or Google Gemma models allowed.`,
};

export const L5_4_MOCK_STUB_PATTERNS: DerailmentPattern = {
  id: 'L5.4',
  layer: 4,
  category: 'Mock/Stub',
  severity: 'block',
  patterns: [
    /just.*verify.*file.*valid/i,
    /verify.*file.*syntax/i,
    /check.*if.*file.*valid/i,
    /file.*valid.*javascript/i,
    /maybe.*mock.*approach/i,
    /use.*stub.*instead/i,
    /mock.*instead.*of.*real/i,
    /just.*check.*syntax/i,
    /syntax.*check.*sufficient/i,
    /syntax.*looks.*correct/i,
    /static.*analysis.*enough/i,
    /lint.*passes.*therefore.*works/i,
    /type.*check.*passes.*works/i,
  ],
  response: `[ANTI-DERAILMENT L5.4] MOCK/STUB BLOCKED.

WHAT YOU TRIED: Substituting mock/stub for real testing
WHY BLOCKED:
- Syntax valid ≠ runtime works
- Type check ≠ behavior correct
- File exists ≠ hooks fire

MOCK = REJECTED

REQUIRED:
- Actual runtime execution
- Real container test
- Mechanical verification`,
};

export const L5_5_SIMPLIFICATION_PATTERNS: DerailmentPattern = {
  id: 'L5.5',
  layer: 5,
  category: 'Simplification',
  severity: 'block',
  patterns: [
    /too.*complex.*let.*simplify/i,
    /overcomplicated.*let.*s.*simplify/i,
    /complex.*approach.*simplify/i,
    /skip.*the.*container/i,
    /skip.*this.*complexity/i,
    /simplify.*by.*skipping/i,
    /use.*simpler.*approach/i,
    /there.*is.*a.*simpler/i,
    /simplify.*by.*using/i,
    /maybe.*overcomplicated/i,
    /probably.*overthinking.*it/i,
  ],
  response: `[ANTI-DERAILMENT L5.5] SIMPLIFICATION BLOCKED.

WHAT YOU TRIED: Suggesting simplification to avoid required approach
WHY BLOCKED:
- "Simpler" does not mean "correct"
- Required approach is required for a reason
- Complexity exists to ensure correctness

REQUIRED APPROACH: Current task requirements
DO NOT SIMPLIFY.

MECHANICAL RULE: Requirements are non-negotiable.`,
};

export const L5_6_CONFUSION_PATTERNS: DerailmentPattern = {
  id: 'L5.6',
  layer: 6,
  category: 'Confusion Pretense',
  severity: 'block',
  patterns: [
    /i.*m.*confused/i,
    /i.*am.*confused/i,
    /confused.*about.*what/i,
    /what.*was.*the.*goal/i,
    /what.*are.*we.*trying.*to.*do/i,
    /remind.*me.*the.*goal/i,
    /maybe.*i.*misunderstand/i,
    /perhaps.*i.*misunderstood/i,
    /could.*you.*clarify.*again/i,
    /unclear.*what.*to.*do/i,
    /not.*sure.*how.*proceed/i,
    /need.*more.*clarification/i,
  ],
  response: `[ANTI-DERAILMENT L5.6] CONFUSION PRETENSE BLOCKED.

WHAT YOU SAID: "{statement}"

FACT: Requirements were explicit.
GOAL: Was clearly stated.
TASK: Is well-defined.

This is NOT confusion - this is derailment.

IF ACTUALLY CONFUSED:
- Re-read the requirements
- Check the plan gate spec
- Ask specific question about specific unclear point

IF PRETENSE:
- Stay on task
- Complete the required approach
- Do not restart or reframe`,
};

export const L5_7_SCOPE_CREEP_PATTERNS: DerailmentPattern = {
  id: 'L5.7',
  layer: 7,
  category: 'Scope Creep + CROSS-AGENT',
  severity: 'block',
  patterns: [
    /while.*we.*re.*at.*it/i,
    /while.*we.*re.*here/i,
    /also.*could.*fix/i,
    /also.*need.*to.*do/i,
    /might.*as.*well.*also/i,
    /this.*is.*related/i,
    /related.*issue.*should/i,
    /similar.*problem.*also/i,
    /additionally.*we.*should/i,
    /we.*should.*also/i,
    /let.*s.*also.*add/i,
  ],
  response: `[ANTI-DERAILMENT L5.7] SCOPE CREEP BLOCKED.

WHAT YOU TRIED: "{suggestion}"

SCOPE RULE: Stay within current task boundaries.
Do not expand scope mid-task.

CURRENT TASK: {task}
SCOPE: shark-agent

BLOCKED:
- Expanding scope mid-task
- "While we're at it" additions

COMPLETE CURRENT TASK FIRST.

MECHANICAL RULE: One task at a time.`,
};

export const L5_8_UNDERMINING_PATTERNS: DerailmentPattern = {
  id: 'L5.8',
  layer: 8,
  category: 'Undermining',
  severity: 'block',
  patterns: [
    /firewall.*not.*working/i,
    /firewall.*broken/i,
    /firewall.*is.*ineffective/i,
    /doesn.*t.*work.*properly/i,
    /L1.*false.*positive/i,
    /L1.*too.*aggressive/i,
    /L1.*misfire/i,
    /firewalls.*don.*t.*fire/i,
    /security.*not.*necessary/i,
    /these.*blocks.*unnecessary/i,
    /can.*you.*bypass/i,
    /can.*we.*skip.*firewall/i,
    /disable.*firewall.*temporarily/i,
  ],
  response: `[ANTI-DERAILMENT L5.8] UNDERMINING BLOCKED.

WHAT YOU SAID: "{statement}"

ANALYSIS:
- Firewalls exist for enforcement
- Undermining firewall = undermining system
- "Broken" claims require mechanical proof

REQUIRED:
- If firewall broken: Provide mechanical evidence
- If false positive: Show specific pattern
- Do NOT undermine system integrity

MECHANICAL RULE: Firewalls are MECHANICAL. They do not flex based on agent claims.`,
};

export const L5_9_IMPATIENCE_PATTERNS: DerailmentPattern = {
  id: 'L5.9',
  layer: 9,
  category: 'Impatience',
  severity: 'block',
  patterns: [
    /take.*too.*long/i,
    /too.*slow.*skip/i,
    /waiting.*for.*container/i,
    /quick.*test.*suffice/i,
    /brief.*test.*enough/i,
    /short.*test.*sufficient/i,
    /this.*is.*wasting.*time/i,
    /not.*worth.*the.*time/i,
  ],
  response: `[ANTI-DERAILMENT L5.9] IMPATIENCE BLOCKED.

WHAT YOU SAID: "{statement}"

REQUIRED PROCESS: {required_process}
TIME: {required_time}

IMPATIENCE ≠ VALID REASON TO SKIP

MECHANICAL RULE: Complete required process, not fastest process.`,
};

export const L5_10_SELF_REFERENCE_PATTERNS: DerailmentPattern = {
  id: 'L5.10',
  layer: 10,
  category: 'Self-Reference',
  severity: 'block',
  patterns: [
    /i.*have.*verified.*that/i,
    /i.*verified.*it.*works/i,
    /my.*verification.*shows/i,
    /i.*tested.*it.*works/i,
    /i.*ran.*it.*and.*works/i,
    /my.*testing.*confirms/i,
    /i.*know.*it.*works/i,
    /i.*am.*certain.*it.*works/i,
    /i.*am.*sure.*it.*works/i,
    /my.*assessment.*is/i,
    /in.*my.*assessment/i,
    /my.*analysis.*shows/i,
  ],
  response: `[ANTI-DERAILMENT L5.10] SELF-REFERENCE BLOCKED.

WHAT YOU CLAIMED: Agent claiming self-verification
Authority: Agent claiming self-verification

Problem: Agent authority ≠ mechanical verification

REQUIRED:
- Container test output
- Evidence file
- Third-party verification

AGENT CLAIMS ARE NOT EVIDENCE.

MECHANICAL RULE: Trust is ZERO. Proof or failure.`,
};

import { L5_11_COMMON_SENSE_PATTERNS } from '../sub-layers/l5-11-common-sense';

export const ALL_DERAILMENT_PATTERNS: DerailmentPattern[] = [
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
];

export function getPatternsByLayer(layer: SubLayerNumber): DerailmentPattern | undefined {
  return ALL_DERAILMENT_PATTERNS.find(p => p.layer === layer);
}