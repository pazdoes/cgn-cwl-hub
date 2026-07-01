"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import Link from "next/link";
import { getLeagueStyles } from "../lib/leagueColors";
import { CWL_ICONS, TH_ICONS } from "../lib/icons";
import { MiniPie, LargePie, StarIcons, StatPill, RankBadge } from "../lib/components";

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
function PlayersView({ players, onBack, rosterSeasons = [] }) {
  const [histSeason, setHistSeason] = useState(null);
  const [histPlayers, setHistPlayers] = useState(null);
  const [loadingHist, setLoadingHist] = useState(false);

  function loadHistSeason(season) {
    if (!season) { setHistSeason(null); setHistPlayers(null); return; }
    setHistSeason(season);
    setLoadingHist(true);
    fetch(`/api/roster-history?season=${encodeURIComponent(season)}`)
      .then(r => r.json())
      .then(d => setHistPlayers(d.players || []))
      .catch(() => setHistPlayers([]))
      .finally(() => setLoadingHist(false));
  }

  const displayPlayers = histPlayers || players;
  const isHistorical = !!histSeason;
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


      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 mb-6 text-center">
        <h1 className="text-2xl font-thin tracking-widest">All Players</h1>
        <p className="text-slate-500 text-xs mt-1">{displayPlayers.length} {isHistorical ? `in ${histSeason}` : "rostered this season"}</p>
        {rosterSeasons.length > 0 && (
          <div className="mt-3 flex justify-center">
            <select value={histSeason || ""} onChange={e => loadHistSeason(e.target.value || null)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white focus:outline-none [color-scheme:dark]">
              <option value="">Current Season</option>
              {rosterSeasons.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
        <div className="space-y-2">
          {loadingHist ? <div className="text-slate-500 text-sm text-center py-6 animate-pulse">Loading…</div> : [...displayPlayers]
            .sort((a, b) => Number(b.townHall || b.town_hall_level || 0) - Number(a.townHall || a.town_hall_level || 0))
            .map(player => (
            <div
              key={player.player_tag || `${player.clan}-${player.account}-${player.position}`}
              onClick={() => window.open(`/player/${(player.player_tag||"").replace("#","")}`, "_blank")}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 cursor-pointer hover:border-white/20 hover:bg-white/[0.05] transition"
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
                <span className="shrink-0 inline-block text-[10px] px-2.5 py-0.5 rounded-full border border-purple-500/40 bg-transparent text-purple-400 font-semibold">
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


      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 mb-6 text-center">
        <h1 className="text-2xl font-thin tracking-widest">All Clans</h1>
        <p className="text-slate-500 text-xs mt-1">{clans.length} clans rostered this season</p>
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
                  <span className="shrink-0 inline-block text-[10px] px-2.5 py-0.5 rounded-full border border-purple-500/40 bg-transparent text-purple-400 font-semibold">
                    {clanPlayers.length}
                  </span>
                </div>
                {clanLink && (
                  <a
                    href={clanLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-transparent text-purple-400 border border-purple-500/40 hover:border-purple-400 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                    Open
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-4">{format} · {rank}</p>

              <div className="space-y-1.5">
                {[...clanPlayers]
                  .sort((a, b) => {
                    const STATUS_ORDER = { confirmed: 0, registered: 1, substitute: 2 };
                    const sa = STATUS_ORDER[a.status?.toLowerCase()] ?? 1;
                    const sb = STATUS_ORDER[b.status?.toLowerCase()] ?? 1;
                    if (sa !== sb) return sa - sb;
                    return Number(b.townHall || 0) - Number(a.townHall || 0);
                  })
                  .map(player => (
                  <div
                    key={`${player.clan}-${player.account}-${player.position}`}
                    onClick={() => window.open(`/player/${(player.playerTag||"").replace("#","")}`, "_blank")}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 cursor-pointer hover:border-white/20 hover:bg-white/[0.05] transition"
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


      {/* Header tile — title, chart toggle, clan filter */}
      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 mb-6 text-center">
        <h1 className="text-2xl font-thin tracking-widest mb-1">Town Hall Breakdown</h1>
        <p className="text-slate-500 text-xs mb-4">
          {total} player{total !== 1 ? "s" : ""}{selectedClanFilter !== "all" ? ` · ${selectedClanFilter}` : " · all clans"}
        </p>

        {/* Controls row */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          {/* Clan filter — pill dropdown */}
          <select
            value={selectedClanFilter}
            onChange={e => setSelectedClanFilter(e.target.value)}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white focus:outline-none [color-scheme:dark]"
          >
            <option value="all">All Clans ({players.length})</option>
            {rostered.map(c => (
              <option key={c} value={c}>{c} ({players.filter(p => p.clan === c).length})</option>
            ))}
          </select>
        </div>

        {/* Chart type toggle — minimal arrows */}
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setChartType("pie")} className="text-slate-500 hover:text-slate-300 transition p-1" title="Pie chart">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <span className="text-[10px] text-slate-600 uppercase tracking-widest select-none min-w-[60px]">
            {chartType === "pie" ? "Pie" : "Bar"}
          </span>
          <button onClick={() => setChartType("bar")} className="text-slate-500 hover:text-slate-300 transition p-1" title="Bar chart">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
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


// ── Player Performance History Chart ─────────────────────────────────────────
const PLAYER_COLORS = ["#a78bfa", "#34d399", "#fb923c"];
const STAT_OPTIONS = [
  { key: "overall",            label: "CGN Rating" },
  { key: "efficiency",         label: "Atk Efficiency" },
  { key: "stars_earned",       label: "Stars Earned" },
  { key: "destruction_pct",    label: "Destruction %" },
  { key: "defence_efficiency", label: "Def Efficiency" },
  { key: "stars_conceded",     label: "Stars Conceded" },
  { key: "defence_pct",        label: "Defence %" },
  { key: "attacks_used",       label: "Attacks Used" },
  { key: "missed_attacks",     label: "Missed Attacks" },
  { key: "cwl_rank",           label: "CWL Rank (Clan)" },
];

// CWL Rank order for Y axis positioning
const CWL_RANK_ORDER_HIST = [
  "Champion I","Champion II","Champion III",
  "Master I","Master II","Master III",
  "Crystal I","Crystal II","Crystal III",
  "Gold I","Gold II","Gold III",
  "Silver I","Silver II","Silver III",
  "Bronze I","Bronze II","Bronze III","Unranked",
];

function rankToNum(rank) {
  const idx = CWL_RANK_ORDER_HIST.indexOf(rank);
  return idx === -1 ? CWL_RANK_ORDER_HIST.length : idx;
}

function PlayerPerformanceChart({ allData, seasons }) {
  const [playerSearch, setPlayerSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [trackedPlayers, setTrackedPlayers] = useState([]);
  const [selectedStat, setSelectedStat] = useState("overall");
  const isRankStat = selectedStat === "cwl_rank";

  useEffect(() => {
    if (!playerSearch.trim() || !allData) { setSearchResults([]); return; }
    const q = playerSearch.toLowerCase();
    const seen = new Set();
    const results = [];
    for (const p of allData) {
      if (seen.has(p.player_tag)) continue;
      if (p.player_name.toLowerCase().includes(q) || p.player_tag.toLowerCase().includes(q)) {
        seen.add(p.player_tag);
        results.push({ tag: p.player_tag, name: p.player_name, clan: p.clan_name });
        if (results.length >= 8) break;
      }
    }
    setSearchResults(results);
  }, [playerSearch, allData]);

  function buildPlayerData(tag) {
    return seasons.map(season => {
      const row = allData?.find(r => r.player_tag === tag && r.season === season);
      if (!row) return { season, value: null, displayValue: null };
      if (selectedStat === "cwl_rank") {
        return { season, value: row.cwl_rank ? rankToNum(row.cwl_rank) : null, displayValue: row.cwl_rank || null };
      }
      if (selectedStat === "overall") {
        const eff = parseFloat(row.efficiency||0);
        const def = row.defence_efficiency != null ? parseFloat(row.defence_efficiency) : 3;
        const v = (row.attacks_used > 0 && row.attacks_available > 0)
          ? parseFloat(((eff * 0.6) + ((3 - def) * 0.4)).toFixed(2))
          : null;
        return { season, value: v, displayValue: v };
      }
      if (selectedStat === "overall") {
        const atk = parseFloat(row.attack_efficiency||0);
        const def = parseFloat(row.defence_efficiency||0);
        const wins = row.wars_won||0;
        const v = (row.total_attacks_used > 0 && row.total_attacks_available > 0)
          ? parseFloat(((atk*0.5) + ((3-def)*0.3) + (wins/7*3*0.2)).toFixed(2))
          : null;
        return { season, value: v, displayValue: v };
      }
      const v = parseFloat(row[selectedStat]);
      return { season, value: isNaN(v) ? null : v, displayValue: isNaN(v) ? null : v };
    });
  }

  function addPlayer(player) {
    if (trackedPlayers.length >= 3) return;
    if (trackedPlayers.find(p => p.tag === player.tag)) return;
    setTrackedPlayers(prev => [...prev, { ...player, data: buildPlayerData(player.tag) }]);
    setPlayerSearch(""); setSearchResults([]);
  }

  function removePlayer(tag) {
    setTrackedPlayers(prev => prev.filter(p => p.tag !== tag));
  }

  useEffect(() => {
    if (!allData || trackedPlayers.length === 0) return;
    setTrackedPlayers(prev => prev.map(p => ({ ...p, data: buildPlayerData(p.tag) })));
  }, [selectedStat, allData]);

  // Auto-populate top 3 players by overall rating from most recent season
  useEffect(() => {
    if (!allData || allData.length === 0 || trackedPlayers.length > 0) return;
    // Get most recent season entry per player
    const latestBySeason = {};
    for (const p of allData) {
      if (!latestBySeason[p.player_tag] || p.season > latestBySeason[p.player_tag].season) {
        latestBySeason[p.player_tag] = p;
      }
    }
    const top3 = Object.values(latestBySeason)
      .filter(p => p.attacks_used > 0 && p.attacks_available > 0)
      .sort((a,b) => {
        const oa = (parseFloat(a.efficiency||0)*0.6)+((3-parseFloat(a.defence_efficiency??3))*0.4);
        const ob = (parseFloat(b.efficiency||0)*0.6)+((3-parseFloat(b.defence_efficiency??3))*0.4);
        return ob - oa;
      })
      .slice(0, 3);
    setTrackedPlayers(top3.map(p => ({ tag: p.player_tag, name: p.player_name, clan: p.clan_name, data: buildPlayerData(p.player_tag) })));
  }, [allData]);

  // Chart
  const CHART_W = 320, CHART_H = 180;
  const PAD_L = 52, PAD_R = 12, PAD_T = 12, PAD_B = 28;
  const plotW = CHART_W - PAD_L - PAD_R;
  const plotH = CHART_H - PAD_T - PAD_B;

  const validSeasons = seasons.filter(s =>
    trackedPlayers.some(p => p.data.find(d => d.season === s && d.value !== null))
  );
  const xStep = validSeasons.length > 1 ? plotW / (validSeasons.length - 1) : plotW / 2;

  const allVals = trackedPlayers.flatMap(p => p.data.map(d => d.value)).filter(v => v !== null);
  const isOverallStat = selectedStat === "overall";
  const minVal = isOverallStat ? 0 : (allVals.length ? Math.min(...allVals) : 0);
  const maxVal = isOverallStat ? 3 : (allVals.length ? Math.max(...allVals) : 1);
  const valRange = maxVal - minVal || 1;

  // Stats where lower = better — invert Y axis so best sits at top
  const INVERTED_STATS = new Set(["defence_efficiency", "stars_conceded", "defence_pct"]);
  const isInvertedStat = INVERTED_STATS.has(selectedStat);

  function xPos(season) {
    const idx = validSeasons.indexOf(season);
    return PAD_L + (validSeasons.length > 1 ? idx * xStep : plotW / 2);
  }
  function yPos(val) {
    if (isRankStat) {
      return PAD_T + (val / (CWL_RANK_ORDER_HIST.length)) * plotH;
    }
    if (isInvertedStat) {
      // Invert: lower value = higher on chart (lower is better)
      return PAD_T + ((val - minVal) / valRange) * plotH;
    }
    return PAD_T + plotH - ((val - minVal) / valRange) * plotH;
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
      <h2 className="text-sm font-semibold text-slate-300 mb-0.5">Player Performance History</h2>
      <p className="text-slate-600 text-xs mb-4">Track up to 3 players across seasons</p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select value={selectedStat} onChange={e => setSelectedStat(e.target.value)}
          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white focus:outline-none [color-scheme:dark]">
          {STAT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
        {trackedPlayers.length < 3 && (
          <div className="relative flex-1 min-w-[140px]">
            <input type="text" placeholder="Add player…" value={playerSearch}
              onChange={e => setPlayerSearch(e.target.value)}
              className="w-full rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
            {searchResults.length > 0 && (
              <div className="absolute left-0 top-full mt-1 z-50 w-full min-w-[200px] rounded-2xl border border-white/10 bg-[#0d1424]/95 backdrop-blur-xl shadow-xl overflow-hidden">
                {searchResults.map(p => (
                  <button key={p.tag} type="button" onClick={() => addPlayer(p)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white transition text-left">
                    <span className="font-semibold truncate">{p.name}</span>
                    <span className="text-slate-600 text-[10px] shrink-0">{p.clan.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {trackedPlayers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {trackedPlayers.map((p, i) => (
            <div key={p.tag} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PLAYER_COLORS[i] }}/>
              <span className="text-xs text-slate-300 max-w-[80px] truncate">{p.name}</span>
              <button onClick={() => removePlayer(p.tag)} className="text-slate-600 hover:text-red-400 transition text-[10px] ml-0.5">✕</button>
            </div>
          ))}
        </div>
      )}

      {trackedPlayers.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-slate-700 text-xs text-center">
          Search for a player above to begin tracking
        </div>
      ) : validSeasons.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-slate-700 text-xs">No data for selected players</div>
      ) : (
        <>
          {isInvertedStat && (
            <p className="text-[9px] text-blue-400/60 uppercase tracking-widest mb-1 text-right">↓ lower is better · chart inverted</p>
          )}
          <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full min-w-[280px]">
            {[0, 0.25, 0.5, 0.75, 1].map(pct => {
              const y = PAD_T + pct * plotH;
              let label;
              if (isRankStat) {
                const idx = Math.round(pct * (CWL_RANK_ORDER_HIST.length - 1));
                label = CWL_RANK_ORDER_HIST[idx]?.replace(" I","I").replace(" II","II").replace(" III","III") || "";
              } else if (isInvertedStat) {
                // Inverted: top of chart = minVal (best), bottom = maxVal (worst)
                const val = minVal + pct * valRange;
                label = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);
              } else {
                const val = maxVal - pct * valRange;
                label = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);
              }
              return (
                <g key={pct}>
                  <line x1={PAD_L} y1={y} x2={PAD_L + plotW} y2={y} stroke="#1e293b" strokeWidth="1"/>
                  <text x={PAD_L - 3} y={y + 3} textAnchor="end" fontSize="6" fill="#475569">{label}</text>
                </g>
              );
            })}
            {validSeasons.map(s => (
              <text key={s} x={xPos(s)} y={CHART_H - 6} textAnchor="middle" fontSize="7" fill="#475569">
                {s.split(" ")[0].slice(0, 3)}
              </text>
            ))}
            {trackedPlayers.map((p, pi) => {
              const color = PLAYER_COLORS[pi];
              const pts = p.data.filter(d => d.value !== null && validSeasons.includes(d.season));
              if (!pts.length) return null;
              const d = pts.map((pt, j) => `${j === 0 ? "M" : "L"} ${xPos(pt.season)} ${yPos(pt.value)}`).join(" ");
              return (
                <g key={p.tag}>
                  <path d={d} fill="none" stroke={color} strokeWidth="2" opacity="0.9" strokeLinecap="round" strokeLinejoin="round"/>
                  {pts.map(pt => (
                    <g key={pt.season}>
                      <circle cx={xPos(pt.season)} cy={yPos(pt.value)} r="3.5" fill={color} opacity="0.9"/>
                      <text x={xPos(pt.season)} y={yPos(pt.value) - 6} textAnchor="middle" fontSize="6.5" fill={color}>
                        {isRankStat ? (pt.displayValue || "") : (typeof pt.value === "number" ? (pt.value % 1 === 0 ? pt.value.toFixed(0) : pt.value.toFixed(2)) : "")}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })}
          </svg>
          </div>
        </>
      )}
    </div>
  );
}
const CLAN_COLORS_CHART = ["#a78bfa", "#34d399", "#fb923c"];
const CLAN_STAT_OPTIONS = [
  { group: "CGN Rating", key: "overall",                label: "CGN Rating" },
  { group: "Rank",    key: "cwl_rank",               label: "CWL Rank" },
  { group: "Attack",  key: "total_stars",             label: "Total Stars" },
  { group: "Attack",  key: "attack_efficiency",       label: "Attack Efficiency" },
  { group: "Attack",  key: "avg_destruction_pct",     label: "Destruction %" },
  { group: "Attack",  key: "three_star_rate",         label: "Three Star Rate %" },
  { group: "Attack",  key: "total_attacks_used",      label: "Attacks Used" },
  { group: "Attack",  key: "total_attacks_missed",    label: "Missed Attacks" },
  { group: "Defence", key: "total_stars_conceded",    label: "Stars Conceded" },
  { group: "Defence", key: "defence_efficiency",      label: "Defence Efficiency" },
  { group: "Defence", key: "avg_defence_pct",         label: "Defence %" },
  { group: "Record",  key: "wars_won",                label: "Wars Won" },
  { group: "Record",  key: "wars_lost",               label: "Wars Lost" },
  { group: "Record",  key: "wars_drawn",              label: "Wars Drawn" },
];

const CWL_RANK_LIST = [
  "Champion I","Champion II","Champion III",
  "Master I","Master II","Master III",
  "Crystal I","Crystal II","Crystal III",
  "Gold I","Gold II","Gold III",
  "Silver I","Silver II","Silver III",
  "Bronze I","Bronze II","Bronze III","Unranked",
];

function ClanPerformanceChart({ history }) {
  const [clanSearch, setClanSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [trackedClans, setTrackedClans] = useState([]);
  const [selectedStat, setSelectedStat] = useState("overall");
  const isRankStat = selectedStat === "cwl_rank";

  // All unique clans from history — keyed by clan_tag to avoid bundling
  // clans that share a display name (e.g. old vs current Cognitive).
  const allClanTags = history ? [...new Set(history.map(r => r.clan_tag || r.clan_name))] : [];
  const clanNameByTag = {};
  if (history) for (const r of history) {
    const key = r.clan_tag || r.clan_name;
    if (!clanNameByTag[key]) clanNameByTag[key] = r.clan_name;
  }
  const allClans = allClanTags.map(tag => clanNameByTag[tag]).sort();

  // All seasons — API returns oldest-first (ASC from season_registry join)
  const allSeasons = history ? [...new Set(history.map(r => r.season))] : [];

  // Search
  useEffect(() => {
    if (!clanSearch.trim()) { setSearchResults([]); return; }
    const q = clanSearch.toLowerCase();
    setSearchResults(allClanTags.filter(tag =>
      clanNameByTag[tag].toLowerCase().includes(q) && !trackedClans.find(t => t.tag === tag)
    ).slice(0, 6));
  }, [clanSearch, allClanTags, trackedClans]);

  function buildClanData(clanTag, stat) {
    const statKey = stat || selectedStat;
    const isRank = statKey === "cwl_rank";
    return allSeasons.map(season => {
      const row = history?.find(r => (r.clan_tag || r.clan_name) === clanTag && r.season === season);
      if (!row) return { season, value: null, displayValue: null };
      if (isRank) {
        const rank = row.cwl_rank;
        if (!rank || rank === "Unknown") return { season, value: null, displayValue: null };
        const idx = CWL_RANK_LIST.indexOf(rank);
        return { season, value: idx === -1 ? null : idx, displayValue: rank || null };
      }
      if (statKey === "overall") {
        const atk = parseFloat(row.attack_efficiency||0);
        const def = parseFloat(row.defence_efficiency||0);
        const wins = row.wars_won||0;
        const v = (row.total_attacks_used > 0 && row.total_attacks_available > 0)
          ? parseFloat(((atk*0.5)+((3-def)*0.3)+(wins/7*3*0.2)).toFixed(2))
          : null;
        return { season, value: v, displayValue: v };
      }
      const v = parseFloat(row[statKey]);
      return { season, value: isNaN(v) ? null : v, displayValue: isNaN(v) ? null : v };
    });
  }

  function addClan(clanTag) {
    if (trackedClans.length >= 3) return;
    if (trackedClans.find(c => c.tag === clanTag)) return;
    setTrackedClans(prev => [...prev, { tag: clanTag, name: clanNameByTag[clanTag], data: buildClanData(clanTag, selectedStat) }]);
    setClanSearch(""); setSearchResults([]);
  }

  function removeClan(tag) {
    setTrackedClans(prev => prev.filter(c => c.tag !== tag));
  }

  // Recompute clan data inline on every render — avoids stale closure crash on stat change
  const trackedClansData = trackedClans.map(c => ({
    ...c,
    data: buildClanData(c.tag, selectedStat),
  }));

  useEffect(() => {
    if (!history || trackedClans.length === 0) return;
    setTrackedClans(prev => prev.map(c => ({ ...c })));
  }, [selectedStat, history]);

  // Auto-populate top 3 clans by attack_efficiency on first data load
  useEffect(() => {
    if (!history || history.length === 0 || trackedClans.length > 0) return;
    const seen = new Set();
    const top3 = [];
    const sorted = [...history].sort((a,b) => {
      const oa = (a.total_attacks_used>0&&a.total_attacks_available>0) ? (parseFloat(a.attack_efficiency||0)*0.5)+((3-parseFloat(a.defence_efficiency||0))*0.3)+((a.wars_won||0)/7*3*0.2) : 0;
      const ob = (b.total_attacks_used>0&&b.total_attacks_available>0) ? (parseFloat(b.attack_efficiency||0)*0.5)+((3-parseFloat(b.defence_efficiency||0))*0.3)+((b.wars_won||0)/7*3*0.2) : 0;
      return ob - oa;
    });
    for (const r of sorted) {
      const tag = r.clan_tag || r.clan_name;
      if (seen.has(tag)) continue;
      seen.add(tag);
      top3.push({ tag, name: r.clan_name });
      if (top3.length >= 3) break;
    }
    setTrackedClans(top3.map(({tag, name}) => ({ tag, name, data: buildClanData(tag, selectedStat) })));
  }, [history]);

  // Chart
  const CHART_W = 320, CHART_H = 180;
  const PAD_L = 52, PAD_R = 12, PAD_T = 12, PAD_B = 28;
  const plotW = CHART_W - PAD_L - PAD_R;
  const plotH = CHART_H - PAD_T - PAD_B;

  const validSeasons = allSeasons.filter(s =>
    trackedClansData.some(c => c.data.find(d => d.season === s && d.value !== null))
  );
  const xStep = validSeasons.length > 1 ? plotW / (validSeasons.length - 1) : plotW / 2;

  const allVals = trackedClansData.flatMap(c => c.data.map(d => d.value)).filter(v => v !== null);
  const isOverallStat = selectedStat === "overall";
  const minVal = isOverallStat ? 0 : (allVals.length ? Math.min(...allVals) : 0);
  const maxVal = isOverallStat ? 3 : (allVals.length ? Math.max(...allVals) : 1);
  const valRange = maxVal - minVal || 1;

  // Stats where lower = better — invert Y axis
  const CLAN_INVERTED_STATS = new Set(["defence_efficiency", "total_stars_conceded", "avg_defence_pct"]);
  const isInvertedStat = CLAN_INVERTED_STATS.has(selectedStat);

  function xPos(season) {
    const idx = validSeasons.indexOf(season);
    return PAD_L + (validSeasons.length > 1 ? idx * xStep : plotW / 2);
  }
  function yPos(val) {
    if (val === null || val === undefined) return PAD_T + plotH / 2;
    if (selectedStat === "cwl_rank") {
      const listLen = CWL_RANK_LIST.length - 1;
      return PAD_T + (val / (listLen || 1)) * plotH;
    }
    if (isInvertedStat) {
      // Invert: lower value = higher on chart (lower is better)
      return PAD_T + ((val - minVal) / valRange) * plotH;
    }
    return PAD_T + plotH - ((val - minVal) / valRange) * plotH;
  }

  // Group stat options for select
  const groups = ["CGN Rating", ...new Set(CLAN_STAT_OPTIONS.filter(o=>o.group!=="CGN Rating").map(o => o.group))];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
      <h2 className="text-sm font-semibold text-slate-300 mb-0.5">Clan Performance History</h2>
      <p className="text-slate-600 text-xs mb-4">Track up to 3 clans across seasons</p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select value={selectedStat} onChange={e => setSelectedStat(e.target.value)}
          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white focus:outline-none [color-scheme:dark]">
          {groups.map(g => (
            <optgroup key={g} label={g}>
              {CLAN_STAT_OPTIONS.filter(o => o.group === g).map(o => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </optgroup>
          ))}
        </select>

        {trackedClans.length < 3 && (
          <div className="relative flex-1 min-w-[140px]">
            <input type="text" placeholder="Add clan…" value={clanSearch}
              onChange={e => setClanSearch(e.target.value)}
              className="w-full rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
            {searchResults.length > 0 && (
              <div className="absolute left-0 top-full mt-1 z-50 w-full min-w-[200px] rounded-2xl border border-white/10 bg-[#0d1424]/95 backdrop-blur-xl shadow-xl overflow-hidden">
                {searchResults.map(tag => (
                  <button key={tag} type="button" onClick={() => addClan(tag)}
                    className="w-full px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white transition text-left">
                    {clanNameByTag[tag]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {trackedClans.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {trackedClans.map((c, i) => (
            <div key={c.tag} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CLAN_COLORS_CHART[i] }}/>
              <span className="text-xs text-slate-300 max-w-[100px] truncate">{c.name.split(" ")[0]}</span>
              <button onClick={() => removeClan(c.tag)} className="text-slate-600 hover:text-red-400 transition text-[10px] ml-0.5">✕</button>
            </div>
          ))}
        </div>
      )}

      {trackedClans.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-slate-700 text-xs text-center">
          Search for a clan above to begin tracking
        </div>
      ) : validSeasons.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-slate-700 text-xs">No data for selected metric</div>
      ) : (
        <>
          {isInvertedStat && (
            <p className="text-[9px] text-blue-400/60 uppercase tracking-widest mb-1 text-right">↓ lower is better · chart inverted</p>
          )}
          <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full min-w-[280px]">
            {[0, 0.25, 0.5, 0.75, 1].map(pct => {
              const y = PAD_T + pct * plotH;
              let label;
              if (selectedStat === "cwl_rank") {
                const idx = Math.round(pct * (CWL_RANK_LIST.length - 1));
                label = CWL_RANK_LIST[idx]?.replace(" I"," I").replace(" II"," II").replace(" III"," III") || "";
                label = label.replace("Champion","Champ").replace("Crystal","Cryst").replace("Silver","Silv").replace("Bronze","Brnz").replace("Master","Mastr");
              } else if (isInvertedStat) {
                const val = minVal + pct * valRange;
                label = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);
              } else {
                const val = maxVal - pct * valRange;
                label = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);
              }
              return (
                <g key={pct}>
                  <line x1={PAD_L} y1={y} x2={PAD_L + plotW} y2={y} stroke="#1e293b" strokeWidth="1"/>
                  <text x={PAD_L - 3} y={y + 3} textAnchor="end" fontSize="6" fill="#475569">{label}</text>
                </g>
              );
            })}
            {validSeasons.map(s => (
              <text key={s} x={xPos(s)} y={CHART_H - 6} textAnchor="middle" fontSize="7" fill="#475569">
                {s.split(" ")[0].slice(0, 3)}
              </text>
            ))}
            {trackedClansData.map((c, ci) => {
              const color = CLAN_COLORS_CHART[ci];
              const pts = c.data.filter(d => d.value !== null && validSeasons.includes(d.season));
              if (!pts.length) return null;
              const pathD = pts.map((pt, j) => `${j === 0 ? "M" : "L"} ${xPos(pt.season)} ${yPos(pt.value)}`).join(" ");
              return (
                <g key={c.tag}>
                  <path d={pathD} fill="none" stroke={color} strokeWidth="2" opacity="0.9" strokeLinecap="round" strokeLinejoin="round"/>
                  {pts.map(pt => (
                    <g key={pt.season}>
                      <circle cx={xPos(pt.season)} cy={yPos(pt.value)} r="3.5" fill={color} opacity="0.9"/>
                      <text x={xPos(pt.season)} y={yPos(pt.value) - 6} textAnchor="middle" fontSize="6.5" fill={color}>
                        {selectedStat === "cwl_rank" ? (pt.displayValue?.split(" ")[0]?.slice(0,5) || "") : (typeof pt.value === "number" ? (pt.value % 1 === 0 ? pt.value.toFixed(0) : pt.value.toFixed(2)) : "")}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })}
          </svg>
          </div>
        </>
      )}
    </div>
  );
}

function MatchupsPanel({ matchupData }) {
  const sorted = [...(matchupData||[])].sort((a, b) => parseFloat(b.three_star_rate) - parseFloat(a.three_star_rate));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
      <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">3★ Rate by TH Matchup</p>
      <p className="text-[9px] text-slate-700 mb-4">Attacker TH → Defender TH · min 3 attacks</p>
      {!matchupData?.length ? (
        <p className="text-slate-700 text-xs text-center py-6">No data available</p>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            <div className="flex-1 rounded-2xl border border-green-500/20 bg-green-500/[0.06] px-3 py-2">
              <p className="text-[9px] text-green-500/70 uppercase tracking-widest mb-1">Strength</p>
              <p className="text-xs text-green-300 font-semibold">TH{best?.attacker_th} → TH{best?.defender_th}</p>
              <p className="text-[10px] text-green-400">{parseFloat(best?.three_star_rate||0).toFixed(0)}% 3★ rate</p>
            </div>
            <div className="flex-1 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-3 py-2">
              <p className="text-[9px] text-red-500/70 uppercase tracking-widest mb-1">Weakness</p>
              <p className="text-xs text-red-300 font-semibold">TH{worst?.attacker_th} → TH{worst?.defender_th}</p>
              <p className="text-[10px] text-red-400">{parseFloat(worst?.three_star_rate||0).toFixed(0)}% 3★ rate</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {matchupData.map((m, i) => {
              const rate = parseFloat(m.three_star_rate || 0);
              const colour = rate >= 80 ? "text-green-400" : rate >= 50 ? "text-amber-400" : "text-red-400";
              const barColour = rate >= 80 ? "bg-green-500/60" : rate >= 50 ? "bg-amber-500/60" : "bg-red-500/60";
              return (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                  <span className="text-[10px] text-slate-400 w-20 shrink-0">TH{m.attacker_th} → TH{m.defender_th}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className={`h-full rounded-full ${barColour}`} style={{width:`${rate}%`}}/>
                  </div>
                  <span className={`text-[10px] font-semibold w-10 text-right shrink-0 ${colour}`}>{rate.toFixed(0)}%</span>
                  <span className="text-[9px] text-slate-700 w-10 shrink-0">{m.total} atks</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function WarMomentumChart({ dayAggregates }) {
  let cumulative = 0;
  const cumulativeData = dayAggregates.map(d => {
    cumulative += parseFloat(d.avg_stars || 0);
    return { day: d.war_day, value: parseFloat(cumulative.toFixed(2)) };
  });
  const maxCumulative = cumulativeData[cumulativeData.length - 1]?.value || 1;
  const W = 280, H = 90, PAD_L = 28, PAD_R = 20, PAD_T = 16, PAD_B = 20;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const xStep = cumulativeData.length > 1 ? plotW / (cumulativeData.length - 1) : plotW;
  const xPos = i => PAD_L + i * xStep;
  const yPos = v => PAD_T + plotH - (v / maxCumulative) * plotH;
  const path = cumulativeData.map((d, i) => `${i === 0 ? "M" : "L"} ${xPos(i)} ${yPos(d.value)}`).join(" ");
  const perfectLine = cumulativeData.map((d, i) => `${i === 0 ? "M" : "L"} ${xPos(i)} ${yPos((i + 1) * (maxCumulative / cumulativeData.length))}`).join(" ");
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[9px] text-slate-600 uppercase tracking-widest">War Momentum</p>
        <p className="text-[9px] text-slate-700">Cumulative avg ★ across days</p>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[220px]">
          {[0, 0.5, 1].map(pct => (
            <line key={pct} x1={PAD_L} y1={PAD_T + pct * plotH} x2={W - PAD_R} y2={PAD_T + pct * plotH} stroke="#1e293b" strokeWidth="1"/>
          ))}
          <path d={perfectLine} fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3,3"/>
          <path d={path} fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          {cumulativeData.map((d, i) => (
            <g key={i}>
              <circle cx={xPos(i)} cy={yPos(d.value)} r="3" fill="#a78bfa"/>
              <text x={xPos(i)} y={H - 4} textAnchor="middle" fontSize="7" fill="#475569">D{d.day}</text>
              <text x={xPos(i)} y={yPos(d.value) - 5} textAnchor="middle" fontSize="6.5" fill="#a78bfa">{d.value.toFixed(1)}</text>
            </g>
          ))}
          <text x={PAD_L - 3} y={PAD_T + 3} textAnchor="end" fontSize="6" fill="#475569">{maxCumulative.toFixed(0)}</text>
          <text x={PAD_L - 3} y={PAD_T + plotH / 2 + 3} textAnchor="end" fontSize="6" fill="#475569">{(maxCumulative / 2).toFixed(0)}</text>
          <text x={PAD_L - 3} y={PAD_T + plotH + 3} textAnchor="end" fontSize="6" fill="#475569">0</text>
        </svg>
      </div>
      <p className="text-[8px] text-slate-700 mt-1">Dashed line = even pace reference</p>
    </div>
  );
}

// ── War Intelligence View ────────────────────────────────────────────────────
function WarIntelView({ onBack }) {
  const [tab, setTab] = useState("days");
  const [loading, setLoading] = useState(true);
  const [dayData, setDayData] = useState(null);
  const [matchupData, setMatchupData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [clanData, setClanData] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("all");
  const [registeredClanTags, setRegisteredClanTags] = useState(null);

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

  return (
    <main className="min-h-screen overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      </div>

      <AppHeader variant="bar"/>

      {/* Hero card */}
      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 mb-4 text-center">
        <h1 className="text-2xl font-thin tracking-widest mb-1">War Intel</h1>
        <p className="text-slate-500 text-xs mb-4">Alliance war performance analytics</p>
        <div className="flex items-center justify-center gap-4 mb-3">
          <button onClick={onBack} className="text-slate-500 hover:text-slate-300 transition p-1">
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
          {[1,2,3].map(i => <div key={i} className="rounded-3xl border border-white/10 bg-white/[0.04] h-24 animate-pulse"/>)}
        </div>
      ) : (
        <div className="relative z-10 space-y-4">

          {/* ── DAYS TAB ── */}
          {tab === "days" && (
            <>
              {/* War momentum cumulative chart — above bar chart */}
              {dayAggregates.length >= 2 && <WarMomentumChart dayAggregates={dayAggregates} />}

              {/* Avg stars bar chart */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
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
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
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
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
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

function HistoryView({ onBack }) {
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
    <main className="min-h-screen overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      </div>

      <AppHeader variant="bar"/>

      {/* Hero card */}
      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 mb-4 text-center">
        <h1 className="text-2xl font-thin tracking-widest mb-1">History</h1>
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
            {tab === "player" ? "Player Performance" : "Clan CWL Rank"}
          </span>
          <button onClick={() => setTab("rank")} className="text-slate-500 hover:text-slate-300 transition p-1" title="Clan CWL Rank">
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
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 animate-pulse">
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



function PlayerSparkline({ sparkData }) {
  const minV = Math.min(...sparkData.map(d => d.value));
  const maxV = Math.max(...sparkData.map(d => d.value));
  const range = maxV - minV || 0.1;
  const W = 200, H = 32, PAD = 4;
  const xStep = (W - PAD * 2) / (sparkData.length - 1);
  const xPos = i => PAD + i * xStep;
  const yPos = v => H - PAD - ((v - minV) / range) * (H - PAD * 2);
  const path = sparkData.map((d, i) => `${i === 0 ? "M" : "L"} ${xPos(i)} ${yPos(d.value)}`).join(" ");
  const trend = sparkData[sparkData.length - 1].value - sparkData[0].value;
  const trendColour = trend > 0.05 ? "text-green-400" : trend < -0.05 ? "text-red-400" : "text-slate-500";
  const trendLabel = trend > 0.05 ? "↑ Improving" : trend < -0.05 ? "↓ Declining" : "→ Stable";
  return (
    <div className="mt-3 pt-3 border-t border-white/[0.06]">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[9px] text-slate-600 uppercase tracking-widest">Rating Trend</p>
        <span className={`text-[9px] font-semibold ${trendColour}`}>{trendLabel}</span>
      </div>
      <div className="flex items-center gap-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="flex-1 h-8">
          <path d={path} fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          {sparkData.map((d, i) => (
            <circle key={i} cx={xPos(i)} cy={yPos(d.value)} r="2" fill="#a78bfa"/>
          ))}
        </svg>
        <div className="shrink-0 text-right">
          <p className="text-xs font-bold text-purple-300">{sparkData[sparkData.length-1].value.toFixed(2)}</p>
          <p className="text-[9px] text-slate-600">latest</p>
        </div>
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[8px] text-slate-700">{sparkData[0].season.split(" ")[0]}</span>
        <span className="text-[8px] text-slate-700">{sparkData[sparkData.length-1].season.split(" ").slice(0,2).join(" ")}</span>
      </div>
    </div>
  );
}

// ─── Tile definitions for dynamic leaderboard row stats ─────────────────────
// Each tile knows how to render itself from a player row `p`.
const TILE_DEFS = {
  overall: {
    key: "overall", label: "CGN Rating", colour: "text-purple-300", bg: "bg-purple-500/[0.08]", border: "border-purple-500/20", stroke: "#a78bfa",
    icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
    value: p => p.overall != null ? parseFloat(p.overall).toFixed(2) : (p.attacks_used > 0 && p.attacks_available > 0 ? ((parseFloat(p.efficiency||0)*0.6)+((3-parseFloat(p.defence_efficiency||0))*0.4)).toFixed(2) : "—"),
  },
  efficiency: {
    key: "efficiency", label: "Atk EFF", colour: "text-purple-300", bg: "bg-purple-500/[0.08]", border: "border-purple-500/20", stroke: "#a78bfa",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    value: p => p.efficiency != null ? parseFloat(p.efficiency).toFixed(2) : "—",
  },
  stars_earned: {
    key: "stars_earned", label: "Stars", colour: "text-green-300", bg: "bg-green-500/[0.08]", border: "border-green-500/20", stroke: "#86efac",
    icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    value: p => p.stars_earned ?? "—",
  },
  destruction_pct: {
    key: "destruction_pct", label: "Dest %", colour: "text-slate-300", bg: "bg-white/[0.04]", border: "border-white/10", stroke: "#94a3b8",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    value: p => p.destruction_pct != null ? parseFloat(p.destruction_pct).toFixed(1)+"%" : "—",
  },
  attacks_used: {
    key: "attacks_used", label: "Attacks", colour: "text-slate-300", bg: "bg-white/[0.04]", border: "border-white/10", stroke: "#94a3b8",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    value: p => `${p.attacks_used ?? "—"}/${p.attacks_available ?? "—"}`,
  },
  missed_attacks: {
    key: "missed_attacks", label: "Missed", colour: p => p.missed_attacks > 0 ? "text-red-400" : "text-slate-500", bg: p => p.missed_attacks > 0 ? "bg-red-500/[0.08]" : "bg-white/[0.04]", border: p => p.missed_attacks > 0 ? "border-red-500/20" : "border-white/10", stroke: p => p.missed_attacks > 0 ? "#f87171" : "#94a3b8",
    icon: "M6 18L18 6M6 6l12 12",
    value: p => p.missed_attacks ?? "—",
  },
  defence_efficiency: {
    key: "defence_efficiency", label: "Def EFF", colour: "text-blue-300", bg: "bg-blue-500/[0.08]", border: "border-blue-500/20", stroke: "#60a5fa",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    value: p => p.defence_efficiency != null ? parseFloat(p.defence_efficiency).toFixed(2) : "—",
  },
  stars_conceded: {
    key: "stars_conceded", label: "Stars Given", colour: "text-slate-400", bg: "bg-white/[0.04]", border: "border-white/10", stroke: "#94a3b8",
    icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    value: p => p.stars_conceded ?? "—",
  },
  defence_pct: {
    key: "defence_pct", label: "Def %", colour: "text-slate-300", bg: "bg-white/[0.04]", border: "border-white/10", stroke: "#94a3b8",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    value: p => p.defence_pct != null ? parseFloat(p.defence_pct).toFixed(1)+"%" : "—",
  },
  attacks_available: {
    key: "attacks_available", label: "Available", colour: "text-slate-300", bg: "bg-white/[0.04]", border: "border-white/10", stroke: "#94a3b8",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    value: p => p.attacks_available ?? "—",
  },
  avg_stars_per_attack: {
    key: "avg_stars_per_attack", label: "Avg ★/Atk", colour: "text-amber-300", bg: "bg-amber-500/[0.08]", border: "border-amber-500/20", stroke: "#fbbf24",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    value: p => p.avg_stars_per_attack != null ? parseFloat(p.avg_stars_per_attack).toFixed(2) : "—",
  },
  three_star_rate: {
    key: "three_star_rate", label: "3★ Rate", colour: "text-green-300", bg: "bg-green-500/[0.08]", border: "border-green-500/20", stroke: "#86efac",
    icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    value: p => p.three_star_rate != null ? parseFloat(p.three_star_rate).toFixed(0)+"%" : "—",
  },
  punch_up_rate: {
    key: "punch_up_rate", label: "Punch-Up", colour: "text-blue-300", bg: "bg-blue-500/[0.08]", border: "border-blue-500/20", stroke: "#60a5fa",
    icon: "M5 10l7-7m0 0l7 7m-7-7v18",
    value: p => p.punch_up_rate != null ? parseFloat(p.punch_up_rate).toFixed(0)+"%" : "—",
  },
  clutch_rate: {
    key: "clutch_rate", label: "Clutch", colour: "text-purple-300", bg: "bg-purple-500/[0.08]", border: "border-purple-500/20", stroke: "#a78bfa",
    icon: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z",
    value: p => p.clutch_rate != null ? parseFloat(p.clutch_rate).toFixed(2) : "—",
  },
  consistency_score: {
    key: "consistency_score", label: "Consistency", colour: "text-slate-300", bg: "bg-white/[0.04]", border: "border-white/10", stroke: "#94a3b8",
    icon: "M4 6h16M4 10h16M4 14h16M4 18h16",
    value: p => p.consistency_score != null ? parseFloat(p.consistency_score).toFixed(2) : "—",
  },
};

// Maps each sort option to the 4 tile keys shown on the leaderboard row.
// Tile 1 is always the sorted stat; tiles 2-4 provide explanatory context.
const SORT_TILE_MAP = {
  overall:               ["overall", "efficiency", "defence_efficiency", "stars_earned"],
  efficiency:            ["efficiency", "stars_earned", "three_star_rate", "attacks_used"],
  stars_earned:          ["stars_earned", "efficiency", "defence_efficiency", "stars_conceded"],
  destruction_pct:       ["destruction_pct", "efficiency", "three_star_rate", "stars_earned"],
  attacks_used:          ["attacks_used", "missed_attacks", "efficiency", "stars_earned"],
  missed_attacks:        ["missed_attacks", "attacks_used", "efficiency", "stars_earned"],
  defence_efficiency:    ["defence_efficiency", "stars_conceded", "defence_pct", "efficiency"],
  stars_conceded:        ["stars_conceded", "defence_efficiency", "attacks_available", "efficiency"],
  defence_pct:           ["defence_pct", "defence_efficiency", "stars_conceded", "efficiency"],
  avg_stars_per_attack:  ["avg_stars_per_attack", "three_star_rate", "punch_up_rate", "efficiency"],
  three_star_rate:       ["three_star_rate", "avg_stars_per_attack", "stars_earned", "efficiency"],
  punch_up_rate:         ["punch_up_rate", "three_star_rate", "avg_stars_per_attack", "efficiency"],
  clutch_rate:           ["clutch_rate", "avg_stars_per_attack", "three_star_rate", "stars_earned"],
  consistency_score:     ["consistency_score", "avg_stars_per_attack", "efficiency", "three_star_rate"],
};

function getRowTiles(sortBy) {
  const keys = SORT_TILE_MAP[sortBy] || SORT_TILE_MAP.stars_earned;
  return keys.map(k => TILE_DEFS[k]);
}

function PlayerCard({ p, rank, isExpanded, onToggle, allSeasonData, seasons, sortBy }) {
  const [cardView, setCardView] = useState("stats"); // "stats" | "breakdown"

  const rankBorderClass = rank === 1 ? "border-yellow-400/40 shadow-yellow-400/10"
    : rank === 2 ? "border-slate-300/30 shadow-slate-300/10"
    : rank === 3 ? "border-amber-600/40 shadow-amber-600/10"
    : "border-white/10";

  // Build sparkline data oldest-first (seasons from API is newest-first)
  const sparkData = ([...(seasons || [])].reverse()).map(season => {
    const row = (allSeasonData || []).find(r => r.player_tag === p.player_tag && r.season === season);
    if (!row || !row.attacks_used || !row.attacks_available) return { season, value: null };
    const overall = parseFloat(((parseFloat(row.efficiency||0)*0.6)+((3-parseFloat(row.defence_efficiency||0))*0.4)).toFixed(2));
    return { season, value: overall };
  }).filter(d => d.value !== null);

  // When collapsed, reset to stats view
  const handleToggle = () => {
    if (isExpanded) setCardView("stats");
    onToggle();
  };

  return (
    <div className={`rounded-2xl border bg-white/[0.03] transition-all ${rankBorderClass} ${isExpanded ? "shadow-lg" : ""}`}>

      {/* Header row — only this triggers expand/collapse */}
      <div onClick={handleToggle} className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-white/[0.03] rounded-2xl transition">
        <div className="shrink-0 w-6 flex items-center justify-center">
          <RankBadge rank={rank} />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {p.town_hall_level && TH_ICONS[String(p.town_hall_level)] && (
            <img src={TH_ICONS[String(p.town_hall_level)]} alt={`TH${p.town_hall_level}`} className="hidden sm:block w-7 h-7 shrink-0"/>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-sm text-white truncate">{p.player_name}</p>
            </div>
            <p className="text-[10px] text-slate-500 truncate">{p.clan_name.split(" ")[0]}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {getRowTiles(sortBy).map(tile => {
            const colour = typeof tile.colour === "function" ? tile.colour(p) : tile.colour;
            const bg = typeof tile.bg === "function" ? tile.bg(p) : tile.bg;
            const border = typeof tile.border === "function" ? tile.border(p) : tile.border;
            const stroke = typeof tile.stroke === "function" ? tile.stroke(p) : tile.stroke;
            return (
              <div key={tile.key} className={`flex flex-col items-center gap-0.5 rounded-lg ${bg} border ${border} px-1.5 sm:px-2 py-1 min-w-[34px] sm:min-w-[40px]`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={tile.icon}/>
                </svg>
                <span className={`text-[11px] sm:text-xs font-bold ${colour}`}>{tile.value(p)}</span>
              </div>
            );
          })}
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-600 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </div>

      {/* Expanded body — click-safe, not a toggle target */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-white/10">

          {/* ── STATS VIEW ── */}
          {cardView === "stats" && (
            <div className="space-y-4 pt-2">
              {/* Attack — top row */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Attack</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="rounded-xl bg-purple-500/[0.06] border border-purple-500/20 p-2"><div className="flex items-center gap-1 mb-1"><svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg><p className="text-[8px] text-slate-500 uppercase tracking-widest">Efficiency</p></div><p className="text-sm font-bold text-purple-300">{parseFloat(p.efficiency).toFixed(2)}</p></div>
                  <div className="rounded-xl bg-green-500/[0.06] border border-green-500/20 p-2"><div className="flex items-center gap-1 mb-1"><svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#86efac" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg><p className="text-[8px] text-slate-500 uppercase tracking-widest">Stars</p></div><p className="text-sm font-bold text-green-300">{p.stars_earned}</p></div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/10 p-2"><div className="flex items-center gap-1 mb-1"><svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg><p className="text-[8px] text-slate-500 uppercase tracking-widest">Dest %</p></div><p className="text-sm font-bold text-slate-300">{parseFloat(p.destruction_pct).toFixed(1)}%</p></div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/10 p-2 flex flex-col items-center justify-center gap-0.5"><MiniPie three={p.three_stars||0} two={p.two_stars||0} one={p.one_stars||0} zero={p.zero_stars||0}/><p className="text-[8px] text-slate-500 uppercase tracking-widest">Breakdown</p></div>
                </div>
              </div>
              {/* Defence — top row */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Defence</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="rounded-xl bg-blue-500/[0.06] border border-blue-500/20 p-2"><div className="flex items-center gap-1 mb-1"><svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#60a5fa" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg><p className="text-[8px] text-slate-500 uppercase tracking-widest">Def EFF</p></div><p className="text-sm font-bold text-blue-300">{p.defence_efficiency ? parseFloat(p.defence_efficiency).toFixed(2) : "—"}</p></div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/10 p-2"><div className="flex items-center gap-1 mb-1"><svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg><p className="text-[8px] text-slate-500 uppercase tracking-widest">Stars Given</p></div><p className="text-sm font-bold text-slate-400">{p.stars_conceded}</p></div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/10 p-2"><div className="flex items-center gap-1 mb-1"><svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg><p className="text-[8px] text-slate-500 uppercase tracking-widest">Dest Given</p></div><p className="text-sm font-bold text-slate-400">{parseFloat(p.defence_pct||0).toFixed(1)}%</p></div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/10 p-2 flex flex-col items-center justify-center gap-0.5"><MiniPie three={p.three_stars_conceded||0} two={p.two_stars_conceded||0} one={p.one_stars_conceded||0} zero={p.zero_stars_conceded||0}/><p className="text-[8px] text-slate-500 uppercase tracking-widest">Breakdown</p></div>
                </div>
              </div>
              {/* Sparkline */}
              {sparkData.length >= 2 && <PlayerSparkline sparkData={sparkData} />}
            </div>
          )}

          {/* ── BREAKDOWN VIEW ── */}
          {cardView === "breakdown" && (
            <div className="space-y-4 pt-2">
              {/* Participation */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Participation</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white/[0.03] border border-white/10 p-2"><div className="flex items-center gap-1 mb-1"><svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg><p className="text-[8px] text-slate-500 uppercase tracking-widest">Attacks</p></div><p className="text-sm font-bold text-slate-300">{p.attacks_used}<span className="text-slate-600 text-xs">/{p.attacks_available}</span></p></div>
                  <div className={`rounded-xl p-2 ${p.missed_attacks > 0 ? "bg-red-500/[0.06] border border-red-500/20" : "bg-white/[0.03] border border-white/10"}`}><div className="flex items-center gap-1 mb-1"><svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke={p.missed_attacks > 0 ? "#f87171" : "#94a3b8"} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg><p className="text-[8px] text-slate-500 uppercase tracking-widest">Missed</p></div><p className={`text-sm font-bold ${p.missed_attacks > 0 ? "text-red-400" : "text-slate-500"}`}>{p.missed_attacks}</p></div>
                </div>
              </div>
              {/* War Metrics */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">War Metrics</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-amber-500/[0.06] border border-amber-500/20 p-2"><div className="flex items-center gap-1 mb-1"><svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#fbbf24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg><p className="text-[8px] text-slate-500 uppercase tracking-widest">Avg ★/Atk</p></div><p className="text-sm font-bold text-amber-300">{p.avg_stars_per_attack != null ? parseFloat(p.avg_stars_per_attack).toFixed(2) : "—"}</p></div>
                  <div className="rounded-xl bg-green-500/[0.06] border border-green-500/20 p-2"><div className="flex items-center gap-1 mb-1"><svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#86efac" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg><p className="text-[8px] text-slate-500 uppercase tracking-widest">3★ Rate</p></div><p className="text-sm font-bold text-green-300">{p.three_star_rate != null ? `${parseFloat(p.three_star_rate).toFixed(0)}%` : "—"}</p></div>
                  <div className="rounded-xl bg-purple-500/[0.06] border border-purple-500/20 p-2"><div className="flex items-center gap-1 mb-1"><svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/></svg><p className="text-[8px] text-slate-500 uppercase tracking-widest">Clutch</p></div><p className="text-sm font-bold text-purple-300">{p.clutch_rate != null ? parseFloat(p.clutch_rate).toFixed(2) : "—"}</p></div>
                  <div className="rounded-xl bg-blue-500/[0.06] border border-blue-500/20 p-2"><div className="flex items-center gap-1 mb-1"><svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#60a5fa" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg><p className="text-[8px] text-slate-500 uppercase tracking-widest">Punch-Up</p></div><p className="text-sm font-bold text-blue-300">{p.punch_up_rate != null ? `${parseFloat(p.punch_up_rate).toFixed(0)}%` : "—"}</p></div>
                </div>
              </div>
              {/* Behavioural */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Behavioural</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-white/[0.03] border border-white/10 p-2"><div className="flex items-center gap-1 mb-1"><svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg><p className="text-[8px] text-slate-500 uppercase tracking-widest">Consistency</p></div><p className="text-sm font-bold text-slate-300">{p.consistency_score != null ? parseFloat(p.consistency_score).toFixed(2) : "—"}</p></div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/10 p-2"><div className="flex items-center gap-1 mb-1"><svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#86efac" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg><p className="text-[8px] text-slate-500 uppercase tracking-widest">↑ Reaches</p></div><p className="text-sm font-bold text-green-400">{p.reaches ?? "—"}</p></div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/10 p-2"><div className="flex items-center gap-1 mb-1"><svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg><p className="text-[8px] text-slate-500 uppercase tracking-widest">↓ Dips</p></div><p className="text-sm font-bold text-slate-400">{p.dips ?? "—"}</p></div>
                </div>
              </div>
              {/* Visual Breakdown */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Attack Breakdown</span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <LargePie three={p.three_stars||0} two={p.two_stars||0} one={p.one_stars||0} zero={p.zero_stars||0} size={80}/>
                  <StarBars three={p.three_stars||0} two={p.two_stars||0} one={p.one_stars||0} zero={p.zero_stars||0}/>
                </div>
                <div className="flex items-center gap-1.5 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Defence Breakdown</span>
                </div>
                <div className="flex items-center gap-4">
                  <LargePie three={p.three_stars_conceded||0} two={p.two_stars_conceded||0} one={p.one_stars_conceded||0} zero={p.zero_stars_conceded||0} size={80}/>
                  <StarBars three={p.three_stars_conceded||0} two={p.two_stars_conceded||0} one={p.one_stars_conceded||0} zero={p.zero_stars_conceded||0}/>
                </div>
              </div>
            </div>
          )}

          {/* View toggle — minimal bare chevrons + profile link flush right */}
          <div className="flex items-center pt-3 mt-2 border-t border-white/[0.06]">
            <div className="flex-1 flex items-center justify-center gap-4">
              <button onClick={e => { e.stopPropagation(); setCardView("stats"); }}
                className="text-slate-500 hover:text-slate-300 transition p-1" title="Stats view">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <span className="text-[10px] text-slate-600 uppercase tracking-widest select-none">
                {cardView === "stats" ? "Stats" : "Breakdown"}
              </span>
              <button onClick={e => { e.stopPropagation(); setCardView("breakdown"); }}
                className="text-slate-500 hover:text-slate-300 transition p-1" title="Breakdown view">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
            <a href={`/player/${p.player_tag.replace("#","")}`} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full border border-purple-500/40 bg-transparent text-purple-400 hover:border-purple-400 hover:bg-purple-500/10 hover:shadow-[0_0_8px_rgba(168,85,247,0.2)] transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}



// ── Clan Leaderboard ──────────────────────────────────────────────────────────
function ClanCard({ c, rank, isExpanded, onToggle }) {
  const [cardView, setCardView] = useState("stats");

  const rankBorderClass = rank === 1 ? "border-yellow-400/40"
    : rank === 2 ? "border-slate-300/30"
    : rank === 3 ? "border-amber-600/40"
    : "border-white/10";

  const handleToggle = () => { if (isExpanded) setCardView("stats"); onToggle(); };

  const rankPill = c.cwl_rank ? (
    <span className="text-[9px] px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-slate-500 shrink-0">{c.cwl_rank}</span>
  ) : null;

  return (
    <div className={`rounded-2xl border bg-white/[0.03] transition-all ${rankBorderClass}`}>
      {/* Header row */}
      <div onClick={handleToggle} className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-white/[0.03] rounded-2xl transition">
        <div className="shrink-0 w-6 flex items-center justify-center">
          <RankBadge rank={rank}/>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-white truncate">{c.clan_name?.split(" ")[0] || c.clan_name}</p>
          {rankPill}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StatPill label="Atk EFF" value={c.attack_efficiency ? parseFloat(c.attack_efficiency).toFixed(2) : "—"} colour="text-purple-300"/>
          <StatPill label="Won" value={c.wars_won ?? "—"} colour="text-green-300"/>
          <StatPill label="Def EFF" value={c.defence_efficiency ? parseFloat(c.defence_efficiency).toFixed(2) : "—"} colour="text-blue-300"/>
          <StatPill label="Stars" value={c.total_stars ?? "—"} colour="text-slate-300"/>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-600 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-white/10">
          {cardView === "stats" && (
            <div className="space-y-4 pt-2">
              {/* Attack */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Attack</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-white/[0.04] p-2 text-center"><p className="text-sm font-bold text-purple-300">{c.attack_efficiency ? parseFloat(c.attack_efficiency).toFixed(2) : "—"}</p><p className="text-[9px] text-slate-600 mt-0.5">Efficiency</p></div>
                  <div className="rounded-xl bg-white/[0.04] p-2 text-center"><p className="text-sm font-bold text-green-300">{c.total_stars ?? "—"}</p><p className="text-[9px] text-slate-600 mt-0.5">Stars</p></div>
                  <div className="rounded-xl bg-white/[0.04] p-2 text-center"><p className="text-sm font-bold text-slate-300">{c.avg_destruction_pct ? parseFloat(c.avg_destruction_pct).toFixed(1)+"%" : "—"}</p><p className="text-[9px] text-slate-600 mt-0.5">Dest %</p></div>
                  <div className="rounded-xl bg-white/[0.04] p-2 text-center"><p className="text-sm font-bold text-amber-400">{c.three_star_rate ? parseFloat(c.three_star_rate).toFixed(1)+"%" : "—"}</p><p className="text-[9px] text-slate-600 mt-0.5">3★ Rate</p></div>
                  <div className="rounded-xl bg-white/[0.04] p-2 text-center"><p className="text-sm font-bold text-slate-300">{c.total_attacks_used ?? "—"}</p><p className="text-[9px] text-slate-600 mt-0.5">Attacks</p></div>
                  <div className="rounded-xl bg-white/[0.04] p-2 text-center"><p className={`text-sm font-bold ${(c.total_attacks_missed || 0) > 0 ? "text-red-400" : "text-slate-500"}`}>{c.total_attacks_missed ?? "—"}</p><p className="text-[9px] text-slate-600 mt-0.5">Missed</p></div>
                </div>
              </div>
              {/* Defence */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Defence</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-white/[0.04] p-2 text-center"><p className="text-sm font-bold text-blue-300">{c.defence_efficiency ? parseFloat(c.defence_efficiency).toFixed(2) : "—"}</p><p className="text-[9px] text-slate-600 mt-0.5">Def EFF</p></div>
                  <div className="rounded-xl bg-white/[0.04] p-2 text-center"><p className="text-sm font-bold text-slate-400">{c.total_stars_conceded ?? "—"}</p><p className="text-[9px] text-slate-600 mt-0.5">Stars Given</p></div>
                  <div className="rounded-xl bg-white/[0.04] p-2 text-center"><p className="text-sm font-bold text-slate-400">{c.avg_defence_pct ? parseFloat(c.avg_defence_pct).toFixed(1)+"%" : "—"}</p><p className="text-[9px] text-slate-600 mt-0.5">Dest Given</p></div>
                </div>
              </div>
              {/* Record */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Record</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-white/[0.04] p-2 text-center"><p className="text-sm font-bold text-green-300">{c.wars_won ?? "—"}</p><p className="text-[9px] text-slate-600 mt-0.5">Won</p></div>
                  <div className="rounded-xl bg-white/[0.04] p-2 text-center"><p className="text-sm font-bold text-red-400">{c.wars_lost ?? "—"}</p><p className="text-[9px] text-slate-600 mt-0.5">Lost</p></div>
                  <div className="rounded-xl bg-white/[0.04] p-2 text-center"><p className="text-sm font-bold text-slate-500">{c.wars_drawn ?? "—"}</p><p className="text-[9px] text-slate-600 mt-0.5">Drawn</p></div>
                </div>
              </div>
            </div>
          )}

          {cardView === "breakdown" && (
            <div className="space-y-5 pt-2">
              {/* Attack breakdown */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Attack Breakdown</span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="shrink-0"><LargePie three={c.three_stars_clan||0} two={c.two_stars_clan||0} one={c.one_stars_clan||0} zero={c.zero_stars_clan||0} size={80}/></div>
                  <div className="flex-1 flex flex-col justify-center gap-2">
                    {[["#86efac","3★",c.three_stars_clan],["#a78bfa","2★",c.two_stars_clan],["#fbbf24","1★",c.one_stars_clan],["#475569","0★",c.zero_stars_clan]].map(([col,lbl,val])=>(
                      <div key={lbl} className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[10px]"><span className="w-2 h-2 rounded-full inline-block" style={{background:col}}/>{lbl}</span>
                        <span className="text-sm font-bold" style={{color:col}}>{val ?? "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="border-t border-white/10"/>
              {/* Defence breakdown — using stars conceded distribution if available */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Defence Summary</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white/[0.04] p-3 text-center">
                    <p className="text-lg font-bold text-blue-300">{c.defence_efficiency ? parseFloat(c.defence_efficiency).toFixed(2) : "—"}</p>
                    <p className="text-[9px] text-slate-600 mt-0.5">Defence EFF</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-3 text-center">
                    <p className="text-lg font-bold text-slate-400">{c.total_stars_conceded ?? "—"}</p>
                    <p className="text-[9px] text-slate-600 mt-0.5">Stars Conceded</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Toggle arrows */}
          <div className="flex items-center justify-center gap-4 pt-3 mt-2 border-t border-white/[0.06]">
            <button onClick={e=>{e.stopPropagation();setCardView("stats")}} className="text-slate-500 hover:text-slate-300 transition p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <span className="text-[10px] text-slate-600 uppercase tracking-widest select-none">{cardView === "stats" ? "Stats" : "Breakdown"}</span>
            <button onClick={e=>{e.stopPropagation();setCardView("breakdown")}} className="text-slate-500 hover:text-slate-300 transition p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function FaqButton() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const faqs = [
    { section: "Sign Up & Accounts", items: [
      { q: "How do I sign up?", a: "Enter your player tag and API token from in-game: Settings → More Settings → API Token. The token verifies you own the account." },
      { q: "Can I add multiple accounts?", a: "Yes — add as many CoC accounts as you own. Each one is linked to your profile." },
      { q: "How do I remove an account?", a: "Go to My Accounts, tap Manage, then remove. Your CWL stats history is always preserved." },
    ]},
    { section: "Discord", items: [
      { q: "Why link Discord?", a: "Keeps your accounts accessible across devices and browsers without needing your API token again." },
      { q: "How do I disconnect Discord?", a: "Tap your Discord name pill at the top of the page and select Disconnect." },
    ]},
    { section: "Leaderboard", items: [
      { q: "What is CGN Rating?", a: "A weighted performance score combining 60% attack efficiency and 40% defence efficiency. It rewards players who attack well and defend well." },
      { q: "What is Attack Efficiency?", a: "Average stars earned per attack. Maximum is 3.00 — every attack was a 3-star." },
      { q: "What is Defence Efficiency?", a: "Average stars conceded per defence. Lower is better." },
      { q: "What is Three Star Rate?", a: "Percentage of attacks that achieved full 3-star destruction." },
    ]},
  ];

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className={`w-6 h-6 rounded-full flex items-center justify-center border transition text-xs font-semibold ${open ? "bg-purple-500/20 border-purple-500/60 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.2)]" : "bg-transparent border-purple-500/40 text-purple-400 hover:border-purple-400 hover:shadow-[0_0_8px_rgba(168,85,247,0.15)]"}`}>
        ?
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}/>
          <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 w-[95vw] sm:w-[360px] sm:left-auto sm:right-4 sm:translate-x-0 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Help & FAQ</p>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-600 hover:text-slate-300 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            {/* FAQ content — no scroll */}
            <div className="p-3 space-y-3">
              {faqs.map((section, si) => (
                <div key={si}>
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest px-1 mb-1.5">{section.section}</p>
                  <div className="space-y-1">
                    {section.items.map((item, ii) => {
                      const key = `${si}-${ii}`;
                      const isOpen = expanded === key;
                      return (
                        <div key={ii} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
                          <button type="button" onClick={() => setExpanded(isOpen ? null : key)}
                            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left">
                            <span className="text-xs text-slate-300">{item.q}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 text-slate-600 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                            </svg>
                          </button>
                          {isOpen && (
                            <div className="px-3 pb-2.5">
                              <p className="text-[11px] text-slate-500 leading-relaxed">{item.a}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ContrastToggle() {
  const [high, setHigh] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("cgn-contrast") === "1";
    setHigh(saved);
    if (saved) document.documentElement.classList.add("high-contrast");
  }, []);

  function toggle() {
    const next = !high;
    setHigh(next);
    if (next) {
      document.documentElement.classList.add("high-contrast");
      localStorage.setItem("cgn-contrast", "1");
    } else {
      document.documentElement.classList.remove("high-contrast");
      localStorage.setItem("cgn-contrast", "0");
    }
  }

  return (
    <button type="button" onClick={toggle} title={high ? "Normal contrast" : "High contrast"}
      className={`w-6 h-6 rounded-full flex items-center justify-center border transition ${high ? "bg-purple-500/20 border-purple-500/60 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.2)]" : "bg-transparent border-purple-500/40 text-purple-400 hover:border-purple-400 hover:shadow-[0_0_8px_rgba(168,85,247,0.15)]"}`}>
      {high ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <circle cx="12" cy="12" r="5"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      )}
    </button>
  );
}


function SeasonAwards({ stats }) {
  if (!stats?.length) return null;
  const withAttacks = stats.filter(p => p.attacks_used > 0);
  const mostThreeStars = [...withAttacks].sort((a,b) => (b.three_stars||0) - (a.three_stars||0))[0];
  const bestClutch = [...withAttacks].filter(p => p.clutch_rate != null).sort((a,b) => parseFloat(b.clutch_rate||0) - parseFloat(a.clutch_rate||0))[0];
  const punchUpKing = [...withAttacks].filter(p => p.punch_up_rate != null).sort((a,b) => parseFloat(b.punch_up_rate||0) - parseFloat(a.punch_up_rate||0))[0];
  const ironDefence = [...stats].filter(p => p.attacks_available > 0).sort((a,b) => parseFloat(a.defence_efficiency||999) - parseFloat(b.defence_efficiency||999))[0];

  const awards = [
    {
      label: "Most 3★", player: mostThreeStars,
      value: mostThreeStars ? `${mostThreeStars.three_stars} hits` : null,
      colour: "text-amber-300",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>,
      iconColour: "text-amber-400",
    },
    {
      label: "Clutch King", player: bestClutch,
      value: bestClutch ? `${parseFloat(bestClutch.clutch_rate).toFixed(2)} avg` : null,
      colour: "text-purple-300",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/>,
      iconColour: "text-purple-400",
    },
    {
      label: "Punch-Up King", player: punchUpKing,
      value: punchUpKing ? `${parseFloat(punchUpKing.punch_up_rate).toFixed(0)}% punch-up` : null,
      colour: "text-blue-300",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/>,
      iconColour: "text-blue-400",
    },
    {
      label: "Iron Defence", player: ironDefence,
      value: ironDefence ? `${parseFloat(ironDefence.defence_efficiency||0).toFixed(2)} Def EFF` : null,
      colour: "text-green-300",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>,
      iconColour: "text-green-400",
    },
  ].filter(a => a.player && a.value);

  if (!awards.length) return null;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
      <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Season Awards</p>
      <div className="grid grid-cols-2 gap-2">
        {awards.map((award, i) => (
          <a key={i} href={`/player/${award.player.player_tag.replace("#","")}`} target="_blank" rel="noopener noreferrer"
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 hover:border-white/20 hover:bg-white/[0.04] transition no-underline">
            <div className="flex items-center gap-1.5 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 ${award.iconColour}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {award.icon}
              </svg>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest">{award.label}</p>
            </div>
            <p className="text-xs font-semibold text-white truncate">{award.player.player_name}</p>
            <p className={`text-sm font-bold ${award.colour}`}>{award.value}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

function AlliancePerformanceTile({ stats, totalAllianceStars }) {
  const withAtks = (stats||[]).filter(p => p.attacks_used > 0);
  const totalThreeStars = withAtks.reduce((s,p) => s+(p.three_stars||0), 0);
  const totalAtks = withAtks.reduce((s,p) => s+(p.attacks_used||0), 0);
  const allianceThreeStarRate = totalAtks > 0 ? (totalThreeStars/totalAtks*100).toFixed(0)+"%" : "—";
  const punchUpPlayers = withAtks.filter(p => p.punch_up_rate != null);
  const alliancePunchUp = punchUpPlayers.length ? (punchUpPlayers.reduce((s,p)=>s+parseFloat(p.punch_up_rate||0),0)/punchUpPlayers.length).toFixed(0)+"%" : "—";
  const clutchPlayers = withAtks.filter(p => p.clutch_rate != null);
  const allianceClutch = clutchPlayers.length ? (clutchPlayers.reduce((s,p)=>s+parseFloat(p.clutch_rate||0),0)/clutchPlayers.length).toFixed(2) : "—";
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
      <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Alliance Performance</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-center col-span-2">
          <p className="text-3xl font-thin text-amber-300">{totalAllianceStars}</p>
          <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Total Alliance Stars</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
          <p className="text-xl font-thin text-green-300">{totalThreeStars}</p>
          <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">3★ Hits ({allianceThreeStarRate})</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
          <p className="text-xl font-thin text-blue-300">{alliancePunchUp}</p>
          <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Avg Punch-Up</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-center col-span-2">
          <p className="text-xl font-thin text-purple-300">{allianceClutch}</p>
          <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Avg Clutch Rate (Days 5-7)</p>
        </div>
      </div>
    </div>
  );
}

// ─── Recap Share Card ────────────────────────────────────────────────────────
// Rendered off-screen, snapshotted by html2canvas via lib/shareCard.js.
// All graphics are inlined as raw SVG — no imported components.
// 680px landscape, solid backgrounds, no backdrop-blur.

function RecapShareCard({ topClan, top3, bestAttacker, bestDefender, totalWins, totalLosses, totalDraws, clanWithOverall, selectedSeason, totalAllianceStars, awardMostThreeStars, awardClutchKing, awardPunchUpKing, awardIronDefence }) {
  const MEDAL_PATH = "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z";
  const medalColours = { 1: "#D4AF37", 2: "#A7A7AD", 3: "#CD7F32" };

  const statCell = (label, value, colour) => (
    <div key={label} style={{
      background: "rgba(255,255,255,0.04)",
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.07)",
      padding: "7px 5px",
      textAlign: "center",
      flex: 1,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: colour }}>{value}</div>
      <div style={{ fontSize: 7.5, color: "#475569", textTransform: "uppercase", letterSpacing: "0.09em", marginTop: 2 }}>{label}</div>
    </div>
  );

  return (
    <div style={{
      width: 680,
      background: "#070b17",
      borderRadius: 24,
      border: "1px solid rgba(212,175,55,0.35)",
      padding: "22px 26px 18px",
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
      color: "white",
      boxSizing: "border-box",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Glass texture background — z-index 0, sits behind all content */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="glass-depth-recap" cx="50%" cy="35%" r="65%" fx="50%" fy="25%">
            <stop offset="0%" stopColor="#1c1408" stopOpacity="1"/>
            <stop offset="45%" stopColor="#0d0c0a" stopOpacity="1"/>
            <stop offset="100%" stopColor="#04060e" stopOpacity="1"/>
          </radialGradient>
          <radialGradient id="tint-recap" cx="50%" cy="20%" r="55%">
            <stop offset="0%" stopColor="#d4a017" stopOpacity="0.10"/>
            <stop offset="100%" stopColor="#d4a017" stopOpacity="0"/>
          </radialGradient>
          <pattern id="grain-recap" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <line x1="0" y1="4" x2="4" y2="0" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#glass-depth-recap)"/>
        <rect width="100%" height="100%" fill="url(#tint-recap)"/>
        <rect width="100%" height="100%" fill="url(#grain-recap)"/>
      </svg>
      {/* Card content — z-index 1, sits above background */}
      <div style={{ position: "relative", zIndex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
        {/* Left: season label + total stars */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>
            Season Recap
          </div>
          <div style={{ fontSize: 18, fontWeight: 300, letterSpacing: "0.08em", color: "white" }}>
            {selectedSeason}
          </div>
          {totalAllianceStars > 0 && (
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 300, color: "#fbbf24" }}>{totalAllianceStars}</span>
              <span style={{ fontSize: 8, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em" }}>Alliance Stars</span>
            </div>
          )}
        </div>

        {/* Right: Top Clan */}
        {topClan && (
          <div style={{
            background: "rgba(212,175,55,0.06)",
            border: "1px solid rgba(212,175,55,0.25)",
            borderRadius: 14,
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={medalColours[1]} strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d={MEDAL_PATH}/>
            </svg>
            <div>
              <div style={{ fontSize: 16, fontWeight: 300, letterSpacing: "0.1em", color: medalColours[1] }}>
                {topClan.clan_name.split(" ")[0]}
              </div>
              <div style={{ fontSize: 9, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
                {topClan.cwl_rank}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginLeft: 4 }}>
              {[
                { label: "Wins", value: topClan.wars_won, colour: "#86efac" },
                { label: "Atk EFF", value: parseFloat(topClan.attack_efficiency).toFixed(2), colour: "#c4b5fd" },
                { label: "CGN Rating", value: topClan.overall.toFixed(2), colour: "#c4b5fd" },
              ].map(({ label, value, colour }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: colour }}>{value}</div>
                  <div style={{ fontSize: 7, color: "#475569", textTransform: "uppercase", letterSpacing: "0.09em", marginTop: 1 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 12 }}/>

      {/* ── Row 2: Top 3 Players + Standout Performers ── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>

        {/* Left: Top 3 Players */}
        <div style={{
          flex: 1,
          background: "rgba(255,255,255,0.03)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.07)",
          padding: "10px 12px",
        }}>
          <div style={{ fontSize: 8, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>
            Top Players
          </div>
          {top3.map((p, i) => (
            <div key={p.player_tag} style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: i < 2 ? 6 : 0,
              paddingBottom: i < 2 ? 6 : 0,
              borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={medalColours[i+1]} strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={MEDAL_PATH}/>
                </svg>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: medalColours[i+1] }}>{p.player_name}</div>
                  <div style={{ fontSize: 8, color: "#64748b" }}>{p.clan_name.split(" ")[0]}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#c4b5fd" }}>{p.overall.toFixed(2)}</div>
            </div>
          ))}
        </div>

        {/* Right: Standout Performers */}
        <div style={{
          width: 200,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}>
          {bestAttacker && (
            <div style={{
              background: "rgba(139,92,246,0.06)",
              borderRadius: 12,
              border: "1px solid rgba(139,92,246,0.2)",
              padding: "10px 12px",
              flex: 1,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <div style={{ fontSize: 7.5, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Best Attack</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "white" }}>{bestAttacker.player_name}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#c4b5fd", marginTop: 2 }}>{parseFloat(bestAttacker.efficiency).toFixed(2)}</div>
            </div>
          )}
          {bestDefender && (
            <div style={{
              background: "rgba(59,130,246,0.06)",
              borderRadius: 12,
              border: "1px solid rgba(59,130,246,0.2)",
              padding: "10px 12px",
              flex: 1,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#60a5fa" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                <div style={{ fontSize: 7.5, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Best Defence</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "white" }}>{bestDefender.player_name}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#93c5fd", marginTop: 2 }}>{parseFloat(bestDefender.defence_efficiency).toFixed(2)}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Season Awards ── */}
      {(awardMostThreeStars || awardClutchKing || awardPunchUpKing || awardIronDefence) && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 8, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>Season Awards</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              { label: "Most 3★",     player: awardMostThreeStars, value: awardMostThreeStars ? `${awardMostThreeStars.three_stars} hits` : null,                          colour: "#fbbf24", bg: "rgba(251,191,36,0.06)",  border: "rgba(251,191,36,0.2)",  icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
              { label: "Clutch King", player: awardClutchKing,     value: awardClutchKing     ? `${parseFloat(awardClutchKing.clutch_rate).toFixed(2)} avg` : null,          colour: "#c4b5fd", bg: "rgba(139,92,246,0.06)", border: "rgba(139,92,246,0.2)",  icon: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" },
              { label: "Punch-Up",    player: awardPunchUpKing,    value: awardPunchUpKing    ? `${parseFloat(awardPunchUpKing.punch_up_rate).toFixed(0)}%` : null,           colour: "#93c5fd", bg: "rgba(59,130,246,0.06)",  border: "rgba(59,130,246,0.2)",  icon: "M5 10l7-7m0 0l7 7m-7-7v18" },
              { label: "Iron Defence",player: awardIronDefence,    value: awardIronDefence    ? `${parseFloat(awardIronDefence.defence_efficiency||0).toFixed(2)} Def EFF` : null,                       colour: "#86efac", bg: "rgba(34,197,94,0.06)",   border: "rgba(34,197,94,0.2)",   icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
            ].filter(a => a.player && a.value).map((award, i) => (
              <div key={i} style={{ background: award.bg, borderRadius: 10, border: `1px solid ${award.border}`, padding: "8px 10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" fill="none" viewBox="0 0 24 24" stroke={award.colour} strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={award.icon}/>
                  </svg>
                  <div style={{ fontSize: 7, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.09em" }}>{award.label}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "white" }}>{award.player.player_name}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: award.colour, marginTop: 2 }}>{award.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Row 4: Alliance War Record ── */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.07)",
        padding: "10px 12px",
        marginBottom: 12,
      }}>
        <div style={{ fontSize: 8, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>
          Alliance War Record
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* W/L/D summary */}
          <div style={{ display: "flex", gap: 8, marginRight: 8 }}>
          {[
              { label: "Won",   value: totalWins,   colour: "#86efac", bg: "rgba(34,197,94,0.06)",  border: "rgba(34,197,94,0.2)",  icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label: "Lost",  value: totalLosses, colour: "#f87171", bg: "rgba(239,68,68,0.06)",  border: "rgba(239,68,68,0.2)",  icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label: "Drawn", value: totalDraws,  colour: "#64748b", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.07)", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
            ].map(({ label, value, colour, bg, border, icon }) => (
              <div key={label} style={{ background: bg, borderRadius: 10, border: `1px solid ${border}`, padding: "8px 12px", minWidth: 44 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" fill="none" viewBox="0 0 24 24" stroke={colour} strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon}/>
                  </svg>
                  <div style={{ fontSize: 7, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.09em" }}>{label}</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: colour }}>{value}</div>
              </div>
            ))}
          </div>
          {/* Clan breakdown */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            {clanWithOverall.slice(0, 4).map((c, i) => (
              <div key={c.clan_tag || c.clan_name} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 4,
                borderBottom: i < Math.min(clanWithOverall.length, 4) - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke={medalColours[i+1] || "#475569"} strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={MEDAL_PATH}/>
                  </svg>
                  <span style={{ fontSize: 10, color: "white" }}>{c.clan_name.split(" ")[0]}</span>
                </div>
                <div style={{ display: "flex", gap: 8, fontSize: 9 }}>
                  <span style={{ color: "#86efac" }}>{c.wars_won}W</span>
                  <span style={{ color: "#f87171" }}>{c.wars_lost}L</span>
                  <span style={{ color: "#c4b5fd" }}>{parseFloat(c.attack_efficiency).toFixed(2)} EFF</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 7, color: "#1e293b", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          cgnco.vercel.app · Cognition {"{CGN}"}
        </span>
      </div>
      </div>{/* end content wrapper */}
    </div>
  );
}


function RecapView({ onBack }) {
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [stats, setStats] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const recapCardRef = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/leaderboard").then(r => r.json()),
      fetch("/api/history").then(r => r.json()),
    ]).then(([lb, hist]) => {
      setSeasons(lb.seasons || []);
      setSelectedSeason(lb.currentSeason || lb.seasons?.[0] || null);
      setHistory(hist.history || []);
      const withOverall = (lb.stats || []).map(p => ({
        ...p,
        overall: (p.attacks_used > 0 && p.attacks_available > 0)
          ? parseFloat(((parseFloat(p.efficiency||0)*0.6)+((3-parseFloat(p.defence_efficiency||0))*0.4)).toFixed(2))
          : null,
      }));
      setStats(withOverall);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedSeason) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/leaderboard?season=${encodeURIComponent(selectedSeason)}`).then(r => r.json()),
      fetch(`/api/history?season=${encodeURIComponent(selectedSeason)}`).then(r => r.json()),
    ]).then(([lb, hist]) => {
      const withOverall = (lb.stats || []).map(p => ({
        ...p,
        overall: (p.attacks_used > 0 && p.attacks_available > 0)
          ? parseFloat(((parseFloat(p.efficiency||0)*0.6)+((3-parseFloat(p.defence_efficiency||0))*0.4)).toFixed(2))
          : null,
      }));
      setStats(withOverall);
      setHistory(hist.history || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedSeason]);

  // Derived data
  const seasonHistory = history.filter(r => r.season === selectedSeason);
  const totalWars = seasonHistory.reduce((s,r) => s + (r.wars_won||0) + (r.wars_lost||0) + (r.wars_drawn||0), 0);
  const totalWins = seasonHistory.reduce((s,r) => s + (r.wars_won||0), 0);
  const totalLosses = seasonHistory.reduce((s,r) => s + (r.wars_lost||0), 0);
  const totalDraws = seasonHistory.reduce((s,r) => s + (r.wars_drawn||0), 0);

  const validPlayers = stats.filter(p => p.overall != null).sort((a,b) => b.overall - a.overall);
  const top3 = validPlayers.slice(0, 3);

  const bestAttacker = [...stats].filter(p => p.attacks_used > 0).sort((a,b) => parseFloat(b.efficiency||0) - parseFloat(a.efficiency||0))[0];
  const bestDefender = [...stats].filter(p => p.attacks_available > 0).sort((a,b) => parseFloat(a.defence_efficiency||0) - parseFloat(b.defence_efficiency||0))[0];

  const clanWithOverall = seasonHistory.map(c => ({
    ...c,
    overall: parseFloat(((parseFloat(c.attack_efficiency||0)*0.5)+((3-parseFloat(c.defence_efficiency||0))*0.3)+((c.wars_won||0)/7*3*0.2)).toFixed(2))
  })).sort((a,b) => b.overall - a.overall);
  const topClan = clanWithOverall[0];

  // Total alliance stars
  const totalAllianceStars = seasonHistory.reduce((s,r) => s + (r.total_stars||0), 0);

  // Season awards for share card
  const withAttacks = stats.filter(p => p.attacks_used > 0);
  const awardMostThreeStars = [...withAttacks].sort((a,b) => (b.three_stars||0) - (a.three_stars||0))[0];
  const awardClutchKing = [...withAttacks].filter(p => p.clutch_rate != null).sort((a,b) => parseFloat(b.clutch_rate||0) - parseFloat(a.clutch_rate||0))[0];
  const awardPunchUpKing = [...withAttacks].filter(p => p.punch_up_rate != null).sort((a,b) => parseFloat(b.punch_up_rate||0) - parseFloat(a.punch_up_rate||0))[0];
  const awardIronDefence = [...stats].filter(p => p.attacks_available > 0).sort((a,b) => parseFloat(a.defence_efficiency||999) - parseFloat(b.defence_efficiency||999))[0];

  // Previous season delta
  const selectedSeasonIdx = seasons.indexOf(selectedSeason);
  const prevSeason = selectedSeasonIdx >= 0 && selectedSeasonIdx < seasons.length - 1 ? seasons[selectedSeasonIdx + 1] : null;
  const prevSeasonHistory = prevSeason ? history.filter(r => r.season === prevSeason) : [];
  const prevClanWithOverall = prevSeasonHistory.map(c => ({
    ...c,
    overall: parseFloat(((parseFloat(c.attack_efficiency||0)*0.5)+((3-parseFloat(c.defence_efficiency||0))*0.3)+((c.wars_won||0)/7*3*0.2)).toFixed(2))
  })).sort((a,b) => b.overall - a.overall);
  const prevTopClan = prevClanWithOverall[0];
  const topClanDelta = topClan && prevTopClan ? parseFloat((topClan.overall - prevTopClan.overall).toFixed(2)) : null;

  const MEDAL_PATH = "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z";
  const medalColours = { 1: "#D4AF37", 2: "#A7A7AD", 3: "#CD7F32" };

  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    setShowShareCard(true);
    await new Promise(r => setTimeout(r, 100));
    try {
      const { shareCard } = await import("@/lib/shareCard");
      const result = await shareCard(recapCardRef.current, `cgn-recap-${(selectedSeason||"season").toLowerCase().replace(/\s+/g,"-")}.png`);
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

      {/* Hidden recap share card — only mounted when Share is tapped */}
      {showShareCard && topClan && (
        <div ref={recapCardRef} style={{ position: "fixed", top: 0, left: "-9999px", zIndex: -1, pointerEvents: "none" }}>
          <RecapShareCard
            topClan={topClan}
            top3={top3}
            bestAttacker={bestAttacker}
            bestDefender={bestDefender}
            totalWins={totalWins}
            totalLosses={totalLosses}
            totalDraws={totalDraws}
            clanWithOverall={clanWithOverall}
            selectedSeason={selectedSeason}
            totalAllianceStars={totalAllianceStars}
            awardMostThreeStars={awardMostThreeStars}
            awardClutchKing={awardClutchKing}
            awardPunchUpKing={awardPunchUpKing}
            awardIronDefence={awardIronDefence}
          />
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      </div>

      <AppHeader variant="bar"/>

      {/* Header */}
      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 mb-4 text-center">
        <h1 className="text-2xl font-thin tracking-widest mb-1">Season Recap</h1>
        {seasons.length > 1 ? (
          <select value={selectedSeason||""} onChange={e => setSelectedSeason(e.target.value)}
            className="mt-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white focus:outline-none [color-scheme:dark]">
            {seasons.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        ) : (
          <p className="text-slate-500 text-xs mt-1">{selectedSeason}</p>
        )}

        {/* Share button */}
        {!loading && topClan && (
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
                  Share Recap
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-600 text-xs tracking-widest uppercase animate-pulse">Loading…</p>
        </div>
      ) : (
        <div className="relative z-10 space-y-4">

          {/* Top clan */}
          {topClan && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 flex flex-col items-center text-center gap-3">
              <p className="text-[9px] text-slate-600 uppercase tracking-widest">Top Clan</p>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={medalColours[1]} strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={MEDAL_PATH}/>
              </svg>
              <div>
                <p className="text-2xl font-thin tracking-widest" style={{color: medalColours[1]}}>{topClan.clan_name.split(" ")[0]}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{topClan.cwl_rank}</p>
              </div>
              <div className="flex items-center justify-center gap-6 w-full pt-2 border-t border-white/[0.06]">
                <div className="text-center">
                  <p className="text-xl font-thin text-green-300">{topClan.wars_won}</p>
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Wins</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-thin text-purple-300">{parseFloat(topClan.attack_efficiency).toFixed(2)}</p>
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Atk EFF</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-xl font-thin text-purple-300">{topClan.overall.toFixed(2)}</p>
                    {topClanDelta !== null && (
                      <span className={`text-[9px] font-semibold ${topClanDelta > 0 ? "text-green-400" : topClanDelta < 0 ? "text-red-400" : "text-slate-500"}`}>
                        {topClanDelta > 0 ? `↑${topClanDelta}` : topClanDelta < 0 ? `↓${Math.abs(topClanDelta)}` : "→"}
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">CGN Rating</p>
                </div>
              </div>
            </div>
          )}

          {/* Top 3 players */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Top Players · CGN Rating</p>
            <div className="space-y-2">
              {top3.map((p, i) => (
                <a key={p.player_tag} href={`/player/${p.player_tag.replace("#","")}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 hover:border-white/20 hover:bg-white/[0.04] transition no-underline">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke={medalColours[i+1]} strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={MEDAL_PATH}/>
                    </svg>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate" style={{color: medalColours[i+1]}}>{p.player_name}</p>
                      <p className="text-[10px] text-slate-500">{p.clan_name.split(" ")[0]}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-purple-300 shrink-0">{p.overall.toFixed(2)}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Standout performers */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Standout Performers</p>
            <div className="grid grid-cols-2 gap-2">
              {bestAttacker && (
                <a href={`/player/${bestAttacker.player_tag.replace("#","")}`} target="_blank" rel="noopener noreferrer"
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 hover:border-white/20 hover:bg-white/[0.04] transition no-underline">
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest">Best Attack</p>
                  </div>
                  <p className="text-xs font-semibold text-white truncate">{bestAttacker.player_name}</p>
                  <p className="text-sm font-bold text-purple-300">{parseFloat(bestAttacker.efficiency).toFixed(2)}</p>
                </a>
              )}
              {bestDefender && (
                <a href={`/player/${bestDefender.player_tag.replace("#","")}`} target="_blank" rel="noopener noreferrer"
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 hover:border-white/20 hover:bg-white/[0.04] transition no-underline">
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest">Best Defence</p>
                  </div>
                  <p className="text-xs font-semibold text-white truncate">{bestDefender.player_name}</p>
                  <p className="text-sm font-bold text-blue-300">{parseFloat(bestDefender.defence_efficiency).toFixed(2)}</p>
                </a>
              )}
            </div>
          </div>

          {/* Category winners */}
          <SeasonAwards stats={stats} />

          {/* Alliance Performance */}
          {stats.length > 0 && (
            <AlliancePerformanceTile stats={stats} totalAllianceStars={totalAllianceStars} />
          )}

          {/* Alliance war record */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Alliance War Record</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center">
                <p className="text-2xl font-thin text-green-300">{totalWins}</p>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Won</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center">
                <p className="text-2xl font-thin text-red-400">{totalLosses}</p>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Lost</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center">
                <p className="text-2xl font-thin text-slate-500">{totalDraws}</p>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Drawn</p>
              </div>
            </div>
            {/* Clan breakdown */}
            <div className="mt-3 space-y-1.5">
              {clanWithOverall.map((c, i) => (
                <div key={c.clan_tag || c.clan_name} className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke={medalColours[i+1] || "#475569"} strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={MEDAL_PATH}/>
                    </svg>
                    <span className="text-xs text-white">{c.clan_name.split(" ")[0]}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-green-300">{c.wars_won}W</span>
                    <span className="text-red-400">{c.wars_lost}L</span>
                    <span className="text-purple-300">{parseFloat(c.attack_efficiency).toFixed(2)} EFF</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <AppFooter/>
    </main>
  );
}



function LeaderboardView({ onBack }) {
  const [lbTab, setLbTab] = useState("player"); // "player" | "clan"
  const [data, setData] = useState(null);
  const [allSeasonData, setAllSeasonData] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("all");
  const [clanFilter, setClanFilter] = useState("all");
  const [thFilter, setThFilter] = useState("all");
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [sortBy, setSortBy] = useState("overall");
  const [sortDir, setSortDir] = useState("desc");
  const [search, setSearch] = useState("");
  const [expandedTag, setExpandedTag] = useState(null);
  // Clan leaderboard data
  const [clanHistory, setClanHistory] = useState(null);
  const [expandedClan, setExpandedClan] = useState(null);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then(r => r.json())
      .then(async d => {
        const allSeasons = d.seasons || [];
        setSeasons(allSeasons);
        // Linked accounts set — per-season fetches below now correctly
        // include unlinked players (season-snapshot rule), so this rollup
        // must filter back down to linked accounts only before aggregating.
        const linkedRes = await fetch("/api/linked-accounts").then(r => r.json()).catch(() => ({ tags: [] }));
        const linkedTags = new Set(linkedRes.tags || []);
        const allData = [];
        for (const s of allSeasons) {
          try {
            const r2 = await fetch(`/api/leaderboard?season=${encodeURIComponent(s)}`);
            const d2 = await r2.json();
            (d2.stats || []).forEach(p => { if (linkedTags.has(p.player_tag)) allData.push(p); });
          } catch {}
        }
        setAllSeasonData(allData);
      })
      .catch(() => {});
  }, []);
  // Fetch clan history for clan leaderboard — refetches per season so the
  // season-snapshot rule (full clan list, registered or not) applies whenever
  // a specific season is selected; "All Time" stays scoped to registered clans.
  useEffect(() => {
    const seasonParam = selectedSeason === "all" ? "" : `?season=${encodeURIComponent(selectedSeason)}`;
    fetch(`/api/history${seasonParam}`)
      .then(r => r.json())
      .then(d => setClanHistory(d.history || []))
      .catch(() => setClanHistory([]));
  }, [selectedSeason]);

  function toggleExpand(tag) {
    setExpandedTag(prev => prev === tag ? null : tag);
  }
  function toggleExpandClan(name) {
    setExpandedClan(prev => prev === name ? null : name);
  }

  const CLAN_SORT_OPTIONS = [
    { key: "overall",              label: "CGN Rating", group: "CGN Rating" },
    { key: "attack_efficiency",    label: "Atk Efficiency", group: "Attack" },
    { key: "total_stars",          label: "Total Stars",    group: "Attack" },
    { key: "avg_destruction_pct",  label: "Destruction %",  group: "Attack" },
    { key: "three_star_rate",      label: "Three Star Rate",group: "Attack" },
    { key: "total_attacks_used",   label: "Attacks Used",   group: "Attack" },
    { key: "total_attacks_missed", label: "Missed",         group: "Attack" },
    { key: "defence_efficiency",   label: "Def Efficiency", group: "Defence" },
    { key: "total_stars_conceded", label: "Stars Conceded", group: "Defence" },
    { key: "avg_defence_pct",      label: "Defence %",      group: "Defence" },
    { key: "wars_won",             label: "Wars Won",       group: "Record" },
    { key: "wars_lost",            label: "Wars Lost",      group: "Record" },
    { key: "wars_drawn",           label: "Wars Drawn",     group: "Record" },
  ];

  // Aggregate clan history for All Time or filter by season
  const clanDisplayData = (() => {
    if (!clanHistory) return [];
    const rows = selectedSeason === "all" ? clanHistory : clanHistory.filter(r => r.season === selectedSeason);
    if (selectedSeason !== "all") return rows;
    // Aggregate across seasons — keyed by clan_tag to avoid bundling clans
    // that share a name but are actually different clans (old vs current).
    const map = {};
    for (const r of rows) {
      const key = r.clan_tag || r.clan_name; // fallback for any legacy row without a tag
      if (!map[key]) map[key] = { clan_tag: r.clan_tag, clan_name: r.clan_name, cwl_rank: r.cwl_rank, wars_won:0,wars_lost:0,wars_drawn:0, total_stars:0,total_stars_conceded:0,total_attacks_used:0,total_attacks_available:0,total_attacks_missed:0, three_stars_clan:0,two_stars_clan:0,one_stars_clan:0,zero_stars_clan:0, _destSum:0,_defSum:0,_atkCount:0,_defCount:0,_threeStar:0,_totalAtk:0 };
      const m = map[key];
      m.wars_won += r.wars_won||0; m.wars_lost += r.wars_lost||0; m.wars_drawn += r.wars_drawn||0;
      m.total_stars += r.total_stars||0; m.total_stars_conceded += r.total_stars_conceded||0;
      m.total_attacks_used += r.total_attacks_used||0; m.total_attacks_available += r.total_attacks_available||0; m.total_attacks_missed += r.total_attacks_missed||0;
      m.three_stars_clan += r.three_stars_clan||0; m.two_stars_clan += r.two_stars_clan||0; m.one_stars_clan += r.one_stars_clan||0; m.zero_stars_clan += r.zero_stars_clan||0;
      if (r.total_attacks_used > 0) { m._destSum += parseFloat(r.avg_destruction_pct||0)*r.total_attacks_used; m._atkCount += r.total_attacks_used; }
      if (r.total_attacks_available > 0) { m._defSum += parseFloat(r.avg_defence_pct||0)*r.total_attacks_available; m._defCount += r.total_attacks_available; }
      m._threeStar += r.three_stars_clan||0; m._totalAtk += r.total_attacks_used||0;
    }
    return Object.values(map).map(m => ({
      ...m,
      avg_destruction_pct: m._atkCount > 0 ? (m._destSum/m._atkCount).toFixed(2) : null,
      avg_defence_pct: m._defCount > 0 ? (m._defSum/m._defCount).toFixed(2) : null,
      attack_efficiency: m.total_attacks_used > 0 ? (m.total_stars/m.total_attacks_used).toFixed(2) : null,
      defence_efficiency: m.total_attacks_available > 0 ? (m.total_stars_conceded/m.total_attacks_available).toFixed(2) : null,
      three_star_rate: m._totalAtk > 0 ? ((m._threeStar/m._totalAtk)*100).toFixed(2) : null,
    })).map(c => ({
      ...c,
      overall: (c.total_attacks_used > 0 && c.total_attacks_available > 0)
        ? ((parseFloat(c.attack_efficiency||0)*0.5) + ((3-parseFloat(c.defence_efficiency||0))*0.3) + ((c.wars_won||0)/7*3*0.2)).toFixed(2)
        : null,
    }));
  })();

  const clanSortKey = lbTab === "clan" ? (CLAN_SORT_OPTIONS.find(o=>o.key===sortBy) ? sortBy : "attack_efficiency") : sortBy;
  const clanSearchLower = search.toLowerCase();
  const filteredClans = clanDisplayData
    .filter(c => !clanSearchLower || c.clan_name.toLowerCase().includes(clanSearchLower))
    .sort((a,b) => {
      const av = parseFloat(a[clanSortKey])||0, bv = parseFloat(b[clanSortKey])||0;
      const invert = clanSortKey === "total_stars_conceded" || clanSortKey === "defence_efficiency" || clanSortKey === "total_attacks_missed" || clanSortKey === "wars_lost";
      const dir = invert ? (sortDir==="desc"?1:-1) : (sortDir==="desc"?-1:1);
      return (av-bv)*dir;
    });

  // All Time aggregate
  const allTimeData = (() => {
    if (!allSeasonData.length) return [];
    const map = {};
    for (const p of allSeasonData) {
      const tag = p.player_tag;
      if (!map[tag]) {
        map[tag] = {
          player_tag: tag, player_name: p.player_name, clan_name: p.clan_name,
          town_hall_level: p.town_hall_level ?? null,
          stars_earned: 0, stars_conceded: 0, attacks_used: 0, attacks_available: 0, missed_attacks: 0,
          three_stars: 0, two_stars: 0, one_stars: 0, zero_stars: 0,
          three_stars_conceded: 0, two_stars_conceded: 0, one_stars_conceded: 0, zero_stars_conceded: 0,
          _destSum: 0, _defSum: 0, _atkCount: 0, _defCount: 0,
          // War metrics accumulators
          _warMetricCount: 0,
          _avgStarsSum: 0, _threeStarRateSum: 0, _punchUpRateSum: 0,
          _clutchRateSum: 0, _consistencySum: 0,
          dips: 0, reaches: 0,
        };
      }
      const m = map[tag];
      m.stars_earned += p.stars_earned || 0;
      m.stars_conceded += p.stars_conceded || 0;
      m.attacks_used += p.attacks_used || 0;
      m.attacks_available += p.attacks_available || 0;
      m.missed_attacks += p.missed_attacks || 0;
      m.three_stars += p.three_stars || 0;
      m.two_stars += p.two_stars || 0;
      m.one_stars += p.one_stars || 0;
      m.zero_stars += p.zero_stars || 0;
      m.three_stars_conceded += p.three_stars_conceded || 0;
      m.two_stars_conceded += p.two_stars_conceded || 0;
      m.one_stars_conceded += p.one_stars_conceded || 0;
      m.zero_stars_conceded += p.zero_stars_conceded || 0;
      if (p.attacks_used > 0) { m._destSum += parseFloat(p.destruction_pct||0) * p.attacks_used; m._atkCount += p.attacks_used; }
      // Accumulate war metrics if present
      if (p.avg_stars_per_attack != null) {
        m._warMetricCount++;
        m._avgStarsSum += parseFloat(p.avg_stars_per_attack || 0);
        m._threeStarRateSum += parseFloat(p.three_star_rate || 0);
        m._punchUpRateSum += parseFloat(p.punch_up_rate || 0);
        m._clutchRateSum += parseFloat(p.clutch_rate || 0);
        m._consistencySum += parseFloat(p.consistency_score || 0);
        m.dips += parseInt(p.dips || 0);
        m.reaches += parseInt(p.reaches || 0);
      }
      if (p.attacks_available > 0) { m._defSum += parseFloat(p.defence_pct||0) * p.attacks_available; m._defCount += p.attacks_available; }
    }
    return Object.values(map).map(m => ({
      ...m,
      destruction_pct: m._atkCount > 0 ? (m._destSum / m._atkCount).toFixed(2) : "0.00",
      defence_pct: m._defCount > 0 ? (m._defSum / m._defCount).toFixed(2) : "0.00",
      efficiency: m.attacks_used > 0 ? (m.stars_earned / m.attacks_used).toFixed(2) : "0.00",
      defence_efficiency: m.attacks_available > 0 ? (m.stars_conceded / m.attacks_available).toFixed(2) : "0.00",
      // Average war metrics across seasons where data exists
      avg_stars_per_attack: m._warMetricCount > 0 ? (m._avgStarsSum / m._warMetricCount).toFixed(2) : null,
      three_star_rate: m._warMetricCount > 0 ? (m._threeStarRateSum / m._warMetricCount).toFixed(2) : null,
      punch_up_rate: m._warMetricCount > 0 ? (m._punchUpRateSum / m._warMetricCount).toFixed(2) : null,
      clutch_rate: m._warMetricCount > 0 ? (m._clutchRateSum / m._warMetricCount).toFixed(2) : null,
      consistency_score: m._warMetricCount > 0 ? (m._consistencySum / m._warMetricCount).toFixed(2) : null,
    })).map(p => ({
      ...p,
      overall: (p.attacks_used > 0 && p.attacks_available > 0)
        ? ((parseFloat(p.efficiency) * 0.6) + ((3 - parseFloat(p.defence_efficiency)) * 0.4)).toFixed(2)
        : null,
    }));
  })();

  const displayData = selectedSeason === "all" ? allTimeData : data;
  const clans = displayData ? [...new Set(displayData.map(p => p.clan_name))].sort() : [];
  const searchLower = search.toLowerCase();
  const filtered = displayData
    ? displayData
        .filter(p => clanFilter === "all" || p.clan_name === clanFilter)
        .filter(p => thFilter === "all" || String(p.town_hall_level) === thFilter)
        .filter(p => !searchLower ||
          p.player_name.toLowerCase().includes(searchLower) ||
          p.player_tag.toLowerCase().includes(searchLower) ||
          p.clan_name.toLowerCase().includes(searchLower))
    : [];
  const sorted = [...filtered].sort((a, b) => {
    const av = parseFloat(a[sortBy]) || 0;
    const bv = parseFloat(b[sortBy]) || 0;
    const invert = sortBy === "missed_attacks" || sortBy === "stars_conceded" || sortBy === "defence_efficiency" || sortBy === "consistency_score";
    const dir = invert ? (sortDir === "desc" ? 1 : -1) : (sortDir === "desc" ? -1 : 1);
    return (av - bv) * dir;
  });

  return (
    <main className="min-h-screen overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      </div>

      <AppHeader variant="bar"/>

      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 mb-4 text-center">
        <h1 className="text-2xl font-thin tracking-widest mb-1">CWL Leaderboard</h1>
        <p className="text-slate-500 text-xs mb-4">{lbTab === "player" ? "Player performance by season" : "Clan performance by season"}</p>
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <select value={sortBy} onChange={e=>{ setSortBy(e.target.value); setSortDir("desc"); }}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white focus:outline-none [color-scheme:dark]">
            {lbTab === "player" ? (<>
              <optgroup label="CGN Rating">
                <option value="overall">CGN Rating</option>
              </optgroup>
              <optgroup label="Attack">
                <option value="efficiency">Atk Efficiency</option>
                <option value="stars_earned">Stars Earned</option>
                <option value="destruction_pct">Destruction %</option>
                <option value="attacks_used">Attacks Used</option>
                <option value="missed_attacks">Missed Attacks</option>
              </optgroup>
              <optgroup label="Defence">
                <option value="defence_efficiency">Def Efficiency</option>
                <option value="stars_conceded">Stars Conceded</option>
                <option value="defence_pct">Defence %</option>
              </optgroup>
              <optgroup label="War Metrics">
                <option value="avg_stars_per_attack">Avg Stars / Attack</option>
                <option value="three_star_rate">3★ Rate</option>
                <option value="punch_up_rate">Punch-Up Rate</option>
                <option value="clutch_rate">Clutch Rate (Days 5-7)</option>
                <option value="consistency_score">Consistency Score</option>
              </optgroup>
            </>) : (<>
              {["CGN Rating","Attack","Defence","Record"].map(g=>(
                <optgroup key={g} label={g}>
                  {CLAN_SORT_OPTIONS.filter(o=>o.group===g).map(o=>(
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </optgroup>
              ))}
            </>)}
          </select>
          <button type="button" onClick={()=>setSortDir(d=>d==="desc"?"asc":"desc")}
            title={sortDir === "desc" ? "High to low" : "Low to high"}
            className="rounded-full border border-white/10 bg-white/[0.04] w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white transition shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {sortDir === "desc"
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                : <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/>}
            </svg>
          </button>
          {(() => {
            const activeCount = (selectedSeason !== "all" ? 1 : 0) + (clanFilter !== "all" ? 1 : 0) + (lbTab === "player" && thFilter !== "all" ? 1 : 0);
            return (
              <button type="button" onClick={() => setShowFiltersModal(true)}
                className={`relative rounded-full border px-3 py-1 text-xs flex items-center gap-1.5 transition ${activeCount > 0 ? "border-purple-500/40 bg-purple-500/[0.08] text-purple-300" : "border-white/10 bg-white/[0.04] text-slate-300 hover:text-white"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                </svg>
                Filters
                {activeCount > 0 && (
                  <span className="ml-0.5 rounded-full bg-purple-500/30 text-purple-200 text-[10px] font-bold w-4 h-4 flex items-center justify-center">{activeCount}</span>
                )}
              </button>
            );
          })()}
        </div>

        {/* Filters modal — rendered via portal to escape overflow-clipped ancestors */}
        {showFiltersModal && typeof document !== "undefined" && createPortal(
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowFiltersModal(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
            <div onClick={e => e.stopPropagation()}
              className="relative z-10 w-full sm:w-auto sm:max-w-2xl rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#0d1424] flex flex-col max-h-[75dvh] sm:max-h-[90vh]">
              <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
                <h3 className="text-sm font-semibold text-white">Filters</h3>
                <button onClick={() => setShowFiltersModal(false)} className="text-slate-500 hover:text-white transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 min-h-0">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-3">
                  <div className="sm:w-44">
                    <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1.5">Season</p>
                    <select value={selectedSeason} onChange={e => {
                      const val = e.target.value;
                      setSelectedSeason(val);
                      setExpandedTag(null);
                      setClanFilter("all");
                      if (val !== "all") {
                        setData(null);
                        fetch(`/api/leaderboard?season=${encodeURIComponent(val)}`)
                          .then(r=>r.json()).then(d=>setData((d.stats||[]).map(p=>({
                          ...p,
                          overall: (p.attacks_used > 0 && p.attacks_available > 0)
                            ? ((parseFloat(p.efficiency||0)*0.6)+((3-parseFloat(p.defence_efficiency||0))*0.4)).toFixed(2)
                            : null,
                        })))).catch(()=>setData([]));
                      }
                    }} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none [color-scheme:dark]">
                      <option value="all">All Time</option>
                      {seasons.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {clans.length > 1 && (
                    <div className="sm:w-44">
                      <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1.5">Clan</p>
                      <select value={clanFilter} onChange={e=>setClanFilter(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none [color-scheme:dark]">
                        <option value="all">All Clans</option>
                        {clans.map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )}

                  {lbTab === "player" && (
                    <div className="sm:w-44">
                      <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1.5">Town Hall</p>
                      <select value={thFilter} onChange={e=>setThFilter(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none [color-scheme:dark]">
                        <option value="all">All TH</option>
                        {[...new Set((displayData||[]).map(p=>p.town_hall_level).filter(Boolean))].sort((a,b)=>b-a).map(th=>(
                          <option key={th} value={String(th)}>TH{th}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
                <button onClick={() => { setSelectedSeason("all"); setClanFilter("all"); setThFilter("all"); }}
                  className="text-xs text-slate-500 hover:text-slate-300 transition">
                  Clear all
                </button>
                <button onClick={() => setShowFiltersModal(false)}
                  className="rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-200 text-xs font-semibold px-4 py-1.5 hover:bg-purple-500/30 transition">
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Value reference legend — mirrors the row tiles for the active sort */}
        {lbTab === "player" && (
          <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
            <span className="text-[9px] text-slate-600 uppercase tracking-widest">Showing</span>
            {getRowTiles(sortBy).map(tile => {
              const stroke = typeof tile.stroke === "function" ? tile.stroke({}) : tile.stroke;
              return (
                <div key={tile.key} className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={tile.icon}/>
                  </svg>
                  <span className="text-[10px] text-slate-400">{tile.label}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="relative max-w-xs mx-auto mb-4">
          <input type="text" placeholder={lbTab === "player" ? "Search player or tag…" : "Search clan…"} value={search} onChange={e=>setSearch(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition"/>
          {search && (
            <button onClick={()=>setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center bg-white/[0.08] text-slate-400 hover:text-white transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>

        {/* Tab toggle */}
        <div className="flex items-center justify-center gap-4">
          <button onClick={()=>{setLbTab("player");setSortBy("efficiency");setSearch("");setThFilter("all");setExpandedTag(null);setExpandedClan(null);}} className="text-slate-500 hover:text-slate-300 transition p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <span className="text-[10px] text-slate-600 uppercase tracking-widest select-none min-w-[100px]">
            {lbTab === "player" ? "Players" : "Clans"}
          </span>
          <button onClick={()=>{setLbTab("clan");setSortBy("overall");setSearch("");setExpandedTag(null);setExpandedClan(null);}} className="text-slate-500 hover:text-slate-300 transition p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
      <div className="relative z-10 space-y-2">
        {displayData === null ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-slate-500 text-sm animate-pulse">Loading…</div>
        ) : sorted.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
            <p className="text-slate-600 text-sm">{search ? "No players match your search." : "No leaderboard data yet."}</p>
          </div>
        ) : lbTab === "player" ? sorted.map((p, i) => (
          <PlayerCard key={p.player_tag} p={p} rank={i+1}
            allSeasonData={allSeasonData}
            seasons={seasons}
            sortBy={sortBy}
            isExpanded={expandedTag === p.player_tag}
            onToggle={() => toggleExpand(p.player_tag)}/>
        )) : null}

        {/* Clan leaderboard cards */}
        {lbTab === "clan" && (
          clanHistory === null ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-slate-500 text-sm animate-pulse">Loading…</div>
          ) : filteredClans.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
              <p className="text-slate-600 text-sm">{search ? "No clans match your search." : "No clan data yet."}</p>
            </div>
          ) : filteredClans.map((c, i) => (
            <ClanCard key={c.clan_tag || c.clan_name} c={c} rank={i+1}
              isExpanded={expandedClan === (c.clan_tag || c.clan_name)}
              onToggle={() => toggleExpandClan(c.clan_tag || c.clan_name)}/>
          ))
        )}
      </div>
      <AppFooter/>
    </main>
  );
}

// ─── Shared branded header + hamburger nav — used on every top-level view ──
// Navigation uses direct hash changes (not a shared in-memory router), so
// this works identically whether mounted inside the top-level Home component
// or any other page (including the standalone player profile route).
function AppHeader({ variant = "bar" }) {
  const [navOpen, setNavOpen] = useState(false);
  const tapCount = useRef(0);
  const tapTimer = useRef(null);

  function handleBrandTap() {
    tapCount.current += 1;
    if (tapCount.current >= 5) {
      clearTimeout(tapTimer.current);
      tapCount.current = 0;
      setNavOpen(false);
      window.location.href = "/admin";
      return;
    }
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 3000);
  }
  const items = [
    { key: "", label: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { key: "roster", label: "Signup / Rosters", icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4" },
    { key: "leaderboard", label: "Leaderboard", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { key: "history", label: "History", icon: "M7 17l4-8 4 5 2-3M3 3v18h18" },
    { key: "recap", label: "Season Recap", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
    { key: "warintel", label: "War Intel", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" },
  ];

  function go(key) {
    setNavOpen(false);
    if (typeof window === "undefined") return;
    if (key === "") {
      window.location.href = window.location.pathname;
    } else {
      window.location.hash = key;
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex transition-opacity duration-150 ${navOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setNavOpen(false)}>
          <div className="absolute inset-0 bg-black/60"/>
          <div onClick={e => e.stopPropagation()}
            className={`relative z-10 w-72 max-w-[80vw] h-full bg-[#0d1424] border-r border-white/10 flex flex-col p-5 transition-transform duration-150 ${navOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="flex items-center gap-2 mb-8 cursor-default select-none" onClick={handleBrandTap}>
              <img src="/icons/branding/cgn-skull.png" alt="CGN" className="w-7 h-7"/>
              <span className="text-sm text-white tracking-widest uppercase">Cognition {"{CGN}"}</span>
            </div>
            <nav className="flex-1 space-y-1">
              {items.map(item => (
                <button key={item.key || "home"} onClick={() => go(item.key)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition text-left">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/>
                  </svg>
                  {item.label}
                </button>
              ))}
            </nav>
            <a href="https://discord.gg/czqKKSF4Ta" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 no-underline px-3 py-2 text-[11px] text-slate-500 hover:text-slate-300 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
              Join our Discord
            </a>
          </div>
        </div>
      {variant === "bar" && (
        <div className="relative z-10 flex items-center justify-between mb-4 gap-2">
          <button onClick={() => setNavOpen(true)} className="text-slate-400 hover:text-white transition p-1 shrink-0" title="Menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <div className="flex items-center gap-2 shrink-0">
            <img src="/icons/branding/cgn-skull.png" alt="CGN" className="w-6 h-6"/>
            <span className="text-xs text-slate-400 tracking-widest uppercase">Cognition {"{CGN}"}</span>
          </div>
          <DiscordWidget variant="corner" />
        </div>
      )}
      {variant === "icon" && (
        <button onClick={() => setNavOpen(true)} className="text-slate-400 hover:text-white transition p-1" title="Menu">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      )}
    </>
  );
}

// ─── Shared footer — home button, branded Discord server link, contrast
// toggle + FAQ — used on every top-level view. onNavigateHome is optional;
// when omitted, the home button navigates via a hard hash reset.
function AppFooter({ onNavigateHome, showHome = true }) {
  function goHome() {
    if (onNavigateHome) { onNavigateHome(); return; }
    if (typeof window !== "undefined") window.location.href = "/";
  }
  return (
    <div className="relative z-10 w-full py-4 flex items-center px-4">
      <div className="w-16 shrink-0 flex items-center">
        {showHome && (
          <button onClick={goHome} className="text-slate-500 hover:text-slate-300 transition p-1" title="Home">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
          </button>
        )}
      </div>
      <div className="flex-1 flex justify-center">
        <a href="https://discord.gg/czqKKSF4Ta" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 no-underline">
          <img src="/icons/branding/cgn-skull.png" alt="CGN" className="w-5 h-5"/>
          <span className="text-[11px] text-slate-400 tracking-widest">Cognition {"{CGN}"}</span>
        </a>
      </div>
      <div className="flex items-center gap-2">
        <ContrastToggle />
        <FaqButton />
      </div>
    </div>
  );
}

// ─── CWL countdown — always counts to the 1st of next month, 00:00 UTC ─────
// CWL war week begins on the 1st of every calendar month. If currently within
// the first 8 days (live war week), shows a "live" state instead of counting
// down to the same month's already-passed start.
// ─── Side Wars homepage tile — only renders when active wars exist ────────────
function SideWarsSection() {
  const [wars, setWars] = useState([]);

  useEffect(() => {
    fetch("/api/side-wars")
      .then(r => r.json())
      .then(d => setWars(d.wars || []))
      .catch(() => setWars([]));
  }, []);

  if (wars.length === 0) return null;

  function formatStartTime(iso) {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      weekday: "short", day: "numeric", month: "short",
      hour: "2-digit", minute: "2-digit", timeZoneName: "short",
    });
  }

  return (
    <>
      {wars.map(war => (
        <div key={war.id}
          className="rounded-3xl border border-pink-500/20 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
          {/* Ore accent strip */}
          <div className="relative h-16 bg-gradient-to-r from-pink-500/[0.08] to-purple-500/[0.08] flex items-center px-5 gap-3">
            <img src={BRANDING.warshield} alt="Side War" className="w-10 h-10 shrink-0"/>
            <div>
              <p className="text-[9px] text-pink-400 uppercase tracking-widest font-semibold">Side War · Ore War</p>
              <p className="text-sm font-semibold text-white leading-tight">{war.clan_name}</p>
            </div>
            <img src={BRANDING.ores} alt="Ores" className="absolute right-0 bottom-0 h-14 w-auto object-contain opacity-90 pointer-events-none"/>
          </div>
          {/* War details */}
          <div className="px-5 py-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">Start Time</p>
              <p className="text-xs text-slate-300">{formatStartTime(war.start_time)}</p>
            </div>
            <a href={war.clan_link} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-pink-500/[0.1] text-pink-300 border border-pink-500/30 hover:bg-pink-500/20 hover:border-pink-400 transition shrink-0">
              Join Clan
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </a>
          </div>
        </div>
      ))}
    </>
  );
}

function CwlCountdown() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // CWL war week begins exactly when the new season starts: the 1st of the
  // month at 08:00 UTC (Clash of Clans' confirmed season-start time, not
  // midnight). War week runs the 1st-8th, so within that window CWL is live.
  const utcNow = new Date(now.toISOString());
  const thisMonthStart = new Date(Date.UTC(utcNow.getUTCFullYear(), utcNow.getUTCMonth(), 1, 8, 0, 0));
  const isLive = utcNow >= thisMonthStart && utcNow < new Date(thisMonthStart.getTime() + 8 * 24 * 60 * 60 * 1000);

  let label, timeLeft;
  if (isLive) {
    label = "CWL War Week";
    timeLeft = null;
  } else {
    const nextStart = utcNow < thisMonthStart
      ? thisMonthStart
      : new Date(Date.UTC(utcNow.getUTCFullYear(), utcNow.getUTCMonth() + 1, 1, 8, 0, 0));
    const msLeft = Math.max(0, nextStart - utcNow);
    const totalSeconds = Math.floor(msLeft / 1000);
    timeLeft = {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
    };
    label = "Next CWL Starts In";
  }

  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">{label}</p>
      {isLive ? (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
          <span className="text-3xl font-thin tracking-widest text-green-300">Live Now</span>
        </div>
      ) : (
        <div className="flex items-baseline gap-3">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-thin tracking-widest text-purple-300 tabular-nums">{timeLeft.days}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">days</span>
          </div>
          <span className="text-2xl text-slate-600 font-thin">:</span>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-thin tracking-widest text-purple-300 tabular-nums">{String(timeLeft.hours).padStart(2,"0")}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">hrs</span>
          </div>
          <span className="text-2xl text-slate-600 font-thin">:</span>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-thin tracking-widest text-purple-300 tabular-nums">{String(timeLeft.minutes).padStart(2,"0")}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">min</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stats highlight reel — rotates featured stat each load ────────────────
function StatsHighlightReel() {
  const [data, setData] = useState(null);
  const [featureType] = useState(() => {
    const types = ["stars", "efficiency", "threeStarRate", "clutch"];
    return types[Math.floor(Math.random() * types.length)];
  });

  useEffect(() => {
    fetch("/api/leaderboard").then(r => r.json()).then(d => setData(d.stats || [])).catch(() => setData([]));
  }, []);

  if (!data) {
    return <div className="h-24 rounded-2xl bg-white/[0.03] animate-pulse"/>;
  }
  if (data.length === 0) {
    return <p className="text-slate-700 text-xs text-center py-4">No stats yet this season</p>;
  }

  const withAtks = data.filter(p => p.attacks_used > 0);
  let featured, statLabel, statValue, statColour;
  if (featureType === "efficiency" && withAtks.length) {
    featured = [...withAtks].sort((a,b) => parseFloat(b.efficiency||0) - parseFloat(a.efficiency||0))[0];
    statLabel = "Top Atk EFF"; statValue = parseFloat(featured.efficiency).toFixed(2); statColour = "text-purple-300";
  } else if (featureType === "threeStarRate" && withAtks.filter(p=>p.three_star_rate!=null).length) {
    featured = [...withAtks].filter(p=>p.three_star_rate!=null).sort((a,b) => parseFloat(b.three_star_rate||0) - parseFloat(a.three_star_rate||0))[0];
    statLabel = "Top 3★ Rate"; statValue = parseFloat(featured.three_star_rate).toFixed(0)+"%"; statColour = "text-green-300";
  } else if (featureType === "clutch" && withAtks.filter(p=>p.clutch_rate!=null).length) {
    featured = [...withAtks].filter(p=>p.clutch_rate!=null).sort((a,b) => parseFloat(b.clutch_rate||0) - parseFloat(a.clutch_rate||0))[0];
    statLabel = "Clutch King"; statValue = parseFloat(featured.clutch_rate).toFixed(2); statColour = "text-purple-300";
  } else {
    featured = [...data].sort((a,b) => (b.stars_earned||0) - (a.stars_earned||0))[0];
    statLabel = "Most Stars"; statValue = featured.stars_earned; statColour = "text-green-300";
  }

  if (!featured) return <p className="text-slate-700 text-xs text-center py-4">No stats yet this season</p>;

  return (
    <div>
      <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-2">Season Highlight</p>
      <div className="flex items-center gap-3 mb-3">
        {TH_ICONS[String(featured.town_hall_level)] && (
          <img src={TH_ICONS[String(featured.town_hall_level)]} alt="" className="w-9 h-9 shrink-0"/>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{featured.player_name}</p>
          <p className="text-[10px] text-slate-500">{statLabel}</p>
        </div>
        <span className={`ml-auto text-xl font-thin ${statColour}`}>{statValue}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-purple-500/[0.06] border border-purple-500/20 p-2">
          <div className="flex items-center gap-1 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            <p className="text-[7px] text-slate-500 uppercase tracking-widest">Atk EFF</p>
          </div>
          <p className="text-xs font-bold text-purple-300">{featured.efficiency != null ? parseFloat(featured.efficiency).toFixed(2) : "—"}</p>
        </div>
        <div className="rounded-xl bg-purple-500/[0.06] border border-purple-500/20 p-2">
          <div className="flex items-center gap-1 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/></svg>
            <p className="text-[7px] text-slate-500 uppercase tracking-widest">Clutch</p>
          </div>
          <p className="text-xs font-bold text-purple-300">{featured.clutch_rate != null ? parseFloat(featured.clutch_rate).toFixed(2) : "—"}</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [page, setPage] = useState("home"); // "home" | "roster" | "leaderboard" | "history" | "recap" | "warintel"
  useEffect(() => {
    const syncFromHash = () => {
      const hash = decodeURIComponent(window.location.hash.replace("#", ""));
      if (["roster","leaderboard","history","recap","warintel"].includes(hash)) {
        setPage(hash);
      } else {
        setPage("home");
      }
    };
    syncFromHash();
    window.addEventListener("popstate", syncFromHash);
    return () => window.removeEventListener("popstate", syncFromHash);
  }, []);

  function navigate(key) {
    window.history.pushState({}, "", key === "home" ? window.location.pathname : `#${key}`);
    setPage(key);
  }

  if (page === "roster") {
    return <RosterHubView onNavigateHome={() => navigate("home")} />;
  }
  if (page === "leaderboard") {
    return <LeaderboardView onBack={() => navigate("home")} />;
  }
  if (page === "history") {
    return <HistoryView onBack={() => navigate("home")} />;
  }
  if (page === "recap") {
    return <RecapView onBack={() => navigate("home")} />;
  }
  if (page === "warintel") {
    return <WarIntelView onBack={() => navigate("home")} />;
  }

  return (
    <main className="min-h-screen overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      </div>

      <AppHeader variant="bar"/>

      {/* Brand hero */}
      <div className="relative z-10 text-center mb-6">
        <img src={BRANDING.cwlhub} alt="CWL Hub" className="w-40 h-40 mx-auto"/>
      </div>

      <div className="relative z-10 space-y-4 max-w-lg mx-auto">

        {/* Countdown — standalone, centred */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
          <CwlCountdown/>
        </div>

        {/* Side Wars — only renders when admin has activated one or more */}
        <SideWarsSection/>

        {/* Sign Up — explicit instruction + direct link */}
        <a href="/signup"
          className="block rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 hover:bg-white/[0.06] hover:border-purple-500/30 transition group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/[0.1] border border-purple-500/20 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Sign Up for CWL</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Link your accounts &amp; join the player pool</p>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500 group-hover:text-purple-300 group-hover:translate-x-0.5 transition shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </a>

        {/* Rosters — explicit instruction + direct link to Roster hub */}
        <button onClick={() => navigate("roster")}
          className="w-full text-left rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 hover:bg-white/[0.06] hover:border-purple-500/30 transition group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/[0.1] border border-purple-500/20 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">View Published Rosters</p>
                <p className="text-[11px] text-slate-500 mt-0.5">See clan rosters &amp; league standings</p>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500 group-hover:text-purple-300 group-hover:translate-x-0.5 transition shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </button>

        {/* Stats gateway — highlight reel signals depth, clearly tappable */}
        <button onClick={() => navigate("leaderboard")}
          className="w-full text-left rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 hover:bg-white/[0.06] hover:border-purple-500/30 transition group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">Stats &amp; Overview</span>
            <span className="flex items-center gap-1 text-[10px] text-purple-400 group-hover:text-purple-300 transition">
              View Leaderboard
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 group-hover:translate-x-0.5 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </span>
          </div>
          <StatsHighlightReel/>
        </button>
      </div>
      <AppFooter showHome={false}/>
    </main>
  );
}

function RosterHubView({ onNavigateHome }) {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedClan, setSelectedClan] = useState(null);
  const [statView, setStatView] = useState(null); // null | "players" | "clans" | "avgth" | "leaderboard"
const [rosterSeasons, setRosterSeasons] = useState([]);

// Load roster history seasons on mount for historical filters
useEffect(() => {
  fetch("/api/roster-history")
    .then(r => r.json())
    .then(d => setRosterSeasons(d.seasons || []))
    .catch(() => {});
}, []);
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

    // Stat tile views use reserved hash names; "roster" or empty hash means
    // this hub's own home state; anything else is treated as a clan name.
    if (hash === "players" || hash === "clans" || hash === "avgth" || hash === "history" || hash === "leaderboard" || hash === "recap" || hash === "warintel") {
      setStatView(hash);
      setSelectedClan(null);
      setHighlightedAccount(null);
    } else if (hash === "roster" || !hash) {
      setStatView(null);
      setSelectedClan(null);
      setHighlightedAccount(null);
    } else {
      setStatView(null);
      setSelectedClan(hash);
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
    return <PlayersView players={players} rosterSeasons={rosterSeasons} onBack={() => { window.history.pushState({}, "", window.location.pathname); setStatView(null); }} />;
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
  if (statView === "warintel") {
    return <WarIntelView onBack={() => { window.history.pushState({}, "", window.location.pathname); setStatView(null); }} />;
  }
  if (statView === "recap") {
    return <RecapView onBack={() => { window.history.pushState({}, "", window.location.pathname); setStatView(null); }} />;
  }

  if (selectedClan) {
  const rank = clanPlayers?.[0]?.cwlRank ?? "unranked";
  const season = clanPlayers[0]?.season || "";
  const clanLink = clanPlayers[0]?.clanLink || "";
  const format = clanPlayers[0]?.cwlFormat || (clanPlayers.length >= 30 ? "30v30" : "15v15");
  return (
    <main className="min-h-screen overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      </div>
      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 mb-4 flex flex-col items-center text-center gap-2">
        <img src={CWL_ICONS[rank] || CWL_ICONS["unranked"]} alt={rank} className="w-12 h-12"/>
        <h1 className="text-2xl font-thin tracking-widest">{selectedClan}</h1>
        <p className="text-xs text-slate-400">{format}</p>
        {clanLink && (
          <a href={clanLink} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-transparent text-purple-400 border border-purple-500/40 hover:border-purple-400 transition mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
            Open Clan
          </a>
        )}
      </div>
      <div className="relative z-10 space-y-2">
        {[...clanPlayers]
          .sort((a, b) => {
            const STATUS_ORDER = { confirmed: 0, registered: 1, substitute: 2 };
            const sa = STATUS_ORDER[a.status?.toLowerCase()] ?? 1;
            const sb = STATUS_ORDER[b.status?.toLowerCase()] ?? 1;
            if (sa !== sb) return sa - sb;
            return Number(b.townHall || 0) - Number(a.townHall || 0);
          })
          .map((player, index) => (
          <div key={`${player.clan}-${player.account}-${player.position}`}
            onClick={() => window.open(`/player/${(player.playerTag||"").replace("#","")}`, "_blank")}
            className={`rounded-2xl border backdrop-blur-xl p-3 transition cursor-pointer
              ${highlightedAccount && player.playerTag === highlightedAccount
                ? "border-purple-500/40 bg-purple-500/10"
                : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]"
              }`}>
            <div className="flex items-center w-full justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xs text-slate-600 w-5 text-right shrink-0">{index + 1}</span>
                {TH_ICONS[player.townHall] && (
                  <img src={TH_ICONS[player.townHall]} alt={`TH${player.townHall}`} className="w-8 h-8 shrink-0"/>
                )}
                <span className="text-sm font-semibold text-white truncate">{player.account}</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0
                ${player.status?.toLowerCase() === "confirmed" || player.status?.toLowerCase() === "active"
                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                  : player.status?.toLowerCase() === "substitute"
                  ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
                  : player.status?.toLowerCase() === "benched"
                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                  : player.status?.toLowerCase() === "inactive"
                  ? "bg-red-500/10 text-red-400 border-red-500/30"
                  : "bg-white/[0.04] text-slate-500 border-white/10"
                }`}>
                {player.status?.toLowerCase() === "registered" ? "Registered"
                  : player.status?.toLowerCase() === "confirmed" ? "Confirmed"
                  : player.status?.toLowerCase() === "substitute" ? "Substitute"
                  : player.status || "Registered"}
              </span>
            </div>
          </div>
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

<AppHeader variant="bar"/>

    <motion.div
  initial={{ opacity: 0, y: 15 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
  className="relative z-20 mb-4 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 text-center"
>

  <h1 className="text-2xl font-thin tracking-widest">
    {currentSeason || players[0]?.season || "CWL Hub"}
  </h1>

  <p className="text-slate-500 text-xs mt-1">
    Cognition Collective
  </p>

  <div className="mt-4">
    <Link
      href="/signup"
      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-transparent text-purple-400 border border-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.15)] hover:shadow-[0_0_18px_rgba(168,85,247,0.28)] hover:border-purple-400 hover:text-purple-300 transition font-semibold text-sm"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Sign Up
    </Link>
  </div>

  <div className="mt-4 relative z-20 max-w-xs mx-auto text-left">
    <div className="relative">
      <input
        type="text"
        placeholder="Search players..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition"
      />
      {search && (
        <button onClick={() => setSearch("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center bg-white/[0.08] text-slate-400 hover:text-white transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      )}
      {search && searchResults.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-3xl border border-white/10 bg-[#0d1424]/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50">
          {searchResults.map(player => (
            <div key={`${player.clan}-${player.account}-${player.position}`}
              onClick={() => { window.history.pushState({}, "", `#${player.clan}`); setHighlightedAccount(player.playerTag); setSelectedClan(player.clan); setSearch(""); }}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.05] transition border-b border-white/[0.04] last:border-0">
              {TH_ICONS[String(player.townHall)] && (
                <img src={TH_ICONS[String(player.townHall)]} alt={`TH${player.townHall}`} className="w-7 h-7 shrink-0"/>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{player.account}</p>
                <p className="text-[10px] text-slate-500 truncate">{player.clan}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {player.status?.toLowerCase() === "confirmed" && (
                  <span className="w-2 h-2 rounded-full bg-green-400 shrink-0"/>
                )}
                {player.status?.toLowerCase() === "substitute" && (
                  <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0"/>
                )}
                {player.clanLink && (
                  <a href={player.clanLink} target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-600/20 text-purple-300 border border-purple-500/20 hover:bg-purple-600/40 hover:text-white transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                    Open
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {search && searchResults.length === 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-3xl border border-white/10 bg-[#0d1424]/95 backdrop-blur-xl shadow-2xl p-4 text-center z-50">
          <p className="text-xs text-slate-600">No players found</p>
        </div>
      )}
    </div>
  </div>

</motion.div>

    <div className="space-y-2 mb-8 relative z-10">
      {/* Players + Clans + Avg TH — not duplicated elsewhere in the app */}
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


    <AppFooter onNavigateHome={onNavigateHome}/>
  </main>
);}
