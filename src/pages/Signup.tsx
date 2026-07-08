import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import CategoryStep from "@/components/signup/CategoryStep";
import CategoryFields from "@/components/signup/CategoryFields";
import CommonStep from "@/components/signup/CommonStep";
import { CATEGORIES, CrmCategory } from "@/components/signup/constants";

const STEPS = ["Category", "Profile", "Account"];

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<CrmCategory | null>(null);
  const [categoryData, setCategoryData] = useState<Record<string, any>>({});
  const [common, setCommon] = useState<Record<string, any>>({ preferred_language: "English" });
  const [services, setServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const canNext =
    (step === 0 && !!category) ||
    (step === 1 && !!category) ||
    step === 2;

  const submit = async () => {
    if (!category) return;
    if (!common.full_name || !common.email || !common.password || !common.phone) {
      toast.error("Please fill required account fields");
      return;
    }
    if ((common.password || "").length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("register-user", {
        body: {
          category,
          category_data: categoryData,
          common: { ...common, services },
          source_page: window.location.pathname,
        },
      });
      if (error || (data && (data as any).error)) {
        throw new Error((data as any)?.error ?? error?.message ?? "Registration failed");
      }
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: (common.email as string).toLowerCase(),
        password: common.password,
      });
      if (signInErr) throw signInErr;
      toast.success("Welcome to JBJ Global");
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
        {/* progress */}
        <div className="mb-8 sm:mb-10">
          <ol className="flex items-center gap-2 sm:gap-4">
            {STEPS.map((label, i) => (
              <li key={label} className="flex-1 flex items-center gap-2">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border transition-colors",
                    i < step
                      ? "bg-[#064E3B] border-[#064E3B] text-white"
                      : i === step
                      ? "bg-white border-[#064E3B] text-[#064E3B]"
                      : "bg-white border-[#B89555]/40 text-[#1A1A1A]/40"
                  )}
                >
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <div className={cn(
                  "text-[11px] tracking-[0.18em] uppercase hidden sm:block",
                  i === step ? "text-[#0d3a2b]" : "text-[#1A1A1A]/50"
                )}>{label}</div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    "flex-1 h-px",
                    i < step ? "bg-[#064E3B]" : "bg-[#B89555]/30"
                  )} />
                )}
              </li>
            ))}
          </ol>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); if (step === 2 && !loading) submit(); }}
          autoComplete="on"
          className="animate-fade-in"
        >
          {/* Hidden username hint so Chrome pairs email+password on the last step */}
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
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              disabled={step === 0 || loading}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            {step < 2 ? (
              <Button
                type="button"
                disabled={!canNext}
                onClick={() => setStep((s) => Math.min(2, s + 1))}
                className="bg-[#064E3B] hover:bg-[#053929] text-white transition-all active:scale-[0.98]"
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#064E3B] hover:bg-[#053929] text-white transition-all active:scale-[0.98] shadow-[0_10px_24px_-12px_rgba(6,78,59,0.55)]"
              >
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating…</> : "Create account"}
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
