import { getRosterData } from "@/lib/sheets";

export async function GET() {

  const roster = await getRosterData();

  return Response.json(roster);

}