import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wrench, Brain, Mail, MessageSquare, FileText, BarChart3, Video, Mic, Image, Globe,
  Calendar, Database, Upload, CheckCircle, AlertCircle, Clock, Sparkles, Zap, Play,
  TrendingUp, Settings, UserCheck, MapPin, Calculator, FileSearch, FilePlus, PenTool,
  Share2, Building, Users, Palette,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AITool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  status: 'connected' | 'available' | 'coming_soon';
  functionName?: string;
  section: 'my-tools' | 'professional';
}

interface ToolUsageStats {
  totalExecutions: number;
  avgSuccessRate: number;
}

// My Tools - Owner/Founder tools
const MY_TOOLS: AITool[] = [
  { id: 'lovable-ai', name: 'Lovable Developer', description: 'Execute updates and changes to the platform', icon: <Sparkles className="w-5 h-5" />, category: 'Development', status: 'connected', functionName: 'ai-chat', section: 'my-tools' },
  { id: 'gemini-pro', name: 'Google Gemini Pro', description: 'Advanced reasoning and content generation', icon: <Brain className="w-5 h-5" />, category: 'Development', status: 'connected', functionName: 'ai-chat', section: 'my-tools' },
  { id: 'image-gen', name: 'Image Generator', description: 'Create property visuals and marketing assets', icon: <Image className="w-5 h-5" />, category: 'Media', status: 'connected', functionName: 'generate-design', section: 'my-tools' },
  { id: 'video-gen', name: 'Video Generator', description: 'Create property videos with voice', icon: <Video className="w-5 h-5" />, category: 'Media', status: 'connected', functionName: 'elevenlabs-video-voice', section: 'my-tools' },
  { id: 'data-sync', name: 'Data Sync', description: 'Push CRM updates and exports automatically', icon: <Database className="w-5 h-5" />, category: 'Integration', status: 'connected', functionName: 'broker-daily-report', section: 'my-tools' },
  { id: 'admin', name: 'Listing Admin', description: 'Upload and publish new property listings', icon: <Upload className="w-5 h-5" />, category: 'Administration', status: 'connected', functionName: 'listing-admin-chat', section: 'my-tools' },
];

