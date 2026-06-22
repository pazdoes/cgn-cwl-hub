import { NextResponse } from "next/server";
import { getOpenPoolSeason, setCurrentSeason, getOpenPoolSeasonFromDate } from "@/lib/season";
import { getAllClanNames, getClanFallbackData, recordSeasonHistory } from "@/lib/pool";

// Closes the current CWL season and opens the next one. This is the
// foundation for the season rollover system (item 30) and is designed
// to be the natural trigger point for future features (player
// performance recording, retention tracking) — all of which would be
// added as additional steps inside this same route.
//
// What this does in order:
//   1. Records current CWL ranks for all clans into clan_season_history
//      (replacing the need for a separate "Record Season" button press)
//   2. Advances the current_season in the seasons table to the next
//      calendar month — the new season is immediately live for signups
//
// What this deliberately does NOT do:
//   - Delete or mutate any pool_entries rows — past assignments are
//     preserved intact as the historical record. New season entries
//     are simply new rows; old ones remain queryable.
//   - Unassign players — clearing clan assignments for the new season
//     is handled separately by the admin via the existing unassign flow,
//     giving admins control over timing (some may want to keep rosters
//     for quick re-assignment at the start of the next CWL).
//
// PIN-gated. Requires typing CONFIRM in the UI before the request
// is even sent — the route itself trusts the PIN as the auth layer.
export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (body.confirm !== "CONFIRM") {
    return NextResponse.json({ error: "Confirmation required" }, { status: 400 });
  }

  const closingSeason = await getOpenPoolSeason();

  // Step 1: record CWL ranks for all clans for the closing season
  try {
    const clanNames = await getAllClanNames();
    const clanRanks = await Promise.all(
      clanNames.map(async (clanName) => {
        const data = await getClanFallbackData(clanName);
        return { clanName, cwlRank: data.cwl_rank || "Unranked" };
      })
    );
    await recordSeasonHistory(closingSeason, clanRanks);
  } catch (err) {
    console.error("Failed to record season history during rollover:", err);
    // Non-fatal — continue with the rollover even if rank recording
    // fails. Admin can use the Record Season button to retry.
  }

  // Step 2: advance to next season
  // Compute the next calendar month from the closing season's label.
  // We parse the closing season string back to a date, then add one month.
  let nextSeason;
  try {
    const closing = new Date(closingSeason + " 01");
    const next = new Date(Date.UTC(closing.getUTCFullYear(), closing.getUTCMonth() + 1, 1));
    nextSeason = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(next);
  } catch {
    // Fallback: derive from today's date
    nextSeason = getOpenPoolSeasonFromDate();
  }

  await setCurrentSeason(nextSeason);

  return NextResponse.json({
    closed: closingSeason,
    opened: nextSeason,
  });
}
