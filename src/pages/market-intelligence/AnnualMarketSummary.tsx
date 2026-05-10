import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import { 
  ArrowLeft,
  Download,
  Calendar,
  TrendingUp,
  Building,
  Home,
  Key,
  MapPin,
  BarChart3,
  BookOpen
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// Sample annual data
const ANNUAL_DATA: Record<string, {
  year: string;
  publishDate: string;
  executiveSummary: string;
  yearInReview: string[];
  totalTransactions: { buy: number; sell: number; rent: number };
  structuralShifts: string[];
  rentBehavior: string;
  regulatoryContext: string;
  demographicContext: string;
  keyAreas: { name: string; narrative: string }[];
}> = {
  "2025": {
    year: "2025",
    publishDate: "2026-01-15",
    executiveSummary: "The year 2025 represented a period of maturation for the Dubai real estate market across BUY · SELL · RENT segments. Market activity demonstrated resilience and adaptability, with particular strength observed in the RENT sector as Dubai continued to attract residents and professionals from diverse backgrounds.",
    yearInReview: [
      "Transaction volumes across BUY · SELL · RENT remained robust throughout the year, with quarterly variations aligned with seasonal patterns.",
      "The RENT market experienced sustained demand, particularly in communities offering strong infrastructure and accessibility.",
      "Off-plan and ready property markets both demonstrated healthy activity levels, reflecting diverse buyer preferences.",
      "Premium segments maintained stability while mid-market and affordable segments showed growing momentum."
    ],
    totalTransactions: { buy: 89234, sell: 67123, rent: 112456 },
    structuralShifts: [
      "Continued preference for community-oriented developments with integrated amenities",
      "Growing importance of sustainability features in property decisions",
      "Increased demand for flexible spaces accommodating remote and hybrid work",
      "Rising interest in emerging areas with improving infrastructure"
    ],
    rentBehavior: "RENT demand remained elevated throughout 2025, driven by population growth and the influx of professionals and families. Communities with established schools, healthcare facilities, and retail options experienced particularly strong tenant interest. The RENT market demonstrated healthy absorption rates across most property types and price points.",
    regulatoryContext: "Dubai's real estate regulatory framework continued to evolve in 2025, with ongoing initiatives to enhance transparency and market integrity. The Dubai Land Department maintained its commitment to Open Data, facilitating market analysis and informed decision-making.",
    demographicContext: "Dubai's population growth trajectory continued in 2025, with diverse nationalities contributing to housing demand across BUY · SELL · RENT segments. The emirate's positioning as a global business and lifestyle destination remained a key driver of real estate activity.",
    keyAreas: [
      { 
        name: "Downtown Dubai", 
        narrative: "Maintained its premium positioning with consistent demand for both BUY and RENT. The iconic address continued to attract discerning buyers and tenants seeking central locations with world-class amenities." 
      },
      { 
        name: "Dubai Marina", 
        narrative: "Demonstrated strong performance across all segments. The waterfront lifestyle and connectivity remained key attractions for a diverse resident base." 
      },
      { 
        name: "Jumeirah Village Circle", 
        narrative: "Emerged as a notable performer in the mid-market segment, with growing interest from first-time buyers and families seeking value propositions." 
      },
      { 
        name: "Dubai Hills Estate", 
        narrative: "Continued its trajectory as a preferred family community, with strong BUY and RENT activity driven by green spaces and quality infrastructure." 
      },
    ],
  },
  "2024": {
    year: "2024",
    publishDate: "2025-01-15",
    executiveSummary: "The year 2024 marked a period of consolidation and sustained activity in the Dubai real estate market. BUY · SELL · RENT segments each demonstrated characteristic patterns, with the market showing adaptability to evolving economic conditions.",
    yearInReview: [
      "Market activity levels remained healthy across all segments throughout the year.",
      "RENT demand showed resilience with consistent occupancy rates across key communities.",
      "The BUY segment attracted both local and international interest.",
      "Infrastructure developments continued to influence area-level dynamics."
    ],
    totalTransactions: { buy: 82456, sell: 61234, rent: 98765 },
    structuralShifts: [
      "Growing emphasis on lifestyle-oriented communities",
      "Increased interest in properties with outdoor amenities",
      "Rising preference for newer developments with modern specifications",
      "Continued development of emerging corridors"
    ],
    rentBehavior: "The RENT market in 2024 demonstrated steady demand patterns with healthy tenant activity across major communities. Family-oriented areas and locations with good school catchments showed particular strength.",
    regulatoryContext: "Regulatory developments in 2024 continued to support market transparency and investor confidence. The Open Data initiatives facilitated market analysis and research.",
    demographicContext: "Dubai's diverse population continued to drive housing demand across segments, with professionals and families contributing to BUY and RENT activity.",
    keyAreas: [
      { 
        name: "Downtown Dubai", 
        narrative: "Maintained premium market positioning with consistent activity levels." 
      },
      { 
        name: "Dubai Marina", 
        narrative: "Continued to attract strong interest for its waterfront lifestyle." 
      },
      { 
        name: "Business Bay", 
        narrative: "Showed balanced commercial and residential activity." 
      },
      { 
        name: "Al Barsha", 
        narrative: "Demonstrated stable mid-market performance." 
      },
    ],
  },
};

const AnnualMarketSummary = () => {
  const { year } = useParams<{ year: string }>();
  const data = year ? ANNUAL_DATA[year] : null;

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-4">Report Not Found</h1>
          <Link to="/market-intelligence/reports" className="text-[#1A1A1A] hover:underline">
            Return to Reports
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
      <SEOHead
        title={`${data.year} Annual Summary | Dubai Real Estate | JBJ GLOBAL REAL ESTATE`}
        description={`Annual market summary for ${data.year} covering Dubai real estate across BUY · SELL · RENT. Comprehensive year-in-review by JBJ GLOBAL REAL ESTATE.`}
        keywords="Dubai annual summary, real estate year review, market analysis, Jane Bou Jaoude"
      />

      {/* Main Content - 3-layer system */}
      <div className="bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="mb-8"
          >
            <Link
              to="/market-intelligence/reports"
              className="inline-flex items-center gap-2 text-[#1A1A1A]/70 hover:text-[#1A1A1A] mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Reports
            </Link>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <Badge className="mb-3 bg-[#EFE6D6]/20 text-[#1A1A1A] border-[#B89555]/30">
                  ANNUAL MARKET SUMMARY
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A]">
                  {data.year} Year in Review
                </h1>
                <p className="text-[#1A1A1A]/70 mt-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Published: {new Date(data.publishDate).toLocaleDateString("en-US", { 
                    year: "numeric", 
                    month: "long", 
                    day: "numeric" 
                  })}
                </p>
              </div>
              <Button variant="primary">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </motion.div>

          {/* Executive Summary */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
              <CardHeader>
                <CardTitle className="text-lg text-[#1A1A1A]">Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#1A1A1A]/70 leading-relaxed">{data.executiveSummary}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Year in Review */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
              <CardHeader>
                <CardTitle className="text-lg text-[#1A1A1A] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#1A1A1A]" />
                  Year in Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {data.yearInReview.map((point, index) => (
                    <li key={index} className="flex gap-3 text-[#1A1A1A]/70">
                      <span className="text-[#1A1A1A]">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Annual Totals */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#1A1A1A]/70 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  BUY Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold text-[#1A1A1A]">
                  {data.totalTransactions.buy.toLocaleString()}
                </span>
                <p className="text-xs text-[#1A1A1A]/70 mt-1">Full year {data.year}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#1A1A1A]/70 flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  SELL Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold text-[#1A1A1A]">
                  {data.totalTransactions.sell.toLocaleString()}
                </span>
                <p className="text-xs text-[#1A1A1A]/70 mt-1">Full year {data.year}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#1A1A1A]/70 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  RENT Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold text-[#1A1A1A]">
                  {data.totalTransactions.rent.toLocaleString()}
                </span>
                <p className="text-xs text-[#1A1A1A]/70 mt-1">Full year {data.year}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Structural Shifts */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.25 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
              <CardHeader>
                <CardTitle className="text-lg text-[#1A1A1A] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#1A1A1A]" />
                  Structural Market Shifts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {data.structuralShifts.map((shift, index) => (
                    <li key={index} className="flex gap-3 text-[#1A1A1A]/70">
                      <span className="text-[#1A1A1A]">•</span>
                      <span>{shift}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* RENT Behavior */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
              <CardHeader>
                <CardTitle className="text-lg text-[#1A1A1A] flex items-center gap-2">
                  <Key className="w-5 h-5 text-[#1A1A1A]" />
                  RENT Behavior Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#1A1A1A]/70 leading-relaxed">{data.rentBehavior}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Regulatory & Demographic Context */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.35 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
          >
            <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-[#1A1A1A]">Regulatory Context</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#1A1A1A]/70">{data.regulatoryContext}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-[#1A1A1A]">Demographic Context</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#1A1A1A]/70">{data.demographicContext}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Key Areas */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#1A1A1A]" />
              Key Area Narratives
            </h2>
            <div className="space-y-4">
              {data.keyAreas.map((area, index) => (
                <Card key={index} className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
                  <CardContent className="pt-4">
                    <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">{area.name}</h3>
                    <p className="text-[#1A1A1A]/70">{area.narrative}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Methodology & Disclaimer */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Methodology & Disclaimer</h3>
                <p className="text-sm text-[#1A1A1A]/70 mb-4">
                  This report is based on aggregated official government Open Data and descriptive analytics.
                  It is provided for informational purposes only and does not constitute financial, investment, or legal advice.
                  This document contains historical information only and no forward-looking statements.
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-[#1A1A1A]/70">
                  <span>Data Sources: Dubai Land Department Open Data</span>
                  <span>•</span>
                  <span>Update Frequency: Annual</span>
                  <span>•</span>
                  <Link to="/market-intelligence/methodology" className="text-[#1A1A1A] hover:underline">
                    Full Methodology
                  </Link>
                </div>
                <div className="mt-4 pt-4 border-t border-[#B89555]/30">
                  <p className="text-xs text-[#1A1A1A]/70">
                    JBJ GLOBAL REAL ESTATE • Jane Bou Jaoude, Founder & CEO
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AnnualMarketSummary;
