import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Shield, TrendingUp, Building2, Users, CheckCircle2 } from "lucide-react";
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

const DRAFT_KEY = "jbj_investor_join_draft";

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const emptyForm = {
  fullName: "",
  phone: "",
  email: "",
  nationality: "",
  residencyStatus: "",
  budgetRange: "",
  investmentGoal: "",
  preferredAreas: "",
  unitType: "",
  timeline: "",
  financingPlan: "",
  notes: "",
  consentToPrivacy: false
};

const JoinInvestorList = () => {
  const navigate = useNavigate();
  const { captureLead } = useLeadCapture();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load draft from localStorage
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
    } catch {
      toast.error("Failed to save draft");
    }
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
    if (!formData.consentToPrivacy) {
      toast.error("Please accept the privacy policy to continue");
      return;
    }
    if (!formData.fullName || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      const success = await captureLead(
        {
          email: formData.email || undefined,
          fullName: formData.fullName,
          phone: formData.phone,
          nationality: formData.nationality || undefined,
        },
        "investors-join"
      );
      if (success) {
        localStorage.removeItem(DRAFT_KEY);
        navigate("/thank-you?type=investor");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev: typeof emptyForm) => ({ ...prev, [field]: value }));
  };

  const benefits = [
    { icon: TrendingUp, label: "Curated Investment Opportunities", desc: "Exclusive off-plan & ready properties matched to your goals" },
    { icon: Building2, label: "Portfolio Management Tools", desc: "Track, compare, and organize your real estate portfolio" },
    { icon: Shield, label: "Market Intelligence Reports", desc: "Data-driven insights on areas, yields, and market trends" },
    { icon: Users, label: "Private Advisory Access", desc: "Direct line to our investment advisory team" },
  ];

  return (
    <>
      <SEOHead
        title="Join Investor Network | JBJ Global Real Estate"
        description="Submit your investor profile to unlock investor tools and research access for Dubai real estate."
        keywords="dubai investor network, real estate investment dubai, property investor dubai"
        canonicalPath="/investors/join"
      />

      <main className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        {/* Hero Header */}
        <section className="pt-28 pb-8 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 bg-gold/15 border border-gold/40 px-4 py-1.5 text-gold text-sm font-semibold mb-5 tracking-wide uppercase">
                <Shield className="w-4 h-4" />
                Exclusive Investor Access
              </motion.div>
              <motion.h1
                variants={fadeInUp}
                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 uppercase tracking-wider"
                style={{
                  fontFamily: "Poppins, sans-serif",
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #333333 30%, #D4AF37 50%, #333333 70%, #1a1a1a 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Join Our Investor Network
              </motion.h1>
              <motion.p variants={fadeInUp} className="text-muted-foreground max-w-2xl mx-auto text-base">
                Submit your investor profile. Our team will review and activate access to exclusive tools, market intelligence, and curated opportunities.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Benefits Strip */}
        <section className="pb-6 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {benefits.map((b) => (
                <div key={b.label} className="flex items-start gap-3 p-4 bg-white/60 border border-gold/20">
                  <div className="w-9 h-9 bg-gold/15 flex items-center justify-center flex-shrink-0">
                    <b.icon className="w-4.5 h-4.5 text-gold" />
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
                  label="Investor Application"
                  theme="gold"
                />
              </motion.div>

              {/* Form Card */}
              <motion.form
                variants={fadeInUp}
                onSubmit={handleSubmit}
                className="bg-white/50 border-2 border-gold/30 p-6 md:p-8 space-y-6"
              >
                {/* Contact Details */}
                <div className="space-y-1 mb-4">
                  <h3 className="text-lg font-bold text-foreground tracking-wide uppercase flex items-center gap-2">
                    <span className="w-6 h-6 bg-gold/20 flex items-center justify-center text-gold text-xs font-bold">1</span>
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
                  <div className="md:col-span-2">
                    <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="your@email.com" />
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gold/20" />

                {/* Investor Profile */}
                <div className="space-y-1 mb-4">
                  <h3 className="text-lg font-bold text-foreground tracking-wide uppercase flex items-center gap-2">
                    <span className="w-6 h-6 bg-gold/20 flex items-center justify-center text-gold text-xs font-bold">2</span>
                    Investor Profile
                  </h3>
                  <p className="text-xs text-muted-foreground pl-8">Help us match you with the right opportunities</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nationality" className="text-foreground font-medium">Nationality</Label>
                    <Input id="nationality" value={formData.nationality} onChange={(e) => handleChange("nationality", e.target.value)} placeholder="e.g., British, Indian, American" />
                  </div>
                  <div>
                    <Label htmlFor="residencyStatus" className="text-foreground font-medium">Residency Status</Label>
                    <Select value={formData.residencyStatus} onValueChange={(v) => handleChange("residencyStatus", v)}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uae-resident">UAE Resident</SelectItem>
                        <SelectItem value="non-resident">Non-Resident</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="budgetRange" className="text-foreground font-medium">Budget Range</Label>
                    <Select value={formData.budgetRange} onValueChange={(v) => handleChange("budgetRange", v)}>
                      <SelectTrigger><SelectValue placeholder="Select budget" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under-1m">Under AED 1M</SelectItem>
                        <SelectItem value="1m-2m">AED 1M - 2M</SelectItem>
                        <SelectItem value="2m-5m">AED 2M - 5M</SelectItem>
                        <SelectItem value="5m-10m">AED 5M - 10M</SelectItem>
                        <SelectItem value="10m-plus">AED 10M+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="investmentGoal" className="text-foreground font-medium">Investment Goal</Label>
                    <Select value={formData.investmentGoal} onValueChange={(v) => handleChange("investmentGoal", v)}>
                      <SelectTrigger><SelectValue placeholder="Select goal" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yield">Rental Yield</SelectItem>
                        <SelectItem value="appreciation">Capital Appreciation</SelectItem>
                        <SelectItem value="both">Both Yield & Appreciation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="preferredAreas" className="text-foreground font-medium">Preferred Areas</Label>
                    <Input id="preferredAreas" value={formData.preferredAreas} onChange={(e) => handleChange("preferredAreas", e.target.value)} placeholder="e.g., Downtown, Marina, JVC" />
                  </div>
                  <div>
                    <Label htmlFor="unitType" className="text-foreground font-medium">Unit Type</Label>
                    <Select value={formData.unitType} onValueChange={(v) => handleChange("unitType", v)}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="villa">Villa</SelectItem>
                        <SelectItem value="townhouse">Townhouse</SelectItem>
                        <SelectItem value="plot">Plot</SelectItem>
                        <SelectItem value="any">Open to All</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timeline" className="text-foreground font-medium">Timeline</Label>
                    <Select value={formData.timeline} onValueChange={(v) => handleChange("timeline", v)}>
                      <SelectTrigger><SelectValue placeholder="Select timeline" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="now">Now</SelectItem>
                        <SelectItem value="30-90">30–90 days</SelectItem>
                        <SelectItem value="3-6">3–6 months</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="financingPlan" className="text-foreground font-medium">Financing Plan</Label>
                    <Select value={formData.financingPlan} onValueChange={(v) => handleChange("financingPlan", v)}>
                      <SelectTrigger><SelectValue placeholder="Select financing" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="mortgage">Mortgage</SelectItem>
                        <SelectItem value="mix">Mix of Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-foreground font-medium">Notes (Optional)</Label>
                  <Textarea id="notes" value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} placeholder="Any additional information about your investment goals..." rows={3} />
                </div>

                {/* Divider */}
                <div className="h-px bg-gold/20" />

                {/* Consent */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="consent"
                    checked={formData.consentToPrivacy}
                    onCheckedChange={(checked) => handleChange("consentToPrivacy", checked as boolean)}
                  />
                  <Label htmlFor="consent" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                    I agree to the <a href="/privacy" className="text-gold hover:underline font-medium">Privacy Policy</a> and
                    consent to being contacted regarding investor opportunities.
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gold hover:bg-gold/90 text-black font-bold h-12 text-base tracking-wide uppercase"
                >
                  {isSubmitting ? "Submitting..." : "Submit Investor Profile"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.form>
            </motion.div>
          </div>
        </section>

        {/* Footer Notice */}
        <section className="py-6 border-t border-gold/20">
          <div className="max-w-5xl mx-auto px-4 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-gold" />
            <p className="text-center text-sm text-muted-foreground">
              Your details are confidential and accessible only to authorized JBJ administrators.
            </p>
          </div>
        </section>
      </main>
    </>
  );
};

export default JoinInvestorList;
