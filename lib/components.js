"use client";
import { useState } from "react";

export function MiniPie({ three = 0, two = 0, one = 0, zero = 0 }) {
  const total = three + two + one + zero;
  if (total === 0) return <span className="text-slate-700 text-[10px]">—</span>;
  const [expanded, setExpanded] = useState(false);
  function buildPie(size) {
    const cx = size/2, cy = size/2, r = size/2-1;
    const slices = [
      { value: three, color: "#86efac" },
      { value: two,   color: "#a78bfa" },
      { value: one,   color: "#fbbf24" },
      { value: zero,  color: "#475569" },
    ].filter(s => s.value > 0);
    let startAngle = -Math.PI/2;
    const paths = slices.map((s,i) => {
      const angle = (s.value/total)*2*Math.PI;
      const endAngle = startAngle+angle;
      const x1=cx+r*Math.cos(startAngle), y1=cy+r*Math.sin(startAngle);
      const x2=cx+r*Math.cos(endAngle),   y2=cy+r*Math.sin(endAngle);
      const d=`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${angle>Math.PI?1:0} 1 ${x2} ${y2} Z`;
      startAngle=endAngle;
      return <path key={i} d={d} fill={s.color}/>;
    });
    return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{paths}</svg>;
  }
  return (
    <div className="relative inline-flex items-center justify-center">
      <button type="button" onClick={e=>{e.stopPropagation();setExpanded(v=>!v)}} className="flex items-center justify-center rounded-full hover:opacity-80 transition">
        {buildPie(20)}
      </button>
      {expanded && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 rounded-2xl border border-white/10 bg-[#0d1424]/95 backdrop-blur-xl p-3 shadow-xl min-w-[110px]" onClick={e=>e.stopPropagation()}>
          <div className="flex justify-center mb-2">{buildPie(56)}</div>
          <div className="space-y-1 text-[10px]">
            {[["#86efac","3★",three],["#a78bfa","2★",two],["#fbbf24","1★",one],["#475569","0★",zero]].map(([col,lbl,val])=>(
              <div key={lbl} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{background:col}}/>{lbl}</span>
                <span className="text-white font-semibold">{val}</span>
              </div>
            ))}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white/10"/>
        </div>
      )}
    </div>
  );
}

export function RankBadge({ rank }) {
  const colours = {
    1: "#D4AF37",
    2: "#A7A7AD",
    3: "#CD7F32",
  };
  if (colours[rank]) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke={colours[rank]} strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
      </svg>
    );
  }
  return <span className="text-xs text-slate-500 font-mono w-5 text-center">{rank}</span>;
}

export function StatPill({ label, value, colour = "text-slate-300" }) {
  return (
    <div className="flex flex-col items-center min-w-[36px]">
      <span className={`text-sm font-semibold ${colour}`}>{value}</span>
      <span className="text-[9px] text-slate-600 uppercase tracking-wide">{label}</span>
    </div>
  );
}

export function StarIcons({ count, colour }) {
  return (
    <div className="flex items-center justify-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 ${colour}`} viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

export function LargePie({ three = 0, two = 0, one = 0, zero = 0, size = 80 }) {
  const total = three + two + one + zero;
  if (total === 0) return <div className="flex items-center justify-center" style={{width:size,height:size}}><span className="text-slate-600 text-xs">No data</span></div>;
  const cx = size/2, cy = size/2, r = size/2 - 2;
  const slices = [
    { value: three, color: "#86efac" },
    { value: two,   color: "#a78bfa" },
    { value: one,   color: "#fbbf24" },
    { value: zero,  color: "#475569" },
  ].filter(s => s.value > 0);
  let startAngle = -Math.PI/2;
  const paths = slices.map((s, i) => {
    const angle = (s.value/total)*2*Math.PI;
    const endAngle = startAngle + angle;
    const x1=cx+r*Math.cos(startAngle), y1=cy+r*Math.sin(startAngle);
    const x2=cx+r*Math.cos(endAngle),   y2=cy+r*Math.sin(endAngle);
    const d=`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${angle>Math.PI?1:0} 1 ${x2} ${y2} Z`;
    startAngle = endAngle;
    return <path key={i} d={d} fill={s.color}/>;
  });
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{paths}</svg>;
}
