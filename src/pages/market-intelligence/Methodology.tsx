/**
 * Government-Safe Market Intelligence Methodology Page
 * LOCKED STRUCTURE - Do not modify without explicit authorization
 * 
 * URL: /market-intelligence/methodology
 * Purpose: Legal + Institutional Shield
 */

import { motion } from "framer-motion";
import { Database, Shield, FileCheck, Clock, AlertTriangle, Scale, Bot, Search } from "lucide-react";
import Footer from "@/components/Footer";
import PreFooterSeparator from "@/components/PreFooterSeparator";
import { SEOHead } from "@/components/SEOHead";
import { MarketIntelligenceSchema } from "@/components/seo/MarketIntelligenceSchema";
import { APPROVED_DATA_SOURCES, GOVERNMENT_DISCLOSURES } from "@/config/government-cobranding";
import { MASTER_LOCK } from "@/config/master-lock";
import { MarketIntelligenceHero, MarketIntelligenceNavigation, MarketIntelligenceTableOfContents } from "@/components/market-intelligence";

// TOC items for the page
const tocItems = [
  { id: "introduction", title: "Introduction" },
  { id: "data-sources", title: "Data Sources" },
  { id: "data-usage", title: "How Data Is Used" },
  { id: "what-we-dont-do", title: "What We Do NOT Do" },
  { id: "ai-disclosure", title: "AI Usage Disclosure" },
  { id: "update-frequency", title: "Update Frequency" },
  { id: "legal-statement", title: "Legal Statement" },
  { id: "navigation", title: "Explore More" },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const Methodology = () => {
  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Market Intelligence Methodology & Data Sources | JBJ GLOBAL REAL ESTATE"
        description="Full transparency on how we source, aggregate, and present Dubai real estate market intelligence. Official government Open Data sources, update frequency, and what the data is and is not."
        keywords="real estate market data Dubai, how Dubai property prices are calculated, open data sources, market methodology, data transparency, government data sources"
        canonicalPath="/market-intelligence/methodology"
      />
      <MarketIntelligenceSchema 
        type="methodology"
        description="Full transparency on data sources, update frequency, and aggregation methodology for Dubai real estate market intelligence."
      />

      {/* Premium Hero with Image */}
      <MarketIntelligenceHero
        badge="Market Intelligence"
        badgeIcon={Database}
        title="Methodology & Data Sources"
        description="Full transparency on how we source, aggregate, and present market intelligence. Our commitment to data integrity and institutional standards."
        backgroundImage="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80"
      />

      {/* Gold Glow Divider */}
      <div className="h-1 bg-gradient-to-r from-transparent via-gold to-transparent shadow-[0_0_20px_rgba(200,167,102,0.5)]" />

      {/* Main Content with TOC Sidebar */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1 max-w-4xl space-y-10">
        
            {/* SECTION 1 — Introduction (Authority + Neutral) */}
            <motion.section
              id="introduction"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="scroll-mt-24 py-12 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] rounded-xl px-8 border-2 border-black hover:border-gold hover:shadow-[0_0_20px_rgba(200,167,102,0.3)] transition-all"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                  <Shield className="w-5 h-5 text-gold" />
                </div>
                <h2 
                  className="text-2xl font-bold"
                  style={{ 
                    background: "linear-gradient(135deg, #C8A766, #E8D5B0, #C8A766)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 1px 2px rgba(200,167,102,0.3))"
                  }}
                >
                  Introduction
                </h2>
              </div>
              
              <div className="prose prose-neutral max-w-none">
                <p className="text-black leading-relaxed">
                  {MASTER_LOCK.BRAND.COMPANY_NAME} provides market intelligence to support transparency and informed understanding of the UAE real estate market.
                </p>
                <p className="text-zinc-700 leading-relaxed mt-4">
                  Our insights are derived from aggregated official government Open Data and publicly available statistical sources. This information is presented for informational and educational purposes only.
                </p>
              </div>
            </motion.section>

            {/* SECTION 2 — Data Sources (Transparency) */}
            <motion.section
              id="data-sources"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="scroll-mt-24 py-12 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] rounded-xl px-8 border-2 border-black hover:border-gold hover:shadow-[0_0_20px_rgba(200,167,102,0.3)] transition-all"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                  <Database className="w-5 h-5 text-gold" />
                </div>
                <h2 
                  className="text-2xl font-bold"
                  style={{ 
                    background: "linear-gradient(135deg, #C8A766, #E8D5B0, #C8A766)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 1px 2px rgba(200,167,102,0.3))"
                  }}
                >
                  Data Sources
                </h2>
              </div>
              
              <div className="bg-white rounded-lg border-2 border-gold/50 p-6">
                <p className="text-black text-sm mb-6">
                  Our market intelligence draws from the following official government Open Data sources:
                </p>
                
                <ul className="space-y-4">
                  {APPROVED_DATA_SOURCES.map((source) => (
                    <li key={source.id} className="flex items-start gap-3">
                      <span className="text-gold mt-1">•</span>
                      <div>
                        <span 
                          className="font-semibold"
                          style={{ 
                            background: "linear-gradient(135deg, #C8A766, #E8D5B0, #C8A766)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                          }}
                        >
                          {source.name}
                        </span>
                        <span className="text-black"> – {source.dataType.toLowerCase()}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                
                <p className="text-zinc-500 text-xs mt-6 pt-4 border-t border-gold/30">
                  We name categories and sources, not raw dataset URLs. All data is used in accordance with official open data policies.
                </p>
              </div>
            </motion.section>

            {/* SECTION 3 — How the Data Is Used (Critical Section) */}
            <motion.section
              id="data-usage"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="scroll-mt-24 py-12 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] rounded-xl px-8 border-2 border-black hover:border-gold hover:shadow-[0_0_20px_rgba(200,167,102,0.3)] transition-all"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-gold" />
                </div>
                <h2 
                  className="text-2xl font-bold"
                  style={{ 
                    background: "linear-gradient(135deg, #C8A766, #E8D5B0, #C8A766)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 1px 2px rgba(200,167,102,0.3))"
                  }}
                >
                  How the Data Is Used
                </h2>
              </div>
              
              <div className="space-y-4 text-black leading-relaxed">
                <p>
                  Data is <strong className="font-semibold">aggregated</strong> across time periods and geographic areas to identify descriptive trends and patterns.
                </p>
                <p>
                  Data is <strong className="font-semibold">summarized</strong> to provide high-level insights without exposing individual transaction details.
                </p>
                <p>
                  Data is <strong className="font-semibold">contextualized</strong> to help users understand market conditions in plain language.
                </p>
                <p>
                  {MASTER_LOCK.BRAND.COMPANY_NAME} does <strong className="font-semibold">not</strong> publish raw government datasets, individual transaction records, or personally identifiable information.
                </p>
              </div>
            </motion.section>

            {/* SECTION 4 — What We Do NOT Do (VERY IMPORTANT) */}
            <motion.section
              id="what-we-dont-do"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="scroll-mt-24 py-12 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] rounded-xl px-8 border-2 border-black hover:border-gold hover:shadow-[0_0_20px_rgba(200,167,102,0.3)] transition-all"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h2 
                  className="text-2xl font-bold"
                  style={{ 
                    background: "linear-gradient(135deg, #C8A766, #E8D5B0, #C8A766)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 1px 2px rgba(200,167,102,0.3))"
                  }}
                >
                  What We Do NOT Do
                </h2>
              </div>
              
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                <p className="text-black leading-relaxed mb-4">
                  {MASTER_LOCK.BRAND.COMPANY_NAME} does not provide price predictions, investment advice, or guarantees of performance. For mortgage or legal matters, we connect you with our licensed partners.
                </p>
                <p className="text-zinc-700 leading-relaxed">
                  All market intelligence is <strong className="text-black font-semibold">descriptive and historical</strong> in nature. We explain what has happened, not what will happen.
                </p>
              </div>
            </motion.section>

            {/* SECTION 5 — AI Usage Disclosure (MANDATORY) */}
            <motion.section
              id="ai-disclosure"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="scroll-mt-24 py-12 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] rounded-xl px-8 border-2 border-black hover:border-gold hover:shadow-[0_0_20px_rgba(200,167,102,0.3)] transition-all"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                  <Bot className="w-5 h-5 text-gold" />
                </div>
                <h2 
                  className="text-2xl font-bold"
                  style={{ 
                    background: "linear-gradient(135deg, #C8A766, #E8D5B0, #C8A766)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 1px 2px rgba(200,167,102,0.3))"
                  }}
                >
                  AI Usage Disclosure
                </h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-black leading-relaxed">
                  Artificial intelligence tools are used to summarize, visualize, and explain aggregated data in plain language.
                </p>
                <p className="text-black leading-relaxed">
                  AI systems do <strong className="font-semibold">not</strong> make decisions, recommendations, or predictions, and do not replace licensed professionals.
                </p>
                <p className="text-zinc-500 text-sm pt-4 border-t border-gold/30">
                  All AI-generated content is clearly labeled and provides descriptive analysis only.
                </p>
              </div>
            </motion.section>

            {/* SECTION 6 — Update Frequency & Accuracy */}
            <motion.section
              id="update-frequency"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="scroll-mt-24 py-12 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] rounded-xl px-8 border-2 border-black hover:border-gold hover:shadow-[0_0_20px_rgba(200,167,102,0.3)] transition-all"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                  <Clock className="w-5 h-5 text-gold" />
                </div>
                <h2 
                  className="text-2xl font-bold"
                  style={{ 
                    background: "linear-gradient(135deg, #C8A766, #E8D5B0, #C8A766)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 1px 2px rgba(200,167,102,0.3))"
                  }}
                >
                  Update Frequency & Accuracy
                </h2>
              </div>
              
              <div className="bg-white rounded-lg border-2 border-gold/50 p-6">
                <ul className="space-y-3 text-black">
                  <li className="flex items-start gap-3">
                    <span className="text-gold mt-1">•</span>
                    <span>Data is updated periodically based on availability of official sources</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-gold mt-1">•</span>
                    <span>Update frequency varies by dataset (monthly, quarterly, or as published)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-gold mt-1">•</span>
                    <span>"Last updated" timestamps are displayed where applicable</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-gold mt-1">•</span>
                    <span>This is not real-time data</span>
                  </li>
                </ul>
              </div>
            </motion.section>

            {/* SECTION 7 — Legal & Independence Statement (FINAL SHIELD) */}
            <motion.section
              id="legal-statement"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="scroll-mt-24 py-12 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] rounded-xl px-8 border-2 border-black hover:border-gold hover:shadow-[0_0_20px_rgba(200,167,102,0.3)] transition-all"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                  <Scale className="w-5 h-5 text-gold" />
                </div>
                <h2 
                  className="text-2xl font-bold"
                  style={{ 
                    background: "linear-gradient(135deg, #C8A766, #E8D5B0, #C8A766)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 1px 2px rgba(200,167,102,0.3))"
                  }}
                >
                  Legal & Independence Statement
                </h2>
              </div>
              
              <div>
                <p className="text-black leading-relaxed mb-4">
                  {MASTER_LOCK.BRAND.COMPANY_NAME} is a private licensed real estate brokerage for buying, selling, and renting properties.
                </p>
                <p className="text-zinc-600 leading-relaxed">
                  {GOVERNMENT_DISCLOSURES.PRIMARY}
                </p>
              </div>
            </motion.section>

          </div>

          {/* Table of Contents Sidebar */}
          <div className="hidden lg:block w-72">
            <MarketIntelligenceTableOfContents 
              items={tocItems}
              title="In This Section"
              ctaAction={{
                label: "Find Your Property",
                href: "/properties",
                icon: Search
              }}
            />
          </div>
        </div>
      </div>

      {/* Gold Glow Divider */}
      <div className="h-1 bg-gradient-to-r from-transparent via-gold to-transparent shadow-[0_0_20px_rgba(200,167,102,0.5)]" />

      {/* Market Intelligence Navigation */}
      <section id="navigation" className="py-12 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] scroll-mt-24">
        <div className="container mx-auto px-4">
          <MarketIntelligenceNavigation current="/market-intelligence/methodology" />
        </div>
      </section>

      <PreFooterSeparator 
        title="Explore More Market Intelligence"
        subtitle="Get a high-level overview or dive into area-specific data."
        primaryLink="/market-intelligence/overview"
        primaryText="Market Overview"
        secondaryLink="/market-intelligence/areas"
        secondaryText="Area Intelligence"
      />
      <Footer />
    </div>
  );
};

export default Methodology;
