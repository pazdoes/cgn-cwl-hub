"use client";
import { useState } from "react";

import { useSession, signIn, signOut } from "next-auth/react";

// Discord identity widget — two layout variants:
//   variant="center"  — full-width centred bar, used at the top of the
//                       homepage and admin page above the header card
//   variant="corner"  — compact pill aligned to the right, used on all
//                       other pages (signup, stat views, etc.)
// Both are static inline DOM elements — no position:fixed anywhere.
export default function DiscordWidget({ variant = "corner" }) {
  const { data: session, status } = useSession();
  const [showInfo, setShowInfo] = useState(false);

  if (status === "loading") return null;

  const isCenter = variant === "center";

  const DiscordLogo = () => (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 127.14 96.36" fill="currentColor">
      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
    </svg>
  );

  if (status === "authenticated" && session?.user) {
    const user = session.user;
    return (
      <div className={`relative flex items-center gap-1.5 ${isCenter ? "justify-center mx-auto w-fit" : "ml-auto w-fit"}`}>
        <button type="button" onClick={() => setShowInfo(v => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-xs text-slate-300 hover:border-white/20 hover:bg-black/40 transition">
          {user.image && (
            <img src={user.image} alt={user.name}
              className="w-5 h-5 rounded-full border border-white/20 shrink-0" />
          )}
          <span className="font-medium max-w-[120px] truncate">{user.name}</span>
        </button>
        {showInfo && (
          <div className="absolute right-0 top-full mt-2 z-50 w-52 rounded-2xl border border-white/10 bg-[#0d1424]/95 backdrop-blur-xl shadow-xl p-3 space-y-2">
            <p className="text-[11px] text-slate-400 leading-relaxed">Disconnect your Discord account?</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => { signOut(); setShowInfo(false); }}
                className="flex-1 py-1.5 rounded-xl text-[10px] font-semibold bg-transparent text-red-400 border border-red-500/40 hover:border-red-400 transition">
                Disconnect
              </button>
              <button type="button" onClick={() => setShowInfo(false)}
                className="flex-1 py-1.5 rounded-xl text-[10px] font-semibold bg-transparent text-slate-400 border border-white/10 hover:text-white hover:border-white/20 transition">
                Cancel
              </button>
            </div>
            <div className="absolute -top-1.5 right-6 w-3 h-3 rotate-45 bg-[#0d1424] border-l border-t border-white/10"/>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative flex items-center gap-1.5 ${isCenter ? "mx-auto w-fit" : "ml-auto w-fit"}`}>
      <button onClick={() => signIn("discord")}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5865F2]/20 backdrop-blur-md border border-[#5865F2]/30 text-[#7289da] text-xs font-semibold hover:bg-[#5865F2]/35 hover:text-white transition">
        <DiscordLogo />
        Discord
      </button>
      <div className="relative">
        <button type="button" onClick={() => setShowInfo(v => !v)}
          className="w-5 h-5 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-300 transition border border-white/10 bg-white/[0.03] shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </button>
        {showInfo && (
          <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl border border-white/10 bg-[#0d1424]/95 backdrop-blur-xl shadow-xl p-3">
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Sign in with Discord to keep your CoC accounts linked across devices. Your accounts are always accessible, even on a new browser or device.
            </p>
            <div className="absolute -top-1.5 right-2 w-3 h-3 rotate-45 bg-[#0d1424] border-l border-t border-white/10"/>
          </div>
        )}
      </div>
    </div>
  );
}
