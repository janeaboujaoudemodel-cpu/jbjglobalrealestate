import { motion } from "framer-motion";
import { MapPin, TrendingUp, TrendingDown, Database, Shield, ArrowRight, Search, FileText, Building2, BarChart3, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import PreFooterSeparator from "@/components/PreFooterSeparator";
import { SEOHead } from "@/components/SEOHead";
import { MarketIntelligenceSchema } from "@/components/seo/MarketIntelligenceSchema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DUBAI_AREAS_MARKET_DATA, MARKET_DISCLAIMER } from "@/config/open-data-config";
import { MarketIntelligenceHero, MarketIntelligenceNavigation, MarketIntelligenceTableOfContents } from "@/components/market-intelligence";

// TOC items for the page
const tocItems = [
  { id: "introduction", title: "Introduction" },
  { id: "what-area-intelligence-means", title: "What Area Intelligence Means" },
  { id: "official-data-sources", title: "Official Data Sources" },
  { id: "how-area-evaluated", title: "How an Area Is Evaluated" },
  { id: "what-it-does-not-do", title: "What It Does Not Do" },
  { id: "why-it-matters", title: "Why It Matters" },
  { id: "how-jbj-uses", title: "How JBJ Uses Area Intelligence" },
  { id: "area-grid", title: "Area Intelligence Grid" },
  { id: "navigation", title: "Explore More" },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const AreaIntelligence = () => {
  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return <Badge variant="secondary" className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/45">Bullish</Badge>;
      case 'bearish':
        return <Badge variant="outline" className="bg-[#F7F2EA] text-[#1A1A1A] border border-[#B89555]/35">Bearish</Badge>;
      default:
        return <Badge variant="secondary" className="bg-[#F7F2EA] text-[#1A1A1A] border border-[#B89555]/35">Neutral</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <SEOHead 
        title="Dubai Area Intelligence | Rent Trends & Property Prices by Neighborhood | JBJ GLOBAL REAL ESTATE"
        description="Deep dive into Dubai neighborhoods. Historical price trends, rent analysis, demand vs supply indicators, and market insights for BUY · SELL · RENT decisions."
        keywords="Dubai areas property prices, rent trends Dubai Marina, Business Bay real estate, Downtown Dubai prices, Palm Jumeirah market, JBR property trends, Dubai neighborhood analysis"
        canonicalPath="/market-intelligence/areas"
      />
      <MarketIntelligenceSchema 
        type="area"
        description="Deep dive into Dubai's prime neighborhoods with historical price trends, rent analysis, and demand indicators for informed BUY · SELL · RENT decisions."
      />

      {/* Premium Hero with Video */}
      <MarketIntelligenceHero
        badge="Market Intelligence"
        badgeIcon={MapPin}
        title="Area Intelligence"
        description="Area Intelligence explains how individual locations in Dubai are evaluated using official, location-specific government data. This page shows how to read areas, not how to speculate on them. All insights are descriptive and based on registered activity."
        videoSrc="/__l5e/assets-v1/4f157c6f-dc02-4bc4-8cfd-81a3537feb6f/mi-area-intelligence.mp4"
        videoPoster="https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=1920&q=80"
      />

      {/* Main Content - Black background with 3-layer system */}
      <div className="bg-[#FDFBF7] pt-8 pb-10">
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
        
        <div className="space-y-0">
            
          {/* Introduction Section - 3-layer system */}
          <section id="introduction" className="scroll-mt-32 jj-section-champagne py-6 mb-3">
            <div className="px-4 md:px-8 lg:px-16 lg:pr-72 xl:pr-72">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
              >
                  <div className="jj-card-inner p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="jj-icon-box-active w-12 h-12 rounded-xl">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">
                        <span className="text-[#1A1A1A]">No</span> Assumptions, Projections, or Guarantees
                      </h2>
                    </div>
                    <p className="text-[#1A1A1A]/70 text-lg leading-relaxed">
                      No assumptions, projections, or guarantees are used. All insights are descriptive and based on registered activity from official government sources.
                    </p>
                  </div>
                </motion.div>
              </div>
            </section>

          {/* What Area Intelligence Means - 3-layer system */}
          <section id="what-area-intelligence-means" className="scroll-mt-24 jj-section-champagne py-6 mb-3">
            <div className="px-4 md:px-8 lg:px-16 lg:pr-72 xl:pr-72">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
              >
                  <div className="jj-card-inner p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="jj-icon-box-active w-12 h-12 rounded-xl">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">
                        <span className="text-[#1A1A1A]">What</span> "Area Intelligence" Means
                      </h2>
                    </div>
                    <p className="text-[#1A1A1A]/70 text-lg leading-relaxed mb-6">
                      Area Intelligence refers to the structured analysis of a specific location based on:
                    </p>
                    <ul className="grid md:grid-cols-2 gap-3">
                      {[
                        "Registered sales transactions",
                        "Registered rental contracts",
                        "Property type distribution",
                        "Supply and handover activity",
                        "Approved service charges",
                        "Official rental benchmarks"
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-[#1A1A1A]/70">
                          <CheckCircle2 className="w-5 h-5 text-[#1A1A1A] flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 p-4 bg-[#1A1A1A]/5 rounded-xl border border-[#B89555]/20">
                      <p className="text-[#1A1A1A]/70 text-sm italic">
                        Each area is assessed independently. No two locations behave the same, even within the same district.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </section>

          {/* Official Data Sources - 3-layer system */}
          <section id="official-data-sources" className="scroll-mt-24 jj-section-champagne py-6 mb-3">
            <div className="px-4 md:px-8 lg:px-16 lg:pr-72 xl:pr-72">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
              >
                  <div className="jj-card-inner p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="jj-icon-box-active w-12 h-12 rounded-xl">
                        <Database className="w-6 h-6" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">
                        <span className="text-[#1A1A1A]">Official</span> Data Sources Used Per Area
                      </h2>
                    </div>
                    <p className="text-[#1A1A1A]/70 text-lg leading-relaxed mb-6">
                      All area-level analysis relies only on data published or recognized by the Dubai Land Department (DLD) and RERA, including:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { title: "DLD Open Data", desc: "Sales & rental transactions by area", url: "https://dubailand.gov.ae/en/open-data/real-estate-data/" },
                        { title: "DLD Market Research & Reports", desc: "Official research publications", url: "https://dubailand.gov.ae/en/open-data/research/" },
                        { title: "RERA Rental Index", desc: "Area-specific rent benchmarks", url: "https://dubailand.gov.ae/en/eservices/rental-index/" },
                        { title: "RERA Service Charge Index", desc: "Project-specific costs", url: "https://dubailand.gov.ae/en/eservices/service-charge-index-overview/" }
                      ].map((source, idx) => (
                        <a 
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-4 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 hover:border-[#B89555] rounded-xl transition-all group shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors">{source.title}</h4>
                              <p className="text-[#1A1A1A]/70 text-sm mt-1">{source.desc}</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-[#1A1A1A] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </section>

          {/* How an Area Is Evaluated - 3-layer system */}
          <section id="how-area-evaluated" className="scroll-mt-24 jj-section-champagne py-6 mb-3">
            <div className="px-4 md:px-8 lg:px-16 lg:pr-72 xl:pr-72">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
              >
                  <div className="jj-card-inner p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="jj-icon-box-active w-12 h-12 rounded-xl">
                        <BarChart3 className="w-6 h-6" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">
                        <span className="text-[#1A1A1A]">How</span> an Area Is Evaluated
                      </h2>
                    </div>
                    <p className="text-[#1A1A1A]/70 text-lg leading-relaxed mb-6">
                      Each area is reviewed using the same structured framework:
                    </p>
                    <div className="space-y-4">
                      {[
                        { num: "1", title: "Transaction Activity", desc: "Registered sale volumes, value ranges, and frequency of transactions recorded with DLD." },
                        { num: "2", title: "Rental Activity", desc: "Number of registered tenancy contracts, average rental ranges, and compliance with the official rental index." },
                        { num: "3", title: "Property Mix", desc: "Distribution between apartments, villas, townhouses, and commercial units, based on registered property types." },
                        { num: "4", title: "Supply Status", desc: "Existing stock versus registered handovers and newly delivered units, as published by DLD." },
                        { num: "5", title: "Cost Structure", desc: "Approved service charges and municipality fees applicable to properties within the area." }
                      ].map((item, idx) => (
                        <div key={idx} className="flex gap-4 p-4 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 rounded-xl">
                          <div className="w-10 h-10 rounded-full bg-[#EFE6D6] border border-[#B89555] flex items-center justify-center flex-shrink-0">
                            <span className="text-[#B89555] font-bold">{item.num}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#1A1A1A]">{item.title}</h4>
                            <p className="text-[#1A1A1A]/70 text-sm mt-1">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </section>

          {/* What Area Intelligence Does Not Do - 3-layer system */}
          <section id="what-it-does-not-do" className="scroll-mt-24 jj-section-champagne py-6 mb-3">
            <div className="px-4 md:px-8 lg:px-16 lg:pr-72 xl:pr-72">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
              >
                  <div className="jj-card-inner p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="jj-icon-box-active w-12 h-12 rounded-xl">
                        <Shield className="w-6 h-6" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">
                        <span className="text-[#1A1A1A]">What</span> Area Intelligence Does Not Do
                      </h2>
                    </div>
                    <p className="text-[#1A1A1A]/70 text-lg leading-relaxed mb-6">
                      Area Intelligence does not:
                    </p>
                    <ul className="space-y-3 mb-6">
                      {[
                        "Rank areas by \"best ROI\"",
                        "Predict future price movements",
                        "Assign scores or ratings",
                        "Provide guarantees or forecasts"
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-[#1A1A1A]/70">
                          <div className="w-6 h-6 rounded-full bg-[#EFE6D6] border border-[#B89555]/35 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#1A1A1A] text-xs font-bold">✕</span>
                          </div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="p-4 bg-[#EFE6D6] rounded-xl border border-[#B89555]/25">
                      <p className="text-[#1A1A1A]/70 text-sm font-medium">
                        Any area discussion that promises returns or future appreciation is not compliant with Dubai real estate regulations.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </section>

          {/* Why Area-Level Analysis Matters - 3-layer system */}
          <section id="why-it-matters" className="scroll-mt-24 jj-section-champagne py-6 mb-3">
            <div className="px-4 md:px-8 lg:px-16 lg:pr-72 xl:pr-72">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
              >
                <div className="jj-card-inner p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="jj-icon-box-active w-12 h-12 rounded-xl">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">
                      <span className="text-[#1A1A1A]">Why</span> Area-Level Analysis Matters
                    </h2>
                  </div>
                    <p className="text-[#1A1A1A]/70 text-lg leading-relaxed mb-6">
                      Dubai's real estate market is not uniform. Performance, demand, and tenant behavior vary significantly between areas due to:
                    </p>
                    <ul className="grid md:grid-cols-2 gap-3 mb-6">
                      {[
                        "Zoning regulations",
                        "Property age and density",
                        "Infrastructure maturity",
                        "Tenant profiles",
                        "Approved pricing benchmarks"
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-[#1A1A1A]/70">
                          <CheckCircle2 className="w-5 h-5 text-[#1A1A1A] flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="p-4 bg-[#1A1A1A]/5 rounded-xl border border-[#B89555]/20">
                      <p className="text-[#1A1A1A]/70 text-sm">
                        Understanding these differences helps buyers, sellers, landlords, and tenants make informed decisions based on where a property is located—not just the property itself.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </section>

          {/* How JBJ Uses Area Intelligence - 3-layer system */}
          <section id="how-jbj-uses" className="scroll-mt-24 jj-section-champagne py-6 mb-3">
            <div className="px-4 md:px-8 lg:px-16 lg:pr-72 xl:pr-72">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
              >
                  <div className="jj-card-inner p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="jj-icon-box-active w-12 h-12 rounded-xl">
                        <FileText className="w-6 h-6" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">
                        <span className="text-[#1A1A1A]">How</span> JBJ Global Real Estate Uses Area Intelligence
                      </h2>
                    </div>
                    <p className="text-[#1A1A1A]/70 text-lg leading-relaxed mb-6">
                      JBJ Global Real Estate uses area intelligence to:
                    </p>
                    <ul className="space-y-3 mb-6">
                      {[
                        "Compare locations objectively",
                        "Explain pricing differences clearly",
                        "Align properties with client objectives",
                        "Avoid misrepresentation or over-marketing"
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-[#1A1A1A]/70">
                          <CheckCircle2 className="w-5 h-5 text-[#1A1A1A] flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="p-4 bg-[#EFE6D6]/10 rounded-xl border border-[#B89555]/30">
                      <p className="text-[#1A1A1A]/70 text-sm font-medium">
                        All explanations are grounded in registered data and official benchmarks.
                      </p>
                    </div>
                    <div className="mt-6 p-4 bg-[#EFE6D6] rounded-xl border border-[#B89555]/30">
                      <p className="text-[#1A1A1A]/70 text-sm">
                        Area Intelligence feeds directly into <Link to="/market-intelligence/reports" className="text-[#1A1A1A] font-semibold hover:underline">Market Reports</Link>, where trends are summarized at a broader market level using the same official datasets.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </section>

          {/* Areas Grid - 3-layer system */}
          <section id="area-grid" className="scroll-mt-24 jj-section-champagne py-6 mb-3">
            <div className="px-4 md:px-8 lg:px-16 lg:pr-72 xl:pr-72">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
              >
                  <div className="jj-card-inner p-6">
                    <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
                      <span className="text-[#1A1A1A]">Dubai</span>{" "}
                      <span className="text-[#1A1A1A]">Neighborhood Analysis</span>
                    </h2>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {DUBAI_AREAS_MARKET_DATA.map((area, index) => (
                        <motion.div
                          key={area.area}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Link to={`/market-intelligence/areas/${area.area.toLowerCase().replace(/\s+/g, '-')}`}>
                            <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 hover:border-[#B89555] hover:shadow-[0_0_25px_rgba(200,167,102,0.4)] transition-all h-full group cursor-pointer">
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                  <div>
                                    <h3 className="text-lg font-bold mb-1 text-[#1A1A1A]">
                                      {area.area}
                                    </h3>
                                    {getTrendBadge(area.trend)}
                                  </div>
                                  <div className="text-right">
                                    <div className="flex items-center gap-1">
                                      {area.yoyChange > 0 ? (
                                        <TrendingUp className="w-4 h-4 text-[#B89555]" />
                                      ) : (
                                        <TrendingDown className="w-4 h-4 text-[#064E3B]" />
                                      )}
                                      <span className="text-[#1A1A1A] font-medium">
                                        {area.yoyChange > 0 ? '+' : ''}{area.yoyChange}%
                                      </span>
                                    </div>
                                    <p className="text-[#1A1A1A]/70 text-xs">YoY</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div className="bg-[#FDFBF7]/60 border border-[#B89555]/20 rounded-lg p-2">
                                    <p className="text-[#1A1A1A]/70 text-xs">Price Index</p>
                                    <p className="text-[#1A1A1A] font-semibold">{area.priceIndex}</p>
                                  </div>
                                  <div className="bg-[#FDFBF7]/60 border border-[#B89555]/20 rounded-lg p-2">
                                    <p className="text-[#1A1A1A]/70 text-xs">Rental Index</p>
                                    <p className="text-[#1A1A1A] font-semibold">{area.rentalIndex}</p>
                                  </div>
                                  <div>
                                    <p className="text-[#1A1A1A]/70 text-xs">Demand</p>
                                    <div className="w-full bg-[#064E3B]/10 rounded-full h-2.5 mt-1" data-score-bar>
                                      <div 
                                        className="bg-[#064E3B] h-full rounded-full" 
                                        style={{ width: `${area.demandScore}%` }}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[#1A1A1A]/70 text-xs">Supply</p>
                                    <div className="w-full bg-[#064E3B]/10 rounded-full h-2.5 mt-1" data-score-bar>
                                      <div 
                                        className="bg-[#064E3B] h-full rounded-full" 
                                        style={{ width: `${area.supplyScore}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="border-t border-[#B89555]/30 pt-4">
                                  <ul className="space-y-1">
                                    {area.highlights.slice(0, 2).map((highlight, i) => (
                                      <li key={i} className="text-[#1A1A1A]/70 text-xs flex items-start gap-2">
                                        <span className="text-[#1A1A1A]">•</span>
                                        {highlight}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="mt-4 flex items-center justify-between text-[#1A1A1A] text-sm font-medium">
                                  <span>View Full Analysis</span>
                                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
          </section>
        </div>
      </div>

      {/* Market Intelligence Navigation - 3-layer system */}
      <section id="navigation" className="py-6 jj-section-champagne scroll-mt-24">
        <div className="container mx-auto px-4 lg:pr-72 xl:pr-72">
          <MarketIntelligenceNavigation current="/market-intelligence/areas" />
          
          {/* Disclaimer Box */}
          <div className="max-w-3xl mx-auto mt-8">
            <div className="jj-card-inner p-6 text-center">
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
        subtitle="Get a high-level overview of the market or download detailed reports."
        primaryLink="/market-intelligence/overview"
        primaryText="Market Overview"
        secondaryLink="/market-intelligence/reports"
        secondaryText="Market Reports"
      />
    </div>
  );
};

export default AreaIntelligence;
