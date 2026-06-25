import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();
  const [roles, channels, emojis] = await Promise.all([
    sql`SELECT id, name, colour FROM discord_roles ORDER BY name`,
    sql`SELECT id, name FROM discord_channels ORDER BY name`,
    sql`SELECT id, name FROM discord_emojis ORDER BY name`,
  ]);
  return NextResponse.json({ roles, channels, emojis });
}

function checkPin(request) {
  return request.headers.get("x-officer-pin") === process.env.OFFICER_PIN;
}

export async function POST(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { type, id, name, colour } = await request.json();
  const sql = getDb();
  if (type === "role") {
    await sql`INSERT INTO discord_roles (id, name, colour) VALUES (${id}, ${name}, ${colour||'#a78bfa'}) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, colour=EXCLUDED.colour`;
  } else if (type === "channel") {
    await sql`INSERT INTO discord_channels (id, name) VALUES (${id}, ${name}) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name`;
  } else if (type === "emoji") {
    await sql`INSERT INTO discord_emojis (id, name) VALUES (${id}, ${name}) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name`;
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { type, id } = await request.json();
  const sql = getDb();
  if (type === "role") await sql`DELETE FROM discord_roles WHERE id = ${id}`;
  else if (type === "channel") await sql`DELETE FROM discord_channels WHERE id = ${id}`;
  else if (type === "emoji") await sql`DELETE FROM discord_emojis WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
