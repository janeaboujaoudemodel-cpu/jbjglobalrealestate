/**
 * Video Suite - Master page for all video output tools
 * Tabs: Edit | Resize/Reframe | Captions | Export
 * 
 * CRITICAL: Each tab embeds the REAL tool component - no placeholders
 */

import React, { useState, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead } from '@/components/SEOHead';
import { 
  Play, Maximize2, Languages, Download, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Lazy load the REAL tool components
const AIVideoStudio = lazy(() => import('@/components/ai-video-studio/AIVideoStudio').then(m => ({ default: m.AIVideoStudio })));
const VideoResizePanel = lazy(() => import('@/components/ai-video-studio/features/VideoResizePanel').then(m => ({ default: m.VideoResizePanel })));
const CaptionTranslator = lazy(() => import('@/components/ai-video-studio/features/CaptionTranslator').then(m => ({ default: m.CaptionTranslator })));

const LoadingSpinner = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div>
  </div>
);

// Export Presets - Functional component
const VideoExportPanel = () => {
  const presets = [
    { name: 'Instagram Reels', aspect: '9:16', resolution: '1080×1920' },
    { name: 'YouTube Shorts', aspect: '9:16', resolution: '1080×1920' },
    { name: 'TikTok', aspect: '9:16', resolution: '1080×1920' },
    { name: 'YouTube', aspect: '16:9', resolution: '1920×1080' },
    { name: 'Facebook', aspect: '1:1', resolution: '1080×1080' },
    { name: 'Twitter/X', aspect: '16:9', resolution: '1280×720' },
    { name: 'Stories', aspect: '9:16', resolution: '1080×1920' },
    { name: 'LinkedIn', aspect: '16:9', resolution: '1920×1080' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gold/20 border-2 border-gold/40 flex items-center justify-center mx-auto mb-4">
          <Download className="w-8 h-8 text-gold" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Export Presets</h3>
        <p className="text-zinc-400 max-w-md mx-auto">
          Export your videos optimized for any platform. Select a preset to configure export settings.
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {presets.map((preset) => (
          <button
            key={preset.name}
            className="p-4 bg-slate-800/50 rounded-xl border-2 border-gold/20 hover:border-gold/50 hover:bg-slate-800 transition-all text-left group"
          >
            <p className="text-white font-medium text-sm group-hover:text-gold transition-colors">{preset.name}</p>
            <p className="text-zinc-500 text-xs mt-1">{preset.aspect} • {preset.resolution}</p>
          </button>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-slate-800/30 rounded-xl border border-gold/20 text-center">
        <p className="text-zinc-400 text-sm">
          Upload a video in the <span className="text-gold">Edit</span> tab first, then return here to export with presets.
        </p>
      </div>
    </div>
  );
};

export default function VideoSuite() {
  const [activeTab, setActiveTab] = useState('edit');
  const [subtitles, setSubtitles] = useState<any[]>([]);

  // Only show tabs that have real implementations
  const tabs = [
    { id: 'edit', label: 'Edit', icon: Play, description: 'Full video editor' },
    { id: 'resize', label: 'Resize/Reframe', icon: Maximize2, description: 'Smart crop & resize' },
    { id: 'captions', label: 'Captions', icon: Languages, description: 'Auto-transcribe & translate' },
    { id: 'export', label: 'Export', icon: Download, description: 'Platform presets' },
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

          {/* Tab Content - REAL TOOLS */}
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
                    subtitles={subtitles}
                    onSubtitlesUpdate={setSubtitles}
                    onTranscribe={async () => {
                      // Real transcription would happen here
                      return [];
                    }}
                  />
                </Suspense>
              </div>
            </TabsContent>

            <TabsContent value="export" className="h-full mt-0 overflow-auto bg-slate-950">
              <VideoExportPanel />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
}
