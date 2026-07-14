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
    const season = formData.get("season") || "Season Recap";
    const rolePing = formData.get("rolePing") || "";
    const mode = formData.get("mode") || "image"; // "image" | "embed"

    if (!webhookId) {
      return NextResponse.json({ error: "webhookId required" }, { status: 400 });
    }

    const webhooks = await getWebhooks();
    const webhook = webhooks.find(w => Number(w.id) === Number(webhookId));
    if (!webhook) return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    const rawUrl = ((webhook.webhook_url ?? webhook.webhookUrl) || "").replace(/\?.*$/, "");
    if (!rawUrl) return NextResponse.json({ error: "Webhook URL missing" }, { status: 500 });

    if (mode === "embed") {
      // Multi-embed mode — one embed per card, all in one webhook call
      const cardCount = parseInt(formData.get("cardCount") || "1");
      const embedTitle = formData.get("embedTitle") || "";
      const embedDescription = formData.get("embedDescription") || "";
      const embedColor = parseInt(formData.get("embedColor") || "7155673");
      const embedFooter = formData.get("embedFooter") || "";
      const embedTimestamp = formData.get("embedTimestamp") || null;
      const content = formData.get("content") || "";

      const embeds = [];
      const discordForm = new FormData();

      for (let i = 0; i < cardCount; i++) {
        const image = formData.get(`image_${i}`);
        const cardType = formData.get(`cardType_${i}`) || `card-${i}`;
        if (!image) continue;
        const filename = `cgn-recap-${cardType.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${i}.png`;
        discordForm.append(`files[${i}]`, image, filename);
        embeds.push({
          title: embedTitle || undefined,
          description: embedDescription || undefined,
          color: embedColor,
          image: { url: `attachment://${filename}` },
          footer: embedFooter ? { text: embedFooter } : undefined,
          timestamp: embedTimestamp || undefined,
        });
      }

      discordForm.append("payload_json", JSON.stringify({
        username: "Cognition {CGN}",
        avatar_url: CGN_AVATAR,
        content: content || undefined,
        embeds,
      }));

      const discordRes = await fetch(rawUrl, { method: "POST", body: discordForm });
      if (!discordRes.ok) {
        const err = await discordRes.text();
        return NextResponse.json({ error: `Discord rejected: ${err}` }, { status: 502 });
      }
      return NextResponse.json({ posted: true, embeds: embeds.length });

    } else {
      // Image only mode — single image, existing behaviour
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
