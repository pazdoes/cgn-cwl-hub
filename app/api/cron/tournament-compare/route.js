import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Runs Monday 06:30 UTC
// Compares pre-reset (04:45) and post-reset (06:00) snapshots
// Derives promoted/stayed/demoted and stores in tournament_results

function leagueTierNumber(name) {
  if (!name) return 0;
  if (name === "Legend I") return 103;
  if (name === "Legend II") return 102;
  if (name === "Legend III") return 101;
  const m = name.match(/(\d+)$/);
  return m ? parseInt(m[1]) : 0;
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const sql = getDb();

  // Get today's Monday date (week_ending)
  const now = new Date();
  const weekEnding = now.toISOString().split("T")[0]; // YYYY-MM-DD

  // Get all registered player tags
  const accounts = await sql`
    SELECT player_tag FROM accounts
    WHERE player_tag IS NOT NULL AND player_tag != ''
  `;

  const tags = accounts.map(a => a.player_tag);
  if (tags.length === 0) {
    return NextResponse.json({ processed: 0, message: "No registered players" });
  }

  // Get pre-reset snapshot (captured between 04:30-05:15 UTC today)
  const preSnapshots = await sql`
    SELECT DISTINCT ON (player_tag)
      player_tag,
      (data->>'trophies')::int   AS trophies,
      data->'league'->>'name'    AS league,
      data->>'name'              AS player_name,
      (data->>'townHallLevel')::int AS th_level,
      data->'clan'->>'name'      AS clan_name,
      data->'clan'->>'tag'       AS clan_tag,
      captured_at
    FROM player_army_cache
    WHERE player_tag = ANY(${tags})
      AND captured_at >= (NOW()::date + INTERVAL '4 hours 30 minutes')
      AND captured_at < (NOW()::date + INTERVAL '5 hours 15 minutes')
    ORDER BY player_tag, captured_at DESC
  `;

  // Get post-reset snapshot (captured between 05:45-06:30 UTC today)
  const postSnapshots = await sql`
    SELECT DISTINCT ON (player_tag)
      player_tag,
      data->'league'->>'name' AS league,
      captured_at
    FROM player_army_cache
    WHERE player_tag = ANY(${tags})
      AND captured_at >= (NOW()::date + INTERVAL '5 hours 45 minutes')
      AND captured_at < (NOW()::date + INTERVAL '6 hours 30 minutes')
    ORDER BY player_tag, captured_at DESC
  `;

  const postMap = {};
  for (const s of postSnapshots) postMap[s.player_tag] = s;

  let processed = 0;
  let skipped = 0;
  const results = [];

  for (const pre of preSnapshots) {
    const post = postMap[pre.player_tag];
    if (!post) { skipped++; continue; }

    const preTier = leagueTierNumber(pre.league);
    const postTier = leagueTierNumber(post.league);

    let result = "stayed";
    if (postTier > preTier) result = "promoted";
    else if (postTier < preTier) result = "demoted";

    // Upsert — if already exists for this week, update
    await sql`
      INSERT INTO tournament_results (
        player_tag, player_name, week_ending,
        pre_trophies, pre_league, post_league,
        result, clan_name, clan_tag, th_level
      ) VALUES (
        ${pre.player_tag}, ${pre.player_name}, ${weekEnding},
        ${pre.trophies}, ${pre.league}, ${post.league},
        ${result}, ${pre.clan_name}, ${pre.clan_tag}, ${pre.th_level}
      )
      ON CONFLICT (player_tag, week_ending)
      DO UPDATE SET
        pre_trophies = EXCLUDED.pre_trophies,
        pre_league   = EXCLUDED.pre_league,
        post_league  = EXCLUDED.post_league,
        result       = EXCLUDED.result,
        captured_at  = now()
    `;

    results.push({ tag: pre.player_tag, name: pre.player_name, result, preTier, postTier });
    processed++;
  }

  const promoted = results.filter(r => r.result === "promoted").length;
  const stayed = results.filter(r => r.result === "stayed").length;
  const demoted = results.filter(r => r.result === "demoted").length;

  return NextResponse.json({
    weekEnding,
    processed,
    skipped,
    promoted,
    stayed,
    demoted,
  });
}
