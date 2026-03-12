import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
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
import { FormDraftBar } from "@/components/shared/FormDraftBar";

const DRAFT_KEY = "jbj_landlord_list_draft";

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

const emptyLandlordForm = {
    fullName: "",
    phone: "",
    email: "",
    propertyType: "",
    area: "",
    buildingName: "",
    bedrooms: "",
    size: "",
    furnishing: "",
    desiredRent: "",
    chequePreference: "",
    availabilityDate: "",
    notes: "",
    consentToPrivacy: false
  };

const LandlordListForm = () => {
  const navigate = useNavigate();
  const { captureLead } = useLeadCapture();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) return { ...emptyLandlordForm, ...JSON.parse(saved) };
    } catch {}
    return emptyLandlordForm;
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
    setFormData(emptyLandlordForm);
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

    if (!formData.fullName || !formData.phone || !formData.propertyType || !formData.area) {
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
        },
        "landlord-onboarding"
      );

      if (success) {
        navigate("/thank-you?type=landlord");
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

  const processSteps = [
    "Our team reviews details and confirms documents.",
    "We validate rental positioning and target tenant profile.",
    "We activate the listing and begin tenant outreach (after approval)."
  ];

  return (
    <>
      <SEOHead
        title="List Your Property for Rent | JBJ Global Real Estate"
        description="Submit your rental property details for review. Our team will contact you with next steps for tenant screening and listing activation."
        keywords="list rental property dubai, landlord dubai, rent out property dubai"
        canonicalPath="/property-management/list"
      />
      
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
                List Your Property
              </motion.span>
              
              <motion.h1
                variants={fadeInUp}
                className="text-4xl md:text-5xl font-bold text-white mb-6"
              >
                List Your Rental Property
              </motion.h1>
              
              <motion.p
                variants={fadeInUp}
                className="text-lg text-zinc-400"
              >
                Submit your rental details for review. Our team will contact you with next steps for tenant screening, 
                contract coordination, and listing activation.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* What Happens Next */}
        <section className="py-12 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="max-w-3xl mx-auto"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-2xl font-bold text-white mb-6 text-center"
              >
                What Happens After You Submit
              </motion.h2>
              
              <div className="space-y-4">
                {processSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    className="flex items-start gap-4"
                  >
                    <div className="w-8 h-8 bg-gold/10 border border-gold/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-gold font-bold text-sm">{index + 1}</span>
                    </div>
                    <p className="text-zinc-300 pt-1">{step}</p>
                  </motion.div>
                ))}
              </div>
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

                {/* Property Details */}
                <div className="space-y-4 pt-4 border-t border-zinc-700">
                  <h3 className="text-lg font-semibold text-white">Property Details</h3>
                  
                  <div>
                    <Label htmlFor="propertyType" className="text-zinc-300">Property Type *</Label>
                    <Select value={formData.propertyType} onValueChange={(v) => handleChange("propertyType", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="villa">Villa</SelectItem>
                        <SelectItem value="townhouse">Townhouse</SelectItem>
                        <SelectItem value="penthouse">Penthouse</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="area" className="text-zinc-300">Community / Area *</Label>
                    <Input
                      id="area"
                      value={formData.area}
                      onChange={(e) => handleChange("area", e.target.value)}
                      placeholder="e.g., Downtown Dubai, Dubai Marina"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="buildingName" className="text-zinc-300">Building / Project Name</Label>
                    <Input
                      id="buildingName"
                      value={formData.buildingName}
                      onChange={(e) => handleChange("buildingName", e.target.value)}
                      placeholder="e.g., Burj Khalifa, Marina Gate"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bedrooms" className="text-zinc-300">Bedrooms</Label>
                      <Select value={formData.bedrooms} onValueChange={(v) => handleChange("bedrooms", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="studio">Studio</SelectItem>
                          <SelectItem value="1">1 BR</SelectItem>
                          <SelectItem value="2">2 BR</SelectItem>
                          <SelectItem value="3">3 BR</SelectItem>
                          <SelectItem value="4">4 BR</SelectItem>
                          <SelectItem value="5+">5+ BR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="size" className="text-zinc-300">Size (sq ft)</Label>
                      <Input
                        id="size"
                        value={formData.size}
                        onChange={(e) => handleChange("size", e.target.value)}
                        placeholder="e.g., 1200"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="furnishing" className="text-zinc-300">Furnishing</Label>
                    <Select value={formData.furnishing} onValueChange={(v) => handleChange("furnishing", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select furnishing" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="furnished">Furnished</SelectItem>
                        <SelectItem value="unfurnished">Unfurnished</SelectItem>
                        <SelectItem value="partly">Partly Furnished</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Rental Details */}
                <div className="space-y-4 pt-4 border-t border-zinc-700">
                  <h3 className="text-lg font-semibold text-white">Rental Details</h3>
                  
                  <div>
                    <Label htmlFor="desiredRent" className="text-zinc-300">Desired Annual Rent (AED)</Label>
                    <Input
                      id="desiredRent"
                      value={formData.desiredRent}
                      onChange={(e) => handleChange("desiredRent", e.target.value)}
                      placeholder="e.g., 120,000"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="chequePreference" className="text-zinc-300">Cheque Preference</Label>
                    <Select value={formData.chequePreference} onValueChange={(v) => handleChange("chequePreference", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select cheques" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Cheque</SelectItem>
                        <SelectItem value="2">2 Cheques</SelectItem>
                        <SelectItem value="4">4 Cheques</SelectItem>
                        <SelectItem value="6">6 Cheques</SelectItem>
                        <SelectItem value="12">12 Cheques</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="availabilityDate" className="text-zinc-300">Availability Date</Label>
                    <Input
                      id="availabilityDate"
                      type="date"
                      value={formData.availabilityDate}
                      onChange={(e) => handleChange("availabilityDate", e.target.value)}
                    />
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
                    consent to being contacted regarding this rental listing.
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gold hover:bg-gold/90 text-black font-semibold h-12"
                >
                  {isSubmitting ? "Submitting..." : "Submit Rental Listing"}
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
              All listings are subject to internal review and compliance checks prior to publication.
            </p>
          </div>
        </section>
      </main>
    </>
  );
};

export default LandlordListForm;