// Professional Tools - All AI tools from AIToolsProvider
const PROFESSIONAL_TOOLS: AITool[] = [
  // Communication
  { id: 'email-composer', name: 'Email Composer', description: 'Generate professional emails with brand-aligned tone', icon: <Mail className="w-5 h-5" />, category: 'Communication', status: 'connected', functionName: 'ai-email-composer', section: 'professional' },
  { id: 'whatsapp-composer', name: 'WhatsApp Manager', description: 'Draft and schedule WhatsApp messages', icon: <MessageSquare className="w-5 h-5" />, category: 'Communication', status: 'connected', functionName: 'ai-whatsapp-composer', section: 'professional' },
  { id: 'voice-concierge', name: 'Voice Concierge', description: 'Voice assistant for client calls', icon: <Mic className="w-5 h-5" />, category: 'Communication', status: 'connected', functionName: 'elevenlabs-conversation-token', section: 'professional' },
  { id: 'translation-hub', name: 'Translation Hub', description: 'Translate content to multiple languages', icon: <Globe className="w-5 h-5" />, category: 'Communication', status: 'connected', functionName: 'ai-translation-hub', section: 'professional' },
  { id: 'video-tour-script', name: 'Video Tour Script', description: 'Generate engaging property tour scripts', icon: <Video className="w-5 h-5" />, category: 'Communication', status: 'connected', functionName: 'ai-video-tour-script', section: 'professional' },
  { id: 'social-media', name: 'Social Media Generator', description: 'Generate social media posts for listings', icon: <Share2 className="w-5 h-5" />, category: 'Communication', status: 'connected', functionName: 'ai-social-media', section: 'professional' },
  { id: 'description-writer', name: 'Description Writer', description: 'Create compelling property descriptions', icon: <PenTool className="w-5 h-5" />, category: 'Communication', status: 'connected', functionName: 'ai-description-writer', section: 'professional' },
  // Lead & Sales
  { id: 'lead-qualifier', name: 'Lead Qualification', description: 'Analyze and score leads automatically', icon: <UserCheck className="w-5 h-5" />, category: 'Lead & Sales', status: 'connected', functionName: 'ai-lead-qualification', section: 'professional' },
  { id: 'followup-scheduler', name: 'Follow-up Scheduler', description: 'Smart scheduling for lead follow-ups', icon: <Calendar className="w-5 h-5" />, category: 'Lead & Sales', status: 'connected', functionName: 'ai-followup-scheduler', section: 'professional' },
  { id: 'objection-handler', name: 'Objection Handler', description: 'Expert responses to buyer objections', icon: <MessageSquare className="w-5 h-5" />, category: 'Lead & Sales', status: 'connected', functionName: 'ai-objection-handler', section: 'professional' },
  { id: 'client-matcher', name: 'Client Matcher', description: 'Match clients with ideal properties', icon: <Users className="w-5 h-5" />, category: 'Lead & Sales', status: 'connected', functionName: 'ai-client-matcher', section: 'professional' },
  // Property Intelligence
  { id: 'virtual-staging', name: 'Virtual Staging', description: 'Transform empty rooms with AI-generated décor', icon: <Palette className="w-5 h-5" />, category: 'Property Intelligence', status: 'connected', functionName: 'ai-virtual-staging', section: 'professional' },
  { id: 'price-predictor', name: 'Price Predictor', description: 'Predict property prices based on market data', icon: <TrendingUp className="w-5 h-5" />, category: 'Property Intelligence', status: 'connected', functionName: 'ai-price-predictor', section: 'professional' },
  { id: 'neighborhood-insights', name: 'Neighborhood Insights', description: 'Detailed analysis of neighborhoods and areas', icon: <MapPin className="w-5 h-5" />, category: 'Property Intelligence', status: 'connected', functionName: 'ai-neighborhood-insights', section: 'professional' },
  { id: 'property-analyzer', name: 'Property Analyzer', description: 'Deep property features and investment analysis', icon: <Building className="w-5 h-5" />, category: 'Property Intelligence', status: 'connected', functionName: 'ai-property-analyzer', section: 'professional' },
  // Analytics
  { id: 'market-analysis', name: 'Market Report', description: 'Comprehensive market analysis reports', icon: <BarChart3 className="w-5 h-5" />, category: 'Analytics', status: 'connected', functionName: 'ai-market-report', section: 'professional' },
  { id: 'competitor-analysis', name: 'Competitor Analysis', description: 'Analyze competitor properties and pricing', icon: <Users className="w-5 h-5" />, category: 'Analytics', status: 'connected', functionName: 'ai-competitor-analysis', section: 'professional' },
  { id: 'roi-calculator', name: 'ROI Calculator', description: 'Calculate investment returns and projections', icon: <Calculator className="w-5 h-5" />, category: 'Analytics', status: 'connected', functionName: 'ai-roi-calculator', section: 'professional' },
  { id: 'investment-report', name: 'Investment Report', description: 'Detailed investment opportunity reports', icon: <TrendingUp className="w-5 h-5" />, category: 'Analytics', status: 'connected', functionName: 'ai-investment-report', section: 'professional' },
  // Documents
  { id: 'contract-reviewer', name: 'Contract Reviewer', description: 'Review contracts and highlight key terms', icon: <FileSearch className="w-5 h-5" />, category: 'Documents', status: 'connected', functionName: 'ai-contract-reviewer', section: 'professional' },
  { id: 'document-generator', name: 'Document Generator', description: 'Generate professional real estate documents', icon: <FilePlus className="w-5 h-5" />, category: 'Documents', status: 'connected', functionName: 'ai-document-generator', section: 'professional' },
  { id: 'document-ocr', name: 'Document Scanner', description: 'OCR for business cards and documents', icon: <FileText className="w-5 h-5" />, category: 'Documents', status: 'connected', functionName: 'business-card-ocr', section: 'professional' },
  { id: 'meeting-summarizer', name: 'Meeting Summarizer', description: 'Summarize meetings and extract action items', icon: <FileText className="w-5 h-5" />, category: 'Documents', status: 'connected', functionName: 'ai-meeting-summarizer', section: 'professional' },
  // Productivity
  { id: 'calendar-ai', name: 'Smart Calendar', description: 'Smart scheduling and meeting management', icon: <Calendar className="w-5 h-5" />, category: 'Productivity', status: 'connected', functionName: 'ai-followup-scheduler', section: 'professional' },
];

