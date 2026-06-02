import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X, ChevronLeft, ChevronRight, ListOrdered } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { BookData } from "@/types/books";
import { getBookTheme, getPageAccent } from "@/components/books/bookThemes";

interface GuideBookReaderProps {
  book: BookData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialChapterIndex?: number;
}

/**
 * Premium paginated book reader with per-book neon themes + 3D page-turn.
 * One chapter per page. Keyboard ← → navigates.
 */
export function GuideBookReader({
  book,
  open,
  onOpenChange,
  initialChapterIndex = 0,
}: GuideBookReaderProps) {
  const [page, setPage] = useState(initialChapterIndex);
  const [dir, setDir] = useState<1 | -1>(1);
  const [showToc, setShowToc] = useState(false);

  const theme = useMemo(() => getBookTheme(book), [book]);
  const chapters = book.tableOfContents;
  const total = chapters.length;
  const current = chapters[page];
  const accent = getPageAccent(theme, page);

  useEffect(() => {
    if (open) {
      setPage(Math.min(Math.max(0, initialChapterIndex), total - 1));
      setShowToc(false);
      setDir(1);
    }
  }, [open, initialChapterIndex, total]);

  const go = useCallback(
    (delta: number) => {
      setDir(delta > 0 ? 1 : -1);
      setPage((p) => Math.min(Math.max(0, p + delta), total - 1));
    },
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
        data-no-contrast-guard
      >
        <div
          className="relative w-full h-full rounded-2xl overflow-hidden border"
          style={{
            background: `radial-gradient(120% 80% at 50% -10%, ${accent}22, transparent 60%), linear-gradient(180deg, ${theme.bg} 0%, #050608 100%)`,
            borderColor: `${accent}55`,
            boxShadow: `0 40px 120px -20px ${theme.glow}, inset 0 0 0 1px rgba(255,255,255,0.04)`,
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{
              borderColor: `${accent}33`,
              background: `linear-gradient(90deg, ${theme.bg}cc, transparent)`,
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg"
                style={{ background: `${accent}1a`, border: `1px solid ${accent}55`, boxShadow: `0 0 24px ${accent}55` }}
              >
                <BookOpen className="w-4 h-4" style={{ color: accent }} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: theme.eyebrow }}>
                  {book.title}
                </p>
                <p
                  className="text-base font-semibold truncate text-white"
                  style={{ fontFamily: theme.fontDisplay }}
                >
                  {current?.title}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowToc((v) => !v)}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md text-white"
                style={{ background: `${accent}14`, border: `1px solid ${accent}66` }}
                data-cta="reader-toc"
                aria-label="Chapters"
              >
                <ListOrdered className="w-4 h-4" />
                <span className="hidden sm:inline">Chapters</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center justify-center w-9 h-9 rounded-md text-white"
                style={{ background: `${accent}14`, border: `1px solid ${accent}66` }}
                data-cta="reader-close"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="relative h-[calc(100%-72px-64px)] overflow-hidden" style={{ perspective: "1800px" }}>
            <AnimatePresence>
              {showToc && (
                <motion.aside
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "tween", duration: 0.25 }}
                  className="absolute inset-y-0 left-0 w-72 max-w-[80%] z-10 overflow-y-auto"
                  style={{
                    background: `linear-gradient(180deg, ${theme.bg}f5, #050608f5)`,
                    borderRight: `1px solid ${accent}40`,
                  }}
                >
                  <ul className="p-3 space-y-1">
                    {chapters.map((ch, i) => {
                      const a = getPageAccent(theme, i);
                      const active = i === page;
                      return (
                        <li key={i}>
                          <button
                            type="button"
                            onClick={() => {
                              setDir(i > page ? 1 : -1);
                              setPage(i);
                              setShowToc(false);
                            }}
                            className="w-full text-left flex items-start gap-3 p-3 rounded-lg transition text-white"
                            style={{
                              background: active ? `${a}1f` : "transparent",
                              border: active ? `1px solid ${a}80` : "1px solid transparent",
                              boxShadow: active ? `0 0 24px ${a}33` : "none",
                            }}
                          >
                            <span
                              className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold flex-shrink-0"
                              style={{
                                background: `${a}1a`,
                                border: `1px solid ${a}66`,
                                color: a,
                              }}
                            >
                              {i + 1}
                            </span>
                            <span className="text-sm font-medium leading-snug">{ch.title}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </motion.aside>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait" initial={false}>
              <motion.article
                key={page}
                initial={{ opacity: 0, rotateY: dir > 0 ? 35 : -35, x: dir > 0 ? 80 : -80 }}
                animate={{ opacity: 1, rotateY: 0, x: 0 }}
                exit={{ opacity: 0, rotateY: dir > 0 ? -25 : 25, x: dir > 0 ? -60 : 60 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformStyle: "preserve-3d", transformOrigin: dir > 0 ? "left center" : "right center" }}
                className="h-full overflow-y-auto px-6 sm:px-10 md:px-16 py-8 md:py-12"
              >
                <div className="max-w-3xl mx-auto">
                  <p
                    className="text-[10px] uppercase tracking-[0.28em] mb-3"
                    style={{ color: accent, textShadow: `0 0 14px ${accent}80` }}
                  >
                    Chapter {page + 1} of {total}
                    {current?.duration ? ` · ${current.duration} read` : ""}
                  </p>
                  <h3
                    className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight"
                    style={{ fontFamily: theme.fontDisplay, textShadow: `0 2px 30px ${accent}40` }}
                  >
                    {current?.title}
                  </h3>
                  <div
                    className="h-px w-24 mb-8"
                    style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
                  />
                  {current?.summary ? (
                    <p className="text-base md:text-lg leading-relaxed mb-6 text-white/90">
                      {current.summary}
                    </p>
                  ) : (
                    <p className="text-base leading-relaxed mb-6 italic text-white/60">
                      Detailed content for this chapter will be added shortly.
                    </p>
                  )}
                  {current?.bullets && current.bullets.length > 0 && (
                    <ul className="space-y-3 mb-6">
                      {current.bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span
                            className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: accent, boxShadow: `0 0 10px ${accent}` }}
                          />
                          <span className="text-white/90 leading-relaxed">{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {current?.callout && (
                    <div
                      className="mt-8 rounded-xl p-5"
                      style={{
                        background: `${accent}10`,
                        border: `1px solid ${accent}55`,
                        boxShadow: `inset 0 0 30px ${accent}10`,
                      }}
                    >
                      <p
                        className="text-[10px] uppercase tracking-[0.24em] mb-1"
                        style={{ color: accent }}
                      >
                        {current.callout.label}
                      </p>
                      <p className="text-sm leading-relaxed text-white/90">{current.callout.body}</p>
                    </div>
                  )}
                </div>
              </motion.article>
            </AnimatePresence>
          </div>

          {/* Footer pager */}
          <div
            className="absolute inset-x-0 bottom-0 h-16 flex items-center justify-between gap-4 px-6 border-t"
            style={{
              borderColor: `${accent}33`,
              background: `linear-gradient(180deg, transparent, ${theme.bg}cc)`,
            }}
          >
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={page === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: `${accent}14`, border: `1px solid ${accent}66` }}
              data-cta="reader-prev"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1">
                {chapters.map((_, i) => (
                  <span
                    key={i}
                    className="block h-1 rounded-full transition-all"
                    style={{
                      width: i === page ? 18 : 6,
                      background: i === page ? getPageAccent(theme, i) : "rgba(255,255,255,0.2)",
                      boxShadow: i === page ? `0 0 10px ${getPageAccent(theme, i)}` : "none",
                    }}
                  />
                ))}
              </div>
              <p className="text-xs text-white/70">
                Page {page + 1} / {total}
              </p>
            </div>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={page === total - 1}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md text-white disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${theme.accent2})`,
                boxShadow: `0 6px 24px ${accent}55`,
              }}
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
