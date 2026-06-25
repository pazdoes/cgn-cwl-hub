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
              <Link href="/admin" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Overview
              </Link>
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
const DEFAULT_AVATAR = "https://cdn.discordapp.com/attachments/1480200113082208346/1484473662198251692/IMG_0364.png?ex=6a3d9415&is=6a3c4295&hm=ca84aa004c423227a9f22fa2aa2786f8205f5d023eae742fc28d292343818164&";

const DEFAULT_EMBED = {
  color: hexToInt("#a78bfa"),
  author: { name: "", icon_url: "" },
  title: "",
  url: "",
  description: "",
  fields: [],
  thumbnail: { url: "" },
  image: { url: "" },
  footer: { text: "", icon_url: "" },
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
            className="w-full max-w-xs rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20 transition [color-scheme:dark]" />
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

  // Recurring state
  const [recurrence, setRecurrence] = useState(null); // null = one-time
  const [recurStart, setRecurStart] = useState(() => {
    const d = new Date(); d.setMinutes(d.getMinutes() + 60 - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [recurEnd, setRecurEnd] = useState("");

  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [saveTemplateResult, setSaveTemplateResult] = useState(null);

  const [tab, setTab] = useState("compose");
  const [composeMode, setComposeMode] = useState("quick");
  const [showSchedule, setShowSchedule] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const [templateEditMode, setTemplateEditMode] = useState(false);
  const templateMenuRef = useRef(null);
  const descriptionRef = useRef(null);

  // Close template dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (templateMenuRef.current && !templateMenuRef.current.contains(e.target)) {
        setTemplateMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
    // Record usage — update use_count and last_used_at, then refresh local state
    fetch("/api/admin/announcements/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-officer-pin": pin },
      body: JSON.stringify({ action: "use", id: t.id }),
    }).then(() => {
      setTemplates(prev => prev.map(tmpl =>
        tmpl.id === t.id
          ? { ...tmpl, use_count: (tmpl.use_count || 0) + 1, last_used_at: new Date().toISOString() }
          : tmpl
      ));
    }).catch(() => { /* non-fatal */ });
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

  async function handleRecurring() {
    if (!selectedWebhookId || !recurStart) return;
    setScheduling(true); setScheduleResult(null);
    const { embed: finalEmbed } = buildPayload();
    try {
      const res = await fetch("/api/admin/announcements/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-officer-pin": pin },
        body: JSON.stringify({
          webhookId: selectedWebhookId,
          embed: finalEmbed,
          content: content || undefined,
          username,
          avatarUrl,
          sendAt: new Date(recurStart).toISOString(),
          recurrence,
          recurrenceEnd: recurEnd ? new Date(recurEnd).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setScheduleResult({ ok: true, message: `Recurring post scheduled ✓ (${recurrence})` });
        setEmbed({ ...DEFAULT_EMBED }); setContent("");
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
            <input type="password" inputMode="numeric" pattern="[0-9]*" placeholder="Officer PIN" value={pinInput} onChange={e => setPinInput(e.target.value)}
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

  const pendingScheduled = scheduled.filter(s => !s.sent);
  const previewEmbed = {
    color: embed.color || 0x5865f2,
    title: embed.title || "",
    description: embed.description || "",
    author: embed.author?.name ? embed.author : null,
    thumbnail: embed.thumbnail?.url ? embed.thumbnail : null,
    image: embed.image?.url ? embed.image : null,
    footer: embed.footer?.text ? embed.footer : null,
    fields: embed.fields?.filter(f => f.name && f.value) || [],
  };
  const hexColor = "#" + (embed.color || 0x5865f2).toString(16).padStart(6, "0");

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      </div>

      {/* ── HERO TILE ── */}
      <div className="relative z-10 mb-4">
        <Card className="text-center py-5">
          <h1 className="text-2xl font-thin tracking-widest mb-1">Announcements</h1>
          <p className="text-slate-500 text-xs mb-4">Post rich embeds to your Discord server</p>
          <div className="flex justify-center mb-3">
            <DiscordWidget variant="center"/>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Link href="/admin/pool" className="text-slate-500 hover:text-slate-300 transition p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </Link>
            <span className="text-[10px] text-slate-600 uppercase tracking-widest select-none min-w-[100px] text-center">Announcements</span>
            <span className="w-6 h-6"/>
          </div>
        </Card>
      </div>

      <div className="relative z-10 space-y-4">

        {/* ── COMPOSE TILE ── */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Compose</h2>
            <div className="flex items-center gap-3">
              <button onClick={() => setComposeMode("quick")} className="text-slate-500 hover:text-slate-300 transition p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <span className="text-[10px] text-slate-600 uppercase tracking-widest select-none min-w-[60px] text-center">
                {composeMode === "quick" ? "Quick" : "Full"}
              </span>
              <button onClick={() => setComposeMode("full")} className="text-slate-500 hover:text-slate-300 transition p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>

          {/* Webhook selector */}
          <div className="mb-4">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Post to</label>
            {webhooks.length === 0 ? (
              <p className="text-xs text-slate-600">No webhooks configured — add one below</p>
            ) : (
              <select value={selectedWebhookId || ""} onChange={e => setSelectedWebhookId(e.target.value)}
                className="w-full rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white focus:outline-none [color-scheme:dark]">
                {webhooks.map(w => <option key={w.id} value={w.id}>{w.label}{w.channel ? ` · #${w.channel}` : ""}</option>)}
              </select>
            )}
          </div>

          {/* Quick fields */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Title</label>
              <input type="text" value={embed.title || ""} onChange={e => setEmbedField("title", e.target.value)} placeholder="Announcement title"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Description</label>
              <MarkdownToolbar textareaRef={descriptionRef} value={embed.description || ""} onChange={v => setEmbedField("description", v)}/>
              <textarea ref={descriptionRef} value={embed.description || ""} onChange={e => setEmbedField("description", e.target.value)}
                placeholder="Main message content. Supports **bold**, *italic*, `code`" rows={4}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition resize-none mt-1"/>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Colour</label>
              <div className="flex items-center gap-3 flex-wrap">
                <input type="color" value={hexColor} onChange={e => setEmbedField("color", hexToInt(e.target.value))}
                  className="w-10 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer"/>
                <input type="text" value={hexColor} onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setEmbedField("color", hexToInt(e.target.value.padEnd(7, "0"))); }}
                  className="w-24 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white font-mono focus:outline-none focus:border-white/20 transition"/>
                <div className="flex gap-1.5">
                  {["#a78bfa","#34d399","#fb923c","#60a5fa","#f472b6","#5865f2"].map(c => (
                    <button key={c} type="button" onClick={() => setEmbedField("color", hexToInt(c))}
                      className="w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition" style={{background:c}}/>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Ping / Content <span className="text-slate-700 normal-case">(outside embed)</span></label>
              <input type="text" value={content} onChange={e => setContent(e.target.value)} placeholder="@everyone or leave blank"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
            </div>
          </div>

          {/* Full mode fields */}
          {composeMode === "full" && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Author</label>
                <div className="space-y-2">
                  <input type="text" value={embed.author?.name || ""} onChange={e => setNestedField("author", "name", e.target.value)} placeholder="Author name"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                  <input type="text" value={embed.author?.icon_url || ""} onChange={e => setNestedField("author", "icon_url", e.target.value)} placeholder="Author icon URL (optional)"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Thumbnail URL</label>
                <input type="text" value={embed.thumbnail?.url || ""} onChange={e => setNestedField("thumbnail", "url", e.target.value)} placeholder="https://…"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Image URL</label>
                <input type="text" value={embed.image?.url || ""} onChange={e => setNestedField("image", "url", e.target.value)} placeholder="https://…"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest">Fields</label>
                  <button type="button" onClick={addField}
                    className="text-[10px] text-purple-400 border border-purple-500/40 px-2 py-0.5 rounded-full hover:border-purple-400 transition">+ Add</button>
                </div>
                <div className="space-y-2">
                  {embed.fields.map((f, i) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="text" value={f.name} onChange={e => updateField(i, "name", e.target.value)} placeholder="Field name"
                          className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                        <button type="button" onClick={() => removeField(i)} className="text-slate-600 hover:text-red-400 transition text-xs">✕</button>
                      </div>
                      <textarea value={f.value} onChange={e => updateField(i, "value", e.target.value)} placeholder="Field value" rows={2}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition resize-none"/>
                      <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                        <input type="checkbox" checked={f.inline} onChange={e => updateField(i, "inline", e.target.checked)} className="accent-purple-500"/>
                        Inline
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Footer</label>
                <input type="text" value={embed.footer?.text || ""} onChange={e => setNestedField("footer", "text", e.target.value)} placeholder="Footer text"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Link Button <span className="text-slate-700 normal-case">(optional)</span></label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input type="text" value={embed._button?.emoji || ""} onChange={e => setNestedField("_button", "emoji", e.target.value)} placeholder="🔔"
                      className="w-14 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition text-center"/>
                    <input type="text" value={embed._button?.label || ""} onChange={e => setNestedField("_button", "label", e.target.value)} placeholder="Button label"
                      className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                  </div>
                  <input type="text" value={embed._button?.url || ""} onChange={e => setNestedField("_button", "url", e.target.value)} placeholder="https://…"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                  <p className="text-[10px] text-slate-700">Link buttons post as Discord components alongside the embed</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Bot Name</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20 transition"/>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Avatar URL</label>
                  <input type="text" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://…"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                </div>
              </div>
            </div>
          )}

          {/* Send section */}
          <div className="mt-5 pt-4 border-t border-white/10 space-y-3">
            <button type="button" onClick={handleSend} disabled={sending || !selectedWebhookId}
              className="w-full py-2.5 rounded-2xl text-sm font-semibold bg-transparent text-green-400 border border-green-500/60 shadow-[0_0_8px_rgba(74,222,128,0.12)] hover:border-green-400 hover:text-green-300 transition disabled:opacity-40">
              {sending ? "Sending…" : "Post to Discord"}
            </button>
            {sendResult && <p className={`text-xs text-center ${sendResult.ok ? "text-green-400" : "text-red-400"}`}>{sendResult.message}</p>}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <button type="button" onClick={() => setShowSchedule(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-slate-400 font-semibold">Schedule</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-600 transition-transform ${showSchedule ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </button>
              {showSchedule && (
                <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Send at</label>
                    <input type="datetime-local" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none [color-scheme:dark]"/>
                  </div>
                  <button type="button" onClick={handleSchedule} disabled={scheduling || !selectedWebhookId}
                    className="w-full py-2 rounded-xl text-xs font-semibold bg-transparent text-purple-400 border border-purple-500/60 hover:border-purple-400 hover:text-purple-300 transition disabled:opacity-40">
                    {scheduling ? "Scheduling…" : "Schedule Post"}
                  </button>
                  {scheduleResult && !showRecurring && <p className={`text-xs text-center ${scheduleResult.ok ? "text-green-400" : "text-red-400"}`}>{scheduleResult.message}</p>}
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <button type="button" onClick={() => setShowRecurring(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-slate-400 font-semibold">Recurring</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-600 transition-transform ${showRecurring ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </button>
              {showRecurring && (
                <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">First send at</label>
                    <input type="datetime-local" value={recurStart} onChange={e => setRecurStart(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none [color-scheme:dark]"/>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1.5 block">Repeat every</label>
                    <div className="flex flex-wrap gap-1.5">
                      {[["24hr","Daily"],["48hr","48 hrs"],["7days","Weekly"],["14days","2 weeks"],["30days","Monthly"]].map(([val,label]) => (
                        <button key={val} type="button" onClick={() => setRecurrence(recurrence === val ? null : val)}
                          className={`px-2.5 py-1 rounded-full text-xs border transition font-semibold ${recurrence === val ? "text-purple-400 border-purple-500/60 shadow-[0_0_6px_rgba(168,85,247,0.12)]" : "text-slate-500 border-white/10 hover:text-slate-300 hover:border-white/20"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">End date <span className="text-slate-700">(optional)</span></label>
                    <input type="datetime-local" value={recurEnd} onChange={e => setRecurEnd(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none [color-scheme:dark]"/>
                  </div>
                  <button type="button" onClick={handleRecurring} disabled={scheduling || !selectedWebhookId || !recurStart || !recurrence}
                    className="w-full py-2 rounded-xl text-xs font-semibold bg-transparent text-purple-400 border border-purple-500/60 hover:border-purple-400 hover:text-purple-300 transition disabled:opacity-40">
                    {scheduling ? "Scheduling…" : `Set Recurring (${recurrence || "choose interval"})`}
                  </button>
                  {scheduleResult && <p className={`text-xs text-center ${scheduleResult.ok ? "text-green-400" : "text-red-400"}`}>{scheduleResult.message}</p>}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Live Preview */}
        <Card>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Live Preview</h2>
          <div className="rounded-xl bg-[#313338] p-3">
            <div className="flex items-center gap-2 mb-2">
              {avatarUrl ? <img src={avatarUrl} className="w-8 h-8 rounded-full object-cover" alt=""/> : <div className="w-8 h-8 rounded-full bg-purple-600/40 flex items-center justify-center text-xs text-white font-bold">{username?.charAt(0)||"C"}</div>}
              <span className="text-white text-sm font-semibold">{username||"CGN CWL Hub"}</span>
              <span className="text-[10px] bg-[#5865f2] text-white px-1 py-0.5 rounded">APP</span>
            </div>
            {content && <p className="text-[#dbdee1] text-sm mb-2">{content}</p>}
            <div className="rounded border-l-4 bg-[#2b2d31] p-3" style={{borderLeftColor: hexColor}}>
              {previewEmbed.author && <div className="flex items-center gap-1.5 mb-1">{previewEmbed.author.icon_url && <img src={previewEmbed.author.icon_url} className="w-5 h-5 rounded-full" alt=""/>}<span className="text-[#dbdee1] text-xs font-semibold">{previewEmbed.author.name}</span></div>}
              {previewEmbed.title && <p className="text-white font-bold text-sm mb-1">{previewEmbed.title}</p>}
              {previewEmbed.description && <p className="text-[#dbdee1] text-xs leading-relaxed whitespace-pre-wrap">{previewEmbed.description}</p>}
              {previewEmbed.fields.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {previewEmbed.fields.map((f,i) => <div key={i} className={f.inline?"":"col-span-2"}><p className="text-white text-xs font-semibold">{f.name}</p><p className="text-[#dbdee1] text-xs">{f.value}</p></div>)}
                </div>
              )}
              {previewEmbed.image?.url && <img src={previewEmbed.image.url} className="w-full rounded mt-2 max-h-40 object-cover" alt=""/>}
              {previewEmbed.footer?.text && <p className="text-[#87898c] text-[10px] mt-2">{previewEmbed.footer.text}</p>}
            </div>
            {embed._button?.label && embed._button?.url && (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#4e5058] text-[#dbdee1] text-xs font-semibold">
                  {embed._button.emoji && <span>{embed._button.emoji}</span>}
                  {embed._button.label}
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Templates */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
          <button onClick={() => setTemplateMenuOpen(v => !v)} className="w-full flex items-center justify-between px-5 py-4">
            <div><p className="text-sm font-semibold text-slate-300">Templates</p><p className="text-[10px] text-slate-600 mt-0.5">{templates.length} saved</p></div>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-600 transition-transform ${templateMenuOpen?"rotate-180":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
          {templateMenuOpen && (
            <div className="px-5 pb-5 border-t border-white/10 pt-4 space-y-3">
              <div>
                <p className="text-[10px] text-slate-600 mb-2">Quick templates</p>
                <div className="flex flex-wrap gap-2">
                  {[["season-open","Season Open"],["rosters-final","Rosters Final"],["season-closing","Season Closing"]].map(([type,label]) => (
                    <button key={type} type="button" onClick={() => applyTemplate(type)}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-transparent text-slate-400 border border-white/10 hover:text-white hover:border-white/30 transition">{label}</button>
                  ))}
                </div>
              </div>
              {templates.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-slate-600">Saved</p>
                    <button onClick={() => setTemplateEditMode(v => !v)} className="text-[10px] text-slate-600 hover:text-slate-400">{templateEditMode?"Done":"Edit"}</button>
                  </div>
                  <div className="space-y-1.5">
                    {templates.map(t => (
                      <div key={t.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                        <button type="button" onClick={() => {applySavedTemplate(t);setTemplateMenuOpen(false);}} className="flex-1 text-left text-xs text-slate-300 hover:text-white truncate">{t.name}</button>
                        {t.use_count > 0 && <span className="text-[9px] text-slate-700">{t.use_count}×</span>}
                        {templateEditMode && <button type="button" onClick={() => handleDeleteTemplate(t.id)} className="text-slate-600 hover:text-red-400 text-xs">✕</button>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-2 border-t border-white/[0.06]">
                {showSaveTemplate ? (
                  <div className="space-y-2">
                    <input type="text" placeholder="Template name" value={templateName} onChange={e => setTemplateName(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                    <div className="flex gap-2">
                      <button type="button" onClick={handleSaveTemplate} disabled={savingTemplate||!templateName.trim()}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold bg-transparent text-purple-400 border border-purple-500/60 hover:border-purple-400 transition disabled:opacity-40">{savingTemplate?"Saving…":"Save"}</button>
                      <button type="button" onClick={() => {setShowSaveTemplate(false);setTemplateName("");}} className="px-4 py-2 rounded-xl text-xs text-slate-500 border border-white/10 hover:text-slate-300 transition">Cancel</button>
                    </div>
                    {saveTemplateResult && <p className={`text-xs text-center ${saveTemplateResult.ok?"text-green-400":"text-red-400"}`}>{saveTemplateResult.message}</p>}
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowSaveTemplate(true)}
                    className="w-full py-2 rounded-xl text-xs font-semibold bg-transparent text-slate-400 border border-white/10 hover:text-white hover:border-white/30 transition">+ Save current as template</button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Webhooks */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
          <button onClick={() => setShowAddWebhook(v => !v)} className="w-full flex items-center justify-between px-5 py-4">
            <div><p className="text-sm font-semibold text-slate-300">Webhooks</p><p className="text-[10px] text-slate-600 mt-0.5">{webhooks.length} configured</p></div>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-600 transition-transform ${showAddWebhook?"rotate-180":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
          {showAddWebhook && (
            <div className="px-5 pb-5 border-t border-white/10 pt-4 space-y-3">
              {webhooks.map(w => (
                <div key={w.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <div className="min-w-0"><p className="text-xs font-semibold text-white truncate">{w.label}</p>{w.channel && <p className="text-[10px] text-slate-600">#{w.channel}</p>}</div>
                  <button type="button" onClick={() => handleDeleteWebhook(w.id)} className="text-slate-600 hover:text-red-400 text-xs">✕</button>
                </div>
              ))}
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <input type="text" placeholder="Label" value={newLabel} onChange={e => setNewLabel(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                <input type="text" placeholder="Webhook URL" value={newUrl} onChange={e => setNewUrl(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                <input type="text" placeholder="Channel name (optional)" value={newChannel} onChange={e => setNewChannel(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition"/>
                <button type="button" onClick={handleAddWebhook} disabled={addingWebhook||!newLabel||!newUrl}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-transparent text-purple-400 border border-purple-500/60 hover:border-purple-400 transition disabled:opacity-40">{addingWebhook?"Adding…":"Add Webhook"}</button>
                {webhookResult && <p className={`text-xs text-center ${webhookResult.ok?"text-green-400":"text-red-400"}`}>{webhookResult.message}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Scheduled */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
          <button onClick={() => setTab(tab==="scheduled"?"":"scheduled")} className="w-full flex items-center justify-between px-5 py-4">
            <div><p className="text-sm font-semibold text-slate-300">Scheduled</p><p className="text-[10px] text-slate-600 mt-0.5">{pendingScheduled.length} pending</p></div>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-600 transition-transform ${tab==="scheduled"?"rotate-180":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
          {tab === "scheduled" && (
            <div className="px-5 pb-5 border-t border-white/10 pt-4 space-y-2">
              {scheduled.length === 0 ? <p className="text-slate-700 text-xs text-center py-4">No scheduled posts</p> : scheduled.map(s => {
                const t = new Date(s.send_at);
                return (
                  <div key={s.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{s.title||"Untitled"}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{t.toLocaleDateString()} {t.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}{s.recurrence && <span className="ml-1.5 text-purple-400">↻ {s.recurrence}</span>}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.sent ? <span className="text-[9px] text-green-500">Sent</span> : <button type="button" onClick={() => handleCancelScheduled(s.id)} className="text-slate-600 hover:text-red-400 text-xs">✕</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* History */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
          <button onClick={() => setTab(tab==="history"?"":"history")} className="w-full flex items-center justify-between px-5 py-4">
            <div><p className="text-sm font-semibold text-slate-300">History</p><p className="text-[10px] text-slate-600 mt-0.5">Recent announcements</p></div>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-600 transition-transform ${tab==="history"?"rotate-180":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
          {tab === "history" && (
            <div className="px-5 pb-5 border-t border-white/10 pt-4 space-y-2">
              {history.length === 0 ? <p className="text-slate-700 text-xs text-center py-4">No history yet</p> : history.slice(0,10).map((h,i) => (
                <div key={i} className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-xs text-white truncate">{h.title||"Untitled"}</p>
                    <p className="text-[10px] text-slate-600">{h.sent_by||"Unknown"}{h.sent_at ? ` · ${new Date(h.sent_at).toLocaleDateString()}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp Generator */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
          <button onClick={() => setTab(tab==="timestamp"?"":"timestamp")} className="w-full flex items-center justify-between px-5 py-4">
            <div><p className="text-sm font-semibold text-slate-300">Timestamp Generator</p><p className="text-[10px] text-slate-600 mt-0.5">Auto timezone-aware Discord timestamps</p></div>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-600 transition-transform ${tab==="timestamp"?"rotate-180":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
          {tab === "timestamp" && (
            <div className="px-5 pb-5 border-t border-white/10 pt-4">
              <TimestampTool/>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
