import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLeadCapture } from "@/hooks/useLeadCapture";
import { 
  ChevronRight, ChevronLeft, Clock, Sparkles, Loader2, CheckCircle2,
  Wand2, ArrowUpRight, Building2, Home, Landmark, TreePine, Gift, Crown, Check, RefreshCcw,
  BarChart3, TrendingUp, Calculator, FileText, Target
} from "lucide-react";
import { AIShellCard } from "@/components/ui/ai-shell-card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { getCountryList, getLanguageList } from "@/constants/localeOptions";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  readMatchmakerSession,
  writeMatchmakerSession,
  clearMatchmakerSession,
} from "@/hooks/useMatchmakerSession";
// Payment removed — quiz is fully free, no API/credits consumed




// Optimized quiz questions - reduced duplicates, streamlined flow
const QUIZ_QUESTIONS = [
  {
    id: "property_type",
    question: "What type of property are you looking for?",
    type: "single" as const,
    options: [
      { value: "apartment", label: "Apartment / Flat", icon: "" },
      { value: "villa", label: "Villa", icon: "" },
      { value: "townhouse", label: "Townhouse", icon: "" },
      { value: "penthouse", label: "Penthouse", icon: "" },
      { value: "plot", label: "Plot / Land", icon: "" },
      { value: "retail", label: "Retail / Commercial", icon: "" },
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
    id: "emirate",
    question: "Which emirate do you want to invest in?",
    type: "single" as const,
    options: [
      { value: "dubai", label: "Dubai", icon: "" },
      { value: "abu-dhabi", label: "Abu Dhabi", icon: "" },
      { value: "sharjah", label: "Sharjah", icon: "" },
      { value: "ras-al-khaimah", label: "Ras Al Khaimah", icon: "" },
      { value: "ajman", label: "Ajman", icon: "" },
      { value: "fujairah", label: "Fujairah", icon: "" },
      { value: "umm-al-quwain", label: "Umm Al Quwain", icon: "" },
      { value: "any", label: "Open to any emirate", icon: "" },
    ],
  },
  {
    id: "areas",
    question: "Which areas are you interested in?",
    type: "multiple" as const,
    hasSelectAll: true,
    // Options are swapped at runtime based on answers.emirate (see AREAS_BY_EMIRATE).
    options: [
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

// Area chips per emirate — swapped at runtime so users only see areas inside their chosen emirate.
const AREAS_BY_EMIRATE: Record<string, Array<{ value: string; label: string; icon: string }>> = {
  dubai: [
    { value: "downtown", label: "Downtown Dubai", icon: "" },
    { value: "marina", label: "Dubai Marina", icon: "" },
    { value: "palm", label: "Palm Jumeirah", icon: "" },
    { value: "business-bay", label: "Business Bay", icon: "" },
    { value: "creek-harbour", label: "Dubai Creek Harbour", icon: "" },
    { value: "hills", label: "Dubai Hills Estate", icon: "" },
    { value: "arabian-ranches", label: "Arabian Ranches", icon: "" },
    { value: "jvc", label: "JVC / JVT", icon: "" },
    { value: "mbr-city", label: "MBR City", icon: "" },
    { value: "other", label: "Other Dubai Areas", icon: "" },
  ],
  "abu-dhabi": [
    { value: "saadiyat", label: "Saadiyat Island", icon: "" },
    { value: "yas", label: "Yas Island", icon: "" },
    { value: "reem", label: "Al Reem Island", icon: "" },
    { value: "raha", label: "Al Raha Beach", icon: "" },
    { value: "maryah", label: "Al Maryah Island", icon: "" },
    { value: "ghantoot", label: "Ghantoot", icon: "" },
    { value: "other", label: "Other Abu Dhabi Areas", icon: "" },
  ],
  sharjah: [{ value: "other", label: "All Sharjah Areas", icon: "" }],
  "ras-al-khaimah": [{ value: "other", label: "All Ras Al Khaimah Areas", icon: "" }],
  ajman: [{ value: "other", label: "All Ajman Areas", icon: "" }],
  fujairah: [{ value: "other", label: "All Fujairah Areas", icon: "" }],
  "umm-al-quwain": [{ value: "other", label: "All Umm Al Quwain Areas", icon: "" }],
  any: [{ value: "other", label: "Open to any area", icon: "" }],
};

// Area value to database area name mapping for hard filtering
const AREA_NAME_MAP: Record<string, string[]> = {
  "downtown": ["downtown"],
  "marina": ["marina"],
  "palm": ["palm jumeirah", "palm"],
  "business-bay": ["business bay"],
  "creek-harbour": ["creek harbour", "creek", "dubai creek"],
  "hills": ["dubai hills", "hills estate"],
  "arabian-ranches": ["arabian ranches"],
  "jvc": ["jvc", "jumeirah village"],
  "mbr-city": ["mbr city", "mohammed bin rashid"],
  "saadiyat": ["saadiyat"],
  "yas": ["yas island", "yas"],
  "reem": ["al reem", "reem island"],
  "raha": ["al raha", "raha beach"],
  "maryah": ["al maryah", "maryah"],
  "ghantoot": ["ghantoot"],
};

// Map area chip → emirate (used as a hard "never cross emirates" guard).
const AREA_EMIRATE_MAP: Record<string, string> = {
  "downtown": "dubai",
  "marina": "dubai",
  "palm": "dubai",
  "business-bay": "dubai",
  "creek-harbour": "dubai",
  "hills": "dubai",
  "arabian-ranches": "dubai",
  "jvc": "dubai",
  "mbr-city": "dubai",
  "saadiyat": "abu dhabi",
  "yas": "abu dhabi",
  "reem": "abu dhabi",
  "raha": "abu dhabi",
  "maryah": "abu dhabi",
  "ghantoot": "abu dhabi",
};

// Quiz emirate value → DB emirate string used for hard filter.
const EMIRATE_VALUE_MAP: Record<string, string> = {
  "dubai": "dubai",
  "abu-dhabi": "abu dhabi",
  "sharjah": "sharjah",
  "ras-al-khaimah": "ras al khaimah",
  "ajman": "ajman",
  "fujairah": "fujairah",
  "umm-al-quwain": "umm al quwain",
};

// Property type → keyword set matched against property_type_label / unit_types / name.
const PROPERTY_TYPE_KEYWORDS: Record<string, string[]> = {
  apartment: ["apartment", "apartments", "flat", "duplex"],
  villa: ["villa", "villas", "mansion", "sky villa", "farmhouse"],
  townhouse: ["townhouse", "townhouses"],
  penthouse: ["penthouse"],
  plot: ["plot", "plots", "residential plot", "land"],
  retail: ["office", "offices", "retail", "commercial", "hotel"],
};

const LANGUAGES = getLanguageList();
const NATIONALITIES = getCountryList();

// AI Home Finder — Emerald Ombré + Pure White Ink (matches Property Measurement).
// This overrides every legacy champagne/gold color declared inline in the JSX
// below, so we do NOT need to rewrite the JSX to flip the palette.
const AIHF_STYLE = `
  .aihf-root {
    background: linear-gradient(180deg, #041F18 0%, #031711 55%, #000000 100%) !important;
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
  }
  /* Question hero band — full-bleed deep emerald */
  .aihf-root .aihf-hero {
    background: var(--jj-emerald-ombre, linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%)) !important;
    border-bottom: 1px solid rgba(255,255,255,0.18) !important;
    box-shadow: 0 10px 40px -20px rgba(0,0,0,0.6) !important;
  }
  .aihf-root, .aihf-root :is(h1,h2,h3,h4,h5,h6,p,span,label,button,div,li,strong,em,a,small,time,dt,dd,th,td) {
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
    opacity: 1 !important;
  }
  .aihf-root svg, .aihf-root svg * { stroke: #FFFFFF !important; color: #FFFFFF !important; fill: none !important; }
  .aihf-root :is(.aihf-meta-row, .aihf-meta-row *, .aihf-icon-chip, .aihf-icon-chip *, [data-surface="emerald"], [data-surface="emerald"] *, .jj-surface-emerald, .jj-surface-emerald *, .jj-pill-emerald-metallic, .jj-pill-emerald-metallic *) {
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
    stroke: #FFFFFF !important;
    opacity: 1 !important;
  }
  .aihf-root .aihf-muted { color: rgba(255,255,255,0.75) !important; -webkit-text-fill-color: rgba(255,255,255,0.75) !important; }
  .aihf-root .aihf-tiffany { color: #FFFFFF !important; -webkit-text-fill-color: #FFFFFF !important; }

  /* Any champagne / raised / page-tint background flips to emerald ombré card. */
  .aihf-root [class*="bg-[#F7F2EA]"],
  .aihf-root [class*="bg-[#FDFBF7]"],
  .aihf-root [class*="bg-[#EFE6D6]"],
  .aihf-root [style*="#F7F2EA"],
  .aihf-root [style*="#FDFBF7"],
  .aihf-root [style*="#EFE6D6"],
  .aihf-root .aihf-card {
    background: var(--jj-emerald-ombre, linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%)) !important;
    background-image: var(--jj-emerald-ombre, linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%)) !important;
    border-color: rgba(255,255,255,0.34) !important;
    box-shadow: none !important;
  }

  /* Header bar stays as full-bleed deep emerald band. */
  .aihf-root > div:first-of-type[class*="border-b"] {
    background: var(--jj-emerald-ombre, linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%)) !important;
    border-bottom-color: rgba(255,255,255,0.24) !important;
  }

  /* Option tiles */
  .aihf-root .aihf-option {
    background: linear-gradient(135deg, #042c1c 0%, #031711 58%, #000000 100%) !important;
    border: 0 !important;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06) !important;
  }
  .aihf-root .aihf-option:hover {
    box-shadow: inset 0 0 0 1px rgba(16,185,129,0.28), 0 10px 24px -16px rgba(16,185,129,0.55) !important;
  }
  .aihf-root .aihf-option[aria-pressed="true"] {
    background-image:
      linear-gradient(110deg,
        rgba(255,255,255,0.00) 0%,
        rgba(255,255,255,0.24) 18%,
        rgba(255,255,255,0.06) 36%,
        rgba(255,255,255,0.20) 58%,
        rgba(255,255,255,0.00) 100%
      ),
      var(--jj-emerald-ombre, linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%)) !important;
    background-size: 250% 100%, 100% 100% !important;
    background-position: -50% 0, 0 0 !important;
    background-blend-mode: overlay, normal !important;
    animation: jj-metallic-sweep 4.5s ease-in-out infinite, jj-emerald-pulse 3.2s ease-in-out infinite !important;
    border: 0 !important;
    box-shadow: 0 10px 32px rgba(6,78,59,0.38), inset 0 1px 0 rgba(255,255,255,0.18) !important;
  }


  .aihf-root .aihf-question-card,
  .aihf-root .aihf-preferences-card {
    background: linear-gradient(135deg, #064E3B 0%, #04231A 56%, #010806 100%) !important;
    border: 1px solid rgba(255,255,255,0.28) !important;
    box-shadow: 0 18px 48px -30px rgba(0,0,0,0.72) !important;
  }

  .aihf-root .aihf-options-grid {
    justify-items: stretch;
  }

  .aihf-root .aihf-option--center-last {
    grid-column: 1 / -1 !important;
    justify-self: center !important;
    width: min(calc((100% - 0.75rem) / 2), 22rem) !important;
  }

  @media (max-width: 520px) {
    .aihf-root .aihf-option--center-last {
      width: 100% !important;
    }
  }

  /* CTAs */
  .aihf-root .aihf-cta, .aihf-root .aihf-cta:hover, .aihf-root .aihf-cta:focus-visible {
    min-width: 7rem;
    background: var(--jj-emerald-ombre, linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%)) !important;
    background-image: var(--jj-emerald-ombre, linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%)) !important;
    border: 1px solid rgba(255,255,255,0.46) !important;
    box-shadow: 0 10px 28px -14px rgba(6,78,59,0.65) !important;
  }
  .aihf-root .aihf-cta, .aihf-root .aihf-cta * { color: #FFFFFF !important; -webkit-text-fill-color: #FFFFFF !important; stroke: #FFFFFF !important; }

  /* Solid emerald surfaces stay emerald with white ink */
  .aihf-root .jj-surface-emerald,
  .aihf-root .jj-pill-emerald-metallic,
  .aihf-root .jj-emerald-metallic {
    background: linear-gradient(135deg, #065F46 0%, #04231A 55%, #000000 100%) !important;
    background-image: linear-gradient(135deg, #065F46 0%, #04231A 55%, #000000 100%) !important;
    border: 1px solid rgba(255,255,255,0.42) !important;
  }
  .aihf-root .jj-surface-emerald, .aihf-root .jj-surface-emerald *,
  .aihf-root .jj-pill-emerald-metallic, .aihf-root .jj-pill-emerald-metallic *,
  .aihf-root .jj-emerald-metallic, .aihf-root .jj-emerald-metallic * {
    color: #FFFFFF !important; -webkit-text-fill-color: #FFFFFF !important; stroke: #FFFFFF !important;
  }

  /* Inputs */
  .aihf-root .aihf-input, .aihf-root input, .aihf-root [data-searchable-trigger] {
    background: linear-gradient(135deg, rgba(4,40,28,0.85), rgba(0,0,0,0.85)) !important;
    border: 1px solid rgba(255,255,255,0.42) !important;
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
  }
  .aihf-root input::placeholder { color: rgba(255,255,255,0.55) !important; -webkit-text-fill-color: rgba(255,255,255,0.55) !important; }

  /* Absolute lock: no gold borders/text inside AI Home Finder, including lead form states. */
  .aihf-root :is([class*="B89555"], [class*="border-gold"], [class*="ring-gold"], [style*="#B89555"], [style*="184,149,85"]) {
    border-color: rgba(255,255,255,0.28) !important;
    --tw-ring-color: rgba(255,255,255,0.28) !important;
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
  }

  /* Popover keeps light surface so lists are readable */
  .aihf-popover, .aihf-popover * { background-color: #041610 !important; color: #FFFFFF !important; -webkit-text-fill-color: #FFFFFF !important; }
  .aihf-popover { border: 1px solid rgba(255,255,255,0.34) !important; }
  .aihf-popover svg, .aihf-popover svg * { stroke: #FFFFFF !important; color: #FFFFFF !important; }
  .aihf-popover .jbj-form-option:hover { background-color: rgba(255,255,255,0.06) !important; }

  /* Progress track (champagne rail) */
  .aihf-root [class*="bg-[#EFE6D6]"].h-2 { background: rgba(255,255,255,0.12) !important; }

  /* ---------- Animated emerald borders + orbs (no gold anywhere) ---------- */
  @keyframes aihf-border-spin {
    0%   { --aihf-angle: 0deg; }
    100% { --aihf-angle: 360deg; }
  }
  @property --aihf-angle {
    syntax: '<angle>';
    inherits: false;
    initial-value: 0deg;
  }
  @keyframes aihf-orb-drift-a {
    0%   { transform: translate(0,0) scale(1); opacity: 0.55; }
    50%  { transform: translate(-40px, 30px) scale(1.15); opacity: 0.85; }
    100% { transform: translate(0,0) scale(1); opacity: 0.55; }
  }
  @keyframes aihf-orb-drift-b {
    0%   { transform: translate(0,0) scale(1); opacity: 0.5; }
    50%  { transform: translate(50px, -35px) scale(1.2); opacity: 0.8; }
    100% { transform: translate(0,0) scale(1); opacity: 0.5; }
  }
  @keyframes aihf-orb-drift-c {
    0%   { transform: translate(-50%, -50%) scale(1); opacity: 0.35; }
    50%  { transform: translate(-52%, -48%) scale(1.08); opacity: 0.55; }
    100% { transform: translate(-50%, -50%) scale(1); opacity: 0.35; }
  }
  @keyframes aihf-icon-float {
    0%,100% { transform: translateY(0) rotate(0deg); }
    50%     { transform: translateY(-6px) rotate(-3deg); }
  }
  @keyframes aihf-sparkle {
    0%,100% { opacity: 0.15; transform: scale(0.9); }
    50%     { opacity: 0.9;  transform: scale(1.15); }
  }

  /* Animated emerald ring wrapper — replaces any gold border */
  .aihf-emerald-ring {
    position: relative;
    border-radius: inherit;
    background:
      conic-gradient(from var(--aihf-angle),
        #10B981 0%,
        #34D399 15%,
        rgba(255,255,255,0.85) 28%,
        #059669 45%,
        #064E3B 60%,
        #34D399 78%,
        #10B981 100%);
    animation: aihf-border-spin 6s linear infinite;
    padding: 1.5px;
  }
  .aihf-emerald-ring > * {
    border-radius: inherit;
    background-clip: padding-box;
  }
  .aihf-emerald-ring-strong { padding: 2px; animation-duration: 7s; }

  /* Animated background orbs behind the intro card */
  .aihf-orbs { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
  .aihf-orb {
    position: absolute;
    border-radius: 9999px;
    filter: blur(60px);
    will-change: transform, opacity;
  }
  .aihf-orb-1 {
    top: -80px; right: -60px; width: 380px; height: 380px;
    background: radial-gradient(circle at 30% 30%, rgba(52,211,153,0.55), rgba(6,78,59,0.0) 70%);
    animation: aihf-orb-drift-a 9s ease-in-out infinite;
  }
  .aihf-orb-2 {
    bottom: -100px; left: -80px; width: 420px; height: 420px;
    background: radial-gradient(circle at 60% 60%, rgba(16,185,129,0.5), rgba(2,44,32,0.0) 70%);
    animation: aihf-orb-drift-b 11s ease-in-out infinite;
  }
  .aihf-orb-3 {
    top: 50%; left: 50%; width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(5,150,105,0.35), rgba(0,0,0,0.0) 65%);
    animation: aihf-orb-drift-c 13s ease-in-out infinite;
  }
  .aihf-orb-4 {
    top: 20%; left: 10%; width: 220px; height: 220px;
    background: radial-gradient(circle, rgba(110,231,183,0.35), rgba(0,0,0,0.0) 70%);
    animation: aihf-orb-drift-a 14s ease-in-out infinite reverse;
  }

  .aihf-hero-icon { animation: aihf-icon-float 4.5s ease-in-out infinite; }

  /* Ensure the intro card sits above the animated orbs */
  .aihf-root .aihf-intro-card { position: relative; z-index: 1; }
`;

const Quiz = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLeadCaptured, captureLead, checkLead } = useLeadCapture();
  // Quiz is fully free — no usage tracking or membership needed
  const markFreeUsed = () => {};
  
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [started, setStarted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationality: "",
    preferredLanguage: "",
  });
  const [resumed, setResumed] = useState(false);
  const estimatedTime = 45;

  // Paint the whole viewport emerald so no champagne band leaks below the tool.
  useEffect(() => {
    const prevHtml = document.documentElement.style.background;
    const prevBody = document.body.style.background;
    const emerald = "linear-gradient(180deg, #062B1E 0%, #041A12 55%, #02120C 100%)";
    document.documentElement.style.background = emerald;
    document.body.style.background = emerald;
    return () => {
      document.documentElement.style.background = prevHtml;
      document.body.style.background = prevBody;
    };
  }, []);

  // Restore in-progress matchmaker session on mount (refresh / re-open safe)
  const hasHydrated = useRef(false);
  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;
    const prev = readMatchmakerSession();
    if (!prev) return;
    if (prev.step === "results" && prev.resultSlugs?.length) {
      // Already finished — jump straight to results
      navigate(
        `/ai-home-finder-results?projects=${prev.resultSlugs.join(",")}&session=${prev.sessionId}&free=true`,
        { replace: true }
      );
      return;
    }
    if (Object.keys(prev.answers || {}).length === 0) return;
    setAnswers(prev.answers || {});
    setCurrentStep(Math.min(prev.currentQuestionIndex || 0, QUIZ_QUESTIONS.length - 1));
    setFormData((fd) => ({ ...fd, ...(prev.formData || {}) }));
    setShowForm(prev.step === "lead-form");
    setStarted(true);
    setResumed(true);
    toast.success("Resumed your matchmaker session", { duration: 3000 });
  }, [navigate]);

  // Persist every meaningful change so refresh/close resumes from the same spot
  useEffect(() => {
    if (!hasHydrated.current) return;
    if (Object.keys(answers).length === 0 && !showForm) return;
    writeMatchmakerSession({
      step: showForm ? "lead-form" : "quiz",
      currentQuestionIndex: currentStep,
      answers,
      formData,
    });
  }, [answers, currentStep, showForm, formData]);



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
      // Trimmed projection — only fields used by the recommender + result cards.
      // Drops nested joins (developer/images) which made the prior query fetch megabytes
      // of unused data and was the root cause of the long "Finding your perfect matches"
      // loader on this screen.
      const { applyPurchaseOnly } = await import("@/lib/projects/excludeLeasing");
      const baseQuery = supabase
        .from("projects")
        .select(
          "id, slug, name, emirate, location, area_name, price_from, bedrooms_min, bedrooms_max, handover_date, sale_status, is_sold_out, construction_status, property_type_label, unit_types, views, amenities, cover_image_url, listing_kind"
        )
        .eq("is_published", true)
        .limit(2000);
      const { data, error } = await applyPurchaseOnly(baseQuery);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Swap the `areas` question's options based on which emirate the user picked.
  const currentQuestion = (() => {
    const q = QUIZ_QUESTIONS[currentStep];
    if (q?.id === "areas") {
      const em = (answers.emirate as string) || "any";
      const opts = AREAS_BY_EMIRATE[em] || AREAS_BY_EMIRATE.any;
      return { ...q, options: opts };
    }
    return q;
  })();
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
      // Check if lead already captured — skip form if so
      if (isLeadCaptured || (user && isFormValid())) {
        proceedToResults();
      } else {
        setShowForm(true);
      }
    }
  };

  // ---- Universal scorer (used for every tier) ----
  const scoreProject = (project: any) => {
    let score = 0;
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

    const preferredFeatures = (answers.views_and_features as string[]) || [];
    preferredFeatures.forEach((pf) => {
      if (pf.includes("view") && projectViews.some((v: string) => v.toLowerCase().includes(pf.replace("-view", "")))) score += 5;
      const projectAmenities = project.amenities || [];
      if (projectAmenities.some((a: string) => a.toLowerCase().includes(pf.replace("-", " ")))) score += 3;
    });

    return score;
  };

  // Strict priority recommendation engine.
  // Priority order: Location (area > emirate) → Budget → Bedrooms → Timeline → Preferences → Off-plan.
  // Location is a HARD filter: when the user picks specific areas, results NEVER cross emirates.
  const getTieredRecommendations = (): {
    items: any[];
    tier: "exact" | "close" | "nearest" | "fallback";
  } => {
    if (!allProjects?.length) return { items: [], tier: "fallback" };

    const preferredAreas = (answers.areas as string[]) || [];
    const hasOther = preferredAreas.includes("other");
    const specificAreas = preferredAreas.filter((a) => a !== "other");
    const areaKeywords: string[] = [];
    specificAreas.forEach((area) => {
      const mapped = AREA_NAME_MAP[area];
      if (mapped) areaKeywords.push(...mapped);
    });

    // Emirate hard filter — from the dedicated emirate question, OR derived from area chips.
    const chosenEmirate = (answers.emirate as string) || "";
    const emirateFromQuestion = EMIRATE_VALUE_MAP[chosenEmirate] || "";
    const targetEmirates = Array.from(
      new Set(
        [
          emirateFromQuestion,
          ...specificAreas.map((a) => AREA_EMIRATE_MAP[a]).filter(Boolean),
        ]
          .filter(Boolean)
          .map((e) => e.toLowerCase())
      )
    );
    // If user picked "any" emirate AND no specific area → no emirate guard.
    const enforceEmirate = targetEmirates.length > 0 && chosenEmirate !== "any";

    // Hard property-type filter — never recommend a villa when the user asked for retail, etc.
    const propertyType = (answers.property_type as string) || "";
    const ptKeywords = PROPERTY_TYPE_KEYWORDS[propertyType] || [];
    const matchesPropertyType = (p: any): boolean => {
      if (!ptKeywords.length) return true;
      const blob = `${p.property_type_label || ""} ${(p.unit_types || []).join(" ")} ${p.name || ""}`.toLowerCase();
      return ptKeywords.some((k) => blob.includes(k));
    };

    // Sold-out / cancelled + property-type exclusion + sanity price floor.
    // Hard floor: UAE purchase off-plan never starts below ~AED 400K. Anything
    // lower is almost always a data error, a deposit/booking amount, or a
    // rental figure that slipped into the sale catalogue — never show those
    // to a buyer. We also exclude prices that are wildly below the user's
    // budget band (< 50% of the low bound) so a 1M–3M brief never returns
    // a 299K "match".
    const PURCHASE_PRICE_FLOOR = 400_000;
    const baseAvailable = allProjects.filter((project) => {
      if (project.is_sold_out) return false;
      const s = (project.sale_status || "").toLowerCase().replace(/[\s-]+/g, "_");
      if (
        s.includes("sold") ||
        s.includes("out_of_stock") ||
        s === "unavailable" ||
        s === "cancelled"
      ) return false;
      const cs = ((project as any).construction_status || "").toLowerCase();
      if (cs.includes("cancel")) return false;
      if (!matchesPropertyType(project)) return false;
      const pf = (project as any).price_from;
      if (typeof pf === "number" && pf > 0 && pf < PURCHASE_PRICE_FLOOR) return false;
      return true;
    });


    const isReady = (p: any) => {
      const h = (p.handover_date || "").toLowerCase();
      const cs = (p.construction_status || "").toLowerCase();
      const ss = (p.sale_status || "").toLowerCase();
      return (
        h.includes("ready") ||
        cs.includes("ready") ||
        cs.includes("completed") ||
        ss.includes("ready")
      );
    };

    // ---- #1 LOCATION ----
    // Compute project's emirate by scanning emirate + location + area_name + name.
    const projectEmirate = (p: any): string => {
      const blob = `${p.emirate || ""} ${p.location || ""} ${(p as any).area_name || ""} ${p.name || ""}`.toLowerCase();
      if (blob.includes("dubai")) return "dubai";
      if (blob.includes("abu dhabi") || blob.includes("saadiyat") || blob.includes("yas island") || blob.includes("reem") || blob.includes("al maryah") || blob.includes("al raha") || blob.includes("ghantoot")) return "abu dhabi";
      if (blob.includes("sharjah")) return "sharjah";
      if (blob.includes("ajman")) return "ajman";
      if (blob.includes("ras al khaimah") || blob.includes("rak")) return "ras al khaimah";
      if (blob.includes("fujairah")) return "fujairah";
      if (blob.includes("umm al quwain") || blob.includes("uaq")) return "umm al quwain";
      return "";
    };

    const matchesAreaName = (p: any) => {
      if (!areaKeywords.length) return false;
      const blob = `${p.name || ""} ${p.location || ""} ${(p as any).area_name || ""}`.toLowerCase();
      return areaKeywords.some((k) => blob.includes(k));
    };

    // locationTier: 0 = exact area match, 1 = same emirate, 99 = excluded.
    const locationTier = (p: any): number => {
      if (!enforceEmirate) {
        if (matchesAreaName(p)) return 0;
        return 1; // "Other / Flexible" → any project qualifies, area match still preferred.
      }
      if (matchesAreaName(p)) return 0;
      const em = projectEmirate(p);
      if (em && targetEmirates.includes(em)) return 1;
      return 99; // different emirate → HARD EXCLUDE
    };

    // ---- #2 BUDGET (graded closeness) ----
    const budgetRange = (() => {
      switch (answers.budget) {
        case "under-1m": return [0, 1_000_000];
        case "1m-2m":   return [1_000_000, 2_000_000];
        case "2m-5m":   return [2_000_000, 5_000_000];
        case "5m-10m":  return [5_000_000, 10_000_000];
        case "10m-plus":return [10_000_000, 50_000_000];
        default: return null;
      }
    })();
    const budgetDistance = (p: any): number => {
      if (!budgetRange) return 0;
      const price = p.price_from;
      if (price == null) return 1; // unknown price → mid-penalty so they rank below in-range
      const [lo, hi] = budgetRange;
      if (price >= lo && price <= hi) return 0;
      const mid = Math.max((lo + hi) / 2, 1);
      const gap = price < lo ? lo - price : price - hi;
      return gap / mid;
    };

    // ---- #3 BEDROOMS (graded closeness) ----
    const bedroomTarget = (() => {
      switch (answers.bedrooms) {
        case "studio":   return 0;
        case "1br":      return 1;
        case "2br":      return 2;
        case "3br":      return 3;
        case "4br-plus": return 4;
        default: return null;
      }
    })();
    const bedroomDistance = (p: any): number => {
      if (bedroomTarget == null) return 0;
      const min = p.bedrooms_min;
      const max = p.bedrooms_max ?? min;
      if (min == null) return 1;
      if (bedroomTarget >= min && bedroomTarget <= max) return 0;
      if (bedroomTarget === 4 && max >= 4) return 0;
      return Math.min(Math.abs(bedroomTarget - min), Math.abs(bedroomTarget - max));
    };

    // ---- #4 TIMELINE ----
    const timelineDistance = (p: any): number => {
      const t = answers.timeline;
      if (!t || t === "flexible") return 0;
      const h = (p.handover_date || "").toLowerCase();
      if (t === "ready") return isReady(p) ? 0 : 1;
      if (t === "2025" && h.includes("2025")) return 0;
      if (t === "2026" && h.includes("2026")) return 0;
      if (t === "2027-plus" && (h.includes("2027") || h.includes("2028") || h.includes("2029") || h.includes("2030"))) return 0;
      return 1;
    };

    // ---- #5 PREFERENCES (views/features/location_type) - bonus only ----
    const preferenceMatches = (p: any): number => {
      let n = 0;
      const projectViews = ((p as any).views as string[]) || [];
      const projectAmenities = ((p as any).amenities as string[]) || [];
      const loc = answers.location_type;
      const locArr = Array.isArray(loc) ? loc : loc ? [loc] : [];
      locArr.forEach((l: string) => {
        if (l === "beachfront" && projectViews.some((v) => /sea|beach|water/i.test(v))) n++;
        if (l === "city-center" && projectViews.some((v) => /city|skyline/i.test(v))) n++;
        if (l === "golf-community" && projectViews.some((v) => /golf/i.test(v))) n++;
      });
      const features = (answers.views_and_features as string[]) || [];
      features.forEach((f: string) => {
        if (projectViews.some((v) => v.toLowerCase().includes(f.replace("-view", "")))) n++;
        if (projectAmenities.some((a) => a.toLowerCase().includes(f.replace("-", " ")))) n++;
      });
      return n;
    };

    // ---- Off-plan preference ----
    const preferOffPlan = answers.timeline !== "ready";

    // Build candidates (excluding hard-fail location).
    const ranked = baseAvailable
      .map((p) => {
        const lt = locationTier(p);
        return {
          p,
          lt,
          bd: budgetDistance(p),
          br: bedroomDistance(p),
          tl: timelineDistance(p),
          pref: preferenceMatches(p),
          ready: isReady(p),
        };
      })
      .filter((x) => x.lt < 99)
      .filter((x) => {
        // Budget sanity: drop candidates priced absurdly below the user's
        // requested band (likely deposit/rent/error rows).
        if (!budgetRange) return true;
        const price = (x.p as any).price_from;
        if (typeof price !== "number" || price <= 0) return true;
        const [lo] = budgetRange;
        return price >= lo * 0.5;
      });


    // Off-plan-first within location: only fall back to ready when no off-plan
    // candidate matches the user's location at all.
    let pool = ranked;
    if (preferOffPlan) {
      const offPlanOnly = ranked.filter((x) => !x.ready);
      if (offPlanOnly.length > 0) pool = offPlanOnly;
    }

    // Lexicographic sort: closest first.
    pool.sort((a, b) => {
      if (a.lt !== b.lt) return a.lt - b.lt;
      if (a.bd !== b.bd) return a.bd - b.bd;
      if (a.br !== b.br) return a.br - b.br;
      if (a.tl !== b.tl) return a.tl - b.tl;
      if (a.pref !== b.pref) return b.pref - a.pref;
      if (a.ready !== b.ready) return a.ready ? 1 : -1;
      return 0;
    });

    const items = pool.map((x, i) => ({
      ...x.p,
      matchScore: 1000 - i, // monotone so downstream "highest score = best" still holds
    }));

    if (items.length === 0) {
      // Strict mode: user picked specific areas and nothing matches their emirate.
      // Return empty so the results page shows its "let's refresh your matches" state
      // instead of cross-emirate recommendations.
      return { items: [], tier: "fallback" };
    }

    // ---- BUDGET-TIERED SELECTION ----
    // Instead of returning the top-3 by raw score (which can cluster all three
    // around the same price point or, worse, leave a 2 M gap between picks),
    // spread the top-of-pool across the user's budget band so the client sees
    // what their money buys at the LOW, MID and HIGH end of their range.
    // The strict location/property-type/bedroom hard filters above are kept;
    // we only diversify on the soft "budget closeness" axis.
    const pickBudgetSpread = (candidates: any[]): any[] => {
      if (!budgetRange || candidates.length <= 3) return candidates.slice(0, 3);
      const [lo, hi] = budgetRange;
      const priced = candidates.filter((p) => typeof p.price_from === "number" && p.price_from > 0);
      const inRange = priced
        .filter((p) => p.price_from >= lo && p.price_from <= hi)
        .sort((a, b) => a.price_from - b.price_from);

      // Anchor prices: low / mid / high of the requested range.
      const anchors = [lo + (hi - lo) * 0.15, (lo + hi) / 2, lo + (hi - lo) * 0.85];

      const closestTo = (anchor: number, pool: any[], used: Set<string>) => {
        let best: any = null;
        let bestGap = Infinity;
        for (const p of pool) {
          if (used.has(p.id)) continue;
          const gap = Math.abs(p.price_from - anchor);
          if (gap < bestGap) { bestGap = gap; best = p; }
        }
        return best;
      };

      const used = new Set<string>();
      const picks: any[] = [];

      // Prefer in-range picks for every anchor first.
      for (const a of anchors) {
        const pick = closestTo(a, inRange, used);
        if (pick) { used.add(pick.id); picks.push(pick); }
      }

      // Top up from the broader ranked candidate list (closest-by-rank) if any anchor was empty.
      for (const p of candidates) {
        if (picks.length >= 3) break;
        if (!used.has(p.id)) { used.add(p.id); picks.push(p); }
      }

      // Return ascending by price so the UI displays a clear "what each tier buys" story.
      return picks
        .slice(0, 3)
        .sort((a, b) => (a.price_from || 0) - (b.price_from || 0));
    };

    const spread = pickBudgetSpread(items);
    const orderedItems = [
      ...spread,
      ...items.filter((p) => !spread.some((s) => s.id === p.id)),
    ];

    // Classify tier by the top result's closeness (drives the results-page copy).
    const top = pool[0];
    const tier: "exact" | "close" | "nearest" =
      top.lt === 0 && top.bd === 0 && top.br === 0 && top.tl === 0
        ? "exact"
        : top.lt <= 1 && top.bd <= 0.25 && top.br <= 1
        ? "close"
        : "nearest";

    return { items: orderedItems, tier };
  };



  // Back-compat wrapper kept for any other call sites
  const getRecommendations = () => getTieredRecommendations().items;


  // All features are now FREE - no payment required
  const needsPayment = false;

  const handleSubmitForm = async () => {
    if (!isFormValid()) return;
    // Capture lead before showing results
    await captureLead({
      email: formData.email,
      fullName: formData.fullName,
      phone: formData.phone,
      nationality: formData.nationality,
      language: formData.preferredLanguage,
    }, 'ai_home_finder');
    await proceedToResults();
  };

  const proceedToResults = async () => {
    setIsSubmitting(true);
    try {
      const { items: recommendations, tier } = getTieredRecommendations();
      const top = recommendations.slice(0, 3);
      const sessionId = `quiz-${(crypto as any)?.randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

      // Always persist the submission so owner can review every lead (anon allowed).
      try {
        await supabase.from("matchmaker_submissions" as any).insert({
          session_id: sessionId,
          user_id: user?.id ?? null,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          nationality: formData.nationality || null,
          preferred_language: formData.preferredLanguage || null,
          answers,
          recommended_slugs: top.map((p) => p.slug),
          recommended_project_ids: recommendations.slice(0, 5).map((p) => p.id),
          result_tier: tier,
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
          referrer: typeof document !== "undefined" ? document.referrer || null : null,
        });
      } catch (e) {
        console.warn("matchmaker_submissions insert failed", e);
      }

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

      const slugs = top.map((p) => p.slug).join(",");

      // Persist completed session so refresh on /ai-home-finder-results restores everything
      writeMatchmakerSession({
        sessionId,
        step: "results",
        answers,
        formData,
        resultSlugs: top.map((p) => p.slug),
        resultTiers: Array(top.length).fill(tier) as any,
      });

      toast.success(
        tier === "exact"
          ? "3 perfect matches found!"
          : tier === "fallback"
            ? "Showing our top alternatives for you"
            : "Your AI-selected properties are ready!",
        { duration: 4000, position: "bottom-center" }
      );
      navigate(
        `/ai-home-finder-results?projects=${slugs}&session=${sessionId}&tier=${tier}&free=true`
      );
    } catch (error) {
      console.error("Error saving quiz:", error);
      const { items: recommendations, tier } = getTieredRecommendations();
      const slugs = recommendations.slice(0, 3).map((p) => p.slug).join(",");
      markFreeUsed();
      writeMatchmakerSession({
        step: "results",
        answers,
        formData,
        resultSlugs: recommendations.slice(0, 3).map((p) => p.slug),
        resultTiers: Array(Math.min(3, recommendations.length)).fill(tier) as any,
      });
      toast.success("Your AI-selected properties are ready!", { duration: 4000, position: "bottom-center" });
      navigate(`/ai-home-finder-results?projects=${slugs}&tier=${tier}&free=true`);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handlePaymentSuccess = async () => {
    await proceedToResults();
  };


  // Intro screen before starting — teal/cyan dark ombre (matches Property Measurement language)
  if (!started && currentStep === 0 && Object.keys(answers).length === 0 && !showForm) {
    return (
      <section
        data-allow-dark-cta
        data-no-contrast-guard
        data-surface="dark"
        className="aihf-root min-h-[calc(100dvh-88px)] flex flex-col"
        style={{ background: "linear-gradient(180deg, #041F18 0%, #031711 55%, #000000 100%)" }}
      >
        <style>{AIHF_STYLE}</style>
        {/* Header */}
        <div className="border-b border-white/20" style={{ background: "linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%)" }}>
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate(-1)}
                data-no-contrast-guard
                className="transition-colors flex items-center gap-2"
                style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Exit</span>
              </button>
              <div className="flex items-center gap-3" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                <Clock className="w-4 h-4" />
                <span className="text-sm">~{estimatedTime} seconds</span>
              </div>
            </div>
          </div>
        </div>


        <div className="relative flex-1 flex items-center justify-center px-4 py-6">
          {/* Animated emerald orbs behind the card */}
          <div className="aihf-orbs" aria-hidden="true">
            <div className="aihf-orb aihf-orb-1" />
            <div className="aihf-orb aihf-orb-2" />
            <div className="aihf-orb aihf-orb-3" />
            <div className="aihf-orb aihf-orb-4" />
          </div>

          {/* Animated emerald border wrapper (replaces gold outline) */}
          <div className="aihf-emerald-ring aihf-emerald-ring-strong rounded-[28px] w-full max-w-2xl aihf-intro-card">
            <AIShellCard
              as="div"
              data-surface="dark"
              padding="lg"
              noOrbs
              className="w-full text-center border-0 rounded-[26px] shadow-[0_18px_55px_rgba(0,0,0,0.35)]"
            >

              {/* Centered emerald identity tile */}
              <div
                data-surface="emerald"
                data-emerald-ok="icon"
                className="aihf-hero-icon jj-surface-emerald mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
              >
                <Wand2 className="w-8 h-8" />
              </div>

              {/* Label pill wrapped in animated emerald ring (no gold) */}
              <div className="aihf-emerald-ring rounded-full inline-block mb-4">
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{
                    background: "linear-gradient(135deg, #065F46 0%, #04231A 100%)",
                    border: "0",
                    boxShadow: "none",
                  }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                  <span className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: "#FFFFFF" }}>Completely Free</span>
                </div>
              </div>

              <h1 className="text-[#1A1A1A] text-3xl md:text-4xl font-bold tracking-tight mb-3">
                AI Home Finder
              </h1>
              <p className="text-[#1A1A1A]/70 max-w-lg mx-auto mb-2">
                Find your perfect home with our AI — it searches every project on JBJ and matches them to your exact requirements. Completely{" "}
                <span className="font-semibold text-[#1A1A1A]">FREE</span>.
              </p>
              <p className="text-[#1A1A1A]/60 text-sm mb-8">
                Powered by JBJ Global Real Estate
              </p>

              <ul className="text-left max-w-md mx-auto space-y-2.5 mb-6">
                {[
                  { label: "Unlimited AI Home Matches", description: "No cap — across every project on JBJ" },
                  { label: "AI Comparison Reports", description: "Side-by-side analysis & insights" },
                  { label: "Download Excel Report", description: "Take your matches with you" },
                ].map((f) => (
                  <li key={f.label} className="aihf-emerald-ring rounded-2xl block">
                    <div
                      className="flex items-start gap-3 p-3 rounded-2xl"
                      style={{ background: "linear-gradient(135deg, rgba(6,78,59,0.55) 0%, rgba(4,35,26,0.85) 100%)" }}
                    >
                      <div
                        data-surface="emerald"
                        data-emerald-ok="icon"
                        className="jj-surface-emerald w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      >
                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      </div>
                      <div>
                        <p className="text-[#1A1A1A] font-medium text-sm leading-tight">{f.label}</p>
                        <p className="text-[#1A1A1A]/70 text-xs mt-0.5">{f.description}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Meta row — matches the feature card style above */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                {[
                  { Icon: Clock,        label: "~60 seconds" },
                  { Icon: Sparkles,     label: "AI-Powered"  },
                  { Icon: CheckCircle2, label: "100% Free"   },
                ].map(({ Icon, label }) => (
                  <div key={label} className="aihf-emerald-ring rounded-full">
                    <div
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-full"
                      style={{ background: "linear-gradient(135deg, rgba(6,78,59,0.6) 0%, rgba(4,35,26,0.9) 100%)" }}
                    >
                      <div
                        data-surface="emerald"
                        data-emerald-ok="icon"
                        className="jj-surface-emerald w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} strokeWidth={2.5} />
                      </div>
                      <span className="text-[#1A1A1A] font-medium text-sm leading-none">{label}</span>
                    </div>
                  </div>
                ))}
              </div>


              {/* Primary CTA */}
              <Button
                onClick={() => setStarted(true)}
                data-surface="emerald"
                className="aihf-cta jj-pill-emerald-metallic font-semibold px-10 py-6 text-base rounded-xl"
              >
                <span>Find My Property</span>
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-xs mt-5 text-[#1A1A1A]/60">
                Save money by choosing the right property the first time.
              </p>
            </AIShellCard>
          </div>
        </div>
      </section>
    );
  }



  // Form Screen after completing questions
  if (showForm) {
    return (
      <section data-allow-dark-cta data-no-contrast-guard data-surface="dark" className="aihf-root min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg, #041F18 0%, #031711 55%, #000000 100%)" }}>
        <style>{AIHF_STYLE}</style>
        {/* Header */}
        <div className="border-b border-white/20 bg-[#041610]">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowForm(false)}
                data-no-contrast-guard
                className="text-[#1A1A1A] hover:text-[#1A1A1A] transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Back to Questions
              </button>
                <div className="flex items-center gap-3 text-white">
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
              <div className="w-16 h-16 rounded-full bg-white/10 border border-white/30 mx-auto mb-4 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
               <h2 className="text-[#1A1A1A] text-3xl font-bold mb-2">
                Get Your AI Analysis
              </h2>
              <p className="text-[#1A1A1A]/70">
                Enter your details to receive your personalized property recommendations
              </p>
            </div>

            <div className="aihf-card border border-white/30 rounded-2xl p-6 md:p-8">
              <div className="space-y-5">
                <div>
                  <Label className="text-[#1A1A1A] mb-2 block">Full Name *</Label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    className="aihf-input border-white/30 text-white placeholder:text-white/55 focus:border-white/45"
                  />
                </div>
                <div>
                  <Label className="text-[#1A1A1A] mb-2 block">Email Address *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email"
                    className="aihf-input border-white/30 text-white placeholder:text-white/55 focus:border-white/45"
                  />
                </div>
                <div>
                  <Label className="text-[#1A1A1A] mb-2 block">Phone Number *</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+971 XX XXX XXXX"
                    className="aihf-input border-white/30 text-white placeholder:text-white/55 focus:border-white/45"
                  />
                </div>
                <div>
                  <Label className="text-[#1A1A1A] mb-2 block">Nationality *</Label>
                  <SearchableSelect
                    value={formData.nationality}
                    onChange={(value) => setFormData({ ...formData, nationality: value })}
                    options={NATIONALITIES}
                    placeholder="Select your nationality"
                    searchPlaceholder="Search countries..."
                    priorityItem="United Arab Emirates"
                    triggerClassName="aihf-input border-white/30 text-white hover:text-white"
                    className="aihf-popover border-white/30"
                  />
                </div>
                <div>
                  <Label className="text-[#1A1A1A] mb-2 block">Preferred Language *</Label>
                  <SearchableSelect
                    value={formData.preferredLanguage}
                    onChange={(value) => setFormData({ ...formData, preferredLanguage: value })}
                    options={LANGUAGES}
                    placeholder="Select preferred language"
                    searchPlaceholder="Search languages..."
                    priorityItem="English"
                    triggerClassName="aihf-input border-white/30 text-white hover:text-white"
                    className="aihf-popover border-white/30"
                  />
                </div>
              </div>

              <Button
                onClick={handleSubmitForm}
                disabled={!isFormValid() || isSubmitting}
                className="aihf-cta jj-pill-emerald-metallic w-full mt-6 font-semibold py-6 text-lg disabled:opacity-50"
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
                <p className="text-white text-base font-semibold text-center mt-4">
                  Your first AI Property Match & Analysis is FREE!
                </p>
              )}

              {needsPayment && (
                <p className="text-white text-sm font-medium text-center mt-4">
                  You've used your free trial. Upgrade to VIP for unlimited access.
                </p>
              )}

              <p className="text-[#1A1A1A]/70 text-xs text-center mt-6 leading-relaxed">
                Powered by <span className="text-[#1A1A1A] font-semibold">JBJ Global Real Estate</span>
              </p>
            </div>
          </div>
        </div>

        {/* Payment removed — fully free */}
      </section>
    );
  }

  // Quiz Questions Screen
  return (
    <>
      <SEOHead
        title="AI Home Finder — Dubai Property Matching Quiz | JBJ"
        description="Answer 10 quick questions and get an AI-curated shortlist of Dubai apartments, villas, and off-plan projects matching your budget, lifestyle, and investment goals."
        canonicalPath="/ai-home-finder"
      />
      <section data-allow-dark-cta data-no-contrast-guard data-surface="dark" className="aihf-root min-h-[calc(100dvh-88px)] flex flex-col" style={{ background: "linear-gradient(180deg, #041F18 0%, #031711 55%, #000000 100%)" }}>
      <style>{AIHF_STYLE}</style>
      {/* Header — pushed below fixed site header (88–128px) */}
      <div className="aihf-hero relative z-10" style={{ paddingTop: "calc(var(--responsive-header-height, 96px) + 24px)" }}>
        <div className="container mx-auto px-4 pb-6 md:pb-7">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : setStarted(false)}
              data-no-contrast-guard
              className="transition-colors flex items-center gap-2 text-sm font-medium"
              style={{ color: "#FFFFFF" }}
            >
              <ChevronLeft className="w-5 h-5" />
              {currentStep > 0 ? "Back" : "Exit"}
            </button>
            <div className="text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
              Question {currentStep + 1} of {QUIZ_QUESTIONS.length}
            </div>
          </div>
          {/* Emerald progress bar */}
          <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.14)" }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, #10B981 0%, #059669 45%, #064E3B 100%)" }}
            />
          </div>
        </div>
      </div>


      {/* Question Content — vertically centered */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 md:py-14">
        <div className="w-full max-w-3xl mx-auto">
          <div className="w-full">

            <div className="aihf-question-card rounded-2xl px-5 py-5 md:px-8 md:py-6 mb-5 text-center">

              <h2
                className="text-2xl md:text-4xl font-bold tracking-tight max-w-3xl mx-auto"
                style={{ color: "#FFFFFF" }}
              >
                {currentQuestion.question}
              </h2>
            </div>

            <div className="aihf-preferences-card rounded-2xl px-5 py-4 md:px-6 mb-6">
              <div className="flex items-center gap-2 mb-3 justify-center sm:justify-start">
                <Sparkles className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-[0.16em]">Your Preferences</h3>
              </div>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {QUIZ_QUESTIONS.slice(0, currentStep + 1).map((q) => {
                  const answer = answers[q.id];
                  if (!answer) return null;
                  const displayValue = Array.isArray(answer)
                    ? answer.map(v => q.options.find(o => o.value === v)?.label || v).join(", ")
                    : q.options.find(o => o.value === answer)?.label || String(answer);
                  return (
                    <div key={q.id} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-left max-w-full">
                      <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.68)" }}>
                        {q.id.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs font-semibold truncate max-w-[14rem]">{displayValue}</p>
                    </div>
                  );
                })}
                {Object.keys(answers).length === 0 && (
                  <p className="text-sm italic" style={{ color: "rgba(255,255,255,0.76)" }}>Answer questions to see your preferences here</p>
                )}
              </div>
            </div>



            {/* Multiple Select Controls */}
            {currentQuestion.type === "multiple" && currentQuestion.hasSelectAll && (
              <div className="flex justify-center gap-4 mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={allSelected()}
                  data-no-contrast-guard
                    className="aihf-option text-white hover:text-white border-white/30 font-semibold disabled:opacity-50"
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={!answers[currentQuestion.id] || (answers[currentQuestion.id] as string[]).length === 0}
                  data-no-contrast-guard
                  className="aihf-option text-white hover:text-white border-white/30 font-semibold disabled:opacity-50"
                >
                  Clear All
                </Button>
              </div>
            )}

            {/* Options Grid */}
            <div className={`aihf-options-grid grid gap-3 ${currentQuestion.options.length > 6 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2'}`}>
              {currentQuestion.options.map((option, optionIndex) => {
                const isSelected =
                  currentQuestion.type === "multiple"
                    ? (answers[currentQuestion.id] as string[] || []).includes(option.value)
                    : answers[currentQuestion.id] === option.value;
                const centerLastOption = currentQuestion.options.length % 2 === 1 && currentQuestion.options.length <= 6 && optionIndex === currentQuestion.options.length - 1;

                return (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(option.value)}
                    aria-pressed={isSelected}
                    data-no-contrast-guard
                    data-active-pill={isSelected ? "true" : undefined}
                    className={`aihf-option relative p-4 md:p-5 rounded-xl transition-all text-center group ${centerLastOption ? "aihf-option--center-last" : ""} ${
                      isSelected
                        ? "jj-surface-emerald"
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                    style={{ border: "none" }}
                  >
                    {currentQuestion.type === "multiple" && (
                      <div className={`absolute top-3 right-3 w-5 h-5 rounded flex items-center justify-center ${
                        isSelected ? "jj-surface-emerald" : "bg-white/10"
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                    )}
                    <span className="text-2xl mb-2 block">{option.icon}</span>
                    <span className="font-medium text-sm md:text-base text-[#1A1A1A]">
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
                data-no-contrast-guard
                className="aihf-cta h-11 px-5 text-sm font-semibold"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!isAnswered()}
                data-no-contrast-guard
                className="aihf-cta h-11 px-6 text-sm font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentStep === QUIZ_QUESTIONS.length - 1 ? "Continue" : "Next"}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Quiz;
