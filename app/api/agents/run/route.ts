import { NextResponse } from "next/server";
import { agentSchema } from "@/lib/agents/schema";
import { runAgent } from "@/lib/agents/runtime";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (typeof body.message !== "string" || !body.message.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }
    const message = body.message.trim();
    const store = getStore();

    // Run a saved agent by id (optionally a specific version), or an inline draft for testing.
    const agent = body.agentId
      ? await store.getAgent(String(body.agentId), body.version)
      : agentSchema.parse(body.agent);
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    const result = await runAgent({ agent, message });
    const run = body.agentId ? await store.recordRun(agent, message, result) : undefined;
    return NextResponse.json({ ...result, runId: run?.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 },
    );
  }
}
