import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import GlobalHeader from "@/components/GlobalHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLeadCapture } from "@/hooks/useLeadCapture";
import { toast } from "sonner";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const JoinInvestorList = () => {
  const navigate = useNavigate();
  const { captureLead } = useLeadCapture();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
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
  });

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
        navigate("/thank-you?type=investor");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <SEOHead
        title="Join Investor Network | JBJ Global Real Estate"
        description="Submit your investor profile to unlock investor tools and research access for Dubai real estate."
        keywords="dubai investor network, real estate investment dubai, property investor dubai"
        canonicalPath="/investors/join"
      />
      <GlobalHeader />
      
      <main className="min-h-screen bg-black">
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent" />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-3xl mx-auto text-center"
            >
              <motion.span
                variants={fadeInUp}
                className="inline-block px-4 py-2 bg-gold/10 border border-gold/30 rounded-full text-gold text-sm font-medium mb-6"
              >
                Join Investor List
              </motion.span>
              
              <motion.h1
                variants={fadeInUp}
                className="text-4xl md:text-5xl font-bold text-white mb-6"
              >
                Unlock Investor Tools & Research Access
              </motion.h1>
              
              <motion.p
                variants={fadeInUp}
                className="text-lg text-zinc-400"
              >
                Submit your investor profile. Our team will review and activate access based on your objectives.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Why We Ask */}
        <section className="py-12 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="max-w-3xl mx-auto text-center"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-2xl font-bold text-white mb-4"
              >
                Why We Ask These Details
              </motion.h2>
              
              <motion.p
                variants={fadeInUp}
                className="text-zinc-400"
              >
                This helps us match you with suitable areas, inventory types, and risk profiles without wasting your time.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Form Section */}
        <section className="py-16 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="max-w-2xl mx-auto"
            >
              <motion.form
                variants={fadeInUp}
                onSubmit={handleSubmit}
                className="jj-card-inner p-8 space-y-6"
              >
                {/* Contact Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Contact Details</h3>
                  
                  <div>
                    <Label htmlFor="fullName" className="text-zinc-300">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleChange("fullName", e.target.value)}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone" className="text-zinc-300">Mobile Number (WhatsApp) *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="+971 50 123 4567"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="text-zinc-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                {/* Profile Details */}
                <div className="space-y-4 pt-4 border-t border-zinc-700">
                  <h3 className="text-lg font-semibold text-white">Investor Profile</h3>
                  
                  <div>
                    <Label htmlFor="nationality" className="text-zinc-300">Nationality</Label>
                    <Input
                      id="nationality"
                      value={formData.nationality}
                      onChange={(e) => handleChange("nationality", e.target.value)}
                      placeholder="e.g., British, Indian, American"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="residencyStatus" className="text-zinc-300">Residency Status</Label>
                    <Select value={formData.residencyStatus} onValueChange={(v) => handleChange("residencyStatus", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uae-resident">UAE Resident</SelectItem>
                        <SelectItem value="non-resident">Non-Resident</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="budgetRange" className="text-zinc-300">Budget Range</Label>
                    <Select value={formData.budgetRange} onValueChange={(v) => handleChange("budgetRange", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget" />
                      </SelectTrigger>
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
                    <Label htmlFor="investmentGoal" className="text-zinc-300">Investment Goal</Label>
                    <Select value={formData.investmentGoal} onValueChange={(v) => handleChange("investmentGoal", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yield">Rental Yield</SelectItem>
                        <SelectItem value="appreciation">Capital Appreciation</SelectItem>
                        <SelectItem value="both">Both Yield & Appreciation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="preferredAreas" className="text-zinc-300">Preferred Areas</Label>
                    <Input
                      id="preferredAreas"
                      value={formData.preferredAreas}
                      onChange={(e) => handleChange("preferredAreas", e.target.value)}
                      placeholder="e.g., Downtown, Marina, JVC"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="unitType" className="text-zinc-300">Unit Type</Label>
                    <Select value={formData.unitType} onValueChange={(v) => handleChange("unitType", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
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
                    <Label htmlFor="timeline" className="text-zinc-300">Timeline</Label>
                    <Select value={formData.timeline} onValueChange={(v) => handleChange("timeline", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="now">Now</SelectItem>
                        <SelectItem value="30-90">30–90 days</SelectItem>
                        <SelectItem value="3-6">3–6 months</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="financingPlan" className="text-zinc-300">Financing Plan</Label>
                    <Select value={formData.financingPlan} onValueChange={(v) => handleChange("financingPlan", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select financing" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="mortgage">Mortgage</SelectItem>
                        <SelectItem value="mix">Mix of Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="notes" className="text-zinc-300">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleChange("notes", e.target.value)}
                      placeholder="Any additional information..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Consent */}
                <div className="flex items-start gap-3 pt-4">
                  <Checkbox
                    id="consent"
                    checked={formData.consentToPrivacy}
                    onCheckedChange={(checked) => handleChange("consentToPrivacy", checked as boolean)}
                  />
                  <Label htmlFor="consent" className="text-sm text-zinc-400 cursor-pointer">
                    I agree to the <a href="/privacy" className="text-gold hover:underline">Privacy Policy</a> and 
                    consent to being contacted regarding investor opportunities.
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gold hover:bg-gold/90 text-black font-semibold h-12"
                >
                  {isSubmitting ? "Submitting..." : "Submit Investor Profile"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.form>
            </motion.div>
          </div>
        </section>

        {/* Footer Notice */}
        <section className="py-8 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <p className="text-center text-sm text-zinc-500 max-w-2xl mx-auto">
              Your details are confidential and accessible only to authorized JBJ administrators.
            </p>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default JoinInvestorList;
