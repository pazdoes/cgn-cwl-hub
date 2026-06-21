import { NextResponse } from "next/server";
import { getClan } from "@/lib/coc";
import { getClanTagFromSheet, writeCwlRankToSheet } from "@/lib/sheetsWrite";

// Refreshes a clan's CWL Rank (war league name, e.g. "Champion III") from
// the live CoC API and writes it across that clan's tab. Manually
// triggered by an admin — intended to be pressed once per CWL season
// conclusion, not run on a schedule, since league standing only changes
// at season boundaries (confirmed cadence, item 6).
//
// Requires the clan's real CoC tag to already be set in the Sheet's
// column K (Clan Tag) — if it's missing, this fails with a clear error
// rather than guessing, since there's no reliable way to derive a clan's
// tag from its display name alone.
export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { clan } = body;

  if (!clan) {
    return NextResponse.json({ error: "Missing clan" }, { status: 400 });
  }

  let clanTag;
  try {
    clanTag = await getClanTagFromSheet(clan);
  } catch (err) {
    console.error("Couldn't read clan tag from Sheet:", err);
    return NextResponse.json(
      { error: `Couldn't read clan tag: ${err.message}` },
      { status: 502 }
    );
  }

  if (!clanTag) {
    return NextResponse.json(
      { error: `No Clan Tag set for "${clan}" in column K — add it in the Sheet first.` },
      { status: 400 }
    );
  }

  let cocClan;
  try {
    cocClan = await getClan(clanTag);
  } catch (err) {
    console.error("CoC clan lookup failed:", err);
    return NextResponse.json(
      { error: `CoC API lookup failed for ${clanTag}: ${err.message}` },
      { status: 502 }
    );
  }

  const rank = cocClan?.warLeague?.name || "Unranked";

  try {
    await writeCwlRankToSheet({ clan, rank });
  } catch (err) {
    console.error("Sheet CWL Rank write failed:", err);
    return NextResponse.json(
      { error: `Sheet write failed: ${err.message}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ clan, clanTag, rank });
}
