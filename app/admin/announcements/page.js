"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import DiscordWidget from "../components/DiscordWidget";
import { BRANDING } from "../../lib/branding";
import { CWL_ICONS } from "../../lib/icons";

/* ─── helpers ──────────────────────────────────────────────── */
function Card({ children, className = "" }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 ${className}`}>
      {children}
    </div>
  );
}

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.06] ${className}`} />;
}

// Discord colour integer → hex string
function intToHex(n) {
  return "#" + n.toString(16).padStart(6, "0");
}
function hexToInt(hex) {
  return parseInt(hex.replace("#", ""), 16);
}

// Render a live Discord-style embed preview
function EmbedPreview({ embed, username, avatarUrl }) {
  if (!embed) return null;
  const colour = embed.color ? intToHex(embed.color) : "#a78bfa";

  return (
    <div className="rounded-lg overflow-hidden bg-[#2b2d31] text-sm font-sans w-full">
      {/* Sender row */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        {avatarUrl ? (
          <img src={avatarUrl} className="w-8 h-8 rounded-full" alt="" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-xs font-bold">
            {(username || "CGN")[0]}
          </div>
        )}
        <span className="text-white font-semibold text-sm">{username || "CGN CWL Hub"}</span>
        <span className="text-[#949ba4] text-xs">Today at {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>

      {/* Embed card */}
      <div className="mx-4 mb-4 flex rounded overflow-hidden max-w-lg">
        {/* Colour bar */}
        <div className="w-1 shrink-0" style={{ backgroundColor: colour }} />

        <div className="bg-[#2b2d31] border border-white/[0.06] rounded-r px-3 py-3 flex-1 min-w-0">
          {/* Author */}
          {embed.author?.name && (
            <div className="flex items-center gap-1.5 mb-1">
              {embed.author.icon_url && (
                <img src={embed.author.icon_url} className="w-4 h-4 rounded-full" alt="" />
              )}
              <span className="text-[#b5bac1] text-xs font-medium">{embed.author.name}</span>
            </div>
          )}

          {/* Title */}
          {embed.title && (
            <div className="text-white font-semibold text-sm mb-1">
              {embed.url ? (
                <a href={embed.url} className="text-[#00a8fc] hover:underline">{embed.title}</a>
              ) : embed.title}
            </div>
          )}

          {/* Description */}
          {embed.description && (
            <div className="text-[#dbdee1] text-sm mb-2 whitespace-pre-wrap leading-relaxed">
              {embed.description}
            </div>
          )}

          {/* Fields */}
          {embed.fields?.length > 0 && (
            <div className="grid gap-2 mb-2" style={{
              gridTemplateColumns: embed.fields.some(f => f.inline) ? "repeat(3, 1fr)" : "1fr"
            }}>
              {embed.fields.map((f, i) => (
                <div key={i} className={f.inline ? "" : "col-span-full"}>
                  <div className="text-white text-xs font-semibold mb-0.5">{f.name}</div>
                  <div className="text-[#dbdee1] text-xs">{f.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Image */}
          {embed.image?.url && (
            <img src={embed.image.url} className="rounded mt-2 max-w-full" alt="" />
          )}

          {/* Thumbnail */}
          {embed.thumbnail?.url && (
            <img src={embed.thumbnail.url} className="w-16 h-16 rounded float-right ml-2" alt="" />
          )}

          {/* Footer */}
          {(embed.footer?.text || embed.timestamp) && (
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/10">
              {embed.footer?.icon_url && (
                <img src={embed.footer.icon_url} className="w-4 h-4 rounded-full" alt="" />
              )}
              <span className="text-[#949ba4] text-[11px]">
                {embed.footer?.text}
                {embed.footer?.text && embed.timestamp && " · "}
                {embed.timestamp && new Date(embed.timestamp).toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Components V2 link button */}
          {embed._button?.label && embed._button?.url && (
            <div className="mt-3">
              <a
                href={embed._button.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#4e505880] border border-white/10 text-white text-xs font-medium hover:bg-[#6d6f7880] transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {embed._button.label}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── default embed state ───────────────────────────────────── */
const DEFAULT_EMBED = {
  color: hexToInt("#a78bfa"),
  author: { name: "CGN CWL Hub", icon_url: "" },
  title: "",
  url: "",
  description: "",
  fields: [],
  thumbnail: { url: "" },
  image: { url: "" },
  footer: { text: "Cognition Collective", icon_url: "" },
  timestamp: null,
  _button: { label: "", url: "" },
};

/* ─── main page ─────────────────────────────────────────────── */
export default function AnnouncementsPage() {
  const { data: session } = useSession();
  const [pin, setPin] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [pinError, setPinError] = useState(false);

  const [webhooks, setWebhooks] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Webhook form
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newChannel, setNewChannel] = useState("");
  const [addingWebhook, setAddingWebhook] = useState(false);
  const [webhookResult, setWebhookResult] = useState(null);
  const [showAddWebhook, setShowAddWebhook] = useState(false);

  // Compose
  const [selectedWebhookId, setSelectedWebhookId] = useState(null);
  const [embed, setEmbed] = useState({ ...DEFAULT_EMBED });
  const [username, setUsername] = useState("CGN CWL Hub");
  const [avatarUrl, setAvatarUrl] = useState(BRANDING.cwlhub ? `https://cgnco.vercel.app${BRANDING.cwlhub}` : "");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  // Tabs
  const [tab, setTab] = useState("compose"); // "compose" | "webhooks" | "history"

  // Session PIN restore
  const SESSION_KEY = "cwl_admin_pin_confirmed";
  const { status: discordStatus } = useSession();

  useEffect(() => {
    if (discordStatus !== "authenticated") return;
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) { setPin(saved); setAuthed(true); }
  }, [discordStatus]);

  useEffect(() => {
    if (!authed) return;
    setLoadingData(true);
    Promise.all([
      fetch("/api/admin/announcements", { headers: { "x-officer-pin": pin } }).then(r => r.json()),
    ]).then(([wData]) => {
      setWebhooks(wData.webhooks || []);
      if (wData.webhooks?.length > 0 && !selectedWebhookId) {
        setSelectedWebhookId(wData.webhooks[0].id);
      }
    }).finally(() => setLoadingData(false));
  }, [authed]);

  function handlePinSubmit(e) {
    e.preventDefault();
    setPin(pinInput);
    setAuthed(true);
    setPinError(false);
    if (discordStatus === "authenticated") {
      sessionStorage.setItem(SESSION_KEY, pinInput);
    }
  }

  // Embed field helpers
  function setEmbedField(key, value) {
    setEmbed(prev => ({ ...prev, [key]: value }));
  }
  function setNestedField(parent, key, value) {
    setEmbed(prev => ({ ...prev, [parent]: { ...prev[parent], [key]: value } }));
  }
  function addField() {
    setEmbed(prev => ({ ...prev, fields: [...prev.fields, { name: "", value: "", inline: false }] }));
  }
  function updateField(i, key, value) {
    setEmbed(prev => {
      const fields = [...prev.fields];
      fields[i] = { ...fields[i], [key]: value };
      return { ...prev, fields };
    });
  }
  function removeField(i) {
    setEmbed(prev => ({ ...prev, fields: prev.fields.filter((_, idx) => idx !== i) }));
  }

  // Templates
  function applyTemplate(type) {
    if (type === "season-open") {
      setEmbed({
        ...DEFAULT_EMBED,
        title: "🎮 CWL Season is Open!",
        description: "The new CWL season is now open for sign-ups. Register your accounts on the Hub and get ready for CWL.",
        color: hexToInt("#a78bfa"),
        fields: [{ name: "Sign Up Deadline", value: "Before rosters are finalised", inline: false }],
        _button: { label: "Sign Up Now →", url: "https://cgnco.vercel.app/signup" },
      });
    } else if (type === "rosters-final") {
      setEmbed({
        ...DEFAULT_EMBED,
        title: "📋 Rosters Finalised",
        description: "CWL rosters have been finalised. Check the Hub to see your clan assignment.",
        color: hexToInt("#34d399"),
        _button: { label: "View Rosters →", url: "https://cgnco.vercel.app" },
      });
    } else if (type === "season-closing") {
      setEmbed({
        ...DEFAULT_EMBED,
        title: "⏳ Season Closing Soon",
        description: "The current CWL season is closing soon. Make sure you have signed up before rosters are locked.",
        color: hexToInt("#fb923c"),
        _button: { label: "Sign Up Now →", url: "https://cgnco.vercel.app/signup" },
      });
    }
  }

  async function handleSend() {
    if (!selectedWebhookId) return;
    setSending(true);
    setSendResult(null);

    // Build clean embed (strip _button, handle it as components)
    const { _button, ...cleanEmbed } = embed;
    if (!cleanEmbed.author?.name) delete cleanEmbed.author;
    if (!cleanEmbed.thumbnail?.url) delete cleanEmbed.thumbnail;
    if (!cleanEmbed.image?.url) delete cleanEmbed.image;
    if (!cleanEmbed.footer?.text) delete cleanEmbed.footer;
    if (!cleanEmbed.timestamp) delete cleanEmbed.timestamp;
    if (!cleanEmbed.url) delete cleanEmbed.url;
    cleanEmbed.fields = cleanEmbed.fields.filter(f => f.name && f.value);

    // Add button back as part of embed (link buttons work in embeds via components)
    const finalEmbed = {
      ...cleanEmbed,
      ...(_button?.label && _button?.url ? { _button } : {}),
    };

    try {
      const res = await fetch("/api/admin/announcements/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify({
          webhookId: selectedWebhookId,
          embed: finalEmbed,
          content: content || undefined,
          username,
          avatarUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSendResult({ ok: true, message: "Posted to Discord ✓" });
        setEmbed({ ...DEFAULT_EMBED });
        setContent("");
      } else {
        setSendResult({ ok: false, message: data.error || "Failed to send" });
      }
    } catch {
      setSendResult({ ok: false, message: "Network error" });
    } finally {
      setSending(false);
    }
  }

  async function handleAddWebhook(e) {
    e.preventDefault();
    if (!newLabel || !newUrl) return;
    setAddingWebhook(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify({ label: newLabel, webhookUrl: newUrl, channel: newChannel }),
      });
      const data = await res.json();
      if (res.ok) {
        setWebhooks(prev => [...prev, data.webhook]);
        setSelectedWebhookId(data.webhook.id);
        setNewLabel(""); setNewUrl(""); setNewChannel("");
        setShowAddWebhook(false);
        setWebhookResult({ ok: true, message: "Webhook added" });
      } else {
        setWebhookResult({ ok: false, message: data.error });
      }
    } catch {
      setWebhookResult({ ok: false, message: "Network error" });
    } finally {
      setAddingWebhook(false);
    }
  }

  async function handleDeleteWebhook(id) {
    await fetch("/api/admin/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-officer-pin": pin },
      body: JSON.stringify({ id }),
    });
    setWebhooks(prev => prev.filter(w => w.id !== id));
    if (selectedWebhookId === id) setSelectedWebhookId(webhooks.find(w => w.id !== id)?.id || null);
  }

  // ── PIN gate ──
  if (!authed) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-6 flex flex-col items-center justify-center">
        <Card className="w-full max-w-sm text-center">
          <img src={BRANDING.cwlhub} alt="" className="w-14 h-14 mx-auto mb-4" />
          <h1 className="text-2xl font-thin tracking-widest mb-1">Announcements</h1>
          <p className="text-slate-500 text-xs mb-5">Admin access required</p>
          <form onSubmit={handlePinSubmit} className="space-y-3">
            <input
              type="password"
              placeholder="Officer PIN"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition text-center tracking-widest text-lg"
            />
            {pinError && <p className="text-red-400 text-xs">Incorrect PIN</p>}
            <button type="submit" disabled={!pinInput}
              className="w-full py-2.5 rounded-2xl bg-purple-600/30 text-purple-200 border border-purple-500/30 hover:bg-purple-600/50 transition font-semibold text-sm disabled:opacity-40">
              Enter
            </button>
          </form>
        </Card>
      </main>
    );
  }

  // ── Main page ──
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-6 pb-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full" />
      </div>

      {/* Top row */}
      <div className="relative z-10 grid grid-cols-3 items-center mb-6">
        <Link href="/admin/pool" className="text-sm text-slate-500 hover:text-white transition flex items-center gap-1.5 justify-self-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Pool
        </Link>
        <div className="flex justify-center">
          <DiscordWidget variant="center" />
        </div>
        <div />
      </div>

      {/* Hero card */}
      <div className="relative z-10 mb-6">
        <Card className="text-center py-5">
          <div className="flex items-center justify-center gap-2 mb-1">
            {/* Discord logo */}
            <svg className="w-5 h-5 text-[#5865f2]" viewBox="0 0 127.14 96.36" fill="currentColor">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
            </svg>
            <h1 className="text-2xl font-thin tracking-widest">Announcements</h1>
          </div>
          <p className="text-slate-500 text-xs">Post rich embeds to your Discord server</p>

          {/* Tab switcher */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {["compose", "webhooks", "history"].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition capitalize ${
                  tab === t
                    ? "bg-purple-600/30 text-purple-200 border-purple-500/40"
                    : "bg-white/[0.03] text-slate-400 border-white/10 hover:bg-white/[0.06] hover:text-slate-200"
                }`}>
                {t}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ── COMPOSE TAB ── */}
      {tab === "compose" && (
        <div className="relative z-10 space-y-4">

          {/* Webhook selector + templates */}
          <Card>
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-xs text-slate-400 uppercase tracking-widest">Post to</p>
              {webhooks.length === 0 && (
                <button onClick={() => setTab("webhooks")}
                  className="text-xs text-purple-400 hover:text-purple-200 transition">
                  Add a webhook first →
                </button>
              )}
            </div>
            {webhooks.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {webhooks.map(w => (
                  <button key={w.id} onClick={() => setSelectedWebhookId(w.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                      selectedWebhookId === w.id
                        ? "bg-[#5865f2]/30 text-[#7289da] border-[#5865f2]/40"
                        : "bg-white/[0.03] text-slate-400 border-white/10 hover:bg-white/[0.06]"
                    }`}>
                    # {w.label}
                  </button>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Quick templates</p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "season-open", label: "🎮 Season Open" },
                { key: "rosters-final", label: "📋 Rosters Finalised" },
                { key: "season-closing", label: "⏳ Season Closing" },
              ].map(t => (
                <button key={t.key} onClick={() => applyTemplate(t.key)}
                  className="px-3 py-1 rounded-full text-xs font-semibold border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] hover:text-white transition">
                  {t.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Sender identity */}
          <Card>
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">Sender</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Display name</label>
                <input value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Avatar URL</label>
                <input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
              </div>
            </div>
          </Card>

          {/* Embed composer */}
          <Card>
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">Embed</p>
            <div className="space-y-3">

              {/* Colour */}
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-500 shrink-0">Colour</label>
                <input type="color" value={intToHex(embed.color)}
                  onChange={e => setEmbedField("color", hexToInt(e.target.value))}
                  className="w-8 h-8 rounded cursor-pointer border border-white/10 bg-transparent" />
                <span className="text-xs text-slate-500 font-mono">{intToHex(embed.color)}</span>
              </div>

              {/* Author */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Author name</label>
                <input value={embed.author?.name || ""} onChange={e => setNestedField("author", "name", e.target.value)}
                  placeholder="CGN CWL Hub"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
              </div>

              {/* Title + URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Title</label>
                  <input value={embed.title} onChange={e => setEmbedField("title", e.target.value)}
                    placeholder="Announcement title"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Title URL (optional)</label>
                  <input value={embed.url} onChange={e => setEmbedField("url", e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Description</label>
                <textarea value={embed.description} onChange={e => setEmbedField("description", e.target.value)}
                  rows={4} placeholder="Main body text. Supports **bold**, *italic*, and `code`."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition resize-none" />
              </div>

              {/* Fields */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-slate-500">Fields</label>
                  <button onClick={addField}
                    className="text-xs text-purple-400 hover:text-purple-200 transition">+ Add field</button>
                </div>
                <div className="space-y-2">
                  {embed.fields.map((f, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input value={f.name} onChange={e => updateField(i, "name", e.target.value)}
                          placeholder="Label"
                          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
                        <input value={f.value} onChange={e => updateField(i, "value", e.target.value)}
                          placeholder="Value"
                          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <label className="text-[10px] text-slate-500">inline</label>
                        <input type="checkbox" checked={f.inline} onChange={e => updateField(i, "inline", e.target.checked)} />
                        <button onClick={() => removeField(i)} className="text-slate-600 hover:text-red-400 transition text-xs">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Thumbnail URL</label>
                  <input value={embed.thumbnail?.url || ""} onChange={e => setNestedField("thumbnail", "url", e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Image URL</label>
                  <input value={embed.image?.url || ""} onChange={e => setNestedField("image", "url", e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
                </div>
              </div>

              {/* Footer + timestamp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Footer text</label>
                  <input value={embed.footer?.text || ""} onChange={e => setNestedField("footer", "text", e.target.value)}
                    placeholder="Cognition Collective"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
                </div>
                <div className="flex items-end gap-2">
                  <label className="text-xs text-slate-500">Include timestamp</label>
                  <input type="checkbox"
                    checked={!!embed.timestamp}
                    onChange={e => setEmbedField("timestamp", e.target.checked ? new Date().toISOString() : null)} />
                </div>
              </div>

              {/* Link button */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Link button (optional)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input value={embed._button?.label || ""} onChange={e => setNestedField("_button", "label", e.target.value)}
                    placeholder="Sign Up Now →"
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
                  <input value={embed._button?.url || ""} onChange={e => setNestedField("_button", "url", e.target.value)}
                    placeholder="https://..."
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
                </div>
              </div>

              {/* Content (above embed) */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Message content (above embed, optional — for @mentions)</label>
                <input value={content} onChange={e => setContent(e.target.value)}
                  placeholder="@everyone"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
              </div>
            </div>
          </Card>

          {/* Live preview */}
          <Card>
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">Preview</p>
            <EmbedPreview embed={embed} username={username} avatarUrl={avatarUrl} />
          </Card>

          {/* Send button */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleSend}
              disabled={sending || !selectedWebhookId || !embed.title}
              className="
                inline-flex items-center gap-2
                px-8 py-3 rounded-full font-semibold text-sm
                bg-[#5865f2]/30 text-[#7289da] border border-[#5865f2]/40
                hover:bg-[#5865f2]/50 hover:text-white transition
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              <svg className="w-4 h-4" viewBox="0 0 127.14 96.36" fill="currentColor">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
              </svg>
              {sending ? "Posting…" : "Post to Discord"}
            </button>
            {sendResult && (
              <p className={`text-xs ${sendResult.ok ? "text-green-400" : "text-red-400"}`}>
                {sendResult.message}
              </p>
            )}
            {!selectedWebhookId && (
              <p className="text-xs text-slate-600">Add a webhook in the Webhooks tab first</p>
            )}
          </div>
        </div>
      )}

      {/* ── WEBHOOKS TAB ── */}
      {tab === "webhooks" && (
        <div className="relative z-10 space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-slate-400 uppercase tracking-widest">Webhook channels</p>
              <button onClick={() => setShowAddWebhook(v => !v)}
                className="text-xs text-purple-400 hover:text-purple-200 transition">
                {showAddWebhook ? "Cancel" : "+ Add webhook"}
              </button>
            </div>

            {showAddWebhook && (
              <form onSubmit={handleAddWebhook} className="space-y-3 mb-5 p-4 rounded-2xl border border-white/10 bg-white/[0.03]">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Label (e.g. "Announcements")</label>
                  <input value={newLabel} onChange={e => setNewLabel(e.target.value)} required
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none transition" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Webhook URL</label>
                  <input value={newUrl} onChange={e => setNewUrl(e.target.value)} required
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none transition" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Channel name (optional)</label>
                  <input value={newChannel} onChange={e => setNewChannel(e.target.value)}
                    placeholder="#announcements"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none transition" />
                </div>
                <button type="submit" disabled={addingWebhook}
                  className="w-full py-2 rounded-xl bg-purple-600/30 text-purple-200 border border-purple-500/30 hover:bg-purple-600/50 transition text-sm font-semibold disabled:opacity-40">
                  {addingWebhook ? "Adding…" : "Add webhook"}
                </button>
                {webhookResult && (
                  <p className={`text-xs text-center ${webhookResult.ok ? "text-green-400" : "text-red-400"}`}>
                    {webhookResult.message}
                  </p>
                )}
              </form>
            )}

            {loadingData ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : webhooks.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-6">
                No webhooks yet. Add one to start posting announcements.
              </p>
            ) : (
              <div className="space-y-2">
                {webhooks.map(w => (
                  <div key={w.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{w.label}</p>
                      {w.channel && <p className="text-xs text-slate-500">{w.channel}</p>}
                    </div>
                    <button onClick={() => handleDeleteWebhook(w.id)}
                      className="text-slate-600 hover:text-red-400 transition text-xs shrink-0">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === "history" && (
        <div className="relative z-10">
          <Card>
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-4">Recent announcements</p>
            {history.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-6">No announcements posted yet.</p>
            ) : (
              <div className="space-y-2">
                {history.map(h => (
                  <div key={h.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white truncate">{h.title || "Untitled"}</p>
                      <span className="text-xs text-slate-500 shrink-0">
                        {new Date(h.sent_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {h.webhook_label && `# ${h.webhook_label}`}
                      {h.sent_by && ` · by ${h.sent_by}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </main>
  );
}
