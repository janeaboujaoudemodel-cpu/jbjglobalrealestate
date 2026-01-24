import { useState } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Insight {
  id: string;
  type: "suggestion" | "alert" | "metric" | "action";
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  actionLabel?: string;
  actionHref?: string;
}

const SAMPLE_INSIGHTS: Insight[] = [
  {
    id: "1",
    type: "alert",
    title: "High API Usage Detected",
    description: "AI chat support has seen 45% more requests this week. Consider increasing rate limits.",
    priority: "medium",
    actionLabel: "View Rate Limits",
  },
  {
    id: "2",
    type: "suggestion",
    title: "Lead Response Time",
    description: "Average response time to new leads is 4.2 hours. Industry benchmark is under 1 hour.",
    priority: "high",
    actionLabel: "View Leads",
  },
  {
    id: "3",
    type: "metric",
    title: "Conversion Rate Up",
    description: "Property inquiry to viewing conversion is up 12% this month.",
    priority: "low",
  },
  {
    id: "4",
    type: "action",
    title: "Security Review Due",
    description: "It's been 7 days since your last security audit review.",
    priority: "medium",
    actionLabel: "Run Audit",
  },
];

export const AdminAIAssistant = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [insights] = useState<Insight[]>(SAMPLE_INSIGHTS);
  const [response, setResponse] = useState<string | null>(null);

  const handleAskAI = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setResponse(null);
    
    try {
      // Simulate AI response - in production this would call an edge function
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const mockResponses: Record<string, string> = {
        default: `Based on your admin data, here's what I found regarding "${query}":

• Current system health is optimal with all services running normally
• There are no critical security alerts requiring immediate attention
• Lead volume is trending upward with a 15% increase this week

Would you like me to provide more specific insights or take any actions?`,
        leads: `Lead Analysis for your query:

• Total active leads: 156 across all sources
• Hot leads (last 24h): 12 requiring immediate follow-up
• Top performing source: Website inquiries (42%)
• Recommended action: Focus on Dubai Marina properties - highest interest

I can help you prioritize or assign leads if needed.`,
        security: `Security Status Report:

• 3 IP addresses blocked in the last 24 hours (automated)
• No unusual login patterns detected
• Rate limiting is functioning normally
• All admin access logs are clean

Your platform security is strong. No immediate actions required.`,
      };
      
      let responseText = mockResponses.default;
      if (query.toLowerCase().includes("lead")) {
        responseText = mockResponses.leads;
      } else if (query.toLowerCase().includes("security")) {
        responseText = mockResponses.security;
      }
      
      setResponse(responseText);
    } catch (error) {
      console.error("AI query failed:", error);
      setResponse("I encountered an error processing your request. Please try again.");
    } finally {
      setLoading(false);
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

  const getInsightColor = (type: Insight["type"], priority: Insight["priority"]) => {
    if (priority === "high") return "bg-red-500/10 text-red-600 border-red-200";
    switch (type) {
      case "suggestion": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "alert": return "bg-amber-500/10 text-amber-600 border-amber-200";
      case "metric": return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
      case "action": return "bg-purple-500/10 text-purple-600 border-purple-200";
    }
  };

  return (
    <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-gold/30 shadow-2xl overflow-hidden">
      <CardHeader className="border-b border-zinc-800 bg-gradient-to-r from-gold/10 to-transparent">
        <CardTitle className="text-white flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gold/20">
            <Brain className="w-5 h-5 text-gold" />
          </div>
          AI Admin Assistant
          <Badge className="ml-auto bg-gold/20 text-gold border-gold/30">
            <Sparkles className="w-3 h-3 mr-1" />
            Beta
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
            placeholder="Ask about leads, security, performance..."
            className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-gold"
          />
          <Button
            onClick={handleAskAI}
            disabled={loading || !query.trim()}
            className="bg-gold hover:bg-gold/90 text-black"
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
              className="p-4 rounded-xl bg-gradient-to-br from-gold/10 to-transparent border border-gold/20"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gold/20 shrink-0">
                  <Brain className="w-4 h-4 text-gold" />
                </div>
                <div className="text-sm text-zinc-300 whitespace-pre-wrap">
                  {response}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Smart Insights */}
        <div className="pt-2">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Smart Insights</p>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg border ${getInsightColor(insight.type, insight.priority)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded bg-current/10 shrink-0">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{insight.title}</p>
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
                      className="mt-2 h-7 text-xs ml-8"
                    >
                      {insight.actionLabel}
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminAIAssistant;
