import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function checkPin(request) {
  const pin = request.headers.get("x-officer-pin");
  return pin === process.env.OFFICER_PIN;
}

// GET — list all saved side war clans for admin UI
export async function GET(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const sql = getDb();
  const rows = await sql`SELECT * FROM side_wars ORDER BY created_at DESC`;
  return NextResponse.json({ wars: rows });
}

// POST — save a clan (start_time optional)
export async function POST(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { clan_name, clan_tag, clan_link, start_time } = await request.json().catch(() => ({}));
  if (!clan_name || !clan_tag || !clan_link) {
    return NextResponse.json({ error: "Clan name, tag and link are required" }, { status: 400 });
  }
  const sql = getDb();
  const [row] = await sql`
    INSERT INTO side_wars (clan_name, clan_tag, clan_link, start_time)
    VALUES (${clan_name}, ${clan_tag}, ${clan_link}, ${start_time || null})
    RETURNING *
  `;
  return NextResponse.json({ war: row });
}

// PATCH — update fields or toggle active
// Handles: set start_time, toggle is_active, update clan details
export async function PATCH(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const { id, action, ...fields } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const sql = getDb();

  if (action === "toggle") {
    // Check if start_time is set before allowing activation
    const [current] = await sql`SELECT * FROM side_wars WHERE id = ${id}`;
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!current.is_active && !current.start_time) {
      return NextResponse.json({ error: "Set a start time before activating" }, { status: 400 });
    }
    const [row] = await sql`
      UPDATE side_wars SET is_active = ${!current.is_active} WHERE id = ${id} RETURNING *
    `;
    return NextResponse.json({ war: row });
  }

  if (action === "set_time") {
    const { start_time } = fields;
    const [row] = await sql`
      UPDATE side_wars SET start_time = ${start_time || null} WHERE id = ${id} RETURNING *
    `;
    return NextResponse.json({ war: row });
  }

  if (action === "update") {
    const { clan_name, clan_tag, clan_link } = fields;
    const [row] = await sql`
      UPDATE side_wars
      SET clan_name = ${clan_name}, clan_tag = ${clan_tag}, clan_link = ${clan_link}
      WHERE id = ${id} RETURNING *
    `;
    return NextResponse.json({ war: row });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// DELETE — remove a saved clan entirely
export async function DELETE(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const sql = getDb();
  await sql`DELETE FROM side_wars WHERE id = ${id}`;
  return NextResponse.json({ deleted: true });
}
