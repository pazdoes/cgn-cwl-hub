import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const ALLIANCE_CLAN_TAGS = ["#2C8QQPCL2", "#2CPC8GR9R", "#2Y9PGJGVC", "#2YQJJUYQY", "#2YV9UCJG2"];

async function fetchPlayer(tag) {
  const encoded = encodeURIComponent(tag);
  const res = await fetch(`https://cocproxy.royaleapi.dev/v1/players/${encoded}`, {
    headers: { Authorization: `Bearer ${process.env.COC_API_TOKEN}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const sql = getDb();
  const accounts = await sql`SELECT player_tag FROM accounts`;
  let updated = 0, errors = 0;

  for (const acc of accounts) {
    try {
      const data = await fetchPlayer(acc.player_tag);
      const clanTag = data?.clan?.tag || null;
      const clanName = data?.clan?.name || null;
      await sql`
        UPDATE accounts
        SET current_clan_tag = ${clanTag}, current_clan_name = ${clanName}
        WHERE player_tag = ${acc.player_tag}
      `;
      updated++;
    } catch { errors++; }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 50));
  }

  return NextResponse.json({ ok: true, updated, errors, total: accounts.length });
}
