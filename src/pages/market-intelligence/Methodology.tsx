/**
 * Government-Safe Market Intelligence Methodology Page
 * LOCKED STRUCTURE - Do not modify without explicit authorization
 * 
 * URL: /market-intelligence/methodology
 * Purpose: Legal + Institutional Shield
 */

import { motion } from "framer-motion";
import { Database, Shield, FileCheck, Clock, AlertTriangle, Scale, Bot, Search } from "lucide-react";
import PreFooterSeparator from "@/components/PreFooterSeparator";
import { SEOHead } from "@/components/SEOHead";
import { MarketIntelligenceSchema } from "@/components/seo/MarketIntelligenceSchema";
import { APPROVED_DATA_SOURCES, GOVERNMENT_DISCLOSURES } from "@/config/government-cobranding";
import { MASTER_LOCK } from "@/config/master-lock";
import { MarketIntelligenceHero, MarketIntelligenceNavigation, MarketIntelligenceTableOfContents } from "@/components/market-intelligence";

// TOC items for the page
const tocItems = [
  { id: "introduction", title: "Introduction" },
  { id: "data-selection", title: "Data Selection Principles" },
  { id: "primary-sources", title: "Primary Official Sources" },
  { id: "validation-process", title: "Data Validation Process" },
  { id: "presentation-standards", title: "Presentation Standards" },
  { id: "update-frequency", title: "Update Frequency" },
  { id: "compliance", title: "Compliance & Use" },
  { id: "navigation", title: "Explore More" },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const Methodology = () => {
  return (
    <div data-mi-page className="min-h-screen bg-[#FDFBF7]">
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

      {/* Premium Hero */}
      <MarketIntelligenceHero
        badge="Market Intelligence"
        badgeIcon={Database}
        title="Methodology & Sources"
        description="Full transparency on how market data is selected, verified, and presented across all Market Intelligence pages."
      />

      {/* Main Content with TOC Sidebar - Active Champagne Layer */}
      <section className="jj-section-champagne pt-8 pb-10">
        <div className="relative">
          {/* Full-bleed content area that stretches behind TOC */}
          <div className="space-y-3 px-4 md:px-8 lg:px-16 lg:pr-72 xl:pr-72">
          
              {/* SECTION 1 — Introduction */}
              <motion.section
                id="introduction"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="scroll-mt-32 py-6 jj-card-inner rounded-xl px-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="jj-icon-box-active w-10 h-10 rounded-lg">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold">
                    <span className="text-[#1A1A1A]">Methodology</span>{" "}
                    <span className="text-[#1A1A1A]">& Sources</span>
                  </h2>
                </div>
                
                <div className="prose prose-neutral max-w-none">
                  <p className="text-[#1A1A1A] leading-relaxed">
                    This section explains how market data is selected, verified, and presented across JBJ Global Real Estate's Market Intelligence pages. The objective is transparency, consistency, and regulatory alignment.
                  </p>
                  <p className="text-[#1A1A1A]/70 leading-relaxed mt-4">
                    All methodology is fixed and repeatable. The same standards apply to every market overview, area intelligence page, and market report.
                  </p>
                </div>
              </motion.section>

              {/* SECTION 2 — Data Selection Principles */}
              <motion.section
                id="data-selection"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="scroll-mt-24 py-6 jj-card-inner rounded-xl px-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="jj-icon-box-active w-10 h-10 rounded-lg">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold">
                    <span className="text-[#1A1A1A]">Data</span>{" "}
                    <span className="text-[#1A1A1A]">Selection Principles</span>
                  </h2>
                </div>
                
                <div className="space-y-4">
                  <p className="text-[#1A1A1A] leading-relaxed">
                    Only official, government-published or regulator-recognized data is used. Data is selected based on the following criteria:
                  </p>
                  <ul className="space-y-3 text-[#1A1A1A]">
                    <li className="flex items-start gap-3">
                      <span className="text-[#1A1A1A] mt-1">•</span>
                      <span>Public availability</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#1A1A1A] mt-1">•</span>
                      <span>Regulatory recognition</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#1A1A1A] mt-1">•</span>
                      <span>Direct publication by the relevant authority</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#1A1A1A] mt-1">•</span>
                      <span>Clear scope and definition</span>
                    </li>
                  </ul>
                  <p className="text-[#1A1A1A]/70 leading-relaxed mt-4 pt-4 border-t border-[#B89555]/30">
                    No assumptions, estimates, or third-party projections are included.
                  </p>
                </div>
              </motion.section>

              {/* SECTION 3 — Primary Official Sources */}
              <motion.section
                id="primary-sources"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="scroll-mt-24 py-6 jj-card-inner rounded-xl px-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="jj-icon-box-active w-10 h-10 rounded-lg">
                    <Database className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold">
                    <span className="text-[#1A1A1A]">Primary</span>{" "}
                    <span className="text-[#1A1A1A]">Official Sources</span>
                  </h2>
                </div>
                
                <div className="bg-[#FDFBF7]/80 rounded-lg border-2 border-[#B89555]/50 p-6">
                  <p className="text-[#1A1A1A] text-sm mb-6">
                    All market intelligence content is derived exclusively from the following sources:
                  </p>
                  
                  <div className="space-y-5">
                    <div className="border-l-4 border-[#B89555] pl-4">
                      <h3 className="font-semibold text-[#1A1A1A]">Dubai Land Department (DLD) – Open Data</h3>
                      <p className="text-[#1A1A1A]/70 text-sm mt-1">Registered sales transactions, rental contracts, and property records</p>
                      <a 
                        href="https://dubailand.gov.ae/en/open-data/real-estate-data/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#1A1A1A] text-sm hover:underline mt-1 inline-block"
                      >
                        dubailand.gov.ae/en/open-data/real-estate-data/ →
                      </a>
                    </div>
                    
                    <div className="border-l-4 border-[#B89555] pl-4">
                      <h3 className="font-semibold text-[#1A1A1A]">Dubai Land Department – Research & Reports</h3>
                      <p className="text-[#1A1A1A]/70 text-sm mt-1">Official market studies and sector publications</p>
                      <a 
                        href="https://dubailand.gov.ae/en/open-data/research/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#1A1A1A] text-sm hover:underline mt-1 inline-block"
                      >
                        dubailand.gov.ae/en/open-data/research/ →
                      </a>
                    </div>
                    
                    <div className="border-l-4 border-[#B89555] pl-4">
                      <h3 className="font-semibold text-[#1A1A1A]">RERA Rental Index</h3>
                      <p className="text-[#1A1A1A]/70 text-sm mt-1">Legally recognized rental benchmarks and adjustment limits</p>
                      <a 
                        href="https://dubailand.gov.ae/en/eservices/rental-index/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#1A1A1A] text-sm hover:underline mt-1 inline-block"
                      >
                        dubailand.gov.ae/en/eservices/rental-index/ →
                      </a>
                    </div>
                    
                    <div className="border-l-4 border-[#B89555] pl-4">
                      <h3 className="font-semibold text-[#1A1A1A]">RERA Service Charge Index</h3>
                      <p className="text-[#1A1A1A]/70 text-sm mt-1">Approved annual service charges by project</p>
                      <a 
                        href="https://dubailand.gov.ae/en/eservices/service-charge-index-overview/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#1A1A1A] text-sm hover:underline mt-1 inline-block"
                      >
                        dubailand.gov.ae/en/eservices/service-charge-index-overview/ →
                      </a>
                    </div>
                    
                    <div className="border-l-4 border-[#B89555] pl-4">
                      <h3 className="font-semibold text-[#1A1A1A]">Dubai Government Strategic Publications</h3>
                      <p className="text-[#1A1A1A]/70 text-sm mt-1">Economic frameworks and development agendas</p>
                      <a 
                        href="https://www.protocol.dubai.ae/en/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#1A1A1A] text-sm hover:underline mt-1 inline-block"
                      >
                        protocol.dubai.ae/en/ →
                      </a>
                    </div>
                  </div>
                  
                  <p className="text-[#1A1A1A]/70 text-xs mt-6 pt-4 border-t border-[#B89555]/30">
                    No data is sourced from private platforms, promotional materials, or unofficial aggregators.
                  </p>
                </div>
              </motion.section>

              {/* SECTION 4 — Data Validation Process */}
              <motion.section
                id="validation-process"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="scroll-mt-24 py-6 jj-card-inner rounded-xl px-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="jj-icon-box-active w-10 h-10 rounded-lg">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold">
                    <span className="text-[#1A1A1A]">Data</span>{" "}
                    <span className="text-[#1A1A1A]">Validation Process</span>
                  </h2>
                </div>
                
                <div className="space-y-4">
                  <p className="text-[#1A1A1A] leading-relaxed mb-4">
                    Before inclusion, data is:
                  </p>
                  <ol className="space-y-4">
                    <li className="flex items-start gap-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#EFE6D6] border border-[#B89555] text-[#B89555] font-bold flex items-center justify-center text-sm">1</span>
                      <span className="text-[#1A1A1A] pt-1">Cross-checked against its original government source</span>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#EFE6D6] border border-[#B89555] text-[#B89555] font-bold flex items-center justify-center text-sm">2</span>
                      <span className="text-[#1A1A1A] pt-1">Verified for publication date and scope</span>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#EFE6D6] border border-[#B89555] text-[#B89555] font-bold flex items-center justify-center text-sm">3</span>
                      <span className="text-[#1A1A1A] pt-1">Reviewed for consistency with regulatory definitions</span>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#EFE6D6] border border-[#B89555] text-[#B89555] font-bold flex items-center justify-center text-sm">4</span>
                      <span className="text-[#1A1A1A] pt-1">Used exactly as published, without reinterpretation</span>
                    </li>
                  </ol>
                  <p className="text-[#1A1A1A]/70 leading-relaxed mt-6 pt-4 border-t border-[#B89555]/30">
                    If data cannot be verified from an official source, it is excluded.
                  </p>
                </div>
              </motion.section>

              {/* SECTION 5 — Presentation Standards */}
              <motion.section
                id="presentation-standards"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="scroll-mt-24 py-6 jj-card-inner rounded-xl px-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="jj-icon-box-active w-10 h-10 rounded-lg">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold">
                    <span className="text-[#1A1A1A]">Presentation</span>{" "}
                    <span className="text-[#1A1A1A]">Standards</span>
                  </h2>
                </div>
                
                <div className="bg-[#EFE6D6] border border-[#B89555]/40 rounded-lg p-6">
                  <p className="text-[#1A1A1A] leading-relaxed mb-4">
                    Market intelligence content follows these fixed rules:
                  </p>
                  <ul className="space-y-3 text-[#1A1A1A]">
                    <li className="flex items-start gap-3">
                      <span className="text-[#1A1A1A] mt-1">•</span>
                      <span>Historical and descriptive language only</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#1A1A1A] mt-1">•</span>
                      <span>No forecasts, targets, or predictions</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#1A1A1A] mt-1">•</span>
                      <span>No performance ratings or rankings</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#1A1A1A] mt-1">•</span>
                      <span>No guaranteed outcomes or implied returns</span>
                    </li>
                  </ul>
                  <p className="text-[#1A1A1A]/70 leading-relaxed mt-4 pt-4 border-t border-[#B89555]/30">
                    Charts, summaries, and explanations reflect recorded activity, not future expectations.
                  </p>
                </div>
              </motion.section>

              {/* SECTION 6 — Update Frequency */}
              <motion.section
                id="update-frequency"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="scroll-mt-24 py-6 jj-card-inner rounded-xl px-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="jj-icon-box-active w-10 h-10 rounded-lg">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold">
                    <span className="text-[#1A1A1A]">Update</span>{" "}
                    <span className="text-[#1A1A1A]">Frequency</span>
                  </h2>
                </div>
                
                <div className="space-y-6">
                  <p className="text-[#1A1A1A] leading-relaxed">
                    Market Intelligence pages are reviewed and updated based on:
                  </p>
                  <ul className="space-y-3 text-[#1A1A1A]">
                    <li className="flex items-start gap-3">
                      <span className="text-[#1A1A1A] mt-1">•</span>
                      <span>New official data releases</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#1A1A1A] mt-1">•</span>
                      <span>Updated regulatory indices</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#1A1A1A] mt-1">•</span>
                      <span>Newly published government research</span>
                    </li>
                  </ul>
                  
                  <div className="bg-[#FDFBF7]/80 rounded-lg border-2 border-[#B89555]/50 p-6 mt-6">
                    <h3 className="font-semibold text-[#1A1A1A] mb-4">Typical review cycles:</h3>
                    <ul className="space-y-3 text-[#1A1A1A]">
                      <li className="flex items-start gap-3">
                        <span className="text-[#1A1A1A] mt-1">•</span>
                        <span><strong>Market Overview:</strong> quarterly</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[#1A1A1A] mt-1">•</span>
                        <span><strong>Area Intelligence:</strong> quarterly or upon major data updates</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[#1A1A1A] mt-1">•</span>
                        <span><strong>Market Reports:</strong> monthly or quarterly, aligned with DLD releases</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.section>

              {/* SECTION 7 — Compliance & Use of Information */}
              <motion.section
                id="compliance"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="scroll-mt-24 py-6 jj-card-inner rounded-xl px-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="jj-icon-box-active w-10 h-10 rounded-lg">
                    <Scale className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold">
                    <span className="text-[#1A1A1A]">Compliance</span>{" "}
                    <span className="text-[#1A1A1A]">& Use of Information</span>
                  </h2>
                </div>
                
                <div className="space-y-4">
                  <p className="text-[#1A1A1A] leading-relaxed">
                    Market intelligence content is provided for informational and educational purposes within the scope of licensed real estate brokerage activity. It supports informed decision-making without replacing client judgment or regulatory processes.
                  </p>
                  <p className="text-[#1A1A1A] leading-relaxed">
                    JBJ Global Real Estate maintains full alignment with UAE real estate laws and data publication standards.
                  </p>
                  <p className="text-[#1A1A1A]/70 leading-relaxed mt-6 pt-4 border-t border-[#B89555]/30 italic">
                    This methodology applies uniformly across all Market Intelligence content and is locked unless official data standards change.
                  </p>
                </div>
              </motion.section>

          </div>

          {/* Table of Contents Sidebar (component is fixed-position) */}
          <div className="hidden lg:block">
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
      </section>

      {/* Market Intelligence Navigation - Active Champagne Layer */}
      <section id="navigation" className="py-6 jj-section-champagne scroll-mt-24">
        <div className="container mx-auto px-4 lg:pr-72 xl:pr-72">
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
    </div>
  );
};

export default Methodology;
