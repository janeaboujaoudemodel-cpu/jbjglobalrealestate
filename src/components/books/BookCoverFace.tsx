import { cn } from "@/lib/utils";
import type { BookData } from "@/types/books";
import { PremiumBookCover, pickBookTone } from "@/components/books/PremiumBookCover";

type BookCoverFaceSize = "thumb" | "modal" | "hero";

interface BookCoverFaceProps {
  book: BookData;
  size?: BookCoverFaceSize;
  className?: string;
  /** When true, no frame/rounding assumptions; parent controls border/overflow. */
  bare?: boolean;
}

export function BookCoverFace({ book, size = "thumb", className, bare = false }: BookCoverFaceProps) {
  const subtitle =
    book.category === "faq" ? "Frequently Asked Questions" :
    book.category === "report" ? "Market Intelligence" :
    book.category === "education" ? "Education" : "Guide";

  return (
    <PremiumBookCover
      title={book.title}
      subtitle={subtitle}
      footer="JBJ GLOBAL REAL ESTATE  |  PREMIUM LIBRARY"
      tone={pickBookTone(book.title)}
      className={cn("relative w-full h-full", bare ? "" : "block", className)}
    />
  );
}
