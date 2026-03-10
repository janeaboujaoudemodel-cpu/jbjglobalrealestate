import { useState, useEffect } from "react";
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
import { getCountryList, getLanguageList } from "@/constants/localeOptions";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PaymentModal } from "@/components/PaymentModal";
import { useQuizUsage } from "@/hooks/useQuizUsage";
import { useMembership } from "@/hooks/useMembership";
import { FounderContent } from "@/components/FounderContent";



// Optimized quiz questions - reduced duplicates, streamlined flow
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
      { value: "investment", label: "Investment", icon: "" },
      { value: "living", label: "Personal Residence", icon: "" },
      { value: "both", label: "Both Investment & Living", icon: "" },
      { value: "rental", label: "Rental Income", icon: "" },
    ],
  },
  {
    id: "budget",
    question: "What's your budget range?",
    type: "single" as const,
    options: [
      { value: "under-1m", label: "Under AED 1M", icon: "" },
      { value: "1m-2m", label: "AED 1M - 2M", icon: "" },
      { value: "2m-5m", label: "AED 2M - 5M", icon: "" },
      { value: "5m-10m", label: "AED 5M - 10M", icon: "" },
      { value: "10m-plus", label: "AED 10M+", icon: "" },
    ],
  },
  {
    id: "bedrooms",
    question: "How many bedrooms do you need?",
    type: "single" as const,
    options: [
      { value: "studio", label: "Studio", icon: "" },
      { value: "1br", label: "1 Bedroom", icon: "" },
      { value: "2br", label: "2 Bedrooms", icon: "" },
      { value: "3br", label: "3 Bedrooms", icon: "" },
      { value: "4br-plus", label: "4+ Bedrooms", icon: "" },
    ],
  },
  {
    id: "areas",
    question: "Which areas are you interested in?",
    type: "multiple" as const,
    hasSelectAll: true,
    options: [
      { value: "downtown", label: "Downtown Dubai", icon: "" },
      { value: "marina", label: "Dubai Marina", icon: "" },
      { value: "palm", label: "Palm Jumeirah", icon: "" },
      { value: "business-bay", label: "Business Bay", icon: "" },
      { value: "creek-harbour", label: "Dubai Creek Harbour", icon: "" },
      { value: "hills", label: "Dubai Hills Estate", icon: "" },
      { value: "arabian-ranches", label: "Arabian Ranches", icon: "" },
      { value: "other", label: "Other Areas", icon: "" },
    ],
  },
  {
    id: "location_type",
    question: "What type of location do you prefer?",
    type: "multiple" as const,
    hasSelectAll: true,
    options: [
      { value: "beachfront", label: "Beachfront / Waterfront", icon: "" },
      { value: "city-center", label: "City Center / Downtown", icon: "" },
      { value: "golf-community", label: "Golf Course Community", icon: "" },
      { value: "suburban", label: "Suburban / Family Area", icon: "" },
      { value: "flexible", label: "Open to All", icon: "" },
    ],
  },
  {
    id: "views_and_features",
    question: "What features matter most to you?",
    type: "multiple" as const,
    hasSelectAll: true,
    options: [
      { value: "sea-view", label: "Sea / Water View", icon: "" },
      { value: "city-view", label: "City / Skyline View", icon: "" },
      { value: "private-pool", label: "Private Pool", icon: "" },
      { value: "private-garden", label: "Private Garden", icon: "" },
      { value: "maid-room", label: "Maid's Room", icon: "" },
      { value: "balcony", label: "Large Balcony / Terrace", icon: "" },
    ],
  },
  {
    id: "timeline",
    question: "When do you need the property?",
    type: "single" as const,
    options: [
      { value: "ready", label: "Ready to Move", icon: "" },
      { value: "2025", label: "2025", icon: "" },
      { value: "2026", label: "2026", icon: "" },
      { value: "2027-plus", label: "2027 or Later", icon: "" },
      { value: "flexible", label: "Flexible", icon: "" },
    ],
  },
  {
    id: "payment_preference",
    question: "What's your preferred payment structure?",
    type: "single" as const,
    options: [
      { value: "cash", label: "Full Cash Payment", icon: "" },
      { value: "payment-plan", label: "Developer Payment Plan", icon: "" },
      { value: "mortgage", label: "Bank Mortgage", icon: "" },
      { value: "flexible", label: "Flexible", icon: "" },
    ],
  },
];

