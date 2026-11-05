import { NextResponse } from "next/server";
import { agentSchema } from "@/lib/agents/schema";
import { getStore } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ agents: await getStore().listAgents() });
}

export async function POST(request: Request) {
  try {
    const agent = agentSchema.parse(await request.json());
    const saved = await getStore().saveAgent(agent);
    return NextResponse.json({ agent: saved }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 },
    );
  }
}
