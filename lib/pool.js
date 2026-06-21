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
export async function getPoolEntries(season) {
  const sql = getDb();
  return sql`
    SELECT
      pe.player_tag,
      pe.season,
      pe.assigned_at,
      pe.assigned_clan,
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