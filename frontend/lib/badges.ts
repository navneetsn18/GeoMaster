export interface PlayerBadge {
  icon: string;
  label: string;
  description: string;
  bg: string;    // tailwind bg class
  text: string;  // tailwind text class
  border: string;
}

interface Stats {
  totalGames: number;
  bestScore: number;
  avgAccuracy: number; // 0–100
  bestStreak: number;
}

// Each category returns the highest earned badge (or null)
function gameBadge(g: number): PlayerBadge | null {
  if (g >= 500) return { icon: "👑", label: "Legend",    description: "500+ games played",  bg: "bg-purple-500/15", text: "text-purple-300", border: "border-purple-500/40" };
  if (g >= 100) return { icon: "🏅", label: "Champion",  description: "100+ games played",  bg: "bg-yellow-500/15", text: "text-yellow-300", border: "border-yellow-500/40" };
  if (g >= 25)  return { icon: "⚔️",  label: "Veteran",   description: "25+ games played",   bg: "bg-blue-500/15",   text: "text-blue-300",   border: "border-blue-500/40"   };
  if (g >= 5)   return { icon: "🎮",  label: "Player",    description: "5+ games played",    bg: "bg-green-500/15",  text: "text-green-300",  border: "border-green-500/40"  };
  if (g >= 1)   return { icon: "🌱",  label: "Newcomer",  description: "First game played",  bg: "bg-muted/50",      text: "text-muted-foreground", border: "border-border" };
  return null;
}

function scoreBadge(s: number): PlayerBadge | null {
  if (s >= 15000) return { icon: "💎", label: "Diamond",  description: "15,000+ best score",  bg: "bg-cyan-500/15",   text: "text-cyan-300",   border: "border-cyan-500/40"   };
  if (s >= 7000)  return { icon: "🥇", label: "Gold",     description: "7,000+ best score",   bg: "bg-yellow-500/15", text: "text-yellow-300", border: "border-yellow-500/40" };
  if (s >= 3000)  return { icon: "🥈", label: "Silver",   description: "3,000+ best score",   bg: "bg-slate-400/15",  text: "text-slate-300",  border: "border-slate-400/40"  };
  if (s >= 1000)  return { icon: "🥉", label: "Bronze",   description: "1,000+ best score",   bg: "bg-orange-700/15", text: "text-orange-400", border: "border-orange-700/40" };
  return null;
}

function accuracyBadge(a: number): PlayerBadge | null {
  if (a >= 90) return { icon: "💯", label: "Flawless",      description: "90%+ avg accuracy",  bg: "bg-emerald-500/15", text: "text-emerald-300", border: "border-emerald-500/40" };
  if (a >= 75) return { icon: "🔬", label: "Precise",       description: "75%+ avg accuracy",  bg: "bg-teal-500/15",    text: "text-teal-300",    border: "border-teal-500/40"    };
  if (a >= 60) return { icon: "🎯", label: "Sharpshooter",  description: "60%+ avg accuracy",  bg: "bg-lime-500/15",    text: "text-lime-300",    border: "border-lime-500/40"    };
  return null;
}

function streakBadge(s: number): PlayerBadge | null {
  if (s >= 25) return { icon: "🌊", label: "Unstoppable",  description: "25+ best streak",  bg: "bg-violet-500/15", text: "text-violet-300", border: "border-violet-500/40" };
  if (s >= 10) return { icon: "🔥", label: "On Fire",      description: "10+ best streak",  bg: "bg-red-500/15",    text: "text-red-300",    border: "border-red-500/40"    };
  if (s >= 5)  return { icon: "⚡",  label: "Quick Fire",   description: "5+ best streak",   bg: "bg-amber-500/15",  text: "text-amber-300",  border: "border-amber-500/40"  };
  return null;
}

export function computeBadges(stats: Stats): PlayerBadge[] {
  return [
    gameBadge(stats.totalGames),
    scoreBadge(stats.bestScore),
    accuracyBadge(stats.avgAccuracy),
    streakBadge(stats.bestStreak),
  ].filter(Boolean) as PlayerBadge[];
}
