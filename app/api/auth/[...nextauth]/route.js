import { handlers } from "@/auth";

// Auth.js requires a catch-all route at /api/auth/[...nextauth] to
// handle all OAuth flows — sign-in initiation, the Discord callback,
// session reads, and sign-out. This single export wires all of that
// up with no additional configuration needed here.
export const { GET, POST } = handlers;
