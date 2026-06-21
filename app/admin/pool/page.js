"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { BRANDING } from "../../../lib/branding";
import { TH_ICONS } from "../../../lib/icons";

/* ─── circular X (remove) button ─────────────────────────── */

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

function ThIcon({ level, size = "w-8 h-8" }) {
  const src = level ? TH_ICONS[String(level)] : null;
  if (!src) return null;
  return (
    <img
      src={src}
      alt={`TH${level}`}
      className={`${size} shrink-0`}
    />
  );
}

/* ─── constants ──────────────────────────────────────────── */

// Clan names must match the Sheet tab names (partial match is used server-side).
// These are read dynamically from the pool data itself.

/* ─── CWL Rank refresh button (admin only, once-per-season action) ─────── */

function RankRefreshButton({ busy, result, onClick }) {
  const title = busy
    ? "Refreshing…"
    : result
    ? (result.ok ? `Updated: ${result.message}` : result.message)
    : "Refresh CWL Rank from CoC API (once per season)";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title={title}
      className={`
        shrink-0 w-6 h-6 rounded-full flex items-center justify-center
        border transition disabled:opacity-50
        ${result?.ok === false
          ? "bg-red-500/10 border-red-500/30 text-red-300"
          : "bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.08] hover:text-slate-200"
        }
      `}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>
  );
}

/* ─── Confirmed / Substitute status toggle (admin only) ─────────────────── */

function StatusToggle({ status, busy, error, onSetStatus }) {
  const isConfirmed = status === "confirmed";
  const isSubstitute = status === "substitute";
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center rounded-full border border-white/10 bg-white/[0.03] p-0.5 text-[10px]">
        <button
          type="button"
          disabled={busy}
          onClick={() => onSetStatus("confirmed")}
          className={`
            px-2.5 py-1 rounded-full transition disabled:opacity-50 font-semibold
            ${isConfirmed ? "bg-green-500/30 text-green-200" : "text-slate-500 hover:text-slate-300"}
          `}
        >
          Confirmed
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onSetStatus("substitute")}
          className={`
            px-2.5 py-1 rounded-full transition disabled:opacity-50 font-semibold
            ${isSubstitute ? "bg-orange-500/30 text-orange-200" : "text-slate-500 hover:text-slate-300"}
          `}
        >
          Substitute
        </button>
      </div>

      {error && (
        <p className="text-[9px] text-red-400 text-right max-w-[140px] leading-tight">{error}</p>
      )}
    </div>
  );
}

/* ─── per-clan CWL Format toggle (admin only) ────────────────────────────── */

function FormatToggle({ format, busy, error, onSetFormat }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-400 font-mono">{format}v{format}</span>
        <div className="flex items-center rounded-full border border-white/10 bg-white/[0.03] p-0.5 text-[10px]">
          <button
            type="button"
            disabled={busy}
            onClick={() => onSetFormat(15)}
            className={`
              px-2 py-0.5 rounded-full transition disabled:opacity-50
              ${format === 15 ? "bg-purple-500/30 text-purple-200" : "text-slate-500 hover:text-slate-300"}
            `}
          >
            15
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onSetFormat(30)}
            className={`
              px-2 py-0.5 rounded-full transition disabled:opacity-50
              ${format === 30 ? "bg-purple-500/30 text-purple-200" : "text-slate-500 hover:text-slate-300"}
            `}
          >
            30
          </button>
        </div>
      </div>
      {error && (
        <p className="text-[9px] text-red-400 text-right max-w-[180px] leading-tight">{error}</p>
      )}
    </div>
  );
}

