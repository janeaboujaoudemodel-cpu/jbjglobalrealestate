import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Scale, FileText, Shield, Building2, Briefcase, Globe, Users, Award } from "lucide-react";
import { CONTACT_INFO } from "@/constants/stats";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const practiceAreas = [
  {
    icon: Building2,
    title: "Real Estate Law",
    description: "Comprehensive legal support for property transactions, development agreements, and real estate disputes.",
    services: ["Property Acquisition", "Sale Agreements", "Title Due Diligence", "RERA Compliance"],
  },
  {
    icon: Briefcase,
    title: "Corporate Law",
    description: "Expert guidance on company formation, mergers & acquisitions, and corporate governance.",
    services: ["Company Formation", "M&A Advisory", "Shareholder Agreements", "Corporate Restructuring"],
  },
  {
    icon: Globe,
    title: "Immigration Law",
    description: "Visa and residency solutions for investors, entrepreneurs, and high-net-worth individuals.",
    services: ["Golden Visa", "Investor Visa", "Family Residency", "Work Permits"],
  },
  {
    icon: FileText,
    title: "Contract Law",
    description: "Drafting, review, and negotiation of commercial contracts and legal agreements.",
    services: ["Contract Drafting", "Dispute Resolution", "Negotiation", "Legal Review"],
  },
];

const whyChooseUs = [
  { icon: Shield, title: "Confidentiality", desc: "Absolute discretion in all client matters" },
  { icon: Award, title: "Expertise", desc: "Specialized in UAE & international law" },
  { icon: Users, title: "Personal Service", desc: "Direct access to senior legal counsel" },
  { icon: Globe, title: "Global Network", desc: "International legal partnerships" },
];

const LawFirm = () => {
  return (
    <section className="relative w-full min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&q=80"
            alt="Law Firm"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
        </div>

        <motion.div 
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp}>
            <button 
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 cursor-default"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(200,167,102,0.08) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(200,167,102,0.6)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
              <span className="text-gold font-semibold text-[10px] md:text-xs uppercase tracking-[0.2em]">Legal Division</span>
            </button>
          </motion.div>

          <motion.h1 
            className="text-white text-4xl md:text-6xl lg:text-7xl font-bold tracking-wide mb-6"
            variants={fadeInUp}
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Expert{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">
              Legal Counsel
            </span>
          </motion.h1>

          <motion.p 
            className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto mb-8"
            variants={fadeInUp}
          >
            Trusted legal advisory for investors, businesses, and high-net-worth individuals in the UAE and beyond.
          </motion.p>

          <motion.div variants={fadeInUp}>
            <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="primary" className="px-8 py-6 text-base">
                Schedule Legal Consultation
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* Practice Areas */}
      <section className="py-20 bg-gradient-to-b from-black to-zinc-950">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Practice Areas</span>
            <h2 
              className="text-white text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Our Legal Expertise
            </h2>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {practiceAreas.map((area, idx) => (
              <motion.div
                key={idx}
                className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-gold/30 transition-all"
                variants={fadeInUp}
              >
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                    <area.icon className="w-8 h-8 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl mb-2">{area.title}</h3>
                    <p className="text-zinc-400 text-sm mb-4">{area.description}</p>
                    <ul className="grid grid-cols-2 gap-2">
                      {area.services.map((service, sidx) => (
                        <li key={sidx} className="flex items-center gap-2 text-zinc-300 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                          {service}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Why Choose Us</span>
            <h2 
              className="text-white text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              The JBJ Legal Difference
            </h2>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {whyChooseUs.map((item, idx) => (
              <motion.div
                key={idx}
                className="text-center p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 hover:border-gold/20 transition-all"
                variants={fadeInUp}
              >
                <div className="w-14 h-14 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-gold" />
                </div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-zinc-500 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Scale className="w-12 h-12 text-gold mx-auto mb-6" />
            <h2 
              className="text-white text-3xl md:text-4xl font-bold mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Need Legal Assistance?
            </h2>
            <p className="text-zinc-400 mb-8">
              Our experienced legal team is ready to provide the counsel and representation you need. Schedule a confidential consultation today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
                <button 
                  className="relative inline-flex items-center justify-center gap-2 px-10 py-6 text-base font-bold rounded-xl transition-all duration-300 group overflow-hidden"
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
                  <span className="relative flex items-center gap-2">
                    <span className="text-gold">Book</span>
                    <span className="text-black">Consultation</span>
                    <ArrowUpRight className="w-5 h-5 text-black" />
                  </span>
                </button>
              </a>
              <a href={`tel:${CONTACT_INFO.phoneRaw}`}>
                <button className="relative inline-flex items-center justify-center gap-2 px-10 py-6 text-base font-bold rounded-xl transition-all duration-300 bg-transparent border-2 border-white text-white hover:bg-white hover:text-black">
                  Call {CONTACT_INFO.phone}
                </button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </section>
  );
};

export default LawFirm;
