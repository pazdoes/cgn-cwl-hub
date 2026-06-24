import { NextResponse } from "next/server";
import { getOpenPoolSeason } from "@/lib/season";
import { captureCwlData } from "@/lib/cwlCapture";

// Manual backup trigger for admins — same logic as the cron job
// but PIN-gated and triggerable from the admin pool page at any time.
export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const season = await getOpenPoolSeason();
  if (!season) {
    return NextResponse.json({ error: "No open season found" }, { status: 404 });
  }

  const result = await captureCwlData(season);

  return NextResponse.json({
    ok: true,
    season,
    ...result,
    capturedAt: new Date().toISOString(),
  });
}
