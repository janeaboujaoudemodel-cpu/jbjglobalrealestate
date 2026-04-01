import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, Brain, MessageSquare, RefreshCw, 
  TrendingUp, Building2, Users, AlertCircle, Info,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

/* ============================================================
 * ICON BOX STYLE - Active Champagne + Gold Border + Black Icon
 * ============================================================ */
const IconBox = ({ icon: Icon, className = "" }: { icon: React.ElementType; className?: string }) => (
  <div 
    className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 border-gold transition-all duration-300 hover:shadow-[0_8px_20px_rgba(200,167,102,0.4)] ${className}`}
    style={{
      background: 'linear-gradient(135deg, #F7F1E6 0%, #ECE2D2 50%, #D8C7A6 100%)',
    }}
  >
    <Icon className="w-5 h-5 text-black" />
  </div>
);

// Pre-set educational insights (public authority content)
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

type NarrativeType = 'market_overview' | 'area_intelligence' | 'rental_trends';

const narrativeOptions: { id: NarrativeType; label: string; icon: React.ElementType }[] = [
  { id: 'market_overview', label: 'Market Overview', icon: TrendingUp },
  { id: 'area_intelligence', label: 'Area Intelligence', icon: Building2 },
  { id: 'rental_trends', label: 'Rental Trends', icon: Users },
];

export const AIMarketInsights = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeNarrativeType, setActiveNarrativeType] = useState<NarrativeType>('market_overview');
  const [generatedNarratives, setGeneratedNarratives] = useState<Record<NarrativeType, string | null>>({
    market_overview: null,
    area_intelligence: null,
    rental_trends: null,
  });

  const generatePublicNarrative = async (type: NarrativeType) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-market-narratives', {
        body: {
          mode: 'public',
          narrativeType: type,
        },
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
        } else if (error.message?.includes('402')) {
          toast.error('AI service temporarily unavailable.');
        } else {
          throw error;
        }
        return;
      }

      if (data?.narrative) {
        setGeneratedNarratives(prev => ({
          ...prev,
          [type]: data.narrative,
        }));
      }
    } catch (err) {
      console.error('Error generating narrative:', err);
      toast.error('Unable to generate insight. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="py-16 bg-black">
      <div className="jj-layer-2">
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
              Understanding the Market
            </h2>
            <p className="text-black/90 max-w-2xl mx-auto">
              AI-generated explanations of market trends based on official government data. 
              These insights help contextualize the "why" behind the numbers.
            </p>
          </motion.div>

          {/* Preset Insights Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {PRESET_INSIGHTS.map((insight) => (
              <motion.div key={insight.id} variants={fadeInUp}>
                <Card className="jj-card-inner hover:border-white transition-all h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <IconBox icon={insight.icon} className="shrink-0" />
                      <div>
                        <CardTitle className="text-black text-lg mb-1">{insight.title}</CardTitle>
                        <p className="text-gold/80 text-sm italic">"{insight.question}"</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-black/90 text-sm leading-relaxed">
                      {insight.insight}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* AI Narrative Generator */}
          <motion.div variants={fadeInUp}>
            <Card className="jj-card-inner shadow-lg">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
                  <IconBox icon={Brain} className="w-16 h-16 shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-black text-xl font-bold mb-2">
                      Generate Market Narrative
                    </h3>
                    <p className="text-black/90 text-sm mb-4">
                      Get an AI-generated analysis based on official government Open Data.
                      Select a topic below to generate educational market insights.
                    </p>
                  </div>
                </div>

                <Tabs value={activeNarrativeType} onValueChange={(v) => setActiveNarrativeType(v as NarrativeType)}>
                  <TabsList className="bg-white/50 border border-black/10 mb-6">
                    {narrativeOptions.map((opt) => (
                      <TabsTrigger
                        key={opt.id}
                        value={opt.id}
                        className="flex items-center gap-2 data-[state=active]:bg-black data-[state=active]:text-gold"
                      >
                        <opt.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{opt.label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {narrativeOptions.map((opt) => (
                    <TabsContent key={opt.id} value={opt.id}>
                      <div className="space-y-4">
                        <Button
                          variant="primary"
                          onClick={() => generatePublicNarrative(opt.id)}
                          disabled={isGenerating}
                        >
                          {isGenerating && activeNarrativeType === opt.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              <span className="text-black">Gener</span><span className="text-gold">ating...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              <span className="text-black">Generate</span><span className="text-gold"> {opt.label}</span>
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </>
                          )}
                        </Button>

                        {generatedNarratives[opt.id] && (
                          <div className="p-6 bg-white/50 rounded-xl border border-black/10">
                            <div className="flex items-center gap-2 text-gold text-sm mb-3">
                              <MessageSquare className="w-4 h-4" />
                              AI Market Analysis
                            </div>
                            <div className="text-black/80 text-sm leading-relaxed whitespace-pre-wrap">
                              {generatedNarratives[opt.id]}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          {/* Disclaimer */}
          <motion.div 
            className="mt-8 flex items-start gap-3 p-4 jj-card-inner max-w-3xl mx-auto"
            variants={fadeInUp}
          >
            <Info className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <p className="text-black/80 text-xs leading-relaxed">
              AI-generated insights are based on aggregated government Open Data and are provided for informational purposes only. 
              They do not constitute financial, investment, or legal advice. 
              AI explains data but does not predict prices or provide specific investment recommendations.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};