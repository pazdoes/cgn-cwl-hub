import { NextResponse } from "next/server";
import { linkDiscordId } from "@/lib/pool";
import { cookies } from "next/headers";

export async function POST(request) {
  const { discordId } = await request.json().catch(() => ({}));

  if (!discordId) {
    return NextResponse.json({ error: "No discordId provided" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const cookieSecret = cookieStore.get("cwl_owner")?.value;

  if (!cookieSecret) {
    return NextResponse.json({ linked: false, merged: false });
  }

  // Always link — update all accounts under this cookie secret with discordId
  await linkDiscordId(cookieSecret, discordId);
  return NextResponse.json({ linked: true, merged: true });
}
