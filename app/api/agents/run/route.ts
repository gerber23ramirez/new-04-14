import { NextResponse } from "next/server";
import { agentSchema } from "@/lib/agents/schema";
import { runAgent } from "@/lib/agents/runtime";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const agent = agentSchema.parse(body.agent);

    if (typeof body.message !== "string" || !body.message.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const result = await runAgent({ agent, message: body.message.trim() });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 },
    );
  }
}
