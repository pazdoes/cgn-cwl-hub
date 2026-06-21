import { NextResponse } from "next/server";
import { getOpenPoolSeason } from "@/lib/season";
import { markAssigned } from "@/lib/pool";
import { assignPlayerToRoster } from "@/lib/sheetsWrite";

// Assigns a pool entry to a specific clan:
// 1. Validates PIN and required fields.
// 2. Writes the assignment into the Google Sheet (the clan's tab).
// 3. Marks the pool entry as assigned in Neon so the pool UI updates.
// 4. Reads the Sheet row back to confirm the write succeeded.
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

  const season = getOpenPoolSeason();

  // Write to Sheet first — if that fails, don't mark as assigned in the DB.
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

  // Mark assigned in Neon (non-fatal if this fails — sheet is source of truth).
  try {
    await markAssigned(tag, season);
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
}
