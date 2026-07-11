"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { TH_ICONS } from "../../../lib/icons";
import DiscordWidget from "../../components/DiscordWidget";

/* ─── TH Icon ────────────────────────────────────────────────── */
function ThIcon({ level }) {
  const src = level ? TH_ICONS[String(level)] : null;
  if (!src) return <div className="w-7 h-7 rounded-full bg-white/[0.06] shrink-0"/>;
  return <img src={src} alt={`TH${level}`} className="w-7 h-7 shrink-0"/>;
}

/* ─── FAQ ────────────────────────────────────────────────────── */
function FaqButton() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const faqs = [
    { section: "Directory", items: [
      { q: "What does In Pool mean?", a: "The player has been added to the CWL pool for the current season by an admin." },
      { q: "What does Discord ✓ mean?", a: "The player has linked their Discord account to their hub profile." },
      { q: "What does Token ✓ mean?", a: "The player verified ownership of their account using the in-game API token." },
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
          <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 w-[95vw] sm:w-[360px] sm:left-auto sm:right-4 sm:translate-x-0 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl overflow-hidden">
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
                        <div key={ii} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
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
  const items = [
    { href: "/admin",               label: "Overview",       icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { href: "/admin/pool",          label: "Pool Manager",   icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { href: "/admin/clans",         label: "Clan Manager",   icon: "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" },
    { href: "/admin/season",        label: "Season Manager", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { href: "/admin/directory",     label: "Directory",      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6-3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
    { href: "/admin/announcements", label: "Announcements",  icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
  ];
  return (
    <>
      <div className={`fixed inset-0 z-50 flex transition-opacity duration-150 ${navOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={() => setNavOpen(false)}>
        <div className="absolute inset-0 bg-black/60"/>
        <div onClick={e => e.stopPropagation()} className={`relative z-10 w-72 max-w-[80vw] h-full bg-[#0d1424] border-r border-white/10 flex flex-col p-5 transition-transform duration-150 ${navOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center gap-2 mb-2">
            <img src="/icons/branding/cgn-skull.png" alt="CGN" className="w-7 h-7"/>
            <span className="text-sm text-white tracking-widest uppercase">Cognition {"{CGN}"}</span>
          </div>
          <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-6 pl-9">Admin</p>
          <nav className="flex-1 space-y-1">
            {items.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setNavOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm transition ${item.href === "/admin/directory" ? "text-white bg-white/[0.06]" : "text-slate-300 hover:text-white hover:bg-white/[0.06]"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/>
                </svg>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-white/10 pt-4 mt-4">
            <Link href="/" onClick={() => setNavOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Back to App
            </Link>
          </div>
        </div>
      </div>
      <div className="relative z-10 flex items-center justify-between mb-4 gap-2">
        <button onClick={() => setNavOpen(true)} className="text-slate-400 hover:text-white transition p-1 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <img src="/icons/branding/cgn-skull.png" alt="CGN" className="w-6 h-6"/>
          <span className="text-xs text-slate-400 tracking-widest uppercase">Admin</span>
        </div>
        <DiscordWidget variant="corner"/>
      </div>
    </>
  );
}

/* ─── Admin footer ───────────────────────────────────────────── */
function AdminFooter() {
  return (
    <div className="relative z-10 w-full py-4 flex items-center px-4">
      <div className="w-16 shrink-0 flex items-center">
        <Link href="/" className="text-slate-500 hover:text-slate-300 transition p-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        </Link>
      </div>
      <div className="flex-1 flex justify-center">
        <a href="https://discord.gg/czqKKSF4Ta" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 no-underline">
          <img src="/icons/branding/cgn-skull.png" alt="CGN" className="w-5 h-5"/>
          <span className="text-[11px] text-slate-400 tracking-widest">Cognition {"{CGN}"}</span>
        </a>
      </div>
      <div className="flex items-center gap-2">
        <ContrastToggle/>
        <FaqButton/>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function AdminDirectoryPage() {
  const [pin, setPinState] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPool, setFilterPool] = useState("all");
  const [filterDiscord, setFilterDiscord] = useState("all");
  const [filterToken, setFilterToken] = useState("all");

  const { status: discordStatus } = useSession();
  const SESSION_KEY = "cwl_admin_pin_confirmed";

  useEffect(() => {
    if (discordStatus !== "authenticated") return;
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) { setPinState(saved); setAuthed(true); loadMembers(saved); }
  }, [discordStatus]);

  useEffect(() => {
    if (discordStatus === "unauthenticated") sessionStorage.removeItem(SESSION_KEY);
  }, [discordStatus]);

  async function loadMembers(p) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/members", { headers: { "x-officer-pin": p } });
      const d = await res.json();
      setMembers(d.members || []);
    } catch {} finally { setLoading(false); }
  }

  function handlePinSubmit(e) {
    e.preventDefault();
    setPinState(pinInput);
    setAuthed(true);
    setPinError(false);
    if (discordStatus === "authenticated") sessionStorage.setItem(SESSION_KEY, pinInput);
    loadMembers(pinInput);
  }

  const pillSelect = "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white focus:outline-none [color-scheme:dark]";

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.player_name?.toLowerCase().includes(q) || m.player_tag?.toLowerCase().includes(q) || m.assigned_clan?.toLowerCase().includes(q);
    const matchPool = filterPool === "all" || (filterPool === "in" ? m.in_pool : !m.in_pool);
    const matchDiscord = filterDiscord === "all" || (filterDiscord === "yes" ? !!m.discord_id : !m.discord_id);
    const matchToken = filterToken === "all" || (filterToken === "yes" ? m.api_token_verified : !m.api_token_verified);
    return matchSearch && matchPool && matchDiscord && matchToken;
  });

  /* ─── PIN gate ────────────────────────────────────────────── */
  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] p-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
        </div>
        <div className="relative z-10 w-full max-w-xs">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 text-center">
            <h1 className="text-xl font-thin tracking-widest mb-1">Directory</h1>
            <p className="text-slate-600 text-xs mb-6">Enter your officer PIN to continue</p>
            <form onSubmit={handlePinSubmit} className="space-y-3">
              <input type="password" inputMode="numeric" pattern="[0-9]*" placeholder="PIN" value={pinInput} onChange={e => setPinInput(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white text-center placeholder:text-slate-600 focus:outline-none focus:border-purple-500/40 transition tracking-widest text-lg"/>
              {pinError && <p className="text-xs text-red-400">Incorrect PIN</p>}
              <button type="submit" disabled={!pinInput}
                className="w-full py-2.5 rounded-2xl text-sm font-semibold bg-transparent text-purple-400 border border-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.15)] hover:border-purple-400 hover:text-purple-300 transition disabled:opacity-40">
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
    <main className="min-h-screen overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      </div>

      <AdminHeader/>

      {/* Hero card */}
      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 mb-4 text-center">
        <h1 className="text-2xl font-thin tracking-widest mb-1">Directory</h1>
        <p className="text-slate-500 text-xs">{members.length} registered accounts · {members.filter(m => m.in_pool).length} in pool</p>
      </div>

      <div className="relative z-10 space-y-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Member Directory</h2>
            <button type="button" onClick={() => loadMembers(pin)} title="Refresh"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-300 hover:border-purple-400/60 hover:bg-purple-500/20 transition text-[10px] uppercase tracking-widest font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Refresh
            </button>
          </div>

          {/* Search + filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[140px]">
              <input type="text" placeholder="Search name, tag or clan…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition text-xs">✕</button>
              )}
            </div>
            <select value={filterPool} onChange={e => setFilterPool(e.target.value)} className={pillSelect}>
              <option value="all">All Pool</option>
              <option value="in">In Pool</option>
              <option value="out">Not In Pool</option>
            </select>
            <select value={filterDiscord} onChange={e => setFilterDiscord(e.target.value)} className={pillSelect}>
              <option value="all">All Discord</option>
              <option value="yes">Discord ✓</option>
              <option value="no">No Discord</option>
            </select>
            <select value={filterToken} onChange={e => setFilterToken(e.target.value)} className={pillSelect}>
              <option value="all">All Token</option>
              <option value="yes">Token ✓</option>
              <option value="no">No Token</option>
            </select>
          </div>

          <p className="text-[10px] text-slate-700 mb-3">{filtered.length} of {members.length} accounts</p>

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-2xl bg-white/[0.04] animate-pulse"/>)}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(m => (
                <div key={m.player_tag} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 hover:bg-white/[0.04] transition">
                  <ThIcon level={m.town_hall_level}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{m.player_name}</p>
                    <p className="text-[10px] text-slate-600 font-mono">{m.player_tag}</p>
                    {m.assigned_clan && <p className="text-[10px] text-slate-500 truncate">{m.assigned_clan.split(" ")[0]}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span title={m.in_pool ? "In pool" : "Not in pool"}
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] border ${m.in_pool ? "border-purple-500/40 text-purple-400" : "border-white/10 text-slate-700"}`}>
                      {m.in_pool ? "✓" : "—"}
                    </span>
                    <span title={m.discord_id ? "Discord linked" : "No Discord"}
                      className={`w-5 h-5 rounded-full flex items-center justify-center border ${m.discord_id ? "border-blue-500/40 text-blue-400" : "border-white/10 text-slate-700"}`}>
                      <svg className="w-2.5 h-2.5" viewBox="0 0 127.14 96.36" fill="currentColor">
                        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
                      </svg>
                    </span>
                    <span title={m.api_token_verified ? "Token verified" : "No token"}
                      className={`w-5 h-5 rounded-full flex items-center justify-center border ${m.api_token_verified ? "border-green-500/40 text-green-400" : "border-white/10 text-slate-700"}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                      </svg>
                    </span>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-slate-700 text-xs text-center py-6">No members match your filters</p>
              )}
            </div>
          )}
        </div>
      </div>

      <AdminFooter/>
    </main>
  );
}
