import { NextResponse } from "next/server";
import { getWebhooks, logAnnouncement } from "@/lib/pool";
import { auth } from "@/auth";

// Sends a fully-formed Discord embed to the selected webhook and logs
// the announcement to announcement_history. The embed JSON is built
// entirely on the client (the announcements page) and sent here as-is —
// this route's job is just to forward it to Discord and record it.
export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { webhookId, embed, content, username, avatarUrl } = body;

  if (!webhookId || !embed) {
    return NextResponse.json({ error: "webhookId and embed required" }, { status: 400 });
  }

  // Fetch the webhook URL from Neon — never trust a URL from the client
  const webhooks = await getWebhooks();
  const webhook = webhooks.find(w => w.id === webhookId);
  if (!webhook) return NextResponse.json({ error: "Webhook not found" }, { status: 404 });

  // Build the Discord message payload
  const payload = {
    embeds: [embed],
    ...(content && { content }),
    ...(username && { username }),
    ...(avatarUrl && { avatar_url: avatarUrl }),
  };

  // Post to Discord
  const discordRes = await fetch(webhook.webhook_url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!discordRes.ok) {
    const err = await discordRes.text();
    return NextResponse.json(
      { error: `Discord rejected the message: ${err}` },
      { status: 502 }
    );
  }

  // Log it — get admin's Discord username if signed in
  let sentBy = null;
  try {
    const session = await auth();
    sentBy = session?.user?.name || null;
  } catch { /* non-fatal */ }

  await logAnnouncement(webhookId, embed.title || null, embed, sentBy);

  return NextResponse.json({ sent: true });
}
