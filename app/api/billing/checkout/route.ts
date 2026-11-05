import { NextResponse } from "next/server";
import { z } from "zod";
import { composioExecutor, createCheckoutSession, getPlans } from "@/lib/integrations/stripe";

const bodySchema = z.object({
  workspaceId: z.string().min(1),
  plan: z.enum(["pro"]),
});

export async function POST(request: Request) {
  try {
    const { workspaceId, plan } = bodySchema.parse(await request.json());
    const priceId = getPlans().find((p) => p.id === plan)?.priceId;
    if (!priceId) return NextResponse.json({ error: "Plan price is not configured" }, { status: 500 });

    const origin = new URL(request.url).origin;
    const session = await createCheckoutSession(
      {
        priceId,
        workspaceId,
        successUrl: `${origin}/?checkout=success`,
        cancelUrl: `${origin}/?checkout=cancelled`,
      },
      composioExecutor(workspaceId),
    );
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid request" }, { status: 400 });
  }
}
