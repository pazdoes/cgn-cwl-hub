import { NextResponse } from "next/server";
import { getAccountOwner, joinPool } from "@/lib/pool";
import { readOwnerSecret } from "@/lib/ownerCookie";

const CURRENT_SEASON = process.env.CURRENT_SEASON;

export async function POST(request) {
  const { tag } = await request.json().catch(() => ({}));

  if (!tag) {
    return NextResponse.json({ error: "Missing tag" }, { status: 400 });
  }

  if (!CURRENT_SEASON) {
    return NextResponse.json(
      { error: "No active season is configured right now — ask an officer to set CURRENT_SEASON." },
      { status: 503 }
    );
  }

  const ownerSecret = await readOwnerSecret();

  if (!ownerSecret) {
    return NextResponse.json({ error: "No verified accounts found for this browser." }, { status: 401 });
  }

  const actualOwner = await getAccountOwner(tag);

  if (actualOwner !== ownerSecret) {
    return NextResponse.json({ error: "That account isn't linked to this browser." }, { status: 403 });
  }

  await joinPool(tag, CURRENT_SEASON);

  return NextResponse.json({ tag, season: CURRENT_SEASON });
}
