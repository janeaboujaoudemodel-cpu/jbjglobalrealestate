import { Link } from "react-router-dom";
import { BookOpen, ArrowRight } from "lucide-react";
import { INVESTOR_BOOKS } from "@/data/bookCollections";
import { BookCarousel } from "@/components/books/BookCarousel";
import ContentTrack from "@/components/layout/ContentTrack";

const allBooks = INVESTOR_BOOKS.filter(
  b => b.title !== 'Guides Library' && b.title !== 'Company Profile'
);

export default function HomepageBookMarquee() {
  return (
    <section className="jj-bleed-allow jj-fullbleed-band bg-[#F7F2EA] py-10 md:py-14" data-fullbleed-band>
      {/* Header — padded */}
      <div className="jj-bleed-allow"><ContentTrack>
        <div className="flex items-center justify-between mb-6">
          <h2
            data-no-contrast-guard
            className="text-2xl md:text-3xl font-bold"
            style={{ color: '#1A1A1A', WebkitTextFillColor: '#1A1A1A' } as React.CSSProperties}
          >
            Explore Our Guides & Reports
          </h2>
          <Link
            to="/guides"
            data-no-contrast-guard
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold transition-colors"
            style={{ color: '#1A1A1A', WebkitTextFillColor: '#1A1A1A' } as React.CSSProperties}
          >
            <span style={{ color: '#1A1A1A', WebkitTextFillColor: '#1A1A1A' }}>View Library</span>
            <ArrowRight className="w-4 h-4" style={{ color: '#1A1A1A', stroke: '#1A1A1A' }} />
          </Link>
        </div>
      </ContentTrack></div>

      {/* Canonical book strip — full-bleed, smooth CSS marquee, titles engraved on covers */}
      <div className="jj-bleed-allow"><BookCarousel books={allBooks} size="sm" durationSec={38} compact /></div>

      {/* Mobile link */}
      <div className="jj-bleed-allow"><ContentTrack>
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
      </ContentTrack></div>
    </section>
  );
}
