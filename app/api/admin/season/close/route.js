import { NextResponse } from "next/server";
import { getOpenPoolSeason, setCurrentSeason, getOpenPoolSeasonFromDate } from "@/lib/season";
import { snapshotRoster } from "@/lib/pool";

// Migrate Season — three steps in order:
//   1. Snapshot current assigned roster into roster_history
//   2. Close the current season
//   3. Open the next calendar month
//
// CWL data capture (rank history + player stats) is now handled
// separately by the automated cron job (/api/cron/capture-cwl)
// and the manual backup button (/api/admin/cwl-fetch).
// They are deliberately decoupled so season migration never
// depends on CoC API availability.
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

  // Step 1: snapshot assigned roster
  let snapshotCount = 0;
  try {
    snapshotCount = await snapshotRoster(closingSeason);
  } catch (err) {
    console.error("Roster snapshot failed:", err);
    // Non-fatal — continue with migration
  }

  // Step 2 & 3: advance to next season
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
    nextSeason = getOpenPoolSeasonFromDate();
  }

  await setCurrentSeason(nextSeason);

  return NextResponse.json({
    closed: closingSeason,
    opened: nextSeason,
    snapshotCount,
  });
}
