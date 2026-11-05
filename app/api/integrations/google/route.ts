import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getGoogleAuthUrl } from "@/lib/integrations/google";

// Starts Google OAuth, e.g. /api/integrations/google?capabilities=gmail,drive
export async function GET(request: Request) {
  try {
    const capabilities = (new URL(request.url).searchParams.get("capabilities") ?? "").split(",").filter(Boolean);
    const state = randomUUID();
    const response = NextResponse.redirect(getGoogleAuthUrl(capabilities, state));
    response.cookies.set("google_oauth_state", state, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 400 });
  }
}
