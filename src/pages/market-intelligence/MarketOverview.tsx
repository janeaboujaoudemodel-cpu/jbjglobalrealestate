import { motion } from "framer-motion";
import { BarChart3, TrendingUp, TrendingDown, Minus, Database, Shield, Search, Building2, FileText, Landmark, Scale, ExternalLink, Users, Clock } from "lucide-react";
import PreFooterSeparator from "@/components/PreFooterSeparator";
import { SEOHead } from "@/components/SEOHead";
import { MarketIntelligenceSchema } from "@/components/seo/MarketIntelligenceSchema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MARKET_OVERVIEW_STATS, QUARTERLY_TRENDS, MARKET_DISCLAIMER } from "@/config/open-data-config";
import { MarketIntelligenceHero, MarketIntelligenceNavigation, MarketIntelligenceTableOfContents } from "@/components/market-intelligence";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// TOC items for the page
const tocItems = [
  { id: "introduction", title: "Introduction" },
  { id: "market-structure", title: "Market Structure & Regulation" },
  { id: "activity-measurement", title: "How Activity Is Measured" },
  { id: "rent-benchmarking", title: "Rent Benchmarking" },
  { id: "ownership-costs", title: "Ownership Costs" },
  { id: "government-planning", title: "Government Planning" },
  { id: "how-jbj-uses-data", title: "How JBJ Uses Data" },
  { id: "key-stats", title: "Key Statistics" },
  { id: "quarterly-trends", title: "Quarterly Trends" },
  { id: "navigation", title: "Explore More" },
];

// Premium Section Title Component - NO background highlight box on first word
const SectionTitle = ({ title, centered = true }: { title: string; centered?: boolean }) => {
  const words = title.split(' ');
  const firstWord = words[0];
  const restWords = words.slice(1).join(' ');
  
  return (
    <h2 
      className={`text-3xl md:text-4xl font-bold mb-8 ${centered ? 'text-center' : ''}`}
    >
      <span className="text-[#1A1A1A] mr-2">{firstWord}</span>
      <span className="text-[#1A1A1A] font-bold">{restWords}</span>
    </h2>
  );
};

