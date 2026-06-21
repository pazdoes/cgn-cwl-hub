import { getDb } from "@/lib/db";

// Records (or re-links) a verified CoC account. On a repeat verification —
// e.g. someone who cleared cookies and re-verified an account they already
// own — this intentionally re-points owner_secret to the new cookie,
// since verification itself is the proof of ownership, not the cookie.
export async function upsertAccount(tag, name, ownerSecret) {
  const sql = getDb();
  await sql`
    INSERT INTO accounts (player_tag, player_name, owner_secret)
    VALUES (${tag}, ${name}, ${ownerSecret})
    ON CONFLICT (player_tag)
    DO UPDATE SET player_name = EXCLUDED.player_name, owner_secret = EXCLUDED.owner_secret
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

export async function getAccountOwner(tag) {
  const sql = getDb();
  const rows = await sql`SELECT owner_secret FROM accounts WHERE player_tag = ${tag}`;
  return rows[0]?.owner_secret || null;
}

// Idempotent — re-joining a season you're already in is a no-op, not an
// error, so the frontend can call this freely without checking state first.
export async function joinPool(tag, season) {
  const sql = getDb();
  await sql`
    INSERT INTO pool_entries (player_tag, season)
    VALUES (${tag}, ${season})
    ON CONFLICT (player_tag, season) DO NOTHING
  `;
}

export async function isInPool(tag, season) {
  const sql = getDb();
  const rows = await sql`
    SELECT 1 FROM pool_entries WHERE player_tag = ${tag} AND season = ${season}
  `;
  return rows.length > 0;
}

// Used by the admin assignment screen in the next phase — included now
// since it's a natural extension of the table this phase already owns.
export async function getPoolForSeason(season) {
  const sql = getDb();
  return sql`
    SELECT pe.player_tag, a.player_name, pe.joined_at, pe.assigned_at
    FROM pool_entries pe
    JOIN accounts a ON a.player_tag = pe.player_tag
    WHERE pe.season = ${season}
    ORDER BY pe.joined_at ASC
  `;
}
