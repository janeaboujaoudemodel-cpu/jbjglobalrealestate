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
import { SEOHead } from "@/components/SEOHead";
import { MarketIntelligenceSchema } from "@/components/seo/MarketIntelligenceSchema";
import { APPROVED_DATA_SOURCES, GOVERNMENT_DISCLOSURES } from "@/config/government-cobranding";
import { MASTER_LOCK } from "@/config/master-lock";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const Methodology = () => {
  return (
    <div className="min-h-screen bg-background">
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

      {/* Hero - Calm, Institutional */}
      <section className="relative py-20 border-b border-border/50">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div 
            className="text-center"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div className="flex items-center justify-center gap-2 mb-4" variants={fadeInUp}>
              <Database className="w-5 h-5 text-muted-foreground" />
              <span className="text-muted-foreground text-sm uppercase tracking-widest">Market Intelligence</span>
            </motion.div>

            <motion.h1 
              className="text-foreground text-3xl md:text-4xl font-semibold mb-4"
              variants={fadeInUp}
            >
              Methodology & Data Sources
            </motion.h1>

            <motion.p 
              className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed"
              variants={fadeInUp}
            >
              Full transparency on how we source, aggregate, and present market intelligence.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-4xl py-16 space-y-16">
        
        {/* SECTION 1 — Introduction (Authority + Neutral) */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Shield className="w-5 h-5 text-muted-foreground" />
            </div>
            <h2 className="text-foreground text-xl font-semibold">Introduction</h2>
          </div>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-muted-foreground leading-relaxed">
              {MASTER_LOCK.BRAND.COMPANY_NAME} provides market intelligence to support transparency and informed understanding of the UAE real estate market.
            </p>
            <p className="text-muted-foreground leading-relaxed">
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
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Database className="w-5 h-5 text-muted-foreground" />
            </div>
            <h2 className="text-foreground text-xl font-semibold">Data Sources</h2>
          </div>
          
          <div className="bg-muted/30 rounded-lg border border-border p-6">
            <p className="text-muted-foreground text-sm mb-6">
              Our market intelligence draws from the following official government Open Data sources:
            </p>
            
            <ul className="space-y-4">
              {APPROVED_DATA_SOURCES.map((source) => (
                <li key={source.id} className="flex items-start gap-3">
                  <span className="text-muted-foreground mt-1">•</span>
                  <div>
                    <span className="text-foreground font-medium">{source.name}</span>
                    <span className="text-muted-foreground"> – {source.dataType.toLowerCase()}</span>
                  </div>
                </li>
              ))}
            </ul>
            
            <p className="text-muted-foreground text-xs mt-6 pt-4 border-t border-border/50">
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
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-muted-foreground" />
            </div>
            <h2 className="text-foreground text-xl font-semibold">How the Data Is Used</h2>
          </div>
          
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Data is <strong className="text-foreground font-medium">aggregated</strong> across time periods and geographic areas to identify descriptive trends and patterns.
            </p>
            <p>
              Data is <strong className="text-foreground font-medium">summarized</strong> to provide high-level insights without exposing individual transaction details.
            </p>
            <p>
              Data is <strong className="text-foreground font-medium">contextualized</strong> to help users understand market conditions in plain language.
            </p>
            <p>
              {MASTER_LOCK.BRAND.COMPANY_NAME} does <strong className="text-foreground font-medium">not</strong> publish raw government datasets, individual transaction records, or personally identifiable information.
            </p>
          </div>
        </motion.section>

        {/* SECTION 4 — What We Do NOT Do (VERY IMPORTANT) */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <h2 className="text-foreground text-xl font-semibold">What We Do NOT Do</h2>
          </div>
          
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6">
            <p className="text-foreground leading-relaxed mb-4">
              {MASTER_LOCK.BRAND.COMPANY_NAME} does not provide price predictions, investment advice, financial recommendations, or guarantees of performance.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              All market intelligence is <strong className="text-foreground font-medium">descriptive and historical</strong> in nature. We explain what has happened, not what will happen.
            </p>
          </div>
        </motion.section>

        {/* SECTION 5 — AI Usage Disclosure (MANDATORY) */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Bot className="w-5 h-5 text-muted-foreground" />
            </div>
            <h2 className="text-foreground text-xl font-semibold">AI Usage Disclosure</h2>
          </div>
          
          <div className="bg-muted/30 rounded-lg border border-border p-6 space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Artificial intelligence tools are used to summarize, visualize, and explain aggregated data in plain language.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              AI systems do <strong className="text-foreground font-medium">not</strong> make decisions, recommendations, or predictions, and do not replace licensed professionals.
            </p>
            <p className="text-muted-foreground text-sm pt-4 border-t border-border/50">
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
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>
            <h2 className="text-foreground text-xl font-semibold">Update Frequency & Accuracy</h2>
          </div>
          
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="text-muted-foreground mt-1">•</span>
              <span>Data is updated periodically based on availability of official sources</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-muted-foreground mt-1">•</span>
              <span>Update frequency varies by dataset (monthly, quarterly, or as published)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-muted-foreground mt-1">•</span>
              <span>"Last updated" timestamps are displayed where applicable</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-muted-foreground mt-1">•</span>
              <span>This is not real-time data</span>
            </li>
          </ul>
        </motion.section>

        {/* SECTION 7 — Legal & Independence Statement (FINAL SHIELD) */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Scale className="w-5 h-5 text-muted-foreground" />
            </div>
            <h2 className="text-foreground text-xl font-semibold">Legal & Independence Statement</h2>
          </div>
          
          <div className="bg-muted/50 rounded-lg border border-border p-6">
            <p className="text-foreground leading-relaxed mb-4">
              {MASTER_LOCK.BRAND.COMPANY_NAME} is a private licensed real estate brokerage.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {GOVERNMENT_DISCLOSURES.PRIMARY}
            </p>
          </div>
        </motion.section>

      </div>

      <Footer />
    </div>
  );
};

export default Methodology;
