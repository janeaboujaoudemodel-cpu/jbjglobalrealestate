/**
 * LeadCapturePopup - Auto-opens after 5 seconds on homepage
 * Collects name, email, phone, interest for lead generation
 * Dismisses via localStorage so it only shows once per user
 */

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const DISMISS_KEY = "lead_popup_dismissed";

const LeadCapturePopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    interest: "buying",
  });

  useEffect(() => {
    // Only show on homepage
    if (location.pathname !== "/") return;

    // Check if already dismissed
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) return;

    const timer = setTimeout(() => setIsOpen(true), 5000);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
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
        email: formData.email,
        phone: formData.phone || null,
        source: "homepage_popup",
        status: "new",
        notes: `Interest: ${formData.interest}`,
      });

      toast.success("Welcome! You now have full access to all features.");
      handleDismiss();
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
            className="relative w-full max-w-md bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-2xl border-2 border-gold/50 shadow-[0_20px_60px_rgba(200,167,102,0.4)] overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-black/60" />
            </button>

            {/* Header */}
            <div className="bg-gradient-to-r from-[#E8DCC8] to-[#D4C4A8] p-6 pb-4 border-b border-gold/30">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-gold" />
                <span className="text-xs uppercase tracking-[0.2em] font-semibold text-gold">Exclusive Access</span>
              </div>
              <h3 className="text-xl font-bold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                Unlock Premium Features
              </h3>
              <p className="text-sm text-zinc-600 mt-1">
                Get full access to AI tools, market reports, and exclusive listings.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              <select
                value={formData.interest}
                onChange={(e) => setFormData((p) => ({ ...p, interest: e.target.value }))}
                className="flex h-12 w-full rounded-xl px-4 py-3 text-sm bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
              >
                <option value="buying">Interested in Buying</option>
                <option value="selling">Interested in Selling</option>
                <option value="renting">Interested in Renting</option>
                <option value="investing">Interested in Investing</option>
                <option value="exploring">Just Exploring</option>
              </select>

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