/* ─── tiny helpers ───────────────────────────────────────── */

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
    error:   "bg-red-500/20   text-red-300   border border-red-500/30",
    warn:    "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
    purple:  "bg-purple-500/20 text-purple-300 border border-purple-500/30",
    neutral: "bg-slate-500/20  text-slate-300  border border-slate-500/30",
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${c[variant]}`}>
      {children}
    </span>
  );
}

/* ─── player card (draggable) ────────────────────────────── */

function PlayerCard({ entry, isDragging, dragHandleProps = {} }) {
  return (
    <div
      className={`
        rounded-2xl border p-3.5 select-none
        transition cursor-grab active:cursor-grabbing
        ${isDragging
          ? "border-purple-400/50 bg-purple-500/10 shadow-lg shadow-purple-500/10 scale-[1.02]"
          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20"
        }
      `}
      {...dragHandleProps}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-sm text-white truncate">{entry.player_name}</p>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{entry.player_tag}</p>
        </div>
        <div className="shrink-0">
          {entry.assigned_clan
            ? <Pill variant="success">{entry.assigned_clan.split(" ")[0]}</Pill>
            : <Pill variant="neutral">Pool</Pill>
          }
        </div>
      </div>
    </div>
  );
}

/* ─── clan drop zone ─────────────────────────────────────── */

function ClanZone({ clan, assignedEntries, isOver, dropRef }) {
  return (
    <div
      ref={dropRef}
      className={`
        rounded-3xl border min-h-[120px] p-4 transition
        ${isOver
          ? "border-purple-400/50 bg-purple-500/5"
          : "border-white/10 bg-white/[0.02]"
        }
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-sm text-white truncate">{clan}</p>
        <Pill variant="purple">{assignedEntries.length}</Pill>
      </div>
      <div className="space-y-2">
        {assignedEntries.length === 0 && (
          <p className="text-xs text-slate-600 text-center py-4">
            {isOver ? "Drop here" : "No players assigned yet"}
          </p>
        )}
        {assignedEntries.map(e => (
          <div key={e.player_tag} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <p className="text-xs font-medium text-white">{e.player_name}</p>
            <p className="text-[10px] text-slate-600 font-mono">{e.player_tag}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── main component ─────────────────────────────────────── */

export default function AdminPoolPage() {
  /* --- auth --- */
  const [pin,        setPin]        = useState("");
  const [pinInput,   setPinInput]   = useState("");
  const [pinError,   setPinError]   = useState(false);
  const [authed,     setAuthed]     = useState(false);

  /* --- data --- */
  const [season,  setSeason]  = useState(null);
  const [entries, setEntries] = useState([]);
  const [clans,   setClans]   = useState([]);
  const [thLevels, setThLevels] = useState({}); // { [player_tag]: number }
  const [clanFormats, setClanFormats] = useState({}); // { [clan]: 15 | 30 }
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  /* --- drag state (vanilla HTML5 DnD — no extra lib needed) --- */
  const [dragging,  setDragging]  = useState(null); // entry object
  const [overClan,  setOverClan]  = useState(null); // clan string

  /* --- assignment feedback --- */
  const [assignStatus, setAssignStatus] = useState({}); // { [tag]: {ok,msg} }
  const [assigning,    setAssigning]    = useState(null);

  /* --- item 5: unassign / status / format feedback --- */
  const [unassigning,  setUnassigning]  = useState(null); // tag currently being unassigned
  const [statusBusy,   setStatusBusy]   = useState(null); // tag currently toggling status
  const [statusError,  setStatusError]  = useState({});   // { [tag]: message }
  const [formatBusy,   setFormatBusy]   = useState(null); // clan currently toggling format
  const [formatError,  setFormatError]  = useState({});   // { [clan]: message }

  /* --- item 6: CWL Rank refresh feedback --- */
  const [rankBusy,  setRankBusy]  = useState(null); // clan currently refreshing rank
  const [rankResult, setRankResult] = useState({});  // { [clan]: {ok, message} }

  /* --- load pool data --- */
  async function loadPool(savedPin) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/pool", {
        headers: { "x-officer-pin": savedPin },
      });
      if (res.status === 401) { setPinError(true); setAuthed(false); return; }
      const data = await res.json();
      setSeason(data.season);
      setEntries(data.entries || []);
      setClanFormats(data.clanFormats || {});
      // derive unique clan list from assigned entries + a fallback static list
      const assignedClans = [...new Set(
        (data.entries || [])
          .filter(e => e.assigned_clan)
          .map(e => e.assigned_clan)
      )];
      // We also want unassigned clans visible — fetch from roster API
      const rosterRes = await fetch("/api/roster");
      const roster    = await rosterRes.json();
      const rosterClans = [...new Set(roster.map(p => p.clan))];
      const allClans  = [...new Set([...rosterClans, ...assignedClans])].sort();
      setClans(allClans);

      // fetch TH levels for every player currently in the pool, in one
      // batched call rather than one CoC request per pill
      const tags = (data.entries || []).map(e => e.player_tag);
      if (tags.length > 0) {
        try {
          const thRes = await fetch("/api/admin/th-levels", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tags }),
          });
          const thData = await thRes.json();
          setThLevels(thData.thLevels || {});
        } catch {
          // non-fatal — pills just render without a TH icon if this fails
        }
      }
    } catch {
      setError("Couldn't load pool data — check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function handlePinSubmit(e) {
    e.preventDefault();
    setPin(pinInput);
    setAuthed(true);
    setPinError(false);
    loadPool(pinInput);
  }

  /* --- drag handlers --- */
  function onDragStart(entry) {
    setDragging(entry);
  }
  function onDragEnd() {
    setDragging(null);
    setOverClan(null);
  }
  function onDragOver(e, clan) {
    e.preventDefault();
    setOverClan(clan);
  }
  function onDragLeave() {
    setOverClan(null);
  }
  async function onDrop(e, clan) {
    e.preventDefault();
    setOverClan(null);
    if (!dragging) return;
    if (dragging.assigned_clan === clan) { setDragging(null); return; }
    await doAssign(dragging, clan);
    setDragging(null);
  }

  /* --- assignment call --- */
  async function doAssign(entry, clan) {
    setAssigning(entry.player_tag);
    try {
      const res = await fetch("/api/admin/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-officer-pin": pin,
        },
        body: JSON.stringify({
          tag:        entry.player_tag,
          playerName: entry.player_name,
          clan,
          // assignPlayerToRoster has always accepted townHall and would
          // write it correctly — the gap was purely that nothing on this
          // page ever sent it, leaving the Sheet's Town Hall column
          // permanently blank on every assignment. thLevels is already
          // fetched on page load for the TH icon (item 4); reusing it
          // here closes that gap with no new CoC API calls needed.
          townHall:   thLevels[entry.player_tag] || "",
          season,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAssignStatus(prev => ({
          ...prev,
          [entry.player_tag]: { ok: true, msg: `→ ${clan}` },
        }));
        // optimistically update local state
        setEntries(prev =>
          prev.map(e =>
            e.player_tag === entry.player_tag
              ? { ...e, assigned_clan: clan, assigned_at: new Date().toISOString() }
              : e
          )
        );
      } else {
        setAssignStatus(prev => ({
          ...prev,
          [entry.player_tag]: { ok: false, msg: data.error || "Failed" },
        }));
      }
    } catch {
      setAssignStatus(prev => ({
        ...prev,
        [entry.player_tag]: { ok: false, msg: "Network error" },
      }));
    } finally {
      setAssigning(null);
    }
  }

  /* --- item 5: unassign (admin X button) --- */
  async function doUnassign(entry) {
    setUnassigning(entry.player_tag);
    try {
      const res = await fetch("/api/admin/unassign", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify({ tag: entry.player_tag }),
      });
      const data = await res.json();
      if (res.ok) {
        // optimistic local update — player goes back to the unassigned pool
        setEntries(prev =>
          prev.map(e =>
            e.player_tag === entry.player_tag
              ? { ...e, assigned_clan: null, assigned_at: null, status: null }
              : e
          )
        );
      } else {
        setStatusError(prev => ({ ...prev, [entry.player_tag]: data.error || "Unassign failed" }));
      }
    } catch {
      setStatusError(prev => ({ ...prev, [entry.player_tag]: "Network error" }));
    } finally {
      setUnassigning(null);
    }
  }

  /* --- item 5: Confirmed/Substitute status toggle --- */
  async function doSetStatus(entry, status) {
    setStatusBusy(entry.player_tag);
    setStatusError(prev => ({ ...prev, [entry.player_tag]: null }));
    try {
      const res = await fetch("/api/admin/status", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify({ tag: entry.player_tag, clan: entry.assigned_clan, status }),
      });
      const data = await res.json();
      if (res.ok) {
        setEntries(prev =>
          prev.map(e => e.player_tag === entry.player_tag ? { ...e, status } : e)
        );
      } else {
        setStatusError(prev => ({ ...prev, [entry.player_tag]: data.error || "Status update failed" }));
      }
    } catch {
      setStatusError(prev => ({ ...prev, [entry.player_tag]: "Network error" }));
    } finally {
      setStatusBusy(null);
    }
  }

  /* --- item 5: CWL Format toggle (per clan) --- */
  async function doSetFormat(clan, format) {
    setFormatBusy(clan);
    setFormatError(prev => ({ ...prev, [clan]: null }));
    try {
      const res = await fetch("/api/admin/format", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify({ clan, format }),
      });
      const data = await res.json();
      if (res.ok) {
        setClanFormats(prev => ({ ...prev, [clan]: format }));
      } else {
        setFormatError(prev => ({ ...prev, [clan]: data.error || "Format update failed" }));
      }
    } catch {
      setFormatError(prev => ({ ...prev, [clan]: "Network error" }));
    } finally {
      setFormatBusy(null);
    }
  }

  /* --- item 6: CWL Rank refresh (per clan, manual, once-per-season) --- */
  async function doRefreshRank(clan) {
    setRankBusy(clan);
    setRankResult(prev => ({ ...prev, [clan]: null }));
    try {
      const res = await fetch("/api/admin/cwl-rank", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify({ clan }),
      });
      const data = await res.json();
      if (res.ok) {
        setRankResult(prev => ({ ...prev, [clan]: { ok: true, message: data.rank } }));
      } else {
        setRankResult(prev => ({ ...prev, [clan]: { ok: false, message: data.error || "Refresh failed" } }));
      }
    } catch {
      setRankResult(prev => ({ ...prev, [clan]: { ok: false, message: "Network error" } }));
    } finally {
      setRankBusy(null);
    }
  }

  /* --- derived lists --- */
  const unassigned = entries.filter(e => !e.assigned_clan);
  const assigned   = entries.filter(e =>  e.assigned_clan);

  /* ─── PIN gate ───────────────────────────────────────── */
  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center
        bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] p-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2
            w-[100vw] max-w-[600px] h-[100vw] max-h-[600px]
            bg-purple-500/10 blur-3xl rounded-full" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-sm"
        >
          <Card>
            <div className="text-center mb-6">
              <img src={BRANDING.cwlhub} alt="CWL Hub" className="w-14 h-14 mx-auto mb-4" />
              <h1 className="text-xl font-bold">Admin Access</h1>
              <p className="text-slate-500 text-sm mt-1">Enter your officer PIN to manage the pool</p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input
                type="password"
                placeholder="Officer PIN"
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                className="
                  w-full rounded-2xl border border-white/10 bg-white/[0.04]
                  px-5 py-3.5 text-white placeholder:text-slate-600
                  focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.06] transition
                  text-center tracking-widest text-lg
                "
              />
              {pinError && (
                <p className="text-red-400 text-xs text-center">Incorrect PIN</p>
              )}
              <button
                type="submit"
                disabled={!pinInput}
                className="
                  w-full py-3.5 rounded-2xl font-semibold text-sm
                  bg-purple-600/40 text-purple-100 border border-purple-500/30
                  hover:bg-purple-600/60 hover:text-white transition
                  disabled:opacity-40 disabled:cursor-not-allowed
                "
              >
                Enter
              </button>
            </form>
          </Card>

          <div className="mt-4 text-center">
            <Link href="/" className="text-xs text-slate-600 hover:text-slate-400 transition">
              ← Back to Hub
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  /* ─── main admin UI ──────────────────────────────────── */
  return (
    <main className="
      min-h-screen overflow-x-hidden w-full max-w-full
      bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f]
      text-white p-4 pb-16
    ">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2
          w-[100vw] max-w-[600px] h-[100vw] max-h-[600px]
          bg-purple-500/10 blur-3xl rounded-full" />
      </div>

      {/* header */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <Link href="/" className="text-sm text-slate-500 hover:text-white transition flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Hub
        </Link>
        <button
          onClick={() => loadPool(pin)}
          className="text-xs text-slate-500 hover:text-white transition flex items-center gap-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* title + season */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-6"
      >
        <Card className="text-center py-5">
          <h1 className="text-2xl font-bold">Pool Manager</h1>
          {season && (
            <p className="text-slate-400 text-sm mt-1">
              <span className="text-purple-300 font-semibold">{season}</span> · {entries.length} in pool
              · {unassigned.length} unassigned
            </p>
          )}
        </Card>
      </motion.div>

      {loading && (
        <div className="relative z-10 text-center text-slate-500 py-12 animate-pulse">
          Loading pool…
        </div>
      )}

      {error && (
        <div className="relative z-10 text-center text-red-400 text-sm py-6">{error}</div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="relative z-10 text-center text-slate-600 py-12">
          No players have signed up for {season} yet.
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="relative z-10 space-y-6">

          {/* ── unassigned pool ── */}
          <section>
            <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3 ml-1">
              Available Pool ({unassigned.length})
            </h2>
            <Card>
              {unassigned.length === 0 ? (
                <p className="text-slate-600 text-sm text-center py-4">All players have been assigned.</p>
              ) : (
                <div className="space-y-2">
                  {unassigned.map(entry => {
                    const status = assignStatus[entry.player_tag];
                    const busy   = assigning === entry.player_tag;
                    return (
                      <motion.div
                        key={entry.player_tag}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        draggable
                        onDragStart={() => onDragStart(entry)}
                        onDragEnd={onDragEnd}
                        className={`
                          rounded-2xl border p-3.5 select-none
                          transition cursor-grab active:cursor-grabbing
                          ${dragging?.player_tag === entry.player_tag
                            ? "border-purple-400/50 bg-purple-500/10 opacity-50"
                            : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20"
                          }
                          ${busy ? "opacity-60 pointer-events-none" : ""}
                        `}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <ThIcon level={thLevels[entry.player_tag]} />
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-white truncate">{entry.player_name}</p>
                              <p className="text-xs text-slate-500 font-mono mt-0.5">{entry.player_tag}</p>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            {busy && (
                              <span className="text-xs text-slate-500 animate-pulse">Saving…</span>
                            )}
                            {status && !busy && (
                              <Pill variant={status.ok ? "success" : "error"}>{status.msg}</Pill>
                            )}
                            {!status && !busy && (
                              <span className="text-xs text-slate-600">drag to assign</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </Card>
          </section>

          {/* ── clan drop zones ── */}
          <section>
            <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3 ml-1">
              Clan Rosters
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {clans.map(clan => {
                const clanEntries = assigned.filter(e => e.assigned_clan === clan);
                const isOver = overClan === clan;
                const format = clanFormats[clan] ?? 15;
                return (
                  <div
                    key={clan}
                    onDragOver={e => onDragOver(e, clan)}
                    onDragLeave={onDragLeave}
                    onDrop={e => onDrop(e, clan)}
                    className={`
                      rounded-3xl border min-h-[140px] p-4 transition
                      ${isOver
                        ? "border-purple-400/50 bg-purple-500/5 shadow-lg shadow-purple-500/5"
                        : "border-white/10 bg-white/[0.02]"
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-3 gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-semibold text-sm text-white truncate">{clan}</p>
                        <Pill variant="purple">{clanEntries.length}</Pill>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <FormatToggle
                          format={format}
                          busy={formatBusy === clan}
                          error={formatError[clan]}
                          onSetFormat={(f) => doSetFormat(clan, f)}
                        />
                        <RankRefreshButton
                          busy={rankBusy === clan}
                          result={rankResult[clan]}
                          onClick={() => doRefreshRank(clan)}
                        />
                      </div>
                    </div>

                    {clanEntries.length === 0 && !isOver && (
                      <p className="text-xs text-slate-600 text-center py-3">Drop a player here</p>
                    )}
                    {isOver && (
                      <p className="text-xs text-purple-400 text-center py-3 animate-pulse">Release to assign</p>
                    )}

                    <div className="space-y-1.5 mt-1">
                      {clanEntries.map(e => (
                        <div key={e.player_tag} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 relative">
                          <div className="absolute top-1.5 right-1.5">
                            <XButton
                              onClick={() => doUnassign(e)}
                              busy={unassigning === e.player_tag}
                              title="Unassign — return to pool"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2 pr-6">
                            <div className="flex items-center gap-2 min-w-0">
                              <ThIcon level={thLevels[e.player_tag]} size="w-6 h-6" />
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-white truncate">{e.player_name}</p>
                                <p className="text-[10px] text-slate-600 font-mono">{e.player_tag}</p>
                              </div>
                            </div>
                            <StatusToggle
                              status={e.status}
                              busy={statusBusy === e.player_tag}
                              error={statusError[e.player_tag]}
                              onSetStatus={(status) => doSetStatus(e, status)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── already assigned summary ── */}
          {assigned.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3 ml-1">
                Assigned ({assigned.length})
              </h2>
              <Card>
                <div className="space-y-2">
                  {assigned.map(e => (
                    <div key={e.player_tag} className="flex items-center justify-between gap-3 py-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <ThIcon level={thLevels[e.player_tag]} size="w-6 h-6" />
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-white">{e.player_name}</span>
                          <span className="text-xs text-slate-600 font-mono ml-2">{e.player_tag}</span>
                        </div>
                      </div>
                      <Pill variant="success">{e.assigned_clan}</Pill>
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          )}

        </div>
      )}
    </main>
  );
}
