import { getAccessToken } from "@/lib/googleAuth";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

const COL = {
  POSITION:    0,
  ACCOUNT:     1,
  PLAYER_TAG:  2,
  CLAN:        3,
  TOWN_HALL:   4,
  STATUS:      5,
  CLAN_LINK:   6,
  CWL_FORMAT:  7, // inserted ahead of Rank/Season, item 5
  CWL_RANK:    8, // was 7, pushed right by CWL_FORMAT
  SEASON:      9, // was 8, pushed right by CWL_FORMAT
  CLAN_TAG:    10, // new — appended at K, item 6. Purely additive: every
                    // other index above is unchanged, since this was
                    // appended at the end rather than inserted in the
                    // middle (deliberately, to avoid repeating the
                    // index-shift bugs from the CWL_FORMAT insert).
};

// Returns the list of tab names for the spreadsheet.
// Used by the diagnostics route and by assignPlayerToRoster.
export async function getSheetTabs() {
  const meta = await getSheetTabsWithIds();
  return meta.map(s => s.title);
}

// Returns tab name + numeric sheetId pairs. The numeric sheetId (distinct
// from the tab's display name/title) is required for row-delete operations
// via the Sheets batchUpdate/deleteDimension API — the values/append and
// values/update endpoints used elsewhere in this file only need the name,
// but deleteDimension specifically needs the numeric ID.
export async function getSheetTabsWithIds() {
  if (!SHEET_ID) throw new Error("Missing GOOGLE_SHEET_ID env var");
  const token = await getAccessToken();
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?fields=sheets.properties`;
  const metaRes = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) throw new Error("Couldn't read spreadsheet metadata");
  const meta = await metaRes.json();
  return (meta.sheets || []).map(s => ({
    title: s.properties.title,
    sheetId: s.properties.sheetId,
  }));
}

async function getSheetValues(token, tabName) {
  // A:K — widened from A:J for item 6's Clan Tag column at K. appendRow
  // below is intentionally left at A:J, unchanged — it only ever writes
  // 10 values (A-J) and its row-detection logic doesn't depend on K, so
  // widening it would add nothing and risk an unrelated behavior change.
  const range = encodeURIComponent(`${tabName}!A:K`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Sheets read failed (${res.status})`);
  }
  const data = await res.json();
  return data.values || [];
}

async function writeRange(token, tabName, a1Range, values) {
  const range = encodeURIComponent(`${tabName}!${a1Range}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ range: `${tabName}!${a1Range}`, majorDimension: "ROWS", values }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Sheets write failed (${res.status})`);
  }
  return res.json();
}

async function appendRow(token, tabName, rowValues) {
  const range = encodeURIComponent(`${tabName}!A:J`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ majorDimension: "ROWS", values: [rowValues] }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Sheets append failed (${res.status})`);
  }
  return res.json();
}

export async function assignPlayerToRoster({ tag, playerName, clan, townHall, season }) {
  if (!SHEET_ID) throw new Error("Missing GOOGLE_SHEET_ID env var");

  const token = await getAccessToken();

  const tabs = await getSheetTabs();
  const tabName = tabs.find(t =>
    t.toLowerCase().includes(clan.toLowerCase())
  );
  if (!tabName) {
    throw new Error(`No sheet tab found matching clan "${clan}". Available tabs: ${tabs.join(", ")}`);
  }

  const rows = await getSheetValues(token, tabName);
  let existingRowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    const rowTag = (rows[i][COL.PLAYER_TAG] || "").trim().toUpperCase();
    if (rowTag === tag.toUpperCase()) {
      existingRowIndex = i;
      break;
    }
  }

  const nextPosition = existingRowIndex >= 0
    ? (rows[existingRowIndex][COL.POSITION] || String(existingRowIndex))
    : String(rows.filter((_, i) => i > 0).length + 1);

  // CWL Format and CWL Rank are clan-level / officer-maintained values,
  // not per-player — assigning a player must never blank them out.
  //
  // When updating an existing row, carry that row's own current values
  // forward unchanged.
  //
  // When appending a brand new row, there's no "own" value yet to carry
  // forward — so CWL Format is instead read from any OTHER existing row
  // in the same tab (every row in a clan's tab shares the same format,
  // confirmed by writeClanFormatToSheet's bulk-write behaviour). If the
  // tab has no other rows yet (a brand new, completely empty clan tab),
  // this falls back to "" and an admin will need to set the format via
  // the format toggle once at least one player is assigned. CWL Rank has
  // no equivalent fallback — it's left blank for a new row regardless,
  // since rank isn't written anywhere else in this codebase yet and has
  // no other-row source to borrow from in the way format does.
  let existingFormat = "";
  let existingRank = "";

  if (existingRowIndex >= 0) {
    existingFormat = rows[existingRowIndex][COL.CWL_FORMAT] || "";
    existingRank   = rows[existingRowIndex][COL.CWL_RANK]   || "";
  } else {
    const anyOtherRow = rows.find((r, i) => i > 0 && (r[COL.CWL_FORMAT] || "").trim() !== "");
    existingFormat = anyOtherRow ? anyOtherRow[COL.CWL_FORMAT] : "";
  }

  const newRow = [
    nextPosition,
    playerName,
    tag,
    clan,
    townHall || "",
    "Active",
    "",
    existingFormat,
    existingRank,
    season,
  ];

  let updatedRow;

  if (existingRowIndex >= 0) {
    const sheetRow = existingRowIndex + 1;
    await writeRange(token, tabName, `A${sheetRow}:J${sheetRow}`, [newRow]);
    updatedRow = sheetRow;
  } else {
    const appendResult = await appendRow(token, tabName, newRow);
    const updatedRange = appendResult.updates?.updatedRange || "";
    const match = updatedRange.match(/(\d+)$/);
    updatedRow = match ? parseInt(match[1], 10) : null;
  }

  const confirmRows = await getSheetValues(token, tabName);
  const confirmed = confirmRows.some(r =>
    (r[COL.PLAYER_TAG] || "").trim().toUpperCase() === tag.toUpperCase()
  );

  return { updatedRow, confirmed, tabName };
}

// Deletes a single row from a tab via batchUpdate/deleteDimension. This is
// a real row removal — everything below shifts up by one — not a cell
// clear. sheetRow is 1-indexed (matching the values it's read from), and
// gets converted to the 0-indexed start/end the API expects internally.
async function deleteRow(token, sheetId, sheetRow) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: sheetRow - 1,
              endIndex: sheetRow,
            },
          },
        },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Sheets row delete failed (${res.status})`);
  }
  return res.json();
}

