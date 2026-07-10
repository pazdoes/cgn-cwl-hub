import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getClan } from "@/lib/coc";

function buildClanEmbed(clan, clanDbRow) {
  const level = clan.clanLevel ?? 1;
  const league = clanDbRow?.cwl_rank || clan.warLeague?.name || "Unranked";
  const clanLink = clanDbRow?.clan_link || `https://link.clashofclans.com/en?action=OpenClanProfile&tag=${encodeURIComponent(clan.tag)}`;
  return {
    color: 0x5865F2,
    author: {
      name: `${clan.name}  •  Level ${level}`,
      icon_url: clan.badgeUrls?.medium || clan.badgeUrls?.small,
    },
    fields: [
      { name: "🏆 CWL League", value: league, inline: true },
      { name: "👥 Members", value: `${clan.members ?? 0}/50`, inline: true },
      { name: "⚔️ War Wins", value: `${clan.warWins ?? 0}`, inline: true },
      { name: "🔥 Win Streak", value: `${clan.warWinStreak ?? 0}`, inline: true },
      { name: "🏷️ Tag", value: clan.tag, inline: true },
      { name: "🔗 Join", value: `[Open in Clash](${clanLink})`, inline: true },
    ],
    thumbnail: { url: clan.badgeUrls?.medium || clan.badgeUrls?.small },
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
