import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

async function fetchClanMembers(clanTag) {
  const encoded = encodeURIComponent(clanTag);
  const res = await fetch(`https://cocproxy.royaleapi.dev/v1/clans/${encoded}/members`, {
    headers: { Authorization: `Bearer ${process.env.COC_API_TOKEN}` },
    next: { revalidate: 0 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

export async function GET(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const sql = getDb();

  // Get all alliance clans
  const clans = await sql`SELECT clan_name, clan_tag FROM clans WHERE clan_tag IS NOT NULL`;

  // Get all connected account tags
  const accounts = await sql`SELECT player_tag FROM accounts`;
  const connectedTags = new Set(accounts.map(a => a.player_tag.toUpperCase()));

  const missing = [];

  for (const clan of clans) {
    try {
      const members = await fetchClanMembers(clan.clan_tag);
      for (const m of members) {
        const tag = m.tag?.toUpperCase();
        if (tag && !connectedTags.has(tag)) {
          missing.push({
            player_tag: m.tag,
            player_name: m.name,
            town_hall_level: m.townHallLevel,
            clan_name: clan.clan_name,
            clan_tag: clan.clan_tag,
            role: m.role,
            trophies: m.trophies,
          });
        }
      }
    } catch (e) {
      console.error(`Failed to fetch members for ${clan.clan_name}:`, e);
    }
  }

  // Sort by clan then TH level desc
  missing.sort((a, b) => {
    const clanOrder = n => n.toLowerCase().startsWith("cognition") ? 0 : n.toLowerCase().startsWith("gems") ? 10 : 5;
    return clanOrder(a.clan_name) - clanOrder(b.clan_name) || (b.town_hall_level - a.town_hall_level);
  });

  return NextResponse.json({ missing, total: missing.length });
}
