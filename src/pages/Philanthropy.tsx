import { motion } from "framer-motion";
import { Heart, Users, Globe, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { PreFooterSeparator } from "@/components/PreFooterSeparator";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const Philanthropy = () => {
  return (
    <div data-marketing-page className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
      <SEOHead 
        title="Philanthropy | JBJ GLOBAL REAL ESTATE"
        description="Discover how JBJ Global Real Estate gives back to the community through charitable initiatives and social responsibility programs."
        keywords="philanthropy, charity, community, social responsibility, Dubai real estate charity"
        canonicalPath="/philanthropy"
      />

      {/* Hero Section */}
      <section className="jj-hero-fullscreen jj-hero-compact relative flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 via-black to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent" />
        
        <motion.div 
          className="relative z-10 container mx-auto px-4 py-32 text-center"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.15 } }
          }}
        >
          <motion.div 
            className="flex items-center justify-center gap-2 mb-6"
            variants={fadeInUp}
          >
            <Heart className="w-6 h-6 text-[#1A1A1A]" />
            <span className="text-[#1A1A1A] text-sm uppercase tracking-[0.3em]">
              Giving Back
            </span>
          </motion.div>

          <motion.h1 
            className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6 max-w-4xl mx-auto"
            variants={fadeInUp}
          >
            Philanthropy
          </motion.h1>

          <motion.p 
            className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-8"
            variants={fadeInUp}
          >
            Our commitment to making a positive impact extends beyond real estate.
          </motion.p>

          {/* Trust Badges */}
          <motion.div 
            className="flex flex-wrap justify-center gap-6 mt-12"
            variants={fadeInUp}
          >
            <div className="flex items-center gap-2 text-white/90">
              <Heart className="w-5 h-5 text-[#1A1A1A]" />
              <span className="text-sm">Community Support</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <Users className="w-5 h-5 text-[#1A1A1A]" />
              <span className="text-sm">Social Responsibility</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <Globe className="w-5 h-5 text-[#1A1A1A]" />
              <span className="text-sm">Global Impact</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Coming Soon Content */}
      <section className="py-24">
        <div className="jj-layer-2">
          <div className="max-w-3xl mx-auto text-center">
            <div className="jj-card-inner rounded-2xl p-12">
              <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-[#1A1A1A]" />
              </div>
              <h2 className="text-[#1A1A1A] text-2xl md:text-3xl font-bold mb-4">
                Content <span className="text-[#1A1A1A]">Coming Soon</span>
              </h2>
              <p className="text-[#1A1A1A]/70 mb-8">
                We're currently preparing detailed information about our philanthropic initiatives 
                and community involvement programs. Check back soon to learn more about how 
                JBJ Global Real Estate is making a difference.
              </p>
              <Link to="/contact">
                <Button className="bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-[#1A1A1A] px-8 py-6">
                  Contact Us to Learn More
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-Footer */}
      <PreFooterSeparator 
        title="Have Questions About Our Initiatives?"
        subtitle="Reach out to learn more about our community involvement and how you can participate."
        primaryLink="/contact"
        primaryText="Get in Touch"
        secondaryLink="/about"
        secondaryText="About Us"
      />

    </div>
  );
};

export default Philanthropy;
