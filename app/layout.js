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

// SessionProvider is required by Auth.js for useSession() to work in
// client components (item 17). It reads the JWT session cookie set by
// Auth.js after Discord sign-in and makes it available to any component
// via useSession(). Only the signup page currently uses this — the rest
// of the app is unaffected by its presence here.
export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
