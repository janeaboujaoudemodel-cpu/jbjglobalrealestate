import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight, ChevronLeft, Clock, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface QuizAnswer {
  question: string;
  answer: string | string[];
}

const QUIZ_QUESTIONS = [
  {
    id: "purpose",
    question: "What's your primary purpose for this property?",
    type: "single",
    options: [
      { value: "investment", label: "Investment & ROI", icon: "📈" },
      { value: "living", label: "Personal Residence", icon: "🏠" },
      { value: "vacation", label: "Vacation Home", icon: "🏖️" },
      { value: "both", label: "Both Investment & Living", icon: "🎯" },
    ],
  },
  {
    id: "budget",
    question: "What's your budget range?",
    type: "single",
    options: [
      { value: "under-2m", label: "Under AED 2M", icon: "💰" },
      { value: "2m-5m", label: "AED 2M - 5M", icon: "💎" },
      { value: "5m-15m", label: "AED 5M - 15M", icon: "🏆" },
      { value: "15m-plus", label: "AED 15M+", icon: "👑" },
    ],
  },
  {
    id: "bedrooms",
    question: "How many bedrooms do you need?",
    type: "single",
    options: [
      { value: "studio-1", label: "Studio or 1 BR", icon: "1️⃣" },
      { value: "2-3", label: "2-3 Bedrooms", icon: "2️⃣" },
      { value: "4-5", label: "4-5 Bedrooms", icon: "4️⃣" },
      { value: "6-plus", label: "6+ Bedrooms", icon: "🏰" },
    ],
  },
  {
    id: "location",
    question: "What type of location do you prefer?",
    type: "single",
    options: [
      { value: "beachfront", label: "Beachfront / Waterfront", icon: "🌊" },
      { value: "city-center", label: "City Center / Downtown", icon: "🌆" },
      { value: "golf-community", label: "Golf Course Community", icon: "⛳" },
      { value: "suburban", label: "Suburban / Family Area", icon: "🌳" },
    ],
  },
  {
    id: "timeline",
    question: "When do you need the property?",
    type: "single",
    options: [
      { value: "ready", label: "Ready to Move", icon: "✅" },
      { value: "2025-2026", label: "2025-2026", icon: "📅" },
      { value: "2027-plus", label: "2027 or Later", icon: "🔮" },
      { value: "flexible", label: "Flexible", icon: "🤷" },
    ],
  },
  {
    id: "views",
    question: "What views are most important to you?",
    type: "multiple",
    options: [
      { value: "sea", label: "Sea View", icon: "🌊" },
      { value: "city", label: "City / Skyline", icon: "🏙️" },
      { value: "golf", label: "Golf Course", icon: "⛳" },
      { value: "garden", label: "Garden / Park", icon: "🌳" },
      { value: "marina", label: "Marina", icon: "⛵" },
      { value: "any", label: "No Preference", icon: "👀" },
    ],
  },
  {
    id: "amenities",
    question: "Which amenities are must-haves?",
    type: "multiple",
    options: [
      { value: "pool", label: "Swimming Pool", icon: "🏊" },
      { value: "gym", label: "Fitness Center", icon: "💪" },
      { value: "beach", label: "Private Beach", icon: "🏖️" },
      { value: "spa", label: "Spa & Wellness", icon: "🧖" },
      { value: "concierge", label: "Concierge", icon: "🛎️" },
      { value: "parking", label: "Valet Parking", icon: "🚗" },
    ],
  },
  {
    id: "emirate",
    question: "Which emirate do you prefer?",
    type: "single",
    options: [
      { value: "dubai", label: "Dubai", icon: "🌴" },
      { value: "abu-dhabi", label: "Abu Dhabi", icon: "🕌" },
      { value: "rak", label: "Ras Al Khaimah", icon: "⛰️" },
      { value: "any", label: "Open to All", icon: "🗺️" },
    ],
  },
];

