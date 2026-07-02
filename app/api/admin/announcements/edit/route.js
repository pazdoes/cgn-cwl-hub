import { NextResponse } from "next/server";
import { getWebhooks } from "@/lib/pool";

// PATCH an existing Discord webhook message in place
// Requires the discord_message_id stored when the message was first sent
export async function POST(request) {
  try {
    const pin = request.headers.get("x-officer-pin");
    if (pin !== process.env.OFFICER_PIN) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { webhookId, messageId, embed, content, username, avatarUrl } = body;

    if (!webhookId || !messageId || !embed) {
      return NextResponse.json({ error: "webhookId, messageId and embed required" }, { status: 400 });
    }

    const webhooks = await getWebhooks();
    const webhook = webhooks.find(w => Number(w.id) === Number(webhookId));
    if (!webhook) return NextResponse.json({ error: "Webhook not found" }, { status: 404 });

    const rawUrl = webhook.webhook_url ?? webhook.webhookUrl;
    if (!rawUrl) return NextResponse.json({ error: "Webhook URL missing" }, { status: 500 });

    const { _button, ...cleanEmbed } = embed;

    const payload = {
      embeds: [cleanEmbed],
      ...(content !== undefined && { content: content || "" }),
    };

    if (_button?.label && _button?.url) {
      payload.components = [{
        type: 1,
        components: [{ type: 2, style: 5, label: _button.emoji ? `${_button.emoji} ${_button.label}` : _button.label, url: _button.url }],
      }];
    }

    // Build PATCH URL: /webhooks/{id}/{token}/messages/{message_id}
    const baseUrl = rawUrl.replace(/\?.*$/, "");
    const editUrl = new URL(`${baseUrl}/messages/${messageId}`);
    if (payload.components?.length) editUrl.searchParams.set("with_components", "true");

    const discordRes = await fetch(editUrl.toString(), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!discordRes.ok) {
      const err = await discordRes.text();
      return NextResponse.json({ error: `Discord rejected: ${err}` }, { status: 502 });
    }

    return NextResponse.json({ edited: true, messageId });

  } catch (e) {
    return NextResponse.json({ error: `Unhandled error: ${e.message}` }, { status: 500 });
  }
}
