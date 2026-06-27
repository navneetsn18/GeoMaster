const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api").replace(/\/api$/, "");

/**
 * Returns a quirky DiceBear robot avatar seeded by userId,
 * or the user's custom uploaded avatar if set.
 */
export function getAvatarUrl(userId: string, avatarUrl?: string | null): string {
  if (avatarUrl) {
    return avatarUrl.startsWith("http") ? avatarUrl : `${API_ORIGIN}${avatarUrl}`;
  }
  // bottts = unique robot avatar per user — quirky, colorful, SVG
  return `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(userId)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}
