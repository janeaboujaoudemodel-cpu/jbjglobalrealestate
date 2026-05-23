import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Clock, Headphones, Sparkles, Target, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeHtml } from "@/utils/contentSanitizer";
import { useBookAudio } from "@/hooks/useBookAudio";
import type { EducationBook, EducationModule } from "@/hooks/useBrokerEducation";

const PATH_BADGE: Record<string, string> = {
  Foundations: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  "Buyer & Investor Advisory": "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  "Seller & Landlord Advisory": "bg-amber-500/10 text-amber-700 border-amber-500/30",
  "Market Intelligence": "bg-purple-500/10 text-purple-700 border-purple-500/30",
  "Advanced (Restricted)": "bg-red-500/10 text-red-700 border-red-500/30",
  "Professional Development": "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/40",
};

export default function BookReader() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<EducationBook | null>(null);
  const [modules, setModules] = useState<EducationModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const audio = useBookAudio(bookId ?? null, book?.voice_enabled);

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
    })();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  const totalMinutes = useMemo(
    () => modules.reduce((s, m) => s + (m.estimated_minutes || 0), 0),
    [modules]
  );

  useEffect(() => {
    const ids = modules.map((m) => `module-${m.id}`);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveId(e.target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [modules]);

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

  const badgeClass = PATH_BADGE[book.learning_path] || "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/40";

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <SEOHead
        title={`${book.title} | Broker Learning | JBJ GLOBAL REAL ESTATE`}
        description={book.description || `${book.title} — JBJ broker learning module.`}
        canonicalPath={`/broker/learning/book/${book.id}`}
      />

      {/* Top bar */}
      <div className="sticky top-[88px] z-30 bg-[#FDFBF7]/95 backdrop-blur border-b border-[#B89555]/20" data-gold-hairline>
        <div className="container mx-auto px-4 max-w-6xl py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/broker/learning?tab=library")}
            className="text-[#1A1A1A]/80 hover:text-[#1A1A1A]">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Library
          </Button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-[#1A1A1A]/60 truncate">Book {book.book_number} · {book.learning_path}</div>
            <div className="text-sm font-semibold text-[#1A1A1A] truncate">{book.title}</div>
          </div>
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
                    <Headphones className="w-4 h-4 mr-1.5" />
                    {audio.available ? "Listen" : "Listen"}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {audio.available
                  ? "Play narration"
                  : "Voice narration coming soon"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl py-8 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        {/* Sticky TOC */}
        <aside className="hidden lg:block">
          <div className="sticky top-[160px]">
            <div className="text-[11px] uppercase tracking-widest text-[#1A1A1A]/60 mb-3">Table of Contents</div>
            <nav className="space-y-1">
              {modules.map((m) => {
                const id = `module-${m.id}`;
                const isActive = activeId === id;
                return (
                  <a
                    key={m.id}
                    href={`#${id}`}
                    className={[
                      "block text-sm px-3 py-2 rounded-lg border transition-colors",
                      isActive
                        ? "bg-[#EFE6D6] border-[#B89555]/50 text-[#1A1A1A]"
                        : "border-transparent text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#F7F2EA]",
                    ].join(" ")}
                  >
                    <span className="text-[10px] text-[#1A1A1A]/50 mr-2">{String(m.module_number).padStart(2, "0")}</span>
                    {m.title}
                  </a>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Reader column */}
        <article className="min-w-0">
          <motion.header
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <Badge className={`${badgeClass} mb-3`}>
              <Sparkles className="w-3 h-3 mr-1" /> {book.learning_path}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] leading-tight mb-3">
              {book.title}
            </h1>
            {book.description && (
              <p className="text-[#1A1A1A]/70 text-base leading-relaxed mb-5">{book.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-5 text-sm text-[#1A1A1A]/70">
              <span className="inline-flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{modules.length} modules</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4" />~{totalMinutes} min</span>
            </div>
            {book.learning_objective && (
              <div className="mt-6 rounded-xl border border-[#B89555]/30 bg-[#F7F2EA] p-4">
                <div className="flex items-center gap-2 text-[#1A1A1A] font-semibold text-sm mb-1">
                  <Target className="w-4 h-4" /> Learning Objective
                </div>
                <p className="text-[#1A1A1A]/80 text-sm leading-relaxed">{book.learning_objective}</p>
              </div>
            )}
            <Progress value={0} className="mt-6 h-1.5" />
          </motion.header>

          <div className="space-y-12">
            {modules.length === 0 && (
              <div className="rounded-xl border border-[#B89555]/30 bg-[#F7F2EA] p-8 text-center text-[#1A1A1A]/70">
                Content for this book is being curated.
              </div>
            )}
            {modules.map((m, i) => (
              <section
                key={m.id}
                id={`module-${m.id}`}
                className="scroll-mt-[180px]"
                aria-labelledby={`heading-${m.id}`}
              >
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#1A1A1A]/60 mb-2">
                  <ChevronRight className="w-3 h-3" />
                  Chapter {String(m.module_number).padStart(2, "0")} · {m.estimated_minutes} min read
                </div>
                <h2 id={`heading-${m.id}`} className="text-2xl md:text-3xl font-bold text-[#1A1A1A] leading-tight mb-2">
                  {m.title}
                </h2>
                {m.description && (
                  <p className="text-[#1A1A1A]/70 text-base mb-5">{m.description}</p>
                )}
                {m.content ? (
                  <div
                    className="prose prose-neutral max-w-none prose-headings:text-[#1A1A1A] prose-p:text-[#1A1A1A]/85 prose-strong:text-[#1A1A1A] prose-a:text-[#1A1A1A] prose-a:underline prose-li:text-[#1A1A1A]/85 prose-blockquote:border-l-[#B89555] prose-blockquote:bg-[#F7F2EA] prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic prose-table:text-sm prose-th:bg-[#F7F2EA] prose-th:text-[#1A1A1A]"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(m.content) }}
                  />
                ) : (
                  <div className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-4 text-sm text-[#1A1A1A]/70">
                    Module content is being curated.
                  </div>
                )}
                {i < modules.length - 1 && (
                  <div className="mt-10 border-t border-[#B89555]/25" data-gold-hairline />
                )}
              </section>
            ))}
          </div>

          <footer className="mt-16 rounded-xl border border-[#B89555]/30 bg-[#F7F2EA] p-5 text-center">
            <p className="text-[#1A1A1A]/70 text-xs">
              Proprietary to JBJ GLOBAL REAL ESTATE — internal recognition only, not for external certification.
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}
