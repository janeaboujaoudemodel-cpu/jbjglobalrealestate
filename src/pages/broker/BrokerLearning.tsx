import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  GraduationCap, BookOpen, Lock, BarChart3, MessageSquare, Shield,
  CheckCircle, Clock, Play, ChevronRight, ChevronLeft, Award, X, Check,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IconTile } from "@/components/ui/icon-tile";
import { useAuth } from "@/contexts/AuthContext";
import { useUserModeContext } from "@/contexts/UserModeContext";
import { useBrokerEducation, EducationBook } from "@/hooks/useBrokerEducation";
import { Book3DCard, BookDetailModal } from "@/components/broker-education";
import { PremiumBook3DStyles } from "@/components/broker-education/PremiumBook3D";
import { CertificatePreview } from "@/components/certification";
import BrokerCertificationGate from "@/components/broker-education/BrokerCertificationGate";
import { PremiumLockBadge } from "@/components/broker-education/PremiumLock";
import { useEducationProgress } from "@/hooks/useEducationProgress";
import { useCreateBrokerRequest } from "@/hooks/useBrokerRequests";
import AcademyAccessRequestModal from "@/components/broker-education/AcademyAccessRequestModal";
import { BROKER_LESSONS } from "./brokerLessonContent";




// ────────────────────────────────────────────────────────────────────────────
// Training modules (portal-native, no full-bleed marketing chrome)
// ────────────────────────────────────────────────────────────────────────────
type ModuleCat = "foundational" | "practical" | "advanced" | "compliance";
interface TModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  lessons: number;
  category: ModuleCat;
  icon: React.ReactNode;
  topics: string[];
  progress?: number;
}

const TRAINING: TModule[] = [
  {
    id: "reading-market",
    title: "Reading the Market",
    description: "Learn how to interpret market trends and explain data to clients confidently.",
    duration: "45 min", lessons: 6, category: "foundational",
    icon: <BarChart3 className="w-5 h-5" />,
    topics: [
      "How to interpret market trends",
      "What data can and cannot say",
      "How to explain trends to clients",
      "Reading demand vs supply signals",
    ],
    progress: 0,
  },
  {
    id: "rent-conversations",
    title: "RENT Conversations",
    description: "Master the art of discussing rent trends and handling tenant/landlord inquiries.",
    duration: "35 min", lessons: 5, category: "practical",
    icon: <MessageSquare className="w-5 h-5" />,
    topics: ["Explaining rent trends clearly", "Handling client hesitation", "Area-specific narratives"],
    progress: 0,
  },
  {
    id: "buy-vs-rent",
    title: "BUY vs RENT Context",
    description: "Understand when to guide clients toward different transaction types.",
    duration: "30 min", lessons: 4, category: "advanced",
    icon: <BarChart3 className="w-5 h-5" />,
    topics: ["When rent demand is stronger", "When sale demand is slower", "Market timing conversations"],
    progress: 0,
  },
  {
    id: "compliance-language",
    title: "Compliance & Language Guardrails",
    description: "Learn the critical difference between insight and advice to stay compliant.",
    duration: "25 min", lessons: 4, category: "compliance",
    icon: <Shield className="w-5 h-5" />,
    topics: ["Words brokers must NOT use", "Difference between 'insight' and 'advice'", "Approved phrasing examples"],
    progress: 0,
  },
];

const NEVER_SAY = [
  "guaranteed returns", "sure investment", "prices will definitely",
  "you should buy now", "this is the best time", "I predict", "I promise", "100% ROI",
];
const ALWAYS_USE = [
  "Based on recent data…", "Historical trends indicate…", "Market activity suggests…",
  "According to official Open Data…", "The data shows…", "This area has experienced…",
];

const CAT_LABEL: Record<ModuleCat, string> = {
  foundational: "Foundational", practical: "Practical", advanced: "Advanced", compliance: "Compliance",
};

const LEARNING_PATH_ORDER = [
  "Foundations",
  "Buyer & Investor Advisory",
  "Seller & Landlord Advisory",
  "Market Intelligence",
  "Advanced (Restricted)",
] as const;

const getLearningPathRank = (path: string) =>
  LEARNING_PATH_ORDER.findIndex((item) => item === path);

// ────────────────────────────────────────────────────────────────────────────

