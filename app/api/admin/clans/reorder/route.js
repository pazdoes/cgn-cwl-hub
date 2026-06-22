import { NextResponse } from "next/server";
import { updateClanOrder } from "@/lib/pool";

// Persists a manual drag-and-drop reorder of the clan tiles on the
// admin pool page (item 14). PIN-gated since this is an admin action.
// Takes the full new order as a list of clan names — the frontend sends
// the complete reordered list after every drop, not a single from/to
// swap, matching how lib/pool.js's updateClanOrder is designed to
// write it (same pattern as the account reorder route, item 13).
export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { orderedNames } = body;

  if (!Array.isArray(orderedNames) || orderedNames.length === 0) {
    return NextResponse.json(
      { error: "Missing or invalid orderedNames" },
      { status: 400 }
    );
  }

  try {
    await updateClanOrder(orderedNames);
  } catch (err) {
    console.error("Clan reorder failed:", err);
    return NextResponse.json(
      { error: `Couldn't save new order: ${err.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ reordered: true });
}
