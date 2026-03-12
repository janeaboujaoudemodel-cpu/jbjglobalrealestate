import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Building, Globe, Handshake, MapPin, Landmark } from "lucide-react";
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

const DRAFT_KEY = "jbj_developer_join_draft";

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const emptyForm = {
  companyName: "",
  contactPerson: "",
  phone: "",
  email: "",
  website: "",
  reraDeveloperNumber: "",
  headquartersLocation: "",
  yearsInBusiness: "",
  totalProjectsDelivered: "",
  activeProjects: "",
  primaryLocations: "",
  partnershipType: "",
  projectTypes: "",
  portfolioUrl: "",
  notes: "",
  consentToPrivacy: false,
};

const JoinDeveloperList = () => {
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
    if (!formData.companyName || !formData.contactPerson || !formData.phone) { toast.error("Please fill in all required fields"); return; }
    setIsSubmitting(true);
    try {
      const success = await captureLead(
        { email: formData.email || undefined, fullName: formData.contactPerson, phone: formData.phone },
        "developers-join"
      );
      if (success) { localStorage.removeItem(DRAFT_KEY); navigate("/thank-you?type=developer"); }
      else toast.error("Something went wrong. Please try again.");
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setIsSubmitting(false); }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev: typeof emptyForm) => ({ ...prev, [field]: value }));
  };

  const benefits = [
    { icon: Globe, label: "Global Exposure", desc: "Showcase projects to international investor network" },
    { icon: Handshake, label: "Broker Distribution", desc: "Connect with 500+ verified broker partners" },
    { icon: Landmark, label: "Premium Listing", desc: "Featured placement on JBJ portal and marketing" },
    { icon: MapPin, label: "Market Briefings", desc: "Host briefings and events for targeted broker audiences" },
  ];

  return (
    <>
      <SEOHead
        title="Developer Partnership | JBJ Global Real Estate"
        description="Register as a developer partner with JBJ Global. List projects, connect with brokers, and reach international investors."
        keywords="dubai developer partnership, real estate developer listing, developer broker network"
        canonicalPath="/developers/join"
      />

      <main className="min-h-screen bg-gradient-to-br from-[#F5F0FA] via-[#EDE6F5] to-[#DDD2EC]">
        {/* Hero Header */}
        <section className="pt-28 pb-8 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 bg-purple-600/15 border border-purple-500/40 px-4 py-1.5 text-purple-700 text-sm font-semibold mb-5 tracking-wide uppercase">
                <Building className="w-4 h-4" />
                Developer Partnership
              </motion.div>
              <motion.h1
                variants={fadeInUp}
                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 uppercase tracking-wider"
                style={{
                  fontFamily: "Poppins, sans-serif",
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #3b1f6e 30%, #7c3aed 50%, #3b1f6e 70%, #1a1a1a 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Developer Partner Registration
              </motion.h1>
              <motion.p variants={fadeInUp} className="text-muted-foreground max-w-2xl mx-auto text-base">
                Register your development company to list projects, access our broker network, and connect with qualified investors worldwide.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Benefits Strip */}
        <section className="pb-6 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {benefits.map((b) => (
                <div key={b.label} className="flex items-start gap-3 p-4 bg-white/60 border border-purple-200/50">
                  <div className="w-9 h-9 bg-purple-600/15 flex items-center justify-center flex-shrink-0">
                    <b.icon className="w-4.5 h-4.5 text-purple-700" />
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
                  label="Developer Application"
                  theme="purple"
                />
              </motion.div>

              {/* Form Card */}
              <motion.form variants={fadeInUp} onSubmit={handleSubmit} className="bg-white shadow-lg border border-stone-200 p-6 md:p-8 space-y-6">
                {/* Section 1: Company Details */}
                <div className="space-y-1 mb-4">
                  <h3 className="text-lg font-bold text-foreground tracking-wide uppercase flex items-center gap-2">
                    <span className="w-6 h-6 bg-purple-600/20 flex items-center justify-center text-purple-700 text-xs font-bold">1</span>
                    Company Details
                  </h3>
                  <p className="text-xs text-muted-foreground pl-8">Your development company information</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName" className="text-foreground font-medium">Company Name *</Label>
                    <Input id="companyName" value={formData.companyName} onChange={(e) => handleChange("companyName", e.target.value)} placeholder="Developer company name" required />
                  </div>
                  <div>
                    <Label htmlFor="contactPerson" className="text-foreground font-medium">Contact Person *</Label>
                    <Input id="contactPerson" value={formData.contactPerson} onChange={(e) => handleChange("contactPerson", e.target.value)} placeholder="Primary contact name" required />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-foreground font-medium">Phone Number *</Label>
                    <Input id="phone" type="tel" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="+971 50 123 4567" required />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="contact@developer.com" />
                  </div>
                  <div>
                    <Label htmlFor="website" className="text-foreground font-medium">Website</Label>
                    <Input id="website" value={formData.website} onChange={(e) => handleChange("website", e.target.value)} placeholder="https://www.developer.com" />
                  </div>
                  <div>
                    <Label htmlFor="headquartersLocation" className="text-foreground font-medium">Headquarters Location</Label>
                    <Input id="headquartersLocation" value={formData.headquartersLocation} onChange={(e) => handleChange("headquartersLocation", e.target.value)} placeholder="e.g., Dubai, Abu Dhabi" />
                  </div>
                </div>

                <div className="h-px bg-purple-200/40" />

                {/* Section 2: Registration & Credentials */}
                <div className="space-y-1 mb-4">
                  <h3 className="text-lg font-bold text-foreground tracking-wide uppercase flex items-center gap-2">
                    <span className="w-6 h-6 bg-purple-600/20 flex items-center justify-center text-purple-700 text-xs font-bold">2</span>
                    Registration & Credentials
                  </h3>
                  <p className="text-xs text-muted-foreground pl-8">Your development license and track record</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reraDeveloperNumber" className="text-foreground font-medium">RERA Developer Registration #</Label>
                    <Input id="reraDeveloperNumber" value={formData.reraDeveloperNumber} onChange={(e) => handleChange("reraDeveloperNumber", e.target.value)} placeholder="Developer registration number" />
                  </div>
                  <div>
                    <Label htmlFor="yearsInBusiness" className="text-foreground font-medium">Years in Business</Label>
                    <Select value={formData.yearsInBusiness} onValueChange={(v) => handleChange("yearsInBusiness", v)}>
                      <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-2">0–2 years</SelectItem>
                        <SelectItem value="3-5">3–5 years</SelectItem>
                        <SelectItem value="5-10">5–10 years</SelectItem>
                        <SelectItem value="10-20">10–20 years</SelectItem>
                        <SelectItem value="20+">20+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="totalProjectsDelivered" className="text-foreground font-medium">Total Projects Delivered</Label>
                    <Input id="totalProjectsDelivered" value={formData.totalProjectsDelivered} onChange={(e) => handleChange("totalProjectsDelivered", e.target.value)} placeholder="e.g., 25" />
                  </div>
                  <div>
                    <Label htmlFor="activeProjects" className="text-foreground font-medium">Active Projects</Label>
                    <Input id="activeProjects" value={formData.activeProjects} onChange={(e) => handleChange("activeProjects", e.target.value)} placeholder="e.g., 5" />
                  </div>
                </div>

                <div className="h-px bg-purple-200/40" />

                {/* Section 3: Partnership Preferences */}
                <div className="space-y-1 mb-4">
                  <h3 className="text-lg font-bold text-foreground tracking-wide uppercase flex items-center gap-2">
                    <span className="w-6 h-6 bg-purple-600/20 flex items-center justify-center text-purple-700 text-xs font-bold">3</span>
                    Partnership Preferences
                  </h3>
                  <p className="text-xs text-muted-foreground pl-8">How you'd like to collaborate with JBJ</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryLocations" className="text-foreground font-medium">Primary Locations</Label>
                    <Input id="primaryLocations" value={formData.primaryLocations} onChange={(e) => handleChange("primaryLocations", e.target.value)} placeholder="e.g., Dubai Marina, JVC, MBR City" />
                  </div>
                  <div>
                    <Label htmlFor="partnershipType" className="text-foreground font-medium">Partnership Type</Label>
                    <Select value={formData.partnershipType} onValueChange={(v) => handleChange("partnershipType", v)}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="listing">Project Listing Only</SelectItem>
                        <SelectItem value="exclusive">Exclusive Sales Partnership</SelectItem>
                        <SelectItem value="co-broker">Co-Brokerage Network</SelectItem>
                        <SelectItem value="full">Full Partnership (Listing + Events + Marketing)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="projectTypes" className="text-foreground font-medium">Project Types</Label>
                    <Select value={formData.projectTypes} onValueChange={(v) => handleChange("projectTypes", v)}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="mixed-use">Mixed-Use</SelectItem>
                        <SelectItem value="hospitality">Hospitality</SelectItem>
                        <SelectItem value="all">All Types</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="portfolioUrl" className="text-foreground font-medium">Portfolio / Brochure Link</Label>
                    <Input id="portfolioUrl" value={formData.portfolioUrl} onChange={(e) => handleChange("portfolioUrl", e.target.value)} placeholder="https://..." />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-foreground font-medium">Additional Notes (Optional)</Label>
                  <Textarea id="notes" value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} placeholder="Tell us about your upcoming projects or partnership goals..." rows={3} />
                </div>

                <div className="h-px bg-purple-200/40" />

                {/* Consent */}
                <div className="flex items-start gap-3">
                  <Checkbox id="consent" checked={formData.consentToPrivacy} onCheckedChange={(checked) => handleChange("consentToPrivacy", checked as boolean)} />
                  <Label htmlFor="consent" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                    I agree to the <a href="/privacy" className="text-purple-600 hover:underline font-medium">Privacy Policy</a> and consent to being contacted regarding developer partnership opportunities.
                  </Label>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 text-base tracking-wide uppercase">
                  {isSubmitting ? "Submitting..." : "Submit Developer Application"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.form>
            </motion.div>
          </div>
        </section>

        {/* Footer Notice */}
        <section className="py-6 border-t border-purple-200/40">
          <div className="max-w-5xl mx-auto px-4 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-purple-600" />
            <p className="text-center text-sm text-muted-foreground">
              Your details are confidential and reviewed exclusively by JBJ Global management.
            </p>
          </div>
        </section>
      </main>
    </>
  );
};

export default JoinDeveloperList;
