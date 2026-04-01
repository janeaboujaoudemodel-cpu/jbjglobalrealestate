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
 * Uses a wrapper div to enforce white bg + object-contain on the img.
 * className overrides apply to the outer container only — the img
 * always renders object-contain so logos are never cropped.
 * DO NOT MODIFY without explicit Founder authorization.
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
    <div
      className={cn(
        "w-14 h-14 rounded-xl bg-white p-1.5 shrink-0 shadow-md inline-flex items-center justify-center overflow-hidden",
        className
      )}
    >
      <img
        src={src}
        alt={alt}
        loading={loading}
        onError={() => {
          setError(true);
          onError?.();
        }}
        className="block h-full w-full object-contain"
      />
    </div>
  );
}
