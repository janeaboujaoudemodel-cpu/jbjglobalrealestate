import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ArrowRight, Check, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import CategoryStep from "@/components/signup/CategoryStep";
import CategoryFields from "@/components/signup/CategoryFields";
import CommonStep from "@/components/signup/CommonStep";
import { CATEGORIES, CrmCategory } from "@/components/signup/constants";
import { logAnalytics } from "@/lib/analytics";

const STEPS = ["Category", "Profile", "Account", "Verify"];

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<CrmCategory | null>(null);
  const [categoryData, setCategoryData] = useState<Record<string, any>>({});
  const [common, setCommon] = useState<Record<string, any>>({ preferred_language: "English" });
  const [services, setServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const canNext =
    (step === 0 && !!category) ||
    (step === 1 && !!category) ||
    step === 2 ||
    step === 3;

  const validateAccountStep = () => {
    if (!common.full_name || !common.email || !common.password || !common.phone) {
      toast.error("Please fill required account fields");
      return false;
    }
    if ((common.password || "").length < 8) {
      toast.error("Password must be at least 8 characters");
      return false;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(common.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const sendOtp = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-email-otp", {
        body: { email: (common.email as string).toLowerCase(), full_name: common.full_name },
      });
      const serverMsg = (data as any)?.error;
      if (error || serverMsg) throw new Error(serverMsg ?? error?.message ?? "Failed to send code");
      setOtpSent(true);
      toast.success(`Verification code sent to ${common.email}`);
      void logAnalytics("signup_otp_sent", { email_prefix: String(common.email).slice(0, 3) });
      // Start 45s resend cooldown
      setResendCooldown(45);
      const timer = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const goToVerify = async () => {
    if (!validateAccountStep()) return;
    setStep(3);
    if (!otpSent) await sendOtp();
  };

  const verifyAndRegister = async () => {
    if (!/^\d{6}$/.test(otp)) {
      toast.error("Enter the 6-digit code from your email");
      return;
    }
    if (!category) return;
    setLoading(true);
    try {
      // 1. Verify the OTP server-side
      const { data: vData, error: vErr } = await supabase.functions.invoke("verify-email-otp", {
        body: { email: (common.email as string).toLowerCase(), otp_code: otp },
      });
      const vMsg = (vData as any)?.error;
      if (vErr || vMsg || !(vData as any)?.verified) {
        throw new Error(vMsg ?? vErr?.message ?? "Invalid verification code");
      }
      setEmailVerified(true);
      void logAnalytics("signup_email_verified", {});

      // 2. Create the account now that email is proven
      const { data, error } = await supabase.functions.invoke("register-user", {
        body: {
          category,
          category_data: categoryData,
          common: { ...common, services },
          source_page: window.location.pathname,
        },
      });
      let serverMsg: string | undefined = (data as any)?.error;
      if (!serverMsg && error && (error as any).context) {
        try {
          const ctx = (error as any).context;
          if (typeof ctx.json === "function") {
            const parsed = await ctx.json();
            serverMsg = parsed?.error ?? parsed?.message;
          } else if (typeof ctx.text === "function") {
            const raw = await ctx.text();
            try { serverMsg = JSON.parse(raw)?.error; } catch { serverMsg = raw; }
          }
        } catch { /* ignore */ }
      }
      if (error || serverMsg) {
        const msg = serverMsg ?? error?.message ?? "Registration failed";
        const friendly = /already been registered|already exists|duplicate/i.test(msg)
          ? "An account with this email already exists. Please sign in instead."
          : msg;
        throw new Error(friendly);
      }

      // 3. Sign the user in
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: (common.email as string).toLowerCase(),
        password: common.password,
      });
      if (signInErr) throw signInErr;

      void logAnalytics("signup_completed", { category });
      toast.success("Welcome to JBJ Global Real Estate");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A]">
      <header className="border-b border-[#B89555]/20 bg-white/70 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/welcome" className="text-[11px] tracking-[0.28em] uppercase text-[#0d3a2b] font-serif">
            JBJ Global Real Estate
          </Link>
          <Link to="/welcome" className="text-xs text-[#1A1A1A]/60 hover:text-[#0d3a2b]">
            Back to site
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8 sm:mb-10">
          <ol className="flex items-center gap-2 sm:gap-4">
            {STEPS.map((label, i) => (
              <li key={label} className="flex-1 flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border transition-all",
                    i <= step
                      ? "bg-[#064E3B] border-[#064E3B] text-white shadow-[0_6px_16px_-6px_rgba(6,78,59,0.55)]"
                      : "bg-[#064E3B]/25 border-[#064E3B]/40 text-white"
                  )}
                >
                  {i < step ? <Check className="w-4 h-4 text-white" /> : <span className="text-white">{i + 1}</span>}
                </div>
                <div className={cn(
                  "text-[11px] tracking-[0.18em] uppercase hidden sm:block font-semibold",
                  i <= step ? "text-[#064E3B]" : "text-[#1A1A1A]/45"
                )}>{label}</div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    "flex-1 h-[2px] rounded-full",
                    i < step ? "bg-[#064E3B]" : "bg-[#064E3B]/20"
                  )} />
                )}
              </li>
            ))}
          </ol>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (loading) return;
            if (step === 2) goToVerify();
            else if (step === 3) verifyAndRegister();
          }}
          autoComplete="on"
          data-jbj-signup
          className="animate-fade-in"
        >
          {step !== 2 && (
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={common.email || ""}
              readOnly
              tabIndex={-1}
              aria-hidden="true"
              className="sr-only"
            />
          )}

          <div className="bg-white border border-[#B89555]/30 rounded-md p-5 sm:p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(6,78,59,0.10)]">
            {step === 0 && <CategoryStep value={category} onChange={setCategory} />}
            {step === 1 && category && (
              <CategoryFields
                category={category}
                data={categoryData}
                onChange={(p) => setCategoryData((prev) => ({ ...prev, ...p }))}
              />
            )}
            {step === 2 && (
              <CommonStep
                data={common}
                onChange={(p) => setCommon((prev) => ({ ...prev, ...p }))}
                services={services}
                setServices={setServices}
              />
            )}
            {step === 3 && (
              <div className="grid gap-6 py-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#064E3B]/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-[#064E3B]" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl text-[#0d3a2b]">Verify your email</h2>
                    <p className="text-sm text-[#1A1A1A]/70 mt-1">
                      We just sent a 6-digit code to{" "}
                      <span className="font-medium text-[#0d3a2b]">{common.email}</span>.
                      Enter it below to confirm your address and finish creating your account.
                    </p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-[11px] tracking-[0.2em] uppercase text-[#1A1A1A]/70 font-semibold">
                    Verification code
                  </label>
                  <Input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoComplete="one-time-code"
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="text-center text-2xl tracking-[0.5em] font-mono h-14 border-[#B89555]/40 focus-visible:ring-[#064E3B]"
                    autoFocus
                  />
                  <p className="text-xs text-[#1A1A1A]/60">
                    Code expires in 10 minutes. Check your spam folder if you don't see it.
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || loading}
                    onClick={sendOtp}
                    className="text-[#0d3a2b] underline disabled:opacity-40 disabled:no-underline"
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-[#1A1A1A]/60 hover:text-[#0d3a2b]"
                  >
                    Change email
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              disabled={step === 0 || loading || (step === 3 && emailVerified)}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            {step < 2 && (
              <Button
                type="button"
                disabled={!canNext}
                onClick={() => setStep((s) => Math.min(3, s + 1))}
                className="bg-[#064E3B] hover:bg-[#053929] text-white transition-all active:scale-[0.98]"
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            {step === 2 && (
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#064E3B] hover:bg-[#053929] text-white transition-all active:scale-[0.98] shadow-[0_10px_24px_-12px_rgba(6,78,59,0.55)]"
              >
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending code…</> : <>Send verification code <ArrowRight className="w-4 h-4 ml-2" /></>}
              </Button>
            )}
            {step === 3 && (
              <Button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="bg-[#064E3B] hover:bg-[#053929] text-white transition-all active:scale-[0.98] shadow-[0_10px_24px_-12px_rgba(6,78,59,0.55)]"
              >
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying…</> : "Verify & create account"}
              </Button>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-[#1A1A1A]/60">
          Already registered?{" "}
          <Link to="/auth" className="text-[#0d3a2b] underline">Sign in</Link>
        </p>

        {category && step > 0 && (
          <p className="mt-2 text-center text-[11px] tracking-[0.18em] uppercase text-[#1A1A1A]/50">
            Registering as: {CATEGORIES.find((c) => c.value === category)?.label}
          </p>
        )}
      </main>
    </div>
  );
}
