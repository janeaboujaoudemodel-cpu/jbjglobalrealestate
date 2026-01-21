import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, ChevronDown, ChevronUp, Sparkles, BarChart3, Target, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MarketInsight {
  supplyDemandScore: number;
  supplyDemandLabel: string;
  priceComparisonLabel: string;
  priceComparisonPercent: number;
  investmentRating: string;
  keyInsights: string[];
  riskFactors: string[];
  avgAreaPriceSqft: number;
  summary: string;
}

interface AIMarketAnalyzerProps {
  type: 'property' | 'area' | 'community';
  name: string;
  location?: string;
  pricePerSqft?: number;
  totalPrice?: number;
  size?: number;
  bedrooms?: number;
  developer?: string;
  amenities?: string[];
  handoverDate?: string;
  variant?: 'compact' | 'full';
}

export const AIMarketAnalyzer = ({
  type,
  name,
  location,
  pricePerSqft,
  totalPrice,
  size,
  bedrooms,
  developer,
  amenities,
  handoverDate,
  variant = 'compact',
}: AIMarketAnalyzerProps) => {
  const [insights, setInsights] = useState<MarketInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    if (insights) {
      setIsExpanded(!isExpanded);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-market-analyzer', {
        body: {
          type,
          name,
          location,
          pricePerSqft,
          totalPrice,
          size,
          bedrooms,
          developer,
          amenities,
          handoverDate,
        },
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setInsights(data);
      setIsExpanded(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getDemandColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-emerald-500';
    if (score >= 4) return 'text-yellow-600';
    return 'text-red-500';
  };

  const getPriceComparisonColor = (percent: number) => {
    if (percent < -10) return 'text-green-600';
    if (percent < 5) return 'text-emerald-500';
    if (percent < 15) return 'text-yellow-600';
    return 'text-orange-500';
  };

  const getRatingColor = (rating: string) => {
    if (rating.includes('Strong')) return 'bg-green-100 text-green-800 border-green-300';
    if (rating.includes('Worth')) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (rating === 'Neutral') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-orange-100 text-orange-800 border-orange-300';
  };

  if (variant === 'compact') {
    return (
      <div className="border border-gold/30 rounded-lg bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] overflow-hidden">
        {/* Compact Header - Always visible */}
        <button
          onClick={fetchAnalysis}
          disabled={isLoading}
          className="w-full p-3 flex items-center justify-between hover:bg-gold/5 transition-colors group"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-lg">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-black">AI Market Analysis</p>
              <p className="text-[10px] text-zinc-500">
                {insights ? 'View insights' : 'Click to analyze'}
              </p>
            </div>
          </div>
          
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          ) : insights ? (
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getRatingColor(insights.investmentRating)}`}>
                {insights.investmentRating}
              </span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gold" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gold" />
              )}
            </div>
          ) : (
            <Sparkles className="w-4 h-4 text-gold group-hover:animate-pulse" />
          )}
        </button>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && insights && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gold/20"
            >
              <div className="p-4 space-y-3">
                {/* Quick Stats Row */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-white/50 rounded-lg border border-gold/20">
                    <TrendingUp className={`w-4 h-4 mx-auto mb-1 ${getDemandColor(insights.supplyDemandScore)}`} />
                    <p className="text-[10px] text-zinc-500">Demand</p>
                    <p className="text-xs font-semibold text-black">{insights.supplyDemandScore}/10</p>
                  </div>
                  <div className="text-center p-2 bg-white/50 rounded-lg border border-gold/20">
                    <BarChart3 className={`w-4 h-4 mx-auto mb-1 ${getPriceComparisonColor(insights.priceComparisonPercent)}`} />
                    <p className="text-[10px] text-zinc-500">vs Market</p>
                    <p className="text-xs font-semibold text-black">
                      {insights.priceComparisonPercent > 0 ? '+' : ''}{insights.priceComparisonPercent}%
                    </p>
                  </div>
                  <div className="text-center p-2 bg-white/50 rounded-lg border border-gold/20">
                    <Target className="w-4 h-4 mx-auto mb-1 text-gold" />
                    <p className="text-[10px] text-zinc-500">Avg/sqft</p>
                    <p className="text-xs font-semibold text-black">
                      {insights.avgAreaPriceSqft.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-xs text-zinc-600 leading-relaxed">{insights.summary}</p>

                {/* AI Disclosure */}
                <p className="text-[9px] text-zinc-400 italic border-t border-gold/10 pt-2">
                  AI-generated analysis. Not financial advice. Verify with licensed professionals.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="p-3 bg-red-50 border-t border-red-200">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // Full variant for detail pages
  return (
    <div className="border-2 border-gold/30 rounded-2xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gold/20 bg-gradient-to-r from-purple-900/10 to-purple-800/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-black">AI Market Intelligence</h3>
              <p className="text-sm text-zinc-500">Powered by advanced market analysis</p>
            </div>
          </div>
          
          {!insights && (
            <Button
              onClick={fetchAnalysis}
              disabled={isLoading}
              variant="primary"
              className="h-10 px-6"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Now
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {insights ? (
        <div className="p-6 space-y-6">
          {/* Rating Banner */}
          <div className={`p-4 rounded-xl border-2 ${getRatingColor(insights.investmentRating)} bg-opacity-50`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">Investment Consideration</p>
                <p className="text-2xl font-bold">{insights.investmentRating}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium opacity-80">{insights.supplyDemandLabel}</p>
                <p className="text-2xl font-bold">{insights.supplyDemandScore}/10</p>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white/60 rounded-xl border border-gold/20 text-center">
              <TrendingUp className={`w-6 h-6 mx-auto mb-2 ${getDemandColor(insights.supplyDemandScore)}`} />
              <p className="text-xs text-zinc-500 mb-1">Supply/Demand</p>
              <p className="text-lg font-bold text-black">{insights.supplyDemandLabel}</p>
            </div>
            <div className="p-4 bg-white/60 rounded-xl border border-gold/20 text-center">
              <BarChart3 className={`w-6 h-6 mx-auto mb-2 ${getPriceComparisonColor(insights.priceComparisonPercent)}`} />
              <p className="text-xs text-zinc-500 mb-1">Price Position</p>
              <p className="text-lg font-bold text-black">{insights.priceComparisonLabel}</p>
            </div>
            <div className="p-4 bg-white/60 rounded-xl border border-gold/20 text-center">
              <Target className="w-6 h-6 mx-auto mb-2 text-gold" />
              <p className="text-xs text-zinc-500 mb-1">Area Avg/sqft</p>
              <p className="text-lg font-bold text-black">AED {insights.avgAreaPriceSqft.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-white/60 rounded-xl border border-gold/20 text-center">
              {insights.priceComparisonPercent < 0 ? (
                <TrendingDown className="w-6 h-6 mx-auto mb-2 text-green-600" />
              ) : (
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-orange-500" />
              )}
              <p className="text-xs text-zinc-500 mb-1">vs Market</p>
              <p className="text-lg font-bold text-black">
                {insights.priceComparisonPercent > 0 ? '+' : ''}{insights.priceComparisonPercent}%
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-white/60 rounded-xl border border-gold/20">
            <h4 className="font-semibold text-black mb-2 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600" />
              Executive Summary
            </h4>
            <p className="text-zinc-700 leading-relaxed">{insights.summary}</p>
          </div>

          {/* Insights & Risks */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50/50 rounded-xl border border-green-200">
              <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Key Insights
              </h4>
              <ul className="space-y-2">
                {insights.keyInsights.map((insight, i) => (
                  <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Risk Considerations
              </h4>
              <ul className="space-y-2">
                {insights.riskFactors.map((risk, i) => (
                  <li key={i} className="text-sm text-orange-700 flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="p-4 bg-zinc-100/50 rounded-xl border border-zinc-200">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-zinc-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  <strong>AI Disclosure:</strong> This analysis is generated by artificial intelligence based on market data patterns. 
                  It does not constitute financial or investment advice. Please consult with licensed real estate and financial professionals 
                  before making investment decisions. Past performance does not guarantee future results.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center">
          <Brain className="w-16 h-16 mx-auto mb-4 text-purple-300" />
          <h4 className="text-lg font-semibold text-black mb-2">Ready to Analyze</h4>
          <p className="text-zinc-500 text-sm max-w-md mx-auto">
            Get AI-powered market insights including supply/demand analysis, 
            price comparisons, and investment considerations.
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </p>
        </div>
      )}
    </div>
  );
};

export default AIMarketAnalyzer;
