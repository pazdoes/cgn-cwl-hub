import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function checkPin(request) {
  const pin = request.headers.get("x-officer-pin");
  return pin === process.env.OFFICER_PIN;
}

// GET — list all side wars (active + inactive) for admin UI
export async function GET(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const sql = getDb();
  const rows = await sql`SELECT * FROM side_wars ORDER BY created_at DESC`;
  return NextResponse.json({ wars: rows });
}

// POST — create a new side war entry
export async function POST(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { clan_name, clan_tag, clan_link, start_time } = await request.json().catch(() => ({}));
  if (!clan_name || !clan_tag || !clan_link || !start_time) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const sql = getDb();
  const [row] = await sql`
    INSERT INTO side_wars (clan_name, clan_tag, clan_link, start_time)
    VALUES (${clan_name}, ${clan_tag}, ${clan_link}, ${start_time})
    RETURNING *
  `;
  return NextResponse.json({ war: row });
}

// PATCH — update a side war entry (toggle active, update fields)
export async function PATCH(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id, ...fields } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const sql = getDb();
  const allowed = ["clan_name", "clan_tag", "clan_link", "start_time", "is_active"];
  const updates = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.includes(k)));
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  const [row] = await sql`
    UPDATE side_wars SET ${sql(updates)} WHERE id = ${id} RETURNING *
  `;
  return NextResponse.json({ war: row });
}

// DELETE — remove a side war entry
export async function DELETE(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const sql = getDb();
  await sql`DELETE FROM side_wars WHERE id = ${id}`;
  return NextResponse.json({ deleted: true });
}
