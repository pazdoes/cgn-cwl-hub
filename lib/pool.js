import { getDb } from "@/lib/db";

// ── existing helpers ──────────────────────────────────────────────────────────

export async function upsertAccount(playerTag, playerName, ownerSecret, townHallLevel = null) {
  const sql = getDb();
  if (townHallLevel !== null) {
    await sql`
      INSERT INTO accounts (player_tag, player_name, owner_secret, town_hall_level)
      VALUES (${playerTag}, ${playerName}, ${ownerSecret}, ${townHallLevel})
      ON CONFLICT (player_tag)
      DO UPDATE SET
        player_name = EXCLUDED.player_name,
        owner_secret = EXCLUDED.owner_secret,
        town_hall_level = EXCLUDED.town_hall_level
    `;
  } else {
    await sql`
      INSERT INTO accounts (player_tag, player_name, owner_secret)
      VALUES (${playerTag}, ${playerName}, ${ownerSecret})
      ON CONFLICT (player_tag)
      DO UPDATE SET
        player_name = EXCLUDED.player_name,
        owner_secret = EXCLUDED.owner_secret
    `;
  }
}

export async function updateTownHallLevels(thLevels) {
  const sql = getDb();
  for (const [playerTag, level] of Object.entries(thLevels)) {
    if (level === null || level === undefined) continue;
    await sql`
      UPDATE accounts SET town_hall_level = ${level}
      WHERE player_tag = ${playerTag}
    `;
  }
}

export async function joinPool(playerTag, season) {
  const sql = getDb();
  await sql`
    INSERT INTO pool_entries (player_tag, season)
    VALUES (${playerTag}, ${season})
    ON CONFLICT (player_tag, season) DO NOTHING
  `;
}

export async function getAccountsByOwner(ownerSecret) {
  const sql = getDb();
  return sql`
    SELECT player_tag, player_name, verified_at, display_order, town_hall_level
    FROM accounts
    WHERE owner_secret = ${ownerSecret}
    ORDER BY display_order ASC NULLS LAST, town_hall_level DESC NULLS LAST, verified_at DESC
  `;
}

export async function getAccountOwner(playerTag) {
  const sql = getDb();
  const rows = await sql`SELECT owner_secret FROM accounts WHERE player_tag = ${playerTag}`;
  return rows[0]?.owner_secret ?? null;
}

export async function isInPool(playerTag, season) {
  const sql = getDb();
  const rows = await sql`
    SELECT 1 FROM pool_entries
    WHERE player_tag = ${playerTag} AND season = ${season}
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function unlinkAccount(playerTag) {
  const sql = getDb();
  await sql`
    UPDATE accounts
    SET owner_secret = NULL
    WHERE player_tag = ${playerTag}
  `;
}

export async function getOwnerSecretByDiscordId(discordId) {
  const sql = getDb();
  const rows = await sql`
    SELECT DISTINCT owner_secret
    FROM accounts
    WHERE discord_id = ${discordId}
      AND owner_secret IS NOT NULL
    LIMIT 1
  `;
  return rows[0]?.owner_secret ?? null;
}

export async function linkDiscordId(ownerSecret, discordId) {
  const sql = getDb();
  await sql`
    UPDATE accounts
    SET discord_id = ${discordId}
    WHERE owner_secret = ${ownerSecret}
  `;
}

export async function updateAccountOrder(ownerSecret, orderedTags) {
  const sql = getDb();
  for (let i = 0; i < orderedTags.length; i++) {
    await sql`
      UPDATE accounts
      SET display_order = ${i}
      WHERE player_tag = ${orderedTags[i]} AND owner_secret = ${ownerSecret}
    `;
  }
}

export async function getPoolEntries(season) {
  const sql = getDb();
  return sql`
    SELECT
      pe.player_tag,
      pe.season,
      pe.assigned_at,
      pe.assigned_clan,
      pe.status,
      a.player_name,
      a.town_hall_level
    FROM pool_entries pe
    JOIN accounts a ON a.player_tag = pe.player_tag
    WHERE pe.season = ${season}
    ORDER BY pe.assigned_clan NULLS FIRST, a.player_name ASC
  `;
}

export async function markAssigned(playerTag, season, clan) {
  const sql = getDb();
  await sql`
    UPDATE pool_entries
    SET assigned_at = NOW(), assigned_clan = ${clan ?? null}
    WHERE player_tag = ${playerTag} AND season = ${season}
  `;
}

export async function clearAssignment(playerTag, season) {
  const sql = getDb();
  await sql`
    UPDATE pool_entries
    SET assigned_at = NULL, assigned_clan = NULL, status = NULL
    WHERE player_tag = ${playerTag} AND season = ${season}
  `;
}

export async function getAssignedClan(playerTag, season) {
  const sql = getDb();
  const rows = await sql`
    SELECT assigned_clan FROM pool_entries
    WHERE player_tag = ${playerTag} AND season = ${season}
  `;
  return rows[0]?.assigned_clan ?? null;
}

export async function countConfirmed(clan, season) {
  const sql = getDb();
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM pool_entries
    WHERE assigned_clan = ${clan} AND season = ${season} AND status = 'confirmed'
  `;
  return rows[0]?.count ?? 0;
}

