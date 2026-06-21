// CWL seasons are always labeled by their calendar month (e.g. "June
// 2026"), so there's no need to store and manually update that label
// anywhere — it's just computed fresh on every request. Pinned to UTC
// deliberately, so the result is identical no matter which region the
// serverless function happens to run in.
export function getCurrentSeason(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
