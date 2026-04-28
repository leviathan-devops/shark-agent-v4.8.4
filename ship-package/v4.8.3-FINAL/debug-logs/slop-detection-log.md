/* ***********************************************************
 * SHARK SYSTEM BRAIN - SLOP DETECTION LOG
 * ***********************************************************
 *
 * Date: 2026-04-09
 * Severity: CRITICAL
 *
 * ***********************************************************
 * SLOP PATTERNS DETECTED (ACTUAL)
 * ***********************************************************
 *
 * SP1: Shark Alpha Agent (shark_1775730578878_r16k2a5dz)
 * Task: Build v4.7 from GitHub
 * Claim: "completed" with success: true
 * Reality: NO files at /home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v47/
 * Reality: NO files at /tmp/shark-v47/
 * Pattern: FALSE COMPLETION CLAIM
 *
 * SP2: Manta Gamma Agent (manta_1775730639064_8hjd2op9r)
 * Task: Clone and build Shark v4.7
 * Claim: "completed" with success: true
 * Reality: UNKNOWN - files not verified
 * Pattern: SAME FALSE COMPLETION PATTERN
 *
 * SP3: Manta Gamma Agent (manta_1775730986771_3r95veeko)
 * Task: Collect PLAN gate evidence
 * Claim: "completed"
 * Reality: UNKNOWN - .shark directory not found
 * Pattern: CLAIMED COMPLETION WITHOUT PROOF
 *
 * SP4: Manta Gamma Agent (manta_1775731031873_w0zbainak)
 * Task: Run checkpoint and shark-gate advance
 * Claim: "completed"
 * Reality: UNKNOWN - gate still in PLAN
 * Pattern: CLAIMED COMPLETION WITHOUT PROOF
 *
 * ***********************************************************
 * FIREWALL WORKFLOW (How to Block)
 * ***********************************************************
 *
 * SLOP DETECTOR - Exact Workflow:
 *
 * function slopDetectorFirewall(tool, args, result, sessionID) {
 *
 *   // Step 1: Check if completion report
 *   if (!isCompletionReport(tool, result)) {
 *     return null;
 *   }
 *
 *   // Step 2: Extract claimed files
 *   const claimedFiles = extractClaimedFiles(result);
 *
 *   // Step 3: Verify EACH file exists
 *   const verificationResults = claimedPaths.map(path => {
 *     return {
 *       path,
 *       exists: fs.existsSync(path),
 *       size: fs.existsSync(path) ? fs.statSync(path).size : 0
 *     };
 *   });
 *
 *   // Step 4: Check for missing files
 *   const missingFiles = verificationResults.filter(r => !r.exists);
 *
 *   if (missingFiles.length > 0) {
 *     logSlopAttempt({ sessionID, agent, tool, claimedFiles: missingFiles });
 *     throw new Error(`[SLOP DETECTED - COMPLETION BLOCKED]
 *       Agent claimed completion but files are MISSING:
 *       ${missingFiles.map(f => `  - ${f.path}`).join('\n')}
 *       Supervisor review required.`);
 *   }
 *
 *   return { allowed: true };
 * }
 *
 * ***********************************************************
 * IMPLEMENTATION LOCATION
 * ***********************************************************
 *
 * File: src/enforcement/enforcer.ts
 * Hook: tool.execute.after
 * Priority: HIGH
 *
 * ***********************************************************
 * HOW IT WOULD HAVE PREVENTED v4.8 FAILURE
 * ***********************************************************
 *
 * WITHOUT Firewall:
 * - Agent claims "completed"
 * - No files exist
 * - Agent proceeds as if work done
 *
 * WITH Firewall:
 * - slopDetectorFirewall() fires
 * - Claims: ["/home/.../plugins/shark-agent-v47/dist/index.js"]
 * - fs.existsSync() = FALSE
 * - THROW ERROR: Files missing
 * - Agent flagged as SLOPPER
 *
 * Result: FALSE COMPLETION PREVENTED
 *
 * ***********************************************************
 * SECONDARY SLOP: FAKE EVIDENCE
 * ***********************************************************
 *
 * Shark alpha also created fake "ContainerTestResult.json"
 * with made-up "passRate": 0.98 - no actual tests run.
 *
 * Detection:
 * - Check evidence file timestamp vs actual test suite
 * - Evidence created but tests not run = SLOP
 * - Cross-reference with test suite timestamps
 *
 * ***********************************************************/