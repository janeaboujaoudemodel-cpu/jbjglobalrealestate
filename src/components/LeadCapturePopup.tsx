/**
 * LeadCapturePopup - Smart behavior-based lead capture
 * Uses useSmartPopupStrategy for intelligent timing & context-aware messaging
 * Frequency caps: max 1/session, max 3 total, 3-day cooldown after dismiss
 */

import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSmartPopupStrategy } from "@/hooks/useSmartPopupStrategy";

const NATIONALITIES = [
  "UAE", "India", "Pakistan", "United Kingdom", "Russia", "China",
  "Philippines", "Egypt", "Jordan", "Lebanon", "Saudi Arabia",
  "Iran", "Germany", "France", "Canada", "United States",
  "Australia", "South Africa", "Nigeria", "Brazil", "Other",
];

const LANGUAGES = [
  "English", "Arabic", "Hindi", "Russian", "Chinese", "French",
  "Urdu", "Tagalog", "German", "Spanish", "Other",
];

const CONTACT_TIMES = [
  "Morning (9AM-12PM)", "Afternoon (12PM-5PM)", "Evening (5PM-9PM)", "Anytime",
];

const SERVICES = [
  "Buying", "Selling", "Renting", "Investing",
  "Property Management", "Mortgage Advisory", "Legal Services", "Partnerships",
];

const LeadCapturePopup = () => {
  const { shouldShow, headline, subtitle, markShown, markDismissed, markSubmitted } = useSmartPopupStrategy();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    nationality: "",
    language: "",
    contactTime: "",
    service: "Buying",
  });

  // Open popup when strategy says to show
  useEffect(() => {
    if (shouldShow && !isOpen) {
      setIsOpen(true);
      markShown();
    }
  }, [shouldShow, isOpen, markShown]);

  const handleDismiss = () => {
    setIsOpen(false);
    markDismissed();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Please fill in your name and email");
      return;
    }

    setIsSubmitting(true);
    try {
      await supabase.from("crm_leads").insert({
        full_name: formData.name,
        email_lower: formData.email.toLowerCase(),
        phone_e164: formData.phone || null,
        source: "smart_popup",
        pipeline_stage: "new",
        nationality: formData.nationality || null,
        preferred_language: formData.language || null,
        notes: `Service: ${formData.service}${formData.contactTime ? ` | Contact: ${formData.contactTime}` : ""}`,
      });

      toast.success("Welcome! You now have full access to all features.");
      setIsOpen(false);
      markSubmitted();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-2xl border-2 border-gold/50 shadow-[0_20px_60px_rgba(200,167,102,0.4)] overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-black/60" />
            </button>

            {/* Header - Context-aware */}
            <div className="bg-gradient-to-r from-[#E8DCC8] to-[#D4C4A8] p-6 pb-4 border-b border-gold/30">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-gold" />
                <span className="text-xs uppercase tracking-[0.2em] font-semibold text-gold">Exclusive Access</span>
              </div>
              <h3 className="text-xl font-bold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                {headline}
              </h3>
              <p className="text-sm text-zinc-600 mt-1">
                {subtitle}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-3">
              <Input
                placeholder="Full Name *"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                required
              />
              <Input
                type="email"
                placeholder="Email Address *"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                required
              />
              <Input
                type="tel"
                placeholder="Phone Number (optional)"
                value={formData.phone}
                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
              />

              {/* Nationality */}
              <Select value={formData.nationality} onValueChange={(v) => setFormData((p) => ({ ...p, nationality: v }))}>
                <SelectTrigger className="h-12 rounded-xl border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
                  <SelectValue placeholder="Nationality (optional)" />
                </SelectTrigger>
                <SelectContent className="z-[20100]">
                  {NATIONALITIES.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Preferred Language */}
              <Select value={formData.language} onValueChange={(v) => setFormData((p) => ({ ...p, language: v }))}>
                <SelectTrigger className="h-12 rounded-xl border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
                  <SelectValue placeholder="Preferred Language (optional)" />
                </SelectTrigger>
                <SelectContent className="z-[20100]">
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Preferred Contact Time */}
              <Select value={formData.contactTime} onValueChange={(v) => setFormData((p) => ({ ...p, contactTime: v }))}>
                <SelectTrigger className="h-12 rounded-xl border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
                  <SelectValue placeholder="Preferred Contact Time (optional)" />
                </SelectTrigger>
                <SelectContent className="z-[20100]">
                  {CONTACT_TIMES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Services */}
              <Select value={formData.service} onValueChange={(v) => setFormData((p) => ({ ...p, service: v }))}>
                <SelectTrigger className="h-12 rounded-xl border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
                  <SelectValue placeholder="Service Interest" />
                </SelectTrigger>
                <SelectContent className="z-[20100]">
                  {SERVICES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gold hover:bg-gold/90 text-black font-bold h-12 rounded-xl text-sm"
              >
                {isSubmitting ? "Submitting..." : "Get Full Access"}
              </Button>

              <p className="text-[10px] text-zinc-500 text-center">
                By submitting, you agree to our Privacy Policy.
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LeadCapturePopup;