const ALL_TOOLS = [...MY_TOOLS, ...PROFESSIONAL_TOOLS];

const ALL_CATEGORIES = ['All', 'Communication', 'Lead & Sales', 'Property Intelligence', 'Analytics', 'Documents', 'Productivity', 'Media', 'Development', 'Integration', 'Administration'];

const statusConfig = {
  connected: { label: 'Connected', color: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle className="w-3 h-3" /> },
  available: { label: 'Available', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Clock className="w-3 h-3" /> },
  coming_soon: { label: 'Coming Soon', color: 'bg-zinc-100 text-zinc-500 border-zinc-200', icon: <AlertCircle className="w-3 h-3" /> },
};

const FoundersAIToolsPanel: React.FC = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [executingTool, setExecutingTool] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState<ToolUsageStats>({ totalExecutions: 0, avgSuccessRate: 0 });

  useEffect(() => {
    const fetchUsageStats = async () => {
      try {
        const { data, error } = await supabase
          .from('ai_usage_logs')
          .select('success')
          .order('created_at', { ascending: false })
          .limit(100);
        if (!error && data) {
          const total = data.length;
          const successful = data.filter(d => d.success).length;
          setUsageStats({ totalExecutions: total, avgSuccessRate: total > 0 ? Math.round((successful / total) * 100) : 0 });
        }
      } catch (err) {
        console.error('Failed to fetch usage stats:', err);
      }
    };
    fetchUsageStats();
  }, []);

  const logToolUsage = async (toolId: string, functionName: string, success: boolean, responseTimeMs: number) => {
    try {
      await supabase.from('ai_usage_logs').insert({
        function_name: functionName,
        model: 'tool-' + toolId,
        success,
        response_time_ms: responseTimeMs,
        user_id: user?.id || null,
      });
    } catch (err) {
      console.error('Failed to log tool usage:', err);
    }
  };

  const handleUseTool = async (tool: AITool) => {
    if (tool.status === 'coming_soon') { toast.info('This tool is coming soon!'); return; }
    setExecutingTool(tool.id);
    const startTime = Date.now();
    const toastId = toast.loading(`Launching ${tool.name}...`);

    try {
      if (tool.functionName) {
        const { data, error } = await supabase.functions.invoke(tool.functionName, {
          body: { action: 'initialize', toolId: tool.id, userId: user?.id },
        });
        const responseTime = Date.now() - startTime;
        if (error) throw error;
        await logToolUsage(tool.id, tool.functionName, true, responseTime);
        setUsageStats(prev => ({ totalExecutions: prev.totalExecutions + 1, avgSuccessRate: prev.avgSuccessRate }));
        toast.dismiss(toastId);
        toast.success(`${tool.name} is ready to use`, { description: data?.message || 'Tool initialized successfully' });
      } else {
        await new Promise(resolve => setTimeout(resolve, 800));
        toast.dismiss(toastId);
        toast.success(`${tool.name} is ready to use`);
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      if (tool.functionName) await logToolUsage(tool.id, tool.functionName, false, responseTime);
      toast.dismiss(toastId);
      if (error?.message?.includes('429')) toast.error('Rate limit exceeded. Please try again in a moment.');
      else if (error?.message?.includes('402')) toast.error('Credits exhausted. Please add credits to continue.');
      else toast.error(`Failed to launch ${tool.name}`, { description: error?.message || 'Please try again' });
    } finally {
      setExecutingTool(null);
    }
  };

  const connectedCount = ALL_TOOLS.filter(t => t.status === 'connected').length;

  const filteredProfessionalTools = PROFESSIONAL_TOOLS.filter(tool =>
    selectedCategory === 'All' || tool.category === selectedCategory
  );

  // Group professional tools by category
  const groupedTools: Record<string, AITool[]> = {};
  filteredProfessionalTools.forEach(tool => {
    if (!groupedTools[tool.category]) groupedTools[tool.category] = [];
    groupedTools[tool.category].push(tool);
  });

  const renderToolCard = (tool: AITool, index: number) => (
    <motion.div key={tool.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
      <Card className={`bg-white border-2 border-[#C9A84C]/20 hover:border-[#C9A84C]/40 hover:shadow-[0_0_20px_rgba(200,167,102,0.2)] transition-all h-full ${executingTool === tool.id ? 'ring-2 ring-[#C9A84C]/50' : ''}`}>
        <CardContent className="p-4 flex flex-col h-full">
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2.5 rounded-lg ${tool.status === 'connected' ? 'bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/30' : 'bg-zinc-100 text-zinc-500 border border-zinc-200'}`}>
              {tool.icon}
            </div>
            <Badge className={`${statusConfig[tool.status].color} border`}>
              {statusConfig[tool.status].icon}
              <span className="ml-1">{statusConfig[tool.status].label}</span>
            </Badge>
          </div>
          <h4 className="text-black font-semibold mb-1">{tool.name}</h4>
          <p className="text-sm text-zinc-500 flex-1">{tool.description}</p>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#C9A84C]/10">
            <span className="text-xs text-zinc-400">{tool.category}</span>
            <Button
              size="sm"
              onClick={() => handleUseTool(tool)}
              disabled={tool.status === 'coming_soon' || executingTool === tool.id}
              className={tool.status === 'connected'
                ? 'bg-white text-[#C9A84C] border-2 border-[#C9A84C]/30 hover:bg-transparent hover:border-[#C9A84C]'
                : 'bg-zinc-100 text-zinc-400 border border-zinc-200'
              }
            >
              {executingTool === tool.id ? (
                <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />Running...</>
              ) : tool.status === 'connected' ? (
                <><Play className="w-3 h-3 mr-1" />Use</>
              ) : 'Soon'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-2 border-[#C9A84C]/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/30">
                <Wrench className="w-6 h-6 text-[#C9A84C]" />
              </div>
              <div>
                <p className="text-3xl font-bold text-[#C9A84C]">{connectedCount}</p>
                <p className="text-xs text-zinc-500">Tools Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-green-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">{usageStats.totalExecutions}</p>
                <p className="text-xs text-zinc-500">Total Executions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-blue-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">{usageStats.totalExecutions > 0 ? `${usageStats.avgSuccessRate}%` : '--'}</p>
                <p className="text-xs text-zinc-500">Avg Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Tools Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[#C9A84C]" />
          <h3 className="text-lg font-semibold text-black">My Tools</h3>
          <Badge className="bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/30">{MY_TOOLS.length} tools</Badge>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {MY_TOOLS.map(tool => (
            <Button
              key={tool.id}
              onClick={() => handleUseTool(tool)}
              disabled={executingTool === tool.id}
              className={`flex items-center gap-2 transition-all ${
                executingTool === tool.id 
                  ? 'bg-[#C9A84C]/20 border-2 border-[#C9A84C] text-[#C9A84C]' 
                  : 'bg-white text-[#C9A84C] border-2 border-[#C9A84C]/30 hover:bg-transparent hover:border-[#C9A84C]'
              }`}
            >
              {executingTool === tool.id ? (
                <div className="w-4 h-4 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
              ) : tool.icon}
              <span className="font-medium">{tool.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Professional Tools Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="w-5 h-5 text-[#C9A84C]" />
          <h3 className="text-lg font-semibold text-black">Professional Tools</h3>
          <Badge className="bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/30">{PROFESSIONAL_TOOLS.length} tools</Badge>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4">
          {ALL_CATEGORIES.map((cat) => (
            <Button
              key={cat}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={selectedCategory === cat 
                ? 'bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-white border-2 border-[#C9A84C] whitespace-nowrap hover:opacity-90' 
                : 'bg-white text-[#C9A84C] border-2 border-[#C9A84C]/30 hover:bg-transparent hover:border-[#C9A84C]/50 whitespace-nowrap'
              }
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Grouped Tools */}
        <ScrollArea className="h-[500px]">
          <div className="space-y-6">
            {Object.entries(groupedTools).map(([category, tools]) => (
              <div key={category}>
                <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">{category}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tools.map((tool, index) => renderToolCard(tool, index))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default FoundersAIToolsPanel;
