"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { getLeagueStyles } from "../lib/leagueColors";
import { CWL_ICONS, TH_ICONS } from "../lib/icons";
import { BRANDING } from "../lib/branding";

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
          {players.map(player => (
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
                {clanPlayers.map(player => (
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



// Live SVG pie chart breaking down the same player set already used for
// the Avg TH calculation, grouped by Town Hall level. Built as plain SVG
// rather than a charting library — this codebase has no chart dependency
// anywhere, and a hand-built SVG stays consistent with that. It's
// "live" in the sense the task required: driven directly from the same
// players React state every other view on this page uses, so any
// roster change that re-fetches players re-renders this chart
// automatically — no separate static-image step anywhere.
const PIE_COLORS = [
  "#a78bfa", "#818cf8", "#60a5fa", "#38bdf8", "#22d3ee",
  "#2dd4bf", "#34d399", "#a3e635", "#facc15", "#fb923c",
  "#f87171", "#f472b6",
];

function polarPoint(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function AvgThView({ players, onBack }) {
  const counts = {};
  players.forEach(p => {
    const th = p.townHall || "Unknown";
    counts[th] = (counts[th] || 0) + 1;
  });

  const sortedLevels = Object.keys(counts).sort((a, b) => Number(b) - Number(a));
  const total = players.length;

  let cumulativeAngle = 0;
  const slices = sortedLevels.map((level, i) => {
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
      : null; // a single 100% slice degenerates to a full circle, drawn separately below

    return {
      level,
      count,
      fraction,
      path,
      color: PIE_COLORS[i % PIE_COLORS.length],
    };
  });

  const isSingleSlice = slices.length === 1;

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
        <h1 className="text-2xl font-bold">Town Hall Breakdown</h1>
        <p className="text-slate-400 text-sm mt-1">{total} players rostered this season</p>
      </div>

      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 flex flex-col items-center">
        {total === 0 ? (
          <p className="text-slate-600 text-sm py-8">No players to chart yet.</p>
        ) : (
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
        )}
      </div>
    </main>
  );
}



export default function Home() {

  const [players, setPlayers] = useState([]);
const [selectedClan, setSelectedClan] = useState(null);
const [search, setSearch] = useState("");
const [statView, setStatView] = useState(null); // null | "players" | "clans" | "avgth"

  useEffect(() => {
    fetch("/api/roster")
      .then(res => res.json())
      .then(data => setPlayers(data));
  }, []);

  useEffect(() => {
  const handlePopState = () => {
    const clan =
      decodeURIComponent(window.location.hash.replace("#", ""));

    setSelectedClan(clan || null);
  };

  window.addEventListener(
    "popstate",
    handlePopState
  );

  handlePopState();

  return () => {
    window.removeEventListener(
      "popstate",
      handlePopState
    );
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
    return <PlayersView players={players} onBack={() => setStatView(null)} />;
  }

  if (statView === "clans") {
    return <ClansView clans={clans} players={players} onBack={() => setStatView(null)} />;
  }

  if (statView === "avgth") {
    return <AvgThView players={players} onBack={() => setStatView(null)} />;
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
  rounded-3xl
  border
  border-white/10
  bg-white/[0.04]
  backdrop-blur-xl
  p-6
  mb-6
  text-center
  shadow-xl
  relative
">

  {/* Clan Name */}
  <h1 className="text-2xl font-bold">
    {selectedClan}
  </h1>

  {/* Info Lines */}
  <div className="mt-3 text-sm text-slate-300 space-y-1">
    <div>
      {format}
    </div>
    <div>
      {clanPlayers[0]?.season || ""}
    </div>
  </div>

  {/* Open Clan — pill style, matching the homepage's Join the Pool button */}
  <div className="mt-4">
    <a
      href={clanPlayers[0]?.clanLink || ""}
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

</div>

      <div className="space-y-3">

        {clanPlayers.map(player => (

          <motion.div
  key={`${player.clan}-${player.account}-${player.position}`}
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
  className="
    rounded-2xl
    border
    border-white/10
    bg-white/[0.04]
    backdrop-blur-xl
    p-4
    shadow-lg
    transition
    hover:border-white/20
    hover:bg-white/[0.06]
    hover:scale-[1.01]
  "
>

            <div className="flex items-center w-full justify-between min-w-0 gap-3">

  {/* LEFT SIDE */}
  <div className="flex items-center min-w-0 overflow-hidden">

  <div className="text-lg font-bold w-8">
    {player.position}
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

  {/* Row 2 — CWL Rank */}
  <div className="flex items-center gap-2 min-w-0">
    <img
      src={CWL_ICONS[player.cwlRank]}
      alt={player.cwlRank}
      className="w-5 h-5"
    />

    <span className="text-xs text-slate-300">
      {player.cwlRank}
    </span>
  </div>

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
    CWL Hub
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
      Join the Pool
    </Link>
  </div>

</motion.div>

    <div className="grid grid-cols-3 gap-3 mb-8 relative z-10">

  <div
    onClick={() => setStatView("players")}
    className="
  rounded-3xl
  border
  border-white/10
  bg-white/[0.04]
  backdrop-blur-xl
  p-6
  min-h-[120px]
  flex
  flex-col
  items-center
  justify-center
  shadow-xl
  cursor-pointer
  hover:bg-white/[0.06]
  hover:border-white/20
  transition
">
    <div className="text-2xl md:text-3xl font-bold">
      {players.length}
    </div>

    <div className="text-slate-400">
      Players
    </div>
  </div>

  <div
    onClick={() => setStatView("clans")}
    className="
    rounded-3xl
    border
    border-white/10
    bg-white/[0.03]
    backdrop-blur-xl
    p-6
    min-h-[120px]
    flex
    flex-col
    items-center
    justify-center
    cursor-pointer
    hover:bg-white/[0.06]
    hover:border-white/20
    transition
  ">
    <div className="text-2xl md:text-3xl font-bold">
      {clans.length}
    </div>

    <div className="text-slate-400">
      Clans
    </div>
  </div>

  <div
    onClick={() => setStatView("avgth")}
    className="
    rounded-3xl
    border
    border-white/10
    bg-white/[0.03]
    backdrop-blur-xl
    p-6
    min-h-[120px]
    flex
    flex-col
    items-center
    justify-center
    cursor-pointer
    hover:bg-white/[0.06]
    hover:border-white/20
    transition
  ">
    <div className="text-2xl md:text-3xl font-bold">
      {
        players.length
          ? (
              players.reduce(
                (sum, p) => sum + Number(p.townHall || 0),
                0
              ) / players.length
            ).toFixed(1)
          : "-"
      }
    </div>

    <div className="text-slate-400">
      Avg TH
    </div>
  </div>

</div>

<div className="mb-8 relative z-10">

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

</div>

    {search ? (

      <div className="space-y-4 mt-2">

        {searchResults.map(player => (
  <div
    key={`${player.clan}-${player.account}-${player.position}`}
    onClick={() => {
  window.history.pushState(
    {},
    "",
    `#${player.clan}`
  );

  setSelectedClan(player.clan);
}}
    className="
      flex
      items-center
      justify-between
      py-3
      px-1
      border-b
      border-white/5
      cursor-pointer
      hover:bg-white/[0.03]
      transition
    "
  >
    <div className="flex items-center gap-3 min-w-0 overflow-hidden">
      <span className="text-slate-500 w-6">
        {player.position}
      </span>

      <span className="font-medium text-white truncate max-w-[140px] block">
        {player.account}
      </span>

      <span className="text-xs text-slate-500 truncate max-w-[120px]">
        {player.clan}
      </span>

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

    <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0 whitespace-nowrap">

      <span
        className={`
          px-2
          py-0.5
          rounded-full
          ${
            player.status?.toLowerCase() === "confirmed"
              ? "bg-green-500/10 text-green-300"
              : player.status?.toLowerCase() === "substitute"
              ? "bg-orange-500/10 text-orange-300"
              : player.status?.toLowerCase() === "active"
              ? "bg-green-500/10 text-green-300"
              : player.status?.toLowerCase() === "benched"
              ? "bg-yellow-500/10 text-yellow-300"
              : player.status?.toLowerCase() === "inactive"
              ? "bg-red-500/10 text-red-300"
              : "text-slate-400"
          }
        `}
      >
        {player.status}
      </span>

      <span>
        {player.cwlRank}
      </span>

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