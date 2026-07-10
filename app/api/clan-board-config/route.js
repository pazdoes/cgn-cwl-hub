import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();

  // Get all alliance clans with board config
  const allianceClans = await sql`
    SELECT 
      c.clan_tag, c.clan_name, c.cwl_rank,
      COALESCE(bc.included, false) as included,
      COALESCE(bc.seed_wins, 0)   as seed_wins,
      COALESCE(bc.seed_draws, 0)  as seed_draws,
      COALESCE(bc.seed_losses, 0) as seed_losses,
      bc.id as config_id,
      false as is_side_war
    FROM clans c
    LEFT JOIN clan_info_board_config bc ON bc.clan_tag = c.clan_tag
    WHERE c.cwl_absent = false OR c.cwl_absent IS NULL
  `;

  // Get side war clans with board config
  const sideWarClans = await sql`
    SELECT DISTINCT ON (sw.clan_tag)
      sw.clan_tag, sw.clan_name, null as cwl_rank,
      COALESCE(bc.included, false) as included,
      COALESCE(bc.seed_wins, 0)   as seed_wins,
      COALESCE(bc.seed_draws, 0)  as seed_draws,
      COALESCE(bc.seed_losses, 0) as seed_losses,
      bc.id as config_id,
      true as is_side_war
    FROM side_wars sw
    LEFT JOIN clan_info_board_config bc ON bc.clan_tag = sw.clan_tag
    ORDER BY sw.clan_tag, sw.created_at DESC
  `;

  const clans = [...allianceClans, ...sideWarClans]
    .sort((a, b) => a.clan_name.localeCompare(b.clan_name));

  return NextResponse.json({ clans });
}

export async function POST(request) {
  const sql  = getDb();
  const body = await request.json();
  const { pin, clan_tag, clan_name, included, seed_wins, seed_draws, seed_losses } = body;

  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  await sql`
    INSERT INTO clan_info_board_config (clan_tag, clan_name, included, seed_wins, seed_draws, seed_losses)
    VALUES (${clan_tag}, ${clan_name}, ${included ?? true}, ${seed_wins ?? 0}, ${seed_draws ?? 0}, ${seed_losses ?? 0})
    ON CONFLICT (clan_tag) DO UPDATE SET
      clan_name   = EXCLUDED.clan_name,
      included    = EXCLUDED.included,
      seed_wins   = EXCLUDED.seed_wins,
      seed_draws  = EXCLUDED.seed_draws,
      seed_losses = EXCLUDED.seed_losses,
      updated_at  = now()
  `;

  return NextResponse.json({ success: true });
}
