/**
 * LeadCapturePopup - Smart behavior-based lead capture
 * Uses useSmartPopupStrategy for intelligent timing & context-aware messaging
 * Frequency caps: max 1/session, max 3 total, 3-day cooldown after dismiss
 *
 * Note: currently disabled in PopupLayer.tsx (UX decision, Aug 2026) — the
 * component is migrated here for JBJ-005 consistency and is ready to re-enable.
 */

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSmartPopupStrategy } from "@/hooks/useSmartPopupStrategy";
import { usePopupVisibility } from "@/contexts/PopupCoordinatorContext";
import { HoneypotField, useHoneypot } from "@/components/forms/HoneypotField";

const NATIONALITIES = ["UAE","India","Pakistan","United Kingdom","Russia","China","Philippines","Egypt","Jordan","Lebanon","Saudi Arabia","Iran","Germany","France","Canada","United States","Australia","South Africa","Nigeria","Brazil","Other"];
const LANGUAGES = ["English","Arabic","Hindi","Russian","Chinese","French","Urdu","Tagalog","German","Spanish","Other"];
const CONTACT_TIMES = ["Morning (9AM-12PM)","Afternoon (12PM-5PM)","Evening (5PM-9PM)","Anytime"];
const SERVICES = ["Buying","Selling","Renting","Investing","Property Management","Mortgage Advisory","Legal Services","Partnerships"];

const LeadCapturePopup = () => {
  const { shouldShow, headline, subtitle, markShown, markDismissed, markSubmitted } = useSmartPopupStrategy();
  const { requestToShow, dismiss, isVisible } = usePopupVisibility('lead-intent-modal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const { honeypot, setHoneypot } = useHoneypot();

  const [formData, setFormData] = useState({ name: "", email: "", phone: "", nationality: "", language: "", contactTime: "", service: "Buying" });

  useEffect(() => {
    if (shouldShow && !hasRequested) {
      requestToShow();
      markShown();
      setHasRequested(true);
    }
  }, [shouldShow, hasRequested, requestToShow, markShown]);

  const handleDismiss = () => { dismiss(); markDismissed(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) { toast.error("Please fill in your name and email"); return; }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("capture-lead", {
        body: { email: formData.email, fullName: formData.name, phone: formData.phone || undefined, nationality: formData.nationality || undefined, language: formData.language || undefined, source: "smart_popup", pageSource: window.location.pathname, contactType: "client", message: `Service: ${formData.service}${formData.contactTime ? ` | Contact: ${formData.contactTime}` : ""}`, context: { service: formData.service, preferredContactTime: formData.contactTime || null }, honeypot },
      });
      if (error) throw error;
      toast.success("Welcome! You now have full access to all features.");
      dismiss();
      markSubmitted();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isVisible} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent data-surface="light" className="max-w-md bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/50 shadow-[0_20px_60px_rgba(200,167,102,0.4)] overflow-hidden max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#ECE2D2] to-[#D8C7A6] p-6 pb-4 border-b border-[#B89555]/30">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-[#1A1A1A]" />
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]">Exclusive Access</span>
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1A1A1A]">{headline}</DialogTitle>
            <p className="text-sm text-[#1A1A1A]/70 mt-1">{subtitle}</p>
          </DialogHeader>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3">
          <HoneypotField value={honeypot} onChange={setHoneypot} name="popup_company_website" />
          <Input placeholder="Full Name *" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} className="h-12 rounded-xl border-2 border-[#1A1A1A]/20 bg-[#FDFBF7] text-[#1A1A1A] placeholder:text-[#1A1A1A]/50" required />
          <Input type="email" placeholder="Email Address *" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} className="h-12 rounded-xl border-2 border-[#1A1A1A]/20 bg-[#FDFBF7] text-[#1A1A1A] placeholder:text-[#1A1A1A]/50" required />
          <Input type="tel" placeholder="Phone Number (optional)" value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} className="h-12 rounded-xl border-2 border-[#1A1A1A]/20 bg-[#FDFBF7] text-[#1A1A1A] placeholder:text-[#1A1A1A]/50" />

          <Select value={formData.nationality} onValueChange={(v) => setFormData((p) => ({ ...p, nationality: v }))}>
            <SelectTrigger className="h-12 rounded-xl border-2 border-[#1A1A1A]/20 bg-[#FDFBF7] text-[#1A1A1A]"><SelectValue placeholder="Nationality (optional)" /></SelectTrigger>
            <SelectContent>{NATIONALITIES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
          </Select>

          <Select value={formData.language} onValueChange={(v) => setFormData((p) => ({ ...p, language: v }))}>
            <SelectTrigger className="h-12 rounded-xl border-2 border-[#1A1A1A]/20 bg-[#FDFBF7] text-[#1A1A1A]"><SelectValue placeholder="Preferred Language (optional)" /></SelectTrigger>
            <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
          </Select>

          <Select value={formData.contactTime} onValueChange={(v) => setFormData((p) => ({ ...p, contactTime: v }))}>
            <SelectTrigger className="h-12 rounded-xl border-2 border-[#1A1A1A]/20 bg-[#FDFBF7] text-[#1A1A1A]"><SelectValue placeholder="Preferred Contact Time (optional)" /></SelectTrigger>
            <SelectContent>{CONTACT_TIMES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>

          <Select value={formData.service} onValueChange={(v) => setFormData((p) => ({ ...p, service: v }))}>
            <SelectTrigger className="h-12 rounded-xl border-2 border-[#1A1A1A]/20 bg-[#FDFBF7] text-[#1A1A1A]"><SelectValue placeholder="Service Interest" /></SelectTrigger>
            <SelectContent>{SERVICES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>

          <Button type="submit" disabled={isSubmitting} className="w-full bg-[#EFE6D6] hover:bg-[#F7F2EA]/90 text-[#1A1A1A] font-bold h-12 rounded-xl text-sm">
            {isSubmitting ? "Submitting..." : "Get Full Access"}
          </Button>
          <p className="text-[10px] text-[#1A1A1A]/60 text-center">By submitting, you agree to our Privacy Policy.</p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LeadCapturePopup;
