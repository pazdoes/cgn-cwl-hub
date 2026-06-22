import { cookies } from "next/headers";
import crypto from "crypto";
import { auth } from "@/auth";
import { getOwnerSecretByDiscordId } from "@/lib/pool";

const COOKIE_NAME = "cwl_owner";
const TEN_YEARS_SECONDS = 60 * 60 * 24 * 365 * 10;

// Reads the visitor's private ownership token. Now checks two sources
// in order of preference (item 17):
//
// 1. Discord session: if the visitor is signed in with Discord, look up
//    the owner_secret associated with their Discord ID in Neon. This
//    survives cache clears, device switches, and browser restarts —
//    their linked CoC accounts follow their Discord identity everywhere.
//
// 2. Cookie fallback: if no Discord session exists (or the Discord user
//    hasn't linked any accounts yet), fall back to the existing
//    cwl_owner cookie. This path is completely unchanged from before
//    item 17, so players who don't use Discord see no difference.
//
// Returns null if neither source produces a value (new visitor, no
// cookie, no Discord session).
export async function readOwnerSecret() {
  // Check Discord session first
  try {
    const session = await auth();
    if (session?.user?.discordId) {
      const discordOwnerSecret = await getOwnerSecretByDiscordId(
        session.user.discordId
      );
      if (discordOwnerSecret) {
        return discordOwnerSecret;
      }
      // Discord user exists but hasn't linked any accounts yet —
      // fall through to the cookie path, which may have existing
      // accounts that we'll link to this Discord ID on first save.
    }
  } catch {
    // If auth() fails for any reason (e.g. missing env vars in dev),
    // fall through silently to the cookie path.
  }

  // Cookie fallback — unchanged from pre-item-17 behaviour
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value || null;
}

// Generates or retrieves the owner_secret for writing new accounts.
// Same Discord-first logic as readOwnerSecret, but always returns a
// value (creates a fresh random secret if neither source has one).
export async function getOrCreateOwnerSecret() {
  // Check Discord session first
  try {
    const session = await auth();
    if (session?.user?.discordId) {
      const existing = await getOwnerSecretByDiscordId(session.user.discordId);
      if (existing) return existing;
    }
  } catch {
    // fall through to cookie
  }

  // Cookie fallback
  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE_NAME)?.value;
  if (existing) return existing;

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
