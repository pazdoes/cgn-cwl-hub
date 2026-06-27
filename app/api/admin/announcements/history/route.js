import { NextResponse } from "next/server";
import { getAnnouncementHistory } from "@/lib/pool";

function checkPin(request) {
  return request.headers.get("x-officer-pin") === process.env.OFFICER_PIN;
}

export async function GET(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const history = await getAnnouncementHistory();
  return NextResponse.json({ history });
}
