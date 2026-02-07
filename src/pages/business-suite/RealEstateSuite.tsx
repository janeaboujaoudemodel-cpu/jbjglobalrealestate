import { Building2, TrendingUp, MapPin, Calculator, FileBarChart, BarChart3 } from "lucide-react";
import BusinessSuiteToolCard from "@/components/business-suite/BusinessSuiteToolCard";

const tools = [
  {
    icon: Building2,
    title: "Property Analyzer",
    description: "AI-powered property analysis with market positioning, appreciation forecasts, and investment metrics.",
    href: "/ai-property-analyzer",
    colorClass: "text-sky-400",
    borderColorClass: "border-sky-500/30",
    gradientFrom: "from-sky-600",
    gradientTo: "to-blue-600",
  },
  {
    icon: TrendingUp,
    title: "Price Predictor",
    description: "Get AI valuations with market trend analysis and future price forecasts for Dubai properties.",
    href: "/ai-price-predictor",
    colorClass: "text-blue-400",
    borderColorClass: "border-blue-500/30",
    gradientFrom: "from-blue-600",
    gradientTo: "to-indigo-600",
  },
  {
    icon: MapPin,
    title: "Neighborhood Insights",
    description: "Comprehensive area analysis including amenities, demographics, and livability scores.",
    href: "/ai-neighborhood-insights",
    colorClass: "text-teal-400",
    borderColorClass: "border-teal-500/30",
    gradientFrom: "from-teal-600",
    gradientTo: "to-cyan-600",
  },
  {
    icon: Calculator,
    title: "ROI Calculator",
    description: "Calculate investment returns with scenario comparisons and cash flow projections.",
    href: "/ai-roi-calculator",
    colorClass: "text-emerald-400",
    borderColorClass: "border-emerald-500/30",
    gradientFrom: "from-emerald-600",
    gradientTo: "to-green-600",
  },
  {
    icon: FileBarChart,
    title: "Market Report",
    description: "Generate comprehensive market analysis reports with trends and forecasts.",
    href: "/ai-market-report",
    colorClass: "text-indigo-400",
    borderColorClass: "border-indigo-500/30",
    gradientFrom: "from-indigo-600",
    gradientTo: "to-purple-600",
  },
  {
    icon: BarChart3,
    title: "Competitor Analysis",
    description: "Compare properties and developers with detailed competitive intelligence.",
    href: "/ai-competitor-analysis",
    colorClass: "text-orange-400",
    borderColorClass: "border-orange-500/30",
    gradientFrom: "from-orange-600",
    gradientTo: "to-amber-600",
  },
];

const RealEstateSuite = () => {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/10 via-black to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/20 via-transparent to-transparent opacity-50" />
        
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full mb-6">
            <Building2 className="w-5 h-5 text-gold" />
            <span className="text-gold font-medium text-sm">Real Estate Business Suite</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Property <span className="text-gold">Intelligence</span> Suite
          </h1>
          
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
            Complete AI-powered toolkit for property analysis, valuation, and market intelligence. 
            Make data-driven decisions with professional-grade analytics.
          </p>
          
          <div className="flex items-center justify-center gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-gold rounded-full" />
              6 Tools Included
            </span>
            <span>•</span>
            <span>Powered by AI</span>
          </div>
        </div>
      </div>
      
      {/* Tools Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <BusinessSuiteToolCard key={tool.href} {...tool} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RealEstateSuite;
