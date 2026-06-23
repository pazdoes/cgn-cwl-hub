"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { getLeagueStyles } from "../lib/leagueColors";
import { CWL_ICONS, TH_ICONS } from "../lib/icons";
import { BRANDING } from "../lib/branding";
import DiscordWidget from "./components/DiscordWidget";

// CWL_ICONS' key order already encodes the correct league hierarchy
// (Champion I/II/III highest, down to Bronze I/II/III lowest) — reusing
// that order here rather than maintaining a second ranking list. Ranks
// not found in CWL_ICONS (including "Unranked" and any genuinely unset
// value) sort after every real league, lowest priority.
const CWL_RANK_ORDER = Object.keys(CWL_ICONS);
function rankSortIndex(rank) {
  const idx = CWL_RANK_ORDER.indexOf(rank);
  return idx === -1 ? CWL_RANK_ORDER.length : idx;
}

/* ─── stat tile click-through views ──────────────────────── */

// Read-only roster list, same player set already counted on the Players
// tile (Sheet-derived, current rostered state) — deliberately the SAME
// data as the tile's printed number, not a broader Neon-pool view, per
// the confirmed scope. Visually modeled on the admin pool page's card
// style, but with every admin control (drag-and-drop, X buttons, status
// toggles) stripped out — this is a public, read-only view.
function PlayersView({ players, onBack }) {
  return (
    <main className="
      min-h-screen overflow-x-hidden w-full max-w-full
      bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f]
      text-white p-6 pb-12
    ">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2
          w-[100vw] max-w-[600px] h-[100vw] max-h-[600px]
          bg-purple-500/10 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Hub
        </button>
      </div>

      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 mb-6 text-center">
        <h1 className="text-2xl font-bold">All Players</h1>
        <p className="text-slate-400 text-sm mt-1">{players.length} rostered this season</p>
      </div>

      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
        <div className="space-y-2">
          {[...players]
            .sort((a, b) => Number(b.townHall || 0) - Number(a.townHall || 0))
            .map(player => (
            <div
              key={`${player.clan}-${player.account}-${player.position}`}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {TH_ICONS[String(player.townHall)] && (
                    <img
                      src={TH_ICONS[String(player.townHall)]}
                      alt={`TH${player.townHall}`}
                      className="w-8 h-8 shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-white truncate">{player.account}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{player.playerTag}</p>
                  </div>
                </div>
                <span className="shrink-0 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {player.clan}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// Unified page listing every clan's roster consecutively, rather than
// requiring a click into each clan separately — same per-clan data
// already used by the single-clan overview, just compiled onto one page.
function ClansView({ clans, players, onBack, onOpenClan }) {
  return (
    <main className="
      min-h-screen overflow-x-hidden w-full max-w-full
      bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f]
      text-white p-6 pb-12
    ">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2
          w-[100vw] max-w-[600px] h-[100vw] max-h-[600px]
          bg-purple-500/10 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Hub
        </button>
      </div>

      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 mb-6 text-center">
        <h1 className="text-2xl font-bold">All Clans</h1>
        <p className="text-slate-400 text-sm mt-1">{clans.length} clans rostered this season</p>
      </div>

      <div className="relative z-10 space-y-6">
        {clans.map(clan => {
          const clanPlayers = players.filter(p => p.clan === clan);
          const rank = clanPlayers[0]?.cwlRank || "Unranked";
          const format = clanPlayers[0]?.cwlFormat || (clanPlayers.length >= 30 ? "30v30" : "15v15");
          const clanLink = clanPlayers[0]?.clanLink || "";

          return (
            <div key={clan} className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-lg font-bold truncate">{clan}</h2>
                  <span className="shrink-0 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {clanPlayers.length}
                  </span>
                </div>
                {clanLink && (
                  <a
                    href={clanLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      shrink-0 inline-flex items-center gap-1.5
                      px-3 py-1.5 rounded-full text-xs font-semibold
                      bg-purple-600/30 text-purple-200 border border-purple-500/30
                      hover:bg-purple-600/50 hover:text-white transition
                    "
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-4">{format} · {rank}</p>

              <div className="space-y-1.5">
                {[...clanPlayers]
                  .sort((a, b) => Number(b.townHall || 0) - Number(a.townHall || 0))
                  .map(player => (
                  <div
                    key={`${player.clan}-${player.account}-${player.position}`}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                  >
                    {TH_ICONS[String(player.townHall)] && (
                      <img
                        src={TH_ICONS[String(player.townHall)]}
                        alt={`TH${player.townHall}`}
                        className="w-6 h-6 shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">{player.account}</p>
                      <p className="text-[10px] text-slate-600 font-mono">{player.playerTag}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}


// Live SVG pie/bar chart breaking down players by Town Hall level.
// Accepts a clan filter (default: all clans combined) and a chart type
// toggle (pie | bar). Both charts use PIE_COLORS keyed by TH level for
// visual consistency. Built as plain SVG — no charting library needed.
const PIE_COLORS = [
  "#a78bfa", "#818cf8", "#60a5fa", "#38bdf8", "#22d3ee",
  "#2dd4bf", "#34d399", "#a3e635", "#facc15", "#fb923c",
  "#f87171", "#f472b6",
];

// Stable color assignment by TH level so the same TH always gets the
// same color regardless of which clans/levels are present in the view.
const ALL_TH_LEVELS = ["17","16","15","14","13","12","11","10","9","8","7","6","5","4","3","2","1"];
function thColor(level) {
  const idx = ALL_TH_LEVELS.indexOf(String(level));
  return PIE_COLORS[idx >= 0 ? idx : PIE_COLORS.length - 1];
}

function polarPoint(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function AvgThView({ players, clans, onBack }) {
  const [chartType, setChartType] = useState("pie"); // "pie" | "bar"
  const [selectedClanFilter, setSelectedClanFilter] = useState("all");

  // Clans that actually have players rostered — only these appear in the filter.
  const rostered = clans.filter(c => players.some(p => p.clan === c));

  // Apply filter
  const filtered = selectedClanFilter === "all"
    ? players
    : players.filter(p => p.clan === selectedClanFilter);

  const counts = {};
  filtered.forEach(p => {
    const th = p.townHall || "Unknown";
    counts[th] = (counts[th] || 0) + 1;
  });

  const sortedLevels = Object.keys(counts).sort((a, b) => Number(b) - Number(a));
  const total = filtered.length;

  // ── Pie chart slices ──
  let cumulativeAngle = 0;
  const slices = sortedLevels.map((level) => {
    const count = counts[level];
    const fraction = total > 0 ? count / total : 0;
    const angle = fraction * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const cx = 100, cy = 100, r = 90;
    const start = polarPoint(cx, cy, r, startAngle);
    const end = polarPoint(cx, cy, r, endAngle);
    const largeArc = angle > 180 ? 1 : 0;
    const path = total > 0 && fraction < 1
      ? `M ${cx},${cy} L ${start.x},${start.y} A ${r},${r} 0 ${largeArc},1 ${end.x},${end.y} Z`
      : null;

    return { level, count, fraction, path, color: thColor(level) };
  });
  const isSingleSlice = slices.length === 1;

  // ── Bar chart dimensions ──
  const BAR_W = 280;
  const BAR_H = 160;
  const maxCount = sortedLevels.length > 0 ? Math.max(...sortedLevels.map(l => counts[l])) : 1;
  const barWidth = sortedLevels.length > 0 ? Math.floor((BAR_W - 24) / sortedLevels.length) : 20;
  const barGap = 2;

  return (
    <main className="
      min-h-screen overflow-x-hidden w-full max-w-full
      bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f]
      text-white p-6 pb-12
    ">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2
          w-[100vw] max-w-[600px] h-[100vw] max-h-[600px]
          bg-purple-500/10 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Hub
        </button>
      </div>

      {/* Header tile — title, chart toggle, clan filter */}
      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 mb-6">
        <h1 className="text-2xl font-bold text-center mb-4">Town Hall Breakdown</h1>
        <div className="flex items-center justify-center gap-3 flex-wrap">

          {/* Chart type toggle */}
          <div className="flex items-center rounded-full border border-white/10 bg-white/[0.03] p-0.5">
            <button
              onClick={() => setChartType("pie")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                chartType === "pie"
                  ? "bg-purple-600/40 text-purple-200"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Pie
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                chartType === "bar"
                  ? "bg-purple-600/40 text-purple-200"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Bar
            </button>
          </div>

          {/* Clan filter dropdown */}
          <select
            value={selectedClanFilter}
            onChange={e => setSelectedClanFilter(e.target.value)}
            className="
              px-3 py-1.5 rounded-full text-xs font-semibold
              border border-white/10 bg-white/[0.06] text-slate-300
              focus:outline-none focus:border-purple-500/40
              transition cursor-pointer
            "
          >
            <option value="all">All Clans ({players.length})</option>
            {rostered.map(c => (
              <option key={c} value={c}>
                {c} ({players.filter(p => p.clan === c).length})
              </option>
            ))}
          </select>

        </div>
        <p className="text-slate-500 text-xs text-center mt-3">
          {total} player{total !== 1 ? "s" : ""}{selectedClanFilter !== "all" ? ` · ${selectedClanFilter}` : " · all clans"}
        </p>
      </div>

      {/* Chart tile */}
      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 flex flex-col items-center">
        {total === 0 ? (
          <p className="text-slate-600 text-sm py-8">No players to chart yet.</p>
        ) : chartType === "pie" ? (
          <>
            <svg viewBox="0 0 200 200" className="w-56 h-56 mb-6">
              {isSingleSlice ? (
                <circle cx="100" cy="100" r="90" fill={slices[0].color} />
              ) : (
                slices.map(slice => (
                  <path key={slice.level} d={slice.path} fill={slice.color} />
                ))
              )}
            </svg>
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2">
              {slices.map(slice => (
                <div key={slice.level} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                  <span className="text-slate-300">TH{slice.level}</span>
                  <span className="text-slate-500 ml-auto">{slice.count} ({(slice.fraction * 100).toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Bar chart — same colour scheme as pie chart */}
            <div className="w-full overflow-x-auto pb-2">
              <svg
                viewBox={`0 0 ${Math.max(BAR_W, sortedLevels.length * (barWidth + barGap) + 24)} ${BAR_H + 40}`}
                className="w-full"
              >
                {sortedLevels.map((level, i) => {
                  const count = counts[level];
                  const barH = maxCount > 0 ? Math.round((count / maxCount) * BAR_H) : 0;
                  const x = 12 + i * (barWidth + barGap);
                  const y = BAR_H - barH;
                  const color = thColor(level);
                  return (
                    <g key={level}>
                      <rect
                        x={x} y={y}
                        width={barWidth - barGap} height={barH}
                        fill={color} rx="3"
                        opacity="0.85"
                      />
                      {/* count label above bar */}
                      <text
                        x={x + (barWidth - barGap) / 2} y={y - 4}
                        textAnchor="middle" fontSize="8" fill={color}
                      >
                        {count}
                      </text>
                      {/* TH label below bar */}
                      <text
                        x={x + (barWidth - barGap) / 2} y={BAR_H + 14}
                        textAnchor="middle" fontSize="8" fill="#94a3b8"
                      >
                        {level}
                      </text>
                    </g>
                  );
                })}
                {/* Y-axis baseline */}
                <line x1="8" y1={BAR_H} x2={Math.max(BAR_W, sortedLevels.length * (barWidth + barGap) + 24) - 4} y2={BAR_H} stroke="#334155" strokeWidth="1" />
              </svg>
            </div>
            {/* Legend — same as pie chart */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
              {slices.map(slice => (
                <div key={slice.level} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                  <span className="text-slate-300">TH{slice.level}</span>
                  <span className="text-slate-500 ml-auto">{slice.count} ({(slice.fraction * 100).toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

// CWL Rank Progression chart — one line per clan, X = season,
// Y = CWL rank tier (Champion I at top, Bronze III at bottom).
// Missing seasons carry the previous rank forward as a dashed line,
// so the chart never breaks — it just shows the rank held flat until
// a new value is recorded.
const RANK_ORDER = [
  "Champion I","Champion II","Champion III",
  "Master I","Master II","Master III",
  "Crystal I","Crystal II","Crystal III",
  "Gold I","Gold II","Gold III",
  "Silver I","Silver II","Silver III",
  "Bronze I","Bronze II","Bronze III",
];

const CLAN_COLORS = [
  "#a78bfa","#60a5fa","#34d399","#fb923c","#f472b6","#38bdf8","#facc15",
];

function rankY(rank, chartH) {
  const idx = RANK_ORDER.indexOf(rank);
  const total = RANK_ORDER.length - 1;
  const pos = idx === -1 ? total : idx;
  return Math.round((pos / total) * chartH);
}

function HistoryView({ onBack }) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clanFilter, setClanFilter] = useState("all");

  useEffect(() => {
    fetch("/api/history")
      .then(r => r.json())
      .then(data => setHistory(data.history || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  // Build chart data — one series per clan, all seasons sorted
  const byClan = {};
  (history || []).forEach(row => {
    if (!byClan[row.clan_name]) byClan[row.clan_name] = [];
    byClan[row.clan_name].push({ season: row.season, rank: row.cwl_rank });
  });

  const clans = Object.keys(byClan);
  const allSeasons = [...new Set((history || []).map(r => r.season))]
    .sort((a, b) => {
      // Sort by recorded_at order — use index in original data as proxy
      const ia = (history || []).findIndex(r => r.season === a);
      const ib = (history || []).findIndex(r => r.season === b);
      return ia - ib;
    });

  // For each clan, build a complete series across all seasons,
  // carrying the last known rank forward for missing seasons.
  const series = clans.map((clan, ci) => {
    const recorded = byClan[clan];
    let lastRank = null;
    const points = allSeasons.map(season => {
      const found = recorded.find(r => r.season === season);
      if (found) { lastRank = found.rank; return { season, rank: found.rank, interpolated: false }; }
      return { season, rank: lastRank, interpolated: true };
    });
    return { clan, points, color: CLAN_COLORS[ci % CLAN_COLORS.length] };
  });

  const filteredSeries = clanFilter === "all"
    ? series
    : series.filter(s => s.clan === clanFilter);

  const CHART_W = 320;
  const CHART_H = 200;
  const PAD_L = 72;
  const PAD_R = 12;
  const PAD_T = 12;
  const PAD_B = 28;
  const plotW = CHART_W - PAD_L - PAD_R;
  const plotH = CHART_H - PAD_T - PAD_B;
  const xStep = allSeasons.length > 1 ? plotW / (allSeasons.length - 1) : plotW;

  return (
    <main className="min-h-screen overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-6 pb-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 mb-6">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Hub
        </button>
      </div>

      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 mb-6 text-center">
        <h1 className="text-2xl font-bold">CWL Rank History</h1>
        <p className="text-slate-500 text-xs mt-1">Recorded each season by admins · dashed = carried forward</p>
        {clans.length > 0 && (
          <div className="flex justify-center mt-3">
            <select
              value={clanFilter}
              onChange={e => setClanFilter(e.target.value)}
              className="
                px-3 py-1.5 rounded-full text-xs font-semibold
                border border-white/10 bg-white/[0.06] text-slate-300
                focus:outline-none focus:border-purple-500/40
                transition cursor-pointer
              "
            >
              <option value="all">All Clans</option>
              {clans.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
        {loading ? (
          <div className="animate-pulse h-48 rounded-xl bg-white/[0.06]" />
        ) : allSeasons.length === 0 ? (
          <p className="text-slate-600 text-sm text-center py-8">No history recorded yet. Admins can record each season using the "Record Season" button on the admin page.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full min-w-[280px]">
                {/* Y-axis gridlines + labels */}
                {RANK_ORDER.filter((_, i) => i % 3 === 0).map(rank => {
                  const y = PAD_T + rankY(rank, plotH);
                  return (
                    <g key={rank}>
                      <line x1={PAD_L} y1={y} x2={PAD_L + plotW} y2={y} stroke="#1e293b" strokeWidth="1" />
                      <text x={PAD_L - 4} y={y + 4} textAnchor="end" fontSize="7" fill="#475569">{rank}</text>
                    </g>
                  );
                })}

                {/* X-axis labels */}
                {allSeasons.map((season, i) => {
                  const x = PAD_L + (allSeasons.length > 1 ? i * xStep : plotW / 2);
                  return (
                    <text key={season} x={x} y={CHART_H - 6} textAnchor="middle" fontSize="7" fill="#475569">
                      {season.split(" ")[0].slice(0, 3)}
                    </text>
                  );
                })}

                {/* Clan lines */}
                {filteredSeries.map(({ clan, points, color }) => {
                  const validPoints = points.filter(p => p.rank);
                  if (validPoints.length === 0) return null;

                  // Build path segments — switch between solid and dashed
                  const segments = [];
                  let segStart = null;
                  let segInterp = null;

                  const ptX = (i) => PAD_L + (allSeasons.length > 1 ? i * xStep : plotW / 2);
                  const ptY = (rank) => PAD_T + rankY(rank, plotH);

                  points.forEach((pt, i) => {
                    if (!pt.rank) { segStart = null; return; }
                    if (segStart === null) {
                      segStart = i;
                      segInterp = pt.interpolated;
                      return;
                    }
                    if (pt.interpolated !== segInterp) {
                      segments.push({ from: segStart, to: i - 1, interpolated: segInterp });
                      segStart = i - 1;
                      segInterp = pt.interpolated;
                    }
                  });
                  if (segStart !== null) {
                    segments.push({ from: segStart, to: points.length - 1, interpolated: segInterp });
                  }

                  return (
                    <g key={clan}>
                      {segments.map((seg, si) => {
                        const d = points
                          .slice(seg.from, seg.to + 1)
                          .filter(p => p.rank)
                          .map((p, j) => {
                            const idx = allSeasons.indexOf(p.season);
                            return `${j === 0 ? "M" : "L"} ${ptX(idx)} ${ptY(p.rank)}`;
                          })
                          .join(" ");
                        return (
                          <path
                            key={si}
                            d={d}
                            fill="none"
                            stroke={color}
                            strokeWidth="1.5"
                            strokeDasharray={seg.interpolated ? "4 3" : "none"}
                            opacity="0.85"
                          />
                        );
                      })}
                      {/* Dots at recorded points only */}
                      {points.filter(p => p.rank && !p.interpolated).map(p => {
                        const idx = allSeasons.indexOf(p.season);
                        return (
                          <circle
                            key={p.season}
                            cx={ptX(idx)}
                            cy={ptY(p.rank)}
                            r="2.5"
                            fill={color}
                          />
                        );
                      })}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4">
              {filteredSeries.map(({ clan, color }) => (
                <div key={clan} className="flex items-center gap-1.5 text-xs">
                  <span className="w-4 h-0.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                  <span className="text-slate-400">{clan}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}



export default function Home() {

  const [players, setPlayers] = useState([]);
const [selectedClan, setSelectedClan] = useState(null);
const [search, setSearch] = useState("");

// ─── CWL player performance leaderboard ────────────────────────────────────
function LeaderboardView({ onBack }) {
  const [data, setData] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedClan, setSelectedClan] = useState("all");
  const [sortBy, setSortBy] = useState("stars_earned");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    fetch("/api/leaderboard")
      .then(r => r.json())
      .then(d => {
        setData(d.stats || []);
        setSeasons(d.seasons || []);
        setSelectedSeason(d.currentSeason || null);
      })
      .catch(() => setData([]));
  }, []);

  function fetchSeason(season) {
    setSelectedSeason(season);
    setData(null);
    fetch(`/api/leaderboard?season=${encodeURIComponent(season)}`)
      .then(r => r.json())
      .then(d => setData(d.stats || []))
      .catch(() => setData([]));
  }

  const clans = data ? [...new Set(data.map(p => p.clan_name))].sort() : [];
  const filtered = data
    ? data.filter(p => selectedClan === "all" || p.clan_name === selectedClan)
    : [];
  const sorted = [...filtered].sort((a, b) => {
    const av = parseFloat(a[sortBy]) || 0;
    const bv = parseFloat(b[sortBy]) || 0;
    return sortDir === "desc" ? bv - av : av - bv;
  });

  function toggleSort(col) {
    if (sortBy === col) { setSortDir(d => d === "desc" ? "asc" : "desc"); }
    else { setSortBy(col); setSortDir("desc"); }
  }

  const COLS = [
    { key: "stars_earned",    label: "Stars" },
    { key: "destruction_pct", label: "Dest %" },
    { key: "efficiency",      label: "Eff" },
    { key: "attacks_used",    label: "Attacks" },
    { key: "missed_attacks",  label: "Missed" },
    { key: "stars_conceded",  label: "Def Stars" },
    { key: "defence_pct",     label: "Def %" },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-6 pb-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full" />
      </div>
      <div className="relative z-10 mb-6">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Hub
        </button>
      </div>
      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 mb-6 text-center">
        <h1 className="text-2xl font-thin tracking-widest mb-1">CWL Leaderboard</h1>
        <p className="text-slate-500 text-xs mb-4">Player attack and defence performance by season</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {seasons.length > 0 && (
            <select value={selectedSeason || ""} onChange={e => fetchSeason(e.target.value)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white focus:outline-none [color-scheme:dark]">
              {seasons.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          {clans.length > 1 && (
            <select value={selectedClan} onChange={e => setSelectedClan(e.target.value)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white focus:outline-none [color-scheme:dark]">
              <option value="all">All Clans</option>
              {clans.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
      </div>
      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
        {data === null ? (
          <div className="p-8 text-center text-slate-500 text-sm animate-pulse">Loading…</div>
        ) : sorted.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-600 text-sm">No leaderboard data yet.</p>
            <p className="text-slate-700 text-xs mt-1">Stats are captured automatically when an admin closes the season.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold uppercase tracking-widest">#</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold uppercase tracking-widest">Player</th>
                  {COLS.map(col => (
                    <th key={col.key} onClick={() => toggleSort(col.key)}
                      className={`px-3 py-3 font-semibold uppercase tracking-widest whitespace-nowrap cursor-pointer select-none transition text-center ${sortBy === col.key ? "text-purple-300" : "text-slate-500 hover:text-slate-300"}`}>
                      {col.label}{sortBy === col.key ? (sortDir === "desc" ? " ↓" : " ↑") : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((p, i) => (
                  <tr key={p.player_tag} className={`border-b border-white/[0.06] hover:bg-white/[0.03] transition ${i === 0 ? "bg-purple-500/5" : ""}`}>
                    <td className="px-4 py-3 text-slate-500 font-mono">{i + 1}</td>
                    <td className="px-4 py-3 min-w-[120px]">
                      <p className="font-semibold text-white truncate max-w-[130px]">{p.player_name}</p>
                      <p className="text-slate-600 font-mono text-[10px] truncate max-w-[130px]">{p.clan_name.split(" ")[0]}</p>
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-green-300">{p.stars_earned}</td>
                    <td className="px-3 py-3 text-center text-slate-300">{parseFloat(p.destruction_pct).toFixed(1)}%</td>
                    <td className="px-3 py-3 text-center font-semibold text-purple-300">{parseFloat(p.efficiency).toFixed(2)}</td>
                    <td className="px-3 py-3 text-center text-slate-300">{p.attacks_used}</td>
                    <td className="px-3 py-3 text-center text-red-400">{p.missed_attacks}</td>
                    <td className="px-3 py-3 text-center text-slate-400">{p.stars_conceded}</td>
                    <td className="px-3 py-3 text-center text-slate-400">{parseFloat(p.defence_pct).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

const [statView, setStatView] = useState(null); // null | "players" | "clans" | "avgth"
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

    // Stat tile views use reserved hash names; anything else is treated
    // as a clan name (the original selectedClan behaviour).
    if (hash === "players" || hash === "clans" || hash === "avgth" || hash === "history") {
      setStatView(hash);
      setSelectedClan(null);
      setHighlightedAccount(null);
    } else {
      setStatView(null);
      setSelectedClan(hash || null);
      if (!hash) setHighlightedAccount(null);
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
    return <PlayersView players={players} onBack={() => { window.history.pushState({}, "", window.location.pathname); setStatView(null); }} />;
  }

  if (statView === "clans") {
    return <ClansView clans={clans} players={players} onBack={() => { window.history.pushState({}, "", window.location.pathname); setStatView(null); }} />;
  }

  if (statView === "avgth") {
    return <AvgThView players={players} clans={clans} onBack={() => { window.history.pushState({}, "", window.location.pathname); setStatView(null); }} />;
  }

  if (statView === "history") {
    return <HistoryView onBack={() => { window.history.pushState({}, "", window.location.pathname); setStatView(null); }} />;
  }

  if (statView === "leaderboard") {
    return <LeaderboardView onBack={() => { window.history.pushState({}, "", window.location.pathname); setStatView(null); }} />;
  }

  if (selectedClan) {

  const rank = clanPlayers?.[0]?.cwlRank ?? "unranked";

  const season =
    clanPlayers[0]?.season || "";

  const clanLink =
    clanPlayers[0]?.clanLink || "";

  // CWL Format now comes from the Sheet's own CWL Format column (item 5),
  // not inferred from row count — row count alone became unreliable once
  // Substitutes could push a clan's total assigned players past 15/30
  // without that meaning the clan's actual format changed. Falls back to
  // the old row-count guess only if no clan tab row has a format value
  // set yet (e.g. before any admin has touched the format toggle).
  const format =
    clanPlayers[0]?.cwlFormat ||
    (clanPlayers.length >= 30 ? "30v30" : "15v15");

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

<div className="relative z-10 mb-6">
  <button
    onClick={() => {
      window.history.pushState({}, "", window.location.pathname);
      setSelectedClan(null);
      setHighlightedAccount(null);
    }}
    className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
    Back to Hub
  </button>
</div>

<div className="
  rounded-3xl border border-white/10
  bg-white/[0.04] backdrop-blur-xl
  p-6 mb-6 shadow-xl
  flex flex-col items-center text-center
">
  {/* Rank label */}
  <div className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-4">
    {rank}
  </div>

  {/* CWL icon */}
  <img
    src={CWL_ICONS[rank] || CWL_ICONS["unranked"]}
    alt={rank}
    className="w-24 h-24 mx-auto mb-4"
  />

  {/* Clan name */}
  <h1 className="text-2xl font-bold">{selectedClan}</h1>

  {/* Format + season */}
  <div className="text-lg text-slate-300 mt-4">{format}</div>
  <div className="text-sm text-slate-500 mt-2">{season}</div>

  {/* Open Clan button */}
  {clanLink && (
    <div className="mt-5">
      <a
        href={clanLink}
        target="_blank"
        rel="noopener noreferrer"
        className="
          inline-flex items-center gap-2
          px-6 py-3 rounded-full
          bg-purple-600/30 text-purple-200
          border border-purple-500/30
          hover:bg-purple-600/50 hover:text-white
          transition font-semibold text-sm
        "
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        Open Clan
      </a>
    </div>
  )}
</div>

      <div className="space-y-3">

        {[...clanPlayers]
          .sort((a, b) => Number(b.townHall || 0) - Number(a.townHall || 0))
          .map((player, index) => (

          <motion.div
  key={`${player.clan}-${player.account}-${player.position}`}
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
  className={`
    rounded-2xl border backdrop-blur-xl p-4 shadow-lg transition
    hover:scale-[1.01]
    ${highlightedAccount && player.playerTag === highlightedAccount
      ? "border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/15 hover:border-purple-500/50"
      : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]"
    }
  `}
>

            <div className="flex items-center w-full justify-between min-w-0 gap-3">

  {/* LEFT SIDE */}
  <div className="flex items-center min-w-0 overflow-hidden">

  <div className="text-lg font-bold w-8">
    {index + 1}
  </div>

  <img
    src={TH_ICONS[player.townHall]}
    alt={player.townHall}
    className="w-10 h-10 ml-1"
  />

  <div className="flex flex-col min-w-0 ml-3">
      <span className="font-semibold text-white truncate block max-w-[140px]">
  {player.account}
</span>

      <span className="text-xs text-slate-500 truncate block max-w-[120px]">
  {player.clan}
</span>
    </div>

  </div>

  {/* RIGHT SIDE */}
<div className="flex flex-col items-end gap-2 text-sm text-slate-300">

  {/* Row 1 — Status */}
  <span
    className={`
      px-2
      py-1
      rounded-full
      text-xs
      font-semibold
      ${
        player.status?.toLowerCase() === "confirmed"
          ? "bg-green-500/20 text-green-300 border border-green-500/30"
          : player.status?.toLowerCase() === "substitute"
          ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
          : player.status?.toLowerCase() === "active"
          ? "bg-green-500/20 text-green-300 border border-green-500/30"
          : player.status?.toLowerCase() === "benched"
          ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
          : player.status?.toLowerCase() === "inactive"
          ? "bg-red-500/20 text-red-300 border border-red-500/30"
          : "bg-slate-500/20 text-slate-300 border border-slate-500/30"
      }
    `}
  >
    {player.status}
  </span>

  </div>

</div>

          </motion.div>

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

  {/* top row — three-column grid matching admin page layout:
      left empty, Discord centred, right empty for balance */}
  <div className="relative z-10 grid grid-cols-3 items-center mb-6">
    <div />
    <div className="flex justify-center">
      <DiscordWidget variant="center" />
    </div>
    <div />
  </div>

    <motion.div
  initial={{ opacity: 0, y: 15 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
  className="
    relative
    z-10
    mb-10
    rounded-3xl
    border
    border-white/10
    bg-white/[0.03]
    backdrop-blur-xl
    p-8
    text-center
  "
>

  <img
    src={BRANDING.cwlhub}
    alt="CWL Hub"
    className="w-28 h-28 mx-auto mb-5"
  />

  <h1 className="text-5xl font-bold tracking-tight">
    {currentSeason || players[0]?.season || "CWL Hub"}
  </h1>

  <p className="text-slate-300 mt-3 text-lg">
    Cognition Collective
  </p>

  <p className="text-slate-500 mt-2">
    Search • Browse • Join
  </p>

  <div className="mt-6">
    <Link
      href="/signup"
      className="
        inline-flex items-center gap-2
        px-6 py-3 rounded-full
        bg-purple-600/30 text-purple-200
        border border-purple-500/30
        hover:bg-purple-600/50 hover:text-white
        transition font-semibold text-sm
      "
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Sign Up
    </Link>
  </div>

</motion.div>

<div className="mb-8 relative z-10">

  <div className="relative">
    <input
      type="text"
      placeholder="Search players..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="
    w-full
    rounded-3xl
    border
    border-white/10
    bg-white/[0.04]
    backdrop-blur-xl
    px-5
    py-4
    text-white
    placeholder:text-slate-500
    focus:outline-none
    focus:border-white/20
    focus:bg-white/[0.06]
    transition
  "
    />
    {search && (
      <button
        onClick={() => setSearch("")}
        className="
          absolute right-4 top-1/2 -translate-y-1/2
          w-6 h-6 rounded-full flex items-center justify-center
          bg-white/[0.08] text-slate-400
          hover:bg-white/[0.15] hover:text-white transition
        "
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </div>

</div>

    <div className="space-y-2 mb-8 relative z-10">

      {/* Row 1: Leaderboard + History — wider tiles */}
      <div className="grid grid-cols-2 gap-2">
        <div
          onClick={() => { window.history.pushState({}, "", "#leaderboard"); setStatView("leaderboard"); }}
          className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 min-h-[100px] flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.06] hover:border-white/20 transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <div className="text-slate-400 text-xs uppercase tracking-widest">Leaderboard</div>
        </div>

        <div
          onClick={() => { window.history.pushState({}, "", "#history"); setStatView("history"); }}
          className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 min-h-[100px] flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.06] hover:border-white/20 transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 17l4-8 4 5 2-3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
          </svg>
          <div className="text-slate-400 text-xs uppercase tracking-widest">History</div>
        </div>
      </div>

      {/* Row 2: Players + Clans + Avg TH — three equal tiles */}
      <div className="grid grid-cols-3 gap-2">
        <div
          onClick={() => { window.history.pushState({}, "", "#players"); setStatView("players"); }}
          className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 min-h-[90px] flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.06] hover:border-white/20 transition shadow-xl">
          <div className="text-3xl font-thin tracking-widest text-white tabular-nums">{players.length}</div>
          <div className="text-slate-400 text-xs uppercase tracking-widest mt-1">Players</div>
        </div>

        <div
          onClick={() => { window.history.pushState({}, "", "#clans"); setStatView("clans"); }}
          className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 min-h-[90px] flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.06] hover:border-white/20 transition">
          <div className="text-3xl font-thin tracking-widest text-white tabular-nums">{clans.length}</div>
          <div className="text-slate-400 text-xs uppercase tracking-widest mt-1">Clans</div>
        </div>

        <div
          onClick={() => { window.history.pushState({}, "", "#avgth"); setStatView("avgth"); }}
          className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 min-h-[90px] flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.06] hover:border-white/20 transition">
          <div className="text-3xl font-thin tracking-widest text-white tabular-nums">
            {players.length ? (players.reduce((sum, p) => sum + Number(p.townHall || 0), 0) / players.length).toFixed(1) : "-"}
          </div>
          <div className="text-slate-400 text-xs uppercase tracking-widest mt-1">Avg TH</div>
        </div>
      </div>

    </div>

    {search ? (

      <div className="space-y-4 mt-2">

        {searchResults.map(player => (
  <div
    key={`${player.clan}-${player.account}-${player.position}`}
    onClick={() => {
  window.history.pushState({}, "", `#${player.clan}`);
  setHighlightedAccount(player.playerTag);
  setSelectedClan(player.clan);
}}
    className="
      flex items-center justify-between
      py-3 px-1
      border-b border-white/5
      cursor-pointer hover:bg-white/[0.03] transition
    "
  >
    {/* Left: TH icon + account name */}
    <div className="flex items-center gap-2.5 min-w-0">
      {TH_ICONS[String(player.townHall)] ? (
        <img
          src={TH_ICONS[String(player.townHall)]}
          alt={`TH${player.townHall}`}
          className="w-7 h-7 shrink-0"
        />
      ) : (
        <div className="w-7 h-7 shrink-0" />
      )}
      <span className="font-medium text-white truncate">
        {player.account}
      </span>
    </div>

    {/* Right: status circle + Open clan button */}
    <div className="flex items-center gap-2 shrink-0 ml-2">
      {player.status?.toLowerCase() === "confirmed" && (
        <span className="w-2.5 h-2.5 rounded-full bg-green-400 shrink-0" title="Confirmed" />
      )}
      {player.status?.toLowerCase() === "substitute" && (
        <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0" title="Substitute" />
      )}
      {player.clanLink && (
        <a
          href={player.clanLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="
            inline-flex items-center gap-1 shrink-0
            px-2 py-0.5 rounded-full text-[10px] font-semibold
            bg-purple-600/20 text-purple-300 border border-purple-500/20
            hover:bg-purple-600/40 hover:text-white transition
          "
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Open
        </a>
      )}
    </div>
  </div>
))}

      </div>

    ) : (

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
              rounded-3xl
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

                <div className="text-2xl font-bold mt-2">
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

    )}

  </main>
);
}