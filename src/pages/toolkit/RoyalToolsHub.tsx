/**
 * JBJ Royal Tools Hub
 * Unified page for all tools - media, AI, and productivity
 * LOCKED: Champagne gold theme matching homepage ToolkitShowcaseCard
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, ArrowRight, CheckCircle2, Clock, Shield, Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/SEOHead';
import {
  allTools,
  categoryLabels,
  type ToolDefinition,
  type ToolCategory,
} from '@/config/royalToolsRegistry';

interface ToolCardProps {
  tool: ToolDefinition;
}

// Category icons for headers
// Category icons removed — Lucide icons used inline in category headers

/**
 * ToolCard Component - LOCKED Champagne Gold Style
 * Matches exact styling from homepage ToolkitShowcaseCard.tsx
 */
const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const Icon = tool.icon;
  
  return (
    <Link to={tool.href} className="group block h-full">
      <div className="h-full flex flex-col bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] rounded-xl border-2 border-gold/30 hover:border-gold p-5 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(200,167,102,0.4)] hover:-translate-y-1">
        {/* Badges removed per plan */}
        
        {/* Icon - Transparent with gold border matching homepage */}
        <div className="w-12 h-12 rounded-xl border-2 border-gold/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
          <Icon className="w-6 h-6 text-black" />
        </div>

        {/* Title - Black text with Poppins */}
        <h4 
          className="text-base font-bold text-black mb-2 group-hover:text-gold transition-colors flex-shrink-0"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {tool.name}
        </h4>

        {/* Description - Zinc-600 for readability */}
        <p className="text-sm text-zinc-600 mb-4 leading-relaxed flex-grow">
          {tool.description}
        </p>

        {/* CTA Button - Full width like homepage */}
        <Button variant="primary" size="sm" className="mt-auto w-full justify-center">
          Open Tool
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
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
        {/* Hero Section - Matching Homepage Champagne Style */}
        <section className="py-12 md:py-16 bg-black">
          <div className="jj-layer-2">
            <div 
              className="relative z-10 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-2xl md:rounded-3xl border-2 border-gold/50 overflow-hidden"
              style={{ boxShadow: '0 12px 40px rgba(200,167,102,0.25)' }}
            >
              {/* Header Section - Champagne gradient */}
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] p-6 md:p-8 border-b border-gold/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/20 border border-gold/40 text-gold text-xs uppercase tracking-[0.2em]">
                    <Sparkles className="w-3 h-3" />
                    AI-Powered Professional Toolkit
                  </div>
                </div>
                
                <h1 
                  className="text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-2"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  JBJ Royal Tools Hub
                </h1>
                
                <p className="text-zinc-600 text-sm md:text-base max-w-2xl mb-6">
                  Professional-grade tools for images, videos, documents, and AI-powered analytics — all designed for real estate professionals.
                </p>
                
                {/* Features - Inline with champagne styling */}
                <div className="flex flex-wrap gap-4 md:gap-6">
                  <div className="flex items-center gap-2 text-zinc-700">
                    <CheckCircle2 className="h-4 w-4 text-gold" />
                    <span className="text-sm">Free Media Tools</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-700">
                    <Shield className="h-4 w-4 text-gold" />
                    <span className="text-sm">Privacy First</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-700">
                    <Clock className="h-4 w-4 text-gold" />
                    <span className="text-sm">No Login Required</span>
                  </div>
                </div>
              </div>
              
              {/* Search & Filters - Inside Container */}
              <div className="p-6 md:p-8 border-b border-gold/30">
              <div className="flex flex-wrap gap-2 items-center justify-center">
                  {/* Search - Inline with pills, before All Tools */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search..."
                      className="pl-9 pr-3 py-2 h-9 w-40 md:w-48 rounded-full bg-white/50 border-gold/30 text-black text-sm placeholder:text-zinc-500"
                    />
                  </div>

                  {/* Category Filters - Champagne Pills */}
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedCategory === 'all' 
                        ? 'bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold text-black shadow-md' 
                        : 'bg-white/30 border border-gold/30 text-zinc-600 hover:border-gold/60'
                    }`}
                  >
                    All Tools
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedCategory === cat 
                          ? 'bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold text-black shadow-md' 
                          : 'bg-white/30 border border-gold/30 text-zinc-600 hover:border-gold/60'
                      }`}
                    >
                      {categoryLabels[cat]}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Tools Grid - Inside Container */}
              <div className="p-6 md:p-8">
                {filteredTools.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-zinc-600 text-lg">No tools found matching your criteria.</p>
                    <Button
                      variant="outline"
                      className="mt-4 border-gold/50 text-gold hover:bg-gold/10"
                      onClick={() => { setSearch(''); setSelectedCategory('all'); }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                ) : selectedCategory === 'all' ? (
                  // Show grouped by category when "All" is selected
                  <div className="space-y-10">
                    {categories.map(category => {
                      const categoryTools = toolsByCategory[category];
                      if (categoryTools.length === 0) return null;
                      
                      return (
                        <div key={category}>
                          {/* Category Header - Champagne style */}
                          <div className="flex items-center gap-3 mb-6">
                            <Sparkles className="w-5 h-5 text-[#C9A84C]" />
                            <h2 
                              className="text-xl md:text-2xl font-bold text-black"
                              style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                              {categoryLabels[category]}
                            </h2>
                            <span className="px-3 py-1 rounded-full bg-gold/20 border border-gold/40 text-gold text-sm">
                              {categoryTools.length} tools
                            </span>
                          </div>
                          
                          {/* Tools Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredTools.map((tool) => (
                      <ToolCard key={tool.id} tool={tool} />
                    ))}
                  </div>
                )}
              </div>
              
              {/* Fair Usage Notice - Inside Container */}
              <div className="p-6 md:p-8 border-t border-gold/30">
                <div className="rounded-xl border-2 border-gold/30 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] p-6 md:p-8">
                  <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-gold" />
                    Fair Usage & Privacy
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-6 text-sm text-zinc-600">
                    <div>
                      <h4 className="text-black font-medium mb-2">Media Tool Limits</h4>
                      <ul className="space-y-1">
                        <li>• Max 5 minutes per video job</li>
                        <li>• Max 3 jobs per hour</li>
                        <li>• Max 500MB storage per session</li>
                        <li>• Projects save automatically</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-black font-medium mb-2">Your Privacy</h4>
                      <ul className="space-y-1">
                        <li>• Files processed securely</li>
                        <li>• Secure auto-save storage</li>
                        <li>• No data sold or shared</li>
                        <li>• GDPR compliant processing</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gold/30">
                    <p className="text-xs text-zinc-500">
                      By using these tools, you confirm you own the content or have permission to edit it. 
                      The platform operator is not responsible for misuse of these tools.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
