import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getPlayer } from "@/lib/coc";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request, { params }) {
  const { tag } = await params;
  const playerTag = tag.startsWith("#") ? tag : `#${tag}`;
  const sql = getDb();

  try {
    // Check cache first
    const [cached] = await sql`
      SELECT data, captured_at
      FROM player_army_cache
      WHERE player_tag = ${playerTag}
      ORDER BY captured_at DESC
      LIMIT 1
    `;

    const isFresh = cached &&
      (Date.now() - new Date(cached.captured_at).getTime()) < CACHE_TTL_MS;

    if (isFresh) {
      return NextResponse.json({ army: cached.data, cached: true, cachedAt: cached.captured_at });
    }

    // Fetch fresh from CoC API
    const player = await getPlayer(playerTag);

    if (!player || player.reason) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Extract only home village units
    const army = {
      name: player.name,
      tag: player.tag,
      townHallLevel: player.townHallLevel,
      heroes: (player.heroes || []).filter(h => h.village === "home"),
      heroEquipment: player.heroEquipment || [],
      troops: (player.troops || []).filter(t => t.village === "home" && !t.superTroopIsActive),
      superTroops: (player.troops || []).filter(t => t.village === "home" && t.superTroopIsActive),
      spells: (player.spells || []).filter(s => s.village === "home"),
      siegeMachines: (player.troops || []).filter(t => t.village === "home" && isSiegeMachine(t.name)),
      pets: player.pets || [],
    };

    // Remove siege machines from troops
    army.troops = army.troops.filter(t => !isSiegeMachine(t.name));

    // Store in cache (insert — never overwrite)
    await sql`
      INSERT INTO player_army_cache (player_tag, data)
      VALUES (${playerTag}, ${JSON.stringify(army)})
    `;

    return NextResponse.json({ army, cached: false, cachedAt: new Date().toISOString() });

  } catch (err) {
    console.error("army route error:", err);
    return NextResponse.json({ error: "Failed to fetch army data" }, { status: 500 });
  }
}

const SIEGE_MACHINES = new Set([
  "Wall Wrecker", "Battle Blimp", "Stone Slammer", "Siege Barracks",
  "Log Launcher", "Flame Flinger", "Battle Drill",
]);

function isSiegeMachine(name) {
  return SIEGE_MACHINES.has(name);
}
