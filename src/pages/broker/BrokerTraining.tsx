import { useState } from "react";
import { motion } from "framer-motion";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen,
  Lock,
  ChevronRight,
  CheckCircle,
  Clock,
  Play,
  Award,
  BarChart3,
  MessageSquare,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SEOHead } from "@/components/SEOHead";
import { IconTile } from "@/components/ui/icon-tile";

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  lessons: number;
  category: "foundational" | "practical" | "advanced" | "compliance";
  icon: React.ReactNode;
  topics: string[];
  completed?: boolean;
  progress?: number;
}

const trainingModules: TrainingModule[] = [
  {
    id: "reading-market",
    title: "Reading the Market",
    description: "Learn how to interpret market trends and explain data to clients confidently.",
    duration: "45 min",
    lessons: 6,
    category: "foundational",
    icon: <BarChart3 className="w-6 h-6" />,
    topics: [
      "How to interpret market trends",
      "What data can and cannot say",
      "How to explain trends to clients",
      "Understanding price indexes",
      "Reading demand vs supply signals",
      "Avoiding common misinterpretations",
    ],
    completed: false,
    progress: 0,
  },
  {
    id: "rent-conversations",
    title: "RENT Conversations",
    description: "Master the art of discussing rent trends and handling tenant/landlord inquiries.",
    duration: "35 min",
    lessons: 5,
    category: "practical",
    icon: <MessageSquare className="w-6 h-6" />,
    topics: [
      "Explaining rent trends clearly",
      "Handling client hesitation",
      "Framing urgency without pressure",
      "Area-specific narratives",
      "Landlord vs tenant perspectives",
    ],
    completed: false,
    progress: 0,
  },
  {
    id: "buy-vs-rent",
    title: "BUY vs RENT Context",
    description: "Understand when to guide clients toward different transaction types.",
    duration: "30 min",
    lessons: 4,
    category: "advanced",
    icon: <BarChart3 className="w-6 h-6" />,
    topics: [
      "When rent demand is stronger",
      "When sale demand is slower",
      "How to guide clients without advice",
      "Market timing conversations",
    ],
    completed: false,
    progress: 0,
  },
  {
    id: "compliance-language",
    title: "Compliance & Language Guardrails",
    description: "Learn the critical difference between insight and advice to stay compliant.",
    duration: "25 min",
    lessons: 4,
    category: "compliance",
    icon: <Shield className="w-6 h-6" />,
    topics: [
      "Words brokers must NOT use",
      "Difference between 'insight' and 'advice'",
      "Approved phrasing examples",
      "Risk of non-compliance",
    ],
    completed: false,
    progress: 0,
  },
];

const forbiddenPhrases = [
  "guaranteed returns",
  "sure investment",
  "prices will definitely",
  "you should buy now",
  "this is the best time",
  "I predict",
  "I promise",
  "100% ROI",
];

const approvedPhrases = [
  "Based on recent data...",
  "Historical trends indicate...",
  "Market activity suggests...",
  "According to official Open Data...",
  "The data shows...",
  "This area has experienced...",
];

interface Props {
  /** When true, suppress the standalone hero (used when embedded in BrokerLearning tabs). */
  embedded?: boolean;
}

