"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

const ALLIANCE_CLAN_TAGS = ["#2C8QQPCL2", "#2CPC8GR9R", "#2Y9PGJGVC", "#2YQJJUYQY", "#2YV9UCJG2"];

function ThIcon({ level }) {
  if (!level) return <div className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-[9px] text-slate-600">?</div>;
  return (
    <div className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
      <img src={`/icons/th/th${level}.png`} alt={`TH${level}`} className="w-5 h-5 object-contain"/>
    </div>
  );
}

function AdminHeader() {
  const [navOpen, setNavOpen] = useState(false);
  const navItems = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/directory", label: "Directory" },
    { href: "/admin/pool", label: "Pool Manager" },
    { href: "/admin/season", label: "Season Manager" },
    { href: "/admin/clans", label: "Clan Manager" },
    { href: "/admin/announcements", label: "Announcements" },
  ];
  return (
    <>
      <div className={`fixed inset-0 z-50 transition-opacity duration-150 ${navOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={() => setNavOpen(false)}>
        <div className="absolute inset-0 bg-black/60"/>
        <div onClick={e => e.stopPropagation()} className={`relative z-10 w-72 max-w-[80vw] h-full bg-[#0d1424] border-r border-white/10 flex flex-col p-5 transition-transform duration-150 ${navOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center gap-2 mb-8"><img src="/icons/branding/cgn-skull.png" alt="CGN" className="w-7 h-7"/><span className="text-sm text-white tracking-widest uppercase">Admin Panel</span></div>
          <nav className="flex-1 space-y-1">
            {navItems.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setNavOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition">{item.label}</Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="relative z-10 flex items-center justify-between mb-4">
        <button onClick={() => setNavOpen(true)} className="text-slate-400 hover:text-white transition p-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <Link href="/admin" className="flex items-center gap-2"><img src="/icons/branding/cgn-skull.png" alt="CGN" className="w-6 h-6"/><span className="text-xs text-slate-400 tracking-widest uppercase">Admin</span></Link>
        <div className="w-8"/>
      </div>
    </>
  );
}

function AdminFooter() {
  return (
    <div className="relative z-10 w-full py-6 flex items-center justify-center gap-3 mt-4">
      <img src="/icons/branding/cgn-skull.png" alt="CGN" className="w-5 h-5 opacity-30"/>
      <span className="text-[10px] text-slate-600 tracking-widest uppercase">Cognition {"{CGN}"} · Admin</span>
    </div>
  );
}

export default function AdminDirectoryPage() {
  const [pin, setPinState] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPool, setFilterPool] = useState("all");
  const [filterDiscord, setFilterDiscord] = useState("all");
  const [filterToken, setFilterToken] = useState("all");
  const [filterUser, setFilterUser] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterClan, setFilterClan] = useState("all");
  const [managingTag, setManagingTag] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmInput, setConfirmInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState(null);
  const [dirTab, setDirTab] = useState("members"); // "members" | "missing"
  const [missing, setMissing] = useState([]);
  const [missingLoading, setMissingLoading] = useState(false);
  const [missingLoaded, setMissingLoaded] = useState(false);
  const [showMissing, setShowMissing] = useState(false);

  const { status: discordStatus } = useSession();
  const SESSION_KEY = "cwl_admin_pin_confirmed";

  useEffect(() => {
    if (discordStatus !== "authenticated") return;
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) { setPinState(saved); setAuthed(true); loadMembers(saved); }
  }, [discordStatus]);

  useEffect(() => {
    if (discordStatus === "unauthenticated") sessionStorage.removeItem(SESSION_KEY);
  }, [discordStatus]);

  async function loadMembers(p) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/members", { headers: { "x-officer-pin": p } });
      const d = await res.json();
      setMembers(d.members || []);
    } catch {} finally { setLoading(false); }
  }

  function handlePinSubmit(e) {
    e.preventDefault();
    setPinState(pinInput);
    setAuthed(true);
    setPinError(false);
    if (discordStatus === "authenticated") sessionStorage.setItem(SESSION_KEY, pinInput);
    loadMembers(pinInput);
  }

  async function handleSetActive(playerTag, active) {
    setActionLoading(true); setActionResult(null);
    try {
      const res = await fetch("/api/admin/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify({ playerTag, action: "setActive", active }),
      });
      if (res.ok) {
        setMembers(prev => prev.map(m => m.player_tag === playerTag ? { ...m, active } : m));
        setActionResult({ ok: true, message: active ? "Account activated" : "Account deactivated" });
      }
    } catch {} finally { setActionLoading(false); }
  }

  async function handleDelete(playerTag) {
    if (confirmInput !== "CONFIRM") return;
    setActionLoading(true); setActionResult(null);
    try {
      const res = await fetch("/api/admin/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify({ playerTag }),
      });
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.player_tag !== playerTag));
        setConfirmDelete(null); setConfirmInput(""); setManagingTag(null);
        setActionResult({ ok: true, message: "Account deleted" });
      }
    } catch {} finally { setActionLoading(false); }
  }

  function handleTabChange(tab) {
    setDirTab(tab);
    if (tab === "missing" && !missingLoaded && !missingLoading) {
      handleCheckMissing();
    }
  }

  async function handleCheckMissing() {
    setMissingLoading(true); setShowMissing(true);
    try {
      const res = await fetch("/api/admin/members/missing", {
        headers: { "x-officer-pin": pin },
      });
      const d = await res.json();
      setMissing(d.missing || []);
      setMissingLoaded(true);
    } catch {} finally { setMissingLoading(false); }
  }

  async function handleRefreshClanMembership() {
    setRefreshing(true); setRefreshResult(null);
    try {
      const res = await fetch("/api/admin/members/refresh-clans", {
        method: "POST",
        headers: { "x-officer-pin": pin },
      });
      const d = await res.json();
      if (res.ok) {
        setRefreshResult({ ok: true, message: `Updated ${d.updated} of ${d.total} accounts` });
        await loadMembers(pin);
      } else {
        setRefreshResult({ ok: false, message: d.error || "Failed" });
      }
    } catch (e) {
      setRefreshResult({ ok: false, message: e.message });
    } finally { setRefreshing(false); }
  }

  const pillSelect = "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white focus:outline-none [color-scheme:dark]";

  // Build unique Discord user list
  const discordUsers = [...new Map(
    members.filter(m => m.discord_id && m.discord_username).map(m => [m.discord_id, m.discord_username])
  ).entries()].sort((a, b) => (a[1] || "").localeCompare(b[1] || ""));

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.player_name?.toLowerCase().includes(q) || m.player_tag?.toLowerCase().includes(q) || m.assigned_clan?.toLowerCase().includes(q) || m.current_clan_name?.toLowerCase().includes(q);
    const matchPool = filterPool === "all" || (filterPool === "in" ? m.in_pool : !m.in_pool);
    const matchDiscord = filterDiscord === "all" || (filterDiscord === "yes" ? !!m.discord_id : !m.discord_id);
    const matchToken = filterToken === "all" || (filterToken === "yes" ? m.api_token_verified : !m.api_token_verified);
    const matchUser = filterUser === "all" || m.discord_id === filterUser;
    const matchStatus = filterStatus === "all" || (filterStatus === "active" ? m.active !== false : m.active === false);
    const matchClan = filterClan === "all"
      || (filterClan === "alliance" ? ALLIANCE_CLAN_TAGS.includes(m.current_clan_tag) : !ALLIANCE_CLAN_TAGS.includes(m.current_clan_tag));
    return matchSearch && matchPool && matchDiscord && matchToken && matchUser && matchStatus && matchClan;
  });

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] p-6">
        <div className="relative z-10 w-full max-w-xs">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 text-center">
            <h1 className="text-xl font-thin tracking-widest mb-1">Directory</h1>
            <p className="text-slate-600 text-xs mb-6">Enter your officer PIN to continue</p>
            <form onSubmit={handlePinSubmit} className="space-y-3">
              <input type="password" inputMode="numeric" pattern="[0-9]*" placeholder="PIN" value={pinInput} onChange={e => setPinInput(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white text-center placeholder:text-slate-600 focus:outline-none focus:border-purple-500/40 transition tracking-widest text-lg"/>
              {pinError && <p className="text-xs text-red-400">Incorrect PIN</p>}
              <button type="submit" disabled={!pinInput}
                className="w-full py-2.5 rounded-2xl text-sm font-semibold bg-transparent text-purple-400 border border-purple-500/60 hover:border-purple-400 hover:text-purple-300 transition disabled:opacity-40">
                Enter
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  const inAllianceCount = members.filter(m => ALLIANCE_CLAN_TAGS.includes(m.current_clan_tag)).length;

  return (
    <main className="min-h-screen overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      </div>

      <AdminHeader/>

      {/* Hero */}
      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 mb-4 text-center">
        <h1 className="text-2xl font-thin tracking-widest mb-1">Directory</h1>
        <p className="text-slate-500 text-xs">{members.length} registered · {inAllianceCount} in alliance · {members.filter(m => m.in_pool).length} in pool</p>
      </div>

      {/* Tab nav */}
      <div className="relative z-10 flex items-center justify-center gap-1 mb-4">
        {[["members","Members"],["missing","Missing"]].map(([key,label]) => (
          <button key={key} onClick={() => handleTabChange(key)}
            className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-semibold border transition ${
              dirTab === key
                ? "border-purple-500/60 bg-purple-500/15 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                : "border-white/10 bg-transparent text-slate-500 hover:text-slate-300 hover:border-white/20"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="rounded-3xl border border-red-500/30 bg-[#0d1424] p-6 w-full max-w-sm space-y-4">
            <h2 className="text-sm font-semibold text-red-400">Delete Account</h2>
            <p className="text-xs text-slate-400">This will permanently remove <span className="text-white font-semibold">{confirmDelete.name}</span> ({confirmDelete.tag}) from the accounts table.</p>
            <p className="text-xs text-slate-500">Type <span className="font-mono text-white">CONFIRM</span> to proceed.</p>
            <input type="text" value={confirmInput} onChange={e => setConfirmInput(e.target.value)}
              placeholder="CONFIRM" className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/40 transition"/>
            <div className="flex gap-2">
              <button onClick={() => { setConfirmDelete(null); setConfirmInput(""); }}
                className="flex-1 py-2 rounded-2xl text-xs border border-white/10 text-slate-400 hover:text-white transition">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete.tag)} disabled={confirmInput !== "CONFIRM" || actionLoading}
                className="flex-1 py-2 rounded-2xl text-xs border border-red-500/60 text-red-400 hover:border-red-400 hover:text-red-300 transition disabled:opacity-40">
                {actionLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {dirTab === "members" && (
      <div className="relative z-10 space-y-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Member Directory</h2>
            <div className="flex items-center gap-2">
              {refreshResult && <span className={`text-[10px] ${refreshResult.ok ? "text-green-400" : "text-red-400"}`}>{refreshResult.message}</span>}
              <button onClick={handleRefreshClanMembership} disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:border-amber-400/60 hover:bg-amber-500/20 transition text-[10px] uppercase tracking-widest font-semibold disabled:opacity-40">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                {refreshing ? "Refreshing…" : "Refresh Clans"}
              </button>
              <button onClick={() => loadMembers(pin)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-300 hover:border-purple-400/60 transition text-[10px] uppercase tracking-widest font-semibold">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Refresh
              </button>
            </div>
          </div>

          {actionResult && <p className={`text-xs text-center mb-3 ${actionResult.ok ? "text-green-400" : "text-red-400"}`}>{actionResult.message}</p>}

          {/* Filters */}
          {/* Search + dropdowns */}
          <div className="flex flex-wrap gap-2 mb-2">
            <div className="relative flex-1 min-w-[140px]">
              <input type="text" placeholder="Search name, tag or clan…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
              {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition text-xs">✕</button>}
            </div>
            <select value={filterClan} onChange={e => setFilterClan(e.target.value)} className={pillSelect}>
              <option value="all">All Clans</option>
              <option value="alliance">In Alliance</option>
              <option value="outside">Outside</option>
            </select>
            <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className={pillSelect}>
              <option value="all">All Users</option>
              {discordUsers.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
          {/* Toggle pill filters */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {[
              { key: "filterStatus",  val: filterStatus,  set: setFilterStatus,  opts: [["all","Status"],["active","Active"],["inactive","Inactive"]], colours: { active: "green", inactive: "red" } },
              { key: "filterPool",    val: filterPool,    set: setFilterPool,    opts: [["all","Pool"],["in","In Pool"],["out","Not In Pool"]], colours: { in: "purple", out: "slate" } },
              { key: "filterDiscord", val: filterDiscord, set: setFilterDiscord, opts: [["all","Discord"],["yes","Discord ✓"],["no","No Discord"]], colours: { yes: "blue", no: "slate" } },
              { key: "filterToken",   val: filterToken,   set: setFilterToken,   opts: [["all","Token"],["yes","Token ✓"],["no","No Token"]], colours: { yes: "green", no: "slate" } },
            ].map(({ key, val, set, opts, colours }) => {
              const isFiltered = val !== "all";
              const colourMap = { green: "border-green-500/40 text-green-400 bg-green-500/10", blue: "border-blue-500/40 text-blue-400 bg-blue-500/10", purple: "border-purple-500/40 text-purple-300 bg-purple-500/10", red: "border-red-500/40 text-red-400 bg-red-500/10", slate: "border-white/10 text-slate-400 bg-white/[0.03]" };
              const activeColour = isFiltered ? (colourMap[colours[val]] || colourMap.slate) : "border-white/10 text-slate-500 bg-transparent";
              const nextIdx = (opts.findIndex(([v]) => v === val) + 1) % opts.length;
              const label = opts.find(([v]) => v === val)?.[1] || opts[0][1];
              return (
                <button key={key} onClick={() => set(opts[nextIdx][0])}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-widest transition ${activeColour}`}>
                  {isFiltered && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80"/>}
                  {label}
                  {isFiltered && <span onClick={e => { e.stopPropagation(); set("all"); }} className="ml-0.5 opacity-60 hover:opacity-100 text-[10px]">✕</span>}
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-700 mb-3">{filtered.length} of {members.length} accounts</p>

          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-2xl bg-white/[0.04] animate-pulse"/>)}</div>
          ) : (
            <div className="space-y-2">
              {filtered.map(m => (
                <div key={m.player_tag} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                  {/* Main row */}
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <ThIcon level={m.town_hall_level}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">{m.player_name}</p>
                        {m.active === false && <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-red-500/40 text-red-400 uppercase tracking-widest">Inactive</span>}
                        {!ALLIANCE_CLAN_TAGS.includes(m.current_clan_tag) && m.current_clan_tag && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-amber-500/40 text-amber-400 uppercase tracking-widest">Outside</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-600 font-mono">{m.player_tag}</p>
                      {m.current_clan_name && <p className="text-[10px] text-slate-500 truncate">{m.current_clan_name}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span title={m.in_pool ? "In pool" : "Not in pool"}
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] border ${m.in_pool ? "border-purple-500/40 text-purple-400" : "border-white/10 text-slate-700"}`}>
                        {m.in_pool ? "✓" : "—"}
                      </span>
                      <span title={m.discord_id ? "Discord linked" : "No Discord"}
                        className={`w-5 h-5 rounded-full flex items-center justify-center border ${m.discord_id ? "border-blue-500/40 text-blue-400" : "border-white/10 text-slate-700"}`}>
                        <svg className="w-2.5 h-2.5" viewBox="0 0 127.14 96.36" fill="currentColor">
                          <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
                        </svg>
                      </span>
                      <span title={m.api_token_verified ? "Token verified" : "No token"}
                        className={`w-5 h-5 rounded-full flex items-center justify-center border ${m.api_token_verified ? "border-green-500/40 text-green-400" : "border-white/10 text-slate-700"}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                      </span>
                      {/* Manage toggle */}
                      <button onClick={() => setManagingTag(managingTag === m.player_tag ? null : m.player_tag)}
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${managingTag === m.player_tag ? "border-purple-500/60 text-purple-400 bg-purple-500/10" : "border-white/10 text-slate-600 hover:text-slate-300 hover:border-white/20"}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                      </button>
                    </div>
                  </div>
                  {/* Manage panel */}
                  {managingTag === m.player_tag && (
                    <div className="px-3 pb-3 pt-1 border-t border-white/[0.06] flex items-center gap-2 flex-wrap">
                      <button onClick={() => handleSetActive(m.player_tag, m.active === false)} disabled={actionLoading}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-semibold border transition disabled:opacity-40 ${m.active === false ? "border-green-500/40 text-green-400 hover:border-green-400" : "border-amber-500/40 text-amber-400 hover:border-amber-400"}`}>
                        {m.active === false ? "Set Active" : "Set Inactive"}
                      </button>
                      <button onClick={() => { setConfirmDelete({ tag: m.player_tag, name: m.player_name }); setConfirmInput(""); }}
                        className="px-3 py-1.5 rounded-full text-[10px] font-semibold border border-red-500/40 text-red-400 hover:border-red-400 transition">
                        Delete Account
                      </button>
                      {m.discord_username && <span className="text-[10px] text-slate-600 ml-auto">Discord: {m.discord_username}</span>}
                    </div>
                  )}
                </div>
              ))}
              {filtered.length === 0 && <p className="text-slate-700 text-xs text-center py-6">No members match your filters</p>}
            </div>
          )}
        </div>
      </div>

      )} {/* end members tab */}

      {dirTab === "missing" && (
      <div className="relative z-10 space-y-3 mt-0">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Missing Members</h2>
              <p className="text-[10px] text-slate-700 mt-0.5">Alliance clan members not yet connected to the app</p>
            </div>
            <button onClick={handleCheckMissing} disabled={missingLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-300 hover:border-purple-400/60 transition text-[10px] uppercase tracking-widest font-semibold disabled:opacity-40">
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 ${missingLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              {missingLoading ? "Checking…" : "Refresh"}
            </button>
          </div>

          {showMissing && (
            <>
              {missingLoading ? (
                <div className="space-y-2">{[...Array(4)].map((_,i) => <div key={i} className="h-12 rounded-2xl bg-white/[0.04] animate-pulse"/>)}</div>
              ) : missingLoaded && (
                <>
                  <p className="text-[10px] text-slate-600 mb-3">{missing.length} member{missing.length !== 1 ? "s" : ""} not connected</p>
                  {missing.length === 0 ? (
                    <p className="text-xs text-green-400 text-center py-4">✓ All clan members are connected to the app</p>
                  ) : (
                    <div className="space-y-2">
                      {missing.map((m, i) => (
                        <div key={m.player_tag} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                          <div className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
                            {m.town_hall_level ? <img src={`/icons/th/th${m.town_hall_level}.png`} alt={`TH${m.town_hall_level}`} className="w-5 h-5 object-contain"/> : <span className="text-[9px] text-slate-600">?</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{m.player_name}</p>
                            <p className="text-[10px] text-slate-600 font-mono">{m.player_tag}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] text-slate-400">{m.clan_name.split(" ")[0]}</p>
                            <p className="text-[9px] text-slate-600 capitalize">{m.role?.toLowerCase().replace(/_/g, " ")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
      )} {/* end missing tab */}

      <AdminFooter/>
    </main>
  );
}
