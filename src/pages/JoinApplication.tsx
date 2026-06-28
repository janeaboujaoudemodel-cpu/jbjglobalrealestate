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
  Loader2, Upload, CheckCircle, FileText, Briefcase,
  User, Phone, Mail, MapPin, Star, Search, ChevronDown, ChevronUp,
  ArrowLeft, ArrowRight, Sparkles,
} from "lucide-react";
import { CONTACT_INFO } from "@/constants/stats";
import { getCountryList, getLanguageList } from "@/constants/localeOptions";
import { PhoneInput } from "@/components/ui/phone-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import PremiumCareersHero from "@/components/careers/PremiumCareersHero";
import JessicaAIPanel from "@/components/careers/JessicaAIPanel";
import PremiumJobCard, { type JobCardTag } from "@/components/careers/PremiumJobCard";
import PremiumCVUpload from "@/components/careers/PremiumCVUpload";
import ApplicationProgress, { STEP_ICONS } from "@/components/careers/ApplicationProgress";
import SelectedRoleChip from "@/components/careers/SelectedRoleChip";
import CareersEcosystem from "@/components/careers/CareersEcosystem";
import CareersWhyJBJ from "@/components/careers/CareersWhyJBJ";
import CareersFAQ from "@/components/careers/CareersFAQ";
import CareersContactBlock from "@/components/careers/CareersContactBlock";
import FieldError from "@/components/forms/FieldError";
import { z } from "zod";

