"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { TH_ICONS } from "@/lib/icons";
import { BRANDING } from "@/lib/branding";
import { LargePie } from "@/lib/components";

function RatingTooltip() {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setShow(v => !v)}
        className={`w-4 h-4 rounded-full flex items-center justify-center border transition text-[9px] font-semibold shrink-0 ${show ? "bg-purple-500/20 border-purple-500/60 text-purple-300" : "bg-transparent border-purple-500/40 text-purple-400 hover:border-purple-400"}`}>
        ?
      </button>
      {show && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-48 rounded-2xl border border-white/10 bg-[#0d1424]/95 backdrop-blur-xl shadow-xl p-3">
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Weighted score — 60% attack efficiency · 40% defence efficiency.
          </p>
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-[#0d1424] border-l border-t border-white/10"/>
        </div>
      )}
    </div>
  );
}

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

// Icon paths used across stat tiles
const ICONS = {
  atk:    "M13 10V3L4 14h7v7l9-11h-7z",
  def:    "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  star:   "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  miss:   "M6 18L18 6M6 6l12 12",
  avg:    "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  punch:  "M5 10l7-7m0 0l7 7m-7-7v18",
  clutch: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z",
  league: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  dest:   "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  consist:"M4 6h16M4 10h16M4 14h16M4 18h16",
  atks:   "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  best:   "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  net:    "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
};

// Colour map for icon tiles
const TILE = {
  purple: { text: "text-purple-300",  bg: "bg-purple-500/[0.06]",  border: "border-purple-500/20",  stroke: "#a78bfa" },
  blue:   { text: "text-blue-300",    bg: "bg-blue-500/[0.06]",    border: "border-blue-500/20",    stroke: "#60a5fa" },
  green:  { text: "text-green-300",   bg: "bg-green-500/[0.06]",   border: "border-green-500/20",   stroke: "#86efac" },
  amber:  { text: "text-amber-300",   bg: "bg-amber-500/[0.06]",   border: "border-amber-500/20",   stroke: "#fbbf24" },
  red:    { text: "text-red-400",     bg: "bg-red-500/[0.06]",     border: "border-red-500/20",     stroke: "#f87171" },
  slate:  { text: "text-slate-400",   bg: "bg-white/[0.03]",       border: "border-white/10",       stroke: "#94a3b8" },
};

