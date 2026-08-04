/**
 * ListingLabels — owner-controlled premium badges shown on property cards.
 * Distress uses an animated purple gradient (see .jj-label-shimmer in index.css).
 */
import { labelDef } from "@/lib/propertySearch";

interface Props {
  labels?: string[] | null;
  /** Cards show at most 2 so the image never gets crowded. */
  max?: number;
  size?: "sm" | "md";
  className?: string;
}

export default function ListingLabels({ labels, max = 2, size = "sm", className = "" }: Props) {
  const defs = (labels ?? []).map(labelDef).filter(Boolean).slice(0, max);
  if (!defs.length) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {defs.map((d) => (
        <span
          key={d!.slug}
          className={`inline-flex items-center rounded-full font-semibold tracking-wide uppercase whitespace-nowrap ${
            size === "sm" ? "text-[9px] px-2 py-[3px]" : "text-[11px] px-2.5 py-1"
          } ${d!.animated ? "jj-label-shimmer" : ""}`}
          style={{
            backgroundImage: d!.background,
            backgroundSize: d!.animated ? "220% 100%" : undefined,
            color: d!.color,
            boxShadow: "0 2px 10px rgba(0,0,0,0.22)",
          }}
        >
          {d!.label}
        </span>
      ))}
    </div>
  );
}
