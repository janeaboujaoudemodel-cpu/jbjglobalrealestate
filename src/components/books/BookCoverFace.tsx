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

const coverToneByCategory: Record<BookData["category"], string> = {
  guide: "from-gold/45 via-black/30 to-black/75",
  report: "from-primary/45 via-black/30 to-black/75",
  education: "from-secondary/45 via-black/30 to-black/75",
  faq: "from-accent/45 via-black/30 to-black/75",
};

export function BookCoverFace({ book, size = "thumb", className, bare = false }: BookCoverFaceProps) {
  const isGuidesLibrary = book.title.trim().toLowerCase() === "guides library";

  return (
    <div className={cn("relative w-full h-full", className)}>
      <img
        src={book.cover}
        alt={book.title}
        className={cn("w-full h-full object-cover", bare ? "" : "block", "[image-rendering:auto]")}
        loading="lazy"
        decoding="async"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/35" />

      {!isGuidesLibrary && (
        <>
          <div className={cn("absolute inset-0 bg-gradient-to-b", coverToneByCategory[book.category])} />

          <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[9px] uppercase tracking-[0.16em] text-white/85">
            <span className="rounded-full border border-gold/35 bg-black/35 px-2 py-0.5">{book.category}</span>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-2.5">
            <p className={cn("text-[9px] uppercase tracking-[0.13em] text-gold/95", size === "hero" && "text-[10px]")}>{BRAND_NAME}</p>
            <h4 className={cn("mt-1 text-white font-bold leading-tight", size === "hero" ? "text-sm" : size === "modal" ? "text-xs" : "text-[11px]")}>{book.title}</h4>
          </div>
        </>
      )}
    </div>
  );
}
