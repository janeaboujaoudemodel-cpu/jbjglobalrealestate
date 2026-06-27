import { Link } from "react-router-dom";
import { Bot, Mic, MessageCircle, Sparkles, ShieldCheck } from "lucide-react";

/**
 * JessicaAIPanel
 * Premium "live concierge" panel on the careers page.
 * - Animated avatar with online pulse
 * - "Typically replies instantly" + "Voice interview available" + AI interview assistant badge
 * - Subtle hover glow
 *
 * Brand: "Jessica" is the HR assistant persona. Champagne base, navy CTA only.
 */
export default function JessicaAIPanel() {
  return (
    <section
      aria-labelledby="jessica-panel-title"
      className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-0 mt-2 mb-10"
    >
      <div
        className="group relative overflow-hidden rounded-2xl border border-[#B89555]/55 bg-[#FDFBF7] shadow-[0_18px_44px_-28px_rgba(10,10,10,0.22)] transition-all hover:shadow-[0_22px_50px_-22px_rgba(10,10,10,0.32)] hover:-translate-y-[1px]"
      >
        {/* Soft glow corner */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity"
          style={{
            background:
              "radial-gradient(closest-side, rgba(10,10,10,0.18), rgba(10,10,10,0) 70%)",
          }}
        />

        <div className="relative grid md:grid-cols-[auto,1fr,auto] items-center gap-6 p-6 md:p-7">
          {/* Avatar with pulse */}
          <div className="relative flex-shrink-0 mx-auto md:mx-0">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-[#0A0A0A]/30 careers-pulse"
            />
            <div
              data-no-contrast-guard
              className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#0A0A0A] to-[#1F1F1F] border border-[#B89555]/70 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_10px_24px_-12px_rgba(10,10,10,0.55)]"
            >
              <Bot
                className="w-10 h-10 allow-white"
                style={{ color: "#FFFFFF", stroke: "#FFFFFF" }}
              />
            </div>
            {/* Online indicator */}
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
                Meet Jessica
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#B89555]/55 bg-[#F7F2EA] px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase text-[#1A1A1A]">
                <Sparkles className="w-3 h-3 text-[#B89555]" />
                AI Interview Assistant
              </span>
            </div>

            <p className="text-sm md:text-[15px] text-[#1A1A1A]/80 leading-relaxed max-w-xl">
              Your dedicated career concierge. Jessica reviews your CV, qualifies
              your experience, and conducts the first interview — on your schedule.
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-[11px] font-medium">
              <span className="inline-flex items-center gap-1.5 text-[#1A1A1A]/75">
                <span className="w-1.5 h-1.5 rounded-full jj-surface-emerald" />
                Typically replies instantly
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#1A1A1A]/75">
                <Mic className="w-3 h-3 text-[#B89555]" />
                Voice interview available
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
              className="jj-cta-emerald jj-pill-emerald-metallic inline-flex items-center justify-center gap-2 rounded-xl px-5 h-11 font-semibold whitespace-nowrap border border-[#B89555]/70 active:translate-y-[1px] transition-all"
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
