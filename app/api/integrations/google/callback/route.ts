import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createGoogleOAuthClient } from "@/lib/integrations/google";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = request.headers.get("cookie")?.match(/google_oauth_state=([^;]+)/)?.[1];

  if (!code || !state || state !== cookieState) {
    return NextResponse.json({ error: "Invalid OAuth state" }, { status: 400 });
  }

  try {
    const { tokens } = await createGoogleOAuthClient().getToken(code);
    // Tokens stay server-side; swap for a database/secret store when workspaces land.
    const file = path.join(process.cwd(), ".data", "google-tokens.json");
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(tokens), { mode: 0o600 });

    const response = NextResponse.redirect(new URL("/?google=connected", request.url));
    response.cookies.delete("google_oauth_state");
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "OAuth failed" }, { status: 400 });
  }
}
