import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Loader2, TrendingUp, TrendingDown, BarChart3, Shield, Star, Building2, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface AreaAIAnalyzerProps {
  areaName: string;
  emirate: string;
}

function extractSection(text: string, sectionName: string): string {
  const patterns = [
    new RegExp(`\\d+\\.\\s*\\*\\*${sectionName}\\*\\*[:\\s]*([\\s\\S]*?)(?=\\d+\\.\\s*\\*\\*|$)`, 'i'),
    new RegExp(`##\\s*${sectionName}[:\\s]*([\\s\\S]*?)(?=##|\\d+\\.\\s*\\*\\*|$)`, 'i'),
    new RegExp(`\\*\\*${sectionName}\\*\\*[:\\s]*([\\s\\S]*?)(?=\\*\\*[A-Z]|\\d+\\.\\s*\\*\\*|$)`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return "";
}

function cleanMarkdown(text: string): string {
  return text
    .replace(/#{1,4}\s*/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^\s*[-*]\s*/gm, '• ')
    .trim();
}

export const AreaAIAnalyzer = ({ areaName, emirate }: AreaAIAnalyzerProps) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const hasTriggered = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: stats } = useQuery({
    queryKey: ["area-ai-stats", areaName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("price_from, price_to, size_min, size_max, developer_name, construction_status")
        .ilike("area_name", `%${areaName}%`);
      if (error) throw error;

      const prices = (data || []).filter(p => p.price_from).map(p => Number(p.price_from));
      const sizes = (data || []).filter(p => p.size_min).map(p => Number(p.size_min));
      const devs = new Set((data || []).filter(p => p.developer_name).map(p => p.developer_name));
      const statuses = (data || []).reduce((acc: Record<string, number>, p) => {
        const s = p.construction_status || "Unknown";
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});

      return {
        totalProjects: data?.length || 0,
        avgPrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null,
        minPrice: prices.length > 0 ? Math.min(...prices) : null,
        maxPrice: prices.length > 0 ? Math.max(...prices) : null,
        avgSize: sizes.length > 0 ? Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length) : null,
        developers: Array.from(devs),
        statuses,
        pricePerSqft: prices.length > 0 && sizes.length > 0
          ? Math.round(prices.reduce((a, b) => a + b, 0) / sizes.reduce((a, b) => a + b, 0))
          : null,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    setHasTimedOut(false);
    setErrorMsg(null);

    // 30s timeout fallback
    timeoutRef.current = setTimeout(() => {
      setHasTimedOut(true);
    }, 30000);

    try {
      const { data, error } = await supabase.functions.invoke("ai-property-analyzer", {
        body: { area: areaName, propertyType: "all" },
      });
      if (error) throw error;
      setAnalysis(data?.fullAnalysis || "Analysis not available.");
    } catch {
      setErrorMsg("Unable to generate analysis at this time. Please try again.");
    } finally {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsAnalyzing(false);
      setHasTimedOut(false);
    }
  }, [areaName]);

  const handleRetry = useCallback(() => {
    hasTriggered.current = false;
    setErrorMsg(null);
    setAnalysis(null);
    handleAnalyze();
  }, [handleAnalyze]);

  // IntersectionObserver: only trigger when section scrolls into view
  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible && !analysis && !isAnalyzing && !hasTriggered.current && !errorMsg) {
      hasTriggered.current = true;
      handleAnalyze();
    }
  }, [isVisible, analysis, isAnalyzing, handleAnalyze, errorMsg]);

  const hasStats = stats && stats.totalProjects > 0;

  const sections = analysis ? {
    overview: extractSection(analysis, "Area Overview"),
    pricePerSqft: extractSection(analysis, "Price Per Sqft"),
    supplyDemand: extractSection(analysis, "Supply vs Demand"),
    developers: extractSection(analysis, "Developer Landscape"),
    investment: extractSection(analysis, "Investment Metrics"),
    pros: extractSection(analysis, "Pros"),
    cons: extractSection(analysis, "Cons"),
    rating: extractSection(analysis, "Investment Rating"),
  } : null;

  // Extract rating score
  const ratingMatch = sections?.rating?.match(/(\d+(?:\.\d+)?)\s*(?:\/|out of)\s*10/i);
  const ratingScore = ratingMatch ? parseFloat(ratingMatch[1]) : null;

  return (
    <section ref={sectionRef} className="py-16 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Brain className="w-6 h-6 text-gold" />
          <h2 className="text-2xl md:text-3xl font-bold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
            AI Area Intelligence
          </h2>
        </div>

        {/* Quick Stats */}
        {hasStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-gold/20 rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-gold">{stats.totalProjects}</div>
              <div className="text-zinc-600 text-xs mt-1">Active Projects</div>
            </div>
            <div className="bg-white border border-gold/20 rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-gold">{stats.developers.length}</div>
              <div className="text-zinc-600 text-xs mt-1">Developers</div>
            </div>
            {stats.avgPrice && (
              <div className="bg-white border border-gold/20 rounded-xl p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-gold">AED {(stats.avgPrice / 1000000).toFixed(1)}M</div>
                <div className="text-zinc-600 text-xs mt-1">Avg. Starting Price</div>
              </div>
            )}
            {stats.pricePerSqft && (
              <div className="bg-white border border-gold/20 rounded-xl p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-gold">AED {stats.pricePerSqft.toLocaleString()}</div>
                <div className="text-zinc-600 text-xs mt-1">Est. Price/sqft</div>
              </div>
            )}
          </div>
        )}

        {/* AI Analysis */}
        {errorMsg ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-red-500 text-sm">{errorMsg}</p>
            <Button onClick={handleRetry} variant="outline" className="border-gold/40 text-gold hover:bg-gold/10">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Analysis
            </Button>
          </div>
        ) : !analysis ? (
          <div className="text-center py-8">
            {hasTimedOut ? (
              <div className="space-y-4">
                <p className="text-zinc-500 text-sm">Analysis is taking longer than expected.</p>
                <Button onClick={handleRetry} variant="outline" className="border-gold/40 text-gold hover:bg-gold/10">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Analysis
                </Button>
              </div>
            ) : (
              <>
                <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">Analyzing {areaName}...</p>
              </>
            )}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Row 1: Overview + Rating */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {sections?.overview && (
                <div className="lg:col-span-2 bg-white border border-gold/20 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-gold" />
                    <h3 className="font-bold text-black text-lg">Area Overview</h3>
                  </div>
                  <p className="text-zinc-700 text-sm leading-relaxed">{cleanMarkdown(sections.overview)}</p>
                </div>
              )}
              {ratingScore !== null && (
                <div className="bg-black rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center text-center">
                  <Star className="w-8 h-8 text-gold mb-2" />
                  <div className="text-5xl font-bold text-gold mb-1">{ratingScore}</div>
                  <div className="text-gold/70 text-sm font-medium">/10 Investment Rating</div>
                  {sections?.rating && (
                    <p className="text-zinc-400 text-xs mt-3 leading-relaxed">
                      {cleanMarkdown(sections.rating).replace(/\d+(?:\.\d+)?\s*(?:\/|out of)\s*10/i, '').replace(/^[:\s-]+/, '').trim()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Row 2: Price Per Sqft + Supply vs Demand */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sections?.pricePerSqft && (
                <div className="bg-white border border-gold/20 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-5 h-5 text-gold" />
                    <h3 className="font-bold text-black text-lg">Price Per Sqft</h3>
                  </div>
                  <div className="text-zinc-700 text-sm leading-relaxed whitespace-pre-line">
                    {cleanMarkdown(sections.pricePerSqft)}
                  </div>
                </div>
              )}
              {sections?.supplyDemand && (
                <div className="bg-white border border-gold/20 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-gold" />
                    <h3 className="font-bold text-black text-lg">Supply vs Demand</h3>
                  </div>
                  <div className="text-zinc-700 text-sm leading-relaxed whitespace-pre-line">
                    {cleanMarkdown(sections.supplyDemand)}
                  </div>
                </div>
              )}
            </div>

            {/* Row 3: Investment Metrics + Developers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sections?.investment && (
                <div className="bg-white border border-gold/20 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-gold" />
                    <h3 className="font-bold text-black text-lg">Investment Metrics</h3>
                  </div>
                  <div className="text-zinc-700 text-sm leading-relaxed whitespace-pre-line">
                    {cleanMarkdown(sections.investment)}
                  </div>
                </div>
              )}
              {sections?.developers && (
                <div className="bg-white border border-gold/20 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-gold" />
                    <h3 className="font-bold text-black text-lg">Developer Landscape</h3>
                  </div>
                  <div className="text-zinc-700 text-sm leading-relaxed whitespace-pre-line">
                    {cleanMarkdown(sections.developers)}
                  </div>
                </div>
              )}
            </div>

            {/* Row 4: Pros & Cons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sections?.pros && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <ThumbsUp className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-emerald-800 text-lg">Pros</h3>
                  </div>
                  <div className="text-emerald-900 text-sm leading-relaxed whitespace-pre-line">
                    {cleanMarkdown(sections.pros)}
                  </div>
                </div>
              )}
              {sections?.cons && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <ThumbsDown className="w-5 h-5 text-red-500" />
                    <h3 className="font-bold text-red-800 text-lg">Cons</h3>
                  </div>
                  <div className="text-red-900 text-sm leading-relaxed whitespace-pre-line">
                    {cleanMarkdown(sections.cons)}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 text-zinc-500 text-xs pt-2 flex-wrap">
              <Brain className="w-4 h-4" />
              JBJ Property Analyzer — AI-generated analysis based on current market data. Does not constitute financial advice.{" "}
              <Link to="/contact" className="text-gold hover:underline">Contact our team</Link> for professional guidance.
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};
