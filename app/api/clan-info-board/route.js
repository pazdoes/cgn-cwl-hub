import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getClan } from "@/lib/coc";

function buildClanEmbed(clan, clanDbRow) {
  const memberCount = clan.members ?? 0;
  const maxMembers = clan.requiredTrophies !== undefined ? 50 : 50;
  const winStreak = clan.warWinStreak ?? 0;
  const warWins = clan.warWins ?? 0;
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
      { name: "👥 Members", value: `${memberCount}/50`, inline: true },
      { name: "⚔️ War Wins", value: `${warWins}`, inline: true },
      { name: "🔥 Win Streak", value: `${winStreak}`, inline: true },
      { name: "🏷️ Tag", value: clan.tag, inline: true },
      { name: "🔗 Join", value: `[Open in Clash](${clanLink})`, inline: true },
    ],
    thumbnail: { url: clan.badgeUrls?.medium || clan.badgeUrls?.small },
  };
}

export async function POST(request) {
  const sql = getDb();
  const body = await request.json();
  const { webhook_url, pin } = body;

  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  if (!webhook_url) {
    return NextResponse.json({ error: "webhook_url required" }, { status: 400 });
  }

  // Fetch all active clans
  const clans = await sql`SELECT * FROM clans WHERE cwl_absent = false OR cwl_absent IS NULL ORDER BY display_order ASC NULLS LAST, clan_name ASC`;

  if (clans.length === 0) {
    return NextResponse.json({ error: "No active clans found" }, { status: 404 });
  }

  // Fetch live data for each clan from CoC API
  const embeds = [];
  for (const clanRow of clans) {
    try {
      const clan = await getClan(clanRow.clan_tag);
      if (clan) embeds.push(buildClanEmbed(clan, clanRow));
    } catch { /* skip failed clans */ }
  }

  if (embeds.length === 0) {
    return NextResponse.json({ error: "Failed to fetch clan data" }, { status: 500 });
  }

  const now = new Date();
  const timestamp = now.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC";

  // Check if we have an existing message to edit
  const [existing] = await sql`SELECT * FROM discord_live_messages WHERE type = 'clan_info' AND webhook_url = ${webhook_url} LIMIT 1`;

  let messageId = existing?.message_id;
  let success = false;

  if (messageId) {
    // Edit existing message
    const editRes = await fetch(`${webhook_url}/messages/${messageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `**Cognition Alliance — Clan Info Board**\n*Last updated: ${timestamp}*`,
        embeds,
      }),
    });
    success = editRes.ok;
    if (!success) messageId = null; // Message was deleted — post fresh
  }

  if (!messageId) {
    // Post new message
    const postRes = await fetch(`${webhook_url}?wait=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `**Cognition Alliance — Clan Info Board**\n*Last updated: ${timestamp}*`,
        embeds,
      }),
    });
    if (postRes.ok) {
      const posted = await postRes.json();
      messageId = posted.id;
      success = true;

      if (existing) {
        await sql`UPDATE discord_live_messages SET message_id = ${messageId}, last_updated = now() WHERE id = ${existing.id}`;
      } else {
        await sql`INSERT INTO discord_live_messages (type, webhook_url, message_id, last_updated) VALUES ('clan_info', ${webhook_url}, ${messageId}, now())`;
      }
    }
  } else {
    await sql`UPDATE discord_live_messages SET last_updated = now() WHERE type = 'clan_info' AND webhook_url = ${webhook_url}`;
  }

  return NextResponse.json({ success, messageId, clansPosted: embeds.length, timestamp });
}

export async function GET() {
  const sql = getDb();
  const messages = await sql`SELECT * FROM discord_live_messages WHERE type = 'clan_info' ORDER BY created_at DESC`;
  return NextResponse.json({ messages });
}
