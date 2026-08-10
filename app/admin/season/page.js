"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import DiscordWidget from "../../components/DiscordWidget";

/* ─── FAQ ────────────────────────────────────────────────────── */
function FaqButton() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const faqs = [
    { section: "Season Management", items: [
      { q: "When should I migrate a season?", a: "At the end of each CWL season — after all wars are complete and data has been captured. Migration records final CWL ranks and advances the pool to the next month." },
      { q: "What does Migrate do?", a: "Records CWL ranks for all active clans, closes the current season, opens the next one, and archives all player pool assignments." },
      { q: "What does Fetch CWL Data do?", a: "Manually triggers the CWL data capture cron — same as the scheduled job. Use this if you need to refresh stats mid-season." },
    ]},
  ];
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className={`w-6 h-6 rounded-full flex items-center justify-center border transition text-xs font-semibold ${open ? "bg-purple-500/20 border-purple-500/60 text-purple-300" : "bg-transparent border-purple-500/40 text-purple-400 hover:border-purple-400"}`}>
        ?
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}/>
          <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 w-[95vw] sm:w-[360px] sm:left-auto sm:right-4 sm:translate-x-0 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Help & FAQ</p>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-600 hover:text-slate-300 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
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
                          <button type="button" onClick={() => setExpanded(isOpen ? null : key)} className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left">
                            <span className="text-xs text-slate-300">{item.q}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 text-slate-600 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                          </button>
                          {isOpen && <div className="px-3 pb-2.5"><p className="text-[11px] text-slate-500 leading-relaxed">{item.a}</p></div>}
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

/* ─── Contrast toggle ────────────────────────────────────────── */
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
    if (next) { document.documentElement.classList.add("high-contrast"); localStorage.setItem("cgn-contrast", "1"); }
    else { document.documentElement.classList.remove("high-contrast"); localStorage.setItem("cgn-contrast", "0"); }
  }
  return (
    <button type="button" onClick={toggle} title={high ? "Normal contrast" : "High contrast"}
      className={`w-6 h-6 rounded-full flex items-center justify-center border transition ${high ? "bg-purple-500/20 border-purple-500/60 text-purple-300" : "bg-transparent border-purple-500/40 text-purple-400 hover:border-purple-400"}`}>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
      </svg>
    </button>
  );
}

/* ─── Admin header ───────────────────────────────────────────── */
function AdminHeader() {
  const [navOpen, setNavOpen] = useState(false);
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
          <div className="flex items-center gap-2 mb-2">
            <img src="/icons/branding/cgn-skull.png" alt="CGN" className="w-7 h-7"/>
            <span className="text-sm text-white tracking-widest uppercase" style={{fontFamily:"var(--font-orbitron)"}}>Cognition Collective</span>
          </div>
          <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-6 pl-9">Admin</p>
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
                        <span style={{fontFamily:"var(--font-orbitron)"}}>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
            <div className="border-t border-white/10 pt-4 mt-4">
              <Link href="/" onClick={() => setNavOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                <span style={{fontFamily:"var(--font-orbitron)"}}>Back to App</span>
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
          <span className="text-xs text-slate-400 tracking-widest uppercase" style={{fontFamily:"var(--font-orbitron)"}}>Cognition Collective</span>
        </div>
        <div className="w-8"/>
        <div className="absolute right-0 top-0 bottom-0 flex items-center">
          <DiscordWidget variant="corner"/>
        </div>
      </div>
    </>
  );
}

/* ─── Admin footer ───────────────────────────────────────────── */
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

