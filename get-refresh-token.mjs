// Run once to generate a Google OAuth refresh token.
// Usage: node get-refresh-token.mjs
// Then copy the refresh token into GOOGLE_OAUTH_REFRESH_TOKEN in Vercel.

import http from "http";
import { exec } from "child_process";
import { readFileSync } from "fs";
import { resolve } from "path";
import { URL } from "url";

// Read credentials from .env.local
const envPath = resolve(process.cwd(), ".env.local");
let CLIENT_ID, CLIENT_SECRET;
try {
  const env = readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const [key, ...rest] = line.split("=");
    const val = rest.join("=").trim().replace(/^"|"$/g, "");
    if (key.trim() === "GOOGLE_OAUTH_CLIENT_ID") CLIENT_ID = val;
    if (key.trim() === "GOOGLE_OAUTH_CLIENT_SECRET") CLIENT_SECRET = val;
  }
} catch {
  // Fall back to env vars
  CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
  CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
}

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET in .env.local");
  process.exit(1);
}

const REDIRECT_URI = "http://localhost:3001/callback";
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
].join(" ");

const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth` +
  `?client_id=${encodeURIComponent(CLIENT_ID)}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent(SCOPES)}` +
  `&access_type=offline` +
  `&prompt=consent`;

console.log("\nOpening browser to authorize...\n");
exec(`open "${authUrl}"`);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:3001");
  const code = url.searchParams.get("code");
  if (!code) {
    res.end("No code received.");
    return;
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  const data = await tokenRes.json();

  if (!data.refresh_token) {
    console.error("\nNo refresh token received. Response:", data);
    res.end("Error — check terminal.");
    server.close();
    return;
  }

  console.log("\n✅ SUCCESS — copy this refresh token into Vercel:\n");
  console.log("GOOGLE_OAUTH_REFRESH_TOKEN=" + data.refresh_token);
  console.log("\nAdd it to Vercel: Settings → Environment Variables → GOOGLE_OAUTH_REFRESH_TOKEN\n");

  res.end("Success! You can close this tab and return to the terminal.");
  server.close();
});

server.listen(3001, () => {
  console.log("Waiting for Google to redirect back...");
});
