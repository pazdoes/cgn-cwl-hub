import { getRosterData } from "@/lib/sheets";

export async function GET() {
  try {
    const roster = await getRosterData();
    return Response.json(roster);
  } catch (err) {
    console.error("Failed to load roster:", err);
    return Response.json(
      { error: "Failed to load roster data" },
      { status: 502 }
    );
  }
}
