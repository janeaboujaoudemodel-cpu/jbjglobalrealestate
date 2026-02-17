import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Sparkles, BarChart3, Target, Shield, Send, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

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

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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
  const [error, setError] = useState<string | null>(null);
  const [isTimedOut, setIsTimedOut] = useState(false);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Cache key for sessionStorage
  const cacheKey = `ai-market-${type}-${name}-${location || ''}`;

  // Auto-fetch analysis on mount (check cache first)
  useEffect(() => {
    if (variant === 'full' && !insights && !isLoading) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.supplyDemandScore) {
            setInsights(parsed);
            return;
          }
        } catch { /* ignore */ }
      }
      fetchAnalysis();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);

  const fetchAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    setIsTimedOut(false);

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      setIsTimedOut(true);
    }, 15000);

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

      clearTimeout(timeout);
      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setInsights(data);
      // Cache in sessionStorage
      try { sessionStorage.setItem(cacheKey, JSON.stringify(data)); } catch { /* ignore */ }
    } catch (err) {
      clearTimeout(timeout);
      if (isTimedOut || (err instanceof Error && err.name === 'AbortError')) {
        setError('Analysis is taking longer than expected. Please try again.');
        setIsTimedOut(true);
      } else {
        const message = err instanceof Error ? err.message : 'Analysis failed';
        setError(message);
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-market-chat', {
        body: {
          question: userMessage,
          context: {
            propertyName: name,
            location,
            totalPrice,
            pricePerSqft,
            size,
            bedrooms,
            developer,
            amenities,
            handoverDate,
            insights,
          },
        },
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setChatMessages(prev => [...prev, { role: 'assistant', content: data.answer || data.response }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get answer';
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I couldn't process your question. ${message}` }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

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

  const quickQuestions = [
    "Who are the other developers in this area?",
    "What is the average price per sqft here?",
    "What are the rental yields in this location?",
    "What amenities are nearby?",
  ];

  if (variant === 'compact') {
    return (
      <div className="border border-gold/30 rounded-lg bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] overflow-hidden">
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
              <p className="text-xs font-semibold text-black">JBJ AI Market Analysis</p>
              <p className="text-[10px] text-zinc-500">
                {insights ? 'View insights' : 'Click to analyze'}
              </p>
            </div>
          </div>
          
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          ) : insights ? (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getRatingColor(insights.investmentRating)}`}>
              {insights.investmentRating}
            </span>
          ) : (
            <Sparkles className="w-4 h-4 text-gold group-hover:animate-pulse" />
          )}
        </button>

        {error && (
          <div className="p-3 bg-red-50 border-t border-red-200">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // Full variant for detail pages - Auto-loads and includes chat
  return (
    <div className="border-2 border-gold/30 rounded-2xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gold/20 bg-gradient-to-r from-purple-900/10 to-purple-800/5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-black">JBJ AI Market Intelligence</h3>
            <p className="text-sm text-zinc-500">Powered by advanced market analysis</p>
          </div>
        </div>
      </div>

      {isLoading && !insights && (
        <div className="p-8 space-y-4">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gold/15" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gold/10 rounded w-48" />
                <div className="h-3 bg-gold/10 rounded w-32" />
              </div>
            </div>
            <div className="h-20 bg-gold/10 rounded-xl" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gold/10 rounded-xl" />)}
            </div>
            <div className="h-16 bg-gold/10 rounded-xl" />
          </div>
          <p className="text-zinc-500 text-sm text-center">Loading market intelligence for {name}...</p>
          {isTimedOut && (
            <div className="text-center mt-4">
              <p className="text-zinc-500 text-sm mb-2">Taking longer than expected...</p>
              <Button variant="secondary" size="sm" onClick={fetchAnalysis}>
                Retry Analysis
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Content - Always visible when insights loaded */}
      {insights && (
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

          {/* AI Chat Assistant */}
          <div className="border-t border-gold/20 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-black">Ask AI Analyzer</h4>
            </div>
            
            {/* Quick Questions */}
            <div className="flex flex-wrap gap-2 mb-4">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setChatInput(q);
                    handleChatSubmit();
                  }}
                  disabled={isChatLoading}
                  className="text-xs px-3 py-1.5 rounded-full border border-gold/40 text-zinc-700 hover:border-gold hover:bg-gold/10 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Chat Messages */}
            {chatMessages.length > 0 && (
              <div 
                ref={chatContainerRef}
                className="max-h-60 overflow-y-auto mb-4 space-y-3 p-4 bg-white/50 rounded-xl border border-gold/20"
              >
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-white border border-gold/20 text-zinc-700'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="p-3 rounded-xl bg-white border border-gold/20">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Chat Input */}
            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about this property, area, or market..."
                disabled={isChatLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={isChatLoading || !chatInput.trim()}
                className="px-4"
              >
                {isChatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </div>

          {/* Disclaimer */}
          <div className="p-4 bg-zinc-100/50 rounded-xl border border-zinc-200">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-zinc-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  <strong>AI Disclosure:</strong> This analysis is generated by artificial intelligence based on market data patterns. 
                  It does not constitute financial or investment advice.{" "}
                  <Link to="/contact" className="text-gold hover:underline">Contact our team</Link> for professional guidance.
                  Past performance does not guarantee future results.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && !insights && (
        <div className="p-4 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </p>
          <Button variant="secondary" size="sm" onClick={fetchAnalysis} className="mt-2">
            Retry Analysis
          </Button>
        </div>
      )}
    </div>
  );
};

export default AIMarketAnalyzer;
