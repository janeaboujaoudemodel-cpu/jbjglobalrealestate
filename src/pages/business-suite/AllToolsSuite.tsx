/**
 * All Tools Suite - Unified hub for all AI and productivity tools
 * Master frame with dynamic color theming based on active tool
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  ALL_TOOL_CATEGORIES, 
  sectionColors, 
  toolColorThemes 
} from '@/config/allToolsSuiteConfig';

const AllToolsSuite = () => {
  const [activeCategory, setActiveCategory] = useState('property');
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const currentCategory = ALL_TOOL_CATEGORIES.find(c => c.id === activeCategory) || ALL_TOOL_CATEGORIES[0];
  const currentColors = sectionColors[currentCategory.color] || sectionColors.sky;
  
  // Get tool theme for content area background
  const getToolTheme = (toolId: string) => {
    return toolColorThemes[toolId] || { 
      bg: 'bg-zinc-900/40', 
      accent: 'text-gold', 
      border: 'border-gold/30',
      gradient: 'from-gold/10 to-zinc-950/40',
      ring: 'ring-gold/30'
    };
  };

  return (
    <>
      <SEOHead 
        title="All Tools Suite | JBJ Global"
        description="Access all AI and productivity tools in one unified hub - Property analysis, investment calculators, communication tools, and more."
      />
      
      <div className="min-h-screen bg-black">
        {/* Premium Header - Gold/Champagne theme */}
        <div className="relative bg-gradient-to-b from-black via-zinc-950 to-black border-b border-gold/20">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(200,167,102,0.08),transparent_70%)]" />
          
          <div className="relative max-w-7xl mx-auto px-4 py-8 sm:py-12">
            {/* Back link */}
            <Link
              to="/toolkit"
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-gold transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Toolkit</span>
            </Link>
            
            {/* Title */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-gold" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                  All <span className="bg-gradient-to-r from-gold via-amber-400 to-gold bg-clip-text text-transparent">Tools Suite</span>
                </h1>
                <p className="text-zinc-400 text-sm sm:text-base mt-1">
                  Access all AI and productivity tools in one place
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Tabs - Horizontal scrolling pills */}
        <div className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-sm border-b border-gold/10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-2 py-4 overflow-x-auto scrollbar-hide">
              {ALL_TOOL_CATEGORIES.map((category) => {
                const Icon = category.icon;
                const colors = sectionColors[category.color];
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      setActiveCategory(category.id);
                      setActiveTool(null);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                      isActive
                        ? `${colors.active} border ${colors.border}`
                        : `${colors.inactive} border border-transparent hover:border-zinc-700`
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tools Grid - Cards with tool-specific colors */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Category Header */}
          <div className="flex items-center gap-3 mb-6">
            {React.createElement(currentCategory.icon, { className: `w-6 h-6 ${currentColors.active.split(' ')[0]}` })}
            <h2 className={`text-xl font-bold ${currentColors.active.split(' ')[0]}`}>
              {currentCategory.label}
            </h2>
            <span className="text-zinc-500 text-sm">
              ({currentCategory.tools.length} tools)
            </span>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentCategory.tools.map((tool) => {
              const theme = getToolTheme(tool.id);
              const isHovered = activeTool === tool.id;
              
              return (
                <Link
                  key={tool.id}
                  to={tool.href}
                  onMouseEnter={() => setActiveTool(tool.id)}
                  onMouseLeave={() => setActiveTool(null)}
                  className={cn(
                    "group relative p-5 rounded-xl transition-all duration-300",
                    theme.bg,
                    theme.border,
                    "border hover:scale-[1.02] hover:shadow-lg",
                    isHovered && `ring-2 ${theme.ring}`
                  )}
                >
                  {/* Gradient overlay on hover */}
                  <div className={cn(
                    "absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity",
                    theme.gradient
                  )} />
                  
                  <div className="relative">
                    {/* Icon */}
                    <div className={cn(
                      "w-11 h-11 rounded-lg flex items-center justify-center mb-4",
                      theme.bg,
                      theme.border,
                      "border"
                    )}>
                      {React.createElement(tool.icon, { className: `w-5 h-5 ${theme.accent}` })}
                    </div>
                    
                    {/* Content */}
                    <h3 className={cn(
                      "font-semibold mb-2 group-hover:brightness-110 transition-all",
                      theme.accent
                    )}>
                      {tool.name}
                    </h3>
                    <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2">
                      {tool.description}
                    </p>
                    
                    {/* Arrow indicator */}
                    <div className={cn(
                      "mt-4 text-sm font-medium flex items-center gap-1 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all",
                      theme.accent
                    )}>
                      Open Tool →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick Access Section - All categories overview */}
        <div className="border-t border-gold/10 bg-zinc-950/50">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" />
              Quick Access - All Categories
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {ALL_TOOL_CATEGORIES.map((category) => {
                const Icon = category.icon;
                const colors = sectionColors[category.color];
                const isActive = activeCategory === category.id;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      setActiveCategory(category.id);
                      setActiveTool(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl transition-all",
                      isActive
                        ? `${colors.active} border ${colors.border}`
                        : "bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700"
                    )}
                  >
                    <Icon className={cn("w-6 h-6", isActive ? colors.active.split(' ')[0] : "text-zinc-400")} />
                    <span className={cn(
                      "text-xs text-center font-medium",
                      isActive ? colors.active.split(' ')[0] : "text-zinc-400"
                    )}>
                      {category.label}
                    </span>
                    <span className="text-xs text-zinc-500">{category.tools.length} tools</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AllToolsSuite;
