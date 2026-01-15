import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Users, Building2, Globe, Languages } from "lucide-react";
// Use the real uploaded CEO photo - not AI generated
import ceoOriginalPhoto from "@/assets/ceo/jane-founder-original-upload.jpg";
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
    <section className="py-20 border-t border-zinc-800 relative overflow-hidden">
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

          {/* CEO Showcase - Real Photo of Jane */}
          <motion.div
            variants={fadeInUp}
            className="relative rounded-2xl overflow-hidden mb-12 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-700/50"
          >
            <div className="flex flex-col md:flex-row items-center gap-8 p-8 md:p-12">
              {/* CEO Photo - Real uploaded image */}
              <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-gold/30">
                <img
                  src={ceoOriginalPhoto}
                  alt="Jane Abou Jaoude - Founder & CEO at JBJ Global Real Estate"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              
              {/* CEO Info */}
              <div className="text-center md:text-left flex-1">
                <h3 className="text-white text-3xl md:text-4xl font-bold mb-3">Jane Abou Jaoude</h3>
                <p
                  className="text-xl md:text-2xl font-semibold mb-4"
                  style={{
                    background: "linear-gradient(135deg, #CBA64B 0%, #E8D5A3 50%, #CBA64B 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Founder & CEO
                </p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-4">
                  <Badge className="bg-gold/15 text-gold border-gold/30">12 Years Experience</Badge>
                  <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700">Lebanese</Badge>
                </div>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-6">
                  <Badge variant="outline" className="border-zinc-600 text-zinc-400">English</Badge>
                  <Badge variant="outline" className="border-zinc-600 text-zinc-400">Arabic</Badge>
                  <Badge variant="outline" className="border-zinc-600 text-zinc-400">French</Badge>
                  <Badge variant="outline" className="border-zinc-600 text-zinc-400">Spanish</Badge>
                </div>
                <p className="text-zinc-400 text-sm md:text-base max-w-xl">
                  Visionary leader with a passion for luxury real estate and building world-class teams. 
                  A global innovator, award-winning entrepreneur shaping the future of luxury real estate in the Middle East.
                </p>
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
