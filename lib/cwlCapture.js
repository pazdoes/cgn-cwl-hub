import { getAllClanNames, getAllClanFormats, getClanFallbackData, recordSeasonHistory, upsertPlayerCwlStats, updateClanSeasonStats, upsertWarAttacks, upsertWarDefences, upsertWarDay, getCapturedWarTags, getSeasonWarAttacksByPlayer, getSeasonWarDefencesByPlayer } from "@/lib/pool";
import { getClan, getClanWarLeagueGroup, getCwlWar } from "@/lib/coc";
import { writeCwlRankToSheet } from "@/lib/sheetsWrite";
import { getDb } from "@/lib/db";

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
const MAX_CWL_ATTACKS = 7;
const MAX_CWL_STARS   = 21;

export async function captureCwlData(season) {
  const clanNames = await getAllClanNames();
  const clanFormatsMap = await getAllClanFormats();
  const errors = [];
  let clansProcessed = 0;
  let playersProcessed = 0;

  // Step 1: CWL rank history + clan performance stats
  const clanStatsMap = {}; // populated in Step 2, saved in Step 1 finalize

  try {
    const sql = getDb();
    // Get all clan tags from DB
    const clanRows = await sql`SELECT clan_name, clan_tag FROM clans WHERE cwl_absent = false OR cwl_absent IS NULL`;
    const clanRanks = await Promise.all(
      clanRows.map(async (row) => {
        try {
          const live = await getClan(row.clan_tag);
          const liveRank = live?.warLeague?.name || null;
          if (liveRank) {
            // Update Neon clans table with live rank
            await sql`UPDATE clans SET cwl_rank = ${liveRank} WHERE clan_name = ${row.clan_name}`;
            // Update Google Sheet
            await writeCwlRankToSheet({ clan: row.clan_name, rank: liveRank }).catch(() => null);
            return { clanName: row.clan_name, cwlRank: liveRank };
          }
          const data = await getClanFallbackData(row.clan_name);
          return { clanName: row.clan_name, cwlRank: data.cwl_rank || "Unranked" };
        } catch {
          const data = await getClanFallbackData(row.clan_name);
          return { clanName: row.clan_name, cwlRank: data.cwl_rank || "Unranked" };
        }
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
      if (fallback.cwl_absent) {
        continue; // clan marked as absent from CWL this season
      }
      if (fallback.cwl_absent) {
        continue; // clan marked as absent from CWL this season
      }

      const group = await getClanWarLeagueGroup(clanTag);
      if (!group) {
        errors.push(`${clanName}: not in CWL or data unavailable`);
        continue;
      }

      // Collect unique war tags across all rounds
      const warTagSet = new Set();
      for (const round of group.rounds || []) {
        for (const wt of round.warTags || []) {
          if (wt !== "#0") warTagSet.add(wt);
        }
      }
      const warTags = [...warTagSet];

      // Fetch all wars in parallel batches of 5
      const warBatches = [];
      for (let i = 0; i < warTags.length; i += 5) warBatches.push(warTags.slice(i, i + 5));
      const wars = [];
      for (const batch of warBatches) {
        const results = await Promise.all(batch.map(async wt => {
          try { return await getCwlWar(wt); } catch { return null; }
        }));
        wars.push(...results.filter(Boolean));
      }

      // ── Seed stats from already-captured warEnded attacks in DB ──
      // This prevents losing cumulative data when only an inWar round is live
      const capturedWarTags = await getCapturedWarTags(season);
      const dbAttacks = await getSeasonWarAttacksByPlayer(season, clanName);

      for (const row of dbAttacks) {
        const tag = row.player_tag;
        if (!allPlayerStats[tag]) {
          allPlayerStats[tag] = {
            playerTag: tag,
            playerName: row.player_name,
            townHallLevel: row.town_hall_level || null,
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
            _seenWarTags: new Set(),
          };
        }
        const ps = allPlayerStats[tag];
        ps.attacksAvailable += row.stars !== null ? 1 : 0;
        ps.missedAttacks += row.stars === null ? 1 : 0;
        if (row.stars !== null) {
          ps.starsEarned += row.stars;
          ps.destructionPct += row.destruction_pct || 0;
          ps._atkCount++;
          ps.attacksUsed++;
          if (row.stars === 3) ps.threeStars++;
          else if (row.stars === 2) ps.twoStars++;
          else if (row.stars === 1) ps.oneStars++;
          else ps.zeroStars++;
        }
      }

      // ── Seed defence stats from already-captured war_defences ──
      const dbDefences = await getSeasonWarDefencesByPlayer(season, clanName);
      for (const row of dbDefences) {
        const tag = row.player_tag;
        if (!allPlayerStats[tag]) continue;
        const ps = allPlayerStats[tag];
        // Only add defence if not already counted from this war
        if (ps._seenDefWarTags && ps._seenDefWarTags.has(row.war_tag)) continue;
        if (!ps._seenDefWarTags) ps._seenDefWarTags = new Set();
        ps._seenDefWarTags.add(row.war_tag);
        ps.starsConceded += parseInt(row.stars_conceded) || 0;
        ps.defencePct += parseFloat(row.destruction_pct) || 0;
        ps._defCount++;
        const s = parseInt(row.stars_conceded) || 0;
        if (s === 3) ps.threeStarsConceded++;
        else if (s === 2) ps.twoStarsConceded++;
        else if (s === 1) ps.oneStarsConceded++;
        else ps.zeroStarsConceded++;
      }

      // ── Now process live inWar wars only ──
      // warEnded wars already seeded from DB above
      for (const war of wars) {
        if (!war) continue;
        const warTag = war.tag;
        // Only process inWar — warEnded already in DB
        if (war.state !== "inWar") continue;
        // Skip if somehow already captured
        if (capturedWarTags.has(warTag)) continue;

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
              townHallLevel: member.townhallLevel || member.townHallLevel || null,
              season,
              clanName,
              clanTag,
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
              _seenWarTags: new Set(),
            };
          }
          const ps = allPlayerStats[tag];
          // Skip if this player has already been processed for this war
          if (ps._seenWarTags.has(warTag)) continue;
          ps._seenWarTags.add(warTag);
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
        clanTag: ps.clanTag || null,
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
        const teamSize = ourSide.members?.length || 15;
        if (ourStars > theirStars) cs.warsWon++;
        else if (ourStars < theirStars) cs.warsLost++;
        else if (ourDest > theirDest) cs.warsWon++;
        else if (ourDest < theirDest) cs.warsLost++;
        else cs.warsDrawn++;
        // Fix 1: total stars including 10 bonus per win — direct from API
        cs.totalStarsFromWars = (cs.totalStarsFromWars || 0) + ourStars;
        // Fix 5: total stars conceded including opponent bonus — direct from API
        cs.totalStarsConcededFromWars = (cs.totalStarsConcededFromWars || 0) + theirStars;
        // Fix 2: destruction % — weighted by teamSize per war (Supercell's own calculation × team)
        cs.destWeightedSum = (cs.destWeightedSum || 0) + (ourDest * teamSize);
        cs.destTotalBases = (cs.destTotalBases || 0) + teamSize;
        // Fix 3: defence % — weighted by teamSize per war
        cs.defWeightedSum = (cs.defWeightedSum || 0) + (theirDest * teamSize);
        cs.defTotalBases = (cs.defTotalBases || 0) + teamSize;
        // Fix 4: track attack-only stars for efficiency (separate from bonus-inclusive total)
        cs.totalAttackStars = (cs.totalAttackStars || 0) + (ourSide.members || []).reduce((sum, m) => {
          return sum + (m.attacks || []).reduce((s, a) => s + (a.stars || 0), 0);
        }, 0);
      }
    } catch {}
  }

  // Apply format-aware hard caps to clan stats before saving
  for (const [clanName, cs] of Object.entries(clanStatsMap)) {
    const format = clanFormatsMap[clanName] ?? 15;
    const maxAttacks = format * 7;          // e.g. 15×7=105 or 30×7=210
    const maxWars    = 7;
    // Use API total stars (includes 10 bonus per win) if available
    if (cs.totalStarsFromWars) cs.totalStars = cs.totalStarsFromWars;
    // Max stars = attack stars + bonus stars (10 per max possible wins)
    const maxStars = (maxAttacks * 3) + (maxWars * 10); // e.g. 315+70=385 for 15v15

    // Skip clan if no attacks or no wars recorded — not in CWL this season
    const totalWarsCheck = (cs.warsWon || 0) + (cs.warsLost || 0) + (cs.warsDrawn || 0);
    if (!cs.totalAttacksAvailable || cs.totalAttacksAvailable === 0 || totalWarsCheck === 0) {
      delete clanStatsMap[clanName];
      continue;
    }

    // Calculate raw missed attacks BEFORE capping
    const rawMissed = Math.max(0, cs.totalAttacksAvailable - cs.totalAttacksUsed);
    // Apply cap to available
    cs.totalAttacksAvailable = Math.min(cs.totalAttacksAvailable, maxAttacks);
    // Derive used from capped available minus raw missed
    cs.totalAttacksMissed    = Math.min(rawMissed, cs.totalAttacksAvailable);
    cs.totalAttacksUsed      = Math.max(0, cs.totalAttacksAvailable - cs.totalAttacksMissed);
    cs.totalAttacksForRate   = cs.totalAttacksUsed;
    cs.totalStars            = Math.min(cs.totalStars, maxStars);
    cs.totalStarsConceded    = Math.min(cs.totalStarsConceded, maxStars);
    cs.warsWon               = Math.min(cs.warsWon, maxWars);
    cs.warsLost              = Math.min(cs.warsLost, maxWars);
    cs.warsDrawn             = Math.min(cs.warsDrawn, maxWars);
    // Ensure wars total never exceeds 7
    const totalWars = cs.warsWon + cs.warsLost + cs.warsDrawn;
    if (totalWars > maxWars) {
      const scale = maxWars / totalWars;
      cs.warsWon   = Math.round(cs.warsWon * scale);
      cs.warsLost  = Math.round(cs.warsLost * scale);
      cs.warsDrawn = Math.round(cs.warsDrawn * scale);
    }
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
    townHallLevel: ps.townHallLevel ?? null,
    starsEarned: Math.min(ps.starsEarned, MAX_CWL_STARS),
    destructionPct: ps._atkCount > 0 ? parseFloat((ps.destructionPct / ps._atkCount).toFixed(2)) : 0,
    starsConceded: ps.starsConceded,
    defencePct: ps._defCount > 0 ? parseFloat((ps.defencePct / ps._defCount).toFixed(2)) : 0,
    defenceEfficiency: ps.attacksAvailable > 0 ? parseFloat((ps.starsConceded / Math.min(ps.attacksAvailable, MAX_CWL_ATTACKS)).toFixed(2)) : null,
    attacksUsed: Math.min(ps.attacksUsed, MAX_CWL_ATTACKS),
    attacksAvailable: Math.min(ps.attacksAvailable, MAX_CWL_ATTACKS),
    missedAttacks: Math.max(0, Math.min(ps.attacksAvailable, MAX_CWL_ATTACKS) - Math.min(ps.attacksUsed, MAX_CWL_ATTACKS)),
    efficiency: ps.attacksUsed > 0 ? parseFloat((Math.min(ps.starsEarned, MAX_CWL_STARS) / Math.min(ps.attacksUsed, MAX_CWL_ATTACKS)).toFixed(2)) : 0,
    threeStars: ps.threeStars,
    twoStars: ps.twoStars,
    oneStars: ps.oneStars,
    zeroStars: ps.zeroStars,
    threeStarsConceded: ps.threeStarsConceded,
    twoStarsConceded: ps.twoStarsConceded,
    oneStarsConceded: ps.oneStarsConceded,
    zeroStarsConceded: ps.zeroStarsConceded,
    avgStarsPerAttack: ps.attacksUsed > 0 ? parseFloat((Math.min(ps.starsEarned, MAX_CWL_STARS) / Math.min(ps.attacksUsed, MAX_CWL_ATTACKS)).toFixed(2)) : null,
    threeStarRate: ps.attacksUsed > 0 ? parseFloat(((ps.threeStars / Math.min(ps.attacksUsed, MAX_CWL_ATTACKS)) * 100).toFixed(2)) : null,
  }));

  if (statsToSave.length > 0) {
    await upsertPlayerCwlStats(statsToSave);
    playersProcessed = statsToSave.length;

    // Recalculate derived stats directly in DB — reliable regardless of JS accumulation
    const sql = getDb();
    await sql`
      UPDATE player_cwl_stats SET
        avg_stars_per_attack = CASE WHEN attacks_used > 0 THEN ROUND(stars_earned::numeric / attacks_used, 2) ELSE NULL END,
        three_star_rate      = CASE WHEN attacks_used > 0 THEN ROUND((three_stars::numeric / attacks_used) * 100, 2) ELSE NULL END
      WHERE season = ${season}
    `;
  }

  return { clansProcessed, playersProcessed, errors };
}

