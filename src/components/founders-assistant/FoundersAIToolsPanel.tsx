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
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { AI_TOOLS_CONFIG } from '@/components/ai-tools/AIToolsProvider';

interface AITool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  status: 'connected' | 'available' | 'coming_soon';
  lastUsed?: string;
}

const toolIcons: Record<string, React.ReactNode> = {
  brain: <Brain className="w-5 h-5" />,
  mail: <Mail className="w-5 h-5" />,
  message: <MessageSquare className="w-5 h-5" />,
  file: <FileText className="w-5 h-5" />,
  chart: <BarChart3 className="w-5 h-5" />,
  video: <Video className="w-5 h-5" />,
  mic: <Mic className="w-5 h-5" />,
  image: <Image className="w-5 h-5" />,
  globe: <Globe className="w-5 h-5" />,
  calendar: <Calendar className="w-5 h-5" />,
  phone: <Phone className="w-5 h-5" />,
  database: <Database className="w-5 h-5" />,
  upload: <Upload className="w-5 h-5" />,
};

const AI_TOOLS: AITool[] = [
  {
    id: 'lovable-ai',
    name: 'Lovable AI',
    description: 'Connect with the developer system to execute updates and changes',
    icon: <Sparkles className="w-5 h-5" />,
    category: 'Development',
    status: 'connected',
    lastUsed: 'Just now',
  },
  {
    id: 'email-composer',
    name: 'AI Email Composer',
    description: 'Generate professional emails with brand-aligned tone',
    icon: <Mail className="w-5 h-5" />,
    category: 'Communication',
    status: 'connected',
    lastUsed: '2 hours ago',
  },
  {
    id: 'whatsapp-composer',
    name: 'WhatsApp AI',
    description: 'Draft and schedule WhatsApp messages',
    icon: <MessageSquare className="w-5 h-5" />,
    category: 'Communication',
    status: 'connected',
    lastUsed: '1 hour ago',
  },
  {
    id: 'lead-qualifier',
    name: 'Lead Qualification AI',
    description: 'Analyze and score leads automatically',
    icon: <Brain className="w-5 h-5" />,
    category: 'CRM',
    status: 'connected',
    lastUsed: '30 min ago',
  },
  {
    id: 'market-analysis',
    name: 'Market Analysis AI',
    description: 'Real-time market insights and predictions',
    icon: <BarChart3 className="w-5 h-5" />,
    category: 'Analytics',
    status: 'connected',
  },
  {
    id: 'video-builder',
    name: 'AI Video Builder',
    description: 'Create property videos with AI voiceover',
    icon: <Video className="w-5 h-5" />,
    category: 'Media',
    status: 'connected',
  },
  {
    id: 'voice-concierge',
    name: 'Voice Concierge',
    description: 'AI voice assistant for client calls',
    icon: <Mic className="w-5 h-5" />,
    category: 'Communication',
    status: 'connected',
  },
  {
    id: 'image-generator',
    name: 'AI Image Generator',
    description: 'Create property visuals and marketing assets',
    icon: <Image className="w-5 h-5" />,
    category: 'Media',
    status: 'available',
  },
  {
    id: 'translation-hub',
    name: 'Translation Hub',
    description: 'Translate content to multiple languages',
    icon: <Globe className="w-5 h-5" />,
    category: 'Content',
    status: 'connected',
  },
  {
    id: 'calendar-ai',
    name: 'Calendar AI',
    description: 'Smart scheduling and meeting management',
    icon: <Calendar className="w-5 h-5" />,
    category: 'Productivity',
    status: 'connected',
  },
  {
    id: 'document-ocr',
    name: 'Document Scanner',
    description: 'OCR for business cards and documents',
    icon: <FileText className="w-5 h-5" />,
    category: 'Documents',
    status: 'connected',
  },
  {
    id: 'data-sync',
    name: 'Data Sync',
    description: 'Push CRM updates and exports',
    icon: <Database className="w-5 h-5" />,
    category: 'Integration',
    status: 'connected',
  },
];

const categories = ['All', 'Communication', 'CRM', 'Analytics', 'Media', 'Productivity', 'Development'];

const statusConfig = {
  connected: { label: 'Connected', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: <CheckCircle className="w-3 h-3" /> },
  available: { label: 'Available', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: <Clock className="w-3 h-3" /> },
  coming_soon: { label: 'Coming Soon', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: <AlertCircle className="w-3 h-3" /> },
};

const FoundersAIToolsPanel: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredTools = AI_TOOLS.filter(tool => 
    selectedCategory === 'All' || tool.category === selectedCategory
  );

  const handleUseTool = (tool: AITool) => {
    if (tool.status === 'coming_soon') {
      toast.info('This tool is coming soon!');
      return;
    }
    toast.success(`Launching ${tool.name}...`);
  };

  const connectedCount = AI_TOOLS.filter(t => t.status === 'connected').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <Card className="bg-[#0E0E0E] border-gold/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">AI Tools Integration</h3>
              <p className="text-sm text-gray-400">Manage all connected AI tools and services</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gold">{connectedCount}</p>
              <p className="text-xs text-gray-400">Tools Connected</p>
            </div>
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
              <Card className="bg-[#0E0E0E] border-gold/20 hover:border-gold/40 transition-all h-full">
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-gold/10 text-gold">
                      {tool.icon}
                    </div>
                    <Badge className={statusConfig[tool.status].color}>
                      {statusConfig[tool.status].icon}
                      <span className="ml-1">{statusConfig[tool.status].label}</span>
                    </Badge>
                  </div>

                  <h4 className="text-white font-semibold mb-1">{tool.name}</h4>
                  <p className="text-sm text-gray-400 flex-1">{tool.description}</p>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gold/10">
                    <span className="text-xs text-gray-500">
                      {tool.lastUsed ? `Used ${tool.lastUsed}` : tool.category}
                    </span>
                    <Button
                      size="sm"
                      variant={tool.status === 'connected' ? 'default' : 'outline'}
                      onClick={() => handleUseTool(tool)}
                      disabled={tool.status === 'coming_soon'}
                      className={tool.status === 'connected' 
                        ? 'bg-gold hover:bg-gold/90 text-black' 
                        : 'border-gold/30 text-gold hover:bg-gold/10'
                      }
                    >
                      {tool.status === 'connected' ? 'Use' : tool.status === 'available' ? 'Connect' : 'Soon'}
                      {tool.status !== 'coming_soon' && <ExternalLink className="w-3 h-3 ml-1" />}
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
