import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { clanName, published } = await request.json();
  if (!clanName || typeof published !== "boolean") {
    return NextResponse.json({ error: "clanName and published required" }, { status: 400 });
  }

  const sql = getDb();
  await sql`UPDATE clans SET roster_published = ${published} WHERE clan_name = ${clanName}`;
  return NextResponse.json({ ok: true, clanName, published });
}
