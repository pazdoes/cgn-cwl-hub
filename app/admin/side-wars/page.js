"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DiscordWidget from "@/app/components/DiscordWidget";

function AppHeader() {
  const [navOpen, setNavOpen] = useState(false);
  const ORB = {fontFamily:"var(--font-orbitron)"};
  const navSections = [
    { label: null, items: [
      { href: "/admin", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    ]},
    { label: "CWL", items: [
      { href: "/admin/pool", label: "Pool Manager", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
      { href: "/admin/roster-compliance", label: "Roster Compliance", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
      { href: "/admin/war-day-tracker", label: "War Day Tracker", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
      { href: "/admin/season", label: "Season Manager", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    ]},
    { label: "SIDE WARS", items: [
      { href: "/admin/side-wars", label: "Side Wars", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
    ]},
    { label: "ANNOUNCEMENTS", items: [
      { href: "/admin/announcements", label: "Announcements", icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
      { href: "/admin/share-cards", label: "Share Cards", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
    ]},
    { label: "DIRECTORY", items: [
      { href: "/admin/directory", label: "Members", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6-3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
      { href: "/admin/missing-members", label: "Missing Members", icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" },
      { href: "/admin/clans", label: "Clan Manager", icon: "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" },
    ]},
  ];
  return (
    <>
      <div className={`fixed inset-0 z-50 flex transition-opacity duration-150 ${navOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={() => setNavOpen(false)}>
        <div className="absolute inset-0 bg-black/60"/>
        <div onClick={e => e.stopPropagation()} className={`relative z-10 w-72 max-w-[80vw] h-full bg-[#0b1020]/80 backdrop-blur-2xl border-r border-white/10 flex flex-col p-5 transition-transform duration-150 ${navOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center gap-2 mb-8">
            <img src="/icons/branding/cgn-skull.png" alt="CGN" className="w-7 h-7"/>
            <span className="text-sm text-white tracking-widest uppercase" style={ORB}>Cognition Collective</span>
          </div>
          <nav className="flex-1 space-y-4 overflow-y-auto">
            {navSections.map((section, si) => (
              <div key={si}>
                {section.label && <p className="text-[9px] text-slate-600 uppercase tracking-widest px-3 mb-1">{section.label}</p>}
                <div className="space-y-0.5">
                  {section.items.map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setNavOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/>
                      </svg>
                      <span style={ORB}>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <div className="border-t border-white/10 pt-4 mt-4">
            <Link href="/" onClick={() => setNavOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              <span style={ORB}>Back to App</span>
            </Link>
          </div>
        </div>
      </div>
      <div className="relative z-10 flex items-center justify-between mb-4 gap-2">
        <button onClick={() => setNavOpen(true)} className="text-slate-400 hover:text-white transition p-1 shrink-0" title="Menu">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <img src="/icons/branding/cgn-skull.png" alt="CGN" className="w-6 h-6"/>
          <span className="text-xs text-slate-400 tracking-widest uppercase" style={ORB}>Cognition Collective</span>
        </div>
        <div className="w-8"/>
        <div className="absolute right-0 top-0 bottom-0 flex items-center">
          <DiscordWidget variant="corner"/>
        </div>
      </div>
    </>
  );
}

function AdminFooter() {
  return (
    <div className="relative z-10 w-full py-4 flex items-center px-4 mt-auto">
      <div className="w-16 shrink-0">
        <Link href="/admin" className="text-slate-500 hover:text-slate-300 transition p-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        </Link>
      </div>
      <div className="flex-1 flex justify-center">
        <Link href="https://discord.gg/czqKKSF4Ta" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 no-underline">
          <img src="/icons/branding/cgn-skull.png" alt="CGN" className="w-5 h-5"/>
          <span className="text-[11px] text-slate-400 tracking-widest" style={{fontFamily:"var(--font-orbitron)"}}>Cognition Collective</span>
        </Link>
      </div>
      <div className="w-16"/>
    </div>
  );
}

export default function SideWarsPage() {
  const [pin, setPinState] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [authed, setAuthed] = useState(false);
  const SESSION_KEY = "cgn_officer_pin";

  const [sideWars, setSideWars] = useState([]);
  const [swLoading, setSwLoading] = useState(false);
  const [swForm, setSwForm] = useState({ clan_name: "", clan_tag: "", clan_link: "" });
  const [swError, setSwError] = useState("");
  const [swTimes, setSwTimes] = useState({});
  const [swTimeErrors, setSwTimeErrors] = useState({});
  const [swManageOpen, setSwManageOpen] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) { setPinState(saved); setAuthed(true); loadWars(saved); }
  }, []);

  async function loadWars(p) {
    fetch("/api/admin/side-wars", { headers: { "x-officer-pin": p } })
      .then(r => r.json()).then(d => setSideWars(d.wars || [])).catch(() => setSideWars([]));
  }

  function handlePinSubmit(e) {
    e.preventDefault();
    setPinState(pinInput);
    setAuthed(true);
    setPinError(false);
    sessionStorage.setItem(SESSION_KEY, pinInput);
    loadWars(pinInput);
  }

  async function swCreate() {
    setSwLoading(true); setSwError("");
    if (!swForm.clan_name || !swForm.clan_tag || !swForm.clan_link) { setSwError("Clan name, tag and link are required"); setSwLoading(false); return; }
    const res = await fetch("/api/admin/side-wars", { method: "POST", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify(swForm) });
    const data = await res.json();
    if (data.war) { setSideWars(prev => [data.war, ...prev]); setSwForm({ clan_name: "", clan_tag: "", clan_link: "" }); }
    else setSwError(data.error || "Failed to save");
    setSwLoading(false);
  }

  async function swToggle(war) {
    const res = await fetch("/api/admin/side-wars", { method: "PATCH", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify({ id: war.id, action: "toggle" }) });
    const data = await res.json();
    if (data.war) setSideWars(prev => prev.map(w => w.id === war.id ? data.war : w));
  }

  async function swDelete(id) {
    await fetch("/api/admin/side-wars", { method: "DELETE", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify({ id }) });
    setSideWars(prev => prev.filter(w => w.id !== id));
  }

  async function swSetFormat(warId, time_format) {
    const res = await fetch("/api/admin/side-wars", { method: "PATCH", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify({ id: warId, action: "set_format", time_format }) });
    const data = await res.json();
    if (data.war) setSideWars(prev => prev.map(w => w.id === warId ? data.war : w));
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex flex-col flex items-center justify-center bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] p-6">
        <div className="relative z-10 w-full max-w-xs">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 text-center">
            <h1 className="text-xl font-thin tracking-widest mb-1">Side Wars</h1>
            <p className="text-slate-600 text-xs mb-6">Enter your officer PIN to continue</p>
            <form onSubmit={handlePinSubmit} className="space-y-3">
              <input type="password" inputMode="numeric" pattern="[0-9]*" placeholder="PIN" value={pinInput} onChange={e => setPinInput(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-white text-center placeholder:text-slate-600 focus:outline-none focus:border-purple-500/40 transition tracking-widest text-lg"/>
              {pinError && <p className="text-xs text-red-400">Incorrect PIN</p>}
              <button type="submit" disabled={!pinInput} className="w-full py-3 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-sm font-semibold hover:bg-purple-500/30 transition disabled:opacity-40">
                Continue
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      </div>
      <AppHeader/>
      <div className="relative z-10 mb-4 text-center">
        <h1 className="text-4xl font-thin tracking-widest mb-1">Side Wars</h1>
        <p className="text-slate-500 text-xs">{sideWars.length} clan{sideWars.length !== 1 ? "s" : ""} saved</p>
      </div>

      <div className="relative z-10 space-y-3">
        {sideWars.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 text-center">
            <p className="text-slate-600 text-xs">No clans saved yet — add one below</p>
          </div>
        ) : sideWars.map(war => {
          const warId = war.id;
          const pendingTime = swTimes[warId] ?? "";
          const showPicker = !war.start_time || swTimes[warId] !== undefined;
          const isRecurring = war.time_format === "recurring";
          return (
            <div key={warId} className={`rounded-xl border ${war.is_active ? "border-pink-500/30 bg-pink-500/[0.04]" : "border-white/10 bg-white/[0.04]"} backdrop-blur-xl p-4`}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img src="/icons/branding/war-shield.png" alt="" className={`w-8 h-8 shrink-0 ${war.is_active ? "opacity-100" : "opacity-40"}`}/>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{war.clan_name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{war.clan_tag}</p>
                  </div>
                </div>
                <button onClick={() => swToggle(war)}
                  className={`px-3 py-1 rounded-full text-[10px] font-semibold border transition shrink-0 ${war.is_active ? "bg-pink-500/20 border-pink-500/60 text-pink-300" : war.start_time ? "bg-transparent border-white/10 text-slate-400 hover:border-pink-500/40 hover:text-pink-300" : "bg-transparent border-white/[0.06] text-slate-600 cursor-not-allowed"}`}>
                  {war.is_active ? "Live" : "Off"}
                </button>
              </div>
              <div className="border-t border-white/[0.06] pt-3">
                {war.start_time && !showPicker && (
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div>
                      <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-0.5">Scheduled</p>
                      <p className="text-[11px] text-slate-300">{new Date(war.start_time).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC</p>
                    </div>
                    <button onClick={() => setSwTimes(p => ({...p, [warId]: ""}))} className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition border border-white/10 hover:border-white/20 rounded-full px-2.5 py-1">
                      Change
                    </button>
                  </div>
                )}
                {!war.start_time && <p className="text-[10px] text-slate-600 mb-2">No start time — schedule before activating</p>}
                {showPicker && (
                  <div className="flex items-center gap-2">
                    <input type="datetime-local" value={pendingTime} onChange={e => setSwTimes(p => ({...p, [warId]: e.target.value}))}
                      className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/20 transition [color-scheme:dark]"/>
                    <button onClick={() => {
                      if (!pendingTime) { setSwTimeErrors(p => ({...p, [warId]: "Pick a date and time first"})); return; }
                      setSwTimeErrors(p => ({...p, [warId]: ""}));
                      fetch("/api/admin/side-wars", { method: "PATCH", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify({ id: warId, action: "set_time", start_time: new Date(pendingTime).toISOString() }) })
                        .then(r => r.json()).then(data => { if (data.war) { setSideWars(prev => prev.map(w => w.id === warId ? data.war : w)); setSwTimes(p => { const n = {...p}; delete n[warId]; return n; }); } });
                    }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-purple-500/[0.1] text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 transition shrink-0">
                      Set
                    </button>
                  </div>
                )}
                {swTimeErrors[warId] && <p className="text-[10px] text-red-400 mt-1">{swTimeErrors[warId]}</p>}
              </div>
              <div className="border-t border-white/[0.06] pt-3 mt-3">
                <button onClick={() => swSetFormat(warId, isRecurring ? "countdown" : "recurring")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition ${isRecurring ? "bg-purple-500/20 border-purple-500/60 text-purple-300" : "bg-transparent border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  Recurring {isRecurring ? "· On" : "· Off"}
                </button>
                {isRecurring && <p className="text-[9px] text-slate-600 mt-1.5">Resets every 48h from start time</p>}
              </div>
              {war.is_active && (
                <div className="mt-3 pt-3 border-t border-pink-500/10 flex items-center justify-between">
                  <p className="text-[10px] text-pink-400">Visible on homepage</p>
                  <a href={war.clan_link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-slate-300 transition underline">View clan link</a>
                </div>
              )}
            </div>
          );
        })}

        {/* Manage Clans */}
        <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
          <button onClick={() => setSwManageOpen(v => !v)} className="w-full flex items-center justify-between px-5 py-4 text-left">
            <div className="flex items-center gap-2">
              <img src="/icons/branding/war-shield.png" alt="" className="w-5 h-5 opacity-60"/>
              <span className="text-sm font-semibold text-white">Manage Clans</span>
              {sideWars.length > 0 && <span className="text-[10px] text-slate-500">{sideWars.length} saved</span>}
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-500 transition-transform ${swManageOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
          {swManageOpen && (
            <div className="border-t border-white/[0.06] px-5 pb-5 pt-4 space-y-4">
              <div>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Add Clan</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">Clan Name</p>
                      <input value={swForm.clan_name} onChange={e => setSwForm(p => ({...p, clan_name: e.target.value}))} placeholder="Cognition {CGN}"
                        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">Clan Tag</p>
                      <input value={swForm.clan_tag} onChange={e => setSwForm(p => ({...p, clan_tag: e.target.value}))} placeholder="#2C8QQPCL2"
                        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">Clan Link</p>
                    <input value={swForm.clan_link} onChange={e => setSwForm(p => ({...p, clan_link: e.target.value}))} placeholder="https://link.clashofclans.com/..."
                      className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                  </div>
                  {swError && <p className="text-[11px] text-red-400">{swError}</p>}
                  <button onClick={swCreate} disabled={swLoading}
                    className="w-full py-2.5 rounded-lg text-xs font-semibold bg-pink-500/[0.1] text-pink-300 border border-pink-500/30 hover:bg-pink-500/20 hover:border-pink-400 transition disabled:opacity-50">
                    {swLoading ? "Saving…" : "Save Clan"}
                  </button>
                </div>
              </div>
              {sideWars.length > 0 && (
                <div>
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Remove Clan</p>
                  <div className="space-y-2">
                    {sideWars.map(war => (
                      <div key={war.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                        <div className="min-w-0">
                          <p className="text-xs text-white truncate">{war.clan_name}</p>
                          <p className="text-[10px] text-slate-600 font-mono">{war.clan_tag}</p>
                        </div>
                        <button onClick={() => swDelete(war.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] text-red-400 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10 transition shrink-0">Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <AdminFooter/>
    </main>
  );
}
