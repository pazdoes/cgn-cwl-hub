import { getAllClanNames, getClanFallbackData, recordSeasonHistory, upsertPlayerCwlStats } from "@/lib/pool";
import { getClanWarLeagueGroup, getCwlWar } from "@/lib/coc";

const INTERVALS = {
  "24hr":  24 * 60 * 60 * 1000,
  "48hr":  48 * 60 * 60 * 1000,
  "7days":  7 * 24 * 60 * 60 * 1000,
  "14days":14 * 24 * 60 * 60 * 1000,
  "30days":30 * 24 * 60 * 60 * 1000,
};

/**
 * Captures CWL rank history and player war stats for all clans.
 * Used by both the cron job and the manual admin fetch button.
 * Returns a summary { clansProcessed, playersProcessed, errors }
 */
export async function captureCwlData(season) {
  const clanNames = await getAllClanNames();
  const errors = [];
  let clansProcessed = 0;
  let playersProcessed = 0;

  // Step 1: CWL rank history for all clans
  try {
    const clanRanks = await Promise.all(
      clanNames.map(async (clanName) => {
        const data = await getClanFallbackData(clanName);
        return { clanName, cwlRank: data.cwl_rank || "Unranked" };
      })
    );
    await recordSeasonHistory(season, clanRanks);
  } catch (err) {
    errors.push(`Rank history: ${err.message}`);
  }

  // Step 2: Player war stats from league war group
  const allPlayerStats = {};
  // Track processed war tags globally to prevent double-counting
  // when multiple clans share wars in the same CWL group
  const processedWarTags = new Set();

  for (const clanName of clanNames) {
    try {
      const fallback = await getClanFallbackData(clanName);
      const clanTag = fallback.clan_tag;
      if (!clanTag) {
        errors.push(`${clanName}: no clan tag set`);
        continue;
      }

      const group = await getClanWarLeagueGroup(clanTag);
      if (!group) {
        errors.push(`${clanName}: not in CWL or data unavailable`);
        continue;
      }

      // Collect war tags for this clan's side only — skip already processed
      const warTags = [];
      for (const round of group.rounds || []) {
        for (const wt of round.warTags || []) {
          if (wt !== "#0" && !processedWarTags.has(wt)) warTags.push(wt);
        }
      }

      for (const warTag of warTags) {
        let war;
        try { war = await getCwlWar(warTag); } catch { continue; }
        // Mark as processed immediately — regardless of whether our clan
        // is in this war. This prevents other clan loops from re-fetching
        // the same war tag and double-counting any shared players.
        processedWarTags.add(warTag);
        if (!war || war.state === "notInWar") continue;

        // Only process stats if our clan is actually in this war
        const ourSide = war.clan?.tag === clanTag ? war.clan
          : war.opponent?.tag === clanTag ? war.opponent
          : null;
        if (!ourSide) continue;

        const theirSide = ourSide === war.clan ? war.opponent : war.clan;

        // Build defence lookup from opponent attacks
        const defenceMap = {};
        for (const member of theirSide?.members || []) {
          for (const atk of member.attacks || []) {
            const def = defenceMap[atk.defenderTag] || { stars: 0, destructionPct: 0 };
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
              season,
              clanName,
              starsEarned: 0,
              destructionPct: 0,
              starsConceded: 0,
              defencePct: 0,
              attacksUsed: 0,
              attacksAvailable: 0,
              missedAttacks: 0,
              _atkCount: 0,
              _defCount: 0,
            };
          }
          const ps = allPlayerStats[tag];
          const attacks = member.attacks || [];
          ps.attacksAvailable += 1;
          ps.attacksUsed += attacks.length > 0 ? 1 : 0;
          ps.missedAttacks += attacks.length === 0 ? 1 : 0;
          for (const atk of attacks) {
            ps.starsEarned += atk.stars;
            ps.destructionPct += atk.destructionPercentage;
            ps._atkCount++;
          }
          const def = defenceMap[tag];
          if (def) {
            ps.starsConceded += def.stars;
            ps.defencePct += def.destructionPct;
            ps._defCount++;
          }
        }
      }
      clansProcessed++;
    } catch (err) {
      errors.push(`${clanName}: ${err.message}`);
    }
  }

  // Finalise and save player stats
  // Hard caps — CWL game rules:
  // Max 7 attacks per player, 3 stars per attack = 21 max stars
  const MAX_CWL_ATTACKS = 7;
  const MAX_CWL_STARS = 21; // 3 stars × 7 attacks
  const statsToSave = Object.values(allPlayerStats).map(ps => {
    const attacksAvailable = Math.min(ps.attacksAvailable, MAX_CWL_ATTACKS);
    const attacksUsed = Math.min(ps.attacksUsed, MAX_CWL_ATTACKS);
    const missedAttacks = attacksAvailable - attacksUsed;
    const starsEarned = Math.min(ps.starsEarned, MAX_CWL_STARS);
    const starsConceded = Math.min(ps.starsConceded, MAX_CWL_STARS);
    return {
      playerTag: ps.playerTag,
      playerName: ps.playerName,
      season: ps.season,
      clanName: ps.clanName,
      starsEarned,
      destructionPct: ps._atkCount > 0 ? parseFloat((ps.destructionPct / ps._atkCount).toFixed(2)) : 0,
      starsConceded,
      defencePct: ps._defCount > 0 ? parseFloat((ps.defencePct / ps._defCount).toFixed(2)) : 0,
      attacksUsed,
      attacksAvailable,
      missedAttacks,
      efficiency: attacksUsed > 0 ? parseFloat((starsEarned / attacksUsed).toFixed(2)) : 0,
    };
  });

  if (statsToSave.length > 0) {
    await upsertPlayerCwlStats(statsToSave);
    playersProcessed = statsToSave.length;
  }

  return { clansProcessed, playersProcessed, errors };
}
