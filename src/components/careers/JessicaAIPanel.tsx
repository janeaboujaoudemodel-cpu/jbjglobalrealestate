import { Link } from "react-router-dom";
import { MessageCircle, ShieldCheck, UserCheck } from "lucide-react";
import jessicaPortrait from "@/assets/team/jessica-interview-consultant.png";

/**
 * JessicaAIPanel
 * Premium human interview consultant panel on the careers page.
 */
export default function JessicaAIPanel() {
  return (
    <section
      aria-labelledby="jessica-panel-title"
      className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-0 mt-2 mb-10"
      data-jessica-consultant-panel
    >
      <div
        className="group relative overflow-hidden rounded-[24px] border border-[#B89555]/55 bg-[linear-gradient(135deg,#FFFDF8_0%,#FDFBF7_44%,#F7F2EA_100%)] shadow-[0_18px_44px_-28px_rgba(10,10,10,0.22)] transition-all hover:shadow-[0_22px_50px_-22px_rgba(10,10,10,0.32)] hover:-translate-y-[1px]"
        data-surface="champagne"
      >
        {/* Soft glow corner */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity"
          style={{
            background:
              "radial-gradient(closest-side, rgba(184,149,85,0.20), rgba(184,149,85,0) 70%)",
          }}
        />

        <div className="relative grid md:grid-cols-[auto,1fr,auto] items-center gap-6 p-6 md:p-7">
          <div className="relative flex-shrink-0 mx-auto md:mx-0">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-[#B89555]/25 careers-pulse"
            />
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-[#B89555]/70 bg-[#F7F2EA] shadow-[0_14px_26px_-16px_rgba(26,26,26,0.45),inset_0_1px_0_rgba(255,255,255,0.75)]">
              <img
                src={jessicaPortrait}
                alt="Jessica, interview consultant"
                width={160}
                height={160}
                loading="lazy"
                className="h-full w-full object-cover object-center"
              />
            </div>
            <span className="absolute bottom-1 right-1 inline-flex items-center justify-center">
              <span className="absolute inline-flex h-3 w-3 rounded-full jj-surface-emerald opacity-70 animate-ping" />
              <span className="relative inline-flex h-3 w-3 rounded-full jj-surface-emerald border-2 border-[#FDFBF7]" />
            </span>
          </div>

          {/* Copy + badges */}
          <div className="text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
              <h3
                id="jessica-panel-title"
              className="text-xl md:text-2xl font-semibold text-[#1A1A1A] tracking-tight"
              >
                Jessica Interview Consultant
              </h3>
              <span className="inline-flex min-h-[28px] items-center gap-1.5 rounded-full border border-[#B89555]/55 bg-[#F7F2EA] px-3 py-1 text-[10px] font-bold tracking-[0.12em] uppercase text-[#1A1A1A]">
                <UserCheck className="w-3 h-3 text-[#B89555]" />
                Interview Assistant
              </span>
            </div>

            <p className="text-sm md:text-[15px] text-[#1A1A1A]/80 leading-relaxed max-w-xl">
              Your dedicated interview consultant. Jessica reviews your CV, qualifies
              your experience, and guides the first interview with a polished,
              confidential process.
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-[11px] font-medium">
              <span className="inline-flex items-center gap-1.5 text-[#1A1A1A]/75">
                <span className="w-1.5 h-1.5 rounded-full jj-surface-emerald" />
                Typically replies instantly
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#1A1A1A]/75">
                <UserCheck className="w-3 h-3 text-[#B89555]" />
                Human interview support
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#1A1A1A]/75">
                <ShieldCheck className="w-3 h-3 text-[#B89555]" />
                Confidential & secure
              </span>
            </div>
          </div>

          {/* Primary CTA */}
          <div className="flex flex-col items-center md:items-end gap-2">
            <Link
              to="/hr-agent"
              data-surface="emerald"
              data-allow-dark-cta
              data-no-contrast-guard
              data-careers-primary-pill
              className="jj-cta-emerald jj-pill-emerald-metallic animated-border inline-flex items-center justify-center gap-2 rounded-xl px-5 h-11 font-semibold whitespace-nowrap border border-[#B89555]/70 active:translate-y-[1px] transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Start Conversation</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
