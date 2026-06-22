import { Link } from "react-router-dom";
import { BookOpen, ArrowRight } from "lucide-react";
import { INVESTOR_BOOKS } from "@/data/bookCollections";
import { BookCarousel } from "@/components/books/BookCarousel";

const allBooks = INVESTOR_BOOKS.filter(
  b => b.title !== 'Guides Library' && b.title !== 'Company Profile'
);

export default function HomepageBookMarquee() {
  return (
    <section className="bg-[#FDFBF7] py-10 md:py-14">
      {/* Header — padded */}
      <div className="px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              data-emerald="true"
              data-no-contrast-guard
              className="jj-emerald w-10 h-10 rounded-full flex items-center justify-center"
            >
              <BookOpen className="w-5 h-5" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
            </div>
            <div>
              <h2
                data-no-contrast-guard
                className="text-lg md:text-xl font-bold"
                style={{ color: '#064E3B', WebkitTextFillColor: '#064E3B' } as React.CSSProperties}
              >
                Explore Our Guides & Reports
              </h2>
              <p className="text-[#1A1A1A]/70 text-xs">Free educational resources for investors</p>
            </div>
          </div>
          <Link
            to="/guides"
            data-emerald="true"
            data-no-contrast-guard
            className="jj-emerald hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-full transition-all"
          >
            <span style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>View Library</span>
            <ArrowRight className="w-4 h-4" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
          </Link>
        </div>

      </div>

      {/* Canonical book strip — full-bleed, smooth CSS marquee, titles engraved on covers */}
      <BookCarousel books={allBooks} size="sm" durationSec={38} compact />

      {/* Mobile link */}
      <div className="px-4 md:px-6 lg:px-8">
        <div className="mt-4 sm:hidden text-center">
          <Link
            to="/guides"
            className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
            style={{ color: '#064E3B' }}
          >
            View Full Library
            <ArrowRight className="w-4 h-4" style={{ color: '#064E3B', stroke: '#064E3B' }} />
          </Link>
        </div>
      </div>
    </section>
  );
}
