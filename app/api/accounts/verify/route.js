import { NextResponse } from "next/server";
import { verifyPlayerToken, getPlayer } from "@/lib/coc";
import { upsertAccount, joinPool, setApiTokenVerified } from "@/lib/pool";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { getOrCreateOwnerSecret, setOwnerCookie } from "@/lib/ownerCookie";
import { getOpenPoolSeason } from "@/lib/season";

// Verifies a CoC account via its in-game API token (Settings > API Token),
// then immediately records the account and joins it to the currently open
// pool season — deliberately paired so the first thing a person does is
// also the last thing they need to do.
export async function POST(request) {
  const session = await auth(request);
  const { tag, token } = await request.json().catch(() => ({}));

  if (!tag) {
    return NextResponse.json({ error: "Missing tag" }, { status: 400 });
  }

  const season = await getOpenPoolSeason();
  const normalizedTag = tag.trim().startsWith("#") ? tag.trim() : `#${tag.trim()}`;

  // Token is optional — if provided, verify it against the CoC API.
  // If omitted, skip verification and just look up the player by tag.
  if (token) {
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
  }

  let player;
  try {
    player = await getPlayer(normalizedTag);
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
  const ownerSecret = await getOrCreateOwnerSecret();

  await upsertAccount(normalizedTag, player.name, ownerSecret);
  await joinPool(normalizedTag, season);
  if (token) await setApiTokenVerified(normalizedTag);

  const response = NextResponse.json({
    tag: normalizedTag,
    name: player.name,
    season,
  });

  setOwnerCookie(response, ownerSecret);

  return response;
}
