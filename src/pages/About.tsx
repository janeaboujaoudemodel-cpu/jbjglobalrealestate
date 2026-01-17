import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { SEOHead, pagesSEO } from "@/components/SEOHead";
import founderProfessional from "@/assets/founder-professional.jpeg";
import luxuryVillaHero from "@/assets/luxury-villa-hero.jpeg";

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 }
  }
};

// Section wrapper with consistent vertical rhythm
const Section = ({ 
  children, 
  className = "", 
  dark = false 
}: { 
  children: React.ReactNode; 
  className?: string;
  dark?: boolean;
}) => (
  <section className={`py-10 md:py-14 lg:py-[72px] ${dark ? 'bg-zinc-950/60' : ''} ${className}`}>
    <div className="container mx-auto px-6">
      <div className="max-w-[1100px] mx-auto">
        {children}
      </div>
    </div>
  </section>
);

// Section label component
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <span 
    className="block text-gold text-xs uppercase mb-4"
    style={{ letterSpacing: '0.18em', fontSize: '12px' }}
  >
    {children}
  </span>
);

// Section headline component
const SectionHeadline = ({ children }: { children: React.ReactNode }) => (
  <h2 
    className="text-white text-2xl md:text-[28px] lg:text-[38px] font-semibold mb-6"
    style={{ fontFamily: "Poppins, sans-serif", lineHeight: 1.25 }}
  >
    {children}
  </h2>
);

// Content text wrapper for readability
const ContentText = ({ children }: { children: React.ReactNode }) => (
  <div 
    className="max-w-[720px] space-y-4 text-zinc-300"
    style={{ fontSize: '17px', lineHeight: 1.7 }}
  >
    {children}
  </div>
);

