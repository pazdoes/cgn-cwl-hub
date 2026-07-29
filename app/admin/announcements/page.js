"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import DiscordWidget from "../../components/DiscordWidget";
import { BRANDING } from "../../../lib/branding";
import { CWL_ICONS } from "../../../lib/icons";

/* ─── helpers ──────────────────────────────────────────────── */
function Card({ children, className = "" }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 ${className}`}>
      {children}
    </div>
  );
}

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.06] ${className}`} />;
}

function intToHex(n) { return "#" + n.toString(16).padStart(6, "0"); }
function hexToInt(hex) { return parseInt(hex.replace("#", ""), 16); }

/* ─── Hamburger nav ───────────────────────────────────────── */
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
  const navSections = [
    { label: null, items: [
      { href: "/admin", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    ]},
    { label: "CWL", items: [
      { href: "/admin/pool", label: "Pool Manager", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
      { href: "/admin/season", label: "Season Manager", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
      { href: "/admin/clans", label: "Clan Manager", icon: "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" },
    ]},
    { label: "SIDE WARS", items: [
      { href: "/admin/side-wars", label: "Side Wars", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
    ]},
    { label: "ANNOUNCEMENTS", items: [
      { href: "/admin/announcements", label: "Announcements", icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
      { href: "/admin/share-cards", label: "Share Cards", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
    ]},
    { label: null, items: [
      { href: "/admin/directory", label: "Directory", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6-3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
    ]},
  ];
  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex transition-opacity duration-150 ${navOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setNavOpen(false)}>
          <div className="absolute inset-0 bg-black/60"/>
          <div onClick={e => e.stopPropagation()}
            className={`relative z-10 w-72 max-w-[80vw] h-full bg-[#0b1020]/80 backdrop-blur-2xl border-r border-white/10 flex flex-col p-5 transition-transform duration-150 ${navOpen ? "translate-x-0" : "-translate-x-full"}`}>
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
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition">
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
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition">
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
          <span className="text-[11px] text-slate-400 tracking-widest" style={{fontFamily:"var(--font-orbitron)"}}>Cognition Collective</span>
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
        className="w-8 h-8 rounded-full flex items-center justify-center border border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.08] hover:text-white transition"
        title="Admin menu">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }} transition={{ duration: 0.12 }}
            className="absolute left-0 top-full mt-2 z-50 min-w-[160px] rounded-2xl border border-white/10 bg-[#0d1424]/95 backdrop-blur-xl shadow-xl overflow-hidden">
            <div className="p-1.5 space-y-0.5">
              <Link href="/admin" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Overview
              </Link>
              <Link href="/admin/pool" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Pool Manager
              </Link>
              <Link href="/admin/announcements" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-white bg-white/[0.06] transition">
                <svg className="w-4 h-4 text-[#5865f2]" viewBox="0 0 127.14 96.36" fill="currentColor">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
                </svg>
                Announcements
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Discord embed preview ───────────────────────────────── */
function renderDiscordMarkdown(text) {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    // Bold italic
    .replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    // Underline
    .replace(/__(.*?)__/g, "<u>$1</u>")
    // Strikethrough
    .replace(/~~(.*?)~~/g, "<s>$1</s>")
    // Spoiler
    .replace(/\|\|(.*?)\|\|/g, '<span style="background:#202225;color:#202225;border-radius:3px;padding:0 2px">$1</span>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:#202225;border-radius:3px;padding:1px 4px;font-family:monospace;font-size:0.85em">$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" style="color:#00a8fc" target="_blank">$1</a>')
    // Newlines
    .replace(/\n/g, "<br/>");
  return html;
}

function EmbedPreview({ embed, username, avatarUrl }) {
  if (!embed) return null;
  const colour = embed.color ? intToHex(embed.color) : "#a78bfa";
  return (
    <div className="rounded-lg overflow-hidden bg-[#2b2d31] text-sm font-sans w-full">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        {avatarUrl ? (
          <img src={avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="" onError={e => { e.target.style.display = "none"; }} />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-xs font-bold">
            {(username || "C")[0]}
          </div>
        )}
        <span className="text-white font-semibold text-sm">{username || "Cognition {CGN}"}</span>
        <span className="text-[#949ba4] text-xs">Today at {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
      <div className="mx-4 mb-4 flex rounded overflow-hidden max-w-lg">
        <div className="w-1 shrink-0" style={{ backgroundColor: colour }} />
        <div className="bg-[#2b2d31] border border-white/[0.06] rounded-r px-3 py-3 flex-1 min-w-0">
          {embed.author?.name && (
            <div className="flex items-center gap-1.5 mb-1">
              {embed.author.icon_url && <img src={embed.author.icon_url} className="w-4 h-4 rounded-full" alt="" onError={e => { e.target.style.display = "none"; }} />}
              <span className="text-[#b5bac1] text-xs font-medium">{embed.author.name}</span>
            </div>
          )}
          {embed.title && (
            <div className="text-white font-semibold text-sm mb-1">
              {embed.url ? <a href={embed.url} className="text-[#00a8fc] hover:underline">{embed.title}</a> : embed.title}
            </div>
          )}
          {embed.description && (
            <div className="text-[#dbdee1] text-sm mb-2 leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderDiscordMarkdown(embed.description) }}/>
          )}
          {embed.fields?.length > 0 && (
            <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: embed.fields.some(f => f.inline) ? "repeat(3, 1fr)" : "1fr" }}>
              {embed.fields.map((f, i) => (
                <div key={i} className={f.inline ? "" : "col-span-full"}>
                  <div className="text-white text-xs font-semibold mb-0.5">{f.name}</div>
                  <div className="text-[#dbdee1] text-xs" dangerouslySetInnerHTML={{ __html: renderDiscordMarkdown(f.value || "") }}/>
                </div>
              ))}
            </div>
          )}
          {embed.image?.url && <img src={embed.image.url} className="rounded mt-2 max-w-full" alt="" onError={e => { e.target.style.display = "none"; }} />}
          {embed.thumbnail?.url && <img src={embed.thumbnail.url} className="w-16 h-16 rounded float-right ml-2" alt="" onError={e => { e.target.style.display = "none"; }} />}
          {(embed.footer?.text || embed.timestamp) && (
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/10">
              {embed.footer?.icon_url && <img src={embed.footer.icon_url} className="w-4 h-4 rounded-full" alt="" onError={e => { e.target.style.display = "none"; }} />}
              <span className="text-[#949ba4] text-[11px]">
                {embed.footer?.text}
                {embed.footer?.text && embed.timestamp && " · "}
                {embed.timestamp && new Date(embed.timestamp).toLocaleDateString()}
              </span>
            </div>
          )}
          {embed._button?.label && embed._button?.url && (
            <div className="mt-3">
              <a href={embed._button.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#4e505880] border border-white/10 text-white text-xs font-medium hover:bg-[#6d6f7880] transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {embed._button.label}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── default state ───────────────────────────────────────── */
const DEFAULT_SENDER_NAME = "Cognition {CGN}";
const DEFAULT_AVATAR = "https://cdn.discordapp.com/attachments/1480200113082208346/1484473662198251692/IMG_0364.png?ex=6a3d9415&is=6a3c4295&hm=ca84aa004c423227a9f22fa2aa2786f8205f5d023eae742fc28d292343818164&";

const DEFAULT_EMBED = {
  color: hexToInt("#6b28d9"),
  author: { name: "", icon_url: "" },
  title: "",
  url: "",
  description: "",
  fields: [],
  thumbnail: { url: "" },
  image: { url: "" },
  footer: { text: "", icon_url: "" },
  timestamp: null,
  _button: { label: "", url: "" },
};

/* ─── Markdown toolbar ────────────────────────────────────── */
function MarkdownToolbar({ textareaRef, value, onChange }) {
  function wrap(before, after = before) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const newVal = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(newVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  }

  function insertMention(text) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const newVal = value.slice(0, start) + text + value.slice(start);
    onChange(newVal);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + text.length, start + text.length); }, 0);
  }

  const [roleId, setRoleId] = useState("");

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
      {[
        { label: "B", title: "Bold", before: "**", after: "**" },
        { label: "I", title: "Italic", before: "*", after: "*" },
        { label: "</>", title: "Code", before: "`", after: "`" },
        { label: "||", title: "Spoiler", before: "||", after: "||" },
      ].map(btn => (
        <button key={btn.label} type="button" title={btn.title}
          onClick={() => wrap(btn.before, btn.after)}
          className="px-2 py-0.5 rounded text-xs border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] transition font-mono">
          {btn.label}
        </button>
      ))}
      <div className="w-px h-4 bg-white/10 mx-0.5" />
      <button type="button" onClick={() => insertMention("@everyone")}
        className="px-2 py-0.5 rounded text-xs border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] transition">
        @everyone
      </button>
      <button type="button" onClick={() => insertMention("@here")}
        className="px-2 py-0.5 rounded text-xs border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] transition">
        @here
      </button>
      <div className="flex items-center gap-1">
        <input value={roleId} onChange={e => setRoleId(e.target.value.replace(/\D/g, ""))}
          placeholder="Role ID"
          className="w-24 rounded px-2 py-0.5 text-xs border border-white/10 bg-white/[0.04] text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
        <button type="button" onClick={() => { if (roleId) { insertMention(`<@&${roleId}>`); setRoleId(""); } }}
          disabled={!roleId}
          className="px-2 py-0.5 rounded text-xs border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] transition disabled:opacity-40">
          @role
        </button>
      </div>
    </div>
  );
}

/* ─── Timestamp tool ──────────────────────────────────────── */
function TimestampTool() {
  const [date, setDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [format, setFormat] = useState("f");
  const [copied, setCopied] = useState(false);

  const formats = [
    { key: "t", label: "Short time", example: "9:00 PM" },
    { key: "T", label: "Long time", example: "9:00:00 PM" },
    { key: "d", label: "Short date", example: "06/23/2026" },
    { key: "D", label: "Long date", example: "June 23, 2026" },
    { key: "f", label: "Date & time", example: "June 23, 2026 9:00 PM" },
    { key: "F", label: "Full date & time", example: "Tuesday, June 23, 2026 9:00 PM" },
    { key: "R", label: "Relative", example: "in 3 hours" },
  ];

  const unix = Math.floor(new Date(date).getTime() / 1000);
  const output = isNaN(unix) ? "" : `<t:${unix}:${format}>`;

  function copy() {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Card>
      <p className="text-xs text-slate-400 uppercase tracking-widest mb-4">Discord Timestamp Generator</p>
      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
        Discord timestamps display in every user's local timezone automatically.
        Paste the generated code anywhere in your embed description or fields.
      </p>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Date & Time</label>
          <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)}
            className="w-full max-w-xs rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20 transition [color-scheme:dark]" />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-2 block">Display Format</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {formats.map(f => (
              <button key={f.key} type="button" onClick={() => setFormat(f.key)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs transition text-left ${format === f.key ? "bg-purple-600/20 border-purple-500/40 text-purple-200" : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"}`}>
                <span>{f.label}</span>
                <span className="text-slate-500 font-mono text-[10px]">{f.example}</span>
              </button>
            ))}
          </div>
        </div>
        {output && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-3">
              <code className="text-sm text-purple-300 font-mono">{output}</code>
              <button type="button" onClick={copy}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${copied ? "bg-green-500/20 border-green-500/30 text-green-300" : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white"}`}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Paste this code into your embed description or field values. Discord will render it as a live timestamp for every viewer.
        </p>
      </div>
    </Card>
  );
}

/* ─── main page ───────────────────────────────────────────── */
export default function AnnouncementsPage() {
  const { data: session, status: discordStatus } = useSession();
  const [pin, setPin] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [pinError, setPinError] = useState(false);

  const SESSION_KEY = "cwl_admin_pin_confirmed";

  useEffect(() => {
    if (discordStatus !== "authenticated") return;
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) { setPin(saved); setAuthed(true); }
  }, [discordStatus]);

  const [webhooks, setWebhooks] = useState([]);
  const [discordChannels, setDiscordChannels] = useState([]);
  const [discordCategories, setDiscordCategories] = useState({});
  const [discordRoles, setDiscordRoles] = useState([]);
  const [roleSearch, setRoleSearch] = useState("");
  const [roleSearchOpen, setRoleSearchOpen] = useState(false);
  const [recapRoleSearch, setRecapRoleSearch] = useState("");
  const [recapRoleSearchOpen, setRecapRoleSearchOpen] = useState(false);
  const roleSearchRef = useRef(null);
  const recapRoleSearchRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newChannel, setNewChannel] = useState("");
  const [addingWebhook, setAddingWebhook] = useState(false);
  const [webhookResult, setWebhookResult] = useState(null);
  const [showAddWebhook, setShowAddWebhook] = useState(false);

  const [selectedWebhookId, setSelectedWebhookId] = useState(null);
  const [embed, setEmbed] = useState({ ...DEFAULT_EMBED });
  const [username, setUsername] = useState(DEFAULT_SENDER_NAME);
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduleAt, setScheduleAt] = useState(() => {
    const d = new Date(); d.setMinutes(d.getMinutes() + 60 - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [scheduling, setScheduling] = useState(false);
  const [scheduleResult, setScheduleResult] = useState(null);

  // Recurring state
  const [recurrence, setRecurrence] = useState(null); // null = one-time
  const [recurStart, setRecurStart] = useState(() => {
    const d = new Date(); d.setMinutes(d.getMinutes() + 60 - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [recurEnd, setRecurEnd] = useState("");

  const [discordMeta, setDiscordMeta] = useState({ roles: [], channels: [], emojis: [] });
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [newRole, setNewRole] = useState({ id: "", name: "", colour: "#a78bfa" });
  const [newDiscordChannel, setNewDiscordChannel] = useState({ id: "", name: "" });
  const [newEmoji, setNewEmoji] = useState({ id: "", name: "" });
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateOverwriteId, setTemplateOverwriteId] = useState(null);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateManageMode, setTemplateManageMode] = useState(false);
  const [templateDeleteConfirm, setTemplateDeleteConfirm] = useState({}); // { [id]: confirmText }
  const [expandedTemplate, setExpandedTemplate] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editResult, setEditResult] = useState(null);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [saveTemplateResult, setSaveTemplateResult] = useState(null);

  const [mainTab, setMainTab] = useState("compose");
  const [manageTab, setManageTab] = useState(""); // accordion within manage

  // ── Recap Share state ────────────────────────────────────────────────────
  const [showSchedule, setShowSchedule] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const [templateEditMode, setTemplateEditMode] = useState(false);
  const templateMenuRef = useRef(null);
  const descriptionRef = useRef(null);

  // Close template dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (templateMenuRef.current && !templateMenuRef.current.contains(e.target)) {
        setTemplateMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!authed) return;
    setLoadingData(true);
    Promise.all([
      fetch("/api/admin/announcements", { headers: { "x-officer-pin": pin } }).then(r => r.json()),
      fetch("/api/admin/announcements/templates", { headers: { "x-officer-pin": pin } }).then(r => r.json()).catch(() => ({ templates: [] })),
      fetch("/api/admin/announcements/schedule", { headers: { "x-officer-pin": pin } }).then(r => r.json()).catch(() => ({ scheduled: [] })),
      fetch("/api/admin/discord-meta").then(r => r.json()).catch(() => ({ roles: [], channels: [], emojis: [] })),
      fetch("/api/admin/announcements/history", { headers: { "x-officer-pin": pin } }).then(r => r.json()).catch(() => ({ history: [] })),
      fetch("/api/leaderboard").then(r => r.json()).catch(() => ({ seasons: [] })),
    ]).then(([wData, tData, sData, metaData, histData, lbData]) => {
      setDiscordMeta({ roles: metaData.roles || [], channels: metaData.channels || [], emojis: metaData.emojis || [] });
      const wh = wData.webhooks || [];
      setWebhooks(wh);
      if (wh.length > 0 && !selectedWebhookId) setSelectedWebhookId(wh[0].id);
      setTemplates(tData.templates || []);
      setScheduled(sData.scheduled || []);
      setHistory(histData.history || []);
    }).finally(() => setLoadingData(false));
  }, [authed]);

  async function reloadHistory() {
    try {
      const res = await fetch("/api/admin/announcements/schedule", { headers: { "x-officer-pin": pin } });
      const data = await res.json();
      setScheduled(data.scheduled || []);
    } catch { /* non-fatal */ }
  }

  function handlePinSubmit(e) {
    e.preventDefault();
    setPin(pinInput); setAuthed(true); setPinError(false);
    if (discordStatus === "authenticated") sessionStorage.setItem(SESSION_KEY, pinInput);
  }

  function setEmbedField(key, value) { setEmbed(prev => ({ ...prev, [key]: value })); }
  function setNestedField(parent, key, value) { setEmbed(prev => ({ ...prev, [parent]: { ...prev[parent], [key]: value } })); }
  function addField() { setEmbed(prev => ({ ...prev, fields: [...prev.fields, { name: "", value: "", inline: false }] })); }
  function updateField(i, key, value) { setEmbed(prev => { const fields = [...prev.fields]; fields[i] = { ...fields[i], [key]: value }; return { ...prev, fields }; }); }
  function removeField(i) { setEmbed(prev => ({ ...prev, fields: prev.fields.filter((_, idx) => idx !== i) })); }

  function applyTemplate(type) {
    if (type === "season-open") {
      setEmbed({ ...DEFAULT_EMBED, title: "CWL Season is Open!", description: "The new CWL season is now open for sign-ups. Register your accounts on the Hub and get ready for CWL.", color: hexToInt("#a78bfa"), fields: [{ name: "Sign Up Deadline", value: "Before rosters are finalised", inline: false }], _button: { label: "Sign Up Now →", url: "https://cgnco.vercel.app/signup" } });
    } else if (type === "rosters-final") {
      setEmbed({ ...DEFAULT_EMBED, title: "Rosters Finalised", description: "CWL rosters have been finalised. Check the Hub to see your clan assignment.", color: hexToInt("#34d399"), _button: { label: "View Rosters →", url: "https://cgnco.vercel.app" } });
    } else if (type === "season-closing") {
      setEmbed({ ...DEFAULT_EMBED, title: "Season Closing Soon", description: "The current CWL season is closing soon. Make sure you have signed up before rosters are locked.", color: hexToInt("#fb923c"), _button: { label: "Sign Up Now →", url: "https://cgnco.vercel.app/signup" } });
    }
  }

  function applySavedTemplate(t) {
    const e = typeof t.embed_json === "string" ? JSON.parse(t.embed_json) : t.embed_json;
    setEmbed(e);
    if (t.username) setUsername(t.username);
    if (t.avatar_url) setAvatarUrl(t.avatar_url);
    if (t.webhook_id) setSelectedWebhookId(t.webhook_id);
    // Record usage — update use_count and last_used_at, then refresh local state
    fetch("/api/admin/announcements/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-officer-pin": pin },
      body: JSON.stringify({ action: "use", id: t.id }),
    }).then(() => {
      setTemplates(prev => prev.map(tmpl =>
        tmpl.id === t.id
          ? { ...tmpl, use_count: (tmpl.use_count || 0) + 1, last_used_at: new Date().toISOString() }
          : tmpl
      ));
    }).catch(() => { /* non-fatal */ });
  }

  function buildPayload() {
    const { _button, ...cleanEmbed } = embed;
    if (!cleanEmbed.author?.name) delete cleanEmbed.author;
    if (!cleanEmbed.thumbnail?.url) delete cleanEmbed.thumbnail;
    if (!cleanEmbed.image?.url) delete cleanEmbed.image;
    if (!cleanEmbed.footer?.text) delete cleanEmbed.footer;
    if (!cleanEmbed.timestamp) delete cleanEmbed.timestamp;
    if (!cleanEmbed.url) delete cleanEmbed.url;
    cleanEmbed.fields = cleanEmbed.fields.filter(f => f.name && f.value);
    return { embed: { ...cleanEmbed, ...(_button?.label && _button?.url ? { _button } : {}) }, _button };
  }

  async function fetchRecapData(season) {
    setRecapLoading(true); setRecapData(null); setRecapPostResult(null);
    try {
      const seasonParam = season ? `?season=${encodeURIComponent(season)}` : "";
      const [lb, hist] = await Promise.all([
        fetch(`/api/leaderboard${seasonParam}`).then(r => r.json()),
        fetch(`/api/history${seasonParam}`).then(r => r.json()),
      ]);
      const currentSeason = season || lb.currentSeason || lb.seasons?.[0];
      const withOverall = (lb.stats || []).map(p => ({
        ...p,
        overall: (p.attacks_used > 0 && p.attacks_available > 0)
          ? parseFloat(((parseFloat(p.efficiency||0)*0.6)+((3-parseFloat(p.defence_efficiency||0))*0.4)).toFixed(2))
          : null,
      }));
      const seasonHistory = (hist.history || []).filter(r => r.season === currentSeason);
      const clanWithOverall = seasonHistory.map(c => ({
        ...c,
        overall: parseFloat(((parseFloat(c.attack_efficiency||0)*0.5)+((3-parseFloat(c.defence_efficiency||0))*0.3)+((c.wars_won||0)/7*3*0.2)).toFixed(2))
      })).sort((a,b) => b.overall - a.overall);

      const stats = withOverall;
      const withAttacks = stats.filter(p => p.attacks_used > 0);
      const validPlayers = stats.filter(p => p.overall != null).sort((a,b) => b.overall - a.overall);

      setRecapData({
        currentSeason,
        seasons: lb.seasons || [],
        stats,
        // All derived props matching RecapView exactly
        top3: validPlayers.slice(0, 3),
        topClan: clanWithOverall[0] || null,
        bestAttacker: [...stats].filter(p => p.attacks_used > 0).sort((a,b) => parseFloat(b.efficiency||0) - parseFloat(a.efficiency||0))[0] || null,
        bestDefender: [...stats].filter(p => p.attacks_available > 0).sort((a,b) => parseFloat(a.defence_efficiency||0) - parseFloat(b.defence_efficiency||0))[0] || null,
        totalWins: seasonHistory.reduce((s,r) => s + (r.wars_won||0), 0),
        totalLosses: seasonHistory.reduce((s,r) => s + (r.wars_lost||0), 0),
        totalDraws: seasonHistory.reduce((s,r) => s + (r.wars_drawn||0), 0),
        clanWithOverall,
        totalAllianceStars: seasonHistory.reduce((s,r) => s + (r.total_stars||0), 0),
        awardMostThreeStars: [...withAttacks].sort((a,b) => (b.three_stars||0) - (a.three_stars||0))[0] || null,
        awardClutchKing: [...withAttacks].filter(p => p.clutch_rate != null).sort((a,b) => parseFloat(b.clutch_rate||0) - parseFloat(a.clutch_rate||0))[0] || null,
        awardPunchUpKing: [...withAttacks].filter(p => p.punch_up_rate != null).sort((a,b) => parseFloat(b.punch_up_rate||0) - parseFloat(a.punch_up_rate||0))[0] || null,
        awardIronDefence: [...stats].filter(p => p.attacks_available > 0).sort((a,b) => parseFloat(a.defence_efficiency||999) - parseFloat(b.defence_efficiency||999))[0] || null,
        awardMostConsistent: [...withAttacks].filter(p => p.consistency_score != null).sort((a,b) => parseFloat(b.consistency_score||0) - parseFloat(a.consistency_score||0))[0] || null,
        seasonMvp: validPlayers[0] || null,
      });
      if (!recapSeason && currentSeason) setRecapSeason(currentSeason);
      if (lb.seasons?.length) setRecapSeasons(lb.seasons);
    } catch (e) {
      console.error("fetchRecapData error:", e);
      setRecapData(null);
    } finally { setRecapLoading(false); }
  }

  async function handleScheduleRecap() {
    if (!recapWebhookId || !recapScheduleAt) return;
    setRecapScheduleResult(null);
    const utcTime = new Date(recapScheduleAt).toISOString();
    try {
      const res = await fetch("/api/admin/announcements/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify({
          webhookId: recapWebhookId,
          embed: { title: "Season Recap" },
          content: recapRolePing || undefined,
          sendAt: utcTime,
          recurrence: recapRecurring ? "monthly" : null,
          isRecapImage: true,
          rolePing: recapRolePing || null,
          title: "Season Recap (Auto)",
        }),
      });
      const data = await res.json();
      if (res.ok) setRecapScheduleResult({ ok: true, message: recapRecurring ? "Recurring monthly recap scheduled ✓" : "Recap scheduled ✓" });
      else setRecapScheduleResult({ ok: false, message: data.error || "Failed to schedule" });
    } catch { setRecapScheduleResult({ ok: false, message: "Network error" }); }
  }

  async function handleSend() {
    if (!selectedWebhookId) return;
    setSending(true); setSendResult(null);
    const { embed: finalEmbed } = buildPayload();
    try {
      const res = await fetch("/api/admin/announcements/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify({ webhookId: selectedWebhookId, embed: finalEmbed, content: content || undefined, username, avatarUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setSendResult({ ok: true, message: "Posted to Discord ✓" });
        setEmbed({ ...DEFAULT_EMBED }); setContent("");
        // Reload history
        fetch("/api/admin/announcements/history", { headers: { "x-officer-pin": pin } })
          .then(r => r.json()).then(d => setHistory(d.history || [])).catch(() => {});
      } else { setSendResult({ ok: false, message: data.error || "Failed to send" }); }
    } catch { setSendResult({ ok: false, message: "Network error" }); }
    finally { setSending(false); }
  }

  async function handleSchedule() {
    if (!selectedWebhookId || !scheduleAt) return;
    setScheduling(true); setScheduleResult(null);
    const { embed: finalEmbed } = buildPayload();
    try {
      const res = await fetch("/api/admin/announcements/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify({ webhookId: selectedWebhookId, embed: finalEmbed, content: content || undefined, username, avatarUrl, sendAt: new Date(scheduleAt).toISOString() }),
      });
      const data = await res.json();
      if (res.ok) {
        setScheduleResult({ ok: true, message: "Scheduled ✓" });
        setEmbed({ ...DEFAULT_EMBED }); setContent(""); setScheduleMode(false);
        await reloadHistory();
      } else { setScheduleResult({ ok: false, message: data.error || "Failed to schedule" }); }
    } catch { setScheduleResult({ ok: false, message: "Network error" }); }
    finally { setScheduling(false); }
  }

  async function handleRecurring() {
    if (!selectedWebhookId || !recurStart) return;
    setScheduling(true); setScheduleResult(null);
    const { embed: finalEmbed } = buildPayload();
    try {
      const res = await fetch("/api/admin/announcements/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify({
          webhookId: selectedWebhookId,
          embed: finalEmbed,
          content: content || undefined,
          username,
          avatarUrl,
          sendAt: new Date(recurStart).toISOString(),
          recurrence,
          recurrenceEnd: recurEnd ? new Date(recurEnd).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setScheduleResult({ ok: true, message: `Recurring post scheduled ✓ (${recurrence})` });
        setEmbed({ ...DEFAULT_EMBED }); setContent("");
        await reloadHistory();
      } else { setScheduleResult({ ok: false, message: data.error || "Failed to schedule" }); }
    } catch { setScheduleResult({ ok: false, message: "Network error" }); }
    finally { setScheduling(false); }
  }

  async function handleEditMessage(h) {
    if (!h.embed_json) return;
    const embedData = typeof h.embed_json === "string" ? JSON.parse(h.embed_json) : h.embed_json;
    setEmbed({ ...DEFAULT_EMBED, ...embedData });
    if (h.webhook_id) setSelectedWebhookId(String(h.webhook_id));
    setEditingMessageId(h.discord_message_id);
    setEditResult(null);
    setMainTab("compose");
  }

  async function handleSendEdit() {
    if (!selectedWebhookId || !editingMessageId) return;
    setSending(true); setEditResult(null);
    const { embed: finalEmbed } = buildPayload();
    try {
      const res = await fetch("/api/admin/announcements/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify({ webhookId: selectedWebhookId, messageId: editingMessageId, embed: finalEmbed }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditResult({ ok: true, message: "Discord message updated ✓" });
        setEditingMessageId(null);
        setEmbed({ ...DEFAULT_EMBED }); setContent("");
      } else { setEditResult({ ok: false, message: data.error || "Edit failed" }); }
    } catch { setEditResult({ ok: false, message: "Network error" }); }
    finally { setSending(false); }
  }

  async function handleSaveTemplate(e) {
    e.preventDefault();
    if (!templateName.trim()) return;
    setSavingTemplate(true); setSaveTemplateResult(null);
    const { embed: finalEmbed } = buildPayload();
    try {
      const method = templateOverwriteId ? "PATCH" : "POST";
      const fetchBody = templateOverwriteId
        ? { id: templateOverwriteId, name: templateName.trim(), webhookId: selectedWebhookId, embedJson: finalEmbed, username, avatarUrl }
        : { name: templateName.trim(), webhookId: selectedWebhookId, embedJson: finalEmbed, username, avatarUrl };
      const res = await fetch("/api/admin/announcements/templates", {
        method,
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify(fetchBody),
      });
      const data = await res.json();
      if (res.ok) {
        if (templateOverwriteId) {
          setTemplates(prev => prev.map(t => t.id === templateOverwriteId ? data.template : t));
          setTemplateOverwriteId(null);
        } else {
          setTemplates(prev => [data.template, ...prev]);
        }
        setSaveTemplateResult({ ok: true, message: templateOverwriteId ? "Template updated ✓" : "Template saved ✓" });
        setTemplateName(""); setShowSaveTemplate(false);
      } else { setSaveTemplateResult({ ok: false, message: data.error || "Failed to save" }); }
    } catch { setSaveTemplateResult({ ok: false, message: "Network error" }); }
    finally { setSavingTemplate(false); }
  }

  async function handleDeleteTemplate(id) {
    await fetch("/api/admin/announcements/templates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-officer-pin": pin },
      body: JSON.stringify({ id }),
    });
    setTemplates(prev => prev.filter(t => t.id !== id));
  }

  async function handleAddWebhook(e) {
    e.preventDefault();
    if (!newLabel || !newUrl) return;
    setAddingWebhook(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify({ label: newLabel, webhookUrl: newUrl, channel: newChannel }),
      });
      const data = await res.json();
      if (res.ok) {
        setWebhooks(prev => [...prev, data.webhook]);
        setSelectedWebhookId(data.webhook.id);
        setNewLabel(""); setNewUrl(""); setNewChannel("");
        setShowAddWebhook(false);
        setWebhookResult({ ok: true, message: "Webhook added" });
      } else { setWebhookResult({ ok: false, message: data.error }); }
    } catch { setWebhookResult({ ok: false, message: "Network error" }); }
    finally { setAddingWebhook(false); }
  }

  async function handleDeleteWebhook(id) {
    await fetch("/api/admin/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-officer-pin": pin },
      body: JSON.stringify({ id }),
    });
    setWebhooks(prev => prev.filter(w => w.id !== id));
    if (selectedWebhookId === id) setSelectedWebhookId(webhooks.find(w => w.id !== id)?.id || null);
  }

  async function handleCancelScheduled(id) {
    await fetch("/api/admin/announcements/schedule", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-officer-pin": pin },
      body: JSON.stringify({ id }),
    });
    setScheduled(prev => prev.filter(s => s.id !== id));
  }

  /* ── PIN gate ── */
  if (!authed) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-6 flex flex-col items-center justify-center">
        <Card className="w-full max-w-sm text-center">
          <img src={BRANDING.cwlhub} alt="" className="w-14 h-14 mx-auto mb-4" />
          <h1 className="text-2xl font-thin tracking-widest mb-1">Announcements</h1>
          <p className="text-slate-500 text-xs mb-5">Admin access required</p>
          <form onSubmit={handlePinSubmit} className="space-y-3">
            <input type="password" inputMode="numeric" pattern="[0-9]*" placeholder="Officer PIN" value={pinInput} onChange={e => setPinInput(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition text-center tracking-widest text-lg" />
            {pinError && <p className="text-red-400 text-xs">Incorrect PIN</p>}
            <button type="submit" disabled={!pinInput}
              className="w-full py-2.5 rounded-2xl bg-purple-600/30 text-purple-200 border border-purple-500/30 hover:bg-purple-600/50 transition font-semibold text-sm disabled:opacity-40">
              Enter
            </button>
          </form>
        </Card>
      </main>
    );
  }

  // Render Discord markdown to JSX for live preview
  function renderDiscordMarkdown(text) {
    if (!text) return null;
    const roleMap = Object.fromEntries(discordMeta.roles.map(r => [r.id, r]));
    const channelMap = Object.fromEntries(discordMeta.channels.map(c => [c.id, c]));
    const emojiMap = Object.fromEntries(discordMeta.emojis.map(e => [e.id, e]));

    // Process line by line first to handle blockquotes and code blocks
    const lines = text.split("\n");
    const processedLines = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      // Code block (```) — multi-line
      if (line.startsWith("```")) {
        const lang = line.slice(3).trim();
        const codeLines = [];
        i++;
        while (i < lines.length && !lines[i].startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        processedLines.push({ type: "codeblock", content: codeLines.join("\n"), lang });
        i++;
        continue;
      }
      // Blockquote
      if (line.startsWith("> ")) {
        processedLines.push({ type: "blockquote", content: line.slice(2) });
        i++;
        continue;
      }
      processedLines.push({ type: "text", content: line });
      i++;
    }

    function parseInline(text) {
      const parts = [];
      let remaining = text;
      let key = 0;
      while (remaining.length > 0) {
        const roleMatch      = remaining.match(/^([\s\S]*?)<@&(\d+)>/);
        const chanMatch      = remaining.match(/^([\s\S]*?)<#(\d+)>/);
        const emojiMatch     = remaining.match(/^([\s\S]*?)<a?:(\w+):(\d+)>/);
        const tsMatch        = remaining.match(/^([\s\S]*?)<t:(\d+)(?::([tTdDfFR]))?>/);
        const everyoneMatch  = remaining.match(/^([\s\S]*?)(@everyone|@here)/);
        const linkMatch      = remaining.match(/^([\s\S]*?)\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/);
        const boldMatch      = remaining.match(/^([\s\S]*?)\*\*(.+?)\*\*/);
        const italicMatch    = remaining.match(/^([\s\S]*?)(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
        const underlineMatch = remaining.match(/^([\s\S]*?)__(.+?)__/);
        const strikeMatch    = remaining.match(/^([\s\S]*?)~~(.+?)~~/);
        const spoilerMatch   = remaining.match(/^([\s\S]*?)\|\|(.+?)\|\|/);
        const codeMatch      = remaining.match(/^([\s\S]*?)`(.+?)`/);

        const candidates = [
          roleMatch      && { idx: roleMatch[1].length,      len: roleMatch[0].length,      type: "role",      id: roleMatch[2] },
          chanMatch      && { idx: chanMatch[1].length,      len: chanMatch[0].length,      type: "channel",   id: chanMatch[2] },
          emojiMatch     && { idx: emojiMatch[1].length,     len: emojiMatch[0].length,     type: "emoji",     name: emojiMatch[2], id: emojiMatch[3] },
          tsMatch        && { idx: tsMatch[1].length,        len: tsMatch[0].length,        type: "ts",        unix: tsMatch[2], fmt: tsMatch[3]||"f" },
          everyoneMatch  && { idx: everyoneMatch[1].length,  len: everyoneMatch[0].length,  type: "everyone",  val: everyoneMatch[2] },
          linkMatch      && { idx: linkMatch[1].length,      len: linkMatch[0].length,      type: "link",      label: linkMatch[2], url: linkMatch[3] },
          boldMatch      && { idx: boldMatch[1].length,      len: boldMatch[0].length,      type: "bold",      val: boldMatch[2] },
          underlineMatch && { idx: underlineMatch[1].length, len: underlineMatch[0].length, type: "underline", val: underlineMatch[2] },
          strikeMatch    && { idx: strikeMatch[1].length,    len: strikeMatch[0].length,    type: "strike",    val: strikeMatch[2] },
          spoilerMatch   && { idx: spoilerMatch[1].length,   len: spoilerMatch[0].length,   type: "spoiler",   val: spoilerMatch[2] },
          italicMatch    && { idx: italicMatch[1].length,    len: italicMatch[0].length,    type: "italic",    val: italicMatch[2] },
          codeMatch      && { idx: codeMatch[1].length,      len: codeMatch[0].length,      type: "code",      val: codeMatch[2] },
        ].filter(Boolean).sort((a, b) => a.idx - b.idx);

        if (candidates.length === 0) { parts.push(<span key={key++}>{remaining}</span>); break; }
        const hit = candidates[0];
        if (hit.idx > 0) parts.push(<span key={key++}>{remaining.slice(0, hit.idx)}</span>);

        if (hit.type === "role") {
          const role = roleMap[hit.id];
          parts.push(<span key={key++} style={{background:(role?.colour||"#a78bfa")+"33",color:role?.colour||"#a78bfa"}} className="rounded px-1 text-xs font-semibold">@{role?.name||hit.id}</span>);
        } else if (hit.type === "channel") {
          const ch = channelMap[hit.id];
          parts.push(<span key={key++} className="rounded px-1 text-xs font-semibold bg-[#5865f2]/20 text-[#8ab4f8]">#{ch?.name||hit.id}</span>);
        } else if (hit.type === "emoji") {
          parts.push(<img key={key++} src={`https://cdn.discordapp.com/emojis/${hit.id}.png`} alt={hit.name} className="inline w-4 h-4 mx-0.5"/>);
        } else if (hit.type === "ts") {
          const d = new Date(parseInt(hit.unix) * 1000);
          const fmt = hit.fmt || "f";
          let display;
          if (fmt === "t") display = d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
          else if (fmt === "T") display = d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"});
          else if (fmt === "d") display = d.toLocaleDateString([], {day:"2-digit",month:"2-digit",year:"numeric"});
          else if (fmt === "D") display = d.toLocaleDateString([], {day:"numeric",month:"long",year:"numeric"});
          else if (fmt === "F") display = d.toLocaleDateString([], {weekday:"long",day:"numeric",month:"long",year:"numeric"})+" "+d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
          else if (fmt === "R") {
            const diff = Math.round((d - Date.now()) / 1000);
            const abs = Math.abs(diff); const past = diff < 0;
            if (abs < 60) display = past ? "just now" : "in a few seconds";
            else if (abs < 3600) display = past ? `${Math.floor(abs/60)} minutes ago` : `in ${Math.floor(abs/60)} minutes`;
            else if (abs < 86400) display = past ? `${Math.floor(abs/3600)} hours ago` : `in ${Math.floor(abs/3600)} hours`;
            else display = past ? `${Math.floor(abs/86400)} days ago` : `in ${Math.floor(abs/86400)} days`;
          } else display = d.toLocaleDateString([], {day:"numeric",month:"long",year:"numeric"})+" "+d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
          parts.push(<span key={key++} className="rounded px-1 text-xs bg-white/10 text-[#dbdee1]">{display}</span>);
        } else if (hit.type === "everyone") {
          parts.push(<span key={key++} className="rounded px-1 text-xs font-semibold bg-[#5865f2]/20 text-[#c9cdfb]">{hit.val}</span>);
        } else if (hit.type === "link") {
          parts.push(<a key={key++} href={hit.url} target="_blank" rel="noopener noreferrer" className="text-[#00a8fc] hover:underline">{hit.label}</a>);
        } else if (hit.type === "bold") {
          parts.push(<strong key={key++} className="text-white font-bold">{hit.val}</strong>);
        } else if (hit.type === "underline") {
          parts.push(<span key={key++} style={{textDecoration:"underline"}}>{hit.val}</span>);
        } else if (hit.type === "strike") {
          parts.push(<span key={key++} style={{textDecoration:"line-through"}} className="text-slate-400">{hit.val}</span>);
        } else if (hit.type === "spoiler") {
          parts.push(<span key={key++} className="bg-[#202225] text-[#202225] hover:text-[#dbdee1] rounded px-0.5 cursor-pointer transition-colors select-none">{hit.val}</span>);
        } else if (hit.type === "italic") {
          parts.push(<em key={key++}>{hit.val}</em>);
        } else if (hit.type === "code") {
          parts.push(<code key={key++} className="bg-black/30 rounded px-1 text-xs font-mono text-[#dbdee1]">{hit.val}</code>);
        }
        remaining = remaining.slice(hit.idx + hit.len);
      }
      return parts;
    }

    return (
      <>
        {processedLines.map((line, li) => {
          if (line.type === "codeblock") {
            return (
              <pre key={li} className="bg-black/40 rounded p-2 text-xs font-mono text-[#dbdee1] whitespace-pre-wrap my-1 overflow-x-auto">
                {line.content}
              </pre>
            );
          }
          if (line.type === "blockquote") {
            return (
              <div key={li} className="border-l-4 border-[#4e5058] pl-2 my-0.5 text-[#dbdee1]">
                {parseInline(line.content)}
              </div>
            );
          }
          return (
            <span key={li}>
              {parseInline(line.content)}
              {li < processedLines.length - 1 && <br/>}
            </span>
          );
        })}
      </>
    );
  }

  const pendingScheduled = scheduled.filter(s => !s.sent);
  const previewEmbed = {
    color: embed.color || 0x5865f2,
    title: embed.title || "",
    description: embed.description || "",
    author: embed.author?.name ? embed.author : null,
    thumbnail: embed.thumbnail?.url ? embed.thumbnail : null,
    image: embed.image?.url ? embed.image : null,
    footer: embed.footer?.text ? embed.footer : null,
    fields: embed.fields?.filter(f => f.name && f.value) || [],
  };
  const hexColor = "#" + (embed.color || 0x5865f2).toString(16).padStart(6, "0");

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      </div>

    </main>
  );
}
