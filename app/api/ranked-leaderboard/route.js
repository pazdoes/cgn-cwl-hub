import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Exact league name prefixes as returned by the CoC API — highest first
const LEAGUE_ORDER = [
  "Legend I",
  "Legend II",
  "Legend III",
  "Electro League",   // Electro Dragon (31-33)
  "Dragon League",    // Dragon (28-30)
  "Titan League",     // Electro Titan (25-27)
  "P.E.K.K.A League",// P.E.K.K.A (22-24)
  "Golem League",     // Golem (19-21)
  "Witch League",     // Witch (16-18)
  "Valkyrie League",  // Valkyrie (13-15)
  "Wizard League",    // Wizard (10-12)
  "Archer League",    // Archer (7-9)
  "Barbarian League", // Barbarian (4-6)
  "Skeleton League",  // Skeleton (1-3)
  "Unranked",
];

function leagueSortKey(name) {
  if (!name) return 99;
  const idx = LEAGUE_ORDER.findIndex(l => name.startsWith(l));
  return idx === -1 ? 98 : idx;
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

  // Sort groups by league tier (highest first — lower index in LEAGUE_ORDER = higher tier)
  const sortedGroups = Object.entries(grouped).sort((a, b) => {
    return leagueSortKey(a[0]) - leagueSortKey(b[0]);
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
