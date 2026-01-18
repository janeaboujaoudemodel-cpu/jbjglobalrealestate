import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wrench,
  Brain,
  Mail,
  MessageSquare,
  FileText,
  BarChart3,
  Video,
  Mic,
  Image,
  Globe,
  Calendar,
  Database,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
  Play,
  TrendingUp,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
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
  functionName?: string; // Edge function to invoke
  lastUsed?: string;
  usageCount?: number;
  successRate?: number;
}

interface ToolUsageStats {
  totalExecutions: number;
  avgSuccessRate: number;
}

// Tool to function mapping
const TOOL_FUNCTION_MAP: Record<string, string> = {
  'lovable-ai': 'ai-chat',
  'gemini-pro': 'ai-chat',
  'image-gen': 'generate-design',
  'video-gen': 'elevenlabs-video-voice',
  'data-sync': 'broker-daily-report',
  'admin': 'listing-admin-chat',
  'email-composer': 'ai-email-composer',
  'whatsapp-composer': 'ai-whatsapp-composer',
  'lead-qualifier': 'ai-lead-qualification',
  'market-analysis': 'ai-market-report',
  'voice-concierge': 'elevenlabs-conversation-token',
  'translation-hub': 'ai-translation-hub',
  'calendar-ai': 'ai-followup-scheduler',
  'document-ocr': 'business-card-ocr',
};

// Real tools with actual function mappings
const AI_TOOLS: AITool[] = [
  {
    id: 'lovable-ai',
    name: 'Lovable Developer',
    description: 'Connect with the developer system to execute updates and changes',
    icon: <Sparkles className="w-5 h-5" />,
    category: 'Development',
    status: 'connected',
    functionName: 'ai-chat',
    usageCount: 0,
    successRate: 0,
  },
  {
    id: 'gemini-pro',
    name: 'Google Gemini Pro',
    description: 'Advanced reasoning and content generation',
    icon: <Brain className="w-5 h-5" />,
    category: 'Content',
    status: 'connected',
    functionName: 'ai-chat',
    usageCount: 0,
    successRate: 0,
  },
  {
    id: 'image-gen',
    name: 'Image Generator',
    description: 'Create property visuals and marketing assets',
    icon: <Image className="w-5 h-5" />,
    category: 'Media',
    status: 'connected',
    functionName: 'generate-design',
    usageCount: 0,
    successRate: 0,
  },
  {
    id: 'video-gen',
    name: 'Video Generator',
    description: 'Create AI-powered property videos',
    icon: <Video className="w-5 h-5" />,
    category: 'Media',
    status: 'connected',
    functionName: 'elevenlabs-video-voice',
    usageCount: 0,
    successRate: 0,
  },
  {
    id: 'data-sync',
    name: 'Data Sync',
    description: 'Push CRM updates and exports automatically',
    icon: <Database className="w-5 h-5" />,
    category: 'Integration',
    status: 'connected',
    functionName: 'broker-daily-report',
    usageCount: 0,
    successRate: 0,
  },
  {
    id: 'admin',
    name: 'Listing Admin',
    description: 'Upload and publish new property listings',
    icon: <Upload className="w-5 h-5" />,
    category: 'Administration',
    status: 'connected',
    functionName: 'listing-admin-chat',
    usageCount: 0,
    successRate: 0,
  },
  {
    id: 'email-composer',
    name: 'Email Composer',
    description: 'Generate professional emails with brand-aligned tone',
    icon: <Mail className="w-5 h-5" />,
    category: 'Communication',
    status: 'connected',
    functionName: 'ai-email-composer',
    usageCount: 0,
    successRate: 0,
  },
  {
    id: 'whatsapp-composer',
    name: 'WhatsApp Manager',
    description: 'Draft and schedule WhatsApp messages',
    icon: <MessageSquare className="w-5 h-5" />,
    category: 'Communication',
    status: 'connected',
    functionName: 'ai-whatsapp-composer',
    usageCount: 0,
    successRate: 0,
  },
  {
    id: 'lead-qualifier',
    name: 'Lead Qualification',
    description: 'Analyze and score leads automatically',
    icon: <TrendingUp className="w-5 h-5" />,
    category: 'CRM',
    status: 'connected',
    functionName: 'ai-lead-qualification',
    usageCount: 0,
    successRate: 0,
  },
  {
    id: 'market-analysis',
    name: 'Market Analysis',
    description: 'Real-time market insights and predictions',
    icon: <BarChart3 className="w-5 h-5" />,
    category: 'Analytics',
    status: 'connected',
    functionName: 'ai-market-report',
    usageCount: 0,
    successRate: 0,
  },
  {
    id: 'voice-concierge',
    name: 'Voice Concierge',
    description: 'Voice assistant for client calls',
    icon: <Mic className="w-5 h-5" />,
    category: 'Communication',
    status: 'connected',
    functionName: 'elevenlabs-conversation-token',
  },
  {
    id: 'translation-hub',
    name: 'Translation Hub',
    description: 'Translate content to multiple languages',
    icon: <Globe className="w-5 h-5" />,
    category: 'Content',
    status: 'connected',
    functionName: 'ai-translation-hub',
    usageCount: 0,
    successRate: 0,
  },
  {
    id: 'calendar-ai',
    name: 'Smart Calendar',
    description: 'Smart scheduling and meeting management',
    icon: <Calendar className="w-5 h-5" />,
    category: 'Productivity',
    status: 'connected',
    functionName: 'ai-followup-scheduler',
    usageCount: 0,
    successRate: 0,
  },
  {
    id: 'document-ocr',
    name: 'Document Scanner',
    description: 'OCR for business cards and documents',
    icon: <FileText className="w-5 h-5" />,
    category: 'Documents',
    status: 'connected',
    functionName: 'business-card-ocr',
    usageCount: 0,
    successRate: 0,
  },
];

