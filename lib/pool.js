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

// ── Item 7 additions: clan list as source of truth, create/delete ──────────

// Returns every known clan name from the clans table. This is now the
// authoritative source for "what clans exist" on the admin pool page —
// replacing the old approach of inferring clans from non-empty Sheet
// rows via /api/roster, which made any clan with zero assigned players
// invisible on the admin page (the original bug this item fixes).
export async function getAllClanNames() {
  const sql = getDb();
  const rows = await sql`SELECT clan_name FROM clans ORDER BY clan_name ASC`;
  return rows.map(r => r.clan_name);
}

// Registers a brand-new clan in Neon, storing every clan-level value
// captured at creation time (Clan Tag, Clan Link, CWL Rank) alongside
// the default CWL Format (15) — these become the fallback source for
// assignPlayerToRoster's carryForward when a brand-new clan's tab has
// zero rows to borrow from. The caller (the create route) is responsible
// for also creating the matching Sheet tab; this function only handles
// the Neon side. Throws on conflict rather than silently upserting,
// since "create" for an already-existing clan name is a real error, not
// a no-op — unlike setClanFormat's upsert, which is intentionally
// idempotent for toggling.
export async function createClan(clanName, { clanTag, clanLink, cwlRank } = {}) {
  const sql = getDb();
  await sql`
    INSERT INTO clans (clan_name, cwl_format, clan_tag, clan_link, cwl_rank)
    VALUES (${clanName}, 15, ${clanTag ?? null}, ${clanLink ?? null}, ${cwlRank ?? null})
  `;
}

// Reads a clan's stored clan-level fallback values (Clan Tag, Clan Link,
// CWL Rank, CWL Format) from Neon. Used by assignPlayerToRoster as a
// last-resort fallback after the Sheet-only carry-forward finds nothing
// to borrow from — i.e. specifically for a brand-new clan's first-ever
// assigned player. cwl_format is included here too: every clan row
// always has a cwl_format value (NOT NULL DEFAULT 15), so it's a
// reliable fallback for a tab with zero rows to borrow a format from —
// this was missed in the original version of this function, which only
// covered the three fields with no table-level default, leaving CWL
// Format blank on a brand-new clan's first assignment. Returns nulls for
// clan_tag/clan_link/cwl_rank if not set, which the caller treats the
// same as "no value available" (falls through to empty string).
export async function getClanFallbackData(clanName) {
  const sql = getDb();
  const rows = await sql`
    SELECT clan_tag, clan_link, cwl_rank, cwl_format FROM clans WHERE clan_name = ${clanName}
  `;
  return rows[0] ?? { clan_tag: null, clan_link: null, cwl_rank: null, cwl_format: null };
}

// Counts how many pool_entries rows currently have this clan as their
// assigned_clan, across ALL seasons — not just the currently open one.
// Used by the delete route's safety check: deletion is blocked entirely
// if this is non-zero, per the confirmed "force unassign everyone first"
// requirement. Deliberately not season-scoped, since a clan with players
// assigned in a past season should still be considered "in use" — we
// don't want to silently orphan historical assignment records either.
export async function countAssignedToClanAnySeason(clanName) {
  const sql = getDb();
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM pool_entries
    WHERE assigned_clan = ${clanName}
  `;
  return rows[0]?.count ?? 0;
}

// Removes a clan's row from Neon. The caller (the delete route) is
// responsible for checking countAssignedToClanAnySeason first and for
// deleting the matching Sheet tab — this function only handles the Neon
// side, mirroring createClan's split of responsibility.
export async function deleteClan(clanName) {
  const sql = getDb();
  await sql`DELETE FROM clans WHERE clan_name = ${clanName}`;
}