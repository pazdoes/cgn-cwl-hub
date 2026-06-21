import { NextResponse } from "next/server";
import { getOpenPoolSeason } from "@/lib/season";
import { getPoolEntries, getAllClanFormats, getAllClanNames } from "@/lib/pool";

// Returns all pool entries for the currently open season, every known
// clan's CWL Format, and the authoritative list of clan names (item 7).
//
// clanNames now comes from Neon's clans table directly, NOT inferred
// from non-empty Sheet rows the way the admin page used to derive its
// clan list (via a separate fetch to /api/roster, filtering to clans
// that appear in at least one player row). That inference approach was
// the root cause of a real bug: any clan with zero assigned players —
// including a brand-new clan just added via Add Clan — was invisible on
// the admin page entirely, since an empty Sheet tab produces zero player
// rows. Reading from clans directly fixes this: every registered clan
// appears regardless of roster size.
export async function GET(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const season = getOpenPoolSeason();
  const entries = await getPoolEntries(season);
  const clanFormats = await getAllClanFormats();
  const clanNames = await getAllClanNames();

  return NextResponse.json({ season, entries, clanFormats, clanNames });
}
