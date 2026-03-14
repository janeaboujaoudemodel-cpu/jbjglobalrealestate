import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAIToolTracking } from "@/hooks/useAIToolTracking";

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
  const { trackToolStart, trackToolComplete } = useAIToolTracking();

  const invokeTool = async (functionName: string, payload: any) => {
    setLoading(true);
    setError(null);
    setResponse(null);

    const startTime = Date.now();
    const eventId = await trackToolStart(functionName);

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

      const elapsed = Date.now() - startTime;
      await trackToolComplete(eventId, "success", elapsed);

      setResponse(data);
      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || "An error occurred";
      const elapsed = Date.now() - startTime;
      await trackToolComplete(eventId, "failure", elapsed, errorMessage);
      
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
    name: "JBJ AI Virtual Staging",
    description: "Transform empty rooms with AI-generated furniture and décor",
    function: "ai-virtual-staging",
    category: "Property Intelligence",
    icon: "Palette",
  },
  pricePredictor: {
    id: "price-predictor",
    name: "JBJ AI Price Predictor",
    description: "Predict property prices based on market data and trends",
    function: "ai-price-predictor",
    category: "Property Intelligence",
    icon: "TrendingUp",
  },
  neighborhoodInsights: {
    id: "neighborhood-insights",
    name: "JBJ AI Neighborhood Insights",
    description: "Get detailed analysis of neighborhoods and areas",
    function: "ai-neighborhood-insights",
    category: "Property Intelligence",
    icon: "MapPin",
  },

  // Lead & Sales Automation
  leadQualification: {
    id: "lead-qualification",
    name: "JBJ AI Lead Qualification",
    description: "Automatically qualify and score leads",
    function: "ai-lead-qualification",
    category: "Lead & Sales",
    icon: "UserCheck",
  },
  followupScheduler: {
    id: "followup-scheduler",
    name: "JBJ AI Follow-up Scheduler",
    description: "Smart scheduling for lead follow-ups",
    function: "ai-followup-scheduler",
    category: "Lead & Sales",
    icon: "CalendarClock",
  },
  objectionHandler: {
    id: "objection-handler",
    name: "JBJ AI Objection Handler",
    description: "Get expert responses to buyer objections",
    function: "ai-objection-handler",
    category: "Lead & Sales",
    icon: "MessageSquareReply",
  },

  // Analytics & Insights
  marketReport: {
    id: "market-report",
    name: "JBJ AI Market Report",
    description: "Generate comprehensive market analysis reports",
    function: "ai-market-report",
    category: "Analytics",
    icon: "FileBarChart",
  },
  competitorAnalysis: {
    id: "competitor-analysis",
    name: "JBJ AI Competitor Analysis",
    description: "Analyze competitor properties and pricing",
    function: "ai-competitor-analysis",
    category: "Analytics",
    icon: "Users",
  },
  roiCalculator: {
    id: "roi-calculator",
    name: "JBJ AI ROI Calculator",
    description: "Calculate investment returns and projections",
    function: "ai-roi-calculator",
    category: "Analytics",
    icon: "Calculator",
  },

  // Communication
  meetingSummarizer: {
    id: "meeting-summarizer",
    name: "JBJ AI Meeting Summarizer",
    description: "Summarize meetings and extract action items",
    function: "ai-meeting-summarizer",
    category: "Communication",
    icon: "FileAudio",
  },
  translationHub: {
    id: "translation-hub",
    name: "JBJ AI Translation Hub",
    description: "Translate content into multiple languages",
    function: "ai-translation-hub",
    category: "Communication",
    icon: "Languages",
  },
  videoTourScript: {
    id: "video-tour-script",
    name: "JBJ AI Video Tour Script",
    description: "Generate engaging property tour scripts",
    function: "ai-video-tour-script",
    category: "Communication",
    icon: "Video",
  },

  // Document Intelligence
  contractReviewer: {
    id: "contract-reviewer",
    name: "JBJ AI Contract Reviewer",
    description: "Review contracts and highlight key terms",
    function: "ai-contract-reviewer",
    category: "Documents",
    icon: "FileSearch",
  },
  documentGenerator: {
    id: "document-generator",
    name: "JBJ AI Document Generator",
    description: "Generate professional real estate documents",
    function: "ai-document-generator",
    category: "Documents",
    icon: "FilePlus",
  },

  // Property Analysis (additional)
  propertyAnalyzer: {
    id: "property-analyzer",
    name: "JBJ AI Property Analyzer",
    description: "Deep analysis of property features, market position, and investment potential",
    function: "ai-property-analyzer",
    category: "Property Intelligence",
    icon: "Building",
  },

  // Client Matching
  clientMatcher: {
    id: "client-matcher",
    name: "JBJ AI Client Matcher",
    description: "Match clients with ideal properties based on preferences and budget",
    function: "ai-client-matcher",
    category: "Lead & Sales",
    icon: "Users",
  },

  // Email Generator
  emailGenerator: {
    id: "email-generator",
    name: "JBJ AI Email Generator",
    description: "Create professional follow-up and marketing emails",
    function: "ai-email-generator",
    category: "Communication",
    icon: "Mail",
  },

  // Social Media Content
  socialMediaGenerator: {
    id: "social-media-generator",
    name: "JBJ AI Social Media",
    description: "Generate engaging social media posts for property listings",
    function: "ai-social-media",
    category: "Communication",
    icon: "Share2",
  },

  // Property Description Writer
  descriptionWriter: {
    id: "description-writer",
    name: "JBJ AI Description Writer",
    description: "Create compelling property descriptions for listings",
    function: "ai-description-writer",
    category: "Communication",
    icon: "PenTool",
  },

  // Investment Report
  investmentReport: {
    id: "investment-report",
    name: "JBJ AI Investment Report",
    description: "Generate detailed investment opportunity reports",
    function: "ai-investment-report",
    category: "Analytics",
    icon: "TrendingUp",
  },
};

export type AIToolKey = keyof typeof AI_TOOLS_CONFIG;
