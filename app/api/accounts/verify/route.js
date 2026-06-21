import { NextResponse } from "next/server";
import { verifyPlayerToken, getPlayer } from "@/lib/coc";
import { upsertAccount, joinPool } from "@/lib/pool";
import { getOrCreateOwnerSecret, setOwnerCookie } from "@/lib/ownerCookie";
import { getOpenPoolSeason } from "@/lib/season";

// Registers a CoC account and immediately joins it to the currently open
// pool season — deliberately paired so the first thing a person does is
// also the last thing they need to do.
//
// Token is OPTIONAL (item 8). This is a small private alliance tool, not
// a public system with adversarial users — the realistic situation this
// supports is a teammate who can't access their token right now (travel,
// time constraints, unfamiliar with the process) being added by someone
// else, or registering quickly themselves without digging up the token.
// Player tags are public information already shown on this app's own
// homepage roster, so tag-only registration is a deliberate accessibility
// choice for this trusted-community context, not an oversight — the full
// API-token verification path remains available and unchanged for anyone
// who wants the stronger proof-of-ownership step.
//
// With a token: verifyPlayerToken must succeed before anything is
// recorded, same as before.
// Without a token: getPlayer(tag) alone confirms the tag is a real,
// existing CoC account (and supplies the player's name) — no ownership
// claim is made beyond "this tag exists."
export async function POST(request) {
  const { tag, token } = await request.json().catch(() => ({}));

  if (!tag) {
    return NextResponse.json({ error: "Missing tag" }, { status: 400 });
  }

  const season = getOpenPoolSeason();
  const normalizedTag = tag.trim().startsWith("#") ? tag.trim() : `#${tag.trim()}`;

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

  const response = NextResponse.json({
    tag: normalizedTag,
    name: player.name,
    season,
  });

  setOwnerCookie(response, ownerSecret);

  return response;
}
