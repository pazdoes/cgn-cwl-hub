import { getAllClanNames, getClanFallbackData, recordSeasonHistory, upsertPlayerCwlStats, updateClanSeasonStats } from "@/lib/pool";
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

  // Step 1: CWL rank history + clan performance stats
  const clanStatsMap = {}; // populated in Step 2, saved in Step 1 finalize

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

      // Collect all war tags across all rounds
      const warTags = [];
      for (const round of group.rounds || []) {
        for (const wt of round.warTags || []) {
          if (wt !== "#0") warTags.push(wt);
        }
      }

      for (const warTag of warTags) {
        let war;
        try { war = await getCwlWar(warTag); } catch { continue; }
        if (!war || war.state === "notInWar") continue;

        const ourSide = war.clan?.tag === clanTag ? war.clan
          : war.opponent?.tag === clanTag ? war.opponent
          : null;
        const theirSide = ourSide === war.clan ? war.opponent : war.clan;
        if (!ourSide) continue;

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
              threeStars: 0,
              twoStars: 0,
              oneStars: 0,
              zeroStars: 0,
              threeStarsConceded: 0,
              twoStarsConceded: 0,
              oneStarsConceded: 0,
              zeroStarsConceded: 0,
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
            if (atk.stars === 3) ps.threeStars++;
            else if (atk.stars === 2) ps.twoStars++;
            else if (atk.stars === 1) ps.oneStars++;
            else ps.zeroStars++;
          }
          const def = defenceMap[tag];
          if (def) {
            ps.starsConceded += def.stars;
            ps.defencePct += def.destructionPct;
            ps._defCount++;
            if (def.stars === 3) ps.threeStarsConceded++;
            else if (def.stars === 2) ps.twoStarsConceded++;
            else if (def.stars === 1) ps.oneStarsConceded++;
            else ps.zeroStarsConceded++;
          }
        }
      }
      clansProcessed++;
    } catch (err) {
      errors.push(`${clanName}: ${err.message}`);
    }
  }

  // Aggregate clan-level stats from allPlayerStats
  for (const ps of Object.values(allPlayerStats)) {
    if (!clanStatsMap[ps.clanName]) {
      clanStatsMap[ps.clanName] = {
        totalStars: 0, totalStarsConceded: 0,
        totalAttacksUsed: 0, totalAttacksAvailable: 0, totalAttacksMissed: 0,
        threeStars: 0, twoStars: 0, oneStars: 0, zeroStars: 0,
        totalAttacksForRate: 0,
        destSum: 0, defSum: 0, defCount: 0,
        warsWon: 0, warsLost: 0, warsDrawn: 0,
      };
    }
    const cs = clanStatsMap[ps.clanName];
    cs.totalStars += ps.starsEarned;
    cs.totalStarsConceded += ps.starsConceded;
    cs.totalAttacksUsed += ps.attacksUsed;
    cs.totalAttacksAvailable += ps.attacksAvailable;
    cs.totalAttacksMissed += ps.missedAttacks;
    cs.threeStars += (ps.threeStars || 0);
    cs.twoStars += (ps.twoStars || 0);
    cs.oneStars += (ps.oneStars || 0);
    cs.zeroStars += (ps.zeroStars || 0);
    cs.totalAttacksForRate += ps.attacksUsed;
    if (ps._atkCount > 0) cs.destSum += ps.destructionPct * ps._atkCount;
    if (ps._defCount > 0) { cs.defSum += ps.defencePct * ps._defCount; cs.defCount += ps._defCount; }
  }

  // Compute war wins/losses/draws per clan
  for (const clanName of clanNames) {
    try {
      const fallback = await getClanFallbackData(clanName);
      const clanTag = fallback.clan_tag;
      if (!clanTag) continue;
      const group = await getClanWarLeagueGroup(clanTag);
      if (!group) continue;
      const warTags = [];
      for (const round of group.rounds || []) {
        for (const wt of round.warTags || []) {
          if (wt !== "#0") warTags.push(wt);
        }
      }
      const wars = await Promise.all(warTags.map(wt => getCwlWar(wt).catch(() => null)));
      if (!clanStatsMap[clanName]) continue;
      const cs = clanStatsMap[clanName];
      for (const war of wars) {
        if (!war || war.state !== "warEnded") continue;
        const ourSide = war.clan?.tag === clanTag ? war.clan : war.opponent?.tag === clanTag ? war.opponent : null;
        const theirSide = ourSide === war.clan ? war.opponent : war.clan;
        if (!ourSide) continue;
        const ourStars = ourSide.stars || 0;
        const theirStars = theirSide?.stars || 0;
        const ourDest = ourSide.destructionPercentage || 0;
        const theirDest = theirSide?.destructionPercentage || 0;
        if (ourStars > theirStars) cs.warsWon++;
        else if (ourStars < theirStars) cs.warsLost++;
        else if (ourDest > theirDest) cs.warsWon++;
        else if (ourDest < theirDest) cs.warsLost++;
        else cs.warsDrawn++;
      }
    } catch {}
  }

  // Save clan stats
  try {
    await updateClanSeasonStats(season, clanStatsMap);
  } catch (err) {
    errors.push(`Clan stats: ${err.message}`);
  }

  // Finalise and save player stats
  const statsToSave = Object.values(allPlayerStats).map(ps => ({
    playerTag: ps.playerTag,
    playerName: ps.playerName,
    season: ps.season,
    clanName: ps.clanName,
    starsEarned: ps.starsEarned,
    destructionPct: ps._atkCount > 0 ? parseFloat((ps.destructionPct / ps._atkCount).toFixed(2)) : 0,
    starsConceded: ps.starsConceded,
    defencePct: ps._defCount > 0 ? parseFloat((ps.defencePct / ps._defCount).toFixed(2)) : 0,
    attacksUsed: ps.attacksUsed,
    attacksAvailable: ps.attacksAvailable,
    missedAttacks: ps.missedAttacks,
    efficiency: ps.attacksUsed > 0 ? parseFloat((ps.starsEarned / ps.attacksUsed).toFixed(2)) : 0,
    threeStars: ps.threeStars,
    twoStars: ps.twoStars,
    oneStars: ps.oneStars,
    zeroStars: ps.zeroStars,
    threeStarsConceded: ps.threeStarsConceded,
    twoStarsConceded: ps.twoStarsConceded,
    oneStarsConceded: ps.oneStarsConceded,
    zeroStarsConceded: ps.zeroStarsConceded,
  }));

  if (statsToSave.length > 0) {
    await upsertPlayerCwlStats(statsToSave);
    playersProcessed = statsToSave.length;
  }

  return { clansProcessed, playersProcessed, errors };
}
