"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { BRANDING } from "../../lib/branding";
import { TH_ICONS } from "../../lib/icons";

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
  /* --- state --- */
  const [season, setSeason]         = useState(null);
  const [myAccounts, setMyAccounts] = useState([]);   // quick-pick list from cookie
  const [loadingMine, setLoadingMine] = useState(true);
  const [thLevels, setThLevels] = useState({}); // { [tag]: number }

  // manual drag-and-drop reordering (item 13) — purely client-side
  // during the drag itself; the new order is only persisted to Neon
  // once the drop completes, via /api/accounts/reorder
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

  // leave the pool entirely (item 5 — distinct from admin unassign)
  const [leavingTag, setLeavingTag]   = useState(null);
  const [leaveError, setLeaveError]   = useState({}); // { [tag]: message }

  // Manage panel — remove an account from this device entirely (item 9,
  // distinct from the per-account X above, which only leaves the pool).
  // Also now hosts the Add Account form as a second tab (item 9 follow-up
  // — consolidating what was previously a separate, always-visible
  // "Add a New Account" card into this single panel).
  const [manageOpen,        setManageOpen]        = useState(false);
  const [manageTab,         setManageTab]         = useState("add"); // "add" | "remove"
  const [manageTag,         setManageTag]         = useState("");
  const [manageSubmitting,  setManageSubmitting]  = useState(false);
  const [manageResult,      setManageResult]      = useState(null); // {ok, message}

  /* --- fetch TH levels for a set of tags, merging into existing state --- */
  async function loadThLevels(tags) {
    if (!tags || tags.length === 0) return;
    try {
      const res = await fetch("/api/admin/th-levels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      });
      const data = await res.json();
      setThLevels(prev => ({ ...prev, ...(data.thLevels || {}) }));
    } catch {
      // non-fatal — pills just render without a TH icon if this fails
    }
  }

  /* --- load owned accounts on mount --- */
  useEffect(() => {
    fetch("/api/accounts/mine")
      .then(r => r.json())
      .then(data => {
        const accounts = data.accounts || [];
        setMyAccounts(accounts);
        setSeason(data.season || null);
        loadThLevels(accounts.map(a => a.tag));
      })
      .catch(() => {})
      .finally(() => setLoadingMine(false));
  }, []);

  /* --- register a new account (token optional — item 8) --- */
  async function handleVerify(e) {
    e.preventDefault();
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
        // refresh quick-pick list
        const mine = await fetch("/api/accounts/mine").then(r => r.json());
        setMyAccounts(mine.accounts || []);
        setSeason(mine.season || season);
        loadThLevels((mine.accounts || []).map(a => a.tag));
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
    e.preventDefault();
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
    el: null,
  });

  function cleanupAccountTouchListeners() {
    const state = touchStateRef.current;
    if (state.moveListener) document.removeEventListener("touchmove", state.moveListener);
    if (state.endListener) document.removeEventListener("touchend", state.endListener);
    if (state.cancelListener) document.removeEventListener("touchcancel", state.cancelListener);
    state.moveListener = null;
    state.endListener = null;
    state.cancelListener = null;

    // Reset the visual transform applied during the drag — the
    // element's actual position in the list is now handled by React
    // re-rendering against the already-reordered myAccounts array; the
    // transform was only ever a temporary overlay tracking the finger
    // during the gesture itself, not a permanent positioning mechanism.
    if (state.el) {
      state.el.style.transform = "";
      state.el.style.zIndex = "";
      state.el.style.transition = "";
      state.el.style.pointerEvents = "";
      state.el = null;
    }
  }

  function onAccountTouchStart(e, tag) {
    const touch = e.touches[0];
    if (!touch) return;

    const state = touchStateRef.current;
    state.startX = touch.clientX;
    state.startY = touch.clientY;
    state.tag = tag;
    state.active = false;
    state.el = e.currentTarget;

    state.timer = setTimeout(() => {
      state.active = true;
      onAccountDragStart(tag);

      // Visually lift the dragged card above its neighbors while held —
      // desktop's native drag API shows a ghost image automatically;
      // touch has no equivalent, so this is the explicit replacement.
      //
      // pointer-events: none is essential here, not optional polish:
      // elementFromPoint(x, y) returns the TOPMOST element at that
      // screen point, and the dragged card — now sitting at the
      // finger's position with the highest z-index — was itself being
      // returned on every touchmove, so the hit-test kept finding the
      // dragged card instead of whatever it was actually hovering
      // over. pointer-events: none makes elementFromPoint see straight
      // through it to the real target underneath, while it stays
      // fully visible and still visually follows the finger.
      if (state.el) {
        state.el.style.zIndex = "50";
        state.el.style.transition = "none";
        state.el.style.pointerEvents = "none";
      }

      // Drag confirmed — attach the real, non-passive touchmove handler
      // now, scoped only to the lifetime of this one drag gesture.
      const moveListener = (moveEvent) => {
        if (moveEvent.cancelable) moveEvent.preventDefault();
        const t = moveEvent.touches[0];
        if (!t) return;

        // Make the dragged card itself follow the finger.
        if (state.el) {
          const dx = t.clientX - state.startX;
          const dy = t.clientY - state.startY;
          state.el.style.transform = `translate(${dx}px, ${dy}px)`;
        }

        const el = document.elementFromPoint(t.clientX, t.clientY);
        const row = el?.closest("[data-account-tag]");
        if (!row) return;

        const overTag = row.getAttribute("data-account-tag");
        if (!overTag) return;

        // NOTE: calling onAccountDragOver here would cause a stale
        // closure bug — that function reads 'draggingTag' from React
        // state, but inside a setTimeout-created closure the setState
        // called moments earlier (setDraggingTag) hasn't propagated
        // yet, so 'draggingTag' appears null and the reorder guard
        // '!draggingTag' returns early every time, preventing other
        // cards from shifting. Instead, read the tag directly from
        // the ref (always synchronously current) and inline the reorder.
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

      const finish = () => {
        cleanupAccountTouchListeners();
        onAccountDrop();
        state.tag = null;
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

      {/* ── back nav ── */}
      <div className="relative z-10 mb-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Hub
        </Link>
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
          <h1 className="text-3xl font-bold tracking-tight">Sign Up for CWL</h1>
          <p className="text-slate-400 mt-2 text-sm">
            {season
              ? <>Register your account for the <span className="text-purple-300 font-semibold">{season}</span> roster pool.</>
              : "Register your account for the upcoming roster pool."}
          </p>
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
            <h2 className="text-lg font-semibold">Your Accounts</h2>
            {myAccounts.length > 0 && (
              <button
                type="button"
                onClick={() => toggleManage(manageTab)}
                className={`
                  shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition
                  ${manageOpen
                    ? "bg-slate-500/30 text-white border-slate-500/40"
                    : "bg-slate-500/20 text-slate-300 border-slate-500/30 hover:bg-slate-500/30 hover:text-white"
                  }
                `}
              >
                Manage
              </button>
            )}
          </div>
          <p className="text-slate-500 text-xs mb-4">
            Accounts you've already verified on this device. Tap to sign up for this season — no token needed.
          </p>

          {/* Manage panel — Add Account and Remove Account, toggleable */}
          <AnimatePresence>
            {manageOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className={`
                  relative rounded-2xl border p-4 space-y-3
                  ${manageTab === "remove"
                    ? "border-red-500/20 bg-red-500/[0.04]"
                    : "border-purple-500/20 bg-purple-500/[0.04]"
                  }
                `}>
                  <div className="absolute top-3 right-3">
                    <XButton onClick={() => toggleManage(manageTab)} title="Close" />
                  </div>

                  {/* tab toggle — only relevant once there's something to
                      remove; with zero accounts, Add is the only option
                      so the toggle would be pointless clutter */}
                  {myAccounts.length > 0 && (
                    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-0.5 w-fit text-xs mb-1">
                      <button
                        type="button"
                        onClick={() => { setManageTab("add"); setManageResult(null); setVerifyStatus(null); }}
                        className={`
                          px-3 py-1 rounded-full transition font-semibold
                          ${manageTab === "add" ? "bg-purple-500/30 text-purple-200" : "text-slate-500 hover:text-slate-300"}
                        `}
                      >
                        Add Account
                      </button>
                      <button
                        type="button"
                        onClick={() => { setManageTab("remove"); setManageResult(null); }}
                        className={`
                          px-3 py-1 rounded-full transition font-semibold
                          ${manageTab === "remove" ? "bg-red-500/30 text-red-200" : "text-slate-500 hover:text-slate-300"}
                        `}
                      >
                        Remove Account
                      </button>
                    </div>
                  )}

                  {manageTab === "add" ? (
                    <form onSubmit={handleVerify} className="space-y-3 pr-6">
                      <p className="text-xs text-slate-400">
                        Enter a player tag to sign up. Adding your API token
                        (Settings → API Token) is optional, but confirms it's
                        really your account.
                      </p>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1 ml-1">Player Tag</label>
                        <input
                          type="text"
                          placeholder="#ABC123"
                          value={tag}
                          onChange={e => setTag(e.target.value)}
                          autoCapitalize="characters"
                          autoCorrect="off"
                          spellCheck={false}
                          className="
                            w-full rounded-xl border border-white/10 bg-white/[0.04]
                            px-4 py-2.5 text-white placeholder:text-slate-600
                            focus:outline-none focus:border-purple-500/50 transition
                            font-mono tracking-wide text-sm
                          "
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1 ml-1">
                          In-Game API Token <span className="text-slate-600">(optional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Paste your token here, or leave blank"
                          value={token}
                          onChange={e => setToken(e.target.value)}
                          autoCorrect="off"
                          spellCheck={false}
                          className="
                            w-full rounded-xl border border-white/10 bg-white/[0.04]
                            px-4 py-2.5 text-white placeholder:text-slate-600
                            focus:outline-none focus:border-purple-500/50 transition
                            font-mono text-sm
                          "
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={verifying || !tag.trim()}
                        className="
                          w-full py-2.5 rounded-xl font-semibold text-sm
                          bg-purple-600/40 text-purple-100 border border-purple-500/30
                          hover:bg-purple-600/60 hover:text-white transition
                          disabled:opacity-40 disabled:cursor-not-allowed
                        "
                      >
                        {verifying ? "Signing up…" : "Sign Up"}
                      </button>
                      {verifyStatus && (
                        <p className={`text-xs text-center ${verifyStatus.ok ? "text-green-300" : "text-red-400"}`}>
                          {verifyStatus.message}
                        </p>
                      )}
                    </form>
                  ) : (
                    <form onSubmit={handleManageSubmit} className="space-y-3 pr-6">
                      <p className="text-xs text-slate-400">
                        Enter a player tag to remove that account from this device.
                        You can always add it back later by verifying again.
                      </p>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1 ml-1">Player Tag</label>
                        <input
                          type="text"
                          placeholder="#ABC123"
                          value={manageTag}
                          onChange={e => setManageTag(e.target.value)}
                          autoCapitalize="characters"
                          autoCorrect="off"
                          spellCheck={false}
                          className="
                            w-full rounded-xl border border-red-500/20 bg-white/[0.04]
                            px-4 py-2.5 text-white placeholder:text-slate-600
                            focus:outline-none focus:border-red-500/50 transition
                            font-mono tracking-wide text-sm
                          "
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={manageSubmitting || !manageTag.trim()}
                        className="
                          w-full py-2.5 rounded-xl font-semibold text-sm
                          bg-red-600/40 text-red-100 border border-red-500/30
                          hover:bg-red-600/60 hover:text-white transition
                          disabled:opacity-40 disabled:cursor-not-allowed
                        "
                      >
                        {manageSubmitting ? "Removing…" : "Remove Account"}
                      </button>
                      {manageResult && (
                        <p className={`text-xs text-center ${manageResult.ok ? "text-green-300" : "text-red-400"}`}>
                          {manageResult.message}
                        </p>
                      )}
                    </form>
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
                      flex items-center justify-between gap-3
                      rounded-2xl border bg-white/[0.03]
                      p-4 transition hover:bg-white/[0.05] cursor-grab active:cursor-grabbing
                      ${isDragging ? "opacity-40 border-purple-500/40" : "border-white/10"}
                      ${isDragOver ? "border-purple-400/60 bg-purple-500/5" : ""}
                    `}
                  >
                    {/* drag handle — larger touch target and explicit
                        right margin than the icon's own visual size,
                        since a finger needs more room to grab accurately
                        than a mouse cursor does; this also fixes the
                        overlap with the account info next to it */}
                    <div className="shrink-0 w-6 h-6 mr-1 flex items-center justify-center -ml-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9h.01M8 15h.01M16 9h.01M16 15h.01M8 12h.01M16 12h.01" />
                      </svg>
                    </div>

                    {/* account info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <ThIcon level={thLevels[acct.tag]} />
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-white truncate">{acct.name}</span>
                        <span className="text-xs text-slate-500 font-mono">{acct.tag}</span>
                      </div>
                    </div>

                    {/* right side: status + button */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {acct.inCurrentPool ? (
                        <div className="flex items-center gap-2">
                          <StatusPill variant="success">✓ Signed up</StatusPill>
                          <XButton
                            onClick={() => handleLeave(acct.tag)}
                            busy={leavingTag === acct.tag}
                            title="Leave the pool for this season"
                          />
                        </div>
                      ) : result ? (
                        <StatusPill variant={result.ok ? "success" : "error"}>
                          {result.ok ? "✓ Signed up" : "Failed"}
                        </StatusPill>
                      ) : (
                        <button
                          onClick={() => handleJoin(acct.tag)}
                          disabled={busy}
                          className="
                            px-4 py-1.5 rounded-full text-xs font-semibold
                            bg-purple-600/30 text-purple-200 border border-purple-500/30
                            hover:bg-purple-600/50 hover:text-white transition
                            disabled:opacity-50 disabled:cursor-not-allowed
                          "
                        >
                          {busy ? "Signing up…" : "Sign up"}
                        </button>
                      )}
                      {leaveError[acct.tag] && (
                        <p className="text-[10px] text-red-400 text-right max-w-[160px] leading-tight">
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
