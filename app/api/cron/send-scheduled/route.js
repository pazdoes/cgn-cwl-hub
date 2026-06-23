import { NextResponse } from "next/server";
import { getPendingScheduled, markScheduledSent, logAnnouncement, scheduleAnnouncement } from "@/lib/pool";

// Interval map — recurrence value to milliseconds
const INTERVALS = {
  "24hr":   24 * 60 * 60 * 1000,
  "48hr":   48 * 60 * 60 * 1000,
  "7days":   7 * 24 * 60 * 60 * 1000,
  "14days": 14 * 24 * 60 * 60 * 1000,
  "30days": 30 * 24 * 60 * 60 * 1000,
};

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const pending = await getPendingScheduled();
  if (pending.length === 0) return NextResponse.json({ fired: 0 });

  let fired = 0;
  const errors = [];

  for (const item of pending) {
    try {
      const embed = typeof item.embed_json === "string"
        ? JSON.parse(item.embed_json)
        : item.embed_json;

      const { _button, ...cleanEmbed } = embed;

      const payload = {
        embeds: [cleanEmbed],
        ...(item.content && { content: item.content }),
        ...(item.username && { username: item.username }),
        ...(item.avatar_url && { avatar_url: item.avatar_url }),
      };

      if (_button?.label && _button?.url) {
        payload.components = [
          {
            type: 1,
            components: [
              { type: 2, style: 5, label: _button.label, url: _button.url },
            ],
          },
        ];
      }

      const discordRes = await fetch(item.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (discordRes.ok) {
        await markScheduledSent(item.id);
        await logAnnouncement(item.webhook_id, item.title, embed, "scheduled");
        fired++;

        // Handle recurrence — clone next entry if interval set and not past end date
        if (item.recurrence && INTERVALS[item.recurrence]) {
          const nextSendAt = new Date(
            new Date(item.send_at).getTime() + INTERVALS[item.recurrence]
          );

          const withinEnd = !item.recurrence_end ||
            nextSendAt <= new Date(item.recurrence_end);

          if (withinEnd) {
            await scheduleAnnouncement({
              webhookId: item.webhook_id,
              embedJson: embed,
              content: item.content,
              username: item.username,
              avatarUrl: item.avatar_url,
              sendAt: nextSendAt.toISOString(),
              createdBy: item.created_by,
              title: item.title,
              recurrence: item.recurrence,
              recurrenceEnd: item.recurrence_end || null,
            });
          }
        }
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
