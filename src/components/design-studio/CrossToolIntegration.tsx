import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Video, 
  Image, 
  FileText, 
  Presentation, 
  Mail,
  Share2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CrossToolIntegrationProps {
  currentTool: 'design-studio' | 'video-builder' | 'presentations' | 'web-developer' | 'copywriter' | 'content-editor' | 'social-media';
  projectId?: string;
  projectData?: any;
}

const CONNECTED_TOOLS = [
  {
    id: 'design-studio',
    name: 'Design Studio',
    description: 'Create graphics, social posts, and brand materials',
    icon: Image,
    path: '/jbj-design-studio',
    color: 'from-rose-500 to-pink-500',
    capabilities: ['Social Media', 'Brochures', 'Business Cards'],
  },
  {
    id: 'video-builder',
    name: 'Video Studio',
    description: 'Produce property tours and marketing videos',
    icon: Video,
    path: '/video-builder',
    color: 'from-purple-500 to-indigo-500',
    capabilities: ['Property Tours', 'Reels', 'Testimonials'],
  },
  {
    id: 'presentations',
    name: 'Presentations',
    description: 'Create pitch decks and proposals',
    icon: Presentation,
    path: '/presentations',
    color: 'from-blue-500 to-cyan-500',
    capabilities: ['Pitch Decks', 'Rate Cards', 'Proposals'],
  },
  {
    id: 'documents',
    name: 'Documents',
    description: 'Generate contracts and agreements',
    icon: FileText,
    path: '/documents',
    color: 'from-emerald-500 to-teal-500',
    capabilities: ['Contracts', 'Agreements', 'Forms'],
  },
  {
    id: 'email-client',
    name: 'Email Studio',
    description: 'Design email campaigns and signatures',
    icon: Mail,
    path: '/email-client',
    color: 'from-amber-500 to-orange-500',
    capabilities: ['Campaigns', 'Signatures', 'Newsletters'],
  },
  {
    id: 'web-developer',
    name: 'Web Developer',
    description: 'AI-powered website development and updates',
    icon: FileText,
    path: '/web-developer',
    color: 'from-zinc-600 to-zinc-800',
    capabilities: ['HTML/CSS', 'Components', 'Responsive'],
  },
  {
    id: 'copywriter',
    name: 'Copywriter',
    description: 'Create compelling copy and content',
    icon: FileText,
    path: '/copywriter',
    color: 'from-sky-500 to-blue-500',
    capabilities: ['Headlines', 'Descriptions', 'SEO'],
  },
  {
    id: 'content-editor',
    name: 'Content Editor',
    description: 'Edit and refine all content types',
    icon: FileText,
    path: '/content-editor',
    color: 'from-violet-500 to-purple-500',
    capabilities: ['Proofreading', 'Formatting', 'Publishing'],
  },
  {
    id: 'social-media',
    name: 'Social Media',
    description: 'Manage social media presence',
    icon: Share2,
    path: '/social-media',
    color: 'from-pink-500 to-rose-500',
    capabilities: ['Scheduling', 'Analytics', 'Engagement'],
  },
];

export const CrossToolIntegration: React.FC<CrossToolIntegrationProps> = ({
  currentTool,
  projectId,
  projectData,
}) => {
  const availableTools = CONNECTED_TOOLS.filter(tool => tool.id !== currentTool);

  const handleSendToTool = (toolId: string) => {
    // In a real implementation, this would pass project data to the target tool
    console.log(`Sending project ${projectId} to ${toolId}`, projectData);
  };

  return (
    <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-[#B89555]/20 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
          <Share2 className="w-5 h-5 text-[#1A1A1A]" />
          Send Project to Another Tool
        </CardTitle>
        <p className="text-sm text-[#1A1A1A]/70">
          Continue your project workflow with our connected creative tools
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {availableTools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={tool.path}>
                <div className="group flex items-center gap-4 p-4 rounded-xl bg-[#FDFBF7] border border-[#B89555]/30 hover:border-[#B89555]/50 hover:shadow-lg hover:shadow-gold/10 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <tool.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors">
                        {tool.name}
                      </h3>
                      <Sparkles className="w-4 h-4 text-[#1A1A1A] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm text-[#1A1A1A]/70 truncate">{tool.description}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tool.capabilities.slice(0, 2).map((cap) => (
                        <Badge 
                          key={cap} 
                          variant="outline" 
                          className="text-xs bg-[#F7F2EA] border-[#B89555]/30 text-[#1A1A1A]/70"
                        >
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <ArrowRight className="w-5 h-5 text-[#1A1A1A]/70 group-hover:text-[#1A1A1A] group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CrossToolIntegration;
