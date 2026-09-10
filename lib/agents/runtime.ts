import type { AgentDefinition } from "./schema";

export type AgentRunInput = {
  agent: AgentDefinition;
  message: string;
};

export type AgentRunResult = {
  reply: string;
  steps: string[];
};

export async function runAgent(input: AgentRunInput): Promise<AgentRunResult> {
  const { agent, message } = input;

  // Provider execution is intentionally abstracted so the app is not locked
  // to one AI vendor. Replace this placeholder with a provider adapter.
  return {
    reply: `[${agent.name}] Received: ${message}`,
    steps: [
      "validated-agent-config",
      "checked-enabled-tools",
      "provider-execution-placeholder",
    ],
  };
}
