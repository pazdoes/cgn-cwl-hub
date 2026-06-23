import { NextResponse } from "next/server";
import { getWebhooks, logAnnouncement } from "@/lib/pool";
import { auth } from "@/auth";

// Sends a fully-formed Discord embed to the selected webhook.
// Item 34 fix: link buttons are now sent as Discord Components V2
// (a separate `components` array with flags: 32768) rather than being
// embedded inside the embed JSON, which Discord silently ignores.

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

  // Extract _button from embed — it's our internal field, not a Discord field
  const { _button, ...cleanEmbed } = embed;

  // Build the Discord message payload
  const payload = {
    embeds: [cleanEmbed],
    ...(content && { content }),
    ...(username && { username }),
    ...(avatarUrl && { avatar_url: avatarUrl }),
  };

  // Add link button as Components V2 if present
  // This is the correct Discord API approach — buttons live in `components`,
  // not inside the embed object. Using flags: 32768 (IS_COMPONENTS_V2) enables
  // the new components system that supports link buttons via webhooks.
  if (_button?.label && _button?.url) {
    payload.components = [
      {
        type: 1, // Action Row
        components: [
          {
            type: 2,  // Button
            style: 5, // Link style
            label: _button.label,
            url: _button.url,
          },
        ],
      },
    ];
    payload.flags = 32768; // IS_COMPONENTS_V2
  }

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

  // Log it
  let sentBy = null;
  try {
    const session = await auth();
    sentBy = session?.user?.name || null;
  } catch { /* non-fatal */ }

  await logAnnouncement(webhookId, embed.title || null, embed, sentBy);

  return NextResponse.json({ sent: true });
}
