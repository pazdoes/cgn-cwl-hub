import { NextResponse } from "next/server";
import { linkDiscordId, getOwnerSecretByDiscordId } from "@/lib/pool";
import { getDb } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(request) {
  const { discordId, discordUsername } = await request.json().catch(() => ({}));

  if (!discordId) {
    return NextResponse.json({ error: "No discordId provided" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const cookieSecret = cookieStore.get("cwl_owner")?.value;

  if (!cookieSecret) {
    return NextResponse.json({ linked: false, merged: false });
  }

  // Only link if this cookie secret isn't already linked to a different Discord ID
  const existing = await getOwnerSecretByDiscordId(discordId);
  if (!existing) {
    await linkDiscordId(cookieSecret, discordId);
  }

  // Always update discord_username if provided
  if (discordUsername) {
    const sql = getDb();
    await sql`
      UPDATE accounts
      SET discord_username = ${discordUsername}
      WHERE discord_id = ${discordId}
    `.catch(() => null);
  }

  return NextResponse.json({ linked: true, merged: !!existing });
}
