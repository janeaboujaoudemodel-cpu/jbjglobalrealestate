import React, { useState } from 'react';
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
  Phone,
  Database,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  Sparkles,
  Zap,
  Play,
  Settings,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface AITool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  status: 'connected' | 'available' | 'coming_soon';
  lastUsed?: string;
  usageCount?: number;
  successRate?: number;
}

const AI_TOOLS: AITool[] = [
  {
    id: 'lovable-ai',
    name: '@LovableAI',
    description: 'Connect with the developer system to execute updates and changes',
    icon: <Sparkles className="w-5 h-5" />,
    category: 'Development',
    status: 'connected',
    lastUsed: 'Just now',
    usageCount: 156,
    successRate: 98,
  },
  {
    id: 'gpt-tool',
    name: '@GPTTool',
    description: 'AI writing assistant for content generation and editing',
    icon: <Brain className="w-5 h-5" />,
    category: 'Content',
    status: 'connected',
    lastUsed: '30 min ago',
    usageCount: 89,
    successRate: 95,
  },
  {
    id: 'image-gen',
    name: '@ImageGen',
    description: 'Create property visuals and marketing assets',
    icon: <Image className="w-5 h-5" />,
    category: 'Media',
    status: 'connected',
    lastUsed: '2 hours ago',
    usageCount: 45,
    successRate: 92,
  },
  {
    id: 'data-sync',
    name: '@DataSync',
    description: 'Push CRM updates and exports automatically',
    icon: <Database className="w-5 h-5" />,
    category: 'Integration',
    status: 'connected',
    lastUsed: '1 hour ago',
    usageCount: 234,
    successRate: 99,
  },
  {
    id: 'admin',
    name: '@Admin',
    description: 'Upload and publish new property listings',
    icon: <Upload className="w-5 h-5" />,
    category: 'Administration',
    status: 'connected',
    lastUsed: '15 min ago',
    usageCount: 78,
    successRate: 97,
  },
  {
    id: 'email-composer',
    name: 'AI Email Composer',
    description: 'Generate professional emails with brand-aligned tone',
    icon: <Mail className="w-5 h-5" />,
    category: 'Communication',
    status: 'connected',
    lastUsed: '2 hours ago',
    usageCount: 312,
    successRate: 96,
  },
  {
    id: 'whatsapp-composer',
    name: 'WhatsApp AI',
    description: 'Draft and schedule WhatsApp messages',
    icon: <MessageSquare className="w-5 h-5" />,
    category: 'Communication',
    status: 'connected',
    lastUsed: '1 hour ago',
    usageCount: 189,
    successRate: 94,
  },
  {
    id: 'lead-qualifier',
    name: 'Lead Qualification AI',
    description: 'Analyze and score leads automatically',
    icon: <TrendingUp className="w-5 h-5" />,
    category: 'CRM',
    status: 'connected',
    lastUsed: '30 min ago',
    usageCount: 567,
    successRate: 91,
  },
  {
    id: 'market-analysis',
    name: 'Market Analysis AI',
    description: 'Real-time market insights and predictions',
    icon: <BarChart3 className="w-5 h-5" />,
    category: 'Analytics',
    status: 'connected',
    usageCount: 45,
    successRate: 88,
  },
  {
    id: 'video-builder',
    name: 'AI Video Builder',
    description: 'Create property videos with AI voiceover',
    icon: <Video className="w-5 h-5" />,
    category: 'Media',
    status: 'connected',
    usageCount: 23,
    successRate: 90,
  },
  {
    id: 'voice-concierge',
    name: 'Voice Concierge',
    description: 'AI voice assistant for client calls',
    icon: <Mic className="w-5 h-5" />,
    category: 'Communication',
    status: 'available',
  },
  {
    id: 'translation-hub',
    name: 'Translation Hub',
    description: 'Translate content to multiple languages',
    icon: <Globe className="w-5 h-5" />,
    category: 'Content',
    status: 'connected',
    usageCount: 67,
    successRate: 93,
  },
  {
    id: 'calendar-ai',
    name: 'Calendar AI',
    description: 'Smart scheduling and meeting management',
    icon: <Calendar className="w-5 h-5" />,
    category: 'Productivity',
    status: 'connected',
    usageCount: 145,
    successRate: 97,
  },
  {
    id: 'document-ocr',
    name: 'Document Scanner',
    description: 'OCR for business cards and documents',
    icon: <FileText className="w-5 h-5" />,
    category: 'Documents',
    status: 'connected',
    usageCount: 34,
    successRate: 89,
  },
];

const categories = ['All', 'Communication', 'CRM', 'Analytics', 'Media', 'Productivity', 'Development', 'Content'];

