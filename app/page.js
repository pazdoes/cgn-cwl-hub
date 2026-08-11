"use client";

import {useEffect, useState} from "react";
import {motion} from "framer-motion";
import Link from "next/link";
import {getLeagueStyles} from "@/lib/leagueColors";
import {BRANDING} from "@/lib/branding";
import {CWL_ICONS, TH_ICONS} from "@/lib/icons";
import {rankSortIndex, PlayersView, ClansView, AvgThView, AppHeader, AppFooter} from "@/app/components/shared-views";

function CwlProgressTile({ onNavigate }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/cwl-progress")
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData({ active: false }));
  }, []);

  if (!data || !data.active) return null;

  const { season, isComplete, currentRound, totals, clans, topAttackers, topDefender } = data;
  const allianceEff = totals.totalAttacks > 0
    ? (totals.totalStars / totals.totalAttacks).toFixed(2)
    : "—";
  const MEDAL_PATH = "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z";
  const medalColours = ["#D4AF37", "#A7A7AD", "#CD7F32"];

  return (
    <div className="rounded-xl border border-purple-500/20 bg-white/[0.04] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/[0.08] to-indigo-500/[0.06] px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-[9px] text-purple-400 uppercase tracking-widest font-semibold mb-0.5">
            {isComplete ? "Season Complete" : `Round ${currentRound} of 7`}
          </p>
          <p className="text-sm font-semibold text-white">{season} · CWL</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-2xl font-thin text-purple-300 tabular-nums">{totals.totalStars}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">Alliance Stars</p>
          </div>
          {!isComplete && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
              <span className="text-[10px] text-green-300">Live</span>
            </div>
          )}
        </div>
      </div>

      {/* Clan standings */}
      {clans.length > 0 && (
        <div className="px-5 pt-4 pb-3 border-b border-white/[0.06]">
          <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-2.5">Clan Standings</p>
          <div className="space-y-2">
            {clans.map((c, i) => (
              <div key={c.clan_name} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke={medalColours[i] || "#475569"} strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={MEDAL_PATH}/>
                  </svg>
                  <span className="text-xs text-white truncate">{c.clan_name.split(" ")[0]}</span>
                  {c.cwl_rank && <span className="text-[9px] text-slate-600 shrink-0">{c.cwl_rank}</span>}
                </div>
                <div className="flex items-center gap-3 shrink-0 text-[11px]">
                  <span className="text-green-400 font-semibold">{c.wars_won ?? "—"}W</span>
                  <span className="text-red-400">{c.wars_lost ?? "—"}L</span>
                  <span className="text-purple-300 tabular-nums">{c.attack_efficiency ? parseFloat(c.attack_efficiency).toFixed(2) : "—"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top attackers */}
      {topAttackers.length > 0 && (
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-2.5">Top Attackers</p>
          <div className="space-y-1.5">
            {topAttackers.slice(0, 3).map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[9px] text-slate-600 w-3 shrink-0">{i + 1}</span>
                  <span className="text-xs text-white truncate">{p.player_name}</span>
                  <span className="text-[9px] text-slate-600 shrink-0">{p.clan_name.split(" ")[0]}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-purple-300 tabular-nums">{parseFloat(p.efficiency).toFixed(2)}</span>
                  <span className="text-[9px] text-slate-600">{p.attacks_used}atk</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer: alliance EFF + best defence + CTA */}
      <div className="px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-0.5">Alliance EFF</p>
            <p className="text-lg font-semibold text-purple-300 tabular-nums">{allianceEff}</p>
          </div>
          {topDefender && (
            <div>
              <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-0.5">Best Defence</p>
              <p className="text-xs font-semibold text-blue-300">{topDefender.player_name}</p>
              <p className="text-[10px] text-slate-500 tabular-nums">{parseFloat(topDefender.defence_efficiency).toFixed(2)} Def EFF</p>
            </div>
          )}
        </div>
        <button onClick={() => onNavigate("leaderboard")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-purple-600/30 text-purple-200 border border-purple-500/30 hover:bg-purple-600/50 hover:border-purple-400 transition shrink-0">
          Full Stats
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

function SideWarTime({ war }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  if (!war.start_time) return (
    <div>
      <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Start Time</p>
      <p className="text-sm font-semibold text-slate-400">TBC</p>
    </div>
  );

  const start = new Date(war.start_time);
  const isRecurring = war.time_format === "recurring";
  let target;

  if (isRecurring) {
    const cycle = 48 * 60 * 60 * 1000;
    const elapsed = now - start;
    if (elapsed < 0) {
      target = start;
    } else {
      const cyclesDone = Math.floor(elapsed / cycle);
      target = new Date(start.getTime() + (cyclesDone + 1) * cycle);
    }
  } else {
    target = start;
  }

  const msLeft = Math.max(0, target - now);
  const days = Math.floor(msLeft / 86400000);
  const hours = Math.floor((msLeft % 86400000) / 3600000);
  const mins = Math.floor((msLeft % 3600000) / 60000);
  const isLive = msLeft === 0;

  // For recurring wars that are live, calculate next cycle (current target + 48h)
  const nextMs = isRecurring && isLive
    ? Math.max(0, new Date(target.getTime() + 48 * 60 * 60 * 1000) - now)
    : null;
  const nextDays = nextMs != null ? Math.floor(nextMs / 86400000) : null;
  const nextHours = nextMs != null ? Math.floor((nextMs % 86400000) / 3600000) : null;
  const nextMins = nextMs != null ? Math.floor((nextMs % 3600000) / 60000) : null;

  return (
    <div>
      <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">
        {isRecurring ? "Next War In" : "War Starts In"}
      </p>
      {isLive ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
            <span className="text-sm font-semibold text-green-300">Live Now</span>
          </div>
          {nextMs != null && (
            <div>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-0.5">Next Round In</p>
              <div className="flex items-baseline gap-1.5">
                {nextDays > 0 && <>
                  <span className="text-lg font-thin tracking-widest text-pink-300 tabular-nums">{nextDays}</span>
                  <span className="text-[10px] text-slate-500 mr-1">d</span>
                </>}
                <span className="text-lg font-thin tracking-widest text-pink-300 tabular-nums">{String(nextHours).padStart(2,"0")}</span>
                <span className="text-[10px] text-slate-500">h</span>
                <span className="text-lg font-thin tracking-widest text-pink-300 tabular-nums">{String(nextMins).padStart(2,"0")}</span>
                <span className="text-[10px] text-slate-500">m</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-baseline gap-1.5">
          {days > 0 && <>
            <span className="text-2xl font-thin tracking-widest text-pink-300 tabular-nums" style={{fontFamily:"var(--font-orbitron)"}}>{days}</span>
            <span className="text-[10px] text-slate-500 mr-1">d</span>
          </>}
          <span className="text-2xl font-thin tracking-widest text-pink-300 tabular-nums" style={{fontFamily:"var(--font-orbitron)"}}>{String(hours).padStart(2,"0")}</span>
          <span className="text-[10px] text-slate-500">h</span>
          <span className="text-2xl font-thin tracking-widest text-pink-300 tabular-nums" style={{fontFamily:"var(--font-orbitron)"}}>{String(mins).padStart(2,"0")}</span>
          <span className="text-[10px] text-slate-500">m</span>
        </div>
      )}
    </div>
  );
}

function SideWarsSection({ onNavigate }) {
  const [wars, setWars] = useState(null);
  const [anyRosterPublished, setAnyRosterPublished] = useState(false);

  useEffect(() => {
    fetch("/api/side-wars")
      .then(r => r.json())
      .then(d => setWars(d.wars || []))
      .catch(() => setWars([]));
    fetch("/api/roster-status")
      .then(r => r.json())
      .then(d => setAnyRosterPublished(d.anyPublished || false))
      .catch(() => {});
  }, []);

  // null = still loading, don't render anything yet
  if (wars === null) return null;
  // no active wars — render Sign Up or View Rosters tile based on published state
  if (wars.length === 0) return (
    <>
      {/* Sign Up (pre-publish) or View Rosters (post-publish) */}
      {anyRosterPublished ? (
        <a href="/rosters"
          className="block rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 hover:bg-white/[0.06] hover:border-green-500/30 transition group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/[0.1] border border-green-500/20 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white" style={{fontFamily:"var(--font-orbitron)"}}>View Rosters</p>
                <p className="text-[11px] text-slate-500 mt-0.5">CWL rosters are live — see your clan lineup</p>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500 group-hover:text-green-300 group-hover:translate-x-0.5 transition shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </a>
      ) : (
        <a href="/signup"
          className="block rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 hover:bg-white/[0.06] hover:border-purple-500/30 transition group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/[0.1] border border-purple-500/20 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white" style={{fontFamily:"var(--font-orbitron)"}}>Sign Up for CWL</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Link your accounts &amp; join the player pool</p>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500 group-hover:text-purple-300 group-hover:translate-x-0.5 transition shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </a>
      )}

    </>
  );

  // Active wars — replace Sign Up + Rosters with war tiles
  return (
    <>
      {wars.map(war => (
        <div key={war.id}
          className="rounded-xl border border-pink-500/20 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
          {/* Header strip */}
          <div className="relative h-16 bg-gradient-to-r from-pink-500/[0.08] to-purple-500/[0.08] flex items-center px-5 gap-3 overflow-hidden">
            <img src="/icons/branding/war-shield.png" alt="Side War" className="w-10 h-10 shrink-0"/>
            <div>
              <p className="text-[9px] text-pink-400 uppercase tracking-widest font-semibold">Side War · Ore War</p>
              <p className="text-sm font-semibold text-white leading-tight" style={{fontFamily:"var(--font-orbitron)"}}>{war.clan_name}</p>
            </div>
            <img src="/icons/branding/ores.png" alt="Ores" className="absolute right-0 bottom-0 h-14 w-auto object-contain opacity-90 pointer-events-none"/>
          </div>
          {/* Time + CTA */}
          <div className="px-5 py-4 flex items-center justify-between gap-3">
            <SideWarTime war={war}/>
            <a href={war.clan_link} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-pink-600/30 text-pink-200 border border-pink-500/30 hover:bg-pink-600/50 hover:border-pink-400 transition shrink-0">
              Join Clan
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </a>
          </div>
        </div>
      ))}
    </>
  );
}

function CwlCountdown() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // CWL war week begins exactly when the new season starts: the 1st of the
  // month at 08:00 UTC (Clash of Clans' confirmed season-start time, not
  // midnight). War week runs the 1st-8th, so within that window CWL is live.
  const utcNow = new Date(now.toISOString());
  const thisMonthStart = new Date(Date.UTC(utcNow.getUTCFullYear(), utcNow.getUTCMonth(), 1, 8, 0, 0));
  const isLive = utcNow >= thisMonthStart && utcNow < new Date(thisMonthStart.getTime() + 8 * 24 * 60 * 60 * 1000);

  let label, timeLeft;
  if (isLive) {
    label = "CWL War Week";
    timeLeft = null;
  } else {
    const nextStart = utcNow < thisMonthStart
      ? thisMonthStart
      : new Date(Date.UTC(utcNow.getUTCFullYear(), utcNow.getUTCMonth() + 1, 1, 8, 0, 0));
    const msLeft = Math.max(0, nextStart - utcNow);
    const totalSeconds = Math.floor(msLeft / 1000);
    timeLeft = {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
    };
    label = "Next CWL Starts In";
  }

  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">{label}</p>
      {isLive ? (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
          <span className="text-3xl font-thin tracking-widest text-green-300" style={{fontFamily:"var(--font-orbitron)"}}>Live Now</span>
        </div>
      ) : (
        <div className="flex items-baseline gap-3">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-thin tracking-widest text-purple-300 tabular-nums" style={{fontFamily:"var(--font-orbitron)"}}>{timeLeft.days}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">days</span>
          </div>
          <span className="text-2xl text-slate-600 font-thin">:</span>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-thin tracking-widest text-purple-300 tabular-nums" style={{fontFamily:"var(--font-orbitron)"}}>{String(timeLeft.hours).padStart(2,"0")}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">hrs</span>
          </div>
          <span className="text-2xl text-slate-600 font-thin">:</span>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-thin tracking-widest text-purple-300 tabular-nums" style={{fontFamily:"var(--font-orbitron)"}}>{String(timeLeft.minutes).padStart(2,"0")}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">min</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stats highlight reel — rotates featured stat each load ────────────────
function StatsHighlightReel() {
  const [data, setData] = useState(null);
  const [featureType] = useState(() => {
    const types = ["stars", "efficiency", "threeStarRate", "clutch"];
    return types[Math.floor(Math.random() * types.length)];
  });

  useEffect(() => {
    fetch("/api/leaderboard").then(r => r.json()).then(d => setData(d.stats || [])).catch(() => setData([]));
  }, []);

  if (!data) {
    return <div className="h-24 rounded-lg bg-white/[0.03] animate-pulse"/>;
  }
  if (data.length === 0) {
    return <p className="text-slate-700 text-xs text-center py-4">No stats yet this season</p>;
  }

  const withAtks = data.filter(p => p.attacks_used > 0);
  let featured, statLabel, statValue, statColour;
  if (featureType === "efficiency" && withAtks.length) {
    featured = [...withAtks].sort((a,b) => parseFloat(b.efficiency||0) - parseFloat(a.efficiency||0))[0];
    statLabel = "Top Atk EFF"; statValue = parseFloat(featured.efficiency).toFixed(2); statColour = "text-purple-300";
  } else if (featureType === "threeStarRate" && withAtks.filter(p=>p.three_star_rate!=null).length) {
    featured = [...withAtks].filter(p=>p.three_star_rate!=null).sort((a,b) => parseFloat(b.three_star_rate||0) - parseFloat(a.three_star_rate||0))[0];
    statLabel = "Top 3★ Rate"; statValue = parseFloat(featured.three_star_rate).toFixed(0)+"%"; statColour = "text-green-300";
  } else if (featureType === "clutch" && withAtks.filter(p=>p.clutch_rate!=null).length) {
    featured = [...withAtks].filter(p=>p.clutch_rate!=null).sort((a,b) => parseFloat(b.clutch_rate||0) - parseFloat(a.clutch_rate||0))[0];
    statLabel = "Clutch King"; statValue = parseFloat(featured.clutch_rate).toFixed(2); statColour = "text-purple-300";
  } else {
    featured = [...data].sort((a,b) => (b.stars_earned||0) - (a.stars_earned||0))[0];
    statLabel = "Most Stars"; statValue = featured.stars_earned; statColour = "text-green-300";
  }

  if (!featured) return <p className="text-slate-700 text-xs text-center py-4">No stats yet this season</p>;

  return (
    <div>
      <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-2">Season Highlight</p>
      <div className="flex items-center gap-3 mb-3">
        {TH_ICONS[String(featured.town_hall_level)] && (
          <img src={TH_ICONS[String(featured.town_hall_level)]} alt="" className="w-9 h-9 shrink-0"/>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{featured.player_name}</p>
          <p className="text-[10px] text-slate-500">{statLabel}</p>
        </div>
        <span className={`ml-auto text-xl font-thin ${statColour}`}>{statValue}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-purple-500/[0.06] border border-purple-500/20 p-2">
          <div className="flex items-center gap-1 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            <p className="text-[7px] text-slate-500 uppercase tracking-widest">Atk EFF</p>
          </div>
          <p className="text-xs font-bold text-purple-300">{featured.efficiency != null ? parseFloat(featured.efficiency).toFixed(2) : "—"}</p>
        </div>
        <div className="rounded-xl bg-purple-500/[0.06] border border-purple-500/20 p-2">
          <div className="flex items-center gap-1 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/></svg>
            <p className="text-[7px] text-slate-500 uppercase tracking-widest">Clutch</p>
          </div>
          <p className="text-xs font-bold text-purple-300">{featured.clutch_rate != null ? parseFloat(featured.clutch_rate).toFixed(2) : "—"}</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [page, setPage] = useState("home");
  const [cwlActive, setCwlActive] = useState(false);

  useEffect(() => {
    // Check if CWL progress data exists to toggle Stats tile visibility
    fetch("/api/cwl-progress")
      .then(r => r.json())
      .then(d => setCwlActive(d.active === true))
      .catch(() => setCwlActive(false));
  }, []);
  useEffect(() => {
    const syncFromHash = () => {
      const hash = decodeURIComponent(window.location.hash.replace("#", ""));
      if (["roster"].includes(hash)) {
        setPage(hash);
      } else {
        setPage("home");
      }
    };
    syncFromHash();
    window.addEventListener("popstate", syncFromHash);
    return () => window.removeEventListener("popstate", syncFromHash);
  }, []);

  function navigate(key) {
    window.history.pushState({}, "", key === "home" ? window.location.pathname : `#${key}`);
    setPage(key);
  }

  if (page === "roster") {
    return <RosterHubView onNavigateHome={() => navigate("home")} onNavigateProfile={tag => { sessionStorage.setItem("profileSearchTag", tag); window.location.href = "/profile"; }} />;
  }

  return (
    <main className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      <img src="/roster-bg.png" alt="" className="fixed inset-0 select-none pointer-events-none opacity-20" style={{width:"100vw",height:"100dvh",objectFit:"cover",objectPosition:"center top"}}/>
      </div>

      <AppHeader variant="bar"/>

      {/* Brand hero */}
      <div className="relative z-10 text-center mb-6">
        <img src={BRANDING.cwlhub} alt="CWL Hub" className="w-40 h-40 mx-auto"/>
      </div>

      <div className="relative z-10 space-y-4 max-w-lg mx-auto">

        {/* Countdown — standalone, centred */}
        <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
          <CwlCountdown/>
        </div>

        {/* Side Wars when active, otherwise Sign Up + Rosters */}
        <SideWarsSection onNavigate={navigate}/>

        {/* CWL Progress — replaces Stats tile during CWL week */}
        <CwlProgressTile onNavigate={navigate}/>

        {/* Stats gateway — hidden during CWL week (CwlProgressTile takes over) */}
        {!cwlActive && (
        <a href="/leaderboard"
          className="w-full text-left rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 hover:bg-white/[0.06] hover:border-purple-500/30 transition group block">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">Stats &amp; Overview</span>
            <span className="flex items-center gap-1 text-[10px] text-purple-400 group-hover:text-purple-300 transition">
              View Leaderboard
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 group-hover:translate-x-0.5 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </span>
          </div>
          <StatsHighlightReel/>
        </a>
        )}
      </div>
      <AppFooter showHome={false}/>
    </main>
  );
}

function RosterHubView({ onNavigateHome, onNavigateProfile }) {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedClan, setSelectedClan] = useState(null);
  const [statView, setStatView] = useState(null); // null | "players" | "clans" | "avgth"
const [rosterSeasons, setRosterSeasons] = useState([]);

// Load roster history seasons on mount for historical filters
useEffect(() => {
  fetch("/api/roster-history")
    .then(r => r.json())
    .then(d => setRosterSeasons(d.seasons || []))
    .catch(() => {});
}, []);
const [highlightedAccount, setHighlightedAccount] = useState(null);
const [currentSeason, setCurrentSeason] = useState(null); // Neon-backed truth source

  useEffect(() => {
    fetch("/api/roster")
      .then(res => res.json())
      .then(data => setPlayers(data));
  }, []);

  // Fetch the current season from Neon so the homepage title always
  // reflects the admin-controlled season, not the Sheet-derived value.
  useEffect(() => {
    fetch("/api/season")
      .then(r => r.json())
      .then(data => setCurrentSeason(data.season || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
  const handlePopState = () => {
    const hash = decodeURIComponent(window.location.hash.replace("#", ""));

    // Stat tile views use reserved hash names; "roster" or empty hash means
    // this hub's own home state; anything else is treated as a clan name.
    if (hash === "players" || hash === "clans" || hash === "avgth") {
      setStatView(hash);
      setSelectedClan(null);
      setHighlightedAccount(null);
    } else if (hash === "roster" || !hash) {
      setStatView(null);
      setSelectedClan(null);
      setHighlightedAccount(null);
    } else {
      setStatView(null);
      setSelectedClan(hash);
    }
  };

  window.addEventListener("popstate", handlePopState);
  handlePopState();

  return () => {
    window.removeEventListener("popstate", handlePopState);
  };
}, []);

  const clans = [...new Set(players.map(p => p.clan))].sort((a, b) => {
    const rankA = players.find(p => p.clan === a)?.cwlRank;
    const rankB = players.find(p => p.clan === b)?.cwlRank;
    return rankSortIndex(rankA) - rankSortIndex(rankB);
  });
  const searchResults = players.filter(player =>
  player.account
    .toLowerCase()
    .includes(search.toLowerCase())
);
  const clanPlayers = selectedClan
  ? players.filter(p => p.clan === selectedClan)
  : [];

  if (statView === "players") {
    return <PlayersView players={players} rosterSeasons={rosterSeasons} onBack={() => { window.history.pushState({}, "", window.location.pathname); setStatView(null); }} onNavigateProfile={onNavigateProfile} />;
  }

  if (statView === "clans") {
    return <ClansView clans={clans} players={players} onBack={() => { window.history.pushState({}, "", window.location.pathname); setStatView(null); }} />;
  }

  if (statView === "avgth") {
    return <AvgThView players={players} clans={clans} onBack={() => { window.history.pushState({}, "", window.location.pathname); setStatView(null); }} />;
  }

  if (selectedClan) {
  const rank = clanPlayers?.[0]?.cwlRank ?? "unranked";
  const season = clanPlayers[0]?.season || "";
  const clanLink = clanPlayers[0]?.clanLink || "";
  const format = clanPlayers[0]?.cwlFormat || (clanPlayers.length >= 30 ? "30v30" : "15v15");
  return (
    <main className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      <img src="/roster-bg.png" alt="" className="fixed inset-0 select-none pointer-events-none opacity-20" style={{width:"100vw",height:"100dvh",objectFit:"cover",objectPosition:"center top"}}/>
      </div>
      <div className="relative z-10 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 mb-4 flex flex-col items-center text-center gap-2">
        <img src={CWL_ICONS[rank] || CWL_ICONS["unranked"]} alt={rank} className="w-12 h-12"/>
        <h1 className="text-4xl font-thin tracking-widest">{selectedClan}</h1>
        <p className="text-xs text-slate-400">{format}</p>
        {clanLink && (
          <a href={clanLink} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-semibold bg-purple-600/30 text-purple-200 border border-purple-500/30 hover:bg-purple-600/50 transition mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
            Open Clan
          </a>
        )}
      </div>
      <div className="relative z-10 space-y-2">
        {[...clanPlayers]
          .sort((a, b) => {
            const STATUS_ORDER = { confirmed: 0, registered: 1, substitute: 2 };
            const sa = STATUS_ORDER[a.status?.toLowerCase()] ?? 1;
            const sb = STATUS_ORDER[b.status?.toLowerCase()] ?? 1;
            if (sa !== sb) return sa - sb;
            return Number(b.townHall || 0) - Number(a.townHall || 0);
          })
          .map((player, index) => (
          <div key={`${player.clan}-${player.account}-${player.position}`}
            onClick={() => window.open(`/player/${(player.playerTag||"").replace("#","")}`, "_blank")}
            className={`rounded-lg border backdrop-blur-xl p-3 transition cursor-pointer
              ${highlightedAccount && player.playerTag === highlightedAccount
                ? "border-purple-500/40 bg-purple-500/10"
                : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]"
              }`}>
            <div className="flex items-center w-full justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xs text-slate-600 w-5 text-right shrink-0">{index + 1}</span>
                {TH_ICONS[player.townHall] && (
                  <img src={TH_ICONS[player.townHall]} alt={`TH${player.townHall}`} className="w-8 h-8 shrink-0"/>
                )}
                <span className="text-sm font-semibold text-white truncate">{player.account}</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold shrink-0
                ${player.status?.toLowerCase() === "confirmed" || player.status?.toLowerCase() === "active"
                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                  : player.status?.toLowerCase() === "substitute"
                  ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
                  : player.status?.toLowerCase() === "benched"
                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                  : player.status?.toLowerCase() === "inactive"
                  ? "bg-red-500/10 text-red-400 border-red-500/30"
                  : "bg-white/[0.04] text-slate-500 border-white/10"
                }`}>
                {player.status?.toLowerCase() === "registered" ? "Registered"
                  : player.status?.toLowerCase() === "confirmed" ? "Confirmed"
                  : player.status?.toLowerCase() === "substitute" ? "Substitute"
                  : player.status || "Registered"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
  return (
  <main
  className="
    min-h-screen
    overflow-x-hidden
    w-full
    max-w-full
    bg-gradient-to-b
    from-[#0b1020]
    via-[#070b17]
    to-[#05070f]
    text-white
    p-6
    pb-6
  "
>

  <div className="absolute inset-0 pointer-events-none">
  <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full" />
</div>

  <div className="absolute inset-0 pointer-events-none">

  <div
    className="
      absolute
      top-0
      left-1/2
      -translate-x-1/2
      w-[100px]
      max-w-[700px]
      h-[100px]
      max-h-[700px]
      rounded-full
      bg-purple-500/10
      blur-3xl
    "
  />

</div>

<AppHeader variant="bar"/>

    <motion.div
  initial={{ opacity: 0, y: 15 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
  className="relative z-20 mb-4 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 text-center"
>

  <h1 className="text-4xl font-thin tracking-widest">
    {currentSeason || players[0]?.season || "CWL Hub"}
  </h1>

  <p className="text-slate-500 text-xs mt-1">
    Cognition Collective
  </p>

  <div className="mt-4">
    <Link
      href="/signup"
      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-600/30 text-purple-200 border border-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.15)] hover:bg-purple-600/50 hover:shadow-[0_0_18px_rgba(168,85,247,0.28)] hover:border-purple-400 hover:text-purple-300 transition font-semibold text-sm"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Sign Up
    </Link>
  </div>

  <div className="mt-4 relative z-20 max-w-xs mx-auto text-left">
    <div className="relative">
      <input
        type="text"
        placeholder="Search players..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition"
      />
      {search && (
        <button onClick={() => setSearch("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-lg flex items-center justify-center bg-white/[0.08] text-slate-400 hover:text-white transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      )}
      {search && searchResults.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-white/10 bg-[#0d1424]/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50">
          {searchResults.map(player => (
            <div key={`${player.clan}-${player.account}-${player.position}`}
              onClick={() => { window.history.pushState({}, "", `#${player.clan}`); setHighlightedAccount(player.playerTag); setSelectedClan(player.clan); setSearch(""); }}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.05] transition border-b border-white/[0.04] last:border-0">
              {TH_ICONS[String(player.townHall)] && (
                <img src={TH_ICONS[String(player.townHall)]} alt={`TH${player.townHall}`} className="w-7 h-7 shrink-0"/>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{player.account}</p>
                <p className="text-[10px] text-slate-500 truncate">{player.clan}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {player.status?.toLowerCase() === "confirmed" && (
                  <span className="w-2 h-2 rounded-full bg-green-400 shrink-0"/>
                )}
                {player.status?.toLowerCase() === "substitute" && (
                  <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0"/>
                )}
                {player.clanLink && (
                  <a href={player.clanLink} target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-purple-600/30 text-purple-200 border border-purple-500/30 hover:bg-purple-600/50 hover:text-white transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                    Open
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {search && searchResults.length === 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-white/10 bg-[#0d1424]/95 backdrop-blur-xl shadow-2xl p-4 text-center z-50">
          <p className="text-xs text-slate-600">No players found</p>
        </div>
      )}
    </div>
  </div>

</motion.div>

    <div className="space-y-2 mb-8 relative z-10">
      {/* Players + Clans + Avg TH — not duplicated elsewhere in the app */}
      <div className="grid grid-cols-3 gap-2">
        <div
          onClick={() => { window.history.pushState({}, "", "#players"); setStatView("players"); }}
          className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 min-h-[90px] flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.06] hover:border-white/20 transition shadow-xl">
          <div className="text-3xl font-thin tracking-widest text-white tabular-nums">{players.length}</div>
          <div className="text-slate-400 text-xs uppercase tracking-widest mt-1">Players</div>
        </div>
        <div
          onClick={() => { window.history.pushState({}, "", "#clans"); setStatView("clans"); }}
          className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 min-h-[90px] flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.06] hover:border-white/20 transition">
          <div className="text-3xl font-thin tracking-widest text-white tabular-nums">{clans.length}</div>
          <div className="text-slate-400 text-xs uppercase tracking-widest mt-1">Clans</div>
        </div>
        <div
          onClick={() => { window.history.pushState({}, "", "#avgth"); setStatView("avgth"); }}
          className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 min-h-[90px] flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.06] hover:border-white/20 transition">
          <div className="text-3xl font-thin tracking-widest text-white tabular-nums">
            {players.length ? (players.reduce((sum, p) => sum + Number(p.townHall || 0), 0) / players.length).toFixed(1) : "-"}
          </div>
          <div className="text-slate-400 text-xs uppercase tracking-widest mt-1">Avg TH</div>
        </div>
      </div>
    </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {clans.map(clan => {

          const members =
            players.filter(p => p.clan === clan);

          const count =
            members.length;

          const rank = members?.[0]?.cwlRank ?? "unranked";
          
          const league = getLeagueStyles(rank) ?? {
  border: "border-white/10",
  glow: ""
};

          const season =
            members[0]?.season || "";

          const format =
            members[0]?.cwlFormat ||
            (count >= 30 ? "30v30" : "15v15");

          return (

            <motion.div
              key={clan}
              onClick={() => {
  window.history.pushState(
    {},
    "",
    `#${clan}`
  );

  setSelectedClan(clan);
}}
              whileHover={{
                y: -4,
                scale: 1.02
              }}
              whileTap={{
                scale: 0.98
              }}
              className="
              rounded-xl
              border
              border-white/10
              bg-white/[0.04]
              backdrop-blur-xl
              p-6
              min-h-[280px]
              w-full
              max-w-full
              flex
              flex-col
              items-center
              justify-between
              cursor-pointer
              shadow-xl
              "
            >

              <div className="text-center">

                <div
  className="
    text-xs
    uppercase
    tracking-[0.2em]
    text-purple-300
    mb-4
  "
>
  {rank}
</div>

                <img
  src={CWL_ICONS[rank] || CWL_ICONS["unranked"]}
  alt={rank}
  className="w-24 h-24 mx-auto mb-4"
/>

                <div className="text-2xl font-bold mt-2" style={{fontFamily:"var(--font-orbitron)"}}>
  {clan}
</div>

                <div className="text-lg text-slate-300 mt-4">
  {format}
</div>

                <div className="text-sm text-slate-500 mt-2">
  {season}
</div>

              </div>

              <div className="text-slate-500 text-sm">
  View Roster
</div>

            </motion.div>

          );

        })}

      </div>

    <AppFooter onNavigateHome={onNavigateHome}/>
  </main>
);}
