import { getDb } from "@/lib/db";

// ── existing helpers (kept exactly as Tier 6 deployed them) ──────────────────

// Records (or re-links) a verified CoC account. On a repeat verification —
// e.g. someone who cleared cookies and re-verified an account they already
// own — this intentionally re-points owner_secret to the new cookie,
// since verification itself is the proof of ownership, not the cookie.
// townHallLevel is optional — accounts registered before item 15 won't
// have it yet. When provided (at registration time, from getPlayer(tag)),
// it's stored immediately so no separate CoC API call is needed later.
// When absent (re-verification of an existing account that predates this
// column), the existing stored value is preserved via the DO UPDATE SET
// logic (only owner_secret and player_name are overwritten on conflict,
// not town_hall_level, so a re-verify never blanks an existing TH value).
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

// Batch-updates town_hall_level for a list of tags — used by the
// manual refresh buttons on the signup page (user refreshes their own
// accounts) and the admin pool tile (admin refreshes all pool players).
// The caller is responsible for fetching the fresh TH values from the
// CoC API (via /api/admin/th-levels or equivalent) and passing them in.
// Only updates accounts that are found — silently skips unknown tags.
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

// Orders by display_order when a user has manually reordered their
// accounts (item 13's drag-and-drop) — NULLS LAST so any account that's
// never been dragged falls back to sorting by verified_at DESC among
// itself, exactly matching the original pre-reorder behavior. This means
// a user who's never touched reordering sees no change at all, and a
// user who's reordered SOME but not all of their accounts gets their
// manually-positioned ones first, with the rest still falling back to
// the original sort beneath them.
export async function getAccountsByOwner(ownerSecret) {
  const sql = getDb();
  return sql`
    SELECT player_tag, player_name, verified_at, display_order, town_hall_level
    FROM accounts
    WHERE owner_secret = ${ownerSecret}
    ORDER BY display_order ASC NULLS LAST, verified_at DESC
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

// ── Item 9: account removal (Manage panel on the signup page) ───────────────

// "Removes" an account from the requesting browser's "Your Accounts" list
// by clearing owner_secret — NOT by deleting the accounts row. This is a
// deliberate choice, not a shortcut: pool_entries.player_tag has a
// foreign-key reference to accounts.player_tag with no cascade, so a
// literal DELETE would either fail outright (if any pool_entries exist
// for this tag, in any season) or require a destructive cascade that
// permanently erases historical pool participation — confirmed
// unacceptable, since that history needs to stay available for possible
// future use (analytics, historical clan performance, etc.) even after
// an account is "removed" from someone's device.
//
// Clearing owner_secret achieves the actual user-facing goal — the
// account disappears from getAccountsByOwner() for this browser — while
// leaving the accounts row and every pool_entries record tied to it
// completely untouched. Re-verifying the same tag later (token or
// tag-only) re-links it automatically via upsertAccount's existing
// ON CONFLICT...owner_secret = EXCLUDED logic — no special "re-add" path
// needed.
//
// The caller (the API route) is responsible for the hard-block check —
// this function performs no season/pool check itself, same split of
// responsibility as clearAssignment/deleteClan elsewhere in this file.
export async function unlinkAccount(playerTag) {
  const sql = getDb();
  await sql`
    UPDATE accounts
    SET owner_secret = NULL
    WHERE player_tag = ${playerTag}
  `;
}

// ── Item 17: Discord identity linking ───────────────────────────────────────

// Returns the owner_secret associated with a Discord ID, or null if
// this Discord user has never linked any CoC accounts before. Used on
// every request from a Discord-authenticated session to find the user's
// existing accounts without relying on a browser cookie.
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

// Links a Discord ID to every account row that belongs to this
// owner_secret. Called once when a Discord-authenticated user first
// links their identity — from that point on, getOwnerSecretByDiscordId
// finds their accounts durably, regardless of which device or browser
// they use.
//
// Also handles the case where a player has existing accounts under an
// owner_secret (cookie-based) and then signs in with Discord for the
// first time — this call merges those identities without touching any
// other columns.
export async function linkDiscordId(ownerSecret, discordId) {
  const sql = getDb();
  await sql`
    UPDATE accounts
    SET discord_id = ${discordId}
    WHERE owner_secret = ${ownerSecret}
  `;
}



// Writes a complete new display order for one owner's accounts in one
// call, rather than a single swap-two-items function — drag-and-drop on
// the frontend naturally produces a full reordered list of tags after
// every drop, so taking the whole list here avoids needing separate
// swap-logic and its edge cases (what if two accounts claim the same
// position, what if a drag is interrupted mid-reorder, etc).
//
// orderedTags is the CALLER's full account list in their newly chosen
// order — index 0 becomes display_order 0, and so on. Every UPDATE is
// scoped to BOTH player_tag AND owner_secret, so even if a crafted tag
// list somehow included a tag the caller doesn't own, that row simply
// wouldn't match and wouldn't be touched — ownership enforcement lives
// here as a second layer, not just in the route that calls this.
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

// ── Tier 7 additions ─────────────────────────────────────────────────────────

// Returns all pool entries for a season, joined with account names and
// TH level from Neon (item 15). Previously, TH was fetched separately
// via a batch CoC API call on every admin page load — now it comes from
// accounts.town_hall_level directly, eliminating that network round-trip
// for any player who has registered or been refreshed since item 15 was
// deployed. NULL town_hall_level means the account predates this column
// and hasn't been refreshed yet — the admin can trigger a refresh.
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
// Orders by display_order when an admin has manually reordered clan
// tiles (item 14's drag-and-drop) — NULLS LAST so any clan that's
// never been dragged falls back to sorting by clan_name ASC among
// itself, exactly matching the original pre-reorder behavior.
export async function getAllClanNames() {
  const sql = getDb();
  const rows = await sql`
    SELECT clan_name FROM clans
    ORDER BY display_order ASC NULLS LAST, clan_name ASC
  `;
  return rows.map(r => r.clan_name);
}

// Writes a complete new display order for all clan tiles in one call.
// orderedNames is the full clan list in the admin's newly chosen order
// — index 0 becomes display_order 0, and so on. Same pattern as
// updateAccountOrder (item 13): takes the full list rather than a
// single swap to avoid edge cases with partial updates.
export async function updateClanOrder(orderedNames) {
  const sql = getDb();
  for (let i = 0; i < orderedNames.length; i++) {
    await sql`
      UPDATE clans SET display_order = ${i}
      WHERE clan_name = ${orderedNames[i]}
    `;
  }
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