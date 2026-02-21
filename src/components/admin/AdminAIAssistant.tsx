import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Brain,
  Send,
  Sparkles,
  Lightbulb,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Insight {
  id: string;
  type: "suggestion" | "alert" | "metric" | "action";
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  actionLabel?: string;
  actionHref?: string;
}

export const AdminAIAssistant = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [response, setResponse] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(true);

  // Fetch real insights on mount
  useEffect(() => {
    fetchRealInsights();
  }, []);

  const fetchRealInsights = async () => {
    setLoadingInsights(true);
    try {
      // Fetch real stats from database
      const [leadsResult, visitorResult, campaignsResult] = await Promise.all([
        supabase.from('crm_leads').select('*', { count: 'exact', head: true }),
        supabase.from('visitor_events').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('marketing_campaigns').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
      ]);

      const realInsights: Insight[] = [];

      // Lead insight
      const leadCount = leadsResult.count || 0;
      if (leadCount > 0) {
        realInsights.push({
          id: "leads",
          type: "metric",
          title: "Active Leads",
          description: `You have ${leadCount} leads in your CRM. Review and follow up with recent inquiries.`,
          priority: leadCount > 10 ? "medium" : "low",
          actionLabel: "View Leads",
          actionHref: "/admin/leads",
        });
      }

      // Visitor insight
      const visitorEventCount = visitorResult.count || 0;
      if (visitorEventCount > 0) {
        realInsights.push({
          id: "visitors",
          type: "metric",
          title: "Recent Visitor Activity",
          description: `${visitorEventCount} visitor events recorded in the last 24 hours.`,
          priority: "low",
          actionLabel: "View Analytics",
          actionHref: "/admin",
        });
      }

      // Campaign insight
      const draftCampaigns = campaignsResult.count || 0;
      if (draftCampaigns > 0) {
        realInsights.push({
          id: "campaigns",
          type: "action",
          title: "Draft Campaigns Pending",
          description: `You have ${draftCampaigns} draft campaigns ready to be scheduled or sent.`,
          priority: "medium",
          actionLabel: "View Campaigns",
          actionHref: "/admin/marketing-hub",
        });
      }

      // Always add a security reminder
      realInsights.push({
        id: "security",
        type: "suggestion",
        title: "Security Best Practice",
        description: "Regular security audits help protect your platform. Review access logs periodically.",
        priority: "low",
        actionLabel: "View Security",
        actionHref: "/admin/security-console",
      });

      setInsights(realInsights);
    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleAskAI = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setResponse(null);
    
    try {
      // Call AI edge function for real responses
      const { data, error } = await supabase.functions.invoke('lovable-ai', {
        body: {
          prompt: `You are an admin assistant for a real estate platform. The user asks: "${query}". Provide a helpful, concise response about platform management, leads, marketing, or operations. Keep responses professional and actionable.`,
          model: 'google/gemini-2.5-flash',
        },
      });

      if (error) throw error;
      
      setResponse(data?.content || data?.text || "I've processed your query. Please check the relevant dashboard section for more details.");
    } catch (error) {
      console.error("AI query failed:", error);
      // Fallback response
      setResponse(`I can help you with: leads management, marketing campaigns, visitor analytics, and platform security. Please rephrase your question or check the relevant dashboard section.`);
    } finally {
      setLoading(false);
    }
  };

  const handleInsightAction = (insight: Insight) => {
    if (insight.actionHref) {
      navigate(insight.actionHref);
    }
  };

  const getInsightIcon = (type: Insight["type"]) => {
    switch (type) {
      case "suggestion": return <Lightbulb className="w-4 h-4" />;
      case "alert": return <AlertCircle className="w-4 h-4" />;
      case "metric": return <TrendingUp className="w-4 h-4" />;
      case "action": return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const getInsightStyles = (type: Insight["type"], priority: Insight["priority"]) => {
    if (priority === "high") return "bg-red-50 border-red-200 text-red-800";
    switch (type) {
      case "suggestion": return "bg-blue-50 border-blue-200 text-blue-800";
      case "alert": return "bg-amber-50 border-amber-200 text-amber-800";
      case "metric": return "bg-emerald-50 border-emerald-200 text-emerald-800";
      case "action": return "bg-purple-50 border-purple-200 text-purple-800";
    }
  };

  return (
    <Card className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 shadow-[0_8px_30px_rgba(200,167,102,0.25)] overflow-hidden">
      <CardHeader className="border-b border-gold/30 bg-gradient-to-r from-white/50 to-transparent">
        <CardTitle className="text-black flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gold/30 border border-gold/40">
            <Brain className="w-5 h-5 text-black" />
          </div>
          Admin Assistant
          <Badge className="ml-auto bg-gold/30 text-black border-gold/50 font-medium">
            <Sparkles className="w-3 h-3 mr-1" />
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* AI Query Input */}
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAskAI()}
            placeholder="Ask about leads, campaigns, analytics..."
            className="bg-white/80 border-gold/30 text-black placeholder:text-black/50 focus:border-gold focus:ring-gold/20"
          />
          <Button
            onClick={handleAskAI}
            disabled={loading || !query.trim()}
            className="bg-black hover:bg-black/90 text-gold shadow-lg"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* AI Response */}
        <AnimatePresence>
          {response && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-xl bg-white/80 border-2 border-gold/30 shadow-inner"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gold/20 shrink-0">
                  <Brain className="w-4 h-4 text-black" />
                </div>
                <div className="text-sm text-black/80 whitespace-pre-wrap leading-relaxed">
                  {response}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Smart Insights */}
        <div className="pt-2">
          <p className="text-xs text-black/60 uppercase tracking-wider mb-3 font-medium">Live Insights</p>
          <ScrollArea className="h-[200px]">
            {loadingInsights ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-gold" />
              </div>
            ) : (
              <div className="space-y-2">
                {insights.map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-3 rounded-xl border-2 ${getInsightStyles(insight.type, insight.priority)} shadow-sm hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-current/10 shrink-0">
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{insight.title}</p>
                        <p className="text-xs opacity-80 mt-0.5">{insight.description}</p>
                      </div>
                      {insight.priority === "high" && (
                        <Badge variant="destructive" className="shrink-0 text-[10px] px-1.5">
                          Urgent
                        </Badge>
                      )}
                    </div>
                    {insight.actionLabel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInsightAction(insight)}
                        className="mt-2 h-7 text-xs ml-8 hover:bg-current/10"
                      >
                        {insight.actionLabel}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminAIAssistant;
