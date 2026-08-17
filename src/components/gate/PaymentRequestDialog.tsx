import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, CreditCard, Loader2, MessageCircle, Sparkles } from "lucide-react";
import Field from "@/components/signup/Field";
import NationalityPicker from "@/components/crm/pickers/NationalityPicker";
import PhoneInputWithCountry from "@/components/crm/pickers/PhoneInputWithCountry";

export type PaymentRequestContext = {
  /** e.g. "Investor packages", "Broker Academy" */
  audience: string;
  /** Tier / plan name — e.g. "Signature" */
  planName: string;
  /** Display price — e.g. "AED 499" */
  price: string;
  /** e.g. "/month", "/year", "one-time" */
  cadence?: string;
  /** Origin section on the page — e.g. "#investor-packages" */
  sectionId?: string;
  /** Optional extra structured metadata to persist */
  extra?: Record<string, unknown>;
};

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  context: PaymentRequestContext | null;
  sourcePage?: string;
}

export default function PaymentRequestDialog({ open, onOpenChange, context, sourcePage }: Props) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    whatsapp: "",
    nationality: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) setDone(false);
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!context) return;
    setLoading(true);
    try {
      const submission_data = {
        request_type: "payment_assistance",
        audience: context.audience,
        plan_name: context.planName,
        price: context.price,
        cadence: context.cadence ?? null,
        section_id: context.sectionId ?? null,
        whatsapp: form.whatsapp || form.phone,
        nationality: form.nationality || null,
        notes: form.notes || null,
        preferred_contact: (form.whatsapp || form.phone) ? "whatsapp_or_call" : "email",
        origin_url: typeof window !== "undefined" ? window.location.href : null,
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
        ...context.extra,
      };

      const { error } = await supabase.from("forms_submissions").insert({
        form_type: "payment_request",
        form_name: `${context.audience} · ${context.planName}`,
        submitter_name: form.full_name,
        submitter_email: form.email,
        submitter_phone: form.phone,
        page_source: sourcePage ?? (typeof window !== "undefined" ? window.location.pathname : null),
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        submission_data,
      });

      if (error) throw error;

      setDone(true);
      toast.success("Request received — our team will contact you shortly.");
      setForm({ full_name: "", email: "", phone: "", whatsapp: "", nationality: "", notes: "" });
    } catch (err) {
      toast.error((err as Error).message || "Could not submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/30 shadow-[0_20px_60px_-20px_rgba(6,78,59,0.35)] p-0">
        {/* Emerald header band with plan context */}
        <div
          data-surface="dark"
          className="relative overflow-hidden rounded-t-lg px-6 py-6 !text-white"
          style={{ backgroundImage: "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000 100%)" }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.10),transparent_65%)]" />
          <DialogHeader className="relative space-y-2 text-left">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] !text-white ring-1 ring-white/25">
              <CreditCard className="h-3.5 w-3.5 !text-white" />
              Payment assistance
            </span>
            <DialogTitle className="font-serif text-2xl sm:text-3xl !text-white">
              Complete your enrollment
            </DialogTitle>
            <DialogDescription className="!text-white/80">
              Card payments are currently unavailable online. Share your details and our team will send payment
              instructions to your phone and guide you through activation, step by step.
            </DialogDescription>
          </DialogHeader>

          {context && (
            <div className="relative mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-white/20 bg-white/8 px-4 py-3 backdrop-blur-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] !text-[#F0D78C]">
                  {context.audience}
                </p>
                <p className="font-serif text-lg !text-white">{context.planName}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="font-serif text-xl !text-white">
                  {context.price}
                  {context.cadence && (
                    <span className="ml-1 text-sm !text-white/70">{context.cadence}</span>
                  )}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] !text-white/70">
                  Selected plan
                </p>
              </div>
            </div>
          )}
        </div>

        {done ? (
          <div className="px-6 py-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#064E3B]/10 text-[#064E3B]">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="font-serif text-2xl text-[#0d3a2b]">Request received</h3>
            <p className="mx-auto mt-3 max-w-md text-sm text-[#1A1A1A]/70">
              Our advisor will contact you shortly on WhatsApp / phone with payment instructions and walk you
              through enrollment and activation.
            </p>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[linear-gradient(135deg,#064E3B_0%,#042c1c_55%,#000_100%)] px-6 text-sm font-bold uppercase tracking-[0.14em] !text-white shadow-[0_16px_30px_-14px_rgba(6,78,59,0.85)] hover:brightness-110"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} autoComplete="on" className="grid gap-5 px-6 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full name" required>
                <Input
                  required
                  autoComplete="name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </Field>
              <Field label="Email" required>
                <Input
                  required
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
              <Field label="Mobile number" required>
                <PhoneInputWithCountry
                  value={form.phone}
                  onChange={(v) => setForm({ ...form, phone: v })}
                  placeholder="We will send payment details here"
                />
              </Field>
              <Field label="WhatsApp (if different)">
                <PhoneInputWithCountry
                  value={form.whatsapp}
                  onChange={(v) => setForm({ ...form, whatsapp: v })}
                  placeholder="Same as mobile if blank"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Nationality">
                  <NationalityPicker
                    value={form.nationality}
                    onChange={(v) => setForm({ ...form, nationality: v })}
                    placeholder="Select nationality"
                  />
                </Field>
              </div>
            </div>

            <Field label="Anything specific we should know?">
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Preferred payment method, timing, questions about the plan…"
              />
            </Field>

            <div className="flex items-start gap-3 rounded-xl border border-[#0d3a2b]/12 bg-[#F7F2EA] px-4 py-3">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#064E3B]/10 text-[#064E3B]">
                <MessageCircle className="h-4 w-4" />
              </span>
              <p className="text-xs leading-relaxed text-[#1A1A1A]/72">
                A JBJ advisor will reach out with secure payment instructions on your phone. We will then guide
                you step-by-step through enrollment and activation of your plan.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative overflow-hidden inline-flex w-full h-12 items-center justify-center gap-2 rounded-md text-sm font-bold uppercase tracking-[0.14em] !text-white [&_svg]:!text-white bg-[linear-gradient(135deg,#064E3B_0%,#042c1c_55%,#000_100%)] shadow-[0_16px_30px_-14px_rgba(6,78,59,0.85)] hover:brightness-110 transition disabled:opacity-70 before:pointer-events-none before:absolute before:inset-y-0 before:-left-1/2 before:w-1/2 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent hover:before:translate-x-[300%] before:transition before:duration-[900ms]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Request payment instructions
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
