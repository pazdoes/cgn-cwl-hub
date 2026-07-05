import { NextResponse } from "next/server";
import { getPlayer } from "@/lib/coc";

export async function GET(request, { params }) {
  const { tag } = await params;
  const player = await getPlayer(tag.startsWith("#") ? tag : `#${tag}`);
  return NextResponse.json({
    leagueTier: player.leagueTier,
    currentLeagueSeasonId: player.currentLeagueSeasonId,
    previousLeagueSeasonId: player.previousLeagueSeasonId,
    trophies: player.trophies,
    bestTrophies: player.bestTrophies,
  });
}
