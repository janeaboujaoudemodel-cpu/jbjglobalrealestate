import { useMemo } from "react";
import { cn } from "@/lib/utils";

/**
 * PremiumBook3D — a true 3D book: spine + front cover + back cover + page
 * edges. Idle tilt ~ -18°, hover rotates flat. Colour palette rotates per
 * book_number so the same component renders an entire shelf of distinct,
 * cohesive volumes without bespoke art per book.
 */

const PALETTES: Array<{
  spine: string;
  cover: string;
  cover2: string;
  foil: string;
  ink: string;
}> = [
  { spine: "#5b1216", cover: "#8a1c22", cover2: "#5b1216", foil: "#e8c878", ink: "#FDFBF7" }, // oxblood
  { spine: "#0b2545", cover: "#13315c", cover2: "#0b2545", foil: "#e8c878", ink: "#FDFBF7" }, // navy
  { spine: "#1f3b2c", cover: "#2f5d44", cover2: "#1f3b2c", foil: "#e8c878", ink: "#FDFBF7" }, // forest
  { spine: "#2a1a3f", cover: "#46295a", cover2: "#2a1a3f", foil: "#e8c878", ink: "#FDFBF7" }, // aubergine
  { spine: "#3a1f0f", cover: "#5b3320", cover2: "#3a1f0f", foil: "#e8c878", ink: "#FDFBF7" }, // cognac
  { spine: "#1a1a1a", cover: "#2b2b2b", cover2: "#1a1a1a", foil: "#c9a84c", ink: "#FDFBF7" }, // obsidian
  { spine: "#5a4528", cover: "#7a5e34", cover2: "#5a4528", foil: "#f0d78c", ink: "#FDFBF7" }, // bronze
  { spine: "#0e3b3a", cover: "#185856", cover2: "#0e3b3a", foil: "#e8c878", ink: "#FDFBF7" }, // teal
  { spine: "#6a1e3a", cover: "#8c2a4f", cover2: "#6a1e3a", foil: "#e8c878", ink: "#FDFBF7" }, // burgundy
];

export function pickPalette(seed: number) {
  return PALETTES[((seed % PALETTES.length) + PALETTES.length) % PALETTES.length];
}

interface PremiumBook3DProps {
  title: string;
  subtitle?: string;
  bookNumber?: number;
  paletteIndex?: number;
  className?: string;
}

/** Shared keyframes for the foil-ribbon shimmer + book hover */
const STYLES = `
@keyframes jj-book-shimmer {
  0%   { transform: translateX(-120%) skewX(-18deg); }
  100% { transform: translateX(180%)  skewX(-18deg); }
}
.jj-book-stage { perspective: 1800px; }
.jj-book {
  position: relative;
  width: 100%;
  aspect-ratio: 5 / 7;
  transform-style: preserve-3d;
  transform: rotateY(-22deg) rotateX(2deg);
  transition: transform 700ms cubic-bezier(.2,.7,.2,1);
  will-change: transform;
}
.jj-book-stage:hover .jj-book { transform: rotateY(-6deg) rotateX(1deg) translateY(-4px); }
.jj-book-face { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 4px 6px 6px 4px; overflow: hidden; }
.jj-book-spine { transform-origin: left center; transform: rotateY(90deg) translateZ(0); width: 30px; left: 0; border-radius: 4px 0 0 4px; }
.jj-book-back  { transform: translateZ(-30px); }
.jj-book-pages-top    { position:absolute; top:0; left:30px; right:0; height:8px; transform: rotateX(90deg) translateZ(4px); background: linear-gradient(90deg,#f3e7c8,#fff7e0,#f3e7c8); }
.jj-book-pages-bottom { position:absolute; bottom:0; left:30px; right:0; height:8px; transform: rotateX(-90deg) translateZ(4px); background: linear-gradient(90deg,#f3e7c8,#fff7e0,#f3e7c8); }
.jj-book-pages-right  { position:absolute; top:0; bottom:0; right:0; width:8px; transform: rotateY(90deg) translateZ(4px); background: repeating-linear-gradient(0deg,#f3e7c8 0 2px,#e9d9b0 2px 3px); }
.jj-foil-ribbon { position: relative; overflow: hidden; }
.jj-foil-ribbon::after {
  content:""; position:absolute; inset:0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.55) 50%, transparent 100%);
  animation: jj-book-shimmer 3.6s ease-in-out infinite;
  pointer-events: none;
}
`;

