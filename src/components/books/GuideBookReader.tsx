import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Clock, X, ChevronLeft, ChevronRight, ListOrdered } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { BookCard } from "@/components/books/BookCard";
import type { BookData } from "@/types/books";

interface GuideBookReaderProps {
  book: BookData;
}

/**
 * Premium paginated book reader.
 * Left = 3D cover + "Open Book" CTA + chapter overview.
 * Click open → full-bleed champagne dialog renders one chapter per page with
 * Prev/Next + jump-to-chapter menu. Chapter content comes from book.tableOfContents.
 */
export function GuideBookReader({ book }: GuideBookReaderProps) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [showToc, setShowToc] = useState(false);

  const chapters = book.tableOfContents;
  const total = chapters.length;
  const totalTime = chapters.reduce((s, c) => s + parseInt(c.duration?.replace(/\D/g, "") || "0", 10), 0);
  const current = chapters[page];

  const go = useCallback(
    (delta: number) => setPage((p) => Math.min(Math.max(0, p + delta), total - 1)),
    [total],
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, go]);

  return (
    <section className="jj-band jj-band--surface py-12 md:py-16" data-marketing-page>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* 3D Cover */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-4 flex justify-center lg:justify-end"
          >
            <BookCard book={book} size="lg" onClick={() => setOpen(true)} />
          </motion.div>

          {/* TOC + Open CTA */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
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
              {total} chapters &middot; ~{totalTime} min total reading time
            </p>

            <div className="h-px bg-gradient-to-r from-[#B89555]/40 via-[#B89555]/15 to-transparent mb-6" />

            <div className="space-y-1 mb-6">
              {chapters.map((ch, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPage(i);
                    setOpen(true);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-all group hover:bg-[#EFE6D6]/70 cursor-pointer text-left"
                >
                  <span className="w-8 h-8 rounded-lg bg-[#FDFBF7] border border-[#B89555]/30 flex items-center justify-center text-[#1A1A1A] text-sm font-semibold flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm text-[#1A1A1A] font-medium group-hover:text-[#1A1A1A]">
                    {ch.title}
                  </span>
                  {ch.duration && (
                    <span className="flex items-center gap-1 text-[#1A1A1A]/60 text-xs flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {ch.duration}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setPage(0);
                setOpen(true);
              }}
              className="jj-cta-champagne inline-flex items-center gap-2 px-6 py-3 text-base font-semibold"
              data-cta="open-book"
            >
              <BookOpen className="w-5 h-5 text-[#1A1A1A]" />
              <span className="text-[#1A1A1A]">Open the book</span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Reader Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-6xl w-[95vw] h-[90vh] p-0 border-0 bg-transparent shadow-none"
          data-marketing-page
        >
          <div className="relative w-full h-full rounded-2xl overflow-hidden border border-[#B89555]/40 bg-[#FDFBF7] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)]">
            {/* Header bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#B89555]/20 bg-[#F7F2EA]">
              <div className="flex items-center gap-3 min-w-0">
                <BookOpen className="w-5 h-5 text-[#B89555] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#1A1A1A]/60">{book.title}</p>
                  <p className="text-sm font-semibold text-[#1A1A1A] truncate">{current?.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowToc((v) => !v)}
                  className="jj-cta-outline inline-flex items-center gap-2 px-3 py-2 text-xs font-medium"
                  data-cta="reader-toc"
                  aria-label="Chapters"
                >
                  <ListOrdered className="w-4 h-4 text-[#1A1A1A]" />
                  <span className="text-[#1A1A1A] hidden sm:inline">Chapters</span>
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="jj-cta-outline inline-flex items-center justify-center w-9 h-9"
                  data-cta="reader-close"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-[#1A1A1A]" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="relative h-[calc(100%-72px-64px)] overflow-hidden">
              {/* TOC overlay */}
              <AnimatePresence>
                {showToc && (
                  <motion.aside
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{ type: "tween", duration: 0.25 }}
                    className="absolute inset-y-0 left-0 w-72 max-w-[80%] bg-[#F7F2EA] border-r border-[#B89555]/30 z-10 overflow-y-auto"
                  >
                    <ul className="p-3 space-y-1">
                      {chapters.map((ch, i) => (
                        <li key={i}>
                          <button
                            onClick={() => {
                              setPage(i);
                              setShowToc(false);
                            }}
                            className={`w-full text-left flex items-start gap-3 p-3 rounded-lg transition ${
                              i === page
                                ? "bg-[#EFE6D6] border border-[#B89555]/40"
                                : "hover:bg-[#EFE6D6]/60"
                            }`}
                          >
                            <span className="w-6 h-6 rounded-md bg-[#FDFBF7] border border-[#B89555]/30 flex items-center justify-center text-xs font-semibold text-[#1A1A1A] flex-shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-sm text-[#1A1A1A] font-medium leading-snug">
                              {ch.title}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </motion.aside>
                )}
              </AnimatePresence>

              {/* Chapter page */}
              <AnimatePresence mode="wait">
                <motion.article
                  key={page}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                  className="h-full overflow-y-auto px-6 sm:px-10 md:px-16 py-8 md:py-12"
                >
                  <div className="max-w-3xl mx-auto">
                    <p className="text-xs uppercase tracking-[0.22em] text-[#B89555] mb-3">
                      Chapter {page + 1} of {total}
                      {current?.duration ? ` \u00b7 ${current.duration} read` : ""}
                    </p>
                    <h3
                      className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-6 leading-tight"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {current?.title}
                    </h3>
                    {current?.summary ? (
                      <p className="text-base md:text-lg text-[#1A1A1A]/85 leading-relaxed mb-6">
                        {current.summary}
                      </p>
                    ) : (
                      <p className="text-base text-[#1A1A1A]/70 leading-relaxed mb-6 italic">
                        Detailed content for this chapter will be added shortly. The structure and
                        navigation are in place \u2014 your editorial team can fill in the body copy at any
                        time from the back office.
                      </p>
                    )}

                    {current?.bullets && current.bullets.length > 0 && (
                      <ul className="space-y-3 mb-6">
                        {current.bullets.map((b, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#B89555] flex-shrink-0" />
                            <span className="text-[#1A1A1A] leading-relaxed">{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {current?.callout && (
                      <div className="mt-8 rounded-xl border border-[#B89555]/30 bg-[#F7F2EA] p-5">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-[#B89555] mb-1">
                          {current.callout.label}
                        </p>
                        <p className="text-sm text-[#1A1A1A]/85 leading-relaxed">
                          {current.callout.body}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.article>
              </AnimatePresence>
            </div>

            {/* Footer pager */}
            <div className="absolute inset-x-0 bottom-0 h-16 flex items-center justify-between gap-4 px-6 border-t border-[#B89555]/20 bg-[#F7F2EA]">
              <button
                onClick={() => go(-1)}
                disabled={page === 0}
                className="jj-cta-outline inline-flex items-center gap-2 px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                data-cta="reader-prev"
              >
                <ChevronLeft className="w-4 h-4 text-[#1A1A1A]" />
                <span className="text-[#1A1A1A]">Previous</span>
              </button>
              <p className="text-xs text-[#1A1A1A]/60">
                Page {page + 1} / {total}
              </p>
              <button
                onClick={() => go(1)}
                disabled={page === total - 1}
                className="jj-cta-champagne inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                data-cta="reader-next"
              >
                <span className="text-[#1A1A1A]">Next</span>
                <ChevronRight className="w-4 h-4 text-[#1A1A1A]" />
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default GuideBookReader;
