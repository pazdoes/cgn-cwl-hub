import { NextResponse } from "next/server";
import { deleteClan } from "@/lib/pool";
import { deleteClanTab } from "@/lib/sheetsWrite";
import { getDb } from "@/lib/db";

export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { clanName } = body;

  if (!clanName) {
    return NextResponse.json({ error: "Missing clan name" }, { status: 400 });
  }

  const sql = getDb();

  // Clear all pool assignments for this clan across all seasons
  // preserves all player stats and historical data
  try {
    await sql`
      UPDATE pool_entries
      SET assigned_clan = NULL, status = NULL, assigned_at = NULL
      WHERE assigned_clan = ${clanName}
    `;
  } catch (err) {
    console.error("Failed to clear clan assignments:", err);
    return NextResponse.json(
      { error: `Failed to clear clan assignments: ${err.message}` },
      { status: 502 }
    );
  }

  // Delete Google Sheets tab
  try {
    await deleteClanTab(clanName);
  } catch (err) {
    console.error("Sheet tab deletion failed:", err);
    return NextResponse.json(
      { error: `Sheet tab deletion failed: ${err.message}` },
      { status: 502 }
    );
  }

  // Delete clan from Neon
  try {
    await deleteClan(clanName);
  } catch (err) {
    console.error("Neon clan deletion failed:", err);
    return NextResponse.json(
      { error: `Sheet tab deleted but database removal failed: ${err.message}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ clanName, deleted: true });
}
