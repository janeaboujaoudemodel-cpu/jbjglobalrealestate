import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2, Upload, CheckCircle, FileText, Bot, MessageCircle, Briefcase,
  User, Phone, Mail, MapPin, Star, Search, ChevronDown, ChevronUp,
} from "lucide-react";
import { CONTACT_INFO } from "@/constants/stats";
import { PhoneInput } from "@/components/ui/phone-input";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface OpenPosition {
  id: string;
  title: string;
  department: string;
  description: string | null;
  employment_type: string;
  is_broker_role: boolean;
  location: string | null;
}

const NATIONALITIES = [
  "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Argentine", "Armenian", "Australian", "Austrian",
  "Azerbaijani", "Bahraini", "Bangladeshi", "Belgian", "Bolivian", "Bosnian", "Brazilian", "British", "Bulgarian", "Cambodian",
  "Cameroonian", "Canadian", "Chilean", "Chinese", "Colombian", "Croatian", "Cuban", "Czech", "Danish", "Dutch",
  "Ecuadorian", "Egyptian", "Emirati", "Estonian", "Ethiopian", "Filipino", "Finnish", "French", "Georgian", "German",
  "Ghanaian", "Greek", "Hungarian", "Icelandic", "Indian", "Indonesian", "Iranian", "Iraqi", "Irish", "Israeli",
  "Italian", "Jamaican", "Japanese", "Jordanian", "Kazakh", "Kenyan", "Korean", "Kuwaiti", "Latvian", "Lebanese",
  "Libyan", "Lithuanian", "Luxembourgish", "Malaysian", "Maldivian", "Maltese", "Mexican", "Moldovan", "Mongolian", "Moroccan",
  "Nepalese", "New Zealander", "Nigerian", "Norwegian", "Omani", "Pakistani", "Palestinian", "Panamanian", "Peruvian", "Polish",
  "Portuguese", "Qatari", "Romanian", "Russian", "Saudi", "Serbian", "Singaporean", "Slovak", "Slovenian", "South African",
  "Spanish", "Sri Lankan", "Sudanese", "Swedish", "Swiss", "Syrian", "Taiwanese", "Thai", "Tunisian", "Turkish",
  "Ukrainian", "Uruguayan", "Uzbek", "Venezuelan", "Vietnamese", "Yemeni", "Zambian", "Zimbabwean",
];

const LANGUAGES = [
  "English", "Arabic", "Hindi", "Urdu", "Chinese", "Russian",
  "French", "German", "Spanish", "Portuguese", "Persian (Farsi)", "Turkish",
];

// Map display name -> ISO-ish code we persist in DB
const LANGUAGE_CODE_BY_NAME: Record<string, string> = {
  English: "en", Arabic: "ar", Hindi: "hi", Urdu: "ur", Chinese: "zh", Russian: "ru",
  French: "fr", German: "de", Spanish: "es", Portuguese: "pt", "Persian (Farsi)": "fa", Turkish: "tr",
};
const LANGUAGE_NAME_BY_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(LANGUAGE_CODE_BY_NAME).map(([k, v]) => [v, k])
);

// Fallback positions if DB fetch fails
const FALLBACK_POSITIONS: { value: string; label: string; department: string; is_broker_role: boolean }[] = [
  { value: "property_consultant", label: "Property Consultant / Real Estate Broker", department: "Sales", is_broker_role: true },
  { value: "senior_property_consultant", label: "Senior Property Consultant", department: "Sales", is_broker_role: true },
  { value: "marketing_manager", label: "Marketing Manager", department: "Marketing", is_broker_role: false },
  { value: "hr_coordinator", label: "HR Coordinator", department: "HR", is_broker_role: false },
  { value: "web_developer", label: "Web Developer", department: "Technology", is_broker_role: false },
  { value: "other", label: "Other – General Application", department: "General", is_broker_role: false },
];

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahrain", "Bangladesh", "Belgium", "Bolivia", "Bosnia", "Brazil", "Bulgaria", "Cambodia",
  "Cameroon", "Canada", "Chile", "China", "Colombia", "Croatia", "Cuba", "Czech Republic",
  "Denmark", "Ecuador", "Egypt", "Estonia", "Ethiopia", "Finland", "France", "Georgia",
  "Germany", "Ghana", "Greece", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq",
  "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait",
  "Latvia", "Lebanon", "Libya", "Lithuania", "Luxembourg", "Malaysia", "Maldives", "Malta",
  "Mexico", "Moldova", "Mongolia", "Morocco", "Nepal", "Netherlands", "New Zealand", "Nigeria",
  "Norway", "Oman", "Pakistan", "Palestine", "Panama", "Peru", "Philippines", "Poland",
  "Portugal", "Qatar", "Romania", "Russia", "Saudi Arabia", "Serbia", "Singapore", "Slovakia",
  "Slovenia", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sudan", "Sweden", "Switzerland",
  "Syria", "Taiwan", "Thailand", "Tunisia", "Turkey", "Ukraine", "United Arab Emirates",
  "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

