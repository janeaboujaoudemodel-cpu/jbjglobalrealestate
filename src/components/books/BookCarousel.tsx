import React, { useEffect, useRef, useState } from "react";
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
 * Canonical horizontal book strip.
 *
 * Auto-walks continuously (desktop and phone) using programmatic scrollLeft on
 * a real scroll container, so the visitor can ALSO grab the strip with a finger
 * or mouse and drag it back and forth. The rail resumes walking shortly after
 * the gesture ends. Do not set `-webkit-overflow-scrolling: touch` — on iOS it
 * freezes the programmatic repaints the marquee relies on.
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
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef({ paused: false, dragging: false, startX: 0, startScroll: 0, resumeAt: 0 });
  const [dragging, setDragging] = useState(false);

  const handleCardClick = (book: BookData) => () => {
    // Swallow the click that ends a drag gesture.
    const scroller = scrollerRef.current;
    if (scroller && Math.abs(stateRef.current.startScroll - scroller.scrollLeft) > 4) return;
    if (onBookClick) onBookClick(book);
    else if (book.href) navigate(book.href);
  };

  // Duplicate so the walk wraps seamlessly.
  const track = books.length > 1 ? [...books, ...books] : books;

  useEffect(() => {
    if (books.length < 2) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      const s = stateRef.current;
      const running = !s.paused && !s.dragging && now >= s.resumeAt;
      if (running) {
        const half = scroller.scrollWidth / 2;
        let next = scroller.scrollLeft + (speed * dt) / 1000;
        if (half > 0 && next >= half) next -= half;
        scroller.scrollLeft = next;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [books.length, speed]);

  const onPointerDown = (e: React.PointerEvent) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    stateRef.current.dragging = true;
    stateRef.current.startX = e.clientX;
    stateRef.current.startScroll = scroller.scrollLeft;
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const scroller = scrollerRef.current;
    if (!scroller || !stateRef.current.dragging) return;
    scroller.scrollLeft = stateRef.current.startScroll - (e.clientX - stateRef.current.startX);
  };

  const endDrag = () => {
    if (!stateRef.current.dragging) return;
    stateRef.current.dragging = false;
    // Give the visitor a beat to read before the walk resumes.
    stateRef.current.resumeAt = performance.now() + 1200;
    setDragging(false);
  };

  return (
    <div
      className={`w-full select-none ${className ?? ""}`}
      onMouseEnter={() => {
        if (window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) stateRef.current.paused = true;
      }}
      onMouseLeave={() => {
        stateRef.current.paused = false;
        endDrag();
      }}
    >
      <div
        ref={scrollerRef}
        data-jbj-book-strip
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="flex gap-6 overflow-x-auto overflow-y-hidden px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-8"
        style={{
          cursor: dragging ? "grabbing" : "grab",
          touchAction: "pan-x pan-y",
          scrollBehavior: "auto",
          WebkitOverflowScrolling: "auto",
          willChange: "scroll-position",
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
    </div>
  );
}
