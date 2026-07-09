import React, { useCallback, useEffect, useRef } from "react";
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
 * Canonical horizontal book strip. Native scrollLeft + RAF auto-scroll — the
 * same pattern used by the /access PropertyMarquee. Buttery smooth, pauses on
 * hover / drag / wheel, and always responds to wheel + pointer drag without
 * getting "stuck" on a CSS keyframe.
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
  const resumeTimerRef = useRef<number | null>(null);
  const stateRef = useRef({
    dragging: false,
    paused: false,
    moved: false,
    startX: 0,
    startScroll: 0,
    lastTs: 0,
  });

  const pauseBriefly = useCallback(() => {
    stateRef.current.paused = true;
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => {
      stateRef.current.paused = false;
    }, 2200);
  }, []);

  useEffect(() => () => {
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
  }, []);

  // Auto-scroll loop (pauses on hover, drag, or reduced motion)
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || books.length < 2) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;

    let raf = 0;
    const step = (ts: number) => {
      const s = stateRef.current;
      if (!s.lastTs) s.lastTs = ts;
      const dt = (ts - s.lastTs) / 1000;
      s.lastTs = ts;
      if (!s.paused && !s.dragging) {
        el.scrollLeft += speed * dt;
        const half = el.scrollWidth / 2;
        if (half > 0 && el.scrollLeft >= half) el.scrollLeft -= half;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [books.length, speed]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    stateRef.current.dragging = true;
    stateRef.current.paused = true;
    stateRef.current.moved = false;
    stateRef.current.startX = e.clientX;
    stateRef.current.startScroll = el.scrollLeft;
    try { el.setPointerCapture(e.pointerId); } catch {}
    el.style.cursor = "grabbing";
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    const s = stateRef.current;
    if (!el || !s.dragging) return;
    const dx = e.clientX - s.startX;
    if (Math.abs(dx) > 4) s.moved = true;
    el.scrollLeft = s.startScroll - dx;
  };
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    stateRef.current.dragging = false;
    try { el.releasePointerCapture(e.pointerId); } catch {}
    el.style.cursor = "grab";
    pauseBriefly();
  };

  // Non-passive wheel listener to hijack vertical wheel into horizontal scroll.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || books.length < 2) return;
    const handler = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta === 0) return;
      e.preventDefault();
      pauseBriefly();
      el.scrollLeft += delta;
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [books.length, pauseBriefly]);

  const handleCardClick = (book: BookData) => () => {
    if (stateRef.current.moved) return;
    if (onBookClick) onBookClick(book);
    else if (book.href) navigate(book.href);
  };

  // Duplicate so scroll wraps seamlessly
  const track = books.length >= 3 ? [...books, ...books] : books;

  return (
    <div
      ref={scrollerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={(e) => { if (stateRef.current.dragging) endDrag(e); }}
      onMouseEnter={() => { stateRef.current.paused = true; }}
      onMouseLeave={() => { stateRef.current.paused = false; }}
      className={`flex w-full gap-6 md:gap-8 overflow-x-auto overflow-y-hidden px-4 py-4 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className ?? ""}`}
      style={{ cursor: "grab", touchAction: "pan-x pan-y", scrollBehavior: "auto" }}
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
  );
}
