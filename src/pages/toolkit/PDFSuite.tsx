/**
 * PDF & Documents Suite - Embeds REAL existing tool pages
 * Tabs: Editor (PDFEditor) | Photo→PDF (PdfFromPhotos)
 * ONLY real tool pages - removed Scan & Sign, Brochures (no real implementation)
 */

import React, { lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead } from '@/components/SEOHead';
import { FileText, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Lazy load REAL existing tool PAGES
const PDFEditor = lazy(() => import('@/pages/toolkit/PDFEditor'));
const PdfFromPhotos = lazy(() => import('@/pages/toolkit/PdfFromPhotos'));

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
        description="PDF editing, merging, splitting, and photo to PDF conversion tools."
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
                <FileText className="w-7 h-7 text-gold" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  PDF & Documents <span className="text-gold">Suite</span>
                </h1>
                <p className="text-zinc-400 text-sm">Edit, merge, split & convert to PDF</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - 2 tabs with REAL tools only */}
        <Tabs defaultValue="editor" className="flex flex-col">
          <div className="border-b border-gold/20 bg-zinc-900/50">
            <div className="max-w-7xl mx-auto px-4">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto gap-0">
                <TabsTrigger
                  value="editor"
                  className="relative px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">PDF Editor</span>
                </TabsTrigger>
                <TabsTrigger
                  value="photo-pdf"
                  className="relative px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Photo → PDF</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Tab Content - REAL TOOL PAGES embedded */}
          <div className="flex-1 overflow-auto">
            <TabsContent value="editor" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <PDFEditor />
              </Suspense>
            </TabsContent>

            <TabsContent value="photo-pdf" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <PdfFromPhotos />
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
}
