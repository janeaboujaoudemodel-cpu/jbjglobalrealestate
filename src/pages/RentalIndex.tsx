import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Building, 
  Home, 
  TrendingUp, 
  DollarSign, 
  MapPin, 
  Search, 
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  FileText,
  CheckCircle,
  Info
} from "lucide-react";
import { toast } from "sonner";
import LegalDisclaimer from "@/components/LegalDisclaimer";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const dubaiCommunities = [
  "Downtown Dubai",
  "Dubai Marina",
  "Palm Jumeirah",
  "Business Bay",
  "Jumeirah Beach Residence (JBR)",
  "Dubai Hills Estate",
  "Arabian Ranches",
  "Jumeirah Village Circle (JVC)",
  "Dubai Silicon Oasis",
  "DIFC",
  "Al Barsha",
  "Jumeirah Lakes Towers (JLT)",
  "Motor City",
  "Sports City",
  "Town Square",
  "Mirdif",
  "Al Nahda",
  "International City",
  "Discovery Gardens",
  "Deira",
  "Bur Dubai",
  "Karama",
  "Al Quoz",
  "Dubai South",
  "Damac Hills",
  "Dubai Creek Harbour",
  "Bluewaters Island",
  "City Walk",
  "La Mer",
  "Sobha Hartland"
];

