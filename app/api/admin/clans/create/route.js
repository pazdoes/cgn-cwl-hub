import { NextResponse } from "next/server";
import { getClan } from "@/lib/coc";
import { createClan } from "@/lib/pool";
import { createClanTab } from "@/lib/sheetsWrite";

// Adds a new clan. The admin provides Clan Tag, Clan Link, and CWL Rank —
// Clan Tag is validated against the live CoC API (which also gives the
// clan's real, official name, used for both the Sheet tab title and the
// Neon clan_name key). Clan Link has no CoC API source and is always
// admin-typed. CWL Rank can be admin-typed too (including the explicit
// "Unranked" option for a clan that's never done CWL), or the admin can
// instead use the rank-refresh button elsewhere on the admin page after
// creation — this route does NOT attempt its own auto-fetch-and-write of
// rank into the Sheet, since a brand-new tab has no data rows for
// writeCwlRankToSheet's bulk-write to target anyway (it would silently
// no-op). The auto-fetch SUGGESTION shown in the form before submission
// is a separate, lighter client-side step (re-using the same getClan
// data this route also fetches for validation) — not duplicated here.
//
// All three values are stored directly in Neon (clans.clan_tag,
// clans.clan_link, clans.cwl_rank) so assignPlayerToRoster's
// carry-forward fallback has something durable to draw from the moment
// the first player is ever assigned to this clan, even though the Sheet
// tab itself starts with zero data rows.
//
// Order: validate via CoC API first (cheapest failure, no side effects
// yet) → create the Sheet tab → register in Neon. If the Sheet tab
// creation fails, nothing in Neon has been touched yet, so there's
// nothing to roll back. If the Neon insert fails after the tab was
// successfully created, the tab is left in place rather than attempting
// to delete it again here — a partially-created clan (tab exists, no
// Neon row) surfaces clearly on retry via createClanTab's "already
// exists" check, rather than silently retrying destructive Sheet
// operations from within an error handler.
export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { clanTag, clanLink, cwlRank } = body;

  if (!clanTag || !clanLink) {
    return NextResponse.json(
      { error: "Missing clan tag or clan link" },
      { status: 400 }
    );
  }

  let cocClan;
  try {
    cocClan = await getClan(clanTag);
  } catch (err) {
    console.error("CoC clan lookup failed:", err);
    return NextResponse.json(
      { error: `Couldn't find a clan with tag ${clanTag}: ${err.message}` },
      { status: 400 }
    );
  }

  const clanName = cocClan?.name;
  if (!clanName) {
    return NextResponse.json(
      { error: "CoC API returned no clan name — can't create a tab without one." },
      { status: 502 }
    );
  }

  try {
    await createClanTab(clanName);
  } catch (err) {
    console.error("Sheet tab creation failed:", err);
    return NextResponse.json(
      { error: `Sheet tab creation failed: ${err.message}` },
      { status: 502 }
    );
  }

  // Defaults to "Unranked" if the admin left CWL Rank blank — matches
  // the confirmed fallback option for a clan that's never done CWL,
  // rather than storing an empty string.
  const rank = (cwlRank || "Unranked").trim();

  try {
    await createClan(clanName, { clanTag, clanLink, cwlRank: rank });
  } catch (err) {
    console.error("Neon clan registration failed:", err);
    return NextResponse.json(
      {
        error:
          `The Sheet tab "${clanName}" was created, but registering it in the ` +
          `database failed: ${err.message}. The tab exists but won't appear on ` +
          `the admin page yet — contact support rather than retrying creation.`,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ clanName, clanTag, clanLink, rank, format: 15 });
}
