import { NextResponse } from "next/server";
import { getWebhooks, logAnnouncement } from "@/lib/pool";
import { auth } from "@/auth";

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

  const webhooks = await getWebhooks();
  // Coerce both sides to integer — Neon returns id as number, UI sends string
  const webhook = webhooks.find(w => Number(w.id) === Number(webhookId));
  if (!webhook) return NextResponse.json({ error: "Webhook not found" }, { status: 404 });

  // Strip internal _button field from embed before sending to Discord
  const { _button, ...cleanEmbed } = embed;

  const payload = {
    embeds: [cleanEmbed],
    ...(content && { content }),
    ...(username && { username }),
    ...(avatarUrl && { avatar_url: avatarUrl }),
  };

  // Add link button as a standard action row component
  if (_button?.label && _button?.url) {
    payload.components = [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: _button.emoji ? `${_button.emoji} ${_button.label}` : _button.label,
            url: _button.url,
          },
        ],
      },
    ];
  }

  const webhookUrl = new URL(webhook.webhook_url || webhook.webhookUrl);
  if (payload.components?.length) {
    webhookUrl.searchParams.set("with_components", "true");
  }
  webhookUrl.searchParams.set("wait", "true");

  const discordRes = await fetch(webhookUrl.toString(), {
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

  // Log to announcement_history — always after confirmed Discord success
  let sentBy = null;
  try {
    const session = await auth();
    sentBy = session?.user?.name || null;
  } catch { /* non-fatal */ }

  await logAnnouncement(Number(webhookId), embed.title || null, embed, sentBy);

  return NextResponse.json({ sent: true });
}
