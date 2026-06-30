import { useEffect, useMemo, useState, useRef, useLayoutEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Clock, Headphones, Target, List, X, Check, Sparkles, Trophy, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeHtml } from "@/utils/contentSanitizer";
import { useBookAudio } from "@/hooks/useBookAudio";
import { useEducationProgress } from "@/hooks/useEducationProgress";
import { toast } from "sonner";
import type { EducationBook, EducationModule } from "@/hooks/useBrokerEducation";
import { PremiumBookCover } from "@/components/books/PremiumBookCover";


type Page =
  | { kind: "cover"; book: EducationBook }
  | { kind: "toc"; modules: EducationModule[] }
  | { kind: "chapter-open"; module: EducationModule; moduleIndex: number }
  | { kind: "chapter-body"; module: EducationModule; html: string; partIndex: number; partCount: number; moduleIndex: number }
  | { kind: "back"; book: EducationBook };

// Split a chapter's HTML into page-sized chunks by measuring against an offscreen sizer.
function usePaginatedChapters(modules: EducationModule[]) {
  const [parts, setParts] = useState<Record<string, string[]>>({});
  const sizerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!modules.length) return;
    const sizer = sizerRef.current;
    if (!sizer) return;

    const result: Record<string, string[]> = {};
    for (const m of modules) {
      if (!m.content) {
        result[m.id] = [];
        continue;
      }
      const safe = sanitizeHtml(m.content);
      // Split on block-level boundaries (paragraphs, headings, lists, blockquotes, tables)
      const blocks = safe
        .split(/(?=<(?:h[1-6]|p|ul|ol|blockquote|table|pre|hr)[\s>])/i)
        .map((b) => b.trim())
        .filter(Boolean);

      const pages: string[] = [];
      let current = "";
      sizer.innerHTML = "";
      for (const block of blocks) {
        const test = current + block;
        sizer.innerHTML = test;
        if (sizer.scrollHeight > sizer.clientHeight && current) {
          pages.push(current);
          current = block;
          sizer.innerHTML = current;
          // If a single block overflows, still keep it on its own page
          if (sizer.scrollHeight > sizer.clientHeight) {
            pages.push(current);
            current = "";
          }
        } else {
          current = test;
        }
      }
      if (current.trim()) pages.push(current);
      result[m.id] = pages.length ? pages : [safe];
    }
    setParts(result);
  }, [modules]);

  return { parts, sizerRef };
}

