import { NextResponse } from "next/server";
import { getOpenPoolSeason } from "@/lib/season";
import { markAssigned, countConfirmed, getClanFormat } from "@/lib/pool";
import { assignPlayerToRoster } from "@/lib/sheetsWrite";
import { getDb } from "@/lib/db";

export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { tag, playerName, clan, townHall } = body;

  if (!tag || !clan) {
    return NextResponse.json({ error: "Missing tag or clan" }, { status: 400 });
  }

  const season = await getOpenPoolSeason();
  const sql = getDb();

  // Check if roster is published
  const [clanRow] = await sql`SELECT roster_published FROM clans WHERE clan_name = ${clan} LIMIT 1`;
  const isPublished = clanRow?.roster_published === true;

  // Check confirmed cap before assigning
  const format = await getClanFormat(clan);
  const currentConfirmed = await countConfirmed(clan, season);
  if (currentConfirmed >= format) {
    return NextResponse.json(
      { error: `${clan} already has ${currentConfirmed} confirmed players (cap: ${format}). Move someone to Substitute first.` },
      { status: 409 }
    );
  }

  if (isPublished) {
    // Write to Sheet first — if that fails, don't mark as assigned in the DB
    let sheetResult;
    try {
      sheetResult = await assignPlayerToRoster({
        tag,
        playerName: playerName || tag,
        clan,
        townHall: townHall || "",
        season,
      });
    } catch (err) {
      console.error("Sheet write failed:", err);
      return NextResponse.json(
        { error: `Sheet write failed: ${err.message}` },
        { status: 502 }
      );
    }

    try {
      await markAssigned(tag, season, clan);
      // Set status to confirmed in Neon after sheet write
      await sql`UPDATE pool_entries SET status = 'confirmed' WHERE player_tag = ${tag} AND season = ${season}`;
    } catch (err) {
      console.error("DB mark-assigned failed (non-fatal):", err);
    }

    return NextResponse.json({
      tag,
      clan,
      season,
      sheetRow: sheetResult.updatedRow,
      confirmed: sheetResult.confirmed,
    });

  } else {
    // Unpublished — skip sheet write, assign in Neon only with confirmed status
    try {
      await markAssigned(tag, season, clan);
      await sql`UPDATE pool_entries SET status = 'confirmed' WHERE player_tag = ${tag} AND season = ${season}`;
    } catch (err) {
      console.error("DB mark-assigned failed:", err);
      return NextResponse.json({ error: "Failed to assign player" }, { status: 500 });
    }

    return NextResponse.json({ tag, clan, season, confirmed: true });
  }
}