// Finds and deletes a player's row from their clan's tab entirely — used
// by the admin "X" (unassign) button. Confirmed by design: this is a full
// row removal, not a cell clear, so the player disappears from the public
// roster immediately rather than leaving a blank row behind. If the
// player's row can't be found (e.g. already removed by some other path),
// this is treated as already-successful rather than an error, since the
// end state the caller wants — "this player is not in this clan's tab" —
// is already true.
export async function removePlayerFromRoster({ tag, clan }) {
  if (!SHEET_ID) throw new Error("Missing GOOGLE_SHEET_ID env var");

  const token = await getAccessToken();
  const tabsWithIds = await getSheetTabsWithIds();
  const tab = tabsWithIds.find(t => t.title.toLowerCase().includes(clan.toLowerCase()));
  if (!tab) {
    throw new Error(`No sheet tab found matching clan "${clan}". Available tabs: ${tabsWithIds.map(t => t.title).join(", ")}`);
  }

  const rows = await getSheetValues(token, tab.title);
  const rowIndex = rows.findIndex((r, i) =>
    i > 0 && (r[COL.PLAYER_TAG] || "").trim().toUpperCase() === tag.toUpperCase()
  );

  if (rowIndex < 0) {
    return { tabName: tab.title, removed: false, reason: "Row already absent" };
  }

  const sheetRow = rowIndex + 1;
  await deleteRow(token, tab.sheetId, sheetRow);

  return { tabName: tab.title, removed: true, sheetRow };
}

// Writes a player's Confirmed/Substitute status into the Sheet's existing
// "status" column for their specific row only — never touches any other
// row in the tab. Mirrors assignPlayerToRoster's tab-lookup-by-clan-name
// pattern. status is the plain word "Confirmed" or "Substitute" (matching
// the existing manually-typed values already seen in this column, e.g.
// the "Mid-June 2026" roster's "Confirmed" entries), not the lowercase
// 'confirmed'/'substitute' used internally in Neon.
export async function writeStatusToSheet({ tag, clan, status }) {
  if (!SHEET_ID) throw new Error("Missing GOOGLE_SHEET_ID env var");

  const token = await getAccessToken();
  const tabs = await getSheetTabs();
  const tabName = tabs.find(t => t.toLowerCase().includes(clan.toLowerCase()));
  if (!tabName) {
    throw new Error(`No sheet tab found matching clan "${clan}". Available tabs: ${tabs.join(", ")}`);
  }

  const rows = await getSheetValues(token, tabName);
  const rowIndex = rows.findIndex((r, i) =>
    i > 0 && (r[COL.PLAYER_TAG] || "").trim().toUpperCase() === tag.toUpperCase()
  );
  if (rowIndex < 0) {
    throw new Error(`Player ${tag} not found in "${tabName}" — can't write status.`);
  }

  const sheetRow = rowIndex + 1;
  const statusLabel = status === "confirmed" ? "Confirmed" : "Substitute";
  const col = String.fromCharCode("A".charCodeAt(0) + COL.STATUS); // "F"
  await writeRange(token, tabName, `${col}${sheetRow}:${col}${sheetRow}`, [[statusLabel]]);

  return { tabName, sheetRow, statusLabel };
}

