// All requests go through cocproxy.royaleapi.dev instead of
// api.clashofclans.com directly — same endpoints, same auth, same
// response shapes. This exists purely to satisfy Supercell's requirement
// that an API key be whitelisted to a fixed IP, which Vercel's serverless
// functions don't have. See project notes for the whitelisted proxy IP.
const COC_BASE = "https://cocproxy.royaleapi.dev/v1";

function encodeTag(tag) {
  const normalized = tag.startsWith("#") ? tag : `#${tag}`;
  return encodeURIComponent(normalized);
}

async function cocFetch(path, options = {}) {
  const apiKey = process.env.COC_API_KEY;

  if (!apiKey) {
    throw new Error("Missing COC_API_KEY environment variable");
  }

  const res = await fetch(`${COC_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.reason || data?.message || `CoC API error ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return data;
}

export async function getPlayer(tag) {
  return cocFetch(`/players/${encodeTag(tag)}`);
}

export async function getClan(tag) {
  return cocFetch(`/clans/${encodeTag(tag)}`);
}

// Returns the current CWL group for a clan (rounds, member list, war tags)
// or null if no CWL is currently running for that clan — a 404 here is
// expected outside of CWL week, not a real error.
export async function getClanWarLeagueGroup(tag) {
  try {
    return await cocFetch(`/clans/${encodeTag(tag)}/currentwar/leaguegroup`);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function getCwlWar(warTag) {
  return cocFetch(`/clanwarleagues/wars/${encodeTag(warTag)}`);
}

// Confirms a player owns an account via Supercell's official in-game API
// token (Settings > API Token in the Clash of Clans app). The token is
// single-use and resets after each check, and cannot be used to access or
// modify the account in any way — it only proves identity to this app.
// Returns true/false rather than throwing on a wrong token, since "wrong
// token" is a normal, expected user-error outcome, not a system failure.
export async function verifyPlayerToken(tag, token) {
  const result = await cocFetch(`/players/${encodeTag(tag)}/verifytoken`, {
    method: "POST",
    body: JSON.stringify({ token }),
  });

  return result?.status === "ok";
}
