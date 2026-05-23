import { lazy, Suspense, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, BookOpen, Lock } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useUserModeContext } from "@/contexts/UserModeContext";

// Reuse the existing, fully-featured screens as tab bodies.
// They preserve every feature, modal, and CTA from the original pages.
const BrokerEducation = lazy(() => import("@/pages/BrokerEducation"));
const BrokerTraining = lazy(() => import("@/pages/broker/BrokerTraining"));

type TabKey = "library" | "training";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { key: "library",  label: "Library",  icon: BookOpen,       description: "Books, learning paths & certification" },
  { key: "training", label: "Training", icon: GraduationCap,  description: "Market Intelligence training modules" },
];

const TabFallback = () => (
  <div className="flex items-center justify-center py-24">
    <div className="w-8 h-8 border-2 border-[#B89555] border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function BrokerLearning() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const { mode } = useUserModeContext();

  const requested = (params.get("tab") || "library").toLowerCase() as TabKey;
  const active: TabKey = useMemo(
    () => (TABS.some(t => t.key === requested) ? requested : "library"),
    [requested]
  );

  const trainingLocked = !user || mode !== "broker";

  const setTab = (key: TabKey) => {
    const next = new URLSearchParams(params);
    next.set("tab", key);
    setParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <SEOHead
        title="Broker Learning | Library & Training | JBJ GLOBAL REAL ESTATE"
        description="JBJ Broker Learning hub — internal book library, certification, and Market Intelligence training modules in one place."
        canonicalPath="/broker/learning"
      />

      {/* Page header */}
      <section className="pt-24 pb-6 border-b border-[#B89555]/20" data-gold-hairline>
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-4"
          >
            <Badge className="self-start bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40">
              <GraduationCap className="w-3 h-3 mr-1" /> Broker Learning
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-[#1A1A1A] leading-tight">
              Broker Learning
            </h1>
            <p className="text-[#1A1A1A]/70 max-w-2xl">
              One home for everything JBJ brokers learn — the internal book library and
              Market Intelligence training modules, with progress, certification and compliance built in.
            </p>

            {/* Segmented tab control */}
            <div
              role="tablist"
              aria-label="Broker Learning sections"
              className="mt-2 inline-flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#F7F2EA] border border-[#B89555]/30 self-start"
              data-gold-hairline
            >
              {TABS.map((t) => {
                const isActive = active === t.key;
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`panel-${t.key}`}
                    id={`tab-${t.key}`}
                    onClick={() => setTab(t.key)}
                    className={[
                      "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                      isActive
                        ? "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/50 shadow-sm"
                        : "text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/60 border border-transparent",
                    ].join(" ")}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                    {t.key === "training" && trainingLocked && (
                      <Lock className="w-3.5 h-3.5 text-[#1A1A1A]/60" aria-hidden />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tab panels */}
      <Suspense fallback={<TabFallback />}>
        {active === "library" && (
          <div role="tabpanel" id="panel-library" aria-labelledby="tab-library">
            <BrokerEducation />
          </div>
        )}
        {active === "training" && (
          <div role="tabpanel" id="panel-training" aria-labelledby="tab-training">
            {trainingLocked ? (
              <section className="py-20">
                <div className="container mx-auto px-4 max-w-2xl text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center mb-5">
                    <Lock className="w-6 h-6 text-[#1A1A1A]" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">
                    Training is for verified brokers
                  </h2>
                  <p className="text-[#1A1A1A]/70 mb-6">
                    Sign in and switch your mode to Broker to unlock Market Intelligence training modules.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {!user && (
                      <Link
                        to="/auth?redirect=/broker/learning?tab=training"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EFE6D6] text-[#1A1A1A] text-sm font-semibold border border-[#B89555]/50 hover:bg-[#E5D8BD] transition-colors"
                      >
                        Sign in
                      </Link>
                    )}
                    <Link
                      to="/broker/learning?tab=library"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-transparent text-[#1A1A1A] text-sm font-semibold border border-[#B89555]/40 hover:bg-[#F7F2EA] transition-colors"
                    >
                      Browse Library instead
                    </Link>
                  </div>
                </div>
              </section>
            ) : (
              <BrokerTraining />
            )}
          </div>
        )}
      </Suspense>
    </div>
  );
}
