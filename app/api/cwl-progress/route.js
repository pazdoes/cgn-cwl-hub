import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Public — returns current season CWL progress for the homepage tile
// Returns null data if no attacks have been recorded yet (prep day / sign-up)
export async function GET() {
  try {
    const sql = getDb();

    // Get the current open season
    const [seasonRow] = await sql`
      SELECT season FROM seasons WHERE is_open = true LIMIT 1
    `;
    if (!seasonRow) return NextResponse.json({ active: false });
    const season = seasonRow.season;

    // Check if any attacks have been recorded — if not, tile stays hidden
    const [attackCheck] = await sql`
      SELECT COUNT(*) as cnt FROM player_cwl_stats
      WHERE season = ${season} AND attacks_used > 0
    `;
    if (!attackCheck || Number(attackCheck.cnt) === 0) {
      return NextResponse.json({ active: false });
    }

    // Alliance totals
    const [totals] = await sql`
      SELECT
        SUM(attacks_used)      AS total_attacks,
        SUM(attacks_available) AS total_available,
        SUM(stars_earned)      AS total_stars,
        SUM(stars_conceded)    AS total_stars_conceded,
        COUNT(DISTINCT player_tag) AS total_players
      FROM player_cwl_stats
      WHERE season = ${season}
        AND player_tag IN (SELECT player_tag FROM accounts)
        AND attacks_used > 0
    `;

    // Round estimation: each war = 7 attacks per player slot, but use attacks_available
    // clan_season_history for W/L/D
    const clans = await sql`
      SELECT clan_name, cwl_rank, wars_won, wars_lost, wars_drawn,
             attack_efficiency
      FROM clan_season_history
      WHERE season = ${season}
      ORDER BY attack_efficiency DESC NULLS LAST
    `;

    // Top 5 attackers (linked accounts only)
    const topAttackers = await sql`
      SELECT player_name, clan_name, efficiency, stars_earned, attacks_used, three_star_rate
      FROM player_cwl_stats
      WHERE season = ${season}
        AND player_tag IN (SELECT player_tag FROM accounts)
        AND attacks_used > 0
      ORDER BY efficiency DESC, stars_earned DESC
      LIMIT 5
    `;

    // Top defender
    const topDefender = await sql`
      SELECT player_name, clan_name, defence_efficiency, stars_conceded
      FROM player_cwl_stats
      WHERE season = ${season}
        AND player_tag IN (SELECT player_tag FROM accounts)
        AND attacks_used > 0
      ORDER BY defence_efficiency ASC, stars_conceded ASC
      LIMIT 1
    `;

    // Determine if season is complete (all attacks used)
    const isComplete = totals && totals.total_attacks >= totals.total_available;

    // Approx round — based on max attacks_used for any single player (max 7)
    const [roundCheck] = await sql`
      SELECT MAX(attacks_used) AS max_attacks
      FROM player_cwl_stats
      WHERE season = ${season}
        AND player_tag IN (SELECT player_tag FROM accounts)
    `;
    const currentRound = roundCheck ? Math.min(Number(roundCheck.max_attacks), 7) : 0;

    return NextResponse.json({
      active: true,
      season,
      isComplete,
      currentRound,
      totals: {
        totalStars: Number(totals?.total_stars || 0),
        totalStarsConceded: Number(totals?.total_stars_conceded || 0),
        totalAttacks: Number(totals?.total_attacks || 0),
        totalAvailable: Number(totals?.total_available || 0),
      },
      clans,
      topAttackers,
      topDefender: topDefender[0] || null,
    });

  } catch (err) {
    console.error("cwl-progress error:", err);
    return NextResponse.json({ active: false });
  }
}
