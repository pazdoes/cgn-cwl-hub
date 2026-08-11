import { getDb } from "@/lib/db";

// ── existing helpers ──────────────────────────────────────────────────────────

export async function setApiTokenVerified(playerTag) {
  const sql = getDb();
  await sql`UPDATE accounts SET api_token_verified = TRUE WHERE player_tag = ${playerTag}`;
}

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
    DELETE FROM accounts
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
      pe.cwl_intent,
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

export async function getAllClanAbsent() {
  const sql = getDb();
  const rows = await sql`SELECT clan_name, cwl_absent FROM clans`;
  return Object.fromEntries(rows.map(r => [r.clan_name, r.cwl_absent || false]));
}

export async function getAllClanPublished() {
  const sql = getDb();
  const rows = await sql`SELECT clan_name, roster_published FROM clans`;
  return Object.fromEntries(rows.map(r => [r.clan_name, r.roster_published === true]));
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

export async function updateClanSeasonStats(season, clanStatsMap) {
  const sql = getDb();
  for (const [clanName, cs] of Object.entries(clanStatsMap)) {
    const attacksUsed = cs.totalAttacksUsed || 0;
    const attacksAvail = cs.totalAttacksAvailable || 0;
    // Fix 4: attack efficiency uses attack-only stars (no bonus)
    const attackStars = cs.totalAttackStars ?? cs.totalStars ?? 0;
    const atkEff = attacksUsed > 0 ? parseFloat((attackStars / attacksUsed).toFixed(2)) : null;
    // Fix 6: defence efficiency uses API stars conceded (includes opponent bonus)
    const starsConceded = cs.totalStarsConcededFromWars ?? cs.totalStarsConceded ?? 0;
    const defEff = attacksAvail > 0 ? parseFloat((starsConceded / attacksAvail).toFixed(2)) : null;
    const cappedThreeStars = Math.min(cs.threeStars || 0, cs.totalAttacksForRate || 0);
    const rawThreeStarRate = cs.totalAttacksForRate > 0 ? (cappedThreeStars / cs.totalAttacksForRate) * 100 : null;
    const threeStarRate = rawThreeStarRate !== null ? parseFloat(Math.min(rawThreeStarRate, 100).toFixed(2)) : null;
    // Fix 2+3: destruction % weighted by teamSize per war
    const avgDest = cs.destTotalBases > 0 ? parseFloat((cs.destWeightedSum / cs.destTotalBases).toFixed(2)) : null;
    const avgDef = cs.defTotalBases > 0 ? parseFloat((cs.defWeightedSum / cs.defTotalBases).toFixed(2)) : null;
    await sql`
      UPDATE clan_season_history SET
        clan_tag               = ${cs.clanTag ?? null},
        wars_won               = ${cs.warsWon},
        wars_lost              = ${cs.warsLost},
        wars_drawn             = ${cs.warsDrawn},
        total_stars            = ${cs.totalStars},
        total_stars_conceded   = ${cs.totalStarsConcededFromWars ?? cs.totalStarsConceded},
        total_attacks_used     = ${cs.totalAttacksUsed},
        total_attacks_available = ${cs.totalAttacksAvailable},
        total_attacks_missed   = ${cs.totalAttacksMissed},
        avg_destruction_pct    = ${avgDest},
        avg_defence_pct        = ${avgDef},
        attack_efficiency      = ${atkEff},
        defence_efficiency     = ${defEff},
        three_star_rate        = ${threeStarRate},
        three_stars_clan      = ${cs.threeStars},
        two_stars_clan        = ${cs.twoStars},
        one_stars_clan        = ${cs.oneStars},
        zero_stars_clan       = ${cs.zeroStars}
      WHERE clan_name = ${clanName} AND season = ${season}
    `;
  }
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
    SELECT clan_tag, clan_link, cwl_rank, cwl_format, cwl_absent FROM clans WHERE clan_name = ${clanName}
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
    const clanRows = await sql`SELECT clan_tag FROM clans WHERE clan_name = ${clanName} LIMIT 1`;
    const clanTag = clanRows[0]?.clan_tag || null;
    await sql`
      INSERT INTO clan_season_history (clan_name, clan_tag, season, cwl_rank)
      VALUES (${clanName}, ${clanTag}, ${season}, ${cwlRank})
      ON CONFLICT (clan_name, season)
      DO UPDATE SET cwl_rank = EXCLUDED.cwl_rank, clan_tag = EXCLUDED.clan_tag, recorded_at = now()
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

export async function logAnnouncement(webhookId, title, embedJson, sentBy, discordMessageId = null) {
  const sql = getDb();
  await sql`
    INSERT INTO announcement_history (webhook_id, title, embed_json, sent_by, discord_message_id)
    VALUES (${webhookId}, ${title || null}, ${JSON.stringify(embedJson)}, ${sentBy || null}, ${discordMessageId || null})
  `;
}

export async function getAnnouncementHistory() {
  const sql = getDb();
  return sql`
    SELECT
      ah.id, ah.title, ah.sent_at, ah.sent_by, ah.discord_message_id, ah.embed_json,
      dw.label AS webhook_label, dw.channel, dw.webhook_url, dw.id AS webhook_id
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

export async function updateAnnouncementTemplate(id, { name, webhookId, embedJson, username, avatarUrl }) {
  const sql = getDb();
  const rows = await sql`
    UPDATE announcement_templates
    SET name = ${name}, webhook_id = ${webhookId || null}, embed_json = ${JSON.stringify(embedJson)},
        username = ${username || null}, avatar_url = ${avatarUrl || null}
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0];
}

export async function saveAnnouncementTemplate({ name, webhookId, embedJson, username, avatarUrl }) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO announcement_templates (name, webhook_id, embed_json, username, avatar_url)
    VALUES (${name}, ${webhookId || null}, ${embedJson}, ${username || null}, ${avatarUrl || null})
    RETURNING *
  `;
  return rows[0];
}

export async function deleteAnnouncementTemplate(id) {
  const sql = getDb();
  await sql`DELETE FROM announcement_templates WHERE id = ${id}`;
}

export async function recordTemplateUsage(id) {
  const sql = getDb();
  await sql`
    UPDATE announcement_templates
    SET use_count = use_count + 1, last_used_at = now()
    WHERE id = ${id}
  `;
}

// ── Item 34: Scheduled announcements ─────────────────────────────────────────

export async function scheduleAnnouncement({ webhookId, embedJson, content, username, avatarUrl, sendAt, createdBy, title, recurrence, recurrenceEnd, isRecapImage, rolePing }) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO scheduled_announcements
      (webhook_id, title, embed_json, content, username, avatar_url, send_at, created_by, recurrence, recurrence_end, is_recap_image, role_ping)
    VALUES (
      ${webhookId},
      ${title || null},
      ${embedJson || null},
      ${content || null},
      ${username || null},
      ${avatarUrl || null},
      ${sendAt},
      ${createdBy || null},
      ${recurrence || null},
      ${recurrenceEnd || null},
      ${isRecapImage || false},
      ${rolePing || null}
    )
    RETURNING *
  `;
  return rows[0];
}

// Get latest completed season (not the currently open one)
export async function getLatestCompletedSeason() {
  const sql = getDb();
  const [row] = await sql`
    SELECT season FROM seasons
    WHERE is_open = false
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return row?.season || null;
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

// ── Item 35: Player CWL stats ─────────────────────────────────────────────────

export async function upsertPlayerCwlStats(stats) {
  const sql = getDb();
  for (const s of stats) {
    await sql`
      INSERT INTO player_cwl_stats
        (player_tag, player_name, season, clan_name,
         stars_earned, destruction_pct, stars_conceded, defence_pct,
         attacks_used, attacks_available, missed_attacks, efficiency,
         three_stars, two_stars, one_stars, zero_stars,
         three_stars_conceded, two_stars_conceded, one_stars_conceded, zero_stars_conceded,
         defence_efficiency, town_hall_level, avg_stars_per_attack, three_star_rate)
      VALUES (
        ${s.playerTag}, ${s.playerName}, ${s.season}, ${s.clanName},
        ${s.starsEarned}, ${s.destructionPct}, ${s.starsConceded}, ${s.defencePct},
        ${s.attacksUsed}, ${s.attacksAvailable}, ${s.missedAttacks}, ${s.efficiency},
        ${s.threeStars ?? null}, ${s.twoStars ?? null}, ${s.oneStars ?? null}, ${s.zeroStars ?? null},
        ${s.threeStarsConceded ?? null}, ${s.twoStarsConceded ?? null}, ${s.oneStarsConceded ?? null}, ${s.zeroStarsConceded ?? null},
        ${s.defenceEfficiency ?? null}, ${s.townHallLevel ?? null},
        ${s.avgStarsPerAttack ?? null}, ${s.threeStarRate ?? null}
      )
      ON CONFLICT (player_tag, season)
      DO UPDATE SET
        player_name      = EXCLUDED.player_name,
        clan_name        = EXCLUDED.clan_name,
        stars_earned     = EXCLUDED.stars_earned,
        destruction_pct  = EXCLUDED.destruction_pct,
        stars_conceded   = EXCLUDED.stars_conceded,
        defence_pct      = EXCLUDED.defence_pct,
        attacks_used     = EXCLUDED.attacks_used,
        attacks_available= EXCLUDED.attacks_available,
        missed_attacks   = EXCLUDED.missed_attacks,
        efficiency       = EXCLUDED.efficiency,
        three_stars      = EXCLUDED.three_stars,
        two_stars        = EXCLUDED.two_stars,
        one_stars        = EXCLUDED.one_stars,
        zero_stars             = EXCLUDED.zero_stars,
        three_stars_conceded   = EXCLUDED.three_stars_conceded,
        two_stars_conceded     = EXCLUDED.two_stars_conceded,
        one_stars_conceded     = EXCLUDED.one_stars_conceded,
        zero_stars_conceded    = EXCLUDED.zero_stars_conceded,
        defence_efficiency     = EXCLUDED.defence_efficiency,
        town_hall_level        = EXCLUDED.town_hall_level,
        avg_stars_per_attack   = EXCLUDED.avg_stars_per_attack,
        three_star_rate        = EXCLUDED.three_star_rate,
        recorded_at            = now()
    `;
  }
}

export async function updatePositionStats(season) {
  const sql = getDb();
  // Calculate punch_up_rate, dips, reaches, avg_target_position, avg_target_distance
  // from war_attacks for all players in a season
  const stats = await sql`
    SELECT
      player_tag,
      COUNT(*) FILTER (WHERE defender_map_position < attacker_map_position) as dips,
      COUNT(*) FILTER (WHERE defender_map_position > attacker_map_position) as reaches,
      COUNT(*) as total_attacks,
      AVG(defender_map_position) as avg_target_position,
      AVG(ABS(defender_map_position - attacker_map_position)) as avg_target_distance
    FROM war_attacks
    WHERE season = ${season}
      AND attacker_map_position IS NOT NULL
      AND defender_map_position IS NOT NULL
    GROUP BY player_tag
  `;

  for (const s of stats) {
    const punchUpRate = s.total_attacks > 0
      ? parseFloat(((s.reaches / s.total_attacks) * 100).toFixed(2))
      : null;

    await sql`
      UPDATE player_cwl_stats SET
        punch_up_rate        = ${punchUpRate},
        dips                 = ${parseInt(s.dips) || 0},
        reaches              = ${parseInt(s.reaches) || 0},
        avg_target_position  = ${s.avg_target_position ? parseFloat(parseFloat(s.avg_target_position).toFixed(2)) : null},
        avg_target_distance  = ${s.avg_target_distance ? parseFloat(parseFloat(s.avg_target_distance).toFixed(2)) : null}
      WHERE player_tag = ${s.player_tag}
        AND season = ${season}
    `;
  }
  return stats.length;
}

export async function getSeasonWarDefencesByPlayer(season, clanName) {
  const sql = getDb();
  return sql`
    SELECT player_tag, player_name, town_hall_level, war_tag,
           stars_conceded, destruction_pct
    FROM war_defences
    WHERE season = ${season}
      AND clan_name = ${clanName}
  `;
}

export async function getPlayerCwlStats(season) {
  const sql = getDb();
  return sql`
    SELECT * FROM player_cwl_stats
    WHERE season = ${season}
    ORDER BY stars_earned DESC, destruction_pct DESC
  `;
}

export async function getPlayerCwlSeasons() {
  const sql = getDb();
  const rows = await sql`
    SELECT DISTINCT season FROM player_cwl_stats
    ORDER BY season DESC
  `;
  return rows.map(r => r.season);
}

// ── Roster history ────────────────────────────────────────────────────────────

export async function snapshotRoster(season) {
  const sql = getDb();
  // Fetch all assigned players for the closing season
  const assigned = await sql`
    SELECT
      pe.player_tag,
      pe.player_name,
      pe.assigned_clan,
      pe.status,
      pe.town_hall_level
    FROM pool_entries pe
    WHERE pe.season = ${season}
      AND pe.assigned_clan IS NOT NULL
  `;
  if (assigned.length === 0) return 0;

  for (const row of assigned) {
    await sql`
      INSERT INTO roster_history
        (season, player_tag, player_name, clan_name, town_hall_level, status)
      VALUES (
        ${season},
        ${row.player_tag},
        ${row.player_name},
        ${row.assigned_clan},
        ${row.town_hall_level || null},
        ${row.status || null}
      )
      ON CONFLICT (player_tag, season)
      DO UPDATE SET
        player_name     = EXCLUDED.player_name,
        clan_name       = EXCLUDED.clan_name,
        town_hall_level = EXCLUDED.town_hall_level,
        status          = EXCLUDED.status,
        recorded_at     = now()
    `;
  }
  return assigned.length;
}

export async function getRosterHistory(season) {
  const sql = getDb();
  return sql`
    SELECT * FROM roster_history
    WHERE season = ${season}
    ORDER BY clan_name, player_name
  `;
}

export async function getRosterSeasons() {
  const sql = getDb();
  const rows = await sql`
    SELECT DISTINCT season FROM roster_history
    ORDER BY season DESC
  `;
  return rows.map(r => r.season);
}

// ─── Per-War Attack Capture ───────────────────────────────────────────────────

/**
 * Upsert individual attack rows for a completed war.
 * Uses ON CONFLICT DO NOTHING — fully idempotent.
 */
export async function upsertWarAttacks(attacks) {
  if (!attacks?.length) return;
  const sql = getDb();
  for (const a of attacks) {
    await sql`
      INSERT INTO war_attacks (
        season, clan_name, war_tag, war_day,
        player_tag, player_name, town_hall_level,
        attack_order, defender_tag, defender_th_level,
        stars, true_stars, destruction_pct,
        attacker_map_position, defender_map_position,
        war_result, opponent_clan, clan_tag
      ) VALUES (
        ${a.season}, ${a.clanName}, ${a.warTag}, ${a.warDay},
        ${a.playerTag}, ${a.playerName}, ${a.townHallLevel ?? null},
        ${a.attackOrder}, ${a.defenderTag ?? null}, ${a.defenderThLevel ?? null},
        ${a.stars}, ${a.trueStars ?? null}, ${a.destructionPct},
        ${a.attackerMapPosition ?? null}, ${a.defenderMapPosition ?? null},
        ${a.warResult ?? null}, ${a.opponentClan ?? null}, ${a.clanTag ?? null}
      )
      ON CONFLICT (war_tag, player_tag, attack_order) DO NOTHING
    `;
  }
}

/**
 * Upsert a war day summary row for a clan.
 * Uses ON CONFLICT DO NOTHING — fully idempotent.
 */
export async function upsertWarDefences(defences) {
  if (!defences?.length) return;
  const sql = getDb();
  for (const d of defences) {
    await sql`
      INSERT INTO war_defences (
        season, clan_name, war_tag, war_day,
        player_tag, player_name, town_hall_level,
        stars_conceded, destruction_pct,
        war_result, opponent_clan, clan_tag
      ) VALUES (
        ${d.season}, ${d.clanName}, ${d.warTag}, ${d.warDay},
        ${d.playerTag}, ${d.playerName ?? null}, ${d.townHallLevel ?? null},
        ${d.starsConceded}, ${d.destructionPct ?? 0},
        ${d.warResult ?? null}, ${d.opponentClan ?? null}, ${d.clanTag ?? null}
      )
      ON CONFLICT (war_tag, player_tag) DO NOTHING
    `;
  }
}

export async function upsertWarDay(warDay) {
  const sql = getDb();
  await sql`
    INSERT INTO war_days (
      season, clan_name, war_tag, war_day,
      stars_earned, stars_conceded,
      attacks_used, attacks_available,
      destruction_pct, defence_pct,
      war_result, opponent_clan, clan_tag
    ) VALUES (
      ${warDay.season}, ${warDay.clanName}, ${warDay.warTag}, ${warDay.warDay},
      ${warDay.starsEarned}, ${warDay.starsConceded},
      ${warDay.attacksUsed}, ${warDay.attacksAvailable},
      ${warDay.destructionPct ?? null}, ${warDay.defencePct ?? null},
      ${warDay.warResult ?? null}, ${warDay.opponentClan ?? null}, ${warDay.clanTag ?? null}
    )
    ON CONFLICT (war_tag, clan_name) DO NOTHING
  `;
}

/**
 * Get all captured war tags for a season — used to skip already-processed wars.
 */
export async function getCapturedWarTags(season) {
  const sql = getDb();
  const rows = await sql`
    SELECT DISTINCT war_tag FROM war_days WHERE season = ${season}
  `;
  return new Set(rows.map(r => r.war_tag));
}

// ─── Season War Attacks (for cumulative stats rebuild) ───────────────────────

/**
 * Returns all war attacks for a season grouped by player tag.
 * Used to seed allPlayerStats from already-captured warEnded data.
 */
export async function getSeasonWarAttacksByPlayer(season, clanName) {
  const sql = getDb();
  return sql`
    SELECT
      wa.player_tag, wa.player_name, wa.town_hall_level,
      wa.war_tag, wa.stars, wa.destruction_pct,
      wa.defender_tag,
      wd.stars_conceded as def_stars, wd.defence_pct as def_pct
    FROM war_attacks wa
    LEFT JOIN war_days wd
      ON wd.war_tag = wa.war_tag
      AND wd.clan_name = wa.clan_name
      AND wd.season = wa.season
    WHERE wa.season = ${season}
      AND wa.clan_name = ${clanName}
    ORDER BY wa.war_tag, wa.attack_order
  `;
}

// ─── Player War Attack History ────────────────────────────────────────────────

/**
 * Returns all war attack rows for a player, ordered by season desc, war_day asc.
 */
export async function getPlayerWarAttacks(playerTag) {
  const sql = getDb();
  return sql`
    SELECT
      season, clan_name, war_day, war_tag,
      stars, destruction_pct,
      defender_tag, defender_th_level,
      attacker_map_position, defender_map_position,
      war_result, opponent_clan, attack_order
    FROM war_attacks
    WHERE player_tag = ${playerTag}
    ORDER BY season DESC, war_day ASC
  `;
}

// ─── DB-only stats recompute (bypasses live CoC API) ──────────────────────────
//
// captureCwlData() (lib/cwlCapture.js) is the normal path for populating
// player_cwl_stats / clan_season_history, but it requires a live call to
// getClanWarLeagueGroup() and returns nothing usable once that group has
// expired — which happens routinely once a CWL window closes. This function
// recomputes the same two tables purely from war_attacks / war_defences /
// war_days, for use after a manual backfill when the live API is no longer
// available for that season.
//
// Safety guarantees (do not weaken without explicit sign-off):
//   - attacks_available / missed_attacks are NEVER reduced below whatever is
//     already stored — only GREATEST()'d against newly computed attacks_used.
//     A missed attack that isn't representable in war_attacks (no row exists
//     for an attack that never happened) must never be inferred away.
//   - Win/loss/draw always comes from war_days.war_result, which is correct
//     for every round including manual backfills — never recomputed from
//     stars/destruction here.
//   - Clan-level destruction/defence % is weighted by each clan's cwl_format
//     (team size), computed directly from raw war_attacks/war_defences rows —
//     NOT from war_days.destruction_pct/defence_pct, which is inconsistently
//     divided by attacks made (not team size) for historical rows with missed
//     attacks. See Round 5 Incognito conversation notes.
//   - Every write is idempotent (INSERT ... ON CONFLICT / UPDATE keyed on
//     player_tag+season or clan_name+season) — safe to re-run.
//
// Does not touch captureCwlData(), captureWarAttacks(), or any live-API path.
export async function recomputeCwlStatsFromDb(season) {
  const sql = getDb();
  const errors = [];
  let playersUpdated = 0;
  let clansUpdated = 0;

  // ── Player-level: player_cwl_stats ──────────────────────────────────────
  try {
    const rows = await sql`
      WITH atk AS (
        SELECT
          player_tag,
          MAX(player_name)     AS player_name,
          MAX(clan_name)        AS clan_name,
          MAX(town_hall_level)  AS town_hall_level,
          SUM(stars)                          AS stars_earned,
          ROUND(AVG(destruction_pct), 2)      AS destruction_pct,
          COUNT(*)                            AS attacks_used,
          COUNT(*) FILTER (WHERE stars = 3)   AS three_stars,
          COUNT(*) FILTER (WHERE stars = 2)   AS two_stars,
          COUNT(*) FILTER (WHERE stars = 1)   AS one_stars,
          COUNT(*) FILTER (WHERE stars = 0)   AS zero_stars
        FROM war_attacks
        WHERE season = ${season}
        GROUP BY player_tag
      ),
      def AS (
        SELECT
          player_tag,
          SUM(stars_conceded)                              AS stars_conceded,
          ROUND(AVG(destruction_pct), 2)                    AS defence_pct,
          COUNT(*) FILTER (WHERE stars_conceded = 3)        AS three_stars_conceded,
          COUNT(*) FILTER (WHERE stars_conceded = 2)        AS two_stars_conceded,
          COUNT(*) FILTER (WHERE stars_conceded = 1)        AS one_stars_conceded,
          COUNT(*) FILTER (WHERE stars_conceded = 0)        AS zero_stars_conceded
        FROM war_defences
        WHERE season = ${season}
        GROUP BY player_tag
      ),
      capped AS (
        SELECT
          atk.player_tag, atk.player_name, atk.clan_name, atk.town_hall_level,
          LEAST(atk.stars_earned, 21)   AS stars_earned,
          atk.destruction_pct,
          COALESCE(def.stars_conceded, 0)  AS stars_conceded,
          COALESCE(def.defence_pct, 0)     AS defence_pct,
          LEAST(atk.attacks_used, 7)    AS attacks_used,
          atk.three_stars, atk.two_stars, atk.one_stars, atk.zero_stars,
          COALESCE(def.three_stars_conceded, 0) AS three_stars_conceded,
          COALESCE(def.two_stars_conceded, 0)   AS two_stars_conceded,
          COALESCE(def.one_stars_conceded, 0)   AS one_stars_conceded,
          COALESCE(def.zero_stars_conceded, 0)  AS zero_stars_conceded
        FROM atk
        LEFT JOIN def ON def.player_tag = atk.player_tag
      )
      INSERT INTO player_cwl_stats (
        player_tag, player_name, season, clan_name, town_hall_level,
        stars_earned, destruction_pct, stars_conceded, defence_pct,
        attacks_used, attacks_available, missed_attacks, efficiency,
        three_stars, two_stars, one_stars, zero_stars,
        three_stars_conceded, two_stars_conceded, one_stars_conceded, zero_stars_conceded,
        defence_efficiency, avg_stars_per_attack, three_star_rate
      )
      SELECT
        player_tag, player_name, ${season}, clan_name, town_hall_level,
        stars_earned, destruction_pct, stars_conceded, defence_pct,
        attacks_used,
        attacks_used AS attacks_available,   -- floor; ON CONFLICT below never shrinks this
        0            AS missed_attacks,      -- recomputed correctly in ON CONFLICT below
        CASE WHEN attacks_used > 0 THEN ROUND(stars_earned::numeric / attacks_used, 2) ELSE 0 END,
        three_stars, two_stars, one_stars, zero_stars,
        three_stars_conceded, two_stars_conceded, one_stars_conceded, zero_stars_conceded,
        CASE WHEN attacks_used > 0 THEN ROUND(stars_conceded::numeric / attacks_used, 2) ELSE NULL END,
        CASE WHEN attacks_used > 0 THEN ROUND(stars_earned::numeric / attacks_used, 2) ELSE NULL END,
        CASE WHEN attacks_used > 0 THEN ROUND((three_stars::numeric / attacks_used) * 100, 2) ELSE NULL END
      FROM capped
      ON CONFLICT (player_tag, season) DO UPDATE SET
        player_name          = EXCLUDED.player_name,
        clan_name             = EXCLUDED.clan_name,
        town_hall_level       = COALESCE(EXCLUDED.town_hall_level, player_cwl_stats.town_hall_level),
        stars_earned          = EXCLUDED.stars_earned,
        destruction_pct        = EXCLUDED.destruction_pct,
        stars_conceded         = EXCLUDED.stars_conceded,
        defence_pct            = EXCLUDED.defence_pct,
        attacks_used           = EXCLUDED.attacks_used,
        attacks_available      = GREATEST(player_cwl_stats.attacks_available, EXCLUDED.attacks_used),
        missed_attacks         = GREATEST(0, GREATEST(player_cwl_stats.attacks_available, EXCLUDED.attacks_used) - EXCLUDED.attacks_used),
        efficiency             = EXCLUDED.efficiency,
        three_stars            = EXCLUDED.three_stars,
        two_stars              = EXCLUDED.two_stars,
        one_stars              = EXCLUDED.one_stars,
        zero_stars             = EXCLUDED.zero_stars,
        three_stars_conceded   = EXCLUDED.three_stars_conceded,
        two_stars_conceded     = EXCLUDED.two_stars_conceded,
        one_stars_conceded     = EXCLUDED.one_stars_conceded,
        zero_stars_conceded    = EXCLUDED.zero_stars_conceded,
        defence_efficiency     = CASE WHEN GREATEST(player_cwl_stats.attacks_available, EXCLUDED.attacks_used) > 0
                                    THEN ROUND(EXCLUDED.stars_conceded::numeric / GREATEST(player_cwl_stats.attacks_available, EXCLUDED.attacks_used), 2)
                                    ELSE NULL END,
        avg_stars_per_attack   = EXCLUDED.avg_stars_per_attack,
        three_star_rate        = EXCLUDED.three_star_rate,
        recorded_at            = now()
      RETURNING player_tag
    `;
    playersUpdated = rows.length;
  } catch (err) {
    errors.push(`Player stats: ${err.message}`);
  }

  // ── Clan-level: clan_season_history ─────────────────────────────────────
  try {
    const rows = await sql`
      WITH clan_days AS (
        SELECT
          clan_name,
          COUNT(*)                                     AS wars_played,
          COUNT(*) FILTER (WHERE war_result = 'win')   AS wars_won,
          COUNT(*) FILTER (WHERE war_result = 'loss')  AS wars_lost,
          COUNT(*) FILTER (WHERE war_result = 'draw')  AS wars_drawn,
          SUM(stars_earned)      AS total_stars,
          SUM(stars_conceded)    AS total_stars_conceded,
          SUM(attacks_used)      AS total_attacks_used,
          SUM(attacks_available) AS total_attacks_available
        FROM war_days
        WHERE season = ${season}
        GROUP BY clan_name
      ),
      atk_totals AS (
        SELECT
          clan_name,
          SUM(destruction_pct)                AS dest_sum,
          COUNT(*) FILTER (WHERE stars = 3)   AS three_stars,
          COUNT(*) FILTER (WHERE stars = 2)   AS two_stars,
          COUNT(*) FILTER (WHERE stars = 1)   AS one_stars,
          COUNT(*) FILTER (WHERE stars = 0)   AS zero_stars
        FROM war_attacks
        WHERE season = ${season}
        GROUP BY clan_name
      ),
      def_totals AS (
        SELECT clan_name, SUM(destruction_pct) AS def_sum
        FROM war_defences
        WHERE season = ${season}
        GROUP BY clan_name
      ),
      capped AS (
        SELECT
          cd.clan_name,
          c.clan_tag,
          c.cwl_format,
          LEAST(cd.wars_won, 7)   AS wars_won,
          LEAST(cd.wars_lost, 7)  AS wars_lost,
          LEAST(cd.wars_drawn, 7) AS wars_drawn,
          LEAST(cd.total_stars, (c.cwl_format*7*3) + (7*10))            AS total_stars,
          LEAST(cd.total_stars_conceded, (c.cwl_format*7*3) + (7*10))   AS total_stars_conceded,
          LEAST(cd.total_attacks_used, c.cwl_format*7)      AS total_attacks_used,
          LEAST(cd.total_attacks_available, c.cwl_format*7) AS total_attacks_available_computed,
          ROUND(COALESCE(at.dest_sum, 0) / NULLIF(cd.wars_played * c.cwl_format, 0), 2) AS avg_destruction_pct,
          ROUND(COALESCE(dt.def_sum, 0) / NULLIF(cd.wars_played * c.cwl_format, 0), 2)  AS avg_defence_pct,
          LEAST(at.three_stars, cd.total_attacks_used) AS three_stars_clan,
          at.two_stars  AS two_stars_clan,
          at.one_stars  AS one_stars_clan,
          at.zero_stars AS zero_stars_clan
        FROM clan_days cd
        JOIN clans c ON c.clan_name = cd.clan_name
        LEFT JOIN atk_totals at ON at.clan_name = cd.clan_name
        LEFT JOIN def_totals dt ON dt.clan_name = cd.clan_name
      )
      UPDATE clan_season_history csh SET
        clan_tag                = capped.clan_tag,
        wars_won                 = capped.wars_won,
        wars_lost                 = capped.wars_lost,
        wars_drawn                = capped.wars_drawn,
        total_stars               = capped.total_stars,
        total_stars_conceded      = capped.total_stars_conceded,
        total_attacks_used        = capped.total_attacks_used,
        total_attacks_available   = GREATEST(csh.total_attacks_available, capped.total_attacks_available_computed),
        total_attacks_missed      = GREATEST(0, GREATEST(csh.total_attacks_available, capped.total_attacks_available_computed) - capped.total_attacks_used),
        avg_destruction_pct       = capped.avg_destruction_pct,
        avg_defence_pct           = capped.avg_defence_pct,
        attack_efficiency         = CASE WHEN capped.total_attacks_used > 0
                                       THEN ROUND(capped.total_stars::numeric / capped.total_attacks_used, 2) ELSE NULL END,
        defence_efficiency        = CASE WHEN GREATEST(csh.total_attacks_available, capped.total_attacks_available_computed) > 0
                                       THEN ROUND(capped.total_stars_conceded::numeric / GREATEST(csh.total_attacks_available, capped.total_attacks_available_computed), 2) ELSE NULL END,
        three_star_rate           = CASE WHEN capped.total_attacks_used > 0
                                       THEN ROUND(capped.three_stars_clan::numeric / capped.total_attacks_used * 100, 2) ELSE NULL END,
        three_stars_clan          = capped.three_stars_clan,
        two_stars_clan            = capped.two_stars_clan,
        one_stars_clan            = capped.one_stars_clan,
        zero_stars_clan           = capped.zero_stars_clan
      FROM capped
      WHERE csh.clan_name = capped.clan_name AND csh.season = ${season}
      RETURNING csh.clan_name
    `;
    clansUpdated = rows.length;
  } catch (err) {
    errors.push(`Clan stats: ${err.message}`);
  }

  return { playersUpdated, clansUpdated, errors };
}

// ─── Shared live-checks cache (Roster Compliance + Member Connectivity) ───────
//
// Both checks require a live CoC API roster fetch across every alliance
// clan — unlike the rest of the admin Overview dashboard, which is pure DB
// reads. This single-row cache lets Overview show a fast, non-blocking
// snapshot of both checks' last results, updated whenever either check is
// actually run (from its own dedicated admin page, or the shared refresh
// button on Overview) — never by an automatic live call on every page load.
export async function getLiveChecksCache() {
  const sql = getDb();
  const [row] = await sql`SELECT * FROM admin_live_checks_cache WHERE id = 1`;
  return row || null;
}

export async function upsertComplianceCache({ correctCount, totalRostered }) {
  const sql = getDb();
  await sql`
    INSERT INTO admin_live_checks_cache (id, compliance_correct, compliance_total, checked_at)
    VALUES (1, ${correctCount}, ${totalRostered}, now())
    ON CONFLICT (id) DO UPDATE SET
      compliance_correct = EXCLUDED.compliance_correct,
      compliance_total   = EXCLUDED.compliance_total,
      checked_at          = EXCLUDED.checked_at
  `;
}

export async function upsertConnectivityCache({ connectedCount, totalMembers }) {
  const sql = getDb();
  await sql`
    INSERT INTO admin_live_checks_cache (id, connected_count, connected_total, checked_at)
    VALUES (1, ${connectedCount}, ${totalMembers}, now())
    ON CONFLICT (id) DO UPDATE SET
      connected_count = EXCLUDED.connected_count,
      connected_total  = EXCLUDED.connected_total,
      checked_at        = EXCLUDED.checked_at
  `;
}
