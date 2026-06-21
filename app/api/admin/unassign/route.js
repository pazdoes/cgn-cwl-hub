import { NextResponse } from "next/server";
import { getOpenPoolSeason } from "@/lib/season";
import { clearAssignment, getAssignedClan } from "@/lib/pool";
import { removePlayerFromRoster } from "@/lib/sheetsWrite";

// Admin "X" button: unassigns a player from their clan, returning them to
// the unassigned pool. Does NOT remove them from the pool entirely — that
// asymmetry vs. the player-side X (app/api/pool/leave) is intentional and
// confirmed: admin X = unassign back to pool, player X = leave pool fully.
//
// Order of operations matches every other write-through action in this
// build: the player's row is deleted from the Sheet FIRST (so they
// disappear from the public roster immediately), and Neon is only
// updated if that succeeds. If the Sheet delete fails, Neon is left
// untouched — the player stays assigned on both sides rather than ending
// up unassigned in Neon while still visibly rostered on the public page.
export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { tag } = body;

  if (!tag) {
    return NextResponse.json({ error: "Missing tag" }, { status: 400 });
  }

  const season = getOpenPoolSeason();
  const clan = await getAssignedClan(tag, season);

  if (!clan) {
    return NextResponse.json(
      { error: "This player isn't currently assigned to a clan." },
      { status: 400 }
    );
  }

  try {
    await removePlayerFromRoster({ tag, clan });
  } catch (err) {
    console.error("Sheet row removal failed:", err);
    return NextResponse.json(
      { error: `Sheet update failed: ${err.message}` },
      { status: 502 }
    );
  }

  try {
    await clearAssignment(tag, season);
  } catch (err) {
    console.error("DB unassign failed (non-fatal):", err);
  }

  return NextResponse.json({ tag, season, clan, unassigned: true });
}