// Writes a clan's CWL Format into every row of that clan's tab — unlike
// writeStatusToSheet, this intentionally IS a bulk write within the tab,
// since CWL Format is a clan-level property that should read the same on
// every row of that clan's roster, not a per-player value. Still scoped
// to exactly one tab — never touches any other clan's tab.
export async function writeClanFormatToSheet({ clan, format }) {
  if (!SHEET_ID) throw new Error("Missing GOOGLE_SHEET_ID env var");

  const token = await getAccessToken();
  const tabs = await getSheetTabs();
  const tabName = tabs.find(t => t.toLowerCase().includes(clan.toLowerCase()));
  if (!tabName) {
    throw new Error(`No sheet tab found matching clan "${clan}". Available tabs: ${tabs.join(", ")}`);
  }

  const rows = await getSheetValues(token, tabName);
  const dataRowCount = Math.max(rows.length - 1, 0);
  if (dataRowCount === 0) {
    return { tabName, rowsUpdated: 0 };
  }

  const formatLabel = `${format}v${format}`;
  const col = String.fromCharCode("A".charCodeAt(0) + COL.CWL_FORMAT); // "H"
  const values = Array.from({ length: dataRowCount }, () => [formatLabel]);
  await writeRange(token, tabName, `${col}2:${col}${dataRowCount + 1}`, values);

  return { tabName, rowsUpdated: dataRowCount };
}

// ── Item 6 additions ──────────────────────────────────────────────────────

// Reads a clan's real in-game CoC tag from column K of its tab. Column K
// is clan-level data (every row in a tab should hold the same value, same
// pattern as CWL Format), so this reads the first non-empty value found
// rather than requiring every single row to have it populated — tolerant
// of a tab being only partially filled in by an admin. Returns null if no
// tag is set anywhere in the tab, letting the caller decide how to handle
// "not configured yet" rather than throwing.
export async function getClanTagFromSheet(clan) {
  if (!SHEET_ID) throw new Error("Missing GOOGLE_SHEET_ID env var");

  const token = await getAccessToken();
  const tabs = await getSheetTabs();
  const tabName = tabs.find(t => t.toLowerCase().includes(clan.toLowerCase()));
  if (!tabName) {
    throw new Error(`No sheet tab found matching clan "${clan}". Available tabs: ${tabs.join(", ")}`);
  }

  const rows = await getSheetValues(token, tabName);
  const rowWithTag = rows.find((r, i) => i > 0 && (r[COL.CLAN_TAG] || "").trim() !== "");

  return rowWithTag ? rowWithTag[COL.CLAN_TAG].trim() : null;
}

// Writes a clan's current CWL Rank (war league name, e.g. "Champion III")
// into every row of that clan's tab — same bulk-write-within-one-tab
// pattern as writeClanFormatToSheet, since CWL Rank is clan-level data
// that should read the same on every row. Intended to be called rarely —
// once per CWL season conclusion, manually triggered by an admin — not on
// any kind of recurring schedule, since league standing only changes at
// season boundaries.
export async function writeCwlRankToSheet({ clan, rank }) {
  if (!SHEET_ID) throw new Error("Missing GOOGLE_SHEET_ID env var");

  const token = await getAccessToken();
  const tabs = await getSheetTabs();
  const tabName = tabs.find(t => t.toLowerCase().includes(clan.toLowerCase()));
  if (!tabName) {
    throw new Error(`No sheet tab found matching clan "${clan}". Available tabs: ${tabs.join(", ")}`);
  }

  const rows = await getSheetValues(token, tabName);
  const dataRowCount = Math.max(rows.length - 1, 0);
  if (dataRowCount === 0) {
    return { tabName, rowsUpdated: 0 };
  }

  const col = String.fromCharCode("A".charCodeAt(0) + COL.CWL_RANK); // "I"
  const values = Array.from({ length: dataRowCount }, () => [rank]);
  await writeRange(token, tabName, `${col}2:${col}${dataRowCount + 1}`, values);

  return { tabName, rowsUpdated: dataRowCount };
}
