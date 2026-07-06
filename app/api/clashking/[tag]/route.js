import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const CLASHKING_BASE = "https://api.clashk.ing";

export async function GET(request, { params }) {
  const { tag } = await params;
  const playerTag = tag.startsWith("#") ? tag : `#${tag}`;
  const encodedTag = encodeURIComponent(playerTag);
  const sql = getDb();

  try {
    // Check DB cache first
    const [cached] = await sql`
      SELECT data, captured_at
      FROM clashking_cache
      WHERE player_tag = ${playerTag}
      ORDER BY captured_at DESC
      LIMIT 1
    `;

    const isFresh = cached &&
      (Date.now() - new Date(cached.captured_at).getTime()) < CACHE_TTL_MS;

    if (isFresh) {
      return NextResponse.json({ data: cached.data, cached: true, cachedAt: cached.captured_at });
    }

    // Fetch fresh from ClashKing
    const res = await fetch(`${CLASHKING_BASE}/player/${encodedTag}/stats`, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Player not found on ClashKing" }, { status: 404 });
    }

    const raw = await res.json();

    // Store in DB cache
    await sql`
      INSERT INTO clashking_cache (player_tag, data)
      VALUES (${playerTag}, ${JSON.stringify(raw)})
    `;

    return NextResponse.json({ data: raw, cached: false, cachedAt: new Date().toISOString() });

  } catch (err) {
    console.error("ClashKing route error:", err);
    return NextResponse.json({ error: "Failed to fetch ClashKing data" }, { status: 500 });
  }
}
