"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TH_ICONS, CWL_ICONS } from "@/lib/icons";
import { BRANDING } from "@/lib/branding";

const STAT_COLS = [
  { key: "season",            label: "Season",     fmt: v => v },
  { key: "clan_name",         label: "Clan",        fmt: v => v?.split(" ")[0] || "—" },
  { key: "overall",           label: "Overall",     fmt: v => v != null ? parseFloat(v).toFixed(2) : "—" },
  { key: "efficiency",        label: "Atk EFF",     fmt: v => v != null ? parseFloat(v).toFixed(2) : "—" },
  { key: "defence_efficiency",label: "Def EFF",     fmt: v => v != null ? parseFloat(v).toFixed(2) : "—" },
  { key: "stars_earned",      label: "Stars",       fmt: v => v ?? "—" },
  { key: "stars_conceded",    label: "Given",       fmt: v => v ?? "—" },
  { key: "attacks_used",      label: "Attacks",     fmt: v => v ?? "—" },
  { key: "missed_attacks",    label: "Missed",      fmt: v => v ?? "—" },
  { key: "destruction_pct",   label: "Dest %",      fmt: v => v != null ? parseFloat(v).toFixed(1)+"%" : "—" },
];

function StatBadge({ label, value, colour = "text-white" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center">
      <p className={`text-lg font-semibold ${colour}`}>{value}</p>
      <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">{label}</p>
    </div>
  );
}

function StarBar({ three, two, one, zero }) {
  const total = (three||0)+(two||0)+(one||0)+(zero||0);
  if (!total) return null;
  const pct = v => total > 0 ? ((v||0)/total*100).toFixed(0) : 0;
  return (
    <div className="space-y-1.5">
      {[["3★", three, "#86efac"],["2★", two, "#a78bfa"],["1★", one, "#fbbf24"],["0★", zero, "#475569"]].map(([lbl,val,col]) => (
        <div key={lbl} className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 w-5 text-right">{lbl}</span>
          <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{width:`${pct(val)}%`, background:col}}/>
          </div>
          <span className="text-[10px] text-slate-500 w-6 text-right">{val||0}</span>
        </div>
      ))}
    </div>
  );
}

export default function PlayerProfilePage() {
  const { tag } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tag) return;
    fetch(`/api/player/${encodeURIComponent(tag)}`)
      .then(r => { if (!r.ok) throw new Error("not found"); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [tag]);

  if (loading) return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] flex items-center justify-center">
      <p className="text-slate-600 text-xs tracking-widest uppercase animate-pulse">Loading…</p>
    </main>
  );

  if (error || !data) return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] flex items-center justify-center p-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 text-center max-w-xs">
        <p className="text-slate-400 text-sm mb-1">Player not found</p>
        <p className="text-slate-600 text-xs">This player has no CWL stats on record.</p>
      </div>
    </main>
  );

  const latest = data.seasons[0];
  const latestOverall = latest?.overall;
  const totalStars = data.seasons.reduce((s, r) => s + (r.stars_earned||0), 0);
  const totalMissed = data.seasons.reduce((s, r) => s + (r.missed_attacks||0), 0);
  const avgEfficiency = data.seasons.length
    ? (data.seasons.reduce((s, r) => s + parseFloat(r.efficiency||0), 0) / data.seasons.length).toFixed(2)
    : "—";

  return (
    <main className="min-h-screen overflow-x-hidden w-full max-w-full bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] bg-purple-500/10 blur-3xl rounded-full"/>
      </div>

      {/* Header tile */}
      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 mb-4 flex flex-col items-center text-center gap-2">
        {TH_ICONS[String(data.town_hall_level)] && (
          <img src={TH_ICONS[String(data.town_hall_level)]} alt={`TH${data.town_hall_level}`} className="w-12 h-12"/>
        )}
        <h1 className="text-2xl font-thin tracking-widest">{data.player_name}</h1>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-slate-500">{latest?.clan_name?.split(" ")[0] || "—"}</span>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-slate-500">TH{data.town_hall_level}</span>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-slate-500">{data.totalSeasons} season{data.totalSeasons !== 1 ? "s" : ""}</span>
        </div>
        {latestOverall != null && (
          <div className="mt-1">
            <span className="text-3xl font-thin text-purple-300">{parseFloat(latestOverall).toFixed(2)}</span>
            <p className="text-[9px] text-slate-600 uppercase tracking-widest">Overall Rating</p>
          </div>
        )}
      </div>

      {/* Career stats */}
      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 mb-4">
        <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Career</p>
        <div className="grid grid-cols-3 gap-2">
          <StatBadge label="Avg Atk EFF" value={avgEfficiency} colour="text-purple-300"/>
          <StatBadge label="Total Stars" value={totalStars} colour="text-green-300"/>
          <StatBadge label="Missed" value={totalMissed} colour={totalMissed > 0 ? "text-red-400" : "text-slate-500"}/>
          {data.bestOverall && <StatBadge label="Best Overall" value={parseFloat(data.bestOverall.overall).toFixed(2)} colour="text-purple-400"/>}
          {data.bestEfficiency && <StatBadge label="Best Atk EFF" value={parseFloat(data.bestEfficiency.efficiency).toFixed(2)} colour="text-green-400"/>}
          <StatBadge label="Seasons" value={data.totalSeasons} colour="text-slate-300"/>
        </div>
      </div>

      {/* Star breakdown (career totals) */}
      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 mb-4">
        <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Attack Breakdown</p>
        <StarBar
          three={data.seasons.reduce((s,r)=>s+(r.three_stars||0),0)}
          two={data.seasons.reduce((s,r)=>s+(r.two_stars||0),0)}
          one={data.seasons.reduce((s,r)=>s+(r.one_stars||0),0)}
          zero={data.seasons.reduce((s,r)=>s+(r.zero_stars||0),0)}
        />
      </div>

      {/* Season history table */}
      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
        <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Season History</p>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-xs min-w-[480px]">
            <thead>
              <tr>
                {STAT_COLS.map(col => (
                  <th key={col.key} className="text-[9px] text-slate-600 uppercase tracking-widest font-normal pb-2 text-left px-1 whitespace-nowrap">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {data.seasons.map((s, i) => (
                <tr key={i} className="hover:bg-white/[0.03] transition">
                  {STAT_COLS.map(col => (
                    <td key={col.key} className={`py-2 px-1 whitespace-nowrap ${
                      col.key === "overall" ? "text-purple-300 font-semibold" :
                      col.key === "missed_attacks" && (s.missed_attacks||0) > 0 ? "text-red-400" :
                      col.key === "efficiency" ? "text-purple-200" :
                      "text-slate-400"
                    }`}>
                      {col.fmt(s[col.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Branding footer */}
      <div className="relative z-10 flex items-center justify-center gap-2 mt-6">
        <img src={BRANDING.cgnskull} alt="CGN" className="w-4 h-4 opacity-40"/>
        <span className="text-[10px] text-slate-700 tracking-widest">Cognition {"{CGN}"}</span>
      </div>
    </main>
  );
}
