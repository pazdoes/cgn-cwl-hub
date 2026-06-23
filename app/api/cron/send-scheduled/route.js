import { NextResponse } from "next/server";
import { getPendingScheduled, markScheduledSent, logAnnouncement } from "@/lib/pool";

// This route is called every minute by Vercel's cron scheduler.
// It finds all scheduled_announcements where send_at <= now() and sent = false,
// fires each to its Discord webhook, then marks it sent.
// Protected by CRON_SECRET so only Vercel's scheduler can trigger it.

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const pending = await getPendingScheduled();

  if (pending.length === 0) {
    return NextResponse.json({ fired: 0 });
  }

  let fired = 0;
  const errors = [];

  for (const item of pending) {
    try {
      const embed = typeof item.embed_json === "string"
        ? JSON.parse(item.embed_json)
        : item.embed_json;

      // Extract button from embed if present — send as Components V2
      const { _button, ...cleanEmbed } = embed;

      const payload = {
        embeds: [cleanEmbed],
        ...(item.content && { content: item.content }),
        ...(item.username && { username: item.username }),
        ...(item.avatar_url && { avatar_url: item.avatar_url }),
      };

      // Add link button as Components V2 if present
      if (_button?.label && _button?.url) {
        payload.components = [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 5,
                label: _button.label,
                url: _button.url,
              },
            ],
          },
        ];
        payload.flags = 32768; // IS_COMPONENTS_V2
      }

      const discordRes = await fetch(item.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (discordRes.ok) {
        await markScheduledSent(item.id);
        await logAnnouncement(item.webhook_id, item.title, embed, `scheduled`);
        fired++;
      } else {
        const err = await discordRes.text();
        errors.push({ id: item.id, error: err });
      }
    } catch (e) {
      errors.push({ id: item.id, error: e.message });
    }
  }

  return NextResponse.json({ fired, errors: errors.length > 0 ? errors : undefined });
}
