import { cn } from "@/lib/utils";

type PremiumBookCoverProps = {
  title: string;
  number?: number | string | null;
  subtitle?: string | null;
  footer?: string;
  tone?: "black" | "emerald" | "navy" | "espresso" | "burgundy";
  className?: string;
};

const toneMap: Record<NonNullable<PremiumBookCoverProps["tone"]>, string> = {
  black: "from-[#10100f] via-[#171817] to-[#070706]",
  emerald: "from-[#0c1914] via-[#13241d] to-[#070d0b]",
  navy: "from-[#0b1420] via-[#102540] to-[#05090f]",
  espresso: "from-[#1a120c] via-[#25190f] to-[#090604]",
  burgundy: "from-[#1c0e12] via-[#28131a] to-[#090406]",
};

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
  tone = "black",
  className,
}: PremiumBookCoverProps) {
  const lines = splitTitle(title);

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-[#10100f] text-[#EFE6D6]", className)}>
      <div className={cn("absolute inset-0 bg-gradient-to-br", toneMap[tone])} />
      <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_18%_22%,rgba(184,149,85,.16),transparent_20%),radial-gradient(circle_at_76%_10%,rgba(239,230,214,.09),transparent_18%),linear-gradient(124deg,transparent_0_24%,rgba(184,149,85,.2)_25%,transparent_27%_48%,rgba(239,230,214,.12)_49%,transparent_51%_100%)]" />
      <div className="absolute left-0 top-0 bottom-0 w-[8%] bg-gradient-to-r from-[#030303]/95 via-[#1A1A1A]/85 to-transparent" />
      <div className="absolute left-[7%] top-0 bottom-0 w-px bg-[#B89555]/35" />
      <div className="absolute inset-[7%] border border-[#B89555]/80" />
      <div className="absolute inset-[8.2%] border border-[#B89555]/45" />

      {number !== null && number !== undefined && (
        <div className="absolute right-[12%] top-[10%] rounded-[2px] border border-[#B89555]/80 bg-[#EFE6D6] px-3 py-1 shadow-[0_4px_18px_rgba(0,0,0,.35)]">
          <span className="text-[clamp(10px,1.7vw,18px)] font-bold text-[#1A1A1A]">No. {number}</span>
        </div>
      )}

      <div className="absolute inset-x-[13%] top-[29%] flex flex-col items-center text-center">
        <div className="mb-[7%] grid h-[clamp(38px,8vw,74px)] w-[clamp(38px,8vw,74px)] place-items-center rounded-full border border-[#B89555]/60 text-[#B89555] shadow-[0_0_22px_rgba(184,149,85,.22)]">
          <span className="text-[clamp(16px,3vw,32px)] font-semibold tracking-[-0.02em]">JBJ</span>
        </div>
        <h3 className="text-[clamp(24px,4.7vw,58px)] font-bold uppercase leading-[1.08] tracking-[0.02em] text-[#EFE6D6] drop-shadow-[0_2px_12px_rgba(0,0,0,.6)]">
          {lines.map((line) => <span key={line} className="block">{line}</span>)}
        </h3>
        <div className="mt-[5%] h-px w-[64%] bg-[#B89555]" />
        {subtitle && <p className="mt-[3%] text-[clamp(13px,2vw,26px)] font-semibold italic text-[#EFE6D6]/90">{subtitle}</p>}
      </div>

      {/* Skyline — Burj Khalifa & downtown silhouette, clearly visible (no fade) */}
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
        {/* Burj Khalifa spire */}
        <span
          className="absolute bottom-[96%] w-[0.5%] bg-[#EFE6D6]/75"
          style={{ left: "49.7%", height: "9%" }}
        />
      </div>

      <div className="absolute inset-x-[12%] bottom-[6%] truncate text-center text-[clamp(8px,1.2vw,15px)] font-semibold uppercase tracking-[0.28em] text-[#B89555]">
        {footer}
      </div>
      {/* Subtle top sheen ONLY — do not fade the bottom */}
      <div className="absolute inset-x-0 top-0 h-[35%] bg-gradient-to-b from-[#FDFBF7]/[0.05] to-transparent pointer-events-none" />
    </div>
  );
}