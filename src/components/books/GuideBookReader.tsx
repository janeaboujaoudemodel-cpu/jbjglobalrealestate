import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Clock, X, ChevronLeft, ChevronRight, ListOrdered } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { BookData } from "@/types/books";

interface GuideBookReaderProps {
  book: BookData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialChapterIndex?: number;
}

/**
 * Premium paginated book reader (controlled).
 * Renders only the full-bleed dialog — the cover + TOC live in `GuideBookSection`.
 * One chapter per page with Prev/Next + jump-to-chapter sidebar.
 */
export function GuideBookReader({
  book,
  open,
  onOpenChange,
  initialChapterIndex = 0,
}: GuideBookReaderProps) {
  const [page, setPage] = useState(initialChapterIndex);
  const [showToc, setShowToc] = useState(false);

  const chapters = book.tableOfContents;
  const total = chapters.length;
  const current = chapters[page];

  // Reset to the requested chapter whenever the reader opens.
  useEffect(() => {
    if (open) {
      setPage(Math.min(Math.max(0, initialChapterIndex), total - 1));
      setShowToc(false);
    }
  }, [open, initialChapterIndex, total]);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-6xl w-[95vw] h-[90vh] p-0 border-0 bg-transparent shadow-none"
        data-marketing-page
      >
        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-[#B89555]/40 bg-[#FDFBF7] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)]">
          {/* Header */}
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
                type="button"
                onClick={() => setShowToc((v) => !v)}
                className="jj-cta-outline inline-flex items-center gap-2 px-3 py-2 text-xs font-medium"
                data-cta="reader-toc"
                aria-label="Chapters"
              >
                <ListOrdered className="w-4 h-4" />
                <span className="hidden sm:inline">Chapters</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="jj-cta-outline inline-flex items-center justify-center w-9 h-9"
                data-cta="reader-close"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="relative h-[calc(100%-72px-64px)] overflow-hidden">
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
                          type="button"
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
                      Detailed content for this chapter will be added shortly.
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
              type="button"
              onClick={() => go(-1)}
              disabled={page === 0}
              className="jj-cta-outline inline-flex items-center gap-2 px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              data-cta="reader-prev"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <p className="text-xs text-[#1A1A1A]/60">
              Page {page + 1} / {total}
            </p>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={page === total - 1}
              className="jj-cta-champagne inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              data-cta="reader-next"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default GuideBookReader;
