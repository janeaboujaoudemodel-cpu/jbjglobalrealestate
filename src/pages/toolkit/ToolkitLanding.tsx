import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileImage, 
  Video, 
  Mic, 
  FileText, 
  Sparkles, 
  Languages,
  Wand2,
  Image,
  Scissors,
  Play,
  ArrowRight,
  CheckCircle2,
  Clock,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  tags: string[];
  isNew?: boolean;
  isFlagship?: boolean;
}

const ToolCard: React.FC<ToolCardProps> = ({ 
  title, 
  description, 
  icon, 
  href, 
  tags, 
  isNew,
  isFlagship 
}) => (
  <Link 
    to={href}
    className={`group relative block rounded-xl border-2 transition-all duration-300 hover:-translate-y-1 ${
      isFlagship 
        ? 'border-gold bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 shadow-[0_0_30px_rgba(200,167,102,0.15)]' 
        : 'border-slate-700/50 bg-slate-900/50 hover:border-gold/50'
    }`}
  >
    {isNew && (
      <span className="absolute -top-2 -right-2 bg-gold text-black text-xs font-bold px-2 py-0.5 rounded-full">
        NEW
      </span>
    )}
    {isFlagship && (
      <span className="absolute -top-2 -right-2 bg-gradient-to-r from-gold to-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
        <Sparkles className="h-3 w-3" />
        FLAGSHIP
      </span>
    )}
    
    <div className="p-6">
      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 ${
        isFlagship 
          ? 'bg-gold/20 text-gold' 
          : 'bg-slate-800 text-gold group-hover:bg-gold/20'
      } transition-colors`}>
        {icon}
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-gold transition-colors">
        {title}
      </h3>
      
      <p className="text-slate-400 text-sm mb-4 line-clamp-2">
        {description}
      </p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag, i) => (
          <span 
            key={i}
            className="text-xs px-2 py-1 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700"
          >
            {tag}
          </span>
        ))}
      </div>
      
      <div className="flex items-center text-gold text-sm font-medium group-hover:gap-2 transition-all">
        Open Tool
        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  </Link>
);

const tools: ToolCardProps[] = [
  {
    title: 'JBJ AI Video Studio™',
    description: 'Professional CapCut-style video editor with multi-track timeline, AI captions, voiceover, effects, and smart reframing.',
    icon: <Play className="h-7 w-7" />,
    href: '/toolkit/ai-video-studio',
    tags: ['Video', 'AI', 'Captions', 'Effects'],
    isFlagship: true,
  },
  {
    title: 'Video Resize + Smart Reframe',
    description: 'Resize videos for any social platform with AI-powered per-shot subject tracking and smart cropping.',
    icon: <Video className="h-7 w-7" />,
    href: '/toolkit/video-resize-pack',
    tags: ['Video', 'Resize', 'AI Reframe'],
  },
  {
    title: 'Voice Studio',
    description: 'AI voice generation, text-to-speech with multiple voices, accents, and languages.',
    icon: <Mic className="h-7 w-7" />,
    href: '/toolkit/voice-studio',
    tags: ['Audio', 'TTS', 'AI Voice'],
  },
  {
    title: 'Photo → PDF Generator',
    description: 'Convert multiple photos to a professional PDF with custom layouts, page sizes, and title pages.',
    icon: <FileText className="h-7 w-7" />,
    href: '/toolkit/pdf-from-photos',
    tags: ['PDF', 'Photos', 'Documents'],
  },
  {
    title: 'Image Resizer + Social Sizes',
    description: 'Resize images for Instagram, Facebook, LinkedIn, and more with preset dimensions and batch export.',
    icon: <FileImage className="h-7 w-7" />,
    href: '/toolkit/image-resize',
    tags: ['Images', 'Social Media', 'Batch'],
  },
  {
    title: 'Captions & Translation',
    description: 'Auto-transcribe video audio and translate captions to 100+ languages with RTL support.',
    icon: <Languages className="h-7 w-7" />,
    href: '/toolkit/captions-translate',
    tags: ['Captions', 'Translate', 'Subtitles'],
    isNew: true,
  },
  {
    title: 'AI Background Remover',
    description: 'Remove or replace backgrounds from photos instantly using AI. Perfect for property listings.',
    icon: <Wand2 className="h-7 w-7" />,
    href: '/toolkit/background-ai',
    tags: ['AI', 'Background', 'Photos'],
    isNew: true,
  },
  {
    title: 'Beauty Filters',
    description: 'Apply professional beauty enhancements and filters to your photos for listings and marketing.',
    icon: <Sparkles className="h-7 w-7" />,
    href: '/toolkit/beauty-filters',
    tags: ['Filters', 'Enhancement', 'Photos'],
    isNew: true,
  },
];

export default function ToolkitLanding() {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/5 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 text-gold text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            100% Free Tools — No Login Required
          </div>
          
          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            JBJ Royal Tools Hub
            <span className="block text-gold mt-2">(Free)</span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Professional-grade tools for images, videos, and documents. 
            Designed for real estate professionals. No signup needed.
          </p>
          
          {/* Features */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="h-5 w-5 text-gold" />
              <span>No Login Required</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Shield className="h-5 w-5 text-gold" />
              <span>Privacy First</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="h-5 w-5 text-gold" />
              <span>Auto-Save Always</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Tools Grid */}
      <section className="px-4 pb-24">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              All Tools
            </h2>
            <p className="text-slate-400">
              Click any tool to get started instantly
            </p>
          </div>
          
          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool, index) => (
              <ToolCard key={index} {...tool} />
            ))}
          </div>
        </div>
      </section>
      
      {/* Fair Usage Notice */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 md:p-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-gold" />
              Fair Usage & Privacy
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-400">
              <div>
                <h4 className="text-white font-medium mb-2">Usage Limits</h4>
                <ul className="space-y-1">
                  <li>• Max 5 minutes per video job</li>
                  <li>• Max 3 jobs per hour</li>
                  <li>• Max 500MB storage per session</li>
                  <li>• Projects save automatically</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-2">Your Privacy</h4>
                <ul className="space-y-1">
                  <li>• Files processed securely</li>
                  <li>• Secure auto-save storage</li>
                  <li>• No data sold or shared</li>
                  <li>• GDPR compliant processing</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-700">
              <p className="text-xs text-slate-500">
                By using these tools, you confirm you own the content or have permission to edit it. 
                The platform operator is not responsible for misuse of these tools.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="px-4 pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Create?
          </h2>
          <p className="text-slate-400 mb-8">
            Start with our flagship AI Video Studio or explore individual tools
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/toolkit/ai-video-studio">
              <Button variant="primary" size="lg" className="gap-2">
                <Play className="h-5 w-5" />
                Open AI Video Studio
              </Button>
            </Link>
            <Link to="/">
              <Button variant="secondary" size="lg">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
