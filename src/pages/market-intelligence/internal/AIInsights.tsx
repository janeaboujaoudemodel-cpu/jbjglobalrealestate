import { motion } from "framer-motion";
import { Sparkles, Lock, ArrowLeft, MessageSquare, Target, Users, TrendingUp } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

const AIInsights = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // AI-generated internal insights
  const insights = [
    {
      category: 'Emerging Trends',
      icon: TrendingUp,
      color: 'emerald',
      items: [
        {
          title: 'Palm Jumeirah Beachfront Surge',
          insight: 'Beachfront villas on Palm Jumeirah are experiencing 15% faster absorption than 6 months ago. Focus broker efforts on HNWI clients seeking immediate handover properties.',
          actionable: 'Prioritize Palm beachfront in client presentations',
        },
        {
          title: 'Business Bay Rental Demand',
          insight: 'Corporate relocations are driving a 22% increase in Business Bay rental inquiries. Short-term furnished units are particularly in demand.',
          actionable: 'Highlight furnished inventory to corporate clients',
        },
      ],
    },
    {
      category: 'Client Hesitation Signals',
      icon: Users,
      color: 'amber',
      items: [
        {
          title: 'JVC Price Sensitivity',
          insight: 'Clients showing interest in JVC are hesitating at prices above AED 1,100/sqft. Consider emphasizing value propositions and payment plans.',
          actionable: 'Lead with payment plan flexibility in JVC pitches',
        },
        {
          title: 'Off-Plan Timeline Concerns',
          insight: 'Investors expressing concern about 2027+ handover timelines. Emphasize developer track records and escrow protections.',
          actionable: 'Prepare developer credibility decks',
        },
      ],
    },
    {
      category: 'Broker Focus Areas',
      icon: Target,
      color: 'blue',
      items: [
        {
          title: 'Dubai Hills Family Segment',
          insight: 'Family clients relocating from Europe are showing strong interest in Dubai Hills townhouses. School proximity is the #1 decision factor.',
          actionable: 'Map school catchment areas for client tours',
        },
        {
          title: 'Creek Harbour Investment Window',
          insight: 'Dubai Creek Harbour pre-launch prices offer 8-12% below expected post-launch. Time-sensitive opportunity for investment-focused clients.',
          actionable: 'Proactive outreach to investor database',
        },
      ],
    },
    {
      category: 'Language Suggestions',
      icon: MessageSquare,
      color: 'purple',
      items: [
        {
          title: 'Value Framing for Premium Areas',
          insight: 'Instead of "expensive," use "exclusive inventory with limited supply." Clients respond better to scarcity than price justification.',
          actionable: 'Update pitch scripts',
        },
        {
          title: 'Rental Yield Positioning',
          insight: 'Lead with "net yield after service charges" rather than gross yields. More sophisticated investors appreciate the transparency.',
          actionable: 'Prepare net yield calculations',
        },
      ],
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
      emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: 'text-emerald-400' },
      amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: 'text-amber-400' },
      blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: 'text-blue-400' },
      purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', icon: 'text-purple-400' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="AI Market Narratives | JBJ Global Real Estate"
        description="AI-generated market insights for JBJ team members."
        canonicalPath="/internal/market-intelligence/ai-insights"
      />

      {/* Internal Warning Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/30 py-3">
        <div className="container mx-auto px-4 flex items-center justify-center gap-3">
          <Lock className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 text-sm font-medium">INTERNAL USE ONLY — AI Market Narratives</span>
        </div>
      </div>

      {/* Header */}
      <section className="py-12 border-b border-zinc-900">
        <div className="container mx-auto px-4">
          <Link to="/internal/market-intelligence/dashboard" className="inline-flex items-center gap-2 text-gold hover:text-gold-light mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h1 className="text-white text-3xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                AI Market Narratives
              </h1>
              <p className="text-zinc-500">AI-generated execution insights — descriptive, not predictive</p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-6 border-b border-zinc-900">
        <div className="container mx-auto px-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <p className="text-zinc-400 text-sm">
              <strong className="text-white">Note:</strong> These insights are AI-generated based on aggregated market data. 
              They are descriptive and advisory, not predictive. They do not constitute financial advice.
            </p>
          </div>
        </div>
      </section>

      {/* Insights Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="space-y-12">
            {insights.map((category) => {
              const colors = getColorClasses(category.color);
              const IconComponent = category.icon;
              
              return (
                <div key={category.category}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center`}>
                      <IconComponent className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                    <h2 className="text-white text-xl font-bold">{category.category}</h2>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {category.items.map((item, index) => (
                      <Card key={index} className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-white text-lg">{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-zinc-400 text-sm mb-4">{item.insight}</p>
                          <div className={`${colors.bg} ${colors.border} border rounded-lg p-3`}>
                            <p className={`text-sm font-medium ${colors.text}`}>
                              ✓ {item.actionable}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AIInsights;
