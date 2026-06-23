import { NextResponse } from "next/server";
import { getOpenPoolSeason } from "@/lib/season";
import { getAccountOwner, leavePool } from "@/lib/pool";
import { readOwnerSecret } from "@/lib/ownerCookie";

// Player "X" button on the signup page: removes a pool entry entirely for
// the current season — distinct from the admin "X" (app/api/admin/unassign),
// which only unassigns from a clan but keeps the player in the pool.
//
// Ownership is checked server-side via the owner_secret cookie, not just
// trusted from the request body — the signup page only ever shows a
// player their own accounts, but this route re-verifies independently so
// a crafted request can't remove someone else's pool entry.
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

  const season = await getOpenPoolSeason();

  try {
    await leavePool(tag, season);
  } catch (err) {
    console.error("Leave pool failed:", err);
    return NextResponse.json(
      { error: `Couldn't leave pool: ${err.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ tag, season, left: true });
}
