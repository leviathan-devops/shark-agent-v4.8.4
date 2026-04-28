/**
 * Container Test Tool - Shark v4.8
 * 
 * Provides the exact command to spawn an OpenCode container for integration testing.
 * System Brain ENFORCES this must be used before declaring ANYTHING shippable.
 * 
 * NO MOCKS ALLOWED - This is the ONLY valid test verification method.
 */

import type { Tool } from '@opencode-ai/plugin';

export function createContainerTestTool(): Tool {
  return {
    name: 'shark-container-test',
    description: 'Get the command to spawn an OpenCode container for real integration testing. System Brain requires actual container test before declaring shippable. Returns JSON with command template.',
    
    input: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['get-command', 'check-status'],
          description: 'Action: get-command returns the spawn command, check-status checks if container pool is available',
        },
      },
      required: ['action'],
    },

    handle: async (args: { action: string }): Promise<string> => {
      if (args.action === 'check-status') {
        // Check if container pool is available
        try {
          const { execSync } = await import('child_process');
          const result = execSync('docker ps --filter "name=hermes-oc-agent-" --format "{{.Names}}" 2>/dev/null | wc -l');
          const count = parseInt(result.toString().trim(), 10);
          return JSON.stringify({
            available: true,
            activeContainers: count,
            maxContainers: 14,
          });
        } catch {
          return JSON.stringify({
            available: false,
            error: 'Docker not available',
          });
        }
      }

      // Return the command template for spawning a container test
      const command = {
        description: 'Spawn OpenCode container for integration testing',
        command: 'python3 /home/leviathan/OPENCODE_WORKSPACE/skills/plugin-coding-agent-cli/wrappers/opencode_agent.py --task "{{TASK}}" --model minimax/MiniMax-M2.7 --timeout 120 --cleanup --json-only',
        example: 'python3 /home/leviathan/OPENCODE_WORKSPACE/skills/plugin-coding-agent-cli/wrappers/opencode_agent.py --task "Build the plugin at /workspace and run tests" --model minimax/MiniMax-M2.7 --timeout 120 --cleanup --json-only',
        requiredHooks: ['--json-only flag returns clean JSON output'],
        notes: [
          'Actual container test is MANDATORY before declaring shippable',
          'Static tests (bun test) do NOT count as valid verification',
          'The container must run the actual build and test cycle',
          'Output must show ALL tests passing in the container',
        ],
      };

      return JSON.stringify(command);
    },
  };
}

export function createContainerPoolStatusTool(): Tool {
  return {
    name: 'shark-container-status',
    description: 'Check status of the OpenCode container pool. Returns active container count and availability.',
    
    input: {
      type: 'object',
      properties: {},
    },

    handle: async (): Promise<string> => {
      try {
        const { execSync } = await import('child_process');
        
        // Get active hermes containers
        const activeResult = execSync('docker ps --filter "name=hermes-oc-agent-" --format "{{.Names}}" 2>/dev/null');
        const active = activeResult.toString().trim().split('\n').filter(Boolean);
        
        // Get all hermes containers (including stopped)
        const allResult = execSync('docker ps -a --filter "name=hermes-oc-agent-" --format "{{.Names}}" 2>/dev/null');
        const all = allResult.toString().trim().split('\n').filter(Boolean);
        
        return JSON.stringify({
          activeContainers: active.length,
          totalContainers: all.length,
          containerNames: all,
          maxContainers: 14,
          available: active.length < 14,
        });
      } catch (error) {
        return JSON.stringify({
          available: false,
          error: 'Failed to check container status',
        });
      }
    },
  };
}
