import { NextResponse } from "next/server";
import { getAccountsByOwner, updateTownHallLevels } from "@/lib/pool";
import { getPlayer } from "@/lib/coc";
import { readOwnerSecret } from "@/lib/ownerCookie";

// Manual TH refresh for the requesting browser's linked accounts.
// Triggered by the refresh button on the signup page's "Your Accounts"
// tile — allows a player who has upgraded their Town Hall to update
// their stored TH level in Neon without needing to re-verify their
// account. Reads from CoC API in parallel for all linked accounts,
// then writes the updated values back to Neon via updateTownHallLevels.
export async function POST() {
  const ownerSecret = await readOwnerSecret();
  if (!ownerSecret) {
    return NextResponse.json({ error: "Not verified on this device" }, { status: 401 });
  }

  const accounts = await getAccountsByOwner(ownerSecret);
  if (accounts.length === 0) {
    return NextResponse.json({ updated: {} });
  }

  const results = await Promise.all(
    accounts.map(async (account) => {
      try {
        const player = await getPlayer(account.player_tag);
        return [account.player_tag, player?.townHallLevel ?? null];
      } catch {
        return [account.player_tag, null];
      }
    })
  );

  const updated = Object.fromEntries(
    results.filter(([, level]) => level !== null)
  );

  await updateTownHallLevels(updated);

  return NextResponse.json({ updated });
}
