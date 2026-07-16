import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getClan } from "@/lib/coc";

const WEBHOOK_USERNAME   = "Cognition {CGN}";
const WEBHOOK_AVATAR_URL = "https://cdn.discordapp.com/attachments/1480200113082208346/1484473662198251692/IMG_0364.png?ex=6a520355&is=6a50b1d5&hm=baa6944e521d271f7444d77db5aae046185dab6796ecab3b0b5fee2ca20a6cfe&";

function getCwlIconUrl(rankName) {
  if (!rankName) return null;
  const lower = rankName.toLowerCase();
  if (lower.includes("champion") && lower.includes("i") && !lower.includes("ii") && !lower.includes("iii")) return "https://cgnco.vercel.app/icons/cwl/champion-1.png";
  if (lower.includes("champion") && lower.includes("ii") && !lower.includes("iii")) return "https://cgnco.vercel.app/icons/cwl/champion-2.png";
  if (lower.includes("champion") && lower.includes("iii")) return "https://cgnco.vercel.app/icons/cwl/champion-3.png";
  if (lower.includes("master") && lower.includes("i") && !lower.includes("ii") && !lower.includes("iii")) return "https://cgnco.vercel.app/icons/cwl/master-1.png";
  if (lower.includes("master") && lower.includes("ii") && !lower.includes("iii")) return "https://cgnco.vercel.app/icons/cwl/master-2.png";
  if (lower.includes("master") && lower.includes("iii")) return "https://cgnco.vercel.app/icons/cwl/master-3.png";
  if (lower.includes("crystal") && lower.includes("i") && !lower.includes("ii") && !lower.includes("iii")) return "https://cgnco.vercel.app/icons/cwl/crystal-1.png";
  if (lower.includes("crystal") && lower.includes("ii") && !lower.includes("iii")) return "https://cgnco.vercel.app/icons/cwl/crystal-2.png";
  if (lower.includes("crystal") && lower.includes("iii")) return "https://cgnco.vercel.app/icons/cwl/crystal-3.png";
  if (lower.includes("gold") && lower.includes("i") && !lower.includes("ii") && !lower.includes("iii")) return "https://cgnco.vercel.app/icons/cwl/gold-1.png";
  if (lower.includes("gold") && lower.includes("ii") && !lower.includes("iii")) return "https://cgnco.vercel.app/icons/cwl/gold-2.png";
  if (lower.includes("gold") && lower.includes("iii")) return "https://cgnco.vercel.app/icons/cwl/gold-3.png";
  if (lower.includes("silver") && lower.includes("i") && !lower.includes("ii") && !lower.includes("iii")) return "https://cgnco.vercel.app/icons/cwl/silver-1.png";
  if (lower.includes("silver") && lower.includes("ii") && !lower.includes("iii")) return "https://cgnco.vercel.app/icons/cwl/silver-2.png";
  if (lower.includes("silver") && lower.includes("iii")) return "https://cgnco.vercel.app/icons/cwl/silver-3.png";
  if (lower.includes("bronze") && lower.includes("i") && !lower.includes("ii") && !lower.includes("iii")) return "https://cgnco.vercel.app/icons/cwl/bronze-1.png";
  if (lower.includes("bronze") && lower.includes("ii") && !lower.includes("iii")) return "https://cgnco.vercel.app/icons/cwl/bronze-2.png";
  if (lower.includes("bronze") && lower.includes("iii")) return "https://cgnco.vercel.app/icons/cwl/bronze-3.png";
  return null;
}



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
  const isSideWar  = clanDbRow?.is_side_war === true;
  const cwlRank    = isSideWar ? null : (clanDbRow?.cwl_rank || clan.warLeague?.name || "Unranked");
  const thumbnail  = isSideWar
    ? { url: "https://cgnco.vercel.app/icons/branding/ores.png" }
    : (getCwlIconUrl(cwlRank) ? { url: getCwlIconUrl(cwlRank) } : undefined);
  const colour     = isSideWar ? 0x5865F2 : getRankColour(cwlRank);
  const clanLink   = clanDbRow?.clan_link || `https://link.clashofclans.com/en?action=OpenClanProfile&tag=${encodeURIComponent(clan.tag)}`;
  const winStreak  = clan.warWinStreak ?? 0;
  const warWins    = clan.warWins ?? 0;
  const members    = clan.members ?? 0;
  const ts         = formatTs(capturedAt);

  const embed = {
    color:     colour,
    author:    { name: clan.name, icon_url: clan.badgeUrls?.small },
    thumbnail,
    fields: (clanDbRow?.cwl_only === true || clanDbRow?.cwl_only === "true")
      ? [
          { name: "CWL Only", value: "​", inline: false },
          { name: "​", value: `[**Join**](${clanLink})`, inline: false },
        ]
      : (clanDbRow?.side_war_only === true || clanDbRow?.side_war_only === "true")
      ? [
          { name: "Side War Only", value: "​", inline: false },
          { name: "​", value: `[**Join**](${clanLink})`, inline: false },
        ]
      : [
          { name: "⚡️ Streak",  value: `${winStreak}`, inline: true },
          { name: "​", value: `[**Join**](${clanLink})`, inline: false },
        ],
    footer: { text: `👤 ${members}/50  •  ${ts}` },
  };

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

  // Get included clans from board config — alliance + side war clans
  const allianceRows = await sql`
    SELECT c.clan_tag, c.clan_name, c.cwl_rank, c.clan_link,
      COALESCE(bc.seed_wins, 0)          as seed_wins,
      COALESCE(bc.seed_draws, 0)         as seed_draws,
      COALESCE(bc.seed_losses, 0)        as seed_losses,
      COALESCE(bc.display_order, 999)    as display_order,
      COALESCE(bc.cwl_only, false)       as cwl_only,
      COALESCE(bc.side_war_only, false)  as side_war_only,
      false as is_side_war
    FROM clans c
    INNER JOIN clan_info_board_config bc ON bc.clan_tag = c.clan_tag
    WHERE bc.included = true
    ORDER BY bc.display_order ASC NULLS LAST, c.clan_name ASC
  `;

  const sideWarRows = await sql`
    SELECT DISTINCT ON (sw.clan_tag)
      sw.clan_tag, sw.clan_name, null as cwl_rank, sw.clan_link,
      COALESCE(bc.seed_wins, 0)          as seed_wins,
      COALESCE(bc.seed_draws, 0)         as seed_draws,
      COALESCE(bc.seed_losses, 0)        as seed_losses,
      COALESCE(bc.display_order, 999)    as display_order,
      COALESCE(bc.cwl_only, false)       as cwl_only,
      COALESCE(bc.side_war_only, false)  as side_war_only,
      true as is_side_war
    FROM side_wars sw
    INNER JOIN clan_info_board_config bc ON bc.clan_tag = sw.clan_tag
    WHERE bc.included = true
    ORDER BY sw.clan_tag, sw.created_at DESC
  `;

  const configRows = [...allianceRows, ...sideWarRows]
    .sort((a, b) => (parseInt(a.display_order||999) - parseInt(b.display_order||999)));

  if (configRows.length === 0) {
    return NextResponse.json({ error: "No clans configured for the info board" }, { status: 404 });
  }

  // Get running war totals from regular_war_results
  const warTotals = await sql`
    SELECT clan_tag,
      COUNT(*) FILTER (WHERE result = 'win')  as wins,
      COUNT(*) FILTER (WHERE result = 'draw') as draws,
      COUNT(*) FILTER (WHERE result = 'lose') as losses
    FROM regular_war_results
    WHERE clan_tag = ANY(${configRows.map(r => r.clan_tag)})
    GROUP BY clan_tag
  `;
  const warMap = Object.fromEntries(warTotals.map(r => [r.clan_tag, r]));

  const capturedAt = new Date();
  const embeds     = [];
  for (const clanRow of configRows) {
    try {
      const clan = await getClan(clanRow.clan_tag);
      if (!clan) continue;
      const wt = warMap[clanRow.clan_tag] || {};
      const warRecord = {
        wars_won:   (parseInt(wt.wins || 0))   + parseInt(clanRow.seed_wins),
        wars_drawn: (parseInt(wt.draws || 0))  + parseInt(clanRow.seed_draws),
        wars_lost:  (parseInt(wt.losses || 0)) + parseInt(clanRow.seed_losses),
      };
      embeds.push(buildClanEmbed(clan, clanRow, capturedAt, warRecord));
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
        body: JSON.stringify({ content: "", embeds, username: WEBHOOK_USERNAME, avatar_url: WEBHOOK_AVATAR_URL }),
      });
      if (res.ok) {
        await sql`UPDATE discord_live_messages SET last_updated = now() WHERE id = ${msg.id}`;
        updated++;
      }
    } catch { /* skip */ }
  }

  return NextResponse.json({ updated, clansPosted: embeds.length });
}