/**
 * Captures per-war attack data for all clans in a season.
 * Idempotent — skips wars already stored in war_days.
 * Safe to call multiple times; only processes warEnded wars.
 */
export async function captureWarAttacks(season) {
  const clanNames = await getAllClanNames();
  const errors = [];
  let warsProcessed = 0;
  let attacksProcessed = 0;

  for (const clanName of clanNames) {
    try {
      const fallback = await getClanFallbackData(clanName);
      const clanTag = fallback.clan_tag;
      if (!clanTag || fallback.cwl_absent) continue;

      const group = await getClanWarLeagueGroup(clanTag);
      if (!group) continue;

      // Get already-captured war tags to skip them
      const captured = await getCapturedWarTags(season);

      // Collect war tags from all rounds with their day number
      const warTagEntries = [];
      let warDay = 0;
      for (const round of group.rounds || []) {
        warDay++;
        for (const warTag of round.warTags || []) {
          if (warTag !== "#0" && !captured.has(warTag)) {
            warTagEntries.push({ warTag, warDay });
          }
        }
      }

      if (!warTagEntries.length) continue;

      // Fetch all uncaptured wars in parallel
      const wars = await Promise.all(
        warTagEntries.map(({ warTag, warDay }) =>
          getCwlWar(warTag)
            .then(war => ({ war, warTag, warDay }))
            .catch(() => null)
        )
      );

      for (const entry of wars) {
        if (!entry) continue;
        const { war, warTag, warDay } = entry;

        // Only process completed wars
        if (!war || war.state !== "warEnded") continue;

        // Determine which side is ours
        const ourSide = war.clan?.tag === clanTag ? war.clan
          : war.opponent?.tag === clanTag ? war.opponent
          : null;
        const theirSide = ourSide === war.clan ? war.opponent : war.clan;
        if (!ourSide) continue;

        // War result
        const ourStars = ourSide.stars || 0;
        const theirStars = theirSide?.stars || 0;
        const ourDest = ourSide.destructionPercentage || 0;
        const theirDest = theirSide?.destructionPercentage || 0;
        let warResult;
        if (ourStars > theirStars) warResult = "win";
        else if (ourStars < theirStars) warResult = "loss";
        else if (ourDest > theirDest) warResult = "win";
        else if (ourDest < theirDest) warResult = "loss";
        else warResult = "draw";

        const opponentClan = theirSide?.name ?? null;

        // Build defender TH level lookup and map positions
        const defenderThMap = {};
        const memberPositionMap = {};
        for (const member of [...(war.clan?.members || []), ...(war.opponent?.members || [])]) {
          defenderThMap[member.tag] = member.townhallLevel || member.townHallLevel || null;
          memberPositionMap[member.tag] = member.mapPosition ?? null;
        }

        // Collect attack rows
        const attackRows = [];
        let attacksUsed = 0;
        let attacksAvailable = 0;
        let starsEarned = 0;
        let destSum = 0;
        let atkCount = 0;

        for (const member of ourSide.members || []) {
          attacksAvailable++;
          const attacks = member.attacks || [];
          if (attacks.length > 0) attacksUsed++;

          for (let i = 0; i < attacks.length; i++) {
            const atk = attacks[i];
            attackRows.push({
              season,
              clanName,
              clanTag,
              warTag,
              warDay,
              playerTag: member.tag,
              playerName: member.name,
              townHallLevel: member.townhallLevel || member.townHallLevel || null,
              attackOrder: i + 1,
              defenderTag: atk.defenderTag,
              defenderThLevel: defenderThMap[atk.defenderTag] ?? null,
              stars: atk.stars,
              destructionPct: parseFloat((atk.destructionPercentage || 0).toFixed(2)),
              attackerMapPosition: memberPositionMap[member.tag] ?? null,
              defenderMapPosition: memberPositionMap[atk.defenderTag] ?? null,
              warResult,
              opponentClan,
            });
            starsEarned += atk.stars;
            destSum += atk.destructionPercentage || 0;
            atkCount++;
          }
        }

        // Clan defence stats from opponent attacks
        let starsConceded = 0;
        let defDestSum = 0;
        let defCount = 0;
        const bestDefence = {};
        for (const member of theirSide?.members || []) {
          for (const atk of member.attacks || []) {
            const existing = bestDefence[atk.defenderTag];
            if (!existing || atk.stars > existing.stars ||
               (atk.stars === existing.stars && atk.destructionPercentage > existing.dest)) {
              bestDefence[atk.defenderTag] = { stars: atk.stars, dest: atk.destructionPercentage || 0 };
            }
          }
        }
        for (const v of Object.values(bestDefence)) {
          starsConceded += v.stars;
          defDestSum += v.dest;
          defCount++;
        }

        // Save per-player defence rows
        const ourMemberMap = {};
        for (const member of ourSide?.members || []) {
          ourMemberMap[member.tag] = { name: member.name, th: member.townhallLevel || member.townHallLevel || null };
        }
        const defenceRows = Object.entries(bestDefence).map(([defenderTag, def]) => ({
          season,
          clanName,
          clanTag,
          warTag,
          warDay,
          playerTag: defenderTag,
          playerName: ourMemberMap[defenderTag]?.name ?? null,
          townHallLevel: ourMemberMap[defenderTag]?.th ?? null,
          starsConceded: def.stars,
          destructionPct: parseFloat(def.dest.toFixed(2)),
          warResult,
          opponentClan,
        }));
        if (defenceRows.length > 0) await upsertWarDefences(defenceRows);

        // Save attack rows
        if (attackRows.length > 0) {
          await upsertWarAttacks(attackRows);
          attacksProcessed += attackRows.length;
        }

        // Save war day summary
        await upsertWarDay({
          season,
          clanName,
          clanTag,
          warTag,
          warDay,
          starsEarned,
          starsConceded,
          attacksUsed,
          attacksAvailable,
          destructionPct: atkCount > 0 ? parseFloat((destSum / atkCount).toFixed(2)) : null,
          defencePct: defCount > 0 ? parseFloat((defDestSum / defCount).toFixed(2)) : null,
          warResult,
          opponentClan,
        });

        warsProcessed++;
      }
    } catch (err) {
      errors.push(`${clanName} war attacks: ${err.message}`);
    }
  }

  return { warsProcessed, attacksProcessed, errors };
}
