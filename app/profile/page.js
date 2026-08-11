"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  leagueSlug, ProfileEqTile, ProfileUnitTile, AppHeader, PROFILE_EQUIPMENT_LOOKUP,
} from "@/app/components/shared-views";
import {
  PROFILE_HERO_ORDER, PROFILE_ROLE_LABELS,
} from "@/lib/shared-constants";

function PlayerProfileView() {
  const router = useRouter();
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
    setSearching(true); setArmy(null); setError(null); setNameResults([]); setIconsReady(false); setProfileView("army"); setUpgrades(null); setTourneyHistory(null); setSelectedHero(null);
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
                className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
              <button type="submit" disabled={searching || !query.trim()}
                className="shrink-0 rounded-lg border border-purple-500/30 bg-purple-600/30 text-purple-200 hover:bg-purple-600/50 transition disabled:opacity-40 px-3 py-1 text-xs font-semibold">
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
              className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
            <button type="submit" disabled={searching || !query.trim()}
              className="shrink-0 rounded-lg border border-purple-500/30 bg-purple-600/30 text-purple-200 hover:bg-purple-600/50 transition disabled:opacity-40 px-3 py-1 text-xs font-semibold">
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
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-blue-500/40 bg-transparent">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                  </svg>
                  <span className="text-xs font-semibold text-blue-300">{army.expLevel ?? "—"}</span>
                  <span className="text-[9px] text-slate-600 uppercase tracking-wide">Lvl</span>
                </div>
                {/* War Stars — amber */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-500/40 bg-transparent">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                  </svg>
                  <span className="text-xs font-semibold text-amber-300">{army.warStars?.toLocaleString() ?? "—"}</span>
                  <span className="text-[9px] text-slate-600 uppercase tracking-wide">War Stars</span>
                </div>
                {/* Donations — green house */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-green-500/40 bg-transparent">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                  </svg>
                  <span className="text-xs font-semibold text-green-300">{army.donations?.toLocaleString() ?? "—"}</span>
                  <span className="text-[9px] text-slate-600 uppercase tracking-wide">Donations</span>
                </div>
                {/* Trophies — purple trophy */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-purple-500/40 bg-transparent">
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
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg ${isPromoted ? "text-green-400 bg-green-500/10" : isDemoted ? "text-red-400 bg-red-500/10" : "text-slate-400 bg-white/[0.04]"}`}>
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
                            className={`text-[8px] px-2 py-0.5 rounded-lg border transition ${eqSort===m?"border-purple-500/60 bg-purple-500/20 text-purple-300":"border-white/10 text-slate-600 hover:text-slate-400"}`}>
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

export default PlayerProfileView;
