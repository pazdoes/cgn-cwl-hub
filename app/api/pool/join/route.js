import { NextResponse } from "next/server";
import { getAccountOwner, joinPool } from "@/lib/pool";
import { readOwnerSecret } from "@/lib/ownerCookie";
import { getCurrentSeason } from "@/lib/season";

export async function POST(request) {
  const { tag } = await request.json().catch(() => ({}));

  if (!tag) {
    return NextResponse.json({ error: "Missing tag" }, { status: 400 });
  }

  const season = getCurrentSeason();
  const ownerSecret = await readOwnerSecret();

  if (!ownerSecret) {
    return NextResponse.json({ error: "No verified accounts found for this browser." }, { status: 401 });
  }

  const actualOwner = await getAccountOwner(tag);

  if (actualOwner !== ownerSecret) {
    return NextResponse.json({ error: "That account isn't linked to this browser." }, { status: 403 });
  }

  await joinPool(tag, season);

  return NextResponse.json({ tag, season });
}
