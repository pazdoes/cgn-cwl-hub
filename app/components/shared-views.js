"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { CWL_ICONS, TH_ICONS } from "@/lib/icons";
import { MiniPie, LargePie, StatPill, RankBadge } from "@/lib/components";
import DiscordWidget from "@/app/components/DiscordWidget";
import {
  CWL_RANK_ORDER, PIE_COLORS, ALL_TH_LEVELS, PLAYER_COLORS, STAT_OPTIONS,
  CWL_RANK_ORDER_HIST, CLAN_COLORS_CHART, CLAN_STAT_OPTIONS, CWL_RANK_LIST,
  PROFILE_HERO_ORDER, PROFILE_ROLE_LABELS, LB_METRIC_INFO,
} from "@/lib/shared-constants";

export function StarBars({ three, two, one, zero }) {
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

// CWL_ICONS' key order already encodes the correct league hierarchy
// (Champion I/II/III highest, down to Bronze I/II/III lowest) — reusing
// that order here rather than maintaining a second ranking list. Ranks
// not found in CWL_ICONS (including "Unranked" and any genuinely unset
// value) sort after every real league, lowest priority.


export function rankSortIndex(rank) {
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

export function rankToNum(rank) {
  const idx = CWL_RANK_ORDER_HIST.indexOf(rank);
  return idx === -1 ? CWL_RANK_ORDER_HIST.length : idx;
}

export function leagueTierNum(name) {
  if (!name) return 0;
  if (name === "Legend I") return 103;
  if (name === "Legend II") return 102;
  if (name === "Legend III") return 101;
  const m = name.match(/(\d+)$/);
  return m ? parseInt(m[1]) : 0;
}

export function leagueSlug(name) {
  if (!name) return null;
  // Strip " League" suffix, handle sub-tiers like "Dragon League 28" -> "dragon"
  const base = name.replace(/\s*(league)?\s*\d*$/i, "").trim();
  return base.toLowerCase().replace(/[^a-z0-9]+/g, "-") || null;
}

export function thColor(level) {
  const idx = ALL_TH_LEVELS.indexOf(String(level));
  return PIE_COLORS[idx >= 0 ? idx : PIE_COLORS.length - 1];
}

export function polarPoint(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function PlayerSparkline({ sparkData }) {
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

export function getRowTiles(sortBy) {
  const keys = SORT_TILE_MAP[sortBy] || SORT_TILE_MAP.stars_earned;
  return keys.map(k => TILE_DEFS[k]);
}

export function PlayerPerformanceChart({ allData, seasons }) {
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
    <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
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
              <div className="absolute left-0 top-full mt-1 z-50 w-full min-w-[200px] rounded-lg border border-white/10 bg-[#0d1424]/95 backdrop-blur-xl shadow-xl overflow-hidden">
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





export function ClanPerformanceChart({ history }) {
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
    <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
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
              <div className="absolute left-0 top-full mt-1 z-50 w-full min-w-[200px] rounded-lg border border-white/10 bg-[#0d1424]/95 backdrop-blur-xl shadow-xl overflow-hidden">
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

export function MatchupsPanel({ matchupData }) {
  const sorted = [...(matchupData||[])].sort((a, b) => parseFloat(b.three_star_rate) - parseFloat(a.three_star_rate));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
      <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">3★ Rate by TH Matchup</p>
      <p className="text-[9px] text-slate-700 mb-4">Attacker TH → Defender TH · min 3 attacks</p>
      {!matchupData?.length ? (
        <p className="text-slate-700 text-xs text-center py-6">No data available</p>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            <div className="flex-1 rounded-lg border border-green-500/20 bg-green-500/[0.06] px-3 py-2">
              <p className="text-[9px] text-green-500/70 uppercase tracking-widest mb-1">Strength</p>
              <p className="text-xs text-green-300 font-semibold">TH{best?.attacker_th} → TH{best?.defender_th}</p>
              <p className="text-[10px] text-green-400">{parseFloat(best?.three_star_rate||0).toFixed(0)}% 3★ rate</p>
            </div>
            <div className="flex-1 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2">
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

export function WarMomentumChart({ dayAggregates }) {
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
    <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
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
// ─── Player Profile View ──────────────────────────────────────────────────────
export const PROFILE_EQUIPMENT_LOOKUP = {
  "Barbarian Puppet":     { hero: "Barbarian King",  rarity: "Common", order: 1  },
  "Rage Vial":            { hero: "Barbarian King",  rarity: "Common", order: 2  },
  "Earthquake Boots":     { hero: "Barbarian King",  rarity: "Common", order: 3  },
  "Vampstache":           { hero: "Barbarian King",  rarity: "Common", order: 4  },
  "Sneaky Goblin Puppet": { hero: "Barbarian King",  rarity: "Common", order: 5  },
  "Snake Bracelet":       { hero: "Barbarian King",  rarity: "Epic",   order: 6  },
  "Giant Gauntlet":       { hero: "Barbarian King",  rarity: "Epic",   order: 7  },
  "Spiky Ball":           { hero: "Barbarian King",  rarity: "Epic",   order: 8  },
  "Stick Horse":          { hero: "Barbarian King",  rarity: "Epic",   order: 9  },
  "Archer Puppet":        { hero: "Archer Queen",    rarity: "Common", order: 10 },
  "Invisibility Vial":    { hero: "Archer Queen",    rarity: "Common", order: 11 },
  "Giant Arrow":          { hero: "Archer Queen",    rarity: "Common", order: 12 },
  "Healer Puppet":        { hero: "Archer Queen",    rarity: "Common", order: 13 },
  "Frozen Arrow":         { hero: "Archer Queen",    rarity: "Epic",   order: 14 },
  "Monolith Arrow":       { hero: "Archer Queen",    rarity: "Epic",   order: 15 },
  "Magic Mirror":         { hero: "Archer Queen",    rarity: "Epic",   order: 16 },
  "Action Figure":        { hero: "Archer Queen",    rarity: "Epic",   order: 17 },
  "Henchmen Puppet":      { hero: "Minion Prince",   rarity: "Common", order: 18 },
  "Dark Orb":             { hero: "Minion Prince",   rarity: "Common", order: 19 },
  "Metal Pants":          { hero: "Minion Prince",   rarity: "Common", order: 20 },
  "Noble Iron":           { hero: "Minion Prince",   rarity: "Common", order: 21 },
  "Dark Crown":           { hero: "Minion Prince",   rarity: "Epic",   order: 22 },
  "Meteor Staff":         { hero: "Minion Prince",   rarity: "Epic",   order: 23 },
  "Eternal Tome":         { hero: "Grand Warden",    rarity: "Common", order: 24 },
  "Life Gem":             { hero: "Grand Warden",    rarity: "Common", order: 25 },
  "Rage Gem":             { hero: "Grand Warden",    rarity: "Common", order: 26 },
  "Healing Tome":         { hero: "Grand Warden",    rarity: "Common", order: 27 },
  "Heroic Torch":         { hero: "Grand Warden",    rarity: "Epic",   order: 28 },
  "Fireball":             { hero: "Grand Warden",    rarity: "Epic",   order: 29 },
  "Lavaloon Puppet":      { hero: "Grand Warden",    rarity: "Epic",   order: 30 },
  "Seeking Shield":       { hero: "Royal Champion",  rarity: "Common", order: 31 },
  "Royal Gem":            { hero: "Royal Champion",  rarity: "Common", order: 32 },
  "Hog Rider Puppet":     { hero: "Royal Champion",  rarity: "Common", order: 33 },
  "Haste Vial":           { hero: "Royal Champion",  rarity: "Common", order: 34 },
  "Rocket Spear":         { hero: "Royal Champion",  rarity: "Epic",   order: 35 },
  "Electro Boots":        { hero: "Royal Champion",  rarity: "Epic",   order: 36 },
  "Frost Flake":          { hero: "Royal Champion",  rarity: "Epic",   order: 37 },
  "Fire Heart":           { hero: "Dragon Duke",     rarity: "Common", order: 38 },
  "Flame Blower":         { hero: "Dragon Duke",     rarity: "Common", order: 39 },
  "Stun Blaster":         { hero: "Dragon Duke",     rarity: "Common", order: 40 },
  "Electro Fangs":        { hero: "Dragon Duke",     rarity: "Common", order: 41 },
  "Rocket Backpack":      { hero: "Dragon Duke",     rarity: "Epic",   order: 42 },
};




export function ProfileEqTile({ eq }) {
  const slug = eq.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const isMaxed = eq.level >= eq.maxLevel;
  const isEpic = PROFILE_EQUIPMENT_LOOKUP[eq.name]?.rarity === "Epic";
  return (
    <div className={`relative w-10 h-10 rounded-xl overflow-hidden border ${isMaxed ? "border-amber-500/60" : isEpic ? "border-purple-500/30" : "border-white/[0.08]"}`}>
      <div className="w-full h-full bg-white/[0.05]">
        <img src={`/icons/equipment/${slug}.png`} alt={eq.name} loading="eager"
          className="w-full h-full object-cover" onError={e => { e.target.style.display = "none"; }}/>
      </div>
      <span className={`absolute top-0.5 right-0.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-sm text-[8px] font-bold px-0.5 ${isMaxed ? "bg-amber-500 text-white" : "bg-black/80 text-white"}`}>
        {eq.level}
      </span>
    </div>
  );
}

export function ProfileUnitTile({ unit, folder }) {
  const slug = unit.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const isMaxed = unit.level >= unit.maxLevel;
  return (
    <div className={`relative w-10 h-10 rounded-xl overflow-hidden border ${isMaxed ? "border-amber-500/60" : "border-white/[0.08]"}`}>
      <div className="w-full h-full bg-white/[0.05]">
        <img src={`/icons/${folder}/${slug}.png`} alt={unit.name} loading="eager"
          className="w-full h-full object-cover" onError={e => { e.target.style.display = "none"; }}/>
      </div>
      <span className={`absolute top-0.5 right-0.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-sm text-[8px] font-bold px-0.5 ${isMaxed ? "bg-amber-500 text-white" : "bg-black/80 text-white"}`}>
        {unit.level}
      </span>
    </div>
  );
}

export function PlayersView({ players, onBack, rosterSeasons = [], onNavigateProfile }) {
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


      <div className="relative z-10 mb-6 text-center">
        <h1 className="text-4xl font-thin tracking-widest">All Players</h1>
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

      <div className="relative z-10 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
        <div className="space-y-2">
          {loadingHist ? <div className="text-slate-500 text-sm text-center py-6 animate-pulse">Loading…</div> : [...displayPlayers]
            .sort((a, b) => Number(b.townHall || b.town_hall_level || 0) - Number(a.townHall || a.town_hall_level || 0))
            .map(player => (
            <div
              key={player.player_tag || `${player.clan}-${player.account}-${player.position}`}
              onClick={() => onNavigateProfile ? onNavigateProfile(player.player_tag || "") : null}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-3.5 cursor-pointer hover:border-white/20 hover:bg-white/[0.05] transition"
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

export function ClansView({ clans, players, onBack, onOpenClan }) {
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


      <div className="relative z-10 mb-6 text-center">
        <h1 className="text-4xl font-thin tracking-widest">All Clans</h1>
        <p className="text-slate-500 text-xs mt-1">{clans.length} clans rostered this season</p>
      </div>

      <div className="relative z-10 space-y-6">
        {clans.map(clan => {
          const clanPlayers = players.filter(p => p.clan === clan);
          const rank = clanPlayers[0]?.cwlRank || "Unranked";
          const format = clanPlayers[0]?.cwlFormat || (clanPlayers.length >= 30 ? "30v30" : "15v15");
          const clanLink = clanPlayers[0]?.clanLink || "";

          return (
            <div key={clan} className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
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


// Stable color assignment by TH level so the same TH always gets the
// same color regardless of which clans/levels are present in the view.


export function AvgThView({ players, clans, onBack }) {
  const [chartType, setChartType] = useState("pie"); // "pie" | "bar"
  const [selectedClanFilter, setSelectedClanFilter] = useState("all");

  // Clans that actually have players rostered — only these appear in the filter.
  const rostered = clans.filter(c => players.some(p => p.clan === c)).sort((a,b) => {
    const o = n => n.toLowerCase().startsWith("cognition") ? 0 : n.toLowerCase().startsWith("gems") ? 10 : 5;
    return o(a) - o(b);
  });

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
      <div className="relative z-10 mb-6 text-center">
        <h1 className="text-4xl font-thin tracking-widest mb-1">Town Hall Breakdown</h1>
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
      <div className="relative z-10 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 flex flex-col items-center">
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



// CWL Rank order for Y axis positioning


export function PlayerCard({ p, rank, isExpanded, onToggle, allSeasonData, seasons, sortBy }) {
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
    <div className={`rounded-lg border bg-white/[0.03] backdrop-blur-xl transition-all ${rankBorderClass} ${isExpanded ? "shadow-lg" : ""}`}>

      {/* Header row — only this triggers expand/collapse */}
      <div onClick={handleToggle} className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-white/[0.03] rounded-lg transition">
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

export function ClanCard({ c, rank, isExpanded, onToggle }) {
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
    <div className={`rounded-lg border bg-white/[0.03] backdrop-blur-xl transition-all ${rankBorderClass}`}>
      {/* Header row */}
      <div onClick={handleToggle} className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-white/[0.03] rounded-lg transition">
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

export function LbInfoButton() {
  const [open, setOpen] = useState(false);

  const modal = open && typeof document !== "undefined" && createPortal(
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setOpen(false)}/>
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-white/10 bg-[#0d1424] shadow-2xl"
        onClick={e => e.stopPropagation()}>
        {/* Handle + header */}
        <div className="relative flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/[0.06]">
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-white/10"/>
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Stat Reference</p>
          <button type="button" onClick={() => setOpen(false)} className="text-slate-600 hover:text-slate-300 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        {/* Two-column grid — mobile first */}
        <div className="grid grid-cols-2 gap-px bg-white/[0.04] max-h-[55vh] overflow-y-auto pb-safe">
          {LB_METRIC_INFO.map(m => (
            <div key={m.key} className="flex items-start gap-2.5 px-3 py-3 bg-[#0d1424]">
              <div className="w-6 h-6 rounded-xl flex items-center justify-center shrink-0 bg-white/[0.05] border border-white/[0.08]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke={m.stroke} strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={m.icon}/>
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-white leading-tight">{m.label}</p>
                <p className="text-[9px] text-slate-500 leading-relaxed mt-0.5">{m.tip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>,
    document.body
  );

  return (
    <>
      <button type="button" onClick={() => setOpen(v => !v)}
        className={`w-6 h-6 rounded-full flex items-center justify-center border transition text-[9px] font-bold shrink-0 ${open ? "bg-purple-500/20 border-purple-500/60 text-purple-300" : "bg-transparent border-white/10 text-slate-500 hover:border-purple-500/40 hover:text-purple-400"}`}>
        i
      </button>
      {modal}
    </>
  );
}

export function SeasonAwards({ stats }) {
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
    <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
      <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Season Awards</p>
      <div className="grid grid-cols-2 gap-2">
        {awards.map((award, i) => (
          <a key={i} href={`/player/${award.player.player_tag.replace("#","")}`} target="_blank" rel="noopener noreferrer"
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 hover:border-white/20 hover:bg-white/[0.04] transition no-underline">
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

export function AlliancePerformanceTile({ stats, totalAllianceStars }) {
  const withAtks = (stats||[]).filter(p => p.attacks_used > 0);
  const totalThreeStars = withAtks.reduce((s,p) => s+(p.three_stars||0), 0);
  const totalAtks = withAtks.reduce((s,p) => s+(p.attacks_used||0), 0);
  const allianceThreeStarRate = totalAtks > 0 ? (totalThreeStars/totalAtks*100).toFixed(0)+"%" : "—";
  const punchUpPlayers = withAtks.filter(p => p.punch_up_rate != null);
  const alliancePunchUp = punchUpPlayers.length ? (punchUpPlayers.reduce((s,p)=>s+parseFloat(p.punch_up_rate||0),0)/punchUpPlayers.length).toFixed(0)+"%" : "—";
  const clutchPlayers = withAtks.filter(p => p.clutch_rate != null);
  const allianceClutch = clutchPlayers.length ? (clutchPlayers.reduce((s,p)=>s+parseFloat(p.clutch_rate||0),0)/clutchPlayers.length).toFixed(2) : "—";
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
      <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Alliance Performance</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center col-span-2">
          <p className="text-3xl font-thin text-amber-300" style={{fontFamily:"var(--font-orbitron)"}}>{totalAllianceStars}</p>
          <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Total Alliance Stars</p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
          <p className="text-xl font-thin text-green-300" style={{fontFamily:"var(--font-orbitron)"}}>{totalThreeStars}</p>
          <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">3★ Hits ({allianceThreeStarRate})</p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
          <p className="text-xl font-thin text-blue-300" style={{fontFamily:"var(--font-orbitron)"}}>{alliancePunchUp}</p>
          <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Avg Punch-Up</p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center col-span-2">
          <p className="text-xl font-thin text-purple-300" style={{fontFamily:"var(--font-orbitron)"}}>{allianceClutch}</p>
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

export function ClanRecapShareCard({ clanName, selectedSeason, clanData, top3, bestAttacker, bestDefender, awardMostThreeStars, awardClutchKing, awardPunchUpKing, awardIronDefence, awardMostConsistent, seasonMvp, rounds, prevCwlRank, currentCwlRank }) {
  const MEDAL_PATH = "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z";
  const medalColours = { 1: "#D4AF37", 2: "#A7A7AD", 3: "#CD7F32" };

  function cwlIconUrl(rank) {
    if (!rank) return null;
    const l = rank.toLowerCase();
    const tier = l.includes("champion") ? "champion" : l.includes("master") ? "master" : l.includes("crystal") ? "crystal" : l.includes("gold") ? "gold" : l.includes("silver") ? "silver" : l.includes("bronze") ? "bronze" : null;
    const num = l.endsWith("iii") ? "3" : l.endsWith("ii") ? "2" : "1";
    return tier ? `https://cgnco.vercel.app/icons/cwl/${tier}-${num}.png` : null;
  }

  const RANKS = ["Bronze III","Bronze II","Bronze I","Silver III","Silver II","Silver I","Gold III","Gold II","Gold I","Crystal III","Crystal II","Crystal I","Master III","Master II","Master I","Champion III","Champion II","Champion I"];
  const displayRank = currentCwlRank || clanData?.cwl_rank || null;
  const curIdx = displayRank ? RANKS.indexOf(displayRank) : -1;
  const preIdx = prevCwlRank ? RANKS.indexOf(prevCwlRank) : -1;
  const delta = (curIdx >= 0 && preIdx >= 0) ? curIdx - preIdx : 0;
  const promoted = delta > 0;
  const demoted = delta < 0;
  const iconUrl = cwlIconUrl(displayRank);

  const tiles = [
    { label: "Best Attacker",   player: bestAttacker,        value: bestAttacker        ? parseFloat(bestAttacker.efficiency).toFixed(2)               : null, unit: "Atk EFF",    colour: "#c4b5fd", bg: "rgba(139,92,246,0.07)",  border: "rgba(139,92,246,0.22)",  icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { label: "3★ Machine",      player: awardMostThreeStars, value: awardMostThreeStars ? String(awardMostThreeStars.three_stars)                      : null, unit: "3-Stars",    colour: "#fbbf24", bg: "rgba(251,191,36,0.07)",  border: "rgba(251,191,36,0.22)",  icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
    { label: "Best Defender",   player: bestDefender,        value: bestDefender        ? parseFloat(bestDefender.defence_efficiency).toFixed(2)       : null, unit: "Def EFF",    colour: "#93c5fd", bg: "rgba(59,130,246,0.07)",  border: "rgba(59,130,246,0.22)",  icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
    { label: "Brave Heart",     player: awardPunchUpKing,    value: awardPunchUpKing    ? `${parseFloat(awardPunchUpKing.punch_up_rate).toFixed(0)}%`  : null, unit: "Punch-Up",   colour: "#86efac", bg: "rgba(34,197,94,0.07)",   border: "rgba(34,197,94,0.22)",   icon: "M5 10l7-7m0 0l7 7m-7-7v18" },
    { label: "Clutch King",     player: awardClutchKing,     value: awardClutchKing     ? parseFloat(awardClutchKing.clutch_rate).toFixed(2)           : null, unit: "Clutch Rate",colour: "#f472b6", bg: "rgba(244,114,182,0.07)", border: "rgba(244,114,182,0.22)", icon: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" },
    { label: "Iron Wall",       player: awardIronDefence,    value: awardIronDefence    ? parseFloat(awardIronDefence.defence_efficiency||0).toFixed(2): null, unit: "Def EFF",    colour: "#34d399", bg: "rgba(52,211,153,0.07)",  border: "rgba(52,211,153,0.22)",  icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
    { label: "Season MVP",      player: seasonMvp,           value: seasonMvp           ? parseFloat(seasonMvp.overall).toFixed(2)                     : null, unit: "CGN Rating", colour: "#D4AF37", bg: "rgba(212,175,55,0.07)",  border: "rgba(212,175,55,0.22)",  icon: MEDAL_PATH },
    { label: "Most Consistent", player: awardMostConsistent, value: awardMostConsistent ? parseFloat(awardMostConsistent.consistency_score||0).toFixed(2): null, unit: "Consistency",colour: "#a78bfa", bg: "rgba(167,139,250,0.07)", border: "rgba(167,139,250,0.22)", icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
  ];

  const clanStats = clanData ? [
    { label: "Stars",      value: clanData.total_stars,                                                                                                        colour: "#fbbf24" },
    { label: "Wins",       value: clanData.wars_won,                                                                                                           colour: "#86efac" },
    { label: "Losses",     value: clanData.wars_lost,                                                                                                          colour: "#f87171" },
    { label: "Atk EFF",   value: parseFloat(clanData.attack_efficiency||0).toFixed(2),                                                                         colour: "#c4b5fd" },
    { label: "Def EFF",   value: parseFloat(clanData.defence_efficiency||0).toFixed(2),                                                                        colour: "#93c5fd" },
    { label: "CGN Rating", value: clanData.attack_efficiency ? ((parseFloat(clanData.attack_efficiency||0)*0.6)+((3-parseFloat(clanData.defence_efficiency||0))*0.4)).toFixed(2) : "—", colour: "#D4AF37" },
  ] : [];

  return (
    <div style={{ width: 1200, height: 630, background: "#070b17", borderRadius: 28, border: "1px solid rgba(168,85,247,0.3)", padding: "24px 30px 18px", fontFamily: "ui-sans-serif, system-ui, sans-serif", color: "white", boxSizing: "border-box", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>

      {/* Background */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bgclan" cx="25%" cy="15%" r="65%"><stop offset="0%" stopColor="#16092e"/><stop offset="60%" stopColor="#070b17"/><stop offset="100%" stopColor="#030508"/></radialGradient>
          <radialGradient id="glclan" cx="85%" cy="85%" r="45%"><stop offset="0%" stopColor="#6d28d9" stopOpacity="0.14"/><stop offset="100%" stopColor="#6d28d9" stopOpacity="0"/></radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bgclan)"/>
        <rect width="100%" height="100%" fill="url(#glclan)"/>
      </svg>

      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>

        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontSize: 38, fontWeight: 100, letterSpacing: "0.03em", color: "white" }}>{clanName}</span>
            <span style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.14em" }}>Season Recap · {selectedSeason}</span>
            {(promoted || demoted) && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke={promoted ? "#4ade80" : "#f87171"} strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={promoted ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"}/>
                </svg>
                <span style={{ fontSize: 10, fontWeight: 700, color: promoted ? "#4ade80" : "#f87171", textTransform: "uppercase", letterSpacing: "0.1em" }}>{promoted ? "Promoted" : "Demoted"}</span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-end" }}>
            {clanStats.map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 200, color: s.colour, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 8, color: "#334155", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* DIVIDER */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 14 }}/>

        {/* BODY */}
        <div style={{ display: "flex", gap: 14, flex: 1 }}>

          {/* LEFT: Top Players + CWL icon */}
          <div style={{ width: 295, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>

            {/* Top Players */}
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 8, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em" }}>Top Players</div>
                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d={MEDAL_PATH}/></svg>
                  <span style={{ fontSize: 8, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.1em" }}>CGN Rating</span>
                </div>
              </div>
              {top3.map((p, i) => (
                <div key={p.player_tag} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: i < 2 ? 8 : 0, paddingBottom: i < 2 ? 8 : 0, borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke={medalColours[i+1]} strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d={MEDAL_PATH}/></svg>
                    <div style={{ fontSize: 13, fontWeight: 600, color: medalColours[i+1] }}>{p.player_name}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#a78bfa" }}>{p.overall?.toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* CWL rank movement visual */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              {(promoted || demoted) ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%" }}>
                  {/* Transition row: prev icon → arrow → current icon */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, width: "100%" }}>
                    {/* Previous rank */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 7, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center" }}>Previous</span>
                      {cwlIconUrl(prevCwlRank) && <img src={cwlIconUrl(prevCwlRank)} style={{ width: 80, height: 80, objectFit: "contain", opacity: 0.75 }} alt=""/>}
                      <span style={{ fontSize: 8, color: "#475569", textAlign: "center" }}>{prevCwlRank}</span>
                    </div>
                    {/* Arrow */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke={promoted ? "#4ade80" : "#f87171"} strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                    </svg>
                    {/* Current rank */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 7, color: promoted ? "#4ade80" : "#f87171", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center" }}>{promoted ? "Promoted" : "Demoted"}</span>
                      {iconUrl && <img src={iconUrl} style={{ width: 130, height: 130, objectFit: "contain" }} alt=""/>}
                      <span style={{ fontSize: 10, color: "#a78bfa", textAlign: "center" }}>{displayRank}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* No change — single large icon centred */
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  {iconUrl && <img src={iconUrl} style={{ width: 155, height: 155, objectFit: "contain" }} alt=""/>}
                  <span style={{ fontSize: 12, color: "#a78bfa", textAlign: "center" }}>{displayRank}</span>
                </div>
              )}
            </div>
          </div>

          {/* MIDDLE: CWL Rounds */}
          <div style={{ width: 240, flexShrink: 0, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", padding: "12px 14px", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 8, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8, flexShrink: 0 }}>CWL Rounds</div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              {rounds.map((r, i) => {
                const won  = r.stars_earned > r.stars_conceded || (r.stars_earned === r.stars_conceded && parseFloat(r.destruction_pct||0) > parseFloat(r.defence_pct||0));
                const lost = r.stars_earned < r.stars_conceded || (r.stars_earned === r.stars_conceded && parseFloat(r.destruction_pct||0) < parseFloat(r.defence_pct||0));
                const rc   = won ? "#4ade80" : lost ? "#f87171" : "#94a3b8";
                const ourStarCol = won ? "#fbbf24" : "#475569";
                const oppStarCol = lost ? "#f87171" : "#475569";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, height: 20, overflow: "visible" }}>
                    <span style={{ fontSize: 9, color: "#334155", width: 16, flexShrink: 0, display: "block", lineHeight: "20px" }}>R{r.war_day}</span>
                    <span style={{ fontSize: 10, color: "#64748b", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, lineHeight: "20px" }}>{r.opponent_clan}</span>
                    <span style={{ fontSize: 10, color: ourStarCol, fontWeight: won ? 700 : 400, flexShrink: 0, lineHeight: "20px" }}>{r.stars_earned}★</span>
                    <span style={{ fontSize: 9, color: "#1e293b", flexShrink: 0, margin: "0 1px", lineHeight: "20px" }}>·</span>
                    <span style={{ fontSize: 10, color: oppStarCol, fontWeight: lost ? 700 : 400, flexShrink: 0, lineHeight: "20px" }}>{r.stars_conceded}★</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: rc, width: 10, textAlign: "right", flexShrink: 0, lineHeight: "20px" }}>{won ? "W" : lost ? "L" : "D"}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: 8 tiles 2×4 grid */}
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr 1fr 1fr", gap: 10 }}>
            {tiles.map((tile, i) => tile.player && tile.value ? (
              <div key={i} style={{ background: tile.bg, borderRadius: 12, border: `1px solid ${tile.border}`, padding: "10px 12px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke={tile.colour} strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={tile.icon}/>
                  </svg>
                  <div style={{ fontSize: 8, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.09em" }}>{tile.label}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "white", marginBottom: 2 }}>{tile.player.player_name}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: tile.colour, lineHeight: 1 }}>{tile.value}</div>
                  {tile.unit && <div style={{ fontSize: 7, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{tile.unit}</div>}
                </div>
              </div>
            ) : (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 9, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.1em" }}>No data</div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 8, color: "#1e293b", letterSpacing: "0.12em", textTransform: "uppercase" }}>cgnco.vercel.app</span>
          <span style={{ fontSize: 8, color: "#1e293b", letterSpacing: "0.12em", textTransform: "uppercase" }}>Cognition Collective</span>
        </div>
      </div>
    </div>
  );
}

export function RecapShareCard({ topClan, top3, bestAttacker, bestDefender, totalWins, totalLosses, totalDraws, clanWithOverall, selectedSeason, totalAllianceStars, awardMostThreeStars, awardClutchKing, awardPunchUpKing, awardIronDefence, awardMostConsistent, seasonMvp }) {
  const MEDAL_PATH = "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z";
  const medalColours = { 1: "#D4AF37", 2: "#A7A7AD", 3: "#CD7F32" };

  const tiles = [
    { label: "Best Attacker",   player: bestAttacker,        value: bestAttacker        ? parseFloat(bestAttacker.efficiency).toFixed(2)               : null, unit: "Atk EFF",    colour: "#c4b5fd", bg: "rgba(139,92,246,0.07)",  border: "rgba(139,92,246,0.22)",  icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { label: "3★ Machine",      player: awardMostThreeStars, value: awardMostThreeStars ? String(awardMostThreeStars.three_stars)                      : null, unit: "3-Stars",    colour: "#fbbf24", bg: "rgba(251,191,36,0.07)",  border: "rgba(251,191,36,0.22)",  icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
    { label: "Best Defender",   player: bestDefender,        value: bestDefender        ? parseFloat(bestDefender.defence_efficiency).toFixed(2)       : null, unit: "Def EFF",    colour: "#93c5fd", bg: "rgba(59,130,246,0.07)",  border: "rgba(59,130,246,0.22)",  icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
    { label: "Brave Heart",     player: awardPunchUpKing,    value: awardPunchUpKing    ? `${parseFloat(awardPunchUpKing.punch_up_rate).toFixed(0)}%`  : null, unit: "Punch-Up",   colour: "#86efac", bg: "rgba(34,197,94,0.07)",   border: "rgba(34,197,94,0.22)",   icon: "M5 10l7-7m0 0l7 7m-7-7v18" },
    { label: "Clutch King",     player: awardClutchKing,     value: awardClutchKing     ? parseFloat(awardClutchKing.clutch_rate).toFixed(2)           : null, unit: "Clutch Rate",colour: "#f472b6", bg: "rgba(244,114,182,0.07)", border: "rgba(244,114,182,0.22)", icon: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" },
    { label: "Iron Wall",       player: awardIronDefence,    value: awardIronDefence    ? parseFloat(awardIronDefence.defence_efficiency||0).toFixed(2): null, unit: "Def EFF",    colour: "#34d399", bg: "rgba(52,211,153,0.07)",  border: "rgba(52,211,153,0.22)",  icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
    { label: "Season MVP",      player: seasonMvp,           value: seasonMvp           ? parseFloat(seasonMvp.overall).toFixed(2)                     : null, unit: "CGN Rating", colour: "#D4AF37", bg: "rgba(212,175,55,0.07)",  border: "rgba(212,175,55,0.22)",  icon: MEDAL_PATH },
    { label: "Most Consistent", player: awardMostConsistent, value: awardMostConsistent ? parseFloat(awardMostConsistent.consistency_score||0).toFixed(2): null, unit: "Consistency",colour: "#a78bfa", bg: "rgba(167,139,250,0.07)", border: "rgba(167,139,250,0.22)", icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
  ];

  return (
    <div style={{ width: 1200, height: 630, background: "#070b17", borderRadius: 28, border: "1px solid rgba(212,175,55,0.35)", padding: "24px 30px 18px", fontFamily: "ui-sans-serif, system-ui, sans-serif", color: "white", boxSizing: "border-box", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>

      {/* Background */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bg-recap" cx="50%" cy="35%" r="65%"><stop offset="0%" stopColor="#1c1408"/><stop offset="45%" stopColor="#0d0c0a"/><stop offset="100%" stopColor="#04060e"/></radialGradient>
          <radialGradient id="tint-recap" cx="50%" cy="20%" r="55%"><stop offset="0%" stopColor="#d4a017" stopOpacity="0.10"/><stop offset="100%" stopColor="#d4a017" stopOpacity="0"/></radialGradient>
          <pattern id="grain-recap" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse"><line x1="0" y1="4" x2="4" y2="0" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5"/></pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg-recap)"/>
        <rect width="100%" height="100%" fill="url(#tint-recap)"/>
        <rect width="100%" height="100%" fill="url(#grain-recap)"/>
      </svg>

      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontSize: 38, fontWeight: 100, letterSpacing: "0.03em", color: "white" }}>Cognition Collective</span>
            <span style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.14em" }}>Season Recap · {selectedSeason}</span>
          </div>
          {/* Alliance stats */}
          <div style={{ display: "flex", gap: 24, alignItems: "flex-end" }}>
            {[
              { label: "Stars",   value: totalAllianceStars,                                                                                                                                                              colour: "#fbbf24" },
              { label: "Wins",    value: totalWins,                                                                                                                                                                        colour: "#86efac" },
              { label: "Losses",  value: totalLosses,                                                                                                                                                                      colour: "#f87171" },
              { label: "Atk EFF", value: clanWithOverall.length > 0 ? (clanWithOverall.reduce((s,c) => s + parseFloat(c.attack_efficiency||0), 0) / clanWithOverall.length).toFixed(2) : "—",                            colour: "#c4b5fd" },
              { label: "Def EFF", value: clanWithOverall.length > 0 ? (clanWithOverall.reduce((s,c) => s + parseFloat(c.defence_efficiency||0), 0) / clanWithOverall.length).toFixed(2) : "—",                           colour: "#93c5fd" },
              { label: "CGN Rating", value: clanWithOverall.filter(c=>c.overall).length > 0 ? (clanWithOverall.filter(c=>c.overall).reduce((s,c) => s + c.overall, 0) / clanWithOverall.filter(c=>c.overall).length).toFixed(2) : "—", colour: "#D4AF37" },
            ].map(({ label, value, colour }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 200, color: colour, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 8, color: "#334155", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 14 }}/>

        {/* ── BODY: 3 columns ── */}
        <div style={{ display: "flex", gap: 14, flex: 1 }}>

          {/* LEFT: Top Players + Top Clan */}
          <div style={{ width: 295, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Top Players */}
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 8, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em" }}>Top Players</span>
                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d={MEDAL_PATH}/></svg>
                  <span style={{ fontSize: 8, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.1em" }}>CGN Rating</span>
                </div>
              </div>
              {top3.map((p, i) => (
                <div key={p.player_tag} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: i < 2 ? 8 : 0, paddingBottom: i < 2 ? 8 : 0, borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke={medalColours[i+1]} strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d={MEDAL_PATH}/></svg>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: medalColours[i+1] }}>{p.player_name}</div>
                      <div style={{ fontSize: 8, color: "#64748b" }}>{p.clan_name?.split(" ")[0]}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>{p.overall?.toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* CWL Rank Movement */}
            <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", padding: "12px 14px", display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 8, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>CWL Rank Movement</div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly" }}>
                {[...clanWithOverall].filter(c => c.cwl_rank && c.current_cwl_rank).sort((a, b) => {
                  const RANKS2 = ["Bronze III","Bronze II","Bronze I","Silver III","Silver II","Silver I","Gold III","Gold II","Gold I","Crystal III","Crystal II","Crystal I","Master III","Master II","Master I","Champion III","Champion II","Champion I"];
                  return RANKS2.indexOf(b.current_cwl_rank) - RANKS2.indexOf(a.current_cwl_rank);
                }).map((c, i, arr) => {
                  const RANKS = ["Bronze III","Bronze II","Bronze I","Silver III","Silver II","Silver I","Gold III","Gold II","Gold I","Crystal III","Crystal II","Crystal I","Master III","Master II","Master I","Champion III","Champion II","Champion I"];
                  const prevIdx = RANKS.indexOf(c.cwl_rank);
                  const curIdx = RANKS.indexOf(c.current_cwl_rank);
                  const delta = (prevIdx >= 0 && curIdx >= 0) ? curIdx - prevIdx : 0;
                  const promoted = delta > 0;
                  const demoted = delta < 0;
                  function rankIcon(rank) {
                    if (!rank) return null;
                    const l = rank.toLowerCase();
                    const tier = l.includes("champion") ? "champion" : l.includes("master") ? "master" : l.includes("crystal") ? "crystal" : l.includes("gold") ? "gold" : l.includes("silver") ? "silver" : l.includes("bronze") ? "bronze" : null;
                    const num = l.endsWith("iii") ? "3" : l.endsWith("ii") ? "2" : "1";
                    return tier ? `https://cgnco.vercel.app/icons/cwl/${tier}-${num}.png` : null;
                  }
                  const prevIcon = rankIcon(c.cwl_rank);
                  const curIcon = rankIcon(c.current_cwl_rank);
                  return (
                    <div key={c.clan_name} style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: i < arr.length - 1 ? 8 : 0, marginBottom: i < arr.length - 1 ? 8 : 0, borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      {/* Clan name */}
                      <span style={{ fontSize: 10, fontWeight: 600, color: "white", width: 72, flexShrink: 0 }}>{c.clan_name.split(" ")[0]}</span>
                      {/* Rank movement */}
                      <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1 }}>
                        {prevIcon && <img src={prevIcon} style={{ width: 26, height: 26, objectFit: "contain", opacity: 0.65 }} alt=""/>}
                        {delta !== 0 && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke={promoted ? "#4ade80" : "#f87171"} strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                          </svg>
                        )}
                        {curIcon && <img src={curIcon} style={{ width: 34, height: 34, objectFit: "contain" }} alt=""/>}
                      </div>
                      {/* Indicator */}
                      {(promoted || demoted) ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" fill="none" viewBox="0 0 24 24" stroke={promoted ? "#4ade80" : "#f87171"} strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={promoted ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"}/>
                          </svg>
                          <span style={{ fontSize: 8, fontWeight: 700, color: promoted ? "#4ade80" : "#f87171", textTransform: "uppercase", letterSpacing: "0.07em" }}>{promoted ? "Promoted" : "Demoted"}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 8, color: "#334155", flexShrink: 0 }}>—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* MIDDLE: Alliance War Record */}
          <div style={{ width: 230, flexShrink: 0, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", padding: "12px 14px", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 8, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Alliance War Record</div>

            {/* W/D/L totals */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {[
                { label: "Won",   value: totalWins,   colour: "#86efac", bg: "rgba(34,197,94,0.07)",   border: "rgba(34,197,94,0.2)" },
                { label: "Lost",  value: totalLosses, colour: "#f87171", bg: "rgba(239,68,68,0.07)",   border: "rgba(239,68,68,0.2)" },
                { label: "Drawn", value: totalDraws,  colour: "#64748b", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.07)" },
              ].map(({ label, value, colour, bg, border }) => (
                <div key={label} style={{ background: bg, borderRadius: 8, border: `1px solid ${border}`, padding: "8px 6px", flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: colour, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 8, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.09em", marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Per-clan breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {clanWithOverall.slice(0, 3).map((c, i) => (
                <div key={c.clan_tag || c.clan_name} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)", padding: "8px 10px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke={medalColours[i+1] || "#475569"} strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d={MEDAL_PATH}/></svg>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "white" }}>{c.clan_name.split(" ")[0]}</span>
                    </div>
                    <span style={{ fontSize: 9, color: "#64748b" }}>{c.cwl_rank}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#86efac" }}>{c.wars_won}</div>
                      <div style={{ fontSize: 7, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 1 }}>Won</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#f87171" }}>{c.wars_lost}</div>
                      <div style={{ fontSize: 7, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 1 }}>Lost</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#c4b5fd" }}>{parseFloat(c.attack_efficiency||0).toFixed(2)}</div>
                      <div style={{ fontSize: 7, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 1 }}>Atk EFF</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#93c5fd" }}>{parseFloat(c.defence_efficiency||0).toFixed(2)}</div>
                      <div style={{ fontSize: 7, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 1 }}>Def EFF</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#D4AF37" }}>{c.overall?.toFixed(2)}</div>
                      <div style={{ fontSize: 7, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 1 }}>Rating</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: 2×4 award tiles */}
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr 1fr 1fr", gap: 10 }}>
            {tiles.map((tile, i) => tile.player && tile.value ? (
              <div key={i} style={{ background: tile.bg, borderRadius: 12, border: `1px solid ${tile.border}`, padding: "10px 12px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke={tile.colour} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={tile.icon}/></svg>
                  <div style={{ fontSize: 8, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.09em" }}>{tile.label}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "white", marginBottom: 2 }}>{tile.player.player_name}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: tile.colour, lineHeight: 1 }}>{tile.value}</div>
                  <div style={{ fontSize: 7, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{tile.unit}</div>
                </div>
              </div>
            ) : (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 9, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.1em" }}>No data</div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 8, color: "#1e293b", letterSpacing: "0.12em", textTransform: "uppercase" }}>cgnco.vercel.app</span>
          <span style={{ fontSize: 8, color: "#1e293b", letterSpacing: "0.12em", textTransform: "uppercase" }}>Cognition Collective</span>
        </div>
      </div>
    </div>
  );
}

export function FaqButton() {
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
          <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 w-[95vw] sm:w-[360px] sm:left-auto sm:right-4 sm:translate-x-0 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl overflow-hidden">
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
                        <div key={ii} className="rounded-lg border border-white/[0.06] bg-white/[0.03] overflow-hidden">
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

export function AppHeader({ variant = "bar" }) {
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
  const sections = [
    {
      items: [
        { key: "", label: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
      ]
    },
    {
      label: "Members",
      items: [
        { key: "signup", label: "Sign Up", icon: "M12 4v16m8-8H4", href: "/signup" },
        { key: "rosters", label: "View Rosters", icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4", href: "/rosters" },
        { href: "/profile", label: "Player Profile", icon: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
      ]
    },
    {
      label: "Rankings",
      items: [
        { href: "/leaderboard", label: "CWL Leaderboard", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
        { key: "ranked", label: "Ranked Leaderboard", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
      ]
    },
    {
      label: "Records",
      items: [
        { key: "recap", label: "Season Recap", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
        { href: "/history", label: "History", icon: "M7 17l4-8 4 5 2-3M3 3v18h18" },
      ]
    },
    {
      label: "War",
      items: [
        { key: "warintel", label: "War Intel", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" },
      ]
    },

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
            className={`relative z-10 w-72 max-w-[80vw] h-full bg-[#0b1020]/80 backdrop-blur-2xl border-r border-white/10 flex flex-col p-5 transition-transform duration-150 ${navOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="flex items-center gap-2 mb-8 cursor-default select-none" onClick={handleBrandTap}>
              <img src="/icons/branding/cgn-skull.png" alt="CGN" className="w-7 h-7"/>
              <span className="text-sm text-white tracking-widest uppercase" style={{fontFamily:"var(--font-orbitron)"}}>Cognition Collective</span>
            </div>
            <nav className="flex-1 space-y-4 overflow-y-auto">
              {sections.map((section, si) => (
                <div key={si}>
                  {section.label && (
                    <p className="text-[9px] text-slate-600 uppercase tracking-widest px-3 mb-1">{section.label}</p>
                  )}
                  <div className="space-y-0.5">
                    {section.items.map(item => item.href ? (
                      <a key={item.key} href={item.href}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition text-left">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/>
                        </svg>
                        <span style={{fontFamily:"var(--font-orbitron)"}}>{item.label}</span>
                      </a>
                    ) : (
                      <button key={item.key || "home"} onClick={() => go(item.key)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition text-left">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/>
                        </svg>
                        <span style={{fontFamily:"var(--font-orbitron)"}}>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
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
            <span className="text-xs text-slate-400 tracking-widest uppercase" style={{fontFamily:"var(--font-orbitron)"}}>Cognition Collective</span>
          </div>
          <div className="w-8"/>
          <div className="absolute right-0 top-0 bottom-0 flex items-center">
            <DiscordWidget variant="corner"/>
          </div>
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

export function AppFooter({ onNavigateHome, showHome = true }) {
  function goHome() {
    if (onNavigateHome) { onNavigateHome(); return; }
    if (typeof window !== "undefined") window.location.href = "/";
  }
  return (
    <div className="relative z-10 w-full py-4 flex items-center px-4 mt-auto">
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
          <span className="text-[11px] text-slate-400 tracking-widest" style={{fontFamily:"var(--font-orbitron)"}}>Cognition Collective</span>
        </a>
      </div>
      <div className="w-16 flex items-center justify-end">
        <FaqButton />
      </div>
    </div>
  );
}

// ─── CWL countdown — always counts to the 1st of next month, 00:00 UTC ─────
// CWL war week begins on the 1st of every calendar month. If currently within
// the first 8 days (live war week), shows a "live" state instead of counting
// down to the same month's already-passed start.
// ─── Side Wars time display — always countdown, recurring resets every 48h ───
// ─── CWL Progress Tile ───────────────────────────────────────────────────────
// Auto-appears when round 1 data is captured, replaces Stats & Overview tile.
// Hidden during prep/sign-up week when attacks_used is 0 for all players.