export default function BrokerLearning() {
  const { user } = useAuth();
  const { mode } = useUserModeContext();

  const { books, loading, progressMap } = useBrokerEducation();
  const { summary: eduSummary } = useEducationProgress();
  const createAccessRequest = useCreateBrokerRequest();

  const [selectedBook, setSelectedBook] = useState<EducationBook | null>(null);
  const [activeModule, setActiveModule] = useState<TModule | null>(null);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [moduleProgress, setModuleProgress] = useState<Record<string, number>>({});
  const [accessRequestItem, setAccessRequestItem] = useState<{ id: string; title: string; type: "module" | "book" } | null>(null);

  const openModule = (m: TModule) => {
    setActiveModule(m);
    setLessonIndex(0);
  };
  const closeModule = () => {
    setActiveModule(null);
    setLessonIndex(0);
  };

  const requestAcademyAccess = (item: { id: string; title: string }, itemType: "module" | "book") => {
    setAccessRequestItem({ id: item.id, title: item.title, type: itemType });
  };


  const sortedBooks = useMemo(() => {
    return [...books].sort((a, b) => {
      const ai = getLearningPathRank(a.learning_path || "Other");
      const bi = getLearningPathRank(b.learning_path || "Other");

      if (ai !== bi) {
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      }

      return (
        (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
        (a.book_number ?? 0) - (b.book_number ?? 0) ||
        a.title.localeCompare(b.title)
      );
    });
  }, [books]);

  const bookRows = useMemo(() => {
    const rows: EducationBook[][] = [];
    for (let i = 0; i < sortedBooks.length; i += 3) {
      rows.push(sortedBooks.slice(i, i + 3));
    }
    return rows;
  }, [sortedBooks]);

  const totalProgress =
    TRAINING.reduce((acc, m) => acc + (moduleProgress[m.id] ?? m.progress ?? 0), 0) /
    TRAINING.length;
  const allModulesComplete =
    eduSummary.is_certified ||
    TRAINING.every((m) => (moduleProgress[m.id] ?? m.progress ?? 0) >= 100);

  const certificatesEarned = TRAINING.filter(
    (m) => (moduleProgress[m.id] ?? m.progress ?? 0) >= 100,
  ).length;

  return (
    <div className="w-full bg-[#FDFBF7]">
      <SEOHead
        title="Broker Academy | JBJ GLOBAL REAL ESTATE"
        description="Internal JBJ Broker Academy — book library, training modules, certification and compliance reference."
        noIndex
      />

        <PremiumBook3DStyles />
        <div className="w-full px-4 lg:px-8 pt-6 pb-16 flex flex-col gap-14">
        {/* ── Header (centered) ────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col items-center text-center gap-4 max-w-5xl mx-auto w-full"
        >
          <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40">
            <GraduationCap className="w-3 h-3 mr-1" /> Internal use only · Broker Academy
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-[#1A1A1A] leading-tight">JBJ Broker Academy</h1>
          <p className="text-[#1A1A1A]/70 max-w-3xl mx-auto">
            One home for everything JBJ brokers learn — the internal book library, market-intelligence training,
            and the compliance reference, with progress tracked across the portal.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 items-stretch w-full">
            <KpiCard tone="gold" icon={BookOpen} label="Library books" value={books.length || "—"} />
            <KpiCard tone="emerald" icon={GraduationCap} label="Training modules" value={TRAINING.length} />
            <KpiCard
              tone="amber"
              icon={Award}
              label="Your training"
              value={`${Math.round(totalProgress)}%`}
              progress={totalProgress}
            />
          </div>
        </motion.header>



        {/* ── Training ─────────────────────────────────────────────── */}
        <section className="flex flex-col gap-6">
          <SectionTitle eyebrow="Market Intelligence" title="Training Modules" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {TRAINING.map((m) => (
              <TrainingCard
                key={m.id}
                m={{ ...m, progress: moduleProgress[m.id] ?? m.progress }}
                onStart={() => openModule(m)}
                locked
                lockReason="Request academy access to unlock"
                onRequestAccess={() => requestAcademyAccess(m, "module")}
                requestAccessDisabled={createAccessRequest.isPending}
              />
            ))}
          </div>
        </section>

        {/* ── Library ──────────────────────────────────────────────── */}
        <section className="flex flex-col gap-6">
          <SectionTitle eyebrow="Internal Library" title="Books & Learning Paths" />
          {loading ? (
            <div className="py-10 grid place-items-center">
              <div className="w-8 h-8 border-2 border-[#B89555] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sortedBooks.length === 0 ? (
            <div className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/30 px-6 py-10 text-center text-[#1A1A1A]/70">
              Your library is loading or empty. Check back shortly.
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {bookRows.map((row, rowIndex) => (
                <div key={`book-row-${rowIndex}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {row.map((book, i) => (
                    <Book3DCard
                      key={book.id}
                      book={book}
                      progress={progressMap[book.id]}
                      onOpen={() => setSelectedBook(book)}
                      onRequestAccess={() => requestAcademyAccess(book, "book")}
                      requestAccessDisabled={createAccessRequest.isPending}
                      index={rowIndex * 3 + i}
                      isLocked
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Compliance reference ─────────────────────────────────── */}
        <section className="flex flex-col gap-6">
          <SectionTitle eyebrow="Compliance" title="Quick Reference" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ReferenceCard
              title="NEVER Say"
              tone="red"
              icon={<Shield className="w-4 h-4" />}
              items={NEVER_SAY.map((p) => `"${p}"`)}
            />
            <ReferenceCard
              title="ALWAYS Use"
              tone="emerald"
              icon={<CheckCircle className="w-4 h-4" />}
              items={ALWAYS_USE.map((p) => `"${p}"`)}
            />
          </div>

          <Card className="bg-[#F7F2EA] border-[#B89555]/30">
            <CardContent className="p-6 md:p-8">
              <h3 className="text-[#1A1A1A] text-lg font-bold mb-5 text-center">Golden Rules for Market Conversations</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { n: 1, t: "Describe, Don't Predict", d: "Explain what data shows, never what will happen." },
                  { n: 2, t: "Insight, Not Advice",     d: "Share market context, let clients decide." },
                  { n: 3, t: "Cite Sources",            d: "Always reference Open Data origins." },
                ].map(({ n, t, d }) => (
                  <div key={n} className="text-center">
                    <div className="w-11 h-11 rounded-full bg-[#EFE6D6] border border-[#B89555]/50 grid place-items-center mx-auto mb-3">
                      <span className="text-[#1A1A1A] font-bold">{n}</span>
                    </div>
                    <p className="text-[#1A1A1A] font-semibold mb-1">{t}</p>
                    <p className="text-[#1A1A1A]/70 text-sm">{d}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── Certificates & Progress ──────────────────────────────── */}
        <section className="flex flex-col gap-6 pb-2">
          <SectionTitle eyebrow="Your Record" title="Certificates & Progress" />

          {/* Top row — KPI tiles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/30 p-6" data-gold-hairline>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/65">
                <span className="grid place-items-center w-6 h-6 rounded-md bg-[#EFE6D6] border border-[#B89555]/40">
                  <Award className="w-3.5 h-3.5 text-[#1A1A1A]" />
                </span>
                Certificates earned
              </div>
              <div className="mt-3 text-3xl font-bold text-[#1A1A1A] tabular-nums">
                {certificatesEarned}
              </div>
              <p className="mt-1 text-xs text-[#1A1A1A]/60">
                Complete every lesson in a module to earn its certificate. Certificates appear here automatically and can be downloaded from your Account.
              </p>
            </div>
            <div className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/30 p-6" data-gold-hairline>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/65">
                <span className="grid place-items-center w-6 h-6 rounded-md bg-[#EFE6D6] border border-[#B89555]/40">
                  <GraduationCap className="w-3.5 h-3.5 text-[#1A1A1A]" />
                </span>
                Training progress
              </div>
              <div className="mt-3 text-3xl font-bold text-[#1A1A1A] tabular-nums">{Math.round(totalProgress)}%</div>
              <Progress value={totalProgress} className="h-1.5 w-full mt-3 bg-[#FDFBF7] [&>div]:bg-[#B89555]" />
              <p className="mt-2 text-xs text-[#1A1A1A]/60">
                Across {TRAINING.length} core modules. Resume any module above.
              </p>
            </div>
            <div className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/30 p-6" data-gold-hairline>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/65">
                <span className="grid place-items-center w-6 h-6 rounded-md bg-[#EFE6D6] border border-[#B89555]/40">
                  <BookOpen className="w-3.5 h-3.5 text-[#1A1A1A]" />
                </span>
                Books in progress
              </div>
              <div className="mt-3 text-3xl font-bold text-[#1A1A1A] tabular-nums">
                {Object.values(progressMap || {}).filter((p: any) => p && p.progress_pct > 0 && p.progress_pct < 100).length}
              </div>
              <p className="mt-1 text-xs text-[#1A1A1A]/60">
                Pick any book back up — your last page is remembered.
              </p>
            </div>
          </div>

          {/* Certificate panel — locked until all training modules complete */}
          <div className="relative">
            {!allModulesComplete && (
              <div className="pointer-events-none absolute top-3 right-3 z-20">
                <PremiumLockBadge
                  size="sm"
                  title="Complete every training module to unlock your certificate"
                />
              </div>
            )}
            <CertificatePreview isLocked={!allModulesComplete} />
          </div>
        </section>

        {/* Certification gate — broker request + AI quiz + anti-cheat */}
        <section className="max-w-5xl mx-auto w-full">
          <BrokerCertificationGate />
        </section>



        <BookDetailModal
          book={selectedBook}
          isOpen={!!selectedBook}
          onClose={() => setSelectedBook(null)}
          isLocked
        />

        <Dialog open={!!activeModule} onOpenChange={(o) => !o && closeModule()}>
          <DialogContent className="max-w-2xl bg-[#FDFBF7] border-[#B89555]/40 max-h-[88vh] overflow-y-auto">
            {activeModule && (() => {
              const lessons = BROKER_LESSONS[activeModule.id] ?? [];
              const total = lessons.length || activeModule.lessons;
              const safeIndex = Math.min(lessonIndex, Math.max(total - 1, 0));
              const lesson = lessons[safeIndex];
              const isLast = safeIndex >= total - 1;
              const pct = total > 0 ? Math.round(((safeIndex + 1) / total) * 100) : 0;
              return (
                <>
                  <DialogHeader>
                    <div className="flex items-start gap-3">
                      <div
                        className="jj-surface-emerald shrink-0 w-12 h-12 rounded-xl grid place-items-center"
                        data-surface="emerald"
                        data-emerald-ok="icon"
                      >
                        {activeModule.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/50 font-semibold mb-2">
                          {CAT_LABEL[activeModule.category]}
                        </Badge>
                        <DialogTitle className="text-xl text-[#1A1A1A] leading-tight">
                          {activeModule.title}
                        </DialogTitle>
                        <div className="flex items-center gap-3 mt-2 text-xs text-[#1A1A1A]/70 flex-wrap">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{activeModule.duration}</span>
                          <span>{total} lessons</span>
                          <span className="flex items-center gap-1"><Award className="w-3 h-3" />+50 pts on completion</span>
                        </div>
                      </div>
                    </div>
                  </DialogHeader>

                  {/* Lesson progress */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[11px] text-[#1A1A1A]/65 mb-1.5 uppercase tracking-[0.18em]">
                      <span>Lesson {safeIndex + 1} of {total}</span>
                      <span>{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5 bg-[#EFE6D6] [&>div]:bg-[#B89555]" />
                  </div>

                  {/* Lesson body */}
                  {lesson ? (
                    <div className="mt-4 rounded-xl border border-[#B89555]/30 bg-[#F7F2EA] p-5">
                      <h3 className="text-[#1A1A1A] font-bold text-base leading-tight">{lesson.title}</h3>
                      <p className="text-sm text-[#1A1A1A]/85 mt-2 leading-relaxed">{lesson.body}</p>

                      {lesson.bullets && lesson.bullets.length > 0 && (
                        <ul className="mt-3 space-y-1.5">
                          {lesson.bullets.map((b, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-[#1A1A1A]/85">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#B89555] shrink-0" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {lesson.doAndDont && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                          <div className="rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] p-3">
                            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-[#1F5132] font-semibold mb-1.5">
                              <Check className="w-3.5 h-3.5" /> Always
                            </div>
                            <ul className="space-y-1 text-xs text-[#1A1A1A]/85">
                              {lesson.doAndDont.do.map((d, i) => <li key={i}>“{d}”</li>)}
                            </ul>
                          </div>
                          <div className="rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] p-3">
                            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-[#7A1F1F] font-semibold mb-1.5">
                              <X className="w-3.5 h-3.5" /> Never
                            </div>
                            <ul className="space-y-1 text-xs text-[#1A1A1A]/85">
                              {lesson.doAndDont.dont.map((d, i) => <li key={i}>“{d}”</li>)}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-[#1A1A1A]/70 mt-4">
                      Lesson content for this module is being prepared.
                    </p>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between gap-2 pt-4">
                    <Button
                      variant="ghost"
                      onClick={closeModule}
                      className="text-[#1A1A1A]"
                    >
                      Close
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setLessonIndex((i) => Math.max(0, i - 1))}
                        disabled={safeIndex === 0}
                        className="border-[#B89555]/50 text-[#1A1A1A] hover:bg-[#EFE6D6]"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                      </Button>
                      {!isLast ? (
                        <button
                          type="button"
                          onClick={() => setLessonIndex((i) => i + 1)}
                          className="jj-surface-emerald inline-flex items-center gap-1.5 h-10 px-4 rounded-md font-semibold hover:-translate-y-0.5 hover:brightness-110 transition-all"
                          data-surface="emerald"
                          data-emerald-ok="button"
                        >
                          <span>Next lesson</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setModuleProgress((p) => ({ ...p, [activeModule.id]: 100 }));
                            closeModule();
                          }}
                          className="jj-surface-emerald inline-flex items-center gap-1.5 h-10 px-4 rounded-md font-semibold hover:-translate-y-0.5 hover:brightness-110 transition-all"
                          data-surface="emerald"
                          data-emerald-ok="button"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Mark complete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>

        <AcademyAccessRequestModal
          open={!!accessRequestItem}
          onOpenChange={(v) => { if (!v) setAccessRequestItem(null); }}
          item={accessRequestItem}
        />
      </div>
    </div>
  );
}



// ────────────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────────────

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/55">{eyebrow}</div>
      <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">{title}</h2>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  progress,
  tone = "gold",
}: {
  icon: import("lucide-react").LucideIcon;
  label: string;
  value: React.ReactNode;
  progress?: number;
  tone?: "gold" | "blue" | "amber" | "emerald" | "red" | "ink" | "purple" | "rose";
}) {
  return (
    <div className="min-h-[202px] rounded-2xl bg-gradient-to-br from-[#F7F2EA] via-[#EFE6D6] to-[#F7F2EA] border border-[#B89555]/55 p-6 flex flex-col items-center text-center shadow-[0_4px_14px_rgba(184,149,85,0.12)] hover:shadow-[0_14px_30px_rgba(184,149,85,0.22)] transition-all">
      <IconTile tone={tone as any} size="lg" icon={Icon} />
      <div className="mt-4 h-4 flex items-center justify-center text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/75 whitespace-nowrap font-semibold">{label}</div>
      <div className="mt-3 h-10 flex items-center justify-center text-4xl font-bold text-[#1A1A1A] leading-none tabular-nums">{value}</div>
      {typeof progress === "number" && (
        <Progress value={progress} className="h-1.5 w-full mt-5 bg-[#FDFBF7] [&>div]:bg-[#B89555]" />
      )}
    </div>
  );
}


function TrainingCard({
  m,
  onStart,
  locked = false,
  lockReason,
  onRequestAccess,
  requestAccessDisabled = false,
}: {
  m: TModule;
  onStart: () => void;
  locked?: boolean;
  lockReason?: string;
  onRequestAccess?: () => void;
  requestAccessDisabled?: boolean;
}) {
  return (
    <Card className={`relative overflow-hidden bg-gradient-to-br from-[#F7F2EA] via-[#EFE6D6] to-[#F7F2EA] border-[#B89555]/55 ${locked ? "" : "hover:border-[#B89555]/80"} transition-all min-h-[260px] shadow-[0_4px_14px_rgba(184,149,85,0.10)] ${locked ? "" : "hover:shadow-[0_14px_30px_rgba(184,149,85,0.20)]"}`}>
      <CardContent className={`p-5 md:p-6 flex flex-col h-full ${locked ? "opacity-90 pb-12" : ""}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div
              data-icon-tile=""
              data-surface="emerald"
              className="allow-white shrink-0 w-12 h-12 rounded-xl jj-icon-tile-emerald grid place-items-center shadow-[0_10px_24px_-14px_rgba(6,78,59,0.65)] [&_svg]:!text-white [&_svg]:!stroke-white"
            >
              {m.icon}
            </div>
            <div className="min-w-0">
              <h3 className="text-[#1A1A1A] font-bold text-lg leading-tight">{m.title}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-[#1A1A1A]/70">
                <Badge className="bg-[#FDFBF7] text-[#1A1A1A] border border-[#B89555]/50 font-semibold">{CAT_LABEL[m.category]}</Badge>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{m.duration}</span>
                <span>{m.lessons} lessons</span>
              </div>
            </div>
          </div>
          {locked ? (
            <PremiumLockBadge size="sm" title={lockReason ?? "Locked"} />
          ) : (
            <span data-surface="emerald" data-allow-dark-cta className="allow-white shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-[image:var(--jj-emerald-ombre)] shadow-[0_8px_18px_-12px_rgba(6,78,59,0.75)]">
              <ChevronRight className="w-4 h-4" strokeWidth={2.6} style={{ color: "#FFFFFF", stroke: "#FFFFFF", fill: "none", opacity: 1 }} />
            </span>
          )}
        </div>

        <p className="text-[#1A1A1A]/75 text-sm mt-4 line-clamp-2">{m.description}</p>

        {!!m.progress && (
          <div className="mt-3">
            <Progress value={m.progress} className="h-1.5 bg-[#FDFBF7] [&>div]:bg-[#B89555]" />
            <p className="text-[10px] text-[#1A1A1A]/55 mt-1">{m.progress}% complete</p>
          </div>
        )}

        <div className="mt-auto pt-5 pb-3 flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5 min-w-0 flex-1 overflow-hidden">
            {m.topics.slice(0, 2).map((t, i) => (
              <span key={i} className="text-[11px] bg-[#FDFBF7] text-[#1A1A1A]/85 px-2 py-0.5 rounded border border-[#B89555]/30 max-w-full truncate">
                {t}
              </span>
            ))}
            {m.topics.length > 2 && <span className="text-[11px] text-[#1A1A1A]/55 whitespace-nowrap">+{m.topics.length - 2} more</span>}
          </div>
          {locked ? (
            <button
              type="button"
              onClick={onRequestAccess}
              disabled={requestAccessDisabled || !onRequestAccess}
              title={lockReason ?? "Locked"}
              className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-sm font-semibold bg-[#EFE6D6] hover:bg-[#F7F2EA] text-[#1A1A1A] border border-[#B89555]/65 disabled:opacity-60 leading-none shadow-[0_6px_16px_rgba(184,149,85,0.16),inset_0_1px_0_rgba(255,255,255,0.8)]"
              data-no-contrast-guard
            >
              <Lock className="w-3 h-3 shrink-0" strokeWidth={2.2} />
              <span className="whitespace-nowrap">Request Access</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStart}
              className="jj-surface-emerald shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-sm font-semibold hover:-translate-y-0.5 hover:brightness-110 leading-none transition-all"
              data-surface="emerald"
              data-emerald-ok="button"
            >
              <Play className="w-3 h-3 shrink-0" />
              <span className="whitespace-nowrap">Start</span>
            </button>
          )}
        </div>
      </CardContent>
      {locked && lockReason && (
        <div
          data-no-contrast-guard
          className="absolute bottom-0 inset-x-0 px-4 py-1.5 text-center text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/75 bg-[#F7F2EA] border-t border-[#B89555]/40"
        >
          {lockReason}
        </div>
      )}
    </Card>
  );
}




function ReferenceCard({ title, items, tone, icon }: {
  title: string; items: string[]; tone: "red" | "emerald"; icon: React.ReactNode;
}) {
  const mark = tone === "red"
    ? <span className="text-[#7A1F1F] font-bold">✕</span>
    : <span className="text-[#1F5132] font-bold">✓</span>;
  return (
    <Card className="bg-[#F7F2EA] border-[#B89555]/30">
      <CardContent className="p-5 md:p-6">
        <h3 className="text-[#1A1A1A] font-semibold flex items-center gap-2 mb-3">
          {icon}{title}
        </h3>
        <ul className="space-y-1.5">
          {items.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-[#1A1A1A]/85 text-sm">
              <span className="mt-0.5">{mark}</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function LockedTraining({ hasUser }: { hasUser: boolean }) {
  return (
    <div className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/30 px-6 py-12 text-center">
      <div className="mx-auto mb-4 w-fit">
        <PremiumLockBadge size="lg" title="Training locked" />
      </div>
      <h3 className="text-xl font-bold text-[#1A1A1A] mb-1">Training is for verified brokers</h3>
      <p className="text-[#1A1A1A]/70 mb-5 max-w-md mx-auto">
        Sign in and switch your mode to Broker to unlock Market Intelligence training modules.
      </p>
      {!hasUser && (
        <Link
          to="/auth?redirect=/broker/learning"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EFE6D6] text-[#1A1A1A] text-sm font-semibold border border-[#B89555]/50 hover:bg-[#E5D8BD] transition-colors"
        >
          Sign in
        </Link>
      )}
    </div>
  );
}
