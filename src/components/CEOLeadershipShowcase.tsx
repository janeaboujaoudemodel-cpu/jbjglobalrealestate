import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Users, Building2, Globe, Languages } from "lucide-react";
// Approved CEO landscape photo (executive office with Lebanese & UAE flags) - LOCKED v9 FINAL
import ceoLandscapeFlags from "@/assets/jane-ceo-executive-office-final-v9.jpg";
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
    <section id="ceo-showcase" className="py-20 relative overflow-hidden bg-[#1A1A1A]">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-[#EFE6D6]/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#EFE6D6]/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Active Champagne Layer - Wraps the entire section content */}
        <div className="bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-[#B89555]/30">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="max-w-6xl mx-auto"
          >
            {/* Section Header */}
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <Badge className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/40 px-4 py-1.5 mb-6 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Our Vision
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
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
              <p className="text-[#1A1A1A]/70 max-w-2xl mx-auto">
                At JBJ GLOBAL REAL ESTATE, we're committed to delivering exceptional
                service through a world-class team of professionals.
              </p>
            </motion.div>

            {/* CEO Landscape Photo with Flags - FULL WIDTH - Only Name & Title at bottom, no duplicate labels */}
            <motion.div
              variants={fadeInUp}
              className="relative rounded-2xl overflow-hidden mb-12 border-2 border-[#B89555]/40 shadow-lg"
            >
              <div className="relative w-full">
                {/* Mobile: use object-contain to show full image with flags visible */}
                {/* Desktop: use object-cover for better visual */}
                <img
                  src={ceoLandscapeFlags}
                  alt="Jane Bou Jaoude - Founder & CEO at JBJ Global Real Estate with Lebanese and UAE flags"
                  className="w-full h-auto min-h-[200px] sm:min-h-[300px] md:min-h-[400px] object-contain md:object-cover bg-[#FDFBF7]"
                 loading="lazy" decoding="async" />
                {/* Overlay with name & title at bottom center only - no duplicate labels */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 sm:p-6 md:p-10">
                  <div className="text-center">
                    <h3 className="text-white text-xl sm:text-2xl md:text-5xl font-bold mb-1 sm:mb-2">Jane Bou Jaoude</h3>
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

            {/* Company Stats - Animated Counters with Real Metrics - 3-Layer System with Gold Borders & Active Color Icons */}
            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
            >
              {/* Card 1: Team Members */}
              <div className="group text-center p-6 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555] rounded-xl hover:shadow-[0_15px_40px_rgba(200,167,102,0.35),0_8px_20px_rgba(0,0,0,0.2)] hover:-translate-y-2 hover:scale-[1.03] transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border border-[#B89555]/40 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md group-hover:shadow-lg transition-shadow">
                  <Users className="w-6 h-6 text-[#1A1A1A]" />
                </div>
                <p className="text-2xl font-bold text-[#1A1A1A] mb-1 group-hover:scale-105 transition-transform">
                  <AnimatedCounter end={metrics.totalMembers} suffix="+" duration={2500} />
                </p>
                <p className="text-[#1A1A1A]/70 text-sm font-medium">Team Members</p>
              </div>

              {/* Card 2: Departments */}
              <div className="group text-center p-6 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555] rounded-xl hover:shadow-[0_15px_40px_rgba(200,167,102,0.35),0_8px_20px_rgba(0,0,0,0.2)] hover:-translate-y-2 hover:scale-[1.03] transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border border-[#B89555]/40 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md group-hover:shadow-lg transition-shadow">
                  <Building2 className="w-6 h-6 text-[#1A1A1A]" />
                </div>
                <p className="text-2xl font-bold text-[#1A1A1A] mb-1 group-hover:scale-105 transition-transform">
                  <AnimatedCounter end={metrics.totalDepartments} duration={2000} />
                </p>
                <p className="text-[#1A1A1A]/70 text-sm font-medium">Departments</p>
              </div>

              {/* Card 3: Languages Spoken */}
              <div className="group text-center p-6 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555] rounded-xl hover:shadow-[0_15px_40px_rgba(200,167,102,0.35),0_8px_20px_rgba(0,0,0,0.2)] hover:-translate-y-2 hover:scale-[1.03] transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border border-[#B89555]/40 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md group-hover:shadow-lg transition-shadow">
                  <Languages className="w-6 h-6 text-[#1A1A1A]" />
                </div>
                <p className="text-2xl font-bold text-[#1A1A1A] mb-1 group-hover:scale-105 transition-transform">
                  <AnimatedCounter end={metrics.totalLanguages} suffix="+" duration={2200} />
                </p>
                <p className="text-[#1A1A1A]/70 text-sm font-medium">Languages Spoken</p>
              </div>

              {/* Card 4: Nationalities */}
              <div className="group text-center p-6 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555] rounded-xl hover:shadow-[0_15px_40px_rgba(200,167,102,0.35),0_8px_20px_rgba(0,0,0,0.2)] hover:-translate-y-2 hover:scale-[1.03] transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border border-[#B89555]/40 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md group-hover:shadow-lg transition-shadow">
                  <Globe className="w-6 h-6 text-[#1A1A1A]" />
                </div>
                <p className="text-2xl font-bold text-[#1A1A1A] mb-1 group-hover:scale-105 transition-transform">
                  <AnimatedCounter end={metrics.totalNationalities} suffix="+" duration={2300} />
                </p>
                <p className="text-[#1A1A1A]/70 text-sm font-medium">Nationalities</p>
              </div>
            </motion.div>

            {/* Leadership Quote */}
            <motion.div
              variants={fadeInUp}
              className="text-center max-w-3xl mx-auto bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] rounded-xl p-6 md:p-8 border border-[#B89555]/30"
            >
              <div className="relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-6xl text-[#1A1A1A]/70">"</div>
                <p className="text-xl md:text-2xl text-[#1A1A1A]/70 italic leading-relaxed pt-8">
                  Innovation and excellence are not just goals—they are the foundation
                  of everything we build. At JBJ Global Real Estate, we're crafting futures and shaping skylines.
                </p>
                <p className="mt-6 text-[#1A1A1A] font-semibold">— Jane Bou Jaoude</p>
                <p className="text-[#1A1A1A]/70 text-sm">Founder & CEO</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CEOLeadershipShowcase;