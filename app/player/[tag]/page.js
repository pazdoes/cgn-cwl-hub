"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TH_ICONS } from "@/lib/icons";
import { BRANDING } from "@/lib/branding";
import { LargePie } from "@/lib/components";

function MedalIcon({ rank }) {
  const colours = { 1: "#D4AF37", 2: "#A7A7AD", 3: "#CD7F32" };
  const col = colours[rank];
  if (!col) return null;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke={col} strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
    </svg>
  );
}

function StatBox({ label, value, colour = "text-white", sub = null }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 flex flex-col items-center justify-center text-center h-full">
      <p className={`text-sm font-bold ${colour}`}>{value}</p>
      {sub && <p className="text-[9px] text-slate-500 mt-0.5">{sub}</p>}
      <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">{label}</p>
    </div>
  );
}

function StarBars({ three, two, one, zero }) {
  const total = (three||0)+(two||0)+(one||0)+(zero||0);
  if (!total) return null;
  return (
    <div className="flex-1 flex flex-col justify-center gap-1.5">
      {[["3★",three,"#86efac"],["2★",two,"#a78bfa"],["1★",one,"#fbbf24"],["0★",zero,"#475569"]].map(([lbl,val,col]) => (
        <div key={lbl} className="flex items-center gap-2">
          <span className="text-[9px] text-slate-500 w-5 text-right shrink-0">{lbl}</span>
          <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full" style={{width: total > 0 ? `${((val||0)/total*100).toFixed(0)}%` : "0%", background: col}}/>
          </div>
          <span className="text-[9px] text-slate-500 w-4 text-right shrink-0">{val||0}</span>
        </div>
      ))}
    </div>
  );
}

