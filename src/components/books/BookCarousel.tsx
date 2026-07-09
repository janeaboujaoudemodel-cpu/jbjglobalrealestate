import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BookCard, type BookCardSize } from "@/components/books/BookCard";
import type { BookData } from "@/types/books";

interface BookCarouselProps {
  books: BookData[];
  size?: BookCardSize;
  /** Animation duration in seconds for one full loop. Lower = faster. */
  durationSec?: number;
  className?: string;
  /** Optional click handler — if omitted, the card navigates to book.href. */
  onBookClick?: (book: BookData) => void;
  /** Pass-through to BookCard: render clean homepage variant (title only). */
  compact?: boolean;
}

/**
 * Canonical horizontal book strip. CSS-keyframe marquee on a duplicated track
 * — buttery smooth, pause on hover, pointer-drag scrub. Single source of truth
 * used by the homepage and anywhere else a guide strip appears.
 */
export function BookCarousel({
  books,
  size = "sm",
  durationSec = 38,
  className,
  onBookClick,
  compact = false,
}: BookCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const resumeTimerRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const [paused, setPaused] = useState(false);

  const dragState = useRef({
    dragging: false,
    moved: false,
    startX: 0,
    startOffset: 0,
    offset: 0,
  });

  const applyOffset = useCallback((px: number) => {
    const el = trackRef.current;
    if (!el) return;
    // Negative animation-delay shifts the marquee start position, letting us
    // "scrub" without fighting the keyframe.
    el.style.animationDelay = `${-((px / Math.max(1, el.scrollWidth / 2)) * durationSec)}s`;
  }, [durationSec]);

  const pauseBriefly = useCallback(() => {
    setPaused(true);
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => setPaused(false), 2600);
  }, []);

  useEffect(() => () => {
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (books.length <= 1) return;
    dragState.current.dragging = true;
    dragState.current.moved = false;
    dragState.current.startX = e.clientX;
    dragState.current.startOffset = dragState.current.offset;
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    setPaused(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.dragging) return;
    const dx = e.clientX - dragState.current.startX;
    if (Math.abs(dx) > 4) dragState.current.moved = true;
    const next = dragState.current.startOffset - dx;
    dragState.current.offset = next;
    applyOffset(next);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragState.current.dragging) return;
    dragState.current.dragging = false;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    // Resume animation from the scrubbed position
    pauseBriefly();
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const shell = shellRef.current;
    if (!shell) return;
    pauseBriefly();
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (delta !== 0) {
      shell.scrollLeft += delta;
      dragState.current.offset = shell.scrollLeft;
      applyOffset(shell.scrollLeft);
    }
  };

  const handleCardClick = (book: BookData) => () => {
    if (dragState.current.moved) return;
    if (onBookClick) onBookClick(book);
    else if (book.href) navigate(book.href);
  };

  // Duplicate the track so 0 → -50% loops seamlessly.
  const duplicated = books.length <= 1 ? books : [...books, ...books];

  return (
    <div
      ref={shellRef}
      className={`w-full select-none overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing snap-x snap-mandatory md:snap-none [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className ?? ""}`}
      style={{ touchAction: "pan-x pan-y" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className="flex w-max gap-6 md:gap-8 will-change-transform px-4 md:px-0"
        style={{
          animation: books.length > 1
            ? `jbj-book-marquee ${durationSec}s linear infinite`
            : undefined,
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        {duplicated.map((book, i) => (
          <BookCard
            key={`${book.title}-${i}`}
            book={book}
            size={size}
            onClick={handleCardClick(book)}
            flat
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}
