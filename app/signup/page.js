"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { BRANDING } from "../../lib/branding";
import { TH_ICONS } from "../../lib/icons";

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

  /* --- verify + sign up a new account --- */
  async function handleVerify(e) {
    e.preventDefault();
    const normTag = normaliseTag(tag);
    if (!normTag || !token.trim()) return;

    setVerifying(true);
    setVerifyStatus(null);

    try {
      const res = await fetch("/api/accounts/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: normTag, token: token.trim() }),
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
          <h2 className="text-lg font-semibold mb-1">Your Accounts</h2>
          <p className="text-slate-500 text-xs mb-4">
            Accounts you've already verified on this device. Tap to sign up for this season — no token needed.
          </p>

          {loadingMine ? (
            <div className="text-slate-500 text-sm py-4 text-center animate-pulse">Loading…</div>
          ) : myAccounts.length === 0 ? (
            <div className="text-slate-600 text-sm py-4 text-center">
              No verified accounts on this device yet.<br />
              <span className="text-slate-500">Use the form below to add your first account.</span>
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

      {/* ── verify new account form ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.16 }}
        className="relative z-10 mb-6"
      >
        <Card>
          <h2 className="text-lg font-semibold mb-1">Add a New Account</h2>
          <p className="text-slate-500 text-xs mb-5">
            Open Clash of Clans → Settings → API Token → copy the token. This verifies you own the account and signs it up in one step.
          </p>

          <form onSubmit={handleVerify} className="space-y-4">

            {/* Player Tag */}
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
                  w-full rounded-2xl border border-white/10 bg-white/[0.04]
                  backdrop-blur-xl px-5 py-3.5 text-white placeholder:text-slate-600
                  focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.06] transition
                  font-mono tracking-wide
                "
              />
            </div>

            {/* API Token */}
            <div>
              <label className="block text-xs text-slate-400 mb-1 ml-1">In-Game API Token</label>
              <input
                type="text"
                placeholder="Paste your token here"
                value={token}
                onChange={e => setToken(e.target.value)}
                autoCorrect="off"
                spellCheck={false}
                className="
                  w-full rounded-2xl border border-white/10 bg-white/[0.04]
                  backdrop-blur-xl px-5 py-3.5 text-white placeholder:text-slate-600
                  focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.06] transition
                  font-mono
                "
              />
            </div>

            {/* submit */}
            <button
              type="submit"
              disabled={verifying || !tag.trim() || !token.trim()}
              className="
                w-full py-4 rounded-2xl font-semibold text-sm
                bg-purple-600/40 text-purple-100 border border-purple-500/30
                hover:bg-purple-600/60 hover:text-white transition
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              {verifying ? "Verifying…" : "Verify & Sign Up"}
            </button>

          </form>

          {/* result message */}
          <AnimatePresence>
            {verifyStatus && (
              <motion.div
                key="verify-result"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4"
              >
                <StatusPill variant={verifyStatus.ok ? "success" : "error"}>
                  {verifyStatus.ok ? "✓ " : "✗ "}{verifyStatus.message}
                </StatusPill>
              </motion.div>
            )}
          </AnimatePresence>
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
              ["Verify your account", "Enter your player tag and the API token from the in-game settings. This proves you own the account without sharing your password."],
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
