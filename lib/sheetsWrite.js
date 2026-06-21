import { getAccessToken } from "@/lib/googleAuth";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

const COL = {
  POSITION:   0,
  ACCOUNT:    1,
  PLAYER_TAG: 2,
  CLAN:       3,
  TOWN_HALL:  4,
  STATUS:     5,
  CLAN_LINK:  6,
  CWL_RANK:   7,
  SEASON:     8,
};

// Returns the list of tab names for the spreadsheet.
// Used by the diagnostics route and by assignPlayerToRoster.
export async function getSheetTabs() {
  if (!SHEET_ID) throw new Error("Missing GOOGLE_SHEET_ID env var");
  const token = await getAccessToken();
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?fields=sheets.properties.title`;
  const metaRes = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) throw new Error("Couldn't read spreadsheet metadata");
  const meta = await metaRes.json();
  return (meta.sheets || []).map(s => s.properties.title);
}

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

  const newRow = [
    nextPosition,
    playerName,
    tag,
    clan,
    townHall || "",
    "Active",
    "",
    "",
    season,
  ];

  let updatedRow;

  if (existingRowIndex >= 0) {
    const sheetRow = existingRowIndex + 1;
    await writeRange(token, tabName, `A${sheetRow}:I${sheetRow}`, [newRow]);
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
