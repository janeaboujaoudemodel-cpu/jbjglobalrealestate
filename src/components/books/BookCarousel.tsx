import React from "react";
import { useNavigate } from "react-router-dom";
import { BookCard, type BookCardSize } from "@/components/books/BookCard";
import { DragMarquee } from "@/components/ui/DragMarquee";
import type { BookData } from "@/types/books";

interface BookCarouselProps {
  books: BookData[];
  size?: BookCardSize;
  /** Auto-scroll speed in px/sec. Lower = slower. */
  speed?: number;
  className?: string;
  onBookClick?: (book: BookData) => void;
  compact?: boolean;
  /** kept for API compat — no longer used */
  durationSec?: number;
}

/**
 * Canonical horizontal book strip.
 *
 * Walks continuously on every device (transform-driven, see DragMarquee) and
 * stays swipeable by finger or mouse. Covers load eagerly so the rail never
 * shows empty frames while walking.
 */
export function BookCarousel({
  books,
  size = "sm",
  speed = 34,
  className,
  onBookClick,
  compact = false,
}: BookCarouselProps) {
  const navigate = useNavigate();

  const handleCardClick = (book: BookData) => () => {
    if (onBookClick) onBookClick(book);
    else if (book.href) navigate(book.href);
  };

  return (
    <DragMarquee
      speed={speed}
      className={className}
      gapClassName="gap-6 md:gap-8"
      itemClassName="px-0"
      ariaLabel="JBJ library carousel"
    >
      {books.map((book, i) => (
        <div key={`${book.title}-${i}`} className="py-4 pl-4 last:pr-4">
          <BookCard book={book} size={size} onClick={handleCardClick(book)} flat compact={compact} />
        </div>
      ))}
    </DragMarquee>
  );
}
