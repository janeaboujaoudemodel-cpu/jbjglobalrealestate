import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
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
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// Sample monthly data - in production, this would come from API/database
const MONTHLY_DATA: Record<string, {
  period: string;
  publishDate: string;
  summary: string;
  transactionVolume: { value: number; change: number };
  rentTrend: { direction: "up" | "down" | "stable"; description: string };
  avgPricePerSqft: { value: number; change: number };
  areaHighlights: { name: string; momentum: "high" | "medium" | "low"; note: string }[];
}> = {
  "2026-01": {
    period: "January 2026",
    publishDate: "2026-01-15",
    summary: "The Dubai real estate market demonstrated steady activity in January 2026 across BUY · SELL · RENT segments. Transaction volumes remained consistent with seasonal patterns, while RENT demand continued to show strength in key residential areas.",
    transactionVolume: { value: 8234, change: 3.2 },
    rentTrend: { direction: "up", description: "RENT demand increased moderately, particularly in family-oriented communities." },
    avgPricePerSqft: { value: 1450, change: 1.8 },
    areaHighlights: [
      { name: "Downtown Dubai", momentum: "high", note: "Sustained interest in premium units" },
      { name: "Dubai Marina", momentum: "high", note: "Strong RENT activity observed" },
      { name: "JVC", momentum: "medium", note: "Steady demand from first-time buyers" },
      { name: "Business Bay", momentum: "medium", note: "Mixed commercial and residential interest" },
    ],
  },
  "2025-12": {
    period: "December 2025",
    publishDate: "2025-12-15",
    summary: "December 2025 marked a transitional month with typical year-end patterns across BUY · SELL · RENT. Activity moderated slightly during the holiday period while maintaining overall market stability.",
    transactionVolume: { value: 7891, change: -2.1 },
    rentTrend: { direction: "stable", description: "RENT activity remained stable with seasonal adjustments." },
    avgPricePerSqft: { value: 1425, change: 0.5 },
    areaHighlights: [
      { name: "Palm Jumeirah", momentum: "high", note: "Continued premium positioning" },
      { name: "Dubai Hills", momentum: "medium", note: "Family community interest steady" },
      { name: "Al Barsha", momentum: "medium", note: "Balanced BUY and RENT activity" },
      { name: "Jumeirah Lakes Towers", momentum: "low", note: "Seasonal moderation observed" },
    ],
  },
};

const MonthlyMarketBrief = () => {
  const { period } = useParams<{ period: string }>();
  const data = period ? MONTHLY_DATA[period] : null;

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

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-emerald-600" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-[#1A1A1A]/70" />;
  };

  const getMomentumColor = (momentum: "high" | "medium" | "low") => {
    switch (momentum) {
      case "high": return "bg-emerald-500/20 text-emerald-600 border-emerald-500/30";
      case "medium": return "bg-amber-500/20 text-amber-600 border-amber-500/30";
      default: return "bg-[#B89555]/20 text-[#1A1A1A]/70 border-[#B89555]/30";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
      <SEOHead
        title={`${data.period} Market Brief | Dubai Real Estate | JBJ GLOBAL REAL ESTATE`}
        description={`Monthly market brief for ${data.period} covering Dubai real estate across BUY · SELL · RENT. Official report by JBJ GLOBAL REAL ESTATE.`}
        keywords="Dubai market brief, monthly real estate report, Dubai property data, Jane Bou Jaoude"
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
                <Badge className="mb-3 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/30 shadow-sm">
                  <span className="text-[#1A1A1A]">MONTHLY</span>
                  <span className="text-[#1A1A1A] ml-1">MARKET BRIEF</span>
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
                <p className="text-[#1A1A1A]/70 leading-relaxed">{data.summary}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Key Metrics */}
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
                  Transaction Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-[#1A1A1A]">
                    {data.transactionVolume.value.toLocaleString()}
                  </span>
                  {getTrendIcon(data.transactionVolume.change)}
                </div>
                <p className="text-xs text-[#1A1A1A]/70 mt-1">
                  {data.transactionVolume.change > 0 ? "+" : ""}
                  {data.transactionVolume.change}% vs. previous month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#1A1A1A]/70 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  RENT Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {data.rentTrend.direction === "up" && <TrendingUp className="w-5 h-5 text-emerald-600" />}
                  {data.rentTrend.direction === "down" && <TrendingDown className="w-5 h-5 text-red-600" />}
                  {data.rentTrend.direction === "stable" && <Activity className="w-5 h-5 text-[#1A1A1A]/70" />}
                  <span className="text-lg font-semibold text-[#1A1A1A] capitalize">
                    {data.rentTrend.direction}
                  </span>
                </div>
                <p className="text-xs text-[#1A1A1A]/70 mt-1">{data.rentTrend.description}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#1A1A1A]/70 flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Avg. Price/sqft
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-[#1A1A1A]">
                    AED {data.avgPricePerSqft.value.toLocaleString()}
                  </span>
                  {getTrendIcon(data.avgPricePerSqft.change)}
                </div>
                <p className="text-xs text-[#1A1A1A]/70 mt-1">
                  {data.avgPricePerSqft.change > 0 ? "+" : ""}
                  {data.avgPricePerSqft.change}% vs. previous month
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Area Highlights */}
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
                  <MapPin className="w-5 h-5 text-[#1A1A1A]" />
                  Area Highlights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.areaHighlights.map((area, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-[#FDFBF7]/50 border border-[#B89555]/20 rounded-lg"
                    >
                      <div>
                        <p className="text-[#1A1A1A] font-medium">{area.name}</p>
                        <p className="text-sm text-[#1A1A1A]/70">{area.note}</p>
                      </div>
                      <Badge className={getMomentumColor(area.momentum)}>
                        {area.momentum.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Methodology & Disclaimer */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.4 }}
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
                  <span>Update Frequency: Monthly</span>
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

export default MonthlyMarketBrief;
