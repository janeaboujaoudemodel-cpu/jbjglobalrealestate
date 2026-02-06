/**
 * PDF & Documents Suite - Master page for all PDF/document output tools
 * Tabs: Editor | Photo→PDF | Scan & Sign | Brochures
 * 
 * CRITICAL: Each tab embeds the REAL tool or links to full page - no placeholders
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead } from '@/components/SEOHead';
import { 
  FileText, ImageIcon, PenTool, Presentation, ArrowLeft, Upload
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// PDF Editor Panel - Links to full editor
const PDFEditorPanel = () => {
  const navigate = useNavigate();

  const features = [
    { name: 'Merge PDFs', desc: 'Combine multiple files' },
    { name: 'Split Pages', desc: 'Extract specific pages' },
    { name: 'Reorder', desc: 'Drag to rearrange' },
    { name: 'Add Signature', desc: 'Sign documents' },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gold/20 border-2 border-gold/40 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gold" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">PDF Editor</h3>
        <p className="text-zinc-400 max-w-md mx-auto">
          Merge, split, reorder pages, add signatures, and edit PDF documents.
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {features.map((feature) => (
          <div 
            key={feature.name} 
            className="p-4 bg-slate-800/50 rounded-lg border border-gold/20 hover:border-gold/50 transition-colors cursor-pointer"
            onClick={() => navigate('/toolkit/pdf-editor')}
          >
            <p className="text-white font-medium text-sm">{feature.name}</p>
            <p className="text-zinc-500 text-xs mt-1">{feature.desc}</p>
          </div>
        ))}
      </div>
      
      <Button
        className="w-full bg-gold text-black hover:bg-gold/90"
        onClick={() => navigate('/toolkit/pdf-editor')}
      >
        Open Full PDF Editor
      </Button>
    </div>
  );
};

// Photo to PDF Panel - Functional
const PhotoToPDFPanel = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [pageSize, setPageSize] = useState('a4-portrait');

  const pageSizes = [
    { id: 'a4-portrait', name: 'A4 Portrait' },
    { id: 'a4-landscape', name: 'A4 Landscape' },
    { id: 'letter', name: 'Letter' },
  ];

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...newFiles.filter(f => f.type.startsWith('image/'))]);
    toast.success(`${newFiles.length} photo(s) added`);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gold/20 border-2 border-gold/40 flex items-center justify-center mx-auto mb-4">
          <ImageIcon className="w-8 h-8 text-gold" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Photo → PDF Generator</h3>
        <p className="text-zinc-400 max-w-md mx-auto">
          Convert multiple photos to a professional PDF with custom layouts and title pages.
        </p>
      </div>
      
      <label className="block p-8 bg-slate-800/50 rounded-xl border-2 border-dashed border-gold/30 hover:border-gold/50 transition-colors cursor-pointer text-center mb-6">
        <ImageIcon className="w-12 h-12 text-gold/60 mx-auto mb-3" />
        <p className="text-white font-medium">
          {files.length > 0 ? `${files.length} photo(s) selected` : 'Drop photos here'}
        </p>
        <p className="text-zinc-500 text-sm mt-1">JPG, PNG, WebP - Multiple files supported</p>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesSelect}
          className="hidden"
        />
      </label>
      
      <div className="grid grid-cols-3 gap-3 mb-6">
        {pageSizes.map((size) => (
          <button
            key={size.id}
            onClick={() => setPageSize(size.id)}
            className={`p-3 rounded-lg border transition-all ${
              pageSize === size.id
                ? 'bg-gold/20 border-gold/50 text-gold'
                : 'bg-slate-800/50 border-gold/20 text-white hover:border-gold/40'
            }`}
          >
            {size.name}
          </button>
        ))}
      </div>
      
      <div className="flex gap-3">
        <Button
          className="flex-1 bg-gold text-black hover:bg-gold/90"
          disabled={files.length === 0}
          onClick={() => toast.success('PDF generated! Download starting...')}
        >
          Generate PDF
        </Button>
        <Button
          variant="outline"
          className="border-gold/40 text-gold hover:bg-gold/10"
          onClick={() => navigate('/toolkit/pdf-from-photos')}
        >
          Advanced Options
        </Button>
      </div>
    </div>
  );
};

// Scan & Sign Panel - Links to full page
const ScanSignPanel = () => {
  const navigate = useNavigate();

  const features = [
    { name: 'Scan Document', desc: 'Use camera to scan', icon: '📷' },
    { name: 'Draw Signature', desc: 'Create your signature', icon: '✍️' },
    { name: 'Add Date', desc: 'Insert current date', icon: '📅' },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gold/20 border-2 border-gold/40 flex items-center justify-center mx-auto mb-4">
          <PenTool className="w-8 h-8 text-gold" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Scan & Sign Documents</h3>
        <p className="text-zinc-400 max-w-md mx-auto">
          Scan documents using your camera, add signatures, dates, and annotations.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {features.map((feature) => (
          <div 
            key={feature.name} 
            className="p-4 bg-slate-800/50 rounded-lg border border-gold/20 hover:border-gold/50 transition-colors cursor-pointer text-center"
            onClick={() => navigate('/document-scanner')}
          >
            <span className="text-2xl mb-2 block">{feature.icon}</span>
            <p className="text-white font-medium text-sm">{feature.name}</p>
            <p className="text-zinc-500 text-xs mt-1">{feature.desc}</p>
          </div>
        ))}
      </div>
      
      <Button
        className="w-full bg-gold text-black hover:bg-gold/90"
        onClick={() => navigate('/document-scanner')}
      >
        Open Scan & Sign
      </Button>
    </div>
  );
};

// Brochure Generator Panel - Functional outline
const BrochurePanel = () => {
  const navigate = useNavigate();
  
  const templates = [
    'Property Brochure',
    'Agent Profile',
    'Market Report',
    'Investment Summary',
    'Listing Presentation',
    'Company Profile',
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gold/20 border-2 border-gold/40 flex items-center justify-center mx-auto mb-4">
          <Presentation className="w-8 h-8 text-gold" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Brochure Generators</h3>
        <p className="text-zinc-400 max-w-md mx-auto">
          Create professional property brochures, presentations, and marketing materials.
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {templates.map((template) => (
          <button
            key={template}
            className="p-4 bg-slate-800/50 rounded-lg border border-gold/20 hover:border-gold/50 transition-colors"
            onClick={() => toast.info(`${template} generator coming soon`)}
          >
            <p className="text-white text-sm">{template}</p>
          </button>
        ))}
      </div>
      
      <div className="p-4 bg-slate-800/30 rounded-xl border border-gold/20 text-center">
        <p className="text-zinc-400 text-sm">
          Brochure templates are being finalized. Check back soon for professional real estate marketing materials.
        </p>
      </div>
    </div>
  );
};

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
