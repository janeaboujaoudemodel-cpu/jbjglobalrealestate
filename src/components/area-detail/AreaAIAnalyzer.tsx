import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Brain, TrendingUp, BarChart3, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface AreaAIAnalyzerProps {
  areaName: string;
  emirate: string;
}

export const AreaAIAnalyzer = ({ areaName, emirate }: AreaAIAnalyzerProps) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch area stats for context
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
      const prompt = `Analyze the real estate market for ${areaName}, ${emirate}, UAE. 
Based on available data:
- ${stats?.totalProjects || 0} active projects
- Average starting price: AED ${stats?.avgPrice?.toLocaleString() || "N/A"}
- Price range: AED ${stats?.minPrice?.toLocaleString() || "N/A"} - ${stats?.maxPrice?.toLocaleString() || "N/A"}
- Estimated avg price/sqft: AED ${stats?.pricePerSqft?.toLocaleString() || "N/A"}
- ${stats?.developers?.length || 0} developers active: ${stats?.developers?.slice(0, 5).join(", ") || "N/A"}
- Construction status breakdown: ${JSON.stringify(stats?.statuses || {})}

Provide a concise 4-section analysis:
1. **Price Intelligence**: Price per sqft positioning vs Dubai average
2. **Supply Analysis**: Current project pipeline and construction status mix
3. **Developer Landscape**: Key players and their impact
4. **Area Performance**: Overall market positioning and investment outlook

Keep each section to 2-3 sentences. Be data-driven and specific.`;

      const { data, error } = await supabase.functions.invoke("ai-property-analyzer", {
        body: { prompt, area: areaName },
      });

      if (error) throw error;
      setAnalysis(data?.analysis || data?.response || data?.content || "Analysis not available.");
    } catch (err) {
      setAnalysis("Unable to generate analysis at this time. Please try again later.");
    } finally {
      setIsAnalyzing(false);
    }
  };

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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-8 py-6 bg-gradient-to-r from-gold to-amber-500 text-black font-bold text-base rounded-xl hover:from-amber-500 hover:to-gold transition-all"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing {areaName}...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate AI Area Analysis
                </>
              )}
            </Button>
          </motion.div>
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
