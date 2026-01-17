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
import founderPremium from "@/assets/founder-premium.png";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export const FounderPhilosophySection = () => {
  return (
    <section className="py-20 md:py-32 bg-black relative overflow-hidden">
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
            visible: { transition: { staggerChildren: 0.08 } }
          }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-start">
            {/* Founder Portrait */}
            <motion.div 
              variants={fadeInUp}
              className="flex-shrink-0 mx-auto md:mx-0"
            >
              <Link to="/founder-and-leadership" className="block group">
                <div className="w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden border-2 border-gold/30 group-hover:border-gold transition-colors duration-300 shadow-lg">
                  <img 
                    src={founderPremium}
                    alt="Jane Abou Jaoude – Founder and CEO of JBJ GLOBAL REAL ESTATE"
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                </div>
              </Link>
            </motion.div>

            {/* Content */}
            <motion.div 
              variants={fadeInUp}
              className="flex-1 space-y-8"
            >
              {/* Attribution */}
              <p className="text-gold text-sm uppercase tracking-[0.2em]">
                Written by the founder,{" "}
                <Link 
                  to="/founder-and-leadership" 
                  className="underline underline-offset-4 hover:text-gold-light transition-colors"
                >
                  Jane Abou Jaoude
                </Link>
              </p>

              {/* Philosophy Text - Premium Typography */}
              <div className="space-y-6 text-zinc-300 leading-[1.8] text-[15px] md:text-base font-light tracking-wide">
                <p>
                  I believe real estate decisions should never be driven by commissions, pressure, or promises that do not exist in reality.
                </p>
                
                <p>
                  There is no such thing as guaranteed ROI. No one in the world can guarantee outcomes. Real estate, like any investment, follows cycles, market forces, and external factors that cannot be controlled.
                </p>
                
                <p>
                  My responsibility, as the founder, is to protect people from making decisions based on incomplete information or unrealistic expectations.
                </p>
                
                <p>
                  At <strong className="text-white font-medium">JBJ GLOBAL REAL ESTATE</strong>, we work with clients as if we are investing our own capital. We do not treat a client's portfolio as a transaction. We treat it as if it were our own.
                </p>
                
                <p>
                  For off-plan properties, we do not charge clients any fees. We do not take money from clients to sell them a project. Our role is to protect, guide, and educate — not to push clients toward what benefits us or the company.
                </p>
                
                <p>
                  Developers promote what they have. Sales agents sell what they are assigned. That is not our role.
                </p>
                
                <p>
                  Our responsibility is to analyze the entire market — across developers, projects, locations, and pricing — and to advise based on data, not personal interest.
                </p>
                
                <p>
                  We rely on official government data, public planning strategies, infrastructure roadmaps, and historical real estate cycles. We analyze pricing by area, by developer, by phase, and by investment objective.
                </p>
                
                <p>
                  Based on this analysis, we guide clients toward what aligns with their goals — whether capital appreciation, rental income, long-term holding, or end-use ownership.
                </p>
                
                <p>
                  Clients always make the final decision. Our role is to illuminate the full picture so decisions are made with clarity, confidence, and protection.
                </p>
                
                <p>
                  After handover, we continue supporting clients through leasing strategy, resale planning, and long-term asset positioning. Developers do not lease for clients. Developers do not manage resales. This is where an independent, licensed brokerage with full-market intelligence makes the difference.
                </p>
                
                <p>
                  We do not sell based on personal relationships, higher commissions, or convenience. We respect the laws of the United Arab Emirates, we respect the client, and we respect the capital being invested.
                </p>
                
                <p>
                  We advise to the best of our knowledge, based on experience, verified data, and integrity — so clients do not regret where their money goes.
                </p>
              </div>

              {/* Signature */}
              <div className="pt-8 border-t border-zinc-800/50">
                <p className="text-zinc-400 italic text-base">
                  —{" "}
                  <Link 
                    to="/founder-and-leadership"
                    className="text-white hover:text-gold transition-colors not-italic font-medium"
                  >
                    Jane Abou Jaoude
                  </Link>
                </p>
                <p className="text-zinc-500 text-sm mt-2 tracking-wide">
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
