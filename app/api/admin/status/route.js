import { NextResponse } from "next/server";
import { getOpenPoolSeason } from "@/lib/season";
import { countConfirmed, setStatus, getClanFormat } from "@/lib/pool";
import { writeStatusToSheet } from "@/lib/sheetsWrite";

// Sets a pool entry's Confirmed/Substitute status. Confirmed is hard-capped
// server-side against the clan's CWL Format (15 or 30, read from Neon's
// clans table) — this is the actual enforcement point, not just a UI
// suggestion, per the agreed design. Substitute has no cap check.
//
// Order of operations mirrors the existing assign route: validate first,
// write to the Sheet, then update Neon — Sheet failure blocks the whole
// action (status would be misleading on the public roster otherwise),
// Neon failure after a successful Sheet write is logged but non-fatal,
// consistent with markAssigned's existing behaviour.
export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { tag, clan, status } = body;

  if (!tag || !clan || (status !== "confirmed" && status !== "substitute")) {
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

  try {
    await writeStatusToSheet({ tag, clan, status });
  } catch (err) {
    console.error("Sheet status write failed:", err);
    return NextResponse.json(
      { error: `Sheet write failed: ${err.message}` },
      { status: 502 }
    );
  }

  try {
    await setStatus(tag, season, status);
  } catch (err) {
    console.error("DB status update failed (non-fatal):", err);
  }

  return NextResponse.json({ tag, clan, status, season });
}
