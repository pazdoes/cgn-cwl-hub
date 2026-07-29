"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { BRANDING } from "../../lib/branding";
import { TH_ICONS } from "../../lib/icons";
import DiscordWidget from "../components/DiscordWidget";

// ─── Shared branded header + hamburger nav — self-contained copy, since
// this route can't share component definitions with the main app file ───
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
    { items: [{ key: "", label: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" }] },
    { label: "Members", items: [
      { key: "signup", label: "Sign Up", icon: "M12 4v16m8-8H4", href: "/signup" },
      { key: "rosters", label: "View Rosters", icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4", href: "/rosters" },
      { key: "profile", label: "Player Profile", icon: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    ]},
    { label: "Rankings", items: [
      { key: "leaderboard", label: "CWL Leaderboard", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
      { key: "ranked", label: "Ranked Leaderboard", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
    ]},
    { label: "Records", items: [
      { key: "recap", label: "Season Recap", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
      { key: "history", label: "History", icon: "M7 17l4-8 4 5 2-3M3 3v18h18" },
    ]},
    { label: "War", items: [
      { key: "warintel", label: "War Intel", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" },
    ]},
  ];
  function go(key) {
    setNavOpen(false);
    if (typeof window === "undefined") return;
    window.location.href = key === "" ? "/" : `/#${key}`;
  }
  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex transition-opacity duration-150 ${navOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setNavOpen(false)}>
          <div className="absolute inset-0 bg-black/60"/>
          <div onClick={e => e.stopPropagation()}
            className={`relative z-10 w-72 max-w-[80vw] h-full bg-[#0d1424] border-r border-white/10 flex flex-col p-5 transition-transform duration-150 ${navOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="flex items-center gap-2 mb-8 cursor-default select-none" onClick={handleBrandTap}>
              <img src="/icons/branding/cgn-skull.png" alt="CGN" className="w-7 h-7"/>
              <span className="text-sm text-white tracking-widest uppercase">Cognition {"{CGN}"}</span>
            </div>
            <nav className="flex-1 space-y-4 overflow-y-auto">
              {sections.map((section, si) => (
                <div key={si}>
                  {section.label && <p className="text-[9px] text-slate-600 uppercase tracking-widest px-3 mb-1">{section.label}</p>}
                  <div className="space-y-0.5">
                    {section.items.map(item => item.href ? (
                      <a key={item.key} href={item.href}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition text-left">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/>
                        </svg>
                        <span style={{fontFamily:"var(--font-orbitron)"}}>{item.label}</span>
                      </a>
                    ) : (
                      <button key={item.key || "home"} onClick={() => go(item.key)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition text-left">
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
      
      <div className="relative z-10 flex items-center justify-between mb-4 gap-2">
        <button onClick={() => setNavOpen(true)} className="text-slate-400 hover:text-white transition p-1 shrink-0" title="Menu">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <img src="/icons/branding/cgn-skull.png" alt="CGN" className="w-6 h-6"/>
          <span className="text-xs text-slate-400 tracking-widest uppercase">Cognition {"{CGN}"}</span>
        </div>
        <DiscordWidget variant="corner" />
      </div>
    </>
  );
}

/* ─── skeleton loading placeholder ───────────────────────────
   Same treatment as the homepage and admin pool page — a pulsing
   translucent block shaped like the content it stands in for. */
function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse rounded-xl bg-white/[0.06] ${className}`} />
  );
}

/* ─── circular X (remove) button ─────────────────────────── */

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
                        <div key={ii} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
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

function AppFooter({ onNavigateHome }) {
  function goHome() {
    if (onNavigateHome) { onNavigateHome(); return; }
    if (typeof window !== "undefined") window.location.href = "/";
  }
  return (
    <div className="relative z-10 w-full py-4 flex items-center px-4">
      <div className="w-16 shrink-0 flex items-center">
        <button onClick={goHome} className="text-slate-500 hover:text-slate-300 transition p-1" title="Home">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
        </button>
      </div>
      <div className="flex-1 flex justify-center">
        <a href="https://discord.gg/czqKKSF4Ta" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 no-underline">
          <img src="/icons/branding/cgn-skull.png" alt="CGN" className="w-5 h-5"/>
          <span className="text-[11px] text-slate-400 tracking-widest">Cognition {"{CGN}"}</span>
        </a>
      </div>
      <div className="flex items-center gap-2">
        <FaqButton />
      </div>
    </div>
  );
}

function XButton({ onClick, busy, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title={title}
      className="
        shrink-0 w-5 h-5 rounded-full flex items-center justify-center
        bg-white/[0.06] border border-white/10 text-slate-400
        hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300
        transition disabled:opacity-40 disabled:pointer-events-none
      "
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

/* ─── TH icon ────────────────────────────────────────────── */

function ThIcon({ level }) {
  const src = level ? TH_ICONS[String(level)] : null;
  if (!src) return null;
  return (
    <img
      src={src}
      alt={`TH${level}`}
      className="w-8 h-8 shrink-0"
    />
  );
}

/* ─── small helpers ─────────────────────────────────────── */

function normaliseTag(raw) {
  return raw.trim().toUpperCase().replace(/^#*/, "#");
}

function StatusPill({ children, variant = "neutral" }) {
  const colours = {
    success: "bg-green-500/20 text-green-300 border border-green-500/30",
    error:   "bg-red-500/20   text-red-300   border border-red-500/30",
    warn:    "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
    neutral: "bg-slate-500/20 text-slate-300  border border-slate-500/30",
  };
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${colours[variant]}`}>
      {children}
    </span>
  );
}

/* ─── card shell ─────────────────────────────────────────── */

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 shadow-xl ${className}`}>
      {children}
    </div>
  );
}

/* ─── main page ──────────────────────────────────────────── */

export default function SignupPage() {
  // Discord session (item 17) — useSession() reads the JWT cookie set
  // by Auth.js after a successful Discord sign-in. Status can be:
  // "loading" (checking), "authenticated" (signed in), "unauthenticated".
  const { data: discordSession, status: discordStatus } = useSession();
  const discordUser = discordSession?.user;

  // Once a Discord session is confirmed, attempt to link it to any
  // existing cookie-based accounts — this is the one-time merge step
  // that makes previously-registered accounts durable under Discord.
  // Safe to call on every mount since the route is a no-op if the link
  // already exists.
  useEffect(() => {
    if (discordStatus === "authenticated" && discordUser?.discordId) {
      fetch("/api/accounts/link-discord", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ discordId: discordUser?.discordId, discordUsername: discordUser?.discordUsername || null }) })
        .catch(() => {}); // non-fatal — accounts still work via cookie
    }
  }, [discordStatus, discordUser?.discordId]);

  /* --- state --- */
  const [season, setSeason]         = useState(null);
  const [myAccounts, setMyAccounts] = useState([]);   // quick-pick list from cookie
  const [accountSearch, setAccountSearch] = useState("");
  const [poolCount, setPoolCount] = useState(null);
  const [outCount, setOutCount] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [loadingMine, setLoadingMine] = useState(true);

  // manual drag-and-drop reordering (item 13)
  const [draggingTag, setDraggingTag] = useState(null);
  const [dragOverTag, setDragOverTag] = useState(null);

  // verify-new-account form
  const [tag,   setTag]   = useState("");
  const [token, setToken] = useState("");
  const [verifyStatus, setVerifyStatus] = useState(null); // {ok, message, name}
  const [verifying, setVerifying]       = useState(false);

  // re-join existing account
  const [joiningTag, setJoiningTag]   = useState(null);
  const [joinResult, setJoinResult]   = useState({}); // { [tag]: {ok, message} }

  // leave the pool entirely (item 5)
  const [leavingTag, setLeavingTag]   = useState(null);
  const [leaveError, setLeaveError]   = useState({}); // { [tag]: message }

  // Hamburger menu state for Your Accounts card
  const [accountsMenuOpen, setAccountsMenuOpen] = useState(false);
  const [accountsView, setAccountsView] = useState("accounts"); // "accounts" | "add" | "remove"
  const accountsMenuRef = useRef(null);

  // Manage panel (item 9)
  const [manageOpen,        setManageOpen]        = useState(false);
  const [manageTab,         setManageTab]         = useState("add"); // "add" | "remove"
  const [manageTag,         setManageTag]         = useState("");
  const [manageSubmitting,  setManageSubmitting]  = useState(false);
  const [manageResult,      setManageResult]      = useState(null); // {ok, message}

  // TH refresh button (item 15) — fetches fresh TH from CoC for all
  // linked accounts and updates Neon, so the stored TH reflects any
  // upgrades since the account was first registered.
  const [thRefreshing, setThRefreshing] = useState(false);
  const [thRefreshResult, setThRefreshResult] = useState(null); // {ok, message}

  /* --- load owned accounts on mount --- */
  // TH level now comes from Neon (accounts.town_hall_level, item 15)
  // via the /api/accounts/mine response — no separate CoC API call
  // needed. accounts/mine already includes townHallLevel in each entry.
  // myAccounts entries now carry { tag, name, inCurrentPool, townHallLevel }.
  useEffect(() => {
    fetch("/api/pool/count")
      .then(r => r.json())
      .then(d => { setPoolCount(d.count ?? null); setOutCount(d.outCount ?? null); })
      .catch(() => {});
    fetch("/api/accounts/mine")
      .then(r => r.json())
      .then(data => {
        setMyAccounts(data.accounts || []);
        setSeason(data.season || null);
      })
      .catch(() => {})
      .finally(() => setLoadingMine(false));
  }, []);

  // Close accounts menu on outside click
  useEffect(() => {
    function handleClick(e) {
      if (accountsMenuRef.current && !accountsMenuRef.current.contains(e.target)) {
        setAccountsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* --- register a new account (token optional — item 8) --- */
  async function handleVerify(e) {
    if (e?.preventDefault) e.preventDefault();
    const normTag = normaliseTag(tag);
    if (!normTag) return;

    setVerifying(true);
    setVerifyStatus(null);

    try {
      const res = await fetch("/api/accounts/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: normTag, token: token.trim() || undefined, discordId: discordUser?.discordId || undefined }),
      });
      const data = await res.json();

      if (res.ok) {
        setVerifyStatus({ ok: true, message: `${data.name} (${data.tag}) signed up for ${data.season}.` });
        // refresh quick-pick list — TH level is now included in the
        // accounts/mine response from Neon, no separate CoC API call needed
        // Re-run discord link to ensure newly added account gets discord_id
        if (discordStatus === "authenticated") {
          await fetch("/api/accounts/link-discord", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ discordId: discordUser?.discordId, discordUsername: discordUser?.discordUsername || null }) }).catch(() => {});
        }
        const mine = await fetch("/api/accounts/mine").then(r => r.json());
        setMyAccounts(mine.accounts || []);
        setSeason(mine.season || season);
        setTag("");
        setToken("");
      } else {
        setVerifyStatus({ ok: false, message: data.error || "Verification failed." });
      }
    } catch {
      setVerifyStatus({ ok: false, message: "Network error — please try again." });
    } finally {
      setVerifying(false);
    }
  }

  /* --- re-join an already-verified account --- */
  async function handleJoin(accountTag) {
    setJoiningTag(accountTag);
    try {
      const res = await fetch("/api/pool/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: accountTag }),
      });
      const data = await res.json();

      if (res.ok) {
        setJoinResult(prev => ({
          ...prev,
          [accountTag]: { ok: true, message: `Signed up for ${data.season}.` },
        }));
        setPoolCount(c => (c ?? 0) + 1); // optimistic increment
        // refresh list so inCurrentPool updates
        const mine = await fetch("/api/accounts/mine").then(r => r.json());
        setMyAccounts(mine.accounts || []);
      } else {
        setJoinResult(prev => ({
          ...prev,
          [accountTag]: { ok: false, message: data.error || "Sign-up failed." },
        }));
      }
    } catch {
      setJoinResult(prev => ({
        ...prev,
        [accountTag]: { ok: false, message: "Network error — please try again." },
      }));
    } finally {
      setJoiningTag(null);
    }
  }

  /* --- set CWL intent --- */
  async function handleIntent(accountTag, intent) {
    // Optimistic update — reflect change immediately in UI
    const prev = myAccounts.find(a => a.tag === accountTag);
    setMyAccounts(accs => accs.map(a => a.tag === accountTag ? { ...a, cwlIntent: intent } : a));
    // Optimistically update outCount
    if (intent === "out" && prev?.cwlIntent !== "out") setOutCount(c => (c ?? 0) + 1);
    if (intent !== "out" && prev?.cwlIntent === "out") setOutCount(c => Math.max(0, (c ?? 1) - 1));
    try {
      const res = await fetch("/api/pool/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: accountTag, intent }),
      });
      if (!res.ok) {
        const mine = await fetch("/api/accounts/mine").then(r => r.json());
        setMyAccounts(mine.accounts || []);
      }
    } catch {
      const mine = await fetch("/api/accounts/mine").then(r => r.json());
      setMyAccounts(mine.accounts || []);
    }
  }

  /* --- bulk intent for selected accounts --- */
  async function handleBulkIntent(intent) {
    setBulkBusy(true);
    const tags = [...selectedTags];
    for (const tag of tags) {
      const acct = myAccounts.find(a => a.tag === tag);
      if (!acct) continue;
      if (intent === "in") {
        if (acct.cwlIntent === "out") await handleIntent(tag, null);
        if (!acct.inCurrentPool) await handleJoin(tag);
      } else {
        if (acct.inCurrentPool) await handleLeave(tag);
        await handleIntent(tag, "out");
      }
    }
    setSelectedTags(new Set());
    setBulkBusy(false);
  }

  function toggleSelectTag(tag) {
    setSelectedTags(prev => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  }

  /* --- leave the pool entirely (item 5) --- */
  async function handleLeave(accountTag) {
    setLeavingTag(accountTag);
    setLeaveError(prev => ({ ...prev, [accountTag]: null }));
    try {
      const res = await fetch("/api/pool/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: accountTag }),
      });
      const data = await res.json();

      if (res.ok) {
        setPoolCount(c => Math.max(0, (c ?? 1) - 1)); // optimistic decrement
        // refresh list so inCurrentPool updates and the leave button
        // reverts back to a "Sign up" button
        const mine = await fetch("/api/accounts/mine").then(r => r.json());
        setMyAccounts(mine.accounts || []);
        // clear any stale join-result for this tag, since it's a fresh
        // not-in-pool state now, not a "just signed up" state
        setJoinResult(prev => {
          const next = { ...prev };
          delete next[accountTag];
          return next;
        });
      } else {
        setLeaveError(prev => ({ ...prev, [accountTag]: data.error || "Couldn't leave pool." }));
      }
    } catch {
      setLeaveError(prev => ({ ...prev, [accountTag]: "Network error — please try again." }));
    } finally {
      setLeavingTag(null);
    }
  }

  /* --- TH refresh (item 15) — fetch fresh TH for all linked accounts --- */
  async function handleThRefresh() {
    setThRefreshing(true);
    setThRefreshResult(null);
    try {
      const res = await fetch("/api/accounts/refresh-th", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        // Re-fetch accounts/mine so the updated TH levels are reflected
        // immediately in the displayed icons without a page reload.
        const mine = await fetch("/api/accounts/mine").then(r => r.json());
        setMyAccounts(mine.accounts || []);
        const count = Object.keys(data.updated || {}).length;
        setThRefreshResult({ ok: true, message: `Updated ${count} account${count !== 1 ? "s" : ""}` });
      } else {
        setThRefreshResult({ ok: false, message: data.error || "Refresh failed" });
      }
    } catch {
      setThRefreshResult({ ok: false, message: "Network error" });
    } finally {
      setThRefreshing(false);
    }
  }

  /* --- remove an account from this device entirely (item 9) --- */
  function toggleManage(tab = "add") {
    setManageOpen(prev => !prev);
    setManageTab(tab);
    setManageTag("");
    setManageResult(null);
    setVerifyStatus(null);
  }

  // Used by the zero-accounts "Add Account" button, which should always
  // open the panel (never close it, since it's the first interaction)
  // on the "add" tab specifically.
  function openManageAdd() {
    setAccountsView("add");
    setManageResult(null);
    setVerifyStatus(null);
  }

  async function handleManageSubmit(e) {
    if (e?.preventDefault) e.preventDefault();
    const normTag = normaliseTag(manageTag);
    if (!normTag) return;

    setManageSubmitting(true);
    setManageResult(null);

    try {
      const res = await fetch("/api/accounts/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: normTag }),
      });
      const data = await res.json();

      if (res.ok) {
        setManageResult({ ok: true, message: `${normTag} removed from this device.` });
        // refresh the list so the removed account disappears immediately
        const mine = await fetch("/api/accounts/mine").then(r => r.json());
        setMyAccounts(mine.accounts || []);
        setManageTag("");
      } else {
        setManageResult({ ok: false, message: data.error || "Couldn't remove account." });
      }
    } catch {
      setManageResult({ ok: false, message: "Network error — please try again." });
    } finally {
      setManageSubmitting(false);
    }
  }

  /* --- drag-and-drop reordering of Your Accounts (item 13) ---
     Purely cosmetic per the confirmed scope, but persisted: the new
     order is written to Neon on drop, so it survives a refresh. Reorders
     the myAccounts array optimistically as the user drags over each
     item, then saves the final order once they actually drop. */
  function onAccountDragStart(tag) {
    setDraggingTag(tag);
  }

  function onAccountDragOver(e, overTag) {
    e.preventDefault();
    if (overTag === draggingTag) return;
    setDragOverTag(overTag);

    if (!draggingTag || draggingTag === overTag) return;

    setMyAccounts(prev => {
      const fromIndex = prev.findIndex(a => a.tag === draggingTag);
      const toIndex = prev.findIndex(a => a.tag === overTag);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function onAccountDragLeave() {
    setDragOverTag(null);
  }

  async function onAccountDrop() {
    setDraggingTag(null);
    setDragOverTag(null);

    // Persist whatever order myAccounts is in right now — it's already
    // been reordered optimistically during the drag itself, so the
    // drop just needs to save it, not compute anything new.
    try {
      await fetch("/api/accounts/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedTags: myAccounts.map(a => a.tag) }),
      });
    } catch {
      // non-fatal — the order still looks right on screen even if the
      // save failed; it just won't survive a refresh in that case
    }
  }

  // Touch equivalent of the drag handlers above. HTML5's native
  // draggable/onDragStart/onDragOver API is desktop-only — mobile touch
  // browsers never fire those events at all, so reordering silently did
  // nothing on a phone without this.
  //
  // Uses a LONG-PRESS threshold to distinguish an intentional drag from
  // an ordinary scroll — without this, ANY touch-and-move starting on a
  // row would be treated as a drag attempt, making it impossible to
  // scroll past a row by touching it directly (the same pattern iOS
  // itself uses for reorderable lists).
  //
  // touch-action alone can't fully solve this: it's a static CSS
  // property the browser commits to at the very start of the touch,
  // before any JS runs — it does NOT respect JS state changes mid-
  // gesture. So even after the long-press timer confirms "this is now
  // a drag" (the card visibly highlights), touch-action: pan-y had
  // already told the browser scrolling was fair game for this touch
  // from the first frame, and native scrolling kept running in
  // parallel underneath the (correctly-computed) drag logic — the bug
  // reported after the first touch fix.
  //
  // The actual fix: once the long-press fires, manually attach a
  // touchmove listener via raw addEventListener with { passive: false }
  // — NOT React's onTouchMove JSX prop, which Chrome/React always
  // treats as passive and silently ignores preventDefault() inside.
  // Only once a drag is confirmed do we call preventDefault() (stopping
  // native scroll from that point on); before the threshold, no extra
  // listener exists at all, so ordinary swipes scroll completely
  // normally with no interference.
  const LONG_PRESS_MS = 280;
  const MOVE_CANCEL_PX = 10;
  const touchStateRef = useRef({
    timer: null, startX: 0, startY: 0, tag: null, active: false,
    moveListener: null, endListener: null, cancelListener: null,
    snapshot: null, // pre-drag order snapshot for revert on API failure
  });

  function cleanupAccountTouchListeners() {
    const state = touchStateRef.current;
    if (state.moveListener) document.removeEventListener("touchmove", state.moveListener);
    if (state.endListener) document.removeEventListener("touchend", state.endListener);
    if (state.cancelListener) document.removeEventListener("touchcancel", state.cancelListener);
    state.moveListener = null;
    state.endListener = null;
    state.cancelListener = null;
  }

  function onAccountTouchStart(e, tag) {
    const touch = e.touches[0];
    if (!touch) return;

    const state = touchStateRef.current;
    state.startX = touch.clientX;
    state.startY = touch.clientY;
    state.tag = tag;
    state.active = false;

    state.timer = setTimeout(() => {
      state.active = true;

      // Snapshot the current order before any dragging begins — used
      // to revert if the API save fails after the drop completes.
      // Done here (inside the timer) rather than in onTouchStart, so
      // the snapshot is taken at the moment the drag is confirmed, not
      // before (which would be the same thing in practice, but makes
      // the intent explicit: this is the "last known good" order).
      setMyAccounts(prev => {
        state.snapshot = [...prev];
        return prev; // no change yet, just snapshot
      });

      onAccountDragStart(tag);

      // Drag confirmed — attach the real, non-passive touchmove handler.
      // No CSS transform needed: the card stays in its list position
      // (rendering at reduced opacity via isDragging) while other cards
      // shift in real time as the finger crosses over them. This removes
      // the visual alignment drift that came from the transform approach,
      // and eliminates the need for pointer-events tricks entirely.
      const moveListener = (moveEvent) => {
        if (moveEvent.cancelable) moveEvent.preventDefault();
        const t = moveEvent.touches[0];
        if (!t) return;

        const el = document.elementFromPoint(t.clientX, t.clientY);
        const row = el?.closest("[data-account-tag]");
        if (!row) return;

        const overTag = row.getAttribute("data-account-tag");
        if (!overTag) return;

        const draggingTagNow = state.tag;
        if (!draggingTagNow || overTag === draggingTagNow) return;

        setDragOverTag(overTag);
        setMyAccounts(prev => {
          const fromIndex = prev.findIndex(a => a.tag === draggingTagNow);
          const toIndex = prev.findIndex(a => a.tag === overTag);
          if (fromIndex === -1 || toIndex === -1) return prev;

          const next = [...prev];
          const [moved] = next.splice(fromIndex, 1);
          next.splice(toIndex, 0, moved);
          return next;
        });
      };

      const finish = async () => {
        cleanupAccountTouchListeners();
        setDraggingTag(null);
        setDragOverTag(null);

        // The list is already showing the correct final order
        // optimistically (real-time shifts happened during the drag).
        // Read the current order from state via a functional update
        // (avoids stale closure), persist it, and revert to the
        // pre-drag snapshot if the API save fails for any reason.
        let currentOrder = null;
        setMyAccounts(prev => { currentOrder = prev.map(a => a.tag); return prev; });

        try {
          const res = await fetch("/api/accounts/reorder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderedTags: currentOrder }),
          });
          if (!res.ok && state.snapshot) {
            setMyAccounts(state.snapshot);
          }
        } catch {
          if (state.snapshot) setMyAccounts(state.snapshot);
        }

        state.tag = null;
        state.active = false;
        state.snapshot = null;
      };

      state.moveListener = moveListener;
      state.endListener = finish;
      state.cancelListener = finish;
      document.addEventListener("touchmove", moveListener, { passive: false });
      document.addEventListener("touchend", finish, { passive: true });
      document.addEventListener("touchcancel", finish, { passive: true });
    }, LONG_PRESS_MS);
  }

  function onAccountTouchMove(e) {
    const state = touchStateRef.current;
    if (state.active || !state.tag) return; // confirmed drags are handled by the manual listener above

    // Pre-threshold: only used to detect "this is a scroll, not a
    // hold" and cancel the pending timer — never calls preventDefault,
    // so native scrolling for an ordinary swipe is never interrupted.
    const touch = e.touches[0];
    if (!touch) return;

    const dx = Math.abs(touch.clientX - state.startX);
    const dy = Math.abs(touch.clientY - state.startY);
    if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) {
      clearTimeout(state.timer);
      state.tag = null;
    }
  }

  function onAccountTouchEnd() {
    const state = touchStateRef.current;
    clearTimeout(state.timer);
    // If a drag was confirmed, the manually-attached touchend/touchcancel
    // listener already handles finishing it — this only needs to cover
    // the case where the finger lifted BEFORE the long-press threshold
    // fired at all (a simple tap or a scroll that ended quickly).
    if (!state.active) {
      state.tag = null;
    }
  }

  /* ─── render ─────────────────────────────────────────── */
  // Determine which state we're in
  const isNewUser = !loadingMine && myAccounts.length === 0;
  const isReturningUser = !loadingMine && myAccounts.length > 0;
  const [accountManagerOpen, setAccountManagerOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">

      {/* ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      <img src="/roster-bg.png" alt="" className="fixed inset-0 select-none pointer-events-none opacity-20" style={{width:"100vw",height:"100dvh",objectFit:"cover",objectPosition:"center top"}}/>
      </div>

      <AppHeader variant="bar"/>

      {/* ── Hero card — flush to top ── */}
      <div className="relative z-10 mb-4 text-center">
        <h1 className="text-4xl font-thin tracking-widest mb-1">Sign Up for CWL</h1>
        <div className="flex items-center justify-center gap-2 flex-wrap mb-2 mt-1">
          {season && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[10px] font-semibold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"/>
              {season}
            </div>
          )}
          {poolCount !== null && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"/>
              {poolCount} In
            </div>
          )}
          {outCount !== null && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"/>
              {outCount} Out
            </div>
          )}
        </div>
        {/* How to use — expandable info panel */}
        <div className="mt-1 mb-2">
          <button type="button" onClick={() => setInfoOpen(v => !v)}
            className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            How does this work?
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 transition-transform ${infoOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
          {infoOpen && (
            <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left space-y-2.5">
              {[
                ["✓ In", "Adds you to the CWL player pool. Leaders can assign you to a clan roster for this season."],
                ["✕ Out", "Lets leaders know you're sitting this season out. No need to be chased or followed up with."],
                ["No Response", "If neither In nor Out is selected, leaders will follow up with you directly."],
                ["Tap a tile", "Select an account tile to highlight it. Tap again to deselect. Select multiple accounts individually."],
                ["Select All", "Selects all your accounts at once for a bulk action."],
                ["Bulk In / Out All", "Applies your In or Out choice to all selected accounts simultaneously."],
                ["Account Manager", "Use the gear icon at the bottom to add or remove accounts linked to your profile."],
              ].map(([label, desc]) => (
                <div key={label} className="flex gap-2">
                  <span className="text-[10px] font-semibold text-purple-300 shrink-0 w-24">{label}</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {discordStatus !== "authenticated" && (
            <p className="text-[10px] text-slate-600 max-w-[220px] leading-relaxed text-center">
              Sign in with Discord to permanently bind your accounts to your profile across devices
            </p>
          )}


        {/* Step indicator — only for new users */}
        {(isNewUser || loadingMine) && accountsView === "accounts" && (
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {["add", "accounts"].map((v, i) => (
              <span key={v} className={`w-1.5 h-1.5 rounded-full transition ${accountsView === v || (i === 0) ? "bg-purple-400" : "bg-white/20"}`}/>
            ))}
          </div>
        )}
      </div>

      {/* ── State A: Loading ── */}
      {loadingMine && (
        <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3 min-w-0">
                <Skeleton className="w-8 h-8 rounded-full shrink-0"/>
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="w-28 h-3.5"/>
                  <Skeleton className="w-20 h-3"/>
                </div>
              </div>
              <Skeleton className="w-20 h-6 rounded-full shrink-0"/>
            </div>
          ))}
        </div>
      )}

      {/* ── State B: New user — 3-step add account form ── */}
      {!loadingMine && isNewUser && (
        <div className="relative z-10 space-y-4">
          {/* Step card */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center justify-center shrink-0">1</span>
              <h2 className="text-sm font-semibold text-slate-300">Link Your Account</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 ml-1">Player Tag</label>
                <input type="text" placeholder="#ABC123" value={tag}
                  onChange={e => setTag(e.target.value)}
                  onPaste={e => { e.preventDefault(); setTag(e.clipboardData.getData("text")); }}
                  autoCapitalize="characters" autoCorrect="off" spellCheck={false}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition font-mono tracking-wide text-sm"/>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5 ml-1">
                  <label className="text-xs text-slate-400">API Token</label>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-slate-600">Optional</span>
                </div>
                <input type="text" placeholder="Paste from in-game settings, or leave blank" value={token}
                  onChange={e => setToken(e.target.value)} autoCorrect="off" spellCheck={false}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition font-mono text-sm"/>
                <p className="text-[10px] text-slate-600 mt-1.5 ml-1 leading-relaxed">Providing your token confirms account ownership and enables future personalisation features</p>
              </div>
              <button type="button" onClick={handleVerify} disabled={verifying || !tag.trim()}
                className="w-full py-3 rounded-2xl font-semibold text-sm bg-transparent text-purple-400 border border-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.15)] hover:shadow-[0_0_16px_rgba(168,85,247,0.25)] hover:border-purple-400 hover:text-purple-300 transition disabled:opacity-40 disabled:cursor-not-allowed">
                {verifying ? "Verifying…" : "Verify & Sign Up"}
              </button>
              {verifyStatus && (
                <p className={`text-xs text-center ${verifyStatus.ok ? "text-green-300" : "text-red-400"}`}>{verifyStatus.message}</p>
              )}
            </div>
          </div>

          {/* How it works */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">How it works</h2>
            <ol className="space-y-3">
              {[
                ["Link your account", "Enter your player tag. API token is optional but confirms ownership and unlocks future features."],
                ["Join the pool", "Your account enters the shared player pool for this season."],
                ["Get assigned", "Admins assign players to clan rosters each season."],
                ["One tap next season", "Saved accounts rejoin with a single tap — no reverification needed."],
              ].map(([title, desc], i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <div>
                    <p className="text-xs font-semibold text-white">{title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* ── State C: Returning user — compact account dashboard ── */}
      {!loadingMine && isReturningUser && (
        <div className="relative z-10 space-y-3">

          {/* Search + select all + bulk actions */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input type="text" value={accountSearch} onChange={e => setAccountSearch(e.target.value)}
                  placeholder="Search accounts…"
                  className="w-full rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                {accountSearch && <button onClick={() => setAccountSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white text-xs">✕</button>}
              </div>
              <button onClick={() => {
                const visible = myAccounts.filter(a => !accountSearch || a.name?.toLowerCase().includes(accountSearch.toLowerCase()) || a.tag?.toLowerCase().includes(accountSearch.toLowerCase()));
                const allSelected = visible.every(a => selectedTags.has(a.tag));
                setSelectedTags(allSelected ? new Set() : new Set(visible.map(a => a.tag)));
              }}
                className="px-3 py-1.5 rounded-full border border-white/10 text-slate-500 text-xs hover:text-slate-300 hover:border-white/20 transition whitespace-nowrap">
                {selectedTags.size > 0 ? `${selectedTags.size} selected` : "Select All"}
              </button>
            </div>
            {selectedTags.size > 0 && (
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] text-slate-500 flex-1">{selectedTags.size} account{selectedTags.size !== 1 ? "s" : ""} selected</span>
                <button onClick={() => handleBulkIntent("in")} disabled={bulkBusy}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border border-green-500/60 text-green-400 bg-green-500/10 hover:border-green-400 transition disabled:opacity-40">
                  {bulkBusy ? "…" : "✓ In All"}
                </button>
                <button onClick={() => handleBulkIntent("out")} disabled={bulkBusy}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border border-red-500/60 text-red-400 bg-red-500/10 hover:border-red-400 transition disabled:opacity-40">
                  {bulkBusy ? "…" : "✕ Out All"}
                </button>
                <button onClick={() => setSelectedTags(new Set())} className="text-slate-600 hover:text-slate-400 text-xs transition">✕</button>
              </div>
            )}
          </div>

          {/* Account cards */}
          <div className="space-y-2">
            {myAccounts.filter(a => !accountSearch || a.name?.toLowerCase().includes(accountSearch.toLowerCase()) || a.tag?.toLowerCase().includes(accountSearch.toLowerCase())).map(acct => {
              const result = joinResult[acct.tag];
              const busy   = joiningTag === acct.tag;
              const isDragging = draggingTag === acct.tag;
              const isDragOver  = dragOverTag === acct.tag && draggingTag !== acct.tag;
              return (
                <div
                  key={acct.tag}
                  data-account-tag={acct.tag}
                  draggable
                  onDragStart={() => onAccountDragStart(acct.tag)}
                  onDragOver={e => onAccountDragOver(e, acct.tag)}
                  onDragLeave={onAccountDragLeave}
                  onDragEnd={onAccountDrop}
                  onTouchStart={e => onAccountTouchStart(e, acct.tag)}
                  onTouchMove={onAccountTouchMove}
                  onTouchEnd={onAccountTouchEnd}
                  style={{ touchAction: "pan-y", WebkitUserSelect: "none", userSelect: "none" }}
                  onClick={() => toggleSelectTag(acct.tag)}
                  className={`rounded-2xl border bg-white/[0.03] backdrop-blur-xl p-4 transition cursor-pointer
                    ${isDragging ? "opacity-40 border-purple-500/40" : ""}
                    ${isDragOver ? "border-purple-400/60 bg-purple-500/5" : ""}
                    ${selectedTags.has(acct.tag)
                      ? "border-purple-500/60 bg-purple-500/[0.06] shadow-[0_0_12px_rgba(168,85,247,0.12)]"
                      : acct.inCurrentPool
                        ? "border-green-500/40 bg-green-500/[0.04] shadow-[0_0_10px_rgba(74,222,128,0.08)]"
                        : acct.cwlIntent === "out"
                          ? "border-red-500/40 bg-red-500/[0.04] shadow-[0_0_10px_rgba(239,68,68,0.08)]"
                          : "border-white/10 hover:bg-white/[0.05]"}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <ThIcon level={acct.townHallLevel}/>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{acct.name}</p>
                      <p className="text-[10px] text-slate-600 font-mono">{acct.tag}</p>
                    </div>
                    {/* CWL intent — In / Out */}
                    <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                      {/* ✓ In */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (acct.inCurrentPool) {
                            await handleLeave(acct.tag);
                          } else {
                            if (acct.cwlIntent === "out") await handleIntent(acct.tag, null);
                            await handleJoin(acct.tag);
                          }
                        }}
                        disabled={busy || leavingTag === acct.tag}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition disabled:opacity-50 whitespace-nowrap ${
                          acct.inCurrentPool
                            ? "bg-green-500/10 text-green-400 border-green-500/60 shadow-[0_0_8px_rgba(74,222,128,0.12)]"
                            : "bg-transparent text-slate-500 border-white/10 hover:text-green-400 hover:border-green-500/40"
                        }`}>
                        {leavingTag === acct.tag || busy ? "…" : "✓ In"}
                      </button>
                      {/* ✕ Out */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (acct.inCurrentPool) await handleLeave(acct.tag);
                          await handleIntent(acct.tag, acct.cwlIntent === "out" ? null : "out");
                        }}
                        disabled={busy || leavingTag === acct.tag}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition disabled:opacity-50 whitespace-nowrap ${
                          acct.cwlIntent === "out" && !acct.inCurrentPool
                            ? "bg-red-500/10 text-red-400 border-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.12)]"
                            : "bg-transparent text-slate-500 border-white/10 hover:text-red-400 hover:border-red-500/40"
                        }`}>
                        ✕ Out
                      </button>
                    </div>
                  </div>
                  {leaveError[acct.tag] && (
                    <p className="text-[10px] text-red-400 mt-2 text-center">{leaveError[acct.tag]}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Account Manager — collapsible */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
            <button type="button" onClick={() => setAccountManagerOpen(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-left">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span className="text-sm text-slate-400">Account Manager</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-600 transition-transform ${accountManagerOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            {accountManagerOpen && (
              <div className="px-5 pb-5 space-y-4 border-t border-white/10">
                {/* TH refresh */}
                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-xs text-slate-300 font-semibold">Refresh Town Hall Levels</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">Updates TH levels from the game</p>
                  </div>
                  <button type="button" onClick={handleThRefresh} disabled={thRefreshing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-50 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 ${thRefreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    {thRefreshing ? "Refreshing…" : "Refresh"}
                  </button>
                </div>
                {thRefreshResult && (
                  <p className={`text-[10px] ${thRefreshResult.ok ? "text-green-400" : "text-red-400"}`}>{thRefreshResult.message}</p>
                )}

                {/* Add account */}
                <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                  <p className="text-xs text-slate-400 font-semibold">Add Account</p>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1.5 ml-1">Player Tag</label>
                    <input type="text" placeholder="#ABC123" value={tag}
                      onChange={e => setTag(e.target.value)}
                      onPaste={e => { e.preventDefault(); setTag(e.clipboardData.getData("text")); }}
                      autoCapitalize="characters" autoCorrect="off" spellCheck={false}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition font-mono tracking-wide text-sm"/>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 ml-1">
                      <label className="text-[10px] text-slate-500">API Token</label>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-slate-600">Optional</span>
                    </div>
                    <input type="text" placeholder="From in-game settings" value={token}
                      onChange={e => setToken(e.target.value)} autoCorrect="off" spellCheck={false}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition font-mono text-sm"/>
                  </div>
                  <button type="button" onClick={handleVerify} disabled={verifying || !tag.trim()}
                    className="w-full py-2.5 rounded-2xl font-semibold text-sm bg-transparent text-purple-400 border border-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.15)] hover:shadow-[0_0_16px_rgba(168,85,247,0.25)] hover:border-purple-400 hover:text-purple-300 transition disabled:opacity-40 disabled:cursor-not-allowed">
                    {verifying ? "Verifying…" : "Add Account"}
                  </button>
                  {verifyStatus && (
                    <p className={`text-xs text-center ${verifyStatus.ok ? "text-green-300" : "text-red-400"}`}>{verifyStatus.message}</p>
                  )}
                </div>

                {/* Remove account */}
                <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                  <p className="text-xs text-slate-400 font-semibold">Remove Account</p>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1.5 ml-1">Player Tag</label>
                    <input type="text" placeholder="#ABC123" value={manageTag}
                      onChange={e => setManageTag(e.target.value)}
                      autoCapitalize="characters" autoCorrect="off" spellCheck={false}
                      className="w-full rounded-2xl border border-red-500/20 bg-white/[0.04] px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 transition font-mono tracking-wide text-sm"/>
                  </div>
                  <button type="button" onClick={handleManageSubmit} disabled={manageSubmitting || !manageTag.trim()}
                    className="w-full py-2.5 rounded-2xl font-semibold text-sm bg-transparent text-red-400 border border-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.15)] hover:shadow-[0_0_16px_rgba(239,68,68,0.25)] hover:border-red-400 hover:text-red-300 transition disabled:opacity-40 disabled:cursor-not-allowed">
                    {manageSubmitting ? "Removing…" : "Remove Account"}
                  </button>
                  {manageResult && (
                    <p className={`text-xs text-center ${manageResult.ok ? "text-green-300" : "text-red-400"}`}>{manageResult.message}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <AppFooter/>
    </main>
  );
}
