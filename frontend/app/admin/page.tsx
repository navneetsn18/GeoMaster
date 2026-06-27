"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, type AdminStats, type AdminUser } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import {
  Users, Trophy, Clock, Activity, ShieldBan, ShieldCheck,
  Trash2, Gamepad2, BarChart3, AlertTriangle
} from "lucide-react";
import { getAvatarUrl } from "@/lib/avatar";

const ADMIN_EMAIL = "navneetsn18@gmail.com";

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

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!user) return;
    if (!isAdmin) {
      router.push("/dashboard");
      return;
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]);

  async function load() {
    try {
      const [s, u] = await Promise.all([adminApi.getStats(), adminApi.getUsers()]);
      setStats(s);
      setUsers(u);
    } catch {
      setError("Failed to load admin data");
    } finally {
      setLoading(false);
    }
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
      setBanTarget(null);
      setBanReason("");
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
        <ShieldCheck className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
          <button className="ml-2 underline" onClick={() => setError("")}>dismiss</button>
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
            { label: "Banned", value: stats.bannedUsers, icon: ShieldBan },
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
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-center p-3 font-medium">Games</th>
                  <th className="text-center p-3 font-medium hidden md:table-cell">Best Score</th>
                  <th className="text-center p-3 font-medium hidden md:table-cell">Accuracy</th>
                  <th className="text-center p-3 font-medium hidden md:table-cell">Streak</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className={`border-b border-border/50 hover:bg-muted/20 ${u.banned ? "opacity-60" : ""}`}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={getAvatarUrl(u.id, u.avatarUrl)}
                          alt=""
                          className="w-7 h-7 rounded-full bg-muted object-cover"
                        />
                        <span className="font-medium">{u.username}</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{u.email}</td>
                    <td className="p-3 text-center">{u.gamesPlayed}</td>
                    <td className="p-3 text-center hidden md:table-cell text-yellow-400 font-semibold">{u.bestScore?.toLocaleString() ?? "—"}</td>
                    <td className="p-3 text-center hidden md:table-cell text-green-400">{u.avgAccuracy != null ? `${u.avgAccuracy.toFixed(1)}%` : "—"}</td>
                    <td className="p-3 text-center hidden md:table-cell text-orange-400">{u.bestStreak ?? "—"}x</td>
                    <td className="p-3 text-center">
                      {u.banned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium" title={u.banReason}>
                          <ShieldBan className="w-3 h-3" /> Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleDeleteSessions(u)}
                          disabled={!!actionLoading}
                          className="p-1.5 rounded hover:bg-orange-500/20 text-orange-400 transition-colors"
                          title="Delete sessions"
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
                            disabled={!!actionLoading || u.email === ADMIN_EMAIL}
                            className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-30"
                            title="Ban"
                          >
                            <ShieldBan className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(u)}
                          disabled={!!actionLoading || u.email === ADMIN_EMAIL}
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
              <button
                onClick={handleBan}
                disabled={!!actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium text-sm transition-colors"
              >
                Ban User
              </button>
              <button
                onClick={() => setBanTarget(null)}
                className="flex-1 bg-muted hover:bg-muted/80 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