const propertyTypes = [
  { value: "studio", label: "Studio" },
  { value: "1br", label: "1 Bedroom" },
  { value: "2br", label: "2 Bedroom" },
  { value: "3br", label: "3 Bedroom" },
  { value: "4br", label: "4 Bedroom" },
  { value: "5br+", label: "5+ Bedroom" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
];

interface RentalAnalysis {
  community: string;
  propertyType: string;
  estimatedRentMin: number;
  estimatedRentMax: number;
  averageRent: number;
  pricePerSqft: number;
  yearlyIncrease: string;
  marketTrend: string;
  demandLevel: string;
  insights: string[];
  disclaimer: string;
}

const RentalIndex = () => {
  const [community, setCommunity] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [size, setSize] = useState("");
  const [furnished, setFurnished] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<RentalAnalysis | null>(null);

  const handleAnalyze = async () => {
    if (!community || !propertyType) {
      toast.error("Please select a community and property type");
      return;
    }

    setIsLoading(true);
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke('rental-index-analysis', {
        body: { 
          community, 
          propertyType, 
          size: size ? parseInt(size) : null,
          furnished 
        }
      });

      if (error) {
        console.error("Function error:", error);
        toast.error("Failed to get rental analysis. Please try again.");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setAnalysis(data);
      toast.success("Rental analysis complete!");
    } catch (err) {
      console.error("Error:", err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-black">
      
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-emerald-950/50 via-zinc-950 to-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-6">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">AI Rental Index</span>
            </div>
            
            <h1 
              className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Dubai <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">Rental Index</span> Evaluator
            </h1>
            
            <p className="text-zinc-400 text-lg md:text-xl mb-4">
              Get AI-powered rental estimates for any Dubai property. Understand current market rates, trends, and investment potential.
            </p>
            
            <p className="text-zinc-500 text-sm">
              Powered by AI • Data-driven insights • Real-time market analysis
            </p>
          </motion.div>
        </div>
      </section>

      {/* Analysis Form */}
      <section className="py-12 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-3xl p-8 md:p-10"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center">
                  <Search className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h2 className="text-white text-xl font-bold">Property Details</h2>
                  <p className="text-zinc-500 text-sm">Enter property information for rental analysis</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Community */}
                <div>
                  <Label className="text-zinc-300 text-sm font-medium mb-2 block">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Community / Area *
                  </Label>
                  <Select value={community} onValueChange={setCommunity}>
                    <SelectTrigger className="bg-zinc-900/50 border-zinc-700 text-white h-12 rounded-xl">
                      <SelectValue placeholder="Select community" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 max-h-64">
                      {dubaiCommunities.map((c) => (
                        <SelectItem key={c} value={c} className="text-white hover:bg-zinc-800">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Property Type */}
                <div>
                  <Label className="text-zinc-300 text-sm font-medium mb-2 block">
                    <Home className="w-4 h-4 inline mr-1" />
                    Property Type *
                  </Label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger className="bg-zinc-900/50 border-zinc-700 text-white h-12 rounded-xl">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      {propertyTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value} className="text-white hover:bg-zinc-800">
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Size */}
                <div>
                  <Label className="text-zinc-300 text-sm font-medium mb-2 block">
                    <Building className="w-4 h-4 inline mr-1" />
                    Size (sq.ft) - Optional
                  </Label>
                  <Input
                    type="number"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="e.g., 1200"
                    className="bg-zinc-900/50 border-zinc-700 text-white h-12 rounded-xl"
                  />
                </div>

                {/* Furnished */}
                <div>
                  <Label className="text-zinc-300 text-sm font-medium mb-2 block">
                    Furnished Status - Optional
                  </Label>
                  <Select value={furnished} onValueChange={setFurnished}>
                    <SelectTrigger className="bg-zinc-900/50 border-zinc-700 text-white h-12 rounded-xl">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      <SelectItem value="unfurnished" className="text-white hover:bg-zinc-800">Unfurnished</SelectItem>
                      <SelectItem value="furnished" className="text-white hover:bg-zinc-800">Furnished</SelectItem>
                      <SelectItem value="semi-furnished" className="text-white hover:bg-zinc-800">Semi-Furnished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={isLoading || !community || !propertyType}
                className="w-full bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-black font-bold py-6 text-lg rounded-xl transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing Rental Data...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Get Rental Estimate
                  </>
                )}
              </Button>
            </motion.div>

            {/* Results Section */}
            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-8 space-y-6"
              >
                {/* Main Result Card */}
                <div className="bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/30 rounded-3xl p-8 md:p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <DollarSign className="w-8 h-8 text-gold" />
                    <div>
                      <h3 className="text-white text-2xl font-bold">Estimated Annual Rent</h3>
                      <p className="text-zinc-400 text-sm">{analysis.community} • {propertyTypes.find(t => t.value === analysis.propertyType)?.label}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-black/40 rounded-2xl p-6 text-center">
                      <p className="text-zinc-400 text-sm mb-2">Minimum</p>
                      <p className="text-gold text-3xl font-bold">{formatCurrency(analysis.estimatedRentMin)}</p>
                      <p className="text-zinc-500 text-xs mt-1">/year</p>
                    </div>
                    <div className="bg-gold/20 border border-gold/40 rounded-2xl p-6 text-center">
                      <p className="text-gold text-sm mb-2 font-medium">Average</p>
                      <p className="text-white text-4xl font-bold">{formatCurrency(analysis.averageRent)}</p>
                      <p className="text-zinc-400 text-xs mt-1">/year</p>
                    </div>
                    <div className="bg-black/40 rounded-2xl p-6 text-center">
                      <p className="text-zinc-400 text-sm mb-2">Maximum</p>
                      <p className="text-gold text-3xl font-bold">{formatCurrency(analysis.estimatedRentMax)}</p>
                      <p className="text-zinc-500 text-xs mt-1">/year</p>
                    </div>
                  </div>

                  {/* Additional Metrics */}
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-zinc-900/60 rounded-xl p-4">
                      <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Price per Sq.Ft</p>
                      <p className="text-white text-lg font-semibold">AED {analysis.pricePerSqft}</p>
                    </div>
                    <div className="bg-zinc-900/60 rounded-xl p-4">
                      <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Yearly Increase</p>
                      <p className="text-green-400 text-lg font-semibold">{analysis.yearlyIncrease}</p>
                    </div>
                    <div className="bg-zinc-900/60 rounded-xl p-4">
                      <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Market Trend</p>
                      <p className="text-white text-lg font-semibold">{analysis.marketTrend}</p>
                    </div>
                  </div>

                  {/* Demand Level */}
                  <div className="bg-zinc-900/60 rounded-xl p-4 mb-6">
                    <p className="text-zinc-400 text-xs uppercase tracking-wider mb-2">Demand Level</p>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 flex-1 rounded-full ${
                        analysis.demandLevel === 'Very High' ? 'bg-gradient-to-r from-green-500 to-green-400' :
                        analysis.demandLevel === 'High' ? 'bg-gradient-to-r from-green-600 to-green-500' :
                        analysis.demandLevel === 'Moderate' ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                        'bg-gradient-to-r from-orange-500 to-orange-400'
                      }`} />
                      <span className="text-white font-medium">{analysis.demandLevel}</span>
                    </div>
                  </div>

                  {/* AI Insights */}
                  <div className="bg-zinc-900/60 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <h4 className="text-white font-semibold">AI Market Insights</h4>
                    </div>
                    <ul className="space-y-3">
                      {analysis.insights.map((insight, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                          <span className="text-zinc-300 text-sm">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                    <div>
                      <h4 className="text-amber-400 font-semibold mb-2">Important Disclaimer</h4>
                      <p className="text-amber-200/80 text-sm leading-relaxed">
                        {analysis.disclaimer}
                      </p>
                      <p className="text-amber-200/60 text-xs mt-3">
                        For more accurate and updated information, we recommend verifying with official government sources such as the Dubai Land Department (DLD), RERA, and DXB Interact. Rental values can vary based on specific building, view, condition, and market timing.
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 text-center">
                  <p className="text-zinc-400 text-sm mb-4">
                    Need expert guidance on your rental investment?
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button asChild className="bg-gold hover:bg-gold-light text-black font-semibold">
                      <Link to="/properties">
                        Browse Properties
                        <ArrowUpRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="border-gold/50 text-gold hover:bg-gold/10">
                      <Link to="/contact">
                        <FileText className="w-4 h-4 mr-2" />
                        Consult an Expert
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Info Cards */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="mt-12 grid md:grid-cols-2 gap-6"
            >
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
                <Info className="w-6 h-6 text-gold mb-4" />
                <h3 className="text-white font-semibold mb-2">How It Works</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Our AI analyzes current rental trends, historical data, and market conditions to provide estimates. 
                  The tool considers location, property type, size, and amenities to calculate rental ranges.
                </p>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
                <TrendingUp className="w-6 h-6 text-gold mb-4" />
                <h3 className="text-white font-semibold mb-2">Data Sources</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Estimates are based on aggregated market data. For official records, please refer to Dubai Land Department (DLD), 
                  RERA, and authorized real estate platforms.
                </p>
              </div>
            </motion.div>

            {/* Legal Disclaimer */}
            <LegalDisclaimer variant="ai-tools" className="mt-8" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RentalIndex;