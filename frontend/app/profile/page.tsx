"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Trophy,
  Target,
  Flame,
  Gamepad2,
  UserPlus,
  Loader2,
  Camera,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/stats-card";
import { userApi, updateProfile } from "@/lib/api";
import { getStoredUser, getToken, storeUser } from "@/lib/auth";
import { getAvatarUrl } from "@/lib/avatar";
import { formatScore, formatAccuracy } from "@/lib/utils";
import type { UserStats, GameModeStats, Following, User } from "@/types";

const MODE_LABELS: Record<string, string> = {
  WORLD: "🌍 World",
  AFRICA: "🌍 Africa",
  ASIA: "🌏 Asia",
  EUROPE: "🌍 Europe",
  AMERICAS: "🌎 Americas",
  OCEANIA: "🌏 Oceania",
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [stats, setStats] = useState<UserStats | null>(null);
  const [modeStats, setModeStats] = useState<GameModeStats[]>([]);
  const [following, setFollowing] = useState<Following[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followUsername, setFollowUsername] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editField, setEditField] = useState<"username" | "email" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [adminContacts, setAdminContacts] = useState<import("@/types").AdminContact[]>([]);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    Promise.allSettled([
      userApi.getProfile(),
      userApi.getModeStats(),
      userApi.getFollowing(),
    ]).then(([profileRes, modeRes, followingRes]) => {
      if (profileRes.status === "fulfilled") {
        const profile = profileRes.value;
        setStats(profile.stats);
        const stored = getStoredUser();
        if (stored) {
          const updated = { ...stored, avatarUrl: profile.avatarUrl, banned: (profile as User & { banned?: boolean }).banned };
          storeUser(updated);
          setUser(updated);
        }
        if ((profile as User & { banned?: boolean }).banned) {
          userApi.getAdminContacts().then(setAdminContacts).catch(() => {});
        }
      }
      if (modeRes.status === "fulfilled") setModeStats(modeRes.value);
      if (followingRes.status === "fulfilled") setFollowing(followingRes.value);
      setIsLoading(false);
    });
  }, [router]);

  const handleFollow = async () => {
    if (!followUsername.trim()) return;
    setIsFollowing(true);
    try {
      await userApi.follow(followUsername.trim());
      toast.success(`Now following ${followUsername}!`);
      setFollowUsername("");
      const updated = await userApi.getFollowing();
      setFollowing(updated);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Could not follow. Check the username.");
    } finally {
      setIsFollowing(false);
    }
  };

  const handleUnfollow = async (username: string) => {
    try {
      await userApi.unfollow(username);
      setFollowing((prev) => prev.filter((f) => f.username !== username));
      toast.success(`Unfollowed ${username}`);
    } catch {
      toast.error("Could not unfollow.");
    }
  };

  const startEdit = (field: "username" | "email") => {
    setEditField(field);
    setEditValue(field === "username" ? (user?.username ?? "") : (user?.email ?? ""));
  };

  const cancelEdit = () => { setEditField(null); setEditValue(""); };

  const saveEdit = async () => {
    if (!editField || !editValue.trim()) return;
    setIsSavingEdit(true);
    try {
      const body = editField === "username" ? { username: editValue.trim() } : { email: editValue.trim() };
      await updateProfile(body);
      const stored = getStoredUser();
      if (stored) {
        const updated = { ...stored, ...body };
        storeUser(updated);
        setUser(updated);
      }
      toast.success(`${editField === "username" ? "Username" : "Email"} updated!`);
      setEditField(null);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Update failed");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const { avatarUrl } = await userApi.uploadAvatar(file);
      const stored = getStoredUser();
      if (stored) {
        const updated = { ...stored, avatarUrl };
        storeUser(updated);
        setUser(updated);
      }
      toast.success("Avatar updated!");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!user) return null;

  const avatarSrc = getAvatarUrl(user.id, user.avatarUrl);

  const statCards = [
    { label: "Total Games", value: stats?.totalGames ?? "—", icon: Gamepad2, iconColor: "text-blue-400", delay: 0 },
    { label: "Avg Accuracy", value: stats ? formatAccuracy(stats.avgAccuracy) : "—", icon: Target, iconColor: "text-green-400", delay: 0.05 },
    { label: "Best Score", value: stats ? formatScore(stats.bestScore) : "—", icon: Trophy, iconColor: "text-yellow-400", delay: 0.1 },
    { label: "Best Streak", value: stats?.bestStreak ?? "—", icon: Flame, iconColor: "text-orange-400", delay: 0.15 },
  ];

  return (
    <div className="container py-8 max-w-5xl space-y-8">
      {/* Ban banner */}
      {user.banned && (
        <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">🚫</span>
            <div>
              <p className="font-bold text-red-400 text-base">Your account has been suspended</p>
              <p className="text-sm text-red-300/80 mt-0.5">
                You can browse GeoMaster but cannot start new games. To appeal your ban, contact an admin directly.
              </p>
            </div>
          </div>
          {adminContacts.length > 0 && (
            <div className="border-t border-red-500/20 pt-3">
              <p className="text-xs text-red-400/70 uppercase tracking-wide font-medium mb-2">Admin contacts</p>
              <div className="flex flex-wrap gap-2">
                {adminContacts.map((a) => (
                  <a
                    key={a.email}
                    href={`mailto:${a.email}?subject=Account%20Ban%20Appeal%20-%20${encodeURIComponent(user.username)}&body=Hello%20${encodeURIComponent(a.username)}%2C%0A%0AI%20would%20like%20to%20appeal%20my%20account%20suspension%20for%20username%3A%20${encodeURIComponent(user.username)}.%0A%0A`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/40 border border-red-500/30 text-sm hover:bg-red-900/60 transition-colors"
                  >
                    <span className="text-red-300 font-medium">@{a.username}</span>
                    <span className="text-red-400/60">·</span>
                    <span className="text-red-400/80 text-xs">{a.email}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-center gap-4 sm:gap-5"
      >
        {/* Avatar with upload overlay */}
        <div className="relative group shrink-0">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted shadow-lg ring-2 ring-primary/20">
            <img
              src={avatarSrc}
              alt={user.username}
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            title="Change avatar"
          >
            {isUploadingAvatar ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        <div className="space-y-1">
          {/* Username */}
          {editField === "username" ? (
            <div className="flex items-center gap-2">
              <Input
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                className="h-8 text-base sm:text-lg font-bold w-full max-w-[200px]"
                autoFocus
              />
              <button onClick={saveEdit} disabled={isSavingEdit} className="text-green-400 hover:text-green-300">
                {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold">{user.username}</h1>
              {user.banned && (
                <span className="text-xs font-bold uppercase tracking-wide bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                  Banned
                </span>
              )}
              {!user.banned && (
                <button onClick={() => startEdit("username")} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Email */}
          {editField === "email" ? (
            <div className="flex items-center gap-2">
              <Input
                type="email"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                className="h-7 text-sm w-full max-w-[220px]"
                autoFocus
              />
              <button onClick={saveEdit} disabled={isSavingEdit} className="text-green-400 hover:text-green-300">
                {isSavingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              </button>
              <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 group">
              <p className="text-muted-foreground">{user.email}</p>
              <button onClick={() => startEdit("email")} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          )}

          <Badge variant="secondary" className="mt-1.5">
            Geography Explorer
          </Badge>
          <p className="text-xs text-muted-foreground mt-1">
            Tap username/email to edit · Tap avatar to change photo
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Overall Stats</h2>
        {isLoading ? (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading stats…
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((s) => (
              <StatsCard key={s.label} {...s} />
            ))}
          </div>
        )}
      </div>

      {/* Mode breakdown */}
      {modeStats.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Stats by Game Mode</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modeStats.map((ms) => (
              <Card key={ms.mapType} className="hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {MODE_LABELS[ms.mapType] ?? ms.mapType}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Games played</span>
                    <span className="font-medium">{ms.gamesPlayed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Best score</span>
                    <span className="font-medium text-primary">{formatScore(ms.bestScore)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg accuracy</span>
                    <span className="font-medium text-green-400">{formatAccuracy(ms.avgAccuracy)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Best streak</span>
                    <span className="font-medium text-orange-400">{ms.bestStreak}x</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Following */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Following
        </h2>

        <div className="flex gap-2 mb-4 max-w-sm">
          <Input
            placeholder="Enter username to follow"
            value={followUsername}
            onChange={(e) => setFollowUsername(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleFollow(); }}
          />
          <Button
            onClick={handleFollow}
            disabled={isFollowing || !followUsername.trim()}
            size="icon"
          >
            {isFollowing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
          </Button>
        </div>

        {following.length === 0 ? (
          <p className="text-muted-foreground text-sm">Not following anyone yet — search a username above!</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {following.map((person) => (
              <Card key={person.id} className={`transition-colors ${person.banned ? "border-red-500/40 bg-red-950/10" : "hover:border-primary/40"}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full overflow-hidden shrink-0 ${person.banned ? "opacity-40 grayscale" : ""}`}>
                      <img
                        src={getAvatarUrl(person.id, person.avatarUrl)}
                        alt={person.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className={`font-semibold truncate ${person.banned ? "line-through text-muted-foreground" : ""}`}>{person.username}</p>
                        {person.banned && (
                          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded">
                            Banned
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-destructive shrink-0 px-2"
                      onClick={() => handleUnfollow(person.username)}
                    >
                      Unfollow
                    </Button>
                  </div>
                  {person.banned ? (
                    <p className="text-xs text-red-400/70 italic">Account suspended by admin.</p>
                  ) : (
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div className="bg-muted/50 rounded px-2 py-1">
                      <p className="text-muted-foreground">Games</p>
                      <p className="font-semibold">{person.totalGames ?? "—"}</p>
                    </div>
                    <div className="bg-muted/50 rounded px-2 py-1">
                      <p className="text-muted-foreground">Best Score</p>
                      <p className="font-semibold text-yellow-400">{person.bestScore ? person.bestScore.toLocaleString() : "—"}</p>
                    </div>
                    <div className="bg-muted/50 rounded px-2 py-1">
                      <p className="text-muted-foreground">Accuracy</p>
                      <p className="font-semibold text-green-400">{person.avgAccuracy != null ? `${person.avgAccuracy.toFixed(1)}%` : "—"}</p>
                    </div>
                    <div className="bg-muted/50 rounded px-2 py-1">
                      <p className="text-muted-foreground">Best Streak</p>
                      <p className="font-semibold text-orange-400">{person.bestStreak ?? "—"}x</p>
                    </div>
                  </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
