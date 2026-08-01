import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getOpenPoolSeason } from "@/lib/season";
import { assignPlayerToRoster } from "@/lib/sheetsWrite";
import { getPlayer } from "@/lib/coc";
import { getAccessToken } from "@/lib/googleAuth";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CWL_RANK_COL = 8; // column I (0-indexed)

async function getSheetTabsForForceWrite(token) {
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?fields=sheets.properties.title`;
  const res = await fetch(metaUrl, { headers: { Authorization: `Bearer ${token}` } });
  const meta = await res.json();
  return (meta.sheets || []).map(s => s.properties.title);
}

async function getSheetValuesForForceWrite(token, tabName) {
  const range = encodeURIComponent(`${tabName}!A:K`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  return data.values || [];
}

async function writeRangeForForceWrite(token, tabName, a1Range, values) {
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

// Forces the CWL Rank column (I) to match the current value in Neon's
// clans.cwl_rank for every data row in the clan's tab. This exists because
// assignPlayerToRoster's carryForward logic preserves whatever rank value
// is already sitting in an existing row — correct for most fields (so
// manual sheet edits aren't clobbered), but wrong for rank specifically
// right after a publish, since the DB is the source of truth for CWL
// rank and the sheet row may be stale from an earlier point in the season.
async function forceCwlRankColumn(clanName, cwlRank) {
  if (!cwlRank) return { skipped: true, reason: "no cwl_rank set in clans table" };
  const token = await getAccessToken();
  const tabs = await getSheetTabsForForceWrite(token);
  const tabName = tabs.find(t => t.toLowerCase().includes(clanName.toLowerCase()));
  if (!tabName) return { skipped: true, reason: `no tab found for ${clanName}` };

  const rows = await getSheetValuesForForceWrite(token, tabName);
  const dataRowCount = Math.max(rows.length - 1, 0);
  if (dataRowCount === 0) return { rowsUpdated: 0 };

  const col = String.fromCharCode("A".charCodeAt(0) + CWL_RANK_COL); // "I"
  const values = Array.from({ length: dataRowCount }, () => [cwlRank]);
  await writeRangeForForceWrite(token, tabName, `${col}2:${col}${dataRowCount + 1}`, values);
  return { tabName, rowsUpdated: dataRowCount, cwlRank };
}

export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { clanName, published } = await request.json();
  if (!clanName || typeof published !== "boolean") {
    return NextResponse.json({ error: "clanName and published required" }, { status: 400 });
  }

  const sql = getDb();

  // Set the published flag
  await sql`UPDATE clans SET roster_published = ${published} WHERE clan_name = ${clanName}`;

  // When publishing, write all currently assigned players to Google Sheets
  if (published) {
    try {
      const season = await getOpenPoolSeason();

      // Get all assigned players for this clan
      const players = await sql`
        SELECT
          pe.player_tag,
          a.player_name,
          a.town_hall_level,
          pe.status
        FROM pool_entries pe
        JOIN accounts a ON a.player_tag = pe.player_tag
        WHERE pe.season = ${season}
          AND pe.assigned_clan = ${clanName}
          AND pe.status IN ('confirmed', 'substitute', 'registered')
        ORDER BY a.player_name ASC NULLS LAST
      `;

      // Write each player to the Google Sheet
      const results = [];
      for (const player of players) {
        let playerName = player.player_name;
        let townHall = player.town_hall_level;

        // If player_name is missing, fetch from CoC API and backfill DB
        if (!playerName) {
          try {
            const cocPlayer = await getPlayer(player.player_tag);
            if (cocPlayer?.name) {
              playerName = cocPlayer.name;
              townHall = townHall || cocPlayer.townHallLevel;
              // Backfill name and TH in DB
              await sql`
                UPDATE accounts
                SET player_name = ${playerName},
                    town_hall_level = ${townHall || null}
                WHERE player_tag = ${player.player_tag}
              `;
            }
          } catch (err) {
            results.push({ tag: player.player_tag, ok: false, error: `CoC fetch failed: ${err.message}` });
            continue;
          }
        }

        if (!playerName) {
          results.push({ tag: player.player_tag, ok: false, error: "No player name available" });
          continue;
        }

        try {
          const result = await assignPlayerToRoster({
            tag: player.player_tag,
            playerName,
            clan: clanName,
            townHall: townHall ? String(townHall) : "",
            season,
          });
          results.push({ tag: player.player_tag, name: playerName, ok: true, row: result.updatedRow });
        } catch (err) {
          results.push({ tag: player.player_tag, ok: false, error: err.message });
        }
      }

      // Force the CWL Rank column to the current DB value for every row —
      // corrects any stale rank carried forward from existing sheet rows.
      let rankSync = null;
      try {
        const [clan] = await sql`SELECT cwl_rank FROM clans WHERE clan_name = ${clanName} LIMIT 1`;
        rankSync = await forceCwlRankColumn(clanName, clan?.cwl_rank || null);
      } catch (err) {
        rankSync = { error: err.message };
      }

      return NextResponse.json({ ok: true, clanName, published, sheetsSync: results, rankSync });
    } catch (err) {
      return NextResponse.json({ ok: true, clanName, published, sheetsError: err.message });
    }
  }

  return NextResponse.json({ ok: true, clanName, published });
}
