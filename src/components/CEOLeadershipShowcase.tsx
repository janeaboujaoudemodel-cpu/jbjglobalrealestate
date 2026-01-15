import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Users, Building2, Globe, Languages } from "lucide-react";
// Approved CEO landscape photo (executive office with Lebanese & UAE flags) - LOCKED v6
import ceoLandscapeFlags from "@/assets/ceo/jane-ceo-executive-office-final-v6.jpg";
import AnimatedCounter from "@/components/AnimatedCounter";
import { useTeamMetrics } from "@/hooks/useTeamMetrics";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const CEOLeadershipShowcase = () => {
  const metrics = useTeamMetrics();

  return (
    <section id="ceo-showcase" className="py-20 border-t border-zinc-800 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="max-w-6xl mx-auto"
        >
          {/* Section Header */}
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <Badge className="bg-gold/15 text-gold border-gold/30 px-4 py-1.5 mb-6">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Our Vision
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #CBA64B 0%, #E8D5A3 50%, #CBA64B 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Excellence in Every Detail
              </span>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              At JBJ Global Real Estate, we're committed to delivering exceptional
              service through a world-class team of professionals.
            </p>
          </motion.div>

          {/* CEO Landscape Photo with Flags - FULL WIDTH - Only Name & Title at bottom, no duplicate labels */}
          <motion.div
            variants={fadeInUp}
            className="relative rounded-2xl overflow-hidden mb-12 border-2 border-gold/30"
          >
            <div className="relative w-full">
              {/* Mobile: use object-contain to show full image with flags visible */}
              {/* Desktop: use object-cover for better visual */}
              <img
                src={ceoLandscapeFlags}
                alt="Jane Abou Jaoude - Founder & CEO at JBJ Global Real Estate with Lebanese and UAE flags"
                className="w-full h-auto min-h-[200px] sm:min-h-[300px] md:min-h-[400px] object-contain md:object-cover bg-zinc-900"
              />
              {/* Overlay with name & title at bottom center only - no duplicate labels */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 sm:p-6 md:p-10">
                <div className="text-center">
                  <h3 className="text-white text-xl sm:text-2xl md:text-5xl font-bold mb-1 sm:mb-2">Jane Abou Jaoude</h3>
                  <p
                    className="text-lg sm:text-xl md:text-3xl font-semibold"
                    style={{
                      background: "linear-gradient(135deg, #CBA64B 0%, #E8D5A3 50%, #CBA64B 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Founder & CEO
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Company Stats - Animated Counters with Real Metrics */}
          <motion.div
            variants={fadeInUp}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
          >
            <div className="text-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-gold/40 transition-all duration-300 hover:scale-[1.02]">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-gold" />
              </div>
              <p className="text-2xl font-bold text-gold mb-1">
                <AnimatedCounter end={metrics.totalMembers} suffix="+" duration={2500} />
              </p>
              <p className="text-zinc-500 text-sm">Team Members</p>
            </div>
            <div className="text-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-gold/40 transition-all duration-300 hover:scale-[1.02]">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6 text-gold" />
              </div>
              <p className="text-2xl font-bold text-gold mb-1">
                <AnimatedCounter end={metrics.totalDepartments} duration={2000} />
              </p>
              <p className="text-zinc-500 text-sm">Departments</p>
            </div>
            <div className="text-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-gold/40 transition-all duration-300 hover:scale-[1.02]">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Languages className="w-6 h-6 text-gold" />
              </div>
              <p className="text-2xl font-bold text-gold mb-1">
                <AnimatedCounter end={metrics.totalLanguages} suffix="+" duration={2200} />
              </p>
              <p className="text-zinc-500 text-sm">Languages Spoken</p>
            </div>
            <div className="text-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-gold/40 transition-all duration-300 hover:scale-[1.02]">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Globe className="w-6 h-6 text-gold" />
              </div>
              <p className="text-2xl font-bold text-gold mb-1">
                <AnimatedCounter end={metrics.totalNationalities} suffix="+" duration={2300} />
              </p>
              <p className="text-zinc-500 text-sm">Nationalities</p>
            </div>
          </motion.div>

          {/* Leadership Quote */}
          <motion.div
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-6xl text-gold/20">"</div>
              <p className="text-xl md:text-2xl text-zinc-300 italic leading-relaxed pt-8">
                Innovation and excellence are not just goals—they are the foundation
                of everything we build. At JBJ Global Real Estate, we're crafting futures and shaping skylines.
              </p>
              <p className="mt-6 text-gold font-semibold">— Jane Abou Jaoude</p>
              <p className="text-zinc-500 text-sm">Founder & CEO</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CEOLeadershipShowcase;
