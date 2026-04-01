import { useState } from "react";
import { cn } from "@/lib/utils";

interface DeveloperLogoProps {
  src?: string | null;
  alt?: string;
  className?: string;
  loading?: "eager" | "lazy";
  onError?: () => void;
}

/**
 * LOCKED — Unified developer logo component.
 * Style: w-14 h-14, rounded-xl, object-contain, p-1.5, bg-white, shadow-md.
 * DO NOT MODIFY without explicit Founder authorization.
 * See DEVELOPER_LOGO_LOCK in src/config/master-lock.ts.
 */
export function DeveloperLogo({
  src,
  alt = "Developer",
  className,
  loading = "lazy",
  onError,
}: DeveloperLogoProps) {
  const [error, setError] = useState(false);

  if (!src || error) return null;

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      onError={() => {
        setError(true);
        onError?.();
      }}
      className={cn(
        "w-14 h-14 rounded-xl object-contain p-1.5 bg-white shrink-0 shadow-md",
        className
      )}
    />
  );
}
