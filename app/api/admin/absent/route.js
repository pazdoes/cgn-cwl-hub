import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
function checkPin(request) {
  return request.headers.get("x-officer-pin") === process.env.OFFICER_PIN;
}
export async function POST(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { clanName, absent } = await request.json().catch(() => ({}));
  if (!clanName || absent === undefined) return NextResponse.json({ error: "clanName and absent required" }, { status: 400 });
  const sql = getDb();
  await sql`UPDATE clans SET cwl_absent = ${absent} WHERE clan_name = ${clanName}`;
  return NextResponse.json({ ok: true, clanName, absent });
}
