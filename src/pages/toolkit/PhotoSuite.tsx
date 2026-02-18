/**
 * Photo & Image Suite - Embeds REAL existing tool pages
 * Tabs: Background (BackgroundAI) | Beauty (BeautyFilters) | Resize (ImageResize) | Interior (InteriorDesignAI) | Staging (VirtualStaging)
 * ALL real tool pages - no placeholders
 */

import React, { lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead } from '@/components/SEOHead';
import { Wand2, Sparkles, Image as ImageIcon, Palette, Home, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Lazy load REAL existing tool PAGES
const BackgroundAI = lazy(() => import('@/pages/toolkit/BackgroundAI'));
const BeautyFilters = lazy(() => import('@/pages/toolkit/BeautyFilters'));
const ImageResize = lazy(() => import('@/pages/toolkit/ImageResize'));
const InteriorDesignAI = lazy(() => import('@/pages/InteriorDesignAI'));
const VirtualStagingPage = lazy(() => import('@/pages/toolkit/VirtualStagingPage'));

const LoadingSpinner = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div>
  </div>
);

export default function PhotoSuite() {
  return (
    <>
      <SEOHead 
        title="Photo & Image Suite | JBJ Royal Tools"
        description="AI background removal, beauty filters, image resizing, interior design, and virtual staging tools."
      />
      
      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="border-b border-gold/20 bg-gradient-to-r from-black via-zinc-900/50 to-black">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center gap-4 mb-4">
              <Link to="/toolkit">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600"
                  style={{ color: '#a1a1aa', backgroundColor: 'transparent' }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" style={{ color: '#a1a1aa' }} />
                  <span style={{ color: '#a1a1aa' }}>Back to Toolkit</span>
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
                <p className="text-zinc-400 text-sm">Background removal, beauty, resize, AI design & staging</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - 5 tabs with REAL tools */}
        <Tabs defaultValue="background" className="flex flex-col">
          <div className="border-b border-gold/20 bg-zinc-900/50">
            <div className="max-w-7xl mx-auto px-4">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto gap-0 overflow-x-auto">
                <TabsTrigger
                  value="background"
                  className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Wand2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Background</span>
                </TabsTrigger>
                <TabsTrigger
                  value="beauty"
                  className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Beauty</span>
                </TabsTrigger>
                <TabsTrigger
                  value="resize"
                  className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Resize</span>
                </TabsTrigger>
                <TabsTrigger
                  value="interior"
                  className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Palette className="w-4 h-4" />
                  <span className="hidden sm:inline">Interior Design</span>
                </TabsTrigger>
                <TabsTrigger
                  value="staging"
                  className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Virtual Staging</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Tab Content - REAL TOOL PAGES embedded */}
          <div className="flex-1 overflow-auto">
            <TabsContent value="background" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <BackgroundAI embedded />
              </Suspense>
            </TabsContent>

            <TabsContent value="beauty" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <BeautyFilters embedded />
              </Suspense>
            </TabsContent>

            <TabsContent value="resize" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <ImageResize embedded />
              </Suspense>
            </TabsContent>

            <TabsContent value="interior" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <InteriorDesignAI />
              </Suspense>
            </TabsContent>

            <TabsContent value="staging" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <VirtualStagingPage />
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
}
