import { NextResponse } from "next/server";
import { getWebhooks } from "@/lib/pool";

// Posts the season recap share card image to a Discord webhook as a native attachment
// Accepts multipart/form-data: { webhookId, image (PNG file), season }
export async function POST(request) {
  try {
    const pin = request.headers.get("x-officer-pin");
    if (pin !== process.env.OFFICER_PIN) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const formData = await request.formData();
    const webhookId = formData.get("webhookId");
    const image = formData.get("image"); // File/Blob
    const season = formData.get("season") || "Season Recap";

    if (!webhookId || !image) {
      return NextResponse.json({ error: "webhookId and image required" }, { status: 400 });
    }

    const webhooks = await getWebhooks();
    const webhook = webhooks.find(w => Number(w.id) === Number(webhookId));
    if (!webhook) return NextResponse.json({ error: "Webhook not found" }, { status: 404 });

    const rawUrl = webhook.webhook_url ?? webhook.webhookUrl;
    if (!rawUrl) return NextResponse.json({ error: "Webhook URL missing" }, { status: 500 });

    // Forward as multipart to Discord
    const CGN_AVATAR = "https://cdn.discordapp.com/attachments/1480200113082208346/1484473662198251692/IMG_0364.png?ex=6a477755&is=6a4625d5&hm=439a8a5863af157f40fc94811e8f195e2a2a0cf649c94c2a24bf2c857c15e6d3&";
    const discordForm = new FormData();
    discordForm.append("file", image, `cgn-recap-${season.toLowerCase().replace(/\s+/g, "-")}.png`);
    discordForm.append("payload_json", JSON.stringify({
      content: `📊 **${season}** — CGN Alliance Season Recap`,
      username: "Cognition {CGN}",
      avatar_url: CGN_AVATAR,
    }));

    const discordRes = await fetch(rawUrl.replace(/\?.*$/, ""), {
      method: "POST",
      body: discordForm,
    });

    if (!discordRes.ok) {
      const err = await discordRes.text();
      return NextResponse.json({ error: `Discord rejected: ${err}` }, { status: 502 });
    }

    return NextResponse.json({ posted: true });

  } catch (e) {
    return NextResponse.json({ error: `Error: ${e.message}` }, { status: 500 });
  }
}
