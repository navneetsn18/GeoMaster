"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Share2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useGameStore } from "@/lib/game-store";
import { getStoredUser } from "@/lib/auth";
import { getAvatarUrl } from "@/lib/avatar";
import { formatAccuracy, formatScore } from "@/lib/utils";
import type { LeaderboardEntry, RecentGame } from "@/types";

const MODE_LABELS: Record<string, string> = {
  WORLD: "🌍 World",
  AFRICA: "🌍 Africa",
  ASIA: "🌏 Asia",
  EUROPE: "🌍 Europe",
  AMERICAS: "🌎 Americas",
  OCEANIA: "🌏 Oceania",
  INDIA_STATES: "🇮🇳 India States",
  WORLD_CAPITALS: "🏛️ World Capitals",
  INDIA_CAPITALS: "🇮🇳 India Capitals",
};

interface ShareCardData {
  username: string;
  avatarDataUrl?: string;
  score: number;
  accuracy: number;
  streak?: number;
  correct?: number;
  total?: number;
  rank?: number;
  mapType?: string;
  date?: string;
  isPB?: boolean;
}

const AVATAR_COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#06b6d4","#10b981",
  "#f59e0b","#ef4444","#14b8a6","#3b82f6","#a855f7",
];
function letterColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function ScoreCardCanvas({ cardRef, data }: { cardRef: React.RefObject<HTMLDivElement>; data: ShareCardData }) {
  const modeLabel = data.mapType ? (MODE_LABELS[data.mapType] ?? data.mapType) : null;
  const avatarBg = letterColor(data.username);
  const initial = data.username.charAt(0).toUpperCase();
  const dateStr = data.date
    ? new Date(data.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div
      ref={cardRef}
      style={{
        width: 600, height: 340,
        background: "linear-gradient(135deg, #070d1a 0%, #0c1629 60%, #070f1f 100%)",
        position: "relative", overflow: "hidden",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        display: "flex", flexDirection: "column",
        padding: "28px 36px 24px",
      }}
    >
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }} />
      <div style={{
        position: "absolute", width: 360, height: 360, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 70%)",
        top: "65%", left: "55%", transform: "translate(-50%,-50%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", inset: 14, borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.018)",
        pointerEvents: "none",
      }} />

      {/* TOP ROW */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 20 }}>🌍</span>
          <span style={{ fontSize: 17, fontWeight: 900, color: "#fff", letterSpacing: "-0.4px" }}>GeoMaster</span>
        </div>
        {modeLabel && (
          <div style={{
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.11)",
            borderRadius: 100, padding: "3px 11px",
            fontSize: 11.5, color: "rgba(255,255,255,0.6)", fontWeight: 600,
          }}>
            {modeLabel}
          </div>
        )}
      </div>

      {/* MAIN ROW */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 28, flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, minWidth: 96 }}>
          {data.avatarDataUrl ? (
            <img
              src={data.avatarDataUrl}
              alt=""
              style={{ width: 68, height: 68, borderRadius: "50%", objectFit: "cover", border: "2.5px solid rgba(99,102,241,0.55)" }}
            />
          ) : (
            <div style={{
              width: 68, height: 68, borderRadius: "50%",
              background: avatarBg, border: "2.5px solid rgba(99,102,241,0.55)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, fontWeight: 800, color: "#fff",
            }}>{initial}</div>
          )}
          <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.82)" }}>@{data.username}</span>
          {data.rank != null && (
            <div style={{
              background: data.rank <= 3 ? "linear-gradient(135deg,#f59e0b,#ef4444)" : "rgba(255,255,255,0.09)",
              borderRadius: 100, padding: "2px 9px",
              fontSize: 11.5, fontWeight: 800, color: "#fff",
            }}>
              {data.rank === 1 ? "🥇 1st" : data.rank === 2 ? "🥈 2nd" : data.rank === 3 ? "🥉 3rd" : `#${data.rank}`}
            </div>
          )}
          {data.isPB && !data.rank && (
            <div style={{
              background: "linear-gradient(135deg,#f59e0b,#ef4444)",
              borderRadius: 100, padding: "2px 9px",
              fontSize: 11, fontWeight: 800, color: "#fff",
            }}>🏆 PB</div>
          )}
        </div>

        <div style={{ width: 1, height: 110, background: "rgba(255,255,255,0.09)", flexShrink: 0 }} />

        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 66, fontWeight: 900, lineHeight: 1,
            background: "linear-gradient(135deg, #818cf8 10%, #34d399 90%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: "-3px", marginBottom: 2,
          }}>
            {formatScore(data.score)}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", fontWeight: 700, letterSpacing: "2.5px", marginBottom: 18 }}>
            FINAL SCORE
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            {[
              { emoji: "🎯", label: "Accuracy", val: formatAccuracy(data.accuracy) },
              ...(data.streak != null ? [{ emoji: "🔥", label: "Streak", val: `${data.streak}x` }] : []),
              ...(data.correct != null && data.total != null ? [{ emoji: "✅", label: "Correct", val: `${data.correct}/${data.total}` }] : []),
            ].map(s => (
              <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 15 }}>{s.emoji}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{s.val}</span>
                <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.38)", fontWeight: 600 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginTop: 18, paddingTop: 12,
        borderTop: "1px solid rgba(255,255,255,0.065)",
      }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", fontWeight: 500 }}>{dateStr}</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", fontWeight: 500 }}>geomaster.vercel.app</span>
      </div>
    </div>
  );
}

