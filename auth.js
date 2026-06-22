import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";

// Auth.js v5 configuration — Discord OAuth only, JWT session strategy.
//
// JWT sessions (not database sessions) means Auth.js stores the session
// as a signed, httpOnly cookie — no extra database tables needed.
// The Discord user's ID is embedded in the JWT and available on every
// request via auth() without a database lookup.
//
// We only request the 'identify' scope — the minimum that gives us the
// Discord user's ID and username. No email, no guild membership, no
// message access. Players see exactly what Discord shows them on the
// consent screen: "CGN CWL Hub wants to know who you are."
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
      authorization: { params: { scope: "identify" } },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    // Embed the Discord user ID into the JWT so it's available without
    // a round-trip to Discord's API on every request.
    jwt({ token, profile }) {
      if (profile?.id) {
        token.discordId = profile.id;
      }
      return token;
    },
    // Expose discordId on the session object so client components can
    // read it via useSession() without seeing the raw JWT.
    session({ session, token }) {
      if (token.discordId) {
        session.user.discordId = token.discordId;
      }
      return session;
    },
  },
  pages: {
    // Use Auth.js's built-in sign-in flow — no custom page needed.
    // Clicking "Sign in with Discord" goes directly to Discord's OAuth
    // consent screen, then back to the app. No intermediate page.
    error: "/signup",
  },
});