function IconStatBox({ label, value, iconKey, colourKey = "slate" }) {
  const c = TILE[colourKey] || TILE.slate;
  const icon = ICONS[iconKey];
  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-2.5 flex flex-col h-full`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon && (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke={c.stroke} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon}/>
          </svg>
        )}
        <p className="text-[9px] text-slate-500 uppercase tracking-widest leading-none">{label}</p>
      </div>
      <p className={`text-sm font-bold ${c.text}`}>{value ?? "—"}</p>
    </div>
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
      <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-2">CGN Rating Trend</p>
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

  // Career war metrics from latest season
  const avgStarsPerAtk = latest?.avg_stars_per_attack != null ? parseFloat(latest.avg_stars_per_attack).toFixed(2) : "—";
  const punchUpRate = latest?.punch_up_rate != null ? parseFloat(latest.punch_up_rate).toFixed(0)+"%" : "—";

  // Icon paths
  const ICON_ATK    = "M13 10V3L4 14h7v7l9-11h-7z";
  const ICON_DEF    = "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z";
  const ICON_STAR   = "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z";
  const ICON_MISS   = "M6 18L18 6M6 6l12 12";
  const ICON_AVG    = "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z";
  const ICON_PUNCH  = "M5 10l7-7m0 0l7 7m-7-7v18";
  const ICON_LEAGUE = "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z";

  const statTiles = [
    { label: "Avg ★/Atk", value: avgStarsPerAtk,  colour: "#fbbf24", bg: "rgba(251,191,36,0.06)",  border: "rgba(251,191,36,0.2)",  icon: ICON_AVG },
    { label: "3★ Rate",   value: threeStarRate,   colour: "#86efac", bg: "rgba(34,197,94,0.06)",   border: "rgba(34,197,94,0.2)",   icon: ICON_STAR },
    { label: "Stars",     value: totalStars,      colour: "#86efac", bg: "rgba(34,197,94,0.06)",   border: "rgba(34,197,94,0.2)",   icon: ICON_STAR },
    { label: "Missed",    value: totalMissed,     colour: totalMissed > 0 ? "#f87171" : "#475569", bg: totalMissed > 0 ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.03)", border: totalMissed > 0 ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)", icon: ICON_MISS },
    { label: "Atk EFF",   value: avgEfficiency,   colour: "#a78bfa", bg: "rgba(139,92,246,0.06)",  border: "rgba(139,92,246,0.2)",  icon: ICON_ATK },
    { label: "Def EFF",   value: avgDefEff,       colour: "#60a5fa", bg: "rgba(59,130,246,0.06)",  border: "rgba(59,130,246,0.2)",  icon: ICON_DEF },
    { label: "Punch-Up",  value: punchUpRate,     colour: "#93c5fd", bg: "rgba(59,130,246,0.06)",  border: "rgba(59,130,246,0.2)",  icon: ICON_PUNCH },
    { label: "League",    value: latest?.cwl_rank || "—", colour: "#94a3b8", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.07)", icon: ICON_LEAGUE },
  ];

  const total = (careerThree||0)+(careerTwo||0)+(careerOne||0)+(careerZero||0);
  const pieSize = 60;
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

  // Sparkline — oldest first
  const sparkSeasons = [...(data.seasons||[])].reverse();
  const sparkPoints = sparkSeasons.map(s => {
    if (!s.attacks_used || !s.attacks_available) return null;
    return parseFloat(((parseFloat(s.efficiency||0)*0.6)+((3-parseFloat(s.defence_efficiency||0))*0.4)).toFixed(2));
  }).filter(v => v !== null);
  const sparkTrend = sparkPoints.length > 1 ? sparkPoints[sparkPoints.length-1] - sparkPoints[0] : 0;
  const sparkColour = sparkTrend > 0.05 ? "#86efac" : sparkTrend < -0.05 ? "#f87171" : "#a78bfa";
  const sparkSeasonLabels = sparkSeasons.filter(s => s.attacks_used && s.attacks_available).map(s => s.season?.split(" ")[0]?.slice(0,3) || "");

  // Sparkline SVG dimensions — increased padding to prevent label clipping
  const SPW = 380, SPH = 72, SPAD2 = 14;
  const sMin2 = sparkPoints.length ? Math.min(...sparkPoints) : 0;
  const sMax2 = sparkPoints.length ? Math.max(...sparkPoints) : 1;
  const sRange2 = sMax2 - sMin2 || 0.1;
  const sXStep2 = sparkPoints.length > 1 ? (SPW - SPAD2*2) / (sparkPoints.length - 1) : 0;
  const sXPos2 = i => SPAD2 + i * sXStep2;
  const sYPos2 = v => SPAD2 + (SPH - SPAD2*2) - ((v - sMin2) / sRange2) * (SPH - SPAD2*2);
  const sparkPath2 = sparkPoints.map((v, i) => `${i===0?"M":"L"} ${sXPos2(i)} ${sYPos2(v)}`).join(" ");

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
      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Row 1 — TH icon + name + CGN Rating */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
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
          {latestOverall != null && (
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 36, fontWeight: 300, color: "#c4b5fd", lineHeight: 1 }}>
                {parseFloat(latestOverall).toFixed(2)}
              </div>
              <div style={{ fontSize: 8, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 8 }}>
                CGN Rating
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 14 }}/>

        {/* Row 2 — stat grid full width with icon+label tile design */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7, marginBottom: 14 }}>
          {statTiles.map(({ label, value, colour, bg, border, icon }) => (
            <div key={label} style={{ background: bg, borderRadius: 10, border: `1px solid ${border}`, padding: "8px 8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" fill="none" viewBox="0 0 24 24" stroke={colour} strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon}/>
                </svg>
                <div style={{ fontSize: 7, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.09em" }}>{label}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: colour }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Row 3 — full-width: sparkline (2/3) | divider | pie + bars (1/3) */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          background: "rgba(255,255,255,0.03)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.07)",
          padding: "12px 14px",
          marginBottom: 14,
          minHeight: 90,
        }}>
          {sparkPoints.length >= 2 ? (
              <div style={{ flex: "0 0 62%", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 7, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                  CGN Rating Trend · {sparkColour === "#86efac" ? "↑ Improving" : sparkColour === "#f87171" ? "↓ Declining" : "→ Stable"}
                </div>
                <svg width="100%" height={SPH} viewBox={`0 0 ${SPW} ${SPH}`} style={{ overflow: "visible" }}>
                  {[0, 0.5, 1].map(pct => (
                    <line key={pct} x1={SPAD2} y1={SPAD2 + pct*(SPH-SPAD2*2)} x2={SPW-SPAD2} y2={SPAD2 + pct*(SPH-SPAD2*2)} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
                  ))}
                  <path d={sparkPath2} fill="none" stroke={sparkColour} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  {sparkPoints.map((v, i) => (
                    <g key={i}>
                      <circle cx={sXPos2(i)} cy={sYPos2(v)} r="3" fill={sparkColour}/>
                      <text x={sXPos2(i)} y={sYPos2(v) - 6} textAnchor="middle" fontSize="7.5" fill={sparkColour} fontWeight="600">{v.toFixed(2)}</text>
                      <text x={sXPos2(i)} y={SPH + 2} textAnchor="middle" fontSize="7" fill="#475569">{sparkSeasonLabels[i]}</text>
                    </g>
                  ))}
                </svg>
              </div>
            ) : (
              <div style={{ flex: "0 0 62%" }}/>
            )}

          {/* Vertical divider */}
          <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.06)", margin: "0 14px", flexShrink: 0 }}/>

          {/* Pie chart */}
          {piePaths && (
            <div style={{ flexShrink: 0 }}>
              <svg width={pieSize} height={pieSize} viewBox={`0 0 ${pieSize} ${pieSize}`}>
                {piePaths}
              </svg>
            </div>
          )}

          {/* Bar chart */}
          <div style={{ flex: 1, marginLeft: 10 }}>
            {[["3★", careerThree, "#86efac"],["2★", careerTwo, "#a78bfa"],["1★", careerOne, "#fbbf24"],["0★", careerZero, "#475569"]].map(([lbl,val,col]) => {
              const pct = total > 0 ? ((val||0)/total*100).toFixed(0) : 0;
              return (
                <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                  <span style={{ fontSize: 8, color: "#64748b", width: 16, textAlign: "right", flexShrink: 0 }}>{lbl}</span>
                  <div style={{ flex: 1, height: 4, borderRadius: 9999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 9999, background: col }}/>
                  </div>
                  <span style={{ fontSize: 8, color: "#64748b", width: 14, textAlign: "right", flexShrink: 0 }}>{val||0}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, paddingTop: 2 }}>
          <span style={{ fontSize: 7, color: "#1e293b", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            cgnco.vercel.app · Cognition {"{CGN}"}
          </span>
        </div>
      </div>
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
  const [showShareCard, setShowShareCard] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [statsSeason, setStatsSeason] = useState(null);
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
      console.error("Share failed", e);
    } finally {
      setSharing(false);
      setShowShareCard(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
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
              <IconStatBox label="Avg Atk EFF" value={avgEfficiency} iconKey="atk" colourKey="purple"/>
              <IconStatBox label="Best Rating" value={data.bestOverall ? parseFloat(data.bestOverall.overall).toFixed(2) : "—"} iconKey="best" colourKey="purple"/>
              <IconStatBox label="Total Stars" value={totalStars} iconKey="star" colourKey="green"/>
              <IconStatBox label="Avg Def EFF" value={avgDefEff} iconKey="def" colourKey="blue"/>
              <IconStatBox label="Missed" value={totalMissed} iconKey="miss" colourKey={totalMissed > 0 ? "red" : "slate"}/>
              <IconStatBox label="Total Attacks" value={totalCareerAttacks} iconKey="atks" colourKey="slate"/>
            </div>
          </div>

          {/* Career War Metrics */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Career War Metrics</p>
            <div className="grid grid-cols-2 gap-2">
              <IconStatBox label="Avg ★/Attack" value={careerAvgStarsPerAtk ?? "—"} iconKey="avg" colourKey="amber"/>
              <IconStatBox label="3★ Rate" value={careerThreeStarRate ?? "—"} iconKey="star" colourKey="green"/>
              <IconStatBox label="Clutch Rate" value={careerClutchRate ?? "—"} iconKey="clutch" colourKey="purple"/>
              <IconStatBox label="Punch-Up Rate" value={careerPunchUpRate ?? "—"} iconKey="punch" colourKey="blue"/>
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
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-2">CGN Rating Trend</p>
            <OverallChart seasons={data.seasons}/>
          </div>
        </div>
      )}

      {/* ── STATS VIEW ── */}
      {view === "stats" && (
        <div className="relative z-10 space-y-4">

          {/* Season selector */}
          {data.seasons.length > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <p className="text-[9px] text-slate-600 uppercase tracking-widest">Season</p>
              <select
                value={statsSeason || data.seasons[0]?.season || ""}
                onChange={e => setStatsSeason(e.target.value)}
                className="rounded-xl border border-white/10 bg-transparent px-2 py-1 text-xs text-white focus:outline-none [color-scheme:dark]">
                <option value="overall">Overall (All Seasons)</option>
                {data.seasons.map(s => (
                  <option key={s.season} value={s.season}>{s.season}</option>
                ))}
              </select>
            </div>
          )}

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
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

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
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

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
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

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-2">CGN Rating Trend</p>
            <OverallChart seasons={data.seasons}/>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
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

      <div className="relative z-10 flex items-center justify-center gap-2 mt-6">
        <img src={BRANDING.cgnskull} alt="CGN" className="w-4 h-4 opacity-40"/>
        <span className="text-[10px] text-slate-700 tracking-widest">Cognition {"{CGN}"}</span>
      </div>
    </main>
  );
}
