import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ChevronRight, ChevronLeft, Clock, Sparkles, Loader2, CheckCircle2,
  Wand2, ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const JJ_HOLDING_URL = "https://jjholdinggroup.com";

const QUIZ_QUESTIONS = [
  {
    id: "purpose",
    question: "What's your primary purpose for this property?",
    type: "single" as const,
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
    type: "single" as const,
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
    type: "single" as const,
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
    type: "single" as const,
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
    type: "single" as const,
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
    type: "multiple" as const,
    hasSelectAll: true,
    options: [
      { value: "sea", label: "Sea View", icon: "🌊" },
      { value: "city", label: "City / Skyline", icon: "🏙️" },
      { value: "golf", label: "Golf Course", icon: "⛳" },
      { value: "garden", label: "Garden / Park", icon: "🌳" },
      { value: "marina", label: "Marina", icon: "⛵" },
      { value: "burj", label: "Burj Khalifa", icon: "🗼" },
    ],
  },
  {
    id: "amenities",
    question: "Which amenities are must-haves?",
    type: "multiple" as const,
    hasSelectAll: true,
    options: [
      { value: "pool", label: "Swimming Pool", icon: "🏊" },
      { value: "gym", label: "Fitness Center", icon: "💪" },
      { value: "beach", label: "Private Beach", icon: "🏖️" },
      { value: "spa", label: "Spa & Wellness", icon: "🧖" },
      { value: "concierge", label: "24/7 Concierge", icon: "🛎️" },
      { value: "parking", label: "Valet Parking", icon: "🚗" },
      { value: "security", label: "24/7 Security", icon: "🔐" },
      { value: "kids", label: "Kids Play Area", icon: "🎠" },
    ],
  },
  {
    id: "emirate",
    question: "Which emirate do you prefer?",
    type: "single" as const,
    options: [
      { value: "dubai", label: "Dubai", icon: "🌴" },
      { value: "abu-dhabi", label: "Abu Dhabi", icon: "🕌" },
      { value: "rak", label: "Ras Al Khaimah", icon: "⛰️" },
      { value: "sharjah", label: "Sharjah", icon: "🏛️" },
      { value: "any", label: "Open to All", icon: "🗺️" },
    ],
  },
];

const LANGUAGES = [
  "English", "Arabic", "French", "Russian", "Chinese", "Hindi", "Urdu", "Spanish", "German", "Other"
];

const NATIONALITIES = [
  "UAE", "Saudi Arabia", "India", "Pakistan", "UK", "USA", "Russia", "China", "France", "Germany", "Other"
];

