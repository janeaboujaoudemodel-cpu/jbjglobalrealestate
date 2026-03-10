import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle, FileText, Bot, MessageCircle, Briefcase, User } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";

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
  "Ukrainian", "Uruguayan", "Uzbek", "Venezuelan", "Vietnamese", "Yemeni", "Zambian", "Zimbabwean"
];

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "ur", name: "Urdu" },
  { code: "zh", name: "Chinese" },
  { code: "ru", name: "Russian" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "es", name: "Spanish" },
  { code: "pt", name: "Portuguese" },
  { code: "fa", name: "Farsi" },
  { code: "tr", name: "Turkish" },
];

const JOB_POSITIONS = [
  { value: "property_consultant", label: "Property Consultant / Real Estate Broker" },
  { value: "senior_property_consultant", label: "Senior Property Consultant" },
  { value: "team_leader", label: "Team Leader – Sales" },
  { value: "sales_manager", label: "Sales Manager" },
  { value: "sales_director", label: "Sales Director" },
  { value: "listing_agent", label: "Listing Agent" },
  { value: "off_plan_specialist", label: "Off-Plan Sales Specialist" },
  { value: "secondary_market_agent", label: "Secondary Market Agent" },
  { value: "luxury_specialist", label: "Luxury Property Specialist" },
  { value: "commercial_broker", label: "Commercial Real Estate Broker" },
  { value: "leasing_consultant", label: "Leasing Consultant" },
  { value: "marketing_manager", label: "Marketing Manager" },
  { value: "digital_marketing_specialist", label: "Digital Marketing Specialist" },
  { value: "social_media_manager", label: "Social Media Manager" },
  { value: "content_creator", label: "Content Creator" },
  { value: "seo_specialist", label: "SEO Specialist" },
  { value: "graphic_designer", label: "Graphic Designer" },
  { value: "photographer", label: "Photographer" },
  { value: "videographer", label: "Videographer" },
  { value: "video_editor", label: "Video Editor" },
  { value: "crm_administrator", label: "CRM Administrator" },
  { value: "business_development_manager", label: "Business Development Manager" },
  { value: "client_relations_manager", label: "Client Relations Manager" },
  { value: "hr_coordinator", label: "HR Coordinator" },
  { value: "recruitment_specialist", label: "Recruitment Specialist" },
  { value: "finance_accountant", label: "Finance & Accounting" },
  { value: "office_administrator", label: "Office Administrator" },
  { value: "executive_assistant", label: "Executive Assistant / PA" },
  { value: "receptionist", label: "Receptionist / Front Desk" },
  { value: "it_support", label: "IT Support Specialist" },
  { value: "web_developer", label: "Web Developer" },
  { value: "mobile_developer", label: "Mobile App Developer" },
  { value: "data_analyst", label: "Data Analyst" },
  { value: "legal_advisor", label: "Legal Advisor / Compliance" },
  { value: "property_management", label: "Property Management" },
  { value: "customer_service", label: "Customer Service Representative" },
  { value: "internship", label: "Internship / Trainee" },
  { value: "other", label: "Other – General Application" },
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
  "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

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
    preferredLanguage: "en",
    country: "",
    city: "",
    positionApplied: "",
    consentAccurate: false,
    consentTerms: false,
    // Position-based qualification fields
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
  });

  // Honeypot field for anti-spam
  const [honeypot, setHoneypot] = useState("");

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
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/cv-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from("hr-documents")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Upload error:", error);
      throw new Error("Failed to upload CV");
    }

    return data.path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Anti-spam: check honeypot
    if (honeypot) {
      toast.error("Submission blocked");
      return;
    }

    if (!user) {
      toast.error("Please sign in to submit your application");
      navigate("/auth?redirect=/join");
      return;
    }

    if (!formData.consentAccurate || !formData.consentTerms) {
      toast.error("Please accept both consent checkboxes");
      return;
    }

    if (!formData.positionApplied) {
      toast.error("Please select a position to apply for");
      return;
    }

    if (!cvFile) {
      toast.error("Please upload your CV");
      return;
    }

    setLoading(true);
    try {
      // Upload CV first
      setUploadProgress(30);
      const cvPath = await uploadCV(cvFile);
      setUploadProgress(60);

      const positionLabel = JOB_POSITIONS.find(p => p.value === formData.positionApplied)?.label || formData.positionApplied;

      // Create application
      const { error: appError } = await supabase
        .from("hr_applications")
        .insert({
          user_id: user.id,
          full_name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: user.email!,
          phone_e164: formData.phone,
          nationality: formData.nationality,
          preferred_language: formData.preferredLanguage,
          current_location_country: formData.country,
          current_location_city: formData.city,
          cv_url: cvPath,
          position_applied: positionLabel,
          consent_accurate: formData.consentAccurate,
          consent_terms: formData.consentTerms,
          status: "pending",
        });

      if (appError) throw appError;

      // Send CV confirmation email + create notifications
      await Promise.allSettled([
        supabase.functions.invoke('send-cv-status-email', {
          body: {
            email: user.email!,
            fullName: `${formData.firstName} ${formData.lastName}`.trim(),
            status: 'submitted',
            position: positionLabel,
            userId: user.id,
          },
        }),
        supabase.from('admin_tasks').insert({
          user_id: user.id,
          title: 'CV under review',
          description: `Your CV for ${positionLabel} is currently under review by the HR team.`,
          category: 'cv_application',
          status: 'pending',
          priority: 'medium',
        }),
      ]);

      // Create HR user role as candidate
      const { error: roleError } = await supabase
        .from("hr_user_roles")
        .insert({
          user_id: user.id,
          role: "broker_candidate",
          is_active: true,
        });

      if (roleError && !roleError.message.includes("duplicate")) {
        console.error("Role error:", roleError);
      }

      setUploadProgress(100);
      toast.success("Application submitted successfully!");
      navigate("/onboarding");
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload a PDF or Word document");
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setCvFile(file);
    }
  };

  if (checkingExisting) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  // If user already has an application, redirect to onboarding
  // Redirect returning users directly to onboarding dashboard
  if (existingApplication) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* Full-screen champagne section */}
        <section className="jj-section-champagne flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-2xl mx-auto">
            <Card className="jj-box-active p-8 md:p-12">
              <CardHeader className="text-center pb-6">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-2 border-emerald-500/40 flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-emerald-600" />
                </div>
                <CardTitle className="text-3xl md:text-4xl text-black mb-4">Welcome Back!</CardTitle>
                <CardDescription className="text-lg text-black/70">
                  Your application status: <span className="font-semibold text-gold capitalize">{existingApplication.status}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                {existingApplication.status === 'approved' ? (
                  <>
                    <p className="text-black/60 text-lg leading-relaxed">
                      Congratulations! Your application has been approved. Our HR team will assign your training program and onboarding materials shortly. You'll receive a notification when your training is ready.
                    </p>
                    <div className="pt-4">
                      <Button variant="primary" size="lg" asChild className="px-8 py-6 text-lg">
                        <Link to="/onboarding">
                          <span className="text-black">Go to</span>
                          <span className="text-gold ml-1">Onboarding Dashboard</span>
                        </Link>
                      </Button>
                    </div>
                  </>
                ) : existingApplication.status === 'pending' ? (
                  <>
                    <p className="text-black/60 text-lg leading-relaxed">
                      Your application is currently under review. Our HR team will get back to you within 2-3 business days. In the meantime, feel free to explore our resources.
                    </p>
                    <div className="pt-4">
                      <Button variant="secondary" size="lg" asChild className="px-8 py-6 text-lg">
                        <Link to="/">
                          <span>Explore JBJ Global</span>
                        </Link>
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-black/60 text-lg leading-relaxed">
                      Continue your journey with JBJ Global Real Estate. Access your onboarding dashboard to track progress and unlock broker tools.
                    </p>
                    <div className="pt-4">
                      <Button variant="primary" size="lg" asChild className="px-8 py-6 text-lg">
                        <Link to="/onboarding">
                          <span className="text-black">Continue to</span>
                          <span className="text-gold ml-1">Onboarding Dashboard</span>
                        </Link>
                      </Button>
                    </div>
                  </>
                )}
                <div className="pt-2">
                  <Link to="/hr-agent" className="text-gold hover:underline text-sm">
                    Need help? Chat with Jessica, our HR Assistant
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Full-width champagne section */}
      <section className="jj-section-champagne py-16 px-4 pt-20 lg:pt-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">
              <span className="text-gold">Join</span> JBJ Global Real Estate
            </h1>
            <p className="text-black/70">
              Apply to become a broker partner. Complete the form below to start your journey.
            </p>
          </div>

          {/* HR Agent CTA - Meet Jessica */}
          <Card className="jj-box-active mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                  <Bot className="w-8 h-8 text-gold" />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h3 className="text-lg font-semibold text-black mb-1">Prefer a Conversation?</h3>
                  <p className="text-sm text-black/70">
                    Meet Jessica — available 24/7 to support you. She'll collect your CV, qualify you, and conduct your interview.
                  </p>
                </div>
                <Button variant="primary" asChild>
                  <Link to="/hr-agent">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    <span className="text-black">Contact</span><span className="text-gold"> Our HR · Jessica</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {!user && (
            <Card className="border-2 border-gold bg-gold/10 backdrop-blur-sm rounded-2xl shadow-md mb-6">
              <CardContent className="pt-6">
                <p className="text-center text-black font-semibold mb-2 text-lg">
                  📝 Fill the form below — then sign in to submit!
                </p>
                <p className="text-center text-black/70 mb-4 text-sm">
                  You can complete the entire form first. Sign in or create an account when you're ready to submit.
                </p>
                <div className="flex justify-center">
                  <Button variant="primary" asChild>
                    <Link to="/auth?redirect=/join">
                      <span className="text-black">Sign In /</span><span className="text-gold"> Create Account</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="jj-box-active">
          <CardHeader>
            <CardTitle>Application Form</CardTitle>
            <CardDescription>All fields are required</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Honeypot field - hidden from real users */}
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

              {/* Name fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    disabled={loading}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    disabled={loading}
                    className="bg-background"
                  />
                </div>
              </div>

              {/* Email (from auth) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email is linked to your account</p>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <PhoneInput
                  value={formData.phone}
                   onChange={(value) => setFormData({ ...formData, phone: value || "" })}
                  disabled={loading}
                  placeholder="+971 56 591 1000"
                />
              </div>

              {/* Nationality */}
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Select
                  value={formData.nationality}
                  onValueChange={(value) => setFormData({ ...formData, nationality: value })}
                  disabled={loading}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    {NATIONALITIES.map((nat) => (
                      <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preferred Language */}
              <div className="space-y-2">
                <Label htmlFor="language">Preferred Language</Label>
                <Select
                  value={formData.preferredLanguage}
                  onValueChange={(value) => setFormData({ ...formData, preferredLanguage: value })}
                  disabled={loading}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Position Applied For */}
              <div className="space-y-2">
                <Label htmlFor="position">Position Applied For <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.positionApplied}
                  onValueChange={(value) => setFormData({ ...formData, positionApplied: value })}
                  disabled={loading}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select the position you're applying for" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_POSITIONS.map((pos) => (
                      <SelectItem key={pos.value} value={pos.value}>{pos.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => setFormData({ ...formData, country: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                    disabled={loading}
                    className="bg-background"
                  />
                </div>
              </div>

              {/* Position-Based Qualification Questions */}
              {['property_consultant', 'senior_property_consultant', 'team_leader', 'sales_manager', 'sales_director', 'listing_agent', 'off_plan_specialist', 'secondary_market_agent', 'luxury_specialist', 'commercial_broker', 'leasing_consultant'].includes(formData.positionApplied) && (
                <div className="space-y-4 p-4 rounded-xl border border-gold/30 bg-gold/5">
                  <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-gold" />
                    Sales Qualification
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>How many deals have you closed?</Label>
                      <Input value={formData.dealsClosed} onChange={(e) => setFormData({ ...formData, dealsClosed: e.target.value })} placeholder="e.g. 25" disabled={loading} className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label>Total value of deals closed (AED)</Label>
                      <Input value={formData.totalDealValue} onChange={(e) => setFormData({ ...formData, totalDealValue: e.target.value })} placeholder="e.g. 50,000,000" disabled={loading} className="bg-background" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Which projects/areas have you sold in?</Label>
                    <Input value={formData.projectsSold} onChange={(e) => setFormData({ ...formData, projectsSold: e.target.value })} placeholder="e.g. Dubai Marina, Downtown, Palm Jumeirah" disabled={loading} className="bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label>Which developers have you worked with?</Label>
                    <Input value={formData.developerWorkedWith} onChange={(e) => setFormData({ ...formData, developerWorkedWith: e.target.value })} placeholder="e.g. DAMAC, Emaar, Meraas" disabled={loading} className="bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label>Why are you leaving your current position?</Label>
                    <Input value={formData.reasonForLeaving} onChange={(e) => setFormData({ ...formData, reasonForLeaving: e.target.value })} placeholder="Reason for seeking new opportunity" disabled={loading} className="bg-background" />
                  </div>

                  <h3 className="text-lg font-semibold text-black mt-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-gold" />
                    Professional References (2 required)
                  </h3>
                  <p className="text-sm text-black/60">Provide references from your previous employer so we can verify your experience.</p>
                  <div className="space-y-3 p-3 rounded-lg border border-gold/20 bg-white">
                    <p className="text-sm font-semibold text-black">Reference 1</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Input value={formData.reference1Name} onChange={(e) => setFormData({ ...formData, reference1Name: e.target.value })} placeholder="Full name (e.g. Director / HR Manager)" disabled={loading} className="bg-background" />
                      <Input value={formData.reference1Title} onChange={(e) => setFormData({ ...formData, reference1Title: e.target.value })} placeholder="Title & Company" disabled={loading} className="bg-background" />
                      <Input type="email" value={formData.reference1Email} onChange={(e) => setFormData({ ...formData, reference1Email: e.target.value })} placeholder="Company email" disabled={loading} className="bg-background" />
                      <Input value={formData.reference1Phone} onChange={(e) => setFormData({ ...formData, reference1Phone: e.target.value })} placeholder="Phone number" disabled={loading} className="bg-background" />
                    </div>
                  </div>
                  <div className="space-y-3 p-3 rounded-lg border border-gold/20 bg-white">
                    <p className="text-sm font-semibold text-black">Reference 2</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Input value={formData.reference2Name} onChange={(e) => setFormData({ ...formData, reference2Name: e.target.value })} placeholder="Full name (e.g. Director / HR Manager)" disabled={loading} className="bg-background" />
                      <Input value={formData.reference2Title} onChange={(e) => setFormData({ ...formData, reference2Title: e.target.value })} placeholder="Title & Company" disabled={loading} className="bg-background" />
                      <Input type="email" value={formData.reference2Email} onChange={(e) => setFormData({ ...formData, reference2Email: e.target.value })} placeholder="Company email" disabled={loading} className="bg-background" />
                      <Input value={formData.reference2Phone} onChange={(e) => setFormData({ ...formData, reference2Phone: e.target.value })} placeholder="Phone number" disabled={loading} className="bg-background" />
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>CV / Resume</Label>
                <div className="border-2 border-dashed border-gold/40 rounded-xl p-6 text-center hover:border-gold/60 transition-colors cursor-pointer">
                  {cvFile ? (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <FileText className="h-5 w-5" />
                      <span className="font-medium">{cvFile.name}</span>
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
                        <Upload className="h-8 w-8 text-gold/60" />
                        <span className="text-sm text-black/70">
                          Click to upload CV (PDF or Word, max 10MB)
                        </span>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={loading}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Consent checkboxes */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="consentAccurate"
                    checked={formData.consentAccurate}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, consentAccurate: checked as boolean })
                    }
                    disabled={loading}
                  />
                  <Label htmlFor="consentAccurate" className="text-sm leading-relaxed cursor-pointer">
                    I confirm that the information provided is accurate and complete to the best of my knowledge.
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="consentTerms"
                    checked={formData.consentTerms}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, consentTerms: checked as boolean })
                    }
                    disabled={loading}
                  />
                  <Label htmlFor="consentTerms" className="text-sm leading-relaxed cursor-pointer">
                    I agree to the{" "}
                    <Link to="/terms" className="text-gold hover:underline" target="_blank">Terms of Service</Link>
                    {" "}and{" "}
                    <Link to="/privacy" className="text-gold hover:underline" target="_blank">Privacy Policy</Link>.
                  </Label>
                </div>
              </div>

              {/* Progress bar during upload */}
              {uploadProgress > 0 && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-gold h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              {!user ? (
                <Button
                  type="button"
                  className="w-full bg-gold hover:bg-gold/90 text-black font-bold h-12 text-base"
                  onClick={() => navigate("/auth?redirect=/join")}
                >
                  Sign In to Submit Application
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="w-full bg-gold hover:bg-gold/90 text-black font-bold h-12 text-base"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

          <p className="text-center text-sm text-black/70 mt-6">
            Questions? Contact us at{" "}
            <a href="mailto:contact@JBJ.ae" className="text-gold hover:underline">
              contact@JBJ.ae
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