// Content Section Component - Uses 3-layer system
const ContentSection = ({ 
  id, 
  icon: Icon, 
  title, 
  children,
  links
}: { 
  id: string; 
  icon: React.ElementType; 
  title: string; 
  children: React.ReactNode;
  links?: Array<{ label: string; url: string }>;
}) => {
  const words = title.split(' ');
  const firstWord = words[0];
  const restWords = words.slice(1).join(' ');

  return (
    <section id={id} className="scroll-mt-24 jj-section-champagne py-6 mb-3">
      <div className="px-4 md:px-8 lg:px-16 lg:pr-72 xl:pr-72">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="jj-card-inner p-6"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="jj-icon-box-active w-12 h-12 rounded-xl flex-shrink-0">
              <Icon className="w-6 h-6" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">
              <span className="text-[#1A1A1A]">{firstWord}</span>
              <span className="text-[#1A1A1A] ml-2">{restWords}</span>
            </h2>
          </div>
          <div className="text-[#1A1A1A]/70 leading-relaxed space-y-4">
            {children}
          </div>
          {links && links.length > 0 && (
            <div className="mt-6 pt-6 border-t border-[#B89555]/20 space-y-2">
              {links.map((link, idx) => (
                <a 
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#1A1A1A] hover:text-[#1A1A1A]-dark transition-colors text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

const MarketOverview = () => {
  const stats = [
    {
      label: "Total Transactions",
      value: MARKET_OVERVIEW_STATS.totalTransactions.toLocaleString(),
      change: MARKET_OVERVIEW_STATS.totalTransactionsChange,
      period: "YoY"
    },
    {
      label: "Avg Price/Sqft",
      value: `AED ${MARKET_OVERVIEW_STATS.avgPricePerSqft.toLocaleString()}`,
      change: MARKET_OVERVIEW_STATS.avgPriceChange,
      period: "YoY"
    },
    {
      label: "Rent Index",
      value: MARKET_OVERVIEW_STATS.avgRentIndex.toString(),
      change: MARKET_OVERVIEW_STATS.rentIndexChange,
      period: "YoY"
    },
    {
      label: "Days on Market",
      value: MARKET_OVERVIEW_STATS.daysOnMarket.toString(),
      change: MARKET_OVERVIEW_STATS.domChange,
      period: "YoY"
    },
  ];

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-[#B89555]" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-[#064E3B]" />;
    return <Minus className="w-4 h-4 text-[#1A1A1A]/60" />;
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <SEOHead 
        title="Dubai Real Estate Market Overview | BUY · SELL · RENT Trends | JBJ GLOBAL REAL ESTATE"
        description="UAE & Dubai real estate market trends and analysis. Transaction volumes, price movements, and rent trends powered by official government Open Data. No predictions, just insights."
        keywords="Dubai real estate market trends, Dubai property market analysis, Dubai rent trends, UAE property prices, Dubai transaction volume, real estate market overview"
        canonicalPath="/market-intelligence/overview"
      />
      <MarketIntelligenceSchema 
        type="overview" 
        lastUpdated={MARKET_OVERVIEW_STATS.reportDate}
        description="UAE & Dubai real estate macro snapshot with high-level transaction trends, price movements, and rent analysis powered by official government Open Data."
      />

      {/* Premium Hero */}
      <MarketIntelligenceHero
        badge="Market Intelligence"
        badgeIcon={BarChart3}
        title="Market Overview"
        description="Dubai's real estate market operates within a regulated framework led by the Dubai Land Department (DLD) and RERA. This overview presents how the market functions, how activity is measured, and how pricing, rent, and ownership costs are officially determined—using government sources only, without speculation or projections."
      />

      {/* Fixed TOC Sidebar */}
      <MarketIntelligenceTableOfContents 
        items={tocItems}
        title="In This Section"
        ctaAction={{
          label: "Find Your Property",
          href: "/properties",
          icon: Search
        }}
      />

      {/* Main Content - Full width edge-to-edge with 3-layer system */}
      <div className="pt-8 pb-10 bg-[#FDFBF7]">
        {/* Introduction Section */}
        <section id="introduction" className="scroll-mt-32 jj-section-champagne py-6 mb-3">
          <div className="px-4 md:px-8 lg:px-16 lg:pr-72 xl:pr-72">
            <div className="jj-card-inner p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="jj-icon-box-active w-12 h-12 rounded-xl flex-shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">
                  <span className="text-[#1A1A1A]">About</span>
                  <span className="text-[#1A1A1A] ml-2">This Page</span>
                </h2>
              </div>
              <div className="text-[#1A1A1A]/70 leading-relaxed">
                <p>
                  This page is descriptive, not predictive. It explains how the market works today and how official data should be read.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Market Structure & Regulation Section */}
        <section id="market-structure" className="scroll-mt-24 jj-section-champagne py-6 mb-3">
          <div className="px-4 md:px-8 lg:px-16 lg:pr-72 xl:pr-72">
            <div className="jj-card-inner p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="jj-icon-box-active w-12 h-12 rounded-xl flex-shrink-0">
                  <Landmark className="w-6 h-6" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">
                  <span className="text-[#1A1A1A]">Market</span>
                  <span className="text-[#1A1A1A] ml-2">Structure & Regulation</span>
                </h2>
              </div>
              <div className="text-[#1A1A1A]/70 leading-relaxed space-y-4">
                <p>
                  All real estate transactions, rental registrations, and ownership records in Dubai are governed and recorded by the Dubai Land Department (DLD). Regulatory oversight, rent controls, service charge approvals, and brokerage licensing fall under RERA.
                </p>
                <p>
                  Official real estate data, transaction records, rental benchmarks, and sector research are published directly by DLD through its open data and research portals.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-[#B89555]/20 space-y-2">
                <a 
                  href="https://dubailand.gov.ae/en/open-data/real-estate-data/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#1A1A1A] hover:text-[#1A1A1A]-dark transition-colors text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  DLD Real Estate Data Portal
                </a>
                <a 
                  href="https://dubailand.gov.ae/en/open-data/research/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#1A1A1A] hover:text-[#1A1A1A]-dark transition-colors text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  DLD Research Portal
                </a>
              </div>
            </div>
          </div>
        </section>
        {/* Remaining sections use ContentSection component which now has 3-layer styling */}

        {/* How Market Activity Is Measured */}
        <ContentSection id="activity-measurement" icon={BarChart3} title="How Market Activity Is Measured">
          <p>Dubai's market activity is measured through:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Registered sales transactions</li>
            <li>Registered rental contracts</li>
            <li>Project registrations and handovers</li>
            <li>Official service charge approvals</li>
            <li>Rental index benchmarks</li>
          </ul>
          <p className="mt-4">
            There is no unofficial or parallel system. Any credible market interpretation must align with these recorded datasets.
          </p>
        </ContentSection>

        {/* Rent Benchmarking & Adjustments */}
        <ContentSection 
          id="rent-benchmarking" 
          icon={Scale} 
          title="Rent Benchmarking & Adjustments"
        >
          <p>
            Rent changes in Dubai are regulated and assessed through RERA's official rent calculator tool. This tool defines whether a rent increase is permitted and by how much, based on location, unit type, and current market benchmarks.
          </p>
          <p>
            Rent discussions, renewals, and disputes are evaluated against this index—not market sentiment or private estimates.
          </p>
        </ContentSection>

        {/* Ownership Costs & Service Charges */}
        <ContentSection 
          id="ownership-costs" 
          icon={Building2} 
          title="Ownership Costs & Service Charges"
          links={[
            { label: "Official Service Charge Index", url: "https://dubailand.gov.ae/en/eservices/service-charge-index-overview/" }
          ]}
        >
          <p>
            Beyond purchase price or rent, ownership cost includes annual service charges approved by RERA. These charges vary by project and directly affect long-term holding costs.
          </p>
          <p>
            The official Service Charge Index allows buyers, investors, and landlords to verify approved service charges before committing to a property.
          </p>
        </ContentSection>

        {/* Market Context & Government Planning */}
        <ContentSection 
          id="government-planning" 
          icon={TrendingUp} 
          title="Market Context & Government Planning"
          links={[
            { label: "Dubai Economic Agenda D33", url: "https://www.protocol.dubai.ae/en/media-listing/news-events/mohammed-bin-rashid-launches-dubai-economic-agenda-d33-with-total-economic-targets-of-aed-32-trillion-over-next-10-years/" }
          ]}
        >
          <p>
            Dubai's real estate sector operates within broader government economic planning. Long-term infrastructure, population growth, and business expansion policies influence demand patterns over time.
          </p>
          <p>
            Dubai's Economic Agenda D33 outlines official economic objectives and growth targets over the coming decade. This agenda provides strategic context, not market guarantees.
          </p>
        </ContentSection>

        {/* How JBJ Uses Market Data */}
        <ContentSection id="how-jbj-uses-data" icon={Users} title="How JBJ Global Real Estate Uses Market Data">
          <p>JBJ Global Real Estate relies exclusively on:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>DLD-registered transaction data</li>
            <li>Official rental and service charge indices</li>
            <li>Government-published research and reports</li>
          </ul>
          <p className="mt-4">
            We do not base guidance on unverified dashboards, social media claims, or guaranteed-return statements. Market interpretation is grounded in officially published information and location-specific evaluation.
          </p>
          <div className="mt-6 p-4 bg-[#1A1A1A]/5 rounded-xl border border-[#B89555]/20">
            <p className="text-sm text-[#1A1A1A]/70 italic">
              This Market Overview serves as the foundation for deeper analysis in Area Intelligence, where performance is examined at a location and project level using the same official sources.
            </p>
          </div>
        </ContentSection>

        {/* Key Stats Grid - 3-layer system: black bg > active champagne section > champagne cards */}
        <section id="key-stats" className="scroll-mt-24 jj-section-champagne py-6 mb-3">
          <div className="px-4 md:px-8 lg:px-16 lg:pr-72 xl:pr-72">
            <SectionTitle title="Key Market Statistics" />
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="jj-card-inner text-center p-6 h-full">
                    <CardContent className="p-0">
                      <p className="text-lg font-semibold mb-2 text-[#1A1A1A]">
                        {stat.label}
                      </p>
                      <p className="text-[#1A1A1A] text-3xl font-bold mb-2">{stat.value}</p>
                      <div className="flex items-center justify-center gap-2">
                        {getTrendIcon(stat.change)}
                        <span className="text-sm font-semibold text-[#1A1A1A]">
                          {stat.change > 0 ? '+' : ''}{stat.change}% {stat.period}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Source Attribution */}
            <div className="text-center mt-8 pt-6 border-t border-[#B89555]/30">
              <p className="text-lg">
                <span className="font-semibold text-xl text-[#1A1A1A]">Source:</span>
                {" "}
                <span className="text-[#1A1A1A] font-medium text-lg">{MARKET_OVERVIEW_STATS.dataSource}</span>
              </p>
              <p className="text-[#1A1A1A]/70 text-sm mt-1">
                Last Updated: {MARKET_OVERVIEW_STATS.reportDate}
              </p>
            </div>
          </div>
        </section>

        {/* Transaction Trends - 3-layer system */}
        <section id="quarterly-trends" className="scroll-mt-24 jj-section-champagne py-6 mb-3">
          <div className="px-4 md:px-8 lg:px-16 lg:pr-72 xl:pr-72">
            <SectionTitle title="Quarterly Transaction Trends" />
            
            <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {QUARTERLY_TRENDS.map((quarter) => (
                <Card key={quarter.quarter} className="jj-card-inner">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-[#1A1A1A]">
                      {quarter.quarter}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#1A1A1A] text-2xl font-bold">{quarter.transactions.toLocaleString()}</p>
                    <p className="text-[#1A1A1A]/70 text-xs">Transactions</p>
                    <div className="mt-3 pt-3 border-t border-[#B89555]/20">
                      <p className="text-[#1A1A1A]/70 text-sm">AED {quarter.avgPrice}/sqft</p>
                      <div className="w-full bg-[#EFE6D6] border border-[#B89555]/30 rounded-full h-2 mt-2 overflow-hidden">
                        <div 
                          className="bg-[#1A1A1A] h-full rounded-full" 
                          style={{ width: `${quarter.index}%` }}
                        />
                      </div>
                      <p className="text-[#1A1A1A]/70 text-xs mt-1">Index: {quarter.index}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Market Intelligence Navigation - 3-layer system */}
        <section id="navigation" className="jj-section-champagne py-6 scroll-mt-24">
          <div className="container mx-auto px-4 lg:pr-72 xl:pr-72">
            <MarketIntelligenceNavigation current="/market-intelligence/overview" showStartHere={false} />
            
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
      </div>

      <PreFooterSeparator 
        title="Explore More Market Intelligence"
        subtitle="Dive deeper into area-specific data and detailed market reports."
        primaryLink="/market-intelligence/areas"
        primaryText="View Area Intelligence"
        secondaryLink="/market-intelligence/reports"
        secondaryText="Browse Reports"
      />
    </div>
  );
};

export default MarketOverview;
