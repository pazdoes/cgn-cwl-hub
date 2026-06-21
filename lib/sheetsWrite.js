import { getAccessToken } from "@/lib/googleAuth";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// Column layout that matches the existing Sheet schema:
// A=Position | B=Account | C=Player Tag | D=Clan | E=Town Hall
// F=Status   | G=Clan Link | H=CWL Rank | I=CWL Season
const COL = {
  POSITION:  0,
  ACCOUNT:   1,
  PLAYER_TAG: 2,
  CLAN:      3,
  TOWN_HALL: 4,
  STATUS:    5,
  CLAN_LINK: 6,
  CWL_RANK:  7,
  SEASON:    8,
};

// Fetches all values from a named sheet tab.
async function getSheetValues(token, tabName) {
  const range = encodeURIComponent(`${tabName}!A:I`);
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

// Writes a single range (A1 notation) to a tab.
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

// Appends a new row at the bottom of the clan's tab (after the last filled row).
async function appendRow(token, tabName, rowValues) {
  const range = encodeURIComponent(`${tabName}!A:I`);
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

// Main entry point called by /api/admin/assign.
// Strategy:
//   1. Find the correct clan tab (partial match on tab name so "{CGN}" suffixes etc. work).
//   2. Look for an existing row where Player Tag matches — update it if found.
//   3. If no existing row for this tag, append a new row.
//   4. Read the row back (by tag, not row number) to confirm the write landed.
export async function assignPlayerToRoster({ tag, playerName, clan, townHall, season }) {
  if (!SHEET_ID) throw new Error("Missing GOOGLE_SHEET_ID env var");

  const token = await getAccessToken();

  // Step 1: discover the actual tab name.
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?fields=sheets.properties.title`;
  const metaRes = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) throw new Error("Couldn't read spreadsheet metadata");
  const meta = await metaRes.json();
  const tabs = (meta.sheets || []).map(s => s.properties.title);

  const tabName = tabs.find(t =>
    t.toLowerCase().includes(clan.toLowerCase())
  );
  if (!tabName) {
    throw new Error(`No sheet tab found matching clan "${clan}". Available tabs: ${tabs.join(", ")}`);
  }

  // Step 2: scan existing rows for this player tag.
  const rows = await getSheetValues(token, tabName);
  // row 0 is likely the header — find existing data row by tag (column C, index 2).
  let existingRowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    const rowTag = (rows[i][COL.PLAYER_TAG] || "").trim().toUpperCase();
    if (rowTag === tag.toUpperCase()) {
      existingRowIndex = i;
      break;
    }
  }

  // Build the new row content.
  // Position = next available number if inserting, or keep existing if updating.
  const nextPosition = existingRowIndex >= 0
    ? (rows[existingRowIndex][COL.POSITION] || String(existingRowIndex))
    : String(rows.filter((_, i) => i > 0).length + 1);

  const newRow = [
    nextPosition,          // A: Position
    playerName,            // B: Account
    tag,                   // C: Player Tag
    clan,                  // D: Clan
    townHall || "",        // E: Town Hall
    "Active",              // F: Status — default to Active on assignment
    "",                    // G: Clan Link (officer fills manually)
    "",                    // H: CWL Rank (officer fills manually)
    season,                // I: CWL Season
  ];

  let updatedRow;

  if (existingRowIndex >= 0) {
    // Update the existing row in place.
    const sheetRow = existingRowIndex + 1; // 1-indexed for Sheets API
    await writeRange(token, tabName, `A${sheetRow}:I${sheetRow}`, [newRow]);
    updatedRow = sheetRow;
  } else {
    // Append a brand new row.
    const appendResult = await appendRow(token, tabName, newRow);
    // Parse the updated range from the response to get the actual row number.
    const updatedRange = appendResult.updates?.updatedRange || "";
    const match = updatedRange.match(/(\d+)$/);
    updatedRow = match ? parseInt(match[1], 10) : null;
  }

  // Step 4: read back to confirm.
  const confirmRows = await getSheetValues(token, tabName);
  const confirmed = confirmRows.some(r =>
    (r[COL.PLAYER_TAG] || "").trim().toUpperCase() === tag.toUpperCase()
  );

  return { updatedRow, confirmed, tabName };
}
