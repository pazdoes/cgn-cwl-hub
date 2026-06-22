import { NextResponse } from "next/server";
import { getPoolEntries, updateTownHallLevels } from "@/lib/pool";
import { getPlayer } from "@/lib/coc";
import { getOpenPoolSeason } from "@/lib/season";

// Batch TH refresh for all players currently in the pool. Triggered by
// the refresh button on the admin pool tile — allows admins to update
// stored TH levels for all pool players in one action, rather than
// requiring each player to individually re-verify their account. Fetches
// from CoC API in parallel for all pool players, writes updated values
// to Neon via updateTownHallLevels. PIN-gated as an admin action.
//
// Individual failures (e.g. a stale/invalid tag) are silently skipped
// rather than failing the whole batch — the successfully-updated players
// still get updated, and the admin can retry for any that were missed.
export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const season = getOpenPoolSeason();
  const entries = await getPoolEntries(season);

  if (entries.length === 0) {
    return NextResponse.json({ updated: {} });
  }

  const results = await Promise.all(
    entries.map(async (entry) => {
      try {
        const player = await getPlayer(entry.player_tag);
        return [entry.player_tag, player?.townHallLevel ?? null];
      } catch {
        return [entry.player_tag, null];
      }
    })
  );

  const updated = Object.fromEntries(
    results.filter(([, level]) => level !== null)
  );

  await updateTownHallLevels(updated);

  return NextResponse.json({ updated, count: Object.keys(updated).length });
}
