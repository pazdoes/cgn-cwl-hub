export function getLeagueStyles(rank = "") {
  const r = rank.toLowerCase();

  if (r.includes("champion")) {
    return {
      border: "border-yellow-500/30",
      glow: "shadow-yellow-500/10",
      accent: "text-yellow-400"
    };
  }

  if (r.includes("master")) {
    return {
      border: "border-purple-500/30",
      glow: "shadow-purple-500/10",
      accent: "text-purple-400"
    };
  }

  if (r.includes("crystal")) {
    return {
      border: "border-cyan-500/30",
      glow: "shadow-cyan-500/10",
      accent: "text-cyan-400"
    };
  }

  if (r.includes("gold")) {
    return {
      border: "border-amber-500/30",
      glow: "shadow-amber-500/10",
      accent: "text-amber-400"
    };
  }

  return {
    border: "border-slate-700",
    glow: "",
    accent: "text-slate-300"
  };
}