"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  SeasonAwards, AlliancePerformanceTile, ClanRecapShareCard, RecapShareCard,
  AppHeader, AppFooter,
} from "@/app/components/shared-views";

function RecapView() {
  const router = useRouter();
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [stats, setStats] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [sharingClan, setSharingClan] = useState(false);
  const [copiedClan, setCopiedClan] = useState(false);
  const [showClanShareCard, setShowClanShareCard] = useState(false);
  const [fullHistory, setFullHistory] = useState([]);
  const [selectedClan, setSelectedClan] = useState("alliance");
  const [clanRounds, setClanRounds] = useState([]);
  const recapCardRef = useRef(null);
  const clanCardRef = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/leaderboard").then(r => r.json()),
      fetch("/api/history").then(r => r.json()),
    ]).then(([lb, hist]) => {
      setSeasons(lb.seasons || []);
      setSelectedSeason(lb.currentSeason || lb.seasons?.[0] || null);
      setHistory(hist.history || []);
      setFullHistory(hist.history || []);
      const withOverall = (lb.stats || []).map(p => ({
        ...p,
        overall: (p.attacks_used > 0 && p.attacks_available > 0)
          ? parseFloat(((parseFloat(p.efficiency||0)*0.6)+((3-parseFloat(p.defence_efficiency||0))*0.4)).toFixed(2))
          : null,
      }));
      setStats(withOverall);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedSeason) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/leaderboard?season=${encodeURIComponent(selectedSeason)}`).then(r => r.json()),
      fetch(`/api/history?season=${encodeURIComponent(selectedSeason)}`).then(r => r.json()),
    ]).then(([lb, hist]) => {
      const withOverall = (lb.stats || []).map(p => ({
        ...p,
        overall: (p.attacks_used > 0 && p.attacks_available > 0)
          ? parseFloat(((parseFloat(p.efficiency||0)*0.6)+((3-parseFloat(p.defence_efficiency||0))*0.4)).toFixed(2))
          : null,
      }));
      setStats(withOverall);
      setHistory(hist.history || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedSeason]);

  // Fetch per-round war data when clan selected
  useEffect(() => {
    if (!selectedSeason || selectedClan === "alliance") { setClanRounds([]); return; }
    fetch(`/api/clan-rounds?season=${encodeURIComponent(selectedSeason)}&clan=${encodeURIComponent(selectedClan)}`)
      .then(r => r.json())
      .then(d => setClanRounds(d.rounds || []))
      .catch(() => setClanRounds([]));
    // Ensure fullHistory is populated for promo/demo detection
    if (fullHistory.length === 0) {
      fetch("/api/history")
        .then(r => r.json())
        .then(d => setFullHistory(d.history || []))
        .catch(() => {});
    }
  }, [selectedSeason, selectedClan]);

  // Derived data
  const seasonHistory = history.filter(r => r.season === selectedSeason);
  const totalWars = seasonHistory.reduce((s,r) => s + (r.wars_won||0) + (r.wars_lost||0) + (r.wars_drawn||0), 0);
  const totalWins = seasonHistory.reduce((s,r) => s + (r.wars_won||0), 0);
  const totalLosses = seasonHistory.reduce((s,r) => s + (r.wars_lost||0), 0);
  const totalDraws = seasonHistory.reduce((s,r) => s + (r.wars_drawn||0), 0);

  // Filter stats by selected clan
  const filteredStats = selectedClan === "alliance" ? stats : stats.filter(p => p.clan_name === selectedClan);
  const validPlayers = filteredStats.filter(p => p.overall != null).sort((a,b) => b.overall - a.overall);
  const top3 = validPlayers.slice(0, 3);

  const withAttacksFiltered = filteredStats.filter(p => p.attacks_used > 0);
  const bestAttacker = [...withAttacksFiltered].sort((a,b) => parseFloat(b.efficiency||0) - parseFloat(a.efficiency||0))[0];
  const bestDefender = [...filteredStats].filter(p => p.attacks_available > 0).sort((a,b) => parseFloat(a.defence_efficiency||0) - parseFloat(b.defence_efficiency||0))[0];

  const clanWithOverall = seasonHistory.map(c => ({
    ...c,
    overall: parseFloat(((parseFloat(c.attack_efficiency||0)*0.5)+((3-parseFloat(c.defence_efficiency||0))*0.3)+((c.wars_won||0)/7*3*0.2)).toFixed(2))
  })).sort((a,b) => b.overall - a.overall);
  const topClan = clanWithOverall[0];

  // Total alliance stars
  const totalAllianceStars = seasonHistory.reduce((s,r) => s + (r.total_stars||0), 0);

  // Season awards for share card — scoped to selected clan
  const withAttacks = withAttacksFiltered;
  const awardMostThreeStars = [...withAttacks].sort((a,b) => (b.three_stars||0) - (a.three_stars||0))[0];
  const awardClutchKing = [...withAttacks].filter(p => p.clutch_rate != null).sort((a,b) => parseFloat(b.clutch_rate||0) - parseFloat(a.clutch_rate||0))[0];
  const awardPunchUpKing = [...withAttacks].filter(p => p.punch_up_rate != null).sort((a,b) => parseFloat(b.punch_up_rate||0) - parseFloat(a.punch_up_rate||0))[0];
  const awardIronDefence = [...filteredStats].filter(p => p.attacks_available > 0).sort((a,b) => parseFloat(a.defence_efficiency||999) - parseFloat(b.defence_efficiency||999))[0];
  const awardMostConsistent = [...withAttacks].filter(p => p.consistency_score != null).sort((a,b) => parseFloat(b.consistency_score||0) - parseFloat(a.consistency_score||0))[0];

  // Previous season delta
  const selectedSeasonIdx = seasons.indexOf(selectedSeason);
  const prevSeason = selectedSeasonIdx >= 0 && selectedSeasonIdx < seasons.length - 1 ? seasons[selectedSeasonIdx + 1] : null;
  const prevSeasonHistory = prevSeason ? history.filter(r => r.season === prevSeason) : [];
  // Previous season rank — sort fullHistory by parsed date, find entry immediately before current season
  const parseSeasonDate = (s) => {
    if (!s) return new Date(0);
    // Handle "June 16 2026" and "June 2026" formats
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date(0) : d;
  };
  const allHistory = fullHistory.length > 0 ? fullHistory : history;
  const clanAllSeasons = allHistory
    .filter(h => h.clan_name === selectedClan)
    .sort((a, b) => parseSeasonDate(a.season) - parseSeasonDate(b.season)); // oldest first
  const curSeasonIdx = clanAllSeasons.findIndex(h => h.season === selectedSeason);
  const prevClanRank = curSeasonIdx > 0
    ? clanAllSeasons[curSeasonIdx - 1]?.cwl_rank || null
    : null;
  const prevClanWithOverall = prevSeasonHistory.map(c => ({
    ...c,
    overall: parseFloat(((parseFloat(c.attack_efficiency||0)*0.5)+((3-parseFloat(c.defence_efficiency||0))*0.3)+((c.wars_won||0)/7*3*0.2)).toFixed(2))
  })).sort((a,b) => b.overall - a.overall);
  const prevTopClan = prevClanWithOverall[0];
  const topClanDelta = topClan && prevTopClan ? parseFloat((topClan.overall - prevTopClan.overall).toFixed(2)) : null;

  const MEDAL_PATH = "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z";
  const medalColours = { 1: "#D4AF37", 2: "#A7A7AD", 3: "#CD7F32" };

  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    setShowShareCard(true);
    await new Promise(r => setTimeout(r, 100));
    try {
      const { shareCard } = await import("@/lib/shareCard");
      const result = await shareCard(recapCardRef.current, `cgn-recap-${(selectedSeason||"season").toLowerCase().replace(/\s+/g,"-")}.png`);
      if (result?.copied) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
    } finally {
      setSharing(false);
      setShowShareCard(false);
    }
  }

  async function handleClanShare() {
    if (sharingClan) return;
    setSharingClan(true);
    setShowClanShareCard(true);
    await new Promise(r => setTimeout(r, 100));
    try {
      const { shareCard } = await import("@/lib/shareCard");
      const clanSlug = selectedClan.toLowerCase().replace(/\s+/g, "-").replace(/[{}]/g, "");
      const result = await shareCard(clanCardRef.current, `cgn-recap-${clanSlug}-${(selectedSeason||"season").toLowerCase().replace(/\s+/g,"-")}.png`);
      if (result?.copied) {
        setCopiedClan(true);
        setTimeout(() => setCopiedClan(false), 2500);
      }
    } catch (e) {
    } finally {
      setSharingClan(false);
      setShowClanShareCard(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">

      {/* Hidden recap share card — only mounted when Share is tapped */}
      {showShareCard && topClan && (
        <div ref={recapCardRef} style={{ position: "fixed", top: 0, left: "-9999px", zIndex: -1, pointerEvents: "none" }}>
          <RecapShareCard
            topClan={topClan}
            top3={top3}
            bestAttacker={bestAttacker}
            bestDefender={bestDefender}
            totalWins={totalWins}
            totalLosses={totalLosses}
            totalDraws={totalDraws}
            clanWithOverall={clanWithOverall}
            selectedSeason={selectedSeason}
            totalAllianceStars={totalAllianceStars}
            awardMostThreeStars={awardMostThreeStars}
            awardClutchKing={awardClutchKing}
            awardPunchUpKing={awardPunchUpKing}
            awardIronDefence={awardIronDefence}
            awardMostConsistent={awardMostConsistent}
            seasonMvp={top3[0]}
          />
        </div>
      )}

      {/* Hidden per-clan recap share card */}
      {showClanShareCard && selectedClan !== "alliance" && (
        <div ref={clanCardRef} style={{ position: "fixed", top: 0, left: "-9999px", zIndex: -1, pointerEvents: "none" }}>
          <ClanRecapShareCard
            clanName={selectedClan}
            selectedSeason={selectedSeason}
            clanData={seasonHistory.find(h => h.clan_name === selectedClan)}
            top3={top3}
            bestAttacker={bestAttacker}
            bestDefender={bestDefender}
            awardMostThreeStars={awardMostThreeStars}
            awardClutchKing={awardClutchKing}
            awardPunchUpKing={awardPunchUpKing}
            awardIronDefence={awardIronDefence}
            awardMostConsistent={awardMostConsistent}
            seasonMvp={top3[0]}
            rounds={clanRounds}
            prevCwlRank={prevClanRank}
            currentCwlRank={(() => {
              // For historical seasons derive current rank from next season's cwl_rank
              // use fullHistory (all seasons) to find the next season correctly
              const parseSeasonDate2 = (s) => { if (!s) return new Date(0); const d = new Date(s); return isNaN(d.getTime()) ? new Date(0) : d; };
              const allClanSeasons = [...(fullHistory.length > 0 ? fullHistory : history)]
                .filter(h => h.clan_name === selectedClan)
                .sort((a, b) => parseSeasonDate2(a.season) - parseSeasonDate2(b.season));
              const thisIdx = allClanSeasons.findIndex(h => h.season === selectedSeason);
              const nextSeason = thisIdx >= 0 && thisIdx < allClanSeasons.length - 1 ? allClanSeasons[thisIdx + 1] : null;
              // If no next season found — show no change (same as current)
              if (!nextSeason) return seasonHistory.find(h => h.clan_name === selectedClan)?.cwl_rank || null;
              return nextSeason.cwl_rank || null;
            })()}
          />
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      <img src="/roster-bg.png" alt="" className="fixed inset-0 select-none pointer-events-none opacity-20" style={{width:"100vw",height:"100dvh",objectFit:"cover",objectPosition:"center top"}}/>
      </div>

      <AppHeader variant="bar"/>

      {/* Header */}
      <div className="relative z-10 mb-4 text-center">
        <h1 className="text-4xl font-thin tracking-widest mb-1" style={{fontFamily:"var(--font-orbitron)"}}>Season Recap</h1>
        {seasons.length > 1 ? (
          <select value={selectedSeason||""} onChange={e => { setSelectedSeason(e.target.value); setSelectedClan("alliance"); }}
            className="mt-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white focus:outline-none [color-scheme:dark]">
            {seasons.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        ) : (
          <p className="text-slate-500 text-xs mt-1">{selectedSeason}</p>
        )}
        {/* Clan filter dropdown */}
        {seasonHistory.length > 0 && (
          <select value={selectedClan} onChange={e => setSelectedClan(e.target.value)}
            className="mt-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white focus:outline-none [color-scheme:dark]">
            <option value="alliance">Alliance</option>
            {[...seasonHistory].sort((a,b) => {
              const o = n => n.toLowerCase().startsWith("cognition") ? 0 : n.toLowerCase().startsWith("gems") ? 10 : 5;
              return o(a.clan_name) - o(b.clan_name);
            }).map(h => (
              <option key={h.clan_name} value={h.clan_name}>{h.clan_name}</option>
            ))}
          </select>
        )}

        {/* Share button — alliance or per-clan */}
        {!loading && (selectedClan === "alliance" ? topClan : seasonHistory.find(h => h.clan_name === selectedClan)) && (() => {
          const isClan = selectedClan !== "alliance";
          const isSharing = isClan ? sharingClan : sharing;
          const isCopied = isClan ? copiedClan : copied;
          const onClick = isClan ? handleClanShare : handleShare;
          return (
            <div className="flex justify-center mt-3">
              <button onClick={onClick} disabled={isSharing}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg border transition text-[10px] uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed ${
                  isCopied
                    ? "border-green-500/50 bg-green-500/10 text-green-400"
                    : "border-purple-500/40 bg-purple-500/10 text-purple-300 hover:border-purple-400/60 hover:bg-purple-500/20"
                }`}>
                {isSharing ? (
                  <><svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>Generating…</>
                ) : isCopied ? (
                  <><svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Copied</>
                ) : (
                  <><svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                  {isClan ? `Share ${selectedClan.split(" ")[0]} Recap` : "Share Recap"}</>
                )}
              </button>
            </div>
          );
        })()}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-600 text-xs tracking-widest uppercase animate-pulse">Loading…</p>
        </div>
      ) : (
        <div className="relative z-10 space-y-4">

          {/* Top Clan (alliance) or Clan Header (per-clan) */}
          {selectedClan === "alliance" ? (
            topClan && (
              <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 flex flex-col items-center text-center gap-3">
                <p className="text-[9px] text-slate-600 uppercase tracking-widest">Top Clan</p>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={medalColours[1]} strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={MEDAL_PATH}/>
                </svg>
                <div>
                  <p className="text-2xl font-thin tracking-widest" style={{fontFamily:"var(--font-orbitron)", color: medalColours[1]}}>{topClan.clan_name.split(" ")[0]}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{topClan.cwl_rank}</p>
                </div>
                <div className="flex items-center justify-center gap-6 w-full pt-2 border-t border-white/[0.06]">
                  <div className="text-center">
                    <p className="text-xl font-thin text-green-300" style={{fontFamily:"var(--font-orbitron)"}}>{topClan.wars_won}</p>
                    <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Wins</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-thin text-purple-300" style={{fontFamily:"var(--font-orbitron)"}}>{parseFloat(topClan.attack_efficiency).toFixed(2)}</p>
                    <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Atk EFF</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-xl font-thin text-purple-300" style={{fontFamily:"var(--font-orbitron)"}}>{topClan.overall.toFixed(2)}</p>
                      {topClanDelta !== null && (
                        <span className={`text-[9px] font-semibold ${topClanDelta > 0 ? "text-green-400" : topClanDelta < 0 ? "text-red-400" : "text-slate-500"}`}>
                          {topClanDelta > 0 ? `↑${topClanDelta}` : topClanDelta < 0 ? `↓${Math.abs(topClanDelta)}` : "→"}
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">CGN Rating</p>
                  </div>
                </div>
              </div>
            )
          ) : (() => {
            const clanData = seasonHistory.find(h => h.clan_name === selectedClan);
            if (!clanData) return null;
            const clanStars = filteredStats.reduce((s,p) => s + (p.stars_earned||0), 0);
            const threeStarCount = filteredStats.reduce((s,p) => s + (p.three_stars||0), 0);
            const totalAtks = filteredStats.reduce((s,p) => s + (p.attacks_used||0), 0);
            return (
              <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 flex flex-col items-center text-center gap-3">
                <p className="text-[9px] text-slate-600 uppercase tracking-widest">{clanData.cwl_rank}</p>
                <p className="text-2xl font-thin tracking-widest text-white" style={{fontFamily:"var(--font-orbitron)"}}>{selectedClan.split(" ")[0]}</p>
                <div className="flex items-center justify-center gap-4 w-full pt-2 border-t border-white/[0.06]">
                  <div className="text-center">
                    <p className="text-xl font-thin text-green-300" style={{fontFamily:"var(--font-orbitron)"}}>{clanData.wars_won}</p>
                    <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Wins</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-thin text-red-400" style={{fontFamily:"var(--font-orbitron)"}}>{clanData.wars_lost}</p>
                    <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Losses</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-thin text-amber-300" style={{fontFamily:"var(--font-orbitron)"}}>{clanStars}</p>
                    <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Stars</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-thin text-purple-300" style={{fontFamily:"var(--font-orbitron)"}}>{parseFloat(clanData.attack_efficiency||0).toFixed(2)}</p>
                    <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Atk EFF</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-thin text-green-300" style={{fontFamily:"var(--font-orbitron)"}}>{totalAtks > 0 ? Math.round((threeStarCount/totalAtks)*100) : 0}%</p>
                    <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">3★ Rate</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Top 3 players */}
          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Top Players · CGN Rating</p>
            <div className="space-y-2">
              {top3.map((p, i) => (
                <a key={p.player_tag} href={`/player/${p.player_tag.replace("#","")}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 hover:border-white/20 hover:bg-white/[0.04] transition no-underline">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke={medalColours[i+1]} strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={MEDAL_PATH}/>
                    </svg>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate" style={{color: medalColours[i+1]}}>{p.player_name}</p>
                      <p className="text-[10px] text-slate-500">{p.clan_name.split(" ")[0]}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-purple-300 shrink-0">{p.overall.toFixed(2)}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Per-clan round breakdown */}
          {selectedClan !== "alliance" && clanRounds.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
              <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">CWL Round Breakdown</p>
              <div className="space-y-1.5">
                {clanRounds.map((r, i) => {
                  const won = r.stars_earned > r.stars_conceded || (r.stars_earned === r.stars_conceded && r.destruction_pct > r.defence_pct);
                  const lost = r.stars_earned < r.stars_conceded || (r.stars_earned === r.stars_conceded && r.destruction_pct < r.defence_pct);
                  const colour = won ? "text-green-400 border-green-500/20" : lost ? "text-red-400 border-red-500/20" : "text-slate-400 border-white/10";
                  return (
                    <div key={i} className={`flex items-center justify-between rounded-lg border ${colour} bg-white/[0.02] px-3 py-2`}>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-600 uppercase tracking-widest w-12">R{r.war_day}</span>
                        <span className="text-xs text-slate-400 truncate max-w-[100px]">{r.opponent_clan}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-semibold text-amber-300">{r.stars_earned}★</span>
                        <span className="text-[9px] text-slate-600">vs</span>
                        <span className="text-xs text-slate-500">{r.stars_conceded}★</span>
                        <span className={`text-[9px] font-semibold uppercase tracking-widest ${won ? "text-green-400" : lost ? "text-red-400" : "text-slate-500"}`}>
                          {won ? "W" : lost ? "L" : "D"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Standout performers */}
          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Standout Performers</p>
            <div className="grid grid-cols-2 gap-2">
              {bestAttacker && (
                <a href={`/player/${bestAttacker.player_tag.replace("#","")}`} target="_blank" rel="noopener noreferrer"
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 hover:border-white/20 hover:bg-white/[0.04] transition no-underline">
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest">Best Attack</p>
                  </div>
                  <p className="text-xs font-semibold text-white truncate">{bestAttacker.player_name}</p>
                  <p className="text-sm font-bold text-purple-300">{parseFloat(bestAttacker.efficiency).toFixed(2)}</p>
                </a>
              )}
              {bestDefender && (
                <a href={`/player/${bestDefender.player_tag.replace("#","")}`} target="_blank" rel="noopener noreferrer"
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 hover:border-white/20 hover:bg-white/[0.04] transition no-underline">
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest">Best Defence</p>
                  </div>
                  <p className="text-xs font-semibold text-white truncate">{bestDefender.player_name}</p>
                  <p className="text-sm font-bold text-blue-300">{parseFloat(bestDefender.defence_efficiency).toFixed(2)}</p>
                </a>
              )}
            </div>
          </div>

          {/* Category winners */}
          <SeasonAwards stats={filteredStats} />

          {/* Alliance Performance */}
          {filteredStats.length > 0 && (
            <AlliancePerformanceTile stats={filteredStats} totalAllianceStars={filteredStats.reduce((s,p) => s + (p.stars_earned||0), 0)} />
          )}

          {/* Alliance war record */}
          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Alliance War Record</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-center">
                <p className="text-2xl font-thin text-green-300" style={{fontFamily:"var(--font-orbitron)"}}>{totalWins}</p>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Won</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-center">
                <p className="text-2xl font-thin text-red-400" style={{fontFamily:"var(--font-orbitron)"}}>{totalLosses}</p>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Lost</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-center">
                <p className="text-2xl font-thin text-slate-500" style={{fontFamily:"var(--font-orbitron)"}}>{totalDraws}</p>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Drawn</p>
              </div>
            </div>
            {/* Clan breakdown */}
            <div className="mt-3 space-y-1.5">
              {clanWithOverall.map((c, i) => (
                <div key={c.clan_tag || c.clan_name} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke={medalColours[i+1] || "#475569"} strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={MEDAL_PATH}/>
                    </svg>
                    <span className="text-xs text-white">{c.clan_name.split(" ")[0]}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-green-300">{c.wars_won}W</span>
                    <span className="text-red-400">{c.wars_lost}L</span>
                    <span className="text-purple-300">{parseFloat(c.attack_efficiency).toFixed(2)} EFF</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <AppFooter/>
    </main>
  );
}



// ─── Leaderboard metric info modal ───────────────────────────────────────────

export default RecapView;
