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
                          <button type="button" onClick={() => setExpanded(isOpen ? null : key)}
                            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left">
                            <span className="text-xs text-slate-300">{item.q}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 text-slate-600 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
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
      className={`w-6 h-6 rounded-full flex items-center justify-center border transition ${high ? "bg-purple-500/20 border-purple-500/60 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.2)]" : "bg-transparent border-purple-500/40 text-purple-400 hover:border-purple-400 hover:shadow-[0_0_8px_rgba(168,85,247,0.15)]"}`}>
      {high ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <circle cx="12" cy="12" r="5"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      )}
    </button>
  );
}

function AdminHeader() {
  const [navOpen, setNavOpen] = useState(false);
  const items = [
    { href: "/admin", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { href: "/admin/pool", label: "Pool Manager", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { href: "/admin/announcements", label: "Announcements", icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
  ];
  return (
    <>
      {navOpen && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setNavOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
          <div onClick={e => e.stopPropagation()}
            className="relative z-10 w-72 max-w-[80vw] h-full bg-[#0d1424]/95 backdrop-blur-xl border-r border-white/10 flex flex-col p-5">
            <div className="flex items-center gap-2 mb-2">
              <img src="/icons/branding/cgn-skull.png" alt="CGN" className="w-7 h-7"/>
              <span className="text-sm text-white tracking-widest uppercase">Cognition {"{CGN}"}</span>
            </div>
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-6 pl-9">Admin</p>
            <nav className="flex-1 space-y-1">
              {items.map(item => (
                <Link key={item.href} href={item.href} onClick={() => setNavOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/>
                  </svg>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-white/10 pt-4 mt-4">
              <Link href="/" onClick={() => setNavOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                Back to App
              </Link>
            </div>
          </div>
        </div>
      )}
      <div className="relative z-10 flex items-center justify-between mb-4 gap-2">
        <button onClick={() => setNavOpen(true)} className="text-slate-400 hover:text-white transition p-1 shrink-0" title="Menu">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
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

function AdminFooter() {
  return (
    <div className="relative z-10 w-full py-4 flex items-center px-4">
      <div className="w-16 shrink-0 flex items-center">
        <Link href="/" className="text-slate-500 hover:text-slate-300 transition p-1" title="Back to App">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
        </Link>
      </div>
      <div className="flex-1 flex justify-center">
        <a href="https://discord.gg/czqKKSF4Ta" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 no-underline">
          <img src="/icons/branding/cgn-skull.png" alt="CGN" className="w-5 h-5"/>
          <span className="text-[11px] text-slate-400 tracking-widest">Cognition {"{CGN}"}</span>
        </a>
      </div>
      <div className="flex items-center gap-2">
        <ContrastToggle />
        <FaqButton />
      </div>
    </div>
  );
}

function AdminNav_REMOVED() {
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
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();

  const regOpen  = new Date(Date.UTC(y, m, 1, 8, 0, 0));
  const warStart = new Date(Date.UTC(y, m, 3, 8, 0, 0));
  const warEnd   = new Date(Date.UTC(y, m, 10, 8, 0, 0));

  let target, label, active;
  if (now < regOpen) {
    target = regOpen; label = "CWL Sign-Up Opens"; active = false;
  } else if (now < warStart) {
    target = warStart; label = "CWL Wars Begin"; active = true;
  } else if (now < warEnd) {
    target = warEnd; label = "CWL Season Ends"; active = true;
  } else {
    const nextReg = new Date(Date.UTC(y, m + 1, 1, 8, 0, 0));
    target = nextReg; label = "CWL Sign-Up Opens"; active = false;
  }

  const diff = target - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const display = days > 0 ? `${days}d ${hours}h` : `${hours}h ${mins}m`;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-5 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-center flex-1">
          <p className={`text-lg font-thin ${active ? "text-purple-300" : "text-slate-400"}`}>{display}</p>
          <p className="text-[9px] text-slate-600 uppercase tracking-widest">Countdown</p>
        </div>
        <div className="w-px h-8 bg-white/[0.06] shrink-0"/>
        <div className="text-center flex-1">
          <p className={`text-xs font-semibold ${active ? "text-purple-300" : "text-slate-500"}`}>{label}</p>
          <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">{active ? "Active" : "Upcoming"}</p>
        </div>
      </div>
    </div>
  );
}


// ── Scheduled Events Calendar ─────────────────────────────────────────────────
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const RECURRENCE_LABELS = { "24hr":"Daily","48hr":"Every 2 days","7days":"Weekly","14days":"Fortnightly","30days":"Monthly" };

function ScheduledCalendar({ scheduled, sideWars = [], calMonth, setCalMonth, selectedDate, setSelectedDate, eventFilter = ["cwl","announcement","sidewar"], setEventFilter }) {
  const { year, month } = calMonth;
  const firstDay = new Date(year, month, 1).getDay();
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Generate CWL events for this month
  const cwlEvents = [
    { id: `cwl-signup-${year}-${month}`, title: "CWL Sign-Up Opens", send_at: new Date(Date.UTC(year, month, 1, 8, 0, 0)).toISOString(), type: "cwl", colour: "#34d399" },
    { id: `cwl-wars-${year}-${month}`,   title: "CWL Wars Begin",    send_at: new Date(Date.UTC(year, month, 3, 8, 0, 0)).toISOString(), type: "cwl", colour: "#34d399" },
    { id: `cwl-end-${year}-${month}`,    title: "CWL Season Ends",   send_at: new Date(Date.UTC(year, month, 10, 8, 0, 0)).toISOString(), type: "cwl", colour: "#34d399" },
  ];

  // Merge CWL + scheduled announcements + side wars with type tags
  const announcementEvents = scheduled.map(s => ({ ...s, type: "announcement", colour: "#a78bfa" }));
  const sideWarEvents = sideWars.map(w => ({
    id: `sidewar-${w.id}`,
    title: `Side War · ${w.clan_name}`,
    send_at: w.start_time,
    type: "sidewar",
    colour: "#f472b6",
  }));
  const allEvents = [...cwlEvents, ...announcementEvents, ...sideWarEvents];

  // Apply filter — show all types in the active filter array
  const filteredEvents = allEvents.filter(e => eventFilter.includes(e.type));

  // Build set of dates with events (use UTC to match CWL event dates)
  const eventsByDate = {};
  for (const s of filteredEvents) {
    const d = new Date(s.send_at);
    if (d.getUTCFullYear() === year && d.getUTCMonth() === month) {
      const key = d.getUTCDate();
      if (!eventsByDate[key]) eventsByDate[key] = [];
      eventsByDate[key].push(s);
    }
  }

  // Selected date events
  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];

  const today = new Date();
  const isToday = (d) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  function prevMonth() {
    setSelectedDate(null);
    setCalMonth(({ year, month }) => month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 });
  }
  function nextMonth() {
    setSelectedDate(null);
    setCalMonth(({ year, month }) => month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 });
  }

  // Build calendar grid
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Scheduled Events</h2>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="text-slate-500 hover:text-slate-300 transition p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="relative">
            <button type="button" onClick={() => setShowMonthPicker(v => !v)}
              className="text-xs text-slate-300 font-semibold min-w-[110px] text-center hover:text-white transition px-2 py-1 rounded-lg hover:bg-white/[0.05]">
              {MONTH_NAMES[month]} {year}
            </button>
            {showMonthPicker && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-50 rounded-2xl border border-white/10 bg-[#0d1424]/95 backdrop-blur-xl shadow-xl overflow-hidden w-48">
                <div className="p-2 max-h-64 overflow-y-auto space-y-0.5">
                  {Array.from({length: 24}, (_, i) => {
                    const d = new Date(); d.setDate(1);
                    d.setMonth(d.getMonth() - 6 + i);
                    const y = d.getFullYear(); const m = d.getMonth();
                    const isActive = y === year && m === month;
                    return (
                      <button key={i} type="button"
                        onClick={() => { setCalMonth({year:y,month:m}); setShowMonthPicker(false); setSelectedDate(null); }}
                        className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition ${isActive ? "bg-purple-600/30 text-purple-200" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"}`}>
                        {MONTH_NAMES[m]} {y}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <button onClick={nextMonth} className="text-slate-500 hover:text-slate-300 transition p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Event type filter — icon toggle pills */}
      <div className="flex items-center gap-2 mb-4">
        {/* CWL toggle */}
        <button type="button" onClick={() => { setSelectedDate(null); setEventFilter(prev => prev.includes("cwl") ? prev.filter(v=>v!=="cwl") : [...prev,"cwl"]); }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold transition ${eventFilter.includes("cwl") ? "text-green-400 border-green-500/60 bg-green-500/10" : "text-slate-600 border-white/10 hover:text-slate-400"}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          CWL
        </button>
        {/* Announcements toggle */}
        <button type="button" onClick={() => { setSelectedDate(null); setEventFilter(prev => prev.includes("announcement") ? prev.filter(v=>v!=="announcement") : [...prev,"announcement"]); }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold transition ${eventFilter.includes("announcement") ? "text-purple-400 border-purple-500/60 bg-purple-500/10" : "text-slate-600 border-white/10 hover:text-slate-400"}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
          </svg>
          Posts
        </button>
        {/* Side Wars toggle */}
        <button type="button" onClick={() => { setSelectedDate(null); setEventFilter(prev => prev.includes("sidewar") ? prev.filter(v=>v!=="sidewar") : [...prev,"sidewar"]); }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold transition ${eventFilter.includes("sidewar") ? "text-pink-400 border-pink-500/60 bg-pink-500/10" : "text-slate-600 border-white/10 hover:text-slate-400"}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>
          </svg>
          Side Wars
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[9px] text-slate-600 uppercase tracking-widest py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i}/>;
          const hasEvents = !!eventsByDate[day];
          const isSelected = selectedDate === day;
          const isTodayDay = isToday(day);
          return (
            <button key={i} onClick={() => setSelectedDate(isSelected ? null : day)}
              className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition text-xs
                ${isSelected ? "bg-purple-600/30 border border-purple-500/40 text-purple-200" :
                  isTodayDay ? "border border-white/20 text-white" :
                  "text-slate-400 hover:bg-white/[0.05] hover:text-white"}
              `}>
              <span className={`font-semibold ${isTodayDay && !isSelected ? "text-purple-300" : ""}`}>{day}</span>
              {hasEvents && (
                <div className="flex gap-0.5 mt-0.5">
                  {[...new Set(eventsByDate[day].map(e => e.colour||"#a78bfa"))].map((col,ci) => (
                    <span key={ci} className="w-1 h-1 rounded-full" style={{background: isSelected ? "#e2e8f0" : col}}/>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date events */}
      {selectedDate && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">
            {MONTH_NAMES[month]} {selectedDate} · {selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""}
          </p>
          {selectedEvents.length === 0 ? (
            <p className="text-slate-700 text-xs">No events on this day</p>
          ) : selectedEvents.map(s => {
            const t = new Date(s.send_at);
            const timeStr = t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            return (
              <div key={s.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{background: s.colour||"#a78bfa"}}/>
                      <p className="text-xs font-semibold text-white truncate">{s.title || "Untitled"}</p>
                    </div>
                    <p className="text-[10px] text-slate-500">{timeStr} UTC{s.type === "cwl" ? " · CWL" : " · Announcement"}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {s.recurrence && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full border border-purple-500/30 text-purple-400">
                        {RECURRENCE_LABELS[s.recurrence] || s.recurrence}
                      </span>
                    )}
                    {s.sent && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full border border-green-500/30 text-green-400">Sent</span>
                    )}
                  </div>
                </div>
                {s.created_by && (
                  <p className="text-[9px] text-slate-700 mt-1">by {s.created_by}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block"/>
          Has events
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
          <span className="w-3 h-3 rounded-full border border-white/20 inline-block"/>
          Today
        </div>
      </div>
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
  const [scheduled, setScheduled] = useState([]);
  const [calMonth, setCalMonth] = useState(() => { const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() }; });
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventFilter, setEventFilter] = useState(["cwl","announcement","sidewar"]);
  const [filterPool, setFilterPool] = useState("all"); // all | in | out
  const [filterDiscord, setFilterDiscord] = useState("all"); // all | yes | no
  const [filterToken, setFilterToken] = useState("all"); // all | yes | no

  const SESSION_KEY = "cwl_admin_pin_confirmed";

  function handlePin(e) {
    e.preventDefault();
    fetch("/api/admin/members", { headers: { "x-officer-pin": pinInput } })
      .then(r => { if (r.ok) { sessionStorage.setItem(SESSION_KEY, pinInput); setPin(pinInput); setAuthed(true); setPinError(false); } else { setPinError(true); } })
      .catch(() => setPinError(true));
  }

  useEffect(() => {
    const stored = sessionStorage.getItem("cwl_admin_pin_confirmed");
    if (stored) { setPin(stored); setAuthed(true); }
  }, []);

  function loadData(p) {
    const activePin = p || pin;
    if (!activePin) return;
    setLoading(true);
    fetch("/api/admin/members", { headers: { "x-officer-pin": activePin } })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch("/api/admin/announcements/schedule", { headers: { "x-officer-pin": activePin } })
      .then(r => r.json())
      .then(d => setScheduled(d.scheduled || []))
      .catch(() => setScheduled([]));
  }

  useEffect(() => {
    if (!authed || !pin) return;
    loadData(pin);
  }, [authed, pin]);

  const pillSelect = "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white focus:outline-none [color-scheme:dark]";
  const [adminTab, setAdminTab] = useState("dashboard");

  // ── Side Wars state ──────────────────────────────────────────────────────
  const [sideWars, setSideWars] = useState([]);
  const [swLoading, setSwLoading] = useState(false);
  const [swForm, setSwForm] = useState({ clan_name: "", clan_tag: "", clan_link: "" });
  const [swError, setSwError] = useState("");
  const [swTimes, setSwTimes] = useState({});
  const [swTimeErrors, setSwTimeErrors] = useState({});
  const [swManageOpen, setSwManageOpen] = useState(false);

  useEffect(() => {
    if (!authed || !pin) return;
    fetch("/api/admin/side-wars", { headers: { "x-officer-pin": pin } })
      .then(r => r.json())
      .then(d => setSideWars(d.wars || []))
      .catch(() => setSideWars([]));
  }, [authed, pin]);

  async function swCreate() {
    setSwError("");
    if (!swForm.clan_name || !swForm.clan_tag || !swForm.clan_link) {
      setSwError("Clan name, tag and link are required"); return;
    }
    setSwLoading(true);
    try {
      const res = await fetch("/api/admin/side-wars", {
        method: "POST", headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify(swForm),
      });
      const data = await res.json();
      if (!res.ok) { setSwError(data.error || "Failed to save"); return; }
      setSideWars(prev => [data.war, ...prev]);
      setSwForm({ clan_name: "", clan_tag: "", clan_link: "" });
    } catch { setSwError("Network error"); }
    finally { setSwLoading(false); }
  }

  async function swToggle(war) {
    if (!war.is_active && !war.start_time) {
      setSwTimeErrors(p => ({...p, [war.id]: "Set a start time before activating"}));
      return;
    }
    setSwTimeErrors(p => ({...p, [war.id]: ""}));
    const res = await fetch("/api/admin/side-wars", {
      method: "PATCH", headers: { "Content-Type": "application/json", "x-officer-pin": pin },
      body: JSON.stringify({ id: war.id, action: "toggle" }),
    });
    const data = await res.json();
    if (res.ok) setSideWars(prev => prev.map(w => w.id === war.id ? data.war : w));
    else setSwTimeErrors(p => ({...p, [war.id]: data.error || "Failed to toggle"}));
  }

  async function swDelete(id) {
    await fetch("/api/admin/side-wars", {
      method: "DELETE", headers: { "Content-Type": "application/json", "x-officer-pin": pin },
      body: JSON.stringify({ id }),
    });
    setSideWars(prev => prev.filter(w => w.id !== id));
  }

  async function swSetFormat(warId, time_format) {
    const res = await fetch("/api/admin/side-wars", {
      method: "PATCH", headers: { "Content-Type": "application/json", "x-officer-pin": pin },
      body: JSON.stringify({ id: warId, action: "set_format", time_format }),
    });
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (data.war) setSideWars(prev => prev.map(w => w.id === warId ? data.war : w));
    } catch(e) { console.error("set_format parse error:", text); }
  }

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

  // Pre-computed quick stats — avoids IIFE in JSX which causes React hook count errors
  const statsInPool = members.filter(m => m.in_pool).length;
  const statsAssigned = members.filter(m => m.assigned_clan).length;
  const statsPct = statsInPool > 0 ? Math.round((statsAssigned / statsInPool) * 100) : 0;

  return (
    <main className="min-h-screen overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      </div>

      <AdminHeader/>

      {/* Hero card */}
      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 mb-4 text-center">
        <h1 className="text-2xl font-thin tracking-widest mb-1">Overview</h1>
        <p className="text-slate-500 text-xs">{season} · Admin Dashboard</p>
      </div>

      {/* Tab nav */}
      <div className="relative z-10 flex items-center justify-center gap-1 mb-4">
        {[["dashboard","Dashboard"],["directory","Directory"],["sidewars","Side Wars"]].map(([key,label]) => (
          <button key={key} onClick={() => setAdminTab(key)}
            className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] uppercase tracking-widest font-semibold border transition ${
              adminTab === key
                ? "border-purple-500/60 bg-purple-500/15 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                : "border-white/10 bg-transparent text-slate-500 hover:text-slate-300 hover:border-white/20"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="relative z-10 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {Array.from({length:4}).map((_,i) => <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 h-20 animate-pulse"/>)}
          </div>
        </div>
      ) : (
        <div className="relative z-10 space-y-4">

          {/* ── DASHBOARD TAB ── */}
          {adminTab === "dashboard" && (<>

          {/* CWL Countdown — most urgent, top of dashboard */}
          <CwlCountdown season={season}/>

          {/* Bar 1 — roster state (primary) */}
          {members.length > 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-5 py-3">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="text-center flex-1">
                  <p className="text-lg font-thin text-purple-300">{statsInPool}</p>
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest">In Pool</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-lg font-thin text-green-300">{statsAssigned}</p>
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest">Assigned</p>
                </div>
                <div className="text-center flex-1">
                  <p className={`text-lg font-thin ${statsPct === 100 ? "text-green-300" : statsPct >= 75 ? "text-amber-300" : "text-red-400"}`}>{statsPct}%</p>
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest">Ready</p>
                </div>
              </div>
              <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-purple-500/60 transition-all" style={{width: `${statsPct}%`}}/>
              </div>
            </div>
          )}

          {/* Bar 2 — account health (matched style, no progress bar) */}
          {members.length > 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-5 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-center flex-1">
                  <p className="text-lg font-thin text-white">{members.length}</p>
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest">Total</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-lg font-thin text-blue-300">{stats.discordLinked ?? "—"}</p>
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest">Discord</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-lg font-thin text-green-300">{stats.apiVerified ?? "—"}</p>
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest">Token</p>
                </div>
              </div>
            </div>
          )}

          {/* Scheduled Events Calendar */}
          <ScheduledCalendar
            scheduled={scheduled}
            sideWars={sideWars.filter(w => w.start_time)}
            calMonth={calMonth}
            setCalMonth={setCalMonth}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            eventFilter={eventFilter}
            setEventFilter={setEventFilter}
          />

          </>)} {/* end dashboard tab */}

          {/* ── DIRECTORY TAB ── */}
          {adminTab === "directory" && (<>

          {/* Member Directory */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Member Directory</h2>
              <button type="button" onClick={() => loadData(pin)} title="Refresh"
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
                    <span title={m.in_pool ? "In pool" : "Not in pool"}
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] border ${m.in_pool ? "border-purple-500/40 text-purple-400" : "border-white/10 text-slate-700"}`}>
                      {m.in_pool ? "✓" : "—"}
                    </span>
                    <span title={m.discord_id ? "Discord linked" : "No Discord"}
                      className={`w-5 h-5 rounded-full flex items-center justify-center border ${m.discord_id ? "border-blue-500/40 text-blue-400" : "border-white/10 text-slate-700"}`}>
                      <svg className="w-2.5 h-2.5" viewBox="0 0 127.14 96.36" fill="currentColor">
                        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0 0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
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
          </div>

          </>)} {/* end directory tab */}

          {/* ── SIDE WARS TAB ── */}
          {adminTab === "sidewars" && (<>

          {/* Clan cards — schedule + activate */}
          {sideWars.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
              <p className="text-slate-600 text-xs">No clans saved yet — add one in Manage Clans below</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sideWars.map(war => {
                const warId = war.id;
                const pendingTime = swTimes[warId] ?? "";
                const showPicker = !war.start_time || swTimes[warId] !== undefined;
                const isRecurring = war.time_format === "recurring";
                return (
                  <div key={warId} className={`rounded-3xl border ${war.is_active ? "border-pink-500/30 bg-pink-500/[0.04]" : "border-white/10 bg-white/[0.04]"} backdrop-blur-xl p-4`}>

                    {/* Identity + Live toggle */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src="/icons/branding/war-shield.png" alt="" className={`w-8 h-8 shrink-0 ${war.is_active ? "opacity-100" : "opacity-40"}`}/>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{war.clan_name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{war.clan_tag}</p>
                        </div>
                      </div>
                      <button onClick={() => swToggle(war)}
                        className={`px-3 py-1 rounded-full text-[10px] font-semibold border transition shrink-0 ${
                          war.is_active
                            ? "bg-pink-500/20 border-pink-500/60 text-pink-300"
                            : war.start_time
                              ? "bg-transparent border-white/10 text-slate-400 hover:border-pink-500/40 hover:text-pink-300"
                              : "bg-transparent border-white/[0.06] text-slate-600 cursor-not-allowed"
                        }`}>
                        {war.is_active ? "Live" : "Off"}
                      </button>
                    </div>

                    {/* Schedule */}
                    <div className="border-t border-white/[0.06] pt-3">
                      {war.start_time && !showPicker && (
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div>
                            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-0.5">Scheduled</p>
                            <p className="text-[11px] text-slate-300">
                              {new Date(war.start_time).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <button onClick={() => setSwTimes(p => ({...p, [warId]: ""}))}
                            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition border border-white/10 hover:border-white/20 rounded-full px-2.5 py-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                            Change
                          </button>
                        </div>
                      )}
                      {!war.start_time && (
                        <p className="text-[10px] text-slate-600 mb-2">No start time — schedule before activating</p>
                      )}
                      {showPicker && (
                        <div className="flex items-center gap-2">
                          <input type="datetime-local"
                            value={pendingTime}
                            onChange={e => setSwTimes(p => ({...p, [warId]: e.target.value}))}
                            className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/20 transition [color-scheme:dark]"/>
                          <button onClick={() => {
                            if (!pendingTime) { setSwTimeErrors(p => ({...p, [warId]: "Pick a date and time first"})); return; }
                            setSwTimeErrors(p => ({...p, [warId]: ""}));
                            fetch("/api/admin/side-wars", {
                              method: "PATCH", headers: { "Content-Type": "application/json", "x-officer-pin": pin },
                              body: JSON.stringify({ id: warId, action: "set_time", start_time: pendingTime }),
                            }).then(r => r.json()).then(data => {
                              if (data.war) {
                                setSideWars(prev => prev.map(w => w.id === warId ? data.war : w));
                                setSwTimes(p => { const n = {...p}; delete n[warId]; return n; });
                              }
                            });
                          }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-2xl text-[10px] font-semibold bg-purple-500/[0.1] text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 transition shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                            </svg>
                            Set
                          </button>
                        </div>
                      )}
                      {swTimeErrors[warId] && (
                        <p className="text-[10px] text-red-400 mt-1">{swTimeErrors[warId]}</p>
                      )}
                    </div>

                    {/* Recurring toggle only */}
                    <div className="border-t border-white/[0.06] pt-3 mt-3">
                      <button onClick={() => swSetFormat(warId, isRecurring ? "countdown" : "recurring")}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl text-[10px] font-semibold border transition ${
                          isRecurring
                            ? "bg-purple-500/20 border-purple-500/60 text-purple-300"
                            : "bg-transparent border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300"
                        }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                        Recurring {isRecurring ? "· On" : "· Off"}
                      </button>
                      {isRecurring && (
                        <p className="text-[9px] text-slate-600 mt-1.5">Resets every 48h from start time</p>
                      )}
                    </div>

                    {war.is_active && (
                      <div className="mt-3 pt-3 border-t border-pink-500/10 flex items-center justify-between">
                        <p className="text-[10px] text-pink-400">Visible on homepage</p>
                        <a href={war.clan_link} target="_blank" rel="noopener noreferrer"
                          className="text-[10px] text-slate-500 hover:text-slate-300 transition underline">
                          View clan link
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Manage Clans — collapsed by default */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
            <button onClick={() => setSwManageOpen(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-left">
              <div className="flex items-center gap-2">
                <img src="/icons/branding/war-shield.png" alt="" className="w-5 h-5 opacity-60"/>
                <span className="text-sm font-semibold text-white">Manage Clans</span>
                {sideWars.length > 0 && (
                  <span className="text-[10px] text-slate-500">{sideWars.length} saved</span>
                )}
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-500 transition-transform ${swManageOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            {swManageOpen && (
              <div className="border-t border-white/[0.06] px-5 pb-5 pt-4 space-y-4">

                {/* Add clan form */}
                <div>
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Add Clan</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">Clan Name</p>
                        <input value={swForm.clan_name} onChange={e => setSwForm(p => ({...p, clan_name: e.target.value}))}
                          placeholder="Cognition {CGN}"
                          className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">Clan Tag</p>
                        <input value={swForm.clan_tag} onChange={e => setSwForm(p => ({...p, clan_tag: e.target.value}))}
                          placeholder="#2C8QQPCL2"
                          className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">Clan Link</p>
                      <input value={swForm.clan_link} onChange={e => setSwForm(p => ({...p, clan_link: e.target.value}))}
                        placeholder="https://link.clashofclans.com/..."
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                    </div>
                    {swError && <p className="text-[11px] text-red-400">{swError}</p>}
                    <button onClick={swCreate} disabled={swLoading}
                      className="w-full py-2.5 rounded-2xl text-xs font-semibold bg-pink-500/[0.1] text-pink-300 border border-pink-500/30 hover:bg-pink-500/20 hover:border-pink-400 transition disabled:opacity-50">
                      {swLoading ? "Saving…" : "Save Clan"}
                    </button>
                  </div>
                </div>

                {/* Remove clans */}
                {sideWars.length > 0 && (
                  <div>
                    <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Remove Clan</p>
                    <div className="space-y-2">
                      {sideWars.map(war => (
                        <div key={war.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                          <div className="min-w-0">
                            <p className="text-xs text-white truncate">{war.clan_name}</p>
                            <p className="text-[10px] text-slate-600 font-mono">{war.clan_tag}</p>
                          </div>
                          <button onClick={() => swDelete(war.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] text-red-400 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10 transition shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          </>)} {/* end side wars tab */}

        </div>
      )}
      <AdminFooter/>
    </main>
  );
}
