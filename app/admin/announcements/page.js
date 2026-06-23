"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import DiscordWidget from "../../components/DiscordWidget";
import { BRANDING } from "../../../lib/branding";
import { CWL_ICONS } from "../../../lib/icons";

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

function intToHex(n) { return "#" + n.toString(16).padStart(6, "0"); }
function hexToInt(hex) { return parseInt(hex.replace("#", ""), 16); }

/* ─── Hamburger nav ───────────────────────────────────────── */
function AdminNav() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)}
        className="w-8 h-8 rounded-full flex items-center justify-center border border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.08] hover:text-white transition"
        title="Admin menu">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }} transition={{ duration: 0.12 }}
            className="absolute left-0 top-full mt-2 z-50 min-w-[160px] rounded-2xl border border-white/10 bg-[#0d1424]/95 backdrop-blur-xl shadow-xl overflow-hidden">
            <div className="p-1.5 space-y-0.5">
              <Link href="/admin/pool" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Pool Manager
              </Link>
              <Link href="/admin/announcements" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-white bg-white/[0.06] transition">
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

/* ─── Discord embed preview ───────────────────────────────── */
function EmbedPreview({ embed, username, avatarUrl }) {
  if (!embed) return null;
  const colour = embed.color ? intToHex(embed.color) : "#a78bfa";
  return (
    <div className="rounded-lg overflow-hidden bg-[#2b2d31] text-sm font-sans w-full">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        {avatarUrl ? (
          <img src={avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="" onError={e => { e.target.style.display = "none"; }} />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-xs font-bold">
            {(username || "C")[0]}
          </div>
        )}
        <span className="text-white font-semibold text-sm">{username || "Cognition {CGN}"}</span>
        <span className="text-[#949ba4] text-xs">Today at {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
      <div className="mx-4 mb-4 flex rounded overflow-hidden max-w-lg">
        <div className="w-1 shrink-0" style={{ backgroundColor: colour }} />
        <div className="bg-[#2b2d31] border border-white/[0.06] rounded-r px-3 py-3 flex-1 min-w-0">
          {embed.author?.name && (
            <div className="flex items-center gap-1.5 mb-1">
              {embed.author.icon_url && <img src={embed.author.icon_url} className="w-4 h-4 rounded-full" alt="" onError={e => { e.target.style.display = "none"; }} />}
              <span className="text-[#b5bac1] text-xs font-medium">{embed.author.name}</span>
            </div>
          )}
          {embed.title && (
            <div className="text-white font-semibold text-sm mb-1">
              {embed.url ? <a href={embed.url} className="text-[#00a8fc] hover:underline">{embed.title}</a> : embed.title}
            </div>
          )}
          {embed.description && (
            <div className="text-[#dbdee1] text-sm mb-2 whitespace-pre-wrap leading-relaxed">{embed.description}</div>
          )}
          {embed.fields?.length > 0 && (
            <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: embed.fields.some(f => f.inline) ? "repeat(3, 1fr)" : "1fr" }}>
              {embed.fields.map((f, i) => (
                <div key={i} className={f.inline ? "" : "col-span-full"}>
                  <div className="text-white text-xs font-semibold mb-0.5">{f.name}</div>
                  <div className="text-[#dbdee1] text-xs">{f.value}</div>
                </div>
              ))}
            </div>
          )}
          {embed.image?.url && <img src={embed.image.url} className="rounded mt-2 max-w-full" alt="" onError={e => { e.target.style.display = "none"; }} />}
          {embed.thumbnail?.url && <img src={embed.thumbnail.url} className="w-16 h-16 rounded float-right ml-2" alt="" onError={e => { e.target.style.display = "none"; }} />}
          {(embed.footer?.text || embed.timestamp) && (
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/10">
              {embed.footer?.icon_url && <img src={embed.footer.icon_url} className="w-4 h-4 rounded-full" alt="" onError={e => { e.target.style.display = "none"; }} />}
              <span className="text-[#949ba4] text-[11px]">
                {embed.footer?.text}
                {embed.footer?.text && embed.timestamp && " · "}
                {embed.timestamp && new Date(embed.timestamp).toLocaleDateString()}
              </span>
            </div>
          )}
          {embed._button?.label && embed._button?.url && (
            <div className="mt-3">
              <a href={embed._button.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#4e505880] border border-white/10 text-white text-xs font-medium hover:bg-[#6d6f7880] transition">
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

/* ─── default state ───────────────────────────────────────── */
const DEFAULT_SENDER_NAME = "Cognition {CGN}";
const DEFAULT_AVATAR = "/cgn-skull.png";

const DEFAULT_EMBED = {
  color: hexToInt("#a78bfa"),
  author: { name: "Cognition {CGN}", icon_url: "" },
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

/* ─── Markdown toolbar ────────────────────────────────────── */
function MarkdownToolbar({ textareaRef, value, onChange }) {
  function wrap(before, after = before) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const newVal = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(newVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  }

  function insertMention(text) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const newVal = value.slice(0, start) + text + value.slice(start);
    onChange(newVal);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + text.length, start + text.length); }, 0);
  }

  const [roleId, setRoleId] = useState("");

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
      {[
        { label: "B", title: "Bold", before: "**", after: "**" },
        { label: "I", title: "Italic", before: "*", after: "*" },
        { label: "</>", title: "Code", before: "`", after: "`" },
        { label: "||", title: "Spoiler", before: "||", after: "||" },
      ].map(btn => (
        <button key={btn.label} type="button" title={btn.title}
          onClick={() => wrap(btn.before, btn.after)}
          className="px-2 py-0.5 rounded text-xs border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] transition font-mono">
          {btn.label}
        </button>
      ))}
      <div className="w-px h-4 bg-white/10 mx-0.5" />
      <button type="button" onClick={() => insertMention("@everyone")}
        className="px-2 py-0.5 rounded text-xs border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] transition">
        @everyone
      </button>
      <button type="button" onClick={() => insertMention("@here")}
        className="px-2 py-0.5 rounded text-xs border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] transition">
        @here
      </button>
      <div className="flex items-center gap-1">
        <input value={roleId} onChange={e => setRoleId(e.target.value.replace(/\D/g, ""))}
          placeholder="Role ID"
          className="w-24 rounded px-2 py-0.5 text-xs border border-white/10 bg-white/[0.04] text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
        <button type="button" onClick={() => { if (roleId) { insertMention(`<@&${roleId}>`); setRoleId(""); } }}
          disabled={!roleId}
          className="px-2 py-0.5 rounded text-xs border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] transition disabled:opacity-40">
          @role
        </button>
      </div>
    </div>
  );
}

/* ─── Timestamp tool ──────────────────────────────────────── */
function TimestampTool() {
  const [date, setDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [format, setFormat] = useState("f");
  const [copied, setCopied] = useState(false);

  const formats = [
    { key: "t", label: "Short time", example: "9:00 PM" },
    { key: "T", label: "Long time", example: "9:00:00 PM" },
    { key: "d", label: "Short date", example: "06/23/2026" },
    { key: "D", label: "Long date", example: "June 23, 2026" },
    { key: "f", label: "Date & time", example: "June 23, 2026 9:00 PM" },
    { key: "F", label: "Full date & time", example: "Tuesday, June 23, 2026 9:00 PM" },
    { key: "R", label: "Relative", example: "in 3 hours" },
  ];

  const unix = Math.floor(new Date(date).getTime() / 1000);
  const output = isNaN(unix) ? "" : `<t:${unix}:${format}>`;

  function copy() {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Card>
      <p className="text-xs text-slate-400 uppercase tracking-widest mb-4">Discord Timestamp Generator</p>
      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
        Discord timestamps display in every user's local timezone automatically.
        Paste the generated code anywhere in your embed description or fields.
      </p>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Date & Time</label>
          <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20 transition" />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-2 block">Display Format</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {formats.map(f => (
              <button key={f.key} type="button" onClick={() => setFormat(f.key)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs transition text-left ${format === f.key ? "bg-purple-600/20 border-purple-500/40 text-purple-200" : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"}`}>
                <span>{f.label}</span>
                <span className="text-slate-500 font-mono text-[10px]">{f.example}</span>
              </button>
            ))}
          </div>
        </div>
        {output && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-3">
              <code className="text-sm text-purple-300 font-mono">{output}</code>
              <button type="button" onClick={copy}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${copied ? "bg-green-500/20 border-green-500/30 text-green-300" : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white"}`}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Paste this code into your embed description or field values. Discord will render it as a live timestamp for every viewer.
        </p>
      </div>
    </Card>
  );
}

/* ─── main page ───────────────────────────────────────────── */
export default function AnnouncementsPage() {
  const { data: session, status: discordStatus } = useSession();
  const [pin, setPin] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [pinError, setPinError] = useState(false);

  const SESSION_KEY = "cwl_admin_pin_confirmed";

  useEffect(() => {
    if (discordStatus !== "authenticated") return;
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) { setPin(saved); setAuthed(true); }
  }, [discordStatus]);

  const [webhooks, setWebhooks] = useState([]);
  const [history, setHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newChannel, setNewChannel] = useState("");
  const [addingWebhook, setAddingWebhook] = useState(false);
  const [webhookResult, setWebhookResult] = useState(null);
  const [showAddWebhook, setShowAddWebhook] = useState(false);

  const [selectedWebhookId, setSelectedWebhookId] = useState(null);
  const [embed, setEmbed] = useState({ ...DEFAULT_EMBED });
  const [username, setUsername] = useState(DEFAULT_SENDER_NAME);
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduleAt, setScheduleAt] = useState(() => {
    const d = new Date(); d.setMinutes(d.getMinutes() + 60 - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [scheduling, setScheduling] = useState(false);
  const [scheduleResult, setScheduleResult] = useState(null);

  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [saveTemplateResult, setSaveTemplateResult] = useState(null);

  const [tab, setTab] = useState("compose");
  const descriptionRef = useRef(null);

  useEffect(() => {
    if (!authed) return;
    setLoadingData(true);
    Promise.all([
      fetch("/api/admin/announcements", { headers: { "x-officer-pin": pin } }).then(r => r.json()),
      fetch("/api/admin/announcements/templates", { headers: { "x-officer-pin": pin } }).then(r => r.json()).catch(() => ({ templates: [] })),
      fetch("/api/admin/announcements/schedule", { headers: { "x-officer-pin": pin } }).then(r => r.json()).catch(() => ({ scheduled: [] })),
    ]).then(([wData, tData, sData]) => {
      const wh = wData.webhooks || [];
      setWebhooks(wh);
      if (wh.length > 0 && !selectedWebhookId) setSelectedWebhookId(wh[0].id);
      setTemplates(tData.templates || []);
      setScheduled(sData.scheduled || []);
    }).finally(() => setLoadingData(false));
  }, [authed]);

  async function reloadHistory() {
    try {
      const res = await fetch("/api/admin/announcements/schedule", { headers: { "x-officer-pin": pin } });
      const data = await res.json();
      setScheduled(data.scheduled || []);
    } catch { /* non-fatal */ }
  }

  function handlePinSubmit(e) {
    e.preventDefault();
    setPin(pinInput); setAuthed(true); setPinError(false);
    if (discordStatus === "authenticated") sessionStorage.setItem(SESSION_KEY, pinInput);
  }

  function setEmbedField(key, value) { setEmbed(prev => ({ ...prev, [key]: value })); }
  function setNestedField(parent, key, value) { setEmbed(prev => ({ ...prev, [parent]: { ...prev[parent], [key]: value } })); }
  function addField() { setEmbed(prev => ({ ...prev, fields: [...prev.fields, { name: "", value: "", inline: false }] })); }
  function updateField(i, key, value) { setEmbed(prev => { const fields = [...prev.fields]; fields[i] = { ...fields[i], [key]: value }; return { ...prev, fields }; }); }
  function removeField(i) { setEmbed(prev => ({ ...prev, fields: prev.fields.filter((_, idx) => idx !== i) })); }

  function applyTemplate(type) {
    if (type === "season-open") {
      setEmbed({ ...DEFAULT_EMBED, title: "CWL Season is Open!", description: "The new CWL season is now open for sign-ups. Register your accounts on the Hub and get ready for CWL.", color: hexToInt("#a78bfa"), fields: [{ name: "Sign Up Deadline", value: "Before rosters are finalised", inline: false }], _button: { label: "Sign Up Now →", url: "https://cgnco.vercel.app/signup" } });
    } else if (type === "rosters-final") {
      setEmbed({ ...DEFAULT_EMBED, title: "Rosters Finalised", description: "CWL rosters have been finalised. Check the Hub to see your clan assignment.", color: hexToInt("#34d399"), _button: { label: "View Rosters →", url: "https://cgnco.vercel.app" } });
    } else if (type === "season-closing") {
      setEmbed({ ...DEFAULT_EMBED, title: "Season Closing Soon", description: "The current CWL season is closing soon. Make sure you have signed up before rosters are locked.", color: hexToInt("#fb923c"), _button: { label: "Sign Up Now →", url: "https://cgnco.vercel.app/signup" } });
    }
  }

  function applySavedTemplate(t) {
    const e = typeof t.embed_json === "string" ? JSON.parse(t.embed_json) : t.embed_json;
    setEmbed(e);
    if (t.username) setUsername(t.username);
    if (t.avatar_url) setAvatarUrl(t.avatar_url);
    if (t.webhook_id) setSelectedWebhookId(t.webhook_id);
  }

  function buildPayload() {
    const { _button, ...cleanEmbed } = embed;
    if (!cleanEmbed.author?.name) delete cleanEmbed.author;
    if (!cleanEmbed.thumbnail?.url) delete cleanEmbed.thumbnail;
    if (!cleanEmbed.image?.url) delete cleanEmbed.image;
    if (!cleanEmbed.footer?.text) delete cleanEmbed.footer;
    if (!cleanEmbed.timestamp) delete cleanEmbed.timestamp;
    if (!cleanEmbed.url) delete cleanEmbed.url;
    cleanEmbed.fields = cleanEmbed.fields.filter(f => f.name && f.value);
    return { embed: { ...cleanEmbed, ...(_button?.label && _button?.url ? { _button } : {}) }, _button };
  }

  async function handleSend() {
    if (!selectedWebhookId) return;
    setSending(true); setSendResult(null);
    const { embed: finalEmbed } = buildPayload();
    try {
      const res = await fetch("/api/admin/announcements/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify({ webhookId: selectedWebhookId, embed: finalEmbed, content: content || undefined, username, avatarUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setSendResult({ ok: true, message: "Posted to Discord ✓" });
        setEmbed({ ...DEFAULT_EMBED }); setContent("");
      } else { setSendResult({ ok: false, message: data.error || "Failed to send" }); }
    } catch { setSendResult({ ok: false, message: "Network error" }); }
    finally { setSending(false); }
  }

  async function handleSchedule() {
    if (!selectedWebhookId || !scheduleAt) return;
    setScheduling(true); setScheduleResult(null);
    const { embed: finalEmbed } = buildPayload();
    try {
      const res = await fetch("/api/admin/announcements/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify({ webhookId: selectedWebhookId, embed: finalEmbed, content: content || undefined, username, avatarUrl, sendAt: new Date(scheduleAt).toISOString() }),
      });
      const data = await res.json();
      if (res.ok) {
        setScheduleResult({ ok: true, message: "Scheduled ✓" });
        setEmbed({ ...DEFAULT_EMBED }); setContent(""); setScheduleMode(false);
        await reloadHistory();
      } else { setScheduleResult({ ok: false, message: data.error || "Failed to schedule" }); }
    } catch { setScheduleResult({ ok: false, message: "Network error" }); }
    finally { setScheduling(false); }
  }

  async function handleSaveTemplate(e) {
    e.preventDefault();
    if (!templateName.trim()) return;
    setSavingTemplate(true); setSaveTemplateResult(null);
    const { embed: finalEmbed } = buildPayload();
    try {
      const res = await fetch("/api/admin/announcements/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify({ name: templateName.trim(), webhookId: selectedWebhookId, embedJson: finalEmbed, username, avatarUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveTemplateResult({ ok: true, message: "Template saved ✓" });
        setTemplates(prev => [data.template, ...prev]);
        setTemplateName(""); setShowSaveTemplate(false);
      } else { setSaveTemplateResult({ ok: false, message: data.error || "Failed to save" }); }
    } catch { setSaveTemplateResult({ ok: false, message: "Network error" }); }
    finally { setSavingTemplate(false); }
  }

  async function handleDeleteTemplate(id) {
    await fetch("/api/admin/announcements/templates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-officer-pin": pin },
      body: JSON.stringify({ id }),
    });
    setTemplates(prev => prev.filter(t => t.id !== id));
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
      } else { setWebhookResult({ ok: false, message: data.error }); }
    } catch { setWebhookResult({ ok: false, message: "Network error" }); }
    finally { setAddingWebhook(false); }
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

  async function handleCancelScheduled(id) {
    await fetch("/api/admin/announcements/schedule", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-officer-pin": pin },
      body: JSON.stringify({ id }),
    });
    setScheduled(prev => prev.filter(s => s.id !== id));
  }

  /* ── PIN gate ── */
  if (!authed) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-6 flex flex-col items-center justify-center">
        <Card className="w-full max-w-sm text-center">
          <img src={BRANDING.cwlhub} alt="" className="w-14 h-14 mx-auto mb-4" />
          <h1 className="text-2xl font-thin tracking-widest mb-1">Announcements</h1>
          <p className="text-slate-500 text-xs mb-5">Admin access required</p>
          <form onSubmit={handlePinSubmit} className="space-y-3">
            <input type="password" placeholder="Officer PIN" value={pinInput} onChange={e => setPinInput(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition text-center tracking-widest text-lg" />
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

  const TABS = ["compose", "webhooks", "scheduled", "timestamp"];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-6 pb-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full" />
      </div>

      {/* Top row: Pool left · Discord centre · empty right */}
      <div className="relative z-10 grid grid-cols-3 items-center mb-6">
        <Link href="/admin/pool" className="text-sm text-slate-500 hover:text-white transition flex items-center gap-1.5 justify-self-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Pool
        </Link>
        <div className="flex justify-center"><DiscordWidget variant="center" /></div>
        <div />
      </div>

      {/* Hero card */}
      <div className="relative z-10 mb-6">
        <Card className="text-center py-5">
          {/* Hamburger left, Discord icon + title right */}
          <div className="flex items-center justify-center gap-3 mb-1">
            <AdminNav />
            <svg className="w-5 h-5 text-[#5865f2]" viewBox="0 0 127.14 96.36" fill="currentColor">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
            </svg>
            <h1 className="text-2xl font-thin tracking-widest">Announcements</h1>
          </div>
          <p className="text-slate-500 text-xs">Post rich embeds to your Discord server</p>
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition capitalize ${tab === t ? "bg-purple-600/30 text-purple-200 border-purple-500/40" : "bg-white/[0.03] text-slate-400 border-white/10 hover:bg-white/[0.06] hover:text-slate-200"}`}>
                {t === "scheduled" ? `Scheduled (${scheduled.filter(s => !s.sent).length})` : t}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ── COMPOSE TAB ── */}
      {tab === "compose" && (
        <div className="relative z-10 space-y-4">
          <Card>
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-xs text-slate-400 uppercase tracking-widest">Post to</p>
              {webhooks.length === 0 && (
                <button onClick={() => setTab("webhooks")} className="text-xs text-purple-400 hover:text-purple-200 transition">Add a webhook first →</button>
              )}
            </div>
            {webhooks.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {webhooks.map(w => (
                  <button key={w.id} onClick={() => setSelectedWebhookId(w.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${selectedWebhookId === w.id ? "bg-[#5865f2]/30 text-[#7289da] border-[#5865f2]/40" : "bg-white/[0.03] text-slate-400 border-white/10 hover:bg-white/[0.06]"}`}>
                    # {w.label}
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Quick templates</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                { key: "season-open", label: "Season Open" },
                { key: "rosters-final", label: "Rosters Finalised" },
                { key: "season-closing", label: "Season Closing" },
              ].map(t => (
                <button key={t.key} onClick={() => applyTemplate(t.key)}
                  className="px-3 py-1 rounded-full text-xs font-semibold border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] hover:text-white transition">
                  {t.label}
                </button>
              ))}
            </div>
            {templates.length > 0 && (
              <>
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Saved templates</p>
                <div className="flex flex-wrap gap-2">
                  {templates.map(t => (
                    <div key={t.id} className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5">
                      <button onClick={() => applySavedTemplate(t)} className="text-xs text-slate-300 hover:text-white transition">{t.name}</button>
                      <button onClick={() => handleDeleteTemplate(t.id)} className="text-slate-600 hover:text-red-400 transition text-[10px] leading-none">✕</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

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
                <input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://... or /cgn-skull.png"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
              </div>
            </div>
          </Card>

          <Card>
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">Embed</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-500 shrink-0">Colour</label>
                <input type="color" value={intToHex(embed.color)} onChange={e => setEmbedField("color", hexToInt(e.target.value))}
                  className="w-8 h-8 rounded cursor-pointer border border-white/10 bg-transparent" />
                <span className="text-xs text-slate-500 font-mono">{intToHex(embed.color)}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Author name</label>
                  <input value={embed.author?.name || ""} onChange={e => setNestedField("author", "name", e.target.value)} placeholder="Cognition {CGN}"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Author icon URL</label>
                  <input value={embed.author?.icon_url || ""} onChange={e => setNestedField("author", "icon_url", e.target.value)} placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Title</label>
                  <input value={embed.title} onChange={e => setEmbedField("title", e.target.value)} placeholder="Announcement title"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Title URL (optional)</label>
                  <input value={embed.url} onChange={e => setEmbedField("url", e.target.value)} placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Description</label>
                <MarkdownToolbar textareaRef={descriptionRef} value={embed.description} onChange={v => setEmbedField("description", v)} />
                <textarea ref={descriptionRef} value={embed.description} onChange={e => setEmbedField("description", e.target.value)}
                  rows={4} placeholder="Main body text. Use the toolbar above for formatting."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition resize-none" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-slate-500">Fields</label>
                  <button onClick={addField} className="text-xs text-purple-400 hover:text-purple-200 transition">+ Add field</button>
                </div>
                <div className="space-y-2">
                  {embed.fields.map((f, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input value={f.name} onChange={e => updateField(i, "name", e.target.value)} placeholder="Label"
                          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
                        <input value={f.value} onChange={e => updateField(i, "value", e.target.value)} placeholder="Value"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Thumbnail URL</label>
                  <input value={embed.thumbnail?.url || ""} onChange={e => setNestedField("thumbnail", "url", e.target.value)} placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Image URL</label>
                  <input value={embed.image?.url || ""} onChange={e => setNestedField("image", "url", e.target.value)} placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Footer text</label>
                  <input value={embed.footer?.text || ""} onChange={e => setNestedField("footer", "text", e.target.value)} placeholder="Cognition Collective"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Footer icon URL</label>
                  <input value={embed.footer?.icon_url || ""} onChange={e => setNestedField("footer", "icon_url", e.target.value)} placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="ts-check" checked={!!embed.timestamp} onChange={e => setEmbedField("timestamp", e.target.checked ? new Date().toISOString() : null)} />
                <label htmlFor="ts-check" className="text-xs text-slate-500">Include timestamp</label>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Link button (optional)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input value={embed._button?.label || ""} onChange={e => setNestedField("_button", "label", e.target.value)} placeholder="Sign Up Now →"
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
                  <input value={embed._button?.url || ""} onChange={e => setNestedField("_button", "url", e.target.value)} placeholder="https://..."
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Message content (above embed — for @mentions)</label>
                <input value={content} onChange={e => setContent(e.target.value)} placeholder="@everyone"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
              </div>
            </div>
          </Card>

          <Card>
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">Preview</p>
            <EmbedPreview embed={embed} username={username} avatarUrl={avatarUrl} />
          </Card>

          <Card>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <button onClick={() => setScheduleMode(false)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${!scheduleMode ? "bg-[#5865f2]/30 text-[#7289da] border-[#5865f2]/40" : "bg-white/[0.03] text-slate-400 border-white/10 hover:bg-white/[0.06]"}`}>
                  Post now
                </button>
                <button onClick={() => setScheduleMode(true)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${scheduleMode ? "bg-purple-600/30 text-purple-200 border-purple-500/40" : "bg-white/[0.03] text-slate-400 border-white/10 hover:bg-white/[0.06]"}`}>
                  Schedule
                </button>
              </div>
              {scheduleMode && (
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Send at (your local time)</label>
                  <input type="datetime-local" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20 transition" />
                </div>
              )}
              <div className="flex flex-col items-center gap-2">
                {!scheduleMode ? (
                  <button onClick={handleSend} disabled={sending || !selectedWebhookId || !embed.title}
                    className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm bg-[#5865f2]/30 text-[#7289da] border border-[#5865f2]/40 hover:bg-[#5865f2]/50 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed">
                    <svg className="w-4 h-4" viewBox="0 0 127.14 96.36" fill="currentColor">
                      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
                    </svg>
                    {sending ? "Posting…" : "Post to Discord"}
                  </button>
                ) : (
                  <button onClick={handleSchedule} disabled={scheduling || !selectedWebhookId || !embed.title || !scheduleAt}
                    className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm bg-purple-600/30 text-purple-200 border border-purple-500/40 hover:bg-purple-600/50 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {scheduling ? "Scheduling…" : "Schedule Post"}
                  </button>
                )}
                {(sendResult || scheduleResult) && (
                  <p className={`text-xs ${(sendResult || scheduleResult)?.ok ? "text-green-400" : "text-red-400"}`}>
                    {(sendResult || scheduleResult)?.message}
                  </p>
                )}
                {!selectedWebhookId && <p className="text-xs text-slate-600">Add a webhook in the Webhooks tab first</p>}
              </div>
              <div className="border-t border-white/10 pt-3">
                {!showSaveTemplate ? (
                  <button onClick={() => setShowSaveTemplate(true)} className="text-xs text-slate-500 hover:text-slate-300 transition">+ Save as template</button>
                ) : (
                  <form onSubmit={handleSaveTemplate} className="flex gap-2 items-center">
                    <input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Template name"
                      className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition" />
                    <button type="submit" disabled={savingTemplate || !templateName.trim()}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/40 transition disabled:opacity-40">
                      {savingTemplate ? "Saving…" : "Save"}
                    </button>
                    <button type="button" onClick={() => { setShowSaveTemplate(false); setTemplateName(""); }} className="text-slate-600 hover:text-white transition text-xs">✕</button>
                  </form>
                )}
                {saveTemplateResult && <p className={`text-xs mt-1 ${saveTemplateResult.ok ? "text-green-400" : "text-red-400"}`}>{saveTemplateResult.message}</p>}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── WEBHOOKS TAB ── */}
      {tab === "webhooks" && (
        <div className="relative z-10 space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-slate-400 uppercase tracking-widest">Webhook channels</p>
              <button onClick={() => setShowAddWebhook(v => !v)} className="text-xs text-purple-400 hover:text-purple-200 transition">
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
                  <input value={newUrl} onChange={e => setNewUrl(e.target.value)} required placeholder="https://discord.com/api/webhooks/..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none transition" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Channel name (optional)</label>
                  <input value={newChannel} onChange={e => setNewChannel(e.target.value)} placeholder="#announcements"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none transition" />
                </div>
                <button type="submit" disabled={addingWebhook}
                  className="w-full py-2 rounded-xl bg-purple-600/30 text-purple-200 border border-purple-500/30 hover:bg-purple-600/50 transition text-sm font-semibold disabled:opacity-40">
                  {addingWebhook ? "Adding…" : "Add webhook"}
                </button>
                {webhookResult && <p className={`text-xs text-center ${webhookResult.ok ? "text-green-400" : "text-red-400"}`}>{webhookResult.message}</p>}
              </form>
            )}
            {loadingData ? (
              <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
            ) : webhooks.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-6">No webhooks yet. Add one to start posting announcements.</p>
            ) : (
              <div className="space-y-2">
                {webhooks.map(w => (
                  <div key={w.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{w.label}</p>
                      {w.channel && <p className="text-xs text-slate-500">{w.channel}</p>}
                    </div>
                    <button onClick={() => handleDeleteWebhook(w.id)} className="text-slate-600 hover:text-red-400 transition text-xs shrink-0">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── SCHEDULED TAB ── */}
      {tab === "scheduled" && (
        <div className="relative z-10 space-y-4">
          <Card>
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-4">Scheduled & sent posts</p>
            {loadingData ? (
              <div className="space-y-2"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div>
            ) : scheduled.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-6">No scheduled posts yet. Use the Compose tab to schedule an embed.</p>
            ) : (
              <div className="space-y-2">
                {scheduled.map(s => (
                  <div key={s.id} className={`rounded-2xl border px-4 py-3 ${s.sent ? "border-white/[0.06] bg-white/[0.02]" : "border-purple-500/20 bg-purple-500/5"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{s.title || "Untitled"}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {s.webhook_label && `# ${s.webhook_label} · `}
                          {s.sent ? (
                            <span className="text-green-400">Sent {new Date(s.sent_at).toLocaleString()}</span>
                          ) : (
                            <span className="text-purple-300">Scheduled for {new Date(s.send_at).toLocaleString()}</span>
                          )}
                        </p>
                        {s.created_by && <p className="text-[10px] text-slate-600 mt-0.5">by {s.created_by}</p>}
                      </div>
                      {!s.sent && (
                        <button onClick={() => handleCancelScheduled(s.id)} className="shrink-0 text-xs text-slate-600 hover:text-red-400 transition">Cancel</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── TIMESTAMP TAB ── */}
      {tab === "timestamp" && (
        <div className="relative z-10">
          <TimestampTool />
        </div>
      )}
    </main>
  );
}
