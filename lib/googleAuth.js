// Authenticates to the Sheets API as the Sheet's own owner via OAuth,
// rather than a service account key — service account key creation is
// blocked by org policy on this Google Cloud project, and authenticating
// as the actual Sheet owner is a reasonable fit anyway, since there's no
// separate machine identity to provision or share the Sheet with.
//
// GOOGLE_OAUTH_REFRESH_TOKEN was generated once, locally, via the
// get-refresh-token.mjs helper script (not part of this app) and never
// expires unless explicitly revoked — this function just exchanges it
// for a short-lived access token on each cold start.

let cachedToken = null;
let cachedExpiry = 0;

export async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);

  if (cachedToken && cachedExpiry - 60 > now) {
    return cachedToken;
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Google OAuth credentials");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error_description || `Google auth failed (${res.status})`);
  }

  cachedToken = data.access_token;
  cachedExpiry = now + data.expires_in;

  return cachedToken;
}
