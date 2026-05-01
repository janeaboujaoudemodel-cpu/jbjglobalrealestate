import { motion } from "framer-motion";
import { T } from "@/components/ui/T";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
import { Globe2, ShieldCheck, Sparkles, Users } from "lucide-react";

/**
 * Why Dubai — Capital of Global Investors
 * Premium, compact champagne section. No video background.
 * Four high-contrast stat cards with semantic icons.
 */

const stats = [
  { value: "0%",   label: "Income Tax",    icon: Sparkles },
  { value: "10Y",  label: "Golden Visa",   icon: ShieldCheck },
  { value: "#1",   label: "Safety Rank",   icon: Globe2 },
  { value: "200+", label: "Nationalities", icon: Users },
];

export default function WhyDubaiCapitalSection() {
  return (
    <section className="relative bg-[#FDFBF7] py-14 md:py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Subtle champagne radial accent — no imagery, no video */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 80% 0%, rgba(184,149,85,0.10) 0%, transparent 55%), radial-gradient(ellipse at 0% 100%, rgba(184,149,85,0.06) 0%, transparent 50%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F7F2EA] border border-[#B89555]/40 text-[10px] uppercase tracking-[0.22em] font-semibold text-[#1A1A1A]">
            <T>Global Investment Hub</T>
          </span>

          <h2 className="mt-4 text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-[#1A1A1A] tracking-tight">
            <T>Why Dubai Became the Capital of</T>{" "}
            <span className="text-[#B89555]"><T>Global Investors</T></span>
          </h2>

          <p className="mt-3 text-sm md:text-base text-[#3A2D1D] leading-relaxed">
            <T>
              Strategic location, world-class infrastructure, and long-term
              government execution make Dubai the most investable city in the region.
            </T>
          </p>
        </motion.div>

        {/* Four premium stat cards — solid champagne with gold accent */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
          {stats.map((s, index) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.07, duration: 0.4 }}
                className="group relative rounded-2xl bg-[#F7F2EA] border border-[#B89555]/40 p-4 md:p-5 text-center shadow-sm hover:shadow-md hover:border-[#B89555]/70 transition-all duration-300"
              >
                <div className="mx-auto mb-2.5 w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center">
                  <Icon className="w-4 h-4 md:w-5 md:h-5 text-[#B89555]" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-[#1A1A1A] leading-none tabular-nums">
                  {s.value}
                </div>
                <div className="mt-1.5 text-[10px] md:text-[11px] uppercase tracking-[0.14em] font-semibold text-[#5A4A2E] whitespace-nowrap">
                  <T>{s.label}</T>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <PremiumHeroButton href="/guides/investment" size="default">
            <T>Explore Investments</T>
          </PremiumHeroButton>
        </div>
      </div>
    </section>
  );
}
