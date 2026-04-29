import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getHighResImageUrl } from "@/lib/imageUtils";
import { cn } from "@/lib/utils";

/**
 * UserAvatarPremium — single source of truth for the signed-in user's photo.
 *
 * - Pulls photo from `crm_users_profile.photo_url` → `user_metadata.avatar_url` → `picture`.
 * - Upgrades CDN/Google thumbnails through `getHighResImageUrl` for crisp rendering.
 * - Centered, cover-cropped face — never stretched or pixelated.
 * - Premium gold ring (no gray circle) with a soft gold glow.
 * - Champagne fallback with bold black initials when no photo is available.
 */

type Size = "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<Size, number> = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

const TEXT_SIZE: Record<Size, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-xl",
  xl: "text-3xl",
};

interface UserAvatarPremiumProps {
  size?: Size;
  className?: string;
  /** Override the display name for initials fallback */
  nameOverride?: string;
  /** Override the photo URL (skips DB fetch when provided) */
  photoOverride?: string | null;
}

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("") || "U";

export function UserAvatarPremium({
  size = "md",
  className,
  nameOverride,
  photoOverride,
}: UserAvatarPremiumProps) {
  const { user } = useAuth();
  const px = SIZE_PX[size];

  const { data: crmProfile } = useQuery({
    queryKey: ["crm-profile-avatar", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("crm_users_profile")
        .select("display_name, photo_url")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id && photoOverride === undefined,
    staleTime: 5 * 60 * 1000,
  });

  const userMeta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const displayName =
    nameOverride ||
    (crmProfile as any)?.display_name ||
    (typeof userMeta.full_name === "string" ? (userMeta.full_name as string) : null) ||
    (typeof userMeta.name === "string" ? (userMeta.name as string) : null) ||
    user?.email?.split("@")[0] ||
    "User";

  const rawPhoto =
    photoOverride !== undefined
      ? photoOverride
      : (crmProfile as any)?.photo_url ||
        (typeof userMeta.avatar_url === "string" ? (userMeta.avatar_url as string) : null) ||
        (typeof userMeta.picture === "string" ? (userMeta.picture as string) : null) ||
        null;

  // Upgrade CDN thumbs to full-res; Google avatars: bump =sNN to =s512-c
  const photo = React.useMemo(() => {
    if (!rawPhoto) return null;
    let url = rawPhoto;
    if (/googleusercontent\.com/i.test(url)) {
      url = url.replace(/=s\d+(-c)?$/i, "=s512-c");
      if (!/=s\d+/i.test(url)) url = `${url}${url.includes("?") ? "&" : "="}s512-c`;
    }
    return getHighResImageUrl(url, "512x512");
  }, [rawPhoto]);

  const [imgFailed, setImgFailed] = React.useState(false);
  React.useEffect(() => {
    setImgFailed(false);
  }, [photo]);

  const showImage = !!photo && !imgFailed;

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center rounded-full select-none shrink-0",
        "bg-gradient-to-br from-[hsl(var(--gold))] via-[hsl(var(--gold))] to-[hsl(var(--gold-dark))]",
        "shadow-[0_0_0_1px_rgba(217,194,146,0.55),0_8px_24px_-8px_rgba(217,194,146,0.55)]",
        className
      )}
      style={{ width: px, height: px, padding: 2 }}
      aria-label={displayName}
    >
      <span
        className="relative w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center"
      >
        {showImage ? (
          <img
            src={photo!}
            alt={displayName}
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
            draggable={false}
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover object-center"
            style={{ imageRendering: "auto" }}
          />
        ) : (
          <span
            className={cn(
              "w-full h-full flex items-center justify-center font-bold tracking-tight",
              "bg-gradient-to-br from-[#F7F1E6] to-[#D8C7A6] text-black",
              TEXT_SIZE[size]
            )}
            style={{ color: "#111" }}
          >
            {getInitials(displayName)}
          </span>
        )}
      </span>
    </span>
  );
}

export default UserAvatarPremium;
