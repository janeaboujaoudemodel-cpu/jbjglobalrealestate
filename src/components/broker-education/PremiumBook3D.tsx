import { useMemo } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";


/**
 * PremiumBook3D — true 3D book: spine + front + back + page edges.
 * Two presentation modes:
 *   - `compact` (homepage marquee): clean cover, ONLY the engraved title;
 *     no wordmark, no underline, no subtitle, no number tag.
 *   - default (library / detail): adds ONLY a small classic foil corner lock.
 *     No subtitles, no labels, no numbers, no brand wordmark.
 */

const PALETTES: Array<{
  spine: string;
  cover: string;
  cover2: string;
  foil: string;
  ink: string;
}> = [
  // Refined premium leather palette — deeper, more editorial.
  { spine: "#3a0d10", cover: "#5e151a", cover2: "#3a0d10", foil: "#d8b86a", ink: "#F4E9CC" }, // oxblood
  { spine: "#071a33", cover: "#0e2848", cover2: "#071a33", foil: "#d8b86a", ink: "#F4E9CC" }, // midnight navy
  { spine: "#142a1f", cover: "#1f4030", cover2: "#142a1f", foil: "#d8b86a", ink: "#F4E9CC" }, // forest
  { spine: "#1c1330", cover: "#2c1d4a", cover2: "#1c1330", foil: "#d8b86a", ink: "#F4E9CC" }, // aubergine
  { spine: "#2a1408", cover: "#4B2713", cover2: "#2a1408", foil: "#d8b86a", ink: "#F4E9CC" }, // cognac
  { spine: "#0d0d0d", cover: "#1a1a1a", cover2: "#0d0d0d", foil: "#c9a84c", ink: "#F4E9CC" }, // obsidian
  { spine: "#0a2a2a", cover: "#103f3d", cover2: "#0a2a2a", foil: "#d8b86a", ink: "#F4E9CC" }, // teal
  { spine: "#481228", cover: "#681c39", cover2: "#481228", foil: "#d8b86a", ink: "#F4E9CC" }, // burgundy
];

export function pickPalette(seed: number) {
  return PALETTES[((seed % PALETTES.length) + PALETTES.length) % PALETTES.length];
}

interface PremiumBook3DProps {
  title: string;
  /** Deprecated: subtitles are never rendered on covers. */
  subtitle?: string;
  paletteIndex?: number;
  className?: string;
  /** When true, render the clean homepage variant (title only). */
  compact?: boolean;
}

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
/* LOCK: book cover titles are ALWAYS pure white. No global contrast guard
   may flip these to ink — the cover background is deep leather. */
.jj-book-title, .jj-book-title * {
  color: #FFFFFF !important;
  -webkit-text-fill-color: #FFFFFF !important;
}
`;

function splitCoverTitle(title: string) {
  const words = title.split(/\s+/).filter(Boolean);
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
  return lines.slice(0, 5);
}

export function PremiumBook3DStyles() {
  return <style dangerouslySetInnerHTML={{ __html: STYLES }} />;
}

export function PremiumBook3D({
  title,
  paletteIndex,
  className,
  compact = false,
}: PremiumBook3DProps) {
  const palette = useMemo(
    () => pickPalette(paletteIndex ?? 0),
    [paletteIndex],
  );
  const titleLines = useMemo(() => splitCoverTitle(title), [title]);
  const titleSize = titleLines.length >= 4
    ? "clamp(16px, 7.2cqw, 30px)"
    : compact
      ? "clamp(17px, 8.2cqw, 34px)"
      : "clamp(18px, 8.8cqw, 38px)";

  return (
    <div className={cn("jj-book-stage", className)} data-no-contrast-guard style={{ containerType: "inline-size" }}>
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
            {title.length > 30 ? `${title.slice(0, 28)}…` : title}
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
              "inset 0 0 60px rgba(0,0,0,.45), 14px 22px 50px rgba(0,0,0,.4)",
          }}
        >
          {/* Subtle single inner frame (kept on both variants — defines the book) */}
          <div
            className="absolute inset-[8%] rounded-[2px] pointer-events-none"
            style={{ border: `1px solid ${palette.foil}44` }}
          />

          {/* Title — slimmer, balanced, premium. Subtitle/label removed
              site-wide; title is the only typography on the cover. */}
          <div
            className={cn(
              "absolute inset-x-[14%] grid place-items-center",
              compact ? "top-[18%] bottom-[18%]" : "top-[20%] bottom-[22%]"
            )}
          >
            <div
              data-no-contrast-guard
              data-jbj-white-glyph
              className="jj-book-title allow-white text-center leading-[1.12]"
              style={{
                color: '#FFFFFF',
                WebkitTextFillColor: '#FFFFFF',
                fontSize: titleSize,
                fontWeight: 850,
                letterSpacing: "0.002em",
                fontFamily: "Inter, system-ui, sans-serif",
                textShadow: "0 2px 0 rgba(0,0,0,.85), 0 3px 14px rgba(0,0,0,.7), 0 0 22px rgba(0,0,0,.45)",
                textWrap: "balance",
              }}
            >
              {titleLines.map((line) => (
                <span key={line} className="block" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{line}</span>
              ))}
            </div>
          </div>

          {/* Foil corner lock badge — ONLY non-compact */}
          {!compact && (
            <div
              className="absolute top-[6%] right-[6%] w-[28px] h-[28px] rounded-full flex items-center justify-center"
              style={{
                background: `radial-gradient(circle at 35% 30%, #fff2c4 0%, ${palette.foil} 45%, #8a6a25 100%)`,
                boxShadow:
                  "inset 0 0 0 1px rgba(255,244,210,.55), 0 2px 4px rgba(0,0,0,.45)",
              }}
              aria-label="Restricted access"
            >
              <Lock size={12} strokeWidth={2.5} style={{ color: "#3a2a08" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

