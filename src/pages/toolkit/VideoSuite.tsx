/**
 * Video Suite - Master page embedding REAL existing tool pages
 * Tabs: Edit (AIVideoStudio) | Resize (VideoResizePack) | Captions (CaptionsTranslate)
 * ONLY real tool pages - no placeholders, no fake panels
 */

import React, { lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead } from '@/components/SEOHead';
import { Play, Maximize2, Languages, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Lazy load REAL existing tool PAGES (not panels)
const AIVideoStudio = lazy(() => import('@/components/ai-video-studio/AIVideoStudio').then(m => ({ default: m.AIVideoStudio })));
const VideoResizePack = lazy(() => import('@/pages/toolkit/VideoResizePack'));
const CaptionsTranslate = lazy(() => import('@/pages/toolkit/CaptionsTranslate'));

const LoadingSpinner = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div>
  </div>
);

export default function VideoSuite() {
  return (
    <>
      <SEOHead 
        title="Video Suite | JBJ Royal Tools"
        description="Professional video editing, resizing, captioning tools for real estate content."
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
                <Play className="w-7 h-7 text-gold" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Creative <span className="text-gold">Video Suite</span>
                </h1>
                <p className="text-zinc-400 text-sm">Edit, resize, and add captions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - ONLY 3 tabs with REAL tools */}
        <Tabs defaultValue="edit" className="flex flex-col h-[calc(100vh-140px)]">
          <div className="border-b border-gold/20 bg-zinc-900/50">
            <div className="max-w-7xl mx-auto px-4">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto gap-0">
                <TabsTrigger
                  value="edit"
                  className="relative px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </TabsTrigger>
                <TabsTrigger
                  value="resize"
                  className="relative px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Resize / Reframe</span>
                </TabsTrigger>
                <TabsTrigger
                  value="captions"
                  className="relative px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Languages className="w-4 h-4" />
                  <span className="hidden sm:inline">Captions</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Tab Content - REAL TOOL PAGES embedded */}
          <div className="flex-1 overflow-hidden">
            <TabsContent value="edit" className="h-full mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <AIVideoStudio />
              </Suspense>
            </TabsContent>

            <TabsContent value="resize" className="h-full mt-0 overflow-auto">
              <Suspense fallback={<LoadingSpinner />}>
                <VideoResizePack />
              </Suspense>
            </TabsContent>

            <TabsContent value="captions" className="h-full mt-0 overflow-auto">
              <Suspense fallback={<LoadingSpinner />}>
                <CaptionsTranslate />
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
}
