import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Award, Briefcase, Users, BadgeCheck, Building2 } from "lucide-react";
import { FormDraftBar } from "@/components/shared/FormDraftBar";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLeadCapture } from "@/hooks/useLeadCapture";
import { toast } from "sonner";

const DRAFT_KEY = "jbj_broker_join_draft";

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const emptyForm = {
  fullName: "",
  phone: "",
  email: "",
  companyName: "",
  reraNumber: "",
  brnNumber: "",
  nationality: "",
  experienceYears: "",
  specialization: "",
  preferredAreas: "",
  currentBrokerage: "",
  teamSize: "",
  monthlyDeals: "",
  languages: "",
  notes: "",
  consentToPrivacy: false,
};

const JoinBrokerList = () => {
  const navigate = useNavigate();
  const { captureLead } = useLeadCapture();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) return { ...emptyForm, ...JSON.parse(saved) };
    } catch {}
    return emptyForm;
  };

  const [formData, setFormData] = useState(loadDraft);

  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
      toast.success("Draft saved successfully");
    } catch { toast.error("Failed to save draft"); }
  }, [formData]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setFormData(emptyForm);
    toast.info("Form cleared");
  }, []);

  const hasDraft = (() => {
    try { return !!localStorage.getItem(DRAFT_KEY); } catch { return false; }
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consentToPrivacy) { toast.error("Please accept the privacy policy to continue"); return; }
    if (!formData.fullName || !formData.phone || !formData.reraNumber) { toast.error("Please fill in all required fields"); return; }
    setIsSubmitting(true);
    try {
      const success = await captureLead(
        { email: formData.email || undefined, fullName: formData.fullName, phone: formData.phone, nationality: formData.nationality || undefined },
        "brokers-join"
      );
      if (success) { localStorage.removeItem(DRAFT_KEY); navigate("/thank-you?type=broker"); }
      else toast.error("Something went wrong. Please try again.");
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setIsSubmitting(false); }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev: typeof emptyForm) => ({ ...prev, [field]: value }));
  };

  const benefits = [
    { icon: Briefcase, label: "Professional Toolkit", desc: "CRM, lead management, and marketing tools at your fingertips" },
    { icon: Award, label: "Certification Program", desc: "JBJ Academy certification with verified broker badge" },
    { icon: Building2, label: "Exclusive Listings", desc: "Access off-market and pre-launch inventory" },
    { icon: Users, label: "Partner Network", desc: "Connect with developers, investors, and co-brokers" },
  ];

  return (
    <>
      <SEOHead
        title="Join Broker Network | JBJ Global Real Estate"
        description="Apply to join JBJ's verified broker network. Access professional tools, exclusive listings, and certification programs."
        keywords="dubai broker network, real estate broker dubai, RERA broker registration, broker partnership"
        canonicalPath="/brokers/join"
      />

      <main className="min-h-screen bg-gradient-to-br from-[#F0F4FA] via-[#E8EEF8] to-[#D6E0F0]">
        {/* Hero Header */}
        <section className="pt-28 pb-8 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 bg-blue-600/15 border border-blue-500/40 px-4 py-1.5 text-blue-700 text-sm font-semibold mb-5 tracking-wide uppercase">
                <BadgeCheck className="w-4 h-4" />
                Verified Broker Access
              </motion.div>
              <motion.h1
                variants={fadeInUp}
                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 uppercase tracking-wider"
                style={{
                  fontFamily: "Poppins, sans-serif",
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #1e3a5f 30%, #2563eb 50%, #1e3a5f 70%, #1a1a1a 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Join Our Broker Network
              </motion.h1>
              <motion.p variants={fadeInUp} className="text-muted-foreground max-w-2xl mx-auto text-base">
                Apply to become a verified JBJ broker partner. Access professional tools, exclusive listings, and our certification program.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Benefits Strip */}
        <section className="pb-6 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {benefits.map((b) => (
                <div key={b.label} className="flex items-start gap-3 p-4 bg-white/60 border border-blue-200/50">
                  <div className="w-9 h-9 bg-blue-600/15 flex items-center justify-center flex-shrink-0">
                    <b.icon className="w-4.5 h-4.5 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-tight">{b.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section className="pb-10 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>

              {/* Draft Action Bar */}
              <motion.div variants={fadeInUp}>
                <FormDraftBar
                  hasDraft={hasDraft}
                  onSaveDraft={saveDraft}
                  onReset={clearDraft}
                  onNew={clearDraft}
                  label="Broker Application"
                  theme="blue"
                />
              </motion.div>

              {/* Form Card */}
              <motion.form variants={fadeInUp} onSubmit={handleSubmit} className="bg-white/50 border-2 border-blue-300/30 p-6 md:p-8 space-y-6">
                {/* Section 1: Contact Details */}
                <div className="space-y-1 mb-4">
                  <h3 className="text-lg font-bold text-foreground tracking-wide uppercase flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-600/20 flex items-center justify-center text-blue-700 text-xs font-bold">1</span>
                    Contact Details
                  </h3>
                  <p className="text-xs text-muted-foreground pl-8">Your primary contact information</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName" className="text-foreground font-medium">Full Name *</Label>
                    <Input id="fullName" value={formData.fullName} onChange={(e) => handleChange("fullName", e.target.value)} placeholder="Your full name" required />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-foreground font-medium">Mobile Number (WhatsApp) *</Label>
                    <Input id="phone" type="tel" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="+971 50 123 4567" required />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="your@email.com" />
                  </div>
                  <div>
                    <Label htmlFor="nationality" className="text-foreground font-medium">Nationality</Label>
                    <Input id="nationality" value={formData.nationality} onChange={(e) => handleChange("nationality", e.target.value)} placeholder="e.g., British, Indian" />
                  </div>
                </div>

                <div className="h-px bg-blue-200/40" />

                {/* Section 2: Broker Credentials */}
                <div className="space-y-1 mb-4">
                  <h3 className="text-lg font-bold text-foreground tracking-wide uppercase flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-600/20 flex items-center justify-center text-blue-700 text-xs font-bold">2</span>
                    Broker Credentials
                  </h3>
                  <p className="text-xs text-muted-foreground pl-8">Your professional registration details</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName" className="text-foreground font-medium">Company / Brokerage Name</Label>
                    <Input id="companyName" value={formData.companyName} onChange={(e) => handleChange("companyName", e.target.value)} placeholder="Your brokerage name" />
                  </div>
                  <div>
                    <Label htmlFor="reraNumber" className="text-foreground font-medium">RERA BRN Number *</Label>
                    <Input id="reraNumber" value={formData.reraNumber} onChange={(e) => handleChange("reraNumber", e.target.value)} placeholder="e.g., BRN 12345" required />
                  </div>
                  <div>
                    <Label htmlFor="brnNumber" className="text-foreground font-medium">Personal BRN / Permit Number</Label>
                    <Input id="brnNumber" value={formData.brnNumber} onChange={(e) => handleChange("brnNumber", e.target.value)} placeholder="e.g., 67890" />
                  </div>
                  <div>
                    <Label htmlFor="experienceYears" className="text-foreground font-medium">Years of Experience</Label>
                    <Select value={formData.experienceYears} onValueChange={(v) => handleChange("experienceYears", v)}>
                      <SelectTrigger><SelectValue placeholder="Select experience" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-1">Less than 1 year</SelectItem>
                        <SelectItem value="1-3">1–3 years</SelectItem>
                        <SelectItem value="3-5">3–5 years</SelectItem>
                        <SelectItem value="5-10">5–10 years</SelectItem>
                        <SelectItem value="10+">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="h-px bg-blue-200/40" />

                {/* Section 3: Professional Profile */}
                <div className="space-y-1 mb-4">
                  <h3 className="text-lg font-bold text-foreground tracking-wide uppercase flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-600/20 flex items-center justify-center text-blue-700 text-xs font-bold">3</span>
                    Professional Profile
                  </h3>
                  <p className="text-xs text-muted-foreground pl-8">Tell us about your brokerage focus</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="specialization" className="text-foreground font-medium">Specialization</Label>
                    <Select value={formData.specialization} onValueChange={(v) => handleChange("specialization", v)}>
                      <SelectTrigger><SelectValue placeholder="Select specialization" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="off-plan">Off-Plan</SelectItem>
                        <SelectItem value="secondary">Secondary Market</SelectItem>
                        <SelectItem value="luxury">Luxury Properties</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="rentals">Rentals</SelectItem>
                        <SelectItem value="mixed">Mixed Portfolio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="preferredAreas" className="text-foreground font-medium">Primary Areas</Label>
                    <Input id="preferredAreas" value={formData.preferredAreas} onChange={(e) => handleChange("preferredAreas", e.target.value)} placeholder="e.g., Downtown, Marina, JVC" />
                  </div>
                  <div>
                    <Label htmlFor="currentBrokerage" className="text-foreground font-medium">Current Brokerage</Label>
                    <Input id="currentBrokerage" value={formData.currentBrokerage} onChange={(e) => handleChange("currentBrokerage", e.target.value)} placeholder="Your current company" />
                  </div>
                  <div>
                    <Label htmlFor="teamSize" className="text-foreground font-medium">Team Size</Label>
                    <Select value={formData.teamSize} onValueChange={(v) => handleChange("teamSize", v)}>
                      <SelectTrigger><SelectValue placeholder="Select team size" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solo">Solo Agent</SelectItem>
                        <SelectItem value="2-5">2–5 agents</SelectItem>
                        <SelectItem value="6-15">6–15 agents</SelectItem>
                        <SelectItem value="15+">15+ agents</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="monthlyDeals" className="text-foreground font-medium">Average Monthly Deals</Label>
                    <Select value={formData.monthlyDeals} onValueChange={(v) => handleChange("monthlyDeals", v)}>
                      <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-2">0–2 deals</SelectItem>
                        <SelectItem value="3-5">3–5 deals</SelectItem>
                        <SelectItem value="6-10">6–10 deals</SelectItem>
                        <SelectItem value="10+">10+ deals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="languages" className="text-foreground font-medium">Languages Spoken</Label>
                    <Input id="languages" value={formData.languages} onChange={(e) => handleChange("languages", e.target.value)} placeholder="e.g., English, Arabic, Hindi" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-foreground font-medium">Additional Notes (Optional)</Label>
                  <Textarea id="notes" value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} placeholder="Tell us why you'd like to join JBJ's broker network..." rows={3} />
                </div>

                <div className="h-px bg-blue-200/40" />

                {/* Consent */}
                <div className="flex items-start gap-3">
                  <Checkbox id="consent" checked={formData.consentToPrivacy} onCheckedChange={(checked) => handleChange("consentToPrivacy", checked as boolean)} />
                  <Label htmlFor="consent" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                    I agree to the <a href="/privacy" className="text-blue-600 hover:underline font-medium">Privacy Policy</a> and consent to being contacted regarding broker partnership opportunities.
                  </Label>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 text-base tracking-wide uppercase">
                  {isSubmitting ? "Submitting..." : "Submit Broker Application"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.form>
            </motion.div>
          </div>
        </section>

        {/* Footer Notice */}
        <section className="py-6 border-t border-blue-200/40">
          <div className="max-w-5xl mx-auto px-4 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <p className="text-center text-sm text-muted-foreground">
              Your details are confidential and reviewed exclusively by JBJ Global management.
            </p>
          </div>
        </section>
      </main>
    </>
  );
};

export default JoinBrokerList;
