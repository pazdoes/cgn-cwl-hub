"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { BRANDING } from "../../../lib/branding";
import { TH_ICONS, CWL_ICONS } from "../../../lib/icons";
import DiscordWidget from "../../components/DiscordWidget";

/* ─── skeleton ────────────────────────────────────────────── */
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.06] ${className}`} />;
}

/* ─── circular X button ───────────────────────────────────── */
function XButton({ onClick, busy, title }) {
  return (
    <button type="button" onClick={onClick} disabled={busy} title={title}
      className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-white/[0.06] border border-white/10 text-slate-400 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300 transition disabled:opacity-40 disabled:pointer-events-none">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

/* ─── TH icon ─────────────────────────────────────────────── */
function ThIcon({ level, size = "w-8 h-8" }) {
  const src = level ? TH_ICONS[String(level)] : null;
  if (!src) return null;
  return <img src={src} alt={`TH${level}`} className={`${size} shrink-0`} />;
}

/* ─── Rank refresh button ─────────────────────────────────── */
function RankRefreshButton({ busy, result, onClick }) {
  const title = busy ? "Refreshing…" : result ? (result.ok ? `Updated: ${result.message}` : result.message) : "Refresh CWL Rank from CoC API";
  return (
    <button type="button" onClick={onClick} disabled={busy} title={title}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-widest transition disabled:opacity-40 ${
        result?.ok === false
          ? "border-red-500/40 bg-red-500/10 text-red-300"
          : "border-purple-500/40 bg-purple-500/10 text-purple-300 hover:border-purple-400/60 hover:bg-purple-500/20"
      }`}>
      <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 ${busy ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      {result?.ok === false ? "Failed" : "Refresh"}
    </button>
  );
}

/* ─── Status toggle ───────────────────────────────────────── */
function StatusToggle({ status, busy, error, onSetStatus }) {
  const isConfirmed = status === "confirmed";
  const isSubstitute = status === "substitute";
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center rounded-full border border-white/10 bg-white/[0.03] p-0.5 text-[10px]">
        <button type="button" disabled={busy} onClick={() => onSetStatus("confirmed")}
          className={`px-2.5 py-1 rounded-full transition disabled:opacity-50 font-semibold ${isConfirmed ? "bg-green-500/30 text-green-200" : "text-slate-500 hover:text-slate-300"}`}>
          Confirmed
        </button>
        <button type="button" disabled={busy} onClick={() => onSetStatus("substitute")}
          className={`px-2.5 py-1 rounded-full transition disabled:opacity-50 font-semibold ${isSubstitute ? "bg-orange-500/30 text-orange-200" : "text-slate-500 hover:text-slate-300"}`}>
          Substitute
        </button>
      </div>
      {error && <p className="text-[9px] text-red-400 text-right max-w-[140px] leading-tight">{error}</p>}
    </div>
  );
}

/* ─── Format toggle ───────────────────────────────────────── */
function FormatToggle({ format, busy, error, onSetFormat }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-1.5 text-[10px]">
        <button type="button" disabled={busy} onClick={() => onSetFormat(15)}
          className={`px-2.5 py-1 rounded-full border transition disabled:opacity-50 font-semibold ${format === 15 ? "bg-transparent text-purple-400 border-purple-500/60 shadow-[0_0_6px_rgba(168,85,247,0.15)]" : "bg-transparent text-slate-500 border-white/10 hover:text-slate-300 hover:border-white/20"}`}>15v15</button>
        <button type="button" disabled={busy} onClick={() => onSetFormat(30)}
          className={`px-2.5 py-1 rounded-full border transition disabled:opacity-50 font-semibold ${format === 30 ? "bg-transparent text-purple-400 border-purple-500/60 shadow-[0_0_6px_rgba(168,85,247,0.15)]" : "bg-transparent text-slate-500 border-white/10 hover:text-slate-300 hover:border-white/20"}`}>30v30</button>
      </div>
      {error && <p className="text-[9px] text-red-400 text-right max-w-[180px] leading-tight">{error}</p>}
    </div>
  );
}

/* ─── tiny helpers ────────────────────────────────────────── */
function Card({ children, className = "" }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 shadow-xl ${className}`}>
      {children}
    </div>
  );
}

function Pill({ children, variant = "neutral" }) {
  const c = {
    success: "bg-green-500/20 text-green-300 border border-green-500/30",
    error:   "bg-red-500/20 text-red-300 border border-red-500/30",
    warn:    "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
    purple:  "bg-purple-500/20 text-purple-300 border border-purple-500/30",
    neutral: "bg-slate-500/20 text-slate-300 border border-slate-500/30",
  };
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${c[variant]}`}>{children}</span>;
}

/* ─── Hamburger nav menu ──────────────────────────────────── */
function AdminNav() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-8 h-8 rounded-full flex items-center justify-center border border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.08] hover:text-white transition"
        title="Admin menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-full mt-2 z-50 min-w-[160px] rounded-2xl border border-white/10 bg-[#0d1424]/95 backdrop-blur-xl shadow-xl overflow-hidden"
          >
            <div className="p-1.5 space-y-0.5">
              <Link href="/admin" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Overview
              </Link>
              <Link href="/admin/pool" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-white bg-white/[0.06] transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Pool Manager
              </Link>
              <Link href="/admin/announcements" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white transition">
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

