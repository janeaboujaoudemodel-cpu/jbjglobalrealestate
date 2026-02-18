/**
 * Photo & Image Suite — Premium dark-gold design
 * Embeds: BackgroundAI | BeautyFilters | ImageResize | InteriorDesignAI | VirtualStaging
 */

import React, { lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead } from '@/components/SEOHead';
import { Wand2, Sparkles, Image as ImageIcon, Palette, Home, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const BackgroundAI = lazy(() => import('@/pages/toolkit/BackgroundAI'));
const BeautyFilters = lazy(() => import('@/pages/toolkit/BeautyFilters'));
const ImageResize = lazy(() => import('@/pages/toolkit/ImageResize'));
const InteriorDesignAI = lazy(() => import('@/pages/InteriorDesignAI'));
const VirtualStagingPage = lazy(() => import('@/pages/toolkit/VirtualStagingPage'));

const LoadingSpinner = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-8 w-8 text-gold animate-spin" />
      <p className="text-zinc-500 text-sm">Loading tool...</p>
    </div>
  </div>
);

const tabs = [
  { value: "background", label: "Background Remover", icon: Wand2 },
  { value: "beauty", label: "Beauty Filters", icon: Sparkles },
  { value: "resize", label: "Image Resize", icon: ImageIcon },
  { value: "interior", label: "Interior Design", icon: Palette },
  { value: "staging", label: "Virtual Staging", icon: Home },
];

export default function PhotoSuite() {
  return (
    <>
      <SEOHead 
        title="Photo & Image Suite | JBJ Creative Tools"
        description="AI background removal, beauty filters, image resizing, interior design, and virtual staging tools."
      />
      
      <div className="min-h-screen bg-black">

        {/* ── Suite Header ── */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-black border-b border-gold/15">
          <div className="max-w-7xl mx-auto px-6 pt-6 pb-0">
            {/* Back link */}
            <Link
              to="/toolkit"
              className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm mb-5 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to Toolkit
            </Link>

            {/* Title row */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center shadow-[0_0_30px_rgba(201,168,76,0.15)]">
                <ImageIcon className="w-7 h-7 text-gold" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                  Photo & Image <span className="text-gold">Suite</span>
                </h1>
                <p className="text-zinc-500 text-sm mt-0.5">Background removal · Beauty filters · Resize · AI design · Staging</p>
              </div>
            </div>

            {/* Tabs bar lives inside suite header, content below */}
          </div>
        </div>

        {/* ── Tabs (wraps both trigger bar and content) ── */}
        <Tabs defaultValue="background" className="w-full">
          <div className="bg-zinc-900/30 border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto gap-0 border-0 overflow-x-auto scrollbar-none">
                {tabs.map(({ value, label, icon: Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="relative flex items-center gap-2 px-5 py-3.5 rounded-none border-0 border-b-2 border-transparent bg-transparent text-zinc-500 hover:text-white data-[state=active]:text-gold data-[state=active]:border-gold transition-all whitespace-nowrap text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          {/* ── Tab Content ── */}
          <div className="bg-black">
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
