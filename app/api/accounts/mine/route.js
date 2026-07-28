import { NextResponse } from "next/server";
import { getAccountsByOwner, isInPool } from "@/lib/pool";
import { readOwnerSecret } from "@/lib/ownerCookie";
import { getOpenPoolSeason } from "@/lib/season";
import { getDb } from "@/lib/db";

export async function GET() {
  const season = await getOpenPoolSeason();
  const ownerSecret = await readOwnerSecret();

  if (!ownerSecret) {
    return NextResponse.json({ accounts: [], season });
  }

  const accounts = await getAccountsByOwner(ownerSecret);
  const sql = getDb();

  const withPoolStatus = await Promise.all(
    accounts.map(async (account) => {
      const inPool = await isInPool(account.player_tag, season);
      const [entry] = await sql`
        SELECT cwl_intent FROM pool_entries
        WHERE player_tag = ${account.player_tag} AND season = ${season}
        LIMIT 1
      `;
      return {
        tag: account.player_tag,
        name: account.player_name,
        townHallLevel: account.town_hall_level ?? null,
        inCurrentPool: inPool,
        cwlIntent: entry?.cwl_intent ?? null,
      };
    })
  );

  return NextResponse.json({ accounts: withPoolStatus, season });
}
