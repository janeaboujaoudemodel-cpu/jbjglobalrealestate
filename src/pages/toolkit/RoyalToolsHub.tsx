/**
 * JBJ Royal Tools Hub
 * Unified page for all tools - media, AI, and productivity
 * With video hero, dark cards, and category grouping
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, ArrowRight, CheckCircle2, Clock, Shield, Sparkles, Bot
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/SEOHead';
import {
  allTools,
  categoryLabels,
  type ToolDefinition,
  type ToolCategory,
} from '@/config/royalToolsRegistry';
import toolkitHeroVideo from "@/assets/videos/dubai-landmarks-hero.mp4";

interface ToolCardProps {
  tool: ToolDefinition;
}

// Category gradient colors for visual distinction
const getCategoryGradient = (category: ToolCategory): string => {
  const gradients: Record<ToolCategory, string> = {
    media: 'from-gold to-amber-600',
    creative: 'from-pink-500 to-rose-600',
    'ai-property': 'from-blue-500 to-cyan-600',
    'ai-sales': 'from-purple-500 to-violet-600',
    'ai-reports': 'from-emerald-500 to-green-600',
    'ai-communication': 'from-teal-500 to-cyan-600',
    'ai-content': 'from-lime-500 to-green-600',
    productivity: 'from-indigo-500 to-blue-600',
  };
  return gradients[category] || 'from-gold to-amber-600';
};

// Category icons for headers
const getCategoryIcon = (category: ToolCategory) => {
  const icons: Record<ToolCategory, string> = {
    media: '🎬',
    creative: '🎨',
    'ai-property': '🏠',
    'ai-sales': '📈',
    'ai-reports': '📊',
    'ai-communication': '💬',
    'ai-content': '✍️',
    productivity: '⚡',
  };
  return icons[category] || '🔧';
};

const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const Icon = tool.icon;
  const isActive = tool.status === 'active';
  
  return (
    <Link 
      to={isActive ? tool.href : tool.href}
      className={`group relative block rounded-xl border-2 transition-all duration-300 hover:-translate-y-1 ${
        tool.isFlagship 
          ? 'border-gold bg-zinc-900/95 shadow-[0_0_30px_rgba(200,167,102,0.25)]' 
          : 'border-gold/40 bg-zinc-900/90 hover:border-gold hover:shadow-[0_0_20px_rgba(200,167,102,0.2)]'
      }`}
    >
      {tool.isNew && (
        <span className="absolute -top-2 -right-2 bg-gold text-black text-xs font-bold px-2 py-0.5 rounded-full z-10">
          NEW
        </span>
      )}
      {tool.isFlagship && (
        <span className="absolute -top-2 -right-2 bg-gradient-to-r from-gold to-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 z-10">
          <Sparkles className="h-3 w-3" />
          FLAGSHIP
        </span>
      )}
      
      <div className="p-5">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 border-2 bg-gold/10 ${
          tool.isFlagship 
            ? 'border-gold' 
            : 'border-gold/50 group-hover:border-gold'
        } transition-colors`}>
          <Icon className="h-6 w-6 text-gold" />
        </div>
        
        {/* White text for readability on dark backgrounds */}
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-gold transition-colors">
          {tool.name}
        </h3>
        
        <p className="text-zinc-300 text-sm mb-4 line-clamp-2">
          {tool.description}
        </p>
        
        {/* Tags with dark background */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tool.tags.slice(0, 3).map((tag, i) => (
            <span 
              key={i}
              className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-gold/20"
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
};

export default function RoyalToolsHub() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all');

  const filteredTools = useMemo(() => {
    return allTools.filter(tool => {
      const matchesSearch = 
        tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.description.toLowerCase().includes(search.toLowerCase()) ||
        tool.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  const categories = Object.keys(categoryLabels) as ToolCategory[];

  // Group tools by category for organized display
  const toolsByCategory = useMemo(() => {
    const grouped: Record<ToolCategory, ToolDefinition[]> = {} as any;
    categories.forEach(cat => {
      grouped[cat] = filteredTools.filter(t => t.category === cat);
    });
    return grouped;
  }, [filteredTools, categories]);

  return (
    <>
      <SEOHead 
        title="JBJ Royal Tools Hub | Professional Real Estate Tools"
        description="Access professional-grade tools for images, videos, documents, and AI-powered analytics. Designed for real estate professionals."
      />
      
      <div className="min-h-screen bg-black">
        {/* Hero Section with Video */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
          {/* Video Background */}
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          >
            <source src={toolkitHeroVideo} type="video/mp4" />
          </video>
          
          {/* AI Particle Overlay Effect */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/20 via-transparent to-transparent animate-pulse" />
          
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black" />
          
          {/* Robot/AI Icon */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10">
            <Bot className="w-64 h-64 text-gold" />
          </div>
          
          <div className="relative max-w-6xl mx-auto text-center px-4 py-24">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 text-gold text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              AI-Powered Professional Toolkit
            </div>
            
            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
              JBJ <span className="text-gold">Royal Tools Hub</span>
            </h1>
            
            <p className="text-xl text-zinc-300 max-w-2xl mx-auto mb-10">
              Professional-grade tools for images, videos, documents, and AI-powered analytics. 
              Designed for real estate professionals.
            </p>
            
            {/* Features */}
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle2 className="h-5 w-5 text-gold" />
                <span>Free Media Tools</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <Shield className="h-5 w-5 text-gold" />
                <span>Privacy First</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <Clock className="h-5 w-5 text-gold" />
                <span>No Login Required for Toolkit</span>
              </div>
            </div>
          </div>
        </section>
        
        {/* Search & Filters */}
        <section className="px-4 pb-8 -mt-8 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="bg-zinc-900/90 backdrop-blur-sm border border-gold/20 rounded-xl p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search tools..."
                    className="pl-10 bg-zinc-800 border-gold/30 text-white placeholder:text-zinc-500"
                  />
                </div>
                
                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                    className={selectedCategory === 'all' ? 'bg-gold text-black hover:bg-gold/90' : 'border-gold/30 text-zinc-300'}
                  >
                    All Tools
                  </Button>
                  {categories.map(cat => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(cat)}
                      className={selectedCategory === cat ? 'bg-gold text-black hover:bg-gold/90' : 'border-gold/30 text-zinc-300'}
                    >
                      {categoryLabels[cat]}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Tools by Category - Grouped Display */}
        <section className="px-4 pb-24">
          <div className="max-w-6xl mx-auto">
            {filteredTools.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-zinc-500 text-lg">No tools found matching your criteria.</p>
                <Button
                  variant="outline"
                  className="mt-4 border-gold/30 text-gold"
                  onClick={() => { setSearch(''); setSelectedCategory('all'); }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : selectedCategory === 'all' ? (
              // Show grouped by category when "All" is selected
              <div className="space-y-12">
                {categories.map(category => {
                  const categoryTools = toolsByCategory[category];
                  if (categoryTools.length === 0) return null;
                  
                  return (
                    <div key={category}>
                      {/* Category Header with colored accent */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className={`w-1 h-8 rounded-full bg-gradient-to-b ${getCategoryGradient(category)}`} />
                        <span className="text-2xl">{getCategoryIcon(category)}</span>
                        <h2 className="text-2xl font-bold text-white">
                          {categoryLabels[category]}
                        </h2>
                        <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700">
                          {categoryTools.length} tools
                        </Badge>
                      </div>
                      
                      {/* Tools Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {categoryTools.map(tool => (
                          <ToolCard key={tool.id} tool={tool} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Show flat grid when specific category is selected
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            )}
          </div>
        </section>
        
        {/* Fair Usage Notice */}
        <section className="px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-xl border border-gold/30 bg-zinc-900/90 p-6 md:p-8">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-gold" />
                Fair Usage & Privacy
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6 text-sm text-zinc-300">
                <div>
                  <h4 className="text-white font-medium mb-2">Media Tool Limits</h4>
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
              
              <div className="mt-6 pt-6 border-t border-gold/20">
                <p className="text-xs text-zinc-500">
                  By using these tools, you confirm you own the content or have permission to edit it. 
                  JBJ Global Real Estate is not responsible for misuse of these tools.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
