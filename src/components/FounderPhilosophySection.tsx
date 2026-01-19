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
          className="max-w-5xl mx-auto"
        >
          <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-start">
            {/* Founder Portrait */}
            <motion.div 
              variants={fadeInUp}
              className="flex-shrink-0 mx-auto md:mx-0"
            >
              <Link to="/founder" className="block group">
                {/* GLOBAL IMAGE RULE - LOCKED (FINAL):
                    object-fit: cover + center 5% = max zoom, focus on face, never crop head */}
                <div className="w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden border-2 border-white/50 group-hover:border-white group-hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-300 shadow-lg bg-zinc-900">
                  <img 
                    src={founderPremium}
                    alt="Jane Abou Jaoude, Founder & CEO of JBJ GLOBAL REAL ESTATE"
                    className="w-full h-full"
                    style={{
                      objectFit: 'cover',
                      objectPosition: 'center 0%',
                      transform: 'scale(1.5)',
                    }}
                    loading="lazy"
                  />
                </div>
              </Link>
              {/* Know More About the Founder - Primary 3D on normal, Secondary on hover */}
              <button 
                onClick={() => window.location.href = '/founder'}
                className="group/btn mt-4 relative inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300 overflow-hidden w-full"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 50%, #F5F0E6 100%)',
                  border: '2px solid rgba(200,167,102,0.5)',
                  boxShadow: `
                    0 6px 20px rgba(200,167,102,0.3),
                    0 4px 10px rgba(0,0,0,0.15),
                    inset 0 2px 4px rgba(255,255,255,0.9),
                    inset 0 -2px 4px rgba(200,167,102,0.2)
                  `,
                }}
              >
                <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                <span className="relative flex items-center justify-center gap-1">
                  <span className="text-gold group-hover/btn:text-black transition-colors">Know More About the</span>
                  <span className="text-black group-hover/btn:text-gold transition-colors">Founder</span>
                  <span className="text-gold group-hover/btn:text-black transition-colors">↗</span>
                </span>
              </button>
            </motion.div>

            {/* Content */}
            <motion.div 
              variants={fadeInUp}
              className="flex-1"
            >
              {/* Attribution - Premium styling, no underlines */}
              <p className="text-sm font-medium tracking-wide mb-6">
                <span className="text-white uppercase tracking-[0.15em] text-lg md:text-xl">Written by Founder & CEO,</span>{" "}
                <Link 
                  to="/founder" 
                  className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F5D485] to-[#D4AF37] text-xl md:text-2xl font-bold hover:opacity-80 transition-opacity"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.5))',
                  }}
                >
                  Jane Abou Jaoude
                </Link>
                <span className="block mt-2">
                  <Link 
                    to="/about" 
                    className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F5D485] to-[#D4AF37] text-lg font-semibold hover:opacity-80 transition-opacity"
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.5))',
                    }}
                  >
                    JBJ Global Real Estate
                  </Link>
                  <span className="block h-0.5 w-24 bg-gradient-to-r from-[#D4AF37] via-[#F5D485] to-[#D4AF37] mt-2" />
                </span>
              </p>

              {/* Premium White Text Box */}
              <div className="bg-white rounded-2xl p-8 md:p-10 shadow-2xl shadow-gold/5">
                {/* Philosophy Text - Premium Typography */}
                <div className="space-y-5 text-zinc-800 leading-[1.9] text-[15px] md:text-base">
                  <p className="text-lg md:text-xl text-black font-medium leading-relaxed">
                    I believe real estate decisions should never be driven by commissions, pressure, or promises that do not exist in reality.
                  </p>
                  
                  <p>
                    There is no such thing as guaranteed ROI. No one in the world can guarantee outcomes. Real estate, like any investment, follows cycles, market forces, and external factors that cannot be controlled.
                  </p>
                  
                  <p>
                    My responsibility, as the founder, is to protect people from making decisions based on incomplete information or unrealistic expectations.
                  </p>
                  
                  <p>
                    At{" "}
                    <Link 
                      to="/about" 
                      className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F5D485] to-[#D4AF37] font-semibold hover:opacity-80 transition-opacity"
                      style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.5))' }}
                    >
                      JBJ Global Real Estate
                    </Link>
                    , we work with clients as if we are investing our own capital. We do not treat a client's portfolio as a transaction. We treat it as if it were our own.
                  </p>
                  
                  <p>
                    For off-plan properties, we do not charge clients any fees. We do not take money from clients to sell them a project. Our role is to protect, guide, and educate not to push clients toward what benefits us or the company.
                  </p>
                  
                  <p>
                    Developers promote what they have. Sales agents sell what they are assigned. That is not our role.
                  </p>
                  
                  <p>
                    Our responsibility is to analyze the entire market across developers, projects, locations, and pricing and to advise based on data, not personal interest.
                  </p>
                  
                  <p>
                    We rely on official government data, public planning strategies, infrastructure roadmaps, and historical real estate cycles. We analyze pricing by area, by developer, by phase, and by investment objective.
                  </p>
                  
                  <p>
                    Based on this analysis, we guide clients toward what aligns with their goals whether capital appreciation, rental income, long-term holding, or end-use ownership.
                  </p>
                  
                  <p>
                    Clients always make the final decision. Our role is to illuminate the full picture so decisions are made with clarity, confidence, and protection.
                  </p>
                  
                  <p>
                    After handover, we continue supporting clients through rental strategy, resale planning, and long-term asset positioning. Developers do not manage rentals for clients. Developers do not manage resales. This is where an independent, licensed brokerage with full-market intelligence makes the difference.
                  </p>
                  
                  <p>
                    We do not sell based on personal relationships, higher commissions, or convenience. We respect the laws of the United Arab Emirates, we respect the client, and we respect the capital being invested.
                  </p>
                  
                  <p className="text-lg text-black font-medium">
                    We advise to the best of our knowledge, based on experience, verified data, and integrity so clients do not regret where their money goes.
                  </p>
                </div>

                {/* Signature */}
                <div className="pt-8 mt-8 border-t border-zinc-200">
                  <Link to="/founder" className="hover:opacity-80 transition-opacity">
                    <p 
                      className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F5D485] to-[#D4AF37] text-lg font-semibold tracking-wide"
                      style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.4))' }}
                    >
                      Jane Abou Jaoude
                    </p>
                  </Link>
                  <p className="text-gold text-sm font-medium mt-1 tracking-wide">
                    Founder & CEO
                  </p>
                  <Link to="/about" className="hover:opacity-80 transition-opacity">
                    <p 
                      className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F5D485] to-[#D4AF37] text-sm mt-0.5 tracking-wide font-medium"
                      style={{ filter: 'drop-shadow(0 0 4px rgba(212,175,55,0.3))' }}
                    >
                      JBJ Global Real Estate
                    </p>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FounderPhilosophySection;
