import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Calendar, Database, Shield, ExternalLink, Search } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
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

// Monthly Archive - consolidated list for download selector
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

const MarketReportsPage = () => {
  const [selectedMonthlyDownload, setSelectedMonthlyDownload] = useState<string | null>(null);
  const [selectedQuarterlyDownload, setSelectedQuarterlyDownload] = useState<string | null>(null);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'monthly':
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 font-medium">Monthly</Badge>;
      case 'quarterly':
        return <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30 font-medium">Quarterly</Badge>;
      case 'annual':
        return <Badge className="bg-gold/20 text-gold border-gold/30 font-medium">Annual</Badge>;
      default:
        return null;
    }
  };

  const featuredReports = reports;

  return (
    <div className="min-h-screen bg-black">
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

      {/* Premium Hero with Video */}
      <MarketIntelligenceHero
        badge="Market Intelligence"
        badgeIcon={FileText}
        title="Market Reports"
        description="Downloadable reports with clear charts, government Open Data attribution, and editorial analysis for informed decisions."
        videoSrc="https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4"
        videoPoster="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80"
      />

      {/* Gold Glow Divider */}
      <div className="h-1 bg-gradient-to-r from-transparent via-gold to-transparent shadow-[0_0_20px_rgba(200,167,102,0.5)]" />

      {/* Main Content with TOC Sidebar */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1 space-y-16">

            {/* Featured Reports - Premium champagne Cards */}
            <section id="latest-reports" className="scroll-mt-24">
              <div className="bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] rounded-2xl p-8 border border-gold/30">
                <h2 
                  className="text-3xl md:text-4xl font-bold mb-8 text-center"
                  style={{ 
                    fontFamily: "Poppins, sans-serif",
                    background: "linear-gradient(135deg, #C8A766, #E8D5B0, #C8A766)",
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
                      <Card className="bg-white border-2 border-black hover:border-gold hover:shadow-[0_0_25px_rgba(200,167,102,0.4)] transition-all h-full group">
                        <CardContent className="p-6 flex flex-col h-full">
                          <div className="flex items-start justify-between mb-4">
                            {getTypeBadge(report.type)}
                            <span className="text-zinc-400 text-xs bg-zinc-100 px-2 py-1 rounded">{report.pages} pages</span>
                          </div>

                          <h3 
                            className="text-xl font-bold mb-1"
                            style={{ 
                              background: "linear-gradient(135deg, #C8A766, #E8D5B0, #C8A766)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              filter: "drop-shadow(0 1px 2px rgba(200,167,102,0.3))"
                            }}
                          >
                            {report.title}
                          </h3>
                          <p className="text-black font-medium text-sm mb-3">{report.subtitle}</p>
                          <p className="text-zinc-600 text-sm mb-6 flex-grow leading-relaxed">{report.description}</p>

                          <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
                            <div className="flex items-center gap-2 text-zinc-400 text-xs">
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
              </div>
            </section>

            {/* Gold Glow Divider */}
            <div className="h-1 bg-gradient-to-r from-transparent via-gold to-transparent shadow-[0_0_20px_rgba(200,167,102,0.5)]" />

            {/* Report Archive - White Pearl section */}
            <section id="report-archive" className="scroll-mt-24">
              <div className="bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] rounded-2xl p-8 border border-gold/30">
                <h2 
                  className="text-3xl md:text-4xl font-bold mb-8 text-center"
                  style={{ 
                    fontFamily: "Poppins, sans-serif",
                    background: "linear-gradient(135deg, #C8A766, #E8D5B0, #C8A766)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 2px 4px rgba(200,167,102,0.3))"
                  }}
                >
                  Report Archive
                </h2>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  {/* Monthly Reports Selector */}
                  <Card className="bg-white border-2 border-black hover:border-gold hover:shadow-[0_0_20px_rgba(200,167,102,0.3)] transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                          <h3 
                            className="text-lg font-bold"
                            style={{ 
                              background: "linear-gradient(135deg, #C8A766, #E8D5B0, #C8A766)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent"
                            }}
                          >
                            Monthly Snapshots
                          </h3>
                          <p className="text-zinc-500 text-sm">Quick monthly market overviews</p>
                        </div>
                      </div>
                      <p className="text-zinc-600 text-sm mb-4">
                        Download any monthly report from our archive. Data sourced from Dubai Government Open Data.
                      </p>
                      <select 
                        className="w-full p-3 border-2 border-black rounded-lg text-black bg-white mb-4 focus:border-gold focus:ring-1 focus:ring-gold"
                        value={selectedMonthlyDownload || ''}
                        onChange={(e) => setSelectedMonthlyDownload(e.target.value)}
                      >
                        <option value="">Select Month...</option>
                        {monthlyArchive.map((item) => (
                          <option key={item.month} value={item.date}>{item.month}</option>
                        ))}
                      </select>
                      <Link to="/market-report">
                        <Button 
                          variant="primary"
                          className="w-full"
                          disabled={!selectedMonthlyDownload}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Report
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  {/* Quarterly Reports Selector */}
                  <Card className="bg-white border-2 border-black hover:border-gold hover:shadow-[0_0_20px_rgba(200,167,102,0.3)] transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                          <h3 
                            className="text-lg font-bold"
                            style={{ 
                              background: "linear-gradient(135deg, #C8A766, #E8D5B0, #C8A766)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent"
                            }}
                          >
                            Quarterly Reviews
                          </h3>
                          <p className="text-zinc-500 text-sm">In-depth quarterly analysis</p>
                        </div>
                      </div>
                      <p className="text-zinc-600 text-sm mb-4">
                        Comprehensive quarterly reports with area breakdowns and property type analysis.
                      </p>
                      <select 
                        className="w-full p-3 border-2 border-black rounded-lg text-black bg-white mb-4 focus:border-gold focus:ring-1 focus:ring-gold"
                        value={selectedQuarterlyDownload || ''}
                        onChange={(e) => setSelectedQuarterlyDownload(e.target.value)}
                      >
                        <option value="">Select Quarter...</option>
                        {quarterlyArchive.map((item) => (
                          <option key={item.quarter} value={item.date}>{item.quarter}</option>
                        ))}
                      </select>
                      <Link to="/market-report">
                        <Button 
                          variant="primary"
                          className="w-full"
                          disabled={!selectedQuarterlyDownload}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Report
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>

                {/* Data source note */}
                <div className="text-center mt-8 pt-6 border-t border-gold/30">
                  <p className="text-lg">
                    <span 
                      className="font-semibold"
                      style={{ 
                        background: "linear-gradient(135deg, #C8A766, #E8D5B0, #C8A766)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent"
                      }}
                    >
                      Source:
                    </span>
                    {" "}
                    <span className="text-black font-medium">Dubai Government Open Data</span>
                  </p>
                </div>
              </div>
            </section>

            {/* Gold Glow Divider */}
            <div className="h-1 bg-gradient-to-r from-transparent via-gold to-transparent shadow-[0_0_20px_rgba(200,167,102,0.5)]" />

            {/* Custom Report CTA */}
            <section id="custom-report" className="scroll-mt-24">
              <Card className="bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border-2 border-gold/50 overflow-hidden hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.4)] transition-all">
                <CardContent className="p-8 md:p-10 text-center relative">
                  {/* Subtle decorative elements */}
                  <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-gold/20 to-transparent rounded-full -translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-gold/15 to-transparent rounded-full translate-x-1/2 translate-y-1/2" />
                  
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center mx-auto mb-5">
                      <FileText className="w-7 h-7 text-gold" />
                    </div>
                    <h3 
                      className="text-2xl md:text-3xl font-bold mb-4"
                      style={{ 
                        fontFamily: "Poppins, sans-serif",
                        background: "linear-gradient(135deg, #C8A766, #E8D5B0, #C8A766)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        filter: "drop-shadow(0 2px 4px rgba(200,167,102,0.3))"
                      }}
                    >
                      Need a Custom Report?
                    </h3>
                    <p className="text-zinc-700 mb-6 max-w-lg mx-auto leading-relaxed">
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
            </section>
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
          <MarketIntelligenceNavigation current="/market-intelligence/reports" />
          
          {/* Disclaimer Box - White style */}
          <div className="max-w-3xl mx-auto mt-8">
            <div className="bg-white border border-gold/30 rounded-xl p-6 text-center">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Database className="w-5 h-5 text-gold" />
                <Shield className="w-5 h-5 text-gold" />
              </div>
              <p className="text-zinc-600 text-sm whitespace-pre-line">{MARKET_DISCLAIMER}</p>
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
      <Footer />
    </div>
  );
};

export default MarketReportsPage;
