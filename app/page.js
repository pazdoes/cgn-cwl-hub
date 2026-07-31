"use client";

import {useEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";
import {motion} from "framer-motion";
import Link from "next/link";
import {getLeagueStyles} from "@/lib/leagueColors";
import {BRANDING} from "@/lib/branding";
import {CWL_ICONS, TH_ICONS} from "@/lib/icons";
import {rankSortIndex, leagueSlug, getRowTiles, PlayerPerformanceChart, ClanPerformanceChart, MatchupsPanel, WarMomentumChart, ProfileEqTile, ProfileUnitTile, PlayersView, ClansView, AvgThView, PlayerCard, ClanCard, LbInfoButton, SeasonAwards, AlliancePerformanceTile, ClanRecapShareCard, RecapShareCard, AppHeader, AppFooter} from "@/app/components/shared-views";
import {PROFILE_HERO_ORDER, PROFILE_ROLE_LABELS} from "@/lib/shared-constants";

function PlayerProfileView({ onBack }) {
  const [query, setQuery] = useState(() => {
    // Check for pre-filled tag from roster click
    if (typeof window !== "undefined") {
      const pending = sessionStorage.getItem("profileSearchTag");
      if (pending) { sessionStorage.removeItem("profileSearchTag"); return pending; }
    }
    return "";
  });
  const [searching, setSearching] = useState(false);
  const [army, setArmy] = useState(null);
  const [error, setError] = useState(null);
  const [selectedHero, setSelectedHero] = useState(null);
  const [eqSort, setEqSort] = useState("rarity");
  const [showTroops, setShowTroops] = useState(false);

  const [nameResults, setNameResults] = useState([]);
  const [iconsReady, setIconsReady] = useState(false);
  const [profileView, setProfileView] = useState("army");
  const [upgrades, setUpgrades] = useState(null);
  const [upgradesLoading, setUpgradesLoading] = useState(false);
  const [upgradeSnapshots, setUpgradeSnapshots] = useState(0);
  const [tourneyHistory, setTourneyHistory] = useState(null);
  const [tourneyLoading, setTourneyLoading] = useState(false);

  // Auto-search if tag was pre-filled from roster — runs after all functions defined
  useEffect(() => {
    if (query.trim() && !army) {
      const q = query.trim();
      setTimeout(() => handleSearchDirect(q), 0);
    }
  }, [query]);

  async function handleSearchDirect(q) {
    setSearching(true); setArmy(null); setError(null); setSelectedHero(null); setNameResults([]); setIconsReady(false); setProfileView("army"); setUpgrades(null); setTourneyHistory(null);
    try {
      const tag = q.replace(/^#/, "");
      const res = await fetch(`/api/army/${tag}`);
      const d = await res.json();
      if (!res.ok || d.error) { setError(d.error || "Player not found"); setSearching(false); return; }
      setArmy(d.army);
      const a = d.army;
      const allIconSrcs = [
        ...(a.heroes||[]).map(u => `/icons/heroes/${u.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`),
        ...(a.heroEquipment||[]).map(u => `/icons/equipment/${u.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`),
        ...(a.pets||[]).map(u => `/icons/pets/${u.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`),
        ...(a.troops||[]).map(u => `/icons/troops/${u.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`),
        ...(a.spells||[]).map(u => `/icons/spells/${u.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`),
        ...(a.siegeMachines||[]).map(u => `/icons/siege/${u.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`),
        ...(a.townHallLevel ? [`/icons/th/th${a.townHallLevel}.png`] : []),
        ...(a.league?.iconUrl ? [a.league.iconUrl] : []),
        ...(a.clan?.badgeUrl ? [a.clan.badgeUrl] : []),
      ];
      if (allIconSrcs.length === 0) { setIconsReady(true); }
      else {
        let resolved = 0;
        const onResolve = () => { resolved++; if (resolved >= allIconSrcs.length) setIconsReady(true); };
        allIconSrcs.forEach(src => { const img = new Image(); img.onload = img.onerror = onResolve; img.src = src; });
      }
    } catch { setError("Network error"); }
    finally { setSearching(false); }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true); setArmy(null); setError(null); setSelectedHero(null); setNameResults([]); setIconsReady(false); setProfileView("army"); setUpgrades(null); setTourneyHistory(null);
    const isTag = query.trim().startsWith("#") || (/^[A-Z0-9]{5,10}$/i.test(query.trim().replace(/^#/, "")) && /[0-9]/.test(query.trim().replace(/^#/, "")));
    if (isTag) {
      // Tag search — fetch directly from CoC API via army route
      try {
        const tag = query.trim().replace(/^#/, "");
        const res = await fetch(`/api/army/${tag}`);
        const d = await res.json();
        if (!res.ok || d.error) { setError(d.error || "Player not found"); setSearching(false); return; }
        setArmy(d.army);
        // Preload icons
        const a = d.army;
        // Build full icon list — all must resolve before profile renders
        const allIconSrcs = [
          ...(a.heroes||[]).map(u => `/icons/heroes/${u.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`),
          ...(a.heroEquipment||[]).map(u => `/icons/equipment/${u.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`),
          ...(a.pets||[]).map(u => `/icons/pets/${u.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`),
          ...(a.troops||[]).map(u => `/icons/troops/${u.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`),
          ...(a.spells||[]).map(u => `/icons/spells/${u.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`),
          ...(a.siegeMachines||[]).map(u => `/icons/siege/${u.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`),
          ...(a.townHallLevel ? [`/icons/th/th${a.townHallLevel}.png`] : []),
          ...(a.league?.iconUrl ? [a.league.iconUrl] : []),
          ...(a.clan?.badgeUrl ? [a.clan.badgeUrl] : []),
        ];
        if (allIconSrcs.length === 0) { setIconsReady(true); }
        else {
          let resolved = 0;
          const onResolve = () => { resolved++; if (resolved >= allIconSrcs.length) setIconsReady(true); };
          allIconSrcs.forEach(src => { const img = new Image(); img.onload = img.onerror = onResolve; img.src = src; });
        }
      } catch { setError("Network error"); }
      finally { setSearching(false); }
    } else {
      // Name search — query alliance members from DB
      try {
        const res = await fetch(`/api/search-player?q=${encodeURIComponent(query.trim())}`);
        const d = await res.json();
        if (d.results?.length === 0) { setError("No alliance members found with that name"); }
        else { setNameResults(d.results || []); }
      } catch { setError("Network error"); }
      finally { setSearching(false); }
    }
  }

  async function loadPlayerByTag(tag) {
    setSearching(true); setArmy(null); setError(null); setNameResults([]);
    try {
      const res = await fetch(`/api/army/${tag.replace("#","")}`);
      const d = await res.json();
      if (!res.ok || d.error) { setError(d.error || "Player not found"); return; }
      setArmy(d.army);
      const a = d.army;
      const allIconSrcs2 = [
        ...(a.heroes||[]).map(u => `/icons/heroes/${u.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`),
        ...(a.heroEquipment||[]).map(u => `/icons/equipment/${u.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`),
        ...(a.pets||[]).map(u => `/icons/pets/${u.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`),
        ...(a.troops||[]).map(u => `/icons/troops/${u.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`),
        ...(a.spells||[]).map(u => `/icons/spells/${u.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`),
        ...(a.siegeMachines||[]).map(u => `/icons/siege/${u.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`),
        ...(a.townHallLevel ? [`/icons/th/th${a.townHallLevel}.png`] : []),
        ...(a.league?.iconUrl ? [a.league.iconUrl] : []),
        ...(a.clan?.badgeUrl ? [a.clan.badgeUrl] : []),
      ];
      if (allIconSrcs2.length === 0) { setIconsReady(true); }
      else {
        let resolved2 = 0;
        const onResolve2 = () => { resolved2++; if (resolved2 >= allIconSrcs2.length) setIconsReady(true); };
        allIconSrcs2.forEach(src => { const img = new Image(); img.onload = img.onerror = onResolve2; img.src = src; });
      }
    } catch { setError("Network error"); }
    finally { setSearching(false); }
  }

  async function fetchTourneyHistory(tag) {
    setTourneyLoading(true);
    try {
      const res = await fetch(`/api/tournament-history/${tag.replace("#","")}`);
      const d = await res.json();
      setTourneyHistory(d.results || []);
    } catch { setTourneyHistory([]); }
    finally { setTourneyLoading(false); }
  }

  async function fetchUpgrades(tag) {
    setUpgradesLoading(true);
    try {
      const res = await fetch(`/api/army-upgrades/${tag.replace("#","")}`);
      const d = await res.json();
      setUpgrades(d.upgrades || []);
      setUpgradeSnapshots(d.snapshots || 0);
    } catch { setUpgrades([]); }
    finally { setUpgradesLoading(false); }
  }

  const sortedEq = (() => {
    if (!army) return { common: [], epic: [] };
    const eq = army.heroEquipment || [];
    let filtered = selectedHero ? eq.filter(e => PROFILE_EQUIPMENT_LOOKUP[e.name]?.hero === selectedHero) : [...eq];
    filtered.sort((a, b) => {
      if (eqSort === "hero" && !selectedHero) {
        const ha = PROFILE_HERO_ORDER.indexOf(PROFILE_EQUIPMENT_LOOKUP[a.name]?.hero || "");
        const hb = PROFILE_HERO_ORDER.indexOf(PROFILE_EQUIPMENT_LOOKUP[b.name]?.hero || "");
        if (ha !== hb) return ha - hb;
      }
      const ra = PROFILE_EQUIPMENT_LOOKUP[a.name]?.rarity === "Epic" ? 1 : 0;
      const rb = PROFILE_EQUIPMENT_LOOKUP[b.name]?.rarity === "Epic" ? 1 : 0;
      if (ra !== rb) return ra - rb;
      return (PROFILE_EQUIPMENT_LOOKUP[a.name]?.order ?? 99) - (PROFILE_EQUIPMENT_LOOKUP[b.name]?.order ?? 99);
    });
    return {
      common: filtered.filter(e => PROFILE_EQUIPMENT_LOOKUP[e.name]?.rarity !== "Epic"),
      epic: filtered.filter(e => PROFILE_EQUIPMENT_LOOKUP[e.name]?.rarity === "Epic"),
    };
  })();

  return (
    <main className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 sm:p-6 pb-12">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      <img src="/roster-bg.png" alt="" className="fixed inset-0 select-none pointer-events-none opacity-20" style={{width:"100vw",height:"100dvh",objectFit:"cover",objectPosition:"center top"}}/>
      </div>
      <div className="relative z-10 space-y-4">

        {/* Standard app header — hamburger + branding + Discord */}
        <AppHeader variant="bar"/>

        {/* Page title card — centred, no back button */}
        <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 text-center">
          <h1 className="text-4xl font-thin tracking-widest text-white">Player Profile</h1>
          <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">Hero · Equipment · Army · Upgrades</p>
        </div>

        {error && <p className="text-red-400 text-xs text-center">{error}</p>}

        {/* Info tile + search — shown only before any search */}
        {!army && !searching && !error && !nameResults.length && (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 space-y-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest">About This Section</p>
            <p className="text-sm text-slate-300 leading-relaxed">Search for any player by their tag, or use a Cognition alliance member's name to view their full Clash profile.</p>
            <div className="space-y-3">
              {[
                { icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z", label: "Army", desc: "View heroes, equipment, pets, troops and spells with level badges" },
                { icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", label: "Upgrades", desc: "Track level changes detected between profile visits over time" },
                { icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", label: "Search", desc: "Enter #TAG for any player, or a name for alliance members" },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center shrink-0 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{item.label}</p>
                    <p className="text-[10px] text-slate-500 leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Search bar — inline, matches app style */}
            <form onSubmit={handleSearch} className="flex gap-2 pt-1">
              <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search by #TAG or player name…"
                className="flex-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
              <button type="submit" disabled={searching || !query.trim()}
                className="shrink-0 rounded-full border border-purple-500/40 bg-transparent text-purple-400 hover:border-purple-400 hover:text-purple-300 transition disabled:opacity-40 px-3 py-1 text-xs font-semibold">
                {searching ? "…" : "Search"}
              </button>
            </form>
          </div>
        )}

        {/* Search card — shown after a search has been performed, army not yet loaded */}
        {(army || searching || error || nameResults.length > 0) && (
          <form onSubmit={handleSearch} className="flex gap-2">
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search by #TAG or player name…"
              className="flex-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
            <button type="submit" disabled={searching || !query.trim()}
              className="shrink-0 rounded-full border border-purple-500/40 bg-transparent text-purple-400 hover:border-purple-400 hover:text-purple-300 transition disabled:opacity-40 px-3 py-1 text-xs font-semibold">
              {searching ? "…" : "Search"}
            </button>
          </form>
        )}
        {searching && !nameResults.length && (
          <div className="space-y-3 animate-pulse">
            {/* Profile header skeleton */}
            <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg bg-white/[0.06] shrink-0"/>
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-5 w-32 bg-white/[0.06] rounded"/>
                  <div className="h-3 w-20 bg-white/[0.06] rounded"/>
                  <div className="h-3 w-28 bg-white/[0.06] rounded"/>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/[0.06] shrink-0"/>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/[0.06]">
                {[...Array(4)].map((_,i) => <div key={i} className="h-8 rounded-xl bg-white/[0.06]"/>)}
              </div>
            </div>
            {/* Heroes + equipment skeleton */}
            <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
              <div className="flex gap-3">
                <div className="flex flex-col gap-3 shrink-0" style={{width:"38%"}}>
                  <div>
                    <div className="h-2 w-10 bg-white/[0.06] rounded mb-2"/>
                    <div className="flex gap-1.5">
                      {[...Array(5)].map((_,i) => <div key={i} className="w-14 h-14 rounded-lg bg-white/[0.06]"/>)}
                    </div>
                  </div>
                  <div>
                    <div className="h-2 w-6 bg-white/[0.06] rounded mb-2"/>
                    <div className="flex flex-wrap gap-1.5">
                      {[...Array(6)].map((_,i) => <div key={i} className="w-11 h-11 rounded-xl bg-white/[0.06]"/>)}
                    </div>
                  </div>
                </div>
                <div className="w-px bg-white/[0.06] shrink-0"/>
                <div className="flex-1">
                  <div className="h-2 w-14 bg-white/[0.06] rounded mb-2"/>
                  <div className="flex flex-wrap gap-1">
                    {[...Array(24)].map((_,i) => <div key={i} className="w-10 h-10 rounded-xl bg-white/[0.06]"/>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Name search results */}
        {nameResults.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest px-4 pt-3 pb-2">Alliance Members</p>
            {nameResults.map(r => (
              <button key={r.tag} type="button" onClick={() => loadPlayerByTag(r.tag)}
                className="w-full flex items-center justify-between px-4 py-3 border-t border-white/[0.06] hover:bg-white/[0.04] transition text-left">
                <div>
                  <p className="text-sm font-semibold text-white">{r.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{r.tag} · {r.clan}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            ))}
          </div>
        )}

        {army && !iconsReady && (
          <div className="space-y-3 animate-pulse">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg bg-white/[0.06] shrink-0"/>
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-5 w-32 bg-white/[0.06] rounded"/>
                  <div className="h-3 w-20 bg-white/[0.06] rounded"/>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/[0.06] shrink-0"/>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/[0.06]">
                {[...Array(4)].map((_,i) => <div key={i} className="h-8 rounded-xl bg-white/[0.06]"/>)}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 h-48"/>
          </div>
        )}

        {army && iconsReady && (
          <>
            {/* Profile header card */}
            <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
              {/* Top row: TH + name/clan centred + league */}
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-16 h-16 rounded-lg border border-white/10 bg-white/[0.06] flex items-center justify-center overflow-hidden">
                  {army.townHallLevel ? (
                    <img src={`/icons/th/th${army.townHallLevel}.png`} alt={`TH${army.townHallLevel}`}
                      className="w-14 h-14 object-contain"
                      onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}/>
                  ) : null}
                  <div className="hidden flex-col items-center justify-center w-full h-full">
                    <span className="text-[8px] text-slate-600 uppercase tracking-widest">TH</span>
                    <span className="text-2xl font-thin text-white">{army.townHallLevel}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0 text-center">
                  <h2 className="text-lg font-semibold text-white truncate">{army.name}</h2>
                  <p className="text-[10px] text-slate-500 font-mono mb-1">{army.tag}</p>
                  {army.clan && (
                    <div className="flex items-center justify-center gap-1.5">
                      {army.clan.badgeUrl && <img src={army.clan.badgeUrl} alt="" className="w-4 h-4 object-contain"/>}
                      <span className="text-xs text-slate-400">{army.clan.name}</span>
                      {army.role && <span className="text-[9px] text-slate-600">· {PROFILE_ROLE_LABELS[army.role] || army.role}</span>}
                    </div>
                  )}
                </div>
                {army.league && (
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <img
                      src={army.league.iconUrl || `/icons/leagues/${leagueSlug(army.league.name)}.png`}
                      alt={army.league.name}
                      loading="eager"
                      className="w-10 h-10 object-contain"/>
                    <span className="text-[7px] text-slate-500 text-center leading-tight max-w-[48px]">
                      {army.league.name?.replace(" League","").replace(/\s\d+$/,"").trim()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center gap-2 flex-wrap mt-4 pt-4 border-t border-white/[0.06]">
                {/* Level — blue */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-blue-500/40 bg-transparent">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                  </svg>
                  <span className="text-xs font-semibold text-blue-300">{army.expLevel ?? "—"}</span>
                  <span className="text-[9px] text-slate-600 uppercase tracking-wide">Lvl</span>
                </div>
                {/* War Stars — amber */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-500/40 bg-transparent">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                  </svg>
                  <span className="text-xs font-semibold text-amber-300">{army.warStars?.toLocaleString() ?? "—"}</span>
                  <span className="text-[9px] text-slate-600 uppercase tracking-wide">War Stars</span>
                </div>
                {/* Donations — green house */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-green-500/40 bg-transparent">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                  </svg>
                  <span className="text-xs font-semibold text-green-300">{army.donations?.toLocaleString() ?? "—"}</span>
                  <span className="text-[9px] text-slate-600 uppercase tracking-wide">Donations</span>
                </div>
                {/* Trophies — purple trophy */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-purple-500/40 bg-transparent">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75H7.5m9 0c1.657 0 3 1.343 3 3H4.5c0-1.657 1.343-3 3-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52a6.003 6.003 0 01-5.395 5.972M18.75 4.236V4.5a9.023 9.023 0 01-2.48 5.228m-10.48 0a9.024 9.024 0 005.23 2.478m5.25-2.478a9.024 9.024 0 01-5.25 2.478"/>
                  </svg>
                  <span className="text-xs font-semibold text-purple-300">{army.trophies?.toLocaleString() ?? "—"}</span>
                  <span className="text-[9px] text-slate-600 uppercase tracking-wide">Trophies</span>
                </div>
              </div>
            </div>

            {/* ── View navigation ── */}
            <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-4 py-3 flex items-center justify-between">
              <button type="button"
                onClick={() => {
                  if (profileView === "army") { setProfileView("ranked"); if (!tourneyHistory) fetchTourneyHistory(army.tag); }
                  else if (profileView === "ranked") { setProfileView("upgrades"); if (!upgrades) fetchUpgrades(army.tag); }
                  else setProfileView("army");
                }}
                className="text-slate-500 hover:text-slate-300 transition p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <span className="text-[10px] text-slate-600 uppercase tracking-widest select-none">
                {profileView === "army" ? "Army" : profileView === "ranked" ? "Ranked" : "Upgrades"}
              </span>
              <button type="button"
                onClick={() => {
                  if (profileView === "army") { setProfileView("upgrades"); if (!upgrades) fetchUpgrades(army.tag); }
                  else if (profileView === "upgrades") { setProfileView("ranked"); if (!tourneyHistory) fetchTourneyHistory(army.tag); }
                  else setProfileView("army");
                }}
                className="text-slate-500 hover:text-slate-300 transition p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>

            {/* ── UPGRADES VIEW ── */}
            {profileView === "ranked" && (
              <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 space-y-3">
                <p className="text-[9px] text-slate-600 uppercase tracking-widest">Weekly Tournament History</p>
                {tourneyLoading && (
                  <div className="animate-pulse space-y-2">
                    {[...Array(4)].map((_,i) => <div key={i} className="h-20 bg-white/[0.04] rounded-lg"/>)}
                  </div>
                )}
                {!tourneyLoading && tourneyHistory?.length === 0 && (
                  <div className="text-center py-6 space-y-1">
                    <p className="text-slate-500 text-xs">No tournament history yet</p>
                    <p className="text-slate-700 text-[10px]">Results recorded each Monday after weekly reset</p>
                  </div>
                )}
                {!tourneyLoading && tourneyHistory?.map((r, i) => {
                  const isPromoted = r.result === "promoted";
                  const isDemoted = r.result === "demoted";

                  // Week date range: Mon-Mon
                  const weekEnd = new Date(r.week_ending);
                  const weekStart = new Date(weekEnd);
                  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
                  const fmt = d => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
                  const dateRange = `${fmt(weekStart)} — ${fmt(weekEnd)}`;

                  // Trophy trend vs previous week
                  const prevResult = tourneyHistory[i + 1];
                  const trophyDiff = prevResult?.pre_trophies && r.pre_trophies
                    ? r.pre_trophies - prevResult.pre_trophies : null;

                  // Alliance rank — derive from all results for this week
                  // (passed from API in future; placeholder for now)

                  return (
                    <div key={i} className={`rounded-lg border p-3 space-y-2.5 ${isPromoted ? "border-green-500/30 bg-green-500/[0.03]" : isDemoted ? "border-red-500/30 bg-red-500/[0.03]" : "border-white/[0.06] bg-white/[0.02]"}`}>

                      {/* Row 1: date range + result badge */}
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest">{dateRange}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${isPromoted ? "text-green-400 bg-green-500/10" : isDemoted ? "text-red-400 bg-red-500/10" : "text-slate-400 bg-white/[0.04]"}`}>
                          {isPromoted ? "↑ Promoted" : isDemoted ? "↓ Demoted" : "→ Stayed"}
                        </span>
                      </div>

                      {/* Row 2: league badge + name (left) · trophy count (right) */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {r.pre_league && <img
                            src={`/icons/leagues/${r.pre_league.split(" ")[0].toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`}
                            alt={r.pre_league}
                            className="w-6 h-6 object-contain shrink-0"
                            onError={e => { e.target.src = r.pre_league_icon || ""; }}/>}
                          <span className="text-[10px] text-slate-400 truncate">{r.pre_league}</span>
                          {r.pre_league !== r.post_league && (
                            <>
                              <span className="text-slate-600 text-[10px]">→</span>
                              {r.post_league && <img
                                src={`/icons/leagues/${r.post_league.split(" ")[0].toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`}
                                alt={r.post_league}
                                className="w-6 h-6 object-contain shrink-0"
                                onError={e => { e.target.src = r.post_league_icon || ""; }}/>}
                              <span className={`text-[10px] font-semibold truncate ${isPromoted ? "text-green-300" : "text-red-300"}`}>{r.post_league}</span>
                            </>
                          )}
                        </div>
                        {r.pre_trophies > 0 && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75H7.5m9 0c1.657 0 3 1.343 3 3H4.5c0-1.657 1.343-3 3-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52a6.003 6.003 0 01-5.395 5.972M18.75 4.236V4.5a9.023 9.023 0 01-2.48 5.228m-10.48 0a9.024 9.024 0 005.23 2.478m5.25-2.478a9.024 9.024 0 01-5.25 2.478"/>
                            </svg>
                            <span className="text-xs font-semibold text-purple-300">{r.pre_trophies.toLocaleString()}</span>
                            {trophyDiff !== null && (
                              <span className={`text-[9px] font-bold ${trophyDiff > 0 ? "text-green-400" : trophyDiff < 0 ? "text-red-400" : "text-slate-500"}`}>
                                {trophyDiff > 0 ? `↑ +${trophyDiff}` : trophyDiff < 0 ? `↓ ${trophyDiff}` : "→"}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {profileView === "upgrades" && (
              <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 space-y-3">
                {upgradesLoading && (
                  <div className="animate-pulse space-y-2">
                    {[...Array(4)].map((_,i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.06] shrink-0"/>
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 w-28 bg-white/[0.06] rounded"/>
                          <div className="h-2 w-16 bg-white/[0.06] rounded"/>
                        </div>
                        <div className="h-3 w-12 bg-white/[0.06] rounded"/>
                      </div>
                    ))}
                  </div>
                )}
                {!upgradesLoading && upgradeSnapshots < 2 && (
                  <div className="text-center py-6">
                    <p className="text-slate-500 text-xs">No upgrade history yet</p>
                    <p className="text-slate-700 text-[10px] mt-1">Check back after your next visit to see upgrades</p>
                  </div>
                )}
                {!upgradesLoading && upgrades?.length === 0 && upgradeSnapshots >= 2 && (
                  <div className="text-center py-6">
                    <p className="text-slate-500 text-xs">No upgrades detected between snapshots</p>
                  </div>
                )}
                {!upgradesLoading && upgrades?.length > 0 && (() => {
                  // Group by date
                  const byDate = {};
                  upgrades.forEach(u => {
                    const d = new Date(u.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
                    if (!byDate[d]) byDate[d] = [];
                    byDate[d].push(u);
                  });
                  const CAT_FOLDER = { heroes:"heroes", heroEquipment:"equipment", troops:"troops", spells:"spells", siegeMachines:"siege", pets:"pets" };
                  return Object.entries(byDate).map(([date, items]) => (
                    <div key={date}>
                      <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-2 px-1">{date}</p>
                      <div className="space-y-2">
                        {items.map((u, idx) => {
                          const slug = u.name.toLowerCase().replace(/[^a-z0-9]+/g,"-");
                          const folder = CAT_FOLDER[u.category] || "troops";
                          const isMaxed = u.toLevel >= u.maxLevel;
                          const pct = Math.round((u.toLevel / u.maxLevel) * 100);
                          return (
                            <div key={idx} className="flex items-center gap-3">
                              {/* Icon */}
                              <div className={`relative w-10 h-10 rounded-xl overflow-hidden border shrink-0 ${isMaxed ? "border-amber-500/60" : "border-green-500/30"}`}>
                                <div className="w-full h-full bg-white/[0.05]">
                                  <img src={`/icons/${folder}/${slug}.png`} alt={u.name} loading="eager"
                                    className="w-full h-full object-cover" onError={e=>{e.target.style.display="none"}}/>
                                </div>
                                {/* Upgrade glow */}
                                <div className={`absolute inset-0 rounded-xl ${isMaxed ? "shadow-[inset_0_0_6px_rgba(251,191,36,0.4)]" : "shadow-[inset_0_0_6px_rgba(74,222,128,0.3)]"}`}/>
                              </div>
                              {/* Name + progress bar */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold text-white truncate">{u.name}</span>
                                  {isMaxed && <span className="text-[8px] text-amber-400 uppercase tracking-widest shrink-0">Max</span>}
                                  {u.unlocked && <span className="text-[8px] text-purple-400 uppercase tracking-widest shrink-0">New</span>}
                                </div>
                                {/* Level progress bar */}
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${isMaxed ? "bg-amber-400" : "bg-green-400"}`} style={{width:`${pct}%`}}/>
                                  </div>
                                  <span className="text-[9px] text-slate-500 shrink-0 tabular-nums">
                                    {u.unlocked ? `Unlocked Lv ${u.toLevel}` : `${u.fromLevel} → ${u.toLevel}`}
                                    <span className="text-slate-700">/{u.maxLevel}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}

            {/* ── ARMY VIEW ── */}
            {profileView === "army" && <>
            {/* Heroes + Pets + Equipment */}
            <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
              <div className="flex gap-3">
                {/* Left — Heroes + Pets */}
                <div className="flex flex-col gap-3 shrink-0" style={{width:"38%"}}>
                  {army.heroes?.length > 0 && (
                    <div>
                      <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-1.5">Heroes</p>
                      <div className="flex flex-wrap gap-1.5">
                        {[...army.heroes].sort((a,b) => PROFILE_HERO_ORDER.indexOf(a.name)-PROFILE_HERO_ORDER.indexOf(b.name)).map(hero => {
                          const slug = hero.name.toLowerCase().replace(/[^a-z0-9]+/g,"-");
                          const isMaxed = hero.level >= hero.maxLevel;
                          return (
                            <button key={hero.name} type="button"
                              onClick={() => setSelectedHero(selectedHero === hero.name ? null : hero.name)}
                              className={`relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition ${selectedHero === hero.name ? "border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]" : isMaxed ? "border-amber-500/60" : "border-white/10"}`}>
                              <div className="w-full h-full bg-white/[0.06]">
                                <img src={`/icons/heroes/${slug}.png`} alt={hero.name} loading="eager"
                                  className="w-full h-full object-cover object-top" onError={e=>{e.target.style.display="none"}}/>
                              </div>
                              <span className={`absolute top-0.5 right-0.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-sm text-[9px] font-bold px-0.5 ${isMaxed?"bg-amber-500 text-white":"bg-black/80 text-white"}`}>
                                {hero.level}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {army.pets?.length > 0 && (
                    <div>
                      <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-1.5">Pets</p>
                      <div className="flex flex-wrap gap-1.5">
                        {army.pets.map(pet => {
                          const slug = pet.name.toLowerCase().replace(/[^a-z0-9]+/g,"-");
                          const isMaxed = pet.level >= pet.maxLevel;
                          return (
                            <div key={pet.name} className={`relative w-11 h-11 rounded-xl overflow-hidden border ${isMaxed?"border-amber-500/60":"border-white/10"}`}>
                              <div className="w-full h-full bg-white/[0.06]">
                                <img src={`/icons/pets/${slug}.png`} alt={pet.name} loading="eager"
                                  className="w-full h-full object-cover" onError={e=>{e.target.style.display="none"}}/>
                              </div>
                              <span className={`absolute top-0.5 right-0.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-sm text-[8px] font-bold px-0.5 ${isMaxed?"bg-amber-500 text-white":"bg-black/80 text-white"}`}>
                                {pet.level}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-px bg-white/[0.06] shrink-0"/>

                {/* Right — Equipment */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[8px] text-slate-600 uppercase tracking-widest">
                      {selectedHero ? selectedHero.split(" ")[0]+" Equip." : "Equipment"}
                    </p>
                    {!selectedHero ? (
                      <div className="flex gap-1">
                        {["rarity","hero"].map(m => (
                          <button key={m} type="button" onClick={() => setEqSort(m)}
                            className={`text-[8px] px-2 py-0.5 rounded-full border transition ${eqSort===m?"border-purple-500/60 bg-purple-500/20 text-purple-300":"border-white/10 text-slate-600 hover:text-slate-400"}`}>
                            {m==="rarity"?"Epic/Common":"By Hero"}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button type="button" onClick={() => setSelectedHero(null)}
                        className="text-[8px] text-slate-600 hover:text-slate-300 transition">All</button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {eqSort === "hero" && !selectedHero ? (
                      PROFILE_HERO_ORDER.map(heroName => {
                        const commonH = sortedEq.common.filter(e => PROFILE_EQUIPMENT_LOOKUP[e.name]?.hero === heroName);
                        const epicH = sortedEq.epic.filter(e => PROFILE_EQUIPMENT_LOOKUP[e.name]?.hero === heroName);
                        if (!commonH.length && !epicH.length) return null;
                        return (
                          <div key={heroName}>
                            <p className="text-[7px] text-slate-500 uppercase tracking-widest mb-1">{heroName}</p>
                            {commonH.length > 0 && <div className="flex flex-wrap gap-1 mb-1">{commonH.map(e => <ProfileEqTile key={e.name} eq={e}/>)}</div>}
                            {epicH.length > 0 && <div className="flex flex-wrap gap-1">{epicH.map(e => <ProfileEqTile key={e.name} eq={e}/>)}</div>}
                          </div>
                        );
                      })
                    ) : (
                      <>
                        {sortedEq.common.length > 0 && (
                          <div>
                            <p className="text-[7px] text-slate-600 uppercase tracking-widest mb-1">Common</p>
                            <div className="flex flex-wrap gap-1">{sortedEq.common.map(e => <ProfileEqTile key={e.name} eq={e}/>)}</div>
                          </div>
                        )}
                        {sortedEq.epic.length > 0 && (
                          <div>
                            <p className="text-[7px] text-amber-500/60 uppercase tracking-widest mb-1">Epic</p>
                            <div className="flex flex-wrap gap-1">{sortedEq.epic.map(e => <ProfileEqTile key={e.name} eq={e}/>)}</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Troops + Spells + Siege */}
            <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
              <button type="button" onClick={() => setShowTroops(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Troops, Spells & Siege</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 text-slate-600 transition-transform ${showTroops?"rotate-180":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              {showTroops && (
                <div className="px-5 pb-5 space-y-3 border-t border-white/[0.06] pt-4">
                  {army.troops?.length > 0 && (
                    <div>
                      <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-2">Troops</p>
                      <div className="flex flex-wrap gap-1.5">{army.troops.map(t => <ProfileUnitTile key={t.name} unit={t} folder="troops"/>)}</div>
                    </div>
                  )}
                  {army.spells?.length > 0 && (
                    <div>
                      <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-2">Spells</p>
                      <div className="flex flex-wrap gap-1.5">{army.spells.map(s => <ProfileUnitTile key={s.name} unit={s} folder="spells"/>)}</div>
                    </div>
                  )}
                  {army.siegeMachines?.length > 0 && (
                    <div>
                      <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-2">Siege Machines</p>
                      <div className="flex flex-wrap gap-1.5">{army.siegeMachines.map(s => <ProfileUnitTile key={s.name} unit={s} folder="siege"/>)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            </>}
            <p className="text-[9px] text-slate-700 text-center">{army.tag} · Data refreshes every 24h</p>
          </>
        )}
      </div>
    </main>
  );
}

// ─── Ranked Leaderboard View ─────────────────────────────────────────────────
function RankedLeaderboardView({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTag, setExpandedTag] = useState(null);
  const [historyCache, setHistoryCache] = useState({});
  const [historyLoading, setHistoryLoading] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await fetch("/api/ranked-leaderboard");
      const d = await res.json();
      setData(d);
    } catch { setError("Failed to load ranked data"); }
    finally { setLoading(false); }
  }

  async function toggleExpand(tag) {
    if (expandedTag === tag) { setExpandedTag(null); return; }
    setExpandedTag(tag);
    if (historyCache[tag]) return;
    setHistoryLoading(tag);
    try {
      const res = await fetch(`/api/tournament-history/${tag.replace("#","")}`);
      const d = await res.json();
      setHistoryCache(prev => ({ ...prev, [tag]: d.results || [] }));
    } catch { setHistoryCache(prev => ({ ...prev, [tag]: [] })); }
    finally { setHistoryLoading(null); }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  // Assign alliance-wide rank across all groups
  let globalRank = 0;

  return (
    <main className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 sm:p-6 pb-12">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      <img src="/roster-bg.png" alt="" className="fixed inset-0 select-none pointer-events-none opacity-20" style={{width:"100vw",height:"100dvh",objectFit:"cover",objectPosition:"center top"}}/>
      </div>
      <div className="relative z-10 space-y-4">

        <AppHeader variant="bar"/>

        {/* Title card — centred, matches app design spec */}
        <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 text-center">
          <h1 className="text-4xl font-thin tracking-widest text-white">Ranked Leaderboard</h1>
          <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">Alliance Trophy Rankings</p>
          <div className="flex justify-center mt-4">
            <button onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-slate-500 hover:text-slate-300 hover:border-white/20 transition disabled:opacity-40 text-[10px] uppercase tracking-widest">
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {refreshing ? "Updating…" : "Refresh"}
            </button>
          </div>
          {data && !loading && (
            <p className="text-[9px] text-slate-700 mt-3 pt-3 border-t border-white/[0.06]">
              {data.total} registered players · Last updated {data.updatedAt ? new Date(data.updatedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"} · Refreshes weekly
            </p>
          )}
        </div>

        {loading && (
          <div className="space-y-3 animate-pulse">
            {[...Array(3)].map((_,i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 space-y-2">
                <div className="h-3 w-24 bg-white/[0.06] rounded"/>
                {[...Array(4)].map((_,j) => <div key={j} className="h-10 bg-white/[0.06] rounded-lg"/>)}
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-red-400 text-xs text-center">{error}</p>}

        {data && !loading && (
          <>
            {data.groups.map(group => (
              <div key={group.league} className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
                {/* League header */}
                <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06]">
                  {group.iconUrl && <img src={group.iconUrl} alt={group.league} className="w-8 h-8 object-contain"/>}
                  <span className="text-sm font-semibold text-white">{group.league}</span>
                  <span className="text-[9px] text-slate-600 uppercase tracking-widest ml-auto">{group.players.length} players</span>
                </div>

                {/* Player rows */}
                <div className="divide-y divide-white/[0.04]">
                  {group.players.map(player => {
                    globalRank++;
                    return (
                      <div key={player.player_tag}>
                        <button type="button" onClick={() => toggleExpand(player.player_tag)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition text-left">
                          {/* Rank */}
                          <span className="text-[10px] text-slate-600 font-mono w-5 shrink-0 text-right">{globalRank}</span>

                          {/* TH icon */}
                          <div className="w-8 h-8 rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.06] shrink-0 flex items-center justify-center">
                            <img src={`/icons/th/th${player.th}.png`} alt={`TH${player.th}`}
                              className="w-7 h-7 object-contain" onError={e=>{e.target.style.display="none"}}/>
                          </div>

                          {/* Name + clan */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{player.name}</p>
                            <div className="flex items-center gap-1">
                              {player.clan_badge && <img src={player.clan_badge} alt="" className="w-3 h-3 object-contain"/>}
                              <p className="text-[10px] text-slate-500 truncate">{player.clan_name}</p>
                            </div>
                          </div>

                          {/* Trophies */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75H7.5m9 0c1.657 0 3 1.343 3 3H4.5c0-1.657 1.343-3 3-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52a6.003 6.003 0 01-5.395 5.972M18.75 4.236V4.5a9.023 9.023 0 01-2.48 5.228m-10.48 0a9.024 9.024 0 005.23 2.478m5.25-2.478a9.024 9.024 0 01-5.25 2.478"/>
                            </svg>
                            <span className="text-sm font-semibold text-purple-300">{(player.trophies || 0).toLocaleString()}</span>
                          </div>

                          {/* Expand chevron */}
                          <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 text-slate-600 transition-transform shrink-0 ${expandedTag === player.player_tag ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                          </svg>
                        </button>

                        {/* History expansion — tournament result tiles */}
                        {expandedTag === player.player_tag && (
                          <div className="px-3 pb-3 pt-2 border-t border-white/[0.04] space-y-2">
                            {historyLoading === player.player_tag && (
                              <div className="animate-pulse space-y-2">
                                {[...Array(2)].map((_,i) => <div key={i} className="h-16 bg-white/[0.04] rounded-lg"/>)}
                              </div>
                            )}
                            {historyCache[player.player_tag]?.length === 0 && (
                              <p className="text-[9px] text-slate-700 py-2 text-center">No tournament history yet</p>
                            )}
                            {historyCache[player.player_tag]?.map((r, i) => {
                              const isPromoted = r.result === "promoted";
                              const isDemoted = r.result === "demoted";
                              const weekEnd = new Date(r.week_ending);
                              const weekStart = new Date(weekEnd);
                              weekStart.setUTCDate(weekStart.getUTCDate() - 6);
                              const fmt = d => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
                              const dateRange = `${fmt(weekStart)} — ${fmt(weekEnd)}`;
                              const prev = historyCache[player.player_tag][i + 1];
                              const trophyDiff = prev?.pre_trophies && r.pre_trophies ? r.pre_trophies - prev.pre_trophies : null;
                              return (
                                <div key={i} className={`rounded-lg border p-2.5 space-y-1.5 ${isPromoted ? "border-green-500/30 bg-green-500/[0.03]" : isDemoted ? "border-red-500/30 bg-red-500/[0.03]" : "border-white/[0.06] bg-white/[0.02]"}`}>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[8px] text-slate-500 uppercase tracking-widest">{dateRange}</span>
                                    <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${isPromoted ? "text-green-400 bg-green-500/10" : isDemoted ? "text-red-400 bg-red-500/10" : "text-slate-400 bg-white/[0.04]"}`}>
                                      {isPromoted ? "↑ Promoted" : isDemoted ? "↓ Demoted" : "→ Stayed"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1 min-w-0 flex-1">
                                      {r.pre_league && <img
                                        src={`/icons/leagues/${r.pre_league.split(" ")[0].toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`}
                                        alt={r.pre_league} className="w-5 h-5 object-contain shrink-0"
                                        onError={e => { e.target.src = r.pre_league_icon || ""; }}/>}
                                      <span className="text-[9px] text-slate-400 truncate">{r.pre_league}</span>
                                      {r.pre_league !== r.post_league && (
                                        <>
                                          <span className="text-slate-600 text-[9px]">→</span>
                                          {r.post_league && <img
                                            src={`/icons/leagues/${r.post_league.split(" ")[0].toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`}
                                            alt={r.post_league} className="w-5 h-5 object-contain shrink-0"
                                            onError={e => { e.target.src = r.post_league_icon || ""; }}/>}
                                          <span className={`text-[9px] font-semibold truncate ${isPromoted ? "text-green-300" : "text-red-300"}`}>{r.post_league}</span>
                                        </>
                                      )}
                                    </div>
                                    {r.pre_trophies > 0 && (
                                      <div className="flex items-center gap-1 shrink-0">
                                        <span className="text-[10px] font-semibold text-purple-300">{r.pre_trophies.toLocaleString()}</span>
                                        {trophyDiff !== null && (
                                          <span className={`text-[8px] font-bold ${trophyDiff > 0 ? "text-green-400" : trophyDiff < 0 ? "text-red-400" : "text-slate-500"}`}>
                                            {trophyDiff > 0 ? `↑+${trophyDiff}` : `↓${trophyDiff}`}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {data.groups.length === 0 && (
              <p className="text-slate-500 text-xs text-center py-8">No ranked data yet — check back after the next weekly snapshot.</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}

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
    <main className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      <img src="/roster-bg.png" alt="" className="fixed inset-0 select-none pointer-events-none opacity-20" style={{width:"100vw",height:"100dvh",objectFit:"cover",objectPosition:"center top"}}/>
      </div>

      <AppHeader variant="bar"/>

      {/* Hero card */}
      <div className="relative z-10 mb-4 text-center">
        <h1 className="text-4xl font-thin tracking-widest mb-1">War Intel</h1>
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
          {[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/10 bg-white/[0.04] h-24 animate-pulse"/>)}
        </div>
      ) : (
        <div className="relative z-10 space-y-4">

          {/* ── DAYS TAB ── */}
          {tab === "days" && (
            <>
              {/* War momentum cumulative chart — above bar chart */}
              {dayAggregates.length >= 2 && <WarMomentumChart dayAggregates={dayAggregates} />}

              {/* Avg stars bar chart */}
              <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
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
            <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
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
            <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
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

function RecapView({ onBack }) {
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [stats, setStats] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [sharingClan, setSharingClan] = useState(false);
  const [copiedClan, setCopiedClan] = useState(false);
  const [showClanShareCard, setShowClanShareCard] = useState(false);
  const [fullHistory, setFullHistory] = useState([]);
  const [selectedClan, setSelectedClan] = useState("alliance");
  const [clanRounds, setClanRounds] = useState([]);
  const recapCardRef = useRef(null);
  const clanCardRef = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/leaderboard").then(r => r.json()),
      fetch("/api/history").then(r => r.json()),
    ]).then(([lb, hist]) => {
      setSeasons(lb.seasons || []);
      setSelectedSeason(lb.currentSeason || lb.seasons?.[0] || null);
      setHistory(hist.history || []);
      setFullHistory(hist.history || []);
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

  // Fetch per-round war data when clan selected
  useEffect(() => {
    if (!selectedSeason || selectedClan === "alliance") { setClanRounds([]); return; }
    fetch(`/api/clan-rounds?season=${encodeURIComponent(selectedSeason)}&clan=${encodeURIComponent(selectedClan)}`)
      .then(r => r.json())
      .then(d => setClanRounds(d.rounds || []))
      .catch(() => setClanRounds([]));
    // Ensure fullHistory is populated for promo/demo detection
    if (fullHistory.length === 0) {
      fetch("/api/history")
        .then(r => r.json())
        .then(d => setFullHistory(d.history || []))
        .catch(() => {});
    }
  }, [selectedSeason, selectedClan]);

  // Derived data
  const seasonHistory = history.filter(r => r.season === selectedSeason);
  const totalWars = seasonHistory.reduce((s,r) => s + (r.wars_won||0) + (r.wars_lost||0) + (r.wars_drawn||0), 0);
  const totalWins = seasonHistory.reduce((s,r) => s + (r.wars_won||0), 0);
  const totalLosses = seasonHistory.reduce((s,r) => s + (r.wars_lost||0), 0);
  const totalDraws = seasonHistory.reduce((s,r) => s + (r.wars_drawn||0), 0);

  // Filter stats by selected clan
  const filteredStats = selectedClan === "alliance" ? stats : stats.filter(p => p.clan_name === selectedClan);
  const validPlayers = filteredStats.filter(p => p.overall != null).sort((a,b) => b.overall - a.overall);
  const top3 = validPlayers.slice(0, 3);

  const withAttacksFiltered = filteredStats.filter(p => p.attacks_used > 0);
  const bestAttacker = [...withAttacksFiltered].sort((a,b) => parseFloat(b.efficiency||0) - parseFloat(a.efficiency||0))[0];
  const bestDefender = [...filteredStats].filter(p => p.attacks_available > 0).sort((a,b) => parseFloat(a.defence_efficiency||0) - parseFloat(b.defence_efficiency||0))[0];

  const clanWithOverall = seasonHistory.map(c => ({
    ...c,
    overall: parseFloat(((parseFloat(c.attack_efficiency||0)*0.5)+((3-parseFloat(c.defence_efficiency||0))*0.3)+((c.wars_won||0)/7*3*0.2)).toFixed(2))
  })).sort((a,b) => b.overall - a.overall);
  const topClan = clanWithOverall[0];

  // Total alliance stars
  const totalAllianceStars = seasonHistory.reduce((s,r) => s + (r.total_stars||0), 0);

  // Season awards for share card — scoped to selected clan
  const withAttacks = withAttacksFiltered;
  const awardMostThreeStars = [...withAttacks].sort((a,b) => (b.three_stars||0) - (a.three_stars||0))[0];
  const awardClutchKing = [...withAttacks].filter(p => p.clutch_rate != null).sort((a,b) => parseFloat(b.clutch_rate||0) - parseFloat(a.clutch_rate||0))[0];
  const awardPunchUpKing = [...withAttacks].filter(p => p.punch_up_rate != null).sort((a,b) => parseFloat(b.punch_up_rate||0) - parseFloat(a.punch_up_rate||0))[0];
  const awardIronDefence = [...filteredStats].filter(p => p.attacks_available > 0).sort((a,b) => parseFloat(a.defence_efficiency||999) - parseFloat(b.defence_efficiency||999))[0];
  const awardMostConsistent = [...withAttacks].filter(p => p.consistency_score != null).sort((a,b) => parseFloat(b.consistency_score||0) - parseFloat(a.consistency_score||0))[0];

  // Previous season delta
  const selectedSeasonIdx = seasons.indexOf(selectedSeason);
  const prevSeason = selectedSeasonIdx >= 0 && selectedSeasonIdx < seasons.length - 1 ? seasons[selectedSeasonIdx + 1] : null;
  const prevSeasonHistory = prevSeason ? history.filter(r => r.season === prevSeason) : [];
  // Previous season rank — sort fullHistory by parsed date, find entry immediately before current season
  const parseSeasonDate = (s) => {
    if (!s) return new Date(0);
    // Handle "June 16 2026" and "June 2026" formats
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date(0) : d;
  };
  const allHistory = fullHistory.length > 0 ? fullHistory : history;
  const clanAllSeasons = allHistory
    .filter(h => h.clan_name === selectedClan)
    .sort((a, b) => parseSeasonDate(a.season) - parseSeasonDate(b.season)); // oldest first
  const curSeasonIdx = clanAllSeasons.findIndex(h => h.season === selectedSeason);
  const prevClanRank = curSeasonIdx > 0
    ? clanAllSeasons[curSeasonIdx - 1]?.cwl_rank || null
    : null;
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

  async function handleClanShare() {
    if (sharingClan) return;
    setSharingClan(true);
    setShowClanShareCard(true);
    await new Promise(r => setTimeout(r, 100));
    try {
      const { shareCard } = await import("@/lib/shareCard");
      const clanSlug = selectedClan.toLowerCase().replace(/\s+/g, "-").replace(/[{}]/g, "");
      const result = await shareCard(clanCardRef.current, `cgn-recap-${clanSlug}-${(selectedSeason||"season").toLowerCase().replace(/\s+/g,"-")}.png`);
      if (result?.copied) {
        setCopiedClan(true);
        setTimeout(() => setCopiedClan(false), 2500);
      }
    } catch (e) {
      console.error("Clan share failed", e);
    } finally {
      setSharingClan(false);
      setShowClanShareCard(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">

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
            awardMostConsistent={awardMostConsistent}
            seasonMvp={top3[0]}
          />
        </div>
      )}

      {/* Hidden per-clan recap share card */}
      {showClanShareCard && selectedClan !== "alliance" && (
        <div ref={clanCardRef} style={{ position: "fixed", top: 0, left: "-9999px", zIndex: -1, pointerEvents: "none" }}>
          <ClanRecapShareCard
            clanName={selectedClan}
            selectedSeason={selectedSeason}
            clanData={seasonHistory.find(h => h.clan_name === selectedClan)}
            top3={top3}
            bestAttacker={bestAttacker}
            bestDefender={bestDefender}
            awardMostThreeStars={awardMostThreeStars}
            awardClutchKing={awardClutchKing}
            awardPunchUpKing={awardPunchUpKing}
            awardIronDefence={awardIronDefence}
            awardMostConsistent={awardMostConsistent}
            seasonMvp={top3[0]}
            rounds={clanRounds}
            prevCwlRank={prevClanRank}
            currentCwlRank={(() => {
              // For historical seasons derive current rank from next season's cwl_rank
              // use fullHistory (all seasons) to find the next season correctly
              const parseSeasonDate2 = (s) => { if (!s) return new Date(0); const d = new Date(s); return isNaN(d.getTime()) ? new Date(0) : d; };
              const allClanSeasons = [...(fullHistory.length > 0 ? fullHistory : history)]
                .filter(h => h.clan_name === selectedClan)
                .sort((a, b) => parseSeasonDate2(a.season) - parseSeasonDate2(b.season));
              const thisIdx = allClanSeasons.findIndex(h => h.season === selectedSeason);
              const nextSeason = thisIdx >= 0 && thisIdx < allClanSeasons.length - 1 ? allClanSeasons[thisIdx + 1] : null;
              // If no next season found — show no change (same as current)
              if (!nextSeason) return seasonHistory.find(h => h.clan_name === selectedClan)?.cwl_rank || null;
              return nextSeason.cwl_rank || null;
            })()}
          />
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      <img src="/roster-bg.png" alt="" className="fixed inset-0 select-none pointer-events-none opacity-20" style={{width:"100vw",height:"100dvh",objectFit:"cover",objectPosition:"center top"}}/>
      </div>

      <AppHeader variant="bar"/>

      {/* Header */}
      <div className="relative z-10 mb-4 text-center">
        <h1 className="text-4xl font-thin tracking-widest mb-1">Season Recap</h1>
        {seasons.length > 1 ? (
          <select value={selectedSeason||""} onChange={e => { setSelectedSeason(e.target.value); setSelectedClan("alliance"); }}
            className="mt-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white focus:outline-none [color-scheme:dark]">
            {seasons.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        ) : (
          <p className="text-slate-500 text-xs mt-1">{selectedSeason}</p>
        )}
        {/* Clan filter dropdown */}
        {seasonHistory.length > 0 && (
          <select value={selectedClan} onChange={e => setSelectedClan(e.target.value)}
            className="mt-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white focus:outline-none [color-scheme:dark]">
            <option value="alliance">Alliance</option>
            {[...seasonHistory].sort((a,b) => {
              const o = n => n.toLowerCase().startsWith("cognition") ? 0 : n.toLowerCase().startsWith("gems") ? 10 : 5;
              return o(a.clan_name) - o(b.clan_name);
            }).map(h => (
              <option key={h.clan_name} value={h.clan_name}>{h.clan_name}</option>
            ))}
          </select>
        )}

        {/* Share button — alliance or per-clan */}
        {!loading && (selectedClan === "alliance" ? topClan : seasonHistory.find(h => h.clan_name === selectedClan)) && (() => {
          const isClan = selectedClan !== "alliance";
          const isSharing = isClan ? sharingClan : sharing;
          const isCopied = isClan ? copiedClan : copied;
          const onClick = isClan ? handleClanShare : handleShare;
          return (
            <div className="flex justify-center mt-3">
              <button onClick={onClick} disabled={isSharing}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border transition text-[10px] uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed ${
                  isCopied
                    ? "border-green-500/50 bg-green-500/10 text-green-400"
                    : "border-purple-500/40 bg-purple-500/10 text-purple-300 hover:border-purple-400/60 hover:bg-purple-500/20"
                }`}>
                {isSharing ? (
                  <><svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>Generating…</>
                ) : isCopied ? (
                  <><svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Copied</>
                ) : (
                  <><svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                  {isClan ? `Share ${selectedClan.split(" ")[0]} Recap` : "Share Recap"}</>
                )}
              </button>
            </div>
          );
        })()}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-600 text-xs tracking-widest uppercase animate-pulse">Loading…</p>
        </div>
      ) : (
        <div className="relative z-10 space-y-4">

          {/* Top Clan (alliance) or Clan Header (per-clan) */}
          {selectedClan === "alliance" ? (
            topClan && (
              <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 flex flex-col items-center text-center gap-3">
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
            )
          ) : (() => {
            const clanData = seasonHistory.find(h => h.clan_name === selectedClan);
            if (!clanData) return null;
            const clanStars = filteredStats.reduce((s,p) => s + (p.stars_earned||0), 0);
            const threeStarCount = filteredStats.reduce((s,p) => s + (p.three_stars||0), 0);
            const totalAtks = filteredStats.reduce((s,p) => s + (p.attacks_used||0), 0);
            return (
              <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 flex flex-col items-center text-center gap-3">
                <p className="text-[9px] text-slate-600 uppercase tracking-widest">{clanData.cwl_rank}</p>
                <p className="text-2xl font-thin tracking-widest text-white">{selectedClan.split(" ")[0]}</p>
                <div className="flex items-center justify-center gap-4 w-full pt-2 border-t border-white/[0.06]">
                  <div className="text-center">
                    <p className="text-xl font-thin text-green-300">{clanData.wars_won}</p>
                    <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Wins</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-thin text-red-400">{clanData.wars_lost}</p>
                    <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Losses</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-thin text-amber-300">{clanStars}</p>
                    <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Stars</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-thin text-purple-300">{parseFloat(clanData.attack_efficiency||0).toFixed(2)}</p>
                    <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Atk EFF</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-thin text-green-300">{totalAtks > 0 ? Math.round((threeStarCount/totalAtks)*100) : 0}%</p>
                    <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">3★ Rate</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Top 3 players */}
          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Top Players · CGN Rating</p>
            <div className="space-y-2">
              {top3.map((p, i) => (
                <a key={p.player_tag} href={`/player/${p.player_tag.replace("#","")}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 hover:border-white/20 hover:bg-white/[0.04] transition no-underline">
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

          {/* Per-clan round breakdown */}
          {selectedClan !== "alliance" && clanRounds.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
              <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">CWL Round Breakdown</p>
              <div className="space-y-1.5">
                {clanRounds.map((r, i) => {
                  const won = r.stars_earned > r.stars_conceded || (r.stars_earned === r.stars_conceded && r.destruction_pct > r.defence_pct);
                  const lost = r.stars_earned < r.stars_conceded || (r.stars_earned === r.stars_conceded && r.destruction_pct < r.defence_pct);
                  const colour = won ? "text-green-400 border-green-500/20" : lost ? "text-red-400 border-red-500/20" : "text-slate-400 border-white/10";
                  return (
                    <div key={i} className={`flex items-center justify-between rounded-lg border ${colour} bg-white/[0.02] px-3 py-2`}>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-600 uppercase tracking-widest w-12">R{r.war_day}</span>
                        <span className="text-xs text-slate-400 truncate max-w-[100px]">{r.opponent_clan}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-semibold text-amber-300">{r.stars_earned}★</span>
                        <span className="text-[9px] text-slate-600">vs</span>
                        <span className="text-xs text-slate-500">{r.stars_conceded}★</span>
                        <span className={`text-[9px] font-semibold uppercase tracking-widest ${won ? "text-green-400" : lost ? "text-red-400" : "text-slate-500"}`}>
                          {won ? "W" : lost ? "L" : "D"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Standout performers */}
          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Standout Performers</p>
            <div className="grid grid-cols-2 gap-2">
              {bestAttacker && (
                <a href={`/player/${bestAttacker.player_tag.replace("#","")}`} target="_blank" rel="noopener noreferrer"
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 hover:border-white/20 hover:bg-white/[0.04] transition no-underline">
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
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 hover:border-white/20 hover:bg-white/[0.04] transition no-underline">
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
          <SeasonAwards stats={filteredStats} />

          {/* Alliance Performance */}
          {filteredStats.length > 0 && (
            <AlliancePerformanceTile stats={filteredStats} totalAllianceStars={filteredStats.reduce((s,p) => s + (p.stars_earned||0), 0)} />
          )}

          {/* Alliance war record */}
          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Alliance War Record</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-center">
                <p className="text-2xl font-thin text-green-300">{totalWins}</p>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Won</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-center">
                <p className="text-2xl font-thin text-red-400">{totalLosses}</p>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Lost</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-center">
                <p className="text-2xl font-thin text-slate-500">{totalDraws}</p>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Drawn</p>
              </div>
            </div>
            {/* Clan breakdown */}
            <div className="mt-3 space-y-1.5">
              {clanWithOverall.map((c, i) => (
                <div key={c.clan_tag || c.clan_name} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
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

// ─── Leaderboard metric info modal ───────────────────────────────────────────

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
    <main className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      <img src="/roster-bg.png" alt="" className="fixed inset-0 select-none pointer-events-none opacity-20" style={{width:"100vw",height:"100dvh",objectFit:"cover",objectPosition:"center top"}}/>
      </div>

      <AppHeader variant="bar"/>

      <div className="relative z-10 mb-4 text-center">
        <h1 className="text-4xl font-thin tracking-widest mb-1">CWL Leaderboard</h1>
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
              <>
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
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition"/>
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
function CwlProgressTile({ onNavigate }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/cwl-progress")
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData({ active: false }));
  }, []);

  if (!data || !data.active) return null;

  const { season, isComplete, currentRound, totals, clans, topAttackers, topDefender } = data;
  const allianceEff = totals.totalAttacks > 0
    ? (totals.totalStars / totals.totalAttacks).toFixed(2)
    : "—";
  const MEDAL_PATH = "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z";
  const medalColours = ["#D4AF37", "#A7A7AD", "#CD7F32"];

  return (
    <div className="rounded-xl border border-purple-500/20 bg-white/[0.04] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/[0.08] to-indigo-500/[0.06] px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-[9px] text-purple-400 uppercase tracking-widest font-semibold mb-0.5">
            {isComplete ? "Season Complete" : `Round ${currentRound} of 7`}
          </p>
          <p className="text-sm font-semibold text-white">{season} · CWL</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-2xl font-thin text-purple-300 tabular-nums">{totals.totalStars}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">Alliance Stars</p>
          </div>
          {!isComplete && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
              <span className="text-[10px] text-green-300">Live</span>
            </div>
          )}
        </div>
      </div>

      {/* Clan standings */}
      {clans.length > 0 && (
        <div className="px-5 pt-4 pb-3 border-b border-white/[0.06]">
          <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-2.5">Clan Standings</p>
          <div className="space-y-2">
            {clans.map((c, i) => (
              <div key={c.clan_name} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke={medalColours[i] || "#475569"} strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={MEDAL_PATH}/>
                  </svg>
                  <span className="text-xs text-white truncate">{c.clan_name.split(" ")[0]}</span>
                  {c.cwl_rank && <span className="text-[9px] text-slate-600 shrink-0">{c.cwl_rank}</span>}
                </div>
                <div className="flex items-center gap-3 shrink-0 text-[11px]">
                  <span className="text-green-400 font-semibold">{c.wars_won ?? "—"}W</span>
                  <span className="text-red-400">{c.wars_lost ?? "—"}L</span>
                  <span className="text-purple-300 tabular-nums">{c.attack_efficiency ? parseFloat(c.attack_efficiency).toFixed(2) : "—"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top attackers */}
      {topAttackers.length > 0 && (
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-2.5">Top Attackers</p>
          <div className="space-y-1.5">
            {topAttackers.slice(0, 3).map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[9px] text-slate-600 w-3 shrink-0">{i + 1}</span>
                  <span className="text-xs text-white truncate">{p.player_name}</span>
                  <span className="text-[9px] text-slate-600 shrink-0">{p.clan_name.split(" ")[0]}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-purple-300 tabular-nums">{parseFloat(p.efficiency).toFixed(2)}</span>
                  <span className="text-[9px] text-slate-600">{p.attacks_used}atk</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer: alliance EFF + best defence + CTA */}
      <div className="px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-0.5">Alliance EFF</p>
            <p className="text-lg font-semibold text-purple-300 tabular-nums">{allianceEff}</p>
          </div>
          {topDefender && (
            <div>
              <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-0.5">Best Defence</p>
              <p className="text-xs font-semibold text-blue-300">{topDefender.player_name}</p>
              <p className="text-[10px] text-slate-500 tabular-nums">{parseFloat(topDefender.defence_efficiency).toFixed(2)} Def EFF</p>
            </div>
          )}
        </div>
        <button onClick={() => onNavigate("leaderboard")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-purple-500/[0.1] text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-400 transition shrink-0">
          Full Stats
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

function SideWarTime({ war }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  if (!war.start_time) return (
    <div>
      <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Start Time</p>
      <p className="text-sm font-semibold text-slate-400">TBC</p>
    </div>
  );

  const start = new Date(war.start_time);
  const isRecurring = war.time_format === "recurring";
  let target;

  if (isRecurring) {
    const cycle = 48 * 60 * 60 * 1000;
    const elapsed = now - start;
    if (elapsed < 0) {
      target = start;
    } else {
      const cyclesDone = Math.floor(elapsed / cycle);
      target = new Date(start.getTime() + (cyclesDone + 1) * cycle);
    }
  } else {
    target = start;
  }

  const msLeft = Math.max(0, target - now);
  const days = Math.floor(msLeft / 86400000);
  const hours = Math.floor((msLeft % 86400000) / 3600000);
  const mins = Math.floor((msLeft % 3600000) / 60000);
  const isLive = msLeft === 0;

  // For recurring wars that are live, calculate next cycle (current target + 48h)
  const nextMs = isRecurring && isLive
    ? Math.max(0, new Date(target.getTime() + 48 * 60 * 60 * 1000) - now)
    : null;
  const nextDays = nextMs != null ? Math.floor(nextMs / 86400000) : null;
  const nextHours = nextMs != null ? Math.floor((nextMs % 86400000) / 3600000) : null;
  const nextMins = nextMs != null ? Math.floor((nextMs % 3600000) / 60000) : null;

  return (
    <div>
      <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">
        {isRecurring ? "Next War In" : "War Starts In"}
      </p>
      {isLive ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
            <span className="text-sm font-semibold text-green-300">Live Now</span>
          </div>
          {nextMs != null && (
            <div>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-0.5">Next Round In</p>
              <div className="flex items-baseline gap-1.5">
                {nextDays > 0 && <>
                  <span className="text-lg font-thin tracking-widest text-pink-300 tabular-nums">{nextDays}</span>
                  <span className="text-[10px] text-slate-500 mr-1">d</span>
                </>}
                <span className="text-lg font-thin tracking-widest text-pink-300 tabular-nums">{String(nextHours).padStart(2,"0")}</span>
                <span className="text-[10px] text-slate-500">h</span>
                <span className="text-lg font-thin tracking-widest text-pink-300 tabular-nums">{String(nextMins).padStart(2,"0")}</span>
                <span className="text-[10px] text-slate-500">m</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-baseline gap-1.5">
          {days > 0 && <>
            <span className="text-2xl font-thin tracking-widest text-pink-300 tabular-nums" style={{fontFamily:"var(--font-orbitron)"}}>{days}</span>
            <span className="text-[10px] text-slate-500 mr-1">d</span>
          </>}
          <span className="text-2xl font-thin tracking-widest text-pink-300 tabular-nums" style={{fontFamily:"var(--font-orbitron)"}}>{String(hours).padStart(2,"0")}</span>
          <span className="text-[10px] text-slate-500">h</span>
          <span className="text-2xl font-thin tracking-widest text-pink-300 tabular-nums" style={{fontFamily:"var(--font-orbitron)"}}>{String(mins).padStart(2,"0")}</span>
          <span className="text-[10px] text-slate-500">m</span>
        </div>
      )}
    </div>
  );
}

function SideWarsSection({ onNavigate }) {
  const [wars, setWars] = useState(null);
  const [anyRosterPublished, setAnyRosterPublished] = useState(false);

  useEffect(() => {
    fetch("/api/side-wars")
      .then(r => r.json())
      .then(d => setWars(d.wars || []))
      .catch(() => setWars([]));
    fetch("/api/roster-status")
      .then(r => r.json())
      .then(d => setAnyRosterPublished(d.anyPublished || false))
      .catch(() => {});
  }, []);

  // null = still loading, don't render anything yet
  if (wars === null) return null;
  // no active wars — render Sign Up or View Rosters tile based on published state
  if (wars.length === 0) return (
    <>
      {/* Sign Up (pre-publish) or View Rosters (post-publish) */}
      {anyRosterPublished ? (
        <a href="/rosters"
          className="block rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 hover:bg-white/[0.06] hover:border-green-500/30 transition group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/[0.1] border border-green-500/20 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white" style={{fontFamily:"var(--font-orbitron)"}}>View Rosters</p>
                <p className="text-[11px] text-slate-500 mt-0.5">CWL rosters are live — see your clan lineup</p>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500 group-hover:text-green-300 group-hover:translate-x-0.5 transition shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </a>
      ) : (
        <a href="/signup"
          className="block rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 hover:bg-white/[0.06] hover:border-purple-500/30 transition group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/[0.1] border border-purple-500/20 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white" style={{fontFamily:"var(--font-orbitron)"}}>Sign Up for CWL</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Link your accounts &amp; join the player pool</p>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500 group-hover:text-purple-300 group-hover:translate-x-0.5 transition shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </a>
      )}

    </>
  );

  // Active wars — replace Sign Up + Rosters with war tiles
  return (
    <>
      {wars.map(war => (
        <div key={war.id}
          className="rounded-xl border border-pink-500/20 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
          {/* Header strip */}
          <div className="relative h-16 bg-gradient-to-r from-pink-500/[0.08] to-purple-500/[0.08] flex items-center px-5 gap-3 overflow-hidden">
            <img src="/icons/branding/war-shield.png" alt="Side War" className="w-10 h-10 shrink-0"/>
            <div>
              <p className="text-[9px] text-pink-400 uppercase tracking-widest font-semibold">Side War · Ore War</p>
              <p className="text-sm font-semibold text-white leading-tight" style={{fontFamily:"var(--font-orbitron)"}}>{war.clan_name}</p>
            </div>
            <img src="/icons/branding/ores.png" alt="Ores" className="absolute right-0 bottom-0 h-14 w-auto object-contain opacity-90 pointer-events-none"/>
          </div>
          {/* Time + CTA */}
          <div className="px-5 py-4 flex items-center justify-between gap-3">
            <SideWarTime war={war}/>
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
          <span className="text-3xl font-thin tracking-widest text-green-300" style={{fontFamily:"var(--font-orbitron)"}}>Live Now</span>
        </div>
      ) : (
        <div className="flex items-baseline gap-3">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-thin tracking-widest text-purple-300 tabular-nums" style={{fontFamily:"var(--font-orbitron)"}}>{timeLeft.days}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">days</span>
          </div>
          <span className="text-2xl text-slate-600 font-thin">:</span>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-thin tracking-widest text-purple-300 tabular-nums" style={{fontFamily:"var(--font-orbitron)"}}>{String(timeLeft.hours).padStart(2,"0")}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">hrs</span>
          </div>
          <span className="text-2xl text-slate-600 font-thin">:</span>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-thin tracking-widest text-purple-300 tabular-nums" style={{fontFamily:"var(--font-orbitron)"}}>{String(timeLeft.minutes).padStart(2,"0")}</span>
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
    return <div className="h-24 rounded-lg bg-white/[0.03] animate-pulse"/>;
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
  const [page, setPage] = useState("home");
  const [cwlActive, setCwlActive] = useState(false);

  useEffect(() => {
    // Check if CWL progress data exists to toggle Stats tile visibility
    fetch("/api/cwl-progress")
      .then(r => r.json())
      .then(d => setCwlActive(d.active === true))
      .catch(() => setCwlActive(false));
  }, []);
  useEffect(() => {
    const syncFromHash = () => {
      const hash = decodeURIComponent(window.location.hash.replace("#", ""));
      if (["roster"].includes(hash)) {
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
    return <RosterHubView onNavigateHome={() => navigate("home")} onNavigateProfile={tag => { sessionStorage.setItem("profileSearchTag", tag); window.location.href = "/profile"; }} />;
  }
  if (page === "leaderboard") {
    return <LeaderboardView onBack={() => navigate("home")} />;
  }
  if (page === "history") {
    if (typeof window !== "undefined") window.location.href = "/history";
    return null;
  }
  if (page === "recap") {
    if (typeof window !== "undefined") window.location.href = "/recap";
    return null;
  }
  if (page === "warintel") {
    if (typeof window !== "undefined") window.location.href = "/war-intel";
    return null;
  }

  if (page === "profile") {
    if (typeof window !== "undefined") window.location.href = "/profile";
    return null;
  }

  if (page === "ranked") {
    if (typeof window !== "undefined") window.location.href = "/ranked";
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      <img src="/roster-bg.png" alt="" className="fixed inset-0 select-none pointer-events-none opacity-20" style={{width:"100vw",height:"100dvh",objectFit:"cover",objectPosition:"center top"}}/>
      </div>

      <AppHeader variant="bar"/>

      {/* Brand hero */}
      <div className="relative z-10 text-center mb-6">
        <img src={BRANDING.cwlhub} alt="CWL Hub" className="w-40 h-40 mx-auto"/>
      </div>

      <div className="relative z-10 space-y-4 max-w-lg mx-auto">

        {/* Countdown — standalone, centred */}
        <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
          <CwlCountdown/>
        </div>

        {/* Side Wars when active, otherwise Sign Up + Rosters */}
        <SideWarsSection onNavigate={navigate}/>

        {/* CWL Progress — replaces Stats tile during CWL week */}
        <CwlProgressTile onNavigate={navigate}/>

        {/* Stats gateway — hidden during CWL week (CwlProgressTile takes over) */}
        {!cwlActive && (
        <button onClick={() => navigate("leaderboard")}
          className="w-full text-left rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 hover:bg-white/[0.06] hover:border-purple-500/30 transition group">
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
        )}
      </div>
      <AppFooter showHome={false}/>
    </main>
  );
}

function RosterHubView({ onNavigateHome, onNavigateProfile }) {
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
    return <PlayersView players={players} rosterSeasons={rosterSeasons} onBack={() => { window.history.pushState({}, "", window.location.pathname); setStatView(null); }} onNavigateProfile={onNavigateProfile} />;
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
    <main className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      <img src="/roster-bg.png" alt="" className="fixed inset-0 select-none pointer-events-none opacity-20" style={{width:"100vw",height:"100dvh",objectFit:"cover",objectPosition:"center top"}}/>
      </div>
      <div className="relative z-10 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 mb-4 flex flex-col items-center text-center gap-2">
        <img src={CWL_ICONS[rank] || CWL_ICONS["unranked"]} alt={rank} className="w-12 h-12"/>
        <h1 className="text-4xl font-thin tracking-widest">{selectedClan}</h1>
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
            className={`rounded-lg border backdrop-blur-xl p-3 transition cursor-pointer
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
  className="relative z-20 mb-4 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 text-center"
>

  <h1 className="text-4xl font-thin tracking-widest">
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
        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition"
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
        <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-white/10 bg-[#0d1424]/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50">
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
        <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-white/10 bg-[#0d1424]/95 backdrop-blur-xl shadow-2xl p-4 text-center z-50">
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
          className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 min-h-[90px] flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.06] hover:border-white/20 transition shadow-xl">
          <div className="text-3xl font-thin tracking-widest text-white tabular-nums">{players.length}</div>
          <div className="text-slate-400 text-xs uppercase tracking-widest mt-1">Players</div>
        </div>
        <div
          onClick={() => { window.history.pushState({}, "", "#clans"); setStatView("clans"); }}
          className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 min-h-[90px] flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.06] hover:border-white/20 transition">
          <div className="text-3xl font-thin tracking-widest text-white tabular-nums">{clans.length}</div>
          <div className="text-slate-400 text-xs uppercase tracking-widest mt-1">Clans</div>
        </div>
        <div
          onClick={() => { window.history.pushState({}, "", "#avgth"); setStatView("avgth"); }}
          className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 min-h-[90px] flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.06] hover:border-white/20 transition">
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
              rounded-xl
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

                <div className="text-2xl font-bold mt-2" style={{fontFamily:"var(--font-orbitron)"}}>
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
