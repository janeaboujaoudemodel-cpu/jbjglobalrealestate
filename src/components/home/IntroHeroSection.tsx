import { motion } from "framer-motion";
import { Building2, Brain, Briefcase, ChevronDown } from "lucide-react";

const pillars = [
  {
    icon: Building2,
    title: "Premium Marketplace",
    desc: "2,400+ Off-Plan & Resale Properties across Dubai & UAE",
  },
  {
    icon: Brain,
    title: "AI-Powered Tools",
    desc: "Smart Search, Analysis & Investment Intelligence",
  },
  {
    icon: Briefcase,
    title: "Brokerage Services",
    desc: "Licensed Advisors, Market Reports & Expert Guides",
  },
];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 * i, duration: 0.6, ease: "easeOut" },
  }),
};

const IntroHeroSection = () => {
  return (
    <section className="relative w-full pt-[88px] md:pt-[96px] bg-gradient-to-b from-[hsl(38,35%,10%)] via-[hsl(36,30%,8%)] to-black overflow-hidden">
      {/* Ambient effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[88px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[hsl(var(--gold)/0.06)] rounded-full blur-[150px]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(hsl(var(--gold) / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--gold) / 0.4) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
      </div>

      <div className="relative z-10 w-full px-4 py-12 sm:py-16 md:py-20">
        <div className="max-w-[1600px] mx-auto">
          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-8 sm:mb-12"
          >
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[hsl(var(--gold)/0.7)] mb-3">
              Dubai's Trusted Real Estate Technology Platform
            </p>
            <h2
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15]"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #E8DCC8 40%, #C8A766 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Your Gateway to Dubai's
              <br className="hidden sm:block" />
              <span className="block sm:inline"> Finest Real Estate</span>
            </h2>
          </motion.div>

          {/* Three Pillars — edge-to-edge sharp corners per visual standard */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 sm:gap-px max-w-5xl mx-auto mb-8 sm:mb-12 border border-[hsl(var(--gold)/0.2)] rounded-none overflow-hidden">
            {pillars.map((pillar, i) => (
              <motion.div
                key={pillar.title}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="group relative bg-gradient-to-br from-[hsl(38,30%,14%)] to-[hsl(36,25%,10%)] p-6 sm:p-8 text-center hover:bg-[hsl(38,30%,16%)] transition-all duration-300 border-b sm:border-b-0 sm:border-r last:border-r-0 last:border-b-0 border-[hsl(var(--gold)/0.15)]"
              >
                {/* Icon */}
                <div className="w-12 h-12 mx-auto mb-4 rounded-none bg-gradient-to-br from-[hsl(var(--gold)/0.15)] to-[hsl(var(--gold)/0.05)] border border-[hsl(var(--gold)/0.25)] flex items-center justify-center group-hover:shadow-[0_0_20px_hsl(var(--gold)/0.2)] transition-shadow">
                  <pillar.icon className="w-5 h-5 text-[hsl(var(--gold))]" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-white mb-2">
                  {pillar.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {pillar.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="flex flex-col items-center gap-1"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Explore</span>
            <ChevronDown className="w-4 h-4 text-[hsl(var(--gold)/0.5)] animate-bounce" />
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade into video hero */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-black" />
    </section>
  );
};

export default IntroHeroSection;
