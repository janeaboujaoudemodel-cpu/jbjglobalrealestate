/**
 * Founder-Led Philosophy & Advisory Positioning Section
 * FINAL — LOCKED
 * 
 * CRITICAL: This text is FINAL and approved.
 * DO NOT rewrite, summarize, paraphrase, or "improve" the wording.
 * 
 * RULES:
 * - NEVER use "our founder" — ALWAYS use "the founder, Jane Abou Jaoude"
 * - DO NOT summarize, rewrite, or dilute language
 * - DO NOT add guarantees or ROI claims
 * - Founder name must be clickable → /founder-and-leadership
 * - Title must ALWAYS be: Founder and CEO
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, User } from "lucide-react";
import founderPremium from "@/assets/founder-professional.jpeg";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const FounderPhilosophySection = () => {
  return (
    <section className="py-20 md:py-28 bg-black relative overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/5 rounded-full blur-3xl" />
      </div>
      
      {/* Active Layer Container */}
      <div className="mx-4 md:mx-8 lg:mx-16 py-10 px-4 md:px-8 jj-layer-active rounded-2xl relative z-10">
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
          {/* Left - Portrait with dark separation card on mobile */}
          <motion.div variants={fadeInUp} className="flex flex-col items-center">
            {/* Dark card wrapper for mobile separation */}
            <div className="bg-zinc-900/95 md:bg-transparent rounded-2xl p-4 md:p-0 border border-gold/20 md:border-0 shadow-xl md:shadow-none">
              <Link to="/founder" className="block relative group">
                <div className="relative w-64 h-80 md:w-80 md:h-96 rounded-2xl overflow-hidden border-2 border-gold/30 shadow-2xl shadow-gold/20 group-hover:border-gold transition-all duration-300">
                  <img 
                    src={founderPremium} 
                    alt="Jane Abou Jaoude - Founder" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                </div>
              </Link>
              
              {/* Founder name label on mobile */}
              <div className="text-center mt-4 md:hidden">
                <Link to="/founder" className="text-gold font-semibold text-lg hover:underline">
                  Jane Abou Jaoude
                </Link>
                <p className="text-zinc-400 text-sm">Founder &amp; CEO</p>
              </div>
            </div>
            
            {/* CTA Button - Primary button with correct color logic */}
            <button 
              onClick={() => window.location.href = '/founder'}
              className="relative inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-4 sm:py-5 mt-6 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 group overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F5F0E6 50%, #E8DFD0 75%, #C8A766 100%)',
                boxShadow: `
                  0 10px 30px rgba(200,167,102,0.4),
                  0 6px 15px rgba(0,0,0,0.2),
                  inset 0 2px 4px rgba(255,255,255,0.9),
                  inset 0 -2px 4px rgba(200,167,102,0.2),
                  0 0 20px rgba(200,167,102,0.3)
                `,
              }}
            >
              <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
              <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(200,167,102,0.6), inset 0 0 20px rgba(200,167,102,0.1)' }} />
              <span className="relative flex items-center justify-center gap-2">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-gold group-hover:text-black transition-colors" />
                <span className="text-black group-hover:text-gold transition-colors">Know More About</span>
                <span className="text-gold group-hover:text-black transition-colors">The Founder</span>
                <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-black group-hover:text-gold transition-colors" />
              </span>
            </button>
          </motion.div>

          {/* Right - Content */}
          <motion.div variants={fadeInUp} className="space-y-6">
            <div>
              <span className="inline-block text-gold text-xs uppercase tracking-[0.3em] mb-4">Philosophy</span>
              <h2 className="text-white text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                A Founder-Led <span className="text-gold">Vision</span>
              </h2>
            </div>
            
            {/* Card with CHAMPAGNE COLOR (Layer 3) */}
            <div className="jj-card-inner rounded-2xl p-6 md:p-8">
              <p className="text-zinc-800 text-base leading-relaxed mb-4">
                <Link to="/about" className="text-gold hover:underline">JBJ Global Real Estate</Link> is a founder-led brokerage built on unwavering standards, discretion, and long-term vision.
              </p>
              <p className="text-zinc-600 text-sm leading-relaxed">
                Founded by <Link to="/founder" className="text-gold hover:underline">Jane Abou Jaoude</Link>, our approach combines deep market expertise with personalized service, ensuring every client receives the attention and insight they deserve.
              </p>
            </div>
            
            <p className="text-zinc-500 text-xs">
              Learn more about our <Link to="/about" className="text-gold hover:underline">company values</Link> and <Link to="/founder" className="text-gold hover:underline">leadership</Link>.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default FounderPhilosophySection;
