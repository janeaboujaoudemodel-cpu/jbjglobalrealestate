import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Users, Building2, Globe } from "lucide-react";
import ceoBackdropFlags from "@/assets/ceo/ceo-backdrop-flags.jpg";
import janeFounderOriginal from "@/assets/ceo/jane-founder-original-upload.jpg";

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

          {/* CEO Showcase with Flags Backdrop */}
          <motion.div
            variants={fadeInUp}
            className="relative rounded-2xl overflow-hidden mb-12"
          >
            {/* Backdrop with Lebanese and UAE flags */}
            <div className="relative h-[400px] md:h-[500px]">
              <img
                src={ceoBackdropFlags}
                alt="JBJ Global Real Estate Executive Office"
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* CEO Photo Overlay */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-gold/60 overflow-hidden shadow-2xl shadow-gold/20 mb-4">
                  <img
                    src={janeFounderOriginal}
                    alt="Jane Abou Jaoude - Founder & CEO"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="text-center pb-6">
                  <h3 className="text-white text-xl md:text-2xl font-bold">Jane Abou Jaoude</h3>
                  <p
                    className="text-sm md:text-base font-medium"
                    style={{
                      background: "linear-gradient(135deg, #CBA64B 0%, #E8D5A3 50%, #CBA64B 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Founder & CEO
                  </p>
                  <p className="text-zinc-400 text-sm mt-1">12 Years Experience • Lebanese</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Company Stats */}
          <motion.div
            variants={fadeInUp}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
          >
            <div className="text-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-gold/40 transition-all duration-300 hover:scale-[1.02]">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-gold" />
              </div>
              <p className="text-2xl font-bold text-gold mb-1">150+</p>
              <p className="text-zinc-500 text-sm">Team Members</p>
            </div>
            <div className="text-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-gold/40 transition-all duration-300 hover:scale-[1.02]">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6 text-gold" />
              </div>
              <p className="text-2xl font-bold text-gold mb-1">16</p>
              <p className="text-zinc-500 text-sm">Departments</p>
            </div>
            <div className="text-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-gold/40 transition-all duration-300 hover:scale-[1.02]">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Globe className="w-6 h-6 text-gold" />
              </div>
              <p className="text-2xl font-bold text-gold mb-1">40+</p>
              <p className="text-zinc-500 text-sm">Languages Spoken</p>
            </div>
            <div className="text-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-gold/40 transition-all duration-300 hover:scale-[1.02]">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-gold" />
              </div>
              <p className="text-2xl font-bold text-gold mb-1">50+</p>
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
