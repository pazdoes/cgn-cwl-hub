import { getDb } from "@/lib/db";
import { getClan } from "@/lib/coc";
import { getSheetTabs } from "@/lib/sheetsWrite";

// Officer-only sanity check for the three new pieces of infrastructure.
// Run this once after setting up env vars, before building anything that
// depends on them — it isolates "is the plumbing connected" from "is the
// feature logic correct", so failures are easy to pin down.
export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  if (body.pin !== process.env.OFFICER_PIN) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {};

  try {
    const sql = getDb();
    await sql`SELECT 1`;
    results.database = "ok";
  } catch (err) {
    results.database = `failed — ${err.message}`;
  }

  try {
    const tabs = await getSheetTabs();
    results.sheetsWriteAuth = `ok — found ${tabs.length} tabs: ${tabs.join(", ")}`;
  } catch (err) {
    results.sheetsWriteAuth = `failed — ${err.message}`;
  }

  if (body.testClanTag) {
    try {
      const clan = await getClan(body.testClanTag);
      results.cocApi = `ok — fetched "${clan.name}"`;
    } catch (err) {
      results.cocApi = `failed — ${err.message}`;
    }
  } else {
    results.cocApi = "skipped — include testClanTag in the request body to test";
  }

  return Response.json(results);
}
