/**
 * Video Suite - Master page for all video output tools
 * Tabs: Edit | Resize/Reframe | Captions | Export | Templates
 */

import React, { useState, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead } from '@/components/SEOHead';
import { 
  Play, Maximize2, Languages, Download, LayoutTemplate, ArrowLeft, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Lazy load the heavy components
const AIVideoStudio = lazy(() => import('@/components/ai-video-studio/AIVideoStudio').then(m => ({ default: m.AIVideoStudio })));
const VideoResizePanel = lazy(() => import('@/components/ai-video-studio/features/VideoResizePanel').then(m => ({ default: m.VideoResizePanel })));
const CaptionTranslator = lazy(() => import('@/components/ai-video-studio/features/CaptionTranslator').then(m => ({ default: m.CaptionTranslator })));

const LoadingSpinner = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div>
  </div>
);

// Placeholder for Export Presets
const VideoExportPanel = () => (
  <div className="p-8 text-center">
    <Download className="w-16 h-16 text-gold mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-white mb-2">Export Presets</h3>
    <p className="text-zinc-400 max-w-md mx-auto mb-6">
      Export your videos optimized for Instagram Reels, YouTube Shorts, TikTok, Stories, and more.
    </p>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
      {['Instagram Reels (9:16)', 'YouTube Shorts (9:16)', 'TikTok (9:16)', 'YouTube (16:9)', 'Facebook (1:1)', 'Twitter/X (16:9)', 'Stories (9:16)', 'LinkedIn (16:9)'].map((preset) => (
        <div key={preset} className="p-4 bg-slate-800/50 rounded-lg border border-gold/20 hover:border-gold/50 transition-colors cursor-pointer">
          <p className="text-sm text-white">{preset}</p>
        </div>
      ))}
    </div>
  </div>
);

// Placeholder for Templates
const VideoTemplates = () => (
  <div className="p-8 text-center">
    <LayoutTemplate className="w-16 h-16 text-gold mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-white mb-2">Video Templates</h3>
    <p className="text-zinc-400 max-w-md mx-auto mb-6">
      Professional video templates for property tours, agent intros, market updates, and more.
    </p>
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 text-gold text-sm">
      <Sparkles className="w-4 h-4" />
      Coming Soon
    </div>
  </div>
);

export default function VideoSuite() {
  const [activeTab, setActiveTab] = useState('edit');

  const tabs = [
    { id: 'edit', label: 'Edit', icon: Play, description: 'Full video editor' },
    { id: 'resize', label: 'Resize/Reframe', icon: Maximize2, description: 'Smart crop & resize' },
    { id: 'captions', label: 'Captions', icon: Languages, description: 'Auto-transcribe & translate' },
    { id: 'export', label: 'Export', icon: Download, description: 'Platform presets' },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate, description: 'Ready-made templates' },
  ];

  return (
    <>
      <SEOHead 
        title="Video Suite | JBJ Royal Tools"
        description="Professional video editing, resizing, captioning, and export tools for real estate content creation."
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
                <Play className="w-7 h-7 text-gold" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Video <span className="text-gold">Suite</span>
                </h1>
                <p className="text-zinc-400 text-sm">
                  Complete video editing, resizing, captions & export
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-[calc(100vh-140px)]">
          <div className="border-b border-gold/20 bg-zinc-900/50">
            <div className="max-w-7xl mx-auto px-4">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto gap-0">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="relative px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            <TabsContent value="edit" className="h-full mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <AIVideoStudio />
              </Suspense>
            </TabsContent>

            <TabsContent value="resize" className="h-full mt-0 overflow-auto">
              <div className="max-w-4xl mx-auto p-6">
                <Suspense fallback={<LoadingSpinner />}>
                  <VideoResizePanel />
                </Suspense>
              </div>
            </TabsContent>

            <TabsContent value="captions" className="h-full mt-0 overflow-auto">
              <div className="max-w-4xl mx-auto p-6">
                <Suspense fallback={<LoadingSpinner />}>
                  <CaptionTranslator 
                    subtitles={[]}
                    onSubtitlesUpdate={() => {}}
                    onTranscribe={async () => []}
                  />
                </Suspense>
              </div>
            </TabsContent>

            <TabsContent value="export" className="h-full mt-0 overflow-auto bg-slate-950">
              <VideoExportPanel />
            </TabsContent>

            <TabsContent value="templates" className="h-full mt-0 overflow-auto bg-slate-950">
              <VideoTemplates />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
}
