"use client";

import { useState, useEffect, useRef } from "react";
import { BRANDING } from "../../lib/branding";

// ─── Shared branded header + hamburger nav ──────────────────────────────────
function AppHeader() {
  const [navOpen, setNavOpen] = useState(false);
  const tapCount = useRef(0);
  const tapTimer = useRef(null);
  function handleBrandTap() {
    tapCount.current += 1;
    if (tapCount.current >= 5) { clearTimeout(tapTimer.current); tapCount.current = 0; setNavOpen(false); window.location.href = "/admin"; return; }
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 3000);
  }
  const sections = [
    { items: [{ key: "", label: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" }] },
    { label: "Members", items: [
      { key: "signup", label: "Sign Up", icon: "M12 4v16m8-8H4", href: "/signup" },
      { key: "rosters", label: "View Rosters", icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4", href: "/rosters" },
      { key: "profile", label: "Player Profile", icon: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    ]},
    { label: "Rankings", items: [
      { key: "leaderboard", label: "CWL Leaderboard", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
      { key: "ranked", label: "Ranked Leaderboard", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
    ]},
    { label: "Records", items: [
      { key: "recap", label: "Season Recap", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
      { key: "history", label: "History", icon: "M7 17l4-8 4 5 2-3M3 3v18h18" },
    ]},
    { label: "War", items: [
      { key: "warintel", label: "War Intel", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" },
    ]},
  ];
  function go(key) {
    setNavOpen(false);
    if (typeof window === "undefined") return;
    window.location.href = key === "" ? "/" : `/#${key}`;
  }
  return (
    <>
      <div className={`fixed inset-0 z-50 flex transition-opacity duration-150 ${navOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={() => setNavOpen(false)}>
        <div className="absolute inset-0 bg-black/60"/>
        <div onClick={e => e.stopPropagation()} className={`relative z-10 w-72 max-w-[80vw] h-full bg-[#0d1424] border-r border-white/10 flex flex-col p-5 transition-transform duration-150 ${navOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center gap-2 mb-8 cursor-default select-none" onClick={handleBrandTap}>
            <img src="/icons/branding/cgn-skull.png" alt="CGN" className="w-7 h-7"/>
            <span className="text-sm text-white tracking-widest uppercase">Cognition {"{CGN}"}</span>
          </div>
          <nav className="flex-1 space-y-4 overflow-y-auto">
            {sections.map((section, si) => (
              <div key={si}>
                {section.label && <p className="text-[9px] text-slate-600 uppercase tracking-widest px-3 mb-1">{section.label}</p>}
                <div className="space-y-0.5">
                  {section.items.map(item => item.href ? (
                    <a key={item.key} href={item.href} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition text-left">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/></svg>
                      {item.label}
                    </a>
                  ) : (
                    <button key={item.key || "home"} onClick={() => go(item.key)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition text-left">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/></svg>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <a href="https://discord.gg/czqKKSF4Ta" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs text-slate-500 hover:text-white hover:bg-white/[0.06] transition mt-2">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
            Discord
          </a>
        </div>
      </div>
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#070b17]/80 backdrop-blur-xl">
        <div className="max-w-md mx-auto flex items-center gap-3 px-4 py-3">
          <button onClick={() => setNavOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/[0.06] transition text-slate-400 hover:text-white shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div className="flex items-center gap-2 flex-1">
            <img src="/icons/branding/cgn-skull.png" alt="CGN" className="w-6 h-6"/>
            <span className="text-xs text-slate-400 tracking-widest uppercase font-medium">Cognition {"{CGN}"}</span>
          </div>
        </div>
      </header>
    </>
  );
}

function ThIcon({ level }) {
  if (!level) return <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10"/>;
  return <img src={`/icons/th/th${level}.png`} alt={`TH${level}`} className="w-8 h-8 object-contain"/>;
}

export default function RostersPage() {
  const [players, setPlayers] = useState([]);
  const [clans, setClans] = useState([]);
  const [selectedClan, setSelectedClan] = useState(null);
  const [season, setSeason] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/roster").then(r => r.json()),
      fetch("/api/season").then(r => r.json()),
    ]).then(([rosterData, seasonData]) => {
      const allPlayers = Array.isArray(rosterData) ? rosterData : [];
      setPlayers(allPlayers);
      const uniqueClans = [...new Set(allPlayers.map(p => p.clan).filter(Boolean))];
      setClans(uniqueClans);
      if (uniqueClans.length > 0) setSelectedClan(uniqueClans[0]);
      setSeason(seasonData.season || null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const clanPlayers = players.filter(p => p.clan === selectedClan);
  const confirmed = clanPlayers.filter(p => p.status === "confirmed" || !p.status);
  const subs = clanPlayers.filter(p => p.status === "substitute");

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f]">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      </div>
      <AppHeader/>
      <main className="relative z-10 max-w-md mx-auto px-4 py-6 pb-16 space-y-4">
        {/* Hero tile */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 text-center">
          <h1 className="text-2xl font-thin tracking-widest mb-1">CWL Rosters</h1>
          {season && <p className="text-slate-500 text-xs uppercase tracking-widest">{season}</p>}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_,i) => <div key={i} className="h-16 rounded-3xl bg-white/[0.04] animate-pulse"/>)}</div>
        ) : players.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 text-center">
            <p className="text-slate-500 text-sm">No rosters published yet.</p>
            <p className="text-slate-600 text-xs mt-1">Check back soon — rosters will appear here once published by an officer.</p>
          </div>
        ) : (
          <>
            {/* Clan selector pills */}
            {clans.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {clans.map(c => (
                  <button key={c} onClick={() => setSelectedClan(c)}
                    className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-semibold border transition ${
                      selectedClan === c
                        ? "border-purple-500/60 bg-purple-500/15 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                        : "border-white/10 bg-white/[0.02] text-slate-500 hover:text-slate-300 hover:border-white/20"
                    }`}>
                    {c.split(" ")[0]}
                  </button>
                ))}
              </div>
            )}

            {/* Roster tile */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
              {/* Clan header */}
              <div className="px-5 pt-5 pb-3 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white">{selectedClan}</h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">{confirmed.length} confirmed · {subs.length} sub{subs.length !== 1 ? "s" : ""}</p>
                </div>
              </div>

              {/* Confirmed */}
              {confirmed.length > 0 && (
                <div className="divide-y divide-white/[0.04]">
                  {confirmed.map((p, i) => (
                    <div key={p.tag || i} className="flex items-center gap-3 px-5 py-3">
                      <span className="text-[10px] text-slate-600 w-5 shrink-0 text-right">{i + 1}</span>
                      <ThIcon level={p.townHall || p.town_hall_level}/>
                      <p className="text-sm text-white font-semibold flex-1 truncate">{p.name}</p>
                      <span className="text-[9px] text-green-400 border border-green-500/30 rounded-full px-2 py-0.5 uppercase tracking-widest shrink-0">Confirmed</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Subs */}
              {subs.length > 0 && (
                <>
                  <div className="px-5 py-2 border-t border-white/[0.06]">
                    <p className="text-[9px] text-slate-600 uppercase tracking-widest">Substitutes</p>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {subs.map((p, i) => (
                      <div key={p.tag || i} className="flex items-center gap-3 px-5 py-3 opacity-75">
                        <span className="text-[10px] text-slate-600 w-5 shrink-0 text-right">—</span>
                        <ThIcon level={p.townHall || p.town_hall_level}/>
                        <p className="text-sm text-white font-semibold flex-1 truncate">{p.name}</p>
                        <span className="text-[9px] text-orange-400 border border-orange-500/30 rounded-full px-2 py-0.5 uppercase tracking-widest shrink-0">Sub</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {clanPlayers.length === 0 && (
                <p className="text-slate-600 text-xs text-center py-8">No players on this roster yet.</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
