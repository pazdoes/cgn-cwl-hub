import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getClan } from "@/lib/coc";

function getRankColour(rankName) {
  if (!rankName) return 0x5865F2;
  if (rankName.includes("Champion")) return 0xFFD700;
  if (rankName.includes("Master"))   return 0x9B59B6;
  if (rankName.includes("Crystal"))  return 0x00BCD4;
  if (rankName.includes("Gold"))     return 0xF39C12;
  if (rankName.includes("Silver"))   return 0xBDC3C7;
  if (rankName.includes("Bronze"))   return 0xCD7F32;
  return 0x5865F2;
}

function buildClanEmbed(clan, clanDbRow) {
  const cwlRank = clanDbRow?.cwl_rank || clan.warLeague?.name || "Unranked";
  const cwlIconUrl = clan.warLeague?.iconUrls?.medium || clan.warLeague?.iconUrls?.small || null;
  const clanLink = clanDbRow?.clan_link || `https://link.clashofclans.com/en?action=OpenClanProfile&tag=${encodeURIComponent(clan.tag)}`;
  const winStreak = clan.warWinStreak ?? 0;
  const warWins = clan.warWins ?? 0;
  const members = clan.members ?? 0;
  const level = clan.clanLevel ?? 1;

  return {
    color: getRankColour(cwlRank),
    author: {
      name: `${clan.name}  •  Level ${level}`,
      icon_url: clan.badgeUrls?.small,
      url: clanLink,
    },
    title: cwlRank,
    thumbnail: cwlIconUrl ? { url: cwlIconUrl } : undefined,
    fields: [
      { name: "⚔️ War Wins",   value: `**${warWins}**`,   inline: true },
      { name: "🔥 Win Streak", value: `**${winStreak}**`, inline: true },
    ],
    footer: {
      text: `${members}/50 Members  •  Open in Clash`,
      icon_url: clan.badgeUrls?.small,
    },
    url: clanLink,
  };
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const sql = getDb();

  // Get all active clan info live messages
  const liveMessages = await sql`SELECT * FROM discord_live_messages WHERE type = 'clan_info'`;
  if (liveMessages.length === 0) {
    return NextResponse.json({ updated: 0, message: "No live clan info messages configured" });
  }

  // Fetch all active clans
  const clans = await sql`SELECT * FROM clans WHERE cwl_absent = false OR cwl_absent IS NULL ORDER BY display_order ASC NULLS LAST, clan_name ASC`;

  const embeds = [];
  for (const clanRow of clans) {
    try {
      const clan = await getClan(clanRow.clan_tag);
      if (clan) embeds.push(buildClanEmbed(clan, clanRow));
    } catch { /* skip */ }
  }

  if (embeds.length === 0) {
    return NextResponse.json({ updated: 0, error: "Failed to fetch clan data" });
  }

  const now = new Date();
  const timestamp = now.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC";

  let updated = 0;
  for (const msg of liveMessages) {
    try {
      const res = await fetch(`${msg.webhook_url}/messages/${msg.message_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `**Cognition Alliance — Clan Info Board**\n*Last updated: ${timestamp}*`,
          embeds,
        }),
      });
      if (res.ok) {
        await sql`UPDATE discord_live_messages SET last_updated = now() WHERE id = ${msg.id}`;
        updated++;
      }
    } catch { /* skip failed */ }
  }

  return NextResponse.json({ updated, clansPosted: embeds.length, timestamp });
}
