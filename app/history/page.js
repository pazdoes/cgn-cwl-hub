"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getLeagueStyles } from "@/lib/leagueColors";
import { CWL_ICONS, TH_ICONS } from "@/lib/icons";
import { MiniPie, LargePie, StarIcons, StatPill, RankBadge } from "@/lib/components";
import DiscordWidget from "@/app/components/DiscordWidget";

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
        { key: "profile", label: "Player Profile", icon: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
      ]
    },
    {
      label: "Rankings",
      items: [
        { key: "leaderboard", label: "CWL Leaderboard", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
        { key: "ranked", label: "Ranked Leaderboard", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
      ]
    },
    {
      label: "Records",
      items: [
        { key: "recap", label: "Season Recap", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
        { key: "history", label: "History", icon: "M7 17l4-8 4 5 2-3M3 3v18h18" },
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

function AppFooter({ onNavigateHome, showHome = true }) {
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

export default function HistoryPage() {
  const router = useRouter();
  return <HistoryViewInner/>;
}

function HistoryViewInner() {
  const router = useRouter();
function HistoryView(()) {
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
    <main className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      <img src="/roster-bg.png" alt="" className="fixed inset-0 select-none pointer-events-none opacity-20" style={{width:"100vw",height:"100dvh",objectFit:"cover",objectPosition:"center top"}}/>
      </div>

      <AppHeader variant="bar"/>

      {/* Hero card */}
      <div className="relative z-10 mb-4 text-center">
        <h1 className="text-4xl font-thin tracking-widest mb-1">History</h1>
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
            {tab === "player" ? "Player Performance" : "Clan Performance"}
          </span>
          <button onClick={() => setTab("rank")} className="text-slate-500 hover:text-slate-300 transition p-1" title="Clan Performance">
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
            <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 animate-pulse">
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
}
