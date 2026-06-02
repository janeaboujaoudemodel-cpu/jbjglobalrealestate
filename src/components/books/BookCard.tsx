import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BookCoverFace } from "@/components/books/BookCoverFace";
import type { BookData } from "@/types/books";

export type BookCardSize = "xs" | "sm" | "md" | "lg";

interface BookCardProps {
  book: BookData;
  size?: BookCardSize;
  /** If provided, the card becomes a Link. */
  href?: string;
  /** Otherwise it becomes a button. */
  onClick?: () => void;
  className?: string;
  /** Disable hover lift (used inside drag-scroll carousels to avoid jitter). */
  flat?: boolean;
  draggable?: boolean;
}

const sizeMap: Record<BookCardSize, string> = {
  xs: "w-20 h-30 md:w-24 md:h-36",
  sm: "w-24 h-36 md:w-32 md:h-44",
  md: "w-32 h-48 md:w-40 md:h-60",
  lg: "w-52 h-[19rem] sm:w-60 sm:h-[22rem] md:w-64 md:h-[24rem]",
};

/**
 * Canonical 3D book card. Single source of truth for every book tile across
 * the homepage carousel, /guides library, guide page hero, broker shelf, etc.
 *
 * Renders <PremiumBookCover> (which engraves the title onto the cover) — never
 * shows a duplicate caption underneath.
 */
export const BookCard = forwardRef<HTMLElement, BookCardProps>(function BookCard(
  { book, size = "sm", href, onClick, className, flat = false, draggable = false },
  ref,
) {
  const inner = (
    <div
      className={cn(
        "relative mx-auto transition-transform duration-500",
        sizeMap[size],
      )}
    >
      <BookCoverFace book={book} bare />
    </div>
  );

  const commonCls = cn(
    "group block flex-shrink-0 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B89555]/60 rounded-md",
    className,
  );

  if (href) {
    return (
      <Link
        ref={ref as React.Ref<HTMLAnchorElement>}
        to={href}
        onClick={onClick}
        draggable={draggable}
        className={commonCls}
        aria-label={book.title}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      className={commonCls}
      aria-label={book.title}
    >
      {inner}
    </button>
  );
});