interface OpenPosition {
  id: string;
  title: string;
  department: string;
  description: string | null;
  employment_type: string;
  is_broker_role: boolean;
  location: string | null;
  status?: "open" | "urgent" | "paused" | "closed" | "hidden" | null;
  is_featured?: boolean | null;
  application_cap?: number | null;
  applications_count?: number | null;
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

const LANGUAGES = getLanguageList();

const UAE_CITIES = [
  "Abu Dhabi",
  "Ajman",
  "Al Ain",
  "Dubai",
  "Fujairah",
  "Kalba",
  "Khor Fakkan",
  "Ras Al Khaimah",
  "Sharjah",
  "Umm Al Quwain",
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

const COUNTRIES = getCountryList();

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fieldErr = (k: string) => errors[k];
  const invalidProps = (k: string) =>
    errors[k]
      ? { "aria-invalid": true as const, "aria-describedby": `${k}-err` }
      : {};
  const clearFieldError = (k: string) =>
    setErrors((prev) => {
      if (!prev[k]) return prev;
      const { [k]: _omit, ...rest } = prev;
      return rest;
    });
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(true);
  const [positionSearch, setPositionSearch] = useState("");
  const [showAllPositions, setShowAllPositions] = useState(false);
  const formAnchorRef = useRef<HTMLDivElement>(null);

  // ---- Wizard state ----
  const [currentStep, setCurrentStep] = useState(0);
  const TOTAL_STEPS = 5;

  // ---- Load draft on mount (resume after auth) ----
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(FORM_DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        const { phone: _phone, ...safeDraft } = draft || {};
        setFormData((prev) => ({ ...prev, ...safeDraft, phone: "" }));
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
          .select("id, title, department, description, employment_type, is_broker_role, location, status, is_featured, application_cap, applications_count")
          .neq("status", "hidden")
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false });
        if (error) throw error;
        setOpenPositions((data as unknown as OpenPosition[]) || []);
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
    const dbPos = openPositions.find((p) => p.id === id);
    const label = dbPos?.title || FALLBACK_POSITIONS.find((p) => p.value === id)?.label || "this role";
    toast.success(`Selected: ${label}`, {
      description: "Application form synced. Continue below to complete your application.",
    });
    // Always start the wizard from Step 1 (Personal) so the user fills
    // it in order, regardless of any prior progress.
    setCurrentStep(0);
    setTimeout(scrollToForm, 80);
  };

  // ---- Wizard step validation (zod-driven, required-field enforced) ----
  const STEP_LABELS = ["Personal", "Location & Language", "Role & Experience", "CV", "Review & Consent"];

  const REQ = (label: string) => z.string().trim().min(1, `${label} is required`);
  const REQ_URL = (label: string) =>
    z.string().trim().min(1, `${label} is required`).url(`${label} must be a valid URL`);
  const REQ_EMAIL = (label: string) =>
    z.string().trim().min(1, `${label} is required`).email("Enter a valid email address");

  const step0Schema = z.object({
    firstName: REQ("First name").max(60),
    lastName: REQ("Last name").max(60),
    phone: z
      .string()
      .trim()
      .min(8, "Phone number is required")
      .max(20, "Phone number is too long"),
  });
  const step1Schema = z.object({
    nationality: REQ("Nationality"),
    preferredLanguage: REQ("Preferred language"),
    country: REQ("Country"),
    city: REQ("City"),
  });

  const qualSchemaFor = (kind: QualKind) => {
    if (kind === "sales") {
      return z.object({
        dealsClosed: REQ("Deals closed"),
        totalDealValue: REQ("Total deal value"),
        projectsSold: REQ("Projects sold in"),
        developerWorkedWith: REQ("Developers worked with"),
        reasonForLeaving: REQ("Reason for leaving"),
        reference1Name: REQ("Reference 1 name"),
        reference1Title: REQ("Reference 1 title & company"),
        reference1Email: REQ_EMAIL("Reference 1 email"),
        reference1Phone: REQ("Reference 1 phone"),
        reference2Name: REQ("Reference 2 name"),
        reference2Title: REQ("Reference 2 title & company"),
        reference2Email: REQ_EMAIL("Reference 2 email"),
        reference2Phone: REQ("Reference 2 phone"),
      });
    }
    if (kind === "marketing") {
      return z.object({
        marketingCampaigns: REQ("Notable campaigns"),
        marketingBudget: REQ("Largest budget managed"),
        marketingTools: REQ("Tools / platforms"),
        portfolioLink: REQ_URL("Portfolio link"),
      });
    }
    if (kind === "hr_ops") {
      return z.object({
        yearsExperience: REQ("Years of experience"),
        systemsUsed: REQ("Systems used"),
        certifications: REQ("Certifications"),
      });
    }
    if (kind === "tech") {
      return z.object({
        yearsExperience: REQ("Years of experience"),
        techStack: REQ("Stack / specialties"),
        githubLink: REQ_URL("GitHub / portfolio link"),
      });
    }
    // general
    return z.object({
      yearsExperience: REQ("Years of experience"),
      portfolioLink: REQ_URL("Portfolio / LinkedIn link"),
      aboutYou: REQ("Tell us briefly about yourself"),
    });
  };

  const step2Schema = () =>
    z
      .object({ positionApplied: REQ("Position") })
      .and(qualSchemaFor(qualKind) as z.ZodTypeAny);

  const step4Schema = z.object({
    consentAccurate: z.literal(true, {
      errorMap: () => ({ message: "Please confirm the information is accurate" }),
    }),
    consentTerms: z.literal(true, {
      errorMap: () => ({ message: "Please accept the Terms and Privacy Policy" }),
    }),
  });

  const validateStep = (idx: number): boolean => {
    let schema: z.ZodTypeAny | null = null;
    if (idx === 0) schema = step0Schema;
    else if (idx === 1) schema = step1Schema;
    else if (idx === 2) schema = step2Schema();
    else if (idx === 3) {
      if (!cvFile) {
        setErrors((p) => ({ ...p, cvFile: "Please upload your CV (PDF, Word, or photo)" }));
        toast.error("Please upload your CV");
        return false;
      }
      setErrors((p) => {
        const { cvFile: _x, ...rest } = p;
        return rest;
      });
      return true;
    } else if (idx === 4) schema = step4Schema;
    if (!schema) return true;
    const result = schema.safeParse(formData);
    if (result.success) {
      // clear any errors that belonged to this step
      const keys = Object.keys((schema as any)._def?.shape?.() || {});
      setErrors((prev) => {
        const next = { ...prev };
        keys.forEach((k) => delete next[k]);
        return next;
      });
      return true;
    }
    const next: Record<string, string> = {};
    result.error.issues.forEach((iss) => {
      const k = String(iss.path[0] ?? "");
      if (k && !next[k]) next[k] = iss.message;
    });
    setErrors((prev) => ({ ...prev, ...next }));
    toast.error("Please complete the highlighted fields");
    return false;
  };

  const goToStep = (idx: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_STEPS - 1, idx));
    // Backward / same-step navigation is always allowed.
    if (clamped <= currentStep) {
      setCurrentStep(clamped);
      setTimeout(scrollToForm, 50);
      return;
    }
    // Forward navigation: enforce sequential completion. Validate every
    // step from current up to (but not including) the target. The first
    // invalid step becomes the new active step (with errors surfaced by
    // validateStep) so the user can't skip ahead.
    for (let i = currentStep; i < clamped; i++) {
      if (!validateStep(i)) {
        setCurrentStep(i);
        setTimeout(scrollToForm, 50);
        return;
      }
    }
    setCurrentStep(clamped);
    setTimeout(scrollToForm, 50);
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    goToStep(currentStep + 1);
  };
  const handleBack = () => goToStep(currentStep - 1);

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

    // Full zod-driven validation across all steps
    const allOk =
      validateStep(0) && validateStep(1) && validateStep(2) && validateStep(3);
    if (!allOk) {
      // Jump to first failing step for the user
      for (let i = 0; i < 4; i++) {
        if (!validateStep(i)) {
          goToStep(i);
          break;
        }
      }
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

    if (!validateStep(4)) {
      goToStep(4);
      return;
    }
    if (!cvFile) {
      setErrors((p) => ({ ...p, cvFile: "Please upload your CV (PDF, Word, or photo)" }));
      toast.error("Please upload your CV (PDF, Word, or photo)");
      goToStep(3);
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
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br /20 /10 border-2 border-[color:var(--emerald-1)]/30/40 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <CheckCircle className="h-12 w-12 text-[#1A1A1A]" />
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
                          <span className="text-white">Go to Onboarding Dashboard</span>
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
                        <Link to="/">Explore JBJ GLOBAL REAL ESTATE</Link>
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
                    Need help? Chat with Jessica, our Interview Assistant
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

  // ---- Reusable required-field input for qualification blocks ----
  const QField = ({
    k,
    label,
    placeholder,
    type = "text",
  }: {
    k: string;
    label: string;
    placeholder: string;
    type?: string;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={k} data-required className="jbj-form-label text-sm font-semibold">
        {label}
      </Label>
      <Input
        id={k}
        type={type}
        value={(formData as any)[k] ?? ""}
        onChange={(e) => {
          setFormData((prev) => ({ ...prev, [k]: e.target.value } as any));
          clearFieldError(k);
        }}
        placeholder={placeholder}
        disabled={loading}
        required
        aria-required="true"
        {...invalidProps(k)}
        className={`bg-[#FDFBF7] border-2 border-[#0A0A0A] text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 h-11 text-base ${
 fieldErr(k) ? "is-invalid" : ""
 }`}
      />
      <FieldError id={`${k}-err`} message={fieldErr(k)} />
    </div>
  );

  // ---- Render: full-width application form ----
  return (
    <div data-premium data-careers-page className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">
      {/* Premium hero — replaces former simple title block */}
      <PremiumCareersHero />

      <section className="px-4 sm:px-6 lg:px-10 pb-12 md:pb-16">
        <div className="max-w-5xl mx-auto">
          {/* Jessica interview consultant panel */}
          <JessicaAIPanel />



          {!user && (
            <Card className="relative overflow-hidden border border-[#B89555]/55 bg-[linear-gradient(135deg,rgba(253,251,247,0.95),rgba(247,242,234,0.85))] backdrop-blur-md rounded-2xl shadow-[0_18px_44px_-32px_rgba(10,10,10,0.35)] mb-6">
              <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[#B89555]/70 to-transparent" />
              <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-[#0A0A0A]/10 blur-3xl" />
              <CardContent className="pt-6 sm:pt-7 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0A0A0A]/80 mb-1">
                      Sign in optional now
                    </p>
                    <p className="text-[#1A1A1A] font-semibold text-base sm:text-lg leading-snug">
                      Fill the form first — sign in only when ready to submit.
                    </p>
                    <p className="text-[#1A1A1A]/70 text-sm mt-1">
                      Your progress is saved automatically as you type.
                    </p>
                  </div>
                  <Button variant="primary" asChild className="shrink-0">
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
            <Card
              id="open-positions"
              surface="emerald"
              data-surface="emerald"
              data-emerald-band
              className="careers-card-navy mb-8 rounded-2xl scroll-mt-24 overflow-hidden"
              style={{
                background:
                  "linear-gradient(180deg, #043024 0%, #064E3B 35%, #064E3B 100%)",
              }}
            >
              <div className="h-px w-full bg-gradient-to-r from-transparent via-[#B89555]/70 to-transparent" />
              <CardHeader className="pt-9 pb-8 relative z-[1]">
                <div className="flex items-end justify-between flex-wrap gap-4">
                  <div className="min-w-0">
                    <span
                      data-careers-emerald-label
                      data-surface="emerald"
                      data-allow-dark-cta
                      data-no-contrast-guard
                      className="jj-cta-emerald jj-pill-emerald-metallic allow-white inline-flex h-7 items-center gap-1.5 rounded-full border border-[#B89555]/70 px-3 text-[10px] font-bold uppercase tracking-[0.22em] mb-2"
                      style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
                    >
                      <Briefcase className="w-3.5 h-3.5 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} /> Live Roles
                    </span>
                    <CardTitle data-careers-emerald-title data-no-contrast-guard className="allow-white text-3xl md:text-4xl font-semibold text-white tracking-tight leading-tight">
                      Open Positions
                    </CardTitle>
                    <CardDescription data-careers-emerald-subtitle data-no-contrast-guard className="allow-white text-white font-medium mt-1.5">
                      Tap <strong data-no-contrast-guard className="allow-white text-white font-semibold" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Apply</strong> on any role to auto-select it in the form below.
                    </CardDescription>
                  </div>
                  <Badge
                    data-surface="emerald"
                    data-allow-dark-cta
                    data-no-contrast-guard
                    data-open-positions-count
                    data-careers-primary-pill
                    className="jj-cta-emerald jj-pill-emerald-metallic allow-white animated-border inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 self-start sm:self-end text-[12px] font-semibold whitespace-nowrap border border-[#B89555]/70 active:translate-y-[1px] transition-all"
                    style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    <span>{filteredPositions.length} Open Positions</span>
                  </Badge>
                </div>
                <div className="relative mt-8">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#1A1A1A] z-10 pointer-events-none" strokeWidth={2.25} />
                  <Input
                    value={positionSearch}
                    onChange={(e) => setPositionSearch(e.target.value)}
                    placeholder="Search positions by title, department, or location"
                    className="careers-blue-field careers-blue-placeholder pl-12 pr-4 h-12 rounded-lg text-base"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {visiblePositions.length === 0 ? (
                  <p className="text-center text-[#1A1A1A]/70 py-6">No positions match your search.</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {visiblePositions.map((pos, idx) => {
                      const selected = formData.positionApplied === pos.id;
                      const tags: JobCardTag[] = [];
                      if (idx === 0 && pos.status !== "closed" && pos.status !== "paused") tags.push("top-opportunity");
                      if (pos.is_broker_role) tags.push("premium");
                        if ((pos.applications_count ?? 0) >= 10) tags.push("most-applied");
                        if (!pos.is_featured) tags.push("partner");
                      return (
                        <PremiumJobCard
                          key={pos.id}
                          id={pos.id}
                          title={pos.title}
                          department={pos.department}
                          location={pos.location}
                          description={pos.description}
                          employmentType={pos.employment_type}
                          isBrokerRole={pos.is_broker_role}
                          isCommissionBased={pos.is_broker_role}
                          tags={tags}
                          status={pos.status ?? "open"}
                          isFeatured={!!pos.is_featured}
                          applicationsCount={pos.applications_count ?? 0}
                          applicationCap={pos.application_cap ?? null}
                          selected={selected}
                          onApply={handleApplyPosition}
                          onSelect={(id) => setFormData((prev) => ({ ...prev, positionApplied: prev.positionApplied === id ? "" : id }))}
                        />
                      );
                    })}
                  </div>
                )}

                {filteredPositions.length > 6 && (
                  <div className="mt-6 text-center">
                    <Button
                      type="button"
                      data-surface="emerald"
                      data-allow-dark-cta
                      data-no-contrast-guard
                      onClick={() => setShowAllPositions((v) => !v)}
                      className="jj-cta-emerald jj-pill-emerald-metallic rounded-xl px-5 h-11 font-semibold border border-[#B89555]/70"
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
          <Card className="bg-[#FDFBF7] border-2 careers-blue-border shadow-[0_22px_60px_-40px_rgba(10,10,10,0.45)] overflow-hidden">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#B89555]/70 to-transparent" />
            <CardHeader className="text-center pt-10 pb-6">
              <span className="inline-flex items-center justify-center gap-1.5 mx-auto rounded-full border border-[#B89555]/60 bg-[#FDFBF7] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#0A0A0A] mb-3 w-fit">
                <Sparkles className="w-3 h-3" /> Five quick steps · ~3 min
              </span>
              <CardTitle className="text-4xl md:text-5xl font-semibold careers-navy tracking-tight">Application Form</CardTitle>
              <CardDescription className="careers-gold font-semibold text-base md:text-lg mt-1.5">
                All fields are required · Your progress saves automatically.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-7 px-1 md:px-3" data-jbj-form noValidate>
                {/* Selected role sync chip (mirrors Apply selection) */}
                <SelectedRoleChip
                  label={selectedPosition?.label || null}
                  department={selectedPosition?.department}
                  isBrokerRole={selectedPosition?.is_broker_role}
                  onClear={() => setFormData({ ...formData, positionApplied: "" })}
                />

                {/* Wizard-style progress indicator (non-destructive) */}
                <ApplicationProgress
                  steps={[
                    {
                      id: "personal",
                      label: "Personal",
                      icon: STEP_ICONS.user,
                      done:
                        !!formData.firstName.trim() &&
                        !!formData.lastName.trim() &&
                        !!formData.phone.trim(),
                    },
                    {
                      id: "location",
                      label: "Location & Language",
                      icon: STEP_ICONS.user,
                      done:
                        !!formData.nationality &&
                        !!formData.country &&
                        !!formData.city,
                    },
                    {
                      id: "role",
                      label: "Role & Experience",
                      icon: STEP_ICONS.briefcase,
                      done: !!formData.positionApplied,
                    },
                    {
                      id: "cv",
                      label: "CV / Resume",
                      icon: STEP_ICONS.file,
                      done: !!cvFile,
                    },
                    {
                      id: "consent",
                      label: "Review & Consent",
                      icon: STEP_ICONS.shield,
                      done: !!formData.consentAccurate && !!formData.consentTerms,
                    },
                  ]}
                  activeStep={currentStep}
                  onStepClick={goToStep}
                />

                {/* Wizard panel — height adapts to content */}
                <div>

                {/* Step 0 — Personal */}
                <div className={currentStep === 0 ? "space-y-7 animate-in fade-in slide-in-from-bottom-2 duration-300" : "hidden"}>

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
                    <Label htmlFor="firstName" data-required className="jbj-form-label text-sm font-semibold">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => { setFormData({ ...formData, firstName: e.target.value }); clearFieldError("firstName"); }}
                      placeholder="e.g. Sarah"
                      disabled={loading}
                      required
                      aria-required="true"
                      {...invalidProps("firstName")}
                      className="careers-blue-field h-12 rounded-lg text-base"
                    />
                    <FieldError id="firstName-err" message={fieldErr("firstName")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" data-required className="jbj-form-label text-sm font-semibold">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => { setFormData({ ...formData, lastName: e.target.value }); clearFieldError("lastName"); }}
                      placeholder="e.g. Khan"
                      disabled={loading}
                      required
                      aria-required="true"
                      {...invalidProps("lastName")}
                      className="careers-blue-field h-12 rounded-lg text-base"
                    />
                    <FieldError id="lastName-err" message={fieldErr("lastName")} />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="jbj-form-label text-sm font-semibold">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value=""
                    placeholder="you@email.com"
                    disabled
                    className="careers-blue-field h-12 rounded-lg text-base"
                  />
                  <p className="text-xs text-[#1A1A1A]/70">Email is linked to your account</p>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" data-required className="jbj-form-label text-sm font-semibold">Phone Number</Label>
                  <div aria-invalid={!!fieldErr("phone")}>
                    <PhoneInput
                      value={formData.phone}
                      onChange={(value) => { setFormData({ ...formData, phone: value || "" }); clearFieldError("phone"); }}
                      disabled={loading}
                      placeholder="Phone number"
                      variant="light"
                      className="careers-phone-input"
                    />
                  </div>
                  <FieldError id="phone-err" message={fieldErr("phone")} />
                </div>

                </div>
                {/* End of step 0 (Personal) */}

                {/* Step 1 — Location & Language */}
                <div className={currentStep === 1 ? "space-y-7 animate-in fade-in slide-in-from-bottom-2 duration-300" : "hidden"}>
                {/* Nationality + Language */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label data-required className="jbj-form-label text-sm font-semibold">Nationality</Label>
                    <SearchableSelect
                      value={formData.nationality}
                      onChange={(v) => { setFormData({ ...formData, nationality: v }); clearFieldError("nationality"); }}
                      options={NATIONALITIES}
                      placeholder="Select nationality"
                      searchPlaceholder="Search nationality..."
                      flagType="nationality"
                      disabled={loading}
                      triggerClassName={`careers-blue-field h-12 rounded-lg ${fieldErr("nationality") ? "is-invalid" : ""}`}
                    />
                    <FieldError id="nationality-err" message={fieldErr("nationality")} />
                  </div>
                  <div className="space-y-2">
                    <Label data-required className="jbj-form-label text-sm font-semibold">Preferred Language</Label>
                    <SearchableSelect
                      value={formData.preferredLanguage}
                      onChange={(v) => { setFormData({ ...formData, preferredLanguage: v }); clearFieldError("preferredLanguage"); }}
                      options={LANGUAGES}
                      placeholder="Select language"
                      searchPlaceholder="Search language..."
                      flagType="language"
                      disabled={loading}
                      triggerClassName={`careers-blue-field h-12 rounded-lg ${fieldErr("preferredLanguage") ? "is-invalid" : ""}`}
                    />
                    <FieldError id="preferredLanguage-err" message={fieldErr("preferredLanguage")} />
                  </div>
                </div>

                {/* Country + City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label data-required className="jbj-form-label text-sm font-semibold">Country</Label>
                    <SearchableSelect
                      value={formData.country}
                      onChange={(v) => { setFormData({ ...formData, country: v }); clearFieldError("country"); }}
                      options={COUNTRIES}
                      placeholder="Select country"
                      searchPlaceholder="Search country..."
                      flagType="country"
                      disabled={loading}
                      triggerClassName={`careers-blue-field h-12 rounded-lg ${fieldErr("country") ? "is-invalid" : ""}`}
                    />
                    <FieldError id="country-err" message={fieldErr("country")} />
                  </div>
                  <div className="space-y-2">
                    <Label data-required className="jbj-form-label text-sm font-semibold">City</Label>
                    <SearchableSelect
                      value={formData.city}
                      onChange={(v) => { setFormData({ ...formData, city: v }); clearFieldError("city"); }}
                      options={UAE_CITIES}
                      placeholder="Select city"
                      searchPlaceholder="Search UAE city..."
                      showFlags={false}
                      disabled={loading}
                      triggerClassName={`careers-gold-field h-12 rounded-lg ${fieldErr("city") ? "is-invalid" : ""}`}
                    />
                    <FieldError id="city-err" message={fieldErr("city")} />
                  </div>
                </div>

                </div>
                {/* End of step 1 (Location & Language) */}

                {/* Step 2 — Role & Experience */}
                <div className={currentStep === 2 ? "space-y-7 animate-in fade-in slide-in-from-bottom-2 duration-300" : "hidden"}>
                {/* Empty state — when no role picked yet and positions come from DB */}
                {!selectedPosition && openPositions.length > 0 && (
                  <div className="rounded-xl border-2 border-dashed border-[#B89555]/60 bg-[#F7F2EA]/50 px-5 py-6 text-center">
                    <p className="text-[#0A0A0A] font-semibold text-base">
                      Select a role from <span className="underline">Open Positions</span> above to load the qualification questions for that position.
                    </p>
                    <p className="text-[#1A1A1A]/70 text-sm mt-2">
                      Your application will auto-sync here and the relevant experience questions will appear in this step.
                    </p>
                  </div>
                )}
                {/* Position fallback (only when no DB positions) */}
                {openPositions.length === 0 && (
                  <div className="space-y-2">
                    <Label data-required className="jbj-form-label text-sm font-semibold">
                      Position Applied For
                    </Label>
                    <SearchableSelect
                      value={
                        FALLBACK_POSITIONS.find((p) => p.value === formData.positionApplied)?.label || ""
                      }
                      onChange={(label) => {
                        const fb = FALLBACK_POSITIONS.find((p) => p.label === label);
                        if (fb) setFormData({ ...formData, positionApplied: fb.value });
                        clearFieldError("positionApplied");
                      }}
                      options={FALLBACK_POSITIONS.map((p) => p.label)}
                      placeholder="Select a position"
                      searchPlaceholder="Search positions..."
                      showFlags={false}
                      disabled={loading}
                      triggerClassName={`careers-blue-field h-12 rounded-lg ${fieldErr("positionApplied") ? "is-invalid" : ""}`}
                    />
                    <FieldError id="positionApplied-err" message={fieldErr("positionApplied")} />
                  </div>
                )}
                {fieldErr("positionApplied") && openPositions.length > 0 && (
                  <FieldError id="positionApplied-err" message={fieldErr("positionApplied")} />
                )}

                {/* Role-aware Qualification */}
                {qualKind === "sales" && (
                  <div className="space-y-4 p-5 rounded-xl border-2 border-[#0A0A0A] bg-[#F7F2EA]/40">
                    <h3 className="text-lg font-semibold text-[#0A0A0A] flex items-center gap-2">
                      <Briefcase className="h-5 w-5" /> Sales Qualification
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <QField k="dealsClosed" label="How many deals have you closed?" placeholder="e.g. 25" />
                      <QField k="totalDealValue" label="Total value of deals closed (AED)" placeholder="e.g. 50,000,000" />
                    </div>
                    <QField k="projectsSold" label="Which projects/areas have you sold in?" placeholder="e.g. Dubai Marina, Downtown, Palm Jumeirah" />
                    <QField k="developerWorkedWith" label="Which developers have you worked with?" placeholder="e.g. DAMAC, Emaar, Meraas" />
                    <QField k="reasonForLeaving" label="Why are you leaving your current position?" placeholder="Reason for seeking new opportunity" />

                    <h3 className="text-lg font-semibold text-[#0A0A0A] mt-2 flex items-center gap-2">
                      <User className="h-5 w-5" /> Professional References (2 required)
                    </h3>
                    <p className="text-sm text-[#1A1A1A]/70">Provide references from your previous employer so we can verify your experience.</p>
                    {[1, 2].map((n) => (
                      <div key={n} className="space-y-3 p-3 rounded-lg border-2 border-[#0A0A0A] bg-[#FDFBF7]">
                        <p className="jbj-form-label text-sm font-semibold">Reference {n}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <QField k={`reference${n}Name`} label="Full name" placeholder="Full name (e.g. Director / HR Manager)" />
                          <QField k={`reference${n}Title`} label="Title & Company" placeholder="Title & Company" />
                          <QField k={`reference${n}Email`} label="Company email" placeholder="Company email" type="email" />
                          <QField k={`reference${n}Phone`} label="Phone number" placeholder="Phone number" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {qualKind === "marketing" && (
                  <div className="space-y-4 p-5 rounded-xl border-2 border-[#0A0A0A] bg-[#F7F2EA]/40">
                    <h3 className="text-lg font-semibold text-[#0A0A0A] flex items-center gap-2">
                      <Briefcase className="h-5 w-5" /> Marketing Qualification
                    </h3>
                    <QField k="marketingCampaigns" label="Notable campaigns you have led" placeholder="e.g. Off-plan launch — 5M reach, 8% CTR" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <QField k="marketingBudget" label="Largest budget managed (AED)" placeholder="e.g. 1,500,000" />
                      <QField k="marketingTools" label="Tools / platforms" placeholder="e.g. Meta Ads, GA4, HubSpot, Figma" />
                    </div>
                    <QField k="portfolioLink" label="Portfolio link" placeholder="https://your-portfolio.com" />
                  </div>
                )}

                {qualKind === "hr_ops" && (
                  <div className="space-y-4 p-5 rounded-xl border-2 border-[#0A0A0A] bg-[#F7F2EA]/40">
                    <h3 className="text-lg font-semibold text-[#0A0A0A] flex items-center gap-2">
                      <Briefcase className="h-5 w-5" /> Role Qualification
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <QField k="yearsExperience" label="Years of experience" placeholder="e.g. 5" />
                      <QField k="systemsUsed" label="Systems used" placeholder="e.g. Bayut Pro, Property Finder, Salesforce" />
                    </div>
                    <QField k="certifications" label="Certifications" placeholder="e.g. RERA, CIPD, PMP" />
                  </div>
                )}

                {qualKind === "tech" && (
                  <div className="space-y-4 p-5 rounded-xl border-2 border-[#0A0A0A] bg-[#F7F2EA]/40">
                    <h3 className="text-lg font-semibold text-[#0A0A0A] flex items-center gap-2">
                      <Briefcase className="h-5 w-5" /> Technical Qualification
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <QField k="yearsExperience" label="Years of experience" placeholder="e.g. 7" />
                      <QField k="techStack" label="Stack / specialties" placeholder="e.g. React, TypeScript, Supabase, AWS" />
                    </div>
                    <QField k="githubLink" label="GitHub / portfolio link" placeholder="https://github.com/your-handle" />
                  </div>
                )}

                {qualKind === "general" && selectedPosition && (
                  <div className="space-y-4 p-5 rounded-xl border-2 border-[#0A0A0A] bg-[#F7F2EA]/40">
                    <h3 className="text-lg font-semibold text-[#0A0A0A] flex items-center gap-2">
                      <Briefcase className="h-5 w-5" /> About You
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <QField k="yearsExperience" label="Years of experience" placeholder="e.g. 3" />
                      <QField k="portfolioLink" label="Portfolio / LinkedIn link" placeholder="https://linkedin.com/in/your-handle" />
                    </div>
                    <QField k="aboutYou" label="Tell us briefly about yourself" placeholder="What makes you a strong fit for this role?" />
                  </div>
                )}

                </div>
                {/* End of step 2 (Role & Experience) */}

                {/* Step 3 — CV / Resume */}
                <div className={currentStep === 3 ? "space-y-7 animate-in fade-in slide-in-from-bottom-2 duration-300" : "hidden"}>
                {/* CV / Resume — Premium upload */}
                <PremiumCVUpload
                  file={cvFile}
                  onFileChange={(f) => { setCvFile(f); clearFieldError("cvFile"); }}
                  disabled={loading}
                  uploadProgress={uploadProgress}
                />
                <FieldError id="cvFile-err" message={fieldErr("cvFile")} />

                </div>
                {/* End of step 3 (CV) */}

                {/* Step 4 — Review & Consent */}
                <div className={currentStep === 4 ? "space-y-7 animate-in fade-in slide-in-from-bottom-2 duration-300" : "hidden"}>
                {/* Consent */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="consentAccurate"
                      checked={formData.consentAccurate}
                      onCheckedChange={(checked) => { setFormData({ ...formData, consentAccurate: checked as boolean }); clearFieldError("consentAccurate"); }}
                      disabled={loading}
                      aria-required="true"
                      aria-invalid={!!fieldErr("consentAccurate")}
                    />
                    <Label htmlFor="consentAccurate" data-required className="text-sm leading-relaxed cursor-pointer text-[#1A1A1A]">
                      I confirm that the information provided is accurate and complete to the best of my knowledge.
                    </Label>
                  </div>
                  <FieldError id="consentAccurate-err" message={fieldErr("consentAccurate")} />
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="consentTerms"
                      checked={formData.consentTerms}
                      onCheckedChange={(checked) => { setFormData({ ...formData, consentTerms: checked as boolean }); clearFieldError("consentTerms"); }}
                      disabled={loading}
                      aria-required="true"
                      aria-invalid={!!fieldErr("consentTerms")}
                    />
                    <Label htmlFor="consentTerms" data-required className="text-sm leading-relaxed cursor-pointer text-[#1A1A1A]">
                      I agree to the{" "}
                      <Link to="/terms" className="text-[#1A1A1A] underline font-medium" target="_blank">Terms of Service</Link>
                      {" "}and{" "}
                      <Link to="/privacy" className="text-[#1A1A1A] underline font-medium" target="_blank">Privacy Policy</Link>.
                    </Label>
                  </div>
                  <FieldError id="consentTerms-err" message={fieldErr("consentTerms")} />
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

                </div>
                {/* End of step 4 wrapper */}

                </div>
                {/* End of stable-height wizard panel */}

                {/* Wizard navigation */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 0 || loading}
                    className="sm:w-40 h-12 rounded-xl border-2 border-[#BFA46A] bg-[#F7F2EA] text-[#071B33] font-semibold disabled:border-[#D5C3A0] disabled:bg-[#F3EBDD] disabled:text-[#7A7469] disabled:opacity-100"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                  </Button>

                  <p
                    className="rounded-full border border-[#BFA46A] bg-[linear-gradient(180deg,#FBF6EE_0%,#F2E8D8_100%)] px-4 py-2 text-xs font-semibold text-[#1A1A1A] text-center order-first sm:order-none shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_10px_20px_-18px_rgba(7,27,51,0.35)]"
                    translate="no"
                    data-no-translate="true"
                  >
                    <span translate="no">Step {currentStep + 1} of {TOTAL_STEPS}</span>
                    <span className="text-[#1A1A1A]/60"> — </span>
                    <span translate="no" data-no-translate="true">{STEP_LABELS[currentStep]}</span>
                  </p>

                  {currentStep < TOTAL_STEPS - 1 ? (
                    <Button
                      type="button"
                      variant="dark"
                      onClick={handleNext}
                      disabled={loading}
                      data-allow-dark-cta
                      data-no-contrast-guard
                      className="jj-cta-dark careers-navy-cta allow-white sm:w-48 h-12 rounded-xl font-semibold !text-white"
                      style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
                    >
                      <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Continue</span>
                      <ArrowRight className="w-4 h-4 ml-1.5 allow-white" style={{ color: "#FFFFFF" }} />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      variant="dark"
                      disabled={loading}
                      data-allow-dark-cta
                      data-no-contrast-guard
                      className="jj-cta-dark careers-navy-cta allow-white sm:flex-1 h-14 rounded-xl font-bold text-base sm:text-lg !text-white"
                      style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                          <span style={{ color: "#FFFFFF" }}>Submitting...</span>
                        </>
                      ) : user ? (
                        <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Submit Application</span>
                      ) : (
                        <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Continue & Sign In to Submit</span>
                      )}
                    </Button>
                  )}
                </div>

                {/* Mobile sticky CTA (Phase 10) — duplicates the primary action of the current step */}
                <div data-careers-mobile-cta className="sm:hidden">
                  <div className="flex items-center gap-2">
                    {currentStep > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        disabled={loading}
                        aria-label="Previous step"
                        className="h-[52px] !w-[52px] rounded-2xl border-2 border-[#0A0A0A] bg-[#FDFBF7] text-[#0A0A0A] p-0"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                    )}
                    {currentStep < TOTAL_STEPS - 1 ? (
                      <Button
                        type="button"
                        variant="dark"
                        onClick={handleNext}
                        disabled={loading}
                        data-allow-dark-cta
                        data-no-contrast-guard
                        className="jj-cta-dark careers-navy-cta flex-1 font-semibold"
                      >
                        Continue · Step {currentStep + 2}
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        variant="dark"
                        disabled={loading}
                        data-allow-dark-cta
                        data-no-contrast-guard
                        className="jj-cta-dark careers-navy-cta flex-1 font-bold"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <span>{user ? "Submit Application" : "Sign In to Submit"}</span>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <CareersContactBlock />

        </div>
      </section>

      <CareersWhyJBJ />
      <CareersEcosystem />
      <CareersFAQ />
    </div>
  );
}
