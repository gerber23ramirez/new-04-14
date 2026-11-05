import type { AgentDefinition } from "./schema";
import { getProvider, type Provider, type ProviderMessage } from "./provider";
import { createDefaultRegistry, type ToolRegistry } from "./tools";

export type AgentRunInput = {
  agent: AgentDefinition;
  message: string;
  provider?: Provider;
  tools?: ToolRegistry;
};

export type AgentRunResult = {
  reply: string;
  steps: string[];
  status: "completed" | "step_limit" | "failed";
  error?: string;
};

export async function runAgent(input: AgentRunInput): Promise<AgentRunResult> {
  const { agent, message } = input;
  const provider = input.provider ?? getProvider(agent.model);
  const registry = input.tools ?? createDefaultRegistry();
  const enabled = new Set(agent.tools.filter((t) => t.enabled).map((t) => t.id));

  const messages: ProviderMessage[] = [
    { role: "system", content: agent.systemPrompt },
    { role: "user", content: message },
  ];
  const steps: string[] = ["validated-agent-config"];

  for (let i = 0; i < agent.maxSteps; i++) {
    let response;
    try {
      response = await provider.complete({ agent, messages });
    } catch (error) {
      steps.push("provider-error");
      return { reply: "", steps, status: "failed", error: errorMessage(error) };
    }

    if (response.type === "final") {
      steps.push("final-response");
      return { reply: response.content, steps, status: "completed" };
    }

    const { name, input: toolInput } = response.call;
    if (!enabled.has(name)) {
      steps.push(`tool-denied:${name}`);
      messages.push({ role: "tool", toolName: name, content: "Tool is not enabled for this agent." });
      continue;
    }

    try {
      const output = await registry.execute(name, toolInput);
      steps.push(`tool:${name}`);
      messages.push({ role: "tool", toolName: name, content: output });
    } catch (error) {
      steps.push(`tool-error:${name}`);
      messages.push({ role: "tool", toolName: name, content: `Error: ${errorMessage(error)}` });
    }
  }

  steps.push("step-limit-reached");
  return { reply: "", steps, status: "step_limit", error: `Exceeded maxSteps (${agent.maxSteps})` };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
