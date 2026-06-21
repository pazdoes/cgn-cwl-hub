import { getDb } from "@/lib/db";

// ── existing helpers (kept exactly as Tier 6 deployed them) ──────────────────

// Records (or re-links) a verified CoC account. On a repeat verification —
// e.g. someone who cleared cookies and re-verified an account they already
// own — this intentionally re-points owner_secret to the new cookie,
// since verification itself is the proof of ownership, not the cookie.
export async function upsertAccount(playerTag, playerName, ownerSecret) {
  const sql = getDb();
  await sql`
    INSERT INTO accounts (player_tag, player_name, owner_secret)
    VALUES (${playerTag}, ${playerName}, ${ownerSecret})
    ON CONFLICT (player_tag)
    DO UPDATE SET player_name = EXCLUDED.player_name, owner_secret = EXCLUDED.owner_secret
  `;
}

// Idempotent — re-joining a season you're already in is a no-op, not an
// error, so the frontend can call this freely without checking state first.
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
    SELECT player_tag, player_name, verified_at
    FROM accounts
    WHERE owner_secret = ${ownerSecret}
    ORDER BY verified_at DESC
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

// ── Tier 7 additions ─────────────────────────────────────────────────────────

// Returns all pool entries for a season, joined with account names.
// assigned_clan IS NULL = still available; NOT NULL = already placed.
// status is NULL until an admin sets Confirmed/Substitute via setStatus.
export async function getPoolEntries(season) {
  const sql = getDb();
  return sql`
    SELECT
      pe.player_tag,
      pe.season,
      pe.assigned_at,
      pe.assigned_clan,
      pe.status,
      a.player_name
    FROM pool_entries pe
    JOIN accounts a ON a.player_tag = pe.player_tag
    WHERE pe.season = ${season}
    ORDER BY pe.assigned_clan NULLS FIRST, a.player_name ASC
  `;
}

// Stamps an entry as assigned once the Sheet write succeeds.
export async function markAssigned(playerTag, season, clan) {
  const sql = getDb();
  await sql`
    UPDATE pool_entries
    SET assigned_at = NOW(), assigned_clan = ${clan ?? null}
    WHERE player_tag = ${playerTag} AND season = ${season}
  `;
}

// ── Item 5 additions: unassign, Confirmed/Substitute status, CWL Format ──────

// Admin "X" button on the admin pool page: clears assignment and status,
// returning the player to the unassigned pool (NOT removed from the pool
// entirely — that's leavePool below, used by the player-side X instead).
export async function clearAssignment(playerTag, season) {
  const sql = getDb();
  await sql`
    UPDATE pool_entries
    SET assigned_at = NULL, assigned_clan = NULL, status = NULL
    WHERE player_tag = ${playerTag} AND season = ${season}
  `;
}

// Looks up a pool entry's current assigned_clan — needed by the unassign
// route before it can act, since it only receives a tag and must find
// which clan's Sheet tab to delete the player's row from.
export async function getAssignedClan(playerTag, season) {
  const sql = getDb();
  const rows = await sql`
    SELECT assigned_clan FROM pool_entries
    WHERE player_tag = ${playerTag} AND season = ${season}
  `;
  return rows[0]?.assigned_clan ?? null;
}

// Counts how many players are currently Confirmed for a given clan/season —
// the live number the hard-cap check compares against cwl_format. Only
// counts status = 'confirmed'; substitutes never count toward the cap.
export async function countConfirmed(clan, season) {
  const sql = getDb();
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM pool_entries
    WHERE assigned_clan = ${clan} AND season = ${season} AND status = 'confirmed'
  `;
  return rows[0]?.count ?? 0;
}

// Sets a player's Confirmed/Substitute status. Does NOT perform the cap
// check itself — that's the caller's responsibility (the API route), since
// the check needs to happen before this write, with the Sheet write
// sandwiched in between per the established dual-write order.
export async function setStatus(playerTag, season, status) {
  const sql = getDb();
  await sql`
    UPDATE pool_entries
    SET status = ${status}
    WHERE player_tag = ${playerTag} AND season = ${season}
  `;
}

// Player-side "X" button on the signup page: removes the pool entry
// entirely for that season, distinct from clearAssignment above. Only
// ever called for accounts the requesting browser owns — ownership is
// checked by the caller (the API route) via getAccountOwner, not here.
export async function leavePool(playerTag, season) {
  const sql = getDb();
  await sql`
    DELETE FROM pool_entries
    WHERE player_tag = ${playerTag} AND season = ${season}
  `;
}

// Reads a clan's current CWL Format (15 or 30). Returns the default (15)
// if the clan has no row yet in the clans table — e.g. before any admin
// has touched its format toggle for the first time.
export async function getClanFormat(clanName) {
  const sql = getDb();
  const rows = await sql`
    SELECT cwl_format FROM clans WHERE clan_name = ${clanName}
  `;
  return rows[0]?.cwl_format ?? 15;
}

// Reads CWL Format for every known clan in one call, so the admin pool
// page can render every clan header's format without one query per clan.
// Clans with no row yet are simply absent from the result — the caller
// should default missing entries to 15, same as getClanFormat above.
export async function getAllClanFormats() {
  const sql = getDb();
  const rows = await sql`SELECT clan_name, cwl_format FROM clans`;
  return Object.fromEntries(rows.map(r => [r.clan_name, r.cwl_format]));
}

// Sets a clan's CWL Format. Upserts since a clan may not have a clans
// row yet (defaults to 15 until an admin first touches its toggle).
export async function setClanFormat(clanName, format) {
  const sql = getDb();
  await sql`
    INSERT INTO clans (clan_name, cwl_format)
    VALUES (${clanName}, ${format})
    ON CONFLICT (clan_name)
    DO UPDATE SET cwl_format = EXCLUDED.cwl_format, updated_at = NOW()
  `;
}