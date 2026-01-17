import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, Brain, MessageSquare, RefreshCw, 
  TrendingUp, Building2, Users, AlertCircle, Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

interface InsightCard {
  id: string;
  icon: React.ElementType;
  title: string;
  question: string;
  insight: string;
  category: 'trend' | 'demand' | 'supply' | 'opportunity';
}

const PRESET_INSIGHTS: InsightCard[] = [
  {
    id: '1',
    icon: TrendingUp,
    title: 'Price Movement Analysis',
    question: 'Why are prices rising in waterfront areas?',
    insight: 'Waterfront properties in Dubai continue to outperform the broader market due to limited supply of beachfront and marina-front locations. Data shows a 12% average premium for waterfront units compared to inland properties. High-net-worth individuals, particularly from Europe and the CIS region, drive demand for these exclusive addresses.',
    category: 'trend',
  },
  {
    id: '2',
    icon: Users,
    title: 'Buyer Demographics',
    question: 'Who is buying in Dubai right now?',
    insight: 'According to government transaction data, international buyers represent approximately 65% of all residential purchases. The top source markets include India, UK, Russia, and China. First-time buyers are increasingly active in the AED 1-2M segment, while repeat investors focus on the AED 3M+ luxury segment.',
    category: 'demand',
  },
  {
    id: '3',
    icon: Building2,
    title: 'Supply Pipeline',
    question: 'What new supply is coming to market?',
    insight: 'The off-plan market remains active with approximately 45,000 new units expected for handover in the next 24 months. Key areas include Dubai Creek Harbour, Dubai Hills Estate, and Mohammed Bin Rashid City. Developers are offering flexible payment plans, with some extending post-handover options up to 5 years.',
    category: 'supply',
  },
  {
    id: '4',
    icon: AlertCircle,
    title: 'Market Dynamics',
    question: 'What factors are influencing the rental market?',
    insight: 'Dubai\'s rental market shows continued strength with average yields of 6-7% across most areas. Population growth, corporate relocations, and the Golden Visa program contribute to sustained rental demand. Short-term rental regulations have stabilized the market, benefiting long-term landlords.',
    category: 'opportunity',
  },
];

export const AIMarketInsights = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [customInsight, setCustomInsight] = useState<string | null>(null);

  const generateCustomInsight = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-market-report', {
        body: {
          reportType: 'quick-insight',
          areas: ['All Dubai'],
          period: 'Current market conditions',
        },
      });

      if (error) throw error;
      
      if (data?.report) {
        setCustomInsight(data.report);
      }
    } catch (err) {
      console.error('Error generating insight:', err);
      toast.error('Unable to generate insight. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
        >
          {/* Section Header */}
          <motion.div className="text-center mb-12" variants={fadeInUp}>
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">
              AI-Powered Insights
            </span>
            <h2 className="text-white text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Understanding the Market
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              AI-generated explanations of market trends based on official government data. 
              These insights help contextualize the "why" behind the numbers.
            </p>
          </motion.div>

          {/* Insights Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {PRESET_INSIGHTS.map((insight) => (
              <motion.div key={insight.id} variants={fadeInUp}>
                <Card className="bg-zinc-900/50 border-zinc-800 hover:border-gold/30 transition-all h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
                        <insight.icon className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg mb-1">{insight.title}</CardTitle>
                        <p className="text-gold/80 text-sm italic">"{insight.question}"</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {insight.insight}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Custom Insight Generator */}
          <motion.div variants={fadeInUp}>
            <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-gold/20">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center shrink-0">
                    <Brain className="w-8 h-8 text-gold" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-white text-xl font-bold mb-2">
                      Generate Market Briefing
                    </h3>
                    <p className="text-zinc-400 text-sm mb-4">
                      Get an AI-generated summary of current market conditions based on the latest Open Data.
                    </p>
                    <Button
                      onClick={generateCustomInsight}
                      disabled={isGenerating}
                      className="bg-gradient-to-r from-gold to-gold-dark text-black font-semibold hover:opacity-90"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Insight
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {customInsight && (
                  <div className="mt-6 p-6 bg-zinc-800/50 rounded-xl border border-zinc-700">
                    <div className="flex items-center gap-2 text-gold text-sm mb-3">
                      <MessageSquare className="w-4 h-4" />
                      AI Market Briefing
                    </div>
                    <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {customInsight}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Disclaimer */}
          <motion.div 
            className="mt-8 flex items-start gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl max-w-3xl mx-auto"
            variants={fadeInUp}
          >
            <Info className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <p className="text-zinc-500 text-xs leading-relaxed">
              AI-generated insights are for informational purposes only and do not constitute financial, investment, or legal advice. 
              All explanations are based on publicly available government data and should not be used as the sole basis for any decisions. 
              AI does not predict prices or provide specific investment recommendations.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
