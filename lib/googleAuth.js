import crypto from "crypto";

// Module-level cache so repeated calls within the same warm serverless
// instance reuse a token instead of re-authenticating every request.
let cachedToken = null;
let cachedExpiry = 0;

function base64url(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Exchanges the service account's private key for a short-lived OAuth2
// access token, scoped to Sheets only. Deliberately implemented by hand
// with Node's crypto module instead of the googleapis package, which pulls
// in a large dependency tree this app doesn't otherwise need.
export async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);

  if (cachedToken && cachedExpiry - 60 > now) {
    return cachedToken;
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // Vercel env vars store literal "\n" sequences for multiline values;
  // this converts them back to real newlines for the PEM key to parse.
  const privateKey = (process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "").replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google service account credentials");
  }

  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(privateKey);
  const jwt = `${unsigned}.${base64url(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
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
