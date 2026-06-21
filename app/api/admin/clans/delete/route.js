import { NextResponse } from "next/server";
import { countAssignedToClanAnySeason, deleteClan } from "@/lib/pool";
import { deleteClanTab } from "@/lib/sheetsWrite";

// Removes a clan entirely: deletes its Sheet tab and its Neon clans row.
// Hard-blocked if any pool_entries row, in ANY season, currently has this
// clan as its assigned_clan — per the confirmed safety requirement, an
// admin must unassign every rostered player first via the existing X
// button before deletion is allowed. This is a deliberate extra
// precaution against accidental deletion, on top of the "type the clan
// tag to confirm" pattern already enforced by the form itself.
//
// Order: safety check first (cheapest, no side effects) → delete the
// Sheet tab → delete the Neon row. If the Sheet tab deletion fails, the
// Neon row is left in place rather than partially completing the
// deletion — an admin can retry, and the clan still correctly appears on
// the admin page in the meantime rather than vanishing inconsistently.
export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { clanName } = body;

  if (!clanName) {
    return NextResponse.json({ error: "Missing clan name" }, { status: 400 });
  }

  let assignedCount;
  try {
    assignedCount = await countAssignedToClanAnySeason(clanName);
  } catch (err) {
    console.error("Couldn't check assigned players:", err);
    return NextResponse.json(
      { error: `Couldn't verify clan is empty: ${err.message}` },
      { status: 502 }
    );
  }

  if (assignedCount > 0) {
    return NextResponse.json(
      {
        error:
          `"${clanName}" still has ${assignedCount} player(s) assigned (across all ` +
          `seasons). Unassign everyone first before deleting this clan.`,
      },
      { status: 409 }
    );
  }

  try {
    await deleteClanTab(clanName);
  } catch (err) {
    console.error("Sheet tab deletion failed:", err);
    return NextResponse.json(
      { error: `Sheet tab deletion failed: ${err.message}` },
      { status: 502 }
    );
  }

  try {
    await deleteClan(clanName);
  } catch (err) {
    console.error("Neon clan deletion failed:", err);
    return NextResponse.json(
      {
        error:
          `The Sheet tab "${clanName}" was deleted, but removing it from the ` +
          `database failed: ${err.message}. Contact support — the clan may ` +
          `still appear on the admin page despite the tab being gone.`,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ clanName, deleted: true });
}
