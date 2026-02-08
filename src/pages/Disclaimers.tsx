import { motion } from "framer-motion";
import { Shield, Building2, Users, Bot, FileText, Lock } from "lucide-react";
import SEOHead from "@/components/SEOHead";

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

const Disclaimers = () => {
  const sections = [
    {
      icon: Building2,
      title: "Brokerage Scope",
      content: [
        "JBJ Global Real Estate is a licensed real estate brokerage operating for property buy, sell, and rent services within the UAE (Dubai Mainland).",
        "All property transactions are conducted in accordance with applicable RERA regulations and licensing requirements.",
        "Brokerage services are limited to residential and commercial property transactions within our licensed scope."
      ]
    },
    {
      icon: Users,
      title: "Third-Party Partner Services",
      content: [
        "For legal, mortgage, visa, corporate services, and other regulated services, JBJ Global Real Estate may introduce independent licensed partners.",
        "Clients contract directly with partners under their terms, licensing, and regulatory requirements.",
        "JBJ Global Real Estate does not provide legal, financial, mortgage, or visa advisory services directly.",
        "Partner introductions are provided as a courtesy and do not constitute endorsement or guarantee of partner services."
      ]
    },
    {
      icon: FileText,
      title: "Market Intelligence & Data Use",
      content: [
        "Market insights, reports, and analytics provided through this platform are descriptive and informational only.",
        "Data is aggregated from available sources and may not reflect real-time market conditions.",
        "Price estimates, yield calculations, and market projections are indicative and do not constitute investment advice.",
        "Users should conduct independent due diligence before making property decisions based on any information provided."
      ]
    },
    {
      icon: Bot,
      title: "AI Tools & Outputs",
      content: [
        "AI-powered tools and features on this platform provide informational support and convenience functions.",
        "AI outputs may be incomplete, outdated, or require validation before use in decision-making.",
        "AI-generated content, recommendations, and calculations should be verified with appropriate professionals.",
        "JBJ Global Real Estate is not liable for decisions made based on AI tool outputs without independent verification."
      ]
    },
    {
      icon: Shield,
      title: "Investment & Return Disclaimers",
      content: [
        "No returns on property investments are guaranteed.",
        "Past performance of property markets or specific assets does not predict future results.",
        "Property values, rental yields, and market conditions are subject to change.",
        "All investment decisions carry risk and should be made with professional financial advice."
      ]
    },
    {
      icon: Lock,
      title: "Intellectual Property",
      content: [
        "All branding, content, design elements, and platform features are the intellectual property of JBJ Global Real Estate.",
        "Unauthorized reproduction, distribution, or use of platform content is prohibited.",
        "Trademarks, logos, and proprietary methodologies remain the exclusive property of JBJ Global Real Estate.",
        "Use of the platform constitutes acceptance of intellectual property terms as outlined in the Terms of Use."
      ]
    }
  ];

  return (
    <>
      <SEOHead
        title="Licensing & Disclaimers | JBJ Global Real Estate"
        description="Important legal notices, licensing information, and disclaimers for JBJ Global Real Estate services."
        keywords="jbj disclaimers, real estate licensing dubai, legal notices"
        canonicalPath="/disclaimers"
      />
      
      <main className="min-h-screen bg-black">
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent" />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-3xl mx-auto text-center"
            >
              <motion.span
                variants={fadeInUp}
                className="inline-block px-4 py-2 bg-gold/10 border border-gold/30 rounded-full text-gold text-sm font-medium mb-6"
              >
                Legal
              </motion.span>
              
              <motion.h1
                variants={fadeInUp}
                className="text-4xl md:text-5xl font-bold text-white mb-6"
              >
                Licensing, Disclosures & Important Notices
              </motion.h1>
              
              <motion.p
                variants={fadeInUp}
                className="text-lg text-zinc-400"
              >
                Please review the following important information about our services, data use, and limitations.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Content Sections */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-8">
              {sections.map((section, index) => (
                <motion.div
                  key={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeInUp}
                  className="jj-card-inner p-8"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <section.icon className="w-6 h-6 text-gold" />
                    </div>
                    <h2 className="text-2xl font-bold text-white pt-2">{section.title}</h2>
                  </div>
                  
                  <ul className="space-y-4">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-gold/50 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-zinc-300 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Related Links */}
        <section className="py-16 border-t border-zinc-800">
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
                className="text-2xl font-bold text-white mb-6"
              >
                Related Legal Documents
              </motion.h2>
              
              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap gap-4 justify-center"
              >
                <a
                  href="/privacy"
                  className="px-6 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-300 hover:text-white hover:border-gold/50 transition-colors"
                >
                  Privacy Policy
                </a>
                <a
                  href="/terms"
                  className="px-6 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-300 hover:text-white hover:border-gold/50 transition-colors"
                >
                  Terms of Use
                </a>
                <a
                  href="/cookies"
                  className="px-6 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-300 hover:text-white hover:border-gold/50 transition-colors"
                >
                  Cookie Policy
                </a>
                <a
                  href="/trust-and-audit-center"
                  className="px-6 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-300 hover:text-white hover:border-gold/50 transition-colors"
                >
                  Trust & Audit Center
                </a>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Last Updated */}
        <section className="py-8 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <p className="text-center text-sm text-zinc-500">
              Last updated: February 2025
            </p>
          </div>
        </section>
      </main>
    </>
  );
};

export default Disclaimers;
