import { describe, expect, it } from "vitest";
import { agentSchema } from "@/lib/agents/schema";
import { runAgent } from "@/lib/agents/runtime";
import { ToolRegistry, createDefaultRegistry } from "@/lib/agents/tools";
import type { Provider } from "@/lib/agents/provider";

const base = {
  id: "a1",
  name: "Helper",
  systemPrompt: "You are a helpful assistant.",
};

describe("runAgent", () => {
  it("runs a tool then returns a final reply with the mock provider", async () => {
    const agent = agentSchema.parse({ ...base, tools: [{ id: "echo", name: "Echo" }] });
    const result = await runAgent({ agent, message: "hi", tools: createDefaultRegistry() });
    expect(result.status).toBe("completed");
    expect(result.steps).toContain("tool:echo");
    expect(result.reply).toContain("hi");
  });

  it("enforces the step limit", async () => {
    const looping: Provider = {
      name: "loop",
      complete: async () => ({ type: "tool_call", call: { name: "echo", input: {} } }),
    };
    const agent = agentSchema.parse({ ...base, maxSteps: 3, tools: [{ id: "echo", name: "Echo" }] });
    const result = await runAgent({ agent, message: "x", provider: looping, tools: createDefaultRegistry() });
    expect(result.status).toBe("step_limit");
    expect(result.steps.filter((s) => s === "tool:echo")).toHaveLength(3);
  });

  it("denies disabled tools", async () => {
    let calls = 0;
    const provider: Provider = {
      name: "p",
      complete: async () =>
        calls++ === 0
          ? { type: "tool_call", call: { name: "echo", input: {} } }
          : { type: "final", content: "done" },
    };
    const agent = agentSchema.parse({ ...base, tools: [{ id: "echo", name: "Echo", enabled: false }] });
    const result = await runAgent({ agent, message: "x", provider, tools: createDefaultRegistry() });
    expect(result.steps).toContain("tool-denied:echo");
    expect(result.status).toBe("completed");
  });

  it("recovers from tool errors and reports provider failures", async () => {
    const registry = new ToolRegistry().register("boom", () => {
      throw new Error("kaboom");
    });
    let calls = 0;
    const provider: Provider = {
      name: "p",
      complete: async () =>
        calls++ === 0
          ? { type: "tool_call", call: { name: "boom", input: {} } }
          : { type: "final", content: "ok" },
    };
    const agent = agentSchema.parse({ ...base, tools: [{ id: "boom", name: "Boom" }] });
    expect((await runAgent({ agent, message: "x", provider, tools: registry })).steps).toContain("tool-error:boom");

    const failing: Provider = {
      name: "f",
      complete: async () => {
        throw new Error("down");
      },
    };
    const failed = await runAgent({ agent, message: "x", provider: failing, tools: registry });
    expect(failed.status).toBe("failed");
    expect(failed.error).toBe("down");
  });
});
