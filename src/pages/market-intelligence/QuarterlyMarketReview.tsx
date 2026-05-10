import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import { FounderContent } from "@/components/FounderContent";
import { 
  ArrowLeft,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Building,
  Home,
  Key,
  MapPin,
  Activity,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// Sample quarterly data
const QUARTERLY_DATA: Record<string, {
  period: string;
  publishDate: string;
  executiveSummary: string;
  buySegment: { transactions: number; change: number; insight: string };
  sellSegment: { transactions: number; change: number; insight: string };
  rentSegment: { transactions: number; change: number; insight: string };
  supplyDemand: { status: "balanced" | "supply_pressure" | "demand_pressure"; description: string };
  areaAnalysis: { name: string; buyActivity: string; rentActivity: string; outlook: string }[];
}> = {
  "2025-q4": {
    period: "Q4 2025",
    publishDate: "2026-01-10",
    executiveSummary: "The fourth quarter of 2025 demonstrated resilient market conditions across BUY · SELL · RENT segments in Dubai. Transaction activity maintained healthy levels with RENT demand showing particular strength in family-oriented communities. The quarter closed with balanced supply-demand dynamics across most key areas.",
    buySegment: { 
      transactions: 24567, 
      change: 4.2, 
      insight: "BUY transactions increased moderately, driven by continued interest in ready properties and select off-plan launches." 
    },
    sellSegment: { 
      transactions: 18234, 
      change: 2.1, 
      insight: "SELL activity remained steady with healthy listing absorption rates across premium and mid-market segments." 
    },
    rentSegment: { 
      transactions: 31456, 
      change: 6.8, 
      insight: "RENT transactions saw notable growth, particularly in areas with strong community infrastructure and accessibility." 
    },
    supplyDemand: { 
      status: "balanced", 
      description: "Overall market conditions remained balanced with adequate inventory across most property types and locations." 
    },
    areaAnalysis: [
      { 
        name: "Downtown Dubai", 
        buyActivity: "Sustained premium demand", 
        rentActivity: "High occupancy maintained", 
        outlook: "Stable momentum expected" 
      },
      { 
        name: "Dubai Marina", 
        buyActivity: "Consistent transaction levels", 
        rentActivity: "Strong tenant demand", 
        outlook: "Continued strength" 
      },
      { 
        name: "JVC", 
        buyActivity: "Growing first-time buyer interest", 
        rentActivity: "Increasing family demand", 
        outlook: "Positive trajectory" 
      },
      { 
        name: "Business Bay", 
        buyActivity: "Mixed residential/commercial", 
        rentActivity: "Moderate activity", 
        outlook: "Steady conditions" 
      },
    ],
  },
  "2025-q3": {
    period: "Q3 2025",
    publishDate: "2025-10-10",
    executiveSummary: "Q3 2025 reflected seasonal patterns with summer moderation followed by renewed activity in September. The BUY · SELL · RENT segments each demonstrated characteristic behavior aligned with historical trends.",
    buySegment: { 
      transactions: 22134, 
      change: -1.5, 
      insight: "BUY activity experienced typical summer moderation before recovering in late September." 
    },
    sellSegment: { 
      transactions: 17845, 
      change: 0.8, 
      insight: "SELL volumes remained stable throughout the quarter with consistent listing activity." 
    },
    rentSegment: { 
      transactions: 29456, 
      change: 3.2, 
      insight: "RENT demand persisted strongly, particularly from relocating professionals and families." 
    },
    supplyDemand: { 
      status: "demand_pressure", 
      description: "Mild demand pressure observed in select family communities and waterfront locations." 
    },
    areaAnalysis: [
      { 
        name: "Palm Jumeirah", 
        buyActivity: "Premium segment stable", 
        rentActivity: "High-end RENT demand", 
        outlook: "Premium positioning maintained" 
      },
      { 
        name: "Dubai Hills Estate", 
        buyActivity: "Family buyer interest", 
        rentActivity: "Strong community demand", 
        outlook: "Growing momentum" 
      },
      { 
        name: "Al Barsha", 
        buyActivity: "Steady mid-market", 
        rentActivity: "Established tenant base", 
        outlook: "Stable conditions" 
      },
      { 
        name: "Jumeirah Village Circle", 
        buyActivity: "Affordable segment active", 
        rentActivity: "Value-driven RENT", 
        outlook: "Continued interest" 
      },
    ],
  },
};

const QuarterlyMarketReview = () => {
  const { period } = useParams<{ period: string }>();
  const data = period ? QUARTERLY_DATA[period] : null;

  if (!data) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Report Not Found</h1>
          <Link to="/market-intelligence/reports" className="text-[#1A1A1A] hover:underline">
            Return to Reports
          </Link>
        </div>
      </div>
    );
  }

  const getChangeIndicator = (change: number) => {
    if (change > 0) return <span className="text-emerald-600">+{change}%</span>;
    if (change < 0) return <span className="text-red-600">{change}%</span>;
    return <span className="text-[#1A1A1A]/70">0%</span>;
  };

  const getSupplyDemandColor = (status: string) => {
    switch (status) {
      case "balanced": return "bg-emerald-500/20 text-emerald-600 border-emerald-500/30";
      case "supply_pressure": return "bg-amber-500/20 text-amber-600 border-amber-500/30";
      case "demand_pressure": return "bg-blue-500/20 text-blue-600 border-blue-500/30";
      default: return "bg-[#B89555]/20 text-[#1A1A1A]/70 border-[#B89555]/30";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
      <SEOHead
        title={`${data.period} Quarterly Review | Dubai Real Estate | JBJ GLOBAL REAL ESTATE`}
        description={`Quarterly market review for ${data.period} covering Dubai real estate across BUY · SELL · RENT. Institutional-grade analysis by JBJ GLOBAL REAL ESTATE.`}
        keywords="Dubai quarterly review, real estate analysis, institutional report, Jane Bou Jaoude"
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
                  QUARTERLY MARKET REVIEW
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A]">
                  {data.period}
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

          {/* Segment Analysis */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#1A1A1A]" />
              Segment Performance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[#1A1A1A]/70 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    BUY Segment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold text-[#1A1A1A]">
                      {data.buySegment.transactions.toLocaleString()}
                    </span>
                    {getChangeIndicator(data.buySegment.change)}
                  </div>
                  <p className="text-xs text-[#1A1A1A]/70">{data.buySegment.insight}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[#1A1A1A]/70 flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    SELL Segment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold text-[#1A1A1A]">
                      {data.sellSegment.transactions.toLocaleString()}
                    </span>
                    {getChangeIndicator(data.sellSegment.change)}
                  </div>
                  <p className="text-xs text-[#1A1A1A]/70">{data.sellSegment.insight}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[#1A1A1A]/70 flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    RENT Segment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold text-[#1A1A1A]">
                      {data.rentSegment.transactions.toLocaleString()}
                    </span>
                    {getChangeIndicator(data.rentSegment.change)}
                  </div>
                  <p className="text-xs text-[#1A1A1A]/70">{data.rentSegment.insight}</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Supply-Demand Balance */}
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
                  <Activity className="w-5 h-5 text-[#1A1A1A]" />
                  Supply-Demand Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-3">
                  <Badge className={getSupplyDemandColor(data.supplyDemand.status)}>
                    {data.supplyDemand.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
                <p className="text-[#1A1A1A]/70">{data.supplyDemand.description}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Area Analysis */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#1A1A1A]" />
              Area Analysis
            </h2>
            <div className="space-y-4">
              {data.areaAnalysis.map((area, index) => (
                <Card key={index} className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
                  <CardContent className="pt-4">
                    <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3">{area.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-[#1A1A1A]/70 mb-1">BUY Activity</p>
                        <p className="text-[#1A1A1A]/70">{area.buyActivity}</p>
                      </div>
                      <div>
                        <p className="text-[#1A1A1A]/70 mb-1">RENT Activity</p>
                        <p className="text-[#1A1A1A]/70">{area.rentActivity}</p>
                      </div>
                      <div>
                        <p className="text-[#1A1A1A]/70 mb-1">Outlook</p>
                        <p className="text-[#1A1A1A]/70">{area.outlook}</p>
                      </div>
                    </div>
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
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-[#1A1A1A]/70">
                  <span>Data Sources: Dubai Land Department Open Data</span>
                  <span>•</span>
                  <span>Update Frequency: Quarterly</span>
                  <span>•</span>
                  <Link to="/market-intelligence/methodology" className="text-[#1A1A1A] hover:underline">
                    Full Methodology
                  </Link>
                </div>
                <div className="mt-4 pt-4 border-t border-[#B89555]/30">
                  <p className="text-xs text-[#1A1A1A]/70">
                    JBJ GLOBAL REAL ESTATE
                    <FounderContent>
                      <> • Jane Bou Jaoude, Founder & CEO</>
                    </FounderContent>
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

export default QuarterlyMarketReview;
