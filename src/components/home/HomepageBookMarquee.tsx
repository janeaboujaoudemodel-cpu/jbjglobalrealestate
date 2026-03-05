import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ArrowRight } from "lucide-react";
import { INVESTOR_BOOKS } from "@/data/bookCollections";
import { BookCoverFace } from "@/components/books/BookCoverFace";
import type { BookData } from "@/types/books";

const allBooks = INVESTOR_BOOKS.filter(b => b.title !== 'Guides Library');

function BookMarqueeStrip({ books }: { books: BookData[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const duplicated = [...books, ...books, ...books];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let animId: number;
    let pos = 0;
    const speed = 0.4;
    const singleSetWidth = books.length * 160;

    const tick = () => {
      pos += speed;
      if (pos >= singleSetWidth) pos -= singleSetWidth;
      el.style.transform = `translateX(-${pos}px)`;
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);

    const pause = () => cancelAnimationFrame(animId);
    const resume = () => { animId = requestAnimationFrame(tick); };
    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', resume);

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener('mouseenter', pause);
      el.removeEventListener('mouseleave', resume);
    };
  }, [books.length]);

  return (
    <div className="overflow-hidden w-full">
      <div ref={scrollRef} className="flex gap-6 will-change-transform" style={{ width: 'max-content' }}>
        {duplicated.map((book, i) => (
          <Link
            key={`${book.title}-${i}`}
            to={book.href}
            className="flex-shrink-0 w-28 md:w-36 group"
          >
            <div className="relative w-24 h-36 md:w-32 md:h-44 mx-auto rounded-md overflow-hidden border border-gold/40 shadow-[4px_4px_20px_rgba(0,0,0,0.25)] transition-transform duration-300 group-hover:scale-105">
              <BookCoverFace book={book} size="thumb" bare />
            </div>
            <p className="text-center text-[10px] md:text-xs text-zinc-400 mt-2 truncate px-1 group-hover:text-gold transition-colors">
              {book.title}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function HomepageBookMarquee() {
  return (
    <section className="bg-black py-10 md:py-14">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="text-white text-lg md:text-xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                Explore Our Guides & Reports
              </h2>
              <p className="text-zinc-500 text-xs">Free educational resources for investors</p>
            </div>
          </div>
          <Link
            to="/guides"
            className="hidden sm:flex items-center gap-1.5 text-gold text-sm font-medium hover:text-gold-light transition-colors"
          >
            View Library
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Walking books strip */}
        <BookMarqueeStrip books={allBooks} />

        {/* Mobile link */}
        <div className="mt-4 sm:hidden text-center">
          <Link
            to="/guides"
            className="inline-flex items-center gap-1.5 text-gold text-sm font-medium hover:text-gold-light transition-colors"
          >
            View Full Library
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
