// The pool that's open for sign-ups is always for *next* calendar month,
// never the one currently underway — by the time a given month's CWL
// starts on the 1st, that month's rosters are already assigned and in
// use, so what's actually open for registration is the month after it.
// Example: throughout July, the open pool is "August" — it flips to
// "September" the moment August 1st arrives.
//
// Using Date.UTC with month+1 lets JS handle the December -> January /
// year-rollover case automatically, no special-casing needed.
export function getOpenPoolSeason(date = new Date()) {
  const nextMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(nextMonth);
}
