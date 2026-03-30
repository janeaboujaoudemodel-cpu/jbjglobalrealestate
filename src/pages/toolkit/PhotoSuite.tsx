/**
 * Photo & Image Suite — Simplified entry point
 * Now primarily routes to the unified Photo Studio Pro hub
 */

import React, { lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead } from '@/components/SEOHead';
import { Wand2, Sparkles, Home, ArrowLeft, Loader2, Image, ScanLine, FileImage } from 'lucide-react';
import { Link } from 'react-router-dom';

const BeautyFilters = lazy(() => import('@/pages/toolkit/BeautyFilters'));
const InteriorDesignAI = lazy(() => import('@/pages/InteriorDesignAI'));
const VirtualStagingPage = lazy(() => import('@/pages/toolkit/VirtualStagingPage'));
const ScanSignPage = lazy(() => import('@/pages/toolkit/ScanSignPage'));
const PdfFromPhotos = lazy(() => import('@/pages/toolkit/PdfFromPhotos'));

const LoadingSpinner = () => (
  <div className="min-h-[50vh] flex items-center justify-center" style={{ background: "linear-gradient(180deg, #FDFBF7 0%, #F5EFE3 100%)" }}>
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-7 w-7 animate-spin" style={{ color: "#B8943E" }} />
      <p className="text-xs" style={{ color: "rgba(0,0,0,0.35)" }}>Loading tool...</p>
    </div>
  </div>
);

const tabs = [
  { value: "studio", label: "Photo Studio Pro", shortLabel: "Studio", icon: Wand2 },
  { value: "interior", label: "Interior Design", shortLabel: "Interior", icon: Home },
  { value: "staging", label: "Virtual Staging", shortLabel: "Staging", icon: Image },
  { value: "scan-sign", label: "Scan & Sign", shortLabel: "Scan", icon: ScanLine },
  { value: "photo-pdf", label: "Photo to PDF", shortLabel: "PDF", icon: FileImage },
];

export default function PhotoSuite() {
  return (
    <>
      <SEOHead
        title="Photo & Image Suite | JBJ Creative Tools"
        description="AI photo studio, interior design, virtual staging, scan & sign, and photo-to-PDF tools."
      />

      <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #FDFBF7 0%, #EFE6D6 100%)" }}>
        {/* ── Suite Header ── */}
        <div style={{ background: "linear-gradient(180deg, #F7F1E6 0%, #EFE6D6 100%)", borderBottom: "1px solid rgba(184,148,62,0.25)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-0">
            <Link to="/toolkit"
              className="inline-flex items-center gap-1.5 text-xs mb-4 transition-colors group"
              style={{ color: "rgba(0,0,0,0.4)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.75)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.4)"}>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to Royal Tools Hub
            </Link>

            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #F7F1E6, #D8C7A6)", border: "1px solid rgba(184,148,62,0.4)", boxShadow: "0 0 30px rgba(184,148,62,0.15)" }}>
                <Image className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: "#B8943E" }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight" style={{ color: "#1A1A1A" }}>
                    Photo & Image <span style={{ color: "#B8943E" }}>Suite</span>
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: "rgba(184,148,62,0.12)", border: "1px solid rgba(184,148,62,0.3)", color: "#B8943E" }}>
                    <Sparkles className="w-2.5 h-2.5" /> AI Powered
                  </span>
                </div>
                <p className="text-xs sm:text-sm mt-0.5 hidden sm:block" style={{ color: "rgba(0,0,0,0.45)" }}>
                  Photo Studio Pro · Interior Design · Virtual Staging · Scan & Sign · PDF
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="studio" className="w-full">
          <div style={{ background: "rgba(245,235,215,0.5)", borderBottom: "1px solid rgba(184,148,62,0.15)" }}>
            <div className="max-w-7xl mx-auto px-2 sm:px-6">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto gap-0 border-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {tabs.map(({ value, label, shortLabel, icon: Icon }) => (
                  <TabsTrigger key={value} value={value}
                    className="relative flex items-center gap-1.5 px-3 sm:px-4 py-3.5 rounded-none border-0 bg-transparent whitespace-nowrap text-xs sm:text-sm font-medium transition-all outline-none
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

          <div>
            <TabsContent value="studio" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}><BeautyFilters embedded /></Suspense>
            </TabsContent>
            <TabsContent value="interior" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}><InteriorDesignAI embedded /></Suspense>
            </TabsContent>
            <TabsContent value="staging" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}><VirtualStagingPage embedded /></Suspense>
            </TabsContent>
            <TabsContent value="scan-sign" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}><ScanSignPage /></Suspense>
            </TabsContent>
            <TabsContent value="photo-pdf" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}><PdfFromPhotos embedded /></Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
}
