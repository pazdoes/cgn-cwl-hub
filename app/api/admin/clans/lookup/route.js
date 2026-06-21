import { NextResponse } from "next/server";
import { getClan } from "@/lib/coc";

// Lightweight clan lookup, used by the Add Clan form to pre-fill a
// suggested clan name and CWL Rank as soon as the admin enters a Clan
// Tag — before they've actually submitted the form. Deliberately
// separate from POST /api/admin/clans/create, which performs the same
// getClan() validation again at actual submission time (since the form
// data could be stale by the time of submit, e.g. the clan's league
// changed between lookup and submit) — this route has no side effects
// at all, purely a read for the form's convenience.
export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { clanTag } = body;

  if (!clanTag) {
    return NextResponse.json({ error: "Missing clan tag" }, { status: 400 });
  }

  try {
    const cocClan = await getClan(clanTag);
    const rawRank = cocClan?.warLeague?.name || null;
    const rank = rawRank ? rawRank.replace(/\bLeague\s+/i, "").trim() : "Unranked";

    return NextResponse.json({
      clanName: cocClan?.name || null,
      suggestedRank: rank,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Couldn't find a clan with tag ${clanTag}: ${err.message}` },
      { status: 400 }
    );
  }
}
