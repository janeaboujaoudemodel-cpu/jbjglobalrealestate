/**
 * ConciergeGate — pre-chat lead capture + 6-digit email OTP.
 * Reuses existing `send-email-otp` + `verify-email-otp` edge functions and
 * `capture-lead` to push the contact into CRM.
 * On success, persists a verified-support token via useConciergeVerification.
 */
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Loader2, Mail, Phone, Search, User, ShieldCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { getCountries, getCountryCallingCode } from "react-phone-number-input";
import countryLabels from "react-phone-number-input/locale/en.json";
import { supabase } from "@/integrations/supabase/client";
import { useConciergeVerification } from "@/hooks/useConciergeVerification";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const PRIORITY_COUNTRIES = ["AE", "SA", "QA", "KW", "BH", "OM", "GB", "US", "IN", "CN", "SG", "RU", "DE", "FR"];
const COUNTRY_CODES = getCountries()
  .map((id) => ({ id, code: `+${getCountryCallingCode(id)}`, name: (countryLabels as Record<string, string>)[id] ?? id }))
  .sort((a, b) => {
    const ai = PRIORITY_COUNTRIES.indexOf(a.id);
    const bi = PRIORITY_COUNTRIES.indexOf(b.id);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    return a.name.localeCompare(b.name);
  });

const flagEmoji = (countryId: string) =>
  countryId.replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));

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
  const [countryId, setCountryId] = useState("AE");
  const [countryCode, setCountryCode] = useState("+971");
  const [phone, setPhone] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");

  const [otp, setOtp] = useState("");
  const selectedCountry = COUNTRY_CODES.find((country) => country.id === countryId) ?? COUNTRY_CODES[0];
  const filteredCountries = useMemo(() => {
    const query = countryQuery.trim().toLowerCase();
    if (!query) return COUNTRY_CODES;
    return COUNTRY_CODES.filter((country) =>
      country.name.toLowerCase().includes(query) || country.id.toLowerCase().includes(query) || country.code.includes(query),
    );
  }, [countryQuery]);

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
    <div className="flex w-full flex-col pb-[max(0.75rem,env(safe-area-inset-bottom))]">

      {/* 24/7 Free Support badge */}
      <div className="flex items-center justify-center">
        <span
          data-no-contrast-guard
          data-allow-dark-cta
          className="allow-white inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold text-white"
          style={{
            color: "#FFFFFF",
            WebkitTextFillColor: "#FFFFFF",
            backgroundImage: "var(--jj-emerald-ombre)",
            border: 0,
            boxShadow: "none",
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          Call our agent now · Free
        </span>

      </div>

      <div className="mt-4 text-center space-y-1">
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
          className="mt-4 flex flex-col gap-2.5 pb-1"
          data-jbj-form
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

          <div className="grid grid-cols-[138px_minmax(0,1fr)] gap-2 overflow-visible">
            <Popover open={countryOpen} onOpenChange={setCountryOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  data-no-contrast-guard
                  className="flex h-12 w-full items-center justify-between rounded-lg border border-[#B89555]/45 bg-[#FDFBF7] px-3 text-[13.5px] text-[#1A1A1A] outline-none transition hover:border-[#B89555] hover:bg-[#F7F2EA] focus:border-[#B89555] focus:bg-[#FDFBF7]"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-[18px] leading-none">{flagEmoji(selectedCountry.id)}</span>
                    <span className="font-medium tabular-nums">{selectedCountry.code}</span>
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-[#B89555]" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                sideOffset={8}
                data-no-contrast-guard
                className="z-[11000] w-[316px] rounded-xl border border-[#B89555]/50 bg-[#FDFBF7] p-2 text-[#1A1A1A] shadow-[0_18px_44px_rgba(26,26,26,0.18)]"
              >
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#B89555]" />
                  <input
                    value={countryQuery}
                    onChange={(e) => setCountryQuery(e.target.value)}
                    placeholder="Search country or code"
                    data-no-contrast-guard
                    className="h-10 w-full rounded-lg border border-[#B89555]/40 bg-[#FDFBF7] pl-9 pr-3 text-[13px] text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 outline-none focus:border-[#B89555]"
                  />
                </div>
                <div className="max-h-[260px] overflow-y-auto pr-1">
                  {filteredCountries.map((country) => (
                    <button
                      key={`${country.id}-${country.code}`}
                      type="button"
                      data-no-contrast-guard
                      onClick={() => {
                        setCountryId(country.id);
                        setCountryCode(country.code);
                        setCountryOpen(false);
                      }}
                      className="flex h-10 w-full items-center justify-between rounded-lg px-3 text-left text-[13px] text-[#1A1A1A] transition hover:bg-[#F7F2EA] hover:text-[#1A1A1A] focus:bg-[#F7F2EA] focus:text-[#1A1A1A] focus:outline-none"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="text-[17px] leading-none">{flagEmoji(country.id)}</span>
                        <span className="truncate text-[#1A1A1A]/75">{country.name}</span>
                        <span className="ml-auto font-medium tabular-nums">{country.code}</span>
                      </span>
                      {country.id === countryId && <Check className="h-3.5 w-3.5 text-[#B89555]" />}
                    </button>
                  ))}
                  {filteredCountries.length === 0 && <div className="px-3 py-4 text-center text-[12px] text-[#1A1A1A]/60">No matching country</div>}
                </div>
              </PopoverContent>
            </Popover>
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
            style={{ color: "#0EA5E9", WebkitTextFillColor: "#0EA5E9" }}
            className="mt-2 w-full h-12 rounded-lg border border-[#B89555]/70 bg-[#EFE6D6] text-[13.5px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition inline-flex items-center justify-center gap-2 hover:bg-[#F7F2EA] hover:border-[#B89555] hover:shadow-[0_0_24px_hsl(var(--gold)/0.22)] [&_svg]:!text-[#0EA5E9] [&_svg]:!stroke-[#0EA5E9]"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#0EA5E9", stroke: "#0EA5E9" }} /> : <ShieldCheck className="h-4 w-4" style={{ color: "#0EA5E9", stroke: "#0EA5E9" }} />}
            <span style={{ color: "#0EA5E9" }}>{submitting ? "Sending code…" : "Send verification code"}</span>
          </button>

          <p className="mt-2 text-[10.5px] text-[#1A1A1A]/70 text-center leading-snug px-2 pb-1">
            We'll only contact you about your enquiry. By continuing you accept our Privacy Policy.
          </p>
        </form>
      ) : (
        <div className="mt-4 flex flex-col gap-3 pb-1">
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
            className="mt-2 w-full h-12 rounded-lg border border-[#B89555]/70 bg-[#EFE6D6] text-[13.5px] font-semibold text-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed transition inline-flex items-center justify-center gap-2 hover:bg-[#F7F2EA] hover:text-[#1A1A1A] hover:border-[#B89555] hover:shadow-[0_0_24px_hsl(var(--gold)/0.22)]"
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

