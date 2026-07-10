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
  const items = [
    { href: "/admin", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { href: "/admin/pool", label: "Pool Manager", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { href: "/admin/announcements", label: "Announcements", icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
  ];
  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex transition-opacity duration-150 ${navOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setNavOpen(false)}>
          <div className="absolute inset-0 bg-black/60"/>
          <div onClick={e => e.stopPropagation()}
            className={`relative z-10 w-72 max-w-[80vw] h-full bg-[#0d1424] border-r border-white/10 flex flex-col p-5 transition-transform duration-150 ${navOpen ? "translate-x-0" : "-translate-x-full"}`}>
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
  color: hexToInt("#a78bfa"),
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
function RecapShareCard({ topClan, top3, bestAttacker, bestDefender, totalWins, totalLosses, totalDraws, clanWithOverall, selectedSeason, totalAllianceStars, awardMostThreeStars, awardClutchKing, awardPunchUpKing, awardIronDefence, awardMostConsistent, seasonMvp }) {
  const MEDAL_PATH = "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z";
  const medalColours = { 1: "#D4AF37", 2: "#A7A7AD", 3: "#CD7F32" };

  const tiles = [
    {
      label: "Best Attacker",
      player: bestAttacker,
      value: bestAttacker ? parseFloat(bestAttacker.efficiency).toFixed(2) : null,
      unit: "Atk EFF",
      colour: "#c4b5fd", bg: "rgba(139,92,246,0.07)", border: "rgba(139,92,246,0.22)",
      icon: "M13 10V3L4 14h7v7l9-11h-7z",
    },
    {
      label: "3★ Machine",
      player: awardMostThreeStars,
      value: awardMostThreeStars ? String(awardMostThreeStars.three_stars) : null,
      unit: "3-stars",
      colour: "#fbbf24", bg: "rgba(251,191,36,0.07)", border: "rgba(251,191,36,0.22)",
      icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    },
    {
      label: "Best Defender",
      player: bestDefender,
      value: bestDefender ? parseFloat(bestDefender.defence_efficiency).toFixed(2) : null,
      unit: "Def EFF",
      colour: "#93c5fd", bg: "rgba(59,130,246,0.07)", border: "rgba(59,130,246,0.22)",
      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    },
    {
      label: "Brave Heart",
      player: awardPunchUpKing,
      value: awardPunchUpKing ? `${parseFloat(awardPunchUpKing.punch_up_rate).toFixed(0)}%` : null,
      unit: "Punch-Up",
      colour: "#86efac", bg: "rgba(34,197,94,0.07)", border: "rgba(34,197,94,0.22)",
      icon: "M5 10l7-7m0 0l7 7m-7-7v18",
    },
    {
      label: "Clutch King",
      player: awardClutchKing,
      value: awardClutchKing ? parseFloat(awardClutchKing.clutch_rate).toFixed(2) : null,
      unit: "Clutch Rate",
      colour: "#f472b6", bg: "rgba(244,114,182,0.07)", border: "rgba(244,114,182,0.22)",
      icon: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z",
    },
    {
      label: "Iron Wall",
      player: awardIronDefence,
      value: awardIronDefence ? parseFloat(awardIronDefence.defence_efficiency||0).toFixed(2) : null,
      unit: "Def EFF",
      colour: "#34d399", bg: "rgba(52,211,153,0.07)", border: "rgba(52,211,153,0.22)",
      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    },
    {
      label: "Season MVP",
      player: seasonMvp,
      value: seasonMvp ? parseFloat(seasonMvp.overall).toFixed(2) : null,
      unit: "CGN Rating",
      colour: "#D4AF37", bg: "rgba(212,175,55,0.07)", border: "rgba(212,175,55,0.22)",
      icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
    },
    {
      label: "Most Consistent",
      player: awardMostConsistent,
      value: awardMostConsistent ? parseFloat(awardMostConsistent.consistency_score||0).toFixed(2) : null,
      unit: "Consistency",
      colour: "#a78bfa", bg: "rgba(167,139,250,0.07)", border: "rgba(167,139,250,0.22)",
      icon: "M4 6h16M4 10h16M4 14h16M4 18h16",
    },
  ];

  return (
    <div style={{
      width: 1200,
      height: 630,
      background: "#070b17",
      borderRadius: 28,
      border: "1px solid rgba(212,175,55,0.35)",
      padding: "26px 32px 22px",
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
      color: "white",
      boxSizing: "border-box",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Background texture */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="glass-depth-recap" cx="50%" cy="35%" r="65%" fx="50%" fy="25%">
            <stop offset="0%" stopColor="#1c1408" stopOpacity="1"/>
            <stop offset="45%" stopColor="#0d0c0a" stopOpacity="1"/>
            <stop offset="100%" stopColor="#04060e" stopOpacity="1"/>
          </radialGradient>
          <radialGradient id="tint-recap" cx="50%" cy="20%" r="55%">
            <stop offset="0%" stopColor="#d4a017" stopOpacity="0.10"/>
            <stop offset="100%" stopColor="#d4a017" stopOpacity="0"/>
          </radialGradient>
          <pattern id="grain-recap" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <line x1="0" y1="4" x2="4" y2="0" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#glass-depth-recap)"/>
        <rect width="100%" height="100%" fill="url(#tint-recap)"/>
        <rect width="100%" height="100%" fill="url(#grain-recap)"/>
      </svg>

      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 3 }}>Season Recap</div>
            <div style={{ fontSize: 26, fontWeight: 300, letterSpacing: "0.06em", color: "white" }}>{selectedSeason}</div>
            {totalAllianceStars > 0 && (
              <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 22, fontWeight: 300, color: "#fbbf24" }}>{totalAllianceStars}</span>
                <span style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em" }}>Alliance Stars</span>
              </div>
            )}
          </div>
          {topClan && (
            <div style={{
              background: "rgba(212,175,55,0.06)",
              border: "1px solid rgba(212,175,55,0.25)",
              borderRadius: 14,
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={medalColours[1]} strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={MEDAL_PATH}/>
              </svg>
              <div>
                <div style={{ fontSize: 16, fontWeight: 300, letterSpacing: "0.1em", color: medalColours[1] }}>{topClan.clan_name.split(" ")[0]}</div>
                <div style={{ fontSize: 9, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>{topClan.cwl_rank}</div>
              </div>
              <div style={{ display: "flex", gap: 16, marginLeft: 6 }}>
                {[
                  { label: "Wins", value: topClan.wars_won, colour: "#86efac" },
                  { label: "Atk EFF", value: parseFloat(topClan.attack_efficiency).toFixed(2), colour: "#c4b5fd" },
                  { label: "CGN Rating", value: topClan.overall.toFixed(2), colour: "#c4b5fd" },
                ].map(({ label, value, colour }) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: colour }}>{value}</div>
                    <div style={{ fontSize: 8, color: "#475569", textTransform: "uppercase", letterSpacing: "0.09em", marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 16 }}/>

        {/* ── TWO-COLUMN BODY ── */}
        <div style={{ display: "flex", gap: 18, flex: 1 }}>

          {/* LEFT — Top Players + War Record */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 340, flexShrink: 0 }}>

            {/* Top 3 Players */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.07)",
              padding: "12px 14px",
              flex: 1,
            }}>
              <div style={{ fontSize: 8, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Top Players</div>
              {top3.map((p, i) => (
                <div key={p.player_tag} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: i < 2 ? 8 : 0, paddingBottom: i < 2 ? 8 : 0,
                  borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={medalColours[i+1]} strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={MEDAL_PATH}/>
                    </svg>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: medalColours[i+1] }}>{p.player_name}</div>
                      <div style={{ fontSize: 9, color: "#64748b" }}>{p.clan_name.split(" ")[0]}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#c4b5fd" }}>{p.overall.toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* War Record */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.07)",
              padding: "12px 14px",
            }}>
              <div style={{ fontSize: 8, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>Alliance War Record</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                {[
                  { label: "Won",   value: totalWins,   colour: "#86efac", bg: "rgba(34,197,94,0.06)",   border: "rgba(34,197,94,0.2)" },
                  { label: "Lost",  value: totalLosses, colour: "#f87171", bg: "rgba(239,68,68,0.06)",   border: "rgba(239,68,68,0.2)" },
                  { label: "Drawn", value: totalDraws,  colour: "#64748b", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.07)" },
                ].map(({ label, value, colour, bg, border }) => (
                  <div key={label} style={{ background: bg, borderRadius: 8, border: `1px solid ${border}`, padding: "6px 10px", flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: colour }}>{value}</div>
                    <div style={{ fontSize: 8, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.09em", marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
              {clanWithOverall.slice(0, 3).map((c, i) => (
                <div key={c.clan_tag || c.clan_name} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  paddingBottom: i < 2 ? 5 : 0, marginBottom: i < 2 ? 5 : 0,
                  borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke={medalColours[i+1] || "#475569"} strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={MEDAL_PATH}/>
                    </svg>
                    <span style={{ fontSize: 11, color: "white" }}>{c.clan_name.split(" ")[0]}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, fontSize: 10 }}>
                    <span style={{ color: "#86efac" }}>{c.wars_won}W</span>
                    <span style={{ color: "#f87171" }}>{c.wars_lost}L</span>
                    <span style={{ color: "#c4b5fd" }}>{parseFloat(c.attack_efficiency).toFixed(2)} EFF</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — 8 highlight tiles in 2×4 grid */}
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr 1fr 1fr", gap: 10 }}>
            {tiles.map((tile, i) => tile.player && tile.value ? (
              <div key={i} style={{
                background: tile.bg,
                borderRadius: 12,
                border: `1px solid ${tile.border}`,
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke={tile.colour} strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={tile.icon}/>
                  </svg>
                  <div style={{ fontSize: 8, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.09em" }}>{tile.label}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "white", marginBottom: 2 }}>{tile.player.player_name}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: tile.colour, lineHeight: 1 }}>{tile.value}</div>
                  {tile.unit && <div style={{ fontSize: 7, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{tile.unit}</div>}
                </div>
              </div>
            ) : (
              <div key={i} style={{
                background: "rgba(255,255,255,0.02)",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.05)",
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <div style={{ fontSize: 9, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.1em" }}>No data</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 8, color: "#1e293b", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            cgnco.vercel.app · Cognition {"{CGN}"}
          </span>
        </div>
      </div>
    </div>
  );
}


function ClanInfoBoardTool() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [status, setStatus] = useState(null);
  const [posting, setPosting] = useState(false);
  const [liveMessages, setLiveMessages] = useState([]);

  useEffect(() => { loadMessages(); }, []);

  async function loadMessages() {
    try {
      const res = await fetch("/api/clan-info-board");
      const d = await res.json();
      setLiveMessages(d.messages || []);
    } catch {}
  }

  async function handlePost() {
    if (!webhookUrl.trim()) { setStatus({ error: "Enter a webhook URL" }); return; }
    setPosting(true); setStatus(null);
    try {
      const res = await fetch("/api/clan-info-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhook_url: webhookUrl.trim(), pin: "070226" }),
      });
      const d = await res.json();
      if (d.success) {
        setStatus({ ok: `Posted ${d.clansPosted} clans · ${d.timestamp}` });
        setWebhookUrl("");
        loadMessages();
      } else {
        setStatus({ error: d.error || "Failed to post" });
      }
    } catch { setStatus({ error: "Network error" }); }
    finally { setPosting(false); }
  }

  async function handleUpdate(url) {
    setPosting(true); setStatus(null);
    try {
      const res = await fetch("/api/clan-info-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhook_url: url, pin: "070226" }),
      });
      const d = await res.json();
      if (d.success) {
        setStatus({ ok: `Updated · ${d.timestamp}` });
        loadMessages();
      } else {
        setStatus({ error: d.error || "Failed to update" });
      }
    } catch { setStatus({ error: "Network error" }); }
    finally { setPosting(false); }
  }

  return (
    <div className="px-5 pb-5 border-t border-white/10 pt-4 space-y-4">
      <p className="text-xs text-slate-400 leading-relaxed">Paste a Discord webhook URL to post a live clan info board. It auto-updates every 6 hours. New clans added to the app appear automatically on the next update.</p>

      <div className="space-y-2">
        <input type="text" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)}
          placeholder="https://discord.com/api/webhooks/…"
          className="w-full rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20"/>
        <button onClick={handlePost} disabled={posting || !webhookUrl.trim()}
          className="w-full rounded-full border border-green-500/40 bg-transparent text-green-400 px-3 py-1.5 text-xs font-semibold hover:border-green-400 transition disabled:opacity-40">
          {posting ? "Posting…" : "Post Now"}
        </button>
        {status?.ok && <p className="text-green-400 text-xs">{status.ok}</p>}
        {status?.error && <p className="text-red-400 text-xs">{status.error}</p>}
      </div>

      {liveMessages.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] text-slate-600 uppercase tracking-widest">Active Boards</p>
          {liveMessages.map((msg, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] text-slate-500 truncate flex-1">
                  {msg.webhook_url.replace("https://discord.com/api/webhooks/", "webhook/…/").slice(0, 40)}
                </p>
                <button onClick={() => handleUpdate(msg.webhook_url)} disabled={posting}
                  className="shrink-0 rounded-full border border-blue-500/40 text-blue-400 px-2.5 py-0.5 text-[9px] uppercase tracking-widest hover:border-blue-400 transition disabled:opacity-40">
                  {posting ? "…" : "Update"}
                </button>
              </div>
              {msg.last_updated && (
                <p className="text-[9px] text-slate-700">
                  Last updated {new Date(msg.last_updated).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const [recapSeasons, setRecapSeasons] = useState([]);
  const [recapSeason, setRecapSeason] = useState("");
  const [recapData, setRecapData] = useState(null);
  const [recapLoading, setRecapLoading] = useState(false);
  const [recapWebhookId, setRecapWebhookId] = useState("");
  const [recapPosting, setRecapPosting] = useState(false);
  const [recapPostResult, setRecapPostResult] = useState(null);
  const [showRecapCard, setShowRecapCard] = useState(false);
  const recapCardRef = useRef(null);
  const [recapRolePing, setRecapRolePing] = useState("");
  const [recapScheduleAt, setRecapScheduleAt] = useState("");
  const [recapRecurring, setRecapRecurring] = useState(false);
  const [recapScheduleResult, setRecapScheduleResult] = useState(null);
  const [composeMode, setComposeMode] = useState("quick");
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
    ]).then(([wData, tData, sData, metaData, histData]) => {
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

  async function handlePostRecap() {
    if (!recapWebhookId || !recapData) return;
    setRecapPosting(true); setRecapPostResult(null);
    setShowRecapCard(true);
    await new Promise(r => setTimeout(r, 150)); // allow card to render
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(recapCardRef.current, {
        backgroundColor: "#070b17", scale: 2, useCORS: true,
        allowTaint: true, logging: false, removeContainer: true,
      });
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      const form = new FormData();
      form.append("webhookId", recapWebhookId);
      form.append("season", recapSeason || recapData.currentSeason || "Season Recap");
      form.append("image", blob, "cgn-recap.png");
      if (recapRolePing) form.append("rolePing", recapRolePing);
      const res = await fetch("/api/admin/recap-share", {
        method: "POST",
        headers: { "x-officer-pin": pin },
        body: form,
      });
      const result = await res.json();
      if (res.ok) setRecapPostResult({ ok: true, message: "Posted to Discord ✓" });
      else setRecapPostResult({ ok: false, message: result.error || "Failed to post" });
    } catch (e) {
      setRecapPostResult({ ok: false, message: "Error: " + e.message });
    } finally {
      setRecapPosting(false);
      setShowRecapCard(false);
    }
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
        const boldMatch      = remaining.match(/^([\s\S]*?)\*\*(.+?)\*\*/);
        const italicMatch    = remaining.match(/^([\s\S]*?)\*(.+?)\*/);
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

      {/* Hidden recap share card — rendered off-screen during Discord post */}
      {showRecapCard && recapData && (
        <div ref={recapCardRef} style={{ position: "fixed", top: 0, left: "-9999px", zIndex: -1, pointerEvents: "none" }}>
          <RecapShareCard
            topClan={recapData.topClan}
            top3={recapData.top3 || []}
            bestAttacker={recapData.bestAttacker}
            bestDefender={recapData.bestDefender}
            totalWins={recapData.totalWins || 0}
            totalLosses={recapData.totalLosses || 0}
            totalDraws={recapData.totalDraws || 0}
            clanWithOverall={recapData.clanWithOverall || []}
            selectedSeason={recapSeason || recapData.currentSeason}
            totalAllianceStars={recapData.totalAllianceStars || 0}
            awardMostThreeStars={recapData.awardMostThreeStars}
            awardClutchKing={recapData.awardClutchKing}
            awardPunchUpKing={recapData.awardPunchUpKing}
            awardIronDefence={recapData.awardIronDefence}
            awardMostConsistent={recapData.awardMostConsistent}
            seasonMvp={recapData.seasonMvp}
          />
        </div>
      )}

      <AdminHeader/>

      {/* Hero card */}
      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 mb-4 text-center">
        <h1 className="text-2xl font-thin tracking-widest mb-1">Announcements</h1>
        <p className="text-slate-500 text-xs">Post rich embeds to your Discord server</p>
      </div>

      {/* ── MAIN NAV TABS ── */}
      <div className="relative z-10 flex items-center justify-center gap-1 mb-4">
        {[["compose","Compose"],["templates","Templates"],["manage","Manage"],["tools","Tools"]].map(([key,label]) => (
          <button key={key} onClick={() => setMainTab(key)}
            className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] uppercase tracking-widest font-semibold border transition ${
              mainTab === key
                ? "border-purple-500/60 bg-purple-500/15 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                : "border-white/10 bg-transparent text-slate-500 hover:text-slate-300 hover:border-white/20"
            }`}>
            {label}
          </button>
        ))}
      </div>

      <div className="relative z-10 space-y-4">

        {/* ── COMPOSE TAB ── */}
        {mainTab === "compose" && (<>

        {/* ── COMPOSE TILE ── */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Compose</h2>
            <div className="flex items-center gap-3">
              <button onClick={() => setComposeMode("quick")} className="text-slate-500 hover:text-slate-300 transition p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <span className="text-[10px] text-slate-600 uppercase tracking-widest select-none min-w-[60px] text-center">
                {composeMode === "quick" ? "Quick" : "Full"}
              </span>
              <button onClick={() => setComposeMode("full")} className="text-slate-500 hover:text-slate-300 transition p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>

          {/* Webhook selector */}
          <div className="mb-4">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Post to</label>
            {webhooks.length === 0 ? (
              <p className="text-xs text-slate-600">No webhooks configured — add one below</p>
            ) : (
              <select value={selectedWebhookId || ""} onChange={e => setSelectedWebhookId(e.target.value)}
                className="w-full rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white focus:outline-none [color-scheme:dark]">
                {webhooks.map(w => <option key={w.id} value={w.id}>{w.label}{w.channel ? ` · #${w.channel}` : ""}</option>)}
              </select>
            )}
          </div>

          {/* Quick fields */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Title</label>
              <input type="text" value={embed.title || ""} onChange={e => setEmbedField("title", e.target.value)} placeholder="Announcement title"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Description</label>
              <MarkdownToolbar textareaRef={descriptionRef} value={embed.description || ""} onChange={v => setEmbedField("description", v)}/>
              <textarea ref={descriptionRef} value={embed.description || ""} onChange={e => setEmbedField("description", e.target.value)}
                placeholder="Main message content. Supports **bold**, *italic*, `code`" rows={4}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition resize-none mt-1"/>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Colour</label>
              <div className="flex items-center gap-3 flex-wrap">
                <input type="color" value={hexColor} onChange={e => setEmbedField("color", hexToInt(e.target.value))}
                  className="w-10 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer"/>
                <input type="text" value={hexColor} onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setEmbedField("color", hexToInt(e.target.value.padEnd(7, "0"))); }}
                  className="w-24 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white font-mono focus:outline-none focus:border-white/20 transition"/>
                <div className="flex gap-1.5">
                  {["#a78bfa","#34d399","#fb923c","#60a5fa","#f472b6","#5865f2"].map(c => (
                    <button key={c} type="button" onClick={() => setEmbedField("color", hexToInt(c))}
                      className="w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition" style={{background:c}}/>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Role Ping <span className="text-slate-700 normal-case">(outside embed, optional)</span></label>
              <div className="relative">
                <input
                  ref={roleSearchRef}
                  type="text"
                  placeholder={discordMeta.roles.length > 0 ? "Search roles… or type @everyone" : "@everyone or leave blank"}
                  value={roleSearch}
                  onChange={e => { setRoleSearch(e.target.value); if (!e.target.value) setContent(""); setRoleSearchOpen(true); }}
                  onFocus={() => { setRoleSearch(""); setRoleSearchOpen(true); }}
                  onBlur={() => setTimeout(() => setRoleSearchOpen(false), 150)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
              </div>
              {content && <p className="text-[10px] text-slate-600 font-mono mt-1">{content}</p>}
              {roleSearchOpen && roleSearch && discordMeta.roles.length > 0 && typeof document !== "undefined" && (() => {
                const q = roleSearch.toLowerCase().replace(/^@/, "");
                const matches = [
                  ...(("everyone".includes(q) || "all".includes(q)) ? [{ id: "everyone", name: "@everyone", colour: "#ffffff" }] : []),
                  ...(("here".includes(q)) ? [{ id: "here", name: "@here", colour: "#ffffff" }] : []),
                  ...discordMeta.roles.filter(r => r.name.toLowerCase().includes(q)),
                ].slice(0, 12);
                if (!matches.length || !roleSearchRef.current) return null;
                const rect = roleSearchRef.current.getBoundingClientRect();
                const top = rect.bottom + window.scrollY + 4;
                const left = rect.left + window.scrollX;
                return createPortal(
                  <div style={{ position: "absolute", top, left, width: rect.width, zIndex: 9999 }}
                    className="rounded-2xl border border-white/10 bg-[#0d1424] shadow-2xl overflow-hidden">
                    {matches.map(r => (
                      <button key={r.id} type="button"
                        onMouseDown={() => { const val = r.id === "everyone" ? "@everyone" : r.id === "here" ? "@here" : `<@&${r.id}>`; setContent(val); setRoleSearch(r.name); setRoleSearchOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/[0.06] transition">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.colour || "#a78bfa" }}/>
                        <span className="text-xs text-white">{r.name}</span>
                      </button>
                    ))}
                  </div>,
                  document.body
                );
              })()}
            </div>
          </div>

          {/* Full mode fields */}
          {composeMode === "full" && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Author</label>
                <div className="space-y-2">
                  <input type="text" value={embed.author?.name || ""} onChange={e => setNestedField("author", "name", e.target.value)} placeholder="Author name"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                  <input type="text" value={embed.author?.icon_url || ""} onChange={e => setNestedField("author", "icon_url", e.target.value)} placeholder="Author icon URL (optional)"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Thumbnail URL</label>
                <input type="text" value={embed.thumbnail?.url || ""} onChange={e => setNestedField("thumbnail", "url", e.target.value)} placeholder="https://…"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Image URL</label>
                <input type="text" value={embed.image?.url || ""} onChange={e => setNestedField("image", "url", e.target.value)} placeholder="https://…"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest">Fields</label>
                  <button type="button" onClick={addField}
                    className="text-[10px] text-purple-400 border border-purple-500/40 px-2 py-0.5 rounded-full hover:border-purple-400 transition">+ Add</button>
                </div>
                <div className="space-y-2">
                  {embed.fields.map((f, i) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="text" value={f.name} onChange={e => updateField(i, "name", e.target.value)} placeholder="Field name"
                          className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                        <button type="button" onClick={() => removeField(i)} className="text-slate-600 hover:text-red-400 transition text-xs">✕</button>
                      </div>
                      <textarea value={f.value} onChange={e => updateField(i, "value", e.target.value)} placeholder="Field value" rows={2}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition resize-none"/>
                      <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                        <input type="checkbox" checked={f.inline} onChange={e => updateField(i, "inline", e.target.checked)} className="accent-purple-500"/>
                        Inline
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Footer</label>
                <input type="text" value={embed.footer?.text || ""} onChange={e => setNestedField("footer", "text", e.target.value)} placeholder="Footer text"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Link Button <span className="text-slate-700 normal-case">(optional)</span></label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input type="text" value={embed._button?.emoji || ""} onChange={e => setNestedField("_button", "emoji", e.target.value)} placeholder="🔔"
                      className="w-14 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition text-center"/>
                    <input type="text" value={embed._button?.label || ""} onChange={e => setNestedField("_button", "label", e.target.value)} placeholder="Button label"
                      className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                  </div>
                  <input type="text" value={embed._button?.url || ""} onChange={e => setNestedField("_button", "url", e.target.value)} placeholder="https://…"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                  <p className="text-[10px] text-slate-700">Link buttons post as Discord components alongside the embed</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Bot Name</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20 transition"/>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Avatar URL</label>
                  <input type="text" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://…"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                </div>
              </div>
            </div>
          )}

          {/* Send section */}
          <div className="mt-5 pt-4 border-t border-white/10 space-y-3">
            {editingMessageId && (
              <div className="mb-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-amber-300">Editing existing post</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Changes will update the original Discord message in place</p>
                </div>
                <button type="button" onClick={() => { setEditingMessageId(null); setEmbed({...DEFAULT_EMBED}); setContent(""); setEditResult(null); }}
                  className="text-[10px] text-slate-500 hover:text-slate-300 border border-white/10 hover:border-white/20 rounded-full px-2.5 py-1 transition shrink-0">Cancel</button>
              </div>
            )}
            {editResult && <p className={"text-xs text-center mb-2 " + (editResult.ok ? "text-green-400" : "text-red-400")}>{editResult.message}</p>}
            {editingMessageId ? (
              <button type="button" onClick={handleSendEdit} disabled={sending || !selectedWebhookId}
                className="w-full py-2.5 rounded-2xl text-sm font-semibold bg-transparent text-amber-400 border border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.12)] hover:border-amber-400 hover:text-amber-300 transition disabled:opacity-40">
                {sending ? "Updating…" : "Update Message"}
              </button>
            ) : (
              <button type="button" onClick={handleSend} disabled={sending || !selectedWebhookId}
                className="w-full py-2.5 rounded-2xl text-sm font-semibold bg-transparent text-green-400 border border-green-500/60 shadow-[0_0_8px_rgba(74,222,128,0.12)] hover:border-green-400 hover:text-green-300 transition disabled:opacity-40">
                {sending ? "Sending…" : "Post to Discord"}
              </button>
            )}
            {sendResult && !editingMessageId && <p className={`text-xs text-center ${sendResult.ok ? "text-green-400" : "text-red-400"}`}>{sendResult.message}</p>}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <button type="button" onClick={() => setShowSchedule(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-slate-400 font-semibold">Schedule</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-600 transition-transform ${showSchedule ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </button>
              {showSchedule && (
                <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Send at</label>
                    <input type="datetime-local" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none [color-scheme:dark]"/>
                  </div>
                  <button type="button" onClick={handleSchedule} disabled={scheduling || !selectedWebhookId}
                    className="w-full py-2 rounded-xl text-xs font-semibold bg-transparent text-purple-400 border border-purple-500/60 hover:border-purple-400 hover:text-purple-300 transition disabled:opacity-40">
                    {scheduling ? "Scheduling…" : "Schedule Post"}
                  </button>
                  {scheduleResult && !showRecurring && <p className={`text-xs text-center ${scheduleResult.ok ? "text-green-400" : "text-red-400"}`}>{scheduleResult.message}</p>}
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <button type="button" onClick={() => setShowRecurring(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-slate-400 font-semibold">Recurring</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-600 transition-transform ${showRecurring ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </button>
              {showRecurring && (
                <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">First send at</label>
                    <input type="datetime-local" value={recurStart} onChange={e => setRecurStart(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none [color-scheme:dark]"/>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1.5 block">Repeat every</label>
                    <div className="flex flex-wrap gap-1.5">
                      {[["24hr","Daily"],["48hr","48 hrs"],["7days","Weekly"],["14days","2 weeks"],["30days","Monthly"]].map(([val,label]) => (
                        <button key={val} type="button" onClick={() => setRecurrence(recurrence === val ? null : val)}
                          className={`px-2.5 py-1 rounded-full text-xs border transition font-semibold ${recurrence === val ? "text-purple-400 border-purple-500/60 shadow-[0_0_6px_rgba(168,85,247,0.12)]" : "text-slate-500 border-white/10 hover:text-slate-300 hover:border-white/20"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">End date <span className="text-slate-700">(optional)</span></label>
                    <input type="datetime-local" value={recurEnd} onChange={e => setRecurEnd(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none [color-scheme:dark]"/>
                  </div>
                  <button type="button" onClick={handleRecurring} disabled={scheduling || !selectedWebhookId || !recurStart || !recurrence}
                    className="w-full py-2 rounded-xl text-xs font-semibold bg-transparent text-purple-400 border border-purple-500/60 hover:border-purple-400 hover:text-purple-300 transition disabled:opacity-40">
                    {scheduling ? "Scheduling…" : `Set Recurring (${recurrence || "choose interval"})`}
                  </button>
                  {scheduleResult && <p className={`text-xs text-center ${scheduleResult.ok ? "text-green-400" : "text-red-400"}`}>{scheduleResult.message}</p>}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Live Preview */}
        <Card>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Live Preview</h2>
          <div className="rounded-xl bg-[#313338] p-3">
            {/* Bot name + avatar row */}
            <div className="flex items-center gap-2 mb-2">
              {avatarUrl ? <img src={avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="" onError={e=>{e.target.style.display="none"}}/> : <div className="w-8 h-8 rounded-full bg-purple-600/40 flex items-center justify-center text-xs text-white font-bold">{username?.charAt(0)||"C"}</div>}
              <span className="text-white text-sm font-semibold">{username||"CGN CWL Hub"}</span>
              <span className="text-[10px] bg-[#5865f2] text-white px-1 py-0.5 rounded">APP</span>
            </div>
            {/* Ping/content outside embed */}
            {content && <p className="text-[#dbdee1] text-sm mb-2 whitespace-pre-wrap">{renderDiscordMarkdown(content)}</p>}
            {/* Embed card */}
            <div className="rounded overflow-hidden border-l-4 bg-[#2b2d31]" style={{borderLeftColor: hexColor}}>
              <div className="p-3">
                {/* Inner layout: left column + thumbnail float-right */}
                <div className="flex gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Author row */}
                    {previewEmbed.author?.name && (
                      <div className="flex items-center gap-1.5 mb-1">
                        {previewEmbed.author.icon_url && <img src={previewEmbed.author.icon_url} className="w-6 h-6 rounded-full object-cover shrink-0" alt="" onError={e=>{e.target.style.display="none"}}/>}
                        <span className="text-[#dbdee1] text-xs font-semibold">{previewEmbed.author.name}</span>
                      </div>
                    )}
                    {/* Title */}
                    {previewEmbed.title && (
                      <p className="text-white font-bold text-sm mb-1 leading-snug">
                        {previewEmbed.url ? <a href={previewEmbed.url} className="text-[#00a8fc] hover:underline">{previewEmbed.title}</a> : previewEmbed.title}
                      </p>
                    )}
                    {/* Description */}
                    {previewEmbed.description && (
                      <div className="text-[#dbdee1] text-xs leading-relaxed whitespace-pre-wrap">{renderDiscordMarkdown(previewEmbed.description)}</div>
                    )}
                  </div>
                  {/* Thumbnail — top right, 80x80 */}
                  {previewEmbed.thumbnail?.url && (
                    <div className="shrink-0 ml-2">
                      <img src={previewEmbed.thumbnail.url} className="w-20 h-20 rounded object-cover" alt="" onError={e=>{e.target.style.display="none"}}/>
                    </div>
                  )}
                </div>
                {/* Fields grid */}
                {previewEmbed.fields.length > 0 && (
                  <div className="grid grid-cols-3 gap-x-3 gap-y-2 mt-2">
                    {previewEmbed.fields.map((f,i) => (
                      <div key={i} className={f.inline ? "" : "col-span-3"}>
                        <p className="text-white text-xs font-semibold mb-0.5">{f.name}</p>
                        <p className="text-[#dbdee1] text-xs whitespace-pre-wrap">{renderDiscordMarkdown(f.value)}</p>
                      </div>
                    ))}
                  </div>
                )}
                {/* Large image — full width below fields */}
                {previewEmbed.image?.url && (
                  <img src={previewEmbed.image.url} className="w-full rounded mt-3 max-h-64 object-contain" alt="" onError={e=>{e.target.style.display="none"}}/>
                )}
                {/* Footer */}
                {(previewEmbed.footer?.text || previewEmbed.timestamp) && (
                  <div className="flex items-center gap-1.5 mt-2 pt-1">
                    {previewEmbed.footer?.icon_url && <img src={previewEmbed.footer.icon_url} className="w-5 h-5 rounded-full object-cover shrink-0" alt="" onError={e=>{e.target.style.display="none"}}/>}
                    <span className="text-[#87898c] text-[10px]">
                      {previewEmbed.footer?.text}
                      {previewEmbed.footer?.text && previewEmbed.timestamp && " · "}
                      {previewEmbed.timestamp && new Date(previewEmbed.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* Link button */}
            {embed._button?.label && embed._button?.url && (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#4e5058] text-[#dbdee1] text-xs font-semibold">
                  {embed._button.emoji && <span>{embed._button.emoji}</span>}
                  {embed._button.label}
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </span>
              </div>
            )}
          </div>
        </Card>

        </>)} {/* end compose tab */}

        {/* ── TEMPLATES TAB ── */}
        {mainTab === "templates" && (<>

        {/* Favourites — top 3 most used */}
        {templates.filter(t => t.use_count > 0).sort((a,b) => (b.use_count||0)-(a.use_count||0)).slice(0,3).length > 0 && (
          <Card>
            <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-3">Favourites</p>
            <div className="flex flex-wrap gap-2">
              {templates.filter(t => t.use_count > 0).sort((a,b) => (b.use_count||0)-(a.use_count||0)).slice(0,3).map(t => (
                <button key={t.id} type="button" onClick={() => { applySavedTemplate(t); setMainTab("compose"); }}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-transparent text-purple-400 border border-purple-500/30 hover:text-purple-300 hover:border-purple-400 transition flex items-center gap-1.5">
                  {t.name}
                  <span className="text-[9px] text-purple-600">{t.use_count}×</span>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Saved templates */}
        <Card>
          {/* Header row: search + manage */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <input type="text" placeholder="Search templates…" value={templateSearch} onChange={e => setTemplateSearch(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-3 pr-7 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
              {templateSearch && (
                <button onClick={() => setTemplateSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 text-xs">✕</button>
              )}
            </div>
            <button onClick={() => { setTemplateManageMode(v => !v); setTemplateDeleteConfirm({}); }}
              className={"px-3 py-1.5 rounded-full text-[10px] font-semibold border transition " + (templateManageMode ? "bg-red-500/10 border-red-500/40 text-red-400" : "border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20")}>
              {templateManageMode ? "Done" : "Manage"}
            </button>
          </div>

          {templates.length === 0 ? (
            <p className="text-slate-700 text-xs text-center py-4">No saved templates yet</p>
          ) : (
            <div className="space-y-1.5">
              {templates
                .filter(t => !templateSearch || t.name.toLowerCase().includes(templateSearch.toLowerCase()))
                .map(t => (
                <div key={t.id} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <button type="button" onClick={() => setExpandedTemplate(expandedTemplate === t.id ? null : t.id)}
                      className="flex-1 text-left text-xs text-slate-300 hover:text-white flex items-center gap-2 min-w-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className={"w-3 h-3 text-slate-600 shrink-0 transition-transform " + (expandedTemplate === t.id ? "rotate-180" : "")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                      <span className="truncate">{t.name}</span>
                    </button>
                    {t.use_count > 0 && <span className="text-[9px] text-slate-700 shrink-0">{t.use_count}×</span>}
                    {!templateManageMode && <>
                      <button type="button" onClick={() => { applySavedTemplate(t); setMainTab("compose"); }}
                        className="text-[10px] text-purple-400 hover:text-purple-300 border border-purple-500/30 hover:border-purple-400 rounded-full px-2 py-0.5 transition shrink-0">Use</button>
                      <button type="button" onClick={() => { setTemplateOverwriteId(t.id); setTemplateName(t.name); setShowSaveTemplate(true); }}
                        className="text-[10px] text-slate-500 hover:text-slate-300 border border-white/10 hover:border-white/20 rounded-full px-2 py-0.5 transition shrink-0">Edit</button>
                    </>}
                  </div>
                  {/* Template embed preview */}
                  {expandedTemplate === t.id && t.embed_json && (
                    <div className="border-t border-white/[0.06] px-3 py-3 bg-black/20">
                      <EmbedPreview embed={typeof t.embed_json === "string" ? JSON.parse(t.embed_json) : t.embed_json} username={t.username} avatarUrl={t.avatar_url}/>
                    </div>
                  )}
                  {/* Manage mode: confirm delete */}
                  {templateManageMode && (
                    <div className="border-t border-red-500/10 bg-red-500/[0.03] px-3 py-2.5 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder='Type "CONFIRM" to delete'
                        value={templateDeleteConfirm[t.id] || ""}
                        onChange={e => setTemplateDeleteConfirm(p => ({...p, [t.id]: e.target.value}))}
                        className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/40 transition"/>
                      <button type="button"
                        disabled={templateDeleteConfirm[t.id] !== "CONFIRM"}
                        onClick={() => { handleDeleteTemplate(t.id); setTemplateDeleteConfirm(p => { const n={...p}; delete n[t.id]; return n; }); }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-red-400 border border-red-500/30 hover:border-red-500/60 hover:bg-red-500/10 transition disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-white/[0.06] mt-3">
            {showSaveTemplate ? (
              <div className="space-y-2">
                {templateOverwriteId && <p className="text-[10px] text-amber-400">Overwriting existing template</p>}
                <input type="text" placeholder="Template name" value={templateName} onChange={e => setTemplateName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                <div className="flex gap-2">
                  <button type="button" onClick={handleSaveTemplate} disabled={savingTemplate||!templateName.trim()}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-transparent text-purple-400 border border-purple-500/60 hover:border-purple-400 transition disabled:opacity-40">{savingTemplate ? (templateOverwriteId ? "Updating…" : "Saving…") : (templateOverwriteId ? "Update Template" : "Save")}</button>
                  <button type="button" onClick={() => { setShowSaveTemplate(false); setTemplateName(""); setTemplateOverwriteId(null); }} className="px-4 py-2 rounded-xl text-xs text-slate-500 border border-white/10 hover:text-slate-300 transition">Cancel</button>
                </div>
                {saveTemplateResult && <p className={`text-xs text-center ${saveTemplateResult.ok?"text-green-400":"text-red-400"}`}>{saveTemplateResult.message}</p>}
              </div>
            ) : (
              <button type="button" onClick={() => { setShowSaveTemplate(true); setTemplateOverwriteId(null); }}
                className="w-full py-2 rounded-xl text-xs font-semibold bg-transparent text-slate-400 border border-white/10 hover:text-white hover:border-white/30 transition">+ Save current as template</button>
            )}
          </div>
        </Card>

        </>)} {/* end templates tab */}

        {/* ── MANAGE TAB ── */}
        {mainTab === "manage" && (<>

        {/* History */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
          <button onClick={() => setManageTab(manageTab==="history"?"":"history")} className="w-full flex items-center justify-between px-5 py-4">
            <div className="text-left"><p className="text-sm font-semibold text-slate-300">History</p><p className="text-[10px] text-slate-600 mt-0.5">Recent announcements</p></div>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-600 transition-transform ${manageTab==="history"?"rotate-180":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
          {manageTab === "history" && (
            <div className="px-5 pb-5 border-t border-white/10 pt-4 space-y-2">
              {history.length === 0 ? <p className="text-slate-700 text-xs text-center py-4">No history yet</p> : history.slice(0,10).map((h,i) => (
                <div key={i} className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white truncate">{h.title||"Untitled"}</p>
                    <p className="text-[10px] text-slate-600">{h.sent_by||"Unknown"}{h.sent_at ? ` · ${new Date(h.sent_at).toLocaleDateString()}` : ""}</p>
                  </div>
                  {h.discord_message_id && h.embed_json && (
                    <button type="button" onClick={() => handleEditMessage(h)}
                      className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-purple-300 border border-white/10 hover:border-purple-500/40 rounded-full px-2.5 py-1 transition shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      Edit
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scheduled */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
          <button onClick={() => setManageTab(manageTab==="scheduled"?"":"scheduled")} className="w-full flex items-center justify-between px-5 py-4">
            <div className="text-left"><p className="text-sm font-semibold text-slate-300">Scheduled</p><p className="text-[10px] text-slate-600 mt-0.5">{pendingScheduled.length} pending</p></div>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-600 transition-transform ${manageTab==="scheduled"?"rotate-180":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
          {manageTab === "scheduled" && (
            <div className="px-5 pb-5 border-t border-white/10 pt-4 space-y-2">
              {scheduled.length === 0 ? <p className="text-slate-700 text-xs text-center py-4">No scheduled posts</p> : scheduled.map(s => {
                const t = new Date(s.send_at);
                return (
                  <div key={s.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{s.title||"Untitled"}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{t.toLocaleDateString()} {t.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}{s.recurrence && <span className="ml-1.5 text-purple-400">↻ {s.recurrence}</span>}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.sent ? <span className="text-[9px] text-green-500">Sent</span> : <button type="button" onClick={() => handleCancelScheduled(s.id)} className="text-slate-600 hover:text-red-400 text-xs">✕</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recap Share */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
          <button onClick={() => {
            if (manageTab !== "recap") {
              setManageTab("recap");
              if (!recapData && !recapLoading) fetchRecapData("");
            } else { setManageTab(""); }
          }} className="w-full flex items-center justify-between px-5 py-4">
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-300">Season Recap Share Card</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Post the recap image to Discord</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-600 transition-transform ${manageTab==="recap"?"rotate-180":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
          {manageTab === "recap" && (
            <div className="px-5 pb-5 border-t border-white/10 pt-4 space-y-3">

              {/* Season */}
              <div>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1.5">Season</p>
                <div className="flex gap-2">
                  <select value={recapSeason} onChange={e => { setRecapSeason(e.target.value); fetchRecapData(e.target.value); }}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20 transition [color-scheme:dark]">
                    {recapSeasons.length === 0 && <option value="">Loading…</option>}
                    {recapSeasons.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => fetchRecapData(recapSeason)} className="px-3 py-2 rounded-2xl text-xs border border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  </button>
                </div>
              </div>

              {/* Webhook */}
              <div>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1.5">Post to</p>
                <select value={recapWebhookId} onChange={e => setRecapWebhookId(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20 transition [color-scheme:dark]">
                  <option value="">Select webhook…</option>
                  {webhooks.map(w => <option key={w.id} value={w.id}>{w.label}{w.channel ? ` · #${w.channel}` : ""}</option>)}
                </select>
              </div>

              {/* Role ping */}
              <div>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1.5">Role Ping <span className="normal-case text-slate-700">(optional)</span></p>
                <input
                  ref={recapRoleSearchRef}
                  type="text"
                  placeholder={discordMeta.roles.length > 0 ? "Search roles…" : "e.g. <@&1234567890>"}
                  value={recapRoleSearch}
                  onChange={e => { setRecapRoleSearch(e.target.value); if (!e.target.value) setRecapRolePing(""); setRecapRoleSearchOpen(true); }}
                  onFocus={() => { setRecapRoleSearch(""); setRecapRoleSearchOpen(true); }}
                  onBlur={() => setTimeout(() => setRecapRoleSearchOpen(false), 150)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                {recapRolePing && <p className="text-[10px] text-slate-600 font-mono mt-1">{recapRolePing}</p>}
                {recapRoleSearchOpen && recapRoleSearch && discordMeta.roles.length > 0 && typeof document !== "undefined" && (() => {
                  const q = recapRoleSearch.toLowerCase().replace(/^@/, "");
                  const matches = [
                    ...(("everyone".includes(q) || "all".includes(q)) ? [{ id: "everyone", name: "@everyone", colour: "#ffffff" }] : []),
                    ...(("here".includes(q)) ? [{ id: "here", name: "@here", colour: "#ffffff" }] : []),
                    ...discordMeta.roles.filter(r => r.name.toLowerCase().includes(q)),
                  ].slice(0, 12);
                  if (!matches.length || !recapRoleSearchRef.current) return null;
                  const rect = recapRoleSearchRef.current.getBoundingClientRect();
                  const top = rect.bottom + window.scrollY + 4;
                  const left = rect.left + window.scrollX;
                  return createPortal(
                    <div style={{ position: "absolute", top, left, width: rect.width, zIndex: 9999 }}
                      className="rounded-2xl border border-white/10 bg-[#0d1424] shadow-2xl overflow-hidden">
                      {matches.map(r => (
                        <button key={r.id} type="button"
                          onMouseDown={() => { const val = r.id === "everyone" ? "@everyone" : r.id === "here" ? "@here" : `<@&${r.id}>`; setRecapRolePing(val); setRecapRoleSearch(r.name); setRecapRoleSearchOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/[0.06] transition">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.colour || "#a78bfa" }}/>
                          <span className="text-xs text-white">{r.name}</span>
                        </button>
                      ))}
                    </div>,
                    document.body
                  );
                })()}
                <p className="text-[9px] text-slate-700 mt-1">Members with this role will be notified.</p>
              </div>

              {/* Season data status */}
              {recapLoading && <p className="text-[10px] text-slate-500 text-center py-2">Loading season data…</p>}
              {recapData && !recapLoading && (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <p className="text-[10px] text-slate-400">
                    <span className="text-white font-semibold">{recapData.currentSeason}</span>
                    {" · "}{(recapData.stats || []).filter(p => p.attacks_used > 0).length} players with data
                    {" · "}{recapData.clanWithOverall?.length || 0} clans
                  </p>
                </div>
              )}

              {/* Post now */}
              <button onClick={handlePostRecap} disabled={recapPosting || !recapWebhookId || !recapData || recapLoading}
                className="w-full py-2.5 rounded-2xl text-xs font-semibold bg-transparent text-purple-400 border border-purple-500/60 hover:border-purple-400 hover:text-purple-300 transition disabled:opacity-40">
                {recapPosting ? "Generating & posting…" : "Post Recap Now"}
              </button>

              {recapPostResult && <p className={"text-xs text-center " + (recapPostResult.ok ? "text-green-400" : "text-red-400")}>{recapPostResult.message}</p>}

              {/* Schedule */}
              <div className="border-t border-white/[0.06] pt-3 space-y-2">
                <p className="text-[9px] text-slate-600 uppercase tracking-widest">Schedule</p>
                <input type="datetime-local" value={recapScheduleAt} onChange={e => setRecapScheduleAt(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20 transition [color-scheme:dark]"/>
                <button onClick={() => setRecapRecurring(v => !v)}
                  className={"flex items-center gap-2 px-3 py-1.5 rounded-2xl text-[10px] font-semibold border transition " + (recapRecurring ? "bg-purple-500/20 border-purple-500/60 text-purple-300" : "bg-transparent border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300")}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  Recurring · {recapRecurring ? "Monthly" : "Off"}
                </button>
                {recapRecurring && <p className="text-[9px] text-slate-600">Repeats on the same date each month</p>}
                <button onClick={handleScheduleRecap} disabled={!recapWebhookId || !recapScheduleAt}
                  className="w-full py-2 rounded-2xl text-xs font-semibold bg-transparent text-slate-400 border border-white/10 hover:text-purple-300 hover:border-purple-500/40 transition disabled:opacity-40">
                  Schedule Post
                </button>
                {recapScheduleResult && <p className={"text-xs text-center " + (recapScheduleResult.ok ? "text-green-400" : "text-red-400")}>{recapScheduleResult.message}</p>}
              </div>

            </div>
          )}
        </div>

        {/* Webhooks */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
          <button onClick={() => setManageTab(manageTab==="webhooks"?"":"webhooks")} className="w-full flex items-center justify-between px-5 py-4">
            <div className="text-left"><p className="text-sm font-semibold text-slate-300">Webhooks</p><p className="text-[10px] text-slate-600 mt-0.5">{webhooks.length} configured</p></div>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-600 transition-transform ${manageTab==="webhooks"?"rotate-180":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
          {manageTab === "webhooks" && (
            <div className="px-5 pb-5 border-t border-white/10 pt-4 space-y-3">
              {webhooks.map(w => (
                <div key={w.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <div className="min-w-0"><p className="text-xs font-semibold text-white truncate">{w.label}</p>{w.channel && <p className="text-[10px] text-slate-600">#{w.channel}</p>}</div>
                  <button type="button" onClick={() => handleDeleteWebhook(w.id)} className="text-slate-600 hover:text-red-400 text-xs">✕</button>
                </div>
              ))}
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <input type="text" placeholder="Label" value={newLabel} onChange={e => setNewLabel(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                <input type="text" placeholder="Webhook URL" value={newUrl} onChange={e => setNewUrl(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                <input type="text" placeholder="Channel name (optional)" value={newChannel} onChange={e => setNewChannel(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                <button type="button" onClick={handleAddWebhook} disabled={addingWebhook||!newLabel||!newUrl}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-transparent text-purple-400 border border-purple-500/60 hover:border-purple-400 transition disabled:opacity-40">{addingWebhook?"Adding…":"Add Webhook"}</button>
                {webhookResult && <p className={`text-xs text-center ${webhookResult.ok?"text-green-400":"text-red-400"}`}>{webhookResult.message}</p>}
              </div>
            </div>
          )}
        </div>


        </>)} {/* end manage tab */}

        {/* ── TOOLS TAB ── */}
        {mainTab === "tools" && (<>

        {/* Timestamp Generator */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
          <button onClick={() => setManageTab(manageTab==="timestamp"?"":"timestamp")} className="w-full flex items-center justify-between px-5 py-4">
            <div className="text-left"><p className="text-sm font-semibold text-slate-300">Timestamp Generator</p><p className="text-[10px] text-slate-600 mt-0.5">Auto timezone-aware Discord timestamps</p></div>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-600 transition-transform ${manageTab==="timestamp"?"rotate-180":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
          {manageTab === "timestamp" && (
            <div className="px-5 pb-5 border-t border-white/10 pt-4">
              <TimestampTool/>
            </div>
          )}
        </div>

        {/* Clan Info Board */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
          <button onClick={() => setManageTab(manageTab==="clan-info-board"?"":"clan-info-board")} className="w-full flex items-center justify-between px-5 py-4">
            <div className="text-left"><p className="text-sm font-semibold text-slate-300">Clan Info Board</p><p className="text-[10px] text-slate-600 mt-0.5">Live-updating clan info embed for Discord</p></div>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-600 transition-transform ${manageTab==="clan-info-board"?"rotate-180":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
          {manageTab === "clan-info-board" && (
            <ClanInfoBoardTool/>
          )}
        </div>

        </>)} {/* end tools tab */}

      </div>
      <AdminFooter/>
    </main>
  );
}
