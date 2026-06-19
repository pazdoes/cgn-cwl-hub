export function getLeagueStyles(rank = "") {
  const r = rank.toLowerCase();

  if (r.includes("champion")) {
    return {
      border: "border-yellow-400/30",
      glow: "shadow-yellow-500/10",
      text: "text-yellow-300"
    };
  }

  if (r.includes("master")) {
    return {
      border: "border-purple-400/30",
      glow: "shadow-purple-500/10",
      text: "text-purple-300"
    };
  }

  if (r.includes("crystal")) {
    return {
      border: "border-cyan-400/30",
      glow: "shadow-cyan-500/10",
      text: "text-cyan-300"
    };
  }

  if (r.includes("gold")) {
    return {
      border: "border-amber-400/30",
      glow: "shadow-amber-500/10",
      text: "text-amber-300"
    };
  }

  return {
    border: "border-white/10",
    glow: "",
    text: "text-slate-300"
  };
}