const statusConfig = {
  connected: { label: 'Connected', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: <CheckCircle className="w-3 h-3" /> },
  available: { label: 'Available', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: <Clock className="w-3 h-3" /> },
  coming_soon: { label: 'Coming Soon', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: <AlertCircle className="w-3 h-3" /> },
};

const FoundersAIToolsPanel: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [executingTool, setExecutingTool] = useState<string | null>(null);

  const filteredTools = AI_TOOLS.filter(tool => 
    selectedCategory === 'All' || tool.category === selectedCategory
  );

  const handleUseTool = async (tool: AITool) => {
    if (tool.status === 'coming_soon') {
      toast.info('This tool is coming soon!');
      return;
    }

    setExecutingTool(tool.id);
    toast.loading(`Launching ${tool.name}...`);

    // Simulate tool execution
    await new Promise(resolve => setTimeout(resolve, 1500));

    setExecutingTool(null);
    toast.dismiss();
    toast.success(`${tool.name} executed successfully!`, {
      description: '✅ Tool completed • Result ready'
    });
  };

  const connectedCount = AI_TOOLS.filter(t => t.status === 'connected').length;
  const totalUsage = AI_TOOLS.reduce((sum, t) => sum + (t.usageCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#0E0E0E] border-gold/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-gold/10">
                <Wrench className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gold">{connectedCount}</p>
                <p className="text-xs text-gray-400">Tools Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0E0E0E] border-gold/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Zap className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-400">{totalUsage.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Total Executions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0E0E0E] border-gold/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-400">94%</p>
                <p className="text-xs text-gray-400">Avg Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Direct Command Tools */}
      <Card className="bg-[#0E0E0E] border-gold/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            Direct AI Commands
          </CardTitle>
          <p className="text-sm text-gray-400">Use these in chat: @LovableAI, @GPTTool, @ImageGen, @DataSync, @Admin</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {AI_TOOLS.filter(t => t.id.startsWith('lovable') || t.id === 'gpt-tool' || t.id === 'image-gen' || t.id === 'data-sync' || t.id === 'admin').map(tool => (
              <button
                key={tool.id}
                onClick={() => handleUseTool(tool)}
                disabled={executingTool === tool.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  executingTool === tool.id 
                    ? 'bg-gold/20 border-gold text-gold' 
                    : 'bg-gold/5 border-gold/20 text-gold hover:bg-gold/10 hover:border-gold/40'
                }`}
              >
                {executingTool === tool.id ? (
                  <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                ) : (
                  tool.icon
                )}
                <span className="font-medium">{tool.name}</span>
                {tool.usageCount && (
                  <Badge className="bg-gold/20 text-gold border-0 text-[10px]">
                    {tool.usageCount}
                  </Badge>
                )}
              </button>
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
            variant={selectedCategory === cat ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(cat)}
            className={selectedCategory === cat 
              ? 'bg-gold text-black hover:bg-gold/90 whitespace-nowrap' 
              : 'border-gold/20 text-gray-400 hover:text-white whitespace-nowrap'
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
              <Card className={`bg-[#0E0E0E] border-gold/20 hover:border-gold/40 transition-all h-full ${
                executingTool === tool.id ? 'ring-2 ring-gold/50' : ''
              }`}>
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2.5 rounded-lg ${tool.status === 'connected' ? 'bg-gold/10 text-gold' : 'bg-gray-500/10 text-gray-400'}`}>
                      {tool.icon}
                    </div>
                    <Badge className={statusConfig[tool.status].color}>
                      {statusConfig[tool.status].icon}
                      <span className="ml-1">{statusConfig[tool.status].label}</span>
                    </Badge>
                  </div>

                  <h4 className="text-white font-semibold mb-1">{tool.name}</h4>
                  <p className="text-sm text-gray-400 flex-1">{tool.description}</p>

                  {/* Usage Stats */}
                  {tool.usageCount && tool.successRate && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Success Rate</span>
                        <span className="text-green-400">{tool.successRate}%</span>
                      </div>
                      <Progress value={tool.successRate} className="h-1.5 bg-gray-700" />
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gold/10">
                    <span className="text-xs text-gray-500">
                      {tool.lastUsed ? `Used ${tool.lastUsed}` : tool.category}
                    </span>
                    <Button
                      size="sm"
                      variant={tool.status === 'connected' ? 'default' : 'outline'}
                      onClick={() => handleUseTool(tool)}
                      disabled={tool.status === 'coming_soon' || executingTool === tool.id}
                      className={tool.status === 'connected' 
                        ? 'bg-gold hover:bg-gold/90 text-black' 
                        : 'border-gold/30 text-gold hover:bg-gold/10'
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
                        'Connect'
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
