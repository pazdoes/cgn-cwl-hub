import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Extract numeric tier from league name e.g. "Dragon League 28" → 28
// Legend I=103, Legend II=102, Legend III=101 (above all numbered tiers)
function leagueTierNumber(name) {
  if (!name) return 0;
  if (name === "Legend I") return 103;
  if (name === "Legend II") return 102;
  if (name === "Legend III") return 101;
  const match = name.match(/(\d+)$/);
  return match ? parseInt(match[1]) : 0;
}

// Base league name without tier number e.g. "Dragon League 28" → "Dragon League"
function leagueBaseName(name) {
  if (!name) return "Unranked";
  return name.replace(/\s+\d+$/, "").trim();
}

// Sort order for base league names — highest first
const BASE_LEAGUE_ORDER = [
  "Legend I", "Legend II", "Legend III",
  "Electro League",
  "Dragon League",
  "Titan League",
  "P.E.K.K.A League",
  "Golem League",
  "Witch League",
  "Valkyrie League",
  "Wizard League",
  "Archer League",
  "Barbarian League",
  "Skeleton League",
  "Unranked",
];

function baseLeagueSortKey(name) {
  const idx = BASE_LEAGUE_ORDER.indexOf(name);
  return idx === -1 ? 99 : idx;
}

export async function GET() {
  const sql = getDb();

  const rows = await sql`
    SELECT DISTINCT ON (a.player_tag)
      a.player_tag,
      c.data->>'name'              AS name,
      c.data->'league'->>'name'    AS league_name,
      c.data->'league'->>'iconUrl' AS league_icon,
      (c.data->>'trophies')::int   AS trophies,
      (c.data->>'townHallLevel')::int AS th,
      c.data->'clan'->>'name'      AS clan_name,
      c.data->'clan'->>'badgeUrl'  AS clan_badge,
      c.captured_at
    FROM accounts a
    INNER JOIN player_army_cache c ON c.player_tag = a.player_tag
    WHERE a.player_tag IS NOT NULL
      AND c.data->>'trophies' IS NOT NULL
      AND COALESCE(a.active, true) = true
      AND a.current_clan_tag IN ('#2C8QQPCL2','#2CPC8GR9R','#2Y9PGJGVC','#2YQJJUYQY','#2YV9UCJG2')
    ORDER BY a.player_tag, c.captured_at DESC
  `;

  // Sort all players: by tier number desc, then trophies desc within tier
  const sorted = [...rows].sort((a, b) => {
    const ta = leagueTierNumber(a.league_name);
    const tb = leagueTierNumber(b.league_name);
    if (tb !== ta) return tb - ta;
    return (b.trophies || 0) - (a.trophies || 0);
  });

  // Group by exact league name (e.g. "Dragon League 30" is its own group)
  const grouped = {};
  for (const row of sorted) {
    const league = row.league_name || "Unranked";
    if (!grouped[league]) grouped[league] = [];
    grouped[league].push(row);
  }

  // Sort groups: by tier number desc, then base league order
  const sortedGroups = Object.entries(grouped).sort((a, b) => {
    const ta = leagueTierNumber(a[0]);
    const tb = leagueTierNumber(b[0]);
    if (tb !== ta) return tb - ta;
    return baseLeagueSortKey(leagueBaseName(a[0])) - baseLeagueSortKey(leagueBaseName(b[0]));
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
