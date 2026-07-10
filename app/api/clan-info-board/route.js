import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getClan } from "@/lib/coc";

function getRankColour(rankName) {
  if (!rankName) return 0x5865F2;
  if (rankName.includes("Champion")) return 0xE74C3C;
  if (rankName.includes("Master"))   return 0x23272A;
  if (rankName.includes("Crystal"))  return 0x9B59B6;
  if (rankName.includes("Gold"))     return 0xFFD700;
  if (rankName.includes("Silver"))   return 0xC0C0C0;
  if (rankName.includes("Bronze"))   return 0xCD7F32;
  return 0x5865F2;
}

function buildClanEmbed(clan, clanDbRow, timestamp, warRecord = {}) {
  const cwlRank = clanDbRow?.cwl_rank || clan.warLeague?.name || "Unranked";
  const cwlIconUrl = clan.warLeague?.iconUrls?.medium || clan.warLeague?.iconUrls?.small || null;
  const clanLink = clanDbRow?.clan_link || `https://link.clashofclans.com/en?action=OpenClanProfile&tag=${encodeURIComponent(clan.tag)}`;
  const winStreak = clan.warWinStreak ?? 0;
  const warWins = clan.warWins ?? 0;
  const members = clan.members ?? 0;

  // Format timestamp as DD/MM/YY HH:MM UTC
  const now = timestamp ? new Date(timestamp) : new Date();
  const dd = String(now.getUTCDate()).padStart(2,"0");
  const mm = String(now.getUTCMonth()+1).padStart(2,"0");
  const yy = String(now.getUTCFullYear()).slice(2);
  const hh = String(now.getUTCHours()).padStart(2,"0");
  const min = String(now.getUTCMinutes()).padStart(2,"0");
  const ts = `${dd}/${mm}/${yy} ${hh}:${min} UTC`;

  return {
    color: getRankColour(cwlRank),
    author: {
      name: clan.name,
      icon_url: clan.badgeUrls?.small,
      url: clanLink,
    },
    title: cwlRank,
    url: clanLink,
    thumbnail: cwlIconUrl ? { url: cwlIconUrl } : undefined,
    fields: [
      { name: "W / D / L", value: `${warRecord.wars_won ?? warWins} / ${warRecord.wars_drawn ?? 0} / ${warRecord.wars_lost ?? 0}`, inline: true },
      { name: "⚡️ Streak",  value: `${winStreak}`,        inline: true },
    ],
    footer: {
      text: `👤 ${members}/50  •  ${ts}`,
    },
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
  // Also get current season war record from DB
  const currentSeason = await sql`SELECT season FROM season_registry ORDER BY season_date DESC LIMIT 1`;
  const seasonName = currentSeason[0]?.season || null;
  const warRecords = seasonName ? await sql`
    SELECT clan_name, wars_won, wars_drawn, wars_lost
    FROM clan_season_history
    WHERE season = ${seasonName}
  ` : [];
  const warRecordMap = Object.fromEntries(warRecords.map(r => [r.clan_name, r]));

  const nowTs = new Date();
  const embeds = [];
  for (const clanRow of clans) {
    try {
      const clan = await getClan(clanRow.clan_tag);
      if (clan) {
        const wr = warRecordMap[clanRow.clan_name] || {};
        embeds.push(buildClanEmbed(clan, clanRow, now, wr));
      }
    } catch { /* skip failed clans */ }
  }

  if (embeds.length === 0) {
    return NextResponse.json({ error: "Failed to fetch clan data" }, { status: 500 });
  }

  const nowTs = new Date();
  const timestamp = nowTs.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC";

  // Check if we have an existing message to edit
  const [existing] = await sql`SELECT * FROM discord_live_messages WHERE type = 'clan_info' AND webhook_url = ${webhook_url} LIMIT 1`;

  let messageId = existing?.message_id;
  let success = false;

  // Strip undefined values from embeds (JSON.stringify drops undefined keys but be safe)
  const cleanEmbeds = JSON.parse(JSON.stringify(embeds));

  if (messageId) {
    // Edit existing message
    const editRes = await fetch(`${webhook_url}/messages/${messageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: cleanEmbeds }),
    });
    if (!editRes.ok) {
      const errText = await editRes.text();
      console.error("Discord PATCH failed:", editRes.status, errText);
    }
    success = editRes.ok;
    if (!success) messageId = null; // Message was deleted — post fresh
  }

  if (!messageId) {
    // Post new message
    const postRes = await fetch(`${webhook_url}?wait=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: cleanEmbeds }),
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
