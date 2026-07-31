import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const sql = getDb();
  const clans = await sql`SELECT clan_name, clan_link, clan_tag FROM clans ORDER BY clan_name`;
  return NextResponse.json({ clans });
}
