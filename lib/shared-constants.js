import { CWL_ICONS } from "@/lib/icons";

// Shared constants for CGN CWL Hub views
// Auto-extracted from app/page.js

export const CWL_RANK_ORDER = Object.keys(CWL_ICONS);

export const PIE_COLORS = [
  "#a78bfa", "#818cf8", "#60a5fa", "#38bdf8", "#22d3ee",
  "#2dd4bf", "#34d399", "#a3e635", "#facc15", "#fb923c",
  "#f87171", "#f472b6",
];

export const ALL_TH_LEVELS = ["17","16","15","14","13","12","11","10","9","8","7","6","5","4","3","2","1"];

export const PLAYER_COLORS = ["#a78bfa", "#34d399", "#fb923c"];

export const STAT_OPTIONS = [
  { key: "overall",            label: "CGN Rating" },
  { key: "efficiency",         label: "Atk Efficiency" },
  { key: "stars_earned",       label: "Stars Earned" },
  { key: "destruction_pct",    label: "Destruction %" },
  { key: "defence_efficiency", label: "Def Efficiency" },
  { key: "stars_conceded",     label: "Stars Conceded" },
  { key: "defence_pct",        label: "Defence %" },
  { key: "attacks_used",       label: "Attacks Used" },
  { key: "missed_attacks",     label: "Missed Attacks" },
  { key: "cwl_rank",           label: "CWL Rank (Clan)" },
];

export const CWL_RANK_ORDER_HIST = [
  "Champion I","Champion II","Champion III",
  "Master I","Master II","Master III",
  "Crystal I","Crystal II","Crystal III",
  "Gold I","Gold II","Gold III",
  "Silver I","Silver II","Silver III",
  "Bronze I","Bronze II","Bronze III","Unranked",
];

export const CLAN_COLORS_CHART = ["#a78bfa", "#34d399", "#fb923c"];

export const CLAN_STAT_OPTIONS = [
  { group: "CGN Rating", key: "overall",                label: "CGN Rating" },
  { group: "Rank",    key: "cwl_rank",               label: "CWL Rank" },
  { group: "Attack",  key: "total_stars",             label: "Total Stars" },
  { group: "Attack",  key: "attack_efficiency",       label: "Attack Efficiency" },
  { group: "Attack",  key: "avg_destruction_pct",     label: "Destruction %" },
  { group: "Attack",  key: "three_star_rate",         label: "Three Star Rate %" },
  { group: "Attack",  key: "total_attacks_used",      label: "Attacks Used" },
  { group: "Attack",  key: "total_attacks_missed",    label: "Missed Attacks" },
  { group: "Defence", key: "total_stars_conceded",    label: "Stars Conceded" },
  { group: "Defence", key: "defence_efficiency",      label: "Defence Efficiency" },
  { group: "Defence", key: "avg_defence_pct",         label: "Defence %" },
  { group: "Record",  key: "wars_won",                label: "Wars Won" },
  { group: "Record",  key: "wars_lost",               label: "Wars Lost" },
  { group: "Record",  key: "wars_drawn",              label: "Wars Drawn" },
];

export const CWL_RANK_LIST = [
  "Champion I","Champion II","Champion III",
  "Master I","Master II","Master III",
  "Crystal I","Crystal II","Crystal III",
  "Gold I","Gold II","Gold III",
  "Silver I","Silver II","Silver III",
  "Bronze I","Bronze II","Bronze III","Unranked",
];

export const PROFILE_HERO_ORDER = ["Barbarian King","Archer Queen","Minion Prince","Grand Warden","Royal Champion","Dragon Duke"];

export const PROFILE_ROLE_LABELS = { leader: "Leader", coLeader: "Co-Leader", admin: "Elder", member: "Member" };

export const LB_METRIC_INFO = [
  { key: "overall",            label: "CGN Rating",    stroke: "#a78bfa", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z", tip: "Weighted overall score: 60% Attack EFF + 40% Defence EFF. Higher is better." },
  { key: "efficiency",         label: "Atk EFF",       stroke: "#a78bfa", icon: "M13 10V3L4 14h7v7l9-11h-7z",                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         tip: "Average stars earned per attack. Max is 3.00 — every attack was a 3-star." },
  { key: "defence_efficiency", label: "Def EFF",        stroke: "#60a5fa", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",                                                                                                                                                                                                                                                                                                     tip: "Average stars conceded per defence. Lower is better — 0.00 means no stars given away." },
  { key: "stars_earned",       label: "Stars",          stroke: "#86efac", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",                                                                                                                     tip: "Total stars earned across all attacks in the selected period." },
  { key: "stars_conceded",     label: "Stars Given",    stroke: "#94a3b8", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",                                                                                                                     tip: "Total stars conceded to opponents across all defences." },
  { key: "three_star_rate",    label: "3★ Rate",        stroke: "#86efac", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",                                                                                                                     tip: "Percentage of attacks that achieved full 3-star destruction." },
  { key: "avg_stars_per_attack", label: "Avg ★/Atk",   stroke: "#fbbf24", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",                                                                                                                                                                                                                                                                                     tip: "Mean stars per attack across all wars. Similar to Atk EFF but expressed as a raw average." },
  { key: "punch_up_rate",      label: "Punch-Up",       stroke: "#60a5fa", icon: "M5 10l7-7m0 0l7 7m-7-7v18",                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         tip: "Percentage of attacks made against a higher Town Hall level than the attacker's own." },
  { key: "clutch_rate",        label: "Clutch",         stroke: "#a78bfa", icon: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z",                                                                                                                                                                                                                                                                                                                                                 tip: "Efficiency on same-TH or higher attacks — measures skill independent of match-up advantage." },
  { key: "missed_attacks",     label: "Missed",         stroke: "#f87171", icon: "M6 18L18 6M6 6l12 12",                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               tip: "Number of available attacks not used in war. Highlighted red when greater than zero." },
  { key: "attacks_used",       label: "Attacks",        stroke: "#94a3b8", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",                                                                                                                                                                                                                                                                                                                                                               tip: "Attacks used out of total available (e.g. 14/14). Shows participation level." },
  { key: "destruction_pct",    label: "Dest %",         stroke: "#94a3b8", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",                                                                                                                                                                                                                                                                                     tip: "Average percentage destruction per attack across all wars." },
  { key: "defence_pct",        label: "Def %",          stroke: "#94a3b8", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",                                                                                                                                                                                                                                                                                     tip: "Average percentage destruction conceded per defence." },
  { key: "consistency_score",  label: "Consistency",    stroke: "#94a3b8", icon: "M4 6h16M4 10h16M4 14h16M4 18h16",                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   tip: "How reliably a player performs at or above their average — rewards steady performers over streaky ones." },
];

