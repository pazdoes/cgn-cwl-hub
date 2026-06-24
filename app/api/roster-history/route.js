import { NextResponse } from "next/server";
import { getRosterHistory, getRosterSeasons } from "@/lib/pool";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const season = searchParams.get("season");

  const seasons = await getRosterSeasons();

  if (!season && seasons.length === 0) {
    return NextResponse.json({ players: [], seasons: [] });
  }

  const targetSeason = season || seasons[0];
  const players = await getRosterHistory(targetSeason);

  return NextResponse.json({ players, seasons, currentSeason: targetSeason });
}
