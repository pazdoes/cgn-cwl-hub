import { NextResponse } from "next/server";
import { getPendingScheduled, markScheduledSent, logAnnouncement, scheduleAnnouncement, getDb } from "@/lib/pool";

const CGN_AVATAR = "https://cdn.discordapp.com/attachments/1480200113082208346/1484473662198251692/IMG_0364.png?ex=6a477755&is=6a4625d5&hm=439a8a5863af157f40fc94811e8f195e2a2a0cf649c94c2a24bf2c857c15e6d3&";

// Interval map — recurrence value to milliseconds
const INTERVALS = {
  "24hr":   24 * 60 * 60 * 1000,
  "48hr":   48 * 60 * 60 * 1000,
  "7days":   7 * 24 * 60 * 60 * 1000,
  "14days": 14 * 24 * 60 * 60 * 1000,
  "30days": 30 * 24 * 60 * 60 * 1000,
};

// For monthly recap entries — advance by one calendar month from send_at
function nextMonthlyDate(date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  return d;
}

// Fetch the latest completed season and build a Discord embed summary for it
async function buildRecapPayload(sql, rolePing) {
  // Latest completed (non-open) season
  const [seasonRow] = await sql`
    SELECT season FROM seasons
    WHERE is_open = false
    ORDER BY created_at DESC NULLS LAST
    LIMIT 1
  `;
  if (!seasonRow) return null;
  const season = seasonRow.season;

  // Clan history for that season
  const clanHistory = await sql`
    SELECT clan_name, wars_won, wars_lost, total_stars, attack_efficiency
    FROM clan_season_history
    WHERE season = ${season}
    ORDER BY attack_efficiency DESC NULLS LAST
  `;

  // Top 3 players
  const players = await sql`
    SELECT player_name, clan_name, efficiency, defence_efficiency, attacks_used
    FROM player_cwl_stats
    WHERE season = ${season} AND attacks_used > 0
    ORDER BY efficiency DESC, stars_earned DESC
    LIMIT 3
  `;

  const totalStars = clanHistory.reduce((s, r) => s + (r.total_stars || 0), 0);
  const totalWins = clanHistory.reduce((s, r) => s + (r.wars_won || 0), 0);
  const totalLosses = clanHistory.reduce((s, r) => s + (r.wars_lost || 0), 0);

  const clanFields = clanHistory.map(c => ({
    name: c.clan_name.split(" ")[0],
    value: `${c.wars_won}W ${c.wars_lost}L · ${parseFloat(c.attack_efficiency || 0).toFixed(2)} EFF`,
    inline: true,
  }));

  const playerFields = players.map((p, i) => ({
    name: ["🥇", "🥈", "🥉"][i] + " " + p.player_name,
    value: `${parseFloat(p.efficiency || 0).toFixed(2)} EFF · ${p.clan_name.split(" ")[0]}`,
    inline: false,
  }));

  return {
    username: "Cognition {CGN}",
    avatar_url: CGN_AVATAR,
    ...(rolePing ? { content: rolePing } : {}),
    embeds: [{
      title: `📊 ${season} — CGN Alliance Season Recap`,
      color: 0xa78bfa,
      fields: [
        { name: "⭐ Alliance Stars", value: String(totalStars), inline: true },
        { name: "⚔️ Alliance Record", value: `${totalWins}W ${totalLosses}L`, inline: true },
        { name: "\u200b", value: "\u200b", inline: true },
        ...clanFields,
        ...playerFields,
      ],
      footer: { text: "cgnco.vercel.app · Full image card available in Admin → Announcements" },
      timestamp: new Date().toISOString(),
    }],
  };
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const pending = await getPendingScheduled();
  if (pending.length === 0) return NextResponse.json({ fired: 0 });

  const sql = getDb();
  let fired = 0;
  const errors = [];

  for (const item of pending) {
    try {
      let payload;

      if (item.is_recap_image) {
        // ── Recap image entry — dynamically fetch latest completed season ──
        payload = await buildRecapPayload(sql, item.role_ping);
        if (!payload) {
          errors.push({ id: item.id, error: "No completed season found" });
          continue;
        }
      } else {
        // ── Standard embed entry — existing logic unchanged ──
        const embed = typeof item.embed_json === "string"
          ? JSON.parse(item.embed_json)
          : item.embed_json;

        const { _button, ...cleanEmbed } = embed;

        payload = {
          embeds: [cleanEmbed],
          ...(item.content && { content: item.content }),
          ...(item.username && { username: item.username }),
          ...(item.avatar_url && { avatar_url: item.avatar_url }),
        };

        if (_button?.label && _button?.url) {
          payload.components = [{
            type: 1,
            components: [{ type: 2, style: 5, label: _button.label, url: _button.url }],
          }];
        }
      }

      const scheduledUrl = new URL(item.webhook_url);
      if (payload.components?.length) scheduledUrl.searchParams.set("with_components", "true");
      scheduledUrl.searchParams.set("wait", "true");

      const discordRes = await fetch(scheduledUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (discordRes.ok) {
        await markScheduledSent(item.id);
        if (!item.is_recap_image) {
          const embed = typeof item.embed_json === "string" ? JSON.parse(item.embed_json) : item.embed_json;
          await logAnnouncement(item.webhook_id, item.title, embed, "scheduled");
        }
        fired++;

        // Handle recurrence
        if (item.recurrence) {
          let nextSendAt;
          if (item.recurrence === "monthly") {
            // Calendar month advance — always picks correct next month
            nextSendAt = nextMonthlyDate(item.send_at);
          } else if (INTERVALS[item.recurrence]) {
            nextSendAt = new Date(new Date(item.send_at).getTime() + INTERVALS[item.recurrence]);
          }

          if (nextSendAt) {
            const withinEnd = !item.recurrence_end || nextSendAt <= new Date(item.recurrence_end);
            if (withinEnd) {
              await scheduleAnnouncement({
                webhookId: item.webhook_id,
                embedJson: item.is_recap_image ? { title: "Season Recap" } : (typeof item.embed_json === "string" ? JSON.parse(item.embed_json) : item.embed_json),
                content: item.content,
                username: item.username,
                avatarUrl: item.avatar_url,
                sendAt: nextSendAt.toISOString(),
                createdBy: item.created_by,
                title: item.title,
                recurrence: item.recurrence,
                recurrenceEnd: item.recurrence_end || null,
                isRecapImage: item.is_recap_image || false,
                rolePing: item.role_ping || null,
              });
            }
          }
        }
      } else {
        const err = await discordRes.text();
        errors.push({ id: item.id, error: err });
      }
    } catch (e) {
      errors.push({ id: item.id, error: e.message });
    }
  }

  return NextResponse.json({ fired, errors: errors.length > 0 ? errors : undefined });
}
