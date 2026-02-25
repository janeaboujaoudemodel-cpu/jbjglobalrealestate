import { cn } from "@/lib/utils";
import type { BookData } from "@/types/books";

const BRAND_NAME = "JBJ Global Real Estate";

type BookCoverFaceSize = "thumb" | "modal" | "hero";

interface BookCoverFaceProps {
  book: BookData;
  size?: BookCoverFaceSize;
  className?: string;
  /** When true, no frame/rounding assumptions; parent controls border/overflow. */
  bare?: boolean;
}

export function BookCoverFace({ book, size = "thumb", className, bare = false }: BookCoverFaceProps) {

  return (
    <div className={cn("relative w-full h-full", className)}>
      <img
        src={book.cover}
        alt={book.title}
        className={cn(
          "w-full h-full object-cover",
          bare ? "" : "block",
          "[image-rendering:auto]"
        )}
        loading="lazy"
        decoding="async"
      />

      {/* Subtle gradient only — NO title/brand text overlay to avoid duplication with parent containers */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/30" />
    </div>
  );
}
