import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ChevronRight, ChevronLeft, Clock, Sparkles, Loader2, CheckCircle2,
  Wand2, ArrowUpRight, Building2, Home, Landmark, TreePine, Gift, Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCountryList, getLanguageList } from "@/constants/localeOptions";
import { PaymentModal } from "@/components/PaymentModal";
import { useQuizUsage } from "@/hooks/useQuizUsage";
import { useMembership } from "@/hooks/useMembership";



// Enhanced detailed quiz questions
const QUIZ_QUESTIONS = [
  {
    id: "property_type",
    question: "What type of property are you looking for?",
    type: "single" as const,
    options: [
      { value: "apartment", label: "Apartment / Flat", icon: "🏢" },
      { value: "villa", label: "Villa", icon: "🏠" },
      { value: "townhouse", label: "Townhouse", icon: "🏘️" },
      { value: "penthouse", label: "Penthouse", icon: "🌆" },
      { value: "plot", label: "Plot / Land", icon: "📐" },
      { value: "retail", label: "Retail / Commercial", icon: "🏪" },
    ],
  },
  {
    id: "purpose",
    question: "What's your primary purpose for this property?",
    type: "single" as const,
    options: [
      { value: "investment", label: "Investment & ROI", icon: "📈" },
      { value: "living", label: "Personal Residence", icon: "🏠" },
      { value: "vacation", label: "Vacation Home", icon: "🏖️" },
      { value: "both", label: "Both Investment & Living", icon: "🎯" },
      { value: "rental", label: "Rental Income", icon: "💵" },
    ],
  },
  {
    id: "budget",
    question: "What's your budget range?",
    type: "single" as const,
    options: [
      { value: "under-1m", label: "Under AED 1M", icon: "💰" },
      { value: "1m-2m", label: "AED 1M - 2M", icon: "💰" },
      { value: "2m-5m", label: "AED 2M - 5M", icon: "💎" },
      { value: "5m-10m", label: "AED 5M - 10M", icon: "💎" },
      { value: "10m-20m", label: "AED 10M - 20M", icon: "🏆" },
      { value: "20m-plus", label: "AED 20M+", icon: "👑" },
    ],
  },
  {
    id: "bedrooms",
    question: "How many bedrooms do you need?",
    type: "single" as const,
    options: [
      { value: "studio", label: "Studio", icon: "1️⃣" },
      { value: "1br", label: "1 Bedroom", icon: "1️⃣" },
      { value: "2br", label: "2 Bedrooms", icon: "2️⃣" },
      { value: "3br", label: "3 Bedrooms", icon: "3️⃣" },
      { value: "4br", label: "4 Bedrooms", icon: "4️⃣" },
      { value: "5br", label: "5 Bedrooms", icon: "5️⃣" },
      { value: "6br-plus", label: "6+ Bedrooms", icon: "🏰" },
    ],
  },
  {
    id: "size_preference",
    question: "What size range are you looking for? (in sqft)",
    type: "single" as const,
    options: [
      { value: "under-1000", label: "Under 1,000 sqft", icon: "📏" },
      { value: "1000-2000", label: "1,000 - 2,000 sqft", icon: "📏" },
      { value: "2000-3500", label: "2,000 - 3,500 sqft", icon: "📐" },
      { value: "3500-5000", label: "3,500 - 5,000 sqft", icon: "📐" },
      { value: "5000-10000", label: "5,000 - 10,000 sqft", icon: "🏡" },
      { value: "10000-plus", label: "10,000+ sqft", icon: "🏰" },
    ],
  },
  {
    id: "areas",
    question: "Which areas are you interested in?",
    type: "multiple" as const,
    hasSelectAll: true,
    options: [
      { value: "downtown", label: "Downtown Dubai", icon: "🏙️" },
      { value: "marina", label: "Dubai Marina", icon: "⛵" },
      { value: "palm", label: "Palm Jumeirah", icon: "🌴" },
      { value: "jbr", label: "JBR", icon: "🏖️" },
      { value: "business-bay", label: "Business Bay", icon: "🏢" },
      { value: "jumeirah", label: "Jumeirah", icon: "🌊" },
      { value: "creek-harbour", label: "Dubai Creek Harbour", icon: "🌅" },
      { value: "hills", label: "Dubai Hills Estate", icon: "⛳" },
      { value: "emaar-south", label: "Emaar South", icon: "✈️" },
      { value: "arabian-ranches", label: "Arabian Ranches", icon: "🐎" },
      { value: "meydan", label: "Meydan", icon: "🏇" },
      { value: "sobha-hartland", label: "Sobha Hartland", icon: "🌳" },
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
      { value: "ajman", label: "Ajman", icon: "🌊" },
      { value: "any", label: "Open to All", icon: "🗺️" },
    ],
  },
  {
    id: "location_type",
    question: "What type of location do you prefer?",
    type: "single" as const,
    options: [
      { value: "beachfront", label: "Beachfront / Waterfront", icon: "🌊" },
      { value: "city-center", label: "City Center / Downtown", icon: "🌆" },
      { value: "golf-community", label: "Golf Course Community", icon: "⛳" },
      { value: "suburban", label: "Suburban / Family Area", icon: "🌳" },
      { value: "island", label: "Island Living", icon: "🏝️" },
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
      { value: "creek", label: "Creek View", icon: "🌅" },
      { value: "pool", label: "Pool View", icon: "🏊" },
    ],
  },
  {
    id: "features",
    question: "Do you need any of these special features?",
    type: "multiple" as const,
    hasSelectAll: true,
    options: [
      { value: "private-pool", label: "Private Pool", icon: "🏊" },
      { value: "private-garden", label: "Private Garden", icon: "🌿" },
      { value: "driver-room", label: "Driver's Room", icon: "🚗" },
      { value: "maid-room", label: "Maid's Room", icon: "🏠" },
      { value: "study", label: "Study / Office", icon: "📚" },
      { value: "storage", label: "Storage Room", icon: "📦" },
      { value: "balcony", label: "Large Balcony / Terrace", icon: "🌇" },
      { value: "smart-home", label: "Smart Home System", icon: "🤖" },
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
      { value: "tennis", label: "Tennis Court", icon: "🎾" },
      { value: "business", label: "Business Center", icon: "💼" },
    ],
  },
  {
    id: "furnished",
    question: "What's your furnishing preference?",
    type: "single" as const,
    options: [
      { value: "furnished", label: "Fully Furnished", icon: "🛋️" },
      { value: "semi-furnished", label: "Semi-Furnished", icon: "🪑" },
      { value: "unfurnished", label: "Unfurnished", icon: "📦" },
      { value: "flexible", label: "Flexible", icon: "🤷" },
    ],
  },
  {
    id: "timeline",
    question: "When do you need the property?",
    type: "single" as const,
    options: [
      { value: "ready", label: "Ready to Move", icon: "✅" },
      { value: "2025", label: "2025", icon: "📅" },
      { value: "2026", label: "2026", icon: "📅" },
      { value: "2027", label: "2027", icon: "📅" },
      { value: "2028-plus", label: "2028 or Later", icon: "🔮" },
      { value: "flexible", label: "Flexible", icon: "🤷" },
    ],
  },
  {
    id: "payment_preference",
    question: "What's your preferred payment structure?",
    type: "single" as const,
    options: [
      { value: "cash", label: "Full Cash Payment", icon: "💵" },
      { value: "payment-plan", label: "Developer Payment Plan", icon: "📊" },
      { value: "mortgage", label: "Bank Mortgage", icon: "🏦" },
      { value: "flexible", label: "Flexible", icon: "🤷" },
    ],
  },
];

