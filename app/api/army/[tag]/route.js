import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getPlayer } from "@/lib/coc";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const SIEGE_MACHINES = new Set([
  "Wall Wrecker", "Battle Blimp", "Stone Slammer", "Siege Barracks",
  "Log Launcher", "Flame Flinger", "Battle Drill", "Troop Launcher", "Sky Wagon",
]);

// Valid home village troops in correct display order — Regular then Dark
const TROOP_ORDER = [
  // Regular (Elixir) troops
  "Barbarian", "Archer", "Giant", "Goblin", "Wall Breaker", "Balloon",
  "Wizard", "Healer", "Dragon", "P.E.K.K.A", "Baby Dragon", "Miner",
  "Electro Dragon", "Yeti", "Dragon Rider", "Electro Titan", "Root Rider",
  "Thrower", "Meteor Golem",
  // Dark Elixir troops
  "Minion", "Hog Rider", "Valkyrie", "Golem", "Witch", "Lava Hound",
  "Bowler", "Ice Golem", "Headhunter", "Apprentice Warden", "Ruin Witch",
  "Druid", "Furnace",
];
const VALID_TROOPS = new Set(TROOP_ORDER);

// Valid spells in correct display order — Regular then Dark
const SPELL_ORDER = [
  // Regular (Elixir) spells
  "Lightning Spell", "Healing Spell", "Rage Spell", "Jump Spell",
  "Freeze Spell", "Clone Spell", "Invisibility Spell", "Recall Spell",
  "Revive Spell", "Totem Spell",
  // Dark spells
  "Poison Spell", "Earthquake Spell", "Haste Spell", "Skeleton Spell",
  "Bat Spell", "Overgrowth Spell", "Ice Block Spell", "Angry Spell",
];
const VALID_SPELLS = new Set(SPELL_ORDER);

const PET_NAMES = new Set([
  "L.A.S.S.I", "Electro Owl", "Mighty Yak", "Unicorn", "Frosty",
  "Diggy", "Poison Lizard", "Phoenix", "Spirit Fox", "Angry Jelly",
  "Sneezy", "Greedy Raven",
]);

// Canonical pet display order
const PET_ORDER = [
  "L.A.S.S.I", "Electro Owl", "Mighty Yak", "Unicorn", "Frosty",
  "Diggy", "Poison Lizard", "Phoenix", "Spirit Fox", "Angry Jelly",
  "Sneezy", "Greedy Raven",
];

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
      // Profile fields
      name: player.name,
      tag: player.tag,
      townHallLevel: player.townHallLevel,
      expLevel: player.expLevel,
      trophies: player.trophies,
      bestTrophies: player.bestTrophies,
      warStars: player.warStars,
      attackWins: player.attackWins,
      defenseWins: player.defenseWins,
      donations: player.donations,
      donationsReceived: player.donationsReceived,
      clan: player.clan ? { name: player.clan.name, tag: player.clan.tag, badgeUrl: player.clan.badgeUrls?.small } : null,
      role: player.role || null,
      league: player.leagueTier
        ? { name: player.leagueTier.name, iconUrl: player.leagueTier.iconUrls?.small }
        : null,
      // Army fields
      heroes: (player.heroes || []).filter(h => h.village === "home"),
      heroEquipment: player.heroEquipment || [],
      troops: (() => {
        const raw = allHomeTroops.filter(t => !t.superTroopIsActive && !isSiegeMachine(t.name) && !isPet(t.name) && VALID_TROOPS.has(t.name));
        return [...raw].sort((a, b) => {
          const oa = TROOP_ORDER.indexOf(a.name);
          const ob = TROOP_ORDER.indexOf(b.name);
          return (oa === -1 ? 99 : oa) - (ob === -1 ? 99 : ob);
        });
      })(),
      superTroops: allHomeTroops.filter(t => t.superTroopIsActive),
      spells: (() => {
        const raw = (player.spells || []).filter(s => s.village === "home" && VALID_SPELLS.has(s.name));
        return [...raw].sort((a, b) => {
          const oa = SPELL_ORDER.indexOf(a.name);
          const ob = SPELL_ORDER.indexOf(b.name);
          return (oa === -1 ? 99 : oa) - (ob === -1 ? 99 : ob);
        });
      })(),
      siegeMachines: allHomeTroops.filter(t => isSiegeMachine(t.name)),
      pets: (() => {
        const raw = allHomeTroops.filter(t => isPet(t.name));
        return [...raw].sort((a, b) => {
          const oa = PET_ORDER.indexOf(a.name);
          const ob = PET_ORDER.indexOf(b.name);
          return (oa === -1 ? 99 : oa) - (ob === -1 ? 99 : ob);
        });
      })(),
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


