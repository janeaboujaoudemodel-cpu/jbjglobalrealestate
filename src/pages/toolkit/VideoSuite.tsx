/**
 * Video Suite — Premium Champagne-Gold Design with centered header
 */

import React, { lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead } from '@/components/SEOHead';
import { Play, Maximize2, Languages, ArrowLeft, Loader2, Music, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const AIVideoStudio = lazy(() => import('@/components/ai-video-studio/AIVideoStudio').then(m => ({ default: m.AIVideoStudio })));
const VideoResizePack = lazy(() => import('@/pages/toolkit/VideoResizePack'));
const CaptionsTranslate = lazy(() => import('@/pages/toolkit/CaptionsTranslate'));

const LoadingSpinner = () => (
  <div className="min-h-[50vh] flex items-center justify-center" style={{ background: "linear-gradient(180deg, #FDFBF7 0%, #F5EFE3 100%)" }}>
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-7 w-7 animate-spin" style={{ color: "#B8943E" }} />
      <p className="text-xs" style={{ color: "rgba(0,0,0,0.35)" }}>Loading tool...</p>
    </div>
  </div>
);

const tabs = [
  { value: "edit", label: "Edit Studio", shortLabel: "Edit", icon: Play },
  { value: "resize", label: "Resize / Reframe", shortLabel: "Resize", icon: Maximize2 },
  { value: "captions", label: "Captions & Translation", shortLabel: "Captions", icon: Languages },
];

export default function VideoSuite() {
  return (
    <>
      <SEOHead
        title="Creative Video Suite | JBJ Creative Tools"
        description="Professional video editing, resizing, captioning tools for real estate content."
      />

      <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #FDFBF7 0%, #EDE4D3 100%)" }}>
        {/* ── Suite Header — centered ── */}
        <div style={{ background: "linear-gradient(180deg, #F5EBD7 0%, #EDE4D3 100%)", borderBottom: "1px solid rgba(184,148,62,0.25)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-0">
            {/* Back link */}
            <Link to="/toolkit"
              className="inline-flex items-center gap-1.5 text-xs mb-4 transition-colors group"
              style={{ color: "rgba(0,0,0,0.4)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.75)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.4)"}>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to Royal Tools Hub
            </Link>

            {/* Title row — centered */}
            <div className="flex flex-col items-center text-center gap-3 mb-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #F5EBD7, #D4C4A8)", border: "1px solid rgba(184,148,62,0.4)", boxShadow: "0 0 30px rgba(184,148,62,0.15)" }}>
                <Play className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#B8943E" }} />
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 mb-0.5">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight" style={{ color: "#1A1A1A" }}>
                    Creative <span style={{ color: "#B8943E" }}>Video Suite</span>
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: "rgba(184,148,62,0.12)", border: "1px solid rgba(184,148,62,0.3)", color: "#B8943E" }}>
                    <Sparkles className="w-2.5 h-2.5" /> AI Powered
                  </span>
                </div>
                <p className="text-xs sm:text-sm mt-1" style={{ color: "rgba(0,0,0,0.45)" }}>
                  Edit · Resize · Captions & Translation · Sound · Effects
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="edit" className="w-full">
          {/* Tab Bar */}
          <div style={{ background: "rgba(245,235,215,0.5)", borderBottom: "1px solid rgba(184,148,62,0.15)" }}>
            <div className="max-w-7xl mx-auto px-2 sm:px-6">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto gap-0 border-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {tabs.map(({ value, label, shortLabel, icon: Icon }) => (
                  <TabsTrigger key={value} value={value}
                    className="relative flex items-center gap-1.5 px-3 sm:px-5 py-3.5 rounded-none border-0 bg-transparent whitespace-nowrap text-xs sm:text-sm font-medium transition-all outline-none
                      data-[state=inactive]:text-black/40 data-[state=active]:text-[#B8943E]
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-full after:transition-all
                      data-[state=inactive]:after:bg-transparent data-[state=active]:after:bg-[#B8943E]"
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span className="sm:hidden">{shortLabel}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

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
          </div>
        </Tabs>
      </div>
    </>
  );
}
