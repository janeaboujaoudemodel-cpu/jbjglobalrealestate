import { cn } from "@/lib/utils";

/**
 * Skeleton — champagne shimmer placeholder.
 * Compliant with the No-Gray policy: uses cream/champagne tones, never `bg-muted`.
 * The shimmer is a gold-tinted sweep so loading states feel on-brand on every surface.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-no-contrast-guard
      className={cn(
        "relative overflow-hidden rounded-md bg-[#EFE6D6]",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-[linear-gradient(90deg,transparent,rgba(184,149,85,0.18),transparent)]",
        "before:animate-[shimmer_1.6s_infinite]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
