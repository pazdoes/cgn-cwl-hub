import { NextResponse } from "next/server";
import { linkDiscordId, getOwnerSecretByDiscordId } from "@/lib/pool";
import { cookies } from "next/headers";

export async function POST(request) {
  const { discordId } = await request.json().catch(() => ({}));

  if (!discordId) {
    return NextResponse.json({ error: "No discordId provided" }, { status: 401 });
  }

  // Check if this Discord ID already has linked accounts
  const existing = await getOwnerSecretByDiscordId(discordId);
  if (existing) {
    return NextResponse.json({ linked: true, merged: false });
  }

  // Read the cookie-based owner_secret
  const cookieStore = await cookies();
  const cookieSecret = cookieStore.get("cwl_owner")?.value;

  if (!cookieSecret) {
    return NextResponse.json({ linked: false, merged: false });
  }

  await linkDiscordId(cookieSecret, discordId);
  return NextResponse.json({ linked: true, merged: true });
}
