"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { BRANDING } from "../../lib/branding";
import { TH_ICONS } from "../../lib/icons";
import DiscordWidget from "../components/DiscordWidget";

/* ─── skeleton loading placeholder ───────────────────────────
   Same treatment as the homepage and admin pool page — a pulsing
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
      fetch("/api/accounts/link-discord", { method: "POST" })
        .catch(() => {}); // non-fatal — accounts still work via cookie
    }
  }, [discordStatus, discordUser?.discordId]);

  /* --- state --- */
  const [season, setSeason]         = useState(null);
  const [myAccounts, setMyAccounts] = useState([]);   // quick-pick list from cookie
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
        body: JSON.stringify({ tag: normTag, token: token.trim() || undefined }),
      });
      const data = await res.json();

      if (res.ok) {
        setVerifyStatus({ ok: true, message: `${data.name} (${data.tag}) signed up for ${data.season}.` });
        // refresh quick-pick list — TH level is now included in the
        // accounts/mine response from Neon, no separate CoC API call needed
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
    setManageOpen(true);
    setManageTab("add");
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
  return (
    <main className="
      min-h-screen overflow-x-hidden w-full max-w-full
      bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f]
      text-white p-6 pb-12
    ">

      {/* ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2
          w-[100vw] max-w-[600px] h-[100vw] max-h-[600px]
          bg-purple-500/10 blur-3xl rounded-full" />
      </div>



      {/* ── header card ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 mb-6"
      >
        <Card className="text-center">
          <img src={BRANDING.cwlhub} alt="CWL Hub" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-thin tracking-widest">Sign Up for CWL</h1>
          <div className="mt-3 flex justify-center">
            <DiscordWidget variant="center" />
          </div>
        </Card>
      </motion.div>

      {/* ── quick-pick section (returning players) ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="relative z-10 mb-6"
      >
        <Card>
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              {/* Hamburger menu — left of title */}
              <div className="relative shrink-0" ref={accountsMenuRef}>
                <button
                  type="button"
                  onClick={() => setAccountsMenuOpen(v => !v)}
                  className="w-7 h-7 rounded-full flex items-center justify-center border border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.08] hover:text-white transition"
                  title="Account options"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <AnimatePresence>
                  {accountsMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute left-0 top-full mt-1 z-50 min-w-[160px] rounded-2xl border border-white/10 bg-[#0d1424]/95 backdrop-blur-xl shadow-xl overflow-hidden"
                    >
                      <div className="p-1.5 space-y-0.5">
                        <button
                          type="button"
                          onClick={() => { setAccountsView("accounts"); setAccountsMenuOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition text-left ${accountsView === "accounts" ? "text-white bg-white/[0.06]" : "text-slate-300 hover:bg-white/[0.06] hover:text-white"}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Your Accounts
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAccountsView("add"); setAccountsMenuOpen(false); setVerifyStatus(null); setTag(""); setToken(""); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition text-left ${accountsView === "add" ? "text-white bg-white/[0.06]" : "text-slate-300 hover:bg-white/[0.06] hover:text-white"}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          Add Account
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAccountsView("remove"); setAccountsMenuOpen(false); setManageTag(""); setManageResult(null); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition text-left ${accountsView === "remove" ? "text-white bg-white/[0.06]" : "text-slate-300 hover:bg-white/[0.06] hover:text-white"}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remove Account
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <h2 className="text-lg font-semibold">Your Accounts</h2>
            </div>
            {/* TH refresh — only when accounts exist */}
            {myAccounts.length > 0 && (
              <button
                type="button"
                onClick={handleThRefresh}
                disabled={thRefreshing}
                title={thRefreshResult
                  ? (thRefreshResult.ok ? `Updated: ${thRefreshResult.message}` : thRefreshResult.message)
                  : "Refresh Town Hall levels from game"}
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center
                  border transition disabled:opacity-50 shrink-0
                  ${thRefreshResult?.ok === false
                    ? "bg-red-500/10 border-red-500/30 text-red-300"
                    : "bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.08] hover:text-slate-200"
                  }
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 ${thRefreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
          {/* Add Account view */}
          <AnimatePresence mode="wait">
            {accountsView === "add" && (
              <motion.div key="add" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
                <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-4 space-y-3">
                  <p className="text-xs text-slate-400">Enter a player tag to sign up. API token is optional but confirms ownership.</p>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 ml-1">Player Tag</label>
                    <input type="text" placeholder="#ABC123" value={tag}
                      onChange={e => setTag(e.target.value)}
                      onPaste={e => { e.preventDefault(); setTag(e.clipboardData.getData("text")); }}
                      autoCapitalize="characters" autoCorrect="off" spellCheck={false}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition font-mono tracking-wide text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 ml-1">In-Game API Token <span className="text-slate-600">(optional)</span></label>
                    <input type="text" placeholder="Paste your token here, or leave blank" value={token}
                      onChange={e => setToken(e.target.value)} autoCorrect="off" spellCheck={false}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition font-mono text-sm" />
                  </div>
                  <button type="button" onClick={handleVerify} disabled={verifying || !tag.trim()}
                    className="w-full py-2.5 rounded-xl font-semibold text-sm bg-purple-600/40 text-purple-100 border border-purple-500/30 hover:bg-purple-600/60 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed">
                    {verifying ? "Signing up…" : "Sign Up"}
                  </button>
                  {verifyStatus && (
                    <p className={`text-xs text-center ${verifyStatus.ok ? "text-green-300" : "text-red-400"}`}>{verifyStatus.message}</p>
                  )}
                </div>
              </motion.div>
            )}
            {accountsView === "remove" && (
              <motion.div key="remove" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
                <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-4 space-y-3">
                  <p className="text-xs text-slate-400">Enter a player tag to remove it from this device. You can re-add it anytime.</p>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 ml-1">Player Tag</label>
                    <input type="text" placeholder="#ABC123" value={manageTag}
                      onChange={e => setManageTag(e.target.value)}
                      autoCapitalize="characters" autoCorrect="off" spellCheck={false}
                      className="w-full rounded-xl border border-red-500/20 bg-white/[0.04] px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 transition font-mono tracking-wide text-sm" />
                  </div>
                  <button type="button" onClick={handleManageSubmit} disabled={manageSubmitting || !manageTag.trim()}
                    className="w-full py-2.5 rounded-xl font-semibold text-sm bg-red-600/40 text-red-100 border border-red-500/30 hover:bg-red-600/60 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed">
                    {manageSubmitting ? "Removing…" : "Remove Account"}
                  </button>
                  {manageResult && (
                    <p className={`text-xs text-center ${manageResult.ok ? "text-green-300" : "text-red-400"}`}>{manageResult.message}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loadingMine ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="w-28 h-3.5" />
                      <Skeleton className="w-20 h-3" />
                    </div>
                  </div>
                  <Skeleton className="w-20 h-6 rounded-full shrink-0" />
                </div>
              ))}
            </div>
          ) : myAccounts.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-slate-600 text-sm mb-5">
                No verified accounts on this device yet.<br />
                <span className="text-slate-500">Add your first account to get started.</span>
              </p>
              <button
                type="button"
                onClick={openManageAdd}
                className="
                  inline-flex items-center gap-2
                  px-6 py-3 rounded-full
                  bg-purple-600/30 text-purple-200
                  border border-purple-500/30
                  hover:bg-purple-600/50 hover:text-white
                  transition font-semibold text-sm
                "
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Account
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myAccounts.map(acct => {
                const result = joinResult[acct.tag];
                const busy   = joiningTag === acct.tag;
                const isDragging = draggingTag === acct.tag;
                const isDragOver  = dragOverTag === acct.tag && draggingTag !== acct.tag;

                return (
                  <motion.div
                    key={acct.tag}
                    data-account-tag={acct.tag}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    draggable
                    onDragStart={() => onAccountDragStart(acct.tag)}
                    onDragOver={e => onAccountDragOver(e, acct.tag)}
                    onDragLeave={onAccountDragLeave}
                    onDragEnd={onAccountDrop}
                    onTouchStart={e => onAccountTouchStart(e, acct.tag)}
                    onTouchMove={onAccountTouchMove}
                    onTouchEnd={onAccountTouchEnd}
                    style={{ touchAction: "pan-y", WebkitUserSelect: "none", userSelect: "none" }}
                    className={`
                      rounded-2xl border bg-white/[0.03]
                      p-4 transition hover:bg-white/[0.05] cursor-grab active:cursor-grabbing
                      ${isDragging ? "opacity-40 border-purple-500/40" : "border-white/10"}
                      ${isDragOver ? "border-purple-400/60 bg-purple-500/5" : ""}
                    `}
                  >
                    {/* account info row — TH icon and name flush left */}
                    <div className="flex items-center gap-3 min-w-0 mb-3">
                      <ThIcon level={acct.townHallLevel} />
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-white truncate">{acct.name}</span>
                        <span className="text-xs text-slate-500 font-mono">{acct.tag}</span>
                      </div>
                    </div>

                    {/* unified toggle — centred below name row */}
                    <div className="flex flex-col items-center gap-1.5">
                      {acct.inCurrentPool ? (
                        <button
                          onClick={() => handleLeave(acct.tag)}
                          disabled={leavingTag === acct.tag}
                          className="
                            w-full px-4 py-1.5 rounded-full text-xs font-semibold text-center
                            bg-green-500/20 text-green-300 border border-green-500/30
                            hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30
                            disabled:opacity-50 disabled:cursor-not-allowed transition
                          "
                        >
                          {leavingTag === acct.tag ? "Leaving…" : "✓ Signed Up — tap to leave"}
                        </button>
                      ) : result ? (
                        <span className={`w-full text-center px-4 py-1.5 rounded-full text-xs font-semibold border ${
                          result.ok
                            ? "bg-green-500/20 text-green-300 border-green-500/30"
                            : "bg-red-500/20 text-red-300 border-red-500/30"
                        }`}>
                          {result.ok ? "✓ Signed Up" : "Failed — try again"}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleJoin(acct.tag)}
                          disabled={busy}
                          className="
                            w-full px-4 py-1.5 rounded-full text-xs font-semibold text-center
                            bg-purple-600/30 text-purple-200 border border-purple-500/30
                            hover:bg-purple-600/50 hover:text-white transition
                            disabled:opacity-50 disabled:cursor-not-allowed
                          "
                        >
                          {busy ? "Signing up…" : "Sign Up"}
                        </button>
                      )}
                      {leaveError[acct.tag] && (
                        <p className="text-[10px] text-red-400 text-center leading-tight">
                          {leaveError[acct.tag]}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Card>
      </motion.div>

      {/* ── how it works ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.24 }}
        className="relative z-10"
      >
        <Card>
          <h2 className="text-base font-semibold mb-4 text-slate-300">How it works</h2>
          <ol className="space-y-3">
            {[
              ["Sign up with your tag", "Enter your player tag to join the pool. Adding your API token is optional, but confirms it's really your account."],
              ["Join the pool", "Once verified, your account goes into the shared available-player pool for this season."],
              ["Get assigned", "Admins review the pool and assign players to specific clan rosters each season based on clan needs."],
              ["Repeat each season", "For future seasons, just tap Sign up on any of your saved accounts — no reverification needed."],
            ].map(([title, desc], i) => (
              <li key={i} className="flex gap-4">
                <span className="
                  shrink-0 w-7 h-7 rounded-full
                  bg-purple-500/20 border border-purple-500/30
                  text-purple-300 text-xs font-bold
                  flex items-center justify-center mt-0.5
                ">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </motion.div>

    </main>
  );
}
