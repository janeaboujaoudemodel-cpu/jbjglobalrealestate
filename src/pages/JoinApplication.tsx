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
import { Loader2, Upload, CheckCircle, FileText, Bot, MessageCircle } from "lucide-react";
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
    consentAccurate: false,
    consentTerms: false,
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
          consent_accurate: formData.consentAccurate,
          consent_terms: formData.consentTerms,
          status: "pending",
        });

      if (appError) throw appError;

      await Promise.allSettled([
        supabase.from('user_notifications').insert({
          user_id: user.id,
          type: 'cv_application',
          title: 'CV received - Under review',
          message: 'Your CV application has been submitted successfully. JBJ Global Real Estate HR team is reviewing your profile.',
          is_read: false,
          metadata: { status: 'under_review' },
        }),
        supabase.from('admin_tasks').insert({
          user_id: user.id,
          title: 'CV under review',
          description: 'Your CV is currently under review by the HR team.',
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
                <p className="text-black/60 text-lg leading-relaxed">
                  Continue your journey with JBJ Global Real Estate. Access your onboarding dashboard to track progress, complete training modules, and unlock broker tools.
                </p>
                <div className="pt-4">
                  <Button variant="primary" size="lg" asChild className="px-8 py-6 text-lg">
                    <Link to="/onboarding">
                      <span className="text-black">Continue to</span>
                      <span className="text-gold ml-1">Onboarding Dashboard</span>
                    </Link>
                  </Button>
                </div>
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
      <section className="jj-section-champagne py-16 px-4">
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
            <Card className="jj-box-active mb-6">
              <CardContent className="pt-6">
                <p className="text-center text-black/70 mb-4">
                  You need to sign in or create an account to submit your application.
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
                    disabled={!user || loading}
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
                    disabled={!user || loading}
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
                  disabled={!user || loading}
                  placeholder="+971 56 591 1000"
                />
              </div>

              {/* Nationality */}
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Select
                  value={formData.nationality}
                  onValueChange={(value) => setFormData({ ...formData, nationality: value })}
                  disabled={!user || loading}
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
                  disabled={!user || loading}
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

              {/* Current Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => setFormData({ ...formData, country: value })}
                    disabled={!user || loading}
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
                    disabled={!user || loading}
                    className="bg-background"
                  />
                </div>
              </div>

              {/* CV Upload */}
              <div className="space-y-2">
                <Label>CV / Resume</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  {cvFile ? (
                    <div className="flex items-center justify-center gap-2 text-green-500">
                      <FileText className="h-5 w-5" />
                      <span>{cvFile.name}</span>
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
                    <label className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Click to upload CV (PDF or Word, max 10MB)
                        </span>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={!user || loading}
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
                    disabled={!user || loading}
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
                    disabled={!user || loading}
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

              <Button
                type="submit"
                className="w-full bg-gold hover:bg-gold/90 text-black"
                disabled={!user || loading}
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
