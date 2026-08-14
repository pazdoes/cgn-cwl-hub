import { NextResponse } from "next/server";
import { getOpenPoolSeason, setCurrentSeason, getOpenPoolSeasonFromDate } from "@/lib/season";
import { snapshotRoster } from "@/lib/pool";
import { clearRosterAssignments } from "@/lib/sheetsWrite";
import { getDb } from "@/lib/db";

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

  // Step 1b: clear Google Sheet roster assignments
  let sheetsCleared = 0;
  let sheetsClearFailed = [];
  try {
    const result = await clearRosterAssignments();
    sheetsCleared = result.cleared;
    sheetsClearFailed = result.failed;
  } catch (err) {
    console.error("Sheet clear failed:", err);
    // Non-fatal — continue with migration, but this is now also visible
    // in the response below, not just here in the server log
    sheetsClearFailed = ["(all clans — clearRosterAssignments threw)"];
  }

  // Step 1c: reset every clan's publish flag for the new season.
  // roster_published lives on the season-agnostic `clans` table, not
  // scoped to any particular season — nothing was resetting it on
  // migration, so a clan published at any point in the past stayed
  // "published" forever. /api/admin/assign checks this flag on every
  // single player assignment (not just when Publish is clicked) and
  // writes straight to the live public Sheet if it's true — so a stale
  // true flag meant the very first assignment made while building a new
  // season's roster went live immediately, before anyone had actually
  // decided the roster was ready.
  let clansResetToUnpublished = 0;
  try {
    const sql = getDb();
    const rows = await sql`UPDATE clans SET roster_published = false WHERE roster_published = true RETURNING clan_name`;
    clansResetToUnpublished = rows.length;
  } catch (err) {
    console.error("Failed to reset roster_published for new season:", err);
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

  // Carry forward indefinite opt-outs into the newly-opened season, so
  // pool_entries (and therefore every admin view — Roster Compliance,
  // Missing Members, etc.) reflects them immediately. Deliberately not
  // dependent on the player ever revisiting the signup page — that lazy
  // approach would leave officers seeing "no response" for someone who
  // has, in fact, already told the system they're out indefinitely.
  let permanentOutCarried = 0;
  try {
    const sql = getDb();
    const permanentOutAccounts = await sql`SELECT player_tag FROM accounts WHERE permanent_out = true`;
    for (const acc of permanentOutAccounts) {
      await sql`
        INSERT INTO pool_entries (player_tag, season, cwl_intent)
        VALUES (${acc.player_tag}, ${nextSeason}, 'out')
        ON CONFLICT (player_tag, season) DO NOTHING
      `;
    }
    permanentOutCarried = permanentOutAccounts.length;
  } catch (err) {
    console.error("Permanent opt-out carryover failed:", err);
    // Non-fatal — season migration itself already succeeded above
  }

  return NextResponse.json({
    closed: closingSeason,
    opened: nextSeason,
    snapshotCount,
    sheetsCleared,
    sheetsClearFailed,
    clansResetToUnpublished,
    permanentOutCarried,
  });
}
