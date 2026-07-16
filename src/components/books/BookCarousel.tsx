import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookCard, type BookCardSize } from "@/components/books/BookCard";
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
 * Canonical horizontal book strip. Uses a duplicated transform marquee instead
 * of programmatic scrollLeft so iPhone/iPad Safari keeps the strip visibly
 * walking even after touch/pan events.
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
  const [paused, setPaused] = useState(false);

  const handleCardClick = (book: BookData) => () => {
    if (onBookClick) onBookClick(book);
    else if (book.href) navigate(book.href);
  };

  // Duplicate so scroll wraps seamlessly
  const track = books.length > 1 ? [...books, ...books] : books;
  const durationSec = useMemo(() => Math.max(18, Math.round((books.length * 170) / Math.max(12, speed))), [books.length, speed]);

  return (
    <div
      className={`w-full overflow-hidden select-none ${className ?? ""}`}
      style={{ touchAction: "pan-y" }}
      onMouseEnter={(e) => {
        if (window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) setPaused(true);
      }}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        data-jbj-book-strip
        className="flex w-max gap-6 px-4 py-4 will-change-transform md:gap-8"
        style={{
          animation: books.length > 1 ? `jbj-book-marquee ${durationSec}s linear infinite` : undefined,
          animationPlayState: paused ? "paused" : "running",
          transform: "translate3d(0,0,0)",
        }}
      >
        {track.map((book, i) => (
          <div key={`${book.title}-${i}`} className="shrink-0" draggable={false}>
            <BookCard
              book={book}
              size={size}
              onClick={handleCardClick(book)}
              flat
              compact={compact}
            />
          </div>
        ))}
      </div>
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          [data-jbj-book-strip] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
