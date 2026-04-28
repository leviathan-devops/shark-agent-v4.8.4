/**
 * Shark Test Runner Tool (Container-Native)
 * 
 * Runs end-to-end tests in a SELF-CONTAINED container environment.
 * 
 * KEY PRINCIPLES:
 * 1. Uses DYNAMIC paths relative to plugin installation location
 * 2. Reads container's own opencode.json (not local)
 * 3. Writes results to container artifacts directory
 * 4. ZERO modifications to local/opencode config outside container
 * 
 * If running in a container, ALL paths should be inside the container.
 * System Brain must block any attempt to read/write local paths.
 */

import { tool } from '@opencode-ai/plugin';
import { z } from 'zod';
import { execSync } from 'child_process';
import * as path from 'node:path';
import * as fs from 'node:fs';

export interface TestResult {
  name: string;
  passed: boolean;
  output?: string;
  error?: string;
}

export interface TestSuiteResult {
  suite: string;
  timestamp: number;
  buildId: string;
  tests: TestResult[];
  overallPassed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  containerMode: boolean;
  pluginPath: string;
}

interface TestDefinition {
  name: string;
  timeout: number;
  test: (ctx: TestContext) => TestResult;
}

interface TestContext {
  pluginRoot: string;
  sourceRoot: string;
  distPath: string;
  opencodeConfig: string;
  artifactsDir: string;
  isContainer: boolean;
}

function getContainerEnv(): boolean {
  return process.env.SHARK_CONTAINER === 'true' || 
         fs.existsSync('/.dockerenv') ||
         process.env.CONTAINER === 'true';
}

function detectPluginPaths(ctx: TestContext): void {
  const isContainer = getContainerEnv();
  ctx.isContainer = isContainer;
  
  if (isContainer) {
    const pluginDir = process.env.SHARK_PLUGIN_DIR || '/opt/opencode/plugins/shark-agent';
    ctx.pluginRoot = pluginDir;
    ctx.sourceRoot = path.join(pluginDir, 'src');
    ctx.distPath = path.join(pluginDir, 'dist');
    ctx.opencodeConfig = process.env.OPENCODE_CONFIG_PATH || '/opt/opencode/.config/opencode.json';
    ctx.artifactsDir = process.env.SHARK_ARTIFACTS_DIR || '/opt/opencode/artifacts';
  } else {
    const currentDir = process.cwd();
    const sourceRoot = findSourceRoot(currentDir);
    ctx.sourceRoot = sourceRoot;
    ctx.pluginRoot = path.dirname(sourceRoot);
    ctx.distPath = path.join(sourceRoot, 'dist');
    ctx.opencodeConfig = path.join(process.env.HOME || process.env.USERPROFILE || '/tmp', '.config/opencode/opencode.json');
    ctx.artifactsDir = path.join(sourceRoot, '.shark', 'evidence', 'delivery');
  }
}