// ---- Department classifier ----
type QualKind = "sales" | "marketing" | "hr_ops" | "tech" | "general";

function classifyDepartment(dept?: string | null, isBrokerRole?: boolean): QualKind {
  if (isBrokerRole) return "sales";
  const d = (dept || "").toLowerCase();
  if (/(sales|brokerage|broker|agent|consultant|leasing)/.test(d)) return "sales";
  if (/(market|brand|content|seo|social|design|creative)/.test(d)) return "marketing";
  if (/(hr|people|operation|admin|finance|legal|compliance)/.test(d)) return "hr_ops";
  if (/(tech|engineer|develop|product|data|it)/.test(d)) return "tech";
  return "general";
}

// Session-storage key for resuming after auth redirect
const FORM_DRAFT_KEY = "jbj.careers.draft.v1";

export default function JoinApplication() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    nationality: "",
    preferredLanguage: "English",
    country: "",
    city: "",
    positionApplied: "",
    consentAccurate: false,
    consentTerms: false,
    // Sales qualification
    dealsClosed: "",
    totalDealValue: "",
    projectsSold: "",
    developerWorkedWith: "",
    reasonForLeaving: "",
    reference1Name: "",
    reference1Title: "",
    reference1Email: "",
    reference1Phone: "",
    reference2Name: "",
    reference2Title: "",
    reference2Email: "",
    reference2Phone: "",
    // Marketing
    marketingCampaigns: "",
    marketingBudget: "",
    marketingTools: "",
    portfolioLink: "",
    // HR / Ops / Admin
    yearsExperience: "",
    systemsUsed: "",
    certifications: "",
    // Tech
    techStack: "",
    githubLink: "",
    // General
    aboutYou: "",
  });

  const [honeypot, setHoneypot] = useState("");
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(true);
  const [positionSearch, setPositionSearch] = useState("");
  const [showAllPositions, setShowAllPositions] = useState(false);
  const formAnchorRef = useRef<HTMLDivElement>(null);

  // ---- Load draft on mount (resume after auth) ----
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(FORM_DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        setFormData((prev) => ({ ...prev, ...draft }));
      }
    } catch {}
  }, []);

  // ---- Persist draft on change ----
  useEffect(() => {
    try {
      const { consentAccurate, consentTerms, ...persistable } = formData;
      sessionStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(persistable));
    } catch {}
  }, [formData]);

  // ---- Fetch open positions ----
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const { data, error } = await supabase
          .from("open_positions")
          .select("id, title, department, description, employment_type, is_broker_role, location")
          .eq("is_active", true)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setOpenPositions(data || []);
      } catch (err) {
        console.error("Error fetching positions:", err);
      } finally {
        setPositionsLoading(false);
      }
    };
    fetchPositions();
  }, []);

  useEffect(() => {
    if (user) {
      checkExistingApplication();
    } else {
      setCheckingExisting(false);
    }
  }, [user]);

  const checkExistingApplication = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("hr_applications")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      setExistingApplication(data);
    } catch (error) {
      console.error("Error checking application:", error);
    } finally {
      setCheckingExisting(false);
    }
  };

  const uploadCV = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/cv-${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from("hr-documents")
      .upload(fileName, file, { cacheControl: "3600", upsert: true });
    if (error) {
      console.error("Upload error:", error);
      throw new Error("Failed to upload CV");
    }
    return data.path;
  };

  // ---- Resolve current position info ----
  const selectedPosition = useMemo(() => {
    const dbPos = openPositions.find((p) => p.id === formData.positionApplied);
    if (dbPos) {
      return {
        label: dbPos.title,
        department: dbPos.department,
        is_broker_role: dbPos.is_broker_role,
      };
    }
    const fb = FALLBACK_POSITIONS.find((p) => p.value === formData.positionApplied);
    if (fb) {
      return {
        label: fb.label,
        department: fb.department,
        is_broker_role: fb.is_broker_role,
      };
    }
    return null;
  }, [formData.positionApplied, openPositions]);

  const qualKind: QualKind = useMemo(
    () => (selectedPosition ? classifyDepartment(selectedPosition.department, selectedPosition.is_broker_role) : "general"),
    [selectedPosition]
  );

  // ---- Filter / paginate positions ----
  const filteredPositions = useMemo(() => {
    const q = positionSearch.trim().toLowerCase();
    if (!q) return openPositions;
    return openPositions.filter((p) =>
      [p.title, p.department, p.location || "", p.description || ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [positionSearch, openPositions]);

  const visiblePositions = showAllPositions ? filteredPositions : filteredPositions.slice(0, 6);

  const scrollToForm = () => {
    formAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleApplyPosition = (id: string) => {
    setFormData((prev) => ({ ...prev, positionApplied: id }));
    setTimeout(scrollToForm, 80);
  };

  // ---- File change ----
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ];
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const validExts = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "webp", "heic", "heif"];
    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      toast.error("Please upload a PDF, Word document, or photo (JPG/PNG/HEIC)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }
    setCvFile(file);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ---- Submit ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (honeypot) {
      toast.error("Submission blocked");
      return;
    }

    // Basic required-field guard (so we never silently bail to another route)
    const missing: string[] = [];
    if (!formData.firstName.trim()) missing.push("First name");
    if (!formData.lastName.trim()) missing.push("Last name");
    if (!formData.phone.trim()) missing.push("Phone number");
    if (!formData.nationality) missing.push("Nationality");
    if (!formData.country) missing.push("Country");
    if (!formData.city.trim()) missing.push("City");
    if (!formData.positionApplied) missing.push("Position");
    if (missing.length) {
      toast.error(`Please complete: ${missing.join(", ")}`);
      return;
    }

    if (!user) {
      // Save draft and route to auth, returning to /careers
      try {
        sessionStorage.setItem(
          FORM_DRAFT_KEY,
          JSON.stringify({ ...formData, consentAccurate: false, consentTerms: false })
        );
      } catch {}
      toast.message("Sign in to submit your application", {
        description: "We saved your progress — you'll come right back here.",
      });
      navigate("/auth?redirect=/careers");
      return;
    }

    if (!formData.consentAccurate || !formData.consentTerms) {
      toast.error("Please accept both consent checkboxes");
      return;
    }

    if (!cvFile) {
      toast.error("Please upload your CV (PDF, Word, or photo)");
      return;
    }

    setLoading(true);
    try {
      setUploadProgress(30);
      const cvPath = await uploadCV(cvFile);
      setUploadProgress(60);

      const positionLabel = selectedPosition?.label || formData.positionApplied;
      const langCode = LANGUAGE_CODE_BY_NAME[formData.preferredLanguage] || "en";

      const { error: appError } = await supabase
        .from("hr_applications")
        .insert({
          user_id: user.id,
          full_name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: user.email!,
          phone_e164: formData.phone,
          nationality: formData.nationality,
          preferred_language: langCode,
          current_location_country: formData.country,
          current_location_city: formData.city,
          cv_url: cvPath,
          position_applied: positionLabel,
          consent_accurate: formData.consentAccurate,
          consent_terms: formData.consentTerms,
          status: "pending",
        });

      if (appError) throw appError;

      // Notifications & confirmation email
      await Promise.allSettled([
        supabase.functions.invoke("send-cv-status-email", {
          body: {
            email: user.email!,
            fullName: `${formData.firstName} ${formData.lastName}`.trim(),
            status: "submitted",
            position: positionLabel,
            userId: user.id,
          },
        }),
        supabase.from("admin_tasks").insert({
          user_id: user.id,
          title: "CV under review",
          description: `Your CV for ${positionLabel} is currently under review by the HR team.`,
          category: "cv_application",
          status: "pending",
          priority: "medium",
        }),
      ]);

      // Create HR user role as candidate (idempotent)
      const { error: roleError } = await supabase
        .from("hr_user_roles")
        .insert({ user_id: user.id, role: "broker_candidate", is_active: true });
      if (roleError && !roleError.message.includes("duplicate")) {
        console.error("Role error:", roleError);
      }

      setUploadProgress(100);
      try {
        sessionStorage.removeItem(FORM_DRAFT_KEY);
      } catch {}
      toast.success("Application submitted successfully!");
      navigate("/onboarding");
    } catch (error: any) {
      console.error("Submit error:", error);
      // CRITICAL: never navigate away on failure
      toast.error(error?.message || "Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (checkingExisting) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1A1A1A]" />
      </div>
    );
  }

  // ---- Returning user (existing application) ----
  if (existingApplication) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">
        <section className="flex-1 flex items-center justify-center px-4 py-16 min-h-screen">
          <div className="w-full max-w-3xl mx-auto">
            <Card className="bg-[#FDFBF7]/80 backdrop-blur-sm border-2 border-[#B89555]/30 shadow-2xl p-8 md:p-12 rounded-2xl">
              <CardHeader className="text-center pb-6">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-2 border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <CheckCircle className="h-12 w-12 text-emerald-600" />
                </div>
                <CardTitle className="text-3xl md:text-4xl text-[#1A1A1A] mb-4">Welcome Back</CardTitle>
                <CardDescription className="text-lg text-[#1A1A1A]/70">
                  Your application status: <span className="font-semibold text-[#1A1A1A] capitalize">{existingApplication.status}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                {existingApplication.status === "approved" ? (
                  <>
                    <p className="text-[#1A1A1A]/70 text-lg leading-relaxed">
                      Congratulations! Your application has been approved. Our HR team will assign your training program and onboarding materials shortly.
                    </p>
                    <div className="pt-4">
                      <Button variant="primary" size="lg" asChild className="px-8 py-6 text-lg">
                        <Link to="/onboarding">
                          <span className="text-[#1A1A1A]">Go to Onboarding Dashboard</span>
                        </Link>
                      </Button>
                    </div>
                  </>
                ) : existingApplication.status === "pending" ? (
                  <>
                    <p className="text-[#1A1A1A]/70 text-lg leading-relaxed">
                      Your application is currently under review. Our HR team will get back to you within 2–3 business days.
                    </p>
                    <div className="pt-4">
                      <Button variant="secondary" size="lg" asChild className="px-8 py-6 text-lg">
                        <Link to="/">Explore JBJ Global</Link>
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[#1A1A1A]/70 text-lg leading-relaxed">
                      Continue your journey with JBJ Global Real Estate. Access your onboarding dashboard to track progress.
                    </p>
                    <div className="pt-4">
                      <Button variant="primary" size="lg" asChild className="px-8 py-6 text-lg">
                        <Link to="/onboarding">
                          <span className="text-[#1A1A1A]">Continue to Onboarding</span>
                        </Link>
                      </Button>
                    </div>
                  </>
                )}
                <div className="pt-2">
                  <Link to="/hr-agent" className="text-[#1A1A1A] underline hover:opacity-80 text-sm font-medium">
                    Need help? Chat with Jessica, our HR Assistant
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-[#1A1A1A]/70">
              <a href={`tel:${CONTACT_INFO.phoneRaw}`} className="flex items-center gap-2 hover:text-[#1A1A1A] transition-colors">
                <Phone className="w-4 h-4 text-[#1A1A1A]" />
                {CONTACT_INFO.phone}
              </a>
              <a href={`mailto:${CONTACT_INFO.email}`} className="flex items-center gap-2 hover:text-[#1A1A1A] transition-colors">
                <Mail className="w-4 h-4 text-[#1A1A1A]" />
                {CONTACT_INFO.email}
              </a>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ---- Render: full-width application form ----
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">
      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-10 pt-24 lg:pt-20">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-semibold mb-3 text-[#1A1A1A] tracking-tight">
              Join JBJ Global Real Estate
            </h1>
            <p className="text-base md:text-lg text-[#1A1A1A]/75 max-w-2xl mx-auto">
              Apply to become part of our team. Complete the form below to start your journey.
            </p>
          </div>

          {/* Jessica CTA */}
          <Card className="bg-[#FDFBF7] border border-[#1A1A1A]/10 shadow-sm mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 bg-[#1A1A1A]">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h3 className="text-lg font-semibold mb-1 text-[#1A1A1A]">Prefer a Conversation?</h3>
                  <p className="text-sm text-[#1A1A1A]/75">
                    Meet Jessica — available 24/7 to support you. She'll collect your CV, qualify you, and conduct your interview.
                  </p>
                </div>
                <Link
                  to="/hr-agent"
                  className="inline-flex items-center justify-center gap-2 rounded-md px-4 h-10 font-semibold shadow-sm hover:opacity-90 transition-opacity whitespace-nowrap bg-[#1A1A1A] text-white"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                  <span className="text-white">Contact Our HR · Jessica</span>
                </Link>
              </div>
            </CardContent>
          </Card>

          {!user && (
            <Card className="border-2 border-[#B89555] bg-[#EFE6D6]/10 backdrop-blur-sm rounded-2xl shadow-md mb-6">
              <CardContent className="pt-6">
                <p className="text-center text-[#1A1A1A] font-semibold mb-2 text-lg">
                  Fill the form below — then sign in to submit
                </p>
                <p className="text-center text-[#1A1A1A]/75 mb-4 text-sm">
                  You can complete the entire form first. Sign in or create an account when you're ready to submit.
                </p>
                <div className="flex justify-center">
                  <Button variant="primary" asChild>
                    <Link to="/auth?redirect=/careers" className="text-white">
                      <span className="text-white font-semibold">Sign In / Create Account</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Open Positions */}
          {!positionsLoading && openPositions.length > 0 && (
            <Card className="mb-8 bg-[#FDFBF7] border border-[#1A1A1A]/10 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-2xl text-[#1A1A1A]">Open Positions</CardTitle>
                    <Badge className="bg-[#1A1A1A] text-white border-transparent">
                      {filteredPositions.length} open
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-[#1A1A1A]/70">
                  Tap <strong>Apply</strong> on any role to auto-select it below.
                </CardDescription>
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/60" />
                  <Input
                    value={positionSearch}
                    onChange={(e) => setPositionSearch(e.target.value)}
                    placeholder="Search positions by title, department, or location"
                    className="pl-9 bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/50"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {visiblePositions.length === 0 ? (
                  <p className="text-center text-[#1A1A1A]/70 py-6">No positions match your search.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {visiblePositions.map((pos) => {
                      const selected = formData.positionApplied === pos.id;
                      return (
                        <div
                          key={pos.id}
                          onClick={() => setFormData({ ...formData, positionApplied: pos.id })}
                          className={`p-4 rounded-xl border bg-[#FDFBF7] shadow-sm transition-all cursor-pointer ${
                            selected
                              ? "border-[#1A1A1A] ring-2 ring-[#1A1A1A] bg-[#F7F2EA]"
                              : "border-[#1A1A1A]/15 hover:border-[#1A1A1A]/40 hover:shadow-md"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2 gap-2">
                            <h4 className="font-semibold text-base leading-snug text-[#1A1A1A]">{pos.title}</h4>
                            {pos.is_broker_role && (
                              <Badge className="border-transparent text-[10px] px-2 py-0.5 shrink-0 whitespace-nowrap bg-[#1A1A1A] text-white">
                                <Star className="w-2.5 h-2.5 mr-0.5 text-white" /> Partner
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <Badge variant="outline" className="border-[#1A1A1A]/20 bg-[#F7F2EA] text-[10px] px-2 py-0.5 font-medium whitespace-nowrap text-[#1A1A1A]">
                              {pos.department}
                            </Badge>
                            {pos.is_broker_role && (
                              <span className="font-semibold whitespace-nowrap text-[#b45309]">Commission Basis</span>
                            )}
                            {pos.location && (
                              <span className="flex items-center gap-0.5 whitespace-nowrap text-[#1A1A1A]/70">
                                <MapPin className="w-2.5 h-2.5 text-[#1A1A1A]" />
                                {pos.location}
                              </span>
                            )}
                          </div>
                          {pos.description && (
                            <p className="text-xs text-[#1A1A1A]/70 mt-2 line-clamp-2 leading-relaxed">{pos.description}</p>
                          )}
                          <div className="mt-3 flex justify-end">
                            <Button
                              type="button"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApplyPosition(pos.id);
                              }}
                              className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90"
                            >
                              {selected ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Selected
                                </>
                              ) : (
                                "Apply"
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {filteredPositions.length > 6 && (
                  <div className="mt-4 text-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAllPositions((v) => !v)}
                      className="border-[#1A1A1A]/20 bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#F7F2EA]"
                    >
                      {showAllPositions ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-1" /> Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-1" /> View all {filteredPositions.length} positions
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Application Form */}
          <div ref={formAnchorRef} />
          <Card className="bg-[#FDFBF7] border border-[#1A1A1A]/10 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-[#1A1A1A]">Application Form</CardTitle>
              <CardDescription className="text-[#1A1A1A]/70">
                All fields are required.{" "}
                {selectedPosition && (
                  <span className="font-medium text-[#1A1A1A]">Applying for: {selectedPosition.label}</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Honeypot */}
                <div className="hidden" aria-hidden="true">
                  <Input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                {/* Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-semibold text-[#1A1A1A]">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="e.g. Sarah"
                      disabled={loading}
                      className="bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-semibold text-[#1A1A1A]">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="e.g. Khan"
                      disabled={loading}
                      className="bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-[#1A1A1A]">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    placeholder="you@email.com"
                    disabled
                    className="bg-[#F7F2EA] border-[#1A1A1A]/15 text-[#1A1A1A] h-11 text-base"
                  />
                  <p className="text-xs text-[#1A1A1A]/60">Email is linked to your account</p>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold text-[#1A1A1A]">Phone Number</Label>
                  <PhoneInput
                    value={formData.phone}
                    onChange={(value) => setFormData({ ...formData, phone: value || "" })}
                    disabled={loading}
                    placeholder="+971 54 716 7107"
                  />
                </div>

                {/* Nationality + Language */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-[#1A1A1A]">Nationality</Label>
                    <SearchableSelect
                      value={formData.nationality}
                      onChange={(v) => setFormData({ ...formData, nationality: v })}
                      options={NATIONALITIES}
                      placeholder="Select nationality"
                      searchPlaceholder="Search nationality..."
                      flagType="country"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-[#1A1A1A]">Preferred Language</Label>
                    <SearchableSelect
                      value={formData.preferredLanguage}
                      onChange={(v) => setFormData({ ...formData, preferredLanguage: v })}
                      options={LANGUAGES}
                      placeholder="Select language"
                      searchPlaceholder="Search language..."
                      flagType="language"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Country + City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-[#1A1A1A]">Country</Label>
                    <SearchableSelect
                      value={formData.country}
                      onChange={(v) => setFormData({ ...formData, country: v })}
                      options={COUNTRIES}
                      placeholder="Select country"
                      searchPlaceholder="Search country..."
                      flagType="country"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-semibold text-[#1A1A1A]">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Dubai"
                      disabled={loading}
                      className="bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base"
                    />
                  </div>
                </div>

                {/* Position fallback (only when no DB positions) */}
                {openPositions.length === 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-[#1A1A1A]">
                      Position Applied For <span className="text-red-600">*</span>
                    </Label>
                    <SearchableSelect
                      value={
                        FALLBACK_POSITIONS.find((p) => p.value === formData.positionApplied)?.label || ""
                      }
                      onChange={(label) => {
                        const fb = FALLBACK_POSITIONS.find((p) => p.label === label);
                        if (fb) setFormData({ ...formData, positionApplied: fb.value });
                      }}
                      options={FALLBACK_POSITIONS.map((p) => p.label)}
                      placeholder="Select a position"
                      searchPlaceholder="Search positions..."
                      showFlags={false}
                      disabled={loading}
                    />
                  </div>
                )}

                {/* Role-aware Qualification */}
                {qualKind === "sales" && (
                  <div className="space-y-4 p-5 rounded-xl border border-[#B89555]/30 bg-[#EFE6D6]/5">
                    <h3 className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
                      <Briefcase className="h-5 w-5" /> Sales Qualification
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-[#1A1A1A]">How many deals have you closed?</Label>
                        <Input value={formData.dealsClosed} onChange={(e) => setFormData({ ...formData, dealsClosed: e.target.value })} placeholder="e.g. 25" disabled={loading} className="bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-[#1A1A1A]">Total value of deals closed (AED)</Label>
                        <Input value={formData.totalDealValue} onChange={(e) => setFormData({ ...formData, totalDealValue: e.target.value })} placeholder="e.g. 50,000,000" disabled={loading} className="bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-[#1A1A1A]">Which projects/areas have you sold in?</Label>
                      <Input value={formData.projectsSold} onChange={(e) => setFormData({ ...formData, projectsSold: e.target.value })} placeholder="e.g. Dubai Marina, Downtown, Palm Jumeirah" disabled={loading} className="bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-[#1A1A1A]">Which developers have you worked with?</Label>
                      <Input value={formData.developerWorkedWith} onChange={(e) => setFormData({ ...formData, developerWorkedWith: e.target.value })} placeholder="e.g. DAMAC, Emaar, Meraas" disabled={loading} className="bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-[#1A1A1A]">Why are you leaving your current position?</Label>
                      <Input value={formData.reasonForLeaving} onChange={(e) => setFormData({ ...formData, reasonForLeaving: e.target.value })} placeholder="Reason for seeking new opportunity" disabled={loading} className="bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base" />
                    </div>

                    <h3 className="text-lg font-semibold text-[#1A1A1A] mt-2 flex items-center gap-2">
                      <User className="h-5 w-5" /> Professional References (2 required)
                    </h3>
                    <p className="text-sm text-[#1A1A1A]/70">Provide references from your previous employer so we can verify your experience.</p>
                    {[1, 2].map((n) => (
                      <div key={n} className="space-y-3 p-3 rounded-lg border border-[#B89555]/20 bg-[#FDFBF7]">
                        <p className="text-sm font-semibold text-[#1A1A1A]">Reference {n}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            value={(formData as any)[`reference${n}Name`]}
                            onChange={(e) => setFormData({ ...formData, [`reference${n}Name`]: e.target.value } as any)}
                            placeholder="Full name (e.g. Director / HR Manager)"
                            disabled={loading}
                            className="bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base"
                          />
                          <Input
                            value={(formData as any)[`reference${n}Title`]}
                            onChange={(e) => setFormData({ ...formData, [`reference${n}Title`]: e.target.value } as any)}
                            placeholder="Title & Company"
                            disabled={loading}
                            className="bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base"
                          />
                          <Input
                            type="email"
                            value={(formData as any)[`reference${n}Email`]}
                            onChange={(e) => setFormData({ ...formData, [`reference${n}Email`]: e.target.value } as any)}
                            placeholder="Company email"
                            disabled={loading}
                            className="bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base"
                          />
                          <Input
                            value={(formData as any)[`reference${n}Phone`]}
                            onChange={(e) => setFormData({ ...formData, [`reference${n}Phone`]: e.target.value } as any)}
                            placeholder="Phone number"
                            disabled={loading}
                            className="bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {qualKind === "marketing" && (
                  <div className="space-y-4 p-5 rounded-xl border border-[#B89555]/30 bg-[#EFE6D6]/5">
                    <h3 className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
                      <Briefcase className="h-5 w-5" /> Marketing Qualification
                    </h3>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-[#1A1A1A]">Notable campaigns you have led</Label>
                      <Input value={formData.marketingCampaigns} onChange={(e) => setFormData({ ...formData, marketingCampaigns: e.target.value })} placeholder="e.g. Off-plan launch — 5M reach, 8% CTR" disabled={loading} className="bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-[#1A1A1A]">Largest budget managed (AED)</Label>
                        <Input value={formData.marketingBudget} onChange={(e) => setFormData({ ...formData, marketingBudget: e.target.value })} placeholder="e.g. 1,500,000" disabled={loading} className="bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-[#1A1A1A]">Tools / platforms</Label>
                        <Input value={formData.marketingTools} onChange={(e) => setFormData({ ...formData, marketingTools: e.target.value })} placeholder="e.g. Meta Ads, GA4, HubSpot, Figma" disabled={loading} className="bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-[#1A1A1A]">Portfolio link</Label>
                      <Input value={formData.portfolioLink} onChange={(e) => setFormData({ ...formData, portfolioLink: e.target.value })} placeholder="https://your-portfolio.com" disabled={loading} className="bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base" />
                    </div>
                  </div>
                )}

                {qualKind === "hr_ops" && (
                  <div className="space-y-4 p-5 rounded-xl border border-[#B89555]/30 bg-[#EFE6D6]/5">
                    <h3 className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
                      <Briefcase className="h-5 w-5" /> Role Qualification
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-[#1A1A1A]">Years of experience</Label>
                        <Input value={formData.yearsExperience} onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })} placeholder="e.g. 5" disabled={loading} className="bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-[#1A1A1A]">Systems used</Label>
                        <Input value={formData.systemsUsed} onChange={(e) => setFormData({ ...formData, systemsUsed: e.target.value })} placeholder="e.g. Bayut Pro, Property Finder, Salesforce" disabled={loading} className="bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-[#1A1A1A]">Certifications</Label>
                      <Input value={formData.certifications} onChange={(e) => setFormData({ ...formData, certifications: e.target.value })} placeholder="e.g. RERA, CIPD, PMP" disabled={loading} className="bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base" />
                    </div>
                  </div>
                )}

                {qualKind === "tech" && (
                  <div className="space-y-4 p-5 rounded-xl border border-[#B89555]/30 bg-[#EFE6D6]/5">
                    <h3 className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
                      <Briefcase className="h-5 w-5" /> Technical Qualification
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-[#1A1A1A]">Years of experience</Label>
                        <Input value={formData.yearsExperience} onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })} placeholder="e.g. 7" disabled={loading} className="bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-[#1A1A1A]">Stack / specialties</Label>
                        <Input value={formData.techStack} onChange={(e) => setFormData({ ...formData, techStack: e.target.value })} placeholder="e.g. React, TypeScript, Supabase, AWS" disabled={loading} className="bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-[#1A1A1A]">GitHub / portfolio link</Label>
                      <Input value={formData.githubLink} onChange={(e) => setFormData({ ...formData, githubLink: e.target.value })} placeholder="https://github.com/your-handle" disabled={loading} className="bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base" />
                    </div>
                  </div>
                )}

                {qualKind === "general" && selectedPosition && (
                  <div className="space-y-4 p-5 rounded-xl border border-[#B89555]/30 bg-[#EFE6D6]/5">
                    <h3 className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
                      <Briefcase className="h-5 w-5" /> About You
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-[#1A1A1A]">Years of experience</Label>
                        <Input value={formData.yearsExperience} onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })} placeholder="e.g. 3" disabled={loading} className="bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-[#1A1A1A]">Portfolio / LinkedIn link</Label>
                        <Input value={formData.portfolioLink} onChange={(e) => setFormData({ ...formData, portfolioLink: e.target.value })} placeholder="https://linkedin.com/in/your-handle" disabled={loading} className="bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-[#1A1A1A]">Tell us briefly about yourself</Label>
                      <Input value={formData.aboutYou} onChange={(e) => setFormData({ ...formData, aboutYou: e.target.value })} placeholder="What makes you a strong fit for this role?" disabled={loading} className="bg-[#FDFBF7] border-[#1A1A1A]/15 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base" />
                    </div>
                  </div>
                )}

                {/* CV / Resume */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[#1A1A1A]">CV / Resume</Label>
                  <div className="border-2 border-dashed border-[#B89555]/40 rounded-xl p-7 text-center hover:border-[#B89555]/60 transition-colors">
                    {cvFile ? (
                      <div className="flex flex-col items-center gap-2 text-[#1A1A1A]">
                        <FileText className="h-7 w-7 text-emerald-600" />
                        <span className="font-medium text-base">{cvFile.name}</span>
                        <span className="text-xs text-[#1A1A1A]/60">{formatSize(cvFile.size)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setCvFile(null)}
                          disabled={loading}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block w-full">
                        <div className="flex flex-col items-center gap-2 py-2">
                          <Upload className="h-9 w-9 text-[#1A1A1A]/70" />
                          <span className="text-base font-medium text-[#1A1A1A]">Click to upload your CV</span>
                          <span className="text-sm text-[#1A1A1A]/65">PDF, Word, or photo (JPG / PNG / HEIC) — max 10 MB</span>
                        </div>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.heif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          disabled={loading}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Consent */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="consentAccurate"
                      checked={formData.consentAccurate}
                      onCheckedChange={(checked) => setFormData({ ...formData, consentAccurate: checked as boolean })}
                      disabled={loading}
                    />
                    <Label htmlFor="consentAccurate" className="text-sm leading-relaxed cursor-pointer text-[#1A1A1A]">
                      I confirm that the information provided is accurate and complete to the best of my knowledge.
                    </Label>
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="consentTerms"
                      checked={formData.consentTerms}
                      onCheckedChange={(checked) => setFormData({ ...formData, consentTerms: checked as boolean })}
                      disabled={loading}
                    />
                    <Label htmlFor="consentTerms" className="text-sm leading-relaxed cursor-pointer text-[#1A1A1A]">
                      I agree to the{" "}
                      <Link to="/terms" className="text-[#1A1A1A] underline font-medium" target="_blank">Terms of Service</Link>
                      {" "}and{" "}
                      <Link to="/privacy" className="text-[#1A1A1A] underline font-medium" target="_blank">Privacy Policy</Link>.
                    </Label>
                  </div>
                </div>

                {/* Progress */}
                {uploadProgress > 0 && (
                  <div className="w-full bg-[#F7F2EA] rounded-full h-2">
                    <div
                      className="bg-[#EFE6D6] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A] font-bold h-12 text-base"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : user ? (
                    "Submit Application"
                  ) : (
                    "Continue & Sign In to Submit"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-[#1A1A1A]/70 mt-6">
            Questions? Contact us at{" "}
            <a href="mailto:contact@JBJ.ae" className="text-[#1A1A1A] underline font-medium">
              contact@JBJ.ae
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
