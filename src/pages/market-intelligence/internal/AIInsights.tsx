import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, Lock, ArrowLeft, MessageSquare, Target, Users, TrendingUp,
  RefreshCw, Brain, MapPin, AlertTriangle
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GeneratedInsight {
  type: string;
  content: string;
  generatedAt: string;
}

const AIInsights = () => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('broker_focus');
  const [generatedInsights, setGeneratedInsights] = useState<Record<string, GeneratedInsight>>({});

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const narrativeTypes = [
    {
      id: 'broker_focus',
      title: 'Broker Focus Areas',
      description: 'Where to prioritize efforts for maximum impact',
      icon: Target,
      color: 'emerald',
    },
    {
      id: 'client_objection',
      title: 'Client Objection Support',
      description: 'Data-backed responses to common hesitations',
      icon: Users,
      color: 'amber',
    },
    {
      id: 'area_prioritization',
      title: 'Area Prioritization',
      description: 'Which areas are performing and why',
      icon: MapPin,
      color: 'blue',
    },
  ];

  const generateNarrative = async (type: string) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-market-narratives', {
        body: {
          mode: 'internal',
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
        setGeneratedInsights(prev => ({
          ...prev,
          [type]: {
            type,
            content: data.narrative,
            generatedAt: data.generatedAt,
          },
        }));
        toast.success('Narrative generated successfully');
      }
    } catch (err) {
      console.error('Error generating narrative:', err);
      toast.error('Failed to generate narrative. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
      emerald: { bg: 'jj-surface-emerald-soft', border: 'border-[color:var(--emerald-1)]/30/30', text: 'text-emerald-400', icon: 'text-emerald-400' },
      amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-[#1A1A1A]', icon: 'text-[#1A1A1A]' },
      blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: 'text-blue-400' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <SEOHead 
        title="AI Market Narratives | JBJ Global Real Estate"
        description="AI-generated market insights for JBJ team members."
        canonicalPath="/internal/market-intelligence/ai-insights"
      />

      {/* Internal Warning Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/30 py-3">
        <div className="container mx-auto px-4 flex items-center justify-center gap-3">
          <Lock className="w-4 h-4 text-[#1A1A1A]" />
          <span className="text-[#1A1A1A] text-sm font-medium">INTERNAL USE ONLY — AI Market Narratives (Execution Mode)</span>
        </div>
      </div>

      {/* Header */}
      <section className="py-12 border-b border-[#1A1A1A]">
        <div className="container mx-auto px-4">
          <Link to="/internal/market-intelligence/dashboard" className="inline-flex items-center gap-2 text-[#1A1A1A] hover:text-[#1A1A1A]-light mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EFE6D6]/10 border border-[#B89555]/30 flex items-center justify-center">
              <Brain className="w-6 h-6 text-[#1A1A1A]" />
            </div>
            <div>
              <h1 className="text-[#1A1A1A] text-3xl font-bold">
                AI Market Narratives
              </h1>
              <p className="text-[#1A1A1A]/90">Internal execution intelligence — descriptive, not predictive</p>
            </div>
          </div>
        </div>
      </section>

      {/* Internal Disclaimer */}
      <section className="py-6 border-b border-[#1A1A1A]">
        <div className="container mx-auto px-4">
          <div className="bg-[#FDFBF7]/50 border border-[#1A1A1A] rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#1A1A1A] shrink-0 mt-0.5" />
            <div>
              <p className="text-[#1A1A1A]/70 text-sm">
                <strong className="text-[#1A1A1A]">Internal Use Only:</strong> These AI-generated narratives are for broker execution support. 
                They are <span className="text-[#1A1A1A]">descriptive and advisory, not predictive</span>. 
                They do not constitute financial advice and must not be shared externally.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Narrative Generator */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="bg-[#FDFBF7]/50 border border-[#1A1A1A] p-1 w-full md:w-auto flex flex-wrap">
              {narrativeTypes.map((type) => (
                <TabsTrigger
                  key={type.id}
                  value={type.id}
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:border-[#B89555]/40"
                >
                  <type.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{type.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {narrativeTypes.map((type) => {
              const colors = getColorClasses(type.color);
              const insight = generatedInsights[type.id];

              return (
                <TabsContent key={type.id} value={type.id}>
                  <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A]">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center`}>
                            <type.icon className={`w-6 h-6 ${colors.icon}`} />
                          </div>
                          <div>
                            <CardTitle className="text-[#1A1A1A] text-xl">{type.title}</CardTitle>
                            <p className="text-[#1A1A1A]/90 text-sm mt-1">{type.description}</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => generateNarrative(type.id)}
                          disabled={isGenerating}
                          className="bg-gradient-to-r from-gold to-gold-dark text-[#1A1A1A] font-semibold hover:opacity-90"
                        >
                          {isGenerating && activeTab === type.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {insight ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-xs text-[#1A1A1A]/90">
                            <MessageSquare className="w-3 h-3" />
                            Generated {new Date(insight.generatedAt).toLocaleString()}
                          </div>
                          <div className="p-6 bg-[#F7F2EA]/50 rounded-xl border border-[#1A1A1A]">
                            <div className="prose  prose-sm max-w-none">
                              <div className="text-[#1A1A1A]/85 text-sm leading-relaxed whitespace-pre-wrap">
                                {insight.content}
                              </div>
                            </div>
                          </div>
                          <div className={`${colors.bg} ${colors.border} border rounded-lg p-3`}>
                            <p className="text-[#1A1A1A]/70 text-xs italic">
                              Internal AI insights are descriptive analytics intended to support brokerage execution, not predictive forecasts.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Brain className="w-12 h-12 text-[#1A1A1A]/70 mx-auto mb-4" />
                          <p className="text-[#1A1A1A]/90 text-sm">
                            Click "Generate" to create AI-powered execution intelligence for this category.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-12 border-t border-[#1A1A1A]">
        <div className="container mx-auto px-4">
          <h2 className="text-[#1A1A1A] text-xl font-bold mb-6">Execution Intelligence Summary</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A]">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <span className="text-[#1A1A1A]/70 text-sm">Hot Areas</span>
                </div>
                <p className="text-[#1A1A1A] font-semibold">Palm Jumeirah, Dubai Hills, Creek Harbour</p>
                <p className="text-[#1A1A1A]/90 text-xs mt-2">Based on recent inquiry velocity</p>
              </CardContent>
            </Card>
            <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A]">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-5 h-5 text-[#1A1A1A]" />
                  <span className="text-[#1A1A1A]/70 text-sm">Client Focus</span>
                </div>
                <p className="text-[#1A1A1A] font-semibold">HNWI Beachfront, Corporate Rentals</p>
                <p className="text-[#1A1A1A]/90 text-xs mt-2">Priority segments this week</p>
              </CardContent>
            </Card>
            <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A]">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-5 h-5 text-blue-400" />
                  <span className="text-[#1A1A1A]/70 text-sm">Action Priority</span>
                </div>
                <p className="text-[#1A1A1A] font-semibold">Follow up on pending viewings</p>
                <p className="text-[#1A1A1A]/90 text-xs mt-2">12 high-intent leads in pipeline</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AIInsights;
