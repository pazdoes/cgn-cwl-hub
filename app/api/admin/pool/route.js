import { NextResponse } from "next/server";
import { getOpenPoolSeason } from "@/lib/season";
import { getPoolEntries, getAllClanFormats, getAllClanNames } from "@/lib/pool";

export async function GET(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const season = await getOpenPoolSeason();
  const entries = await getPoolEntries(season);
  const clanFormats = await getAllClanFormats();
  const clanNames = await getAllClanNames();

  return NextResponse.json({ season, entries, clanFormats, clanNames });
}
