/**
 * Agent Session State
 * 
 * Tracks which agent is currently active in the session.
 * Used by hooks to determine if they should process.
 * 
 * MECHANICAL SYSTEM: This module tracks system brain initialization.
 * The brain must be initialized via setCurrentAgent() before any guardian
 * enforcement can occur. If getCurrentAgent() returns undefined, the system
 * brain has failed to initialize.
 */

let currentAgentName: string | undefined = undefined;
let agentInitialized = false;
let lastAgentMessage: string | undefined = undefined;

export function setCurrentAgent(agent: string | undefined): void {
  if (agent && !agentInitialized) {
    console.log(`[Agent State] BRAIN INITIALIZED: setCurrentAgent("${agent}")`);
    agentInitialized = true;
  } else if (!agent && agentInitialized) {
    console.log('[Agent State] BRAIN CLEARED: clearCurrentAgent()');
    agentInitialized = false;
  }
  currentAgentName = agent;
}

export function getCurrentAgent(): string | undefined {
  return currentAgentName;
}

export function isBrainInitialized(): boolean {
  return agentInitialized;
}

export function clearCurrentAgent(): void {
  console.log('[Agent State] BRAIN CLEARED: clearCurrentAgent()');
  agentInitialized = false;
  currentAgentName = undefined;
}

export function setLastAgentMessage(message: string | undefined): void {
  lastAgentMessage = message;
}

export function getLastAgentMessage(): string | undefined {
  return lastAgentMessage;
}