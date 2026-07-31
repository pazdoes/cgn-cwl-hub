import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getOpenPoolSeason } from "@/lib/season";
import { assignPlayerToRoster } from "@/lib/sheetsWrite";
import { getPlayer } from "@/lib/coc";

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

      return NextResponse.json({ ok: true, clanName, published, sheetsSync: results });
    } catch (err) {
      return NextResponse.json({ ok: true, clanName, published, sheetsError: err.message });
    }
  }

  return NextResponse.json({ ok: true, clanName, published });
}
