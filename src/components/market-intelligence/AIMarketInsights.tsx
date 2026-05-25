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
import {
  MI_EYEBROW,
  MI_H2,
  MI_LEAD,
  MI_CARD_TITLE,
  MI_H4,
  MI_BODY,
  MI_BODY_MUTED,
  MI_CAPTION,
} from "./MarketIntelligenceTypography";

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

/* ICON BOX - approved navy with white icon */
const IconBox = ({ icon: Icon, className = "" }: { icon: React.ElementType; className?: string }) => (
  <div
    data-no-contrast-guard
    className={`w-10 h-10 rounded-none flex items-center justify-center transition-all duration-300 bg-[hsl(var(--mi-navy))] border border-[hsl(var(--mi-gold)/0.45)] shadow-md allow-white ${className}`}
  >
    <Icon className="w-5 h-5 text-white allow-white" />
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
    <section className="surface-light py-16 bg-background" data-surface="light">
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
            <span className={`${MI_EYEBROW} mb-4 block`}>
              AI-Powered Insights
            </span>
            <h2 className={`${MI_H2} mb-4`}>
              Understanding the Market
            </h2>
            <p className={`${MI_LEAD} max-w-2xl mx-auto`}>
              AI-assisted explanations of market trends based on official government sources.
              These insights help contextualize the "why" behind the numbers.
            </p>
          </motion.div>

          {/* Preset Insights Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {PRESET_INSIGHTS.map((insight) => (
              <motion.div key={insight.id} variants={fadeInUp}>
                <Card className="h-full rounded-none transition-all hover:shadow-[0_16px_38px_hsl(var(--mi-navy)/0.12)] bg-card border border-[hsl(var(--mi-navy)/0.42)] hover:border-[hsl(var(--mi-navy)/0.72)]">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <IconBox icon={insight.icon} className="shrink-0" />
                      <div>
                        <CardTitle className={`${MI_CARD_TITLE} mb-1`}>{insight.title}</CardTitle>
                        <p className={`${MI_BODY_MUTED} italic`}>"{insight.question}"</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className={MI_BODY}>
                      {insight.insight}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* AI Narrative Generator */}
          <motion.div variants={fadeInUp}>
            <Card className="rounded-none shadow-lg bg-card border border-[hsl(var(--mi-navy)/0.42)]">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
                  <IconBox icon={Brain} className="w-12 h-12 shrink-0" />
                  <div className="flex-1">
                    <h3 className={`${MI_CARD_TITLE} mb-2`}>
                      Generate Market Narrative
                    </h3>
                    <p className={`${MI_BODY_MUTED} mb-4`}>
                      Get an AI-assisted analysis based on official government sources.
                      Select a topic below to generate educational market insights.
                    </p>
                  </div>
                </div>

                <Tabs value={activeNarrativeType} onValueChange={(v) => setActiveNarrativeType(v as NarrativeType)}>
                  <TabsList className="mb-6 rounded-none bg-muted border border-[hsl(var(--mi-navy)/0.28)]">
                    {narrativeOptions.map((opt) => (
                      <TabsTrigger
                        key={opt.id}
                        value={opt.id}
                        className="flex items-center gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background"
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
                          className="rounded-none bg-[hsl(var(--mi-navy))] text-white border border-[hsl(var(--mi-gold))] hover:bg-[hsl(var(--mi-navy-soft))]"
                          data-no-contrast-guard
                        >
                          {isGenerating && activeNarrativeType === opt.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              <span>Generate {opt.label}</span>
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </>
                          )}
                        </Button>

                        {generatedNarratives[opt.id] && (
                           <div className="p-6 rounded-none bg-muted border border-[hsl(var(--mi-navy)/0.28)]">
                            <div className={`${MI_H4} flex items-center gap-2 mb-3`}>
                              <MessageSquare className="w-4 h-4" />
                              AI Market Analysis
                            </div>
                            <div className={MI_BODY}>
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
            className="mt-8 flex items-start gap-3 p-4 max-w-3xl mx-auto rounded-none bg-muted border border-[hsl(var(--mi-navy)/0.28)]"
            variants={fadeInUp}
          >
            <Info className="w-5 h-5 shrink-0 mt-0.5 text-foreground" />
            <p className={MI_CAPTION}>
              AI-assisted insights are based on official government sources and are provided for informational purposes only.
              They do not constitute financial, investment, or legal advice.
              AI explains data but does not predict prices or provide specific investment recommendations.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
