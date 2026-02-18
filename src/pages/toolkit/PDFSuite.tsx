/**
 * PDF & Documents Suite — Premium dark-gold design
 * Embeds: PDFEditor | PdfFromPhotos | ScanSignPage | BrochureGeneratorPage
 */

import React, { lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead } from '@/components/SEOHead';
import { FileText, Image as ImageIcon, Camera, BookOpen, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const PDFEditor = lazy(() => import('@/pages/toolkit/PDFEditor'));
const PdfFromPhotos = lazy(() => import('@/pages/toolkit/PdfFromPhotos'));
const ScanSignPage = lazy(() => import('@/pages/toolkit/ScanSignPage'));
const BrochureGeneratorPage = lazy(() => import('@/pages/toolkit/BrochureGeneratorPage'));

const LoadingSpinner = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-8 w-8 text-gold animate-spin" />
      <p className="text-zinc-500 text-sm">Loading tool...</p>
    </div>
  </div>
);

const tabs = [
  { value: "editor", label: "PDF Editor", icon: FileText },
  { value: "photo-pdf", label: "Photo → PDF", icon: ImageIcon },
  { value: "scan-sign", label: "Scan & Sign", icon: Camera },
  { value: "brochure", label: "Brochure Generator", icon: BookOpen },
];

export default function PDFSuite() {
  return (
    <>
      <SEOHead 
        title="PDF & Documents Suite | JBJ Creative Tools"
        description="PDF editing, merging, splitting, scanning, signing, and brochure generation tools."
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
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                <FileText className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                  PDF & Documents <span className="text-gold">Suite</span>
                </h1>
                <p className="text-zinc-500 text-sm mt-0.5">Edit · Scan · Sign · Generate professional PDFs</p>
              </div>
            </div>

            {/* Tabs bar lives inside suite header, content below */}
          </div>
        </div>

        {/* ── Tabs (wraps both trigger bar and content) ── */}
        <Tabs defaultValue="editor" className="w-full">
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
            <TabsContent value="editor" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <PDFEditor embedded />
              </Suspense>
            </TabsContent>

            <TabsContent value="photo-pdf" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <PdfFromPhotos embedded />
              </Suspense>
            </TabsContent>

            <TabsContent value="scan-sign" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <ScanSignPage />
              </Suspense>
            </TabsContent>

            <TabsContent value="brochure" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <BrochureGeneratorPage />
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
}
