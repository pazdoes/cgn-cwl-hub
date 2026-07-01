import { NextResponse } from "next/server";
import { getOpenPoolSeason } from "@/lib/season";
import { countConfirmed, setStatus, getClanFormat } from "@/lib/pool";
import { writeStatusToSheet } from "@/lib/sheetsWrite";

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

  const season = await getOpenPoolSeason();  // was missing await — returned Promise object instead of season string

  if (status === "confirmed") {
    const format = await getClanFormat(clan);
    const currentConfirmed = await countConfirmed(clan, season);
    if (currentConfirmed >= format) {
      return NextResponse.json(
        { error: `${clan} already has ${currentConfirmed} confirmed players (cap: ${format}). Move someone to Substitute first.` },
        { status: 409 }
      );
    }
  }

  // Sheet write only for confirmed/substitute — registered has no sheet representation
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
