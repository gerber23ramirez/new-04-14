import type { AgentDefinition } from "./schema";

export type ProviderMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolName?: string;
};

export type ToolCall = { name: string; input: Record<string, unknown> };

export type ProviderResponse =
  | { type: "final"; content: string }
  | { type: "tool_call"; call: ToolCall };

export type ProviderRequest = {
  agent: AgentDefinition;
  messages: ProviderMessage[];
};

export interface Provider {
  readonly name: string;
  complete(request: ProviderRequest): Promise<ProviderResponse>;
}

// Deterministic provider for tests and the console. It calls the first
// enabled tool once, then summarises the result.
export class MockProvider implements Provider {
  readonly name = "mock";

  async complete({ agent, messages }: ProviderRequest): Promise<ProviderResponse> {
    const hasToolResult = messages.some((m) => m.role === "tool");
    const tool = agent.tools.find((t) => t.enabled);
    const lastUser = [...messages].reverse().find((m) => m.role === "user");

    if (tool && !hasToolResult) {
      return { type: "tool_call", call: { name: tool.id, input: { query: lastUser?.content ?? "" } } };
    }

    const toolResult = [...messages].reverse().find((m) => m.role === "tool");
    const suffix = toolResult ? ` (tool ${toolResult.toolName}: ${toolResult.content})` : "";
    return { type: "final", content: `[${agent.name}] Received: ${lastUser?.content ?? ""}${suffix}` };
  }
}

const providers = new Map<string, () => Provider>([["mock", () => new MockProvider()]]);

export function registerProvider(name: string, factory: () => Provider) {
  providers.set(name, factory);
}

export function getProvider(name: string): Provider {
  const factory = providers.get(name) ?? providers.get("mock");
  if (!factory) throw new Error("No provider available");
  return factory();
}
