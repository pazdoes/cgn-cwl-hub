import { NextResponse } from "next/server";
import { getPlayer } from "@/lib/coc";

export async function GET(request, { params }) {
  const { tag } = await params;
  const player = await getPlayer(tag.startsWith("#") ? tag : `#${tag}`);
  return NextResponse.json({
    keys: Object.keys(player),
    league: player.league,
    rankedLeague: player.rankedLeague,
    trophies: player.trophies,
    name: player.name,
  });
}
