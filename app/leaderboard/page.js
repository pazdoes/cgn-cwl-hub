"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getRowTiles, PlayerCard, ClanCard, LbInfoButton, AppHeader, AppFooter,
} from "@/app/components/shared-views";

function LeaderboardView() {
  const router = useRouter();
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
    <main className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      <img src="/roster-bg.png" alt="" className="fixed inset-0 select-none pointer-events-none opacity-20" style={{width:"100vw",height:"100dvh",objectFit:"cover",objectPosition:"center top"}}/>
      </div>

      <AppHeader variant="bar"/>

      <div className="relative z-10 mb-4 text-center">
        <h1 className="text-4xl font-thin tracking-widest mb-1" style={{fontFamily:"var(--font-orbitron)"}}>CWL Leaderboard</h1>
        <p className="text-slate-500 text-xs mb-4">{lbTab === "player" ? "Player performance by season" : "Clan performance by season"}</p>
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <select value={sortBy} onChange={e=>{ setSortBy(e.target.value); setSortDir("desc"); }}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white focus:outline-none [color-scheme:dark]">
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
            className="rounded-lg border border-white/10 bg-white/[0.04] w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white transition shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {sortDir === "desc"
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                : <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/>}
            </svg>
          </button>
          {(() => {
            const activeCount = (selectedSeason !== "all" ? 1 : 0) + (clanFilter !== "all" ? 1 : 0) + (lbTab === "player" && thFilter !== "all" ? 1 : 0);
            return (
              <>
              <button type="button" onClick={() => setShowFiltersModal(true)}
                className={`relative rounded-lg border px-3 py-1 text-xs flex items-center gap-1.5 transition ${activeCount > 0 ? "border-purple-500/40 bg-purple-500/[0.08] text-purple-300" : "border-white/10 bg-white/[0.04] text-slate-300 hover:text-white"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                </svg>
                Filters
                {activeCount > 0 && (
                  <span className="ml-0.5 rounded-lg bg-purple-500/30 text-purple-200 text-[10px] font-bold w-4 h-4 flex items-center justify-center">{activeCount}</span>
                )}
              </button>
              <LbInfoButton/>
            </>
            );
          })()}
        </div>

        {/* Filters modal — rendered via portal to escape overflow-clipped ancestors */}
        {showFiltersModal && typeof document !== "undefined" && createPortal(
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowFiltersModal(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
            <div onClick={e => e.stopPropagation()}
              className="relative z-10 w-full sm:w-auto sm:max-w-2xl rounded-t-3xl sm:rounded-xl border border-white/10 bg-[#0d1424] flex flex-col max-h-[75dvh] sm:max-h-[90vh]">
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
                    }} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none [color-scheme:dark]">
                      <option value="all">All Time</option>
                      {seasons.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {clans.length > 1 && (
                    <div className="sm:w-44">
                      <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1.5">Clan</p>
                      <select value={clanFilter} onChange={e=>setClanFilter(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none [color-scheme:dark]">
                        <option value="all">All Clans</option>
                        {clans.map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )}

                  {lbTab === "player" && (
                    <div className="sm:w-44">
                      <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1.5">Town Hall</p>
                      <select value={thFilter} onChange={e=>setThFilter(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none [color-scheme:dark]">
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
                  className="rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-200 text-xs font-semibold px-4 py-1.5 hover:bg-purple-500/30 transition">
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
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition"/>
          {search && (
            <button onClick={()=>setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-lg flex items-center justify-center bg-white/[0.08] text-slate-400 hover:text-white transition">
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
          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 text-center text-slate-500 text-sm animate-pulse">Loading…</div>
        ) : sorted.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 text-center">
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
            <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 text-center text-slate-500 text-sm animate-pulse">Loading…</div>
          ) : filteredClans.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 text-center">
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

export default LeaderboardView;
