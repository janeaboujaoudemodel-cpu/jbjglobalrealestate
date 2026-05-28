import { cn } from "@/lib/utils";
import type { BookData } from "@/types/books";
import { PremiumBookCover } from "@/components/books/PremiumBookCover";



type BookCoverFaceSize = "thumb" | "modal" | "hero";

interface BookCoverFaceProps {
  book: BookData;
  size?: BookCoverFaceSize;
  className?: string;
  /** When true, no frame/rounding assumptions; parent controls border/overflow. */
  bare?: boolean;
}

const coverToneByCategory: Record<BookData["category"], "black" | "emerald" | "navy" | "espresso" | "burgundy"> = {
  guide: "navy",
  report: "black",
  education: "espresso",
  faq: "emerald",
};

export function BookCoverFace({ book, size = "thumb", className, bare = false }: BookCoverFaceProps) {
  return (
    <PremiumBookCover
      title={book.title}
      subtitle={book.category === "faq" ? "Frequently Asked Questions" : book.category === "report" ? "Market Intelligence" : book.category === "education" ? "Education" : "Guide"}
      footer="JBJ GLOBAL REAL ESTATE  |  PREMIUM LIBRARY"
      tone={coverToneByCategory[book.category]}
      className={cn("relative w-full h-full", bare ? "" : "block", className)}
    />
  );
}