export function PremiumBook3DStyles() {
  return <style dangerouslySetInnerHTML={{ __html: STYLES }} />;
}

export function PremiumBook3D({ title, subtitle, bookNumber, paletteIndex, className }: PremiumBook3DProps) {
  const palette = useMemo(
    () => pickPalette(paletteIndex ?? bookNumber ?? Math.floor(Math.random() * PALETTES.length)),
    [paletteIndex, bookNumber],
  );

  return (
    <div className={cn("jj-book-stage", className)} data-no-contrast-guard>
      <div className="jj-book">
        {/* Back cover */}
        <div
          className="jj-book-face jj-book-back"
          style={{
            background: `linear-gradient(135deg, ${palette.cover} 0%, ${palette.cover2} 100%)`,
            boxShadow: "inset 0 0 40px rgba(0,0,0,.45)",
          }}
        />

        {/* Spine */}
        <div
          className="jj-book-face jj-book-spine"
          style={{
            background: `linear-gradient(180deg, ${palette.spine} 0%, ${palette.cover2} 50%, ${palette.spine} 100%)`,
            boxShadow: "inset 2px 0 6px rgba(0,0,0,.55), inset -2px 0 4px rgba(255,255,255,.05)",
          }}
        >
          <div className="absolute inset-x-1 top-2 bottom-2 border-y" style={{ borderColor: `${palette.foil}55` }} />
          <div
            className="absolute inset-0 grid place-items-center text-[8px] font-semibold tracking-[0.3em]"
            style={{ color: palette.foil, writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            JBJ · {title.length > 30 ? `${title.slice(0, 28)}…` : title}
          </div>
        </div>

        {/* Page edges */}
        <div className="jj-book-pages-top" />
        <div className="jj-book-pages-bottom" />
        <div className="jj-book-pages-right" />

        {/* Front cover */}
        <div
          className="jj-book-face"
          style={{
            background: `linear-gradient(135deg, ${palette.cover} 0%, ${palette.cover2} 100%)`,
            boxShadow:
              "inset 0 0 50px rgba(0,0,0,.35), 12px 18px 40px rgba(0,0,0,.35)",
          }}
        >
          {/* Inner double-rule frame */}
          <div
            className="absolute inset-[7%] rounded-[2px] pointer-events-none"
            style={{ border: `1px solid ${palette.foil}77` }}
          />
          <div
            className="absolute inset-[10%] rounded-[2px] pointer-events-none"
            style={{ border: `1px solid ${palette.foil}33` }}
          />

          {/* Top wordmark */}
          <div
            className="absolute top-[12%] inset-x-0 text-center text-[9px] tracking-[0.28em] font-semibold"
            style={{ color: palette.foil }}
          >
            JBJ · GLOBAL REAL ESTATE
          </div>
          <div className="absolute top-[18%] left-1/2 -translate-x-1/2 h-px w-[28%]" style={{ background: palette.foil }} />

          {/* Title */}
          <div className="absolute inset-x-[12%] top-[30%] bottom-[30%] grid place-items-center">
            <div
              className="text-center font-semibold leading-tight"
              style={{
                color: palette.ink,
                fontSize: "clamp(11px, 2vw, 18px)",
                letterSpacing: "0.02em",
                textShadow: "0 1px 0 rgba(0,0,0,.4)",
              }}
            >
              {title.toUpperCase()}
            </div>
          </div>

          {/* Subtitle */}
          {subtitle && (
            <div
              className="absolute inset-x-[14%] bottom-[18%] text-center text-[9px] italic"
              style={{ color: `${palette.foil}` }}
            >
              {subtitle}
            </div>
          )}

          {/* Foil number ribbon — top right */}
          {typeof bookNumber === "number" && (
            <div
              className="jj-foil-ribbon absolute top-[6%] right-[6%] px-2 py-[3px] rounded-sm text-[10px] font-bold tracking-widest"
              style={{
                background: `linear-gradient(135deg, ${palette.foil} 0%, #fff4d2 50%, ${palette.foil} 100%)`,
                color: "#1A1A1A",
                boxShadow: "0 1px 3px rgba(0,0,0,.35)",
              }}
            >
              N°{String(bookNumber).padStart(2, "0")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