const Quiz = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationality: "",
    preferredLanguage: "",
  });
  const estimatedTime = 30;

  const { data: allProjects } = useQuery({
    queryKey: ["all-projects-quiz"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer:developers(name, slug, description),
          images:project_images(image_url)
        `);
      if (error) throw error;
      return data;
    },
  });

  const currentQuestion = QUIZ_QUESTIONS[currentStep];
  const progress = (currentStep / QUIZ_QUESTIONS.length) * 100;

  const handleSelectAll = () => {
    const allValues = currentQuestion.options.map(o => o.value);
    setAnswers({ ...answers, [currentQuestion.id]: allValues });
  };

  const handleClearAll = () => {
    setAnswers({ ...answers, [currentQuestion.id]: [] });
  };

  const handleAnswer = (value: string) => {
    if (currentQuestion.type === "multiple") {
      const current = (answers[currentQuestion.id] as string[]) || [];
      if (current.includes(value)) {
        setAnswers({
          ...answers,
          [currentQuestion.id]: current.filter((v) => v !== value),
        });
      } else {
        setAnswers({
          ...answers,
          [currentQuestion.id]: [...current, value],
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

  const allSelected = () => {
    if (currentQuestion.type !== "multiple") return false;
    const current = (answers[currentQuestion.id] as string[]) || [];
    return current.length === currentQuestion.options.length;
  };

  const isFormValid = () => {
    return formData.fullName.trim() !== "" && 
           formData.email.trim() !== "" && 
           formData.phone.trim() !== "" &&
           formData.nationality !== "" &&
           formData.preferredLanguage !== "";
  };

  const handleNext = () => {
    if (currentStep < QUIZ_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowForm(true);
    }
  };

  const getRecommendations = () => {
    if (!allProjects?.length) return [];

    const filteredProjects = allProjects.filter((project) => {
      const priceFrom = project.price_from || 0;
      const budget = answers.budget;
      
      if (budget === "under-2m" && priceFrom >= 2000000) return false;
      if (budget === "2m-5m" && (priceFrom < 2000000 || priceFrom >= 5000000)) return false;
      if (budget === "5m-15m" && (priceFrom < 5000000 || priceFrom >= 15000000)) return false;
      if (budget === "15m-plus" && priceFrom < 15000000) return false;

      const bedrooms = answers.bedrooms;
      const minBr = project.bedrooms_min || 0;
      const maxBr = project.bedrooms_max || minBr;
      
      if (bedrooms === "studio-1") {
        if (minBr > 1) return false;
      } else if (bedrooms === "2-3") {
        if (maxBr < 2 || minBr > 3) return false;
      } else if (bedrooms === "4-5") {
        if (maxBr < 4 || minBr > 5) return false;
      } else if (bedrooms === "6-plus") {
        if (maxBr < 6) return false;
      }

      const emirate = answers.emirate;
      const projectEmirate = project.emirate?.toLowerCase().trim() || "";
      
      if (emirate && emirate !== "any") {
        if (emirate === "dubai" && projectEmirate !== "dubai") return false;
        if (emirate === "abu-dhabi" && !projectEmirate.includes("abu dhabi") && projectEmirate !== "abu dhabi") return false;
        if (emirate === "rak" && !projectEmirate.includes("ras al khaimah") && projectEmirate !== "ras al khaimah") return false;
        if (emirate === "sharjah" && projectEmirate !== "sharjah") return false;
      }

      return true;
    });

    return filteredProjects
      .map((project) => {
        let score = 100;

        const location = answers.location;
        const projectViews = project.views || [];
        if (location === "beachfront" && projectViews.some((v: string) => v.toLowerCase().includes("sea") || v.toLowerCase().includes("beach"))) score += 20;
        if (location === "city-center" && projectViews.some((v: string) => v.toLowerCase().includes("city") || v.toLowerCase().includes("skyline") || v.toLowerCase().includes("burj"))) score += 20;
        if (location === "golf-community" && projectViews.some((v: string) => v.toLowerCase().includes("golf"))) score += 20;
        if (location === "suburban" && projectViews.some((v: string) => v.toLowerCase().includes("garden") || v.toLowerCase().includes("park"))) score += 20;

        const timeline = answers.timeline;
        const handover = project.handover_date?.toLowerCase() || "";
        if (timeline === "ready" && handover.includes("ready")) score += 15;
        if (timeline === "2025-2026" && (handover.includes("2025") || handover.includes("2026"))) score += 15;
        if (timeline === "2027-plus" && (handover.includes("2027") || handover.includes("2028") || handover.includes("2029"))) score += 15;
        if (timeline === "flexible") score += 10;

        const preferredViews = answers.views as string[] || [];
        preferredViews.forEach((pv) => {
          if (projectViews.some((v: string) => v.toLowerCase().includes(pv))) score += 5;
        });

        const preferredAmenities = answers.amenities as string[] || [];
        const projectAmenities = project.amenities || [];
        preferredAmenities.forEach((pa) => {
          if (projectAmenities.some((a: string) => a.toLowerCase().includes(pa))) score += 3;
        });

        return { ...project, matchScore: score };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  };

  const handleSubmitForm = async () => {
    if (!isFormValid()) return;

    setIsSubmitting(true);
    try {
      const recommendations = getRecommendations();
      const sessionId = `quiz-${Date.now()}`;

      await supabase.from("quiz_responses").insert({
        user_id: user?.id || null,
        session_id: sessionId,
        answers: {
          ...answers,
          userInfo: formData
        },
        recommended_project_ids: recommendations.slice(0, 5).map((p) => p.id),
      });

      const slugs = recommendations.slice(0, 5).map((p) => p.slug).join(",");
      navigate(`/quiz-results?projects=${slugs}&session=${sessionId}`);
    } catch (error) {
      console.error("Error saving quiz:", error);
      const recommendations = getRecommendations();
      const slugs = recommendations.slice(0, 5).map((p) => p.slug).join(",");
      navigate(`/quiz-results?projects=${slugs}`);
    }
  };

  const [started, setStarted] = useState(false);

  // Intro screen before starting
  if (!started && currentStep === 0 && Object.keys(answers).length === 0 && !showForm) {
    return (
      <section className="min-h-screen bg-gradient-to-b from-purple-950 via-zinc-950 to-black flex flex-col">
        {/* Header */}
        <div className="border-b border-purple-900/30 bg-purple-950/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate(-1)}
                className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Exit
              </button>
              <div className="flex items-center gap-3 text-zinc-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">~{estimatedTime} seconds</span>
              </div>
            </div>
          </div>
        </div>

        {/* Intro Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-2xl text-center">
            {/* Exclusive Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600/30 to-purple-800/30 border border-purple-500/40 mb-8">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">Exclusive by JJ Global Capital</span>
            </div>

            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 via-purple-600 to-purple-800 mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-purple-500/30">
              <Wand2 className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Let AI Find Your Perfect Home
            </h1>
            
            <p className="text-zinc-400 text-lg mb-6 max-w-lg mx-auto">
              Your complimentary AI assistant will analyze your preferences and recommend the best properties — saving you hours of research.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-400 mb-10">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-purple-600/30 flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
                <span className="text-white">100% Free</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-purple-600/30 flex items-center justify-center">
                  <Clock className="w-3 h-3 text-white" />
                </div>
                <span className="text-white">Less than 30 seconds</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-purple-600/30 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <span className="text-white">AI-Powered</span>
              </div>
            </div>

            <Button
              onClick={() => setStarted(true)}
              className="bg-gradient-to-r from-purple-600 to-purple-800 text-white font-semibold px-10 py-6 text-lg hover:from-purple-500 hover:to-purple-700 shadow-lg shadow-purple-500/30 transition-all hover:shadow-xl hover:shadow-purple-500/40"
            >
              Start Your Free Assessment
              <ArrowUpRight className="w-5 h-5 ml-2" />
            </Button>

            <p className="text-purple-300/80 text-xs mt-8">
              Powered & Made by{" "}
              <span className="text-white font-medium">JJ Global Capital</span>
              {" "}• Part of{" "}
              <a href={JJ_HOLDING_URL} target="_blank" rel="noopener noreferrer" className="text-white hover:underline">
                JJ Holding Group
              </a>
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Form Screen after completing questions
  if (showForm) {
    return (
      <section className="min-h-screen bg-gradient-to-b from-purple-950 via-zinc-950 to-black flex flex-col">
        {/* Header */}
        <div className="border-b border-purple-900/30 bg-purple-950/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowForm(false)}
                className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Back to Questions
              </button>
              <div className="flex items-center gap-3 text-purple-300">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">Almost there!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-white text-3xl font-bold mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                Get Your Personalized Results
              </h2>
              <p className="text-zinc-400">
                Complete your details to receive your AI-curated property recommendations
              </p>
            </div>

            <div className="bg-zinc-900/80 rounded-2xl p-6 border border-purple-900/30 space-y-5 backdrop-blur-sm">
              <div>
                <Label htmlFor="fullName" className="text-zinc-300">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="mt-1.5 bg-zinc-800 border-zinc-700 text-white h-12 focus:border-purple-500"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-zinc-300">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1.5 bg-zinc-800 border-zinc-700 text-white h-12 focus:border-purple-500"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-zinc-300">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+971..."
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1.5 bg-zinc-800 border-zinc-700 text-white h-12 focus:border-purple-500"
                />
              </div>

              <div>
                <Label htmlFor="nationality" className="text-zinc-300">Nationality *</Label>
                <Select
                  value={formData.nationality}
                  onValueChange={(val) => setFormData({ ...formData, nationality: val })}
                >
                  <SelectTrigger className="mt-1.5 bg-zinc-800 border-zinc-700 text-white h-12 focus:border-purple-500">
                    <SelectValue placeholder="Select your nationality" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {NATIONALITIES.map((nat) => (
                      <SelectItem key={nat} value={nat} className="text-white hover:bg-zinc-700">
                        {nat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="language" className="text-zinc-300">Preferred Language *</Label>
                <Select
                  value={formData.preferredLanguage}
                  onValueChange={(val) => setFormData({ ...formData, preferredLanguage: val })}
                >
                  <SelectTrigger className="mt-1.5 bg-zinc-800 border-zinc-700 text-white h-12 focus:border-purple-500">
                    <SelectValue placeholder="Select your preferred language" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang} value={lang} className="text-white hover:bg-zinc-700">
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleSubmitForm}
                disabled={!isFormValid() || isSubmitting}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white font-semibold h-14 text-lg hover:from-purple-500 hover:to-purple-700 shadow-lg shadow-purple-500/30 mt-4 transition-all hover:shadow-xl hover:shadow-purple-500/40"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Finding Your Matches...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Get My Free Results
                  </>
                )}
              </Button>

              <p className="text-zinc-500 text-xs text-center">
                Your information is secure and will only be used to provide personalized recommendations
              </p>
            </div>

            <p className="text-purple-300/80 text-xs text-center mt-6">
              Powered & Made by{" "}
              <span className="text-white font-medium">JJ Global Capital</span>
              {" "}• Part of{" "}
              <a href={JJ_HOLDING_URL} target="_blank" rel="noopener noreferrer" className="text-white hover:underline">
                JJ Holding Group
              </a>
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-b from-purple-950 via-zinc-950 to-black flex flex-col">
      {/* Header */}
      <div className="border-b border-purple-900/30 bg-purple-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : navigate(-1)}
              className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              {currentStep > 0 ? "Back" : "Exit"}
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
            <Progress value={progress} className="h-1.5 bg-zinc-800 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-purple-700" />
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-white text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>
              {currentQuestion.question}
            </h2>
            {currentQuestion.type === "multiple" && (
              <p className="text-zinc-500">Select all that apply</p>
            )}
          </div>

          {/* Select All / Clear All for multiple choice */}
          {currentQuestion.type === "multiple" && "hasSelectAll" in currentQuestion && currentQuestion.hasSelectAll && (
            <div className="flex justify-center gap-3 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={allSelected()}
                className="border-purple-500/40 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 bg-transparent"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={!(answers[currentQuestion.id] as string[])?.length}
                className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white bg-transparent"
              >
                Clear Selection
              </Button>
            </div>
          )}

          <div className={`grid gap-3 ${currentQuestion.options.length > 4 ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-2"}`}>
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
                      ? "bg-gradient-to-br from-purple-600/30 to-purple-800/20 text-white border-purple-500/50 shadow-lg shadow-purple-500/20"
                      : "bg-zinc-900/80 text-white border-zinc-800 hover:border-purple-700/50 hover:bg-zinc-800/50"
                  }`}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <span className="font-medium">{option.label}</span>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-purple-400 ml-auto" />
                  )}
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
              disabled={!isAnswered()}
              className="bg-gradient-to-r from-purple-600 to-purple-800 text-white font-semibold px-8 shadow-lg shadow-purple-500/30 hover:from-purple-500 hover:to-purple-700"
            >
              {currentStep === QUIZ_QUESTIONS.length - 1 ? (
                <>
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
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