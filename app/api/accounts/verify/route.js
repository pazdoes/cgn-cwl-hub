import { NextResponse } from "next/server";
import { verifyPlayerToken, getPlayer } from "@/lib/coc";
import { upsertAccount, joinPool } from "@/lib/pool";
import { getOrCreateOwnerSecret, setOwnerCookie } from "@/lib/ownerCookie";
import { getCurrentSeason } from "@/lib/season";

// Verifies a CoC account via its in-game API token (Settings > API Token),
// then immediately records the account and joins it to the current
// season's pool in the same action — deliberately paired so the first
// thing a person does is also the last thing they need to do.
export async function POST(request) {
  const { tag, token } = await request.json().catch(() => ({}));

  if (!tag || !token) {
    return NextResponse.json({ error: "Missing tag or token" }, { status: 400 });
  }

  const season = getCurrentSeason();
  const normalizedTag = tag.trim().startsWith("#") ? tag.trim() : `#${tag.trim()}`;

  let isValid;
  try {
    isValid = await verifyPlayerToken(normalizedTag, token);
  } catch (err) {
    if (err.status === 404) {
      return NextResponse.json(
        { error: "No account found with that tag — double check it's correct." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Couldn't reach Clash of Clans right now — try again in a moment." },
      { status: 502 }
    );
  }

  if (!isValid) {
    return NextResponse.json(
      {
        error:
          "That token doesn't match this account. Generate a fresh one in-game under Settings > API Token and try again.",
      },
      { status: 401 }
    );
  }

  const player = await getPlayer(normalizedTag);
  const ownerSecret = await getOrCreateOwnerSecret();

  await upsertAccount(normalizedTag, player.name, ownerSecret);
  await joinPool(normalizedTag, season);

  const response = NextResponse.json({
    tag: normalizedTag,
    name: player.name,
    season,
  });

  setOwnerCookie(response, ownerSecret);

  return response;
}