function OverallChart({ seasons }) {
  const valid = [...seasons].filter(s => s != null && s.overall != null).reverse();
  if (valid.length === 0) return null;
  if (valid.length === 1) {
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <span className="text-2xl font-thin text-purple-300">{parseFloat(valid[0].overall).toFixed(2)}</span>
        <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-1">{valid[0].season}</p>
      </div>
    );
  }
  const W = 280, H = 80, PAD_L = 8, PAD_R = 8, PAD_T = 8, PAD_B = 20;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const minV = 0, maxV = 3;
  const xStep = plotW / Math.max(valid.length - 1, 1);
  const toY = v => PAD_T + plotH - ((v - minV) / (maxV - minV)) * plotH;
  const toX = i => PAD_L + i * xStep;
  const pts = valid.map((s, i) => `${toX(i)},${toY(s.overall)}`).join(" ");
  const latest = valid[valid.length - 1];
  const prev = valid[valid.length - 2];
  const lineColour = latest.overall >= prev.overall ? "#a78bfa" : "#f87171";
  return (
    <div className="mt-3 pt-3 border-t border-white/[0.06]">
      <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-2">Overall Rating Trend</p>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        {/* Y gridlines */}
        {[0,1,2,3].map(v => (
          <g key={v}>
            <line x1={PAD_L} y1={toY(v)} x2={W-PAD_R} y2={toY(v)} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
            <text x={PAD_L-2} y={toY(v)+4} fontSize="7" fill="#475569" textAnchor="end">{v}</text>
          </g>
        ))}
        {/* Line */}
        <polyline points={pts} fill="none" stroke={lineColour} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
        {/* Dots + season labels */}
        {valid.map((s, i) => (
          <g key={i}>
            <circle cx={toX(i)} cy={toY(s.overall)} r="3" fill={lineColour} stroke="#0d1424" strokeWidth="1.5"/>
            <text x={toX(i)} y={H-4} fontSize="6" fill="#475569" textAnchor="middle">{s.season?.split(" ")[0]?.slice(0,3)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

const STAT_COLS = [
  { key: "season",             label: "Season",   fmt: v => v },
  { key: "cwl_rank",           label: "League",   fmt: v => v || "—" },
  { key: "clan_name",          label: "Clan",     fmt: v => v?.split(" ")[0] || "—" },
  { key: "overall",            label: "Overall",  fmt: v => v != null ? parseFloat(v).toFixed(2) : "—" },
  { key: "efficiency",         label: "Atk EFF",  fmt: v => v != null ? parseFloat(v).toFixed(2) : "—" },
  { key: "defence_efficiency", label: "Def EFF",  fmt: v => v != null ? parseFloat(v).toFixed(2) : "—" },
  { key: "stars_earned",       label: "Stars",    fmt: v => v ?? "—" },
  { key: "stars_conceded",     label: "Given",    fmt: v => v ?? "—" },
  { key: "attacks_used",       label: "Attacks",  fmt: v => v ?? "—" },
  { key: "missed_attacks",     label: "Missed",   fmt: v => v ?? "—" },
  { key: "destruction_pct",    label: "Dest %",   fmt: v => v != null ? parseFloat(v).toFixed(1)+"%" : "—" },
];

export default function PlayerProfilePage() {
  const { tag } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("overview");

  useEffect(() => {
    if (!tag) return;
    fetch(`/api/player/${encodeURIComponent(tag)}`)
      .then(r => { if (!r.ok) throw new Error("not found"); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [tag]);

  if (loading) return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] flex items-center justify-center">
      <p className="text-slate-600 text-xs tracking-widest uppercase animate-pulse">Loading…</p>
    </main>
  );

  if (error || !data) return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] flex items-center justify-center p-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 text-center max-w-xs">
        <p className="text-slate-400 text-sm mb-1">Player not found</p>
        <p className="text-slate-600 text-xs">This player has no CWL stats on record.</p>
      </div>
    </main>
  );

  const latest = data.seasons[0];
  const prev = data.seasons[1] || null;
  const latestOverall = latest?.overall;
  const rank = data.currentRank;
  const rankColour = rank === 1 ? "#D4AF37" : rank === 2 ? "#A7A7AD" : rank === 3 ? "#CD7F32" : null;

  const totalStars   = data.seasons.reduce((s,r)=>s+(r.stars_earned||0),0);
  const totalMissed  = data.seasons.reduce((s,r)=>s+(r.missed_attacks||0),0);
  const avgEfficiency = data.seasons.length
    ? (data.seasons.reduce((s,r)=>s+parseFloat(r.efficiency||0),0)/data.seasons.length).toFixed(2) : "—";
  const avgDefEff = data.seasons.length
    ? (data.seasons.reduce((s,r)=>s+parseFloat(r.defence_efficiency||0),0)/data.seasons.length).toFixed(2) : "—";

  const threeStarRate = latest?.attacks_used > 0
    ? ((latest.three_stars||0)/latest.attacks_used*100).toFixed(0)+"%" : "—";
  const participationRate = latest?.attacks_available > 0
    ? ((latest.attacks_used||0)/latest.attacks_available*100).toFixed(0)+"%" : "—";
  const netStars = latest
    ? ((latest.stars_earned||0)-(latest.stars_conceded||0)) : null;
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

  // Hero border for top 3
  const heroBorderStyle = rank === 1 ? `1px solid rgba(212,175,55,0.4)` : rank === 2 ? `1px solid rgba(167,167,173,0.4)` : rank === 3 ? `1px solid rgba(205,127,50,0.4)` : null;

  return (
    <main className="min-h-screen overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      </div>

      {/* Hero tile */}
      <div className="relative z-10 rounded-3xl bg-white/[0.04] backdrop-blur-xl p-5 mb-4" style={{border: heroBorderStyle || "1px solid rgba(255,255,255,0.1)"}}>
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex items-center justify-center gap-3">
            {TH_ICONS[String(data.town_hall_level)] && (
              <img src={TH_ICONS[String(data.town_hall_level)]} alt={`TH${data.town_hall_level}`} className="w-10 h-10 shrink-0"/>
            )}
            {rank <= 3 && <MedalIcon rank={rank}/>}
            <h1 className="text-2xl font-thin tracking-widest" style={{color: rankColour || "white"}}>{data.player_name}</h1>
          </div>

          {latestOverall != null && (
            <div className="flex flex-col items-center mt-1">
              <span className="text-3xl font-thin text-purple-300">
                {parseFloat(latestOverall).toFixed(2)}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[9px] text-slate-600 uppercase tracking-widest">Overall Rating</p>
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

        <div className="flex items-center justify-center gap-4 pt-4 mt-3">
          <button onClick={() => setView("overview")} className="text-slate-500 hover:text-slate-300 transition p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <span className="text-[10px] text-slate-600 uppercase tracking-widest select-none min-w-[60px] text-center">
            {view === "overview" ? "Overview" : "Stats"}
          </span>
          <button onClick={() => setView("stats")} className="text-slate-500 hover:text-slate-300 transition p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── OVERVIEW VIEW ── */}
      {view === "overview" && (
        <div className="relative z-10 space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Career</p>
            <div className="grid grid-cols-3 gap-2">
              <StatBox label="Avg Atk EFF" value={avgEfficiency} colour="text-purple-300"/>
              <StatBox label="Avg Def EFF" value={avgDefEff} colour="text-blue-300"/>
              <StatBox label="Total Stars" value={totalStars} colour="text-green-300"/>
              {data.bestOverall && <StatBox label="Best Overall" value={parseFloat(data.bestOverall.overall).toFixed(2)} colour="text-purple-400"/>}
              {data.bestEfficiency && <StatBox label="Best Atk EFF" value={parseFloat(data.bestEfficiency.efficiency).toFixed(2)} colour="text-green-400"/>}
              <StatBox label="Missed" value={totalMissed} colour={totalMissed > 0 ? "text-red-400" : "text-slate-500"}/>
            </div>

          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Career Attack Breakdown</p>
            <div className="flex items-center gap-4">
              <LargePie three={careerThree} two={careerTwo} one={careerOne} zero={careerZero} size={72}/>
              <StarBars three={careerThree} two={careerTwo} one={careerOne} zero={careerZero}/>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-2">Overall Rating Trend</p>
            <OverallChart seasons={data.seasons}/>
          </div>
        </div>
      )}

      {/* ── STATS VIEW ── */}
      {view === "stats" && (
        <div className="relative z-10 space-y-4">

          {/* Performance summary */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Performance · {latest?.season}</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <StatBox label="3★ Rate" value={threeStarRate} colour="text-green-300"/>
              <StatBox label="Participation" value={participationRate} colour="text-purple-300"/>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatBox
                label="Net Stars"
                value={netStars != null ? (netStars > 0 ? `+${netStars}` : String(netStars)) : "—"}
                colour={netStars != null ? (netStars > 0 ? "text-green-300" : netStars < 0 ? "text-red-400" : "text-slate-500") : "text-slate-500"}
              />
              <StatBox
                label="Consistency"
                value={`${aboveAvg}/${data.seasons.length}`}
                sub="seasons above avg"
                colour="text-purple-300"
              />
            </div>
          </div>

          {/* Attack */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Attack · {latest?.season}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <StatBox label="Efficiency" value={parseFloat(latest?.efficiency||0).toFixed(2)} colour="text-purple-300"/>
              <StatBox label="Stars" value={latest?.stars_earned ?? "—"} colour="text-green-300"/>
              <StatBox label="Dest %" value={latest?.destruction_pct != null ? parseFloat(latest.destruction_pct).toFixed(1)+"%" : "—"} colour="text-slate-300"/>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <StatBox label="Attacks" value={`${latest?.attacks_used ?? "—"}/${latest?.attacks_available ?? "—"}`} colour="text-slate-300"/>
              <StatBox label="Missed" value={latest?.missed_attacks ?? "—"} colour={(latest?.missed_attacks||0) > 0 ? "text-red-400" : "text-slate-500"}/>
            </div>
            <div className="flex items-center gap-4 pt-3 border-t border-white/[0.06]">
              <LargePie three={latest?.three_stars||0} two={latest?.two_stars||0} one={latest?.one_stars||0} zero={latest?.zero_stars||0} size={64}/>
              <StarBars three={latest?.three_stars||0} two={latest?.two_stars||0} one={latest?.one_stars||0} zero={latest?.zero_stars||0}/>
            </div>
          </div>

          {/* Defence */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Defence · {latest?.season}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <StatBox label="Def EFF" value={latest?.defence_efficiency != null ? parseFloat(latest.defence_efficiency).toFixed(2) : "—"} colour="text-blue-300"/>
              <StatBox label="Stars Given" value={latest?.stars_conceded ?? "—"} colour="text-slate-400"/>
              <StatBox label="Dest Given" value={latest?.defence_pct != null ? parseFloat(latest.defence_pct).toFixed(1)+"%" : "—"} colour="text-slate-400"/>
            </div>
            <div className="flex items-center gap-4 pt-3 border-t border-white/[0.06]">
              <LargePie three={latest?.three_stars_conceded||0} two={latest?.two_stars_conceded||0} one={latest?.one_stars_conceded||0} zero={latest?.zero_stars_conceded||0} size={64}/>
              <StarBars three={latest?.three_stars_conceded||0} two={latest?.two_stars_conceded||0} one={latest?.one_stars_conceded||0} zero={latest?.zero_stars_conceded||0}/>
            </div>
          </div>

          {/* Overall rating trend chart */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-2">Overall Rating Trend</p>
            <OverallChart seasons={data.seasons}/>
          </div>

          {/* Season history table — best season highlighted, CWL rank included */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Season History</p>
            <div className="overflow-x-auto -mx-1">
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
                      <tr key={i} className={`transition ${isBest ? "bg-amber-500/[0.07]" : "hover:bg-white/[0.03]"}`}>
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
          </div>
        </div>
      )}

      <div className="relative z-10 flex items-center justify-center gap-2 mt-6">
        <img src={BRANDING.cgnskull} alt="CGN" className="w-4 h-4 opacity-40"/>
        <span className="text-[10px] text-slate-700 tracking-widest">Cognition {"{CGN}"}</span>
      </div>
    </main>
  );
}