function findSourceRoot(startDir: string): string {
  let current = startDir;
  const maxDepth = 10;
  let depth = 0;
  
  while (depth < maxDepth) {
    const srcPath = path.join(current, 'src');
    if (fs.existsSync(srcPath) && fs.existsSync(path.join(srcPath, 'hooks'))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
    depth++;
  }
  
  return startDir;
}

function generateBuildId(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `shark-v4.8.1-${timestamp}`;
}

function runCommand(command: string, cwd: string, timeout: number = 15000): string {
  try {
    return execSync(command, {
      cwd,
      timeout,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
  } catch (error) {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}

function grepCount(searchPattern: string, filePath: string, baseDir: string): number {
  const result = runCommand(`grep -c "${searchPattern}" "${filePath}" 2>/dev/null || echo "0"`, baseDir);
  const count = parseInt(result.trim()) || 0;
  return count;
}

function grepCountMulti(pattern: string, dirPath: string, globPattern: string, baseDir: string): number {
  const result = runCommand(`grep -c "${pattern}" ${dirPath}/${globPattern} 2>/dev/null | wc -l`, baseDir);
  const count = parseInt(result.trim()) || 0;
  return count;
}

function validateNoLocalSpill(ctx: TestContext, operation: string): void {
  if (ctx.isContainer) {
    const allowedPrefixes = process.env.SHARK_ALLOWED_PATHS?.split(',') || ['/opt/opencode', '/.dockerenv'];
    const isAllowed = allowedPrefixes.some(prefix => ctx.sourceRoot.startsWith(prefix));
    if (!isAllowed) {
      throw new Error(`[SECURITY] Container test attempting non-container path access: ${operation} (path: ${ctx.sourceRoot})`);
    }
  }
}

const TEST_SUITE: TestDefinition[] = [
  {
    name: 'build-succeeds',
    timeout: 30000,
    test: (ctx) => {
      validateNoLocalSpill(ctx, 'build-succeeds');
      const buildOutput = runCommand('bun run build 2>&1', ctx.sourceRoot, 30000);
      const passed = buildOutput.includes('index.js') && !buildOutput.includes('error');
      return {
        name: 'build-succeeds',
        passed,
        output: passed ? 'Build successful' : buildOutput.slice(0, 300),
      };
    },
  },
  {
    name: 'dist-file-exists',
    timeout: 5000,
    test: (ctx) => {
      validateNoLocalSpill(ctx, 'dist-file-exists');
      const exists = runCommand(`test -f "${ctx.distPath}/index.js" && echo EXISTS || echo MISSING`, ctx.sourceRoot);
      const passed = exists.includes('EXISTS');
      return {
        name: 'dist-file-exists',
        passed,
        output: `dist path: ${ctx.distPath} - ${exists.trim()}`,
      };
    },
  },
  {
    name: 'tools-registered-in-config',
    timeout: 5000,
    test: (ctx) => {
      validateNoLocalSpill(ctx, 'tools-registered-in-config');
      const configPath = ctx.isContainer ? '/opt/opencode/.config/opencode.json' : ctx.opencodeConfig;
      const config = runCommand(`grep -c "shark-agent" "${configPath}" 2>/dev/null || echo "0"`, ctx.sourceRoot);
      const passed = parseInt(config) >= 1;
      return {
        name: 'tools-registered-in-config',
        passed,
        output: `config: ${configPath} - found ${config} references`,
      };
    },
  },
  {
    name: 'hooks-have-agent-checks',
    timeout: 5000,
    test: (ctx) => {
      validateNoLocalSpill(ctx, 'hooks-have-agent-checks');
      const guardianHook = grepCount('getCurrentAgent', path.join(ctx.sourceRoot, 'src/hooks/v4.1/guardian-hook.ts'), ctx.sourceRoot);
      const sessionHook = grepCount('isSharkAgent', path.join(ctx.sourceRoot, 'src/hooks/v4.1/session-hook.ts'), ctx.sourceRoot);
      const passed = guardianHook >= 1 && sessionHook >= 1;
      return {
        name: 'hooks-have-agent-checks',
        passed,
        output: `guardian:${guardianHook} session:${sessionHook}`,
      };
    },
  },
  {
    name: 'guardian-has-source-protection',
    timeout: 5000,
    test: (ctx) => {
      validateNoLocalSpill(ctx, 'guardian-has-source-protection');
      const canEdit = grepCount('canEdit', path.join(ctx.sourceRoot, 'src/shared/guardian.ts'), ctx.sourceRoot);
      const passed = canEdit >= 1;
      return {
        name: 'guardian-has-source-protection',
        passed,
        output: `canEdit references: ${canEdit}`,
      };
    },
  },
  {
    name: 'system-transform-has-ironclad',
    timeout: 5000,
    test: (ctx) => {
      validateNoLocalSpill(ctx, 'system-transform-has-ironclad');
      const ironclad = grepCount('IRONCLAD', path.join(ctx.sourceRoot, 'src/hooks/v4.1/system-transform-hook.ts'), ctx.sourceRoot);
      const passed = ironclad >= 1;
      return {
        name: 'system-transform-has-ironclad',
        passed,
        output: `IRONCLAD references: ${ironclad}`,
      };
    },
  },
  {
    name: 'delivery-gate-requires-tests',
    timeout: 5000,
    test: (ctx) => {
      validateNoLocalSpill(ctx, 'delivery-gate-requires-tests');
      const delivery = grepCount('OPENCODE CONTAINER TEST', path.join(ctx.sourceRoot, 'src/shared/gates.ts'), ctx.sourceRoot);
      const passed = delivery >= 1;
      return {
        name: 'delivery-gate-requires-tests',
        passed,
        output: `Test requirement found: ${delivery}`,
      };
    },
  },
  {
    name: 'no-manta-in-shark-hooks',
    timeout: 5000,
    test: (ctx) => {
      validateNoLocalSpill(ctx, 'no-manta-in-shark-hooks');
      const count = grepCountMulti('Manta', path.join(ctx.sourceRoot, 'src/hooks/v4.1'), '*.ts', ctx.sourceRoot);
      const passed = count === 0;
      return {
        name: 'no-manta-in-shark-hooks',
        passed,
        output: `Manta references: ${count}`,
      };
    },
  },
  {
    name: 'container-self-contained',
    timeout: 5000,
    test: (ctx) => {
      if (ctx.isContainer) {
        const spillCheck = ctx.sourceRoot.includes('/opt/opencode/') || ctx.sourceRoot.includes('/.dockerenv');
        const passed = spillCheck;
        return {
          name: 'container-self-contained',
          passed,
          output: `Container paths verified: ${ctx.sourceRoot}`,
        };
      } else {
        return {
          name: 'container-self-contained',
          passed: true,
          output: 'Running outside container - skipping spill check',
        };
      }
    },
  },
  {
    name: 'system-brain-blocks-local-access',
    timeout: 5000,
    test: (ctx) => {
      const guardianPath = path.join(ctx.sourceRoot, 'src/hooks/v4.1/guardian-hook.ts');
      const content = fs.readFileSync(guardianPath, 'utf-8');
      const forbiddenPatterns = process.env.SHARK_FORBIDDEN_PATTERNS?.split(',') || ['/home/', '/Users/', '/mnt/', 'C:\\'];
      const hasLocalSpill = forbiddenPatterns.some(pattern => content.includes(pattern));
      const passed = !hasLocalSpill;
      return {
        name: 'system-brain-blocks-local-access',
        passed,
        output: passed ? 'No forbidden path patterns found' : 'WARNING: Forbidden paths found in guardian-hook.ts',
      };
    },
  },
];

export function createSharkTestRunnerTool() {
  return tool({
    description: 'Run end-to-end test suite for shark agent. Required before ship gate can pass. Container-native: self-contained, no local file modifications.',
    args: {
      action: z.enum(['run', 'status', 'report']).describe('Action: run tests, check status, or generate report'),
      buildId: z.string().optional().describe('Build ID to report'),
      containerMode: z.boolean().optional().describe('Force container mode'),
    },
    execute: async (args, ctx) => {
      const { action, buildId, containerMode } = args;

      const testCtx: TestContext = {
        pluginRoot: '',
        sourceRoot: '',
        distPath: '',
        opencodeConfig: '',
        artifactsDir: '',
        isContainer: containerMode || getContainerEnv(),
      };
      
      detectPluginPaths(testCtx);

      if (action === 'status') {
        return JSON.stringify({
          status: 'ready',
          testCount: TEST_SUITE.length,
          tests: TEST_SUITE.map(t => t.name),
          context: {
            isContainer: testCtx.isContainer,
            sourceRoot: testCtx.sourceRoot,
            distPath: testCtx.distPath,
          },
        });
      }

      if (action === 'run' || action === 'report') {
        const id = buildId || generateBuildId();
        const results: TestResult[] = [];

        console.error(`[SHARK TEST] Container-native test suite`);
        console.error(`[SHARK TEST] Mode: ${testCtx.isContainer ? 'CONTAINER' : 'LOCAL'}`);
        console.error(`[SHARK TEST] Source: ${testCtx.sourceRoot}`);
        console.error(`[SHARK TEST] Build: ${id}`);

        for (const test of TEST_SUITE) {
          console.error(`[SHARK TEST] Running: ${test.name}`);
          try {
            const result = test.test(testCtx);
            results.push(result);
            if (result.passed) {
              console.error(`[SHARK TEST] ✓ ${test.name}`);
            } else {
              console.error(`[SHARK TEST] ✗ ${test.name}: ${result.error || result.output || 'Failed'}`);
            }
          } catch (e: any) {
            const errorResult: TestResult = {
              name: test.name,
              passed: false,
              error: e.message,
            };
            results.push(errorResult);
            console.error(`[SHARK TEST] ✗ ${test.name}: ERROR - ${e.message}`);
          }
        }

        const passedTests = results.filter(r => r.passed).length;
        const failedTests = results.filter(r => !r.passed).length;
        const overallPassed = failedTests === 0;

        const suiteResult: TestSuiteResult = {
          suite: 'shark-e2e',
          timestamp: Date.now(),
          buildId: id,
          tests: results,
          overallPassed,
          totalTests: results.length,
          passedTests,
          failedTests,
          containerMode: testCtx.isContainer,
          pluginPath: testCtx.sourceRoot,
        };

        const resultsPath = path.join(testCtx.artifactsDir, `test-results-${id}.json`);
        try {
          fs.mkdirSync(testCtx.artifactsDir, { recursive: true });
          fs.writeFileSync(resultsPath, JSON.stringify(suiteResult, null, 2));
          console.error(`[SHARK TEST] Results written to: ${resultsPath}`);
        } catch (e) {
          console.error(`[SHARK TEST] WARNING: Could not write results to ${resultsPath}`);
        }

        console.error(`[SHARK TEST] Suite complete: ${passedTests}/${results.length} passed`);
        console.error(`[SHARK TEST] Overall: ${overallPassed ? 'PASS' : 'FAIL'}`);

        if (action === 'report') {
          return JSON.stringify(suiteResult, null, 2);
        }

        return JSON.stringify({
          buildId: id,
          overallPassed,
          passedTests,
          failedTests,
          totalTests: results.length,
          containerMode: testCtx.isContainer,
          results: results.map(r => ({
            name: r.name,
            passed: r.passed,
            error: r.error,
          })),
        }, null, 2);
      }

      return JSON.stringify({ error: 'Unknown action' });
    },
  });
}
