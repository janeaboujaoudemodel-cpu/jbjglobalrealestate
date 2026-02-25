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
  const pad = size === "hero" ? "p-5" : "p-3";
  const titleSize = size === "hero" ? "text-sm" : "text-[11px]";
  const brandSize = size === "hero" ? "text-[10px]" : "text-[9px]";

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

      {/* Title & brand overlay — always shown, no icons */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60" />

      <div className={cn("absolute inset-0 flex flex-col justify-end text-center", pad)}>
        <div className="w-full">
          <p
            className={cn(
              titleSize,
              "text-white font-semibold leading-[1.1] tracking-[0.02em]",
              size === "hero" ? "max-w-[20rem] mx-auto" : ""
            )}
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.55)" }}
          >
            {book.title}
          </p>
          <div className="mt-2 h-px w-12 mx-auto bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
          <p
            className={cn(
              brandSize,
              "mt-2 text-gold uppercase tracking-[0.22em] font-semibold"
            )}
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.55)" }}
          >
            {BRAND_NAME}
          </p>
        </div>
      </div>
    </div>
  );
}
