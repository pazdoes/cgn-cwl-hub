// Reads roster data from the Google Sheet.
//
// Strategy:
//  1. Ask Sheets for tab titles only (no grid/formatting data) so we know
//     which tabs to pull and can skip non-roster tabs.
//  2. Pull all roster tabs' values in a single batched request, asking only
//     for formatted display values (no per-cell formatting metadata).
//  3. Both requests are tagged "roster" and cached for ROSTER_CACHE_SECONDS
//     via Next.js's fetch cache. Officers can force an early refresh by
//     hitting /api/admin/refresh, which calls revalidateTag("roster").
//
// This keeps normal browsing fast and cheap (cache hits, no live API call)
// while still feeling close to real-time, and avoids hammering the Google
// Sheets API quota when many members check the app at once (e.g. right as
// CWL sign-ups open).

const IGNORED_SHEETS = [
  "Archive",
  "Archives",
  "Settings",
  "Config",
  "Instructions",
];

// Header + buffer rows. Bump this if a clan tab ever needs more rows.
// A1:K — widened from A1:J when Clan Tag was appended as a new column at K
// (item 6). This is purely additive to the range — unlike the earlier
// CWL Format insert, Clan Tag was appended at the end, not inserted in the
// middle, so no existing column indices (0-9) shifted this time.
const DATA_RANGE = "A1:K250";

export const ROSTER_CACHE_TAG = "roster";
export const ROSTER_CACHE_SECONDS = 30;

export async function getRosterData() {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID;
  const API_KEY = process.env.GOOGLE_API_KEY;

  if (!SHEET_ID || !API_KEY) {
    throw new Error(
      "Missing GOOGLE_SHEET_ID or GOOGLE_API_KEY environment variables"
    );
  }

  const cacheOptions = {
    next: {
      revalidate: ROSTER_CACHE_SECONDS,
      tags: [ROSTER_CACHE_TAG],
    },
  };

  // 1. Lightweight metadata call: tab titles only, no grid data.
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}` +
      `?key=${API_KEY}&fields=sheets.properties.title`,
    cacheOptions
  );
  const meta = await metaRes.json();

  if (meta.error) {
    throw new Error(`Google Sheets metadata error: ${meta.error.message}`);
  }

  const sheetNames = (meta.sheets || [])
    .map((s) => s.properties.title)
    .filter((name) => !IGNORED_SHEETS.includes(name));

  if (sheetNames.length === 0) return [];

  // 2. One batched call for every roster tab's values.
  const rangesQuery = sheetNames
    .map(
      (name) => `ranges=${encodeURIComponent(`'${name}'!${DATA_RANGE}`)}`
    )
    .join("&");

  const valuesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchGet` +
      `?key=${API_KEY}&${rangesQuery}&valueRenderOption=FORMATTED_VALUE`,
    cacheOptions
  );
  const valuesData = await valuesRes.json();

  if (valuesData.error) {
    throw new Error(`Google Sheets values error: ${valuesData.error.message}`);
  }

  const roster = [];

  (valuesData.valueRanges || []).forEach((range) => {
    const rows = range.values || [];

    rows.slice(1).forEach((row) => {
      // Filter on Account (column B), not Position (column A) — a row
      // missing its position number should still count as a real player.
      const account = row[1] || "";
      if (!account) return;

      roster.push({
        position: row[0] || "",
        account,
        playerTag: row[2] || "",
        clan: row[3] || "",
        townHall: row[4] || "",
        status: row[5] || "",
        clanLink: row[6] || "",
        cwlFormat: row[7] || "", // item 5, e.g. "15v15" or "30v30"
        cwlRank: row[8] || "",
        season: row[9] || "",
        clanTag: row[10] || "", // new — item 6, e.g. "#2C8QQPCL2"
      });
    });
  });

  return roster;
}
