import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Fetches channels and roles from Discord API using bot token,
// syncs to DB cache, returns combined data including emojis from DB
export async function GET(request) {
  const sql = getDb();
  const guildId = process.env.DISCORD_GUILD_ID;
  const token = process.env.DISCORD_BOT_TOKEN;

  // If bot is configured, fetch live from Discord and sync to DB
  if (guildId && token) {
    try {
      const [channelsRes, rolesRes] = await Promise.all([
        fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
          headers: { Authorization: `Bot ${token}` },
        }),
        fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
          headers: { Authorization: `Bot ${token}` },
        }),
      ]);

      // Surface Discord errors for debugging
      if (!channelsRes.ok || !rolesRes.ok) {
        const chErr = !channelsRes.ok ? await channelsRes.text() : "ok";
        const roErr = !rolesRes.ok ? await rolesRes.text() : "ok";
        console.error("Discord API error — channels:", channelsRes.status, chErr, "roles:", rolesRes.status, roErr);
        // Return error details so we can diagnose
        const [dbRoles, dbChannels, dbEmojis] = await Promise.all([
          sql`SELECT id, name, colour FROM discord_roles ORDER BY name`,
          sql`SELECT id, name FROM discord_channels ORDER BY name`,
          sql`SELECT id, name FROM discord_emojis ORDER BY name`,
        ]);
        return NextResponse.json({
          roles: dbRoles, channels: dbChannels, emojis: dbEmojis,
          _debug: { channelsStatus: channelsRes.status, channelsError: chErr, rolesStatus: rolesRes.status, rolesError: roErr, guildIdUsed: guildId, guildIdLength: guildId?.length }
        });
      }

      if (channelsRes.ok && rolesRes.ok) {
        const rawChannels = await channelsRes.json();
        const rawRoles = await rolesRes.json();

        // Text and announcement channels only, sorted by position
        const channels = rawChannels
          .filter(c => c.type === 0 || c.type === 5)
          .sort((a, b) => (a.position || 0) - (b.position || 0))
          .map(c => ({ id: c.id, name: c.name }));

        // All roles except @everyone, sorted by position descending
        const roles = rawRoles
          .filter(r => r.name !== "@everyone")
          .sort((a, b) => (b.position || 0) - (a.position || 0))
          .map(r => ({
            id: r.id,
            name: r.name,
            colour: r.color ? `#${r.color.toString(16).padStart(6, "0")}` : "#a78bfa",
          }));

        // Sync channels to DB
        for (const c of channels) {
          await sql`
            INSERT INTO discord_channels (id, name)
            VALUES (${c.id}, ${c.name})
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
          `;
        }

        // Sync roles to DB
        for (const r of roles) {
          await sql`
            INSERT INTO discord_roles (id, name, colour)
            VALUES (${r.id}, ${r.name}, ${r.colour})
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, colour = EXCLUDED.colour
          `;
        }

        // Still fetch emojis from DB only (not in bot scope)
        const emojis = await sql`SELECT id, name FROM discord_emojis ORDER BY name`;

        return NextResponse.json({ channels, roles, emojis });
      }
    } catch (e) {
      console.error("Discord meta sync error:", e);
      // Fall through to DB cache
    }
  }

  // Fallback — return cached DB data
  const [roles, channels, emojis] = await Promise.all([
    sql`SELECT id, name, colour FROM discord_roles ORDER BY name`,
    sql`SELECT id, name FROM discord_channels ORDER BY name`,
    sql`SELECT id, name FROM discord_emojis ORDER BY name`,
  ]);
  return NextResponse.json({ roles, channels, emojis });
}

function checkPin(request) {
  return request.headers.get("x-officer-pin") === process.env.OFFICER_PIN;
}

export async function POST(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { type, id, name, colour } = await request.json();
  const sql = getDb();
  if (type === "role") {
    await sql`INSERT INTO discord_roles (id, name, colour) VALUES (${id}, ${name}, ${colour||'#a78bfa'}) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, colour=EXCLUDED.colour`;
  } else if (type === "channel") {
    await sql`INSERT INTO discord_channels (id, name) VALUES (${id}, ${name}) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name`;
  } else if (type === "emoji") {
    await sql`INSERT INTO discord_emojis (id, name) VALUES (${id}, ${name}) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name`;
  }
  return NextResponse.json({ ok: true });
}
