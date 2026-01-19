import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Calendar, Database, Shield, ExternalLink, ArrowRight, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { MarketIntelligenceSchema } from "@/components/seo/MarketIntelligenceSchema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MARKET_DISCLAIMER } from "@/config/open-data-config";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

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

      {/* Hero - Premium Video/Photo Background */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover opacity-50"
            poster="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80"
          >
            <source 
              src="https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4" 
              type="video/mp4" 
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent z-[1]" />
        
        <motion.div 
          className="relative z-10 container mx-auto px-4 py-24 text-center"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
        >
          <motion.div className="flex items-center justify-center gap-2 mb-6" variants={fadeInUp}>
            <FileText className="w-6 h-6 text-gold" />
            <span className="text-gold text-sm uppercase tracking-[0.3em]">Market Intelligence</span>
          </motion.div>

          <motion.h1 
            className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            style={{ fontFamily: "Poppins, sans-serif" }}
            variants={fadeInUp}
          >
            Market Reports
          </motion.h1>

          <motion.p className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto" variants={fadeInUp}>
            Downloadable reports with clear charts, government Open Data attribution, and editorial analysis.
          </motion.p>
        </motion.div>
      </section>

      {/* Featured Reports - Premium champagne Cards */}
      <section className="py-16 border-t border-zinc-200 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6]">
        <div className="container mx-auto px-4">
          <h2 className="text-black text-2xl font-bold mb-8 text-center" style={{ fontFamily: "Poppins, sans-serif" }}>
            Latest Reports
          </h2>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {featuredReports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white border-zinc-200 hover:border-gold hover:shadow-xl hover:shadow-gold/10 transition-all h-full group">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      {getTypeBadge(report.type)}
                      <span className="text-zinc-400 text-xs bg-zinc-100 px-2 py-1 rounded">{report.pages} pages</span>
                    </div>

                    <h3 className="text-black font-bold text-xl mb-1">{report.title}</h3>
                    <p className="text-gold font-medium text-sm mb-3">{report.subtitle}</p>
                    <p className="text-zinc-600 text-sm mb-6 flex-grow leading-relaxed">{report.description}</p>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
                      <div className="flex items-center gap-2 text-zinc-400 text-xs">
                        <Calendar className="w-3 h-3" />
                        {new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <Link to="/market-report">
                        <Button size="sm" className="bg-black text-white hover:bg-zinc-900">
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

      {/* Report Archive - Black background with white title */}
      <section className="py-16 border-t border-zinc-800 bg-black">
        <div className="container mx-auto px-4">
          <h2 className="text-white text-2xl font-bold mb-8 text-center" style={{ fontFamily: "Poppins, sans-serif" }}>
            Report Archive
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly Reports Selector */}
            <Card className="bg-white border-zinc-200 hover:border-gold/50 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-black font-bold text-lg">Monthly Snapshots</h3>
                    <p className="text-zinc-500 text-sm">Quick monthly market overviews</p>
                  </div>
                </div>
                <p className="text-zinc-600 text-sm mb-4">
                  Download any monthly report from our archive. Data sourced from Dubai Government Open Data.
                </p>
                <select 
                  className="w-full p-3 border border-zinc-300 rounded-lg text-black bg-white mb-4 focus:border-gold focus:ring-1 focus:ring-gold"
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
                    className="w-full bg-blue-500 text-white hover:bg-blue-600"
                    disabled={!selectedMonthlyDownload}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Quarterly Reports Selector */}
            <Card className="bg-white border-zinc-200 hover:border-gold/50 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-black font-bold text-lg">Quarterly Reviews</h3>
                    <p className="text-zinc-500 text-sm">In-depth quarterly analysis</p>
                  </div>
                </div>
                <p className="text-zinc-600 text-sm mb-4">
                  Comprehensive quarterly reports with area breakdowns and property type analysis.
                </p>
                <select 
                  className="w-full p-3 border border-zinc-300 rounded-lg text-black bg-white mb-4 focus:border-gold focus:ring-1 focus:ring-gold"
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
                    className="w-full bg-purple-500 text-white hover:bg-purple-600"
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
          <p className="text-center text-zinc-500 text-xs mt-8">
            All reports are generated from official Dubai Government Open Data sources
          </p>
        </div>
      </section>

      {/* Custom Report CTA - Gold Champagne Theme */}
      <section className="py-16 border-t border-zinc-200 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6]">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-br from-gold/10 via-gold/5 to-amber-50 border-gold/30 max-w-3xl mx-auto overflow-hidden">
            <CardContent className="p-8 md:p-10 text-center relative">
              {/* Subtle decorative elements */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-gold/20 to-transparent rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-gold/15 to-transparent rounded-full translate-x-1/2 translate-y-1/2" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center mx-auto mb-5">
                  <FileText className="w-7 h-7 text-gold" />
                </div>
                <h3 className="text-black text-2xl md:text-3xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                  Need a Custom Report?
                </h3>
                <p className="text-zinc-700 mb-6 max-w-lg mx-auto leading-relaxed">
                  Our market intelligence team can prepare bespoke analysis for specific areas, property types, or investment scenarios tailored to your requirements.
                </p>
                <Link to="/contact">
                  <Button className="bg-black text-white hover:bg-zinc-900 font-semibold px-8 py-6 text-base">
                    Request Custom Report
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Internal Links */}
      <section className="py-12 border-t border-zinc-900">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <Link to="/market-intelligence/overview" className="group">
              <Card className="bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border-gold/30 hover:border-gold/50 hover:shadow-lg transition-all shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="text-gold font-medium group-hover:text-gold-dark transition-colors">Market Overview</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </CardContent>
              </Card>
            </Link>
            <Link to="/market-intelligence/areas" className="group">
              <Card className="bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border-gold/30 hover:border-gold/50 hover:shadow-lg transition-all shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="text-gold font-medium group-hover:text-gold-dark transition-colors">Area Intelligence</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </CardContent>
              </Card>
            </Link>
            <Link to="/market-intelligence/methodology" className="group">
              <Card className="bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border-gold/30 hover:border-gold/50 hover:shadow-lg transition-all shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="text-gold font-medium group-hover:text-gold-dark transition-colors">Methodology</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </CardContent>
              </Card>
            </Link>
          </div>
          
          {/* Disclaimer Box - White style */}
          <div className="max-w-3xl mx-auto mt-8">
            <div className="bg-white border border-zinc-200 rounded-xl p-6 text-center">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Database className="w-5 h-5 text-gold" />
                <Shield className="w-5 h-5 text-gold" />
              </div>
              <p className="text-zinc-600 text-sm whitespace-pre-line">{MARKET_DISCLAIMER}</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MarketReportsPage;
