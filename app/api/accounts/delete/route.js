import { NextResponse } from "next/server";
import { getOpenPoolSeason } from "@/lib/season";
import { getAccountOwner, isInPool, unlinkAccount } from "@/lib/pool";
import { readOwnerSecret } from "@/lib/ownerCookie";

// "Manage" panel on the signup page: unlinks an account from the
// requesting browser entirely, distinct from the per-account "X" button
// (app/api/pool/leave), which only opts out of the CURRENT season's pool
// but keeps the account linked.
//
// Hard-blocked if the account is currently in the open season's pool —
// per the confirmed requirement, the player must leave the pool first
// (the existing X button) before they're allowed to unlink the account
// entirely. This mirrors the clan-delete safety pattern: a destructive-
// feeling action requires clearing an active dependency first, not
// silently overriding it.
//
// Ownership is checked server-side via the owner_secret cookie, not just
// trusted from the request body — same pattern as the leave-pool route.
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { tag } = body;

  if (!tag) {
    return NextResponse.json({ error: "Missing tag" }, { status: 400 });
  }

  const ownerSecret = await readOwnerSecret();
  if (!ownerSecret) {
    return NextResponse.json({ error: "Not verified on this device" }, { status: 401 });
  }

  const actualOwner = await getAccountOwner(tag);
  if (actualOwner !== ownerSecret) {
    return NextResponse.json({ error: "You don't own this account" }, { status: 403 });
  }

  const season = getOpenPoolSeason();
  const stillInPool = await isInPool(tag, season);
  if (stillInPool) {
    return NextResponse.json(
      {
        error:
          `This account is still signed up for ${season}. Leave the pool first ` +
          `(tap the X on this account above), then try removing it again.`,
      },
      { status: 409 }
    );
  }

  try {
    await unlinkAccount(tag);
  } catch (err) {
    console.error("Unlink account failed:", err);
    return NextResponse.json(
      { error: `Couldn't remove account: ${err.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ tag, removed: true });
}
