import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getPlayer } from "@/lib/coc";
import { getOpenPoolSeason } from "@/lib/season";

export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const sql = getDb();
  const season = await getOpenPoolSeason();

  try {
    // 1. Get all connected accounts
    const accounts = await sql`SELECT player_tag FROM accounts`;
    
    let updatedCount = 0;

    // 2. Fetch live data and update
    for (const acc of accounts) {
      try {
        const livePlayer = await getPlayer(acc.player_tag);
        const liveName = livePlayer?.name;

        if (liveName) {
          // Update global account name
          await sql`UPDATE accounts SET player_name = ${liveName} WHERE player_tag = ${acc.player_tag}`;
          
          // Update current season pool name so it's reflected in Pool Manager immediately
          await sql`UPDATE pool_entries SET player_name = ${liveName} WHERE player_tag = ${acc.player_tag} AND season = ${season}`;
          
          updatedCount++;
        }
      } catch (e) {
        console.error(`Failed to refresh ${acc.player_tag}:`, e);
      }
    }

    return NextResponse.json({ ok: true, count: updatedCount });
  } catch (err) {
    console.error("Refresh names failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
