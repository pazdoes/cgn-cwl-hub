import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "cwl_owner";
const TEN_YEARS_SECONDS = 60 * 60 * 24 * 365 * 10;

// Reads the visitor's private ownership token, or generates a fresh one if
// they don't have one yet. This token carries no personal identity on its
// own — it only links a browser to the CoC accounts that browser has
// verified, and is never exposed in any admin-facing view or API response.
export async function getOrCreateOwnerSecret() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE_NAME)?.value;

  if (existing) {
    return existing;
  }

  return crypto.randomBytes(24).toString("hex");
}

export function setOwnerCookie(response, ownerSecret) {
  response.cookies.set(COOKIE_NAME, ownerSecret, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: TEN_YEARS_SECONDS,
    path: "/",
  });
}

export async function readOwnerSecret() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value || null;
}
