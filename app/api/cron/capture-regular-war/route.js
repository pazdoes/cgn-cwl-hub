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
  let updated  = 0;
  let skipped  = 0;
  const errors = [];
  const now    = new Date();

  for (const clan of clans) {
    try {
      const war = await getCurrentWar(clan.clan_tag);

      // Skip if no war data or still in preparation
      if (!war || war.state === "preparation" || war.state === "notInWar") { skipped++; continue; }

      // Capture if:
      // 1. War has ended (warEnded state), OR
      // 2. War is inWar but endTime has passed (back-to-back war scenario)
      const endTime  = war.endTime ? new Date(war.endTime) : null;
      const warOver  = war.state === "warEnded" || (war.state === "inWar" && endTime && endTime <= now);
      if (!warOver) { skipped++; continue; }

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

      const attacksUsed = ourSide.attacks?.length ?? null;
      const teamSize    = war.teamSize ?? null;

      // Upsert — insert new or update provisional record with final scores
      const existing = await sql`
        SELECT id FROM regular_war_results
        WHERE clan_tag = ${clan.clan_tag} AND war_start_time = ${new Date(startTime)}
        LIMIT 1
      `;

      if (existing.length > 0) {
        // Update existing provisional record with final scores
        await sql`
          UPDATE regular_war_results SET
            stars_earned    = ${ourStars},
            stars_conceded  = ${theirStars},
            destruction_pct = ${parseFloat(ourDest.toFixed(2))},
            defence_pct     = ${parseFloat(theirDest.toFixed(2))},
            attacks_used    = ${attacksUsed},
            result          = ${result},
            captured_at     = now()
          WHERE id = ${existing[0].id}
        `;
        updated++;
      } else {
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
            ${new Date(startTime)}, ${teamSize},
            ${ourStars}, ${theirStars},
            ${parseFloat(ourDest.toFixed(2))}, ${parseFloat(theirDest.toFixed(2))},
            ${attacksUsed}, ${(teamSize ?? 0) * 2},
            ${result}
          )
        `;
        captured++;
      }
    } catch (err) {
      errors.push({ clan: clan.clan_name, error: err.message });
    }
  }

  return NextResponse.json({ captured, updated, skipped, errors: errors.length ? errors : undefined });
}
