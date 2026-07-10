import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentWar } from "@/lib/coc";

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const sql   = getDb();
  const clans = await sql`SELECT clan_tag, clan_name FROM clans WHERE cwl_absent = false OR cwl_absent IS NULL`;

  let captured = 0;
  let skipped  = 0;
  const errors = [];

  for (const clan of clans) {
    try {
      const war = await getCurrentWar(clan.clan_tag);

      // Only process ended regular wars
      // CWL wars return 403/404 from /currentwar — getCurrentWar returns null
      // Regular wars in warEnded state have no leagueGroup reference
      if (!war || war.state !== "warEnded") { skipped++; continue; }

      const startTime = war.preparationStartTime || war.startTime;
      if (!startTime) { skipped++; continue; }

      const ourSide   = war.clan?.tag === clan.clan_tag ? war.clan
                      : war.opponent?.tag === clan.clan_tag ? war.opponent
                      : null;
      const theirSide = ourSide === war.clan ? war.opponent : war.clan;
      if (!ourSide) { skipped++; continue; }

      const ourStars   = ourSide.stars ?? 0;
      const theirStars = theirSide?.stars ?? 0;
      const ourDest    = ourSide.destructionPercentage ?? 0;
      const theirDest  = theirSide?.destructionPercentage ?? 0;

      let result = "draw";
      if (ourStars > theirStars) result = "win";
      else if (ourStars < theirStars) result = "lose";
      else if (ourDest > theirDest) result = "win";
      else if (ourDest < theirDest) result = "lose";

      await sql`
        INSERT INTO regular_war_results (
          clan_tag, clan_name, opponent_clan, opponent_tag,
          war_start_time, team_size,
          stars_earned, stars_conceded,
          destruction_pct, defence_pct,
          attacks_used, attacks_available,
          result
        ) VALUES (
          ${clan.clan_tag}, ${clan.clan_name},
          ${theirSide?.name || null}, ${theirSide?.tag || null},
          ${new Date(startTime)}, ${war.teamSize ?? null},
          ${ourStars}, ${theirStars},
          ${parseFloat(ourDest.toFixed(2))}, ${parseFloat(theirDest.toFixed(2))},
          ${ourSide.attacks?.length ?? null}, ${(war.teamSize ?? 0) * 2},
          ${result}
        )
        ON CONFLICT (clan_tag, war_start_time) DO NOTHING
      `;
      captured++;
    } catch (err) {
      errors.push({ clan: clan.clan_name, error: err.message });
    }
  }

  return NextResponse.json({ captured, skipped, errors: errors.length ? errors : undefined });
}
