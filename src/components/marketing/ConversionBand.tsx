import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { CONVERSION_HEADLINES, CONVERSION_SUB } from "@/config/premiumActions";

/**
 * <ConversionBand /> — site-wide "Create your free account" band. Renders
 * only for anonymous visitors. Rotates through headline copy every 6s.
 * Hidden on auth/access/signup pages to avoid loops.
 */
const HIDDEN_PREFIXES = ["/auth", "/access", "/signup", "/welcome", "/reset-password", "/oauth", "/.lovable"];

export default function ConversionBand() {
  const { user } = useAuth();
  const location = useLocation();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (user) return;
    const t = setInterval(
      () => setIdx((i) => (i + 1) % CONVERSION_HEADLINES.length),
      6000,
    );
    return () => clearInterval(t);
  }, [user]);

  if (user) return null;
  if (HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p))) return null;

  const headline = CONVERSION_HEADLINES[idx];
  const nextUrl = `/auth?mode=signup&next=${encodeURIComponent(
    location.pathname + location.search,
  )}`;

  return (
    <section
      className="relative w-full overflow-hidden"
      data-jbj-conversion-band=""
      aria-label="Create a free JBJ account"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#064E3B] via-[#032A1E] to-[#000000]" />
      <div className="absolute inset-0 opacity-25 [background:radial-gradient(60%_80%_at_20%_10%,rgba(184,149,85,0.28),transparent),radial-gradient(50%_60%_at_85%_90%,rgba(184,149,85,0.22),transparent)]" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-12 py-14 lg:py-16 grid gap-8 lg:grid-cols-[1fr_auto] items-center text-white">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] tracking-[0.36em] uppercase text-[#D4B87A]">
            <Sparkles className="w-3 h-3" /> The JBJ ecosystem
          </div>
          <h2
            key={idx}
            className="mt-3 font-serif text-3xl md:text-4xl lg:text-[42px] leading-[1.08] max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            {headline}
          </h2>
          <p className="mt-3 text-white/75 text-sm md:text-base max-w-2xl">
            {CONVERSION_SUB}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:min-w-[240px]">
          <Link
            to={nextUrl}
            className="group inline-flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold tracking-wide text-[#032A1E] bg-gradient-to-br from-[#D4B87A] to-[#B89555] hover:from-[#E9D9A8] hover:to-[#D4B87A] shadow-[0_10px_24px_-12px_rgba(184,149,85,0.65)] transition"
          >
            Create free account
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            to="/auth?mode=signin"
            className="inline-flex items-center justify-center rounded-md px-6 py-3.5 text-sm font-medium text-white border border-white/30 hover:border-white/60 hover:bg-white/5 transition"
          >
            Sign in
          </Link>
          <div className="text-[11px] text-center text-white/55">
            Free forever · No credit card
          </div>
        </div>
      </div>
    </section>
  );
}
