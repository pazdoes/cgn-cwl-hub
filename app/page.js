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
  const [selectedStat, setSelectedStat] = useState("efficiency");
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
  const minVal = allVals.length ? Math.min(...allVals) : 0;
  const maxVal = allVals.length ? Math.max(...allVals) : 1;
  const valRange = maxVal - minVal || 1;

  function xPos(season) {
    const idx = validSeasons.indexOf(season);
    return PAD_L + (validSeasons.length > 1 ? idx * xStep : plotW / 2);
  }
  function yPos(val) {
    if (isRankStat) {
      // Rank: lower index = better, so invert Y so best (0) is at top
      return PAD_T + (val / (CWL_RANK_ORDER_HIST.length)) * plotH;
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
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full min-w-[280px]">
            {[0, 0.25, 0.5, 0.75, 1].map(pct => {
              const y = PAD_T + pct * plotH;
              let label;
              if (isRankStat) {
                const idx = Math.round(pct * (CWL_RANK_ORDER_HIST.length - 1));
                label = CWL_RANK_ORDER_HIST[idx]?.replace(" I","I").replace(" II","II").replace(" III","III") || "";
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
      )}
    </div>
  );
}

// ── Clan Performance History Chart ────────────────────────────────────────────
const CLAN_COLORS_CHART = ["#a78bfa", "#34d399", "#fb923c"];
const CLAN_STAT_OPTIONS = [
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
  const [selectedStat, setSelectedStat] = useState("cwl_rank");
  const isRankStat = selectedStat === "cwl_rank";

  // All unique clan names from history
  const allClans = history ? [...new Set(history.map(r => r.clan_name))].sort() : [];

  // All seasons sorted chronologically
  const allSeasons = history ? [...new Set(history.map(r => r.season))].sort((a, b) => {
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const [am, ay] = a.split(" "); const [bm, by] = b.split(" ");
    return parseInt(ay) - parseInt(by) || months.indexOf(am) - months.indexOf(bm);
  }) : [];

  // Search
  useEffect(() => {
    if (!clanSearch.trim()) { setSearchResults([]); return; }
    const q = clanSearch.toLowerCase();
    setSearchResults(allClans.filter(c =>
      c.toLowerCase().includes(q) && !trackedClans.find(t => t.name === c)
    ).slice(0, 6));
  }, [clanSearch, allClans, trackedClans]);

  function buildClanData(clanName) {
    return allSeasons.map(season => {
      const row = history?.find(r => r.clan_name === clanName && r.season === season);
      if (!row) return { season, value: null, displayValue: null };
      if (isRankStat || selectedStat === "cwl_rank") {
        const rank = row.cwl_rank;
        const idx = CWL_RANK_LIST.indexOf(rank);
        return { season, value: idx === -1 ? null : idx, displayValue: rank || null };
      }
      const v = parseFloat(row[selectedStat]);
      return { season, value: isNaN(v) ? null : v, displayValue: isNaN(v) ? null : v };
    });
  }

  function addClan(clanName) {
    if (trackedClans.length >= 3) return;
    if (trackedClans.find(c => c.name === clanName)) return;
    setTrackedClans(prev => [...prev, { name: clanName, data: buildClanData(clanName) }]);
    setClanSearch(""); setSearchResults([]);
  }

  function removeClan(name) {
    setTrackedClans(prev => prev.filter(c => c.name !== name));
  }

  useEffect(() => {
    if (!history || trackedClans.length === 0) return;
    setTrackedClans(prev => prev.map(c => ({
      ...c,
      data: buildClanData(c.name),
    })));
  }, [selectedStat, history]);

  // Chart
  const CHART_W = 320, CHART_H = 180;
  const PAD_L = 52, PAD_R = 12, PAD_T = 12, PAD_B = 28;
  const plotW = CHART_W - PAD_L - PAD_R;
  const plotH = CHART_H - PAD_T - PAD_B;

  const validSeasons = allSeasons.filter(s =>
    trackedClans.some(c => c.data.find(d => d.season === s && d.value !== null))
  );
  const xStep = validSeasons.length > 1 ? plotW / (validSeasons.length - 1) : plotW / 2;

  const allVals = trackedClans.flatMap(c => c.data.map(d => d.value)).filter(v => v !== null);
  const minVal = allVals.length ? Math.min(...allVals) : 0;
  const maxVal = allVals.length ? Math.max(...allVals) : 1;
  const valRange = maxVal - minVal || 1;

  function xPos(season) {
    const idx = validSeasons.indexOf(season);
    return PAD_L + (validSeasons.length > 1 ? idx * xStep : plotW / 2);
  }
  function yPos(val) {
    if (selectedStat === "cwl_rank") {
      return PAD_T + (val / (CWL_RANK_LIST.length - 1)) * plotH;
    }
    return PAD_T + plotH - ((val - minVal) / valRange) * plotH;
  }

  // Group stat options for select
  const groups = [...new Set(CLAN_STAT_OPTIONS.map(o => o.group))];

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
                {searchResults.map(c => (
                  <button key={c} type="button" onClick={() => addClan(c)}
                    className="w-full px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white transition text-left">
                    {c}
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
            <div key={c.name} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CLAN_COLORS_CHART[i] }}/>
              <span className="text-xs text-slate-300 max-w-[100px] truncate">{c.name.split(" ")[0]}</span>
              <button onClick={() => removeClan(c.name)} className="text-slate-600 hover:text-red-400 transition text-[10px] ml-0.5">✕</button>
            </div>
          ))}
        </div>
      )}

      {trackedClans.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-slate-700 text-xs text-center">
          Search for a clan above to begin tracking
        </div>
      ) : validSeasons.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-slate-700 text-xs">No data for selected clans</div>
      ) : (
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full min-w-[280px]">
            {[0, 0.25, 0.5, 0.75, 1].map(pct => {
              const y = PAD_T + pct * plotH;
              let label;
              if (selectedStat === "cwl_rank") {
                const idx = Math.round(pct * (CWL_RANK_LIST.length - 1));
                label = CWL_RANK_LIST[idx]?.replace(" I"," I").replace(" II"," II").replace(" III"," III") || "";
                // Shorten
                label = label.replace("Champion","Champ").replace("Crystal","Cryst").replace("Silver","Silv").replace("Bronze","Brnz").replace("Master","Mastr");
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
            {trackedClans.map((c, ci) => {
              const color = CLAN_COLORS_CHART[ci];
              const pts = c.data.filter(d => d.value !== null && validSeasons.includes(d.season));
              if (!pts.length) return null;
              const d = pts.map((pt, j) => `${j === 0 ? "M" : "L"} ${xPos(pt.season)} ${yPos(pt.value)}`).join(" ");
              return (
                <g key={c.name}>
                  <path d={d} fill="none" stroke={color} strokeWidth="2" opacity="0.9" strokeLinecap="round" strokeLinejoin="round"/>
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
      )}
    </div>
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
        const allSeasons = (d.seasons || []).sort((a, b) => {
          const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
          const [am, ay] = a.split(" "); const [bm, by] = b.split(" ");
          return parseInt(ay) - parseInt(by) || months.indexOf(am) - months.indexOf(bm);
        });
        setSeasons(allSeasons);
        const rows = [];
        for (const s of allSeasons) {
          try {
            const r = await fetch(`/api/leaderboard?season=${encodeURIComponent(s)}`);
            const sd = await r.json();
            (sd.stats || []).forEach(p => rows.push({ ...p, season: s }));
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

      {/* Hero card — flush to top, no back button */}
      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 mb-4 text-center">
        <h1 className="text-2xl font-thin tracking-widest mb-1">History</h1>
        <p className="text-slate-500 text-xs mb-4">CWL performance records by season</p>

        {/* Tab indicator dots */}
        <div className="flex items-center justify-center gap-1.5 mb-3">
          <span className={`w-1.5 h-1.5 rounded-full transition ${tab === "rank" ? "bg-purple-400" : "bg-white/20"}`}/>
          <span className={`w-1.5 h-1.5 rounded-full transition ${tab === "player" ? "bg-purple-400" : "bg-white/20"}`}/>
        </div>

        {/* Arrow toggles */}
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setTab("rank")} className="text-slate-500 hover:text-slate-300 transition p-1" title="Clan CWL Rank">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <span className="text-[10px] text-slate-600 uppercase tracking-widest select-none min-w-[100px]">
            {tab === "rank" ? "Clan CWL Rank" : "Player Performance"}
          </span>
          <button onClick={() => setTab("player")} className="text-slate-500 hover:text-slate-300 transition p-1" title="Player Performance">
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
    </main>
  );
}


export default function Home() {

  const [players, setPlayers] = useState([]);
const [selectedClan, setSelectedClan] = useState(null);
const [search, setSearch] = useState("");

// ─── CWL player performance leaderboard ────────────────────────────────────

function MiniPie({ three = 0, two = 0, one = 0, zero = 0 }) {
  const total = three + two + one + zero;
  if (total === 0) return <span className="text-slate-700 text-[10px]">—</span>;
  const [expanded, setExpanded] = useState(false);
  function buildPie(size) {
    const cx = size/2, cy = size/2, r = size/2-1;
    const slices = [
      { value: three, color: "#86efac" },
      { value: two,   color: "#a78bfa" },
      { value: one,   color: "#fbbf24" },
      { value: zero,  color: "#475569" },
    ].filter(s => s.value > 0);
    let startAngle = -Math.PI/2;
    const paths = slices.map((s,i) => {
      const angle = (s.value/total)*2*Math.PI;
      const endAngle = startAngle+angle;
      const x1=cx+r*Math.cos(startAngle), y1=cy+r*Math.sin(startAngle);
      const x2=cx+r*Math.cos(endAngle),   y2=cy+r*Math.sin(endAngle);
      const d=`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${angle>Math.PI?1:0} 1 ${x2} ${y2} Z`;
      startAngle=endAngle;
      return <path key={i} d={d} fill={s.color}/>;
    });
    return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{paths}</svg>;
  }
  return (
    <div className="relative inline-flex items-center justify-center">
      <button type="button" onClick={e=>{e.stopPropagation();setExpanded(v=>!v)}} className="flex items-center justify-center rounded-full hover:opacity-80 transition">
        {buildPie(20)}
      </button>
      {expanded && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 rounded-2xl border border-white/10 bg-[#0d1424]/95 backdrop-blur-xl p-3 shadow-xl min-w-[110px]" onClick={e=>e.stopPropagation()}>
          <div className="flex justify-center mb-2">{buildPie(56)}</div>
          <div className="space-y-1 text-[10px]">
            {[["#86efac","3★",three],["#a78bfa","2★",two],["#fbbf24","1★",one],["#475569","0★",zero]].map(([col,lbl,val])=>(
              <div key={lbl} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{background:col}}/>{lbl}</span>
                <span className="text-white font-semibold">{val}</span>
              </div>
            ))}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white/10"/>
        </div>
      )}
    </div>
  );
}

function RankBadge({ rank }) {
  if (rank === 1) return <span className="text-base">🥇</span>;
  if (rank === 2) return <span className="text-base">🥈</span>;
  if (rank === 3) return <span className="text-base">🥉</span>;
  return <span className="text-xs text-slate-500 font-mono w-5 text-center">{rank}</span>;
}

function StatPill({ label, value, colour = "text-slate-300" }) {
  return (
    <div className="flex flex-col items-center min-w-[36px]">
      <span className={`text-sm font-semibold ${colour}`}>{value}</span>
      <span className="text-[9px] text-slate-600 uppercase tracking-wide">{label}</span>
    </div>
  );
}

// Star icon row — renders n filled stars
function StarIcons({ count, colour }) {
  return (
    <div className="flex items-center justify-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 ${colour}`} viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

// Large pie chart for breakdown view
function LargePie({ three = 0, two = 0, one = 0, zero = 0, size = 80 }) {
  const total = three + two + one + zero;
  if (total === 0) return <div className="flex items-center justify-center" style={{width:size,height:size}}><span className="text-slate-600 text-xs">No data</span></div>;
  const cx = size/2, cy = size/2, r = size/2 - 2;
  const slices = [
    { value: three, color: "#86efac" },
    { value: two,   color: "#a78bfa" },
    { value: one,   color: "#fbbf24" },
    { value: zero,  color: "#475569" },
  ].filter(s => s.value > 0);
  let startAngle = -Math.PI/2;
  const paths = slices.map((s, i) => {
    const angle = (s.value/total)*2*Math.PI;
    const endAngle = startAngle + angle;
    const x1=cx+r*Math.cos(startAngle), y1=cy+r*Math.sin(startAngle);
    const x2=cx+r*Math.cos(endAngle),   y2=cy+r*Math.sin(endAngle);
    const d=`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${angle>Math.PI?1:0} 1 ${x2} ${y2} Z`;
    startAngle = endAngle;
    return <path key={i} d={d} fill={s.color}/>;
  });
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{paths}</svg>;
}

function PlayerCard({ p, rank, isExpanded, onToggle }) {
  const [cardView, setCardView] = useState("stats"); // "stats" | "breakdown"

  const rankBorderClass = rank === 1 ? "border-yellow-400/40 shadow-yellow-400/10"
    : rank === 2 ? "border-slate-300/30 shadow-slate-300/10"
    : rank === 3 ? "border-amber-600/40 shadow-amber-600/10"
    : "border-white/10";

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
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-white truncate">{p.player_name}</p>
          <p className="text-[10px] text-slate-500 truncate">{p.clan_name.split(" ")[0]}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StatPill label="EFF" value={parseFloat(p.efficiency).toFixed(2)} colour="text-purple-300" />
          <StatPill label="Stars" value={p.stars_earned} colour="text-green-300" />
          <StatPill label="Def EFF" value={p.defence_efficiency ? parseFloat(p.defence_efficiency).toFixed(2) : "—"} colour="text-blue-300" />
          <StatPill label="Def ★" value={p.stars_conceded} colour="text-slate-400" />
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
              {/* Attack */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Attack</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="rounded-xl bg-white/[0.04] p-2 text-center">
                    <p className="text-sm font-bold text-purple-300">{parseFloat(p.efficiency).toFixed(2)}</p>
                    <p className="text-[9px] text-slate-600 mt-0.5">Efficiency</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-2 text-center">
                    <p className="text-sm font-bold text-green-300">{p.stars_earned}</p>
                    <p className="text-[9px] text-slate-600 mt-0.5">Stars</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-2 text-center">
                    <p className="text-sm font-bold text-slate-300">{parseFloat(p.destruction_pct).toFixed(1)}%</p>
                    <p className="text-[9px] text-slate-600 mt-0.5">Dest %</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-2 text-center flex flex-col items-center justify-center gap-0.5">
                    <MiniPie three={p.three_stars||0} two={p.two_stars||0} one={p.one_stars||0} zero={p.zero_stars||0}/>
                    <p className="text-[9px] text-slate-600">Breakdown</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="rounded-xl bg-white/[0.04] p-2 text-center">
                    <p className="text-sm font-bold text-slate-300">{p.attacks_used}<span className="text-slate-600 text-xs">/{p.attacks_available}</span></p>
                    <p className="text-[9px] text-slate-600 mt-0.5">Attacks</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-2 text-center">
                    <p className={`text-sm font-bold ${p.missed_attacks > 0 ? "text-red-400" : "text-slate-500"}`}>{p.missed_attacks}</p>
                    <p className="text-[9px] text-slate-600 mt-0.5">Missed</p>
                  </div>
                </div>
              </div>
              {/* Defence */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Defence</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="rounded-xl bg-white/[0.04] p-2 text-center">
                    <p className="text-sm font-bold text-blue-300">{p.defence_efficiency ? parseFloat(p.defence_efficiency).toFixed(2) : "—"}</p>
                    <p className="text-[9px] text-slate-600 mt-0.5">Def EFF</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-2 text-center">
                    <p className="text-sm font-bold text-slate-400">{p.stars_conceded}</p>
                    <p className="text-[9px] text-slate-600 mt-0.5">Stars Given</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-2 text-center">
                    <p className="text-sm font-bold text-slate-400">{parseFloat(p.defence_pct).toFixed(1)}%</p>
                    <p className="text-[9px] text-slate-600 mt-0.5">Dest Given</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-2 text-center flex flex-col items-center justify-center gap-0.5">
                    <MiniPie three={p.three_stars_conceded||0} two={p.two_stars_conceded||0} one={p.one_stars_conceded||0} zero={p.zero_stars_conceded||0}/>
                    <p className="text-[9px] text-slate-600">Breakdown</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── BREAKDOWN VIEW ── */}
          {cardView === "breakdown" && (
            <div className="space-y-5 pt-2">

              {/* Attack breakdown */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Attack Breakdown</span>
                </div>
                <div className="flex items-start gap-4">
                  {/* Large pie */}
                  <div className="shrink-0">
                    <LargePie three={p.three_stars||0} two={p.two_stars||0} one={p.one_stars||0} zero={p.zero_stars||0} size={80}/>
                  </div>
                  {/* Star counts — match pie width, one row */}
                  <div className="flex-1 flex flex-col justify-center gap-2">
                    {/* 3 star */}
                    <div className="flex items-center justify-between">
                      <StarIcons count={3} colour="text-green-300"/>
                      <span className="text-sm font-bold text-green-300">{p.three_stars ?? "—"}</span>
                    </div>
                    {/* 2 star */}
                    <div className="flex items-center justify-between">
                      <StarIcons count={2} colour="text-purple-400"/>
                      <span className="text-sm font-bold text-purple-400">{p.two_stars ?? "—"}</span>
                    </div>
                    {/* 1 star */}
                    <div className="flex items-center justify-between">
                      <StarIcons count={1} colour="text-amber-400"/>
                      <span className="text-sm font-bold text-amber-400">{p.one_stars ?? "—"}</span>
                    </div>
                    {/* 0 star */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-600">0★</span>
                      <span className="text-sm font-bold text-slate-500">{p.zero_stars ?? "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10"/>

              {/* Defence breakdown — inverse order (1★ 2★ 3★ = better to worse) */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Defence Breakdown</span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <LargePie three={p.three_stars_conceded||0} two={p.two_stars_conceded||0} one={p.one_stars_conceded||0} zero={p.zero_stars_conceded||0} size={80}/>
                  </div>
                  <div className="flex-1 flex flex-col justify-center gap-2">
                    {/* Inverse order for defence: 0★ (best) → 3★ (worst) */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-600">0★</span>
                      <span className="text-sm font-bold text-slate-500">{p.zero_stars_conceded ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <StarIcons count={1} colour="text-amber-400"/>
                      <span className="text-sm font-bold text-amber-400">{p.one_stars_conceded ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <StarIcons count={2} colour="text-purple-400"/>
                      <span className="text-sm font-bold text-purple-400">{p.two_stars_conceded ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <StarIcons count={3} colour="text-green-300"/>
                      <span className="text-sm font-bold text-green-300">{p.three_stars_conceded ?? "—"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View toggle — minimal bare chevrons */}
          <div className="flex items-center justify-center gap-4 pt-3 mt-2 border-t border-white/[0.06]">
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

function LeaderboardView({ onBack }) {
  const [lbTab, setLbTab] = useState("player"); // "player" | "clan"
  const [data, setData] = useState(null);
  const [allSeasonData, setAllSeasonData] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("all");
  const [clanFilter, setClanFilter] = useState("all");
  const [sortBy, setSortBy] = useState("efficiency");
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
        const allData = [];
        for (const s of allSeasons) {
          try {
            const r2 = await fetch(`/api/leaderboard?season=${encodeURIComponent(s)}`);
            const d2 = await r2.json();
            allData.push(...(d2.stats || []));
          } catch {}
        }
        setAllSeasonData(allData);
      })
      .catch(() => {});
  }, []);
    // Fetch clan history for clan leaderboard
    fetch("/api/history")
      .then(r => r.json())
      .then(d => setClanHistory(d.history || []))
      .catch(() => setClanHistory([]));

  function toggleExpand(tag) {
    setExpandedTag(prev => prev === tag ? null : tag);
  }
  function toggleExpandClan(name) {
    setExpandedClan(prev => prev === name ? null : name);
  }

  const CLAN_SORT_OPTIONS = [
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
    // Aggregate across seasons
    const map = {};
    for (const r of rows) {
      if (!map[r.clan_name]) map[r.clan_name] = { clan_name: r.clan_name, cwl_rank: r.cwl_rank, wars_won:0,wars_lost:0,wars_drawn:0, total_stars:0,total_stars_conceded:0,total_attacks_used:0,total_attacks_available:0,total_attacks_missed:0, three_stars_clan:0,two_stars_clan:0,one_stars_clan:0,zero_stars_clan:0, _destSum:0,_defSum:0,_atkCount:0,_defCount:0,_threeStar:0,_totalAtk:0 };
      const m = map[r.clan_name];
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
          stars_earned: 0, stars_conceded: 0, attacks_used: 0, attacks_available: 0, missed_attacks: 0,
          three_stars: 0, two_stars: 0, one_stars: 0, zero_stars: 0,
          three_stars_conceded: 0, two_stars_conceded: 0, one_stars_conceded: 0, zero_stars_conceded: 0,
          _destSum: 0, _defSum: 0, _atkCount: 0, _defCount: 0,
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
      if (p.attacks_available > 0) { m._defSum += parseFloat(p.defence_pct||0) * p.attacks_available; m._defCount += p.attacks_available; }
    }
    return Object.values(map).map(m => ({
      ...m,
      destruction_pct: m._atkCount > 0 ? (m._destSum / m._atkCount).toFixed(2) : "0.00",
      defence_pct: m._defCount > 0 ? (m._defSum / m._defCount).toFixed(2) : "0.00",
      efficiency: m.attacks_used > 0 ? (m.stars_earned / m.attacks_used).toFixed(2) : "0.00",
      defence_efficiency: m.attacks_available > 0 ? (m.stars_conceded / m.attacks_available).toFixed(2) : "0.00",
    }));
  })();

  const displayData = selectedSeason === "all" ? allTimeData : data;
  const clans = displayData ? [...new Set(displayData.map(p => p.clan_name))].sort() : [];
  const searchLower = search.toLowerCase();
  const filtered = displayData
    ? displayData
        .filter(p => clanFilter === "all" || p.clan_name === clanFilter)
        .filter(p => !searchLower ||
          p.player_name.toLowerCase().includes(searchLower) ||
          p.player_tag.toLowerCase().includes(searchLower) ||
          p.clan_name.toLowerCase().includes(searchLower))
    : [];
  const sorted = [...filtered].sort((a, b) => {
    const av = parseFloat(a[sortBy]) || 0;
    const bv = parseFloat(b[sortBy]) || 0;
    const invert = sortBy === "missed_attacks" || sortBy === "stars_conceded" || sortBy === "defence_efficiency";
    const dir = invert ? (sortDir === "desc" ? 1 : -1) : (sortDir === "desc" ? -1 : 1);
    return (av - bv) * dir;
  });

  return (
    <main className="min-h-screen overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      </div>
      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 mb-4 text-center">
        <h1 className="text-2xl font-thin tracking-widest mb-1">CWL Leaderboard</h1>
        <p className="text-slate-500 text-xs mb-4">{lbTab === "player" ? "Player performance by season" : "Clan performance by season"}</p>
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <select value={selectedSeason} onChange={e => {
            const val = e.target.value;
            setSelectedSeason(val);
            setExpandedTag(null);
            setClanFilter("all");
            if (val !== "all") {
              setData(null);
              fetch(`/api/leaderboard?season=${encodeURIComponent(val)}`)
                .then(r=>r.json()).then(d=>setData(d.stats||[])).catch(()=>setData([]));
            }
          }} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white focus:outline-none [color-scheme:dark]">
            <option value="all">All Time</option>
            {seasons.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          {clans.length > 1 && (
            <select value={clanFilter} onChange={e=>setClanFilter(e.target.value)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white focus:outline-none [color-scheme:dark]">
              <option value="all">All Clans</option>
              {clans.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <select value={sortBy} onChange={e=>{ setSortBy(e.target.value); setSortDir("desc"); }}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white focus:outline-none [color-scheme:dark]">
            {lbTab === "player" ? (<>
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
            </>) : (<>
              {["Attack","Defence","Record"].map(g=>(
                <optgroup key={g} label={g}>
                  {CLAN_SORT_OPTIONS.filter(o=>o.group===g).map(o=>(
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </optgroup>
              ))}
            </>)}
          </select>
          <button type="button" onClick={()=>setSortDir(d=>d==="desc"?"asc":"desc")}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-400 hover:text-white transition">
            {sortDir === "desc" ? "↓ High–Low" : "↑ Low–High"}
          </button>
        </div>
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
          <button onClick={()=>{setLbTab("player");setSortBy("efficiency");setSearch("");setExpandedTag(null);setExpandedClan(null);}} className="text-slate-500 hover:text-slate-300 transition p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <span className="text-[10px] text-slate-600 uppercase tracking-widest select-none min-w-[100px]">
            {lbTab === "player" ? "Players" : "Clans"}
          </span>
          <button onClick={()=>{setLbTab("clan");setSortBy("attack_efficiency");setSearch("");setExpandedTag(null);setExpandedClan(null);}} className="text-slate-500 hover:text-slate-300 transition p-1">
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
            <ClanCard key={c.clan_name} c={c} rank={i+1}
              isExpanded={expandedClan === c.clan_name}
              onToggle={() => toggleExpandClan(c.clan_name)}/>
          ))
        )}
      </div>
    </main>
  );
}

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

    // Stat tile views use reserved hash names; anything else is treated
    // as a clan name (the original selectedClan behaviour).
    if (hash === "players" || hash === "clans" || hash === "avgth" || hash === "history" || hash === "leaderboard") {
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



    <motion.div
  initial={{ opacity: 0, y: 15 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
  className="
    relative
    z-10
    mb-4
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

  <div className="mt-3 flex justify-center">
    <DiscordWidget variant="center" />
  </div>

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

<div className="mb-4 relative z-10">

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