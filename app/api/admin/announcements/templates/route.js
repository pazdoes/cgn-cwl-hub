import { NextResponse } from "next/server";
import { getAnnouncementTemplates, saveAnnouncementTemplate, updateAnnouncementTemplate } from "@/lib/pool";

function checkPin(request) {
  return request.headers.get("x-officer-pin") === process.env.OFFICER_PIN;
}

export async function GET(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const templates = await getAnnouncementTemplates();
  return NextResponse.json({ templates });
}

export async function POST(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const { action, id, name, webhookId, embedJson, username, avatarUrl } = body;

  if (action === "use") {
    // Record usage — update use_count and last_used_at
    const { getDb } = await import("@/lib/db");
    const sql = getDb();
    await sql`UPDATE announcement_templates SET use_count = use_count + 1, last_used_at = now() WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  }

  if (!name || !embedJson) return NextResponse.json({ error: "name and embedJson required" }, { status: 400 });
  const template = await saveAnnouncementTemplate({ name, webhookId: webhookId || null, embedJson, username: username || null, avatarUrl: avatarUrl || null });
  return NextResponse.json({ template });
}

// PATCH — overwrite an existing template
export async function PATCH(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const { id, name, webhookId, embedJson, username, avatarUrl } = body;
  if (!id || !name || !embedJson) return NextResponse.json({ error: "id, name and embedJson required" }, { status: 400 });
  const template = await updateAnnouncementTemplate(id, { name, webhookId: webhookId || null, embedJson, username: username || null, avatarUrl: avatarUrl || null });
  return NextResponse.json({ template });
}

export async function DELETE(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { getDb } = await import("@/lib/db");
  const sql = getDb();
  await sql`DELETE FROM announcement_templates WHERE id = ${id}`;
  return NextResponse.json({ deleted: true });
}
