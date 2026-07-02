import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, ChevronRight, BookOpen, Sparkles } from 'lucide-react';
import { BookCard } from '@/components/books/BookCard';
import { GuideBookReader } from '@/components/books/GuideBookReader';
import type { BookData } from '@/types/books';

interface GuideBookSectionProps {
  book: BookData;
  /** Optional: scroll IDs that map to each TOC chapter (same order as tableOfContents). Kept for back-compat but not used to scroll — chapters open the paginated reader instead. */
  sectionIds?: string[];
}

/**
 * Premium 3D Book Cover + Table of Contents section.
 * Clicking the cover or any chapter opens the paginated GuideBookReader modal —
 * never scrolls the page (fixes the "lands on the wrong section" bug).
 */
export function GuideBookSection({ book }: GuideBookSectionProps) {
  const [readerOpen, setReaderOpen] = useState(false);
  const [startChapter, setStartChapter] = useState(0);

  const totalTime = book.tableOfContents.reduce((sum, ch) => {
    const mins = parseInt(ch.duration?.replace(/\D/g, '') || '0', 10);
    return sum + mins;
  }, 0);

  const openAt = (idx: number) => {
    setStartChapter(idx);
    setReaderOpen(true);
  };

  return (
    <section className="jj-band jj-band--surface py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Cover */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-4 flex justify-center lg:justify-end"
          >
            <BookCard
              book={book}
              size="lg"
              onClick={() => openAt(0)}
              className="group transition-transform duration-300 hover:-translate-y-1"
            />
          </motion.div>

          {/* TOC */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-[#B89555]" />
              <h2
                className="text-2xl md:text-3xl font-bold text-[#1A1A1A]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {book.title}
              </h2>
            </div>
            <p className="text-sm text-[#1A1A1A]/70 mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {book.tableOfContents.length} chapters &middot; ~{totalTime} min total reading time
            </p>

            <div className="h-px w-full mb-6" data-gold-hairline data-divider style={{ background: 'linear-gradient(90deg, transparent, rgba(184,149,85,0.55), transparent)' }} />

            <div className="space-y-1">
              {book.tableOfContents.map((chapter, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => openAt(idx)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-all group hover:bg-[#EFE6D6]/70 cursor-pointer"
                >
                  <span className="w-8 h-8 rounded-lg bg-[#EFE6D6] border border-[#B89555]/30 flex items-center justify-center text-[#1A1A1A] text-sm font-semibold flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-sm text-left text-[#1A1A1A] font-medium group-hover:text-[#B89555] transition-colors">
                    {chapter.title}
                  </span>
                  {chapter.duration && (
                    <span className="flex items-center gap-1 text-[#1A1A1A]/70 text-xs flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {chapter.duration}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-[#1A1A1A] group-hover:text-[#B89555] transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => openAt(0)}
              data-cta="open-book"
              className="jj-cta-champagne mt-6 inline-flex items-center gap-2 h-11 px-6 rounded-full text-sm font-semibold"
            >
              <Sparkles className="w-4 h-4" />
              Open the Book
            </button>
          </motion.div>
        </div>
      </div>

      <GuideBookReader
        book={book}
        open={readerOpen}
        onOpenChange={setReaderOpen}
        initialChapterIndex={startChapter}
      />
    </section>
  );
}
