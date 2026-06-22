"use client";

import { useSession, signIn, signOut } from "next-auth/react";

// Persistent Discord identity widget — fixed to the top-right corner of
// every page. Shows a small "Sign in with Discord" button when the user
// isn't signed in, or their Discord avatar + username when they are.
// Deliberately compact and unobtrusive — it's a secondary feature, not
// the primary UI of any page.
export default function DiscordWidget() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    // Don't render anything while checking — avoids a layout flash
    return null;
  }

  if (status === "authenticated" && session?.user) {
    const user = session.user;
    return (
      <div className="
        fixed top-4 right-4 z-50
        flex items-center gap-2
        px-3 py-1.5 rounded-full
        bg-black/40 backdrop-blur-md
        border border-white/10
        text-xs text-slate-300
      ">
        {user.image && (
          <img
            src={user.image}
            alt={user.name}
            className="w-5 h-5 rounded-full border border-white/20 shrink-0"
          />
        )}
        <span className="font-medium max-w-[100px] truncate">{user.name}</span>
        <button
          onClick={() => signOut()}
          className="text-slate-500 hover:text-slate-300 transition ml-1 shrink-0"
          title="Sign out of Discord"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("discord")}
      title="Sign in with Discord to keep your accounts linked across devices"
      className="
        fixed top-4 right-4 z-50
        flex items-center gap-2
        px-3 py-1.5 rounded-full
        bg-[#5865F2]/20 backdrop-blur-md
        border border-[#5865F2]/30
        text-[#7289da] text-xs font-semibold
        hover:bg-[#5865F2]/35 hover:text-white transition
      "
    >
      {/* Discord logo mark */}
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 127.14 96.36" fill="currentColor">
        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
      </svg>
      Discord
    </button>
  );
}
