/**
 * PDF & Documents Suite — Clean Professional White Theme
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
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <p className="text-xs text-muted-foreground">Loading tool...</p>
    </div>
  </div>
);

const tabs = [
  { value: "editor", label: "PDF Editor", shortLabel: "Editor", icon: FileText, color: "text-blue-600" },
  { value: "photo-pdf", label: "Photo → PDF", shortLabel: "Photo→PDF", icon: ImageIcon, color: "text-violet-600" },
  { value: "scan-sign", label: "Scan & Sign", shortLabel: "Sign", icon: Camera, color: "text-emerald-600" },
  { value: "brochure", label: "Document Creator", shortLabel: "Creator", icon: BookOpen, color: "text-indigo-600" },
];

export default function PDFSuite() {
  return (
    <>
      <SEOHead
        title="PDF & Documents Suite | JBJ Creative Tools"
        description="PDF editing, merging, splitting, scanning, signing, and brochure generation tools."
      />

      <div className="min-h-screen bg-[#FDFBF7]">
        {/* ── Suite Header ── */}
        <div className="border-b border-[#B89555]/30 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-0">
            {/* Back link */}
            <Link to="/toolkit"
              className="inline-flex items-center gap-1.5 text-xs mb-4 transition-colors group text-[#1A1A1A]/70 hover:text-[#1A1A1A]">
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to Tools Hub
            </Link>

            {/* Title row */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1A1A1A] leading-tight">
                  PDF & Documents <span className="text-blue-600">Suite</span>
                </h1>
                <p className="text-xs sm:text-sm mt-0.5 hidden sm:block text-[#1A1A1A]/70">
                  Edit · Scan · Sign · Generate professional documents
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="editor" className="w-full">
          {/* Tab Bar */}
          <div className="border-b border-[#B89555]/30 bg-[#FDFBF7]">
            <div className="max-w-7xl mx-auto px-2 sm:px-6">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto gap-0 border-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {tabs.map(({ value, label, shortLabel, icon: Icon, color }) => (
                  <TabsTrigger key={value} value={value}
                    className={`relative flex items-center gap-1.5 px-3 sm:px-5 py-3.5 rounded-none border-0 bg-transparent whitespace-nowrap text-xs sm:text-sm font-medium transition-all outline-none
                      data-[state=inactive]:text-[#1A1A1A]/70 data-[state=active]:text-blue-600
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-full after:transition-all
                      data-[state=inactive]:after:bg-transparent data-[state=active]:after:bg-blue-600`}
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
          <div className="bg-[#FDFBF7]">
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
