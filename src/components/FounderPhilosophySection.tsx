/**
 * Founder-Led Philosophy & Advisory Positioning Section
 * FINAL — LOCKED
 * 
 * CRITICAL: This text is FINAL and approved.
 * DO NOT rewrite, summarize, paraphrase, or "improve" the wording.
 * 
 * RULES:
 * - NEVER use "our founder" — ALWAYS use "the founder, Jane Bou Jaoude"
 * - DO NOT summarize, rewrite, or dilute language
 * - DO NOT add guarantees or ROI claims
 * - Founder name must be clickable → /founder-and-leadership
 * - Title must ALWAYS be: Founder and CEO
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FounderContent } from "@/components/FounderContent";
import { ArrowUpRight, User } from "lucide-react";
import founderPremium from "@/assets/founder-professional.jpeg";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const FounderPhilosophySection = () => {
  return (
    <FounderContent>
      <section className="w-full py-20 md:py-28 bg-gradient-to-r from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] relative overflow-hidden">
        {/* Active Layer Container */}
        <div className="w-full relative z-10 px-4 md:px-8 lg:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              visible: {
                transition: { staggerChildren: 0.08 }
              }
            }}
            className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto"
          >
            {/* Left - Portrait with gold champagne card on mobile */}
            <motion.div variants={fadeInUp} className="flex flex-col items-center">
              {/* Gold champagne card wrapper for mobile separation */}
              <div className="bg-gradient-to-r from-[#EFE6D6] via-[#F7F1E6] to-[#EFE6D6] md:bg-transparent rounded-2xl p-4 md:p-0 border border-[#B89555]/30 md:border-0 shadow-xl md:shadow-none">
                <Link to="/founder" className="block relative group">
                  <div className="relative w-64 h-80 md:w-80 md:h-96 rounded-2xl overflow-hidden border-2 border-[#B89555]/30 shadow-2xl shadow-gold/20 group-hover:border-[#B89555] transition-all duration-300">
                    <img 
                      src={founderPremium} 
                      alt="Jane Bou Jaoude - Founder" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                     loading="lazy" decoding="async" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </div>
                </Link>
                
                {/* Founder name label on mobile */}
                <div className="text-center mt-4 md:hidden">
                  <Link to="/founder" className="text-[#1A1A1A] font-semibold text-lg hover:underline">
                    Jane Bou Jaoude
                  </Link>
                  <p className="text-[#1A1A1A]/70 text-sm">Founder &amp; CEO</p>
                </div>
              </div>
              
              {/* CTA — locked champagne primitive (no gold fill) */}
              <Link
                to="/founder"
                data-cta="founder-learn-more"
                className="jj-cta-champagne inline-flex items-center justify-center gap-3 h-12 px-7 mt-6 rounded-xl text-sm sm:text-base font-semibold"
              >
                <User className="w-4 h-4" />
                <span className="tracking-wide">Learn More About the Founder</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </motion.div>

            {/* Right - Content */}
            <motion.div variants={fadeInUp} className="space-y-6">
              <div>
                <span className="inline-block text-[#1A1A1A] text-xs uppercase tracking-[0.3em] mb-4">Philosophy</span>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  <span className="text-[#1A1A1A]">A Founder-Led</span> <span className="text-[#1A1A1A]">Vision</span>
                </h2>
              </div>
              
              {/* Card with Gold Champagne background - matching Developer Marquee logos area */}
              <div className="bg-gradient-to-r from-[#EFE6D6] via-[#F7F1E6] to-[#EFE6D6] rounded-2xl p-6 md:p-8 border border-[#B89555]/30">
                <p className="text-[#1A1A1A] text-base leading-relaxed mb-4">
                  <Link to="/about" className="text-[#1A1A1A] hover:underline">JBJ Global Real Estate</Link> is a founder-led brokerage built on unwavering standards, discretion, and long-term vision.
                </p>
                <p className="text-[#1A1A1A]/70 text-sm leading-relaxed">
                  Founded by <Link to="/founder" className="text-[#1A1A1A] hover:underline">Jane Bou Jaoude</Link>, our approach combines deep market expertise with personalized service, ensuring every client receives the attention and insight they deserve.
                </p>
              </div>
              
              <p className="text-[#1A1A1A]/70 text-xs">
                Learn more about our <Link to="/about" className="text-[#1A1A1A] hover:underline">company values</Link> and <Link to="/founder" className="text-[#1A1A1A] hover:underline">leadership</Link>.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </FounderContent>
  );
};

export default FounderPhilosophySection;
