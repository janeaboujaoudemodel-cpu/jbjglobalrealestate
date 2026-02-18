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
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-7 w-7 text-gold animate-spin" />
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Loading tool...</p>
    </div>
  </div>
);

const tabs = [
  { value: "editor", label: "PDF Editor", shortLabel: "Editor", icon: FileText },
  { value: "photo-pdf", label: "Photo → PDF", shortLabel: "Photo→PDF", icon: ImageIcon },
  { value: "scan-sign", label: "Scan & Sign", shortLabel: "Sign", icon: Camera },
  { value: "brochure", label: "Brochure Generator", shortLabel: "Brochure", icon: BookOpen },
];

export default function PDFSuite() {
  return (
    <>
      <SEOHead
        title="PDF & Documents Suite | JBJ Creative Tools"
        description="PDF editing, merging, splitting, scanning, signing, and brochure generation tools."
      />

      <div className="min-h-screen" style={{ background: "#0A0A0B" }}>

        {/* ── Suite Header ── */}
        <div style={{ background: "linear-gradient(180deg, rgba(232,168,74,0.06) 0%, transparent 100%)", borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-0">
            {/* Back link */}
            <Link to="/toolkit" className="inline-flex items-center gap-1.5 text-xs mb-4 transition-colors group"
              style={{ color: "rgba(255,255,255,0.4)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"}>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to Toolkit
            </Link>

            {/* Title row */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(232,168,74,0.1)", border: "1px solid rgba(232,168,74,0.3)", boxShadow: "0 0 28px rgba(232,168,74,0.1)" }}>
                <FileText className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: "#E8A84A" }} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">
                  PDF & Documents <span className="text-gold">Suite</span>
                </h1>
                <p className="text-xs sm:text-sm mt-0.5 hidden sm:block" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Edit · Scan · Sign · Generate professional PDFs
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="editor" className="w-full">
          {/* Tab Bar */}
          <div style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="max-w-7xl mx-auto px-2 sm:px-6">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto gap-0 border-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {tabs.map(({ value, label, shortLabel, icon: Icon }) => (
                  <TabsTrigger key={value} value={value}
                    className="relative flex items-center gap-1.5 px-3 sm:px-5 py-3.5 rounded-none border-0 bg-transparent whitespace-nowrap text-xs sm:text-sm font-medium transition-all outline-none"
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
          <div style={{ background: "#0A0A0B" }}>
            <TabsContent value="editor" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}><PDFEditor embedded /></Suspense>
            </TabsContent>
            <TabsContent value="photo-pdf" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}><PdfFromPhotos embedded /></Suspense>
            </TabsContent>
            <TabsContent value="scan-sign" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}><ScanSignPage /></Suspense>
            </TabsContent>
            <TabsContent value="brochure" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}><BrochureGeneratorPage /></Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
}
