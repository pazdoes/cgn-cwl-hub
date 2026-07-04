import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getPlayer } from "@/lib/coc";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const SIEGE_MACHINES = new Set([
  "Wall Wrecker", "Battle Blimp", "Stone Slammer", "Siege Barracks",
  "Log Launcher", "Flame Flinger", "Battle Drill",
]);

const PET_NAMES = new Set([
  "L.A.S.S.I", "Electro Owl", "Mighty Yak", "Unicorn", "Frosty",
  "Diggy", "Poison Lizard", "Phoenix", "Spirit Fox", "Angry Jelly",
  "Sneezy", "Gorilla", "Capybara", "Skeletal Dragon",
]);

function isSiegeMachine(name) { return SIEGE_MACHINES.has(name); }
function isPet(name) { return PET_NAMES.has(name); }

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
    const allHomeTroops = (player.troops || []).filter(t => t.village === "home");

    const army = {
      name: player.name,
      tag: player.tag,
      townHallLevel: player.townHallLevel,
      heroes: (player.heroes || []).filter(h => h.village === "home"),
      heroEquipment: player.heroEquipment || [],
      troops: allHomeTroops.filter(t => !t.superTroopIsActive && !isSiegeMachine(t.name) && !isPet(t.name)),
      superTroops: allHomeTroops.filter(t => t.superTroopIsActive),
      spells: (player.spells || []).filter(s => s.village === "home"),
      siegeMachines: allHomeTroops.filter(t => isSiegeMachine(t.name)),
      pets: allHomeTroops.filter(t => isPet(t.name)),
    };

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


