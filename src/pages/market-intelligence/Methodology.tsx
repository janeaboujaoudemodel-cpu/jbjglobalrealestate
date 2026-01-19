/**
 * Government-Safe Market Intelligence Methodology Page
 * LOCKED STRUCTURE - Do not modify without explicit authorization
 * 
 * URL: /market-intelligence/methodology
 * Purpose: Legal + Institutional Shield
 */

import { motion } from "framer-motion";
import { Database, Shield, FileCheck, Clock, AlertTriangle, Scale, Bot } from "lucide-react";
import Footer from "@/components/Footer";
import PreFooterSeparator from "@/components/PreFooterSeparator";
import { SEOHead } from "@/components/SEOHead";
import { MarketIntelligenceSchema } from "@/components/seo/MarketIntelligenceSchema";
import { APPROVED_DATA_SOURCES, GOVERNMENT_DISCLOSURES } from "@/config/government-cobranding";
import { MASTER_LOCK } from "@/config/master-lock";
import { MarketIntelligenceHero, MarketIntelligenceNavigation } from "@/components/market-intelligence";

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

      <div className="container mx-auto px-4 max-w-4xl py-16 space-y-10">
        
        {/* SECTION 1 — Introduction (Authority + Neutral) */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="py-12 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] rounded-xl px-8 border border-gold/30"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
              <Shield className="w-5 h-5 text-gold" />
            </div>
            <h2 className="text-black text-xl font-semibold">Introduction</h2>
          </div>
          
          <div className="prose prose-neutral max-w-none">
            <p className="text-zinc-700 leading-relaxed">
              {MASTER_LOCK.BRAND.COMPANY_NAME} provides market intelligence to support transparency and informed understanding of the UAE real estate market.
            </p>
            <p className="text-zinc-700 leading-relaxed">
              Our insights are derived from aggregated official government Open Data and publicly available statistical sources. This information is presented for informational and educational purposes only.
            </p>
          </div>
        </motion.section>

        {/* SECTION 2 — Data Sources (Transparency) */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="py-12 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] rounded-xl px-8 border border-gold/30"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
              <Database className="w-5 h-5 text-gold" />
            </div>
            <h2 className="text-black text-xl font-semibold">Data Sources</h2>
          </div>
          
          <div className="bg-white/50 rounded-lg border border-gold/20 p-6">
            <p className="text-zinc-700 text-sm mb-6">
              Our market intelligence draws from the following official government Open Data sources:
            </p>
            
            <ul className="space-y-4">
              {APPROVED_DATA_SOURCES.map((source) => (
                <li key={source.id} className="flex items-start gap-3">
                  <span className="text-gold mt-1">•</span>
                  <div>
                    <span className="text-black font-medium">{source.name}</span>
                    <span className="text-zinc-600"> – {source.dataType.toLowerCase()}</span>
                  </div>
                </li>
              ))}
            </ul>
            
            <p className="text-zinc-500 text-xs mt-6 pt-4 border-t border-gold/20">
              We name categories and sources, not raw dataset URLs. All data is used in accordance with official open data policies.
            </p>
          </div>
        </motion.section>

        {/* SECTION 3 — How the Data Is Used (Critical Section) */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="py-12 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] rounded-xl px-8 border border-gold/30"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-gold" />
            </div>
            <h2 className="text-black text-xl font-semibold">How the Data Is Used</h2>
          </div>
          
          <div className="space-y-4 text-zinc-700 leading-relaxed">
            <p>
              Data is <strong className="text-black font-medium">aggregated</strong> across time periods and geographic areas to identify descriptive trends and patterns.
            </p>
            <p>
              Data is <strong className="text-black font-medium">summarized</strong> to provide high-level insights without exposing individual transaction details.
            </p>
            <p>
              Data is <strong className="text-black font-medium">contextualized</strong> to help users understand market conditions in plain language.
            </p>
            <p>
              {MASTER_LOCK.BRAND.COMPANY_NAME} does <strong className="text-black font-medium">not</strong> publish raw government datasets, individual transaction records, or personally identifiable information.
            </p>
          </div>
        </motion.section>

        {/* SECTION 4 — What We Do NOT Do (VERY IMPORTANT) */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="py-12 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] rounded-xl px-8 border border-gold/30"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-black text-xl font-semibold">What We Do NOT Do</h2>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-black leading-relaxed mb-4">
              {MASTER_LOCK.BRAND.COMPANY_NAME} does not provide price predictions, investment advice, or guarantees of performance. For mortgage or legal matters, we connect you with our licensed partners.
            </p>
            <p className="text-zinc-700 leading-relaxed">
              All market intelligence is <strong className="text-black font-medium">descriptive and historical</strong> in nature. We explain what has happened, not what will happen.
            </p>
          </div>
        </motion.section>

        {/* SECTION 5 — AI Usage Disclosure (MANDATORY) */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="py-12 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] rounded-xl px-8 border border-gold/30"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
              <Bot className="w-5 h-5 text-gold" />
            </div>
            <h2 className="text-black text-xl font-semibold">AI Usage Disclosure</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-zinc-700 leading-relaxed">
              Artificial intelligence tools are used to summarize, visualize, and explain aggregated data in plain language.
            </p>
            <p className="text-zinc-700 leading-relaxed">
              AI systems do <strong className="text-black font-medium">not</strong> make decisions, recommendations, or predictions, and do not replace licensed professionals.
            </p>
            <p className="text-zinc-500 text-sm pt-4 border-t border-gold/20">
              All AI-generated content is clearly labeled and provides descriptive analysis only.
            </p>
          </div>
        </motion.section>

        {/* SECTION 6 — Update Frequency & Accuracy */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="py-12 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] rounded-xl px-8 border border-gold/30"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
              <Clock className="w-5 h-5 text-gold" />
            </div>
            <h2 className="text-black text-xl font-semibold">Update Frequency & Accuracy</h2>
          </div>
          
          <div className="bg-white/50 rounded-lg border border-gold/20 p-6">
            <ul className="space-y-3 text-zinc-700">
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
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="py-12 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] rounded-xl px-8 border border-gold/30"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
              <Scale className="w-5 h-5 text-gold" />
            </div>
            <h2 className="text-black text-xl font-semibold">Legal & Independence Statement</h2>
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

      {/* Market Intelligence Navigation */}
      <section className="py-12 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6]">
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
