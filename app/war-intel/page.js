"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MatchupsPanel, WarMomentumChart, AppHeader, AppFooter,
} from "@/app/components/shared-views";

function WarIntelView() {
  const router = useRouter();
  const [tab, setTab] = useState("days");
  const [loading, setLoading] = useState(true);
  const [dayData, setDayData] = useState(null);
  const [matchupData, setMatchupData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [clanData, setClanData] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("all");
  const [registeredClanTags, setRegisteredClanTags] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/war-intel/days").then(r => r.json()).catch(() => ({})).then(d => {
      setDayData(d.days || []);
      setSeasons(d.seasons || []);
    });
    // Registered clan tags — used to scope the "All Seasons" aggregate view
    // of Days to currently-registered clans, matching the same rule applied
    // to Clans/Matchups/Attendance when no specific season is selected.
    fetch("/api/war-intel/clans").then(r => r.json()).catch(() => ({})).then(c => {
      setRegisteredClanTags(new Set((c.clans || []).map(cl => cl.clan_tag)));
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const seasonParam = selectedSeason === "all" ? "" : `?season=${encodeURIComponent(selectedSeason)}`;
    Promise.all([
      fetch(`/api/war-intel/matchups${seasonParam}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/war-intel/attendance${seasonParam}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/war-intel/clans${seasonParam}`).then(r => r.json()).catch(() => ({})),
    ]).then(([m, a, c]) => {
      setMatchupData(m.matchups || []);
      setAttendanceData(a.attendance || []);
      setClanData(c.clans || []);
      setLoading(false);
    });
  }, [selectedSeason]);

  const TABS = [["days","Days"],["matchups","Matchups"],["attendance","Attendance"],["clans","Clans"]];

  // Filter day data by season. "All Seasons" is an aggregate view, so it's
  // scoped to currently-registered clans; a specific season is a snapshot
  // and shows every clan that played that season, registered or not.
  const filteredDays = selectedSeason === "all"
    ? dayData?.filter(d => !registeredClanTags || registeredClanTags.has(d.clan_tag))
    : dayData?.filter(d => d.season === selectedSeason);

  // Aggregate days across seasons
  const dayAggregates = (() => {
    if (!filteredDays?.length) return [];
    const map = {};
    for (const d of filteredDays) {
      if (!map[d.war_day]) map[d.war_day] = { war_day: d.war_day, _starSum: 0, _count: 0, wins: 0, losses: 0, draws: 0 };
      const m = map[d.war_day];
      m._starSum += parseFloat(d.avg_stars || 0);
      m._count++;
      if (d.war_result === "win") m.wins++;
      else if (d.war_result === "loss") m.losses++;
      else m.draws++;
    }
    return Object.values(map).sort((a, b) => a.war_day - b.war_day).map(m => ({
      ...m,
      avg_stars: m._count > 0 ? (m._starSum / m._count).toFixed(2) : null,
    }));
  })();

  const maxStars = Math.max(...dayAggregates.map(d => parseFloat(d.avg_stars || 0)), 1);

  if (error) return (
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
    <main className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      <img src="/roster-bg.png" alt="" className="fixed inset-0 select-none pointer-events-none opacity-20" style={{width:"100vw",height:"100dvh",objectFit:"cover",objectPosition:"center top"}}/>
      </div>

      <AppHeader variant="bar"/>

      {/* Hero card */}
      <div className="relative z-10 mb-4 text-center">
        <h1 className="text-4xl font-thin tracking-widest mb-1">War Intel</h1>
        <p className="text-slate-500 text-xs mb-4">Alliance war performance analytics</p>
        <div className="flex items-center justify-center gap-4 mb-3">
          <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-300 transition p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <span className="text-[10px] text-slate-600 uppercase tracking-widest select-none min-w-[80px] text-center">War Intel</span>
          <span className="w-6 h-6"/>
        </div>
        <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)}
          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white focus:outline-none [color-scheme:dark]">
          <option value="all">All Seasons</option>
          {seasons.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Tab nav */}
      <div className="relative z-10 flex items-center justify-center gap-1 mb-4">
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] uppercase tracking-widest font-semibold border transition ${
              tab === key
                ? "border-purple-500/60 bg-purple-500/15 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                : "border-white/10 bg-transparent text-slate-500 hover:text-slate-300 hover:border-white/20"
            }`}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/10 bg-white/[0.04] h-24 animate-pulse"/>)}
        </div>
      ) : (
        <div className="relative z-10 space-y-4">

          {/* ── DAYS TAB ── */}
          {tab === "days" && (
            <>
              {/* War momentum cumulative chart — above bar chart */}
              {dayAggregates.length >= 2 && <WarMomentumChart dayAggregates={dayAggregates} />}

              {/* Avg stars bar chart */}
              <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
                <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-4">Avg Stars Per War Day</p>
                {dayAggregates.length === 0 ? (
                  <p className="text-slate-700 text-xs text-center py-6">No data available</p>
                ) : (
                  <div className="space-y-2">
                    {dayAggregates.map(d => {
                      const pct = maxStars > 0 ? (parseFloat(d.avg_stars) / maxStars) * 100 : 0;
                      const stars = parseFloat(d.avg_stars || 0);
                      const colour = stars >= 2.8 ? "bg-green-500/60" : stars >= 2.4 ? "bg-amber-500/60" : "bg-red-500/60";
                      return (
                        <div key={d.war_day} className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-500 w-10 shrink-0">Day {d.war_day}</span>
                          <div className="flex-1 h-5 rounded-full bg-white/[0.04] overflow-hidden">
                            <div className={`h-full rounded-full ${colour} transition-all`} style={{width:`${pct}%`}}/>
                          </div>
                          <span className="text-[10px] text-slate-300 w-8 text-right shrink-0">{d.avg_stars}★</span>
                          <span className="text-[9px] text-slate-600 w-12 shrink-0">{d.wins}W-{d.losses}L{d.draws > 0 ? `-${d.draws}D` : ""}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* War momentum cumulative chart — moved above */}
            </>
          )}

          {/* ── MATCHUPS TAB ── */}
          {tab === "matchups" && (
            <MatchupsPanel matchupData={matchupData} />
          )}

          {/* ── ATTENDANCE TAB ── */}
          {tab === "attendance" && (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
              <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-4">Missed Attacks by Player</p>
              {attendanceData.length === 0 ? (
                <p className="text-slate-700 text-xs text-center py-6">No missed attacks on record</p>
              ) : (
                <div className="space-y-2">
                  {attendanceData.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                      <span className="flex-1 text-xs text-slate-300 truncate">{a.player_name}</span>
                      <span className="text-[9px] text-slate-500 shrink-0">{a.seasons_played} season{a.seasons_played !== 1 ? "s" : ""}</span>
                      <span className={`text-sm font-semibold shrink-0 w-6 text-right ${a.missed > 2 ? "text-red-400" : a.missed > 0 ? "text-amber-400" : "text-slate-600"}`}>{a.missed}</span>
                      <span className="text-[9px] text-slate-600 shrink-0">missed</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CLANS TAB ── */}
          {tab === "clans" && (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
              <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-4">Clan Comparison</p>
              {clanData.length === 0 ? (
                <p className="text-slate-700 text-xs text-center py-6">No data available</p>
              ) : (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-xs min-w-[300px]">
                    <thead>
                      <tr>
                        <th className="text-[9px] text-slate-600 uppercase tracking-widest font-normal pb-3 text-left px-1 w-24">Metric</th>
                        {clanData.map((c, i) => (
                          <th key={i} className="text-[9px] text-slate-400 font-semibold pb-3 text-center px-1 whitespace-nowrap">
                            {c.clan_name?.split(" ")[0]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {[
                        { label: "Avg ★/Day",   key: "avg_stars",              fmt: v => parseFloat(v).toFixed(2) + "★", colour: "text-amber-300" },
                        { label: "3★ Rate",      key: "three_star_rate",         fmt: v => parseFloat(v).toFixed(0) + "%",  colour: "text-green-300" },
                        { label: "Punch-Up",     key: "punch_up_rate",           fmt: v => parseFloat(v).toFixed(0) + "%",  colour: "text-blue-300" },
                        { label: "Atk Eff",      key: "avg_attack_efficiency",   fmt: v => parseFloat(v).toFixed(2),        colour: "text-purple-300" },
                        { label: "Def Eff",      key: "avg_defence_efficiency",  fmt: v => parseFloat(v).toFixed(2),        colour: "text-red-400" },
                        { label: "★ Conceded",   key: "avg_stars_conceded",      fmt: v => parseFloat(v).toFixed(2),        colour: "text-red-300" },
                        { label: "Wars Won",     key: "wins",                    fmt: v => v,                               colour: "text-purple-300" },
                        { label: "Wars Lost",    key: "losses",                  fmt: v => v,                               colour: "text-red-400" },
                        { label: "Total Wars",   key: "total_wars",              fmt: v => v,                               colour: "text-slate-400" },
                      ].map(metric => (
                        <tr key={metric.key}>
                          <td className="py-2.5 px-1 text-[9px] text-slate-600 uppercase tracking-widest whitespace-nowrap">{metric.label}</td>
                          {clanData.map((c, i) => (
                            <td key={i} className={`py-2.5 px-1 text-center font-semibold text-sm ${metric.colour}`}>
                              {c[metric.key] != null ? metric.fmt(c[metric.key]) : "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}
      <AppFooter/>
    </main>
  );
}

export default WarIntelView;
