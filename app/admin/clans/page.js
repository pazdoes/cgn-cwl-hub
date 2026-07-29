"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CWL_ICONS } from "../../../lib/icons";
import DiscordWidget from "../../components/DiscordWidget";

/* ─── FAQ ────────────────────────────────────────────────────── */
function FaqButton() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const faqs = [
    { section: "Clan Manager", items: [
      { q: "How do I add a clan?", a: "Enter the clan tag to look it up, add the in-game link and CWL rank, then click Add Clan." },
      { q: "How do I delete a clan?", a: "Type the exact clan name in the Delete tab. Deletion is blocked if players are still assigned to that clan." },
    ]},
    { section: "Side Wars", items: [
      { q: "What is a Side War clan?", a: "A clan used for regular wars outside of CWL. You can schedule and activate side wars from this section." },
      { q: "What does Recurring mean?", a: "The war timer resets every 48 hours from the scheduled start time automatically." },
    ]},
    { section: "Info Board", items: [
      { q: "How does the Info Board work?", a: "Post a live embed to any Discord channel via webhook. It auto-updates every 6 hours with current clan data." },
      { q: "What is CWL Only?", a: "For clans that don't participate in regular wars. Hides the W/D/L and Streak fields and shows CWL Only instead." },
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

/* ─── Admin footer ───────────────────────────────────────────── */
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
        <a href="https://discord.gg/czqKKSF4Ta" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 no-underline">
          <img src="/icons/branding/cgn-skull.png" alt="CGN" className="w-5 h-5"/>
          <span className="text-[11px] text-slate-400 tracking-widest" style={{fontFamily:"var(--font-orbitron)"}}>Cognition Collective</span>
        </a>
      </div>
      <div className="flex items-center gap-2">
        <ContrastToggle/>
        <FaqButton/>
      </div>
    </div>
  );
}

/* ─── Clan Board Manager ─────────────────────────────────────── */
function ClanBoardManager({ pin }) {
  const [clans, setClans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => { loadClans(); }, []);

  async function loadClans() {
    setLoading(true);
    try {
      const res = await fetch("/api/clan-board-config");
      const d = await res.json();
      setClans(d.clans || []);
    } catch {} finally { setLoading(false); }
  }

  async function save(clan, updates) {
    setSaving(clan.clan_tag); setStatus(null);
    try {
      const res = await fetch("/api/clan-board-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, clan_tag: clan.clan_tag, clan_name: clan.clan_name, ...updates }),
      });
      const d = await res.json();
      if (d.success) { setStatus({ ok: "Saved" }); loadClans(); }
      else setStatus({ error: d.error || "Failed" });
    } catch { setStatus({ error: "Network error" }); }
    finally { setSaving(null); }
  }

  async function reorder(clan, direction) {
    const idx = clans.findIndex(c => c.clan_tag === clan.clan_tag);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= clans.length) return;
    const swap = clans[swapIdx];
    await Promise.all([
      save(clan, { included: clan.included, seed_wins: clan.seed_wins, seed_draws: clan.seed_draws, seed_losses: clan.seed_losses, cwl_only: clan.cwl_only, side_war_only: clan.side_war_only, display_order: swapIdx + 1 }),
      save(swap, { included: swap.included, seed_wins: swap.seed_wins, seed_draws: swap.seed_draws, seed_losses: swap.seed_losses, cwl_only: swap.cwl_only, side_war_only: swap.side_war_only, display_order: idx + 1 }),
    ]);
  }

  if (loading) return <div className="animate-pulse h-20 bg-white/[0.04] rounded-2xl"/>;

  return (
    <div className="space-y-3">
      {status?.ok && <p className="text-green-400 text-xs">{status.ok}</p>}
      {status?.error && <p className="text-red-400 text-xs">{status.error}</p>}
      {clans.map((clan, idx) => (
        <div key={clan.clan_tag} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5 shrink-0">
              <button onClick={() => reorder(clan, "up")} disabled={idx === 0 || !!saving} className="text-slate-600 hover:text-slate-300 transition disabled:opacity-20 text-xs leading-none">▲</button>
              <button onClick={() => reorder(clan, "down")} disabled={idx === clans.length - 1 || !!saving} className="text-slate-600 hover:text-slate-300 transition disabled:opacity-20 text-xs leading-none">▼</button>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{clan.clan_name}</p>
              <p className="text-[9px] text-slate-600">{clan.is_side_war ? "Side War Clan" : clan.cwl_rank || "—"}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {!clan.is_side_war && (
                <button onClick={() => save(clan, { included: clan.included, seed_wins: clan.seed_wins, seed_draws: clan.seed_draws, seed_losses: clan.seed_losses, display_order: clan.display_order, cwl_only: !clan.cwl_only, side_war_only: clan.side_war_only })} disabled={!!saving}
                  className={`rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-widest border transition ${clan.cwl_only ? "border-amber-500/40 text-amber-400" : "border-white/10 text-slate-600 hover:border-white/20"}`}>
                  CWL Only
                </button>
              )}
              {clan.is_side_war && (
                <button onClick={() => save(clan, { included: clan.included, seed_wins: clan.seed_wins, seed_draws: clan.seed_draws, seed_losses: clan.seed_losses, display_order: clan.display_order, cwl_only: clan.cwl_only, side_war_only: !clan.side_war_only })} disabled={!!saving}
                  className={`rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-widest border transition ${clan.side_war_only ? "border-blue-500/40 text-blue-400" : "border-white/10 text-slate-600 hover:border-white/20"}`}>
                  SW Only
                </button>
              )}
              <button onClick={() => save(clan, { included: !clan.included, seed_wins: clan.seed_wins, seed_draws: clan.seed_draws, seed_losses: clan.seed_losses, display_order: clan.display_order, cwl_only: clan.cwl_only, side_war_only: clan.side_war_only })} disabled={!!saving}
                className={`rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-widest border transition ${clan.included ? "border-green-500/40 text-green-400 hover:border-green-400" : "border-white/10 text-slate-500 hover:border-white/20"}`}>
                {clan.included ? "In" : "Out"}
              </button>
            </div>
          </div>
          {!clan.cwl_only && !clan.side_war_only && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Seed W", key: "seed_wins",   val: clan.seed_wins },
                { label: "Seed D", key: "seed_draws",  val: clan.seed_draws },
                { label: "Seed L", key: "seed_losses", val: clan.seed_losses },
              ].map(field => (
                <div key={field.key}>
                  <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-1">{field.label}</p>
                  <input type="number" min="0" defaultValue={field.val}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-white/20"
                    onBlur={e => save(clan, {
                      included: clan.included, cwl_only: clan.cwl_only, side_war_only: clan.side_war_only, display_order: clan.display_order,
                      seed_wins:   field.key === "seed_wins"   ? parseInt(e.target.value)||0 : clan.seed_wins,
                      seed_draws:  field.key === "seed_draws"  ? parseInt(e.target.value)||0 : clan.seed_draws,
                      seed_losses: field.key === "seed_losses" ? parseInt(e.target.value)||0 : clan.seed_losses,
                    })}/>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Clan Info Board Tool ───────────────────────────────────── */
function ClanInfoBoardTool({ pin }) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [status, setStatus] = useState(null);
  const [posting, setPosting] = useState(false);
  const [liveMessages, setLiveMessages] = useState([]);

  useEffect(() => { loadMessages(); }, []);

  async function loadMessages() {
    try { const res = await fetch("/api/clan-info-board"); const d = await res.json(); setLiveMessages(d.messages || []); } catch {}
  }

  async function handlePost() {
    if (!webhookUrl.trim()) { setStatus({ error: "Enter a webhook URL" }); return; }
    setPosting(true); setStatus(null);
    try {
      const res = await fetch("/api/clan-info-board", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ webhook_url: webhookUrl.trim(), pin }) });
      const d = await res.json();
      if (d.success) { const ts = new Date().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); setStatus({ ok: `Posted ${d.clansPosted} clans · ${ts}` }); setWebhookUrl(""); loadMessages(); }
      else setStatus({ error: d.error || "Failed" });
    } catch { setStatus({ error: "Network error" }); }
    finally { setPosting(false); }
  }

  async function handleUpdate(url) {
    setPosting(true); setStatus(null);
    try {
      const res = await fetch("/api/clan-info-board", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ webhook_url: url, pin }) });
      const d = await res.json();
      if (d.success) { const ts = new Date().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); setStatus({ ok: `Updated · ${ts}` }); loadMessages(); }
      else setStatus({ error: d.error || "Failed" });
    } catch { setStatus({ error: "Network error" }); }
    finally { setPosting(false); }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this board?")) return;
    setPosting(true); setStatus(null);
    try {
      const res = await fetch("/api/clan-info-board", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, pin }) });
      const d = await res.json();
      if (d.success) { setStatus({ ok: "Board deleted" }); loadMessages(); }
      else setStatus({ error: d.error || "Failed" });
    } catch { setStatus({ error: "Network error" }); }
    finally { setPosting(false); }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <input type="text" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)}
          placeholder="https://discord.com/api/webhooks/…"
          className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/40 transition"/>
        <button onClick={handlePost} disabled={posting || !webhookUrl.trim()}
          className="w-full py-2.5 rounded-2xl text-xs font-semibold bg-transparent text-green-400 border border-green-500/40 hover:border-green-400 transition disabled:opacity-40">
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
                <p className="text-[10px] text-slate-500 truncate flex-1">{msg.webhook_url.replace("https://discord.com/api/webhooks/", "webhook/…/").slice(0, 40)}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => handleUpdate(msg.webhook_url)} disabled={posting} className="rounded-full border border-blue-500/40 text-blue-400 px-2.5 py-0.5 text-[9px] uppercase tracking-widest hover:border-blue-400 transition disabled:opacity-40">{posting ? "…" : "Update"}</button>
                  <button onClick={() => handleDelete(msg.id)} disabled={posting} className="rounded-full border border-red-500/30 text-red-400 px-2.5 py-0.5 text-[9px] uppercase tracking-widest hover:border-red-400 transition disabled:opacity-40">Delete</button>
                </div>
              </div>
              {msg.last_updated && <p className="text-[9px] text-slate-700">Last updated {new Date(msg.last_updated).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function AdminClansPage() {
  const [pin, setPinState] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState("clans");

  // Clan Manager state
  const [clans, setClans] = useState([]);
  const [activeClanForm, setActiveClanForm] = useState("add");
  const [addClanTag, setAddClanTag] = useState("");
  const [addClanLink, setAddClanLink] = useState("");
  const [addClanRank, setAddClanRank] = useState("");
  const [addClanSuggestedName, setAddClanSuggestedName] = useState(null);
  const [addClanLookupBusy, setAddClanLookupBusy] = useState(false);
  const [addClanSubmitting, setAddClanSubmitting] = useState(false);
  const [addClanResult, setAddClanResult] = useState(null);
  const [deleteClanTag, setDeleteClanTag] = useState("");
  const [deleteClanSubmitting, setDeleteClanSubmitting] = useState(false);
  const [deleteClanResult, setDeleteClanResult] = useState(null);

  // Side Wars state
  const [sideWars, setSideWars] = useState([]);
  const [swLoading, setSwLoading] = useState(false);
  const [swForm, setSwForm] = useState({ clan_name: "", clan_tag: "", clan_link: "" });
  const [swError, setSwError] = useState("");
  const [swTimes, setSwTimes] = useState({});
  const [swTimeErrors, setSwTimeErrors] = useState({});
  const [swManageOpen, setSwManageOpen] = useState(false);

  const { data: discordSession, status: discordStatus } = useSession();
  const SESSION_KEY = "cwl_admin_pin_confirmed";

  useEffect(() => {
    if (discordStatus !== "authenticated") return;
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) { setPinState(saved); setAuthed(true); loadData(saved); }
  }, [discordStatus]);

  useEffect(() => {
    if (discordStatus === "unauthenticated") sessionStorage.removeItem(SESSION_KEY);
  }, [discordStatus]);

  async function loadData(p) {
    fetch("/api/admin/members", { headers: { "x-officer-pin": p } })
      .then(r => r.json()).then(d => setClans(d.clans || [])).catch(() => {});
    fetch("/api/admin/side-wars", { headers: { "x-officer-pin": p } })
      .then(r => r.json()).then(d => setSideWars(d.wars || [])).catch(() => setSideWars([]));
  }

  function handlePinSubmit(e) {
    e.preventDefault();
    setPinState(pinInput);
    setAuthed(true);
    setPinError(false);
    if (discordStatus === "authenticated") sessionStorage.setItem(SESSION_KEY, pinInput);
    loadData(pinInput);
  }

  // Clan Manager functions
  async function doLookupClan() {
    if (!addClanTag.trim()) return;
    setAddClanLookupBusy(true);
    try {
      const res = await fetch("/api/admin/clans/lookup", { method: "POST", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify({ clanTag: addClanTag.trim() }) });
      const d = await res.json();
      if (d.clanName) setAddClanSuggestedName(d.clanName);
    } catch {} finally { setAddClanLookupBusy(false); }
  }

  async function doAddClan(e) {
    e.preventDefault();
    if (!addClanTag.trim() || !addClanLink.trim()) return;
    setAddClanSubmitting(true); setAddClanResult(null);
    try {
      const res = await fetch("/api/admin/clans/create", { method: "POST", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify({ clanTag: addClanTag.trim(), clanLink: addClanLink.trim(), cwlRank: addClanRank.trim() || "Unranked" }) });
      const d = await res.json();
      if (res.ok) { setAddClanResult({ ok: true, message: d.message || "Clan added" }); setAddClanTag(""); setAddClanLink(""); setAddClanRank(""); setAddClanSuggestedName(null); loadData(pin); }
      else setAddClanResult({ ok: false, message: d.error || "Failed" });
    } catch { setAddClanResult({ ok: false, message: "Network error" }); }
    finally { setAddClanSubmitting(false); }
  }

  async function doDeleteClan(e) {
    e.preventDefault();
    if (!deleteClanTag.trim()) return;
    setDeleteClanSubmitting(true); setDeleteClanResult(null);
    try {
      const res = await fetch("/api/admin/clans/delete", { method: "POST", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify({ clanName: deleteClanTag.trim() }) });
      const d = await res.json();
      if (res.ok) { setDeleteClanResult({ ok: true, message: d.message || "Clan deleted" }); setDeleteClanTag(""); loadData(pin); }
      else setDeleteClanResult({ ok: false, message: d.error || "Failed" });
    } catch { setDeleteClanResult({ ok: false, message: "Network error" }); }
    finally { setDeleteClanSubmitting(false); }
  }

  function toggleClanForm(tab) { setActiveClanForm(prev => prev === tab ? null : tab); }

  // Side Wars functions
  async function swCreate() {
    setSwError("");
    if (!swForm.clan_name || !swForm.clan_tag || !swForm.clan_link) { setSwError("Clan name, tag and link are required"); return; }
    setSwLoading(true);
    try {
      const res = await fetch("/api/admin/side-wars", { method: "POST", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify(swForm) });
      const data = await res.json();
      if (!res.ok) { setSwError(data.error || "Failed"); return; }
      setSideWars(prev => [data.war, ...prev]);
      setSwForm({ clan_name: "", clan_tag: "", clan_link: "" });
    } catch { setSwError("Network error"); }
    finally { setSwLoading(false); }
  }

  async function swToggle(war) {
    if (!war.is_active && !war.start_time) { setSwTimeErrors(p => ({...p, [war.id]: "Set a start time before activating"})); return; }
    setSwTimeErrors(p => ({...p, [war.id]: ""}));
    const res = await fetch("/api/admin/side-wars", { method: "PATCH", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify({ id: war.id, action: "toggle" }) });
    const data = await res.json();
    if (res.ok) setSideWars(prev => prev.map(w => w.id === war.id ? data.war : w));
    else setSwTimeErrors(p => ({...p, [war.id]: data.error || "Failed"}));
  }

  async function swDelete(id) {
    await fetch("/api/admin/side-wars", { method: "DELETE", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify({ id }) });
    setSideWars(prev => prev.filter(w => w.id !== id));
  }

  async function swSetFormat(warId, time_format) {
    const res = await fetch("/api/admin/side-wars", { method: "PATCH", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify({ id: warId, action: "set_format", time_format }) });
    const text = await res.text();
    try { const data = JSON.parse(text); if (data.war) setSideWars(prev => prev.map(w => w.id === warId ? data.war : w)); } catch {}
  }

  /* ─── PIN gate ────────────────────────────────────────────── */
  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] p-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
        </div>
        <div className="relative z-10 w-full max-w-xs">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 text-center">
            <h1 className="text-xl font-thin tracking-widest mb-1">Clan Manager</h1>
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
        <h1 className="text-2xl font-thin tracking-widest mb-1">Clan Manager</h1>
        <p className="text-slate-500 text-xs">{clans.length} alliance clans · {sideWars.length} side war clans</p>
      </div>

      {/* Tab nav */}
      <div className="relative z-10 flex items-center justify-center gap-1 mb-4">
        {[["clans","Alliance Clans"],["infoboard","Info Board"]].map(([key,label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] uppercase tracking-widest font-semibold border transition ${
              activeTab === key
                ? "border-purple-500/60 bg-purple-500/15 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                : "border-white/10 bg-transparent text-slate-500 hover:text-slate-300 hover:border-white/20"
            }`}>
            {label}
          </button>
        ))}
      </div>

      <div className="relative z-10 space-y-3">

        {/* ── ALLIANCE CLANS TAB ── */}
        {activeTab === "clans" && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <p className="text-sm font-semibold text-slate-300">Alliance Clans</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Add or remove clans · {clans.length} active</p>
            </div>
            <div className="px-5 pb-5 pt-4 space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <button onClick={() => toggleClanForm("add")} className="text-slate-500 hover:text-slate-300 transition p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest select-none min-w-[80px] text-center">
                    {activeClanForm === "add" ? "Add Clan" : "Delete Clan"}
                  </span>
                  <button onClick={() => toggleClanForm("delete")} className="text-slate-500 hover:text-slate-300 transition p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </button>
                </div>

                {activeClanForm === "add" && (
                  <form onSubmit={doAddClan} className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1.5 ml-1">Clan Tag</label>
                      <div className="flex gap-2">
                        <input type="text" placeholder="#ABC123" value={addClanTag} onChange={e => setAddClanTag(e.target.value)} onBlur={doLookupClan} autoCapitalize="characters" autoCorrect="off" spellCheck={false}
                          className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition font-mono text-sm"/>
                        <button type="button" onClick={doLookupClan} disabled={addClanLookupBusy || !addClanTag.trim()}
                          className="px-3 py-2.5 rounded-2xl text-xs font-semibold bg-transparent text-slate-400 border border-white/10 hover:border-white/30 hover:text-white transition disabled:opacity-40">
                          {addClanLookupBusy ? "…" : "Lookup"}
                        </button>
                      </div>
                      {addClanSuggestedName && <p className="text-xs text-purple-300 mt-1 ml-1">→ {addClanSuggestedName}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1.5 ml-1">Clan Link</label>
                      <input type="text" placeholder="https://link.clashofclans.com/…" value={addClanLink} onChange={e => setAddClanLink(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition text-sm"/>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1.5 ml-1">CWL Rank</label>
                      <select value={addClanRank} onChange={e => setAddClanRank(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-white focus:outline-none focus:border-purple-500/50 transition text-sm [color-scheme:dark]">
                        <option value="">Select…</option>
                        <option value="Unranked">Unranked</option>
                        {Object.keys(CWL_ICONS).map(rank => <option key={rank} value={rank}>{rank}</option>)}
                      </select>
                    </div>
                    <button type="submit" disabled={addClanSubmitting || !addClanTag.trim() || !addClanLink.trim()}
                      className="w-full py-2.5 rounded-2xl text-xs font-semibold bg-transparent text-purple-400 border border-purple-500/60 shadow-[0_0_8px_rgba(168,85,247,0.12)] hover:border-purple-400 hover:text-purple-300 transition disabled:opacity-40">
                      {addClanSubmitting ? "Adding…" : "Add Clan"}
                    </button>
                    {addClanResult && <p className={`text-xs text-center ${addClanResult.ok ? "text-green-300" : "text-red-400"}`}>{addClanResult.message}</p>}
                  </form>
                )}

                {activeClanForm === "delete" && (
                  <form onSubmit={doDeleteClan} className="space-y-3">
                    <p className="text-[11px] text-slate-500">Type the exact clan name. Blocked if players are still assigned.</p>
                    <input type="text" placeholder="e.g. Cognition {CGN}" value={deleteClanTag} onChange={e => setDeleteClanTag(e.target.value)}
                      className="w-full rounded-2xl border border-red-500/20 bg-white/[0.04] px-3 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 transition text-sm"/>
                    <button type="submit" disabled={deleteClanSubmitting || !deleteClanTag.trim()}
                      className="w-full py-2.5 rounded-2xl text-xs font-semibold bg-transparent text-red-400 border border-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.12)] hover:border-red-400 hover:text-red-300 transition disabled:opacity-40">
                      {deleteClanSubmitting ? "Deleting…" : "Delete Clan"}
                    </button>
                    {deleteClanResult && <p className={`text-xs text-center ${deleteClanResult.ok ? "text-green-300" : "text-red-400"}`}>{deleteClanResult.message}</p>}
                  </form>
                )}
            </div>
          </div>
        )}

        {/* ── SIDE WARS TAB ── */}

        {/* ── INFO BOARD TAB ── */}
        {activeTab === "infoboard" && (<>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <p className="text-sm font-semibold text-slate-300">Clan Board Manager</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Configure which clans appear and set war record seed values</p>
            </div>
            <div className="px-5 pb-5 pt-4">
              <ClanBoardManager pin={pin}/>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <p className="text-sm font-semibold text-slate-300">Post / Update Board</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Post a live clan info board to Discord · auto-updates every 6 hours</p>
            </div>
            <div className="px-5 pb-5 pt-4">
              <ClanInfoBoardTool pin={pin}/>
            </div>
          </div>
        </>)}

      </div>

      <AdminFooter/>
    </main>
  );
}
