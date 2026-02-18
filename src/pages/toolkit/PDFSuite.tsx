/**
 * PDF & Documents Suite - Embeds REAL existing tool pages
 * Tabs: Editor (PDFEditor) | Photo→PDF (PdfFromPhotos) | Scan & Sign | Brochure Generator
 * ALL real tool pages - no placeholders
 */

import React, { lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead } from '@/components/SEOHead';
import { FileText, Image as ImageIcon, Camera, BookOpen, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Lazy load REAL existing tool PAGES
const PDFEditor = lazy(() => import('@/pages/toolkit/PDFEditor'));
const PdfFromPhotos = lazy(() => import('@/pages/toolkit/PdfFromPhotos'));
const ScanSignPage = lazy(() => import('@/pages/toolkit/ScanSignPage'));
const BrochureGeneratorPage = lazy(() => import('@/pages/toolkit/BrochureGeneratorPage'));

const LoadingSpinner = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div>
  </div>
);

export default function PDFSuite() {
  return (
    <>
      <SEOHead 
        title="PDF & Documents Suite | JBJ Royal Tools"
        description="PDF editing, merging, splitting, scanning, signing, and brochure generation tools."
      />
      
      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="border-b border-gold/20 bg-gradient-to-r from-black via-zinc-900/50 to-black">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center gap-4 mb-4">
              <Link to="/toolkit">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600"
                  style={{ color: '#a1a1aa', backgroundColor: 'transparent' }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" style={{ color: '#a1a1aa' }} />
                  <span style={{ color: '#a1a1aa' }}>Back to Toolkit</span>
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-gold/40 flex items-center justify-center">
                <FileText className="w-7 h-7 text-gold" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  PDF & Documents <span className="text-gold">Suite</span>
                </h1>
                <p className="text-zinc-400 text-sm">Edit, scan, sign & generate professional PDFs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - 4 tabs with REAL tools */}
        <Tabs defaultValue="editor" className="flex flex-col">
          <div className="border-b border-gold/20 bg-zinc-900/50">
            <div className="max-w-7xl mx-auto px-4">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto gap-0 overflow-x-auto">
                <TabsTrigger
                  value="editor"
                  className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">PDF Editor</span>
                </TabsTrigger>
                <TabsTrigger
                  value="photo-pdf"
                  className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Photo → PDF</span>
                </TabsTrigger>
                <TabsTrigger
                  value="scan-sign"
                  className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">Scan & Sign</span>
                </TabsTrigger>
                <TabsTrigger
                  value="brochure"
                  className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Brochure</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Tab Content - REAL TOOL PAGES embedded */}
          <div className="flex-1 overflow-auto">
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