// Area value to database area name mapping for hard filtering
const AREA_NAME_MAP: Record<string, string[]> = {
  "downtown": ["downtown"],
  "marina": ["marina"],
  "palm": ["palm jumeirah", "palm"],
  "business-bay": ["business bay"],
  "creek-harbour": ["creek harbour", "creek", "dubai creek"],
  "hills": ["dubai hills", "hills estate"],
  "arabian-ranches": ["arabian ranches"],
};

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
  const estimatedTime = 45;

  // Auto-fill form data from logged-in user's profile
  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("id", user.id).single()
        .then(({ data }) => {
          if (data) {
            setFormData(prev => ({
              fullName: (data as any).full_name || (data as any).display_name || prev.fullName,
              email: user.email || prev.email,
              phone: (data as any).phone || prev.phone,
              nationality: (data as any).nationality || prev.nationality,
              preferredLanguage: (data as any).preferred_language || prev.preferredLanguage,
            }));
          } else {
            setFormData(prev => ({ ...prev, email: user.email || prev.email }));
          }
        });
    }
  }, [user]);

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
      if (user && isFormValid()) {
        proceedToResults();
      } else {
        setShowForm(true);
      }
    }
  };

  const getRecommendations = () => {
    if (!allProjects?.length) return [];

    // Build hard area filter from selected areas
    const preferredAreas = (answers.areas as string[]) || [];
    const hasOther = preferredAreas.includes("other");
    const specificAreas = preferredAreas.filter(a => a !== "other");
    const areaKeywords: string[] = [];
    specificAreas.forEach(area => {
      const mapped = AREA_NAME_MAP[area];
      if (mapped) areaKeywords.push(...mapped);
    });
    const useHardAreaFilter = areaKeywords.length > 0 && !hasOther;

    const filteredProjects = allProjects.filter((project) => {
      if (project.is_sold_out) return false;
      const saleStatusLower = (project.sale_status || "").toLowerCase();
      if (saleStatusLower.includes("sold") || saleStatusLower.includes("out_of_stock")) return false;

      if (project.handover_date) {
        const hLower = project.handover_date.toLowerCase();
        if (!hLower.includes("ready")) {
          const yearMatch = project.handover_date.match(/\b(20\d{2})\b/);
          if (yearMatch && parseInt(yearMatch[1]) < 2026) return false;
        }
      }

      if (!project.cover_image_url) return false;

      // Budget hard filter
      const priceFrom = project.price_from;
      const budget = answers.budget;
      if (priceFrom != null) {
        if (budget === "under-1m" && priceFrom >= 1000000) return false;
        if (budget === "1m-2m" && (priceFrom < 1000000 || priceFrom >= 2000000)) return false;
        if (budget === "2m-5m" && (priceFrom < 2000000 || priceFrom >= 5000000)) return false;
        if (budget === "5m-10m" && (priceFrom < 5000000 || priceFrom >= 10000000)) return false;
        if (budget === "10m-plus" && priceFrom < 10000000) return false;
      }

      // Bedroom hard filter
      const bedrooms = answers.bedrooms;
      const minBr = project.bedrooms_min;
      const maxBr = project.bedrooms_max ?? minBr;
      if (minBr != null) {
        const minBrNum = minBr ?? 0;
        const maxBrNum = maxBr ?? minBrNum;
        if (bedrooms === "studio" && minBrNum > 0) return false;
        if (bedrooms === "1br" && (minBrNum > 1 || maxBrNum < 1)) return false;
        if (bedrooms === "2br" && (minBrNum > 2 || maxBrNum < 2)) return false;
        if (bedrooms === "3br" && (minBrNum > 3 || maxBrNum < 3)) return false;
        if (bedrooms === "4br-plus" && maxBrNum < 4) return false;
      }

      // HARD AREA FILTER: Only show projects in selected areas
      if (useHardAreaFilter) {
        const projectName = (project.name || "").toLowerCase();
        const projectLocation = (project.location || "").toLowerCase();
        const projectAreaName = ((project as any).area_name || "").toLowerCase();
        const matchesArea = areaKeywords.some(keyword =>
          projectName.includes(keyword) ||
          projectLocation.includes(keyword) ||
          projectAreaName.includes(keyword)
        );
        if (!matchesArea) return false;
      }

      // Timeline hard filter for "ready"
      const timeline = answers.timeline;
      if (timeline === "ready") {
        const handover = (project.handover_date || "").toLowerCase();
        const constructionStatus = ((project as any).construction_status || "").toLowerCase();
        if (!handover.includes("ready") && !constructionStatus.includes("ready") && !constructionStatus.includes("completed")) {
          return false;
        }
      }

      return true;
    });

    return filteredProjects
      .map((project) => {
        let score = 100;

        if (project.price_from) score += 10;
        if (project.bedrooms_min != null) score += 5;
        if (project.cover_image_url || project.images?.[0]?.image_url) score += 5;

        const location = answers.location_type;
        const projectViews = project.views || [];
        const locationArr = Array.isArray(location) ? location : (location ? [location] : []);
        locationArr.forEach((loc: string) => {
          if (loc === "beachfront" && projectViews.some((v: string) => v.toLowerCase().includes("sea") || v.toLowerCase().includes("beach"))) score += 20;
          if (loc === "city-center" && projectViews.some((v: string) => v.toLowerCase().includes("city") || v.toLowerCase().includes("skyline"))) score += 20;
          if (loc === "golf-community" && projectViews.some((v: string) => v.toLowerCase().includes("golf"))) score += 20;
          if (loc === "suburban" && projectViews.some((v: string) => v.toLowerCase().includes("garden"))) score += 20;
          if (loc === "flexible") score += 10;
        });

        const timeline = answers.timeline;
        const handover = project.handover_date?.toLowerCase() || "";
        if (timeline === "ready" && handover.includes("ready")) score += 15;
        if (timeline === "2025" && handover.includes("2025")) score += 15;
        if (timeline === "2026" && handover.includes("2026")) score += 15;
        if (timeline === "2027-plus" && (handover.includes("2027") || handover.includes("2028") || handover.includes("2029"))) score += 15;
        if (timeline === "flexible") score += 10;

        const preferredFeatures = answers.views_and_features as string[] || [];
        preferredFeatures.forEach((pf) => {
          if (pf.includes("view") && projectViews.some((v: string) => v.toLowerCase().includes(pf.replace("-view", "")))) score += 5;
          const projectAmenities = project.amenities || [];
          if (projectAmenities.some((a: string) => a.toLowerCase().includes(pf.replace("-", " ")))) score += 3;
        });

        // Area scoring boost (soft score for when "other" is selected alongside specific areas)
        if (hasOther && areaKeywords.length > 0) {
          const projectName = (project.name || "").toLowerCase();
          const projectLocation = (project.location || "").toLowerCase();
          areaKeywords.forEach(keyword => {
            if (projectName.includes(keyword) || projectLocation.includes(keyword)) score += 10;
          });
        }

        return { ...project, matchScore: score };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  };

  // All features are now FREE - no payment required
  const needsPayment = false;

  const handleSubmitForm = async () => {
    if (!isFormValid()) return;
    await proceedToResults();
  };

  const proceedToResults = async () => {
    setIsSubmitting(true);
    try {
      const recommendations = getRecommendations();
      const sessionId = `quiz-${(crypto as any)?.randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

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
      <section className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] flex flex-col">
        {/* Header */}
        <div className="border-b border-[#C9A84C]/20 bg-white/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate(-1)}
                className="text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Exit
              </button>
              <div className="flex items-center gap-3 text-stone-500">
                <Clock className="w-4 h-4" />
                <span className="text-sm">~{estimatedTime} seconds</span>
              </div>
            </div>
          </div>
        </div>

        {/* Intro Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-2xl text-center">
            {/* Free Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#C9A84C]/20 to-[#C9A84C]/10 border border-[#C9A84C]/40 mb-8">
              <Gift className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-stone-800 text-sm font-medium">
                Completely Free
              </span>
            </div>

            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#B8973F] mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-[#C9A84C]/30">
              <Wand2 className="w-10 h-10 text-black" />
            </div>

            <h1 className="text-stone-900 text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              AI Property Finder
            </h1>
            
            <p className="text-stone-500 text-lg mb-6 max-w-lg mx-auto">
              Try our AI Property Matchmaker and Analysis completely FREE!
            </p>

            {/* Single Free Card */}
            <div className="max-w-sm mx-auto mb-8">
              <div className="rounded-2xl p-5 text-left bg-gradient-to-br from-[#C9A84C]/15 to-[#C9A84C]/5 border-2 border-[#C9A84C]/40">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="w-5 h-5 text-[#C9A84C]" />
                  <span className="font-semibold text-[#C9A84C]">FREE Access</span>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-stone-700">
                    <CheckCircle2 className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
                    <span>Unlimited AI Property Matches</span>
                  </li>
                  <li className="flex items-center gap-2 text-stone-700">
                    <CheckCircle2 className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
                    <span>AI Comparison Reports</span>
                  </li>
                  <li className="flex items-center gap-2 text-stone-700">
                    <CheckCircle2 className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
                    <span>Download Excel Report</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-stone-500 mb-10">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
                  <Clock className="w-3 h-3 text-[#C9A84C]" />
                </div>
                <span className="text-stone-700">~60 seconds</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-[#C9A84C]" />
                </div>
                <span className="text-stone-700">AI-Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-[#C9A84C]" />
                </div>
                <span className="text-stone-700">100% Free</span>
              </div>
            </div>

            <Button
              onClick={() => setStarted(true)}
              className="font-semibold px-10 py-6 text-lg shadow-lg transition-all hover:shadow-xl bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-black hover:brightness-110 shadow-[#C9A84C]/30"
            >
              Find My Property
              <ArrowUpRight className="w-5 h-5 ml-2" />
            </Button>

            <p className="text-stone-400 text-xs mt-6">
              Save money by choosing the right property the first time
            </p>

            <p className="text-stone-400 text-xs mt-8 leading-relaxed">
              Software developed and implemented by<br />
              <FounderContent fallback={<span className="text-stone-700 font-medium">JBJ Global Real Estate Team</span>}>
                <span className="text-stone-700 font-medium">The Founder & CEO, Jane Bou Jaoude</span>
              </FounderContent><br />
              Designed exclusively for{" "}
              <span className="text-stone-700 font-medium">JBJ Global Real Estate</span>
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Form Screen after completing questions
  if (showForm) {
    return (
      <section className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] flex flex-col">
        {/* Header */}
        <div className="border-b border-[#C9A84C]/20 bg-white/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowForm(false)}
                className="text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Back to Questions
              </button>
              <div className="flex items-center gap-3 text-[#C9A84C]">
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
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#B8973F] mx-auto mb-4 flex items-center justify-center shadow-lg shadow-[#C9A84C]/30">
                <Sparkles className="w-8 h-8 text-black" />
              </div>
              <h2 className="text-stone-900 text-3xl font-bold mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                Get Your AI Analysis
              </h2>
              <p className="text-stone-500">
                Enter your details to receive your personalized property recommendations
              </p>
            </div>

            <div className="bg-white/70 border border-[#C9A84C]/30 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
              <div className="space-y-5">
                <div>
                  <Label className="text-stone-700 mb-2 block">Full Name *</Label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    className="bg-white border-[#C9A84C]/30 text-stone-900 placeholder:text-stone-400 focus:border-[#C9A84C]"
                  />
                </div>
                <div>
                  <Label className="text-stone-700 mb-2 block">Email Address *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email"
                    className="bg-white border-[#C9A84C]/30 text-stone-900 placeholder:text-stone-400 focus:border-[#C9A84C]"
                  />
                </div>
                <div>
                  <Label className="text-stone-700 mb-2 block">Phone Number *</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+971 XX XXX XXXX"
                    className="bg-white border-[#C9A84C]/30 text-stone-900 placeholder:text-stone-400 focus:border-[#C9A84C]"
                  />
                </div>
                <div>
                  <Label className="text-stone-700 mb-2 block">Nationality *</Label>
                  <SearchableSelect
                    value={formData.nationality}
                    onChange={(value) => setFormData({ ...formData, nationality: value })}
                    options={NATIONALITIES}
                    placeholder="Select your nationality"
                    searchPlaceholder="Search countries..."
                    priorityItem="United Arab Emirates"
                    triggerClassName="bg-white border-[#C9A84C]/30 text-stone-900 hover:bg-[#F5F0E6] hover:text-stone-900"
                    className="bg-white border-[#C9A84C]/30"
                  />
                </div>
                <div>
                  <Label className="text-stone-700 mb-2 block">Preferred Language *</Label>
                  <SearchableSelect
                    value={formData.preferredLanguage}
                    onChange={(value) => setFormData({ ...formData, preferredLanguage: value })}
                    options={LANGUAGES}
                    placeholder="Select preferred language"
                    searchPlaceholder="Search languages..."
                    priorityItem="English"
                    triggerClassName="bg-white border-[#C9A84C]/30 text-stone-900 hover:bg-[#F5F0E6] hover:text-stone-900"
                    className="bg-white border-[#C9A84C]/30"
                  />
                </div>
              </div>

              <Button
                onClick={handleSubmitForm}
                disabled={!isFormValid() || isSubmitting}
                className={`w-full mt-6 font-semibold py-6 text-lg disabled:opacity-50 ${
                  needsPayment
                    ? "bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-black hover:brightness-110"
                    : "bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-black hover:brightness-110"
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
                <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-lg p-3 mt-4 text-center">
                  <p className="text-[#C9A84C] text-sm font-medium">
                    Your first AI Property Match & Analysis is FREE!
                  </p>
                </div>
              )}

              {needsPayment && (
                <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-lg p-3 mt-4 text-center">
                  <p className="text-[#C9A84C] text-sm">
                    You've used your free trial. Upgrade to VIP for unlimited access.
                  </p>
                </div>
              )}

              <p className="text-stone-400 text-xs text-center mt-6 leading-relaxed">
                Software developed and implemented by<br />
                <FounderContent fallback={<span className="text-stone-700">JBJ Global Real Estate Team</span>}>
                  <span className="text-stone-700">The Founder & CEO, Jane Bou Jaoude</span>
                </FounderContent><br />
                Designed exclusively for <span className="text-stone-700">JBJ Global Real Estate</span>
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
    <section className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] flex flex-col">
      {/* Header */}
      <div className="border-b border-[#C9A84C]/20 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : setStarted(false)}
              className="text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              {currentStep > 0 ? "Back" : "Exit"}
            </button>
            <div className="text-stone-500 text-sm">
              Question {currentStep + 1} of {QUIZ_QUESTIONS.length}
            </div>
          </div>
          {/* Gold gradient progress bar */}
          <div className="h-2 bg-[#C9A84C]/15 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-[#C9A84C] via-[#D4B85C] to-[#B8973F] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Content with optional Preferences Sidebar */}
      <div className="flex-1 flex items-start justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-4xl flex gap-8">
          {/* Main Question Area */}
          <div className="flex-1 max-w-2xl">
            <h2
              className="text-stone-900 text-2xl md:text-3xl font-bold mb-8 text-center"
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
                  className="bg-white text-stone-900 hover:bg-[#F5F0E6] border-[#C9A84C]/40 font-semibold disabled:opacity-50"
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={!answers[currentQuestion.id] || (answers[currentQuestion.id] as string[]).length === 0}
                  className="bg-white text-stone-900 hover:bg-[#F5F0E6] border-[#C9A84C]/40 font-semibold disabled:opacity-50"
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
                        ? "border-[#C9A84C] bg-gradient-to-br from-white to-[#FDFBF7] shadow-lg shadow-[#C9A84C]/20"
                        : "border-stone-200 bg-white hover:border-[#C9A84C]/50 hover:shadow-md"
                    }`}
                  >
                    {currentQuestion.type === "multiple" && (
                      <div className={`absolute top-3 right-3 w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected ? "border-[#C9A84C] bg-[#C9A84C]" : "border-stone-300"
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3 h-3 text-black" />}
                      </div>
                    )}
                    <span className="text-2xl mb-2 block">{option.icon}</span>
                    <span className={`font-medium text-sm md:text-base ${isSelected ? "text-[#C9A84C]" : "text-stone-900"}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation - Back & Next */}
            <div className="flex justify-between mt-10 gap-4">
              <Button
                variant="outline"
                onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : setStarted(false)}
                className="border-[#C9A84C]/40 text-stone-700 bg-white hover:bg-[#F5F0E6] hover:text-stone-900 px-8 py-6 text-lg"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!isAnswered()}
                className="bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-black font-semibold px-10 py-6 text-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#C9A84C]/20"
              >
                {currentStep === QUIZ_QUESTIONS.length - 1 ? "Continue" : "Next"}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>

          {/* Preferences Summary Sidebar (desktop only) */}
          <div className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 rounded-2xl border border-[#C9A84C]/30 bg-white/80 backdrop-blur-sm p-5">
              <h3 className="text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C9A84C]" />
                Your Preferences
              </h3>
              <div className="space-y-3">
                {QUIZ_QUESTIONS.slice(0, currentStep + 1).map((q) => {
                  const answer = answers[q.id];
                  if (!answer) return null;
                  const displayValue = Array.isArray(answer)
                    ? answer.map(v => q.options.find(o => o.value === v)?.label || v).join(", ")
                    : q.options.find(o => o.value === answer)?.label || String(answer);
                  return (
                    <div key={q.id} className="text-xs">
                      <p className="text-stone-400 uppercase tracking-wider text-[10px] mb-0.5">
                        {q.id.replace(/_/g, " ")}
                      </p>
                      <p className="text-stone-700 font-medium truncate">{displayValue}</p>
                    </div>
                  );
                })}
                {Object.keys(answers).length === 0 && (
                  <p className="text-stone-400 text-xs italic">Answer questions to see your preferences here</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Quiz;
