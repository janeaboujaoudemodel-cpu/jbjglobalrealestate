import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface AreaAIAnalyzerProps {
  areaName: string;
  emirate: string;
}

export const AreaAIAnalyzer = ({ areaName, emirate }: AreaAIAnalyzerProps) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const hasTriggered = useRef(false);

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

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-property-analyzer", {
        body: { area: areaName, propertyType: "all" },
      });

      if (error) throw error;
      setAnalysis(data?.fullAnalysis || "Analysis not available.");
    } catch (err) {
      setAnalysis("Unable to generate analysis at this time. Please try again later.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-trigger analysis once stats are available
  useEffect(() => {
    if (stats && stats.totalProjects > 0 && !analysis && !isAnalyzing && !hasTriggered.current) {
      hasTriggered.current = true;
      handleAnalyze();
    }
  }, [stats]);

  if (!stats || stats.totalProjects === 0) return null;

  return (
    <section className="py-16 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Brain className="w-6 h-6 text-gold" />
          <h2 className="text-2xl md:text-3xl font-bold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
            AI Area Intelligence
          </h2>
        </div>

        {/* Quick Stats */}
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

        {/* AI Analysis */}
        {!analysis ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Analyzing {areaName}...</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gold/20 rounded-2xl p-6 md:p-8 shadow-sm"
          >
            <div className="prose prose-gold max-w-none text-zinc-700 text-sm leading-relaxed whitespace-pre-wrap">
              {analysis}
            </div>
            <div className="mt-6 pt-4 border-t border-gold/10 flex items-center gap-2 text-zinc-500 text-xs">
              <Brain className="w-4 h-4" />
              AI-generated analysis based on current market data
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};
