import { Sparkles, Users, BriefcaseBusiness, MapPin, Headphones, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * PremiumCareersHero
 * Luxury hero for the /join (careers) page.
 * - Champagne gradient + faded JBJ monogram watermark
 * - Animated soft glow behind primary CTA
 * - Floating stat cards (broker ecosystem proof points)
 *
 * Strict palette: champagne surfaces, gold hairlines, ink text.
 * Navy (#0A0A0A) reserved for primary CTA only.
 */
export default function PremiumCareersHero() {
  const stats: { icon: any; label: string; value: string }[] = [
    { icon: Users, label: "Brokers in network", value: "5,000+" },
    { icon: BriefcaseBusiness, label: "Broker CRM", value: "24/7" },
    { icon: MapPin, label: "Dubai luxury market", value: "Tier-1" },
    { icon: Headphones, label: "Support", value: "24/7" },
    { icon: Building2, label: "Developer network", value: "Premium" },
  ];

  return (
    <section
      data-careers-hero
      className="relative overflow-hidden px-4 sm:px-6 lg:px-10 pt-28 pb-16 md:pt-32 md:pb-20"
      aria-labelledby="careers-hero-title"
    >
      {/* Soft luxury gradient base */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, #FFFDF8 0%, #FDFBF7 35%, #F7F2EA 70%, #EFE6D6 100%)",
        }}
      />

      {/* Faded JBJ monogram watermark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
      >
        <span
          className="select-none font-semibold tracking-[0.3em]"
          style={{
            fontSize: "clamp(180px, 28vw, 380px)",
            color: "#B89555",
            opacity: 0.05,
            lineHeight: 1,
            letterSpacing: "0.18em",
          }}
        >
          JBJ
        </span>
      </div>

      {/* Lighting wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 -z-10 h-[520px] w-[820px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(184,149,85,0.18), rgba(184,149,85,0) 70%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto text-center">
        {/* Pill eyebrow */}
        <div
          data-surface="emerald"
          data-allow-dark-cta
          data-no-contrast-guard
          className="jj-cta-emerald jj-pill-emerald-metallic allow-white inline-flex items-center gap-2 rounded-full border border-[#B89555]/70 px-3.5 py-1 mb-7 shadow-[0_4px_18px_-8px_rgba(6,78,59,0.45)]"
          style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
        >
          <Sparkles className="w-3 h-3 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
          <span className="allow-white text-[11px] font-bold tracking-[0.22em] uppercase" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
            Careers · JBJ Global Real Estate
          </span>
        </div>

        <h1
          id="careers-hero-title"
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-[#1A1A1A] leading-[1.05]"
        >
          Build your career at the<br />
          <span className="relative inline-block">
            <span className="relative z-10 text-[#0A0A0A]">
              luxury frontier of Dubai
            </span>
            <span
              aria-hidden
              className="absolute left-0 right-0 -bottom-1 h-[3px] rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, #B89555 50%, transparent 100%)",
              }}
            />
          </span>
        </h1>

        <div className="mx-auto mt-5 h-[2px] w-20 rounded-full bg-[#B89555]" />

        <p
          data-no-contrast-guard
          className="allow-white mt-6 max-w-2xl mx-auto text-base md:text-lg leading-relaxed rounded-xl px-5 py-3 bg-[#0A0A0A] border border-[#B89555]/60 shadow-[0_10px_30px_-18px_rgba(10,10,10,0.55)]"
          style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
        >
          Join a premium brokerage ecosystem trusted by elite consultants,
          institutional developers, and global investors. Apply in minutes — our
          executive assistant Jessica handles the rest.
        </p>

        {/* CTA cluster with animated glow */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <div className="relative">
            {/* Soft animated glow ring */}
            <span
              aria-hidden
              className="absolute inset-0 -m-1 rounded-xl bg-[#0A0A0A]/35 blur-xl careers-hero-glow"
            />
            <a
              href="#open-positions"
              data-surface="emerald"
              data-allow-dark-cta
              data-no-contrast-guard
              className="jj-cta-emerald jj-pill-emerald-metallic relative inline-flex items-center justify-center gap-2 rounded-xl px-7 h-12 font-semibold border border-[#B89555]/70 active:translate-y-[1px] transition-all"
            >
              <span>Explore Open Positions</span>
            </a>

          </div>

          <Link
            to="/hr-agent"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-7 h-12 font-semibold text-[#1A1A1A] bg-[#FDFBF7] border border-[#B89555] hover:bg-[#F7F2EA] transition-colors"
          >
            <BriefcaseBusiness className="w-4 h-4 text-[#1A1A1A]" />
            Chat with Jessica
          </Link>
        </div>

        {/* Floating stat strip */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 max-w-5xl mx-auto">
          {stats.map(({ icon: Icon, label, value }, i) => (
            <div
              key={label}
              className="group relative rounded-2xl border-2 border-[#B89555] bg-[#FDFBF7]/95 backdrop-blur-sm px-4 py-5 text-left transition-all hover:-translate-y-[2px] hover:shadow-[0_18px_40px_-22px_rgba(184,149,85,0.55)] hover:border-[#B89555] shadow-[0_2px_0_rgba(184,149,85,0.18),0_10px_28px_-18px_rgba(10,10,10,0.25)]"
              style={{
                animation: `careersHeroFloat 6s ease-in-out ${i * 0.4}s infinite`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  data-surface="emerald"
                  data-no-contrast-guard
                  className="jj-icon-tile-emerald jj-pill-emerald-metallic allow-white inline-flex items-center justify-center w-9 h-9 rounded-full border border-[#B89555]/60 shadow-[0_2px_6px_-2px_rgba(10,10,10,0.35)]"
                >
                  <Icon className="w-[18px] h-[18px] allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} strokeWidth={2.25} />
                </div>
                <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#1A1A1A]/75">
                  {label}
                </p>
              </div>
              <p className="text-xl md:text-2xl font-semibold text-[#0A0A0A] tracking-tight">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
