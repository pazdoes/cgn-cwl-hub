import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request, { params }) {
  const { tag } = await params;
  const playerTag = tag.startsWith("#") ? tag : `#${tag}`;
  const sql = getDb();

  // Get the two most recent snapshots
  const snapshots = await sql`
    SELECT data, captured_at
    FROM player_army_cache
    WHERE player_tag = ${playerTag}
    ORDER BY captured_at DESC
    LIMIT 10
  `;

  if (snapshots.length < 2) {
    return NextResponse.json({ upgrades: [], snapshots: snapshots.length });
  }

  // Compare consecutive snapshots and collect upgrades
  const upgrades = [];
  const CATEGORIES = ["heroes","heroEquipment","troops","spells","siegeMachines","pets"];

  for (let i = 0; i < snapshots.length - 1; i++) {
    const newer = snapshots[i].data;
    const older = snapshots[i + 1].data;
    const date = snapshots[i].captured_at;

    for (const cat of CATEGORIES) {
      const newerUnits = newer[cat] || [];
      const olderUnits = older[cat] || [];
      for (const unit of newerUnits) {
        const prev = olderUnits.find(u => u.name === unit.name);
        if (prev && unit.level > prev.level) {
          upgrades.push({
            name: unit.name,
            category: cat,
            fromLevel: prev.level,
            toLevel: unit.level,
            maxLevel: unit.maxLevel,
            date,
          });
        }
        // New unit unlocked
        if (!prev && unit.level > 0) {
          upgrades.push({
            name: unit.name,
            category: cat,
            fromLevel: 0,
            toLevel: unit.level,
            maxLevel: unit.maxLevel,
            date,
            unlocked: true,
          });
        }
      }
    }
  }

  // Sort by date descending, deduplicate by name (keep most recent)
  const seen = new Set();
  const deduped = upgrades
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .filter(u => {
      if (seen.has(u.name + u.fromLevel + u.toLevel)) return false;
      seen.add(u.name + u.fromLevel + u.toLevel);
      return true;
    });

  return NextResponse.json({ upgrades: deduped, snapshots: snapshots.length });
}
