import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getOpenPoolSeason } from "@/lib/season";
import { readOwnerSecret } from "@/lib/ownerCookie";
import { getAccountsByOwner } from "@/lib/pool";

export async function POST(request) {
  const { tag, intent } = await request.json().catch(() => ({}));
  if (!tag || !["in", "out", null].includes(intent)) {
    return NextResponse.json({ error: "tag and intent (in/out/null) required" }, { status: 400 });
  }

  const ownerSecret = await readOwnerSecret();
  if (!ownerSecret) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Verify this tag belongs to the owner
  const accounts = await getAccountsByOwner(ownerSecret);
  if (!accounts.find(a => a.player_tag === tag)) {
    return NextResponse.json({ error: "Account not found" }, { status: 403 });
  }

  const sql = getDb();
  const season = await getOpenPoolSeason();

  // Ensure pool_entry exists
  await sql`
    INSERT INTO pool_entries (player_tag, season, cwl_intent)
    VALUES (${tag}, ${season}, ${intent})
    ON CONFLICT (player_tag, season) DO UPDATE SET cwl_intent = ${intent}
  `;

  // "Out" is a standing commitment, not a season-scoped toggle like "In" —
  // it carries forward into every future season (see season/close route)
  // until the player explicitly taps back to In or clears it. Any
  // transition away from "out" (to "in" or back to neutral) clears the
  // flag, so cancelling this season's Out also cancels the standing
  // commitment rather than leaving it silently active.
  await sql`
    UPDATE accounts SET permanent_out = ${intent === "out"} WHERE player_tag = ${tag}
  `;

  return NextResponse.json({ ok: true, tag, intent, season });
}
