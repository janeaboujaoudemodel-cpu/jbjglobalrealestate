import { motion } from 'framer-motion';
import { Clock, ChevronRight, BookOpen } from 'lucide-react';
import { BookCard } from '@/components/books/BookCard';
import type { BookData } from '@/types/books';

interface GuideBookSectionProps {
  book: BookData;
  /** Optional: scroll IDs that map to each TOC chapter (same order as tableOfContents) */
  sectionIds?: string[];
}

/**
 * Premium 3D Book Cover + Table of Contents section.
 * Place this right after the hero on every guide, FAQ, and report page.
 */
export function GuideBookSection({ book, sectionIds }: GuideBookSectionProps) {
  const totalTime = book.tableOfContents.reduce((sum, ch) => {
    const mins = parseInt(ch.duration?.replace(/\D/g, '') || '0', 10);
    return sum + mins;
  }, 0);

  const handleChapterClick = (index: number) => {
    if (!sectionIds?.[index]) return;
    const el = document.getElementById(sectionIds[index]);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-12 md:py-20 jj-section-champagne">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Canonical 3D Book Cover — left column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-4 flex justify-center lg:justify-end"
          >
            <BookCard book={book} size="lg" />
          </motion.div>


          {/* Table of Contents — right column */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-8"
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-[#B89555]" />
              <h2
                className="text-2xl md:text-3xl font-bold text-[#1A1A1A]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {book.title}
              </h2>
            </div>
            <p className="text-sm text-white/90 mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {book.tableOfContents.length} chapters &middot; ~{totalTime} min total reading time
            </p>

            {/* Gold divider */}
            <div className="h-[2px] bg-gradient-to-r from-[#EFE6D6] via-[#EFE6D6]/60 to-transparent mb-6" />

            {/* Chapter list */}
            <div className="space-y-1">
              {book.tableOfContents.map((chapter, idx) => {
                const isClickable = !!sectionIds?.[idx];
                const Tag = isClickable ? 'button' : 'div';
                return (
                  <Tag
                    key={idx}
                    onClick={isClickable ? () => handleChapterClick(idx) : undefined}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${
                      isClickable
                        ? 'hover:bg-[#EFE6D6]/10 cursor-pointer'
                        : ''
                    }`}
                  >
                    {/* Chapter number */}
                    <span className="w-8 h-8 rounded-lg bg-[#EFE6D6]/10 border border-[#B89555]/20 flex items-center justify-center text-[#B89555] text-sm font-semibold flex-shrink-0">
                      {idx + 1}
                    </span>

                    {/* Title */}
                    <span className="flex-1 text-sm text-left text-[#1A1A1A] font-medium group-hover:text-[#B89555] transition-colors">
                      {chapter.title}
                    </span>

                    {/* Duration */}
                    {chapter.duration && (
                      <span className="flex items-center gap-1 text-white/70 text-xs flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {chapter.duration}
                      </span>
                    )}

                    {/* Arrow */}
                    {isClickable && (
                      <ChevronRight className="w-4 h-4 text-white/70 group-hover:text-[#B89555] transition-colors flex-shrink-0" />
                    )}
                  </Tag>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
