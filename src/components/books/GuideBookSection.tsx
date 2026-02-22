import { motion } from 'framer-motion';
import { Clock, ChevronRight, BookOpen } from 'lucide-react';
import type { BookData } from './BookShelf';

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
          {/* 3D Book Cover — left column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-4 flex justify-center lg:justify-end"
          >
            <div className="relative group" style={{ perspective: '1200px' }}>
              {/* Book shadow */}
              <div className="absolute -bottom-4 left-4 right-4 h-8 bg-black/20 blur-xl rounded-full" />

              {/* 3D Book */}
              <div
                className="relative w-52 sm:w-60 md:w-64 transition-transform duration-500 group-hover:[transform:rotateY(-8deg)]"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front cover */}
                <div className="relative rounded-r-lg overflow-hidden shadow-[8px_8px_30px_rgba(0,0,0,0.35)]">
                  {/* Spine edge */}
                  <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/40 via-black/20 to-transparent z-10" />
                  {/* Top light reflection */}
                  <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white/15 to-transparent z-10" />

                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-full aspect-[2/3] object-cover"
                  />

                  {/* Subtle overlay sheen */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10 z-10" />
                </div>

                {/* Book spine (3D depth) */}
                <div
                  className="absolute top-0 left-0 w-4 h-full bg-gradient-to-r from-zinc-800 to-zinc-700 origin-left"
                  style={{ transform: 'rotateY(-90deg) translateX(-8px)' }}
                />
                {/* Book pages (3D bottom edge) */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-b from-[#f5f0e0] to-[#e8dcc8]"
                  style={{ transform: 'rotateX(90deg) translateY(6px)', transformOrigin: 'bottom' }}
                />
              </div>
            </div>
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
              <BookOpen className="w-5 h-5 text-[#C8A766]" />
              <h2
                className="text-2xl md:text-3xl font-bold text-black"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {book.title}
              </h2>
            </div>
            <p className="text-sm text-zinc-500 mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {book.tableOfContents.length} chapters &middot; ~{totalTime} min total reading time
            </p>

            {/* Gold divider */}
            <div className="h-[2px] bg-gradient-to-r from-[#C8A766] via-[#C8A766]/60 to-transparent mb-6" />

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
                        ? 'hover:bg-[#C8A766]/10 cursor-pointer'
                        : ''
                    }`}
                  >
                    {/* Chapter number */}
                    <span className="w-8 h-8 rounded-lg bg-[#C8A766]/10 border border-[#C8A766]/20 flex items-center justify-center text-[#C8A766] text-sm font-semibold flex-shrink-0">
                      {idx + 1}
                    </span>

                    {/* Title */}
                    <span className="flex-1 text-sm text-left text-black font-medium group-hover:text-[#C8A766] transition-colors">
                      {chapter.title}
                    </span>

                    {/* Duration */}
                    {chapter.duration && (
                      <span className="flex items-center gap-1 text-zinc-400 text-xs flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {chapter.duration}
                      </span>
                    )}

                    {/* Arrow */}
                    {isClickable && (
                      <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-[#C8A766] transition-colors flex-shrink-0" />
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
