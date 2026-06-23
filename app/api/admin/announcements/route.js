import { NextResponse } from "next/server";
import { getWebhooks, addWebhook, deleteWebhook } from "@/lib/pool";

function checkPin(request) {
  return request.headers.get("x-officer-pin") === process.env.OFFICER_PIN;
}

export async function GET(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const webhooks = await getWebhooks();
  return NextResponse.json({ webhooks });
}

export async function POST(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { label, webhookUrl, channel } = await request.json().catch(() => ({}));
  if (!label || !webhookUrl) return NextResponse.json({ error: "label and webhookUrl required" }, { status: 400 });
  const webhook = await addWebhook(label, webhookUrl, channel);
  return NextResponse.json({ webhook });
}

export async function DELETE(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteWebhook(id);
  return NextResponse.json({ deleted: true });
}
