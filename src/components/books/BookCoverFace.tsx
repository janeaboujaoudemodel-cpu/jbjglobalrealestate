import { cn } from "@/lib/utils";
import type { BookData } from "@/types/books";
import { PremiumBook3D, PremiumBook3DStyles } from "@/components/broker-education/PremiumBook3D";

type BookCoverFaceSize = "thumb" | "modal" | "hero";

interface BookCoverFaceProps {
  book: BookData;
  size?: BookCoverFaceSize;
  className?: string;
  /** When true, no frame/rounding assumptions; parent controls border/overflow. */
  bare?: boolean;
  /** Homepage marquee variant — clean cover, title only (no number/wordmark/subtitle). */
  compact?: boolean;
}

/** Stable deterministic seed from title so each book keeps its color. */
function stableSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function BookCoverFace({ book, className, bare = false, compact = false }: BookCoverFaceProps) {
  const seed = stableSeed(book.title);

  return (
    <div className={cn("relative w-full h-full", bare ? "" : "block", className)}>
      <PremiumBook3DStyles />
      <PremiumBook3D
        title={book.title}
        paletteIndex={seed}
        compact={compact}
      />
    </div>
  );
}
