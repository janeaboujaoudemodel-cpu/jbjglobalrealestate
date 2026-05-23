/**
 * ConciergeGate — pre-chat lead capture + 6-digit email OTP.
 * Reuses existing `send-email-otp` + `verify-email-otp` edge functions and
 * `capture-lead` to push the contact into CRM.
 * On success, persists a verified-support token via useConciergeVerification.
 */
import { useEffect, useState } from "react";
import { Loader2, Mail, Phone, User, ShieldCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useConciergeVerification } from "@/hooks/useConciergeVerification";

const COUNTRY_CODES = [
  { code: "+971", label: "🇦🇪 UAE +971" },
  { code: "+966", label: "🇸🇦 KSA +966" },
  { code: "+44", label: "🇬🇧 UK +44" },
  { code: "+1", label: "🇺🇸 US +1" },
  { code: "+91", label: "🇮🇳 IN +91" },
  { code: "+86", label: "🇨🇳 CN +86" },
  { code: "+49", label: "🇩🇪 DE +49" },
  { code: "+33", label: "🇫🇷 FR +33" },
  { code: "+7", label: "🇷🇺 RU +7" },
  { code: "+20", label: "🇪🇬 EG +20" },
];

const detailsSchema = z.object({
  firstName: z.string().trim().min(1, "First name required").max(80),
  lastName: z.string().trim().min(1, "Family name required").max(80),
  email: z.string().trim().email("Valid working email required").max(255),
  countryCode: z.string().regex(/^\+\d{1,4}$/),
  phone: z.string().trim().regex(/^\d{6,15}$/, "Digits only, 6-15"),
});

type Step = "details" | "otp";

export default function ConciergeGate({ onVerified, channelLabel = "Concierge" }: { onVerified: () => void; channelLabel?: string }) {
  const { save } = useConciergeVerification();
  const [step, setStep] = useState<Step>("details");
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+971");
  const [phone, setPhone] = useState("");

  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const sendOtp = async (silent = false) => {
    const parsed = detailsSchema.safeParse({ firstName, lastName, email, countryCode, phone });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return false;
    }
    setSubmitting(true);
    try {
      const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();
      const e164 = `${parsed.data.countryCode}${parsed.data.phone}`;

      // 1) Send email OTP (existing infra)
      const { error: otpErr } = await supabase.functions.invoke("send-email-otp", {
        body: { email: parsed.data.email, full_name: fullName },
      });
      if (otpErr) throw otpErr;

      // 2) Push lead to CRM in parallel (non-blocking)
      supabase.functions
        .invoke("capture-lead", {
          body: {
            email: parsed.data.email,
            fullName,
            phone: e164,
            source: "ai_chat",
            subSource: channelLabel.toLowerCase(),
            contactType: "investor",
            role: "buyer",
          },
        })
        .catch((e) => console.warn("capture-lead non-fatal", e));

      setStep("otp");
      setResendCooldown(60);
      if (!silent) toast.success("Code sent — check your inbox");
      return true;
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Could not send code. Try again.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-email-otp", {
        body: { email, otp_code: otp },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      save({
        email: email.toLowerCase().trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: `${countryCode}${phone}`,
      });
      toast.success("Verified — welcome aboard");
      onVerified();
    } catch (e: any) {
      toast.error(e?.message ?? "Invalid code. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase =
    "h-12 w-full min-w-0 px-3 rounded-lg text-[13.5px] text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 " +
    "bg-[#FDFBF7] border border-[#B89555]/45 focus:border-[#B89555] focus:bg-[#FDFBF7] outline-none transition";

  return (
    <div className="space-y-3">
      {/* 24/7 Free Support badge */}
      <div className="flex items-center justify-center">
        <span
          data-no-contrast-guard
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold
            border border-[#B89555]/55 bg-[#F7F2EA] text-[#1A1A1A]"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          24/7 Support · Always Free
        </span>
      </div>

      <div className="text-center space-y-1">
        <h3 className="text-[15px] font-semibold text-[#1A1A1A]">
          {step === "details" ? "Let's get you set up" : "Verify your email"}
        </h3>
        <p className="text-[12px] text-[#1A1A1A]/70 leading-snug px-2">
          {step === "details"
            ? "Quick details so our team can follow up if your chat needs a human."
            : `We sent a 6-digit code to ${email}. Enter it below.`}
        </p>
      </div>

      {step === "details" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendOtp();
          }}
          className="space-y-2.5"
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#B89555]" />
              <input
                data-no-contrast-guard
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                maxLength={80}
                className={inputBase + " pl-9"}
                autoComplete="given-name"
              />
            </div>
            <input
              data-no-contrast-guard
              placeholder="Family name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              maxLength={80}
              className={inputBase}
              autoComplete="family-name"
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#B89555]" />
            <input
              data-no-contrast-guard
              type="email"
              placeholder="Working email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              className={inputBase + " pl-9"}
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div className="grid grid-cols-[128px_minmax(0,1fr)] gap-2 overflow-hidden">
            <select
              data-no-contrast-guard
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className={inputBase + " cursor-pointer"}
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code} className="bg-[#FDFBF7] text-[#1A1A1A]">
                  {c.label}
                </option>
              ))}
            </select>
            <div className="relative min-w-0">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#B89555]" />
              <input
                data-no-contrast-guard
                placeholder="Working phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                inputMode="tel"
                maxLength={15}
                className={inputBase + " pl-9"}
                autoComplete="tel-national"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            data-no-contrast-guard
            className="w-full h-12 rounded-lg text-[13.5px] font-semibold text-[#FDFBF7]
              bg-[#1A1A1A] hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed transition
              inline-flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {submitting ? "Sending code…" : "Send verification code"}
          </button>

          <p className="text-[10.5px] text-[#1A1A1A]/60 text-center leading-snug px-2">
            We'll only contact you about your enquiry. By continuing you accept our Privacy Policy.
          </p>
        </form>
      ) : (
        <div className="space-y-3">
          <input
            data-no-contrast-guard
            placeholder="6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            maxLength={6}
            className={inputBase + " text-center tracking-[0.5em] text-[18px] font-semibold"}
            autoFocus
          />
          <button
            onClick={verifyOtp}
            disabled={submitting || otp.length !== 6}
            data-no-contrast-guard
            className="w-full h-12 rounded-lg text-[13.5px] font-semibold text-[#FDFBF7]
              bg-[#1A1A1A] hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed transition
              inline-flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {submitting ? "Verifying…" : "Verify & start chat"}
          </button>
          <div className="flex items-center justify-between text-[11.5px]">
            <button
              onClick={() => setStep("details")}
              data-no-contrast-guard
              className="text-[#1A1A1A]/70 hover:text-[#1A1A1A] underline-offset-4 hover:underline"
            >
              ← Change details
            </button>
            <button
              onClick={() => resendCooldown === 0 && sendOtp(true)}
              disabled={resendCooldown > 0}
              data-no-contrast-guard
              className="text-[#B89555] hover:text-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

