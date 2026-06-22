import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { linkDiscordId, getOwnerSecretByDiscordId } from "@/lib/pool";
import { cookies } from "next/headers";

// Links the currently signed-in Discord user's ID to whatever
// owner_secret exists in the cwl_owner cookie (if any). Called once
// when a player first signs in with Discord on the signup page.
//
// This is the identity-merge step: a player may have existing linked
// CoC accounts under a cookie-based owner_secret. Signing in with
// Discord and calling this route permanently associates their Discord
// ID with those accounts, so from this point on their accounts are
// found via Discord ID regardless of cookie state.
//
// Safe to call multiple times — if the Discord ID is already linked to
// this owner_secret, the UPDATE is a no-op.
export async function POST() {
  const session = await auth();

  if (!session?.user?.discordId) {
    return NextResponse.json(
      { error: "Not signed in with Discord" },
      { status: 401 }
    );
  }

  const discordId = session.user.discordId;

  // Check if this Discord ID already has linked accounts — if so,
  // no merge needed, the existing link is already correct.
  const existing = await getOwnerSecretByDiscordId(discordId);
  if (existing) {
    return NextResponse.json({ linked: true, merged: false });
  }

  // Read the cookie-based owner_secret — this is what holds any
  // accounts this player registered before signing in with Discord.
  const cookieStore = await cookies();
  const cookieSecret = cookieStore.get("cwl_owner")?.value;

  if (!cookieSecret) {
    // No cookie either — this is a brand new player with no accounts
    // yet. Nothing to link; they'll register accounts normally and
    // the verify route will handle Discord association from there.
    return NextResponse.json({ linked: false, merged: false });
  }

  // Link the Discord ID to every account under this cookie secret.
  await linkDiscordId(cookieSecret, discordId);

  return NextResponse.json({ linked: true, merged: true });
}
