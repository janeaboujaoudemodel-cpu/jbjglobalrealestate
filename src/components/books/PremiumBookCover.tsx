import { cn } from "@/lib/utils";

export type BookTone = "black" | "emerald" | "navy" | "espresso" | "burgundy" | "forest";

type PremiumBookCoverProps = {
  title: string;
  number?: number | string | null;
  subtitle?: string | null;
  footer?: string;
  tone?: BookTone;
  className?: string;
};

const toneMap: Record<BookTone, string> = {
  black:    "from-[#10100f] via-[#171817] to-[#070706]",
  emerald:  "from-[#0c1914] via-[#13241d] to-[#070d0b]",
  navy:     "from-[#0b1420] via-[#102540] to-[#05090f]",
  espresso: "from-[#1a120c] via-[#25190f] to-[#090604]",
  burgundy: "from-[#1c0e12] via-[#28131a] to-[#090406]",
  forest:   "from-[#0a1a14] via-[#14302a] to-[#05100c]",
};

const TONE_ORDER: BookTone[] = ["black", "emerald", "navy", "espresso", "burgundy", "forest"];

/**
 * Deterministic tone selection from a stable string (book title).
 * Same title → same tone everywhere, always.
 */
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
    if (next.length > 15 && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

export function PremiumBookCover({
  title,
  number,
  subtitle,
  footer = "JBJ GLOBAL REAL ESTATE  |  BROKER LEARNING LIBRARY",
  tone,
  className,
}: PremiumBookCoverProps) {
  const lines = splitTitle(title);
  const resolvedTone: BookTone = tone ?? pickBookTone(title);

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden bg-[#10100f] text-[#EFE6D6]", className)}
      style={{ containerType: "inline-size" }}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br", toneMap[resolvedTone])} />
      <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_18%_22%,rgba(184,149,85,.16),transparent_20%),radial-gradient(circle_at_76%_10%,rgba(239,230,214,.09),transparent_18%),linear-gradient(124deg,transparent_0_24%,rgba(184,149,85,.2)_25%,transparent_27%_48%,rgba(239,230,214,.12)_49%,transparent_51%_100%)]" />
      <div className="absolute left-0 top-0 bottom-0 w-[8%] bg-gradient-to-r from-[#030303]/95 via-[#1A1A1A]/85 to-transparent" />
      <div className="absolute left-[7%] top-0 bottom-0 w-px bg-[#B89555]/35" />
      <div className="absolute inset-[7%] border border-[#B89555]/80" />
      <div className="absolute inset-[8.2%] border border-[#B89555]/45" />

      {number !== null && number !== undefined && (
        <div className="absolute right-[12%] top-[10%] rounded-[2px] border border-[#B89555]/80 bg-[#EFE6D6] px-[6cqw] py-[1.5cqw] shadow-[0_4px_18px_rgba(0,0,0,.35)]">
          <span className="font-bold text-[#1A1A1A]" style={{ fontSize: "clamp(8px, 5.5cqw, 18px)" }}>No. {number}</span>
        </div>
      )}

      <div className="absolute inset-x-[13%] top-[26%] flex flex-col items-center text-center">
        <div
          className="mb-[5%] grid place-items-center rounded-full border border-[#B89555]/60 text-[#B89555] shadow-[0_0_22px_rgba(184,149,85,.22)]"
          style={{ width: "22cqw", height: "22cqw", minWidth: 28, minHeight: 28, maxWidth: 74, maxHeight: 74 }}
        >
          <span className="font-semibold tracking-[-0.02em]" style={{ fontSize: "clamp(10px, 9cqw, 32px)" }}>JBJ</span>
        </div>
        <h3
          className="font-bold uppercase leading-[1.05] tracking-[0.02em] text-[#EFE6D6] drop-shadow-[0_2px_12px_rgba(0,0,0,.6)] px-[2cqw]"
          style={{ fontSize: "clamp(9px, 11cqw, 56px)" }}
        >
          {lines.map((line) => <span key={line} className="block">{line}</span>)}
        </h3>
        <div className="mt-[4%] h-px w-[64%] bg-[#B89555]" />
        {subtitle && (
          <p
            className="mt-[3%] font-semibold italic text-[#EFE6D6]/90 px-[3cqw]"
            style={{ fontSize: "clamp(7px, 5cqw, 24px)" }}
          >
            {subtitle}
          </p>
        )}
      </div>


      {/* Skyline — Burj Khalifa & downtown silhouette */}
      <div className="absolute inset-x-[10%] bottom-[12%] h-[22%]">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-[#B89555]/55" />
        {Array.from({ length: 20 }).map((_, i) => {
          const distFromCenter = Math.abs(i - 9.5);
          const isBurj = distFromCenter < 1;
          const h = isBurj ? 96 : Math.max(28, 70 - distFromCenter * 7 + ((i * 13) % 22));
          return (
            <span
              key={i}
              className="absolute bottom-0 w-[2.6%] border-t border-x border-[#B89555]/55 bg-[#EFE6D6]/22 shadow-[0_0_10px_rgba(184,149,85,0.18)]"
              style={{ left: `${i * 5}%`, height: `${h}%` }}
            />
          );
        })}
        <span
          className="absolute bottom-[96%] w-[0.5%] bg-[#EFE6D6]/75"
          style={{ left: "49.7%", height: "9%" }}
        />
      </div>

      <div
        className="absolute inset-x-[12%] bottom-[6%] truncate text-center font-semibold uppercase tracking-[0.24em] text-[#B89555]"
        style={{ fontSize: "clamp(6px, 3cqw, 14px)" }}
      >
        {footer}
      </div>
      {/* Top sheen removed — was creating a visible white cut band across the cover */}
    </div>
  );
}
