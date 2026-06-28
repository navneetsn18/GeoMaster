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
  WORLD: "World",
  AFRICA: "Africa",
  ASIA: "Asia",
  EUROPE: "Europe",
  AMERICAS: "Americas",
  OCEANIA: "Oceania",
  INDIA_STATES: "India States",
  WORLD_CAPITALS: "World Capitals",
  INDIA_CAPITALS: "India Capitals",
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

// Renders the card at exactly 600×340 with inline styles only (no Tailwind).
// Pass a ref to get the DOM node for html2canvas capture.
function ScoreCardCanvas({ cardRef, data }: { cardRef?: React.Ref<HTMLDivElement>; data: ShareCardData }) {
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
        boxSizing: "border-box",
      }}
    >
      {/* Dot grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        pointerEvents: "none",
      }} />
      {/* Glow */}
      <div style={{
        position: "absolute", width: 360, height: 360, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 70%)",
        top: "65%", left: "55%", transform: "translate(-50%,-50%)",
        pointerEvents: "none",
      }} />
      {/* Border */}
      <div style={{
        position: "absolute", inset: 14, borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.018)",
        pointerEvents: "none",
      }} />

      {/* TOP ROW */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #4ade80)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.9)" }} />
          </div>
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
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 28, flex: 1, minHeight: 0 }}>
        {/* Left: avatar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, width: 96, flexShrink: 0 }}>
          {data.avatarDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.avatarDataUrl}
              alt=""
              style={{ width: 68, height: 68, borderRadius: "50%", objectFit: "cover", border: "2.5px solid rgba(99,102,241,0.55)", display: "block" }}
            />
          ) : (
            <div style={{
              width: 68, height: 68, borderRadius: "50%",
              background: avatarBg, border: "2.5px solid rgba(99,102,241,0.55)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, fontWeight: 800, color: "#fff", flexShrink: 0,
            }}>{initial}</div>
          )}
          <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.82)", textAlign: "center", wordBreak: "break-all" }}>@{data.username}</span>
          {data.rank != null && (
            <div style={{
              background: data.rank <= 3 ? "linear-gradient(135deg,#f59e0b,#ef4444)" : "rgba(255,255,255,0.09)",
              borderRadius: 100, padding: "2px 9px",
              fontSize: 11.5, fontWeight: 800, color: "#fff",
            }}>
              #{data.rank}
            </div>
          )}
          {data.isPB && !data.rank && (
            <div style={{
              background: "linear-gradient(135deg,#f59e0b,#ef4444)",
              borderRadius: 100, padding: "2px 9px",
              fontSize: 11, fontWeight: 800, color: "#fff",
            }}>PB</div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 110, background: "rgba(255,255,255,0.09)", flexShrink: 0 }} />

        {/* Right: stats */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 66, fontWeight: 900, lineHeight: 1,
            color: "#4ade80",
            letterSpacing: "-3px", marginBottom: 2,
          }}>
            {formatScore(data.score)}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "2.5px", marginBottom: 18, textTransform: "uppercase" }}>
            Final Score
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              { label: "Accuracy", val: formatAccuracy(data.accuracy), color: "#818cf8" },
              ...(data.streak != null ? [{ label: "Streak", val: `${data.streak}x`, color: "#fb923c" }] : []),
              ...(data.correct != null && data.total != null ? [{ label: "Correct", val: `${data.correct}/${data.total}`, color: "#4ade80" }] : []),
            ].map(s => (
              <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</span>
                <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.38)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM */}
      <div style={{
        position: "relative", zIndex: 1,
        marginTop: 18, paddingTop: 12,
        borderTop: "1px solid rgba(255,255,255,0.065)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", fontWeight: 500 }}>{dateStr}</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", fontWeight: 500 }}>geomaster.vercel.app</span>
        </div>
        <div style={{ textAlign: "center", marginTop: 4, fontSize: 9.5, color: "rgba(255,255,255,0.25)", fontWeight: 500 }}>
          Made with ❤️ by @navneetsn18
        </div>
      </div>
    </div>
  );
}