async function captureAndExport(cardEl: HTMLDivElement, data: ShareCardData, action: "share" | "download") {
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(cardEl, {
    scale: 2, useCORS: true, allowTaint: false,
    backgroundColor: "#070d1a", logging: false,
    width: 600, height: 340,
  });
  await new Promise<void>((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return resolve();
      const filename = `geomaster-${data.username}-${data.score}.png`;
      if (action === "share") {
        const file = new File([blob], filename, { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "GeoMaster Score",
            text: `I scored ${formatScore(data.score)} on GeoMaster! Can you beat me? 🌍`,
          }).catch(() => {});
          return resolve();
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      resolve();
    }, "image/png");
  });
}

function ShareDialog({ rawAvatarUrl, baseData, open, onClose }: {
  rawAvatarUrl?: string;
  baseData: Omit<ShareCardData, "avatarDataUrl">;
  open: boolean;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!open || !rawAvatarUrl) return;
    toDataUrl(rawAvatarUrl).then((d) => setAvatarDataUrl(d ?? undefined));
  }, [open, rawAvatarUrl]);

  const data: ShareCardData = { ...baseData, avatarDataUrl };

  const doCapture = useCallback(async (action: "share" | "download") => {
    if (!cardRef.current) return;
    setCapturing(true);
    try { await captureAndExport(cardRef.current, data, action); }
    finally { setCapturing(false); }
  }, [data]);

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[660px] p-6">
        <DialogTitle className="text-lg font-bold mb-4">Share Score</DialogTitle>
        <div className="flex justify-center mb-5 rounded-xl overflow-hidden shadow-xl">
          <ScoreCardCanvas cardRef={cardRef as React.RefObject<HTMLDivElement>} data={data} />
        </div>
        <div className="flex gap-3">
          {canShare && (
            <Button className="flex-1" onClick={() => doCapture("share")} disabled={capturing}>
              {capturing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}
              Share
            </Button>
          )}
          <Button variant={canShare ? "outline" : "default"} className="flex-1" onClick={() => doCapture("download")} disabled={capturing}>
            {capturing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Download PNG
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Post to Instagram, WhatsApp, Twitter — anywhere!
        </p>
      </DialogContent>
    </Dialog>
  );
}

// ─── Public exports ───────────────────────────────────────────────────────────

export function ShareScoreButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { sessionResult, mapType } = useGameStore();
  const user = getStoredUser();
  if (!sessionResult || !user) return null;

  return (
    <>
      <Button variant="outline" className={className} onClick={() => setOpen(true)}>
        <Share2 className="w-4 h-4 mr-2" />
        Share Score
      </Button>
      <ShareDialog
        rawAvatarUrl={getAvatarUrl(user.id, user.avatarUrl)}
        baseData={{
          username: user.username,
          score: sessionResult.score,
          accuracy: sessionResult.accuracy,
          streak: sessionResult.bestStreak,
          correct: sessionResult.correctCount,
          total: sessionResult.totalCount,
          mapType: mapType ?? undefined,
          isPB: sessionResult.newPersonalBest,
          date: new Date().toISOString(),
        }}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

export function ShareEntryButton({ entry }: { entry: LeaderboardEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        title="Share this score"
      >
        <Share2 className="w-3.5 h-3.5" />
      </button>
      <ShareDialog
        rawAvatarUrl={getAvatarUrl(entry.userId, entry.avatarUrl)}
        baseData={{
          username: entry.username,
          score: entry.score,
          accuracy: entry.accuracy,
          rank: entry.rank,
          mapType: entry.mapType,
          date: entry.date,
        }}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

export function ShareGameButton({ game, username, userId, avatarUrl }: {
  game: RecentGame; username: string; userId?: string; avatarUrl?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        title="Share this score"
      >
        <Share2 className="w-3.5 h-3.5" />
      </button>
      <ShareDialog
        rawAvatarUrl={userId ? getAvatarUrl(userId, avatarUrl) : undefined}
        baseData={{
          username,
          score: game.score,
          accuracy: game.accuracy,
          correct: game.correctCount,
          total: game.totalCount,
          mapType: game.mapType,
          date: game.playedAt,
        }}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
