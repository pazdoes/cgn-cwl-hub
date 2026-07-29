"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
    <main className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] p-4 pb-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      </div>
      <div className="relative z-10 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pt-2">
          <Link href="/" className="w-8 h-8 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center text-slate-500 hover:text-white hover:border-white/20 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-thin tracking-widest text-white">CWL Rosters</h1>
            {season && <p className="text-[10px] text-slate-500 uppercase tracking-widest">{season}</p>}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="h-16 rounded-3xl bg-white/[0.04] animate-pulse"/>)}</div>
        ) : players.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
            <p className="text-slate-500 text-sm">No rosters published yet.</p>
            <p className="text-slate-600 text-xs mt-1">Check back soon.</p>
          </div>
        ) : (
          <>
            {/* Clan selector */}
            {clans.length > 1 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {clans.map(c => (
                  <button key={c} onClick={() => setSelectedClan(c)}
                    className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-semibold border transition ${
                      selectedClan === c
                        ? "border-purple-500/60 bg-purple-500/15 text-purple-300"
                        : "border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20"
                    }`}>
                    {c.split(" ")[0]}
                  </button>
                ))}
              </div>
            )}

            {/* Roster */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
              <div className="px-5 pt-5 pb-3 border-b border-white/[0.06]">
                <h2 className="text-sm font-semibold text-white">{selectedClan}</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">{confirmed.length} confirmed · {subs.length} sub{subs.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {confirmed.map((p, i) => (
                  <div key={p.tag || i} className="flex items-center gap-3 px-5 py-3">
                    <span className="text-[10px] text-slate-600 w-4 shrink-0">{i + 1}</span>
                    <ThIcon level={p.townHall || p.town_hall_level}/>
                    <p className="text-sm text-white font-semibold flex-1 truncate">{p.name}</p>
                    <span className="text-[9px] text-green-400 border border-green-500/30 rounded-full px-2 py-0.5 uppercase tracking-widest shrink-0">Confirmed</span>
                  </div>
                ))}
                {subs.map((p, i) => (
                  <div key={p.tag || i} className="flex items-center gap-3 px-5 py-3 opacity-70">
                    <span className="text-[10px] text-slate-600 w-4 shrink-0">—</span>
                    <ThIcon level={p.townHall || p.town_hall_level}/>
                    <p className="text-sm text-white font-semibold flex-1 truncate">{p.name}</p>
                    <span className="text-[9px] text-orange-400 border border-orange-500/30 rounded-full px-2 py-0.5 uppercase tracking-widest shrink-0">Sub</span>
                  </div>
                ))}
                {clanPlayers.length === 0 && (
                  <p className="text-slate-600 text-xs text-center py-8">No players on this roster yet.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
