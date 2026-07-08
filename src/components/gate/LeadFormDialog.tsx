import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Field from "@/components/signup/Field";
import PillGroup from "@/components/signup/PillGroup";
import PhoneField from "@/components/signup/PhoneField";

export const SERVICES = [
  "Buy Property", "Sell Property", "Rent Property", "List My Property",
  "Off-Plan Projects", "Property Management", "Investment Advisory",
  "Golden Visa", "Mortgage Support", "Interior Design", "Company Setup",
];
export const USER_TYPES = ["buyer", "seller", "investor", "tenant", "landlord", "broker", "developer"];
export const LANGUAGES = ["English", "Arabic", "French", "Russian", "Hindi", "Chinese", "Spanish", "Other"];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  sourcePage?: string;
}

export default function LeadFormDialog({ open, onOpenChange, sourcePage }: Props) {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", nationality: "",
    preferred_language: "English", user_type: "buyer", notes: "",
  });
  const [services, setServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-lead", {
        body: { ...form, services, source_page: sourcePage ?? window.location.pathname },
      });
      if (error || (data && (data as any).error)) {
        throw new Error((data as any)?.error ?? error?.message ?? "Submission failed");
      }
      toast.success("Thank you — an advisor will contact you shortly.");
      onOpenChange(false);
      setForm({ full_name: "", email: "", phone: "", nationality: "", preferred_language: "English", user_type: "buyer", notes: "" });
      setServices([]);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const S = ({ children }: any) => (
    <SelectContent className="bg-white z-[60] border-[#B89555]/40 shadow-lg">{children}</SelectContent>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/30 shadow-[0_20px_60px_-20px_rgba(6,78,59,0.35)]">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl text-[#0d3a2b]">Speak to a JBJ advisor</DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Share a few details and we'll reach out — no account required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} autoComplete="on" className="grid gap-5 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name" required>
              <Input required autoComplete="name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </Field>
            <Field label="Email" required>
              <Input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Phone" required>
              <PhoneField value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} autoComplete="tel" placeholder="Mobile number" />
            </Field>
            <Field label="Nationality">
              <Input autoComplete="country-name" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />
            </Field>
            <Field label="Preferred language">
              <Select value={form.preferred_language} onValueChange={(v) => setForm({ ...form, preferred_language: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <S>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</S>
              </Select>
            </Field>
            <Field label="I am a">
              <Select value={form.user_type} onValueChange={(v) => setForm({ ...form, user_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <S>{USER_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</S>
              </Select>
            </Field>
          </div>
          <Field label="Services you're interested in">
            <PillGroup options={SERVICES} value={services} onChange={setServices} />
          </Field>
          <Field label="Notes">
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Anything specific we should know?" />
          </Field>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-full h-11 transition-all active:scale-[0.98] shadow-[0_10px_24px_-12px_rgba(6,78,59,0.55)]"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sending…</> : "Submit request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
