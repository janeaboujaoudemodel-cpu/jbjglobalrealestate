/**
 * AI Investment Report Page
 * Generate detailed investment analysis reports
 */

import { Link } from "react-router-dom";

import { useState } from "react";
import { TrendingUp, Send, Sparkles, Download, BarChart3, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AIToolPremiumLayout from "@/components/ai-tools/AIToolPremiumLayout";
import AIToolGuide from "@/components/ai-tools/AIToolGuide";

interface InvestmentResult {
  title?: string;
  executiveSummary?: string;
  marketOverview?: {
    currentState?: string;
    sentiment?: string;
    description?: string;
  };
  priceAnalysis?: {
    averagePrice?: string;
    yearOverYearChange?: string;
    trend?: string;
  };
  investmentHotspots?: {
    area: string;
    reason: string;
    expectedGrowth: string;
  }[];
  forecast?: {
    shortTerm?: string;
    mediumTerm?: string;
    confidence?: string;
  };
  recommendations?: string[];
}

export default function AIInvestmentReportPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InvestmentResult | null>(null);
  
  const [area, setArea] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [investmentType, setInvestmentType] = useState("capital-appreciation");
  const [timeframe, setTimeframe] = useState("1-year");
  const [budget, setBudget] = useState("");

  const handleSubmit = async () => {
    if (!area) {
      toast.error("Please enter an area");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-market-report", {
        body: {
          area,
          propertyType,
          reportType: "investment",
          timeframe,
        },
      });

      if (error) throw error;
      if (data?.success) {
        setResult(data);
        toast.success("Investment report generated!");
      } else {
        throw new Error(data?.error || "Failed to generate");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate investment report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AIToolPremiumLayout
      title="AI Investment Report"
      subtitle="Generate detailed investment analysis reports for Dubai real estate"
      icon={<TrendingUp className="w-8 h-8" />}
      accentColor="emerald"
      gradientFrom="from-emerald-500"
      showFinancialDisclaimer
    >
      <AIToolGuide
        description="Get comprehensive investment analysis including market trends, hotspots, and ROI projections."
        steps={[
          "Enter the area you want to analyze",
          "Select property type and investment focus",
          "Choose your investment timeframe",
          "Generate detailed investment insights"
        ]}
        benefits={[
          "Data-driven investment decisions",
          "Market trend analysis",
          "Investment hotspot identification",
          "ROI projections and forecasts"
        ]}
        accentColor="emerald"
      />

      <div className="space-y-8">
        {/* Input Form */}
        <Card className="bg-zinc-900/90 border-emerald-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              Investment Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-zinc-300">Area / Community</Label>
              <Input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g., Dubai Marina, Downtown Dubai..."
                className="bg-zinc-800 border-emerald-500/30 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-300">Property Type</Label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="bg-zinc-800 border-emerald-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="apartment">Apartments</SelectItem>
                    <SelectItem value="villa">Villas</SelectItem>
                    <SelectItem value="townhouse">Townhouses</SelectItem>
                    <SelectItem value="penthouse">Penthouses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-300">Investment Focus</Label>
                <Select value={investmentType} onValueChange={setInvestmentType}>
                  <SelectTrigger className="bg-zinc-800 border-emerald-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="capital-appreciation">Capital Appreciation</SelectItem>
                    <SelectItem value="rental-income">Rental Income</SelectItem>
                    <SelectItem value="mixed">Mixed Strategy</SelectItem>
                    <SelectItem value="off-plan">Off-Plan Investment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-300">Investment Timeframe</Label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="bg-zinc-800 border-emerald-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6-months">6 Months</SelectItem>
                    <SelectItem value="1-year">1 Year</SelectItem>
                    <SelectItem value="3-years">3 Years</SelectItem>
                    <SelectItem value="5-years">5 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-300">Budget (AED)</Label>
                <Input
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="2,000,000"
                  className="bg-zinc-800 border-emerald-500/30 text-white"
                />
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Generate Investment Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Executive Summary */}
            {result.executiveSummary && (
              <Card className="bg-zinc-900/90 border-emerald-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    {result.title || "Investment Analysis"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-300">{result.executiveSummary}</p>
                </CardContent>
              </Card>
            )}

            {/* Market Overview */}
            {result.marketOverview && (
              <Card className="bg-zinc-900/90 border-emerald-500/30">
                <CardHeader>
                  <CardTitle className="text-white">Market Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                      <Label className="text-zinc-500 text-xs uppercase">State</Label>
                      <p className="text-emerald-400 font-semibold">{result.marketOverview.currentState}</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                      <Label className="text-zinc-500 text-xs uppercase">Sentiment</Label>
                      <p className="text-emerald-400 font-semibold">{result.marketOverview.sentiment}</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                      <Label className="text-zinc-500 text-xs uppercase">Trend</Label>
                      <p className="text-emerald-400 font-semibold">{result.priceAnalysis?.trend}</p>
                    </div>
                  </div>
                  {result.marketOverview.description && (
                    <p className="text-zinc-400 text-sm">{result.marketOverview.description}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Investment Hotspots */}
            {result.investmentHotspots && result.investmentHotspots.length > 0 && (
              <Card className="bg-zinc-900/90 border-emerald-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    Investment Hotspots
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.investmentHotspots.map((spot, i) => (
                      <div key={i} className="bg-zinc-800/50 rounded-lg p-4 border border-emerald-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-semibold">{spot.area}</h4>
                          <span className="text-emerald-400 font-medium">{spot.expectedGrowth}</span>
                        </div>
                        <p className="text-zinc-400 text-sm">{spot.reason}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Forecast */}
            {result.forecast && (
              <Card className="bg-zinc-900/90 border-emerald-500/30">
                <CardHeader>
                  <CardTitle className="text-white">Market Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                      <Label className="text-zinc-500 text-xs uppercase">Short Term (3-6 months)</Label>
                      <p className="text-zinc-300 mt-1">{result.forecast.shortTerm}</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                      <Label className="text-zinc-500 text-xs uppercase">Medium Term (6-12 months)</Label>
                      <p className="text-zinc-300 mt-1">{result.forecast.mediumTerm}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <Card className="bg-emerald-500/10 border-emerald-500/30">
                <CardHeader>
                  <CardTitle className="text-white">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-zinc-300">
                        <span className="text-emerald-400 mt-1">✓</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Placeholder */}
        {!result && !loading && (
          <div className="bg-zinc-900/50 border border-emerald-500/20 rounded-xl py-12 text-center">
            <TrendingUp className="w-12 h-12 text-emerald-400/50 mx-auto mb-4" />
            <p className="text-zinc-400">Enter investment parameters above to generate your report</p>
          </div>
        )}
      </div>
    </AIToolPremiumLayout>
  );
}
