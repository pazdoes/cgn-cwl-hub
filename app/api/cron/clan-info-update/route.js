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

function formatTs(date) {
  const dd  = String(date.getUTCDate()).padStart(2, "0");
  const mm  = String(date.getUTCMonth() + 1).padStart(2, "0");
  const yy  = String(date.getUTCFullYear()).slice(2);
  const hh  = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${min} UTC`;
}

function buildClanEmbed(clan, clanDbRow, capturedAt, warRecord = {}) {
  const cwlRank    = clanDbRow?.cwl_rank || clan.warLeague?.name || "Unranked";
  const cwlIconUrl = clan.warLeague?.iconUrls?.medium || clan.warLeague?.iconUrls?.small || null;
  const clanLink   = clanDbRow?.clan_link || `https://link.clashofclans.com/en?action=OpenClanProfile&tag=${encodeURIComponent(clan.tag)}`;
  const winStreak  = clan.warWinStreak ?? 0;
  const warWins    = clan.warWins ?? 0;
  const members    = clan.members ?? 0;
  const ts         = formatTs(capturedAt);

  const embed = {
    color:  getRankColour(cwlRank),
    author: { name: clan.name, icon_url: clan.badgeUrls?.small, url: clanLink },
    title:  cwlRank,
    url:    clanLink,
    fields: [
      { name: "W / D / L", value: `${warRecord.wars_won ?? warWins} / ${warRecord.wars_drawn ?? 0} / ${warRecord.wars_lost ?? 0}`, inline: true },
      { name: "⚡️ Streak",  value: `${winStreak}`, inline: true },
    ],
    footer: { text: `👤 ${members}/50  •  ${ts}` },
  };

  if (cwlIconUrl) embed.thumbnail = { url: cwlIconUrl };
  return embed;
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const sql          = getDb();
  const liveMessages = await sql`SELECT * FROM discord_live_messages WHERE type = 'clan_info'`;
  if (liveMessages.length === 0) {
    return NextResponse.json({ updated: 0, message: "No live clan info messages configured" });
  }

  const clans = await sql`SELECT * FROM clans WHERE cwl_absent = false OR cwl_absent IS NULL ORDER BY display_order ASC NULLS LAST, clan_name ASC`;

  const currentSeason = await sql`SELECT season FROM season_registry ORDER BY season_date DESC LIMIT 1`;
  const seasonName    = currentSeason[0]?.season || null;
  const warRecords    = seasonName ? await sql`
    SELECT clan_name, wars_won, wars_drawn, wars_lost
    FROM clan_season_history WHERE season = ${seasonName}
  ` : [];
  const warRecordMap = Object.fromEntries(warRecords.map(r => [r.clan_name, r]));

  const capturedAt = new Date();
  const embeds     = [];
  for (const clanRow of clans) {
    try {
      const clan = await getClan(clanRow.clan_tag);
      if (clan) embeds.push(buildClanEmbed(clan, clanRow, capturedAt, warRecordMap[clanRow.clan_name] || {}));
    } catch { /* skip */ }
  }

  if (embeds.length === 0) {
    return NextResponse.json({ updated: 0, error: "Failed to fetch clan data" });
  }

  let updated = 0;
  for (const msg of liveMessages) {
    try {
      const res = await fetch(`${msg.webhook_url}/messages/${msg.message_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds }),
      });
      if (res.ok) {
        await sql`UPDATE discord_live_messages SET last_updated = now() WHERE id = ${msg.id}`;
        updated++;
      }
    } catch { /* skip */ }
  }

  return NextResponse.json({ updated, clansPosted: embeds.length });
}
