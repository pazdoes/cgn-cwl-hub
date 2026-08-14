import { NextResponse } from "next/server";
import { getAnnouncementTags, createAnnouncementTag, deleteAnnouncementTag } from "@/lib/pool";

function checkPin(request) {
  return request.headers.get("x-officer-pin") === process.env.OFFICER_PIN;
}

export async function GET(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const tags = await getAnnouncementTags();
  return NextResponse.json({ tags });
}

export async function POST(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { name } = await request.json().catch(() => ({}));
  if (!name || !name.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
  try {
    const tag = await createAnnouncementTag(name);
    return NextResponse.json({ tag });
  } catch (err) {
    if (err.code === "DUPLICATE_TAG") {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Failed to create announcement tag:", err);
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!checkPin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteAnnouncementTag(id);
  return NextResponse.json({ deleted: true });
}
