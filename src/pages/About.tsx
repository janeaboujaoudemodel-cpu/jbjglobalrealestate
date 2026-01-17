import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import { SEOHead, pagesSEO } from "@/components/SEOHead";
import founderProfessional from "@/assets/founder-professional.jpeg";
import luxuryVillaHero from "@/assets/luxury-villa-hero.jpeg";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const About = () => {
  return (
    <>
      <SEOHead {...pagesSEO.about} />
      <div className="min-h-screen bg-black">
        
        {/* SECTION 1 — HERO / POSITIONING */}
        <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={luxuryVillaHero} 
              alt="About JBJ GLOBAL REAL ESTATE" 
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black" />
          </div>
          
          <motion.div 
            className="relative z-10 text-center px-6 max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.span 
              className="inline-block text-gold text-xs uppercase tracking-[0.4em] mb-6"
              variants={fadeInUp}
            >
              About Us
            </motion.span>
            <motion.h1 
              className="text-white text-3xl md:text-5xl lg:text-6xl font-semibold mb-8 leading-tight"
              style={{ fontFamily: "Poppins, sans-serif" }}
              variants={fadeInUp}
            >
              JBJ GLOBAL REAL ESTATE
            </motion.h1>
            <motion.p 
              className="text-zinc-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed"
              variants={fadeInUp}
            >
              A Dubai licensed brokerage authorized to BUY, SELL, and RENT real estate across the UAE, serving local and international clients.
            </motion.p>
          </motion.div>
        </section>

        {/* SECTION 2 — FOUNDER STATEMENT (FIRST PERSON) */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-6">
            <motion.div 
              className="max-w-5xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-16 items-start">
                {/* Founder Image */}
                <motion.div 
                  className="flex justify-center lg:justify-start"
                  variants={fadeInUp}
                >
                  <Link to="/founder" className="block group">
                    <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-2 border-gold/30 group-hover:border-gold/60 transition-colors duration-300">
                      <img 
                        src={founderProfessional} 
                        alt="Jane Abou Jaoude, Founder and CEO of JBJ GLOBAL REAL ESTATE" 
                        className="w-full h-full object-cover object-top"
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                      />
                    </div>
                  </Link>
                </motion.div>

                {/* Founder Statement */}
                <motion.div variants={fadeInUp}>
                  <p className="text-gold/80 text-sm uppercase tracking-widest mb-6">
                    Written by the founder,{" "}
                    <Link 
                      to="/founder" 
                      className="text-gold hover:text-gold-light underline underline-offset-4 transition-colors"
                    >
                      Jane Abou Jaoude
                    </Link>
                  </p>
                  
                  <div className="space-y-6 text-zinc-300 text-lg leading-relaxed">
                    <p>
                      I believe real estate decisions should never be driven by pressure, commissions, or promises that do not exist in reality.
                    </p>
                    <p>
                      There is no such thing as guaranteed ROI. Real estate follows cycles, market forces, and external factors that cannot be controlled.
                    </p>
                    <p>
                      My responsibility as the founder is to protect people from decisions made with incomplete information or unrealistic expectations.
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 3 — HOW JBJ OPERATES */}
        <section className="py-16 md:py-24 bg-zinc-950/50">
          <div className="container mx-auto px-6">
            <motion.div 
              className="max-w-4xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2 
                className="text-gold text-xs uppercase tracking-[0.3em] mb-8"
                variants={fadeInUp}
              >
                How We Operate
              </motion.h2>
              
              <motion.div 
                className="space-y-6 text-zinc-300 text-lg leading-relaxed"
                variants={fadeInUp}
              >
                <p>
                  At JBJ GLOBAL REAL ESTATE, we work with clients as if we are investing our own capital.
                </p>
                <p>
                  We do not treat a client's portfolio as a transaction. We treat it as if it were our own.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 4 — OFF-PLAN POLICY */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6">
            <motion.div 
              className="max-w-4xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2 
                className="text-gold text-xs uppercase tracking-[0.3em] mb-8"
                variants={fadeInUp}
              >
                Off-Plan Policy
              </motion.h2>
              
              <motion.div 
                className="space-y-6 text-zinc-300 text-lg leading-relaxed"
                variants={fadeInUp}
              >
                <p>
                  For off-plan properties, we do not charge clients any fees.
                </p>
                <p>
                  We do not take money from clients to sell them a project.
                </p>
                <p>
                  Our role is to protect, guide, and educate. It is not to push clients toward what benefits us or the company.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 5 — MARKET TRUTH */}
        <section className="py-16 md:py-24 bg-zinc-950/50">
          <div className="container mx-auto px-6">
            <motion.div 
              className="max-w-4xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2 
                className="text-gold text-xs uppercase tracking-[0.3em] mb-8"
                variants={fadeInUp}
              >
                Our Position
              </motion.h2>
              
              <motion.div 
                className="space-y-6 text-zinc-300 text-lg leading-relaxed"
                variants={fadeInUp}
              >
                <p>
                  Developers promote their own projects.
                </p>
                <p>
                  Sales agents sell what they are assigned.
                </p>
                <p>
                  Our role is different.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 6 — MARKET ANALYSIS APPROACH */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6">
            <motion.div 
              className="max-w-4xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2 
                className="text-gold text-xs uppercase tracking-[0.3em] mb-8"
                variants={fadeInUp}
              >
                Market Analysis
              </motion.h2>
              
              <motion.div 
                className="space-y-6 text-zinc-300 text-lg leading-relaxed"
                variants={fadeInUp}
              >
                <p>
                  We analyze the entire market. This includes developers, projects, locations, pricing history, and future planning zones.
                </p>
                <p>
                  Our analysis relies on official government data, public planning strategies, infrastructure roadmaps, and historical real estate cycles.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 7 — CLIENT DECISION AUTHORITY */}
        <section className="py-16 md:py-24 bg-zinc-950/50">
          <div className="container mx-auto px-6">
            <motion.div 
              className="max-w-4xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2 
                className="text-gold text-xs uppercase tracking-[0.3em] mb-8"
                variants={fadeInUp}
              >
                Your Decision
              </motion.h2>
              
              <motion.div 
                className="space-y-6 text-zinc-300 text-lg leading-relaxed"
                variants={fadeInUp}
              >
                <p>
                  Clients always make the final decision.
                </p>
                <p>
                  Our role is to provide clarity, structure, and protection so decisions are made with confidence.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 8 — POST-HANDOVER SERVICES */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6">
            <motion.div 
              className="max-w-4xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2 
                className="text-gold text-xs uppercase tracking-[0.3em] mb-8"
                variants={fadeInUp}
              >
                After Handover
              </motion.h2>
              
              <motion.div 
                className="space-y-6 text-zinc-300 text-lg leading-relaxed"
                variants={fadeInUp}
              >
                <p>
                  After handover, we continue supporting clients through rental strategy, resale planning, and long-term asset positioning.
                </p>
                <p>
                  Developers do not manage rentals or resales. This is where an independent, licensed brokerage adds real value.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 9 — ETHICS & LAW */}
        <section className="py-16 md:py-24 bg-zinc-950/50">
          <div className="container mx-auto px-6">
            <motion.div 
              className="max-w-4xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2 
                className="text-gold text-xs uppercase tracking-[0.3em] mb-8"
                variants={fadeInUp}
              >
                Our Standards
              </motion.h2>
              
              <motion.div 
                className="space-y-6 text-zinc-300 text-lg leading-relaxed"
                variants={fadeInUp}
              >
                <p>
                  We do not sell based on personal relationships, commission levels, or convenience.
                </p>
                <p>
                  We respect the laws of the United Arab Emirates.
                </p>
                <p>
                  We respect the client.
                </p>
                <p>
                  We respect the capital being invested.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 10 — SIGNATURE */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-6">
            <motion.div 
              className="max-w-4xl mx-auto text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.div 
                className="inline-block"
                variants={fadeInUp}
              >
                <Link 
                  to="/founder" 
                  className="group"
                >
                  <p className="text-white text-xl md:text-2xl font-medium mb-2 group-hover:text-gold transition-colors">
                    Jane Abou Jaoude
                  </p>
                </Link>
                <p className="text-gold text-sm uppercase tracking-widest">
                  Founder and CEO, JBJ GLOBAL REAL ESTATE
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default About;
