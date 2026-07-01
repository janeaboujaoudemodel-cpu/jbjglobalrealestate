/**
 * Video Suite — Premium Champagne-Gold Design with centered header
 * Upgraded with Beauty Filters, Background Remover, Thumbnail Generator
 */

import React, { lazy, Suspense, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead } from '@/components/SEOHead';
import { Play, Maximize2, Languages, Loader2, FileText, Sparkles, Mic, AudioLines, Film, Wand2, Eraser, Image } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ToolAnimatedFrame } from '@/components/tools/PremiumToolShell';
import { toolThemes } from '@/components/tools/toolThemes';

const AIVideoStudio = lazy(() => import('@/components/ai-video-studio/AIVideoStudio').then(m => ({ default: m.AIVideoStudio })));
const VideoResizePack = lazy(() => import('@/pages/toolkit/VideoResizePack'));
const CaptionsTranslate = lazy(() => import('@/pages/toolkit/CaptionsTranslate'));
const AIVideoTourScriptPremium = lazy(() => import('@/components/ai-tools/premium').then(m => ({ default: m.AIVideoTourScriptPremium })));
const VoiceoverRecorder = lazy(() => import('@/components/ai-video-studio/features/VoiceoverRecorder').then(m => ({ default: m.VoiceoverRecorder })));
const AudioExtractorPanel = lazy(() => import('@/components/ai-video-studio/features/AudioExtractorPanel').then(m => ({ default: m.AudioExtractorPanel })));
const ScenePlannerPanel = lazy(() => import('@/components/ai-video-studio/features/ScenePlannerPanel').then(m => ({ default: m.ScenePlannerPanel })));
const BeautyFilters = lazy(() => import('@/pages/toolkit/BeautyFilters'));
const BackgroundAI = lazy(() => import('@/pages/toolkit/BackgroundAI'));
const ThumbnailGenerator = lazy(() => import('@/components/video-suite/ThumbnailGenerator').then(m => ({ default: m.ThumbnailGenerator })));

const LoadingSpinner = () => (
  <div className="min-h-[50vh] flex items-center justify-center" style={{ background: "linear-gradient(180deg, #FDFBF7 0%, #F5EFE3 100%)" }}>
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-7 w-7 animate-spin" style={{ color: "#B89555" }} />
      <p className="text-xs" style={{ color: "rgba(0,0,0,0.35)" }}>Loading tool...</p>
    </div>
  </div>
);

const tabs = [
  { value: "edit", label: "Edit Studio", shortLabel: "Edit", icon: Play },
  { value: "resize", label: "Resize / Reframe", shortLabel: "Resize", icon: Maximize2 },
  { value: "captions", label: "Captions & Translation", shortLabel: "Captions", icon: Languages },
  { value: "script", label: "Video Tour Script", shortLabel: "Script", icon: FileText },
  { value: "voice", label: "Voice Studio", shortLabel: "Voice", icon: Mic },
  { value: "audio-tools", label: "Audio Tools", shortLabel: "Audio", icon: AudioLines },
  { value: "storyboard", label: "AI Storyboard", shortLabel: "Story", icon: Film },
  { value: "thumbnail", label: "Thumbnail Generator", shortLabel: "Thumb", icon: Image },
  { value: "beauty", label: "Beauty Filters", shortLabel: "Beauty", icon: Wand2 },
  { value: "bg-remove", label: "Background Remover", shortLabel: "BG Remove", icon: Eraser },
];

