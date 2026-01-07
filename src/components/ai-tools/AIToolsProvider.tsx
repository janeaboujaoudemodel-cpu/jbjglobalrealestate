import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AIToolResponse {
  success: boolean;
  data?: any;
  error?: string;
  loading: boolean;
}

export const useAITool = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const invokeTool = async (functionName: string, payload: any) => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(functionName, {
        body: payload,
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setResponse(data);
      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || "An error occurred";
      
      // Handle rate limits and payment errors
      if (errorMessage.includes("429") || errorMessage.includes("Rate limit")) {
        toast.error("Rate limit exceeded. Please try again in a moment.");
      } else if (errorMessage.includes("402") || errorMessage.includes("Payment")) {
        toast.error("AI credits exhausted. Please add credits to continue.");
      } else {
        toast.error(errorMessage);
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { invokeTool, loading, response, error, setResponse };
};

// AI Tool configurations
export const AI_TOOLS_CONFIG = {
  // Property Intelligence
  virtualStaging: {
    id: "virtual-staging",
    name: "AI Virtual Staging",
    description: "Transform empty rooms with AI-generated furniture and décor",
    function: "ai-virtual-staging",
    category: "Property Intelligence",
    icon: "Palette",
  },
  pricePredictor: {
    id: "price-predictor",
    name: "AI Price Predictor",
    description: "Predict property prices based on market data and trends",
    function: "ai-price-predictor",
    category: "Property Intelligence",
    icon: "TrendingUp",
  },
  neighborhoodInsights: {
    id: "neighborhood-insights",
    name: "AI Neighborhood Insights",
    description: "Get detailed analysis of neighborhoods and areas",
    function: "ai-neighborhood-insights",
    category: "Property Intelligence",
    icon: "MapPin",
  },

  // Lead & Sales Automation
  leadQualification: {
    id: "lead-qualification",
    name: "AI Lead Qualification",
    description: "Automatically qualify and score leads",
    function: "ai-lead-qualification",
    category: "Lead & Sales",
    icon: "UserCheck",
  },
  followupScheduler: {
    id: "followup-scheduler",
    name: "AI Follow-up Scheduler",
    description: "Smart scheduling for lead follow-ups",
    function: "ai-followup-scheduler",
    category: "Lead & Sales",
    icon: "CalendarClock",
  },
  objectionHandler: {
    id: "objection-handler",
    name: "AI Objection Handler",
    description: "Get expert responses to buyer objections",
    function: "ai-objection-handler",
    category: "Lead & Sales",
    icon: "MessageSquareReply",
  },

  // Analytics & Insights
  marketReport: {
    id: "market-report",
    name: "AI Market Report",
    description: "Generate comprehensive market analysis reports",
    function: "ai-market-report",
    category: "Analytics",
    icon: "FileBarChart",
  },
  competitorAnalysis: {
    id: "competitor-analysis",
    name: "AI Competitor Analysis",
    description: "Analyze competitor properties and pricing",
    function: "ai-competitor-analysis",
    category: "Analytics",
    icon: "Users",
  },
  roiCalculator: {
    id: "roi-calculator",
    name: "AI ROI Calculator",
    description: "Calculate investment returns and projections",
    function: "ai-roi-calculator",
    category: "Analytics",
    icon: "Calculator",
  },

  // Communication
  meetingSummarizer: {
    id: "meeting-summarizer",
    name: "AI Meeting Summarizer",
    description: "Summarize meetings and extract action items",
    function: "ai-meeting-summarizer",
    category: "Communication",
    icon: "FileAudio",
  },
  translationHub: {
    id: "translation-hub",
    name: "AI Translation Hub",
    description: "Translate content into multiple languages",
    function: "ai-translation-hub",
    category: "Communication",
    icon: "Languages",
  },
  videoTourScript: {
    id: "video-tour-script",
    name: "AI Video Tour Script",
    description: "Generate engaging property tour scripts",
    function: "ai-video-tour-script",
    category: "Communication",
    icon: "Video",
  },

  // Document Intelligence
  contractReviewer: {
    id: "contract-reviewer",
    name: "AI Contract Reviewer",
    description: "Review contracts and highlight key terms",
    function: "ai-contract-reviewer",
    category: "Documents",
    icon: "FileSearch",
  },
  documentGenerator: {
    id: "document-generator",
    name: "AI Document Generator",
    description: "Generate professional real estate documents",
    function: "ai-document-generator",
    category: "Documents",
    icon: "FilePlus",
  },
};

export type AIToolKey = keyof typeof AI_TOOLS_CONFIG;
