import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getOpenPoolSeason } from "@/lib/season";

export async function GET(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const sql = getDb();
  const season = await getOpenPoolSeason();

  const members = await sql`
    SELECT
      a.player_tag,
      a.player_name,
      a.town_hall_level,
      a.discord_id,
      a.discord_username,
      a.api_token_verified,
      a.verified_at,
      COALESCE(a.active, true) as active,
      a.current_clan_tag,
      a.current_clan_name,
      pe.assigned_clan,
      pe.status,
      CASE WHEN pe.player_tag IS NOT NULL THEN true ELSE false END AS in_pool
    FROM accounts a
    LEFT JOIN pool_entries pe
      ON pe.player_tag = a.player_tag
      AND pe.season = ${season}
    ORDER BY a.town_hall_level DESC NULLS LAST, a.player_name ASC
  `;

  return NextResponse.json({ members, season });
}

export async function PATCH(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json();
  const { playerTag, action, active } = body;
  if (!playerTag || !action) return NextResponse.json({ error: "playerTag and action required" }, { status: 400 });

  const sql = getDb();

  if (action === "setActive") {
    await sql`UPDATE accounts SET active = ${active} WHERE player_tag = ${playerTag}`;
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { playerTag } = await request.json();
  if (!playerTag) return NextResponse.json({ error: "playerTag required" }, { status: 400 });

  const sql = getDb();
  await sql`DELETE FROM accounts WHERE player_tag = ${playerTag}`;
  return NextResponse.json({ ok: true });
}
