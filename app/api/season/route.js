import { NextResponse } from "next/server";
import { getOpenPoolSeason } from "@/lib/season";

// Public endpoint returning the current open CWL season from Neon.
// Used by the homepage hero tile so it always reflects the admin-
// controlled season truth source rather than the Sheet-derived value.
export async function GET() {
  const season = await getOpenPoolSeason();
  return NextResponse.json({ season });
}
