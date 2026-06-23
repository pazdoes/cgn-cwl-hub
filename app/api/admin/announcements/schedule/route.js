import { NextResponse } from "next/server";
import { scheduleAnnouncement, getScheduledAnnouncements, cancelScheduled } from "@/lib/pool";
import { auth } from "@/auth";

function checkPin(request) {
  return request.headers.get("x-officer-pin") === process.env.OFFICER_PIN;
}

export async function GET(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const scheduled = await getScheduledAnnouncements();
  return NextResponse.json({ scheduled });
}

export async function POST(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const { webhookId, embed, content, username, avatarUrl, sendAt, recurrence, recurrenceEnd } = body;

  if (!webhookId || !embed || !sendAt) {
    return NextResponse.json({ error: "webhookId, embed, and sendAt required" }, { status: 400 });
  }

  const sendAtDate = new Date(sendAt);
  if (isNaN(sendAtDate.getTime()) || sendAtDate <= new Date()) {
    return NextResponse.json({ error: "sendAt must be a valid future datetime" }, { status: 400 });
  }

  // Validate recurrence value if provided
  const validRecurrences = ["24hr", "48hr", "7days", "14days", "30days"];
  if (recurrence && !validRecurrences.includes(recurrence)) {
    return NextResponse.json({ error: "Invalid recurrence value" }, { status: 400 });
  }

  let createdBy = null;
  try {
    const session = await auth();
    createdBy = session?.user?.name || null;
  } catch { /* non-fatal */ }

  const scheduled = await scheduleAnnouncement({
    webhookId,
    embedJson: embed,
    content,
    username,
    avatarUrl,
    sendAt: sendAtDate.toISOString(),
    createdBy,
    title: embed.title || null,
    recurrence: recurrence || null,
    recurrenceEnd: recurrenceEnd ? new Date(recurrenceEnd).toISOString() : null,
  });

  return NextResponse.json({ scheduled });
}

export async function DELETE(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await cancelScheduled(id);
  return NextResponse.json({ cancelled: true });
}
