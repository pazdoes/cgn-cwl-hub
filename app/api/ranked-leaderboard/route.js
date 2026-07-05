import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// League tier display order — lowest to highest
const LEAGUE_ORDER = [
  "Skeleton", "Barbarian", "Archer", "Wizard", "Valkyrie", "Witch",
  "Golem", "P.E.K.K.A", "Electro Titan", "Dragon", "Electro Dragon",
  "Legend III", "Legend II", "Legend I",
];

function leagueSortKey(name) {
  if (!name) return -1;
  const base = LEAGUE_ORDER.findIndex(l => name.includes(l));
  return base === -1 ? -1 : base;
}

export async function GET() {
  const sql = getDb();

  // Get latest snapshot per registered player
  const rows = await sql`
    SELECT DISTINCT ON (a.player_tag)
      a.player_tag,
      c.data->>'name'          AS name,
      c.data->'league'->>'name' AS league_name,
      c.data->'league'->>'iconUrl' AS league_icon,
      (c.data->>'trophies')::int AS trophies,
      (c.data->>'townHallLevel')::int AS th,
      c.data->'clan'->>'name'   AS clan_name,
      c.data->'clan'->>'badgeUrl' AS clan_badge,
      c.captured_at
    FROM accounts a
    INNER JOIN player_army_cache c ON c.player_tag = a.player_tag
    WHERE a.player_tag IS NOT NULL
      AND c.data->>'trophies' IS NOT NULL
      AND c.data->'league' IS NOT NULL
    ORDER BY a.player_tag, c.captured_at DESC
  `;

  // Sort by trophies descending
  const sorted = [...rows].sort((a, b) => (b.trophies || 0) - (a.trophies || 0));

  // Group by league
  const grouped = {};
  for (const row of sorted) {
    const league = row.league_name || "Unranked";
    if (!grouped[league]) grouped[league] = [];
    grouped[league].push(row);
  }

  // Sort groups by league tier (highest first)
  const sortedGroups = Object.entries(grouped).sort((a, b) => {
    return leagueSortKey(b[0]) - leagueSortKey(a[0]);
  });

  return NextResponse.json({
    groups: sortedGroups.map(([league, players]) => ({
      league,
      iconUrl: players[0]?.league_icon,
      players,
    })),
    total: rows.length,
    updatedAt: rows[0]?.captured_at || null,
  });
}