const LANGUAGES = getLanguageList();
const NATIONALITIES = getCountryList();

const Quiz = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasUsedFreeQuiz, markFreeUsed } = useQuizUsage();
  const { hasActiveMembership } = useMembership();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationality: "",
    preferredLanguage: "",
  });
  const estimatedTime = 60;

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
      
      if (budget === "under-1m" && priceFrom >= 1000000) return false;
      if (budget === "1m-2m" && (priceFrom < 1000000 || priceFrom >= 2000000)) return false;
      if (budget === "2m-5m" && (priceFrom < 2000000 || priceFrom >= 5000000)) return false;
      if (budget === "5m-10m" && (priceFrom < 5000000 || priceFrom >= 10000000)) return false;
      if (budget === "10m-20m" && (priceFrom < 10000000 || priceFrom >= 20000000)) return false;
      if (budget === "20m-plus" && priceFrom < 20000000) return false;

      const bedrooms = answers.bedrooms;
      const minBr = project.bedrooms_min || 0;
      const maxBr = project.bedrooms_max || minBr;
      
      if (bedrooms === "studio" && minBr > 0) return false;
      if (bedrooms === "1br" && (minBr > 1 || maxBr < 1)) return false;
      if (bedrooms === "2br" && (minBr > 2 || maxBr < 2)) return false;
      if (bedrooms === "3br" && (minBr > 3 || maxBr < 3)) return false;
      if (bedrooms === "4br" && (minBr > 4 || maxBr < 4)) return false;
      if (bedrooms === "5br" && (minBr > 5 || maxBr < 5)) return false;
      if (bedrooms === "6br-plus" && maxBr < 6) return false;

      const emirate = answers.emirate;
      const projectEmirate = project.emirate?.toLowerCase().trim() || "";
      
      if (emirate && emirate !== "any") {
        if (emirate === "dubai" && projectEmirate !== "dubai") return false;
        if (emirate === "abu-dhabi" && !projectEmirate.includes("abu dhabi")) return false;
        if (emirate === "rak" && !projectEmirate.includes("ras al khaimah")) return false;
        if (emirate === "sharjah" && projectEmirate !== "sharjah") return false;
        if (emirate === "ajman" && projectEmirate !== "ajman") return false;
      }

      return true;
    });

    return filteredProjects
      .map((project) => {
        let score = 100;

        const location = answers.location_type;
        const projectViews = project.views || [];
        if (location === "beachfront" && projectViews.some((v: string) => v.toLowerCase().includes("sea") || v.toLowerCase().includes("beach"))) score += 20;
        if (location === "city-center" && projectViews.some((v: string) => v.toLowerCase().includes("city") || v.toLowerCase().includes("skyline"))) score += 20;
        if (location === "golf-community" && projectViews.some((v: string) => v.toLowerCase().includes("golf"))) score += 20;
        if (location === "suburban" && projectViews.some((v: string) => v.toLowerCase().includes("garden"))) score += 20;

        const timeline = answers.timeline;
        const handover = project.handover_date?.toLowerCase() || "";
        if (timeline === "ready" && handover.includes("ready")) score += 15;
        if (timeline === "2025" && handover.includes("2025")) score += 15;
        if (timeline === "2026" && handover.includes("2026")) score += 15;
        if (timeline === "2027" && handover.includes("2027")) score += 15;
        if (timeline === "2028-plus" && (handover.includes("2028") || handover.includes("2029"))) score += 15;
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

  // Check if user needs to pay (has used free and no VIP membership)
  const needsPayment = hasUsedFreeQuiz && !hasActiveMembership;

  const handleSubmitForm = async () => {
    if (!isFormValid()) return;
    
    // If user has already used free trial and doesn't have VIP, show payment
    if (needsPayment) {
      setShowPayment(true);
      return;
    }
    
    // Otherwise, proceed directly (FREE one-time use)
    await proceedToResults();
  };

  const proceedToResults = async () => {
    setIsSubmitting(true);
    try {
      const recommendations = getRecommendations();
      const sessionId = `quiz-${(crypto as any)?.randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

      // Persist quiz responses only for authenticated users
      if (user?.id) {
        await supabase.from("quiz_responses").insert({
          user_id: user.id,
          session_id: sessionId,
          answers: {
            ...answers,
            userInfo: formData,
          },
          recommended_project_ids: recommendations.slice(0, 5).map((p) => p.id),
        });
      }

      // Mark free usage
      markFreeUsed();

      const slugs = recommendations.slice(0, 5).map((p) => p.slug).join(",");
      navigate(`/quiz-results?projects=${slugs}&session=${sessionId}&free=true`);
    } catch (error) {
      console.error("Error saving quiz:", error);
      const recommendations = getRecommendations();
      const slugs = recommendations.slice(0, 5).map((p) => p.slug).join(",");
      markFreeUsed();
      navigate(`/quiz-results?projects=${slugs}&free=true`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async () => {
    await proceedToResults();
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
              <Gift className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">
                {hasUsedFreeQuiz ? "VIP Package Required" : "Complimentary First Use"}
              </span>
            </div>

            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 via-purple-600 to-purple-800 mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-purple-500/30">
              <Wand2 className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              AI Property Finder
            </h1>
            
            <p className="text-zinc-400 text-lg mb-6 max-w-lg mx-auto">
              {hasUsedFreeQuiz 
                ? "Upgrade to VIP for unlimited AI-powered property matching and analysis."
                : "Try our AI Property Matchmaker and Analysis completely FREE for your first use!"
              }
            </p>

            {/* Free vs VIP Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-lg mx-auto">
              {/* Free Tier */}
              <div className={`rounded-2xl p-5 text-left transition-all ${!hasUsedFreeQuiz ? "bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-2 border-green-500/50" : "bg-zinc-800/50 border border-zinc-700/50 opacity-60"}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Gift className={`w-5 h-5 ${!hasUsedFreeQuiz ? "text-green-400" : "text-zinc-500"}`} />
                  <span className={`font-semibold ${!hasUsedFreeQuiz ? "text-green-400" : "text-zinc-500"}`}>
                    {hasUsedFreeQuiz ? "Free Trial Used" : "FREE Trial"}
                  </span>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>1 AI Property Match</span>
                  </li>
                  <li className="flex items-center gap-2 text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>1 AI Comparison Report</span>
                  </li>
                  <li className="flex items-center gap-2 text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Download Excel Report</span>
                  </li>
                </ul>
              </div>

              {/* VIP Tier */}
              <div className="bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-gold/50 rounded-2xl p-5 text-left relative overflow-hidden">
                <div className="absolute -top-1 -right-1 bg-gold text-black text-xs font-bold px-2 py-1 rounded-bl-lg">
                  $100/yr
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="w-5 h-5 text-gold" />
                  <span className="font-semibold text-gold">VIP Package</span>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                    <span>Unlimited Matches</span>
                  </li>
                  <li className="flex items-center gap-2 text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                    <span>Unlimited AI Analysis</span>
                  </li>
                  <li className="flex items-center gap-2 text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                    <span>Priority Expert Support</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-400 mb-10">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-purple-600/30 flex items-center justify-center">
                  <Clock className="w-3 h-3 text-white" />
                </div>
                <span className="text-white">~60 seconds</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-purple-600/30 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <span className="text-white">AI-Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-purple-600/30 flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
                <span className="text-white">{hasUsedFreeQuiz ? "VIP Required" : "First Use FREE"}</span>
              </div>
            </div>

            <Button
              onClick={() => setStarted(true)}
              className={`font-semibold px-10 py-6 text-lg shadow-lg transition-all hover:shadow-xl ${
                hasUsedFreeQuiz 
                  ? "bg-gradient-to-r from-gold via-gold to-gold-dark text-black hover:brightness-110 shadow-gold/30 hover:shadow-gold/40"
                  : "bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:from-purple-500 hover:to-purple-700 shadow-purple-500/30 hover:shadow-purple-500/40"
              }`}
            >
              {hasUsedFreeQuiz ? (
                <>
                  <Crown className="w-5 h-5 mr-2" />
                  Continue with VIP
                </>
              ) : (
                <>
                  Get Free Property Match
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            <p className="text-zinc-500 text-xs mt-6">
              Save money by choosing the right property the first time
            </p>

            <p className="text-purple-300/80 text-xs mt-8">
              Software developed by <span className="text-white font-medium">Jane Abou Jaoude</span><br />
              Powered by{" "}
              <span className="text-white font-medium">JJ Global Capital</span>
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
                Get Your AI Analysis
              </h2>
              <p className="text-zinc-400">
                Enter your details to receive your personalized property recommendations
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-purple-900/30 rounded-2xl p-6 md:p-8">
              <div className="space-y-5">
                <div>
                  <Label className="text-zinc-300 mb-2 block">Full Name *</Label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <Label className="text-zinc-300 mb-2 block">Email Address *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email"
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <Label className="text-zinc-300 mb-2 block">Phone Number *</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+971 XX XXX XXXX"
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <Label className="text-zinc-300 mb-2 block">Nationality *</Label>
                  <Select
                    value={formData.nationality}
                    onValueChange={(value) => setFormData({ ...formData, nationality: value })}
                  >
                    <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white focus:border-purple-500">
                      <SelectValue placeholder="Select your nationality" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 max-h-60">
                      {NATIONALITIES.map((nat) => (
                        <SelectItem key={nat} value={nat} className="text-white hover:bg-purple-900/30">
                          {nat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-zinc-300 mb-2 block">Preferred Language *</Label>
                  <Select
                    value={formData.preferredLanguage}
                    onValueChange={(value) => setFormData({ ...formData, preferredLanguage: value })}
                  >
                    <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white focus:border-purple-500">
                      <SelectValue placeholder="Select preferred language" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 max-h-60">
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang} value={lang} className="text-white hover:bg-purple-900/30">
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleSubmitForm}
                disabled={!isFormValid() || isSubmitting}
                className={`w-full mt-6 font-semibold py-6 text-lg disabled:opacity-50 ${
                  needsPayment
                    ? "bg-gradient-to-r from-gold via-gold to-gold-dark text-black hover:brightness-110"
                    : "bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:from-purple-500 hover:to-purple-700"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : needsPayment ? (
                  <>
                    <Crown className="w-5 h-5 mr-2" />
                    Upgrade to VIP ($100/year)
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5 mr-2" />
                    Get Free AI Analysis
                  </>
                )}
              </Button>

              {!needsPayment && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mt-4 text-center">
                  <p className="text-green-400 text-sm font-medium">
                    ✨ Your first AI Property Match & Analysis is FREE!
                  </p>
                </div>
              )}

              {needsPayment && (
                <div className="bg-gold/10 border border-gold/30 rounded-lg p-3 mt-4 text-center">
                  <p className="text-gold text-sm">
                    You've used your free trial. Upgrade to VIP for unlimited access.
                  </p>
                </div>
              )}

              <p className="text-purple-300/60 text-xs text-center mt-6">
                Software developed by <span className="text-white">Jane Abou Jaoude</span><br />
                Powered by <span className="text-white">JJ Global Capital</span>
              </p>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        <PaymentModal
          open={showPayment}
          onOpenChange={setShowPayment}
          onSuccess={handlePaymentSuccess}
          userInfo={formData}
          mode="regenerate"
        />
      </section>
    );
  }

  // Quiz Questions Screen
  return (
    <section className="min-h-screen bg-gradient-to-b from-purple-950 via-zinc-950 to-black flex flex-col">
      {/* Header */}
      <div className="border-b border-purple-900/30 bg-purple-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : setStarted(false)}
              className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              {currentStep > 0 ? "Back" : "Exit"}
            </button>
            <div className="text-zinc-400 text-sm">
              Question {currentStep + 1} of {QUIZ_QUESTIONS.length}
            </div>
          </div>
          <Progress value={progress} className="h-1.5 bg-zinc-800" />
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-2xl">
          <h2
            className="text-white text-2xl md:text-3xl font-bold mb-8 text-center"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {currentQuestion.question}
          </h2>

          {/* Multiple Select Controls */}
          {currentQuestion.type === "multiple" && currentQuestion.hasSelectAll && (
            <div className="flex justify-center gap-4 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={allSelected()}
                className="border-purple-500/50 text-white hover:bg-purple-500/10"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={!answers[currentQuestion.id] || (answers[currentQuestion.id] as string[]).length === 0}
                className="border-zinc-700 text-white hover:bg-zinc-800"
              >
                Clear All
              </Button>
            </div>
          )}

          {/* Options Grid */}
          <div className={`grid gap-3 ${currentQuestion.options.length > 6 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2'}`}>
            {currentQuestion.options.map((option) => {
              const isSelected =
                currentQuestion.type === "multiple"
                  ? (answers[currentQuestion.id] as string[] || []).includes(option.value)
                  : answers[currentQuestion.id] === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className={`relative p-4 md:p-5 rounded-xl border-2 transition-all text-left group ${
                    isSelected
                      ? "border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20"
                      : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800/50"
                  }`}
                >
                  {currentQuestion.type === "multiple" && (
                    <div className={`absolute top-3 right-3 w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected ? "border-purple-500 bg-purple-500" : "border-zinc-600"
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                  )}
                  <span className="text-2xl mb-2 block">{option.icon}</span>
                  <span className={`font-medium text-sm md:text-base ${isSelected ? "text-white" : "text-zinc-300"}`}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex justify-center mt-10">
            <Button
              onClick={handleNext}
              disabled={!isAnswered()}
              className="bg-gradient-to-r from-purple-600 to-purple-800 text-white font-semibold px-10 py-6 text-lg hover:from-purple-500 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
            >
              {currentStep === QUIZ_QUESTIONS.length - 1 ? "Continue" : "Next"}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Quiz;