// Pure Canvas 2D card — avoids all html2canvas rendering bugs
async function drawCardCanvas(data: ShareCardData): Promise<HTMLCanvasElement> {
  const W = 1200, H = 680, S = 2; // 2× retina (logical: 600×340)
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cx = ctx as any; // letterSpacing not in older TS lib

  function rr(x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // Background
  const bg = ctx.createLinearGradient(0, 0, W * 0.7, H);
  bg.addColorStop(0, "#070d1a"); bg.addColorStop(0.6, "#0c1629"); bg.addColorStop(1, "#070f1f");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Dot grid
  ctx.fillStyle = "rgba(255,255,255,0.055)";
  for (let x = 12; x < W; x += 48) for (let y = 12; y < H; y += 48) {
    ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
  }

  // Glow
  const glow = ctx.createRadialGradient(W * 0.55, H * 0.65, 0, W * 0.55, H * 0.65, 360);
  glow.addColorStop(0, "rgba(99,102,241,0.13)"); glow.addColorStop(1, "rgba(99,102,241,0)");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  // Inner border
  rr(28, 28, W - 56, H - 56, 36);
  ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.018)"; ctx.fill();

  // --- Logo row (logical y-center = 39) ---
  const logoX = 47 * S, logoY = 39 * S;
  const logoGrad = ctx.createLinearGradient(logoX - 22, logoY - 22, logoX + 22, logoY + 22);
  logoGrad.addColorStop(0, "#6366f1"); logoGrad.addColorStop(1, "#4ade80");
  ctx.fillStyle = logoGrad;
  ctx.beginPath(); ctx.arc(logoX, logoY, 11 * S, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath(); ctx.arc(logoX, logoY, 5 * S, 0, Math.PI * 2); ctx.fill();

  ctx.font = `900 ${17 * S}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = "#fff"; ctx.textBaseline = "middle"; ctx.textAlign = "left";
  ctx.fillText("GeoMaster", 62 * S, logoY);

  const modeLabel = data.mapType ? (MODE_LABELS[data.mapType] ?? data.mapType) : null;
  if (modeLabel) {
    ctx.font = `600 ${11.5 * S}px Inter, system-ui, sans-serif`;
    const tw = ctx.measureText(modeLabel).width;
    const padX = 11 * S, bh = 18 * S, bw = tw + padX * 2;
    const bx = W - 36 * S - bw, by = logoY - bh / 2;
    rr(bx, by, bw, bh, bh / 2);
    ctx.fillStyle = "rgba(255,255,255,0.07)"; ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.11)"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(modeLabel, bx + bw / 2, logoY);
  }

  // --- Main area: logical y = 72 to 258, center = 165 ---
  const mainCY = 165 * S;
  const avatarCX = 84 * S, avatarCY = mainCY, avatarR = 34 * S;

  if (data.avatarDataUrl) {
    try {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image(); i.crossOrigin = "anonymous";
        i.onload = () => res(i); i.onerror = rej; i.src = data.avatarDataUrl!;
      });
      ctx.save();
      ctx.beginPath(); ctx.arc(avatarCX, avatarCY, avatarR, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(img, avatarCX - avatarR, avatarCY - avatarR, avatarR * 2, avatarR * 2);
      ctx.restore();
    } catch { /* fall through to initial */ }
  }

  if (!data.avatarDataUrl) {
    ctx.fillStyle = letterColor(data.username);
    ctx.beginPath(); ctx.arc(avatarCX, avatarCY, avatarR, 0, Math.PI * 2); ctx.fill();
    ctx.font = `800 ${26 * S}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(data.username.charAt(0).toUpperCase(), avatarCX, avatarCY);
  }

  // Avatar border ring
  ctx.strokeStyle = "rgba(99,102,241,0.55)"; ctx.lineWidth = 2.5 * S;
  ctx.beginPath(); ctx.arc(avatarCX, avatarCY, avatarR, 0, Math.PI * 2); ctx.stroke();

  // @username
  ctx.font = `700 ${13 * S}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.82)"; ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText(`@${data.username}`, avatarCX, avatarCY + avatarR + 7 * S);

  // Rank / PB badge
  if (data.rank != null || data.isPB) {
    const badgeText = data.rank != null ? `#${data.rank}` : "PB";
    const isGold = (data.rank != null && data.rank <= 3) || data.isPB;
    const badgeTopY = avatarCY + avatarR + 28 * S;
    ctx.font = `800 ${11.5 * S}px Inter, system-ui, sans-serif`;
    const bw = ctx.measureText(badgeText).width + 18 * S, bh = 16 * S;
    const bx = avatarCX - bw / 2;
    if (isGold) {
      const g = ctx.createLinearGradient(bx, badgeTopY, bx + bw, badgeTopY);
      g.addColorStop(0, "#f59e0b"); g.addColorStop(1, "#ef4444"); ctx.fillStyle = g;
    } else { ctx.fillStyle = "rgba(255,255,255,0.09)"; }
    rr(bx, badgeTopY, bw, bh, bh / 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(badgeText, avatarCX, badgeTopY + bh / 2);
  }

  // Vertical divider
  ctx.strokeStyle = "rgba(255,255,255,0.09)"; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(144 * S, 82 * S); ctx.lineTo(144 * S, 248 * S);
  ctx.stroke();

  // Score (baseline at logical 168)
  const statsX = 158 * S, scoreBaseY = 168 * S;
  ctx.font = `900 ${66 * S}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = "#4ade80"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.fillText(formatScore(data.score), statsX, scoreBaseY);

  // "FINAL SCORE"
  ctx.font = `700 ${10 * S}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  cx.letterSpacing = `${2.5 * S}px`;
  ctx.fillText("FINAL SCORE", statsX, scoreBaseY + 16 * S);
  cx.letterSpacing = "0px";

  // Stats row
  const statItems = [
    { label: "Accuracy", val: formatAccuracy(data.accuracy), color: "#818cf8" },
    ...(data.streak != null ? [{ label: "Streak", val: `${data.streak}x`, color: "#fb923c" }] : []),
    ...(data.correct != null && data.total != null ? [{ label: "Correct", val: `${data.correct}/${data.total}`, color: "#4ade80" }] : []),
  ];
  let sx = statsX;
  const statValY = scoreBaseY + 50 * S;
  for (const st of statItems) {
    ctx.font = `800 ${18 * S}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = st.color; ctx.textBaseline = "alphabetic";
    ctx.fillText(st.val, sx, statValY);
    ctx.font = `600 ${9.5 * S}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.38)";
    cx.letterSpacing = `${S}px`;
    ctx.fillText(st.label.toUpperCase(), sx, statValY + 16 * S);
    cx.letterSpacing = "0px";
    sx += 80 * S;
  }

  // --- Bottom ---
  ctx.strokeStyle = "rgba(255,255,255,0.065)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(36 * S, 268 * S); ctx.lineTo((600 - 36) * S, 268 * S); ctx.stroke();

  const dateStr = data.date
    ? new Date(data.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  ctx.font = `500 ${11 * S}px Inter, system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.28)"; ctx.textAlign = "left";
  ctx.fillText(dateStr, 36 * S, 284 * S);
  ctx.fillStyle = "rgba(255,255,255,0.22)"; ctx.textAlign = "right";
  ctx.fillText("geomaster.vercel.app", (600 - 36) * S, 284 * S);

  ctx.font = `500 ${10 * S}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.28)"; ctx.textAlign = "center";
  ctx.fillText("Made with ❤️ by @navneetsn18", W / 2, 308 * S);

  return canvas;
}

