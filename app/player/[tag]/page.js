"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { TH_ICONS } from "@/lib/icons";
import { BRANDING } from "@/lib/branding";
import { LargePie } from "@/lib/components";

function WarBreakdown({ wars, season }) {
  const byDay = {};
  for (const w of wars) {
    if (!byDay[w.war_day]) byDay[w.war_day] = w;
  }
  const days = Object.values(byDay).sort((a, b) => a.war_day - b.war_day);
  const wins = days.filter(d => d.war_result === "win").length;
  const losses = days.filter(d => d.war_result === "loss").length;
  const draws = days.filter(d => d.war_result === "draw").length;
  const totalStars = days.reduce((s, d) => s + (d.stars || 0), 0);
  const attacked = days.filter(d => d.opponent_clan).length;
  const missed = days.length - attacked;
  const avgDest = attacked > 0
    ? (days.filter(d => d.opponent_clan).reduce((s, d) => s + parseFloat(d.destruction_pct || 0), 0) / attacked).toFixed(1)
    : "—";

  return (
    <div className="mt-4 border-t border-white/[0.06] pt-4">
      <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">{season} · War Breakdown</p>
      <div className="flex items-center gap-3 mb-3 text-[10px] flex-wrap">
        <span className="text-slate-400">
          <span className="text-green-400 font-semibold">{wins}W</span>
          {draws > 0 && <span className="text-slate-500 font-semibold"> · {draws}D</span>}
          <span className="text-red-400 font-semibold"> · {losses}L</span>
        </span>
        <span className="text-slate-700">·</span>
        <span className="text-slate-400">{totalStars}★ / {attacked * 3} max</span>
        <span className="text-slate-700">·</span>
        <span className="text-slate-400">{avgDest}% avg dest</span>
        {missed > 0 && <><span className="text-slate-700">·</span><span className="text-red-400">{missed} missed</span></>}
      </div>
      <div className="space-y-1.5">
        {days.map(d => (
          <div key={d.war_day} className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${
            d.war_result === "win" ? "border-green-500/20 bg-green-500/[0.04]"
            : d.war_result === "loss" ? "border-red-500/20 bg-red-500/[0.04]"
            : "border-white/[0.06] bg-white/[0.02]"
          }`}>
            <span className="text-[9px] text-slate-600 w-8 shrink-0">Day {d.war_day}</span>
            <span className={`text-[9px] font-semibold w-5 shrink-0 ${
              d.war_result === "win" ? "text-green-400" : d.war_result === "loss" ? "text-red-400" : "text-slate-500"
            }`}>{d.war_result === "win" ? "W" : d.war_result === "loss" ? "L" : "D"}</span>
            {d.opponent_clan ? (<>
              <div className="flex items-center gap-0.5 shrink-0">
                {[0,1,2].map(i => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 ${i < (d.stars||0) ? "text-amber-400" : "text-slate-700"}`} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <span className="text-[10px] text-slate-400">{parseFloat(d.destruction_pct||0).toFixed(1)}%</span>
              {d.defender_th_level && <span className="text-[9px] text-slate-600">TH{d.defender_th_level}</span>}
              <span className="text-[9px] text-slate-600 truncate flex-1 text-right">{d.opponent_clan}</span>
            </>) : (
              <span className="text-[9px] text-red-400/70 flex-1">missed attack</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

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
        {[0,1,2,3].map(v => (
          <g key={v}>
            <line x1={PAD_L} y1={toY(v)} x2={W-PAD_R} y2={toY(v)} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
            <text x={PAD_L-2} y={toY(v)+4} fontSize="7" fill="#475569" textAnchor="end">{v}</text>
          </g>
        ))}
        <polyline points={pts} fill="none" stroke={lineColour} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
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

/* ─── Share Card (hidden, rendered off-screen, snapshotted by html2canvas) ─── */
function ShareCard({ data, latestOverall, rank, rankColour, avgEfficiency, avgDefEff, totalStars, totalMissed, careerThree, careerTwo, careerOne, careerZero }) {
  const latest = data.seasons[0];
  const threeStarRate = latest?.attacks_used > 0
    ? ((latest.three_stars||0)/latest.attacks_used*100).toFixed(0)+"%" : "—";

  const total = (careerThree||0)+(careerTwo||0)+(careerOne||0)+(careerZero||0);
  const pieSize = 64;
  const cx = pieSize/2, cy = pieSize/2, r = pieSize/2 - 2;
  const slices = [
    { value: careerThree, color: "#86efac" },
    { value: careerTwo,   color: "#a78bfa" },
    { value: careerOne,   color: "#fbbf24" },
    { value: careerZero,  color: "#475569" },
  ].filter(s => s.value > 0);
  let startAngle = -Math.PI/2;
  const piePaths = total > 0 ? slices.map((s, i) => {
    const angle = (s.value/total)*2*Math.PI;
    const endAngle = startAngle + angle;
    const x1=cx+r*Math.cos(startAngle), y1=cy+r*Math.sin(startAngle);
    const x2=cx+r*Math.cos(endAngle),   y2=cy+r*Math.sin(endAngle);
    const d=`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${angle>Math.PI?1:0} 1 ${x2} ${y2} Z`;
    startAngle = endAngle;
    return <path key={i} d={d} fill={s.color}/>;
  }) : null;

  return (
    <div style={{
      width: 680,
      background: "#070b17",
      borderRadius: 24,
      border: rank <= 3
        ? `1px solid ${rank===1?"rgba(212,175,55,0.5)":rank===2?"rgba(167,167,173,0.5)":"rgba(205,127,50,0.5)"}`
        : "1px solid rgba(255,255,255,0.1)",
      padding: "24px 28px 20px",
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
      color: "white",
      boxSizing: "border-box",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Glass texture background — z-index 0, sits behind all content */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="glass-depth-player" cx="50%" cy="30%" r="65%" fx="50%" fy="20%">
            <stop offset="0%" stopColor="#1a1040" stopOpacity="1"/>
            <stop offset="45%" stopColor="#0d0d1f" stopOpacity="1"/>
            <stop offset="100%" stopColor="#04060e" stopOpacity="1"/>
          </radialGradient>
          <radialGradient id="tint-player" cx="50%" cy="20%" r="55%">
            <stop offset="0%" stopColor="#6d28d9" stopOpacity="0.12"/>
            <stop offset="100%" stopColor="#6d28d9" stopOpacity="0"/>
          </radialGradient>
          <pattern id="grain-player" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <line x1="0" y1="4" x2="4" y2="0" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#glass-depth-player)"/>
        <rect width="100%" height="100%" fill="url(#tint-player)"/>
        <rect width="100%" height="100%" fill="url(#grain-player)"/>
      </svg>
      {/* Card content — z-index 1, sits above background */}
      <div style={{ position: "relative", zIndex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
        {/* TH icon — spans full height of name + subtitle */}
        {TH_ICONS[String(data.town_hall_level)] && (
          <img src={TH_ICONS[String(data.town_hall_level)]} alt="" width={68} height={68} style={{ display: "block", borderRadius: 8, flexShrink: 0 }}/>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 2 }}>
            <table style={{ borderCollapse: "collapse", padding: 0, margin: 0 }}>
              <tbody>
                <tr style={{ height: "30px" }}>
                  {rank <= 3 && (
                    <td style={{ width: "34px", height: "30px", padding: 0, paddingRight: "8px", verticalAlign: "top" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" viewBox="0 0 24 24" stroke={rankColour} strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                      </svg>
                    </td>
                  )}
                  <td style={{ height: "30px", padding: 0, verticalAlign: "middle" }}>
                    <span style={{ fontSize: "22px", fontWeight: 300, letterSpacing: "0.1em", color: rankColour || "white" }}>
                      {data.player_name}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 2 }}>
            <span style={{ fontSize: 10, color: "#64748b", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              {rank ? `#${rank} Alliance · ` : ""}{latest?.season}{latest?.clan_name ? ` · ${latest.clan_name.split(" ")[0]}` : ""}
            </span>
          </div>
        </div>
        {/* Overall rating — right aligned */}
        {latestOverall != null && (
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 36, fontWeight: 300, color: "#c4b5fd", lineHeight: 1 }}>
              {parseFloat(latestOverall).toFixed(2)}
            </div>
            <div style={{ fontSize: 8, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 8 }}>
              Overall
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 14 }}/>

      {/* ── Row 2: Two columns ── */}
      <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>

        {/* Left col — stat grid */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7 }}>
          {[
            { label: "Atk EFF",  value: avgEfficiency,         colour: "#c4b5fd" },
            { label: "Def EFF",  value: avgDefEff,             colour: "#93c5fd" },
            { label: "Stars",    value: totalStars,            colour: "#86efac" },
            { label: "3★ Rate",  value: threeStarRate,         colour: "#86efac" },
            { label: "Missed",   value: totalMissed,           colour: totalMissed > 0 ? "#f87171" : "#475569" },
            { label: "Seasons",  value: data.seasons.length,   colour: "#94a3b8" },
            { label: "Best",     value: data.bestOverall ? parseFloat(data.bestOverall.overall).toFixed(2) : "—", colour: "#fbbf24" },
            { label: "League",   value: latest?.cwl_rank || "—", colour: "#94a3b8" },
          ].map(({ label, value, colour }) => (
            <div key={label} style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.07)",
              padding: "7px 5px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: colour }}>{value}</div>
              <div style={{ fontSize: 7.5, color: "#475569", textTransform: "uppercase", letterSpacing: "0.09em", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Right col — pie + bars */}
        <div style={{
          width: 190,
          flexShrink: 0,
          background: "rgba(255,255,255,0.03)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.07)",
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          {piePaths && (
            <svg width={pieSize} height={pieSize} viewBox={`0 0 ${pieSize} ${pieSize}`} style={{flexShrink:0}}>
              {piePaths}
            </svg>
          )}
          <div style={{ flex: 1 }}>
            {[["3★", careerThree, "#86efac"],["2★", careerTwo, "#a78bfa"],["1★", careerOne, "#fbbf24"],["0★", careerZero, "#475569"]].map(([lbl,val,col]) => {
              const pct = total > 0 ? ((val||0)/total*100).toFixed(0) : 0;
              return (
                <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                  <span style={{ fontSize: 8, color: "#64748b", width: 18, textAlign: "right", flexShrink: 0 }}>{lbl}</span>
                  <div style={{ flex: 1, height: 4, borderRadius: 9999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 9999, background: col }}/>
                  </div>
                  <span style={{ fontSize: 8, color: "#64748b", width: 14, textAlign: "right", flexShrink: 0 }}>{val||0}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, paddingTop: 2 }}>
        <span style={{ fontSize: 7, color: "#1e293b", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          cgnco.vercel.app · Cognition {"{CGN}"}
        </span>
      </div>
      </div>{/* end content wrapper */}
    </div>
  );
}

export default function PlayerProfilePage() {
  const { tag } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("overview");
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const shareCardRef = useRef(null);

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

  const heroBorderStyle = rank === 1 ? `1px solid rgba(212,175,55,0.4)` : rank === 2 ? `1px solid rgba(167,167,173,0.4)` : rank === 3 ? `1px solid rgba(205,127,50,0.4)` : null;

  async function handleShare() {
    if (!shareCardRef.current || sharing) return;
    setSharing(true);
    try {
      const { shareCard } = await import("@/lib/shareCard");
      const result = await shareCard(shareCardRef.current, `cgn-${data.player_name.toLowerCase().replace(/\s+/g,"-")}.png`);
      if (result?.copied) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
      console.error("Share failed", e);
    } finally {
      setSharing(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
      {/* Hidden share card — rendered off-screen, snapshotted on demand */}
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

        {/* Tab toggle */}
        <div className="flex items-center justify-center gap-4 pt-4 mt-3 border-t border-white/[0.04]">
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

        {/* Share button */}
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

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-2">Overall Rating Trend</p>
            <OverallChart seasons={data.seasons}/>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Season History</p>

            {/* Header row */}
            <div className="flex items-center gap-2 mb-1">
              <div className="overflow-x-auto flex-1 -mx-1">
                <table className="w-full text-xs min-w-[520px]">
                  <thead>
                    <tr>
                      {STAT_COLS.map(col => (
                        <th key={col.key} className="text-[9px] text-slate-600 uppercase tracking-widest font-normal pb-2 text-left px-1 whitespace-nowrap">{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                </table>
              </div>
              <div className="w-6 shrink-0"/>
            </div>

            {/* Season rows */}
            <div className="divide-y divide-white/[0.04]">
              {data.seasons.map((s, i) => {
                const isBest = i === bestSeasonIdx && data.seasons.length > 1;
                const isSelected = selectedSeason === s.season;
                const hasWarData = data.warsBySeason?.[s.season]?.length > 0;
                return (
                  <div key={i} className={`flex items-center gap-2 transition ${isBest ? "bg-amber-500/[0.07]" : ""} ${isSelected ? "bg-purple-500/[0.07]" : ""}`}>
                    {/* Scrollable stat columns */}
                    <div className="overflow-x-auto flex-1 -mx-1">
                      <table className="w-full text-xs min-w-[520px]">
                        <tbody>
                          <tr>
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
                        </tbody>
                      </table>
                    </div>
                    {/* Arrow button — always visible outside scroll */}
                    <div className="w-6 shrink-0 flex items-center justify-center">
                      {hasWarData ? (
                        <button
                          onClick={() => setSelectedSeason(isSelected ? null : s.season)}
                          className="text-slate-500 hover:text-purple-300 transition p-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 transition-transform ${isSelected ? "rotate-180 text-purple-300" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                          </svg>
                        </button>
                      ) : (
                        <span className="text-[9px] text-slate-800">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* War breakdown panel */}
            {selectedSeason && data.warsBySeason?.[selectedSeason] && (
              <WarBreakdown wars={data.warsBySeason[selectedSeason]} season={selectedSeason}/>
            )}
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
