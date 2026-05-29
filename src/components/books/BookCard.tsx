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
    <div className="relative" style={{ perspective: "1200px" }}>
      {/* Soft ground shadow */}
      <div className="pointer-events-none absolute -bottom-2 left-2 right-2 h-4 rounded-full bg-[#1A1A1A]/25 blur-lg" />

      <div
        className={cn(
          "relative mx-auto transition-transform duration-500",
          !flat && "group-hover:[transform:rotateY(-8deg)_translateY(-4px)]",
          sizeMap[size],
        )}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front cover */}
        <div
          className="relative h-full w-full overflow-hidden rounded-l-[2px] rounded-r-[6px] ring-1 ring-[#B89555]/40 bg-[#10100f]"
          style={{
            transform: "translateZ(1px)",
            backfaceVisibility: "hidden",
            boxShadow:
              "12px 14px 36px rgba(0,0,0,0.32), 4px 6px 14px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(184,149,85,0.35)",
          }}
        >
          {/* Left spine darkening — preserves 3D feel; no white band on top anymore */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[6%] bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
          {/* Right page edge hairline */}
          <div className="pointer-events-none absolute inset-y-[2%] right-0 z-10 w-[2px] bg-gradient-to-r from-transparent via-[#EFE6D6]/45 to-[#B89555]/70" />

          <BookCoverFace book={book} bare />
        </div>

        {/* 3D spine block */}
        <div
          className="pointer-events-none absolute top-0 left-0 h-full w-2 bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] origin-left"
          style={{ transform: "rotateY(-90deg) translateX(-4px)" }}
        />
      </div>
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
