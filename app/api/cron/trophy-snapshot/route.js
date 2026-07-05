import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getPlayer } from "@/lib/coc";

// Chunk array into batches
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const sql = getDb();
  const mode = request.nextUrl?.searchParams?.get("mode") || "weekly";
  // mode=weekly  → fetch all registered players (Monday 06:00 UTC job)
  // mode=legend  → fetch only Legend I players (daily 06:00 UTC job)

  // ── Get registered player tags from accounts ──
  const accounts = await sql`
    SELECT player_tag FROM accounts
    WHERE player_tag IS NOT NULL AND player_tag != ''
  `;

  if (accounts.length === 0) {
    return NextResponse.json({ fetched: 0, skipped: 0, message: "No registered players" });
  }

  let tags = accounts.map(a => a.player_tag);

  // For legend mode — filter to only players whose latest cache has Legend I league
  if (mode === "legend") {
    const legendTags = await sql`
      SELECT DISTINCT ON (player_tag) player_tag, data->'league'->>'name' as league_name
      FROM player_army_cache
      WHERE player_tag = ANY(${tags})
      ORDER BY player_tag, captured_at DESC
    `;
    tags = legendTags
      .filter(r => r.league_name && r.league_name.includes("Legend I"))
      .map(r => r.player_tag);

    if (tags.length === 0) {
      return NextResponse.json({ fetched: 0, skipped: 0, message: "No Legend I players found" });
    }
  }

  // ── Fetch in batches of 5 to stay well within 30s ──
  const batches = chunk(tags, 5);
  let fetched = 0;
  let skipped = 0;
  const errors = [];

  for (const batch of batches) {
    await Promise.all(batch.map(async tag => {
      try {
        const player = await getPlayer(tag);
        if (!player || player.reason) { skipped++; return; }

        // Build minimal snapshot — just the fields we need for trophy tracking
        const snapshot = {
          name: player.name,
          tag: player.tag,
          townHallLevel: player.townHallLevel,
          trophies: player.trophies,
          bestTrophies: player.bestTrophies,
          expLevel: player.expLevel,
          warStars: player.warStars,
          donations: player.donations,
          donationsReceived: player.donationsReceived,
          clan: player.clan ? { name: player.clan.name, tag: player.clan.tag, badgeUrl: player.clan.badgeUrls?.small } : null,
          role: player.role || null,
          league: player.leagueTier
            ? { name: player.leagueTier.name, iconUrl: player.leagueTier.iconUrls?.small }
            : null,
          // Army fields — minimal for snapshot purposes
          heroes: (player.heroes || []).filter(h => h.village === "home").map(h => ({ name: h.name, level: h.level, maxLevel: h.maxLevel })),
          heroEquipment: (player.heroEquipment || []).map(e => ({ name: e.name, level: e.level, maxLevel: e.maxLevel })),
          troops: [],
          spells: [],
          siegeMachines: [],
          pets: [],
        };

        // Insert-only — never overwrite existing rows
        await sql`
          INSERT INTO player_army_cache (player_tag, data)
          VALUES (${tag}, ${JSON.stringify(snapshot)})
        `;
        fetched++;
      } catch (err) {
        errors.push({ tag, error: err.message });
        skipped++;
      }
    }));
  }

  return NextResponse.json({
    mode,
    fetched,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  });
}
