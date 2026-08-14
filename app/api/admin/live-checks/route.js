import { NextResponse } from "next/server";
import { getLiveChecksCache } from "@/lib/pool";

// Fast, DB-only read of the last known compliance/connectivity results —
// never triggers a live CoC API call. Use /api/admin/live-checks/refresh
// (POST) to actually run the checks.
export async function GET(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const cache = await getLiveChecksCache();

  return NextResponse.json({
    compliance: cache ? { correctCount: cache.compliance_correct, totalRostered: cache.compliance_total } : null,
    connectivity: cache ? { connectedCount: cache.connected_count, totalMembers: cache.connected_total } : null,
    outsideAlliance: cache && cache.outside_alliance_count !== null ? { count: cache.outside_alliance_count } : null,
    checkedAt: cache?.checked_at || null,
  });
}
