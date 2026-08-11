"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PlayerPerformanceChart, ClanPerformanceChart, AppHeader, AppFooter,
} from "@/app/components/shared-views";

function HistoryView() {
  const router = useRouter();
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("player"); // "rank" | "player"
  const [allData, setAllData] = useState(null);
  const [seasons, setSeasons] = useState([]);

  useEffect(() => {
    fetch("/api/history")
      .then(r => r.json())
      .then(data => setHistory(data.history || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then(r => r.json())
      .then(async d => {
        // Use API order reversed — API returns newest first, chart needs oldest first
        const allSeasons = (d.seasons || []).slice().reverse();
        setSeasons(allSeasons);
        // Linked accounts set — per-season fetches below now correctly
        // include unlinked players (season-snapshot rule), so this
        // cross-season player tracking chart must filter back down to
        // linked accounts only.
        const linkedRes = await fetch("/api/linked-accounts").then(r => r.json()).catch(() => ({ tags: [] }));
        const linkedTags = new Set(linkedRes.tags || []);
        const rows = [];
        for (const s of allSeasons) {
          try {
            const r = await fetch(`/api/leaderboard?season=${encodeURIComponent(s)}`);
            const sd = await r.json();
            (sd.stats || []).forEach(p => {
              if (!linkedTags.has(p.player_tag)) return;
              rows.push({
                ...p,
                season: s,
                overall: (p.attacks_used > 0 && p.attacks_available > 0)
                  ? parseFloat(((parseFloat(p.efficiency||0)*0.6)+((3-parseFloat(p.defence_efficiency||0))*0.4)).toFixed(2))
                  : null,
              });
            });
          } catch {}
        }
        setAllData(rows);
      })
      .catch(() => setAllData([]));
  }, []);



  return (
    <main className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      <img src="/roster-bg.png" alt="" className="fixed inset-0 select-none pointer-events-none opacity-20" style={{width:"100vw",height:"100dvh",objectFit:"cover",objectPosition:"center top"}}/>
      </div>

      <AppHeader variant="bar"/>

      {/* Hero card */}
      <div className="relative z-10 mb-4 text-center">
        <h1 className="text-4xl font-thin tracking-widest mb-1" style={{fontFamily:"var(--font-orbitron)"}}>History</h1>
        <p className="text-slate-500 text-xs mb-4">CWL performance records by season</p>

        {/* Tab indicator dots */}
        <div className="flex items-center justify-center gap-1.5 mb-3">
          <span className={`w-1.5 h-1.5 rounded-full transition ${tab === "player" ? "bg-purple-400" : "bg-white/20"}`}/>
          <span className={`w-1.5 h-1.5 rounded-full transition ${tab === "rank" ? "bg-purple-400" : "bg-white/20"}`}/>
        </div>

        {/* Arrow toggles */}
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setTab("player")} className="text-slate-500 hover:text-slate-300 transition p-1" title="Player Performance">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <span className="text-[10px] text-slate-600 uppercase tracking-widest select-none min-w-[100px]">
            {tab === "player" ? "Player Performance" : "Clan Performance"}
          </span>
          <button onClick={() => setTab("rank")} className="text-slate-500 hover:text-slate-300 transition p-1" title="Clan Performance">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Clan Performance tab */}
      {tab === "rank" && (
        <div className="relative z-10">
          {loading ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 animate-pulse">
              <div className="h-48 rounded-xl bg-white/[0.06]"/>
            </div>
          ) : (
            <ClanPerformanceChart history={history}/>
          )}
        </div>
      )}

      {/* Player Performance tab */}
      {tab === "player" && (
        <div className="relative z-10">
          <PlayerPerformanceChart allData={allData} seasons={seasons}/>
        </div>
      )}
      <AppFooter/>
    </main>
  );
}



// ─── CWL player performance leaderboard ────────────────────────────────────

export default HistoryView;