export default function VideoSuite() {
  const [activeTab, setActiveTab] = useState("edit");

  return (
    <>
      <SEOHead
        title="Creative Video Suite | JBJ Creative Tools"
        description="Professional video editing, resizing, captioning, thumbnail generation and beauty tools for real estate content."
      />

      <ToolAnimatedFrame theme={toolThemes.emerald}>
      <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #064E3B 0%, #042c1c 48%, #000000 100%)" }}>
        {/* ── Suite Header — centered ── */}
        <div style={{ background: "linear-gradient(180deg, #F7F1E6 0%, #EFE6D6 100%)", borderBottom: "1px solid rgba(184,149,85,0.25)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-0">
            {/* Title row — centered */}
            <div className="flex flex-col items-center text-center gap-3 mb-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #F7F1E6, #D8C7A6)", border: "1px solid rgba(184,149,85,0.4)", boxShadow: "0 0 30px rgba(184,149,85,0.15)" }}>
                <Play className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#B89555" }} />
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 mb-0.5">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight" style={{ color: "#1A1A1A" }}>
                    Creative <span style={{ color: "#B89555" }}>Video Suite</span>
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: "#EFE6D6", border: "1px solid rgba(184,149,85,0.4)", color: "#1A1A1A" }}>
                    <Sparkles className="w-2.5 h-2.5" /> AI Powered
                  </span>
                </div>
                <p className="text-xs sm:text-sm mt-1" style={{ color: "rgba(0,0,0,0.45)" }}>
                  Edit · Resize · Captions · Script · Effects · Thumbnails · Beauty · Background
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tab Bar — horizontally scrollable on all devices */}
          <div style={{ background: "rgba(245,235,215,0.5)", borderBottom: "1px solid rgba(184,149,85,0.15)" }}>
            <div className="max-w-7xl mx-auto">
              <ScrollArea className="w-full">
                <div className="px-2 sm:px-6">
                  <TabsList className="w-max min-w-full justify-start rounded-none bg-transparent p-0 h-auto gap-0 border-0">
                    {tabs.map(({ value, label, shortLabel, icon: Icon }) => (
                      <TabsTrigger key={value} value={value}
                        className="relative flex items-center gap-1.5 px-2.5 sm:px-4 md:px-5 py-3 sm:py-3.5 rounded-none border-0 bg-transparent whitespace-nowrap text-[11px] sm:text-xs md:text-sm font-medium transition-all outline-none
                          data-[state=inactive]:text-[#1A1A1A]/40 data-[state=active]:text-[#B89555]
                          after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-full after:transition-all
                          data-[state=inactive]:after:bg-transparent data-[state=active]:after:bg-[#B89555]"
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="md:hidden">{shortLabel}</span>
                        <span className="hidden md:inline">{label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                <ScrollBar orientation="horizontal" className="h-1.5" />
              </ScrollArea>
            </div>
          </div>

          {/* Neon gradient divider */}
          <div className="h-[2px]" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(184,149,85,0.5) 30%, rgba(201,168,76,0.7) 50%, rgba(184,149,85,0.5) 70%, transparent 100%)" }} />

          {/* Tab Content */}
          <div>
            <TabsContent value="edit" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <AIVideoStudio />
              </Suspense>
            </TabsContent>
            <TabsContent value="resize" className="mt-0 overflow-auto">
              <Suspense fallback={<LoadingSpinner />}>
                <VideoResizePack />
              </Suspense>
            </TabsContent>
            <TabsContent value="captions" className="mt-0 overflow-auto">
              <Suspense fallback={<LoadingSpinner />}>
                <CaptionsTranslate embedded />
              </Suspense>
            </TabsContent>
            <TabsContent value="script" className="mt-0 overflow-auto">
              <Suspense fallback={<LoadingSpinner />}>
                <AIVideoTourScriptPremium />
              </Suspense>
            </TabsContent>
            <TabsContent value="voice" className="mt-0 overflow-auto">
              <Suspense fallback={<LoadingSpinner />}>
                <div className="max-w-3xl mx-auto p-4 sm:p-6">
                  <VoiceoverRecorder
                    onRecordingComplete={() => {}}
                    onAIVoiceGenerated={() => {}}
                  />
                </div>
              </Suspense>
            </TabsContent>
            <TabsContent value="audio-tools" className="mt-0 overflow-auto">
              <Suspense fallback={<LoadingSpinner />}>
                <div className="max-w-3xl mx-auto p-4 sm:p-6">
                  <AudioExtractorPanel />
                </div>
              </Suspense>
            </TabsContent>
            <TabsContent value="storyboard" className="mt-0 overflow-auto">
              <Suspense fallback={<LoadingSpinner />}>
                <div className="max-w-3xl mx-auto p-4 sm:p-6">
                  <ScenePlannerPanel />
                </div>
              </Suspense>
            </TabsContent>
            <TabsContent value="thumbnail" className="mt-0 overflow-auto">
              <Suspense fallback={<LoadingSpinner />}>
                <ThumbnailGenerator />
              </Suspense>
            </TabsContent>
            <TabsContent value="beauty" className="mt-0 overflow-auto">
              <Suspense fallback={<LoadingSpinner />}>
                <BeautyFilters embedded />
              </Suspense>
            </TabsContent>
            <TabsContent value="bg-remove" className="mt-0 overflow-auto">
              <Suspense fallback={<LoadingSpinner />}>
                <BackgroundAI embedded />
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </div>
      </ToolAnimatedFrame>
    </>
  );
}
