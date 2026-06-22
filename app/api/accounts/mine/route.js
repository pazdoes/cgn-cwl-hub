import { NextResponse } from "next/server";
import { getAccountsByOwner, isInPool } from "@/lib/pool";
import { readOwnerSecret } from "@/lib/ownerCookie";
import { getOpenPoolSeason } from "@/lib/season";

export async function GET() {
  const season = await getOpenPoolSeason();
  const ownerSecret = await readOwnerSecret();

  if (!ownerSecret) {
    return NextResponse.json({ accounts: [], season });
  }

  const accounts = await getAccountsByOwner(ownerSecret);

  const withPoolStatus = await Promise.all(
    accounts.map(async (account) => ({
      tag: account.player_tag,
      name: account.player_name,
      inCurrentPool: await isInPool(account.player_tag, season),
    }))
  );

  return NextResponse.json({ accounts: withPoolStatus, season });
}
