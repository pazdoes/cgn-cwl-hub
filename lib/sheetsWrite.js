import { getAccessToken } from "@/lib/googleAuth";

const SHEETS_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

async function sheetsFetch(path, options = {}) {
  const token = await getAccessToken();
  const sheetId = process.env.GOOGLE_SHEET_ID;

  const res = await fetch(`${SHEETS_BASE}/${sheetId}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error?.message || `Sheets API error (${res.status})`);
  }

  return data;
}

// Confirms the service account actually has access to this spreadsheet
// and returns its tab names. Used by the diagnostics route, and useful
// any time the app needs to know which clan tabs currently exist.
export async function getSheetTabs() {
  const data = await sheetsFetch("?fields=sheets.properties.title");
  return (data.sheets || []).map((sheet) => sheet.properties.title);
}

export async function getTabValues(tabName, range = "A:I") {
  const data = await sheetsFetch(`/values/${encodeURIComponent(`${tabName}!${range}`)}`);
  return data.values || [];
}

// Appends a new row to the end of a tab's existing data — this is what
// "assigning a player to a clan" will use, since players coming from the
// pool don't already have a row in any tab.
export async function appendRow(tabName, rowValues) {
  const range = encodeURIComponent(`${tabName}!A:I`);
  return sheetsFetch(
    `/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      body: JSON.stringify({ values: [rowValues] }),
    }
  );
}

// Searches the Player Tag column (C) across a given list of tabs for a
// match. Used before writes to guard against accidentally double-entering
// the same account into a roster.
export async function findRowByTag(tag, tabNames) {
  for (const tabName of tabNames) {
    const values = await getTabValues(tabName);
    const rowIndex = values.findIndex((row) => (row[2] || "").trim() === tag.trim());

    if (rowIndex !== -1) {
      return { tabName, rowIndex, row: values[rowIndex] };
    }
  }

  return null;
}