const Quiz = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeStarted] = useState(Date.now());
  const [estimatedTime] = useState(25); // seconds

  const { data: allProjects } = useQuery({
    queryKey: ["all-projects-quiz"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer:developers(name, slug),
          images:project_images(image_url)
        `);
      if (error) throw error;
      return data;
    },
  });

  const currentQuestion = QUIZ_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUIZ_QUESTIONS.length) * 100;

  const handleAnswer = (value: string) => {
    if (currentQuestion.type === "multiple") {
      const current = (answers[currentQuestion.id] as string[]) || [];
      if (value === "any" || value === "no-preference") {
        setAnswers({ ...answers, [currentQuestion.id]: [value] });
      } else if (current.includes(value)) {
        setAnswers({
          ...answers,
          [currentQuestion.id]: current.filter((v) => v !== value && v !== "any"),
        });
      } else {
        setAnswers({
          ...answers,
          [currentQuestion.id]: [...current.filter((v) => v !== "any"), value],
        });
      }
    } else {
      setAnswers({ ...answers, [currentQuestion.id]: value });
    }
  };

  const isAnswered = () => {
    const answer = answers[currentQuestion.id];
    if (currentQuestion.type === "multiple") {
      return Array.isArray(answer) && answer.length > 0;
    }
    return !!answer;
  };

  const handleNext = async () => {
    if (currentStep < QUIZ_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit and get recommendations
      setIsSubmitting(true);
      try {
        const recommendations = getRecommendations();
        const sessionId = `quiz-${Date.now()}`;

        // Save quiz response
        await supabase.from("quiz_responses").insert({
          user_id: user?.id || null,
          session_id: sessionId,
          answers: answers,
          recommended_project_ids: recommendations.slice(0, 5).map((p) => p.id),
        });

        // Navigate to results with recommended project slugs
        const slugs = recommendations.slice(0, 5).map((p) => p.slug).join(",");
        navigate(`/quiz-results?projects=${slugs}`);
      } catch (error) {
        console.error("Error saving quiz:", error);
        // Still navigate even if save fails
        const recommendations = getRecommendations();
        const slugs = recommendations.slice(0, 5).map((p) => p.slug).join(",");
        navigate(`/quiz-results?projects=${slugs}`);
      }
    }
  };

  const getRecommendations = () => {
    if (!allProjects?.length) return [];

    return allProjects
      .map((project) => {
        let score = 0;

        // Budget matching
        const budget = answers.budget;
        const priceFrom = project.price_from || 0;
        if (budget === "under-2m" && priceFrom < 2000000) score += 20;
        if (budget === "2m-5m" && priceFrom >= 2000000 && priceFrom < 5000000) score += 20;
        if (budget === "5m-15m" && priceFrom >= 5000000 && priceFrom < 15000000) score += 20;
        if (budget === "15m-plus" && priceFrom >= 15000000) score += 20;

        // Bedroom matching
        const bedrooms = answers.bedrooms;
        const minBr = project.bedrooms_min || 0;
        if (bedrooms === "studio-1" && minBr <= 1) score += 15;
        if (bedrooms === "2-3" && minBr >= 2 && minBr <= 3) score += 15;
        if (bedrooms === "4-5" && minBr >= 4 && minBr <= 5) score += 15;
        if (bedrooms === "6-plus" && minBr >= 6) score += 15;

        // Location preference
        const location = answers.location;
        const projectViews = project.views || [];
        if (location === "beachfront" && projectViews.some((v: string) => v.toLowerCase().includes("sea"))) score += 15;
        if (location === "city-center" && projectViews.some((v: string) => v.toLowerCase().includes("city") || v.toLowerCase().includes("skyline"))) score += 15;
        if (location === "golf-community" && projectViews.some((v: string) => v.toLowerCase().includes("golf"))) score += 15;

        // Timeline matching
        const timeline = answers.timeline;
        const handover = project.handover_date?.toLowerCase() || "";
        if (timeline === "ready" && (handover === "" || handover.includes("ready"))) score += 10;
        if (timeline === "2025-2026" && (handover.includes("2025") || handover.includes("2026"))) score += 10;
        if (timeline === "2027-plus" && (handover.includes("2027") || handover.includes("2028") || handover.includes("2029"))) score += 10;

        // Emirate matching
        const emirate = answers.emirate;
        const projectEmirate = project.emirate?.toLowerCase() || "";
        if (emirate === "dubai" && projectEmirate === "dubai") score += 10;
        if (emirate === "abu-dhabi" && projectEmirate === "abu dhabi") score += 10;
        if (emirate === "rak" && projectEmirate === "ras al khaimah") score += 10;
        if (emirate === "any") score += 5;

        // Views matching
        const preferredViews = answers.views as string[] || [];
        if (!preferredViews.includes("any")) {
          preferredViews.forEach((pv) => {
            if (projectViews.some((v: string) => v.toLowerCase().includes(pv))) score += 5;
          });
        }

        return { ...project, matchScore: score };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  };

  return (
    <section className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Exit Quiz
            </button>
            <div className="flex items-center gap-3 text-zinc-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">~{estimatedTime} seconds</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-zinc-500 mb-2">
              <span>Question {currentStep + 1} of {QUIZ_QUESTIONS.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-1 bg-zinc-800" />
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <h2 className="text-white text-3xl md:text-4xl font-bold mb-3">
              {currentQuestion.question}
            </h2>
            {currentQuestion.type === "multiple" && (
              <p className="text-zinc-500">Select all that apply</p>
            )}
          </div>

          <div className={`grid gap-3 ${currentQuestion.options.length > 4 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"}`}>
            {currentQuestion.options.map((option) => {
              const currentAnswer = answers[currentQuestion.id];
              const isSelected = currentQuestion.type === "multiple"
                ? (currentAnswer as string[] || []).includes(option.value)
                : currentAnswer === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className={`flex items-center gap-4 p-5 rounded-xl text-left transition-all duration-200 border ${
                    isSelected
                      ? "bg-white text-zinc-900 border-white"
                      : "bg-zinc-900 text-white border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50"
                  }`}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <span className="font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="text-zinc-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!isAnswered() || isSubmitting}
              className="bg-white text-zinc-900 hover:bg-zinc-100 px-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Finding matches...
                </>
              ) : currentStep === QUIZ_QUESTIONS.length - 1 ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  See Recommendations
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Quiz;
