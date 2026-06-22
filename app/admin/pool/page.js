"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { BRANDING } from "../../../lib/branding";
import { TH_ICONS, CWL_ICONS } from "../../../lib/icons";
import DiscordWidget from "../../components/DiscordWidget";

/* ─── skeleton loading placeholder ───────────────────────────
   Same treatment as the homepage and signup page — a pulsing
   translucent block shaped like the content it stands in for. */
function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse rounded-xl bg-white/[0.06] ${className}`} />
  );
}

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

  // Discord session — used to gate the sessionStorage PIN-skip.
  // Only Discord-authenticated admins get the remembered PIN benefit;
  // non-Discord admins always see the PIN prompt (unchanged behaviour).
  const { data: discordSession, status: discordStatus } = useSession();
  const SESSION_KEY = "cwl_admin_pin_confirmed";

  // On mount: if the admin is signed in with Discord AND has already
  // confirmed their PIN this browser session, skip the prompt entirely
  // and restore the saved PIN so API calls keep working. This check
  // runs once after the Discord session resolves so we don't flash the
  // PIN gate briefly before hiding it.
  useEffect(() => {
    if (discordStatus !== "authenticated") return;
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      setPin(saved);
      setAuthed(true);
      loadPool(saved);
    }
  }, [discordStatus]);

  // When Discord sign-out happens mid-session, clear the stored PIN
  // so the next visitor (or the same admin after re-sign-in) must
  // re-confirm. This runs whenever discordStatus changes to
  // "unauthenticated" while authed is true.
  useEffect(() => {
    if (discordStatus === "unauthenticated") {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [discordStatus]);

  /* --- data --- */
  const [season,  setSeason]  = useState(null);
  const [entries, setEntries] = useState([]);
  const [clans,   setClans]   = useState([]);
  const [clanFormats, setClanFormats] = useState({}); // { [clan]: 15 | 30 }
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // TH refresh button (item 15)
  const [thRefreshing, setThRefreshing] = useState(false);
  const [thRefreshResult, setThRefreshResult] = useState(null); // {ok, message}

  // toggle between Available Pool and Assigned views (item 16)
  const [poolTab, setPoolTab] = useState("available"); // "available" | "assigned"

  /* --- drag state (vanilla HTML5 DnD — no extra lib needed) --- */
  const [dragging,  setDragging]  = useState(null); // entry object
  const [overClan,  setOverClan]  = useState(null); // clan string

  /* --- clan tile reorder drag state (item 14) --- */
  const [draggingClan, setDraggingClan] = useState(null); // clan name being dragged
  const [overClanTile, setOverClanTile] = useState(null); // clan tile being hovered

  /* --- assignment feedback --- */
  const [assignStatus, setAssignStatus] = useState({}); // { [tag]: {ok,msg} }
  const [assigning,    setAssigning]    = useState(null);

  /* --- item 5: unassign / status / format feedback --- */
  const [unassigning,  setUnassigning]  = useState(null);
  const [statusBusy,   setStatusBusy]   = useState(null);
  const [statusError,  setStatusError]  = useState({});
  const [formatBusy,   setFormatBusy]   = useState(null);
  const [formatError,  setFormatError]  = useState({});

  /* --- item 6: CWL Rank refresh feedback --- */
  const [rankBusy,  setRankBusy]  = useState(null);
  const [rankResult, setRankResult] = useState({});

  /* --- item 7: Add / Delete Clan forms (mutually exclusive) --- */
  const [activeClanForm, setActiveClanForm] = useState(null);

  const [addClanTag,  setAddClanTag]  = useState("");
  const [addClanLink, setAddClanLink] = useState("");
  const [addClanRank, setAddClanRank] = useState("");
  const [addClanSuggestedName, setAddClanSuggestedName] = useState(null);
  const [addClanLookupBusy, setAddClanLookupBusy] = useState(false);
  const [addClanSubmitting, setAddClanSubmitting] = useState(false);
  const [addClanResult, setAddClanResult] = useState(null);

  const [deleteClanTag, setDeleteClanTag] = useState("");
  const [deleteClanSubmitting, setDeleteClanSubmitting] = useState(false);
  const [deleteClanResult, setDeleteClanResult] = useState(null);

  // Close Season (item 30) — type CONFIRM to unlock, same pattern as Delete Clan
  const [showCloseSeasonForm, setShowCloseSeasonForm] = useState(false);
  const [closeSeasonConfirm, setCloseSeasonConfirm] = useState("");
  const [closeSeasonSubmitting, setCloseSeasonSubmitting] = useState(false);
  const [closeSeasonResult, setCloseSeasonResult] = useState(null);

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
      // TH level now comes from Neon (accounts.town_hall_level, item 15)
      // via getPoolEntries JOIN — no separate batch CoC API call needed.
      // entries[*].town_hall_level is the truth source for TH icons
      // and sorting. Admins can click the pool-tile refresh button to
      // batch-update TH for all pool players from CoC when needed.
      setClans(data.clanNames || []);
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
    // If the admin is signed in with Discord, remember the confirmed PIN
    // for the rest of this browser session so they won't be re-prompted
    // when navigating back to this page. The value is cleared automatically
    // when the browser tab/session closes, or when they sign out of Discord.
    if (discordStatus === "authenticated") {
      sessionStorage.setItem(SESSION_KEY, pinInput);
    }
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

  // Touch equivalent of the above. Same rationale as the signup page's
  // account reorder — HTML5's native draggable/onDragOver/onDrop API
  // never fires from touch gestures at all, so dragging a player onto a
  // clan silently did nothing on mobile without this.
  //
  // Same long-press threshold and the same fix as the signup page's
  // reorder: touch-action alone can't stop native scrolling reactively
  // once a drag is confirmed mid-gesture (it's a static decision the
  // browser locks in at touchstart), so once the long-press fires, a
  // touchmove listener is attached manually via addEventListener with
  // { passive: false } — not React's onTouchMove JSX prop, which is
  // always passive and silently ignores preventDefault() — so native
  // scrolling can actually be stopped once a drag is genuinely active.
  const LONG_PRESS_MS = 280;
  const MOVE_CANCEL_PX = 10;
  const touchPlayerStateRef = useRef({
    timer: null, startX: 0, startY: 0, entry: null, active: false,
    moveListener: null, endListener: null, cancelListener: null,
  });

  function cleanupPlayerTouchListeners() {
    const state = touchPlayerStateRef.current;
    if (state.moveListener) document.removeEventListener("touchmove", state.moveListener);
    if (state.endListener) document.removeEventListener("touchend", state.endListener);
    if (state.cancelListener) document.removeEventListener("touchcancel", state.cancelListener);
    state.moveListener = null;
    state.endListener = null;
    state.cancelListener = null;
  }

  function onTouchStartPlayer(e, entry) {
    const touch = e.touches[0];
    if (!touch) return;

    const state = touchPlayerStateRef.current;
    state.startX = touch.clientX;
    state.startY = touch.clientY;
    state.entry = entry;
    state.active = false;

    state.timer = setTimeout(() => {
      state.active = true;
      onDragStart(entry);

      // No CSS transform or pointer-events tricks needed here —
      // the card stays visually in the pool list at reduced opacity
      // (via isDragging) while clan zones highlight as the finger
      // crosses over them. This eliminates the transform/pointer-events
      // conflict that caused snap-back and delayed visual updates.
      const moveListener = (moveEvent) => {
        if (moveEvent.cancelable) moveEvent.preventDefault();
        const t = moveEvent.touches[0];
        if (!t) return;

        const el = document.elementFromPoint(t.clientX, t.clientY);
        const zone = el?.closest("[data-clan-zone]");
        if (!zone) {
          setOverClan(null);
          return;
        }

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

        // Clear drag visual state immediately — no snap-back.
        setDragging(null);
        setOverClan(null);

        if (!clan || !entryNow || entryNow.assigned_clan === clan) {
          state.entry = null;
          state.active = false;
          return;
        }

        // Optimistic update: immediately move the card into the clan
        // roster in local state, before the API call completes. If
        // the save fails, revert to the previous entries state.
        const previousEntries = await new Promise(resolve => {
          setEntries(prev => {
            resolve(prev);
            return prev.map(e =>
              e.player_tag === entryNow.player_tag
                ? { ...e, assigned_clan: clan, assigned_at: new Date().toISOString() }
                : e
            );
          });
        });

        try {
          const res = await fetch("/api/admin/assign", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-officer-pin": pin,
            },
            body: JSON.stringify({
              tag:        entryNow.player_tag,
              playerName: entryNow.player_name,
              clan,
              townHall:   entryNow.town_hall_level || "",
              season,
            }),
          });

          if (!res.ok) {
            // Revert the optimistic update
            setEntries(previousEntries);
            setAssignStatus(prev => ({
              ...prev,
              [entryNow.player_tag]: { ok: false, msg: "Assignment failed" },
            }));
          } else {
            setAssignStatus(prev => ({
              ...prev,
              [entryNow.player_tag]: { ok: true, msg: `→ ${clan}` },
            }));
          }
        } catch {
          setEntries(previousEntries);
        }

        state.entry = null;
        state.active = false;
      };

      state.moveListener = moveListener;
      state.endListener = finish;
      state.cancelListener = finish;
      document.addEventListener("touchmove", moveListener, { passive: false });
      document.addEventListener("touchend", finish, { passive: true });
      document.addEventListener("touchcancel", finish, { passive: true });
    }, LONG_PRESS_MS);
  }

  function onTouchMovePlayer(e) {
    const state = touchPlayerStateRef.current;
    if (state.active || !state.entry) return; // confirmed drags are handled by the manual listener above

    const touch = e.touches[0];
    if (!touch) return;

    const dx = Math.abs(touch.clientX - state.startX);
    const dy = Math.abs(touch.clientY - state.startY);
    if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) {
      clearTimeout(state.timer);
      state.entry = null;
    }
  }

  function onTouchEndPlayer() {
    const state = touchPlayerStateRef.current;
    clearTimeout(state.timer);
    if (!state.active) {
      state.entry = null;
    }
  }

  /* --- clan tile reorder handlers (item 14) ─────────────────────────────
     Desktop: standard HTML5 drag-and-drop, same pattern as player-to-clan.
     Mobile: long-press touch with optimistic UI and revert on failure,
     same pattern as the signup page's account reorder and the player cards.  */

  // ── Desktop handlers ──
  function onClanTileDragStart(clan) {
    setDraggingClan(clan);
  }

  function onClanTileDragEnd() {
    setDraggingClan(null);
    setOverClanTile(null);
  }

  function onClanTileDragOver(e, clan) {
    e.preventDefault();
    if (clan === draggingClan) return;
    setOverClanTile(clan);
    setClans(prev => {
      const fromIndex = prev.indexOf(draggingClan);
      const toIndex = prev.indexOf(clan);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const next = [...prev];
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, draggingClan);
      return next;
    });
  }

  function onClanTileDragLeave() {
    setOverClanTile(null);
  }

  async function onClanTileDrop(e, clan) {
    e.preventDefault();
    setDraggingClan(null);
    setOverClanTile(null);

    // Persist current order — already optimistically updated during the drag.
    let currentOrder = null;
    setClans(prev => { currentOrder = [...prev]; return prev; });

    try {
      const res = await fetch("/api/admin/clans/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify({ orderedNames: currentOrder }),
      });
      if (!res.ok) {
        // Non-fatal: the visual order is already correct; just note
        // the save failed silently — next page load will restore the
        // server-persisted order.
        console.error("Clan reorder save failed");
      }
    } catch {
      console.error("Clan reorder network error");
    }
  }

  // ── Mobile touch handlers ──
  const touchClanStateRef = useRef({
    timer: null, startX: 0, startY: 0, clan: null, active: false,
    moveListener: null, endListener: null, cancelListener: null,
    snapshot: null,
  });

  function cleanupClanTouchListeners() {
    const state = touchClanStateRef.current;
    if (state.moveListener) document.removeEventListener("touchmove", state.moveListener);
    if (state.endListener) document.removeEventListener("touchend", state.endListener);
    if (state.cancelListener) document.removeEventListener("touchcancel", state.cancelListener);
    state.moveListener = null;
    state.endListener = null;
    state.cancelListener = null;
  }

  function onClanTileTouchStart(e, clan) {
    const touch = e.touches[0];
    if (!touch) return;

    const state = touchClanStateRef.current;
    state.startX = touch.clientX;
    state.startY = touch.clientY;
    state.clan = clan;
    state.active = false;

    state.timer = setTimeout(() => {
      state.active = true;
      setDraggingClan(clan);

      // Snapshot current order for revert on API failure.
      setClans(prev => { state.snapshot = [...prev]; return prev; });

      const moveListener = (moveEvent) => {
        if (moveEvent.cancelable) moveEvent.preventDefault();
        const t = moveEvent.touches[0];
        if (!t) return;

        const el = document.elementFromPoint(t.clientX, t.clientY);
        const tile = el?.closest("[data-clan-tile]");
        if (!tile) return;

        const overClanName = tile.getAttribute("data-clan-tile");
        if (!overClanName || overClanName === state.clan) return;

        setOverClanTile(overClanName);
        setClans(prev => {
          const fromIndex = prev.indexOf(state.clan);
          const toIndex = prev.indexOf(overClanName);
          if (fromIndex === -1 || toIndex === -1) return prev;
          const next = [...prev];
          next.splice(fromIndex, 1);
          next.splice(toIndex, 0, state.clan);
          return next;
        });
      };

      const finish = async () => {
        cleanupClanTouchListeners();
        setDraggingClan(null);
        setOverClanTile(null);

        let currentOrder = null;
        setClans(prev => { currentOrder = [...prev]; return prev; });

        try {
          const res = await fetch("/api/admin/clans/reorder", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-officer-pin": pin },
            body: JSON.stringify({ orderedNames: currentOrder }),
          });
          if (!res.ok && state.snapshot) {
            setClans(state.snapshot);
          }
        } catch {
          if (state.snapshot) setClans(state.snapshot);
        }

        state.clan = null;
        state.active = false;
        state.snapshot = null;
      };

      state.moveListener = moveListener;
      state.endListener = finish;
      state.cancelListener = finish;
      document.addEventListener("touchmove", moveListener, { passive: false });
      document.addEventListener("touchend", finish, { passive: true });
      document.addEventListener("touchcancel", finish, { passive: true });
    }, 280);
  }

  function onClanTileTouchMove(e) {
    const state = touchClanStateRef.current;
    if (state.active || !state.clan) return;

    const touch = e.touches[0];
    if (!touch) return;

    const dx = Math.abs(touch.clientX - state.startX);
    const dy = Math.abs(touch.clientY - state.startY);
    if (dx > 10 || dy > 10) {
      clearTimeout(state.timer);
      state.clan = null;
    }
  }

  function onClanTileTouchEnd() {
    const state = touchClanStateRef.current;
    clearTimeout(state.timer);
    if (!state.active) {
      state.clan = null;
    }
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
          // townHall now comes from Neon (accounts.town_hall_level, item 15)
          // rather than thLevels state fetched via CoC API on page load.
          townHall:   entry.town_hall_level || "",
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

  /* --- item 15: batch TH refresh for all pool players --- */
  async function doRefreshThLevels() {
    setThRefreshing(true);
    setThRefreshResult(null);
    try {
      const res = await fetch("/api/admin/pool/refresh-th", {
        method: "POST",
        headers: { "x-officer-pin": pin },
      });
      const data = await res.json();
      if (res.ok) {
        // Re-load the pool so updated TH levels are reflected in entries
        await loadPool(pin);
        setThRefreshResult({ ok: true, message: `Updated ${data.count ?? 0} player${data.count !== 1 ? "s" : ""}` });
      } else {
        setThRefreshResult({ ok: false, message: data.error || "Refresh failed" });
      }
    } catch {
      setThRefreshResult({ ok: false, message: "Network error" });
    } finally {
      setThRefreshing(false);
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

  /* --- item 7: Add / Delete Clan --- */

  // Toggles which form (if any) is open — opening one always closes the
  // other, per the confirmed mutually-exclusive requirement. Also resets
  // each form's own fields/results when switching, so re-opening a form
  // doesn't show stale state from a previous attempt.
  function toggleClanForm(form) {
    setActiveClanForm(prev => (prev === form ? null : form));
    setAddClanTag("");
    setAddClanLink("");
    setAddClanRank("");
    setAddClanSuggestedName(null);
    setAddClanResult(null);
    setDeleteClanTag("");
    setDeleteClanResult(null);
  }

  // Lightweight lookup as the admin enters a Clan Tag — pre-fills the
  // suggested clan name and CWL Rank, but doesn't create anything. The
  // admin can still override the rank field manually afterward,
  // including typing "Unranked" for a clan that's never done CWL.
  async function doLookupClan() {
    if (!addClanTag.trim()) return;
    setAddClanLookupBusy(true);
    setAddClanResult(null);
    try {
      const res = await fetch("/api/admin/clans/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify({ clanTag: addClanTag.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setAddClanSuggestedName(data.clanName);
        setAddClanRank(data.suggestedRank || "Unranked");
      } else {
        setAddClanSuggestedName(null);
        setAddClanResult({ ok: false, message: data.error || "Lookup failed" });
      }
    } catch {
      setAddClanResult({ ok: false, message: "Network error" });
    } finally {
      setAddClanLookupBusy(false);
    }
  }

  async function doAddClan(e) {
    e.preventDefault();
    if (!addClanTag.trim() || !addClanLink.trim()) return;
    setAddClanSubmitting(true);
    setAddClanResult(null);
    try {
      const res = await fetch("/api/admin/clans/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify({
          clanTag: addClanTag.trim(),
          clanLink: addClanLink.trim(),
          cwlRank: addClanRank.trim() || "Unranked",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAddClanResult({ ok: true, message: `${data.clanName} added.` });
        await loadPool(pin); // refresh so the new clan appears immediately
      } else {
        setAddClanResult({ ok: false, message: data.error || "Failed to add clan" });
      }
    } catch {
      setAddClanResult({ ok: false, message: "Network error" });
    } finally {
      setAddClanSubmitting(false);
    }
  }

  /* --- item 30: Close Season --- */
  async function doCloseSeason(e) {
    e.preventDefault();
    if (closeSeasonConfirm !== "CONFIRM") return;
    setCloseSeasonSubmitting(true);
    setCloseSeasonResult(null);
    try {
      const res = await fetch("/api/admin/season/close", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify({ confirm: "CONFIRM" }),
      });
      const data = await res.json();
      if (res.ok) {
        setCloseSeasonResult({
          ok: true,
          message: `${data.closed} closed → ${data.opened} now open`,
        });
        setCloseSeasonConfirm("");
        setShowCloseSeasonForm(false);
        // Reload pool so the new season label is reflected immediately
        await loadPool(pin);
      } else {
        setCloseSeasonResult({ ok: false, message: data.error || "Failed to close season" });
      }
    } catch {
      setCloseSeasonResult({ ok: false, message: "Network error" });
    } finally {
      setCloseSeasonSubmitting(false);
    }
  }

  async function doDeleteClan(e) {
    e.preventDefault();
    if (!deleteClanTag.trim()) return;
    setDeleteClanSubmitting(true);
    setDeleteClanResult(null);
    try {
      const res = await fetch("/api/admin/clans/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify({ clanName: deleteClanTag.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeleteClanResult({ ok: true, message: `${data.clanName} deleted.` });
        await loadPool(pin); // refresh so the removed clan disappears immediately
      } else {
        setDeleteClanResult({ ok: false, message: data.error || "Failed to delete clan" });
      }
    } catch {
      setDeleteClanResult({ ok: false, message: "Network error" });
    } finally {
      setDeleteClanSubmitting(false);
    }
  }

  /* --- derived lists --- */
  const unassigned = entries
    .filter(e => !e.assigned_clan)
    .sort((a, b) => (b.town_hall_level ?? 0) - (a.town_hall_level ?? 0));
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

      {/* header — Hub left, Discord centred, Refresh right, all in one row */}
      <div className="relative z-10 grid grid-cols-3 items-center mb-6">
        <Link href="/" className="text-sm text-slate-500 hover:text-white transition flex items-center gap-1.5 justify-self-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Hub
        </Link>
        <div className="flex justify-center">
          <DiscordWidget variant="center" />
        </div>
        <button
          onClick={() => loadPool(pin)}
          className="text-xs text-slate-500 hover:text-white transition flex items-center gap-1.5 justify-self-end"
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
          <h1 className="text-2xl font-thin tracking-widest">Pool Manager</h1>
          {season ? (
            <p className="text-slate-400 text-sm mt-1">
              <span className="text-purple-300 font-semibold">{season}</span> · {entries.length} in pool
              · {unassigned.length} unassigned
            </p>
          ) : loading ? (
            <div className="flex justify-center mt-2">
              <Skeleton className="w-48 h-4" />
            </div>
          ) : null}

          {/* Add / Delete Clan — pill style, matching the homepage's
              Join the Pool / Open Clan buttons. Mutually exclusive:
              opening one closes the other. */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              type="button"
              onClick={() => toggleClanForm("add")}
              className={`
                inline-flex items-center gap-2
                px-5 py-2.5 rounded-full
                border transition font-semibold text-sm
                ${activeClanForm === "add"
                  ? "bg-purple-600/50 text-white border-purple-500/50"
                  : "bg-purple-600/30 text-purple-200 border-purple-500/30 hover:bg-purple-600/50 hover:text-white"
                }
              `}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Clan
            </button>
            <button
              type="button"
              onClick={() => toggleClanForm("delete")}
              className={`
                inline-flex items-center gap-2
                px-5 py-2.5 rounded-full
                border transition font-semibold text-sm
                ${activeClanForm === "delete"
                  ? "bg-red-600/40 text-white border-red-500/50"
                  : "bg-red-600/20 text-red-200 border-red-500/30 hover:bg-red-600/40 hover:text-white"
                }
              `}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Clan
            </button>
          </div>

          {/* Close Season — type CONFIRM to unlock, same guard as Delete Clan */}
          <div className="flex flex-col items-center gap-1.5 mt-3">
            {!showCloseSeasonForm ? (
              <button
                type="button"
                onClick={() => { setShowCloseSeasonForm(true); setCloseSeasonResult(null); }}
                className="
                  inline-flex items-center gap-2
                  px-4 py-1.5 rounded-full
                  border border-amber-500/20 bg-amber-500/10
                  text-amber-300 text-xs font-semibold
                  hover:bg-amber-500/20 hover:text-amber-200 transition
                "
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Close Season
              </button>
            ) : (
              <motion.form
                onSubmit={doCloseSeason}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden w-full max-w-xs"
              >
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3 text-left relative">
                  <button
                    type="button"
                    onClick={() => { setShowCloseSeasonForm(false); setCloseSeasonConfirm(""); }}
                    className="absolute top-3 right-3 text-slate-500 hover:text-white transition text-xs"
                  >✕</button>
                  <p className="text-xs text-amber-300 font-semibold">Close {season}?</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    This will record current CWL ranks and advance the season to the next month. Past roster data is preserved. Type <span className="text-white font-mono">CONFIRM</span> to proceed.
                  </p>
                  <input
                    type="text"
                    placeholder="Type CONFIRM"
                    value={closeSeasonConfirm}
                    onChange={e => setCloseSeasonConfirm(e.target.value)}
                    className="
                      w-full rounded-xl border border-white/10 bg-white/[0.04]
                      px-3 py-2 text-sm text-white placeholder:text-slate-600
                      focus:outline-none focus:border-amber-500/40 transition
                    "
                  />
                  <button
                    type="submit"
                    disabled={closeSeasonConfirm !== "CONFIRM" || closeSeasonSubmitting}
                    className="
                      w-full px-4 py-2 rounded-xl text-xs font-semibold
                      bg-amber-500/20 text-amber-200 border border-amber-500/30
                      hover:bg-amber-500/30 hover:text-white transition
                      disabled:opacity-40 disabled:cursor-not-allowed
                    "
                  >
                    {closeSeasonSubmitting ? "Closing…" : `Close ${season} & Open Next`}
                  </button>
                </div>
              </motion.form>
            )}
            {closeSeasonResult && (
              <p className={`text-[11px] text-center ${closeSeasonResult.ok ? "text-green-400" : "text-red-400"}`}>
                {closeSeasonResult.message}
              </p>
            )}
          </div>

          {/* Add Clan form */}
          <AnimatePresence>
            {activeClanForm === "add" && (
              <motion.form
                onSubmit={doAddClan}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-5 text-left"
              >
                <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
                  <div className="absolute top-3 right-3">
                    <XButton
                      onClick={() => toggleClanForm("add")}
                      title="Close"
                    />
                  </div>
                  <div className="pr-6">
                    <label className="block text-xs text-slate-400 mb-1 ml-1">Clan Tag</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="#ABC123"
                        value={addClanTag}
                        onChange={e => setAddClanTag(e.target.value)}
                        onBlur={doLookupClan}
                        autoCapitalize="characters"
                        autoCorrect="off"
                        spellCheck={false}
                        className="
                          flex-1 rounded-xl border border-white/10 bg-white/[0.04]
                          px-4 py-2.5 text-white placeholder:text-slate-600
                          focus:outline-none focus:border-purple-500/50 transition
                          font-mono tracking-wide text-sm
                        "
                      />
                      <button
                        type="button"
                        onClick={doLookupClan}
                        disabled={addClanLookupBusy || !addClanTag.trim()}
                        className="
                          px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0
                          bg-white/[0.06] border border-white/10 text-slate-300
                          hover:bg-white/[0.1] transition
                          disabled:opacity-40 disabled:cursor-not-allowed
                        "
                      >
                        {addClanLookupBusy ? "Looking up…" : "Lookup"}
                      </button>
                    </div>
                    {addClanSuggestedName && (
                      <p className="text-xs text-purple-300 mt-1.5 ml-1">→ {addClanSuggestedName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1 ml-1">Clan Link</label>
                    <input
                      type="text"
                      placeholder="https://link.clashofclans.com/..."
                      value={addClanLink}
                      onChange={e => setAddClanLink(e.target.value)}
                      autoCorrect="off"
                      spellCheck={false}
                      className="
                        w-full rounded-xl border border-white/10 bg-white/[0.04]
                        px-4 py-2.5 text-white placeholder:text-slate-600
                        focus:outline-none focus:border-purple-500/50 transition text-sm
                      "
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1 ml-1">CWL Rank</label>
                    <select
                      value={addClanRank}
                      onChange={e => setAddClanRank(e.target.value)}
                      className="
                        w-full rounded-xl border border-white/10 bg-white/[0.04]
                        px-4 py-2.5 text-white
                        focus:outline-none focus:border-purple-500/50 transition text-sm
                      "
                    >
                      <option value="">Select…</option>
                      <option value="Unranked">Unranked</option>
                      {Object.keys(CWL_ICONS).map(rank => (
                        <option key={rank} value={rank}>{rank}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={addClanSubmitting || !addClanTag.trim() || !addClanLink.trim()}
                    className="
                      w-full py-3 rounded-xl font-semibold text-sm
                      bg-purple-600/40 text-purple-100 border border-purple-500/30
                      hover:bg-purple-600/60 hover:text-white transition
                      disabled:opacity-40 disabled:cursor-not-allowed
                    "
                  >
                    {addClanSubmitting ? "Adding…" : "Add Clan"}
                  </button>

                  {addClanResult && (
                    <p className={`text-xs text-center ${addClanResult.ok ? "text-green-300" : "text-red-400"}`}>
                      {addClanResult.message}
                    </p>
                  )}
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Delete Clan form */}
          <AnimatePresence>
            {activeClanForm === "delete" && (
              <motion.form
                onSubmit={doDeleteClan}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-5 text-left"
              >
                <div className="relative rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5 space-y-4">
                  <div className="absolute top-3 right-3">
                    <XButton
                      onClick={() => toggleClanForm("delete")}
                      title="Close"
                    />
                  </div>
                  <p className="text-xs text-slate-400 pr-6">
                    Type the exact clan name to confirm deletion. This permanently
                    removes the Sheet tab and all its data — blocked if any players
                    are still assigned to this clan.
                  </p>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 ml-1">Clan Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Cognition {CGN}"
                      value={deleteClanTag}
                      onChange={e => setDeleteClanTag(e.target.value)}
                      autoCorrect="off"
                      spellCheck={false}
                      className="
                        w-full rounded-xl border border-red-500/20 bg-white/[0.04]
                        px-4 py-2.5 text-white placeholder:text-slate-600
                        focus:outline-none focus:border-red-500/50 transition text-sm
                      "
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={deleteClanSubmitting || !deleteClanTag.trim()}
                    className="
                      w-full py-3 rounded-xl font-semibold text-sm
                      bg-red-600/40 text-red-100 border border-red-500/30
                      hover:bg-red-600/60 hover:text-white transition
                      disabled:opacity-40 disabled:cursor-not-allowed
                    "
                  >
                    {deleteClanSubmitting ? "Deleting…" : "Delete Clan"}
                  </button>

                  {deleteClanResult && (
                    <p className={`text-xs text-center ${deleteClanResult.ok ? "text-green-300" : "text-red-400"}`}>
                      {deleteClanResult.message}
                    </p>
                  )}
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {loading && (
        <div className="relative z-10 space-y-6">
          <section>
            <Skeleton className="w-32 h-3 mb-3 ml-1" />
            <Card>
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                      <div className="flex flex-col gap-1.5">
                        <Skeleton className="w-24 h-3.5" />
                        <Skeleton className="w-16 h-3" />
                      </div>
                    </div>
                    <Skeleton className="w-16 h-3" />
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <section>
            <Skeleton className="w-28 h-3 mb-3 ml-1" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="min-h-[140px] w-full rounded-3xl" />
              ))}
            </div>
          </section>
        </div>
      )}

      {error && (
        <div className="relative z-10 text-center text-red-400 text-sm py-6">{error}</div>
      )}

      {!loading && entries.length === 0 && clans.length === 0 && (
        <div className="relative z-10 text-center text-slate-600 py-12">
          No players have signed up for {season} yet.
        </div>
      )}

      {!loading && (clans.length > 0 || entries.length > 0) && (
        <div className="relative z-10 space-y-6">

          {/* ── pool toggle: Available Pool / Assigned ── */}
          <section>
            {/* Tab switcher + TH refresh */}
            <div className="flex items-center gap-2 mb-3 ml-1">
              <button
                onClick={() => setPoolTab("available")}
                className={`
                  px-3 py-1 rounded-full text-xs font-semibold border transition
                  ${poolTab === "available"
                    ? "bg-purple-600/30 text-purple-200 border-purple-500/40"
                    : "bg-white/[0.03] text-slate-400 border-white/10 hover:bg-white/[0.06] hover:text-slate-200"
                  }
                `}
              >
                Available Pool ({unassigned.length})
              </button>
              <button
                onClick={() => setPoolTab("assigned")}
                className={`
                  px-3 py-1 rounded-full text-xs font-semibold border transition
                  ${poolTab === "assigned"
                    ? "bg-purple-600/30 text-purple-200 border-purple-500/40"
                    : "bg-white/[0.03] text-slate-400 border-white/10 hover:bg-white/[0.06] hover:text-slate-200"
                  }
                `}
              >
                Assigned ({assigned.length})
              </button>
              {/* TH refresh — moved here from hero card top-right */}
              <RankRefreshButton
                busy={thRefreshing}
                result={thRefreshResult}
                onClick={doRefreshThLevels}
              />
            </div>

            {poolTab === "available" ? (
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
                        onTouchStart={e => onTouchStartPlayer(e, entry)}
                        onTouchMove={onTouchMovePlayer}
                        onTouchEnd={onTouchEndPlayer}
                        style={{ touchAction: "pan-y", WebkitUserSelect: "none", userSelect: "none" }}
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
                            <ThIcon level={entry.town_hall_level} />
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
            ) : (
              <Card>
                {assigned.length === 0 ? (
                  <p className="text-slate-600 text-sm text-center py-4">No players assigned yet.</p>
                ) : (
                  <div className="space-y-2">
                    {assigned
                      .sort((a, b) => (b.town_hall_level ?? 0) - (a.town_hall_level ?? 0))
                      .map(e => (
                        <div key={e.player_tag} className="flex items-center justify-between gap-3 py-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <ThIcon level={e.town_hall_level} size="w-6 h-6" />
                            <div className="min-w-0">
                              <span className="text-sm font-medium text-white truncate block">{e.player_name}</span>
                              <span className="text-xs text-slate-600 font-mono">{e.player_tag}</span>
                            </div>
                          </div>
                          <Pill variant="success">{e.assigned_clan}</Pill>
                        </div>
                      ))}
                  </div>
                )}
              </Card>
            )}
          </section>

          {/* ── clan drop zones ── */}
          <section>
            <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3 ml-1">
              Clan Rosters
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {clans.map(clan => {
                const clanEntries = assigned
                  .filter(e => e.assigned_clan === clan)
                  .sort((a, b) => (b.town_hall_level ?? 0) - (a.town_hall_level ?? 0));
                const isOver = overClan === clan;
                const isClanDragging = draggingClan === clan;
                const isClanOver = overClanTile === clan && draggingClan !== clan;
                const format = clanFormats[clan] ?? 15;
                return (
                  <div
                    key={clan}
                    data-clan-zone={clan}
                    data-clan-tile={clan}
                    draggable
                    onDragStart={() => onClanTileDragStart(clan)}
                    onDragEnd={onClanTileDragEnd}
                    onDragOver={e => {
                      // If a player card is being dragged, use the player handler;
                      // otherwise handle clan tile reorder.
                      if (dragging) {
                        onDragOver(e, clan);
                      } else {
                        onClanTileDragOver(e, clan);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragging) onDragLeave();
                      else onClanTileDragLeave();
                    }}
                    onDrop={e => {
                      if (dragging) {
                        onDrop(e, clan);
                      } else {
                        onClanTileDrop(e, clan);
                      }
                    }}
                    onTouchStart={e => onClanTileTouchStart(e, clan)}
                    onTouchMove={onClanTileTouchMove}
                    onTouchEnd={onClanTileTouchEnd}
                    style={{ touchAction: "pan-y", WebkitUserSelect: "none", userSelect: "none" }}
                    className={`
                      rounded-3xl border min-h-[140px] p-4 transition cursor-grab active:cursor-grabbing
                      ${isClanDragging ? "opacity-50 border-purple-400/40" : ""}
                      ${isClanOver ? "border-purple-400/60 bg-purple-500/5" : ""}
                      ${isOver && !isClanDragging && !isClanOver
                        ? "border-purple-400/50 bg-purple-500/5 shadow-lg shadow-purple-500/5"
                        : !isClanDragging && !isClanOver ? "border-white/10 bg-white/[0.02]" : ""
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
                              <ThIcon level={e.town_hall_level} size="w-6 h-6" />
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

        </div>
      )}
    </main>
  );
}
