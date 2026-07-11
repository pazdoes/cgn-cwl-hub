"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { CWL_ICONS } from "../../../lib/icons";

/* ─── Admin nav ──────────────────────────────────────────────── */
function AdminNav({ active }) {
  return (
    <nav className="flex items-center gap-1 flex-wrap">
      {[
        { href: "/admin", label: "Overview" },
        { href: "/admin/pool", label: "Pool Manager" },
        { href: "/admin/clans", label: "Clan Manager" },
        { href: "/admin/announcements", label: "Announcements" },
      ].map(({ href, label }) => (
        <Link key={href} href={href}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
            active === label
              ? "border-purple-500/50 text-purple-300 bg-purple-500/10"
              : "border-white/10 text-slate-400 hover:text-white hover:border-white/20"
          }`}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

/* ─── ClanBoardManager (from announcements page) ────────────── */
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
    const newOrder = idx + 1;
    const swapOrder = swapIdx + 1;
    await Promise.all([
      save(clan, { included: clan.included, seed_wins: clan.seed_wins, seed_draws: clan.seed_draws, seed_losses: clan.seed_losses, cwl_only: clan.cwl_only, side_war_only: clan.side_war_only, display_order: swapOrder }),
      save(swap, { included: swap.included, seed_wins: swap.seed_wins, seed_draws: swap.seed_draws, seed_losses: swap.seed_losses, cwl_only: swap.cwl_only, side_war_only: swap.side_war_only, display_order: newOrder }),
    ]);
  }

  if (loading) return <div className="animate-pulse h-20 bg-white/[0.04] rounded-2xl"/>;

  return (
    <div className="space-y-3">
      {status?.ok && <p className="text-green-400 text-xs">{status.ok}</p>}
      {status?.error && <p className="text-red-400 text-xs">{status.error}</p>}
      {clans.map((clan, idx) => (
        <div key={clan.clan_tag} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5 shrink-0">
              <button onClick={() => reorder(clan, "up")} disabled={idx === 0 || saving === clan.clan_tag}
                className="text-slate-600 hover:text-slate-300 transition disabled:opacity-20 text-xs leading-none">▲</button>
              <button onClick={() => reorder(clan, "down")} disabled={idx === clans.length - 1 || saving === clan.clan_tag}
                className="text-slate-600 hover:text-slate-300 transition disabled:opacity-20 text-xs leading-none">▼</button>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{clan.clan_name}</p>
              <p className="text-[9px] text-slate-600">{clan.is_side_war ? "Side War Clan" : clan.cwl_rank || "—"}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {!clan.is_side_war && (
                <button onClick={() => save(clan, { included: clan.included, seed_wins: clan.seed_wins, seed_draws: clan.seed_draws, seed_losses: clan.seed_losses, display_order: clan.display_order, cwl_only: !clan.cwl_only, side_war_only: clan.side_war_only })} disabled={saving === clan.clan_tag}
                  className={`rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-widest border transition ${clan.cwl_only ? "border-amber-500/40 text-amber-400" : "border-white/10 text-slate-600 hover:border-white/20"}`}>
                  CWL Only
                </button>
              )}
              {clan.is_side_war && (
                <button onClick={() => save(clan, { included: clan.included, seed_wins: clan.seed_wins, seed_draws: clan.seed_draws, seed_losses: clan.seed_losses, display_order: clan.display_order, cwl_only: clan.cwl_only, side_war_only: !clan.side_war_only })} disabled={saving === clan.clan_tag}
                  className={`rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-widest border transition ${clan.side_war_only ? "border-blue-500/40 text-blue-400" : "border-white/10 text-slate-600 hover:border-white/20"}`}>
                  SW Only
                </button>
              )}
              <button onClick={() => save(clan, { included: !clan.included, seed_wins: clan.seed_wins, seed_draws: clan.seed_draws, seed_losses: clan.seed_losses, display_order: clan.display_order, cwl_only: clan.cwl_only, side_war_only: clan.side_war_only })} disabled={saving === clan.clan_tag}
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

/* ─── ClanInfoBoardTool (from announcements page) ───────────── */
function ClanInfoBoardTool({ pin }) {
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
        body: JSON.stringify({ webhook_url: webhookUrl.trim(), pin }),
      });
      const d = await res.json();
      if (d.success) {
        const now = new Date();
        const ts = now.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
        setStatus({ ok: `Posted ${d.clansPosted} clans · ${ts}` });
        setWebhookUrl(""); loadMessages();
      } else setStatus({ error: d.error || "Failed to post" });
    } catch { setStatus({ error: "Network error" }); }
    finally { setPosting(false); }
  }

  async function handleUpdate(url) {
    setPosting(true); setStatus(null);
    try {
      const res = await fetch("/api/clan-info-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhook_url: url, pin }),
      });
      const d = await res.json();
      if (d.success) {
        const now = new Date();
        const ts = now.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
        setStatus({ ok: `Updated · ${ts}` }); loadMessages();
      } else setStatus({ error: d.error || "Failed to update" });
    } catch { setStatus({ error: "Network error" }); }
    finally { setPosting(false); }
  }

  async function handleDeleteBoard(id) {
    if (!confirm("Delete this board? The Discord message will remain but will no longer auto-update.")) return;
    setPosting(true); setStatus(null);
    try {
      const res = await fetch("/api/clan-info-board", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pin }),
      });
      const d = await res.json();
      if (d.success) { setStatus({ ok: "Board deleted" }); loadMessages(); }
      else setStatus({ error: d.error || "Failed to delete" });
    } catch { setStatus({ error: "Network error" }); }
    finally { setPosting(false); }
  }

  return (
    <div className="space-y-4">
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
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => handleUpdate(msg.webhook_url)} disabled={posting}
                    className="rounded-full border border-blue-500/40 text-blue-400 px-2.5 py-0.5 text-[9px] uppercase tracking-widest hover:border-blue-400 transition disabled:opacity-40">
                    {posting ? "…" : "Update"}
                  </button>
                  <button onClick={() => handleDeleteBoard(msg.id)} disabled={posting}
                    className="rounded-full border border-red-500/30 text-red-400 px-2.5 py-0.5 text-[9px] uppercase tracking-widest hover:border-red-400 transition disabled:opacity-40">
                    Delete
                  </button>
                </div>
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

/* ─── Main page ──────────────────────────────────────────────── */
export default function AdminClansPage() {
  const [pin, setPinState] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState("clans");

  // Clan Manager state
  const [clans, setClans] = useState([]);
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
    const pin = p || pin;
    // Load clans
    fetch("/api/admin/members", { headers: { "x-officer-pin": p } })
      .then(r => r.json())
      .then(d => setClans(d.clans || []))
      .catch(() => {});
    // Load side wars
    fetch("/api/admin/side-wars", { headers: { "x-officer-pin": p } })
      .then(r => r.json())
      .then(d => setSideWars(d.wars || []))
      .catch(() => setSideWars([]));
  }

  function handlePinSubmit() {
    if (!pinInput.trim()) return;
    fetch("/api/admin/members", { headers: { "x-officer-pin": pinInput } })
      .then(r => {
        if (!r.ok) { setPinError(true); return; }
        setPinState(pinInput);
        setAuthed(true);
        setPinError(false);
        sessionStorage.setItem(SESSION_KEY, pinInput);
        loadData(pinInput);
      }).catch(() => setPinError(true));
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

  async function doAddClan() {
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

  async function doDeleteClan() {
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

  function toggleClanForm(tab) {
    setActiveClanForm(prev => prev === tab ? null : tab);
  }

  // Side Wars functions
  async function swCreate() {
    setSwError("");
    if (!swForm.clan_name || !swForm.clan_tag || !swForm.clan_link) { setSwError("Clan name, tag and link are required"); return; }
    setSwLoading(true);
    try {
      const res = await fetch("/api/admin/side-wars", { method: "POST", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify(swForm) });
      const data = await res.json();
      if (!res.ok) { setSwError(data.error || "Failed to save"); return; }
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
    else setSwTimeErrors(p => ({...p, [war.id]: data.error || "Failed to toggle"}));
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

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-6">
        <div className="w-full max-w-xs space-y-4">
          <AdminNav active="Clan Manager"/>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 text-center">
            <h1 className="text-xl font-thin tracking-widest mb-1">Clan Manager</h1>
            <p className="text-slate-600 text-xs mb-6">Enter your officer PIN to continue</p>
            <input type="password" value={pinInput} onChange={e => setPinInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handlePinSubmit()}
              placeholder="PIN"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-white text-lg tracking-widest focus:outline-none focus:border-purple-500/50 transition mb-3"/>
            {pinError && <p className="text-red-400 text-xs mb-3">Incorrect PIN</p>}
            <button onClick={handlePinSubmit}
              className="w-full py-2.5 rounded-2xl text-sm font-semibold bg-transparent text-purple-400 border border-purple-500/60 hover:border-purple-400 transition">
              Unlock
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 sm:p-6 pb-12">
      <div className="max-w-lg mx-auto space-y-4">
        <AdminNav active="Clan Manager"/>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 text-center">
          <h1 className="text-2xl font-thin tracking-widest">Clan Manager</h1>
          <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">Alliance · Side Wars · Info Board</p>
        </div>

        {/* Tab selector */}
        <div className="flex gap-1">
          {[["clans", "Alliance Clans"], ["sidewars", "Side Wars"], ["infoboard", "Info Board"]].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex-1 py-2 rounded-2xl text-[10px] uppercase tracking-widest font-semibold border transition ${
                activeTab === key ? "border-purple-500/50 text-purple-300 bg-purple-500/10" : "border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── ALLIANCE CLANS TAB ── */}
        {activeTab === "clans" && (
          <div className="space-y-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
              <button onClick={() => setActiveClanForm(v => v ? null : "add")}
                className="w-full flex items-center justify-between px-5 py-4 text-left">
                <div>
                  <p className="text-sm font-semibold text-slate-300">Alliance Clans</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">Add or remove clans · {clans.length} active</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-600 transition-transform ${activeClanForm ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              {activeClanForm && (
                <div className="px-5 pb-5 border-t border-white/10 pt-4 space-y-4">
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
                        className="w-full py-2.5 rounded-2xl text-xs font-semibold bg-transparent text-purple-400 border border-purple-500/60 hover:border-purple-400 hover:text-purple-300 transition disabled:opacity-40">
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
                        className="w-full py-2.5 rounded-2xl text-xs font-semibold bg-transparent text-red-400 border border-red-500/60 hover:border-red-400 hover:text-red-300 transition disabled:opacity-40">
                        {deleteClanSubmitting ? "Deleting…" : "Delete Clan"}
                      </button>
                      {deleteClanResult && <p className={`text-xs text-center ${deleteClanResult.ok ? "text-green-300" : "text-red-400"}`}>{deleteClanResult.message}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SIDE WARS TAB ── */}
        {activeTab === "sidewars" && (
          <div className="space-y-3">
            {sideWars.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
                <p className="text-slate-600 text-xs">No clans saved yet — add one below</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sideWars.map(war => {
                  const warId = war.id;
                  const pendingTime = swTimes[warId] ?? "";
                  const showPicker = !war.start_time || swTimes[warId] !== undefined;
                  const isRecurring = war.time_format === "recurring";
                  return (
                    <div key={warId} className={`rounded-3xl border ${war.is_active ? "border-pink-500/30 bg-pink-500/[0.04]" : "border-white/10 bg-white/[0.04]"} backdrop-blur-xl p-4`}>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src="/icons/branding/war-shield.png" alt="" className={`w-8 h-8 shrink-0 ${war.is_active ? "opacity-100" : "opacity-40"}`}/>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{war.clan_name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{war.clan_tag}</p>
                          </div>
                        </div>
                        <button onClick={() => swToggle(war)}
                          className={`px-3 py-1 rounded-full text-[10px] font-semibold border transition shrink-0 ${
                            war.is_active ? "bg-pink-500/20 border-pink-500/60 text-pink-300"
                            : war.start_time ? "bg-transparent border-white/10 text-slate-400 hover:border-pink-500/40 hover:text-pink-300"
                            : "bg-transparent border-white/[0.06] text-slate-600 cursor-not-allowed"
                          }`}>
                          {war.is_active ? "Live" : "Off"}
                        </button>
                      </div>
                      <div className="border-t border-white/[0.06] pt-3">
                        {war.start_time && !showPicker && (
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div>
                              <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-0.5">Scheduled</p>
                              <p className="text-[11px] text-slate-300">
                                {new Date(war.start_time).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC
                              </p>
                            </div>
                            <button onClick={() => setSwTimes(p => ({...p, [warId]: ""}))}
                              className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition border border-white/10 hover:border-white/20 rounded-full px-2.5 py-1">
                              Change
                            </button>
                          </div>
                        )}
                        {!war.start_time && <p className="text-[10px] text-slate-600 mb-2">No start time — schedule before activating</p>}
                        {showPicker && (
                          <div className="flex items-center gap-2">
                            <input type="datetime-local" value={pendingTime} onChange={e => setSwTimes(p => ({...p, [warId]: e.target.value}))}
                              className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/20 transition [color-scheme:dark]"/>
                            <button onClick={() => {
                              if (!pendingTime) { setSwTimeErrors(p => ({...p, [warId]: "Pick a date and time first"})); return; }
                              setSwTimeErrors(p => ({...p, [warId]: ""}));
                              const utcTime = new Date(pendingTime).toISOString();
                              fetch("/api/admin/side-wars", { method: "PATCH", headers: { "Content-Type": "application/json", "x-officer-pin": pin }, body: JSON.stringify({ id: warId, action: "set_time", start_time: utcTime }) })
                                .then(r => r.json()).then(data => {
                                  if (data.war) { setSideWars(prev => prev.map(w => w.id === warId ? data.war : w)); setSwTimes(p => { const n = {...p}; delete n[warId]; return n; }); }
                                });
                            }} className="flex items-center gap-1 px-3 py-1.5 rounded-2xl text-[10px] font-semibold bg-purple-500/[0.1] text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 transition shrink-0">
                              Set
                            </button>
                          </div>
                        )}
                        {swTimeErrors[warId] && <p className="text-[10px] text-red-400 mt-1">{swTimeErrors[warId]}</p>}
                      </div>
                      <div className="border-t border-white/[0.06] pt-3 mt-3">
                        <button onClick={() => swSetFormat(warId, isRecurring ? "countdown" : "recurring")}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl text-[10px] font-semibold border transition ${isRecurring ? "bg-purple-500/20 border-purple-500/60 text-purple-300" : "bg-transparent border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300"}`}>
                          Recurring {isRecurring ? "· On" : "· Off"}
                        </button>
                      </div>
                      {war.is_active && (
                        <div className="mt-3 pt-3 border-t border-pink-500/10 flex items-center justify-between">
                          <p className="text-[10px] text-pink-400">Visible on homepage</p>
                          <a href={war.clan_link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-slate-300 transition underline">View clan link</a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Manage clans */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
              <button onClick={() => setSwManageOpen(v => !v)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                <div className="flex items-center gap-2">
                  <img src="/icons/branding/war-shield.png" alt="" className="w-5 h-5 opacity-60"/>
                  <span className="text-sm font-semibold text-white">Manage Clans</span>
                  {sideWars.length > 0 && <span className="text-[10px] text-slate-500">{sideWars.length} saved</span>}
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-500 transition-transform ${swManageOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              {swManageOpen && (
                <div className="border-t border-white/[0.06] px-5 pb-5 pt-4 space-y-4">
                  <div>
                    <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Add Clan</p>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">Clan Name</p>
                          <input value={swForm.clan_name} onChange={e => setSwForm(p => ({...p, clan_name: e.target.value}))} placeholder="Cognition {CGN}"
                            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">Clan Tag</p>
                          <input value={swForm.clan_tag} onChange={e => setSwForm(p => ({...p, clan_tag: e.target.value}))} placeholder="#2C8QQPCL2"
                            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">Clan Link</p>
                        <input value={swForm.clan_link} onChange={e => setSwForm(p => ({...p, clan_link: e.target.value}))} placeholder="https://link.clashofclans.com/..."
                          className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                      </div>
                      {swError && <p className="text-[11px] text-red-400">{swError}</p>}
                      <button onClick={swCreate} disabled={swLoading}
                        className="w-full py-2.5 rounded-2xl text-xs font-semibold bg-pink-500/[0.1] text-pink-300 border border-pink-500/30 hover:bg-pink-500/20 hover:border-pink-400 transition disabled:opacity-50">
                        {swLoading ? "Saving…" : "Save Clan"}
                      </button>
                    </div>
                  </div>
                  {sideWars.length > 0 && (
                    <div>
                      <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Remove Clan</p>
                      <div className="space-y-2">
                        {sideWars.map(war => (
                          <div key={war.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                            <div className="min-w-0">
                              <p className="text-xs text-white truncate">{war.clan_name}</p>
                              <p className="text-[10px] text-slate-600 font-mono">{war.clan_tag}</p>
                            </div>
                            <button onClick={() => swDelete(war.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] text-red-400 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10 transition shrink-0">
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── INFO BOARD TAB ── */}
        {activeTab === "infoboard" && (
          <div className="space-y-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 space-y-4">
              <div>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Clan Board Manager</p>
                <ClanBoardManager pin={pin}/>
              </div>
              <div className="border-t border-white/[0.06] pt-4">
                <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Post / Update Board</p>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">Paste a Discord webhook URL to post a live clan info board. Auto-updates every 6 hours.</p>
                <ClanInfoBoardTool pin={pin}/>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