export async function setStatus(playerTag, season, status) {
  const sql = getDb();
  await sql`
    UPDATE pool_entries
    SET status = ${status}
    WHERE player_tag = ${playerTag} AND season = ${season}
  `;
}

export async function leavePool(playerTag, season) {
  const sql = getDb();
  await sql`
    DELETE FROM pool_entries
    WHERE player_tag = ${playerTag} AND season = ${season}
  `;
}

export async function getClanFormat(clanName) {
  const sql = getDb();
  const rows = await sql`
    SELECT cwl_format FROM clans WHERE clan_name = ${clanName}
  `;
  return rows[0]?.cwl_format ?? 15;
}

export async function getAllClanFormats() {
  const sql = getDb();
  const rows = await sql`SELECT clan_name, cwl_format FROM clans`;
  return Object.fromEntries(rows.map(r => [r.clan_name, r.cwl_format]));
}

export async function setClanFormat(clanName, format) {
  const sql = getDb();
  await sql`
    INSERT INTO clans (clan_name, cwl_format)
    VALUES (${clanName}, ${format})
    ON CONFLICT (clan_name)
    DO UPDATE SET cwl_format = EXCLUDED.cwl_format, updated_at = NOW()
  `;
}

export async function getAllClanNames() {
  const sql = getDb();
  const rows = await sql`
    SELECT clan_name FROM clans
    ORDER BY display_order ASC NULLS LAST, clan_name ASC
  `;
  return rows.map(r => r.clan_name);
}

export async function updateClanOrder(orderedNames) {
  const sql = getDb();
  for (let i = 0; i < orderedNames.length; i++) {
    await sql`
      UPDATE clans SET display_order = ${i}
      WHERE clan_name = ${orderedNames[i]}
    `;
  }
}

export async function createClan(clanName, { clanTag, clanLink, cwlRank } = {}) {
  const sql = getDb();
  await sql`
    INSERT INTO clans (clan_name, cwl_format, clan_tag, clan_link, cwl_rank)
    VALUES (${clanName}, 15, ${clanTag ?? null}, ${clanLink ?? null}, ${cwlRank ?? null})
  `;
}

export async function getClanFallbackData(clanName) {
  const sql = getDb();
  const rows = await sql`
    SELECT clan_tag, clan_link, cwl_rank, cwl_format FROM clans WHERE clan_name = ${clanName}
  `;
  return rows[0] ?? { clan_tag: null, clan_link: null, cwl_rank: null, cwl_format: null };
}

export async function countAssignedToClanAnySeason(clanName) {
  const sql = getDb();
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM pool_entries
    WHERE assigned_clan = ${clanName}
  `;
  return rows[0]?.count ?? 0;
}

export async function deleteClan(clanName) {
  const sql = getDb();
  await sql`DELETE FROM clans WHERE clan_name = ${clanName}`;
}

export async function recordSeasonHistory(season, clanRanks) {
  const sql = getDb();
  for (const { clanName, cwlRank } of clanRanks) {
    if (!clanName || !cwlRank) continue;
    await sql`
      INSERT INTO clan_season_history (clan_name, season, cwl_rank)
      VALUES (${clanName}, ${season}, ${cwlRank})
      ON CONFLICT (clan_name, season)
      DO UPDATE SET cwl_rank = EXCLUDED.cwl_rank, recorded_at = now()
    `;
  }
}

export async function getClanSeasonHistory() {
  const sql = getDb();
  return sql`
    SELECT clan_name, season, cwl_rank, recorded_at
    FROM clan_season_history
    ORDER BY clan_name ASC, recorded_at ASC
  `;
}

// ── Item 33: Discord announcements ───────────────────────────────────────────

export async function getWebhooks() {
  const sql = getDb();
  return sql`SELECT * FROM discord_webhooks ORDER BY created_at ASC`;
}

export async function addWebhook(label, webhookUrl, channel) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO discord_webhooks (label, webhook_url, channel)
    VALUES (${label}, ${webhookUrl}, ${channel || null})
    RETURNING *
  `;
  return rows[0];
}

