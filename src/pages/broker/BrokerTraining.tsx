import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Navigate } from "react-router-dom";
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
  ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SEOHead } from "@/components/SEOHead";

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
      "Avoiding common misinterpretations"
    ],
    completed: false,
    progress: 0
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
      "Landlord vs tenant perspectives"
    ],
    completed: false,
    progress: 0
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
      "Market timing conversations"
    ],
    completed: false,
    progress: 0
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
      "Risk of non-compliance"
    ],
    completed: false,
    progress: 0
  }
];

const forbiddenPhrases = [
  "guaranteed returns",
  "sure investment",
  "prices will definitely",
  "you should buy now",
  "this is the best time",
  "I predict",
  "I promise",
  "100% ROI"
];

const approvedPhrases = [
  "Based on recent data...",
  "Historical trends indicate...",
  "Market activity suggests...",
  "According to official Open Data...",
  "The data shows...",
  "This area has experienced..."
];

export default function BrokerTraining() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);

  // Require authentication
  if (!user) {
    return <Navigate to="/auth?redirect=/broker/training" replace />;
  }

  const getCategoryBadge = (category: TrainingModule["category"]) => {
    switch (category) {
      case "foundational":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Foundational</Badge>;
      case "practical":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Practical</Badge>;
      case "advanced":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Advanced</Badge>;
      case "compliance":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Compliance</Badge>;
    }
  };

  const totalProgress = trainingModules.reduce((acc, m) => acc + (m.progress || 0), 0) / trainingModules.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
      <SEOHead 
        title="Broker Training | Market Intelligence | JBJ GLOBAL REAL ESTATE"
        description="Internal broker training modules powered by Market Intelligence."
        noIndex={true}
      />

      {/* Internal Warning Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/30 py-3">
        <div className="container mx-auto px-4 flex items-center justify-center gap-3">
          <Lock className="w-4 h-4 text-[#1A1A1A]" />
          <span className="text-[#1A1A1A] text-sm font-medium">INTERNAL USE ONLY — Broker Training Portal</span>
        </div>
      </div>

      {/* Header */}
      <section className="py-12 border-b border-[#1A1A1A]">
        <div className="container mx-auto px-4">
          <Button 
            variant="ghost" 
            className="text-[#1A1A1A] hover:text-[#1A1A1A]-light mb-6"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#EFE6D6]/10 border border-[#B89555]/30 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-[#1A1A1A]" />
              </div>
              <div>
                <h1 className="text-white text-3xl font-bold">
                  Market Intelligence Training
                </h1>
                <p className="text-white/90">Master data-driven conversations for BUY · SELL · RENT</p>
              </div>
            </div>

            <div className="bg-[#FDFBF7]/50 border border-[#1A1A1A] rounded-xl p-4 min-w-[200px]">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-5 h-5 text-[#1A1A1A]" />
                <span className="text-white font-medium">Your Progress</span>
              </div>
              <Progress value={totalProgress} className="h-2" />
              <p className="text-white/90 text-xs mt-1">{Math.round(totalProgress)}% Complete</p>
            </div>
          </div>
        </div>
      </section>

      {/* Training Modules */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {trainingModules.map((module, index) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`bg-[#FDFBF7]/50 border-[#1A1A1A] hover:border-[#B89555]/30 transition-all cursor-pointer ${
                    selectedModule?.id === module.id ? "border-[#B89555]/50" : ""
                  }`}
                  onClick={() => setSelectedModule(module)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#EFE6D6]/10 border border-[#B89555]/30 flex items-center justify-center text-[#1A1A1A]">
                          {module.icon}
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-lg">{module.title}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            {getCategoryBadge(module.category)}
                            <span className="text-white/90 text-sm flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {module.duration}
                            </span>
                            <span className="text-white/90 text-sm">{module.lessons} lessons</span>
                          </div>
                        </div>
                      </div>
                      {module.completed ? (
                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <ChevronRight className="w-6 h-6 text-white/90" />
                      )}
                    </div>

                    <p className="text-white/70 text-sm mb-4">{module.description}</p>

                    {module.progress !== undefined && module.progress > 0 && (
                      <div className="mb-4">
                        <Progress value={module.progress} className="h-1.5" />
                        <p className="text-white/90 text-xs mt-1">{module.progress}% Complete</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {module.topics.slice(0, 2).map((topic, i) => (
                          <span key={i} className="text-xs bg-[#F7F2EA] text-white/70 px-2 py-1 rounded">
                            {topic}
                          </span>
                        ))}
                        {module.topics.length > 2 && (
                          <span className="text-xs text-white/90">+{module.topics.length - 2} more</span>
                        )}
                      </div>
                      <Button size="sm" className="bg-[#EFE6D6]/10 text-[#1A1A1A] hover:bg-[#EFE6D6]/20 border border-[#B89555]/30">
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
      <section className="py-12 border-t border-[#1A1A1A]">
        <div className="container mx-auto px-4">
          <h2 className="text-white text-2xl font-bold mb-8 text-center">
            Compliance Quick Reference
          </h2>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Forbidden Phrases */}
            <Card className="bg-red-950/20 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  NEVER Say
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {forbiddenPhrases.map((phrase, i) => (
                    <li key={i} className="flex items-center gap-2 text-white/70 text-sm">
                      <span className="text-red-400">✕</span>
                      "{phrase}"
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Approved Phrases */}
            <Card className="bg-emerald-950/20 border-emerald-500/30">
              <CardHeader>
                <CardTitle className="text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ALWAYS Use
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {approvedPhrases.map((phrase, i) => (
                    <li key={i} className="flex items-center gap-2 text-white/70 text-sm">
                      <span className="text-emerald-400">✓</span>
                      "{phrase}"
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Rules */}
      <section className="py-12 border-t border-[#1A1A1A]">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-[#B89555]/20 max-w-3xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-white text-xl font-bold mb-6 text-center">Golden Rules for Market Conversations</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[#EFE6D6]/10 border border-[#B89555]/30 flex items-center justify-center mx-auto mb-3">
                    <span className="text-[#1A1A1A] font-bold">1</span>
                  </div>
                  <p className="text-white font-medium mb-1">Describe, Don't Predict</p>
                  <p className="text-white/90 text-sm">Explain what data shows, never what will happen</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[#EFE6D6]/10 border border-[#B89555]/30 flex items-center justify-center mx-auto mb-3">
                    <span className="text-[#1A1A1A] font-bold">2</span>
                  </div>
                  <p className="text-white font-medium mb-1">Insight, Not Advice</p>
                  <p className="text-white/90 text-sm">Share market context, let clients decide</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[#EFE6D6]/10 border border-[#B89555]/30 flex items-center justify-center mx-auto mb-3">
                    <span className="text-[#1A1A1A] font-bold">3</span>
                  </div>
                  <p className="text-white font-medium mb-1">Cite Sources</p>
                  <p className="text-white/90 text-sm">Always reference Open Data origins</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