export default function BrokerTraining({ embedded = true }: Props) {
  const { user } = useAuth();
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);

  if (!user) {
    return <Navigate to="/auth?redirect=/broker/learning?tab=training" replace />;
  }

  const getCategoryBadge = (category: TrainingModule["category"]) => {
    const cls =
      "border bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/40";
    switch (category) {
      case "foundational":
        return <Badge className={cls}>Foundational</Badge>;
      case "practical":
        return <Badge className={cls}>Practical</Badge>;
      case "advanced":
        return <Badge className={cls}>Advanced</Badge>;
      case "compliance":
        return <Badge className={cls}>Compliance</Badge>;
    }
  };

  const totalProgress =
    trainingModules.reduce((acc, m) => acc + (m.progress || 0), 0) / trainingModules.length;

  return (
    <div className="bg-[#FDFBF7]">
      <SEOHead
        title="Broker Training | Market Intelligence | JBJ GLOBAL REAL ESTATE"
        description="Internal broker training modules powered by Market Intelligence."
        noIndex={true}
      />

      {/* Compact progress strip (no duplicate hero when embedded) */}
      <section className="pt-6 pb-4">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between flex-wrap gap-4 rounded-2xl bg-[#F7F2EA] border border-[#B89555]/30 px-5 py-4" data-gold-hairline>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-[#1A1A1A]" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/60">
                  Internal use only · Market Intelligence
                </div>
                <h2 className="text-xl font-bold text-[#1A1A1A] leading-tight">
                  Training Modules
                </h2>
              </div>
            </div>

            <div className="min-w-[220px]">
              <div className="flex items-center gap-2 mb-1.5">
                <Award className="w-4 h-4 text-[#1A1A1A]" />
                <span className="text-sm font-semibold text-[#1A1A1A]">Your Progress</span>
                <span className="ml-auto text-xs text-[#1A1A1A]/70">{Math.round(totalProgress)}%</span>
              </div>
              <Progress value={totalProgress} className="h-2" />
            </div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="pb-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-5">
            {trainingModules.map((module, index) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
              >
                <Card
                  className={`bg-[#F7F2EA] border border-[#B89555]/30 hover:border-[#B89555]/55 transition-all cursor-pointer ${
 selectedModule?.id === module.id ? "border-[#B89555]/60 shadow-sm" : ""
 }`}
                  onClick={() => setSelectedModule(module)}
                  data-gold-hairline
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div data-icon-tile="" data-surface="emerald" className="allow-white w-12 h-12 rounded-xl jj-icon-tile-emerald flex items-center justify-center [&_svg]:!text-white [&_svg]:!stroke-white">
                          {module.icon}
                        </div>
                        <div>
                          <h3 className="text-[#1A1A1A] font-bold text-lg">{module.title}</h3>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {getCategoryBadge(module.category)}
                            <span className="text-[#1A1A1A]/70 text-sm flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {module.duration}
                            </span>
                            <span className="text-[#1A1A1A]/70 text-sm">{module.lessons} lessons</span>
                          </div>
                        </div>
                      </div>
                      {module.completed ? (
                        <CheckCircle className="w-6 h-6 text-[color:var(--emerald-1)]" />
                      ) : (
                        <span data-surface="emerald" data-allow-dark-cta className="allow-white inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-[image:var(--jj-emerald-ombre)] shadow-[0_8px_18px_-12px_rgba(6,78,59,0.75)]">
                          <ChevronRight className="w-4 h-4" strokeWidth={2.6} style={{ color: "#FFFFFF", stroke: "#FFFFFF", fill: "none", opacity: 1 }} />
                        </span>
                      )}
                    </div>

                    <p className="text-[#1A1A1A]/75 text-sm mb-4">{module.description}</p>

                    {module.progress !== undefined && module.progress > 0 && (
                      <div className="mb-4">
                        <Progress value={module.progress} className="h-1.5" />
                        <p className="text-[#1A1A1A]/60 text-xs mt-1">{module.progress}% Complete</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {module.topics.slice(0, 2).map((topic, i) => (
                          <span
                            key={i}
                            className="text-xs bg-[#FDFBF7] text-[#1A1A1A]/80 px-2 py-1 rounded border border-[#B89555]/25"
                          >
                            {topic}
                          </span>
                        ))}
                        {module.topics.length > 2 && (
                          <span className="text-xs text-[#1A1A1A]/60">
                            +{module.topics.length - 2} more
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className="bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#E5D8BD] border border-[#B89555]/50"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Start
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Quick Reference */}
      <section className="py-10 border-t border-[#B89555]/20" data-gold-hairline>
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-[#1A1A1A] text-2xl font-bold mb-8 text-center">
            Compliance Quick Reference
          </h2>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="bg-[#F7F2EA] border border-[#B89555]/30" data-gold-hairline>
              <CardHeader>
                <CardTitle className="text-[#1A1A1A] flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  NEVER Say
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {forbiddenPhrases.map((phrase, i) => (
                    <li key={i} className="flex items-center gap-2 text-[#1A1A1A]/80 text-sm">
                      <span className="text-red-600 font-bold">✕</span>
                      "{phrase}"
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-[#F7F2EA] border border-[#B89555]/30" data-gold-hairline>
              <CardHeader>
                <CardTitle className="text-[#1A1A1A] flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ALWAYS Use
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {approvedPhrases.map((phrase, i) => (
                    <li key={i} className="flex items-center gap-2 text-[#1A1A1A]/80 text-sm">
                      <span className="text-[color:var(--emerald-1)] font-bold">✓</span>
                      "{phrase}"
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Golden Rules */}
      <section className="py-10 border-t border-[#B89555]/20" data-gold-hairline>
        <div className="container mx-auto px-4 max-w-6xl">
          <Card className="bg-[#F7F2EA] border border-[#B89555]/30 max-w-3xl mx-auto" data-gold-hairline>
            <CardContent className="p-8">
              <h3 className="text-[#1A1A1A] text-xl font-bold mb-6 text-center">
                Golden Rules for Market Conversations
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { n: 1, t: "Describe, Don't Predict", d: "Explain what data shows, never what will happen" },
                  { n: 2, t: "Insight, Not Advice", d: "Share market context, let clients decide" },
                  { n: 3, t: "Cite Sources", d: "Always reference Open Data origins" },
                ].map(({ n, t, d }) => (
                  <div key={n} className="text-center">
                    <div className="w-12 h-12 rounded-full bg-[#EFE6D6] border border-[#B89555]/50 flex items-center justify-center mx-auto mb-3">
                      <span className="text-[#1A1A1A] font-bold">{n}</span>
                    </div>
                    <p className="text-[#1A1A1A] font-medium mb-1">{t}</p>
                    <p className="text-[#1A1A1A]/70 text-sm">{d}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
