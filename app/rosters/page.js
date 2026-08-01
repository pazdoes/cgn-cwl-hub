"use client";
import { AppHeader, AppFooter } from "@/app/components/shared-views";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CWL_ICONS, TH_ICONS } from "../../lib/icons";
import { CWL_RANK_ORDER_HIST } from "@/lib/shared-constants";

// CWL_ICONS keys are exact-case ("Champion II"). Sheet values may not
// match that casing exactly even though CSS text-transform makes them
// look identical on screen — this does a case-insensitive lookup so the
// icon always resolves correctly regardless of how the rank string was
// typed/stored.
const CWL_ICON_LOOKUP = Object.fromEntries(
  Object.entries(CWL_ICONS).map(([k, v]) => [k.toLowerCase(), v])
);
function getRankIcon(rank) {
  const cleaned = (rank || "").replace(/\bLeague\s+/i, "").trim().toLowerCase();
  return CWL_ICON_LOOKUP[cleaned] || CWL_ICON_LOOKUP["unranked"];
}
import { BRANDING } from "../../lib/branding";
import DiscordWidget from "../components/DiscordWidget";

export default function RostersPage() {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedClan, setSelectedClan] = useState(null);
  const [highlightedAccount, setHighlightedAccount] = useState(null);
  const [currentSeason, setCurrentSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inPool, setInPool] = useState(0);
  const [assigned, setAssigned] = useState(0);
  const [pct, setPct] = useState(0);
  const [now, setNow] = useState(new Date());
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/roster").then(r => r.json()),
      fetch("/api/season").then(r => r.json()),
      fetch("/api/pool/count").then(r => r.json()),
    ]).then(([rosterData, seasonData, poolData]) => {
      setPlayers(Array.isArray(rosterData) ? rosterData : []);
      setCurrentSeason(seasonData.season || null);
      setInPool(poolData.inPool || 0);
      setAssigned(poolData.assigned || 0);
      setPct(poolData.pct || 0);
    }).catch(() => {
      setError("Failed to load roster data. Please try again.");
    }).finally(() => setLoading(false));
  }, []);

  // CWL countdown — 1st of month at 08:00 UTC
  const utcNow = new Date(now.toISOString());
  const thisMonthStart = new Date(Date.UTC(utcNow.getUTCFullYear(), utcNow.getUTCMonth(), 1, 8, 0, 0));
  const isLive = utcNow >= thisMonthStart && utcNow < new Date(thisMonthStart.getTime() + 8 * 24 * 60 * 60 * 1000);
  const nextStart = utcNow < thisMonthStart
    ? thisMonthStart
    : new Date(Date.UTC(utcNow.getUTCFullYear(), utcNow.getUTCMonth() + 1, 1, 8, 0, 0));
  const msLeft = Math.max(0, nextStart - utcNow);
  const totalSeconds = Math.floor(msLeft / 1000);
  const timeLeft = {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
  };

  const CWL_RANK_ORDER = CWL_RANK_ORDER_HIST.map(r => r.toLowerCase());
  const cleanRank = r => (r || "").replace(/\bLeague\s+/i, "").trim().toLowerCase();
  const clans = [...new Set(players.map(p => p.clan))].sort((a, b) => {
    const aRank = cleanRank(players.find(p => p.clan === a)?.cwlRank);
    const bRank = cleanRank(players.find(p => p.clan === b)?.cwlRank);
    const aIdx = CWL_RANK_ORDER.indexOf(aRank);
    const bIdx = CWL_RANK_ORDER.indexOf(bRank);
    const aSort = aIdx === -1 ? 999 : aIdx;
    const bSort = bIdx === -1 ? 999 : bIdx;
    return aSort - bSort;
  });
  const searchResults = players.filter(p => p.account?.toLowerCase().includes(search.toLowerCase()));
  const clanPlayers = selectedClan ? players.filter(p => p.clan === selectedClan) : [];

  const BG = (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      <img src="/roster-bg.png" alt="" className="fixed inset-0 select-none pointer-events-none opacity-20" style={{width:"100vw",height:"100dvh",objectFit:"cover",objectPosition:"center top"}}/>
    </div>
  );

  // Clan detail view
  if (selectedClan) {
    const rank = (clanPlayers[0]?.cwlRank ?? "unranked").trim();
    const format = clanPlayers[0]?.cwlFormat || (clanPlayers.length >= 30 ? "30v30" : "15v15");
    const clanLink = clanPlayers[0]?.clanLink || "";
    return (
      <main className="overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
        {BG}
        <AppHeader/>
        <div className="relative z-10 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 mb-4 flex flex-col items-center text-center gap-2">
          <img src={getRankIcon(rank)} alt={rank} className="w-12 h-12"/>
          <h1 className="text-4xl font-thin tracking-widest">{selectedClan}</h1>
          <p className="text-xs text-slate-400">{format}</p>
          {clanLink && (
            <a href={clanLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-transparent text-purple-400 border border-purple-500/40 hover:border-purple-400 transition mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              Open Clan
            </a>
          )}
        </div>
        <div className="relative z-10 space-y-2">
          {[...clanPlayers].sort((a, b) => {
            const ORDER = { confirmed: 0, registered: 1, substitute: 2 };
            const sa = ORDER[a.status?.toLowerCase()] ?? 1;
            const sb = ORDER[b.status?.toLowerCase()] ?? 1;
            if (sa !== sb) return sa - sb;
            return Number(b.townHall || 0) - Number(a.townHall || 0);
          }).map((player, index) => (
            <div key={`${player.clan}-${player.account}-${index}`}
              className={`rounded-lg border backdrop-blur-xl p-3 ${highlightedAccount && player.playerTag === highlightedAccount ? "border-purple-500/40 bg-purple-500/10" : "border-white/10 bg-white/[0.04]"}`}>
              <div className="flex items-center w-full justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs text-slate-600 w-5 text-right shrink-0">{index + 1}</span>
                  {TH_ICONS[player.townHall] && <img src={TH_ICONS[player.townHall]} alt={`TH${player.townHall}`} className="w-8 h-8 shrink-0"/>}
                  <span className="text-sm font-semibold text-white truncate">{player.account}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0 ${
                  player.status?.toLowerCase() === "confirmed" || player.status?.toLowerCase() === "active" ? "bg-green-500/10 text-green-400 border-green-500/30"
                  : player.status?.toLowerCase() === "substitute" ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
                  : "bg-white/[0.04] text-slate-500 border-white/10"
                }`}>
                  {player.status?.toLowerCase() === "confirmed" ? "Confirmed" : player.status?.toLowerCase() === "substitute" ? "Substitute" : player.status || "Registered"}
                </span>
              </div>
            </div>
          ))}
        </div>
        <AppFooter onNavigateHome={() => setSelectedClan(null)}/>
      </main>
    );
  }

  // Hub view
  if (!loading && error) return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4">
      <AppHeader/>
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-4">
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] backdrop-blur-xl p-6 text-center max-w-xs w-full">
          <p className="text-sm text-red-400 mb-4">{error}</p>
          <button onClick={() => { setError(null); setLoading(true); }}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs text-slate-300 hover:bg-white/[0.06] transition">
            Retry
          </button>
        </div>
      </div>
      <AppFooter/>
    </main>
  );

  return (
    <main className="overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-6 pb-6">
      {BG}
      <AppHeader/>

      {/* Title */}
      <div className="relative z-10 mb-6 text-center">
        <h1 className="text-4xl font-thin tracking-widest mb-1">CWL Rosters</h1>
        {currentSeason && <p className="text-slate-500 text-xs uppercase tracking-widest">{currentSeason}</p>}
      </div>

      {/* Search */}
      <div className="relative z-20 mb-6">
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input type="text" placeholder="Search players…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-xl px-4 py-3 pl-10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/40 transition"/>
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center bg-white/[0.08] text-slate-400 hover:text-white transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          )}
        </div>
        {search && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-white/10 bg-[#0d1424]/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50">
            {searchResults.map((player, i) => (
              <div key={i} onClick={() => { setHighlightedAccount(player.playerTag); setSelectedClan(player.clan); setSearch(""); }}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.05] transition border-b border-white/[0.04] last:border-0">
                {TH_ICONS[String(player.townHall)] && <img src={TH_ICONS[String(player.townHall)]} alt={`TH${player.townHall}`} className="w-7 h-7 shrink-0"/>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{player.account}</p>
                  <p className="text-[10px] text-slate-500 truncate">{player.clan}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {player.status?.toLowerCase() === "confirmed" && <span className="w-2 h-2 rounded-full bg-green-400"/>}
                  {player.status?.toLowerCase() === "substitute" && <span className="w-2 h-2 rounded-full bg-orange-400"/>}
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

      {/* Stats */}
      {!loading && players.length > 0 && (
        <div className="space-y-2 mb-8 relative z-10">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 min-h-[90px] flex flex-col items-center justify-center shadow-xl">
              <div className="text-3xl font-thin tracking-widest text-white tabular-nums">{players.length}</div>
              <div className="text-slate-400 text-xs uppercase tracking-widest mt-1">Players</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 min-h-[90px] flex flex-col items-center justify-center">
              <div className="text-3xl font-thin tracking-widest text-white tabular-nums">{clans.length}</div>
              <div className="text-slate-400 text-xs uppercase tracking-widest mt-1">Clans</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 min-h-[90px] flex flex-col items-center justify-center">
              <div className="text-3xl font-thin tracking-widest text-white tabular-nums">
                {players.length ? (players.reduce((s, p) => s + Number(p.townHall || 0), 0) / players.length).toFixed(1) : "-"}
              </div>
              <div className="text-slate-400 text-xs uppercase tracking-widest mt-1">Avg TH</div>
            </div>
          </div>
        </div>
      )}

      {loading && <div className="space-y-4">{[...Array(3)].map((_,i) => <div key={i} className="h-[280px] rounded-xl bg-white/[0.04] animate-pulse"/>)}</div>}

      {!loading && players.length === 0 && (
        <div className="space-y-4">
          {/* CWL Countdown */}
          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 text-center">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-4">{isLive ? "CWL War Week" : "Next CWL Starts In"}</p>
            {isLive ? (
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
                <span className="text-3xl font-thin tracking-widest text-green-300" style={{fontFamily:"var(--font-orbitron)"}}>Live Now</span>
              </div>
            ) : (
              <div className="flex items-baseline justify-center gap-3">
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

          {/* Roster completion */}
          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Roster Progress</p>
              <p className={`text-lg font-thin ${pct === 100 ? "text-green-300" : pct >= 75 ? "text-amber-300" : "text-red-400"}`}>{pct}%</p>
            </div>
            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full bg-purple-500/60 transition-all" style={{width: `${pct}%`}}/>
            </div>
            <p className="text-[10px] text-slate-600 mt-3 text-center">
              {assigned} assigned · {inPool} in pool
            </p>
          </div>
        </div>
      )}

      {!loading && players.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {clans.map(clan => {
            const members = players.filter(p => p.clan === clan);
            const rank = (members[0]?.cwlRank ?? "unranked").trim();
            const format = members[0]?.cwlFormat || (members.length >= 30 ? "30v30" : "15v15");
            const season = members[0]?.season || "";
            return (
              <motion.div key={clan} onClick={() => setSelectedClan(clan)}
                whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 min-h-[280px] w-full max-w-full flex flex-col items-center justify-between cursor-pointer shadow-xl">
                <div className="text-center">
                  <div className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-4">{rank}</div>
                  <img src={getRankIcon(rank)} alt={rank} className="w-24 h-24 mx-auto mb-4"/>
                  <div className="text-2xl font-bold mt-2">{clan}</div>
                  <div className="text-lg text-slate-300 mt-4">{format}</div>
                  <div className="text-sm text-slate-500 mt-2">{season}</div>
                </div>
                <div className="text-slate-500 text-sm">View Roster</div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AppFooter onNavigateHome={() => { window.location.href = "/"; }}/>
    </main>
  );
}
