import { NextResponse } from "next/server";
import { getWebhooks } from "@/lib/pool";

const CGN_AVATAR = "https://cdn.discordapp.com/attachments/1480200113082208346/1484473662198251692/IMG_0364.png?ex=6a477755&is=6a4625d5&hm=439a8a5863af157f40fc94811e8f195e2a2a0cf649c94c2a24bf2c857c15e6d3&";

export async function POST(request) {
  try {
    const pin = request.headers.get("x-officer-pin");
    if (pin !== process.env.OFFICER_PIN) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const formData = await request.formData();
    const webhookId = formData.get("webhookId");
    const mode = formData.get("mode") || "image";

    if (!webhookId) return NextResponse.json({ error: "webhookId required" }, { status: 400 });

    const webhooks = await getWebhooks();
    const webhook = webhooks.find(w => Number(w.id) === Number(webhookId));
    if (!webhook) return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    const rawUrl = ((webhook.webhook_url ?? webhook.webhookUrl) || "").replace(/\?.*$/, "");
    if (!rawUrl) return NextResponse.json({ error: "Webhook URL missing" }, { status: 500 });

    if (mode === "direct") {
      // Single embed with one image attachment — used for sequential embed posting
      const image = formData.get("image");
      const embedJson = formData.get("embedJson");
      const content = formData.get("content") || "";
      if (!image || !embedJson) return NextResponse.json({ error: "image and embedJson required" }, { status: 400 });

      const embed = JSON.parse(embedJson);
      const filename = image.name || "cgn-recap.png";

      const discordForm = new FormData();
      discordForm.append("file", image, filename);
      discordForm.append("payload_json", JSON.stringify({
        username: "Cognition {CGN}",
        avatar_url: CGN_AVATAR,
        ...(content ? { content } : {}),
        embeds: [embed],
      }));

      const discordRes = await fetch(rawUrl, { method: "POST", body: discordForm });
      if (!discordRes.ok) {
        const err = await discordRes.text();
        return NextResponse.json({ error: `Discord rejected: ${err}` }, { status: 502 });
      }
      return NextResponse.json({ posted: true });

    } else {
      // Image only — existing behaviour preserved exactly
      const season = formData.get("season") || "Season Recap";
      const rolePing = formData.get("rolePing") || "";
      const image = formData.get("image");
      if (!image) return NextResponse.json({ error: "image required" }, { status: 400 });

      const discordForm = new FormData();
      discordForm.append("file", image, `cgn-recap-${season.toLowerCase().replace(/\s+/g, "-")}.png`);
      discordForm.append("payload_json", JSON.stringify({
        username: "Cognition {CGN}",
        avatar_url: CGN_AVATAR,
        ...(rolePing ? { content: rolePing } : {}),
      }));

      const discordRes = await fetch(rawUrl, { method: "POST", body: discordForm });
      if (!discordRes.ok) {
        const err = await discordRes.text();
        return NextResponse.json({ error: `Discord rejected: ${err}` }, { status: 502 });
      }
      return NextResponse.json({ posted: true });
    }

  } catch (e) {
    return NextResponse.json({ error: `Error: ${e.message}` }, { status: 500 });
  }
}
