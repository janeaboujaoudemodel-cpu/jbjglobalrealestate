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
 * Unified developer logo — frameless, full-fit, rounded edges.
 * Standard size: w-14 h-14. No background wrapper, no padding.
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
        "w-14 h-14 rounded-2xl object-cover shrink-0 shadow-md",
        className
      )}
    />
  );
}
