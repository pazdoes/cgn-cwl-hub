import { NextResponse } from "next/server";
import { updateAccountOrder } from "@/lib/pool";
import { readOwnerSecret } from "@/lib/ownerCookie";

// Persists a manual drag-and-drop reorder of the requesting browser's own
// linked accounts (item 13). Takes the full new order as a list of
// player tags — the frontend sends the complete reordered list after
// every drop, not a single from/to swap, matching how
// lib/pool.js's updateAccountOrder is designed to write it.
//
// Ownership is checked via the owner_secret cookie, same pattern as
// every other account-scoped route (leave-pool, delete-account) — and
// updateAccountOrder itself ALSO scopes every UPDATE to this owner_secret
// as a second layer, so a crafted tag list can't silently reorder or
// otherwise touch an account this browser doesn't actually own.
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { orderedTags } = body;

  if (!Array.isArray(orderedTags) || orderedTags.length === 0) {
    return NextResponse.json({ error: "Missing or invalid orderedTags" }, { status: 400 });
  }

  const ownerSecret = await readOwnerSecret();
  if (!ownerSecret) {
    return NextResponse.json({ error: "Not verified on this device" }, { status: 401 });
  }

  try {
    await updateAccountOrder(ownerSecret, orderedTags);
  } catch (err) {
    console.error("Account reorder failed:", err);
    return NextResponse.json(
      { error: `Couldn't save new order: ${err.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ reordered: true });
}
