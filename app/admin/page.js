"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { TH_ICONS } from "../../lib/icons";
import DiscordWidget from "../components/DiscordWidget";

function ThIcon({ level }) {
  const src = level ? TH_ICONS[String(level)] : null;
  if (!src) return <div className="w-7 h-7 rounded-full bg-white/[0.06] shrink-0"/>;
  return <img src={src} alt={`TH${level}`} className="w-7 h-7 shrink-0"/>;
}

function AdminNav() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)}
        className="w-8 h-8 rounded-full flex items-center justify-center border border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.08] hover:text-white transition">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }} transition={{ duration: 0.12 }}
            className="absolute left-0 top-full mt-2 z-50 min-w-[180px] rounded-2xl border border-white/10 bg-[#0d1424]/95 backdrop-blur-xl shadow-xl overflow-hidden">
            <div className="p-1.5 space-y-0.5">
              {[
                { href: "/admin", label: "Overview", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/> },
                { href: "/admin/pool", label: "Pool Manager", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/> },
                { href: "/admin/announcements", label: "Announcements", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/> },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>{item.icon}</svg>
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatTile({ label, value, colour = "text-white", sub }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
      <p className={`text-2xl font-thin tracking-widest ${colour}`}>{value}</p>
      <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-0.5">{label}</p>
      {sub && <p className="text-[9px] text-slate-700 mt-0.5">{sub}</p>}
    </div>
  );
}

function CwlCountdown({ season }) {
  // CWL runs first ~10 days of each month
  // Estimate end of season as 10th of current month
  const now = new Date();
  const cwlEnd = new Date(now.getFullYear(), now.getMonth(), 10, 23, 0, 0);
  if (now > cwlEnd) cwlEnd.setMonth(cwlEnd.getMonth() + 1);
  const diff = cwlEnd - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const isActive = now.getDate() <= 10;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
      <p className={`text-2xl font-thin tracking-widest ${isActive ? "text-purple-300" : "text-slate-400"}`}>
        {days}d {hours}h
      </p>
      <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-0.5">
        {isActive ? "CWL Season Ends" : "Next CWL Starts"}
      </p>
      <p className="text-[9px] text-slate-700 mt-0.5">{season || "—"}</p>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [pin, setPin] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPool, setFilterPool] = useState("all"); // all | in | out
  const [filterDiscord, setFilterDiscord] = useState("all"); // all | yes | no
  const [filterToken, setFilterToken] = useState("all"); // all | yes | no

  function handlePin(e) {
    e.preventDefault();
    const stored = sessionStorage.getItem("admin_pin");
    if (stored) { setPin(stored); setAuthed(true); return; }
    fetch("/api/admin/members", { headers: { "x-officer-pin": pinInput } })
      .then(r => { if (r.ok) { sessionStorage.setItem("admin_pin", pinInput); setPin(pinInput); setAuthed(true); setPinError(false); } else { setPinError(true); } })
      .catch(() => setPinError(true));
  }

  useEffect(() => {
    const stored = sessionStorage.getItem("admin_pin");
    if (stored) { setPin(stored); setAuthed(true); }
  }, []);

  useEffect(() => {
    if (!authed || !pin) return;
    setLoading(true);
    fetch("/api/admin/members", { headers: { "x-officer-pin": pin } })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authed, pin]);

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-6">
        <div className="w-full max-w-xs">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 text-center">
            <h1 className="text-xl font-thin tracking-widest mb-1">Admin</h1>
            <p className="text-slate-600 text-xs mb-6">Enter your officer PIN to continue</p>
            <form onSubmit={handlePin} className="space-y-3">
              <input type="password" inputMode="numeric" pattern="[0-9]*" placeholder="PIN" value={pinInput} onChange={e => setPinInput(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white text-center placeholder:text-slate-600 focus:outline-none focus:border-purple-500/40 transition tracking-widest text-lg"/>
              {pinError && <p className="text-xs text-red-400">Incorrect PIN</p>}
              <button type="submit" className="w-full py-2.5 rounded-2xl text-sm font-semibold bg-transparent text-purple-400 border border-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.15)] hover:border-purple-400 hover:text-purple-300 transition">
                Enter
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  const members = data?.members || [];
  const stats = data?.stats || {};
  const season = data?.season || "";

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.player_name?.toLowerCase().includes(q) || m.player_tag?.toLowerCase().includes(q) || m.assigned_clan?.toLowerCase().includes(q);
    const matchPool = filterPool === "all" || (filterPool === "in" ? m.in_pool : !m.in_pool);
    const matchDiscord = filterDiscord === "all" || (filterDiscord === "yes" ? !!m.discord_id : !m.discord_id);
    const matchToken = filterToken === "all" || (filterToken === "yes" ? m.api_token_verified : !m.api_token_verified);
    return matchSearch && matchPool && matchDiscord && matchToken;
  });

  const pillSelect = "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white focus:outline-none [color-scheme:dark]";

  return (
    <main className="min-h-screen overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      </div>

      {/* Top nav */}
      <div className="relative z-10 grid grid-cols-3 items-center mb-4">
        <Link href="/" className="text-sm text-slate-500 hover:text-white transition flex items-center gap-1.5 justify-self-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Hub
        </Link>
        <div className="flex justify-center"><DiscordWidget variant="center"/></div>
        <div/>
      </div>

      {/* Hero card */}
      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 mb-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-1">
          <AdminNav/>
          <h1 className="text-2xl font-thin tracking-widest">Overview</h1>
        </div>
        <p className="text-slate-500 text-xs">{season} · Admin Dashboard</p>
      </div>

      {loading ? (
        <div className="relative z-10 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {Array.from({length:4}).map((_,i) => <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 h-20 animate-pulse"/>)}
          </div>
        </div>
      ) : (
        <div className="relative z-10 space-y-4">

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Total Accounts" value={stats.totalAccounts ?? "—"} colour="text-white"/>
            <StatTile label="In Pool" value={stats.inPool ?? "—"} colour="text-purple-300"/>
            <StatTile label="Discord Linked" value={stats.discordLinked ?? "—"} colour="text-blue-300"/>
            <StatTile label="Token Verified" value={stats.apiVerified ?? "—"} colour="text-green-300"/>
          </div>

          {/* CWL Countdown */}
          <CwlCountdown season={season}/>

          {/* Quick Actions */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Quick Actions</h2>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/pool" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-transparent text-purple-400 border border-purple-500/60 shadow-[0_0_8px_rgba(168,85,247,0.15)] hover:border-purple-400 hover:text-purple-300 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Pool Manager
              </Link>
              <Link href="/admin/announcements" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-transparent text-blue-400 border border-blue-500/60 shadow-[0_0_8px_rgba(59,130,246,0.15)] hover:border-blue-400 hover:text-blue-300 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
                Announcements
              </Link>
            </div>
          </div>

          {/* Member Directory */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Member Directory</h2>

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

            {/* Member list */}
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
                    {/* In pool */}
                    <span title={m.in_pool ? "In pool" : "Not in pool"}
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] border ${m.in_pool ? "border-purple-500/40 text-purple-400" : "border-white/10 text-slate-700"}`}>
                      {m.in_pool ? "✓" : "—"}
                    </span>
                    {/* Discord */}
                    <span title={m.discord_id ? "Discord linked" : "No Discord"}
                      className={`w-5 h-5 rounded-full flex items-center justify-center border ${m.discord_id ? "border-blue-500/40 text-blue-400" : "border-white/10 text-slate-700"}`}>
                      <svg className="w-2.5 h-2.5" viewBox="0 0 127.14 96.36" fill="currentColor">
                        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0 0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
                      </svg>
                    </span>
                    {/* API Token */}
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
          </div>

        </div>
      )}
    </main>
  );
}
