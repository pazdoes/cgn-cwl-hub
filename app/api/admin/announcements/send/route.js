import { NextResponse } from "next/server";
import { getWebhooks, logAnnouncement } from "@/lib/pool";
import { auth } from "@/auth";

export async function POST(request) {
  try {
    const pin = request.headers.get("x-officer-pin");
    if (pin !== process.env.OFFICER_PIN) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { webhookId, embed, content, username, avatarUrl } = body;

    if (!webhookId || !embed) {
      return NextResponse.json({ error: "webhookId and embed required" }, { status: 400 });
    }

    let webhooks;
    try {
      webhooks = await getWebhooks();
    } catch (e) {
      console.error("getWebhooks failed:", e.message);
      return NextResponse.json({ error: `DB error: ${e.message}` }, { status: 500 });
    }

    const webhook = webhooks.find(w => Number(w.id) === Number(webhookId));
    if (!webhook) {
      console.error("Webhook not found. IDs available:", webhooks.map(w => w.id), "Looking for:", webhookId);
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    const rawUrl = webhook.webhook_url ?? webhook.webhookUrl;
    if (!rawUrl) {
      console.error("Webhook URL missing. Keys:", Object.keys(webhook), "Values:", JSON.stringify(webhook));
      return NextResponse.json({ error: `Webhook URL missing. Keys: ${Object.keys(webhook).join(", ")}` }, { status: 500 });
    }

    const { _button, ...cleanEmbed } = embed;

    const payload = {
      embeds: [cleanEmbed],
      ...(content && { content }),
      ...(username && { username }),
      ...(avatarUrl && { avatar_url: avatarUrl }),
    };

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

    const webhookUrl = new URL(rawUrl);
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
      console.error("Discord rejected:", err);
      return NextResponse.json({ error: `Discord rejected: ${err}` }, { status: 502 });
    }

    let sentBy = null;
    try {
      const session = await auth();
      sentBy = session?.user?.name || null;
    } catch { /* non-fatal */ }

    await logAnnouncement(Number(webhookId), embed.title || null, embed, sentBy);

    return NextResponse.json({ sent: true });

  } catch (e) {
    console.error("Unhandled error in send route:", e.message, e.stack);
    return NextResponse.json({ error: `Unhandled error: ${e.message}` }, { status: 500 });
  }
}
