import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number | null | undefined): string {
  return (score ?? 0).toLocaleString();
}

export function formatAccuracy(accuracy: number | null | undefined): string {
  return `${Math.round(accuracy ?? 0)}%`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getStreakColor(streak: number): string {
  if (streak >= 10) return "text-red-500";
  if (streak >= 5) return "text-orange-500";
  if (streak >= 3) return "text-yellow-500";
  return "text-green-500";
}

export function getStreakEmoji(streak: number): string {
  if (streak >= 10) return "🔥🔥";
  if (streak >= 5) return "🔥";
  if (streak >= 3) return "⚡";
  return "";
}

export function getRankBadgeColor(rank: number): string {
  if (rank === 1) return "bg-yellow-500 text-yellow-950";
  if (rank === 2) return "bg-gray-400 text-gray-950";
  if (rank === 3) return "bg-amber-600 text-amber-950";
  return "bg-muted text-muted-foreground";
}

export function getFlagUrl(alpha2Code: string): string {
  return `https://flagcdn.com/w40/${alpha2Code.toLowerCase()}.png`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
