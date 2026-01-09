import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { JJLogoImage } from "@/components/JJLogoImage";
import { 
  Home, 
  TrendingUp, 
  Briefcase, 
  Building2, 
  Users,
  ArrowRight,
  Check
} from "lucide-react";
import { toast } from "sonner";

const INTENT_MODAL_KEY = "jj_intent_collected";

interface IntentOption {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const INTENT_OPTIONS: IntentOption[] = [
  {
    id: "property_purchase",
    label: "Property Purchase",
    icon: Home,
    description: "Looking to buy residential or commercial property",
  },
  {
    id: "property_investment",
    label: "Property Investment",
    icon: TrendingUp,
    description: "Interested in ROI and investment opportunities",
  },
  {
    id: "mortgage_support",
    label: "Mortgage / Financing",
    icon: Briefcase,
    description: "Need help with mortgage or payment plans",
  },
  {
    id: "property_rental",
    label: "Property Rental",
    icon: Building2,
    description: "Looking to rent a property in UAE",
  },
  {
    id: "broker_partnership",
    label: "Broker Partnership",
    icon: Users,
    description: "Want to join as a real estate broker",
  },
];

export default function LeadIntentModal() {
  const { user, loading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [selectedIntents, setSelectedIntents] = useState<string[]>([]);
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;

    // Check if user just logged in and hasn't completed intent form
    if (user) {
      const intentCollected = localStorage.getItem(`${INTENT_MODAL_KEY}_${user.id}`);
      if (!intentCollected) {
        // Small delay to let the auth redirect complete
        const timer = setTimeout(() => setIsVisible(true), 500);
        return () => clearTimeout(timer);
      }
    }
  }, [user, loading]);

  const toggleIntent = (intentId: string) => {
    setSelectedIntents((prev) =>
      prev.includes(intentId)
        ? prev.filter((id) => id !== intentId)
        : [...prev, intentId]
    );
  };

  const handleSubmit = async () => {
    if (selectedIntents.length === 0) {
      toast.error("Please select at least one option");
      return;
    }

    setIsSubmitting(true);

    try {
      // Update profile with intent data
      const { error } = await supabase
        .from("profiles")
        .update({
          marketing_consent: marketingConsent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user?.id);

      if (error) throw error;

      // Log the intent as a user journey event
      const sessionId = sessionStorage.getItem("jj_session_id") || crypto.randomUUID();
      sessionStorage.setItem("jj_session_id", sessionId);
      
      await supabase.from("user_journey_events").insert([{
        user_id: user?.id,
        event_type: "lead_intent_collected",
        page_path: window.location.pathname,
        session_id: sessionId,
        event_data: {
          intents: selectedIntents,
          marketing_consent: marketingConsent,
        },
      }]);

      // Mark as collected
      localStorage.setItem(`${INTENT_MODAL_KEY}_${user?.id}`, "1");
      
      toast.success("Welcome to JBJ! Your preferences have been saved.");
      setIsVisible(false);
    } catch (error) {
      console.error("Error saving intent:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Still mark as shown so we don't keep asking
    if (user) {
      localStorage.setItem(`${INTENT_MODAL_KEY}_${user.id}`, "1");
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 text-center border-b border-zinc-800 bg-gradient-to-b from-zinc-800/50 to-transparent">
            <div className="flex justify-center mb-4">
              <JJLogoImage variant="light" size="sm" />
            </div>
            <h2 className="text-white text-2xl font-bold mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
              What brings you to JBJ?
            </h2>
            <p className="text-zinc-400 text-sm">
              Help us personalize your experience by selecting your interests
            </p>
          </div>

          {/* Options */}
          <div className="p-6 space-y-3 max-h-[50vh] overflow-y-auto">
            {INTENT_OPTIONS.map((option) => {
              const isSelected = selectedIntents.includes(option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => toggleIntent(option.id)}
                  className={`w-full p-4 rounded-xl border transition-all text-left flex items-start gap-4 ${
                    isSelected
                      ? "border-gold bg-gold/10"
                      : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected ? "bg-gold text-black" : "bg-zinc-700 text-zinc-300"
                    }`}
                  >
                    <option.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${isSelected ? "text-gold" : "text-white"}`}>
                        {option.label}
                      </span>
                      {isSelected && <Check className="w-5 h-5 text-gold" />}
                    </div>
                    <p className="text-zinc-500 text-sm mt-0.5">{option.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Marketing consent */}
          <div className="px-6 pb-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={marketingConsent}
                onCheckedChange={(checked) => setMarketingConsent(checked === true)}
                className="mt-0.5 border-zinc-600 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
              />
              <span className="text-zinc-400 text-sm leading-relaxed">
                I agree to receive updates, property alerts, and marketing communications from JBJ Global Real Estate. 
                You can unsubscribe at any time.
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-zinc-800 flex flex-col sm:flex-row gap-3">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              Skip for now
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold hover:brightness-110"
            >
              {isSubmitting ? "Saving..." : "Continue"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