/* ─── Main page ──────────────────────────────────────────────── */
export default function AdminSeasonPage() {
  const [pin, setPinState] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [season, setSeason] = useState(null);

  const [showMigrateForm, setShowMigrateForm] = useState(false);
  const [migrateConfirm, setMigrateConfirm] = useState("");
  const [migrateSubmitting, setMigrateSubmitting] = useState(false);
  const [migrateResult, setMigrateResult] = useState(null);

  const [fetchingCwl, setFetchingCwl] = useState(false);
  const [fetchCwlResult, setFetchCwlResult] = useState(null);

  const [recomputing, setRecomputing] = useState(false);
  const [recomputeResult, setRecomputeResult] = useState(null);

  const { status: discordStatus } = useSession();
  const SESSION_KEY = "cwl_admin_pin_confirmed";

  useEffect(() => {
    if (discordStatus !== "authenticated") return;
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) { setPinState(saved); setAuthed(true); loadSeason(saved); }
  }, [discordStatus]);

  useEffect(() => {
    if (discordStatus === "unauthenticated") sessionStorage.removeItem(SESSION_KEY);
  }, [discordStatus]);

  async function loadSeason(p) {
    try {
      const res = await fetch("/api/admin/members", { headers: { "x-officer-pin": p } });
      const d = await res.json();
      if (d.season) setSeason(d.season);
    } catch {}
  }

  function handlePinSubmit(e) {
    e.preventDefault();
    setPinState(pinInput);
    setAuthed(true);
    setPinError(false);
    if (discordStatus === "authenticated") sessionStorage.setItem(SESSION_KEY, pinInput);
    loadSeason(pinInput);
  }

  async function doMigrate(e) {
    e.preventDefault();
    if (migrateConfirm !== "CONFIRM") return;
    setMigrateSubmitting(true); setMigrateResult(null);
    try {
      const res = await fetch("/api/admin/season/close", { method: "POST", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify({ confirm: "CONFIRM" }) });
      const data = await res.json();
      if (res.ok) {
        setMigrateResult({ ok: true, message: `${data.closed} migrated → ${data.opened} open · ${data.snapshotCount ?? 0} players archived` });
        setMigrateConfirm("");
        setShowMigrateForm(false);
        loadSeason(pin);
      } else { setMigrateResult({ ok: false, message: data.error || "Failed to migrate season" }); }
    } catch { setMigrateResult({ ok: false, message: "Network error" }); }
    finally { setMigrateSubmitting(false); }
  }

  async function doFetchCwlData() {
    setFetchingCwl(true); setFetchCwlResult(null);
    try {
      const res = await fetch("/api/admin/cwl-fetch", { method: "POST", headers: { "x-officer-pin": pin } });
      const data = await res.json();
      if (res.ok) { setFetchCwlResult({ ok: true, message: `Captured ${data.playersProcessed} players across ${data.clansProcessed} clans for ${data.season}` }); }
      else { setFetchCwlResult({ ok: false, message: data.error || "Fetch failed" }); }
    } catch { setFetchCwlResult({ ok: false, message: "Network error" }); }
    finally { setFetchingCwl(false); }
  }

  async function doRecomputeStats() {
    setRecomputing(true); setRecomputeResult(null);
    try {
      const res = await fetch("/api/admin/recompute-cwl-stats", { method: "POST", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify({ season }) });
      const data = await res.json();
      if (res.ok) {
        const errSuffix = data.errors?.length ? ` · ${data.errors.length} error(s)` : "";
        setRecomputeResult({ ok: (data.errors?.length ?? 0) === 0, message: `${data.playersUpdated} players · ${data.clansUpdated} clans updated for ${data.season}${errSuffix}` });
      } else { setRecomputeResult({ ok: false, message: data.error || "Recompute failed" }); }
    } catch { setRecomputeResult({ ok: false, message: "Network error" }); }
    finally { setRecomputing(false); }
  }

  /* ─── PIN gate ────────────────────────────────────────────── */
  if (!authed) {
    return (
      <main className="min-h-screen flex flex-col flex items-center justify-center bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] p-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
        </div>
        <div className="relative z-10 w-full max-w-xs">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 text-center">
            <h1 className="text-xl font-thin tracking-widest mb-1">Season Manager</h1>
            <p className="text-slate-600 text-xs mb-6">Enter your officer PIN to continue</p>
            <form onSubmit={handlePinSubmit} className="space-y-3">
              <input type="password" inputMode="numeric" pattern="[0-9]*" placeholder="PIN" value={pinInput} onChange={e => setPinInput(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-white text-center placeholder:text-slate-600 focus:outline-none focus:border-purple-500/40 transition tracking-widest text-lg"/>
              {pinError && <p className="text-xs text-red-400">Incorrect PIN</p>}
              <button type="submit" disabled={!pinInput}
                className="w-full py-2.5 rounded-lg text-sm font-semibold bg-transparent text-purple-400 border border-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.15)] hover:border-purple-400 hover:text-purple-300 transition disabled:opacity-40">
                Enter
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  /* ─── Main UI ─────────────────────────────────────────────── */
  return (
    <main className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      </div>

      <AdminHeader/>

      {/* Hero card */}
      <div className="relative z-10 mb-6 text-center">
        <h1 className="text-4xl font-thin tracking-widest mb-1">Season Manager</h1>
        <p className="text-slate-500 text-xs">{season ? <><span className="text-purple-300">{season}</span> · Current open season</> : "Loading…"}</p>
      </div>

      <div className="relative z-10 space-y-3">

        {/* Migrate season */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-xl p-5 space-y-3">
          <p className="text-sm font-semibold text-amber-300">Migrate Season</p>
          <p className="text-[10px] text-slate-500">{season ? `Close ${season} and advance to next month` : "Loading…"}</p>
          <p className="text-[11px] text-slate-500 leading-relaxed">Records CWL ranks and advances to next month. Type <span className="text-white font-mono">CONFIRM</span> to proceed.</p>
          <form onSubmit={doMigrate} className="space-y-3">
            <input type="text" placeholder="Type CONFIRM" value={migrateConfirm} onChange={e => setMigrateConfirm(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/40 transition"/>
            <button type="submit" disabled={migrateConfirm !== "CONFIRM" || migrateSubmitting}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-transparent text-amber-400 border border-amber-500/60 hover:border-amber-400 hover:text-amber-300 transition disabled:opacity-40 disabled:cursor-not-allowed">
              {migrateSubmitting ? "Migrating…" : `Migrate ${season} → Next Season`}
            </button>
          </form>
          {migrateResult && <p className={`text-[11px] text-center ${migrateResult.ok ? "text-green-400" : "text-red-400"}`}>{migrateResult.message}</p>}
        </div>

        {/* Fetch CWL data */}
        <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-300 mb-1">Fetch CWL Data</p>
            <p className="text-[10px] text-slate-600">Manually trigger the CWL data capture — same as the scheduled cron job</p>
          </div>
          <button onClick={doFetchCwlData} disabled={fetchingCwl}
            className="w-full py-2.5 rounded-lg text-xs font-semibold bg-transparent text-blue-400 border border-blue-500/60 hover:border-blue-400 hover:text-blue-300 transition disabled:opacity-40 flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 ${fetchingCwl ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {fetchingCwl ? "Fetching…" : "Fetch CWL Data"}
          </button>
          {fetchCwlResult && <p className={`text-[11px] text-center ${fetchCwlResult.ok ? "text-blue-300" : "text-red-400"}`}>{fetchCwlResult.message}</p>}
        </div>

        {/* Recompute stats from DB */}
        <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-300 mb-1">Recompute Stats from DB</p>
            <p className="text-[10px] text-slate-600">Rebuilds player &amp; clan season totals from war_attacks/war_defences/war_days directly — use this after a manual backfill when the CWL war league group has already expired and Fetch CWL Data can no longer pull it</p>
          </div>
          <button onClick={doRecomputeStats} disabled={recomputing}
            className="w-full py-2.5 rounded-lg text-xs font-semibold bg-transparent text-emerald-400 border border-emerald-500/60 hover:border-emerald-400 hover:text-emerald-300 transition disabled:opacity-40 flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 ${recomputing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {recomputing ? "Recomputing…" : "Recompute Stats from DB"}
          </button>
          {recomputeResult && <p className={`text-[11px] text-center ${recomputeResult.ok ? "text-emerald-300" : "text-red-400"}`}>{recomputeResult.message}</p>}
        </div>

      </div>

      <AdminFooter/>
    </main>
  );
}
