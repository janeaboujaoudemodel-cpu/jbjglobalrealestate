import { motion } from "framer-motion";
import { BookOpen, GraduationCap, BarChart3, ArrowDown, MessageCircle, ArrowRight, Users, TrendingUp, FileText, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

import GuideHero from "@/components/guides/GuideHero";
import GuideSectionHeader from "@/components/guides/GuideSectionHeader";
import PremiumHeroButton from "@/components/ui/premium-hero-button";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const booksPreview = [
  {
    title: "Foundations of Real Estate",
    description: "Master the fundamentals of Dubai's property market, regulations, and professional standards.",
    icon: BookOpen,
  },
  {
    title: "Buyer & Investor Advisory",
    description: "Advanced strategies for guiding buyers and investors through acquisition and portfolio growth.",
    icon: Users,
  },
  {
    title: "Market Intelligence & Analysis",
    description: "Data-driven methodologies for interpreting market trends, pricing, and forecasting.",
    icon: TrendingUp,
  },
];

const guidesPreview = [
  {
    title: "Buyer's Guide",
    description: "Complete walkthrough for purchasing property in Dubai — from search to handover.",
    icon: Users,
  },
  {
    title: "Seller's Guide",
    description: "Maximise your property's value with expert pricing, staging, and negotiation strategies.",
    icon: FileText,
  },
  {
    title: "Tenant's Guide",
    description: "Everything you need to know about renting in Dubai — rights, contracts, and renewals.",
    icon: GraduationCap,
  },
  {
    title: "Golden Visa Guide",
    description: "Comprehensive guide to becoming eligible to apply for the UAE Golden Visa through real estate investment.",
    icon: TrendingUp,
  },
];

const reportsPreview = [
  {
    title: "Monthly Market Snapshots",
    description: "Quick-read monthly overviews of transaction volumes, price movements, and emerging hotspots.",
    icon: Calendar,
  },
  {
    title: "Quarterly Deep Dives",
    description: "In-depth quarterly analysis covering supply pipelines, rental yields, and sector performance.",
    icon: BarChart3,
  },
  {
    title: "Annual Market Outlook",
    description: "Comprehensive yearly forecasts with macro-economic context and strategic investment themes.",
    icon: TrendingUp,
  },
];

const EducationHub = () => {
  const scrollToResources = () => {
    document.getElementById("resources")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-black">

      {/* Hero */}
      <GuideHero
        badge="Knowledge Centre"
        badgeIcon={GraduationCap}
        title={
          <>
            <span className="text-gold">Education</span> Hub
          </>
        }
        description="Your centralised gateway to institutional-grade real estate knowledge. Explore our curated library of professional books, expert guides, and data-driven market reports."
        actions={
          <>
            <PremiumHeroButton onClick={scrollToResources} icon={ArrowDown} iconPosition="right">
              Explore Resources
            </PremiumHeroButton>
            <PremiumHeroButton href="/contact" icon={MessageCircle} iconPosition="left">
              Ask a Question
            </PremiumHeroButton>
          </>
        }
      />

      {/* Resources */}
      <div id="resources">
        {/* Books Library Section */}
        <section className="py-16 md:py-24">
          <div className="jj-layer-2 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 rounded-2xl">
            <GuideSectionHeader icon={BookOpen} title="Books Library" />
            <p className="text-zinc-600 mb-10 max-w-2xl text-sm md:text-base">
              Our professional training library covers every aspect of Dubai real estate — from foundational knowledge to advanced advisory techniques. Each book is structured as a guided learning path with modular chapters.
            </p>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {booksPreview.map((book) => (
                <motion.div key={book.title} variants={fadeInUp}>
                  <div className="jj-card-inner rounded-2xl p-6 md:p-8 h-full flex flex-col">
                    <div className="w-12 h-12 bg-black border border-gold rounded-xl flex items-center justify-center mb-4">
                      <book.icon className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-xl font-semibold text-black mb-2">{book.title}</h3>
                    <p className="text-zinc-600 text-sm flex-1">{book.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            <div className="mt-8 text-center">
              <Link
                to="/broker-education"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-black text-gold border border-gold/40 hover:bg-gold/10 transition-all duration-300 font-semibold text-sm"
              >
                Browse Full Books Library
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Guides Library Section */}
        <section className="py-16 md:py-24">
          <div className="jj-layer-2 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 rounded-2xl">
            <GuideSectionHeader icon={GraduationCap} title="Guides Library" />
            <p className="text-zinc-600 mb-10 max-w-2xl text-sm md:text-base">
              Expert-written guides for every stage of the property journey — whether you're buying, selling, renting, or exploring Golden Visa eligibility. Clear, actionable, and tailored to the Dubai market.
            </p>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {guidesPreview.map((guide) => (
                <motion.div key={guide.title} variants={fadeInUp}>
                  <div className="jj-card-inner rounded-2xl p-6 h-full flex flex-col">
                    <div className="w-12 h-12 bg-black border border-gold rounded-xl flex items-center justify-center mb-4">
                      <guide.icon className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-lg font-semibold text-black mb-2">{guide.title}</h3>
                    <p className="text-zinc-600 text-sm flex-1">{guide.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            <div className="mt-8 text-center">
              <Link
                to="/guides"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-black text-gold border border-gold/40 hover:bg-gold/10 transition-all duration-300 font-semibold text-sm"
              >
                View All Guides
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Market Intelligence Section */}
        <section className="py-16 md:py-24">
          <div className="jj-layer-2 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 rounded-2xl">
            <GuideSectionHeader icon={BarChart3} title="Market Intelligence" />
            <p className="text-zinc-600 mb-10 max-w-2xl text-sm md:text-base">
              Data-driven insights to inform your investment decisions. Our market reports combine institutional-grade analytics with on-the-ground expertise across Dubai's key submarkets.
            </p>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {reportsPreview.map((report) => (
                <motion.div key={report.title} variants={fadeInUp}>
                  <div className="jj-card-inner rounded-2xl p-6 md:p-8 h-full flex flex-col">
                    <div className="w-12 h-12 bg-black border border-gold rounded-xl flex items-center justify-center mb-4">
                      <report.icon className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-xl font-semibold text-black mb-2">{report.title}</h3>
                    <p className="text-zinc-600 text-sm flex-1">{report.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            <div className="mt-8 text-center">
              <Link
                to="/market-intelligence/reports"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-black text-gold border border-gold/40 hover:bg-gold/10 transition-all duration-300 font-semibold text-sm"
              >
                Explore Market Reports
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Need Help Choosing <span className="text-gold">What to Read?</span>
              </h2>
              <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
                Our team can recommend the right resources based on your role, experience level, and goals. Whether you're a first-time buyer or a seasoned investor, we'll point you in the right direction.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <PremiumHeroButton href="/contact" icon={MessageCircle} iconPosition="left">
                  Contact Us
                </PremiumHeroButton>
                <PremiumHeroButton href="/contact?type=support" icon={ArrowRight}>
                  Get Support
                </PremiumHeroButton>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default EducationHub;
