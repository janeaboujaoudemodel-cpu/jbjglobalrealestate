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
    <section className="jj-fullbleed-band bg-[#F7F2EA] py-10 md:py-14" data-fullbleed-band>
      {/* Header — padded */}
      <div className="jj-bleed-allow"><ContentTrack>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E8F2EC] border border-[#064E3B]/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 jj-icon-emerald" />
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
            data-no-contrast-guard
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold transition-colors"
            style={{ color: '#064E3B', WebkitTextFillColor: '#064E3B' } as React.CSSProperties}
          >
            <span style={{ color: '#064E3B', WebkitTextFillColor: '#064E3B' }}>View Library</span>
            <ArrowRight className="w-4 h-4" style={{ color: '#064E3B', stroke: '#064E3B' }} />
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
