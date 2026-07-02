import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Calendar, Database, Shield, ExternalLink, Search } from "lucide-react";
import { Link } from "react-router-dom";
import PreFooterSeparator from "@/components/PreFooterSeparator";
import { SEOHead } from "@/components/SEOHead";
import { MarketIntelligenceSchema } from "@/components/seo/MarketIntelligenceSchema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MARKET_DISCLAIMER } from "@/config/open-data-config";
import { MarketIntelligenceHero, MarketIntelligenceNavigation, MarketIntelligenceTableOfContents } from "@/components/market-intelligence";

// TOC items for the page
const tocItems = [
  { id: "introduction", title: "Introduction" },
  { id: "purpose", title: "Purpose of Market Reports" },
  { id: "data-sources", title: "Data Sources Used" },
  { id: "report-structure", title: "What a Report Covers" },
  { id: "exclusions", title: "What Reports Do Not Include" },
  { id: "frequency", title: "Reporting Frequency" },
  { id: "jbj-approach", title: "How JBJ Uses Reports" },
  { id: "latest-reports", title: "Latest Reports" },
  { id: "report-archive", title: "Report Archive" },
  { id: "custom-report", title: "Custom Reports" },
  { id: "navigation", title: "Explore More" },
];

const reports = [
  {
    id: 'monthly-jan-2026',
    title: 'Monthly Market Snapshot',
    subtitle: 'January 2026',
    description: 'Quick overview of transaction volumes, price movements, and rent trends for the past month.',
    type: 'monthly',
    date: '2026-01-15',
    pages: 12,
    featured: true,
  },
  {
    id: 'quarterly-q4-2025',
    title: 'Quarterly Market Review',
    subtitle: 'Q4 2025',
    description: 'In-depth analysis of market performance including area-level breakdowns and property type analysis.',
    type: 'quarterly',
    date: '2026-01-05',
    pages: 28,
    featured: true,
  },
  {
    id: 'annual-2025',
    title: 'Annual Market Summary',
    subtitle: '2025 Year in Review',
    description: 'Comprehensive yearly summary with key trends, top-performing areas, and market evolution narrative.',
    type: 'annual',
    date: '2026-01-01',
    pages: 48,
    featured: true,
  },
];

const monthlyArchive = [
  { month: 'January 2026', date: '2026-01-15', available: true },
  { month: 'December 2025', date: '2025-12-15', available: true },
  { month: 'November 2025', date: '2025-11-15', available: true },
  { month: 'October 2025', date: '2025-10-15', available: true },
  { month: 'September 2025', date: '2025-09-15', available: true },
  { month: 'August 2025', date: '2025-08-15', available: true },
  { month: 'July 2025', date: '2025-07-15', available: true },
  { month: 'June 2025', date: '2025-06-15', available: true },
  { month: 'May 2025', date: '2025-05-15', available: true },
  { month: 'April 2025', date: '2025-04-15', available: true },
  { month: 'March 2025', date: '2025-03-15', available: true },
  { month: 'February 2025', date: '2025-02-15', available: true },
  { month: 'January 2025', date: '2025-01-15', available: true },
];

const quarterlyArchive = [
  { quarter: 'Q4 2025', date: '2026-01-05', available: true },
  { quarter: 'Q3 2025', date: '2025-10-05', available: true },
  { quarter: 'Q2 2025', date: '2025-07-05', available: true },
  { quarter: 'Q1 2025', date: '2025-04-05', available: true },
];

// Reusable Section Wrapper Component - 3 Layer System
const SectionWrapper = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-24 jj-section-champagne py-6 mb-3">
    <div className="px-4 md:px-8 lg:px-16 lg:pr-72 xl:pr-72">
      <div className="jj-card-inner p-6 md:p-7">
        {children}
      </div>
    </div>
  </section>
);

