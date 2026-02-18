/**
 * Video Suite - Master page embedding REAL existing tool pages
 */

import React, { lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead } from '@/components/SEOHead';
import { Play, Maximize2, Languages, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const AIVideoStudio = lazy(() => import('@/components/ai-video-studio/AIVideoStudio').then(m => ({ default: m.AIVideoStudio })));
const VideoResizePack = lazy(() => import('@/pages/toolkit/VideoResizePack'));
const CaptionsTranslate = lazy(() => import('@/pages/toolkit/CaptionsTranslate'));

const LoadingSpinner = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-7 w-7 animate-spin" style={{ color: "#818CF8" }} />
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Loading tool...</p>
    </div>
  </div>
);

const tabs = [
  { value: "edit", label: "Edit", shortLabel: "Edit", icon: Play },
  { value: "resize", label: "Resize / Reframe", shortLabel: "Resize", icon: Maximize2 },
  { value: "captions", label: "Captions", shortLabel: "Captions", icon: Languages },
];

export default function VideoSuite() {
  return (
    <>
      <SEOHead
        title="Video Suite | JBJ Creative Tools"
        description="Professional video editing, resizing, captioning tools for real estate content."
      />

      <div className="min-h-screen" style={{ background: "#0C0E14" }}>
        {/* ── Suite Header ── */}
        <div style={{ background: "linear-gradient(180deg, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0.02) 100%)", borderBottom: "1px solid rgba(99,102,241,0.2)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-0">
            {/* Back link */}
            <Link to="/toolkit"
              className="inline-flex items-center gap-1.5 text-xs mb-4 transition-colors group"
              style={{ color: "rgba(255,255,255,0.4)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"}>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to Toolkit
            </Link>

            {/* Title row */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.35)", boxShadow: "0 0 40px rgba(99,102,241,0.2)" }}>
                <Play className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: "#818CF8" }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">
                    Creative <span style={{ color: "#818CF8" }}>Video Suite</span>
                  </h1>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)", color: "#818CF8" }}>
                    AI Powered
                  </span>
                </div>
                <p className="text-xs sm:text-sm mt-0.5 hidden sm:block" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Edit · Resize · Captions & Translation
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="edit" className="w-full">
          {/* Tab Bar */}
          <div style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="max-w-7xl mx-auto px-2 sm:px-6">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto gap-0 border-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {tabs.map(({ value, label, shortLabel, icon: Icon }) => (
                  <TabsTrigger key={value} value={value}
                    className="relative flex items-center gap-1.5 px-3 sm:px-5 py-3.5 rounded-none border-0 bg-transparent whitespace-nowrap text-xs sm:text-sm font-medium transition-all outline-none
                      data-[state=inactive]:text-white/40 data-[state=active]:text-indigo-400
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-full after:transition-all
                      data-[state=inactive]:after:bg-transparent data-[state=active]:after:bg-indigo-500"
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
          <div style={{ background: "#0C0E14" }}>
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
