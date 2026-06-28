"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adminApi, type AdminStats, type AdminUser, type AdminSession } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { COUNTRY_NAMES } from "@/lib/country-codes";
import {
  Users, Trophy, Clock, Activity, ShieldBan, ShieldCheck,
  Trash2, Gamepad2, BarChart3, AlertTriangle, Crown,
  Eye, Flag, ChevronDown, ChevronUp, X, CheckCircle2, XCircle,
} from "lucide-react";
import { getAvatarUrl } from "@/lib/avatar";

const MODE_LABELS: Record<string, string> = {
  WORLD: "World", AFRICA: "Africa", ASIA: "Asia", EUROPE: "Europe",
  AMERICAS: "Americas", OCEANIA: "Oceania", INDIA_STATES: "India States",
  WORLD_CAPITALS: "World Capitals", INDIA_CAPITALS: "India Capitals",
};

function formatMs(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function SuspicionBadge({ ms }: { ms: number }) {
  if (ms < 500) return <span className="text-red-400 font-bold text-xs" title="Suspiciously fast">{formatMs(ms)}</span>;
  if (ms < 2000) return <span className="text-yellow-400 text-xs">{formatMs(ms)}</span>;
  return <span className="text-muted-foreground text-xs">{formatMs(ms)}</span>;
}

function MatchesModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.getUserSessions(user.id)
      .then(setSessions)
      .catch(() => setError("Failed to load sessions"))
      .finally(() => setLoading(false));
  }, [user.id]);

  const toggleExpand = (id: string) =>
    setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleFlag = useCallback(async (sessionId: string) => {
    setActionLoading(sessionId + ":flag");
    try {
      await adminApi.flagSession(sessionId);
      let flaggedCount = 0;
      setSessions(prev => {
        const updated = prev.map(s => s.id === sessionId ? { ...s, flagCount: 1 } : s);
        flaggedCount = updated.filter(s => s.flagCount > 0).length;
        return updated;
      });
      if (flaggedCount >= 3) {
        setError("3 different sessions flagged — user auto-banned, scores hidden from leaderboard.");
      }
    } catch { setError("Flag failed"); }
    finally { setActionLoading(null); }
  }, []);

  const handleUnflag = useCallback(async (sessionId: string) => {
    setActionLoading(sessionId + ":unflag");
    try {
      await adminApi.unflagSession(sessionId);
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, flagCount: 0 } : s));
    } catch { setError("Unflag failed"); }
    finally { setActionLoading(null); }
  }, []);

  const handleDelete = useCallback(async (sessionId: string) => {
    if (!confirm("Delete this match and remove it from the leaderboard?")) return;
    setActionLoading(sessionId + ":delete");
    try {
      await adminApi.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch { setError("Delete failed"); }
    finally { setActionLoading(null); }
  }, []);

  const suspicionScore = (s: AdminSession) => {
    if (!s.guesses.length) return 0;
    const avgMs = s.guesses.reduce((a, g) => a + g.timeTakenMs, 0) / s.guesses.length;
    const ultraFast = s.guesses.filter(g => g.timeTakenMs < 500).length;
    return ultraFast > 3 || avgMs < 1500 ? ultraFast : 0;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <img src={getAvatarUrl(user.id, user.avatarUrl)} alt="" className="w-8 h-8 rounded-full" />
            <div>
              <h3 className="font-semibold">{user.username} — Match History</h3>
              <p className="text-xs text-muted-foreground">{sessions.length} sessions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-2 bg-red-500/20 border border-red-500/40 rounded text-red-400 text-xs flex items-center justify-between">
            {error}
            <button onClick={() => setError("")} className="underline">dismiss</button>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {loading ? (
            <div className="text-center text-muted-foreground py-12">Loading sessions…</div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">No sessions found</div>
          ) : sessions.map(s => {
            const isExpanded = expanded.has(s.id);
            const sus = suspicionScore(s);
            return (
              <div key={s.id} className={`border rounded-lg overflow-hidden ${s.flagCount > 0 ? "border-yellow-500/40 bg-yellow-950/10" : "border-border/60"}`}>
                {/* Session row */}
                <div className="flex items-center gap-3 p-3">
                  <button onClick={() => toggleExpand(s.id)} className="text-muted-foreground hover:text-foreground">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground block">Mode</span>
                      <span className="font-medium">{MODE_LABELS[s.mapType] ?? s.mapType}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Score</span>
                      <span className="font-semibold text-yellow-400">{s.finalScore.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Correct</span>
                      <span>{s.correctCount}/{s.totalCount} ({s.totalCount > 0 ? ((s.correctCount / s.totalCount) * 100).toFixed(0) : 0}%)</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Date</span>
                      <span className="text-xs">{s.completedAt ? new Date(s.completedAt).toLocaleDateString() : "Incomplete"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {sus > 0 && (
                      <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 rounded px-1.5 py-0.5 font-bold" title="Suspicious timing">
                        {sus} fast
                      </span>
                    )}
                    {s.flagCount > 0 && (
                      <span className="text-[10px] rounded px-1.5 py-0.5 font-bold border bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                        Flagged
                      </span>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${s.status === "COMPLETED" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-muted text-muted-foreground border-border"}`}>
                      {s.status === "COMPLETED" ? "Done" : s.status}
                    </span>
                    {/* Flag/unflag — each session can only be flagged once */}
                    {s.flagCount === 0 ? (
                      <button
                        onClick={() => handleFlag(s.id)}
                        disabled={!!actionLoading}
                        className="p-1.5 rounded hover:bg-yellow-500/20 text-yellow-500 transition-colors disabled:opacity-40"
                        title="Flag this session"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnflag(s.id)}
                        disabled={!!actionLoading}
                        className="p-1.5 rounded hover:bg-muted text-yellow-400 transition-colors disabled:opacity-40"
                        title="Remove flag"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={!!actionLoading}
                      className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-40"
                      title="Delete match (removes from leaderboard)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Guess breakdown */}
                {isExpanded && (
                  <div className="border-t border-border/40 bg-muted/10 p-3">
                    {s.guesses.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No guess records</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-muted-foreground border-b border-border/40">
                              <th className="text-left pb-1.5 pr-3">#</th>
                              <th className="text-left pb-1.5 pr-3">Country</th>
                              <th className="text-center pb-1.5 pr-3">Result</th>
                              <th className="text-right pb-1.5 pr-3">Time</th>
                              <th className="text-right pb-1.5">Points</th>
                            </tr>
                          </thead>
                          <tbody>
                            {s.guesses.map((g, i) => (
                              <tr key={g.id} className={`border-b border-border/20 ${g.timeTakenMs < 500 ? "bg-red-500/5" : ""}`}>
                                <td className="py-1 pr-3 text-muted-foreground">{i + 1}</td>
                                <td className="py-1 pr-3 font-medium">
                                  {COUNTRY_NAMES[g.countryCode] ?? g.countryCode.toUpperCase()}
                                </td>
                                <td className="py-1 pr-3 text-center">
                                  {g.correct
                                    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 inline" />
                                    : <XCircle className="w-3.5 h-3.5 text-red-400 inline" />}
                                </td>
                                <td className="py-1 pr-3 text-right">
                                  <SuspicionBadge ms={g.timeTakenMs} />
                                </td>
                                <td className="py-1 text-right text-muted-foreground">+{g.pointsEarned}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="mt-2 pt-2 border-t border-border/30 flex gap-4 text-[10px] text-muted-foreground">
                          <span>Avg time: {s.guesses.length ? formatMs(Math.round(s.guesses.reduce((a, g) => a + g.timeTakenMs, 0) / s.guesses.length)) : "—"}</span>
                          <span>Fastest: {s.guesses.length ? formatMs(Math.min(...s.guesses.map(g => g.timeTakenMs))) : "—"}</span>
                          <span className="text-red-400">Under 500ms: {s.guesses.filter(g => g.timeTakenMs < 500).length}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(() => getStoredUser());

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [matchesUser, setMatchesUser] = useState<AdminUser | null>(null);

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!user) return;
    if (!isAdmin) { router.push("/dashboard"); return; }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]);

  async function load() {
    try {
      const [s, u] = await Promise.all([adminApi.getStats(), adminApi.getUsers()]);
      setStats(s);
      setUsers(u);
    } catch { setError("Failed to load admin data"); }
    finally { setLoading(false); }
  }

  async function handleDeleteUser(u: AdminUser) {
    if (!confirm(`Delete user "${u.username}" and ALL their data?`)) return;
    setActionLoading(u.id + ":delete");
    try {
      await adminApi.deleteUser(u.id);
      setUsers(prev => prev.filter(x => x.id !== u.id));
      await load();
    } catch { setError("Delete failed"); }
    finally { setActionLoading(null); }
  }

  async function handleDeleteSessions(u: AdminUser) {
    if (!confirm(`Delete all game sessions for "${u.username}"?`)) return;
    setActionLoading(u.id + ":sessions");
    try {
      await adminApi.deleteUserSessions(u.id);
      await load();
    } catch { setError("Delete sessions failed"); }
    finally { setActionLoading(null); }
  }

  async function handleBan() {
    if (!banTarget) return;
    setActionLoading(banTarget.id + ":ban");
    try {
      const updated = await adminApi.banUser(banTarget.id, banReason || "Banned by admin");
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      setBanTarget(null); setBanReason("");
      await load();
    } catch { setError("Ban failed"); }
    finally { setActionLoading(null); }
  }

  async function handleUnban(u: AdminUser) {
    setActionLoading(u.id + ":unban");
    try {
      await adminApi.unbanUser(u.id);
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, banned: false, banReason: undefined, bannedAt: undefined } : x));
    } catch { setError("Unban failed"); }
    finally { setActionLoading(null); }
  }

  async function handleSetRole(u: AdminUser, role: "USER" | "ADMIN") {
    if (u.id === user?.id) return;
    setActionLoading(u.id + ":role");
    try {
      await adminApi.setRole(u.id, role);
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role } : x));
    } catch { setError("Role change failed"); }
    finally { setActionLoading(null); }
  }

  if (!user) return null;
  if (!isAdmin) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-xl font-semibold">Access Denied</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
        <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-center justify-between">
          {error}
          <button className="underline ml-2" onClick={() => setError("")}>dismiss</button>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: "Users", value: stats.totalUsers, icon: Users },
            { label: "Games", value: stats.totalGames, icon: Gamepad2 },
            { label: "Completed", value: stats.completedGames, icon: Trophy },
            { label: "Active Now", value: stats.activeSessions, icon: Activity },
            { label: "Hours Played", value: stats.totalHoursPlayed.toFixed(1), icon: Clock },
            { label: "Banned", value: users.filter(u => u.banned).length, icon: ShieldBan },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
              <Icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <BarChart3 className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold">Users ({users.length})</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Email</th>
                  <th className="text-center p-3 font-medium">Games</th>
                  <th className="text-center p-3 font-medium hidden md:table-cell">Best Score</th>
                  <th className="text-center p-3 font-medium hidden md:table-cell">Accuracy</th>
                  <th className="text-center p-3 font-medium hidden md:table-cell">Streak</th>
                  <th className="text-center p-3 font-medium">Role</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className={`border-b border-border/50 hover:bg-muted/20 ${u.banned ? "opacity-60" : ""}`}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <img src={getAvatarUrl(u.id, u.avatarUrl)} alt="" className="w-7 h-7 rounded-full bg-muted object-cover" />
                        <span className="font-medium">{u.username}</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground hidden sm:table-cell text-xs truncate max-w-[180px]">{u.email}</td>
                    <td className="p-3 text-center">{u.gamesPlayed}</td>
                    <td className="p-3 text-center hidden md:table-cell text-yellow-400 font-semibold">{u.bestScore?.toLocaleString() ?? "—"}</td>
                    <td className="p-3 text-center hidden md:table-cell text-green-400">{u.avgAccuracy != null ? `${u.avgAccuracy.toFixed(1)}%` : "—"}</td>
                    <td className="p-3 text-center hidden md:table-cell text-orange-400">{u.bestStreak ?? "—"}x</td>
                    <td className="p-3 text-center">
                      {u.role === "ADMIN" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                          <Crown className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">User</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {u.banned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium" title={u.banReason}>
                          <ShieldBan className="w-3 h-3" /> Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">Active</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        {/* View matches */}
                        <button
                          onClick={() => setMatchesUser(u)}
                          disabled={!!actionLoading}
                          className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400 transition-colors"
                          title="View matches"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {u.id !== user?.id && (
                          <button
                            onClick={() => handleSetRole(u, u.role === "ADMIN" ? "USER" : "ADMIN")}
                            disabled={!!actionLoading}
                            className="p-1.5 rounded hover:bg-yellow-500/20 text-yellow-400 transition-colors"
                            title={u.role === "ADMIN" ? "Demote to User" : "Promote to Admin"}
                          >
                            <Crown className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteSessions(u)}
                          disabled={!!actionLoading}
                          className="p-1.5 rounded hover:bg-orange-500/20 text-orange-400 transition-colors"
                          title="Delete all sessions"
                        >
                          <Gamepad2 className="w-4 h-4" />
                        </button>
                        {u.banned ? (
                          <button
                            onClick={() => handleUnban(u)}
                            disabled={!!actionLoading}
                            className="p-1.5 rounded hover:bg-green-500/20 text-green-400 transition-colors"
                            title="Unban"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => { setBanTarget(u); setBanReason(""); }}
                            disabled={!!actionLoading || u.id === user?.id}
                            className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-30"
                            title="Ban"
                          >
                            <ShieldBan className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(u)}
                          disabled={!!actionLoading || u.id === user?.id}
                          className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-30"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ban modal */}
      {banTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-1">Ban {banTarget.username}?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Removes all their game scores and prevents future play.
            </p>
            <input
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm mb-4"
              placeholder="Reason (optional)"
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={handleBan} disabled={!!actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium text-sm transition-colors">
                Ban User
              </button>
              <button onClick={() => setBanTarget(null)}
                className="flex-1 bg-muted hover:bg-muted/80 py-2 rounded-lg font-medium text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Matches modal */}
      {matchesUser && (
        <MatchesModal user={matchesUser} onClose={() => setMatchesUser(null)} />
      )}
    </div>
  );
}
