import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  GraduationCap, BookOpen, Lock, BarChart3, MessageSquare, Shield,
  CheckCircle, Clock, Play, ChevronRight, Award,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useUserModeContext } from "@/contexts/UserModeContext";
import { useBrokerEducation, EducationBook } from "@/hooks/useBrokerEducation";
import { Book3DCard, BookDetailModal } from "@/components/broker-education";

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
  const trainingLocked = !user || mode !== "broker";

  const { books, loading, progressMap } = useBrokerEducation();
  const [selectedBook, setSelectedBook] = useState<EducationBook | null>(null);
  const [activeModule, setActiveModule] = useState<TModule | null>(null);

  const groupedBooks = useMemo(() => {
    const byPath = new Map<string, EducationBook[]>();
    for (const b of books) {
      const key = b.learning_path || "Other";
      const arr = byPath.get(key) ?? [];
      arr.push(b);
      byPath.set(key, arr);
    }
    for (const [k, arr] of byPath.entries()) {
      arr.sort((a, b) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.book_number ?? 0) - (b.book_number ?? 0)
      );
      byPath.set(k, arr);
    }
    const keys = Array.from(byPath.keys()).sort((a, b) => {
      const ai = getLearningPathRank(a);
      const bi = getLearningPathRank(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    return keys.map((name) => ({ name, books: byPath.get(name) ?? [] }));
  }, [books]);

  const totalProgress =
    TRAINING.reduce((acc, m) => acc + (m.progress || 0), 0) / TRAINING.length;

  return (
    <div className="w-full bg-[#FDFBF7]">
      <SEOHead
        title="Broker Academy | JBJ GLOBAL REAL ESTATE"
        description="Internal JBJ Broker Academy — book library, training modules, certification and compliance reference."
        noIndex
      />

        <div className="w-full px-1 lg:px-2 py-2 flex flex-col gap-14">
        {/* ── Header ───────────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col gap-4"
        >
          <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40 self-start">
            <GraduationCap className="w-3 h-3 mr-1" /> Internal use only · Broker Academy
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-[#1A1A1A] leading-tight">JBJ Broker Academy</h1>
          <p className="text-[#1A1A1A]/70 max-w-3xl">
            One home for everything JBJ brokers learn — the internal book library, market-intelligence training,
            and the compliance reference, with progress tracked across the portal.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 items-stretch">
            <KpiCard icon={<BookOpen className="w-5 h-5" />} label="Library books" value={books.length || "—"} />
            <KpiCard icon={<GraduationCap className="w-5 h-5" />} label="Training modules" value={TRAINING.length} />
            <KpiCard
              icon={<Award className="w-5 h-5" />}
              label="Your training"
              value={`${Math.round(totalProgress)}%`}
              progress={totalProgress}
            />
          </div>
        </motion.header>


        {/* ── Training ─────────────────────────────────────────────── */}
        <section className="flex flex-col gap-6">
          <SectionTitle eyebrow="Market Intelligence" title="Training Modules" />
          {trainingLocked ? (
            <LockedTraining hasUser={!!user} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {TRAINING.map((m) => <TrainingCard key={m.id} m={m} onStart={() => setActiveModule(m)} />)}
            </div>
          )}
        </section>

        {/* ── Library ──────────────────────────────────────────────── */}
        <section className="flex flex-col gap-6">
          <SectionTitle eyebrow="Internal Library" title="Books & Learning Paths" />
          {loading ? (
            <div className="py-10 grid place-items-center">
              <div className="w-8 h-8 border-2 border-[#B89555] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : groupedBooks.length === 0 ? (
            <div className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/30 px-6 py-10 text-center text-[#1A1A1A]/70">
              Your library is loading or empty. Check back shortly.
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {groupedBooks.map((group) => (
                <div key={group.name} className="flex flex-col gap-4">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-[#1A1A1A] font-semibold text-lg">{group.name}</h3>
                    <span className="text-xs text-[#1A1A1A]/55">{group.books.length} {group.books.length === 1 ? "book" : "books"}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 items-stretch">
                    {group.books.map((book, i) => (
                      <Book3DCard
                        key={book.id}
                        book={book}
                        progress={progressMap[book.id]}
                        onOpen={() => setSelectedBook(book)}
                        index={i}
                        isLocked={book.is_restricted}
                      />
                    ))}
                  </div>
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

        <BookDetailModal
          book={selectedBook}
          isOpen={!!selectedBook}
          onClose={() => setSelectedBook(null)}
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

function KpiCard({ icon, label, value, progress }: {
  icon: React.ReactNode; label: string; value: React.ReactNode; progress?: number;
}) {
  return (
    <div className="min-h-[202px] rounded-2xl bg-gradient-to-br from-[#F7F2EA] via-[#EFE6D6] to-[#F7F2EA] border border-[#B89555]/55 p-6 flex flex-col items-center text-center shadow-[0_4px_14px_rgba(184,149,85,0.12)] hover:shadow-[0_14px_30px_rgba(184,149,85,0.22)] transition-all">
      <span className="w-14 h-14 rounded-2xl bg-[#1A1A1A] border border-[#B89555]/70 grid place-items-center text-[#B89555] shrink-0 shadow-[0_4px_12px_rgba(26,26,26,0.25)]">
        {icon}
      </span>
      <div className="mt-4 h-4 flex items-center justify-center text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/75 whitespace-nowrap font-semibold">{label}</div>
      <div className="mt-3 h-10 flex items-center justify-center text-4xl font-bold text-[#1A1A1A] leading-none tabular-nums">{value}</div>
      {typeof progress === "number" && (
        <Progress value={progress} className="h-1.5 w-full mt-5 bg-[#FDFBF7] [&>div]:bg-[#B89555]" />
      )}
    </div>
  );
}


function TrainingCard({ m, onStart }: { m: TModule; onStart: () => void }) {
  return (
    <Card className="bg-gradient-to-br from-[#F7F2EA] via-[#EFE6D6] to-[#F7F2EA] border-[#B89555]/55 hover:border-[#B89555]/80 transition-all min-h-[240px] shadow-[0_4px_14px_rgba(184,149,85,0.10)] hover:shadow-[0_14px_30px_rgba(184,149,85,0.20)]">
      <CardContent className="p-5 md:p-6 flex flex-col h-full">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-[#1A1A1A] border border-[#B89555]/70 grid place-items-center text-[#B89555] shadow-[0_4px_12px_rgba(26,26,26,0.25)]" data-allow-dark-cta data-no-contrast-guard>
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
          <ChevronRight className="w-5 h-5 text-[#1A1A1A]/40 shrink-0" />
        </div>

        <p className="text-[#1A1A1A]/75 text-sm mt-4 line-clamp-2">{m.description}</p>

        {!!m.progress && (
          <div className="mt-3">
            <Progress value={m.progress} className="h-1.5 bg-[#FDFBF7] [&>div]:bg-[#B89555]" />
            <p className="text-[10px] text-[#1A1A1A]/55 mt-1">{m.progress}% complete</p>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {m.topics.slice(0, 2).map((t, i) => (
              <span key={i} className="text-[11px] bg-[#FDFBF7] text-[#1A1A1A]/85 px-2 py-0.5 rounded border border-[#B89555]/30">
                {t}
              </span>
            ))}
            {m.topics.length > 2 && <span className="text-[11px] text-[#1A1A1A]/55">+{m.topics.length - 2} more</span>}
          </div>
          <Button
            size="sm"
            onClick={onStart}
            className="bg-[#102540] !text-white hover:bg-[#1a3d63] border border-[#B89555]/70 font-semibold shadow-[0_4px_12px_rgba(16,37,64,0.25)] [&_svg]:!text-white"
            data-allow-dark-cta
            data-no-contrast-guard
          >
            <Play className="w-3 h-3 mr-1" /> Start
          </Button>
        </div>
      </CardContent>
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
      <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EFE6D6] border border-[#B89555]/40 grid place-items-center mb-4">
        <Lock className="w-6 h-6 text-[#1A1A1A]" />
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