const About = () => {
  return (
    <>
      <SEOHead {...pagesSEO.about} />
      <div className="min-h-screen bg-black">
        
        {/* SECTION 1: HERO */}
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={luxuryVillaHero} 
              alt="About JBJ GLOBAL REAL ESTATE" 
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black" />
          </div>
          
          <motion.div 
            className="relative z-10 text-center px-6 max-w-[1100px] mx-auto py-20"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.span 
              className="inline-block text-gold text-xs uppercase mb-5"
              style={{ letterSpacing: '0.18em' }}
              variants={fadeInUp}
            >
              About JBJ GLOBAL REAL ESTATE
            </motion.span>
            <motion.h1 
              className="text-white text-[32px] md:text-[44px] lg:text-[56px] font-semibold mb-6 leading-tight"
              style={{ fontFamily: "Poppins, sans-serif" }}
              variants={fadeInUp}
            >
              Built on Vision.<br className="hidden md:block" /> Driven by Results.
            </motion.h1>
            <motion.p 
              className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto mb-10"
              style={{ lineHeight: 1.7 }}
              variants={fadeInUp}
            >
              Licensed to BUY · SELL · RENT across the UAE.
            </motion.p>
            <motion.div 
              className="flex flex-wrap justify-center gap-4"
              variants={fadeInUp}
            >
              <Link to="/contact">
                <Button className="bg-gradient-to-r from-gold to-gold-dark text-black font-semibold px-8 py-6 hover:opacity-90">
                  Contact Us
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/properties">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-6">
                  Browse Properties
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* SECTION 2: FOUNDER WRITTEN BLOCK */}
        <Section>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <div className="grid lg:grid-cols-[220px_1fr] gap-10 lg:gap-14 items-start">
              {/* Circular Founder Image */}
              <motion.div 
                className="flex justify-center lg:justify-start"
                variants={fadeInUp}
              >
                <Link to="/founder" className="block group">
                  <div className="w-44 h-44 md:w-52 md:h-52 rounded-full overflow-hidden border-2 border-gold/30 group-hover:border-gold/50 transition-colors">
                    <img 
                      src={founderProfessional} 
                      alt="Jane Abou Jaoude, Founder and CEO of JBJ GLOBAL REAL ESTATE" 
                      className="w-full h-full object-cover"
                      style={{ objectPosition: 'center center' }}
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                    />
                  </div>
                </Link>
              </motion.div>

              {/* Founder Statement */}
              <motion.div variants={fadeInUp}>
                <SectionLabel>Written by the Founder</SectionLabel>
                <p className="text-white text-xl md:text-2xl font-medium mb-6">
                  <Link 
                    to="/founder" 
                    className="text-gold hover:text-gold-light underline underline-offset-4 transition-colors"
                  >
                    Jane Abou Jaoude
                  </Link>
                </p>
                
                <ContentText>
                  <p>
                    I believe real estate decisions should never be driven by pressure, commissions, or promises that do not exist in reality.
                  </p>
                  <p>
                    There is no such thing as guaranteed ROI. Real estate follows cycles, market forces, and external factors that cannot be controlled.
                  </p>
                  <p>
                    My responsibility as the founder is to protect people from decisions made with incomplete information or unrealistic expectations.
                  </p>
                </ContentText>
              </motion.div>
            </div>
          </motion.div>
        </Section>

        {/* SECTION 3: HOW WE OPERATE */}
        <Section dark>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <SectionLabel>How We Operate</SectionLabel>
              <SectionHeadline>Client Capital, Treated as Our Own</SectionHeadline>
              <ContentText>
                <p>
                  At JBJ GLOBAL REAL ESTATE, we work with clients as if we are investing our own capital.
                </p>
                <p>
                  We do not treat a client's portfolio as a transaction. We treat it as if it were our own.
                </p>
              </ContentText>
            </motion.div>
          </motion.div>
        </Section>

        {/* SECTION 4: OFF-PLAN POLICY */}
        <Section>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <SectionLabel>Off-Plan Policy</SectionLabel>
              <SectionHeadline>No Fees. No Pressure.</SectionHeadline>
              <ContentText>
                <p>
                  For off-plan properties, we do not charge clients any fees.
                </p>
                <p>
                  We do not take money from clients to sell them a project.
                </p>
                <p>
                  Our role is to protect, guide, and educate. It is not to push clients toward what benefits us or the company.
                </p>
              </ContentText>
            </motion.div>
          </motion.div>
        </Section>

        {/* SECTION 5: MARKET INTELLIGENCE */}
        <Section dark>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <SectionLabel>Market Intelligence</SectionLabel>
              <SectionHeadline>Data, Not Opinion</SectionHeadline>
              <ContentText>
                <p>
                  Developers promote their own projects. Sales agents sell what they are assigned. Our role is different.
                </p>
                <p>
                  We analyze the entire market. This includes developers, projects, locations, pricing history, and future planning zones.
                </p>
                <p>
                  Our analysis relies on official government data, public planning strategies, infrastructure roadmaps, and historical real estate cycles.
                </p>
              </ContentText>
            </motion.div>
          </motion.div>
        </Section>

        {/* SECTION 6: YOUR DECISION */}
        <Section>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <SectionLabel>Your Decision</SectionLabel>
              <SectionHeadline>Clarity, Confidence, Protection</SectionHeadline>
              <ContentText>
                <p>
                  Clients always make the final decision.
                </p>
                <p>
                  Our role is to provide clarity, structure, and protection so decisions are made with confidence.
                </p>
              </ContentText>
            </motion.div>
          </motion.div>
        </Section>

        {/* SECTION 7: OUR STANDARDS */}
        <Section dark>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <SectionLabel>Our Standards</SectionLabel>
              <SectionHeadline>Integrity in Every Transaction</SectionHeadline>
              <ContentText>
                <p>
                  We do not sell based on personal relationships, commission levels, or convenience.
                </p>
                <p>
                  We respect the laws of the United Arab Emirates.
                </p>
                <p>
                  We respect the client. We respect the capital being invested.
                </p>
                <p>
                  After handover, we continue supporting clients through rental strategy, resale planning, and long-term asset positioning. Developers do not manage rentals or resales. This is where an independent, licensed brokerage adds real value.
                </p>
              </ContentText>
            </motion.div>
          </motion.div>
        </Section>

        {/* SECTION 8: SIGNATURE */}
        <Section className="py-8 md:py-10 lg:py-14">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center"
          >
            <Link 
              to="/founder" 
              className="inline-block group"
            >
              <p className="text-white text-xl md:text-2xl font-medium mb-2 group-hover:text-gold transition-colors">
                Jane Abou Jaoude
              </p>
            </Link>
            <p 
              className="text-gold text-xs uppercase"
              style={{ letterSpacing: '0.18em' }}
            >
              Founder and CEO, JBJ GLOBAL REAL ESTATE
            </p>
          </motion.div>
        </Section>

        {/* SECTION 9: CTA */}
        <Section dark className="py-12 md:py-16 lg:py-20">
          <motion.div 
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 
              className="text-white text-2xl md:text-3xl lg:text-4xl font-semibold mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
              variants={fadeInUp}
            >
              Ready to Find Your Perfect Property?
            </motion.h2>
            <motion.p 
              className="text-zinc-400 text-lg mb-8 max-w-xl mx-auto"
              variants={fadeInUp}
            >
              Connect with our brokerage team for expert guidance on buying, selling, or renting in the UAE.
            </motion.p>
            <motion.div 
              className="flex flex-wrap justify-center gap-4"
              variants={fadeInUp}
            >
              <Link to="/contact">
                <Button className="bg-gradient-to-r from-gold to-gold-dark text-black font-semibold px-8 py-6 hover:opacity-90">
                  Contact Us
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/properties">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-6">
                  Browse Properties
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </Section>

        <Footer />
      </div>
    </>
  );
};

export default About;