/* ─── main component ──────────────────────────────────────── */
export default function AdminPoolPage() {
  const [pin, setPinState] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [authed, setAuthed] = useState(false);

  const { data: discordSession, status: discordStatus } = useSession();
  const SESSION_KEY = "cwl_admin_pin_confirmed";

  useEffect(() => {
    if (discordStatus !== "authenticated") return;
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) { setPinState(saved); setAuthed(true); loadPool(saved); }
  }, [discordStatus]);

  useEffect(() => {
    if (discordStatus === "unauthenticated") sessionStorage.removeItem(SESSION_KEY);
  }, [discordStatus]);

  const [season, setSeason] = useState(null);
  const [entries, setEntries] = useState([]);
  const [clans, setClans] = useState([]);
  const [clanFormats, setClanFormats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [thRefreshing, setThRefreshing] = useState(false);
  const [thRefreshResult, setThRefreshResult] = useState(null);
  const [poolTab, setPoolTab] = useState("available");

  const [dragging, setDragging] = useState(null);
  const [overClan, setOverClan] = useState(null);
  const [draggingClan, setDraggingClan] = useState(null);
  const [overClanTile, setOverClanTile] = useState(null);

  const [assignStatus, setAssignStatus] = useState({});
  const [assigning, setAssigning] = useState(null);
  const [unassigning, setUnassigning] = useState(null);
  const [statusBusy, setStatusBusy] = useState(null);
  const [statusError, setStatusError] = useState({});
  const [formatBusy, setFormatBusy] = useState(null);
  const [formatError, setFormatError] = useState({});
  const [rankBusy, setRankBusy] = useState(null);
  const [absentBusy, setAbsentBusy] = useState(null);
  const [clanAbsent, setClanAbsent] = useState({});
  const [rankResult, setRankResult] = useState({});

  const [activeClanForm, setActiveClanForm] = useState(null);
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

  const [showCloseSeasonForm, setShowCloseSeasonForm] = useState(false);
  const [closeSeasonConfirm, setCloseSeasonConfirm] = useState("");
  const [closeSeasonSubmitting, setCloseSeasonSubmitting] = useState(false);
  const [closeSeasonResult, setCloseSeasonResult] = useState(null);
  const [fetchingCwl, setFetchingCwl] = useState(false);
  const [fetchCwlResult, setFetchCwlResult] = useState(null);

  // Multi-select + roster builder state — must be before any early returns
  const [selectedTags, setSelectedTags] = useState([]);
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [builderTab, setBuilderTab] = useState("pool");
  const [mainPoolTab, setMainPoolTab] = useState("roster");
  const [activeClanIdx, setActiveClanIdx] = useState(0);
  const [poolSearch, setPoolSearch] = useState("");

  async function loadPool(savedPin) {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/admin/pool", { headers: { "x-officer-pin": savedPin } });
      if (res.status === 401) { setPinError(true); setAuthed(false); return; }
      const data = await res.json();
      setSeason(data.season);
      setEntries(data.entries || []);
      setClanFormats(data.clanFormats || {});
      setClanAbsent(data.clanAbsent || {});
      setClans(data.clanNames || []);
    } catch { setError("Couldn't load pool data — check your connection."); }
    finally { setLoading(false); }
  }

  function handlePinSubmit(e) {
    e.preventDefault();
    setPinState(pinInput);
    setAuthed(true);
    setPinError(false);
    if (discordStatus === "authenticated") sessionStorage.setItem(SESSION_KEY, pinInput);
    loadPool(pinInput);
  }

  function onDragStart(entry) { setDragging(entry); }
  function onDragEnd() { setDragging(null); setOverClan(null); }
  function onDragOver(e, clan) { e.preventDefault(); setOverClan(clan); }
  function onDragLeave() { setOverClan(null); }
  async function onDrop(e, clan) {
    e.preventDefault(); setOverClan(null);
    if (!dragging) return;
    if (dragging.assigned_clan === clan) { setDragging(null); return; }
    await doAssign(dragging, clan);
    setDragging(null);
  }

  const LONG_PRESS_MS = 280;
  const MOVE_CANCEL_PX = 10;
  const touchPlayerStateRef = useRef({ timer: null, startX: 0, startY: 0, entry: null, active: false, moveListener: null, endListener: null, cancelListener: null });

  function cleanupPlayerTouchListeners() {
    const s = touchPlayerStateRef.current;
    if (s.moveListener) document.removeEventListener("touchmove", s.moveListener);
    if (s.endListener) document.removeEventListener("touchend", s.endListener);
    if (s.cancelListener) document.removeEventListener("touchcancel", s.cancelListener);
    s.moveListener = null; s.endListener = null; s.cancelListener = null;
  }

  function onTouchStartPlayer(e, entry) {
    const touch = e.touches[0]; if (!touch) return;
    const state = touchPlayerStateRef.current;
    state.startX = touch.clientX; state.startY = touch.clientY;
    state.entry = entry; state.active = false;

    state.timer = setTimeout(() => {
      state.active = true;
      onDragStart(entry);

      const moveListener = (moveEvent) => {
        if (moveEvent.cancelable) moveEvent.preventDefault();
        const t = moveEvent.touches[0]; if (!t) return;
        const el = document.elementFromPoint(t.clientX, t.clientY);
        const zone = el?.closest("[data-clan-zone]");
        if (!zone) { setOverClan(null); return; }
        const clan = zone.getAttribute("data-clan-zone");
        if (!clan) return;
        onDragOver({ preventDefault: () => {} }, clan);
      };

      const finish = async (endEvent) => {
        const touch2 = endEvent.changedTouches?.[0];
        const el = touch2 && document.elementFromPoint(touch2.clientX, touch2.clientY);
        const zone = el?.closest("[data-clan-zone]");
        const clan = zone?.getAttribute("data-clan-zone");
        const entryNow = state.entry;
        cleanupPlayerTouchListeners();
        setDragging(null); setOverClan(null);

        if (!clan || !entryNow || entryNow.assigned_clan === clan) {
          state.entry = null; state.active = false; return;
        }

        const previousEntries = await new Promise(resolve => {
          setEntries(prev => { resolve(prev); return prev.map(e => e.player_tag === entryNow.player_tag ? { ...e, assigned_clan: clan, assigned_at: new Date().toISOString() } : e); });
        });

        try {
          const res = await fetch("/api/admin/assign", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-officer-pin": pin },
            body: JSON.stringify({ tag: entryNow.player_tag, playerName: entryNow.player_name, clan, townHall: entryNow.town_hall_level || "", season }),
          });
          if (!res.ok) {
            setEntries(previousEntries);
            setAssignStatus(prev => ({ ...prev, [entryNow.player_tag]: { ok: false, msg: "Assignment failed" } }));
          } else {
            setAssignStatus(prev => ({ ...prev, [entryNow.player_tag]: { ok: true, msg: `→ ${clan}` } }));
          }
        } catch { setEntries(previousEntries); }

        state.entry = null; state.active = false;
      };

      state.moveListener = moveListener; state.endListener = finish; state.cancelListener = finish;
      document.addEventListener("touchmove", moveListener, { passive: false });
      document.addEventListener("touchend", finish, { passive: true });
      document.addEventListener("touchcancel", finish, { passive: true });
    }, LONG_PRESS_MS);
  }

  function onTouchMovePlayer(e) {
    const state = touchPlayerStateRef.current;
    if (state.active || !state.entry) return;
    const touch = e.touches[0]; if (!touch) return;
    const dx = Math.abs(touch.clientX - state.startX);
    const dy = Math.abs(touch.clientY - state.startY);
    if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) { clearTimeout(state.timer); state.entry = null; }
  }

  function onTouchEndPlayer() {
    const state = touchPlayerStateRef.current;
    clearTimeout(state.timer);
    if (!state.active) state.entry = null;
  }

  function onClanTileDragStart(clan) { setDraggingClan(clan); }
  function onClanTileDragEnd() { setDraggingClan(null); setOverClanTile(null); }
  function onClanTileDragOver(e, clan) {
    e.preventDefault();
    if (clan === draggingClan) return;
    setOverClanTile(clan);
    setClans(prev => {
      const from = prev.indexOf(draggingClan); const to = prev.indexOf(clan);
      if (from === -1 || to === -1) return prev;
      const next = [...prev]; next.splice(from, 1); next.splice(to, 0, draggingClan);
      return next;
    });
  }
  function onClanTileDragLeave() { setOverClanTile(null); }
  async function onClanTileDrop(e, clan) {
    e.preventDefault(); setDraggingClan(null); setOverClanTile(null);
    let currentOrder = null;
    setClans(prev => { currentOrder = [...prev]; return prev; });
    try {
      await fetch("/api/admin/clans/reorder", { method: "POST", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify({ orderedNames: currentOrder }) });
    } catch { console.error("Clan reorder error"); }
  }

  const touchClanStateRef = useRef({ timer: null, startX: 0, startY: 0, clan: null, active: false, moveListener: null, endListener: null, cancelListener: null, snapshot: null });

  function cleanupClanTouchListeners() {
    const s = touchClanStateRef.current;
    if (s.moveListener) document.removeEventListener("touchmove", s.moveListener);
    if (s.endListener) document.removeEventListener("touchend", s.endListener);
    if (s.cancelListener) document.removeEventListener("touchcancel", s.cancelListener);
    s.moveListener = null; s.endListener = null; s.cancelListener = null;
  }

  function onClanTileTouchStart(e, clan) {
    const touch = e.touches[0]; if (!touch) return;
    const state = touchClanStateRef.current;
    state.startX = touch.clientX; state.startY = touch.clientY; state.clan = clan; state.active = false;

    state.timer = setTimeout(() => {
      state.active = true;
      setDraggingClan(clan);
      setClans(prev => { state.snapshot = [...prev]; return prev; });

      const moveListener = (moveEvent) => {
        if (moveEvent.cancelable) moveEvent.preventDefault();
        const t = moveEvent.touches[0]; if (!t) return;
        const el = document.elementFromPoint(t.clientX, t.clientY);
        const tile = el?.closest("[data-clan-tile]");
        if (!tile) return;
        const overClanName = tile.getAttribute("data-clan-tile");
        if (!overClanName || overClanName === state.clan) return;
        setOverClanTile(overClanName);
        setClans(prev => {
          const from = prev.indexOf(state.clan); const to = prev.indexOf(overClanName);
          if (from === -1 || to === -1) return prev;
          const next = [...prev]; next.splice(from, 1); next.splice(to, 0, state.clan);
          return next;
        });
      };

      const finish = async () => {
        cleanupClanTouchListeners();
        setDraggingClan(null); setOverClanTile(null);
        let currentOrder = null;
        setClans(prev => { currentOrder = [...prev]; return prev; });
        try {
          const res = await fetch("/api/admin/clans/reorder", { method: "POST", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify({ orderedNames: currentOrder }) });
          if (!res.ok && state.snapshot) setClans(state.snapshot);
        } catch { if (state.snapshot) setClans(state.snapshot); }
        state.clan = null; state.active = false; state.snapshot = null;
      };

      state.moveListener = moveListener; state.endListener = finish; state.cancelListener = finish;
      document.addEventListener("touchmove", moveListener, { passive: false });
      document.addEventListener("touchend", finish, { passive: true });
      document.addEventListener("touchcancel", finish, { passive: true });
    }, 280);
  }

  function onClanTileTouchMove(e) {
    const state = touchClanStateRef.current;
    if (state.active || !state.clan) return;
    const touch = e.touches[0]; if (!touch) return;
    const dx = Math.abs(touch.clientX - state.startX);
    const dy = Math.abs(touch.clientY - state.startY);
    if (dx > 10 || dy > 10) { clearTimeout(state.timer); state.clan = null; }
  }

  function onClanTileTouchEnd() {
    const state = touchClanStateRef.current;
    clearTimeout(state.timer);
    if (!state.active) state.clan = null;
  }

  async function doAssign(entry, clan) {
    setAssigning(entry.player_tag);
    try {
      const res = await fetch("/api/admin/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify({ tag: entry.player_tag, playerName: entry.player_name, clan, townHall: entry.town_hall_level || "", season }),
      });
      const data = await res.json();
      if (res.ok) {
        setAssignStatus(prev => ({ ...prev, [entry.player_tag]: { ok: true, msg: `→ ${clan}` } }));
        setEntries(prev => prev.map(e => e.player_tag === entry.player_tag ? { ...e, assigned_clan: clan, assigned_at: new Date().toISOString() } : e));
      } else {
        setAssignStatus(prev => ({ ...prev, [entry.player_tag]: { ok: false, msg: data.error || "Failed" } }));
      }
    } catch {
      setAssignStatus(prev => ({ ...prev, [entry.player_tag]: { ok: false, msg: "Network error" } }));
    } finally { setAssigning(null); }
  }

  async function doAssignMultiple(entries, clan) {
    if (!entries.length || !clan) return;
    setBulkAssigning(true);
    const results = await Promise.allSettled(
      entries.map(entry =>
        fetch("/api/admin/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-officer-pin": pin },
          body: JSON.stringify({ tag: entry.player_tag, playerName: entry.player_name, clan, townHall: entry.town_hall_level || "", season }),
        }).then(r => r.json().then(data => ({ ok: r.ok, data, entry })))
      )
    );
    results.forEach(r => {
      if (r.status === "fulfilled") {
        const { ok, data, entry } = r.value;
        if (ok) {
          setAssignStatus(prev => ({ ...prev, [entry.player_tag]: { ok: true, msg: `→ ${clan}` } }));
          setEntries(prev => prev.map(e => e.player_tag === entry.player_tag ? { ...e, assigned_clan: clan, assigned_at: new Date().toISOString() } : e));
        } else {
          setAssignStatus(prev => ({ ...prev, [entry.player_tag]: { ok: false, msg: data.error || "Failed" } }));
        }
      }
    });
    setSelectedTags([]);
    setBulkAssigning(false);
  }

  async function doUnassign(entry) {
    setUnassigning(entry.player_tag);
    try {
      const res = await fetch("/api/admin/unassign", { method: "POST", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify({ tag: entry.player_tag }) });
      const data = await res.json();
      if (res.ok) {
        setEntries(prev => prev.map(e => e.player_tag === entry.player_tag ? { ...e, assigned_clan: null, assigned_at: null, status: null } : e));
      } else {
        setStatusError(prev => ({ ...prev, [entry.player_tag]: data.error || "Unassign failed" }));
      }
    } catch { setStatusError(prev => ({ ...prev, [entry.player_tag]: "Network error" })); }
    finally { setUnassigning(null); }
  }

  async function doSetStatus(entry, status) {
    setStatusBusy(entry.player_tag);
    setStatusError(prev => ({ ...prev, [entry.player_tag]: null }));
    try {
      const res = await fetch("/api/admin/status", { method: "POST", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify({ tag: entry.player_tag, clan: entry.assigned_clan, status }) });
      const data = await res.json();
      if (res.ok) {
        setEntries(prev => prev.map(e => e.player_tag === entry.player_tag ? { ...e, status } : e));
      } else {
        setStatusError(prev => ({ ...prev, [entry.player_tag]: data.error || "Status update failed" }));
      }
    } catch { setStatusError(prev => ({ ...prev, [entry.player_tag]: "Network error" })); }
    finally { setStatusBusy(null); }
  }

  async function doSetFormat(clan, format) {
    setFormatBusy(clan);
    setFormatError(prev => ({ ...prev, [clan]: null }));
    try {
      const res = await fetch("/api/admin/format", { method: "POST", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify({ clan, format }) });
      const data = await res.json();
      if (res.ok) { setClanFormats(prev => ({ ...prev, [clan]: format })); }
      else { setFormatError(prev => ({ ...prev, [clan]: data.error || "Format update failed" })); }
    } catch { setFormatError(prev => ({ ...prev, [clan]: "Network error" })); }
    finally { setFormatBusy(null); }
  }



  async function doSetAbsent(clan, absent) {
    setAbsentBusy(clan);
    try {
      const res = await fetch("/api/admin/absent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify({ clanName: clan, absent }),
      });
      if (res.ok) setClanAbsent(prev => ({ ...prev, [clan]: absent }));
    } catch {}
    finally { setAbsentBusy(null); }
  }
  async function doRefreshThLevels() {
    setThRefreshing(true); setThRefreshResult(null);
    try {
      const res = await fetch("/api/admin/pool/refresh-th", { method: "POST", headers: { "x-officer-pin": pin } });
      const data = await res.json();
      if (res.ok) { await loadPool(pin); setThRefreshResult({ ok: true, message: `Updated ${data.count ?? 0} player${data.count !== 1 ? "s" : ""}` }); }
      else { setThRefreshResult({ ok: false, message: data.error || "Refresh failed" }); }
    } catch { setThRefreshResult({ ok: false, message: "Network error" }); }
    finally { setThRefreshing(false); }
  }

  async function doRefreshRank(clan) {
    setRankBusy(clan);
    setRankResult(prev => ({ ...prev, [clan]: null }));
    try {
      const res = await fetch("/api/admin/cwl-rank", { method: "POST", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify({ clan }) });
      const data = await res.json();
      if (res.ok) { setRankResult(prev => ({ ...prev, [clan]: { ok: true, message: data.rank } })); }
      else { setRankResult(prev => ({ ...prev, [clan]: { ok: false, message: data.error || "Refresh failed" } })); }
    } catch { setRankResult(prev => ({ ...prev, [clan]: { ok: false, message: "Network error" } })); }
    finally { setRankBusy(null); }
  }

  function toggleClanForm(form) {
    setActiveClanForm(prev => (prev === form ? null : form));
    setAddClanTag(""); setAddClanLink(""); setAddClanRank(""); setAddClanSuggestedName(null); setAddClanResult(null);
    setDeleteClanTag(""); setDeleteClanResult(null);
  }

  async function doLookupClan() {
    if (!addClanTag.trim()) return;
    setAddClanLookupBusy(true); setAddClanResult(null);
    try {
      const res = await fetch("/api/admin/clans/lookup", { method: "POST", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify({ clanTag: addClanTag.trim() }) });
      const data = await res.json();
      if (res.ok) { setAddClanSuggestedName(data.clanName); setAddClanRank(data.suggestedRank || "Unranked"); }
      else { setAddClanSuggestedName(null); setAddClanResult({ ok: false, message: data.error || "Lookup failed" }); }
    } catch { setAddClanResult({ ok: false, message: "Network error" }); }
    finally { setAddClanLookupBusy(false); }
  }

  async function doAddClan(e) {
    e.preventDefault();
    if (!addClanTag.trim() || !addClanLink.trim()) return;
    setAddClanSubmitting(true); setAddClanResult(null);
    try {
      const res = await fetch("/api/admin/clans/create", { method: "POST", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify({ clanTag: addClanTag.trim(), clanLink: addClanLink.trim(), cwlRank: addClanRank.trim() || "Unranked" }) });
      const data = await res.json();
      if (res.ok) { setAddClanResult({ ok: true, message: `${data.clanName} added.` }); await loadPool(pin); }
      else { setAddClanResult({ ok: false, message: data.error || "Failed to add clan" }); }
    } catch { setAddClanResult({ ok: false, message: "Network error" }); }
    finally { setAddClanSubmitting(false); }
  }

  async function doCloseSeason(e) {
    e.preventDefault();
    if (closeSeasonConfirm !== "CONFIRM") return;
    setCloseSeasonSubmitting(true); setCloseSeasonResult(null);
    try {
      const res = await fetch("/api/admin/season/close", { method: "POST", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify({ confirm: "CONFIRM" }) });
      const data = await res.json();
      if (res.ok) {
        setCloseSeasonResult({ ok: true, message: `${data.closed} migrated → ${data.opened} open · ${data.snapshotCount ?? 0} players archived` });
        setCloseSeasonConfirm(""); setShowCloseSeasonForm(false);
        await loadPool(pin);
      } else { setCloseSeasonResult({ ok: false, message: data.error || "Failed to close season" }); }
    } catch { setCloseSeasonResult({ ok: false, message: "Network error" }); }
    finally { setCloseSeasonSubmitting(false); }
  }

  async function doFetchCwlData() {
    setFetchingCwl(true); setFetchCwlResult(null);
    try {
      const res = await fetch("/api/admin/cwl-fetch", { method: "POST", headers: { "x-officer-pin": pin } });
      const data = await res.json();
      if (res.ok) {
        setFetchCwlResult({ ok: true, message: `Captured ${data.playersProcessed} players across ${data.clansProcessed} clans for ${data.season}` });
      } else {
        setFetchCwlResult({ ok: false, message: data.error || "Fetch failed" });
      }
    } catch { setFetchCwlResult({ ok: false, message: "Network error" }); }
    finally { setFetchingCwl(false); }
  }

  async function doDeleteClan(e) {
    e.preventDefault();
    if (!deleteClanTag.trim()) return;
    setDeleteClanSubmitting(true); setDeleteClanResult(null);
    try {
      const res = await fetch("/api/admin/clans/delete", { method: "POST", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify({ clanName: deleteClanTag.trim() }) });
      const data = await res.json();
      if (res.ok) { setDeleteClanResult({ ok: true, message: `${data.clanName} deleted.` }); await loadPool(pin); }
      else { setDeleteClanResult({ ok: false, message: data.error || "Failed to delete clan" }); }
    } catch { setDeleteClanResult({ ok: false, message: "Network error" }); }
    finally { setDeleteClanSubmitting(false); }
  }

  const unassigned = entries.filter(e => !e.assigned_clan).sort((a, b) => (b.town_hall_level ?? 0) - (a.town_hall_level ?? 0));
  const assigned = entries.filter(e => e.assigned_clan);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const filteredUnassigned = unassigned.filter(e =>
    !poolSearch || e.player_name.toLowerCase().includes(poolSearch.toLowerCase()) || e.player_tag.toLowerCase().includes(poolSearch.toLowerCase())
  );

  /* ─── PIN gate ─────────────────────────────────────────── */
  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] p-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
        </div>
        <div className="relative z-10 w-full max-w-xs">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 text-center">
            <h1 className="text-xl font-thin tracking-widest mb-1">Pool Manager</h1>
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

  /* ─── main admin UI ─────────────────────────────────────── */
  const currentClan = clans[Math.min(activeClanIdx, clans.length - 1)] || null;
  const currentClanEntries = currentClan ? assigned.filter(e => e.assigned_clan === currentClan).sort((a,b) => (b.town_hall_level??0)-(a.town_hall_level??0)) : [];
  const currentFormat = currentClan ? (clanFormats[currentClan] ?? 15) : 15;
  const rosterPct = currentFormat > 0
    ? Math.min(100, Math.round(currentClanEntries.length / currentFormat * 100))
    : 0;
  const rosterFull = currentClanEntries.length >= currentFormat;

  return (
    <main className="min-h-screen overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      </div>

      {/* Hero card — flush to top */}
      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 mb-4 text-center">
        <h1 className="text-2xl font-thin tracking-widest mb-1">Pool Manager</h1>
        <p className="text-slate-500 text-xs mb-4">
          {season ? <><span className="text-purple-300">{season}</span> · {entries.length} in pool · {unassigned.length} unassigned</> : "Loading…"}
        </p>
        <div className="flex justify-center mb-3">
          <DiscordWidget variant="center"/>
        </div>
        <div className="flex items-center justify-center gap-4">
          <Link href="/admin" className="text-slate-500 hover:text-slate-300 transition p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </Link>
          <span className="text-[10px] text-slate-600 uppercase tracking-widest select-none min-w-[100px] text-center">Pool Manager</span>
          <Link href="/admin/announcements" className="text-slate-500 hover:text-slate-300 transition p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </div>

      {/* Pool Manager tab nav */}
      <div className="relative z-10 flex items-center justify-center gap-1 mb-4">
        {[["roster","Roster"],["settings","Settings"]].map(([key,label]) => (
          <button key={key} onClick={() => setMainPoolTab(key)}
            className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-semibold border transition ${
              mainPoolTab === key
                ? "border-purple-500/60 bg-purple-500/15 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                : "border-white/10 bg-transparent text-slate-500 hover:text-slate-300 hover:border-white/20"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Pool Manager tab nav */}
      <div className="relative z-10 flex items-center justify-center gap-1 mb-4">
        {[["roster","Roster"],["settings","Settings"]].map(([key,label]) => (
          <button key={key} onClick={() => setMainPoolTab(key)}
            className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-semibold border transition ${
              mainPoolTab === key
                ? "border-purple-500/60 bg-purple-500/15 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                : "border-white/10 bg-transparent text-slate-500 hover:text-slate-300 hover:border-white/20"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="relative z-10 space-y-3">
          {Array.from({length:3}).map((_,i) => <div key={i} className="rounded-3xl border border-white/10 bg-white/[0.04] h-20 animate-pulse"/>)}
        </div>
      )}
      {error && <div className="relative z-10 text-center text-red-400 text-sm py-6">{error}</div>}

      {!loading && (clans.length > 0 || entries.length > 0) && (
        <div className="relative z-10 space-y-4">

          {/* ── ROSTER TAB ── */}
          {mainPoolTab === "roster" && (<>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
            {/* Builder header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Roster Builder</h2>
                <div className="flex items-center gap-1.5">
                  <RankRefreshButton busy={thRefreshing} result={thRefreshResult} onClick={doRefreshThLevels}/>
                </div>
              </div>
              {/* Tab toggle — Pool / Roster */}
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => setBuilderTab("pool")} className="text-slate-500 hover:text-slate-300 transition p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest select-none min-w-[80px] text-center">
                  {builderTab === "pool" ? `Pool (${unassigned.length})` : `Roster`}
                </span>
                <button onClick={() => setBuilderTab("roster")} className="text-slate-500 hover:text-slate-300 transition p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>

            {/* Pool tab */}
            {builderTab === "pool" && (
              <div className="p-4">
                {/* Search + Select All */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative flex-1">
                    <input type="text" placeholder="Search pool…" value={poolSearch} onChange={e => setPoolSearch(e.target.value)}
                      className="w-full rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                    {poolSearch && <button onClick={() => setPoolSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition text-xs">✕</button>}
                  </div>
                  {filteredUnassigned.length > 0 && (
                    <button
                      onClick={() => {
                        if (selectedTags.length === filteredUnassigned.length) {
                          setSelectedTags([]);
                        } else {
                          setSelectedTags(filteredUnassigned.map(e => e.player_tag));
                        }
                      }}
                      className="shrink-0 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-[10px] text-slate-400 hover:text-white hover:border-white/20 transition uppercase tracking-widest font-semibold">
                      {selectedTags.length === filteredUnassigned.length ? "None" : "All"}
                    </button>
                  )}
                </div>
                {/* Multi-select banner */}
                {selectedTags.length > 0 && (
                  <div className="flex items-center gap-2 mb-3 rounded-2xl border border-purple-500/40 bg-purple-500/10 px-3 py-2">
                    <span className="text-xs text-purple-200 font-semibold flex-1">{selectedTags.length} player{selectedTags.length > 1 ? "s" : ""} selected</span>
                    <button onClick={() => setSelectedTags([])} className="text-slate-500 hover:text-white transition text-xs">✕</button>
                    <button onClick={() => setBuilderTab("roster")} className="text-[10px] text-purple-300 hover:text-white transition">Assign →</button>
                  </div>
                )}
                {filteredUnassigned.length === 0 ? (
                  <p className="text-slate-600 text-xs text-center py-6">{poolSearch ? "No matches" : "All players assigned"}</p>
                ) : (
                  <div className="space-y-2">
                    {filteredUnassigned.map(entry => {
                      const isSelected = selectedTags.includes(entry.player_tag);
                      const busy = assigning === entry.player_tag;
                      const status = assignStatus[entry.player_tag];
                      return (
                        <div key={entry.player_tag}
                          draggable
                          onDragStart={() => onDragStart(entry)} onDragEnd={onDragEnd}
                          onTouchStart={e => onTouchStartPlayer(e, entry)} onTouchMove={onTouchMovePlayer} onTouchEnd={onTouchEndPlayer}
                          onClick={() => setSelectedTags(prev =>
                            prev.includes(entry.player_tag)
                              ? prev.filter(t => t !== entry.player_tag)
                              : [...prev, entry.player_tag]
                          )}
                          style={{ touchAction: "pan-y", WebkitUserSelect: "none", userSelect: "none" }}
                          className={`rounded-2xl border p-3 transition cursor-pointer select-none
                            ${isSelected ? "border-purple-500/60 bg-purple-500/15 shadow-[0_0_12px_rgba(168,85,247,0.15)]" :
                              dragging?.player_tag === entry.player_tag ? "border-purple-400/50 opacity-50" :
                              "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20"}
                            ${busy ? "opacity-60 pointer-events-none" : ""}`}>
                          <div className="flex items-center gap-3">
                            <ThIcon level={entry.town_hall_level}/>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-white truncate">{entry.player_name}</p>
                              <p className="text-[10px] text-slate-600 font-mono">{entry.player_tag}</p>
                            </div>
                            {isSelected && (
                              <span className="w-5 h-5 rounded-full bg-purple-500/30 border border-purple-500/60 flex items-center justify-center shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                              </span>
                            )}
                            {status && !isSelected && <Pill variant={status.ok ? "success" : "error"}>{status.msg}</Pill>}
                            {!isSelected && !status && <span className="text-[10px] text-slate-700 shrink-0 hidden sm:block">tap to select</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Roster tab */}
            {builderTab === "roster" && (
              <div className="p-4">
                {/* Clan selector */}
                {clans.length > 1 && (
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <button onClick={() => setActiveClanIdx(i => Math.max(0, i-1))} disabled={activeClanIdx === 0}
                      className="text-slate-500 hover:text-slate-300 transition p-1 disabled:opacity-30">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    <span className="text-sm font-semibold text-white min-w-[140px] text-center truncate">{currentClan?.split(" ")[0] || "—"}</span>
                    <button onClick={() => setActiveClanIdx(i => Math.min(clans.length-1, i+1))} disabled={activeClanIdx === clans.length-1}
                      className="text-slate-500 hover:text-slate-300 transition p-1 disabled:opacity-30">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                    </button>
                  </div>
                )}
                {/* Roster completion indicator */}
                {currentClan && rosterPct !== null && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${rosterFull ? "bg-green-500/60" : "bg-purple-500/60"}`} style={{width:`${rosterPct}%`}}/>
                    </div>
                    <span className={`text-[10px] shrink-0 font-semibold ${rosterFull ? "text-green-400" : "text-slate-500"}`}>{currentClanEntries.length}/{currentFormat}</span>
                  </div>
                )}

                {currentClan && (
                  <>
                    {/* Clan meta — format toggle left, rank refresh right */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FormatToggle format={currentFormat} busy={formatBusy === currentClan} error={formatError[currentClan]} onSetFormat={f => doSetFormat(currentClan, f)}/>
                        <button type="button" title={clanAbsent[currentClan] ? "Mark active in CWL" : "Mark absent from CWL"}
                          disabled={absentBusy === currentClan}
                          onClick={() => doSetAbsent(currentClan, !clanAbsent[currentClan])}
                          className={`w-6 h-6 rounded-full flex items-center justify-center border transition disabled:opacity-50 ${clanAbsent[currentClan] ? "bg-transparent text-red-400 border-red-500/60 shadow-[0_0_6px_rgba(239,68,68,0.15)]" : "bg-white/[0.03] border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20"}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        </button>
                      </div>
                      <RankRefreshButton busy={rankBusy === currentClan} result={rankResult[currentClan]} onClick={() => doRefreshRank(currentClan)}/>
                    </div>

                    {/* Bulk assign button */}
                    {selectedTags.length > 0 && (
                      <button
                        onClick={() => {
                          const toAssign = entries.filter(e => selectedTags.includes(e.player_tag));
                          doAssignMultiple(toAssign, currentClan);
                        }}
                        disabled={bulkAssigning}
                        className="w-full mb-3 py-2.5 rounded-2xl text-xs font-semibold bg-transparent text-green-400 border border-green-500/60 shadow-[0_0_8px_rgba(74,222,128,0.12)] hover:border-green-400 hover:text-green-300 transition disabled:opacity-40">
                        {bulkAssigning
                          ? "Assigning…"
                          : `+ Assign ${selectedTags.length} player${selectedTags.length > 1 ? "s" : ""} to ${currentClan?.split(" ")[0]}`}
                      </button>
                    )}

                    {/* Drop zone */}
                    <div data-clan-zone={currentClan}
                      onDragOver={e => onDragOver(e, currentClan)} onDragLeave={onDragLeave} onDrop={e => onDrop(e, currentClan)}
                      className={`min-h-[60px] rounded-2xl border-2 border-dashed transition mb-3 flex items-center justify-center
                        ${overClan === currentClan ? "border-purple-400/60 bg-purple-500/10" : "border-white/10"}`}>
                      {overClan === currentClan
                        ? <p className="text-xs text-purple-400 animate-pulse py-3">Release to assign</p>
                        : currentClanEntries.length === 0 && <p className="text-xs text-slate-700 py-3">Drop a player here or use tap mode</p>
                      }
                    </div>

                    {/* Assigned players */}
                    <div className="space-y-1.5">
                      {currentClanEntries.map(e => (
                        <div key={e.player_tag} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <ThIcon level={e.town_hall_level} size="w-6 h-6"/>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-white truncate">{e.player_name}</p>
                                <p className="text-[10px] text-slate-600 font-mono">{e.player_tag}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <StatusToggle status={e.status} busy={statusBusy === e.player_tag} error={statusError[e.player_tag]} onSetStatus={status => doSetStatus(e, status)}/>
                              <XButton onClick={() => doUnassign(e)} busy={unassigning === e.player_tag} title="Unassign"/>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Counter pill — centred below roster */}
                    <div className="flex justify-center mt-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-transparent text-purple-400 border border-purple-500/60 shadow-[0_0_8px_rgba(168,85,247,0.12)]">
                        {currentClanEntries.length}<span className="text-slate-600">/</span>{currentFormat}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          </>)} {/* end roster tab */}

          {/* ── SETTINGS TAB ── */}
          {mainPoolTab === "settings" && (<>

          {/* ── SEASON TILE ── */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
            <button onClick={() => setShowCloseSeasonForm(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-left">
              <div>
                <p className="text-sm font-semibold text-slate-300">Season Management</p>
                <p className="text-[10px] text-slate-600 mt-0.5">{season} · Migrate or fetch CWL data</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-600 transition-transform ${showCloseSeasonForm ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            {showCloseSeasonForm && (
              <div className="px-5 pb-5 border-t border-white/10 space-y-3 pt-4">
                {/* Migrate season */}
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
                  <p className="text-xs text-amber-300 font-semibold">Migrate {season}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Records CWL ranks and advances to next month. Type <span className="text-white font-mono">CONFIRM</span> to proceed.</p>
                  <input type="text" placeholder="Type CONFIRM" value={closeSeasonConfirm} onChange={e => setCloseSeasonConfirm(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/40 transition"/>
                  <button onClick={doCloseSeason} disabled={closeSeasonConfirm !== "CONFIRM" || closeSeasonSubmitting}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold bg-transparent text-amber-400 border border-amber-500/60 hover:border-amber-400 hover:text-amber-300 transition disabled:opacity-40 disabled:cursor-not-allowed">
                    {closeSeasonSubmitting ? "Migrating…" : `Migrate ${season} → Next Season`}
                  </button>
                  {closeSeasonResult && <p className={`text-[11px] text-center ${closeSeasonResult.ok ? "text-green-400" : "text-red-400"}`}>{closeSeasonResult.message}</p>}
                </div>
                {/* Fetch CWL */}
                <button onClick={doFetchCwlData} disabled={fetchingCwl}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-transparent text-blue-400 border border-blue-500/60 hover:border-blue-400 hover:text-blue-300 transition disabled:opacity-40 flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 ${fetchingCwl ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  {fetchingCwl ? "Fetching…" : "Fetch CWL Data"}
                </button>
                {fetchCwlResult && <p className={`text-[11px] text-center ${fetchCwlResult.ok ? "text-blue-300" : "text-red-400"}`}>{fetchCwlResult.message}</p>}
              </div>
            )}
          </div>

          {/* ── CLAN MANAGER ── */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
            <button onClick={() => setActiveClanForm(v => v ? null : "add")}
              className="w-full flex items-center justify-between px-5 py-4 text-left">
              <div>
                <p className="text-sm font-semibold text-slate-300">Clan Manager</p>
                <p className="text-[10px] text-slate-600 mt-0.5">Add or remove clans · {clans.length} active</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-600 transition-transform ${activeClanForm ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            {activeClanForm && (
              <div className="px-5 pb-5 border-t border-white/10 pt-4 space-y-4">
                {/* Tab toggle */}
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
                  <div className="space-y-3">
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
                    <button type="button" onClick={doAddClan} disabled={addClanSubmitting || !addClanTag.trim() || !addClanLink.trim()}
                      className="w-full py-2.5 rounded-2xl text-xs font-semibold bg-transparent text-purple-400 border border-purple-500/60 shadow-[0_0_8px_rgba(168,85,247,0.12)] hover:border-purple-400 hover:text-purple-300 transition disabled:opacity-40">
                      {addClanSubmitting ? "Adding…" : "Add Clan"}
                    </button>
                    {addClanResult && <p className={`text-xs text-center ${addClanResult.ok ? "text-green-300" : "text-red-400"}`}>{addClanResult.message}</p>}
                  </div>
                )}

                {activeClanForm === "delete" && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-500">Type the exact clan name. Blocked if players are still assigned.</p>
                    <input type="text" placeholder="e.g. Cognition {CGN}" value={deleteClanTag} onChange={e => setDeleteClanTag(e.target.value)}
                      className="w-full rounded-2xl border border-red-500/20 bg-white/[0.04] px-3 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 transition text-sm"/>
                    <button type="button" onClick={doDeleteClan} disabled={deleteClanSubmitting || !deleteClanTag.trim()}
                      className="w-full py-2.5 rounded-2xl text-xs font-semibold bg-transparent text-red-400 border border-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.12)] hover:border-red-400 hover:text-red-300 transition disabled:opacity-40">
                      {deleteClanSubmitting ? "Deleting…" : "Delete Clan"}
                    </button>
                    {deleteClanResult && <p className={`text-xs text-center ${deleteClanResult.ok ? "text-green-300" : "text-red-400"}`}>{deleteClanResult.message}</p>}
                  </div>
                )}
              </div>
            )}
          </div>

          </>)} {/* end settings tab */}

        </div>
      )}
    </main>
  );
}