"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/app/components/shared-views";

function RankedLeaderboardView() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTag, setExpandedTag] = useState(null);
  const [historyCache, setHistoryCache] = useState({});
  const [historyLoading, setHistoryLoading] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await fetch("/api/ranked-leaderboard");
      const d = await res.json();
      setData(d);
    } catch { setError("Failed to load ranked data"); }
    finally { setLoading(false); }
  }

  async function toggleExpand(tag) {
    if (expandedTag === tag) { setExpandedTag(null); return; }
    setExpandedTag(tag);
    if (historyCache[tag]) return;
    setHistoryLoading(tag);
    try {
      const res = await fetch(`/api/tournament-history/${tag.replace("#","")}`);
      const d = await res.json();
      setHistoryCache(prev => ({ ...prev, [tag]: d.results || [] }));
    } catch { setHistoryCache(prev => ({ ...prev, [tag]: [] })); }
    finally { setHistoryLoading(null); }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  // Assign alliance-wide rank across all groups
  let globalRank = 0;

  return (
    <main className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 sm:p-6 pb-12">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      <img src="/roster-bg.png" alt="" className="fixed inset-0 select-none pointer-events-none opacity-20" style={{width:"100vw",height:"100dvh",objectFit:"cover",objectPosition:"center top"}}/>
      </div>
      <div className="relative z-10 space-y-4">

        <AppHeader variant="bar"/>

        {/* Title card — centred, matches app design spec */}
        <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 text-center">
          <h1 className="text-4xl font-thin tracking-widest text-white">Ranked Leaderboard</h1>
          <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">Alliance Trophy Rankings</p>
          <div className="flex justify-center mt-4">
            <button onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-slate-500 hover:text-slate-300 hover:border-white/20 transition disabled:opacity-40 text-[10px] uppercase tracking-widest">
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {refreshing ? "Updating…" : "Refresh"}
            </button>
          </div>
          {data && !loading && (
            <p className="text-[9px] text-slate-700 mt-3 pt-3 border-t border-white/[0.06]">
              {data.total} registered players · Last updated {data.updatedAt ? new Date(data.updatedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"} · Refreshes weekly
            </p>
          )}
        </div>

        {loading && (
          <div className="space-y-3 animate-pulse">
            {[...Array(3)].map((_,i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 space-y-2">
                <div className="h-3 w-24 bg-white/[0.06] rounded"/>
                {[...Array(4)].map((_,j) => <div key={j} className="h-10 bg-white/[0.06] rounded-lg"/>)}
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-red-400 text-xs text-center">{error}</p>}

        {data && !loading && (
          <>
            {data.groups.map(group => (
              <div key={group.league} className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
                {/* League header */}
                <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06]">
                  {group.iconUrl && <img src={group.iconUrl} alt={group.league} className="w-8 h-8 object-contain"/>}
                  <span className="text-sm font-semibold text-white">{group.league}</span>
                  <span className="text-[9px] text-slate-600 uppercase tracking-widest ml-auto">{group.players.length} players</span>
                </div>

                {/* Player rows */}
                <div className="divide-y divide-white/[0.04]">
                  {group.players.map(player => {
                    globalRank++;
                    return (
                      <div key={player.player_tag}>
                        <button type="button" onClick={() => toggleExpand(player.player_tag)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition text-left">
                          {/* Rank */}
                          <span className="text-[10px] text-slate-600 font-mono w-5 shrink-0 text-right">{globalRank}</span>

                          {/* TH icon */}
                          <div className="w-8 h-8 rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.06] shrink-0 flex items-center justify-center">
                            <img src={`/icons/th/th${player.th}.png`} alt={`TH${player.th}`}
                              className="w-7 h-7 object-contain" onError={e=>{e.target.style.display="none"}}/>
                          </div>

                          {/* Name + clan */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{player.name}</p>
                            <div className="flex items-center gap-1">
                              {player.clan_badge && <img src={player.clan_badge} alt="" className="w-3 h-3 object-contain"/>}
                              <p className="text-[10px] text-slate-500 truncate">{player.clan_name}</p>
                            </div>
                          </div>

                          {/* Trophies */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75H7.5m9 0c1.657 0 3 1.343 3 3H4.5c0-1.657 1.343-3 3-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52a6.003 6.003 0 01-5.395 5.972M18.75 4.236V4.5a9.023 9.023 0 01-2.48 5.228m-10.48 0a9.024 9.024 0 005.23 2.478m5.25-2.478a9.024 9.024 0 01-5.25 2.478"/>
                            </svg>
                            <span className="text-sm font-semibold text-purple-300">{(player.trophies || 0).toLocaleString()}</span>
                          </div>

                          {/* Expand chevron */}
                          <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 text-slate-600 transition-transform shrink-0 ${expandedTag === player.player_tag ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                          </svg>
                        </button>

                        {/* History expansion — tournament result tiles */}
                        {expandedTag === player.player_tag && (
                          <div className="px-3 pb-3 pt-2 border-t border-white/[0.04] space-y-2">
                            {historyLoading === player.player_tag && (
                              <div className="animate-pulse space-y-2">
                                {[...Array(2)].map((_,i) => <div key={i} className="h-16 bg-white/[0.04] rounded-lg"/>)}
                              </div>
                            )}
                            {historyCache[player.player_tag]?.length === 0 && (
                              <p className="text-[9px] text-slate-700 py-2 text-center">No tournament history yet</p>
                            )}
                            {historyCache[player.player_tag]?.map((r, i) => {
                              const isPromoted = r.result === "promoted";
                              const isDemoted = r.result === "demoted";
                              const weekEnd = new Date(r.week_ending);
                              const weekStart = new Date(weekEnd);
                              weekStart.setUTCDate(weekStart.getUTCDate() - 6);
                              const fmt = d => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
                              const dateRange = `${fmt(weekStart)} — ${fmt(weekEnd)}`;
                              const prev = historyCache[player.player_tag][i + 1];
                              const trophyDiff = prev?.pre_trophies && r.pre_trophies ? r.pre_trophies - prev.pre_trophies : null;
                              return (
                                <div key={i} className={`rounded-lg border p-2.5 space-y-1.5 ${isPromoted ? "border-green-500/30 bg-green-500/[0.03]" : isDemoted ? "border-red-500/30 bg-red-500/[0.03]" : "border-white/[0.06] bg-white/[0.02]"}`}>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[8px] text-slate-500 uppercase tracking-widest">{dateRange}</span>
                                    <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-lg ${isPromoted ? "text-green-400 bg-green-500/10" : isDemoted ? "text-red-400 bg-red-500/10" : "text-slate-400 bg-white/[0.04]"}`}>
                                      {isPromoted ? "↑ Promoted" : isDemoted ? "↓ Demoted" : "→ Stayed"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1 min-w-0 flex-1">
                                      {r.pre_league && <img
                                        src={`/icons/leagues/${r.pre_league.split(" ")[0].toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`}
                                        alt={r.pre_league} className="w-5 h-5 object-contain shrink-0"
                                        onError={e => { e.target.src = r.pre_league_icon || ""; }}/>}
                                      <span className="text-[9px] text-slate-400 truncate">{r.pre_league}</span>
                                      {r.pre_league !== r.post_league && (
                                        <>
                                          <span className="text-slate-600 text-[9px]">→</span>
                                          {r.post_league && <img
                                            src={`/icons/leagues/${r.post_league.split(" ")[0].toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`}
                                            alt={r.post_league} className="w-5 h-5 object-contain shrink-0"
                                            onError={e => { e.target.src = r.post_league_icon || ""; }}/>}
                                          <span className={`text-[9px] font-semibold truncate ${isPromoted ? "text-green-300" : "text-red-300"}`}>{r.post_league}</span>
                                        </>
                                      )}
                                    </div>
                                    {r.pre_trophies > 0 && (
                                      <div className="flex items-center gap-1 shrink-0">
                                        <span className="text-[10px] font-semibold text-purple-300">{r.pre_trophies.toLocaleString()}</span>
                                        {trophyDiff !== null && (
                                          <span className={`text-[8px] font-bold ${trophyDiff > 0 ? "text-green-400" : trophyDiff < 0 ? "text-red-400" : "text-slate-500"}`}>
                                            {trophyDiff > 0 ? `↑+${trophyDiff}` : `↓${trophyDiff}`}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {data.groups.length === 0 && (
              <p className="text-slate-500 text-xs text-center py-8">No ranked data yet — check back after the next weekly snapshot.</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default RankedLeaderboardView;
