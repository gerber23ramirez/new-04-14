import { google } from "googleapis";

export const GOOGLE_SCOPES: Record<string, string> = {
  gmail: "https://www.googleapis.com/auth/gmail.readonly",
  calendar: "https://www.googleapis.com/auth/calendar.readonly",
  drive: "https://www.googleapis.com/auth/drive.readonly",
};

export function createGoogleOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google OAuth environment variables are not configured.");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getGoogleAuthUrl(capabilities: string[], state: string) {
  const scopes = capabilities.map((c) => GOOGLE_SCOPES[c]).filter(Boolean);
  if (scopes.length === 0) throw new Error("No valid Google capabilities requested");
  return createGoogleOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    state,
  });
}
