import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Sparkles, ArrowRight } from "lucide-react";
import {
  subscribePremiumPrompt,
  type PremiumPromptPayload,
} from "@/components/premium/premiumPromptBus";
import { CONVERSION_SUB } from "@/config/premiumActions";
import { logAnalytics } from "@/lib/analytics";

/**
 * Global mount for the "Create your free account" prompt. Rendered once at
 * the app root. Any `useRequireAuth()` call from anywhere opens this modal.
 */
export default function PremiumPromptRoot() {
  const [payload, setPayload] = useState<PremiumPromptPayload | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = subscribePremiumPrompt((p) => {
      setPayload(p);
      logAnalytics("auth_prompt_shown", { action: p.actionKey });
    });
    return () => {
      unsub();
    };
  }, []);

  if (!payload) return null;

  const close = () => setPayload(null);
  const goAuth = (mode: "signup" | "signin") => {
    logAnalytics(
      mode === "signup" ? "auth_prompt_signup" : "auth_prompt_signin",
      { action: payload.actionKey },
    );
    navigate(
      `/auth?mode=${mode}&next=${encodeURIComponent(payload.next)}`,
    );
    close();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={close}
    >
      <div
        className="relative w-full max-w-md rounded-lg overflow-hidden shadow-2xl bg-[#FDFBF7] border border-[#B89555]/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Emerald hero band */}
        <div className="relative px-7 pt-8 pb-6 bg-gradient-to-br from-[#064E3B] via-[#032A1E] to-[#000000] text-white">
          <button
            aria-label="Close"
            onClick={close}
            className="absolute top-3 right-3 rounded-full p-1.5 text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="inline-flex items-center gap-2 text-[10px] tracking-[0.32em] uppercase text-[#D4B87A]">
            <Sparkles className="w-3 h-3" />
            Members only
          </div>
          <h2 className="mt-3 font-serif text-2xl leading-tight">
            Create your free account to&nbsp;
            <span className="italic text-[#D4B87A]">{payload.actionLabel}</span>
          </h2>
          <p className="mt-2 text-sm text-white/75 leading-relaxed">
            {CONVERSION_SUB}
          </p>
        </div>

        <div className="px-7 py-5 space-y-3">
          <button
            onClick={() => goAuth("signup")}
            className="group w-full inline-flex items-center justify-center gap-2 rounded-md px-5 py-3.5 text-sm font-semibold tracking-wide text-white bg-gradient-to-br from-[#064E3B] to-[#032A1E] shadow-[0_10px_24px_-12px_rgba(6,78,59,0.7)] hover:-translate-y-0.5 transition"
          >
            Create free account in 30 seconds
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={() => goAuth("signin")}
            className="w-full inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-medium text-[#0d3a2b] bg-white border border-[#B89555]/40 hover:border-[#064E3B]"
          >
            I already have an account — sign in
          </button>
          <div className="text-[11px] text-center text-[#1A1A1A]/55 pt-1">
            Free forever · No credit card · Cancel anytime
          </div>
        </div>
      </div>
    </div>
  );
}
