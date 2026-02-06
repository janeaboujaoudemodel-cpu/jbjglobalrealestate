/**
 * Photo & Image Suite - Master page for all image output tools
 * Tabs: Background | Beauty | Resize | Interior Design | Virtual Staging
 */

import React, { useState, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead } from '@/components/SEOHead';
import { 
  Wand2, Sparkles, ImageIcon, Palette, Building2, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Lazy load the components
const BeautyFiltersPanel = lazy(() => import('@/components/ai-video-studio/features/BeautyFiltersPanel').then(m => ({ default: m.BeautyFiltersPanel })));

const LoadingSpinner = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div>
  </div>
);

// Background Remover Panel
const BackgroundRemoverPanel = () => (
  <div className="p-8">
    <div className="max-w-3xl mx-auto text-center">
      <Wand2 className="w-16 h-16 text-gold mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">AI Background Remover</h3>
      <p className="text-zinc-400 max-w-md mx-auto mb-6">
        Remove or replace backgrounds from photos instantly. Perfect for property listings and marketing materials.
      </p>
      <div className="p-8 bg-slate-800/50 rounded-xl border-2 border-dashed border-gold/30 hover:border-gold/50 transition-colors cursor-pointer">
        <ImageIcon className="w-12 h-12 text-gold/60 mx-auto mb-3" />
        <p className="text-white font-medium">Drop image here or click to upload</p>
        <p className="text-zinc-500 text-sm mt-1">JPG, PNG, WebP up to 10MB</p>
      </div>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {['Transparent', 'White', 'Blur', 'Custom Color'].map((bg) => (
          <div key={bg} className="p-3 bg-slate-800/50 rounded-lg border border-gold/20 hover:border-gold/50 transition-colors cursor-pointer">
            <p className="text-sm text-white">{bg}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Image Resize Panel
const ImageResizePanel = () => (
  <div className="p-8">
    <div className="max-w-3xl mx-auto text-center">
      <ImageIcon className="w-16 h-16 text-gold mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">Image Resizer & Social Sizes</h3>
      <p className="text-zinc-400 max-w-md mx-auto mb-6">
        Resize images for any platform with preset dimensions and batch export.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
        {[
          { name: 'Instagram Post', size: '1080×1080' },
          { name: 'Instagram Story', size: '1080×1920' },
          { name: 'Facebook Cover', size: '820×312' },
          { name: 'LinkedIn Banner', size: '1584×396' },
          { name: 'Twitter Header', size: '1500×500' },
          { name: 'YouTube Thumb', size: '1280×720' },
        ].map((preset) => (
          <div key={preset.name} className="p-4 bg-slate-800/50 rounded-lg border border-gold/20 hover:border-gold/50 transition-colors cursor-pointer text-left">
            <p className="text-white font-medium text-sm">{preset.name}</p>
            <p className="text-zinc-500 text-xs">{preset.size}</p>
          </div>
        ))}
      </div>
      <Link to="/toolkit/image-resize">
        <Button className="bg-gold text-black hover:bg-gold/90">
          Open Full Image Resizer
        </Button>
      </Link>
    </div>
  </div>
);

// Interior Design Panel
const InteriorDesignPanel = () => (
  <div className="p-8">
    <div className="max-w-3xl mx-auto text-center">
      <Palette className="w-16 h-16 text-gold mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">AI Interior Design</h3>
      <p className="text-zinc-400 max-w-md mx-auto mb-6">
        Transform any room with AI-powered interior design suggestions and virtual styling.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-6">
        {['Modern', 'Minimalist', 'Traditional', 'Scandinavian', 'Industrial', 'Bohemian', 'Coastal', 'Luxury'].map((style) => (
          <div key={style} className="p-4 bg-slate-800/50 rounded-lg border border-gold/20 hover:border-gold/50 transition-colors cursor-pointer">
            <p className="text-white text-sm">{style}</p>
          </div>
        ))}
      </div>
      <Link to="/interior-design-ai">
        <Button className="bg-gold text-black hover:bg-gold/90">
          Open Interior Design AI
        </Button>
      </Link>
    </div>
  </div>
);

// Virtual Staging Panel
const VirtualStagingPanel = () => (
  <div className="p-8 text-center">
    <Building2 className="w-16 h-16 text-gold mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-white mb-2">AI Virtual Staging</h3>
    <p className="text-zinc-400 max-w-md mx-auto mb-6">
      Virtually stage empty properties with AI-generated furniture and decor.
    </p>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-xl mx-auto mb-6">
      {['Living Room', 'Bedroom', 'Kitchen', 'Office', 'Dining Room', 'Bathroom'].map((room) => (
        <div key={room} className="p-4 bg-slate-800/50 rounded-lg border border-gold/20 hover:border-gold/50 transition-colors cursor-pointer">
          <p className="text-white text-sm">{room}</p>
        </div>
      ))}
    </div>
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 text-gold text-sm">
      <Sparkles className="w-4 h-4" />
      Coming Soon
    </div>
  </div>
);

export default function PhotoSuite() {
  const [activeTab, setActiveTab] = useState('background');

  const tabs = [
    { id: 'background', label: 'Background', icon: Wand2, description: 'Remove/replace backgrounds' },
    { id: 'beauty', label: 'Beauty', icon: Sparkles, description: 'Filters & enhancement' },
    { id: 'resize', label: 'Resize', icon: ImageIcon, description: 'Social media sizes' },
    { id: 'interior', label: 'Interior', icon: Palette, description: 'AI room design' },
    { id: 'staging', label: 'Staging', icon: Building2, description: 'Virtual furniture' },
  ];

  return (
    <>
      <SEOHead 
        title="Photo & Image Suite | JBJ Royal Tools"
        description="AI-powered background removal, beauty filters, image resizing, and interior design tools."
      />
      
      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="border-b border-gold/20 bg-gradient-to-r from-black via-zinc-900/50 to-black">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center gap-4 mb-4">
              <Link to="/toolkit">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Toolkit
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-gold/40 flex items-center justify-center">
                <ImageIcon className="w-7 h-7 text-gold" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Photo & Image <span className="text-gold">Suite</span>
                </h1>
                <p className="text-zinc-400 text-sm">
                  Background removal, beauty, resize & AI design
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
          <div className="border-b border-gold/20 bg-zinc-900/50">
            <div className="max-w-7xl mx-auto px-4">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto gap-0 overflow-x-auto">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 bg-slate-950 min-h-[60vh]">
            <TabsContent value="background" className="mt-0">
              <BackgroundRemoverPanel />
            </TabsContent>

            <TabsContent value="beauty" className="mt-0">
              <div className="max-w-4xl mx-auto p-6">
                <Suspense fallback={<LoadingSpinner />}>
                  <BeautyFiltersPanel />
                </Suspense>
              </div>
            </TabsContent>

            <TabsContent value="resize" className="mt-0">
              <ImageResizePanel />
            </TabsContent>

            <TabsContent value="interior" className="mt-0">
              <InteriorDesignPanel />
            </TabsContent>

            <TabsContent value="staging" className="mt-0">
              <VirtualStagingPanel />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
}
