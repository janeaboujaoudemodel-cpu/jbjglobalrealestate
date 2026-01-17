/**
 * Founder-Led Philosophy & Advisory Positioning Section
 * 
 * CRITICAL: This is a GLOBAL component displaying the exact words,
 * vision, and convictions of the founder in FIRST PERSON.
 * 
 * RULES:
 * - NEVER use "our founder" — ALWAYS use "the founder, Jane Abou Jaoude"
 * - ALWAYS keep first-person voice ("I")
 * - DO NOT summarize, rewrite, or dilute language
 * - DO NOT add guarantees or ROI claims
 * - Founder name must be clickable → /founder
 * - Title must ALWAYS be: Founder and CEO
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import founderPremium from "@/assets/founder-premium.png";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export const FounderPhilosophySection = () => {
  return (
    <section className="py-16 md:py-24 bg-black relative overflow-hidden">
      {/* Subtle background glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, hsl(40 32% 51% / 0.05) 0%, transparent 60%)",
        }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
          className="max-w-5xl mx-auto"
        >
          {/* Attribution Line */}
          <motion.p 
            variants={fadeInUp}
            className="text-gold text-sm uppercase tracking-[0.2em] mb-8 text-center md:text-left"
          >
            Written by the founder,{" "}
            <Link 
              to="/founder" 
              className="underline underline-offset-4 hover:text-gold-light transition-colors"
            >
              Jane Abou Jaoude
            </Link>
          </motion.p>

          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
            {/* Founder Portrait */}
            <motion.div 
              variants={fadeInUp}
              className="flex-shrink-0 mx-auto md:mx-0"
            >
              <Link to="/founder" className="block group">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-gold/30 group-hover:border-gold transition-colors">
                  <img 
                    src={founderPremium}
                    alt="Jane Abou Jaoude — Founder and CEO of JBJ GLOBAL REAL ESTATE"
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                </div>
              </Link>
              
              {/* Name and Title below portrait on mobile, beside on desktop */}
              <div className="text-center md:text-left mt-4">
                <Link 
                  to="/founder"
                  className="text-white font-semibold hover:text-gold transition-colors block"
                >
                  Jane Abou Jaoude
                </Link>
                <p className="text-zinc-500 text-sm">Founder and CEO</p>
                <p className="text-zinc-600 text-xs italic mt-1">(founder-written)</p>
              </div>
            </motion.div>

            {/* Philosophy Text */}
            <motion.div 
              variants={fadeInUp}
              className="flex-1 space-y-6"
            >
              <div className="prose prose-invert prose-zinc max-w-none">
                <p className="text-zinc-300 leading-relaxed">
                  I believe real estate decisions should never be driven by commissions, pressure, or promises that do not exist in reality.
                </p>
                
                <p className="text-zinc-300 leading-relaxed">
                  There is no such thing as guaranteed ROI. No one in the world can guarantee outcomes. Real estate, like any investment, follows cycles, market forces, and external factors that cannot be controlled.
                </p>
                
                <p className="text-zinc-300 leading-relaxed">
                  At JBJ GLOBAL REAL ESTATE, I work with you as if I am investing my own capital. I do not treat your portfolio as a transaction. I treat it as if it were mine.
                </p>
                
                <p className="text-zinc-300 leading-relaxed">
                  For off-plan properties, I do not charge you any fees. I do not take money from you to sell you a project. My role is to protect you, guide you, and educate you — not to push you toward what benefits me.
                </p>
                
                <p className="text-zinc-300 leading-relaxed">
                  Developers promote what they have. Sales agents sell what they are assigned. That is not my role.
                </p>
                
                <p className="text-zinc-300 leading-relaxed">
                  My responsibility is to analyze the entire market — every developer, every project, every price point — and to advise you based on data, not personal interest.
                </p>
                
                <p className="text-zinc-300 leading-relaxed">
                  I rely on official government data, public planning strategies, infrastructure roadmaps, and historical market cycles. I analyze pricing by area, by developer, by phase, and by investment objective.
                </p>
                
                <p className="text-zinc-300 leading-relaxed">
                  Based on this analysis, I guide you toward what aligns with your goals — whether your objective is capital appreciation, rental income, long-term holding, or end-use ownership.
                </p>
                
                <p className="text-zinc-300 leading-relaxed">
                  You always make the final decision. My role is to illuminate the full picture so you can decide with clarity, confidence, and protection.
                </p>
                
                <p className="text-zinc-300 leading-relaxed">
                  After handover, I continue supporting you — through rental management, resale strategy, and long-term asset planning. Developers do not manage rentals for you. Developers do not resell for you. This is where an independent, licensed brokerage with full-market intelligence makes the difference.
                </p>
                
                <p className="text-zinc-300 leading-relaxed">
                  I do not sell based on personal relationships, higher commissions, or convenience. I respect the laws of the United Arab Emirates, I respect the client, and I respect the capital you are investing.
                </p>
                
                <p className="text-zinc-300 leading-relaxed">
                  I advise to the best of my knowledge, based on experience, data, and integrity — so that you do not regret where your money goes.
                </p>
              </div>

              {/* Signature */}
              <div className="pt-6 border-t border-zinc-800">
                <p className="text-zinc-400 italic">
                  —{" "}
                  <Link 
                    to="/founder"
                    className="text-white hover:text-gold transition-colors not-italic font-medium"
                  >
                    Jane Abou Jaoude
                  </Link>
                </p>
                <p className="text-zinc-500 text-sm mt-1">
                  Founder and CEO, JBJ GLOBAL REAL ESTATE
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FounderPhilosophySection;
