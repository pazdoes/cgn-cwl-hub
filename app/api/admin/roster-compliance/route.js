import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getOpenPoolSeason } from "@/lib/season";

async function fetchClanMembers(clanTag) {
  const encoded = encodeURIComponent(clanTag);
  const res = await fetch(`https://cocproxy.royaleapi.dev/v1/clans/${encoded}/members`, {
    headers: { Authorization: `Bearer ${process.env.COC_API_KEY}` },
    next: { revalidate: 0 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

// Normalise O→0 since CoC tags never use letter O, only digit 0
const normaliseTag = t => t?.toUpperCase().replace(/O/g, "0") || "";

export async function GET(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const sql = getDb();
  const season = await getOpenPoolSeason();

  // All alliance clans with a known CoC tag
  const clans = await sql`SELECT clan_name, clan_tag FROM clans WHERE clan_tag IS NOT NULL`;

  // All currently rostered players for the active season
  const rostered = await sql`
    SELECT
      pe.player_tag,
      pe.assigned_clan,
      pe.status,
      a.player_name,
      a.town_hall_level
    FROM pool_entries pe
    JOIN accounts a ON a.player_tag = pe.player_tag
    WHERE pe.season = ${season}
      AND pe.assigned_clan IS NOT NULL
      AND pe.status IN ('confirmed', 'substitute')
  `;

  // Build a live tag → clan map from CoC data across all alliance clans
  const liveClanByTag = new Map();
  for (const clan of clans) {
    try {
      const members = await fetchClanMembers(clan.clan_tag);
      for (const m of members) {
        liveClanByTag.set(normaliseTag(m.tag), clan.clan_name);
      }
    } catch (e) {
      console.error(`Failed to fetch members for ${clan.clan_name}:`, e);
    }
  }

  const mismatches = [];
  let correctCount = 0;

  for (const player of rostered) {
    const tag = normaliseTag(player.player_tag);
    const liveClan = liveClanByTag.get(tag) || null;

    if (liveClan === player.assigned_clan) {
      correctCount++;
      continue;
    }

    mismatches.push({
      player_tag: player.player_tag,
      player_name: player.player_name,
      town_hall_level: player.town_hall_level,
      rostered_clan: player.assigned_clan,
      live_clan: liveClan, // null = not found in any alliance clan
      status: player.status,
    });
  }

  // Sort by rostered clan, then TH desc
  mismatches.sort((a, b) => {
    if (a.rostered_clan !== b.rostered_clan) return a.rostered_clan.localeCompare(b.rostered_clan);
    return (b.town_hall_level || 0) - (a.town_hall_level || 0);
  });

  return NextResponse.json({
    mismatches,
    total: mismatches.length,
    correctCount,
    totalRostered: rostered.length,
    season,
  });
}
