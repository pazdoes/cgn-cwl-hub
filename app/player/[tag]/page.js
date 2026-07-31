"use client";
import { AppHeader, AppFooter } from "@/app/components/shared-views";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { TH_ICONS } from "@/lib/icons";
import { BRANDING } from "@/lib/branding";
import { LargePie } from "@/lib/components";
import DiscordWidget from "@/app/components/DiscordWidget";


export default function PlayerProfilePage() {
  const { tag } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("overview");
  const [sharing, setSharing] = useState(false);
  const [armyData, setArmyData] = useState(null);
  const [armyLoading, setArmyLoading] = useState(false);
  const [armyError, setArmyError] = useState(null);
  const [armyCachedAt, setArmyCachedAt] = useState(null);
  const [armySelectedHero, setArmySelectedHero] = useState(null);
  const [armyEqSort, setArmyEqSort] = useState("rarity");
  const [armyShowTroops, setArmyShowTroops] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [statsSeason, setStatsSeason] = useState("overall");
  const shareCardRef = useRef(null);

  useEffect(() => {
    if (!tag) return;
    fetch(`/api/player/${encodeURIComponent(tag)}`)
      .then(r => { if (!r.ok) throw new Error("not found"); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [tag]);

  if (loading) return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] flex items-center justify-center">
      <p className="text-slate-600 text-xs tracking-widest uppercase animate-pulse">Loading…</p>
    </main>
  );

  if (error || !data) return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] flex items-center justify-center p-6">
      <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 text-center max-w-xs">
        <p className="text-slate-400 text-sm mb-1">Player not found</p>
        <p className="text-slate-600 text-xs">This player has no CWL stats on record.</p>
      </div>
    </main>
  );

  const latest = data.seasons[0];
  const prev = data.seasons[1] || null;

  // Overall aggregate across all seasons for Stats tab
  const allSeasons = data.seasons;
  const overallRow = allSeasons.length > 0 ? {
    season: "Overall",
    attacks_used:        allSeasons.reduce((s,r)=>s+(r.attacks_used||0),0),
    attacks_available:   allSeasons.reduce((s,r)=>s+(r.attacks_available||0),0),
    missed_attacks:      allSeasons.reduce((s,r)=>s+(r.missed_attacks||0),0),
    stars_earned:        allSeasons.reduce((s,r)=>s+(r.stars_earned||0),0),
    stars_conceded:      allSeasons.reduce((s,r)=>s+(r.stars_conceded||0),0),
    three_stars:         allSeasons.reduce((s,r)=>s+(r.three_stars||0),0),
    two_stars:           allSeasons.reduce((s,r)=>s+(r.two_stars||0),0),
    one_stars:           allSeasons.reduce((s,r)=>s+(r.one_stars||0),0),
    zero_stars:          allSeasons.reduce((s,r)=>s+(r.zero_stars||0),0),
    three_stars_conceded:allSeasons.reduce((s,r)=>s+(r.three_stars_conceded||0),0),
    two_stars_conceded:  allSeasons.reduce((s,r)=>s+(r.two_stars_conceded||0),0),
    one_stars_conceded:  allSeasons.reduce((s,r)=>s+(r.one_stars_conceded||0),0),
    zero_stars_conceded: allSeasons.reduce((s,r)=>s+(r.zero_stars_conceded||0),0),
    efficiency: allSeasons.length
      ? parseFloat((allSeasons.reduce((s,r)=>s+parseFloat(r.efficiency||0),0)/allSeasons.length).toFixed(2)) : null,
    defence_efficiency: allSeasons.length
      ? parseFloat((allSeasons.reduce((s,r)=>s+parseFloat(r.defence_efficiency||0),0)/allSeasons.length).toFixed(2)) : null,
    destruction_pct: allSeasons.length
      ? parseFloat((allSeasons.reduce((s,r)=>s+parseFloat(r.destruction_pct||0),0)/allSeasons.length).toFixed(2)) : null,
    defence_pct: allSeasons.length
      ? parseFloat((allSeasons.reduce((s,r)=>s+parseFloat(r.defence_pct||0),0)/allSeasons.length).toFixed(2)) : null,
    cwl_rank: null,
  } : null;

  // Stats tab season — defaults to latest, "overall" shows aggregate
  const statsRow = statsSeason === "overall"
    ? overallRow
    : statsSeason
      ? (data.seasons.find(s => s.season === statsSeason) || latest)
      : latest;
  const latestOverall = latest?.overall;
  const rank = data.currentRank;
  const rankColour = rank === 1 ? "#D4AF37" : rank === 2 ? "#A7A7AD" : rank === 3 ? "#CD7F32" : null;

  const totalStars   = data.seasons.reduce((s,r)=>s+(r.stars_earned||0),0);
  const totalMissed  = data.seasons.reduce((s,r)=>s+(r.missed_attacks||0),0);
  const avgEfficiency = data.seasons.length
    ? (data.seasons.reduce((s,r)=>s+parseFloat(r.efficiency||0),0)/data.seasons.length).toFixed(2) : "—";
  const avgDefEff = data.seasons.length
    ? (data.seasons.reduce((s,r)=>s+parseFloat(r.defence_efficiency||0),0)/data.seasons.length).toFixed(2) : "—";

  const threeStarRate = statsRow?.attacks_used > 0
    ? ((statsRow.three_stars||0)/statsRow.attacks_used*100).toFixed(0)+"%" : "—";
  const participationRate = statsRow?.attacks_available > 0
    ? ((statsRow.attacks_used||0)/statsRow.attacks_available*100).toFixed(0)+"%" : "—";
  const netStars = statsRow
    ? ((statsRow.stars_earned||0)-(statsRow.stars_conceded||0)) : null;
  // For Overall mode, "seasons above avg" still makes sense; net stars is career total
  const isOverallMode = statsSeason === "overall";
  const trend = (latestOverall != null && prev?.overall != null)
    ? (parseFloat(latestOverall) > parseFloat(prev.overall) ? "up"
      : parseFloat(latestOverall) < parseFloat(prev.overall) ? "down" : "same")
    : null;

  const careerAvgEff = data.seasons.length
    ? data.seasons.reduce((s,r)=>s+parseFloat(r.efficiency||0),0)/data.seasons.length : 0;
  const aboveAvg = data.seasons.filter(s=>parseFloat(s.efficiency||0)>=careerAvgEff).length;

  const bestSeasonIdx = data.seasons.reduce((bestIdx, s, i) =>
    (s.overall != null && (data.seasons[bestIdx]?.overall == null || parseFloat(s.overall) > parseFloat(data.seasons[bestIdx].overall))) ? i : bestIdx, 0);

  const careerThree  = data.seasons.reduce((s,r)=>s+(r.three_stars||0),0);
  const careerTwo    = data.seasons.reduce((s,r)=>s+(r.two_stars||0),0);
  const careerOne    = data.seasons.reduce((s,r)=>s+(r.one_stars||0),0);
  const careerZero   = data.seasons.reduce((s,r)=>s+(r.zero_stars||0),0);
  const careerThreeC = data.seasons.reduce((s,r)=>s+(r.three_stars_conceded||0),0);
  const careerTwoC   = data.seasons.reduce((s,r)=>s+(r.two_stars_conceded||0),0);
  const careerOneC   = data.seasons.reduce((s,r)=>s+(r.one_stars_conceded||0),0);
  const careerZeroC  = data.seasons.reduce((s,r)=>s+(r.zero_stars_conceded||0),0);

  // Career war metrics — averaged across seasons that have computed values
  const totalCareerAttacks = data.seasons.reduce((s,r)=>s+(r.attacks_used||0),0);
  const seasonsWithWarMetrics = data.seasons.filter(s => s.avg_stars_per_attack != null);
  const careerAvgStarsPerAtk = seasonsWithWarMetrics.length
    ? (seasonsWithWarMetrics.reduce((s,r)=>s+parseFloat(r.avg_stars_per_attack||0),0)/seasonsWithWarMetrics.length).toFixed(2) : null;
  const seasonsWithPunchUp = data.seasons.filter(s => s.punch_up_rate != null);
  const careerPunchUpRate = seasonsWithPunchUp.length
    ? (seasonsWithPunchUp.reduce((s,r)=>s+parseFloat(r.punch_up_rate||0),0)/seasonsWithPunchUp.length).toFixed(0)+"%" : null;
  const seasonsWithClutch = data.seasons.filter(s => s.clutch_rate != null);
  const careerClutchRate = seasonsWithClutch.length
    ? (seasonsWithClutch.reduce((s,r)=>s+parseFloat(r.clutch_rate||0),0)/seasonsWithClutch.length).toFixed(2) : null;
  const seasonsWithThreeStarRate = data.seasons.filter(s => s.three_star_rate != null);
  const careerThreeStarRate = seasonsWithThreeStarRate.length
    ? (seasonsWithThreeStarRate.reduce((s,r)=>s+parseFloat(r.three_star_rate||0),0)/seasonsWithThreeStarRate.length).toFixed(0)+"%" : null;

  const heroBorderStyle = rank === 1 ? `1px solid rgba(212,175,55,0.4)` : rank === 2 ? `1px solid rgba(167,167,173,0.4)` : rank === 3 ? `1px solid rgba(205,127,50,0.4)` : null;

  async function fetchArmy() {
    if (armyData) return; // already loaded
    setArmyLoading(true); setArmyError(null);
    try {
      const tag = (data?.player_tag || "").replace("#", "");
      const res = await fetch(`/api/army/${tag}`);
      const json = await res.json();
      if (!res.ok) { setArmyError(json.error || "Failed to load"); return; }
      setArmyData(json.army);
      setArmyCachedAt(json.cachedAt);
      // Preload all icons immediately so tiles render without lag
      const army = json.army;
      const toPreload = [
        ...(army.heroes || []).map(h => `/icons/heroes/${h.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`),
        ...(army.heroEquipment || []).map(e => `/icons/equipment/${e.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`),
        ...(army.pets || []).map(p => `/icons/pets/${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`),
        ...(army.troops || []).map(t => `/icons/troops/${t.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`),
        ...(army.spells || []).map(s => `/icons/spells/${s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`),
        ...(army.siegeMachines || []).map(s => `/icons/siege/${s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`),
      ];
      toPreload.forEach(src => { const img = new Image(); img.src = src; });
    } catch { setArmyError("Network error"); }
    finally { setArmyLoading(false); }
  }

  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    setShowShareCard(true);
    // Wait for DOM to render the card
    await new Promise(r => setTimeout(r, 100));
    try {
      const { shareCard } = await import("@/lib/shareCard");
      const result = await shareCard(shareCardRef.current, `cgn-${data.player_name.toLowerCase().replace(/\s+/g,"-")}.png`);
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

  return (
    <main className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
      {/* Hidden share card — only mounted when Share is tapped */}
      {showShareCard && (
        <div
          ref={shareCardRef}
          style={{
            position: "fixed",
            top: 0,
            left: "-9999px",
            zIndex: -1,
            pointerEvents: "none",
          }}
        >
          <ShareCard
            data={data}
            latestOverall={latestOverall}
            rank={rank}
            rankColour={rankColour}
            avgEfficiency={avgEfficiency}
            avgDefEff={avgDefEff}
            totalStars={totalStars}
            totalMissed={totalMissed}
            careerThree={careerThree}
            careerTwo={careerTwo}
            careerOne={careerOne}
            careerZero={careerZero}
          />
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      <img src="/roster-bg.png" alt="" className="fixed inset-0 select-none pointer-events-none opacity-20" style={{width:"100vw",height:"100dvh",objectFit:"cover",objectPosition:"center top"}}/>
      </div>

      <AppHeader variant="bar"/>

      {/* Hero tile */}
      <div className="relative z-10 rounded-xl bg-white/[0.04] backdrop-blur-xl p-5 mb-4" style={{border: heroBorderStyle || "1px solid rgba(255,255,255,0.1)"}}>
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex items-center justify-center gap-3">
            {TH_ICONS[String(data.town_hall_level)] && (
              <img src={TH_ICONS[String(data.town_hall_level)]} alt={`TH${data.town_hall_level}`} className="w-10 h-10 shrink-0"/>
            )}
            {rank <= 3 && <MedalIcon rank={rank}/>}
            <h1 className="text-4xl font-thin tracking-widest" style={{color: rankColour || "white"}}>{data.player_name}</h1>
          </div>

          {latestOverall != null && (
            <div className="flex flex-col items-center mt-1">
              <span className="text-3xl font-thin text-purple-300">
                {parseFloat(latestOverall).toFixed(2)}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[9px] text-slate-600 uppercase tracking-widest">CGN Rating</p>
                <RatingTooltip />
                {trend === "up" && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/>
                  </svg>
                )}
                {trend === "down" && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Share button — above separator */}
        <div className="flex justify-center mt-3">
          <button
            onClick={handleShare}
            disabled={sharing}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border transition text-[10px] uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed ${
              copied
                ? "border-green-500/50 bg-green-500/10 text-green-400"
                : "border-purple-500/40 bg-purple-500/10 text-purple-300 hover:border-purple-400/60 hover:bg-purple-500/20"
            }`}
          >
            {sharing ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Generating…
              </>
            ) : copied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                </svg>
                Share Card
              </>
            )}
          </button>
        </div>

        {/* Tab toggle */}
        <div className="flex items-center justify-center gap-4 pt-4 mt-3 border-t border-white/[0.04]">
          <button onClick={() => setView(view === "stats" ? "overview" : view === "army" ? "stats" : "overview")} className="text-slate-500 hover:text-slate-300 transition p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <span className="text-[10px] text-slate-600 uppercase tracking-widest select-none min-w-[60px] text-center">
            {view === "overview" ? "Overview" : view === "stats" ? "Stats" : "Army"}
          </span>
          <button onClick={() => {
            if (view === "overview") setView("stats");
            else if (view === "stats") { setView("army"); fetchArmy(); }
            else setView("overview");
          }} className="text-slate-500 hover:text-slate-300 transition p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── OVERVIEW VIEW ── */}
      {view === "overview" && (
        <div className="relative z-10 space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Career</p>
            <div className="grid grid-cols-3 gap-2">
              <IconStatBox label="Avg Atk EFF" value={avgEfficiency} iconKey="atk" colourKey="purple"/>
              <IconStatBox label="Best Rating" value={data.bestOverall ? parseFloat(data.bestOverall.overall).toFixed(2) : "—"} iconKey="best" colourKey="purple"/>
              <IconStatBox label="Total Stars" value={totalStars} iconKey="star" colourKey="green"/>
              <IconStatBox label="Avg Def EFF" value={avgDefEff} iconKey="def" colourKey="blue"/>
              <IconStatBox label="Missed" value={totalMissed} iconKey="miss" colourKey={totalMissed > 0 ? "red" : "slate"}/>
              <IconStatBox label="Total Attacks" value={totalCareerAttacks} iconKey="atks" colourKey="slate"/>
            </div>
          </div>

          {/* Career War Metrics */}
          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Career War Metrics</p>
            <div className="grid grid-cols-2 gap-2">
              <IconStatBox label="Avg ★/Attack" value={careerAvgStarsPerAtk ?? "—"} iconKey="avg" colourKey="amber"/>
              <IconStatBox label="3★ Rate" value={careerThreeStarRate ?? "—"} iconKey="star" colourKey="green"/>
              <IconStatBox label="Clutch Rate" value={careerClutchRate ?? "—"} iconKey="clutch" colourKey="purple"/>
              <IconStatBox label="Punch-Up Rate" value={careerPunchUpRate ?? "—"} iconKey="punch" colourKey="blue"/>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Career Attack Breakdown</p>
            <div className="flex items-center gap-4">
              <LargePie three={careerThree} two={careerTwo} one={careerOne} zero={careerZero} size={72}/>
              <StarBars three={careerThree} two={careerTwo} one={careerOne} zero={careerZero}/>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-2">CGN Rating Trend</p>
            <OverallChart seasons={data.seasons}/>
          </div>
        </div>
      )}


      {/* ── ARMY VIEW ── */}
      {view === "army" && (
        <div className="relative z-10 space-y-3">
          {armyLoading && (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 animate-pulse">
              <div className="flex gap-3">
                {/* Left skeleton */}
                <div className="flex flex-col gap-3 shrink-0" style={{width: "38%"}}>
                  <div>
                    <div className="h-2 w-12 bg-white/[0.06] rounded mb-2"/>
                    <div className="flex gap-1.5">
                      {[...Array(6)].map((_,i) => <div key={i} className="w-14 h-14 rounded-lg bg-white/[0.06]"/>)}
                    </div>
                  </div>
                  <div>
                    <div className="h-2 w-8 bg-white/[0.06] rounded mb-2"/>
                    <div className="flex flex-wrap gap-1.5">
                      {[...Array(8)].map((_,i) => <div key={i} className="w-11 h-11 rounded-xl bg-white/[0.06]"/>)}
                    </div>
                  </div>
                </div>
                <div className="w-px bg-white/[0.06] shrink-0"/>
                {/* Right skeleton */}
                <div className="flex-1">
                  <div className="h-2 w-16 bg-white/[0.06] rounded mb-2"/>
                  <div className="flex flex-wrap gap-1">
                    {[...Array(20)].map((_,i) => <div key={i} className="w-10 h-10 rounded-xl bg-white/[0.06]"/>)}
                  </div>
                </div>
              </div>
            </div>
          )}
          {armyError && (
            <div className="rounded-xl border border-red-500/20 bg-white/[0.04] p-8 text-center">
              <p className="text-red-400 text-xs">{armyError}</p>
            </div>
          )}
          {armyData && !armyLoading && (
            <>
              {/* ── HEROES + PETS + EQUIPMENT CARD ── */}
              <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
                <div className="flex gap-3">

                  {/* LEFT — Heroes stacked above Pets */}
                  <div className="flex flex-col gap-2 shrink-0" style={{width: "38%"}}>
                    {/* Heroes */}
                    {armyData.heroes?.length > 0 && (
                      <div>
                        <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-1.5">Heroes</p>
                        <div className="flex flex-wrap gap-1.5">
                          {[...armyData.heroes].sort((a, b) => {
                      const order = ["Barbarian King","Archer Queen","Minion Prince","Grand Warden","Royal Champion","Dragon Duke"];
                      return order.indexOf(a.name) - order.indexOf(b.name);
                    }).map(hero => {
                            const slug = hero.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                            const isMaxed = hero.level >= hero.maxLevel;
                            return (
                              <button key={hero.name} type="button"
                                onClick={() => setArmySelectedHero(armySelectedHero === hero.name ? null : hero.name)}
                                className={`relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition ${
                                  armySelectedHero === hero.name
                                    ? "border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                                    : isMaxed
                                      ? "border-amber-500/60"
                                      : "border-white/10"
                                }`}>
                                <div className="w-full h-full bg-white/[0.06] flex items-center justify-center">
                                  <img src={`/icons/heroes/${slug}.png`} alt={hero.name} loading="eager"
                                    className="w-full h-full object-cover object-top"
                                    onError={e => { e.target.style.display = "none"; }}/>
                                </div>
                                <span className={`absolute top-0.5 right-0.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-sm text-[9px] font-bold px-0.5 ${isMaxed ? "bg-amber-500 text-white" : "bg-black/80 text-white"}`}>
                                  {hero.level}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Pets */}
                    {armyData.pets?.length > 0 && (
                      <div>
                        <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-1.5">Pets</p>
                        <div className="flex flex-wrap gap-1.5">
                          {armyData.pets.map(pet => {
                            const slug = pet.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                            const isMaxed = pet.level >= pet.maxLevel;
                            return (
                              <div key={pet.name} className={`relative w-11 h-11 rounded-xl overflow-hidden border ${isMaxed ? "border-amber-500/60" : "border-white/10"}`}>
                                <div className="w-full h-full bg-white/[0.06] flex items-center justify-center">
                                  <img src={`/icons/pets/${slug}.png`} alt={pet.name} loading="eager"
                                    className="w-full h-full object-cover"
                                    onError={e => { e.target.style.display = "none"; }}/>
                                </div>
                                <span className={`absolute top-0.5 right-0.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-sm text-[8px] font-bold px-0.5 ${isMaxed ? "bg-amber-500 text-white" : "bg-black/80 text-white"}`}>
                                  {pet.level}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="w-px bg-white/[0.06] shrink-0"/>

                  {/* RIGHT — Equipment panel */}
                  <div className="flex-1 min-w-0">
                    {/* Equipment sort controls */}
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[8px] text-slate-600 uppercase tracking-widest">
                        {armySelectedHero ? armySelectedHero.split(" ")[0] + " Equipment" : "Equipment"}
                      </p>
                      {!armySelectedHero && (
                        <div className="flex gap-1">
                          {["rarity","hero"].map(mode => (
                            <button key={mode} type="button"
                              onClick={() => setArmyEqSort(mode)}
                              className={`text-[8px] px-2 py-0.5 rounded-full border transition ${armyEqSort === mode ? "border-purple-500/60 bg-purple-500/20 text-purple-300" : "border-white/10 text-slate-600 hover:text-slate-400"}`}>
                              {mode === "rarity" ? "Epic/Common" : "By Hero"}
                            </button>
                          ))}
                        </div>
                      )}
                      {armySelectedHero && (
                        <button type="button" onClick={() => setArmySelectedHero(null)}
                          className="text-[8px] text-slate-600 hover:text-slate-300 transition">All</button>
                      )}
                    </div>

                    {/* Equipment grid */}
                    {(() => {
                      const eq = armyData.heroEquipment || [];
                      let filtered = armySelectedHero
                        ? eq.filter(e => (EQUIPMENT_LOOKUP[e.name]?.hero || "") === armySelectedHero)
                        : eq;

                      if (!armySelectedHero) {
                        if (armyEqSort === "rarity") {
                          filtered = [...filtered].sort((a, b) => {
                            const oa = EQUIPMENT_LOOKUP[a.name]?.order ?? 99;
                            const ob = EQUIPMENT_LOOKUP[b.name]?.order ?? 99;
                            return oa - ob;
                          });
                        } else {
                          const heroOrder = ["Barbarian King","Archer Queen","Minion Prince","Grand Warden","Royal Champion","Dragon Duke"];
                          filtered = [...filtered].sort((a, b) => {
                            const ha = heroOrder.indexOf(EQUIPMENT_LOOKUP[a.name]?.hero || "");
                            const hb = heroOrder.indexOf(EQUIPMENT_LOOKUP[b.name]?.hero || "");
                            if (ha !== hb) return ha - hb;
                            // Within same hero: Common first, then Epic
                            const ra = EQUIPMENT_LOOKUP[a.name]?.rarity === "Epic" ? 1 : 0;
                            const rb = EQUIPMENT_LOOKUP[b.name]?.rarity === "Epic" ? 1 : 0;
                            if (ra !== rb) return ra - rb;
                            // Within same rarity: use order field
                            return (EQUIPMENT_LOOKUP[a.name]?.order ?? 99) - (EQUIPMENT_LOOKUP[b.name]?.order ?? 99);
                          });
                        }
                      }

                      // Group by rarity when in rarity mode
                      if (!armySelectedHero && armyEqSort === "rarity") {
                        const common = filtered.filter(e => EQUIPMENT_LOOKUP[e.name]?.rarity !== "Epic");
                        const epic = filtered.filter(e => EQUIPMENT_LOOKUP[e.name]?.rarity === "Epic");
                        return (
                          <div className="space-y-2">
                            {common.length > 0 && (
                              <div>
                                <p className="text-[7px] text-slate-600 uppercase tracking-widest mb-1">Common</p>
                                <div className="flex flex-wrap gap-1">
                                  {common.map(e => <EquipmentTile key={e.name} eq={e}/>)}
                                </div>
                              </div>
                            )}
                            {epic.length > 0 && (
                              <div>
                                <p className="text-[7px] text-amber-500/60 uppercase tracking-widest mb-1">Epic</p>
                                <div className="flex flex-wrap gap-1">
                                  {epic.map(e => <EquipmentTile key={e.name} eq={e}/>)}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // For hero-filtered view: sort Common first then Epic
                      if (armySelectedHero) {
                        filtered = [...filtered].sort((a, b) => {
                          const ra = EQUIPMENT_LOOKUP[a.name]?.rarity === "Epic" ? 1 : 0;
                          const rb = EQUIPMENT_LOOKUP[b.name]?.rarity === "Epic" ? 1 : 0;
                          if (ra !== rb) return ra - rb;
                          return (EQUIPMENT_LOOKUP[a.name]?.order ?? 99) - (EQUIPMENT_LOOKUP[b.name]?.order ?? 99);
                        });
                        const common = filtered.filter(e => EQUIPMENT_LOOKUP[e.name]?.rarity !== "Epic");
                        const epic = filtered.filter(e => EQUIPMENT_LOOKUP[e.name]?.rarity === "Epic");
                        return (
                          <div className="space-y-2">
                            {common.length > 0 && (
                              <div>
                                <p className="text-[7px] text-slate-600 uppercase tracking-widest mb-1">Common</p>
                                <div className="flex flex-wrap gap-1">
                                  {common.map(e => <EquipmentTile key={e.name} eq={e}/>)}
                                </div>
                              </div>
                            )}
                            {epic.length > 0 && (
                              <div>
                                <p className="text-[7px] text-amber-500/60 uppercase tracking-widest mb-1">Epic</p>
                                <div className="flex flex-wrap gap-1">
                                  {epic.map(e => <EquipmentTile key={e.name} eq={e}/>)}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-2">
                          {["Barbarian King","Archer Queen","Minion Prince","Grand Warden","Royal Champion","Dragon Duke"].map(heroName => {
                            const heroEq = filtered.filter(e => EQUIPMENT_LOOKUP[e.name]?.hero === heroName);
                            if (!heroEq.length) return null;
                            const common = heroEq.filter(e => EQUIPMENT_LOOKUP[e.name]?.rarity !== "Epic");
                            const epic = heroEq.filter(e => EQUIPMENT_LOOKUP[e.name]?.rarity === "Epic");
                            return (
                              <div key={heroName}>
                                <p className="text-[7px] text-slate-500 uppercase tracking-widest mb-1">{heroName}</p>
                                {common.length > 0 && <div className="flex flex-wrap gap-1 mb-1">{common.map(e => <EquipmentTile key={e.name} eq={e}/>)}</div>}
                                {epic.length > 0 && <div className="flex flex-wrap gap-1">{epic.map(e => <EquipmentTile key={e.name} eq={e}/>)}</div>}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* ── TROOPS + SPELLS + SIEGE ── */}
              <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
                <button type="button" onClick={() => setArmyShowTroops(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3">
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest">Troops, Spells & Siege</p>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 text-slate-600 transition-transform ${armyShowTroops ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                {armyShowTroops && (
                  <div className="px-4 pb-4 space-y-3 border-t border-white/[0.06] pt-3">
                    {armyData.troops?.length > 0 && (
                      <div>
                        <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-2">Troops</p>
                        <div className="flex flex-wrap gap-1.5">
                          {armyData.troops.map(t => <UnitTile key={t.name} unit={t} folder="troops"/>)}
                        </div>
                      </div>
                    )}
                    {armyData.spells?.length > 0 && (
                      <div>
                        <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-2">Spells</p>
                        <div className="flex flex-wrap gap-1.5">
                          {armyData.spells.map(s => <UnitTile key={s.name} unit={s} folder="spells"/>)}
                        </div>
                      </div>
                    )}
                    {armyData.siegeMachines?.length > 0 && (
                      <div>
                        <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-2">Siege Machines</p>
                        <div className="flex flex-wrap gap-1.5">
                          {armyData.siegeMachines.map(s => <UnitTile key={s.name} unit={s} folder="siege"/>)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {armyCachedAt && (
                <p className="text-[9px] text-slate-700 text-center">
                  Snapshot from {new Date(armyCachedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · refreshes every 24h
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* ── STATS VIEW ── */}      {/* ── STATS VIEW ── */}
      {view === "stats" && (
        <div className="relative z-10 space-y-4">

          {/* Season selector */}
          {data.seasons.length > 1 && (
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
              <p className="text-[9px] text-slate-600 uppercase tracking-widest">Season</p>
              <select
                value={statsSeason || "overall"}
                onChange={e => setStatsSeason(e.target.value)}
                className="rounded-xl border border-white/10 bg-transparent px-2 py-1 text-xs text-white focus:outline-none [color-scheme:dark]">
                <option value="overall">Overall (All Seasons)</option>
                {data.seasons.map(s => (
                  <option key={s.season} value={s.season}>{s.season}</option>
                ))}
              </select>
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">
              {isOverallMode ? "Performance · All Seasons" : `Performance · ${statsRow?.season}`}
            </p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <IconStatBox label="3★ Rate" value={threeStarRate} iconKey="star" colourKey="green"/>
              <IconStatBox label="Participation" value={participationRate} iconKey="atks" colourKey="purple"/>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <IconStatBox
                label={isOverallMode ? "Net Stars (Career)" : "Net Stars"}
                value={netStars != null ? (netStars > 0 ? `+${netStars}` : String(netStars)) : "—"}
                iconKey="net"
                colourKey={netStars != null ? (netStars > 0 ? "green" : netStars < 0 ? "red" : "slate") : "slate"}
              />
              {!isOverallMode && (
                <IconStatBox label="Seasons Above Avg" value={`${aboveAvg}/${data.seasons.length}`} iconKey="consist" colourKey="purple"/>
              )}
              {isOverallMode && (
                <IconStatBox label="Seasons Played" value={data.seasons.length} iconKey="league" colourKey="slate"/>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                {isOverallMode ? "Attack · All Seasons" : `Attack · ${statsRow?.season}`}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <IconStatBox label="Efficiency" value={parseFloat(statsRow?.efficiency||0).toFixed(2)} iconKey="atk" colourKey="purple"/>
              <IconStatBox label="Stars" value={statsRow?.stars_earned ?? "—"} iconKey="star" colourKey="green"/>
              <IconStatBox label="Dest %" value={statsRow?.destruction_pct != null ? parseFloat(statsRow?.destruction_pct).toFixed(1)+"%" : "—"} iconKey="dest" colourKey="slate"/>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <IconStatBox label="Attacks" value={`${statsRow?.attacks_used ?? "—"}/${statsRow?.attacks_available ?? "—"}`} iconKey="atks" colourKey="slate"/>
              <IconStatBox label="Missed" value={statsRow?.missed_attacks ?? "—"} iconKey="miss" colourKey={(statsRow?.missed_attacks||0) > 0 ? "red" : "slate"}/>
            </div>
            <div className="flex items-center gap-4 pt-3 border-t border-white/[0.06]">
              <LargePie three={statsRow?.three_stars||0} two={statsRow?.two_stars||0} one={statsRow?.one_stars||0} zero={statsRow?.zero_stars||0} size={64}/>
              <StarBars three={statsRow?.three_stars||0} two={statsRow?.two_stars||0} one={statsRow?.one_stars||0} zero={statsRow?.zero_stars||0}/>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                {isOverallMode ? "Defence · All Seasons" : `Defence · ${statsRow?.season}`}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <IconStatBox label="Def EFF" value={statsRow?.defence_efficiency != null ? parseFloat(statsRow?.defence_efficiency).toFixed(2) : "—"} iconKey="def" colourKey="blue"/>
              <IconStatBox label="Stars Given" value={statsRow?.stars_conceded ?? "—"} iconKey="star" colourKey="slate"/>
              <IconStatBox label="Dest Given" value={statsRow?.defence_pct != null ? parseFloat(statsRow?.defence_pct).toFixed(1)+"%" : "—"} iconKey="dest" colourKey="slate"/>
            </div>
            <div className="flex items-center gap-4 pt-3 border-t border-white/[0.06]">
              <LargePie three={statsRow?.three_stars_conceded||0} two={statsRow?.two_stars_conceded||0} one={statsRow?.one_stars_conceded||0} zero={statsRow?.zero_stars_conceded||0} size={64}/>
              <StarBars three={statsRow?.three_stars_conceded||0} two={statsRow?.two_stars_conceded||0} one={statsRow?.one_stars_conceded||0} zero={statsRow?.zero_stars_conceded||0}/>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-2">CGN Rating Trend</p>
            <OverallChart seasons={data.seasons}/>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Season History</p>

            {/* Single scrollable table + arrow buttons outside */}
            <div className="flex gap-2 -mx-1">
              {/* Scrollable table — headers and data rows together */}
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-xs min-w-[520px]">
                  <thead>
                    <tr>
                      {STAT_COLS.map(col => (
                        <th key={col.key} className="text-[9px] text-slate-600 uppercase tracking-widest font-normal pb-2 text-left px-1 whitespace-nowrap">{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {data.seasons.map((s, i) => {
                      const isBest = i === bestSeasonIdx && data.seasons.length > 1;
                      return (
                        <tr key={i} className={`transition ${isBest ? "bg-amber-500/[0.07]" : ""} ${selectedSeason === s.season ? "bg-purple-500/[0.07]" : ""}`}>
                          {STAT_COLS.map(col => (
                            <td key={col.key} className={`py-2 px-1 whitespace-nowrap ${
                              col.key === "overall" ? (isBest ? "text-amber-300 font-bold" : "text-purple-300 font-semibold") :
                              col.key === "missed_attacks" && (s.missed_attacks||0) > 0 ? "text-red-400" :
                              col.key === "efficiency" ? "text-purple-200" :
                              col.key === "defence_efficiency" ? "text-blue-300" :
                              col.key === "cwl_rank" ? "text-slate-500" :
                              "text-slate-400"
                            }`}>
                              {col.fmt(s[col.key])}
                              {col.key === "season" && isBest && <span className="ml-1 text-amber-400 text-[8px]">★</span>}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Arrow buttons column — outside scroll, aligned with rows */}
              <div className="w-6 shrink-0 flex flex-col">
                {/* Header spacer */}
                <div className="pb-2 h-[calc(1rem+8px)]"/>
                {/* One button per season row */}
                {data.seasons.map((s, i) => {
                  const isSelected = selectedSeason === s.season;
                  const hasWarData = data.warsBySeason?.[s.season]?.length > 0;
                  return (
                    <div key={i} className="flex items-center justify-center py-2 border-t border-white/[0.04] first:border-t-0">
                      {hasWarData ? (
                        <button onClick={() => setSelectedSeason(isSelected ? null : s.season)}
                          className="text-slate-500 hover:text-purple-300 transition p-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 transition-transform ${isSelected ? "rotate-180 text-purple-300" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                          </svg>
                        </button>
                      ) : (
                        <span className="text-[9px] text-slate-800">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* War breakdown panel */}
            {selectedSeason && data.warsBySeason?.[selectedSeason] && (
              <WarBreakdown wars={data.warsBySeason[selectedSeason]} season={selectedSeason}/>
            )}
          </div>
        </div>
      )}

      <AppFooter/>
    </main>
  );
}