const MarketReportsPage = () => {
  const [selectedMonthlyDownload, setSelectedMonthlyDownload] = useState<string | null>(null);
  const [selectedQuarterlyDownload, setSelectedQuarterlyDownload] = useState<string | null>(null);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'monthly':
        return <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/40 font-medium">Monthly</Badge>;
      case 'quarterly':
        return <Badge className="bg-[#F7F2EA] text-[#1A1A1A] border-[#B89555]/40 font-medium">Quarterly</Badge>;
      case 'annual':
        return <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/40 font-medium">Annual</Badge>;
      default:
        return null;
    }
  };

  const featuredReports = reports;

  return (
    <div data-mi-page className="min-h-screen bg-[#FDFBF7]">
      <SEOHead 
        title="Dubai Real Estate Market Reports | BUY · SELL · RENT Analysis | JBJ GLOBAL REAL ESTATE"
        description="Download monthly, quarterly, and annual Dubai real estate market reports. Data-driven insights powered by official government Open Data. No predictions, just clear analysis."
        keywords="Dubai real estate report, Dubai rental market report, UAE property market insights, Dubai market analysis, quarterly market review, annual property report"
        canonicalPath="/market-intelligence/reports"
      />
      <MarketIntelligenceSchema 
        type="reports"
        lastUpdated="2026-01-15"
        description="Monthly, quarterly, and annual Dubai real estate market reports with clear charts, government Open Data attribution, and editorial analysis for BUY · SELL · RENT decisions."
      />

      {/* Premium Hero */}
      <MarketIntelligenceHero
        badge="Market Intelligence"
        badgeIcon={FileText}
        title="Market Reports"
        description="Downloadable reports with clear charts, government Open Data attribution, and editorial analysis for informed decisions."
      />

      {/* Main Content with TOC Sidebar */}
      <div className="pt-8 pb-10 bg-[#FDFBF7]">
        {/* Fixed TOC Sidebar */}
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

        {/* Layer 2 wrapper with gutters */}
        <div className="space-y-0">

              {/* Introduction Section */}
              <SectionWrapper id="introduction">
                <h2 
                  className="text-3xl md:text-4xl font-bold mb-6"
                  style={{ 
                    background: "linear-gradient(135deg, #B89555, #E8D5B0, #B89555)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 2px 4px rgba(200,167,102,0.3))"
                  }}
                >
                  Market Reports
                </h2>
                <p className="text-[#1A1A1A] text-lg leading-relaxed mb-4">
                  Market Reports consolidate officially published government data into structured summaries that explain what has already occurred in the Dubai real estate market. These reports are factual, historical, and descriptive. They do not contain predictions, targets, or guarantees.
                </p>
                <p className="text-[#1A1A1A]/70 leading-relaxed">
                  All figures and statements are derived from Dubai Land Department (DLD) and RERA-recognized sources only.
                </p>
              </SectionWrapper>

              {/* Purpose Section */}
              <SectionWrapper id="purpose">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  <span style={{ 
                    background: "linear-gradient(135deg, #B89555, #E8D5B0, #B89555)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 2px 4px rgba(200,167,102,0.3))"
                  }}>Purpose</span>{" "}
                  <span className="text-[#1A1A1A]">of Market Reports</span>
                </h2>
                <p className="text-[#1A1A1A] text-lg leading-relaxed mb-6">Market Reports exist to:</p>
                <ul className="space-y-3 text-[#1A1A1A]">
                  <li className="flex items-start gap-3"><span className="text-[#1A1A1A] mt-1">•</span><span>Summarize registered market activity</span></li>
                  <li className="flex items-start gap-3"><span className="text-[#1A1A1A] mt-1">•</span><span>Present verified transaction trends</span></li>
                  <li className="flex items-start gap-3"><span className="text-[#1A1A1A] mt-1">•</span><span>Explain rental and ownership behavior</span></li>
                  <li className="flex items-start gap-3"><span className="text-[#1A1A1A] mt-1">•</span><span>Provide regulatory context for decisions</span></li>
                </ul>
                <p className="text-[#1A1A1A]/70 leading-relaxed mt-6">They are designed to help readers understand market movement, not to speculate on outcomes.</p>
              </SectionWrapper>

              {/* Data Sources Section */}
              <SectionWrapper id="data-sources">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  <span style={{ 
                    background: "linear-gradient(135deg, #B89555, #E8D5B0, #B89555)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 2px 4px rgba(200,167,102,0.3))"
                  }}>Data</span>{" "}
                  <span className="text-[#1A1A1A]">Sources Used in Market Reports</span>
                </h2>
                <p className="text-[#1A1A1A] text-lg leading-relaxed mb-6">Every Market Report is compiled using the following official sources:</p>
                <div className="space-y-4">
                  <a href="https://dubailand.gov.ae/en/open-data/real-estate-data/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[#1A1A1A] hover:text-[#1A1A1A] transition-colors group">
                    <ExternalLink className="w-5 h-5 text-[#1A1A1A] group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Dubai Land Department – Open Data</span>
                  </a>
                  <a href="https://dubailand.gov.ae/en/open-data/research/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[#1A1A1A] hover:text-[#1A1A1A] transition-colors group">
                    <ExternalLink className="w-5 h-5 text-[#1A1A1A] group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Dubai Land Department – Research & Market Studies</span>
                  </a>
                  <a href="https://dubailand.gov.ae/en/eservices/rental-index/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[#1A1A1A] hover:text-[#1A1A1A] transition-colors group">
                    <ExternalLink className="w-5 h-5 text-[#1A1A1A] group-hover:scale-110 transition-transform" />
                    <span className="font-medium">RERA Rental Index</span>
                  </a>
                  <a href="https://dubailand.gov.ae/en/eservices/service-charge-index-overview/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[#1A1A1A] hover:text-[#1A1A1A] transition-colors group">
                    <ExternalLink className="w-5 h-5 text-[#1A1A1A] group-hover:scale-110 transition-transform" />
                    <span className="font-medium">RERA Service Charge Index</span>
                  </a>
                </div>
                <p className="text-[#1A1A1A]/70 leading-relaxed mt-6 pt-4 border-t border-[#B89555]/30">No private dashboards, promotional statistics, or third-party estimations are used.</p>
              </SectionWrapper>

              {/* Report Structure Section */}
              <SectionWrapper id="report-structure">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  <span style={{ 
                    background: "linear-gradient(135deg, #B89555, #E8D5B0, #B89555)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 2px 4px rgba(200,167,102,0.3))"
                  }}>What</span>{" "}
                  <span className="text-[#1A1A1A]">a Market Report Covers</span>
                </h2>
                <p className="text-[#1A1A1A] text-lg leading-relaxed mb-6">Each report follows the same fixed structure:</p>
                <div className="space-y-6">
                  <div className="border-l-4 border-[#B89555] pl-6">
                    <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">1. Transaction Volume Overview</h3>
                    <p className="text-[#1A1A1A]/70">Summary of registered sales transactions during the reporting period, including volume and value ranges as recorded by DLD.</p>
                  </div>
                  <div className="border-l-4 border-[#B89555] pl-6">
                    <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">2. Rental Market Activity</h3>
                    <p className="text-[#1A1A1A]/70">Overview of registered tenancy contracts, rental ranges, and compliance with official rental index benchmarks.</p>
                  </div>
                  <div className="border-l-4 border-[#B89555] pl-6">
                    <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">3. Property Type Distribution</h3>
                    <p className="text-[#1A1A1A]/70">Breakdown of activity across apartments, villas, townhouses, and commercial units based on registered classifications.</p>
                  </div>
                  <div className="border-l-4 border-[#B89555] pl-6">
                    <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">4. Area-Level Highlights</h3>
                    <p className="text-[#1A1A1A]/70">Identification of areas with notable transaction concentration or rental activity, based solely on recorded data.</p>
                  </div>
                  <div className="border-l-4 border-[#B89555] pl-6">
                    <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">5. Ownership Cost Context</h3>
                    <p className="text-[#1A1A1A]/70">Reference to approved service charges and their role in total ownership cost during the period.</p>
                  </div>
                </div>
              </SectionWrapper>

              {/* Exclusions Section */}
              <SectionWrapper id="exclusions">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  <span style={{ 
                    background: "linear-gradient(135deg, #B89555, #E8D5B0, #B89555)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 2px 4px rgba(200,167,102,0.3))"
                  }}>What</span>{" "}
                  <span className="text-[#1A1A1A]">Market Reports Do Not Include</span>
                </h2>
                <p className="text-[#1A1A1A] text-lg leading-relaxed mb-6">Market Reports do not:</p>
                <ul className="space-y-3 text-[#1A1A1A]">
                  <li className="flex items-start gap-3"><span className="text-[#1A1A1A] mt-1">•</span><span>Forecast prices or rents</span></li>
                  <li className="flex items-start gap-3"><span className="text-[#1A1A1A] mt-1">•</span><span>Assign performance scores</span></li>
                  <li className="flex items-start gap-3"><span className="text-[#1A1A1A] mt-1">•</span><span>Rank developers or projects</span></li>
                  <li className="flex items-start gap-3"><span className="text-[#1A1A1A] mt-1">•</span><span>Provide investment guarantees</span></li>
                  <li className="flex items-start gap-3"><span className="text-[#1A1A1A] mt-1">•</span><span>Suggest expected returns</span></li>
                </ul>
                <p className="text-[#1A1A1A]/70 leading-relaxed mt-6 pt-4 border-t border-[#B89555]/30">Any interpretation remains grounded in past and current registered activity only.</p>
              </SectionWrapper>

              {/* Reporting Frequency Section */}
              <SectionWrapper id="frequency">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  <span style={{ 
                    background: "linear-gradient(135deg, #B89555, #E8D5B0, #B89555)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 2px 4px rgba(200,167,102,0.3))"
                  }}>Reporting</span>{" "}
                  <span className="text-[#1A1A1A]">Frequency</span>
                </h2>
                <p className="text-[#1A1A1A] text-lg leading-relaxed mb-6">Market Reports are issued based on data availability and official publication cycles. Updates align with:</p>
                <ul className="space-y-3 text-[#1A1A1A]">
                  <li className="flex items-start gap-3"><span className="text-[#1A1A1A] mt-1">•</span><span>Monthly or quarterly DLD releases</span></li>
                  <li className="flex items-start gap-3"><span className="text-[#1A1A1A] mt-1">•</span><span>Official research publications</span></li>
                  <li className="flex items-start gap-3"><span className="text-[#1A1A1A] mt-1">•</span><span>Regulatory updates impacting the sector</span></li>
                </ul>
              </SectionWrapper>

              {/* JBJ Approach Section */}
              <SectionWrapper id="jbj-approach">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  <span style={{ 
                    background: "linear-gradient(135deg, #B89555, #E8D5B0, #B89555)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 2px 4px rgba(200,167,102,0.3))"
                  }}>How</span>{" "}
                  <span className="text-[#1A1A1A]">JBJ Global Real Estate Uses Market Reports</span>
                </h2>
                <p className="text-[#1A1A1A] text-lg leading-relaxed mb-6">JBJ Global Real Estate uses Market Reports to:</p>
                <ul className="space-y-3 text-[#1A1A1A]">
                  <li className="flex items-start gap-3"><span className="text-[#1A1A1A] mt-1">•</span><span>Support factual market explanations</span></li>
                  <li className="flex items-start gap-3"><span className="text-[#1A1A1A] mt-1">•</span><span>Provide context during advisory discussions</span></li>
                  <li className="flex items-start gap-3"><span className="text-[#1A1A1A] mt-1">•</span><span>Align property selection with verified market behavior</span></li>
                  <li className="flex items-start gap-3"><span className="text-[#1A1A1A] mt-1">•</span><span>Maintain compliance with UAE real estate regulations</span></li>
                </ul>
                <p className="text-[#1A1A1A]/70 leading-relaxed mt-6 pt-4 border-t border-[#B89555]/30">All guidance references published data rather than assumptions.</p>
                <p className="text-[#1A1A1A]/70 leading-relaxed mt-4 text-sm italic">Market Reports are supported by Methodology & Sources, which explain how data is selected, validated, and presented.</p>
              </SectionWrapper>

              {/* Featured Reports Section */}
              <SectionWrapper id="latest-reports">
                <h2 
                  className="text-3xl md:text-4xl font-bold mb-8 text-center"
                  style={{ 
                    background: "linear-gradient(135deg, #B89555, #E8D5B0, #B89555)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 2px 4px rgba(200,167,102,0.3))"
                  }}
                >
                  Latest Reports
                </h2>

                <div className="grid md:grid-cols-3 gap-6">
                  {featuredReports.map((report, index) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 hover:border-[#B89555] hover:shadow-[0_0_25px_rgba(200,167,102,0.4)] hover:scale-[1.02] transition-all h-full group">
                        <CardContent className="p-6 flex flex-col h-full">
                          <div className="flex items-start justify-between mb-4">
                            {getTypeBadge(report.type)}
                            <span className="text-[#1A1A1A]/70 text-xs bg-[#EFE6D6] border border-[#B89555]/25 px-2 py-1 rounded">{report.pages} pages</span>
                          </div>

                          <h3 
                            className="text-xl font-bold mb-1"
                            style={{ 
                              background: "linear-gradient(135deg, #B89555, #E8D5B0, #B89555)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              filter: "drop-shadow(0 1px 2px rgba(200,167,102,0.3))"
                            }}
                          >
                            {report.title}
                          </h3>
                          <p className="text-[#1A1A1A] font-medium text-sm mb-3">{report.subtitle}</p>
                          <p className="text-[#1A1A1A]/70 text-sm mb-6 flex-grow leading-relaxed">{report.description}</p>

                          <div className="flex items-center justify-between pt-4 border-t border-[#B89555]/30">
                            <div className="flex items-center gap-2 text-[#1A1A1A]/70 text-xs">
                              <Calendar className="w-3 h-3" />
                              {new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <Link to="/market-report">
                              <Button size="sm" variant="primary">
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </SectionWrapper>

              {/* Report Archive Section */}
              <SectionWrapper id="report-archive">
                <h2 
                  className="text-3xl md:text-4xl font-bold mb-8 text-center"
                  style={{ 
                    background: "linear-gradient(135deg, #B89555, #E8D5B0, #B89555)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 2px 4px rgba(200,167,102,0.3))"
                  }}
                >
                  Report Archive
                </h2>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  {/* Monthly Reports Selector */}
                  <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 hover:border-[#B89555] hover:shadow-[0_0_20px_rgba(200,167,102,0.3)] transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] flex items-center justify-center border border-[#B89555]/30">
                          <Calendar className="w-6 h-6 text-[#1A1A1A]" />
                        </div>
                        <div>
                          <h3 
                            className="text-lg font-bold"
                            style={{ 
                              background: "linear-gradient(135deg, #B89555, #E8D5B0, #B89555)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent"
                            }}
                          >
                            Monthly Snapshots
                          </h3>
                          <p className="text-[#1A1A1A]/70 text-sm">Quick monthly market overviews</p>
                        </div>
                      </div>
                      <p className="text-[#1A1A1A]/70 text-sm mb-4">Download any monthly report from our archive. Data sourced from Dubai Government Open Data.</p>
                      <select 
                        className="w-full p-3 border-2 border-[#B89555]/40 rounded-lg text-[#1A1A1A] bg-[#FDFBF7] mb-4 focus:border-[#B89555] focus:ring-1 focus:ring-gold"
                        value={selectedMonthlyDownload || ''}
                        onChange={(e) => setSelectedMonthlyDownload(e.target.value)}
                      >
                        <option value="">Select Month...</option>
                        {monthlyArchive.map((item) => (
                          <option key={item.month} value={item.date}>{item.month}</option>
                        ))}
                      </select>
                      <Link to="/market-report">
                        <Button variant="primary" className="w-full" disabled={!selectedMonthlyDownload}>
                          <Download className="w-4 h-4 mr-2" />
                          Download Report
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  {/* Quarterly Reports Selector */}
                  <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 hover:border-[#B89555] hover:shadow-[0_0_20px_rgba(200,167,102,0.3)] transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] flex items-center justify-center border border-[#B89555]/30">
                          <FileText className="w-6 h-6 text-[#1A1A1A]" />
                        </div>
                        <div>
                          <h3 
                            className="text-lg font-bold"
                            style={{ 
                              background: "linear-gradient(135deg, #B89555, #E8D5B0, #B89555)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent"
                            }}
                          >
                            Quarterly Reviews
                          </h3>
                          <p className="text-[#1A1A1A]/70 text-sm">In-depth quarterly analysis</p>
                        </div>
                      </div>
                      <p className="text-[#1A1A1A]/70 text-sm mb-4">Comprehensive quarterly reports with area breakdowns and property type analysis.</p>
                      <select 
                        className="w-full p-3 border-2 border-[#B89555]/40 rounded-lg text-[#1A1A1A] bg-[#FDFBF7] mb-4 focus:border-[#B89555] focus:ring-1 focus:ring-gold"
                        value={selectedQuarterlyDownload || ''}
                        onChange={(e) => setSelectedQuarterlyDownload(e.target.value)}
                      >
                        <option value="">Select Quarter...</option>
                        {quarterlyArchive.map((item) => (
                          <option key={item.quarter} value={item.date}>{item.quarter}</option>
                        ))}
                      </select>
                      <Link to="/market-report">
                        <Button variant="primary" className="w-full" disabled={!selectedQuarterlyDownload}>
                          <Download className="w-4 h-4 mr-2" />
                          Download Report
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>

                {/* Data source note */}
                <div className="text-center mt-8 pt-6 border-t border-[#B89555]/30">
                  <p className="text-lg">
                    <span 
                      className="font-semibold"
                      style={{ 
                        background: "linear-gradient(135deg, #B89555, #E8D5B0, #B89555)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent"
                      }}
                    >
                      Source:
                    </span>
                    {" "}
                    <span className="text-[#1A1A1A] font-medium">Dubai Government Open Data</span>
                  </p>
                </div>
              </SectionWrapper>

              {/* Custom Report CTA */}
              <section id="custom-report" className="scroll-mt-24 jj-section-champagne py-6 mb-3">
                <div className="px-4 md:px-8 lg:px-16 lg:pr-72 xl:pr-72">
                  <Card className="jj-card-inner overflow-hidden">
                    <CardContent className="p-8 md:p-10 text-center relative">
                      <div className="relative z-10">
                        <div className="jj-icon-box-active w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5">
                          <FileText className="w-7 h-7" />
                        </div>
                        <h3 
                          className="text-2xl md:text-3xl font-bold mb-4"
                          style={{ 
                            background: "linear-gradient(135deg, #B89555, #E8D5B0, #B89555)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            filter: "drop-shadow(0 2px 4px rgba(200,167,102,0.3))"
                          }}
                        >
                          Need a Custom Report?
                        </h3>
                        <p className="text-[#1A1A1A]/70 mb-6 max-w-lg mx-auto leading-relaxed">
                          Our market intelligence team can prepare bespoke analysis for specific areas, property types, or investment scenarios tailored to your requirements.
                        </p>
                        <Link to="/contact">
                          <Button variant="primary" size="lg" className="font-semibold px-8">
                            Request Custom Report
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>
        </div>
      </div>

      {/* Market Intelligence Navigation */}
      <section id="navigation" className="py-6 jj-section-champagne scroll-mt-24">
        <div className="container mx-auto px-4 lg:pr-72 xl:pr-72">
          <MarketIntelligenceNavigation current="/market-intelligence/reports" />
          
          {/* Disclaimer Box */}
          <div className="max-w-3xl mx-auto mt-8">
            <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 rounded-xl p-6 text-center">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Database className="w-5 h-5 text-[#1A1A1A]" />
                <Shield className="w-5 h-5 text-[#1A1A1A]" />
              </div>
              <p className="text-[#1A1A1A]/70 text-sm whitespace-pre-line">{MARKET_DISCLAIMER}</p>
            </div>
          </div>
        </div>
      </section>

      <PreFooterSeparator 
        title="Explore More Market Intelligence"
        subtitle="Understand our data methodology or browse area-specific insights."
        primaryLink="/market-intelligence/methodology"
        primaryText="Our Methodology"
        secondaryLink="/market-intelligence/areas"
        secondaryText="Area Intelligence"
      />
    </div>
  );
};

export default MarketReportsPage;
