import { describe, expect, it } from "vitest";
import { canRun, createCheckoutSession, getPlans, type ToolExecutor } from "@/lib/integrations/stripe";
import { getGoogleAuthUrl } from "@/lib/integrations/google";

const input = { priceId: "price_1", successUrl: "https://a/s", cancelUrl: "https://a/c", workspaceId: "w1" };

describe("stripe via composio", () => {
  it("creates a subscription checkout session through the Stripe toolkit", async () => {
    let call: { slug: string; args: Record<string, unknown> } | undefined;
    const execute: ToolExecutor = async (slug, args) => {
      call = { slug, args };
      return { successful: true, data: { response_data: { id: "cs_1", url: "https://checkout.stripe.com/x" } }, error: null };
    };
    const session = await createCheckoutSession(input, execute);
    expect(session).toEqual({ id: "cs_1", url: "https://checkout.stripe.com/x" });
    expect(call?.slug).toBe("STRIPE_CREATE_CHECKOUT_SESSION");
    expect(call?.args).toMatchObject({ mode: "subscription", client_reference_id: "w1" });
  });

  it("surfaces tool failures and missing URLs", async () => {
    await expect(
      createCheckoutSession(input, async () => ({ successful: false, data: null, error: "boom" })),
    ).rejects.toThrow("boom");
    await expect(
      createCheckoutSession(input, async () => ({ successful: true, data: {}, error: null })),
    ).rejects.toThrow("no session URL");
  });

  it("gates usage by plan limit", () => {
    const [free, pro] = getPlans({ STRIPE_PRO_PRICE_ID: "price_pro" });
    expect(canRun(free, 99)).toBe(true);
    expect(canRun(free, 100)).toBe(false);
    expect(pro.priceId).toBe("price_pro");
    expect(canRun(pro, 100)).toBe(true);
  });
});

describe("google oauth", () => {
  it("builds an offline consent URL with the requested scopes", () => {
    Object.assign(process.env, { GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "s", GOOGLE_REDIRECT_URI: "http://localhost/cb" });
    const url = new URL(getGoogleAuthUrl(["gmail", "drive"], "st"));
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("scope")).toContain("gmail.readonly");
    expect(url.searchParams.get("scope")).toContain("drive.readonly");
    expect(url.searchParams.get("state")).toBe("st");
    expect(() => getGoogleAuthUrl(["nope"], "st")).toThrow();
  });
});
