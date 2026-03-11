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
      <section className="w-full py-20 md:py-28 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] relative overflow-hidden">
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
              <div className="bg-gradient-to-r from-[#EDE4D3] via-[#F5EBD7] to-[#EDE4D3] md:bg-transparent rounded-2xl p-4 md:p-0 border border-gold/30 md:border-0 shadow-xl md:shadow-none">
                <Link to="/founder" className="block relative group">
                  <div className="relative w-64 h-80 md:w-80 md:h-96 rounded-2xl overflow-hidden border-2 border-gold/30 shadow-2xl shadow-gold/20 group-hover:border-gold transition-all duration-300">
                    <img 
                      src={founderPremium} 
                      alt="Jane Bou Jaoude - Founder" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </div>
                </Link>
                
                {/* Founder name label on mobile */}
                <div className="text-center mt-4 md:hidden">
                  <Link to="/founder" className="text-gold font-semibold text-lg hover:underline">
                    Jane Bou Jaoude
                  </Link>
                  <p className="text-zinc-700 text-sm">Founder &amp; CEO</p>
                </div>
              </div>
              
              {/* CTA Button - Champagne Gold matching REAL ESTATE wordmark */}
              <Link 
                to="/founder"
                className="relative inline-flex items-center justify-center gap-3 px-8 sm:px-12 py-5 sm:py-6 mt-6 text-base sm:text-lg font-bold rounded-xl transition-all duration-300 group overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-1"
                style={{
                  background: 'linear-gradient(135deg, #D4B896, #C8A766, #B8975A)',
                  color: '#1a1a1a',
                  border: '2px solid rgba(200,167,102,0.6)',
                  boxShadow: '0 4px 20px rgba(200,167,102,0.3)',
                }}
              >
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-black/80" />
                <span className="tracking-wide">Learn More About the Founder</span>
                <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-black/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </motion.div>

            {/* Right - Content */}
            <motion.div variants={fadeInUp} className="space-y-6">
              <div>
                <span className="inline-block text-gold text-xs uppercase tracking-[0.3em] mb-4">Philosophy</span>
                <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                  <span className="text-black">A Founder-Led</span> <span className="text-gold">Vision</span>
                </h2>
              </div>
              
              {/* Card with Gold Champagne background - matching Developer Marquee logos area */}
              <div className="bg-gradient-to-r from-[#EDE4D3] via-[#F5EBD7] to-[#EDE4D3] rounded-2xl p-6 md:p-8 border border-gold/30">
                <p className="text-zinc-800 text-base leading-relaxed mb-4">
                  <Link to="/about" className="text-gold hover:underline">JBJ Global Real Estate</Link> is a founder-led brokerage built on unwavering standards, discretion, and long-term vision.
                </p>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Founded by <Link to="/founder" className="text-gold hover:underline">Jane Bou Jaoude</Link>, our approach combines deep market expertise with personalized service, ensuring every client receives the attention and insight they deserve.
                </p>
              </div>
              
              <p className="text-zinc-700 text-xs">
                Learn more about our <Link to="/about" className="text-gold hover:underline">company values</Link> and <Link to="/founder" className="text-gold hover:underline">leadership</Link>.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </FounderContent>
  );
};

export default FounderPhilosophySection;
