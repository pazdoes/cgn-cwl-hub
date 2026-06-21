"use client";

import { useState, useEffect } from "react";
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

                return (
                  <motion.div
                    key={acct.tag}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="
                      flex items-center justify-between gap-3
                      rounded-2xl border border-white/10 bg-white/[0.03]
                      p-4 transition hover:bg-white/[0.05]
                    "
                  >
                    {/* account info */}
                    <div className="flex items-center gap-3 min-w-0">
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
