import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAccessToken } from "@/lib/googleAuth";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CLAN_LINK_COL = 6; // column G (0-indexed)

async function getSheetValues(token, tabName) {
  const range = encodeURIComponent(`${tabName}!A:K`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  return data.values || [];
}

async function writeRange(token, tabName, a1Range, values) {
  const range = encodeURIComponent(`${tabName}!${a1Range}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ range: `${tabName}!${a1Range}`, majorDimension: "ROWS", values }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Sheets write failed (${res.status})`);
  }
  return res.json();
}

async function getSheetTabs(token) {
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?fields=sheets.properties.title`;
  const res = await fetch(metaUrl, { headers: { Authorization: `Bearer ${token}` } });
  const meta = await res.json();
  return (meta.sheets || []).map(s => s.properties.title);
}

export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { clanName } = await request.json();
  if (!clanName) return NextResponse.json({ error: "clanName required" }, { status: 400 });

  const sql = getDb();
  const [clan] = await sql`SELECT clan_link FROM clans WHERE clan_name = ${clanName} LIMIT 1`;
  if (!clan?.clan_link) return NextResponse.json({ error: "Clan not found or no clan_link set" }, { status: 404 });

  const token = await getAccessToken();
  const tabs = await getSheetTabs(token);
  const tabName = tabs.find(t => t.toLowerCase().includes(clanName.toLowerCase().split(" ")[0]));
  if (!tabName) return NextResponse.json({ error: `No sheet tab found for ${clanName}` }, { status: 404 });

  const rows = await getSheetValues(token, tabName);
  const dataRowCount = Math.max(rows.length - 1, 0);
  if (dataRowCount === 0) return NextResponse.json({ ok: true, rowsUpdated: 0 });

  const col = String.fromCharCode("A".charCodeAt(0) + CLAN_LINK_COL); // "G"
  const values = Array.from({ length: dataRowCount }, () => [clan.clan_link]);
  await writeRange(token, tabName, `${col}2:${col}${dataRowCount + 1}`, values);

  return NextResponse.json({ ok: true, tabName, rowsUpdated: dataRowCount, clan_link: clan.clan_link });
}
