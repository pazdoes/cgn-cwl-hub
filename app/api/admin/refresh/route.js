import { revalidateTag } from "next/cache";
import { ROSTER_CACHE_TAG } from "@/lib/sheets";

// Officer-only: forces the roster cache to refresh on the next request.
// The PIN is re-checked here server-side every time — the frontend's
// "officer mode" flag is just a UI convenience, it grants no real access
// on its own. Even a tampered client still needs the real PIN to succeed.
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const pin = body?.pin || "";

  if (!process.env.OFFICER_PIN || pin !== process.env.OFFICER_PIN) {
    return Response.json({ error: "Invalid PIN" }, { status: 401 });
  }

  revalidateTag(ROSTER_CACHE_TAG);
  return Response.json({ refreshed: true });
}
