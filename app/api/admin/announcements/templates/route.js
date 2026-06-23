import { NextResponse } from "next/server";
import { getAnnouncementTemplates, saveAnnouncementTemplate, deleteAnnouncementTemplate } from "@/lib/pool";

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
  const { name, webhookId, embedJson, username, avatarUrl } = await request.json().catch(() => ({}));
  if (!name || !embedJson) return NextResponse.json({ error: "name and embedJson required" }, { status: 400 });
  const template = await saveAnnouncementTemplate({ name, webhookId, embedJson, username, avatarUrl });
  return NextResponse.json({ template });
}

export async function DELETE(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteAnnouncementTemplate(id);
  return NextResponse.json({ deleted: true });
}
