import { NextResponse } from "next/server";
import { getOpenPoolSeason, setCurrentSeason, getOpenPoolSeasonFromDate } from "@/lib/season";
import { getAllClanNames, getClanFallbackData, recordSeasonHistory, upsertPlayerCwlStats } from "@/lib/pool";
import { getClanWarLeagueGroup, getCwlWar } from "@/lib/coc";

// Closes the current CWL season and opens the next one.
// Item 35 addition: after recording CWL ranks, fetches each clan's
// league war group data from the CoC API and stores per-player stats
// into player_cwl_stats for the leaderboard.
export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  if (body.confirm !== "CONFIRM") {
    return NextResponse.json({ error: "Confirmation required" }, { status: 400 });
  }

  const closingSeason = await getOpenPoolSeason();

  // Step 1: record CWL ranks for all clans
  const clanNames = await getAllClanNames();
  try {
    const clanRanks = await Promise.all(
      clanNames.map(async (clanName) => {
        const data = await getClanFallbackData(clanName);
        return { clanName, cwlRank: data.cwl_rank || "Unranked" };
      })
    );
    await recordSeasonHistory(closingSeason, clanRanks);
  } catch (err) {
    console.error("Failed to record season history:", err);
    // Non-fatal — continue
  }

  // Step 2: capture per-player CWL war stats for the leaderboard
  try {
    const allPlayerStats = {};

    for (const clanName of clanNames) {
      const fallback = await getClanFallbackData(clanName);
      const clanTag = fallback.clan_tag;
      if (!clanTag) continue;

      const group = await getClanWarLeagueGroup(clanTag);
      if (!group) continue;

      // Collect all war tags across all rounds
      const warTags = [];
      for (const round of group.rounds || []) {
        for (const wt of round.warTags || []) {
          if (wt !== "#0") warTags.push(wt);
        }
      }

      // Fetch each war and extract attacks for this clan's members
      for (const warTag of warTags) {
        let war;
        try { war = await getCwlWar(warTag); } catch { continue; }
        if (!war || war.state === "notInWar") continue;

        // Determine which side is our clan
        const ourSide = war.clan?.tag === clanTag ? war.clan
          : war.opponent?.tag === clanTag ? war.opponent
          : null;
        const theirSide = ourSide === war.clan ? war.opponent : war.clan;
        if (!ourSide) continue;

        const teamSize = war.teamSize || 0;

        // Build defence lookup from opponent attacks
        const defenceMap = {}; // defenderTag -> { stars, destructionPct }
        for (const member of theirSide?.members || []) {
          for (const atk of member.attacks || []) {
            const def = defenceMap[atk.defenderTag] || { stars: 0, destructionPct: 0 };
            // Take the worst defence (highest stars conceded)
            if (atk.stars > def.stars || (atk.stars === def.stars && atk.destructionPercentage > def.destructionPct)) {
              defenceMap[atk.defenderTag] = { stars: atk.stars, destructionPct: atk.destructionPercentage };
            }
          }
        }

        for (const member of ourSide.members || []) {
          const tag = member.tag;
          if (!allPlayerStats[tag]) {
            allPlayerStats[tag] = {
              playerTag: tag,
              playerName: member.name,
              season: closingSeason,
              clanName,
              starsEarned: 0,
              destructionPct: 0,
              starsConceded: 0,
              defencePct: 0,
              attacksUsed: 0,
              attacksAvailable: 0,
              missedAttacks: 0,
              _atkCount: 0, // for averaging destruction %
              _defCount: 0,
            };
          }

          const ps = allPlayerStats[tag];
          // Attacks
          const attacks = member.attacks || [];
          ps.attacksAvailable += 1; // 1 attack per CWL war per player
          ps.attacksUsed += attacks.length > 0 ? 1 : 0;
          ps.missedAttacks += attacks.length === 0 ? 1 : 0;
          for (const atk of attacks) {
            ps.starsEarned += atk.stars;
            ps.destructionPct += atk.destructionPercentage;
            ps._atkCount++;
          }
          // Defence
          const def = defenceMap[tag];
          if (def) {
            ps.starsConceded += def.stars;
            ps.defencePct += def.destructionPct;
            ps._defCount++;
          }
        }
      }
    }

    // Finalise averages and compute efficiency
    const statsToSave = Object.values(allPlayerStats).map(ps => {
      const avgDestructionPct = ps._atkCount > 0
        ? parseFloat((ps.destructionPct / ps._atkCount).toFixed(2))
        : 0;
      const avgDefencePct = ps._defCount > 0
        ? parseFloat((ps.defencePct / ps._defCount).toFixed(2))
        : 0;
      const efficiency = ps.attacksUsed > 0
        ? parseFloat((ps.starsEarned / ps.attacksUsed).toFixed(2))
        : 0;

      return {
        playerTag: ps.playerTag,
        playerName: ps.playerName,
        season: ps.season,
        clanName: ps.clanName,
        starsEarned: ps.starsEarned,
        destructionPct: avgDestructionPct,
        starsConceded: ps.starsConceded,
        defencePct: avgDefencePct,
        attacksUsed: ps.attacksUsed,
        attacksAvailable: ps.attacksAvailable,
        missedAttacks: ps.missedAttacks,
        efficiency,
      };
    });

    if (statsToSave.length > 0) {
      await upsertPlayerCwlStats(statsToSave);
    }
  } catch (err) {
    console.error("Failed to capture player CWL stats:", err);
    // Non-fatal — season still closes
  }

  // Step 3: advance to next season
  let nextSeason;
  try {
    const closing = new Date(closingSeason + " 01");
    const next = new Date(Date.UTC(closing.getUTCFullYear(), closing.getUTCMonth() + 1, 1));
    nextSeason = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(next);
  } catch {
    nextSeason = getOpenPoolSeasonFromDate();
  }

  await setCurrentSeason(nextSeason);

  return NextResponse.json({
    closed: closingSeason,
    opened: nextSeason,
  });
}
