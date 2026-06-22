import { NextResponse } from "next/server";
import { getAccountsByOwner, isInPool } from "@/lib/pool";
import { readOwnerSecret } from "@/lib/ownerCookie";
import { getOpenPoolSeason } from "@/lib/season";

export async function GET() {
  const season = getOpenPoolSeason();
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
      // townHallLevel now comes from Neon (item 15) rather than a
      // separate CoC API call — the signup page can show TH icons
      // immediately from this response, with no /api/admin/th-levels
      // round-trip needed. NULL means the account predates item 15
      // or hasn't been refreshed yet; the signup page shows no icon
      // in that case (same fallback as before).
      townHallLevel: account.town_hall_level ?? null,
    }))
  );

  return NextResponse.json({ accounts: withPoolStatus, season });
}
