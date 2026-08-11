import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getOpenPoolSeason } from "@/lib/season";
import { upsertComplianceCache, upsertConnectivityCache } from "@/lib/pool";

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

// Shared refresh for the Overview dashboard's Roster Compliance + Member
// Connectivity tiles. Fetches each alliance clan's live CoC roster ONCE,
// then runs both comparisons against that single fetch — avoids hitting the
// CoC API twice for the same data, unlike calling the two dedicated pages'
// endpoints separately would.
export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const sql = getDb();
  const season = await getOpenPoolSeason();

  const clans = await sql`SELECT clan_name, clan_tag FROM clans WHERE clan_tag IS NOT NULL`;

  const rostered = await sql`
    SELECT pe.player_tag, pe.assigned_clan
    FROM pool_entries pe
    WHERE pe.season = ${season}
      AND pe.assigned_clan IS NOT NULL
      AND pe.status IN ('confirmed', 'substitute')
  `;
  const rosteredClanByTag = new Map(rostered.map(r => [normaliseTag(r.player_tag), r.assigned_clan]));

  const accounts = await sql`SELECT player_tag FROM accounts`;
  const connectedTags = new Set(accounts.map(a => normaliseTag(a.player_tag)));

  // ── Single live fetch per clan, shared by both checks ──
  const liveClanByTag = new Map();
  let totalMembers = 0;
  const errors = [];
  for (const clan of clans) {
    try {
      const members = await fetchClanMembers(clan.clan_tag);
      totalMembers += members.length;
      for (const m of members) {
        liveClanByTag.set(normaliseTag(m.tag), clan.clan_name);
      }
    } catch (e) {
      errors.push(`${clan.clan_name}: ${e.message}`);
    }
  }

  // ── Compliance: of the rostered players, how many are actually in their assigned clan right now ──
  let correctCount = 0;
  for (const [tag, assignedClan] of rosteredClanByTag) {
    if (liveClanByTag.get(tag) === assignedClan) correctCount++;
  }
  const totalRostered = rosteredClanByTag.size;

  // ── Connectivity: of everyone actually in our clans right now, how many have a linked account ──
  let connectedCount = 0;
  for (const tag of liveClanByTag.keys()) {
    if (connectedTags.has(tag)) connectedCount++;
  }

  await upsertComplianceCache({ correctCount, totalRostered });
  await upsertConnectivityCache({ connectedCount, totalMembers });

  return NextResponse.json({
    ok: true,
    compliance: { correctCount, totalRostered },
    connectivity: { connectedCount, totalMembers },
    errors,
    checkedAt: new Date().toISOString(),
  });
}
