import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Search, BarChart3, FileText, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import GlobalHeader from "@/components/GlobalHeader";
import Footer from "@/components/Footer";
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

const InvestorServices = () => {
  const services = [
    "Deal sourcing across developer and resale opportunities",
    "Area intelligence and demand/supply context",
    "Rental strategy alignment (yield vs appreciation focus)",
    "Portfolio structuring and risk positioning",
    "Transaction coordination support through closing"
  ];

  const investorTracks = [
    {
      title: "Yield Strategy",
      description: "Rental income focus",
      icon: TrendingUp
    },
    {
      title: "Appreciation Strategy",
      description: "Capital growth focus",
      icon: BarChart3
    },
    {
      title: "Off-Plan Strategy",
      description: "Phased entry and exits",
      icon: FileText
    },
    {
      title: "Portfolio Builder",
      description: "Multi-asset allocation",
      icon: Search
    }
  ];

  const benefits = [
    "Investor onboarding profile",
    "Saved areas & watchlist",
    "Report access (market + area intelligence)",
    "Curated shortlists by strategy",
    "Investor-ready comparisons"
  ];

  return (
    <>
      <SEOHead
        title="Investor Services | JBJ Global Real Estate"
        description="Access research-driven guidance, area intelligence, and portfolio support designed for Dubai real estate investors."
        keywords="dubai real estate investment, property investment dubai, investor services dubai"
        canonicalPath="/investors"
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
                Investor Services
              </motion.span>
              
              <motion.h1
                variants={fadeInUp}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
              >
                Invest with Structure, Not Noise
              </motion.h1>
              
              <motion.p
                variants={fadeInUp}
                className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto"
              >
                Access research-driven guidance, area intelligence, and portfolio support designed for Dubai real estate investors.
              </motion.p>
              
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Button asChild size="lg" className="bg-gold hover:bg-gold/90 text-black font-semibold">
                  <Link to="/investors/join">
                    Join Investor Network
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <Link to="/market-intelligence">
                    Access Market Intelligence
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* What We Provide */}
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
                className="text-3xl md:text-4xl font-bold text-white mb-8 text-center"
              >
                Investor Support, Delivered Professionally
              </motion.h2>
              
              <motion.div
                variants={fadeInUp}
                className="jj-card-inner p-8"
              >
                <ul className="space-y-4">
                  {services.map((service, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0" />
                      <span className="text-zinc-300">{service}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Investor Tracks */}
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
                Choose Your Investor Track
              </motion.h2>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {investorTracks.map((track, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    className="jj-card-inner p-6 text-center"
                  >
                    <div className="w-12 h-12 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <track.icon className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{track.title}</h3>
                    <p className="text-zinc-400 text-sm">{track.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* What You Get */}
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
                className="text-3xl md:text-4xl font-bold text-white mb-8 text-center"
              >
                What You Get After Joining
              </motion.h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    className="flex items-center gap-3 jj-card-inner p-4"
                  >
                    <div className="w-8 h-8 bg-gold/10 border border-gold/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-gold font-bold text-sm">✓</span>
                    </div>
                    <span className="text-zinc-300">{benefit}</span>
                  </motion.div>
                ))}
              </div>
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
                Join the Investor Network
              </motion.h2>
              
              <motion.p
                variants={fadeInUp}
                className="text-lg text-zinc-400 mb-8"
              >
                Submit your investor profile to unlock investor tools and reporting access.
              </motion.p>
              
              <motion.div
                variants={fadeInUp}
              >
                <Button asChild size="lg" className="bg-gold hover:bg-gold/90 text-black font-semibold">
                  <Link to="/investors/join">
                    Join Investor List
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Footer Notice */}
        <section className="py-8 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <p className="text-center text-sm text-zinc-500 max-w-2xl mx-auto">
              No returns are guaranteed. Market intelligence is descriptive and based on available data sources.
            </p>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default InvestorServices;
