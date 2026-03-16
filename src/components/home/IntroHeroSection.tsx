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
    <section className="relative w-full bg-gradient-to-b from-black via-zinc-950 to-black overflow-hidden">
      {/* Ambient effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold/5 rounded-full blur-[150px]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(hsl(var(--gold) / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--gold) / 0.4) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 sm:py-16 md:py-20">
        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-8 sm:mb-12"
        >
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-gold/70 mb-3">
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

        {/* Three Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 max-w-4xl mx-auto mb-8 sm:mb-12">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="group relative bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 backdrop-blur-sm rounded-2xl border border-gold/15 p-5 sm:p-6 text-center hover:border-gold/30 transition-all duration-300"
              style={{
                boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 hsl(var(--gold) / 0.08)",
              }}
            >
              {/* Icon */}
              <div className="w-11 h-11 mx-auto mb-3 rounded-xl bg-gradient-to-br from-gold/15 to-gold/5 border border-gold/20 flex items-center justify-center group-hover:shadow-[0_0_20px_hsl(var(--gold)/0.2)] transition-shadow">
                <pillar.icon className="w-5 h-5 text-gold" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-white mb-1.5">
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
          <ChevronDown className="w-4 h-4 text-gold/50 animate-bounce" />
        </motion.div>
      </div>

      {/* Bottom gradient fade into video hero */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-black" />
    </section>
  );
};

export default IntroHeroSection;
