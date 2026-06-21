import { NextResponse } from "next/server";
import { getPlayer } from "@/lib/coc";

// Batch-fetches Town Hall levels for a list of player tags, so the admin
// pool page and signup page can show a TH icon on each player pill without
// each page hand-rolling its own CoC API loop. Town Hall level isn't
// stored anywhere in Neon (accounts/pool_entries only track tag, name,
// owner, and assignment state), so this always reads live from the CoC
// API rather than a cached value — acceptable here since this route is
// only called on page load for a pool that's at most a few dozen players,
// not on every render.
//
// Failures for individual tags don't fail the whole request — a tag that
// errors (e.g. a stale/invalid tag) is simply omitted from the response,
// and the calling page falls back to no icon for that player rather than
// blocking the whole pill list.
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const tags = Array.isArray(body.tags) ? body.tags : [];

  if (tags.length === 0) {
    return NextResponse.json({ thLevels: {} });
  }

  const results = await Promise.all(
    tags.map(async (tag) => {
      try {
        const player = await getPlayer(tag);
        return [tag, player?.townHallLevel ?? null];
      } catch {
        return [tag, null];
      }
    })
  );

  const thLevels = Object.fromEntries(
    results.filter(([, level]) => level !== null)
  );

  return NextResponse.json({ thLevels });
}
