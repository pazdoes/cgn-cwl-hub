import { NextResponse } from "next/server";
import { getOpenPoolSeason } from "@/lib/season";
import { getPoolEntries, getAllClanFormats } from "@/lib/pool";

// Returns all pool entries for the currently open season, plus every
// known clan's CWL Format in one call — so the admin pool page doesn't
// need a second round-trip just to render each clan header's toggle.
// Gated by the same OFFICER_PIN used for other admin routes.
export async function GET(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const season = getOpenPoolSeason();
  const entries = await getPoolEntries(season);
  const clanFormats = await getAllClanFormats();

  return NextResponse.json({ season, entries, clanFormats });
}