const categories = ['All', 'Communication', 'CRM', 'Analytics', 'Media', 'Productivity', 'Development', 'Content'];

const statusConfig = {
  connected: { label: 'Connected', color: 'bg-green-500/20 text-green-600 border-green-500/30', icon: <CheckCircle className="w-3 h-3" /> },
  available: { label: 'Available', color: 'bg-blue-500/20 text-blue-600 border-blue-500/30', icon: <Clock className="w-3 h-3" /> },
  coming_soon: { label: 'Coming Soon', color: 'bg-gray-500/20 text-gray-600 border-gray-500/30', icon: <AlertCircle className="w-3 h-3" /> },
};

const FoundersAIToolsPanel: React.FC = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [executingTool, setExecutingTool] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState<ToolUsageStats>({ totalExecutions: 0, avgSuccessRate: 0 });

  // Fetch usage stats from database
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
          const rate = total > 0 ? Math.round((successful / total) * 100) : 0;
          setUsageStats({ totalExecutions: total, avgSuccessRate: rate });
        }
      } catch (err) {
        console.error('Failed to fetch usage stats:', err);
      }
    };

    fetchUsageStats();
  }, []);

  const filteredTools = AI_TOOLS.filter(tool => 
    selectedCategory === 'All' || tool.category === selectedCategory
  );

  // Log tool usage to database
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
    if (tool.status === 'coming_soon') {
      toast.info('This tool is coming soon!');
      return;
    }

    setExecutingTool(tool.id);
    const startTime = Date.now();
    const toastId = toast.loading(`Launching ${tool.name}...`);

    try {
      // Actually invoke the backend function
      if (tool.functionName) {
        const { data, error } = await supabase.functions.invoke(tool.functionName, {
          body: {
            action: 'initialize',
            toolId: tool.id,
            userId: user?.id,
          },
        });

        const responseTime = Date.now() - startTime;

        if (error) {
          throw error;
        }

        // Log successful usage
        await logToolUsage(tool.id, tool.functionName, true, responseTime);
        
        // Update local stats
        setUsageStats(prev => ({
          totalExecutions: prev.totalExecutions + 1,
          avgSuccessRate: prev.avgSuccessRate,
        }));

        toast.dismiss(toastId);
        toast.success(`${tool.name} is ready to use`, {
          description: data?.message || 'Tool initialized successfully'
        });
      } else {
        // Tool without function - just show as ready
        await new Promise(resolve => setTimeout(resolve, 800));
        toast.dismiss(toastId);
        toast.success(`${tool.name} is ready to use`);
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      // Log failed usage
      if (tool.functionName) {
        await logToolUsage(tool.id, tool.functionName, false, responseTime);
      }

      toast.dismiss(toastId);
      
      // Handle specific errors
      if (error?.message?.includes('429')) {
        toast.error('Rate limit exceeded. Please try again in a moment.');
      } else if (error?.message?.includes('402')) {
        toast.error('AI credits exhausted. Please add credits to continue.');
      } else {
        toast.error(`Failed to launch ${tool.name}`, {
          description: error?.message || 'Please try again'
        });
      }
    } finally {
      setExecutingTool(null);
    }
  };

  const connectedCount = AI_TOOLS.filter(t => t.status === 'connected').length;

  return (
    <div className="space-y-6">
      {/* Stats Overview - Real stats (starting at zero) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-2 border-gold/30 shadow-[0_0_15px_rgba(200,167,102,0.15)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-gold/10 border border-gold/30">
                <Wrench className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gold">{connectedCount}</p>
                <p className="text-xs text-zinc-500">Tools Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">{usageStats.totalExecutions}</p>
                <p className="text-xs text-zinc-500">Total Executions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">
                  {usageStats.totalExecutions > 0 ? `${usageStats.avgSuccessRate}%` : '--'}
                </p>
                <p className="text-xs text-zinc-500">Avg Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Direct Command Tools */}
      <Card className="bg-white border-2 border-gold/30 shadow-[0_0_15px_rgba(200,167,102,0.15)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-black text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            Quick Access Tools
          </CardTitle>
          <p className="text-sm text-zinc-500">Frequently used integrations</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {AI_TOOLS.filter(t => ['lovable-ai', 'gemini-pro', 'image-gen', 'video-gen', 'data-sync'].includes(t.id)).map(tool => (
              <Button
                key={tool.id}
                onClick={() => handleUseTool(tool)}
                disabled={executingTool === tool.id}
                className={`flex items-center gap-2 transition-all ${
                  executingTool === tool.id 
                    ? 'bg-gold/20 border-2 border-gold text-gold' 
                    : 'bg-white text-gold border-2 border-gold/30 hover:bg-transparent hover:border-gold shadow-[0_0_10px_rgba(200,167,102,0.15)]'
                }`}
              >
                {executingTool === tool.id ? (
                  <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                ) : (
                  tool.icon
                )}
                <span className="font-medium">{tool.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className={selectedCategory === cat 
              ? 'bg-black text-white border-2 border-gold/50 shadow-[0_0_15px_rgba(200,167,102,0.3)] whitespace-nowrap hover:bg-zinc-900' 
              : 'bg-white text-gold border-2 border-gold/30 hover:bg-transparent hover:border-gold/50 whitespace-nowrap'
            }
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Tools Grid */}
      <ScrollArea className="h-[400px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`bg-white border-2 border-gold/20 hover:border-gold/40 hover:shadow-[0_0_20px_rgba(200,167,102,0.2)] transition-all h-full ${
                executingTool === tool.id ? 'ring-2 ring-gold/50' : ''
              }`}>
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2.5 rounded-lg ${tool.status === 'connected' ? 'bg-gold/10 text-gold border border-gold/30' : 'bg-zinc-100 text-zinc-500 border border-zinc-200'}`}>
                      {tool.icon}
                    </div>
                    <Badge className={`${statusConfig[tool.status].color} border`}>
                      {statusConfig[tool.status].icon}
                      <span className="ml-1">{statusConfig[tool.status].label}</span>
                    </Badge>
                  </div>

                  <h4 className="text-black font-semibold mb-1">{tool.name}</h4>
                  <p className="text-sm text-zinc-500 flex-1">{tool.description}</p>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gold/10">
                    <span className="text-xs text-zinc-400">
                      {tool.category}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleUseTool(tool)}
                      disabled={tool.status === 'coming_soon' || executingTool === tool.id}
                      className={tool.status === 'connected' 
                        ? 'bg-white text-gold border-2 border-gold/30 hover:bg-transparent hover:border-gold shadow-[0_0_10px_rgba(200,167,102,0.15)]' 
                        : tool.status === 'available'
                        ? 'bg-white text-blue-600 border-2 border-blue-500/30 hover:border-blue-500'
                        : 'bg-zinc-100 text-zinc-400 border border-zinc-200'
                      }
                    >
                      {executingTool === tool.id ? (
                        <>
                          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                          Running...
                        </>
                      ) : tool.status === 'connected' ? (
                        <>
                          <Play className="w-3 h-3 mr-1" />
                          Use
                        </>
                      ) : tool.status === 'available' ? (
                        <>
                          <Settings className="w-3 h-3 mr-1" />
                          Connect
                        </>
                      ) : (
                        'Soon'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FoundersAIToolsPanel;
