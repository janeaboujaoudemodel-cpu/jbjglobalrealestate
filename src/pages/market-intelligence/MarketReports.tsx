import { motion } from "framer-motion";
import { FileText, Download, Calendar, Database, Shield, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
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
    description: 'Quick overview of transaction volumes, price movements, and rental trends for the past month.',
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
  {
    id: 'monthly-dec-2025',
    title: 'Monthly Market Snapshot',
    subtitle: 'December 2025',
    description: 'Year-end monthly summary capturing holiday season market activity.',
    type: 'monthly',
    date: '2025-12-15',
    pages: 12,
    featured: false,
  },
  {
    id: 'quarterly-q3-2025',
    title: 'Quarterly Market Review',
    subtitle: 'Q3 2025',
    description: 'Third quarter analysis with summer market dynamics and post-Eid trends.',
    type: 'quarterly',
    date: '2025-10-05',
    pages: 26,
    featured: false,
  },
  {
    id: 'monthly-nov-2025',
    title: 'Monthly Market Snapshot',
    subtitle: 'November 2025',
    description: 'November market activity with COP28 legacy impact analysis.',
    type: 'monthly',
    date: '2025-11-15',
    pages: 12,
    featured: false,
  },
];

const MarketReportsPage = () => {
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'monthly':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Monthly</Badge>;
      case 'quarterly':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Quarterly</Badge>;
      case 'annual':
        return <Badge className="bg-gold/20 text-gold border-gold/30">Annual</Badge>;
      default:
        return null;
    }
  };

  const featuredReports = reports.filter(r => r.featured);
  const archiveReports = reports.filter(r => !r.featured);

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Market Reports | Dubai Real Estate Reports | JBJ Global Real Estate"
        description="Download monthly, quarterly, and annual Dubai real estate market reports. Data-driven insights powered by official government Open Data."
        keywords="Dubai real estate reports, market analysis, property reports, investment reports"
        canonicalPath="/market-intelligence/reports"
      />

      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 via-black to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent" />
        
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

          <motion.p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto" variants={fadeInUp}>
            Downloadable reports with clear charts, government Open Data attribution, and editorial analysis.
          </motion.p>
        </motion.div>
      </section>

      {/* Featured Reports */}
      <section className="py-16 border-t border-zinc-900">
        <div className="container mx-auto px-4">
          <h2 className="text-white text-2xl font-bold mb-8" style={{ fontFamily: "Poppins, sans-serif" }}>
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
                <Card className="bg-zinc-900/50 border-zinc-800 hover:border-gold/30 transition-all h-full group">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      {getTypeBadge(report.type)}
                      <span className="text-zinc-600 text-xs">{report.pages} pages</span>
                    </div>

                    <h3 className="text-white font-bold text-lg mb-1">{report.title}</h3>
                    <p className="text-gold text-sm mb-3">{report.subtitle}</p>
                    <p className="text-zinc-500 text-sm mb-6 flex-grow">{report.description}</p>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                      <div className="flex items-center gap-2 text-zinc-600 text-xs">
                        <Calendar className="w-3 h-3" />
                        {new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <Link to="/market-report">
                        <Button size="sm" className="bg-gold/10 text-gold hover:bg-gold/20 border border-gold/30">
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

      {/* Archive */}
      <section className="py-16 border-t border-zinc-900">
        <div className="container mx-auto px-4">
          <h2 className="text-white text-2xl font-bold mb-8" style={{ fontFamily: "Poppins, sans-serif" }}>
            Report Archive
          </h2>

          <div className="max-w-3xl mx-auto space-y-4">
            {archiveReports.map((report) => (
              <div key={report.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{report.title}</p>
                    <p className="text-zinc-500 text-sm">{report.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {getTypeBadge(report.type)}
                  <Link to="/market-report">
                    <Button size="sm" variant="ghost" className="text-gold hover:text-gold-light">
                      <Download className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Report CTA */}
      <section className="py-16 border-t border-zinc-900">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-gold/20 max-w-3xl mx-auto">
            <CardContent className="p-8 text-center">
              <h3 className="text-white text-2xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                Need a Custom Report?
              </h3>
              <p className="text-zinc-400 mb-6">
                Our team can prepare bespoke market analysis for specific areas, property types, or investment scenarios.
              </p>
              <Link to="/contact">
                <Button className="bg-gradient-to-r from-gold to-gold-dark text-black font-semibold">
                  Request Custom Report
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 border-t border-zinc-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Database className="w-5 h-5 text-gold" />
              <Shield className="w-5 h-5 text-gold" />
            </div>
            <p className="text-zinc-500 text-sm whitespace-pre-line">{MARKET_DISCLAIMER}</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MarketReportsPage;
