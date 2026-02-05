import { motion } from "framer-motion";
import { ArrowRight, FileText, Camera, Globe, Calendar, Handshake, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import GlobalHeader from "@/components/GlobalHeader";
import { Button } from "@/components/ui/button";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import { CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const SellWithUs = () => {
  const sellerCards = [
    {
      title: "End-Users Selling Their Home",
      description: "Clear pricing guidance and buyer screening to reduce wasted viewings and delays."
    },
    {
      title: "Investors Exiting a Unit",
      description: "Strategy-driven positioning, timeline planning, and negotiation support aligned with your exit goal."
    },
    {
      title: "Off-Plan Resale (Secondary Off-Plan)",
      description: "Assignment/resale handling aligned with developer requirements and transaction structure."
    }
  ];

  const sellingSteps = [
    {
      step: 1,
      title: "Discovery & Document Check",
      description: "Title deed / Oqood, owner details, mortgage status, and unit specifics.",
      icon: FileText
    },
    {
      step: 2,
      title: "Market Pricing Strategy",
      description: "Comparable evidence, positioning, and price corridor (not inflated promises).",
      icon: FileText
    },
    {
      step: 3,
      title: "Listing & Exposure",
      description: "Portals + qualified broker network + buyer database outreach.",
      icon: Camera
    },
    {
      step: 4,
      title: "Enquiries & Viewings",
      description: "Screening, scheduling, feedback loop, and offer readiness checks.",
      icon: Globe
    },
    {
      step: 5,
      title: "Negotiation & Offer Management",
      description: "Offer validation, terms alignment, and buyer credibility verification.",
      icon: Calendar
    },
    {
      step: 6,
      title: "Transfer Coordination",
      description: "NOC coordination, trustee transfer support, mortgage settlement coordination where applicable.",
      icon: Handshake
    }
  ];

  const documentChecklist = [
    "Title Deed (or Oqood for off-plan)",
    "Owner passport/Emirates ID (if available)",
    "Unit details (size, view, parking, upgrades)",
    "Service charge status (if available)",
    "Mortgage details (if applicable)"
  ];

  return (
    <>
      <SEOHead
        title="Sell Your Property in Dubai | JBJ Global Real Estate"
        description="Sell your Dubai property with confidence. Get accurate pricing, qualified buyers, and structured execution from a licensed brokerage team."
        keywords="sell property dubai, sell home dubai, property valuation dubai, sell apartment dubai"
        canonicalPath="/sell"
      />
      <GlobalHeader />
      
      <main className="min-h-screen bg-black">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent" />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-4xl mx-auto text-center"
            >
              <motion.span
                variants={fadeInUp}
                className="inline-block px-4 py-2 bg-gold/10 border border-gold/30 rounded-full text-gold text-sm font-medium mb-6"
              >
                Sell With Us
              </motion.span>
              
              <motion.h1
                variants={fadeInUp}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
              >
                Sell Your Property with Confidence in Dubai
              </motion.h1>
              
              <motion.p
                variants={fadeInUp}
                className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto"
              >
                Pricing accuracy, qualified demand, and structured execution — handled by a licensed brokerage team.
              </motion.p>
              
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Button asChild size="lg" className="bg-gold hover:bg-gold/90 text-black font-semibold">
                  <Link to="/sell/valuation">
                    Request a Valuation
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <a href={getWhatsAppUrl("Hello, I'd like to speak with a Selling Advisor.")} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Speak to a Selling Advisor
                  </a>
                </Button>
              </motion.div>
              
              <motion.p
                variants={fadeInUp}
                className="text-sm text-zinc-500 mt-6"
              >
                Licensed real estate brokerage for Buy, Sell & Rent (Dubai Mainland)
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* What This Page Is */}
        <section className="py-20 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="max-w-4xl mx-auto"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold text-white mb-6 text-center"
              >
                A Selling Process Built for Clarity
              </motion.h2>
              
              <motion.p
                variants={fadeInUp}
                className="text-lg text-zinc-400 text-center"
              >
                Selling isn't only about listing a property — it's about pricing correctly, positioning the asset, 
                qualifying buyers, and coordinating the transaction from offer to transfer. Our role is to manage 
                the selling process professionally and transparently, with clear steps and documented progress.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Who We Support */}
        <section className="py-20 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold text-white mb-12 text-center"
              >
                Who We Support
              </motion.h2>
              
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {sellerCards.map((card, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    className="jj-card-inner p-8 text-center"
                  >
                    <h3 className="text-xl font-semibold text-white mb-4">{card.title}</h3>
                    <p className="text-zinc-400">{card.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* The 6-Step Selling Framework */}
        <section className="py-20 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold text-white mb-12 text-center"
              >
                Our Selling Framework
              </motion.h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {sellingSteps.map((step) => (
                  <motion.div
                    key={step.step}
                    variants={fadeInUp}
                    className="jj-card-inner p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gold/10 border border-gold/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-gold font-bold">{step.step}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                        <p className="text-zinc-400 text-sm">{step.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* What We'll Ask You For */}
        <section className="py-20 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="max-w-3xl mx-auto"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold text-white mb-8 text-center"
              >
                What We'll Ask You For
              </motion.h2>
              
              <motion.div
                variants={fadeInUp}
                className="jj-card-inner p-8"
              >
                <ul className="space-y-4">
                  {documentChecklist.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0" />
                      <span className="text-zinc-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* CTA Block */}
        <section className="py-20 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="max-w-3xl mx-auto text-center"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold text-white mb-4"
              >
                Ready to Start?
              </motion.h2>
              
              <motion.p
                variants={fadeInUp}
                className="text-lg text-zinc-400 mb-8"
              >
                Request a valuation and our team will confirm the next steps and required documents.
              </motion.p>
              
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Button asChild size="lg" className="bg-gold hover:bg-gold/90 text-black font-semibold">
                  <Link to="/sell/valuation">
                    Request a Valuation
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <a href={getWhatsAppUrl("Hello, I'd like to speak with a Selling Advisor.")} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Speak to a Selling Advisor
                  </a>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Footer Notice */}
        <section className="py-8 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <LegalDisclaimer variant="brokerage" className="max-w-3xl mx-auto" />
          </div>
        </section>
      </main>
    </>
  );
};

export default SellWithUs;
