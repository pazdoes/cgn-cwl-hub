"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import DiscordWidget from "@/app/components/DiscordWidget";

function AdminHeader() {
  const [navOpen, setNavOpen] = useState(false);
  const navSections = [
    { label: null, items: [{ href: "/admin", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" }]},
    { label: "CWL", items: [
      { href: "/admin/roster-compliance", label: "Roster Compliance", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
      { href: "/admin/war-day-tracker", label: "War Day Tracker", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
      { href: "/admin/pool", label: "Pool Manager", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
      { href: "/admin/season", label: "Season Manager", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    ]},
    { label: "SIDE WARS", items: [{ href: "/admin/side-wars", label: "Side Wars", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" }]},
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
      <div className={`fixed inset-0 z-50 transition-opacity duration-150 ${navOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={() => setNavOpen(false)}>
        <div className="absolute inset-0 bg-black/60"/>
        <div onClick={e => e.stopPropagation()} className={`relative z-10 w-72 max-w-[80vw] h-full bg-[#0b1020]/80 backdrop-blur-2xl border-r border-white/10 flex flex-col p-5 transition-transform duration-150 ${navOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center gap-2 mb-8"><img src="/icons/branding/cgn-skull.png" alt="CGN" className="w-7 h-7"/><span className="text-sm text-white tracking-widest uppercase">Admin Panel</span></div>
          <nav className="flex-1 space-y-1">
            {navSections.map((section, si) => (
                <div key={si}>
                  {section.label && <p className="text-[9px] text-slate-600 uppercase tracking-widest px-3 mb-1">{section.label}</p>}
                  <div className="space-y-0.5">
                    {section.items.map(item => (
                      <Link key={item.href} href={item.href} onClick={() => setNavOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/></svg>
                        <span style={{fontFamily:"var(--font-orbitron)"}}>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
          </nav>
        </div>
      </div>
      <div className="relative z-10 flex items-center justify-between mb-4">
        <button onClick={() => setNavOpen(true)} className="text-slate-400 hover:text-white transition p-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <Link href="/admin" className="flex items-center gap-2"><img src="/icons/branding/cgn-skull.png" alt="CGN" className="w-6 h-6"/><span className="text-xs text-slate-400 tracking-widest uppercase">Admin</span></Link>
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

export default function WarDayTrackerPage() {
  const [pin, setPinState] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const SESSION_KEY = "cwl_admin_pin_confirmed";

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) { setPinState(saved); setAuthed(true); }
  }, []);

  async function handleFetch() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/war-day-tracker", { headers: { "x-officer-pin": pin } });
      const d = await res.json();
      setData(d);
      setLoaded(true);
    } catch {} finally { setLoading(false); }
  }

  // Fetch automatically once authed — covers a fresh PIN submit and a
  // returning session with a saved PIN — no manual Refresh press needed.
  useEffect(() => {
    if (authed && pin && !loaded && !loading) {
      handleFetch();
    }
  }, [authed, pin]);

  function handlePinSubmit(e) {
    e.preventDefault();
    const p = pinInput.trim();
    setPinState(p); setAuthed(true); setPinError(false);
    sessionStorage.setItem(SESSION_KEY, p);
    // Fetch is handled by the authed/pin useEffect above.
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex flex-col flex items-center justify-center bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] p-6">
        <div className="relative z-10 w-full max-w-xs">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 text-center">
            <h1 className="text-xl font-thin tracking-widest mb-1">War Day Tracker</h1>
            <p className="text-slate-600 text-xs mb-6">Enter your officer PIN to continue</p>
            <form onSubmit={handlePinSubmit} className="space-y-3">
              <input type="password" inputMode="numeric" placeholder="PIN" value={pinInput} onChange={e => setPinInput(e.target.value)}
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
      <AdminHeader/>
      <div className="relative z-10 mb-6 text-center">
        <h1 className="text-4xl font-thin tracking-widest mb-1">War Day Tracker</h1>
        {data?.season && <p className="text-[10px] text-slate-600 uppercase tracking-widest">{data.season}</p>}
      </div>

      <div className="relative z-10 space-y-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Capture Coverage</h2>
              <p className="text-[10px] text-slate-700 mt-0.5">War day capture status per clan, days 1–7</p>
            </div>
            <button onClick={handleFetch} disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-300 hover:border-purple-400/60 transition text-[10px] uppercase tracking-widest font-semibold disabled:opacity-40">
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              {loading ? "Checking…" : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_,i) => <div key={i} className="h-16 rounded-lg bg-white/[0.04] animate-pulse"/>)}</div>
          ) : loaded && data?.clans && (
            <div className="space-y-3">
              {data.clans.map(clan => (
                <div key={clan.clanName} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-white">{clan.clanName}</p>
                    <p className="text-[10px] text-slate-500">{clan.daysCaptured}/7 days captured</p>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {clan.days.map(d => (
                      <div key={d.day}
                        className={`rounded-lg border p-2 text-center ${
                          d.captured
                            ? "border-green-500/30 bg-green-500/[0.08]"
                            : "border-red-500/30 bg-red-500/[0.08]"
                        }`}
                        title={d.captured ? `${d.attacksUsed}/${d.attacksAvailable} attacks · ${d.warResult}` : "Not captured"}>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Day {d.day}</p>
                        {d.captured ? (
                          <>
                            <p className="text-[10px] text-green-400 font-semibold">{d.attacksUsed}/{d.attacksAvailable}</p>
                            <p className={`text-[9px] mt-0.5 ${
                              d.warResult === "win" ? "text-green-500" : d.warResult === "loss" ? "text-red-400" : "text-slate-400"
                            }`}>{d.warResult}</p>
                          </>
                        ) : (
                          <p className="text-[10px] text-red-400 font-semibold">✕</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <AdminFooter/>
    </main>
  );
}
