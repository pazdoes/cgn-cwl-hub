import { NextResponse } from "next/server";
import { getPlayerCwlStats, getPlayerCwlSeasons } from "@/lib/pool";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const season = searchParams.get("season");

  const seasons = await getPlayerCwlSeasons();

  if (!season && seasons.length === 0) {
    return NextResponse.json({ stats: [], seasons: [] });
  }

  const targetSeason = season || seasons[0];
  const stats = await getPlayerCwlStats(targetSeason);

  return NextResponse.json({ stats, seasons, currentSeason: targetSeason });
}
