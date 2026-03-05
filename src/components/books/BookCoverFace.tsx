import { cn } from "@/lib/utils";
import type { BookData } from "@/types/books";



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
  const skipOverlays = book.coverLocked || isGuidesLibrary;

  return (
    <div className={cn("relative w-full h-full", className)}>
      <img
        src={book.cover}
        alt={book.title}
        className={cn("w-full h-full object-cover", bare ? "" : "block", "[image-rendering:auto]")}
        loading="lazy"
        decoding="async"
      />

      {!skipOverlays && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/35" />
          <div className={cn("absolute inset-0 bg-gradient-to-b", coverToneByCategory[book.category])} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

          <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/45 via-black/20 to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/20 to-transparent" />

          <div className={cn(
            "absolute right-2 top-2 h-1 rounded-full bg-gradient-to-r from-transparent via-gold/70 to-transparent",
            size === "hero" ? "w-24" : size === "modal" ? "w-16" : "w-14"
          )} />
        </>
      )}
    </div>
  );
}
