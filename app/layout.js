import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CWL Hub — Cognition Collective",
  description:
    "Live CWL roster hub for the Cognition Collective alliance — search players, browse clan rosters, and check league standings.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          {children}
          <footer className="w-full py-4 flex items-center justify-center gap-2 border-t border-white/[0.06] bg-transparent mt-auto">
            <img src="/cgn-skull.png" alt="CGN" className="w-5 h-5 opacity-60"/>
            <span className="text-[11px] text-slate-600 tracking-widest">Cognition {"{CGN}"}</span>
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