async function captureAndExport(data: ShareCardData, action: "share" | "download") {
  const canvas = await drawCardCanvas(data);
  const filename = `geomaster-${data.username}-${data.score}.png`;
  await new Promise<void>(resolve => {
    canvas.toBlob(async blob => {
      if (!blob) return resolve();
      if (action === "share") {
        const file = new File([blob], filename, { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "GeoMaster Score",
            text: `I scored ${formatScore(data.score)} on GeoMaster! Can you beat me?`,
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
  const [capturing, setCapturing] = useState(false);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!open || !rawAvatarUrl) return;
    toDataUrl(rawAvatarUrl).then(d => setAvatarDataUrl(d ?? undefined));
  }, [open, rawAvatarUrl]);

  const data: ShareCardData = { ...baseData, avatarDataUrl };

  const doCapture = useCallback(async (action: "share" | "download") => {
    setCapturing(true);
    try { await captureAndExport(data, action); }
    finally { setCapturing(false); }
  }, [data]);

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-[660px] p-6">
        <DialogTitle className="text-lg font-bold mb-4">Share Score</DialogTitle>
        {/* Preview — scaled down to fit dialog */}
        <div className="flex justify-center mb-5 rounded-xl overflow-hidden shadow-xl" style={{ transform: "scale(0.9)", transformOrigin: "top center", height: 306 }}>
          <ScoreCardCanvas data={data} />
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
        onClick={e => { e.stopPropagation(); setOpen(true); }}
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
        onClick={e => { e.stopPropagation(); setOpen(true); }}
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
