/**
 * PDF & Documents Suite - Master page for all PDF/document output tools
 * Tabs: Editor | Photo→PDF | Scan & Sign | Brochures
 */

import React, { useState, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead } from '@/components/SEOHead';
import { 
  FileText, ImageIcon, PenTool, Presentation, ArrowLeft, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const LoadingSpinner = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div>
  </div>
);

// PDF Editor Panel
const PDFEditorPanel = () => (
  <div className="p-8">
    <div className="max-w-3xl mx-auto text-center">
      <FileText className="w-16 h-16 text-gold mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">PDF Editor</h3>
      <p className="text-zinc-400 max-w-md mx-auto mb-6">
        Merge, split, reorder pages, add signatures, and edit PDF documents.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-6">
        {[
          { name: 'Merge PDFs', desc: 'Combine multiple files' },
          { name: 'Split Pages', desc: 'Extract specific pages' },
          { name: 'Reorder', desc: 'Drag to rearrange' },
          { name: 'Add Signature', desc: 'Sign documents' },
        ].map((feature) => (
          <div key={feature.name} className="p-4 bg-slate-800/50 rounded-lg border border-gold/20 hover:border-gold/50 transition-colors cursor-pointer">
            <p className="text-white font-medium text-sm">{feature.name}</p>
            <p className="text-zinc-500 text-xs mt-1">{feature.desc}</p>
          </div>
        ))}
      </div>
      <Link to="/toolkit/pdf-editor">
        <Button className="bg-gold text-black hover:bg-gold/90">
          Open PDF Editor
        </Button>
      </Link>
    </div>
  </div>
);

// Photo to PDF Panel
const PhotoToPDFPanel = () => (
  <div className="p-8">
    <div className="max-w-3xl mx-auto text-center">
      <ImageIcon className="w-16 h-16 text-gold mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">Photo → PDF Generator</h3>
      <p className="text-zinc-400 max-w-md mx-auto mb-6">
        Convert multiple photos to a professional PDF with custom layouts and title pages.
      </p>
      <div className="p-8 bg-slate-800/50 rounded-xl border-2 border-dashed border-gold/30 hover:border-gold/50 transition-colors cursor-pointer mb-6">
        <ImageIcon className="w-12 h-12 text-gold/60 mx-auto mb-3" />
        <p className="text-white font-medium">Drop photos here</p>
        <p className="text-zinc-500 text-sm mt-1">JPG, PNG, WebP - Multiple files supported</p>
      </div>
      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-6">
        {['A4 Portrait', 'A4 Landscape', 'Letter'].map((size) => (
          <div key={size} className="p-3 bg-slate-800/50 rounded-lg border border-gold/20 hover:border-gold/50 transition-colors cursor-pointer">
            <p className="text-sm text-white">{size}</p>
          </div>
        ))}
      </div>
      <Link to="/toolkit/pdf-from-photos">
        <Button className="bg-gold text-black hover:bg-gold/90">
          Open Photo to PDF
        </Button>
      </Link>
    </div>
  </div>
);

// Scan & Sign Panel
const ScanSignPanel = () => (
  <div className="p-8">
    <div className="max-w-3xl mx-auto text-center">
      <PenTool className="w-16 h-16 text-gold mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">Scan & Sign Documents</h3>
      <p className="text-zinc-400 max-w-md mx-auto mb-6">
        Scan documents using your camera, add signatures, dates, and annotations.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
        {[
          { name: 'Scan Document', desc: 'Use camera to scan', icon: '📷' },
          { name: 'Draw Signature', desc: 'Create your signature', icon: '✍️' },
          { name: 'Add Date', desc: 'Insert current date', icon: '📅' },
        ].map((feature) => (
          <div key={feature.name} className="p-4 bg-slate-800/50 rounded-lg border border-gold/20 hover:border-gold/50 transition-colors cursor-pointer">
            <span className="text-2xl mb-2 block">{feature.icon}</span>
            <p className="text-white font-medium text-sm">{feature.name}</p>
            <p className="text-zinc-500 text-xs mt-1">{feature.desc}</p>
          </div>
        ))}
      </div>
      <Link to="/document-scanner">
        <Button className="bg-gold text-black hover:bg-gold/90">
          Open Scan & Sign
        </Button>
      </Link>
    </div>
  </div>
);

// Brochure Generator Panel
const BrochurePanel = () => (
  <div className="p-8 text-center">
    <Presentation className="w-16 h-16 text-gold mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-white mb-2">Brochure Generators</h3>
    <p className="text-zinc-400 max-w-md mx-auto mb-6">
      Create professional property brochures, presentations, and marketing materials.
    </p>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-xl mx-auto mb-6">
      {[
        'Property Brochure',
        'Agent Profile',
        'Market Report',
        'Investment Summary',
        'Listing Presentation',
        'Company Profile',
      ].map((template) => (
        <div key={template} className="p-4 bg-slate-800/50 rounded-lg border border-gold/20 hover:border-gold/50 transition-colors cursor-pointer">
          <p className="text-white text-sm">{template}</p>
        </div>
      ))}
    </div>
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 text-gold text-sm">
      <Sparkles className="w-4 h-4" />
      Coming Soon
    </div>
  </div>
);

export default function PDFSuite() {
  const [activeTab, setActiveTab] = useState('editor');

  const tabs = [
    { id: 'editor', label: 'Editor', icon: FileText, description: 'Merge, split, sign' },
    { id: 'photo-pdf', label: 'Photo→PDF', icon: ImageIcon, description: 'Convert photos' },
    { id: 'scan-sign', label: 'Scan & Sign', icon: PenTool, description: 'Scan documents' },
    { id: 'brochures', label: 'Brochures', icon: Presentation, description: 'Generate materials' },
  ];

  return (
    <>
      <SEOHead 
        title="PDF & Documents Suite | JBJ Royal Tools"
        description="PDF editing, photo to PDF conversion, document scanning, and brochure generation tools."
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
                <p className="text-zinc-400 text-sm">
                  Edit, convert, scan & generate documents
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
          <div className="border-b border-gold/20 bg-zinc-900/50">
            <div className="max-w-7xl mx-auto px-4">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto gap-0">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="relative px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 bg-slate-950 min-h-[60vh]">
            <TabsContent value="editor" className="mt-0">
              <PDFEditorPanel />
            </TabsContent>

            <TabsContent value="photo-pdf" className="mt-0">
              <PhotoToPDFPanel />
            </TabsContent>

            <TabsContent value="scan-sign" className="mt-0">
              <ScanSignPanel />
            </TabsContent>

            <TabsContent value="brochures" className="mt-0">
              <BrochurePanel />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
}
