import { NextResponse } from "next/server";
import { getAccountsByOwner, isInPool } from "@/lib/pool";
import { readOwnerSecret } from "@/lib/ownerCookie";

const CURRENT_SEASON = process.env.CURRENT_SEASON;

export async function GET() {
  const ownerSecret = await readOwnerSecret();

  if (!ownerSecret) {
    return NextResponse.json({ accounts: [], season: CURRENT_SEASON || null });
  }

  const accounts = await getAccountsByOwner(ownerSecret);

  const withPoolStatus = await Promise.all(
    accounts.map(async (account) => ({
      tag: account.player_tag,
      name: account.player_name,
      inCurrentPool: CURRENT_SEASON ? await isInPool(account.player_tag, CURRENT_SEASON) : false,
    }))
  );

  return NextResponse.json({ accounts: withPoolStatus, season: CURRENT_SEASON || null });
}
