import { NextResponse } from "next/server";
import { getOpenPoolSeason } from "@/lib/season";
import { countConfirmed, setStatus, getClanFormat } from "@/lib/pool";
import { writeStatusToSheet } from "@/lib/sheetsWrite";

// Sets a pool entry's Confirmed/Substitute/Registered status.
//
// Confirmed is hard-capped server-side against the clan's CWL Format (15
// or 30) — this is the actual enforcement point, not just a UI suggestion.
// Substitute has no cap check. Registered is the default/reset state —
// it skips the sheet write entirely (the sheet has no "Registered" concept;
// it only tracks Confirmed/Substitute distinctions) and only updates Neon.
//
// Order of operations: validate → cap check (Confirmed only) →
// sheet write (Confirmed/Substitute only) → Neon update.
export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { tag, clan, status } = body;

  if (!tag || !clan || (status !== "confirmed" && status !== "substitute" && status !== "registered")) {
    return NextResponse.json(
      { error: "Missing or invalid tag, clan, or status" },
      { status: 400 }
    );
  }

  const season = getOpenPoolSeason();

  if (status === "confirmed") {
    const format = await getClanFormat(clan);
    const currentConfirmed = await countConfirmed(clan, season);
    if (currentConfirmed >= format) {
      return NextResponse.json(
        {
          error: `${clan} already has ${currentConfirmed} confirmed players (cap: ${format}). Move someone to Substitute first.`,
        },
        { status: 409 }
      );
    }
  }

  // Sheet write only applies to Confirmed and Substitute — Registered is
  // the default state and has no sheet representation. Writing it to the
  // sheet would incorrectly set the cell to "Substitute" (the fallback in
  // writeStatusToSheet's label logic), so we skip it entirely here.
  if (status === "confirmed" || status === "substitute") {
    try {
      await writeStatusToSheet({ tag, clan, status });
    } catch (err) {
      console.error("Sheet status write failed:", err);
      return NextResponse.json(
        { error: `Sheet write failed: ${err.message}` },
        { status: 502 }
      );
    }
  }

  try {
    await setStatus(tag, season, status);
  } catch (err) {
    console.error("DB status update failed (non-fatal):", err);
  }

  return NextResponse.json({ tag, clan, status, season });
}