export default function BookReader() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<EducationBook | null>(null);
  const [modules, setModules] = useState<EducationModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [tocOpen, setTocOpen] = useState(false);

  const audio = useBookAudio(bookId ?? null, book?.voice_enabled);
  const { parts, sizerRef } = usePaginatedChapters(modules);
  const { summary, startModule, completeModule } = useEducationProgress();
  const [completingId, setCompletingId] = useState<string | null>(null);

  // Track which modules the user has completed locally for instant UI feedback
  const [localCompleted, setLocalCompleted] = useState<Set<string>>(new Set());

  const handleComplete = async (mod: EducationModule) => {
    if (!bookId || completingId === mod.id || localCompleted.has(mod.id)) return;
    setCompletingId(mod.id);
    const res = await completeModule(bookId, mod.id);
    setCompletingId(null);
    if (res) {
      setLocalCompleted((s) => new Set(s).add(mod.id));
      toast.success(`+${res.awarded} points`, {
        description: `Lesson complete · ${res.total} total points`,
        icon: <Trophy className="w-4 h-4" />,
      });
    }
  };


  useEffect(() => {
    if (!bookId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [b, m] = await Promise.all([
        supabase.from("broker_education_books").select("*").eq("id", bookId).maybeSingle(),
        supabase
          .from("broker_education_modules")
          .select("*")
          .eq("book_id", bookId)
          .order("sort_order", { ascending: true }),
      ]);
      if (cancelled) return;
      setBook((b.data as EducationBook | null) ?? null);
      setModules((m.data as EducationModule[] | null) ?? []);
      setLoading(false);
      setPageIndex(0);
    })();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  const totalMinutes = useMemo(
    () => modules.reduce((s, m) => s + (m.estimated_minutes || 0), 0),
    [modules]
  );

  // Build the linear list of pages: cover → TOC → (chapter title page + N body pages)* → back
  const pages: Page[] = useMemo(() => {
    if (!book) return [];
    const list: Page[] = [{ kind: "cover", book }];
    if (modules.length) list.push({ kind: "toc", modules });
    modules.forEach((m, i) => {
      list.push({ kind: "chapter-open", module: m, moduleIndex: i });
      const chunks = parts[m.id] ?? [];
      chunks.forEach((html, p) =>
        list.push({
          kind: "chapter-body",
          module: m,
          html,
          partIndex: p,
          partCount: chunks.length,
          moduleIndex: i,
        })
      );
    });
    list.push({ kind: "back", book });
    return list;
  }, [book, modules, parts]);

  const totalPages = pages.length;
  const safeIndex = Math.min(pageIndex, Math.max(0, totalPages - 1));
  const current = pages[safeIndex];

  const goTo = (i: number) => {
    setDirection(i > safeIndex ? 1 : -1);
    setPageIndex(Math.max(0, Math.min(totalPages - 1, i)));
  };
  const next = () => goTo(safeIndex + 1);
  const prev = () => goTo(safeIndex - 1);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [safeIndex, totalPages]);

  // Mark a module as in-progress whenever its first body page is shown
  useEffect(() => {
    if (!bookId || !current) return;
    if (current.kind === "chapter-open" || current.kind === "chapter-body") {
      startModule(bookId, current.module.id);
    }
  }, [bookId, current, startModule]);

  // Current module from the visible page (used by the Mark Complete CTA)
  const currentModule: EducationModule | null =
    current && (current.kind === "chapter-open" || current.kind === "chapter-body")
      ? current.module
      : null;
  const isLastBodyOfModule =
    current?.kind === "chapter-body" && current.partIndex === current.partCount - 1;
  const currentDoneId = currentModule?.id;
  const currentIsDone = currentDoneId ? localCompleted.has(currentDoneId) : false;


  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B89555] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center gap-4">
        <p className="text-[#1A1A1A]/70">Book not found.</p>
        <Button asChild variant="secondary">
          <Link to="/broker/learning?tab=library">Back to Library</Link>
        </Button>
      </div>
    );
  }

  // Numbered "physical" pages start counting at the first chapter-open page
  const firstNumberedIdx = pages.findIndex(
    (p) => p.kind === "chapter-open" || p.kind === "chapter-body"
  );
  const physicalPageNumber =
    current && (current.kind === "chapter-open" || current.kind === "chapter-body")
      ? safeIndex - firstNumberedIdx + 1
      : null;
  const totalPhysicalPages = pages.filter(
    (p) => p.kind === "chapter-open" || p.kind === "chapter-body"
  ).length;

  // Index of a chapter's first page (the chapter-open card), used by the TOC jump
  const chapterStartIndex = (moduleId: string) =>
    pages.findIndex((p) => (p.kind === "chapter-open" || p.kind === "chapter-body") && p.module.id === moduleId);

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <SEOHead
        title={`${book.title} | Broker Learning | JBJ GLOBAL REAL ESTATE`}
        description={book.description || `${book.title} — JBJ broker learning module.`}
        canonicalPath={`/broker/learning/book/${book.id}`}
      />

      {/* Offscreen sizer used to measure chunk fit (same width/height as the page body area) */}
      <div
        ref={sizerRef}
        aria-hidden="true"
        className="prose prose-neutral max-w-none invisible pointer-events-none absolute -left-[9999px] top-0 px-10 py-8"
        style={{ width: "min(620px, 90vw)", height: "min(780px, 78vh)", overflow: "hidden" }}
      />

      {/* Top bar */}
      <div className="sticky top-[88px] z-30 bg-[#FDFBF7]/95 backdrop-blur border-b border-[#B89555]/20" data-gold-hairline>
        <div className="container mx-auto px-4 max-w-6xl py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/broker/learning?tab=library")}
            className="text-[#1A1A1A]/80 hover:text-[#1A1A1A]"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Library
          </Button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-[#1A1A1A]/60 truncate inline-flex items-center gap-1.5">
              <Lock className="w-3 h-3" /> {book.learning_path}
            </div>
            <div className="text-sm font-semibold text-[#1A1A1A] truncate">{book.title}</div>
          </div>
          {currentModule && (
            <Button
              size="sm"
              onClick={() => handleComplete(currentModule)}
              disabled={currentIsDone || completingId === currentModule.id}
              className={
                currentIsDone
                  ? "jj-surface-emerald hover:jj-surface-emerald text-white border border-[color:var(--emerald-1)]/30"
                  : isLastBodyOfModule
                    ? "jj-surface-emerald allow-white text-white hover:-translate-y-0.5 hover:brightness-110 border border-[#B89555]/50"
                    : "bg-[#EFE6D6] hover:bg-[#E5D8BD] text-[#1A1A1A] border border-[#B89555]/50"
              }
            >
              {currentIsDone ? (
                <><Check className="w-4 h-4 mr-1.5" /> Completed</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-1.5" /> Mark complete +10</>
              )}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setTocOpen((o) => !o)}
            className="text-[#1A1A1A]/80 hover:text-[#1A1A1A]"
          >
            <List className="w-4 h-4 mr-1.5" /> Contents
          </Button>

          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!audio.available}
                    className="bg-[#EFE6D6] hover:bg-[#E5D8BD] text-[#1A1A1A] border border-[#B89555]/40 disabled:opacity-60"
                  >
                    <Headphones className="w-4 h-4 mr-1.5" /> Listen
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {audio.available ? "Play narration" : "Voice narration coming soon"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Book stage — flat, no 3D hardcover frame */}
      <div className="relative container mx-auto px-4 max-w-5xl py-10 lg:py-14">
        <div className="relative mx-auto">
          {/* Flat page paper area */}
          <div
            className="relative bg-[#FBF6EC] rounded-2xl overflow-hidden mx-auto border border-[#B89555]/25 shadow-[0_18px_60px_-30px_rgba(0,0,0,0.35)]"
            style={{
              width: "min(720px, 96vw)",
              aspectRatio: "5 / 7",
            }}
            data-gold-hairline
          >
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={safeIndex}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 24 : -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -24 : 24 }}
                transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
                className="absolute inset-0"
              >
                {current?.kind === "cover" && (
                  <CoverFace
                    book={book}
                    totalChapters={modules.length}
                    totalMinutes={totalMinutes}
                    onOpen={next}
                  />
                )}

                {current?.kind === "toc" && (
                  <TocPage
                    modules={modules}
                    onJump={(idx) => goTo(idx)}
                    chapterStartIndex={chapterStartIndex}
                  />
                )}

                {current?.kind === "chapter-open" && (
                  <ChapterOpenPage module={current.module} moduleIndex={current.moduleIndex} />
                )}

                {current?.kind === "chapter-body" && (
                  <ChapterBodyPage
                    module={current.module}
                    html={current.html}
                    partIndex={current.partIndex}
                    partCount={current.partCount}
                  />
                )}

                {current?.kind === "back" && <BackCoverFace book={book} onRestart={() => goTo(0)} />}
              </motion.div>
            </AnimatePresence>

            {/* Page number footer */}
            {physicalPageNumber !== null && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
                <span className="text-[11px] tracking-widest text-[#1A1A1A]/55 font-medium">
                  {physicalPageNumber} / {totalPhysicalPages}
                </span>
              </div>
            )}
          </div>

          {/* Side nav buttons */}
          <button
            onClick={prev}
            disabled={safeIndex === 0}
            aria-label="Previous page"
            className="hidden md:flex absolute left-[-56px] top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#EFE6D6] border border-[#B89555]/40 items-center justify-center text-[#1A1A1A] hover:bg-[#E5D8BD] disabled:opacity-40 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            disabled={safeIndex >= totalPages - 1}
            aria-label="Next page"
            className="hidden md:flex absolute right-[-56px] top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#EFE6D6] border border-[#B89555]/40 items-center justify-center text-[#1A1A1A] hover:bg-[#E5D8BD] disabled:opacity-40 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex justify-between items-center mt-5 max-w-[720px] mx-auto">
          <Button variant="secondary" size="sm" onClick={prev} disabled={safeIndex === 0}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Prev
          </Button>
          <span className="text-xs text-[#1A1A1A]/60">
            {safeIndex + 1} / {totalPages}
          </span>
          <Button variant="secondary" size="sm" onClick={next} disabled={safeIndex >= totalPages - 1}>
            Next <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>

      {/* TOC drawer */}
      <AnimatePresence>
        {tocOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setTocOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-[min(380px,90vw)] bg-[#FDFBF7] border-l border-[#B89555]/30 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#B89555]/20" data-gold-hairline>
                <div className="text-sm font-semibold text-[#1A1A1A]">Table of Contents</div>
                <Button variant="ghost" size="icon" onClick={() => setTocOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-3">
                <button
                  onClick={() => {
                    goTo(0);
                    setTocOpen(false);
                  }}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-[#F7F2EA] text-[#1A1A1A]/80"
                >
                  Cover
                </button>
                {modules.map((m) => {
                  const idx = chapterStartIndex(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        if (idx >= 0) goTo(idx);
                        setTocOpen(false);
                      }}
                      className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-[#F7F2EA] text-[#1A1A1A]/85 flex items-start gap-3"
                    >
                      <span className="text-[10px] text-[#1A1A1A]/50 mt-1 w-6 inline-flex justify-center">
                        <Lock className="w-3 h-3" />
                      </span>
                      <span className="flex-1">{m.title}</span>
                    </button>
                  );
                })}
                <button
                  onClick={() => {
                    goTo(totalPages - 1);
                    setTocOpen(false);
                  }}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-[#F7F2EA] text-[#1A1A1A]/80 mt-1"
                >
                  Back Cover
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------- Page faces ------- */

function CoverFace({
  book,
  totalChapters,
  totalMinutes,
  onOpen,
}: {
  book: EducationBook;
  totalChapters: number;
  totalMinutes: number;
  onOpen: () => void;
}) {
  return (
    <div className="absolute inset-0">
      <PremiumBookCover
        title={book.title}
        tone="black"
        className="absolute inset-0"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/30" />
      <div className="absolute inset-0 flex flex-col justify-end p-7 md:p-9">
        <div className="allow-white inline-flex items-center gap-2 text-[10px] tracking-[0.3em] text-[#EFE6D6]/85 mb-3 uppercase">
          <Lock className="w-3 h-3" /> {book.learning_path}
        </div>
        <h1 className="allow-white text-white text-2xl md:text-3xl font-bold leading-tight mb-2 drop-shadow">
          {book.title}
        </h1>
        {book.description && (
          <p className="allow-white text-white/85 text-sm leading-relaxed line-clamp-3 mb-4 drop-shadow">
            {book.description}
          </p>
        )}
        <div className="flex items-center gap-4 text-[11px] text-[#EFE6D6]/90 mb-5">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> {totalChapters} chapters
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> ~{totalMinutes} min
          </span>
        </div>
        <div>
          <button
            onClick={onOpen}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#EFE6D6] text-[#1A1A1A] text-sm font-semibold border border-[#B89555]/50 hover:bg-[#E5D8BD] transition-colors"
          >
            Open Book <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function BackCoverFace({ book, onRestart }: { book: EducationBook; onRestart: () => void }) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-[#1c1812] via-[#2a2118] to-[#15110b] p-9 flex flex-col">
      <div className="text-[10px] tracking-[0.3em] text-[#EFE6D6]/80 uppercase mb-4">End of Book</div>
      <h2 className="allow-white text-white text-2xl font-bold leading-tight mb-3">{book.title}</h2>
      {book.learning_objective && (
        <p className="allow-white text-white/80 text-sm leading-relaxed mb-5">{book.learning_objective}</p>
      )}
      <div className="flex-1" />
      <div className="rounded-md border border-[#B89555]/40 bg-black/30 p-4 mb-5">
        <p className="allow-white text-white/85 text-xs leading-relaxed">
          Proprietary academy content — internal recognition only, not for external certification.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#EFE6D6] text-[#1A1A1A] text-sm font-semibold border border-[#B89555]/50 hover:bg-[#E5D8BD] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Cover
        </button>
      </div>
      <div className="mt-5 inline-flex items-center gap-2 text-[10px] tracking-[0.3em] text-[#EFE6D6]/60 uppercase">
        <Lock className="w-3 h-3" /> {book.learning_path}
      </div>
    </div>
  );
}

function TocPage({
  modules,
  onJump,
  chapterStartIndex,
}: {
  modules: EducationModule[];
  onJump: (i: number) => void;
  chapterStartIndex: (id: string) => number;
}) {
  return (
    <div className="absolute inset-0 px-10 py-10 overflow-auto">
      <div className="text-[10px] tracking-[0.3em] text-[#1A1A1A]/55 uppercase mb-2">Contents</div>
      <h2 className="text-[#1A1A1A] text-2xl font-bold mb-6">Table of Contents</h2>
      <ol className="space-y-2">
        {modules.map((m) => {
          const idx = chapterStartIndex(m.id);
          return (
            <li key={m.id}>
              <button
                onClick={() => idx >= 0 && onJump(idx)}
                className="w-full text-left flex items-baseline gap-3 px-2 py-2 rounded-md hover:bg-[#F2EADB] transition-colors"
              >
                <span className="text-[11px] text-[#1A1A1A]/55 w-7 inline-flex justify-center">
                  <Lock className="w-3 h-3" />
                </span>
                <span className="text-[#1A1A1A] text-sm font-medium flex-1">{m.title}</span>
                <span className="text-[11px] text-[#1A1A1A]/55">{m.estimated_minutes} min</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ChapterOpenPage({
  module,
}: {
  module: EducationModule;
  moduleIndex: number;
}) {
  return (
    <div className="absolute inset-0 px-10 py-12 flex flex-col">
      <div className="inline-flex items-center gap-2 text-[10px] tracking-[0.4em] text-[#B89555] uppercase mb-3">
        <Lock className="w-3 h-3" /> Chapter
      </div>
      <div
        className="h-px w-16 bg-[#B89555]/60 mb-5"
        data-gold-hairline
      />
      <h2 className="text-[#1A1A1A] text-3xl md:text-4xl font-bold leading-tight mb-4">
        {module.title}
      </h2>
      {module.description && (
        <p className="text-[#1A1A1A]/75 text-base leading-relaxed mb-6">{module.description}</p>
      )}
      <div className="flex items-center gap-2 text-[11px] text-[#1A1A1A]/60">
        <Target className="w-3.5 h-3.5" />
        <span className="uppercase tracking-widest">{module.estimated_minutes} min read</span>
      </div>
    </div>
  );
}

function ChapterBodyPage({
  module,
  html,
  partIndex,
  partCount,
}: {
  module: EducationModule;
  html: string;
  partIndex: number;
  partCount: number;
}) {
  return (
    <div className="absolute inset-0 px-10 py-8 overflow-hidden">
      <div className="flex items-center justify-between text-[10px] tracking-[0.3em] text-[#1A1A1A]/55 uppercase mb-4">
        <span className="truncate">{module.title}</span>
        {partCount > 1 && (
          <span className="ml-3 shrink-0">
            {partIndex + 1} / {partCount}
          </span>
        )}
      </div>
      <div
        className="prose prose-neutral max-w-none prose-headings:text-[#1A1A1A] prose-headings:font-bold prose-p:text-[#1A1A1A]/85 prose-strong:text-[#1A1A1A] prose-a:text-[#1A1A1A] prose-a:underline prose-li:text-[#1A1A1A]/85 prose-blockquote:border-l-[#B89555] prose-blockquote:bg-[#F2EADB] prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic prose-table:text-sm prose-th:bg-[#F2EADB] prose-th:text-[#1A1A1A] text-[15px] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
