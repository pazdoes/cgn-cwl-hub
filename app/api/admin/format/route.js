import { NextResponse } from "next/server";
import { getOpenPoolSeason } from "@/lib/season";
import { countConfirmed, setClanFormat } from "@/lib/pool";
import { writeClanFormatToSheet } from "@/lib/sheetsWrite";

const ALLOWED_FORMATS = [15, 30];

// Sets a clan's CWL Format (15 or 30). Blocked if switching down would put
// the clan's current Confirmed count over the new cap — admins must move
// excess players to Substitute first, per the agreed design.
export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { clan, format } = body;
  const numericFormat = Number(format);

  if (!clan || !ALLOWED_FORMATS.includes(numericFormat)) {
    return NextResponse.json(
      { error: "Missing clan or invalid format (must be 15 or 30)" },
      { status: 400 }
    );
  }

  const season = getOpenPoolSeason();
  const currentConfirmed = await countConfirmed(clan, season);

  if (currentConfirmed > numericFormat) {
    return NextResponse.json(
      {
        error: `${clan} currently has ${currentConfirmed} confirmed players — reduce to ${numericFormat} or fewer before switching to ${numericFormat}v${numericFormat}.`,
      },
      { status: 409 }
    );
  }

  try {
    await writeClanFormatToSheet({ clan, format: numericFormat });
  } catch (err) {
    console.error("Sheet CWL Format write failed:", err);
    return NextResponse.json(
      { error: `Sheet write failed: ${err.message}` },
      { status: 502 }
    );
  }

  try {
    await setClanFormat(clan, numericFormat);
  } catch (err) {
    console.error("DB CWL Format update failed (non-fatal):", err);
  }

  return NextResponse.json({ clan, format: numericFormat });
}
