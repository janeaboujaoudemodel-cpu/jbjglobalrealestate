import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { JJLogoImage } from "@/components/JJLogoImage";
import { usePopupVisibility } from "@/contexts/PopupCoordinatorContext";
import {
  Home, TrendingUp, Briefcase, Building2, Users, ArrowRight, Check,
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
  { id: "buy",             label: "Buy",              icon: Home,      description: "Looking to buy residential or commercial property" },
  { id: "sell",            label: "Sell",             icon: TrendingUp, description: "Sell your property with expert guidance" },
  { id: "rent",            label: "Rent",             icon: Building2, description: "Looking to rent a property in UAE" },
  { id: "broker",          label: "Broker",           icon: Users,     description: "Join as a professional broker with JBJ" },
  { id: "partner_services",label: "Partner Services", icon: Briefcase, description: "Mortgage, legal, visa & corporate services via licensed partners" },
];

export default function LeadIntentModal() {
  const { user, loading } = useAuth();
  const { requestToShow, dismiss, isVisible } = usePopupVisibility('lead-intent-modal');
  const [selectedIntents, setSelectedIntents] = useState<string[]>([]);
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user) {
      const intentCollected = localStorage.getItem(`${INTENT_MODAL_KEY}_${user.id}`);
      if (!intentCollected) {
        const timer = setTimeout(() => { setShouldShow(true); requestToShow(); }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [user, loading, requestToShow]);

  const toggleIntent = (intentId: string) => {
    setSelectedIntents((prev) =>
      prev.includes(intentId) ? prev.filter((id) => id !== intentId) : [...prev, intentId]
    );
  };

  const handleSubmit = async () => {
    if (selectedIntents.length === 0) { toast.error("Please select at least one option"); return; }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("profiles").update({ marketing_consent: marketingConsent, updated_at: new Date().toISOString() }).eq("id", user?.id);
      if (error) throw error;

      const sessionId = sessionStorage.getItem("jj_session_id") || crypto.randomUUID();
      sessionStorage.setItem("jj_session_id", sessionId);
      await supabase.from("user_journey_events").insert([{ user_id: user?.id, event_type: "lead_intent_collected", page_path: window.location.pathname, session_id: sessionId, event_data: { intents: selectedIntents, marketing_consent: marketingConsent } }]);

      localStorage.setItem(`${INTENT_MODAL_KEY}_${user?.id}`, "1");
      toast.success("Welcome to JBJ! Your preferences have been saved.");
      dismiss();
      setShouldShow(false);
    } catch (error) {
      console.error("Error saving intent:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (user) localStorage.setItem(`${INTENT_MODAL_KEY}_${user.id}`, "1");
    dismiss();
    setShouldShow(false);
  };

  if (!shouldShow) return null;

  return (
    <Dialog open={isVisible} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="max-w-lg bg-[#FDFBF7] border border-[#1A1A1A] p-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center border-b border-[#1A1A1A] bg-gradient-to-b from-zinc-800/50 to-transparent">
          <div className="flex justify-center mb-4">
            <JJLogoImage variant="light" size="sm" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-bold mb-2">
              What brings you to JBJ?
            </DialogTitle>
            <DialogDescription className="text-white/70 text-sm">
              Help us personalize your experience by selecting your interests
            </DialogDescription>
          </DialogHeader>
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
                    ? "border-[#B89555] bg-[#EFE6D6]/10"
                    : "border-[#1A1A1A] bg-[#1A1A1A]/50 hover:border-[#1A1A1A]"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-[#EFE6D6] text-[#1A1A1A]" : "bg-[#1A1A1A] text-white/85"}`}>
                  <option.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isSelected ? "text-[#1A1A1A]" : "text-white"}`}>{option.label}</span>
                    {isSelected && <Check className="w-5 h-5 text-[#1A1A1A]" />}
                  </div>
                  <p className="text-white/90 text-sm mt-0.5">{option.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Marketing consent */}
        <div className="px-6 pb-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox checked={marketingConsent} onCheckedChange={(checked) => setMarketingConsent(checked === true)} className="mt-0.5 border-[#1A1A1A] data-[state=checked]:bg-[#EFE6D6] data-[state=checked]:border-[#B89555]" />
            <span className="text-white/70 text-sm leading-relaxed">
              I agree to receive updates, property alerts, and marketing communications from JBJ Global Real Estate. You can unsubscribe at any time.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-[#1A1A1A]">
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <Button variant="ghost" onClick={handleSkip} className="text-white/70 hover:text-white hover:bg-[#1A1A1A]">Skip for now</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-gold to-gold-dark text-[#1A1A1A] font-semibold hover:brightness-110">
              {isSubmitting ? "Saving..." : "Continue"}<ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          <p className="text-white/90 text-xs text-center">You can update your preferences anytime from your profile.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
