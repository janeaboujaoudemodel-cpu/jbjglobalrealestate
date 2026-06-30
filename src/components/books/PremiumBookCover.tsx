import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

export type BookTone = "black" | "emerald" | "navy" | "espresso" | "burgundy" | "forest";

type PremiumBookCoverProps = {
  title: string;
  /** Deprecated: numbers are no longer rendered on covers. */
  number?: number | string | null;
  /** Deprecated: subtitles are no longer rendered on covers. */
  subtitle?: string | null;
  /** Kept for API compatibility; no longer rendered as a footer band. */
  footer?: string;
  tone?: BookTone;
  className?: string;
};

const toneMap: Record<BookTone, string> = {
  black:    "from-[#10100f] via-[#171817] to-[#070706]",
  emerald:  "from-[#0c1914] via-[#13241d] to-[#070d0b]",
  navy:     "from-[#0b1420] via-[#0A0A0A] to-[#05090f]",
  espresso: "from-[#1a120c] via-[#25190f] to-[#090604]",
  burgundy: "from-[#1c0e12] via-[#28131a] to-[#090406]",
  forest:   "from-[#0a1a14] via-[#14302a] to-[#05100c]",
};

const TONE_ORDER: BookTone[] = ["black", "emerald", "navy", "espresso", "burgundy", "forest"];

/** Deterministic tone selection from a stable string (book title). */
export function pickBookTone(seed: string): BookTone {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return TONE_ORDER[h % TONE_ORDER.length];
}

function splitTitle(title: string) {
  const words = title.replace(/&/g, "&").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > 14 && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

/**
 * Premium book cover — minimal & legible.
 * Removed: skyline silhouette, JBJ medallion, double frame, bottom wordmark,
 *          eyebrow wordmark and title underlines.
 * Kept: dark gradient, single hairline frame, left spine, corner lock,
 *       and engraved readable title only.
 */
export function PremiumBookCover({
  title,
  number: _number,
  subtitle: _subtitle,
  tone,
  className,
}: PremiumBookCoverProps) {
  const lines = splitTitle(title);
  const resolvedTone: BookTone = tone ?? pickBookTone(title);

  return (
      <div
        data-surface="dark"
        data-no-contrast-guard
      className={cn("surface-dark relative h-full w-full overflow-hidden bg-[#10100f] text-[#EFE6D6]", className)}
      style={{ containerType: "inline-size" }}
    >
      {/* Base gradient */}
      <div className={cn("absolute inset-0 bg-gradient-to-br", toneMap[resolvedTone])} />

      {/* Subtle leather-grain wash (no diagonal slash lines) */}
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_22%_18%,rgba(184,149,85,.10),transparent_35%),radial-gradient(circle_at_78%_85%,rgba(0,0,0,.45),transparent_45%)]" />

      {/* Left spine */}
      <div className="absolute left-0 top-0 bottom-0 w-[7%] bg-gradient-to-r from-[#030303]/95 via-[#1A1A1A]/70 to-transparent" />
      <div className="absolute left-[7%] top-0 bottom-0 w-px bg-[#B89555]/30" />

      {/* Single hairline frame */}
      <div className="absolute inset-[7%] border border-[#B89555]/55 rounded-[2px]" />

      {/* Gold foil lock — replaces all book numbering on covers */}
      <div
        className="absolute right-[11%] top-[11%] grid place-items-center rounded-full border border-[#B89555]/70 shadow-[0_3px_12px_rgba(0,0,0,.4)]"
        style={{
          width: "clamp(22px, 14cqw, 42px)",
          height: "clamp(22px, 14cqw, 42px)",
          background: "radial-gradient(circle at 35% 30%, #fff2c4 0%, #d8b86a 45%, #8a6a25 100%)",
          boxShadow: "inset 0 0 0 1px rgba(255,244,210,.55), 0 3px 12px rgba(0,0,0,.42)",
        }}
        aria-label="Locked book"
      >
        <Lock className="relative" strokeWidth={2.5} style={{ width: "45%", height: "45%", color: "#3a2a08" }} />
      </div>

        {/* Centered content — no wordmark, no underline; title gets priority */}
        <div className="absolute inset-x-[11%] top-1/2 -translate-y-1/2 flex flex-col items-center text-center">
        <h3
            className="allow-white font-[750] uppercase tracking-[0.015em] text-[#FFF4D8] drop-shadow-[0_3px_12px_rgba(0,0,0,.72)] px-[1cqw]"
            style={{ fontSize: "clamp(12px, 10.8cqw, 50px)", lineHeight: 1.08, textWrap: "balance" }}
        >
          {lines.map((line) => (
            <span key={line} className="block">{line}</span>
          ))}
        </h3>

        {/* Subtitle intentionally removed from all covers. */}
      </div>
    </div>
  );
}
