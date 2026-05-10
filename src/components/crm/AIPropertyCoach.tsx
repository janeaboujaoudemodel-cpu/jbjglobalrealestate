import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Brain, Send, Sparkles, Building2, Home, TrendingUp, 
  MessageSquare, Lightbulb, Headphones, RefreshCw 
} from "lucide-react";

interface Lead {
  id: string;
  full_name: string;
  nationality?: string;
  preferred_language?: string;
  current_location_country?: string;
  budget_min?: number;
  budget_max?: number;
  property_type_preference?: string;
}

interface AIPropertyCoachProps {
  lead: Lead;
  activities?: any[];
  onSuggestionApply?: (suggestion: string) => void;
}

interface CoachSuggestion {
  type: 'property' | 'approach' | 'objection' | 'followup';
  title: string;
  content: string;
  confidence: number;
  source: string;
}

const AIPropertyCoach = ({ lead, activities = [], onSuggestionApply }: AIPropertyCoachProps) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CoachSuggestion[]>([]);
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'coach'; content: string }[]>([]);
  const [listeningMode, setListeningMode] = useState(false);

  useEffect(() => {
    // Generate initial suggestions based on lead profile
    generateInitialSuggestions();
  }, [lead.id]);

  const generateInitialSuggestions = async () => {
    setLoading(true);
    try {
      // Analyze lead profile and activities
      const callHistory = activities.filter(a => a.activity_type === 'call');
      const chatHistory = activities.filter(a => a.activity_type === 'whatsapp_click' || a.activity_type === 'whatsapp_message_sent');
      
      const newSuggestions: CoachSuggestion[] = [];

      // Property suggestion based on profile
      if (lead.nationality || lead.preferred_language) {
        newSuggestions.push({
          type: 'property',
          title: 'Recommended Communities',
          content: getPropertySuggestion(lead),
          confidence: 85,
          source: 'JBJ Market Data + Lead Profile'
        });
      }

      // Approach suggestion
      newSuggestions.push({
        type: 'approach',
        title: 'Communication Strategy',
        content: getApproachSuggestion(lead, callHistory.length, chatHistory.length),
        confidence: 80,
        source: 'Activity Analysis'
      });

      // If calls were made, analyze for objections
      if (callHistory.length > 0) {
        newSuggestions.push({
          type: 'objection',
          title: 'Potential Objection Handling',
          content: getObjectionSuggestion(lead),
          confidence: 75,
          source: 'Call History Analysis'
        });
      }

      // Follow-up timing
      newSuggestions.push({
        type: 'followup',
        title: 'Optimal Follow-up',
        content: getFollowupSuggestion(lead, activities),
        confidence: 90,
        source: 'Engagement Patterns'
      });

      setSuggestions(newSuggestions);
    } catch (err) {
      console.error("Failed to generate suggestions:", err);
    } finally {
      setLoading(false);
    }
  };

  const getPropertySuggestion = (lead: Lead): string => {
    const nationality = lead.nationality?.toLowerCase() || '';
    const budget = lead.budget_max || 2000000;

    // Property recommendations based on nationality and budget
    const recommendations: Record<string, string> = {
      'british': 'British clients often prefer Downtown Dubai, Dubai Marina, and Palm Jumeirah. Consider EMAAR developments for their quality standards.',
      'russian': 'Russian clients typically favor Palm Jumeirah, JBR, and Business Bay. Focus on sea views and luxury amenities.',
      'indian': 'Indian investors often choose Business Bay, JVC, and Dubai Hills. Highlight ROI and rental yields.',
      'chinese': 'Chinese buyers prefer Downtown Dubai and new waterfront projects. Emphasize capital appreciation potential.',
      'emirati': 'Local buyers often prefer Dubai Hills, Arabian Ranches, and premium villas. Focus on community and privacy.',
      'pakistani': 'Pakistani clients often favor Business Bay, JLT, and affordable areas with high rental yields.',
      'lebanese': 'Lebanese buyers typically prefer Marina, JBR, and Mediterranean-style communities.',
    };

    const matched = Object.entries(recommendations).find(([key]) => nationality.includes(key));
    
    if (matched) {
      return matched[1];
    }

    if (budget > 5000000) {
      return 'For this budget range, recommend Palm Jumeirah, Emirates Hills, or Downtown Dubai penthouses. Focus on exclusivity and premium amenities.';
    } else if (budget > 2000000) {
      return 'Consider Dubai Hills, Business Bay, or Dubai Marina. These areas offer excellent value and strong appreciation potential.';
    } else {
      return 'Focus on JVC, Dubai South, or Town Square for entry-level investments. Highlight payment plans and developer incentives.';
    }
  };

  const getApproachSuggestion = (lead: Lead, callCount: number, chatCount: number): string => {
    const language = lead.preferred_language?.toLowerCase() || 'en';
    
    let approach = '';
    
    if (callCount === 0 && chatCount === 0) {
      approach = 'First contact recommended via WhatsApp with a personalized message. Mention their nationality and our expertise in the Dubai market.';
    } else if (callCount > 0 && chatCount === 0) {
      approach = 'Call attempts made but no WhatsApp contact. Send a follow-up WhatsApp message summarizing your conversation and next steps.';
    } else if (callCount > 2) {
      approach = 'Multiple call attempts. Consider switching to email or WhatsApp to avoid appearing pushy.';
    } else {
      approach = 'Good engagement. Continue multi-channel approach but prioritize their preferred communication method.';
    }

    if (language === 'ar') {
      approach += ' Consider Arabic language communication for better rapport.';
    }

    return approach;
  };

  const getObjectionSuggestion = (lead: Lead): string => {
    const budget = lead.budget_max || 0;
    
    if (budget < 1000000) {
      return 'Price sensitivity likely. Emphasize payment plans, post-handover options, and developer incentives. Show ROI calculations for rental income.';
    } else if (budget > 5000000) {
      return 'Luxury segment - focus on exclusivity, privacy, and unique features rather than price. Discuss residency benefits and lifestyle.';
    } else {
      return 'Mid-market segment. Common objections: "waiting for better timing" or "comparing options". Counter with market data showing current trends.';
    }
  };

  const getFollowupSuggestion = (lead: Lead, activities: any[]): string => {
    const lastActivity = activities[0];
    
    if (!lastActivity) {
      return 'No previous contact. Reach out within 24 hours for best response rate. Morning (9-11 AM) or evening (5-7 PM) UAE time recommended.';
    }

    const daysSinceContact = Math.floor(
      (Date.now() - new Date(lastActivity.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceContact > 7) {
      return '⚠️ Stale lead! Re-engage immediately with a valuable update (new project, price change, or market news).';
    } else if (daysSinceContact > 3) {
      return 'Follow-up due. Send a check-in message with relevant property options or market update.';
    } else {
      return 'Recently contacted. Wait 1-2 days before next touch point to avoid being pushy.';
    }
  };

  const handleAskCoach = async () => {
    if (!question.trim()) return;

    const userMessage = question.trim();
    setQuestion("");
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-lead-analysis', {
        body: {
          question: userMessage,
          lead,
          activities,
          context: 'property_coaching'
        }
      });

      if (error) throw error;

      const coachResponse = data?.response || "I've analyzed the lead profile. Based on their preferences and market data, I recommend focusing on their specific needs. Would you like me to suggest specific properties or discuss negotiation strategies?";

      setChatHistory(prev => [...prev, { role: 'coach', content: coachResponse }]);
    } catch (err) {
      console.error("Coach error:", err);
      // Fallback response
      const fallbackResponse = `For ${lead.full_name}, I recommend: ${getPropertySuggestion(lead)} ${getApproachSuggestion(lead, 0, 0)}`;
      setChatHistory(prev => [...prev, { role: 'coach', content: fallbackResponse }]);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'property': return <Building2 className="h-4 w-4 text-blue-400" />;
      case 'approach': return <MessageSquare className="h-4 w-4 text-green-400" />;
      case 'objection': return <Lightbulb className="h-4 w-4 text-[#1A1A1A]" />;
      case 'followup': return <TrendingUp className="h-4 w-4 text-purple-400" />;
      default: return <Sparkles className="h-4 w-4 text-[#1A1A1A]" />;
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-[#1A1A1A]" />
            AI Property Coach
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setListeningMode(!listeningMode)}
              className={listeningMode ? "bg-red-500/20 border-red-500/50 text-red-400" : ""}
            >
              <Headphones className="h-4 w-4 mr-1" />
              {listeningMode ? "Listening..." : "Listen to Call"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={generateInitialSuggestions}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Real-time coaching for {lead.full_name} based on their profile and engagement
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Suggestions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-muted/30 border border-border hover:border-[#B89555]/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                {getSuggestionIcon(suggestion.type)}
                <span className="font-semibold text-sm text-foreground">{suggestion.title}</span>
                <Badge variant="outline" className="text-[10px] ml-auto">
                  {suggestion.confidence}% confidence
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{suggestion.content}</p>
              <p className="text-[10px] text-[#1A1A1A]/70">Source: {suggestion.source}</p>
              {onSuggestionApply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 text-xs text-[#1A1A1A] hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
                  onClick={() => onSuggestionApply(suggestion.content)}
                >
                  Apply Suggestion
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Chat Interface */}
        <div className="border-t border-border pt-4">
          <p className="text-sm font-semibold text-foreground mb-3">Ask the Coach</p>
          
          {chatHistory.length > 0 && (
            <ScrollArea className="h-[150px] mb-3 pr-4">
              <div className="space-y-3">
                {chatHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary/20 text-foreground ml-8'
                        : 'bg-[#EFE6D6]/10 text-foreground mr-8 border border-[#B89555]/20'
                    }`}
                  >
                    <p className="text-[10px] text-muted-foreground mb-1">
                      {msg.role === 'user' ? 'You' : 'AI Coach'}
                    </p>
                    {msg.content}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <div className="flex gap-2">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about property recommendations, objection handling, or negotiation strategies..."
              className="min-h-[60px] bg-background border-border text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAskCoach();
                }
              }}
            />
            <Button
              onClick={handleAskCoach}
              disabled={loading || !question.trim()}
              variant="primary"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIPropertyCoach;
