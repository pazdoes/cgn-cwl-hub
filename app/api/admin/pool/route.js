import { NextResponse } from "next/server";
import { getOpenPoolSeason } from "@/lib/season";
import { getPoolEntries } from "@/lib/pool";

// Returns all pool entries for the currently open season.
// Gated by the same OFFICER_PIN used for other admin routes.
export async function GET(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const season = await getOpenPoolSeason();
  const entries = await getPoolEntries(season);

  return NextResponse.json({ season, entries });
}
