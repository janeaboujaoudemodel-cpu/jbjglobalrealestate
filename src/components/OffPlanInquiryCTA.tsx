import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, HelpCircle, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OffPlanInquiryCTAProps {
  variant?: "full" | "compact";
  className?: string;
}

export function OffPlanInquiryCTA({ variant = "full", className = "" }: OffPlanInquiryCTAProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Please fill in your name and email");
      return;
    }

    setIsSubmitting(true);
    try {
      const sourcePage = window.location.pathname;
      const sourceContext = sourcePage.split('/').filter(Boolean).join(' > ');
      const { error } = await supabase.functions.invoke("capture-lead", {
        body: {
          email: formData.email,
          fullName: formData.name,
          phone: formData.phone || undefined,
          source: "offplan_cta",
          pageSource: sourcePage,
          contactType: "client",
          message: formData.message || "Off-plan investment inquiry",
          context: {
            sourceContext,
            interestLevel: "medium",
            product: "off-plan",
          },
        },
      });

      if (error) throw error;

      toast.success("Thank you! Our team will contact you shortly.");
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      toast.error("Failed to submit inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (variant === "compact") {
    return (
      <Card className={`bg-card border border-[#064E3B]/45 shadow-lg ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <HelpCircle className="w-5 h-5 text-[#1A1A1A]" />
            Need Investment Guidance?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Speak with our off-plan specialists to find the perfect investment opportunity.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              placeholder="Your email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value, name: prev.name || "Investor" }))}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={isSubmitting} className="allow-white jj-pill-emerald-metallic text-white">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Get Advice"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className={`py-12 md:py-16 ${className}`}>
      <div className="container mx-auto px-4">
        <Card className="bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-[#010806] border border-white/18 shadow-[0_8px_40px_rgba(0,0,0,0.28)] overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left side - Content */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <div className="jj-pill-emerald-metallic p-3 rounded-xl">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              
              <h2 className="allow-white text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
                Confused About Where to Buy or Invest in Dubai?
              </h2>
              
              <p className="allow-white text-white text-base md:text-lg leading-relaxed mb-6">
                Dubai's off-plan market offers incredible opportunities—from premium beachfront residences to high-yield investment properties. 
                Our expert advisors will guide you through the best developers, locations, and payment plans tailored to your goals.
              </p>
              
              <ul className="allow-white space-y-2 text-sm text-white mb-6">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  Flexible payment plans tailored to your investment timeline
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  Trusted developers: Emaar, Damac, Sobha, Nakheel & more
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  ROI projections and market insights included
                </li>
              </ul>
            </div>

            {/* Right side - Form */}
            <div className="bg-premium-bg p-8 md:p-12 flex flex-col justify-center">
              <h3 className="text-xl font-semibold text-foreground mb-6">
                Register Your Interest
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Your Name *"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="bg-card border-border"
                />
                
                <Input
                  type="email"
                  placeholder="Email Address *"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="bg-card border-border"
                />
                
                <Input
                  type="tel"
                  placeholder="Phone Number (optional)"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="bg-card border-border"
                />
                
                <Textarea
                  placeholder="Tell us about your investment goals..."
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  rows={3}
                  className="bg-card border-border resize-none"
                />
                
              <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="allow-white w-full jj-pill-emerald-metallic text-white font-semibold py-6"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Get Expert Guidance
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  By submitting, you agree to receive communications from our team.
                </p>
              </form>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}