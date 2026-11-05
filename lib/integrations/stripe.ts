import { Composio } from "@composio/core";

export type PlanId = "free" | "pro";

export type Plan = {
  id: PlanId;
  name: string;
  monthlyRunLimit: number;
  priceId?: string;
};

// Stripe price IDs come from env so plans can change without code edits.
export function getPlans(env: Record<string, string | undefined> = process.env): Plan[] {
  return [
    { id: "free", name: "Free", monthlyRunLimit: 100 },
    { id: "pro", name: "Pro", monthlyRunLimit: 10_000, priceId: env.STRIPE_PRO_PRICE_ID },
  ];
}

export function canRun(plan: Plan, runsThisMonth: number) {
  return runsThisMonth < plan.monthlyRunLimit;
}

export type ToolExecutor = (slug: string, args: Record<string, unknown>) => Promise<{ successful: boolean; data: unknown; error: string | null }>;

// Stripe is accessed through Composio's Stripe toolkit, so no Stripe secret is held by this app.
export function composioExecutor(userId: string): ToolExecutor {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) throw new Error("COMPOSIO_API_KEY is not configured.");
  const composio = new Composio({ apiKey });
  return (slug, args) => composio.tools.execute(slug, { userId, arguments: args });
}

export type CheckoutInput = {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  workspaceId: string;
};

export async function createCheckoutSession(input: CheckoutInput, execute: ToolExecutor): Promise<{ url: string; id: string }> {
  const res = await execute("STRIPE_CREATE_CHECKOUT_SESSION", {
    mode: "subscription",
    line_items: [{ price: input.priceId, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    client_reference_id: input.workspaceId,
    metadata: { workspaceId: input.workspaceId },
  });
  if (!res.successful) throw new Error(res.error ?? "Stripe checkout failed");

  const session = findSession(res.data);
  if (!session) throw new Error("Stripe checkout returned no session URL");
  return session;
}

function findSession(value: unknown): { url: string; id: string } | undefined {
  if (!value || typeof value !== "object") return undefined;
  const obj = value as Record<string, unknown>;
  if (typeof obj.url === "string" && typeof obj.id === "string") return { url: obj.url, id: obj.id };
  for (const child of Object.values(obj)) {
    const found = findSession(child);
    if (found) return found;
  }
  return undefined;
}