export async function deleteWebhook(id) {
  const sql = getDb();
  await sql`DELETE FROM discord_webhooks WHERE id = ${id}`;
}

export async function logAnnouncement(webhookId, title, embedJson, sentBy) {
  const sql = getDb();
  await sql`
    INSERT INTO announcement_history (webhook_id, title, embed_json, sent_by)
    VALUES (${webhookId}, ${title || null}, ${JSON.stringify(embedJson)}, ${sentBy || null})
  `;
}

export async function getAnnouncementHistory() {
  const sql = getDb();
  return sql`
    SELECT
      ah.id, ah.title, ah.sent_at, ah.sent_by,
      dw.label AS webhook_label, dw.channel
    FROM announcement_history ah
    LEFT JOIN discord_webhooks dw ON dw.id = ah.webhook_id
    ORDER BY ah.sent_at DESC
    LIMIT 20
  `;
}

// ── Item 34: Saved announcement templates ────────────────────────────────────

export async function getAnnouncementTemplates() {
  const sql = getDb();
  return sql`
    SELECT at.*, dw.label AS webhook_label
    FROM announcement_templates at
    LEFT JOIN discord_webhooks dw ON dw.id = at.webhook_id
    ORDER BY at.created_at DESC
  `;
}

export async function saveAnnouncementTemplate({ name, webhookId, embedJson, username, avatarUrl }) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO announcement_templates (name, webhook_id, embed_json, username, avatar_url)
    VALUES (${name}, ${webhookId || null}, ${JSON.stringify(embedJson)}, ${username || null}, ${avatarUrl || null})
    RETURNING *
  `;
  return rows[0];
}

export async function deleteAnnouncementTemplate(id) {
  const sql = getDb();
  await sql`DELETE FROM announcement_templates WHERE id = ${id}`;
}

// ── Item 34: Scheduled announcements ─────────────────────────────────────────

export async function scheduleAnnouncement({ webhookId, embedJson, content, username, avatarUrl, sendAt, createdBy, title, recurrence, recurrenceEnd }) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO scheduled_announcements
      (webhook_id, title, embed_json, content, username, avatar_url, send_at, created_by, recurrence, recurrence_end)
    VALUES (
      ${webhookId},
      ${title || null},
      ${JSON.stringify(embedJson)},
      ${content || null},
      ${username || null},
      ${avatarUrl || null},
      ${sendAt},
      ${createdBy || null},
      ${recurrence || null},
      ${recurrenceEnd || null}
    )
    RETURNING *
  `;
  return rows[0];
}

export async function getPendingScheduled() {
  const sql = getDb();
  return sql`
    SELECT sa.*, dw.webhook_url, dw.label AS webhook_label
    FROM scheduled_announcements sa
    JOIN discord_webhooks dw ON dw.id = sa.webhook_id
    WHERE sa.sent = false AND sa.send_at <= now()
    ORDER BY sa.send_at ASC
  `;
}

export async function getScheduledAnnouncements() {
  const sql = getDb();
  return sql`
    SELECT sa.*, dw.label AS webhook_label
    FROM scheduled_announcements sa
    LEFT JOIN discord_webhooks dw ON dw.id = sa.webhook_id
    ORDER BY sa.send_at DESC
    LIMIT 30
  `;
}

export async function markScheduledSent(id) {
  const sql = getDb();
  await sql`
    UPDATE scheduled_announcements
    SET sent = true, sent_at = now()
    WHERE id = ${id}
  `;
}

export async function cancelScheduled(id) {
  const sql = getDb();
  await sql`DELETE FROM scheduled_announcements WHERE id = ${id} AND sent = false`;
}
