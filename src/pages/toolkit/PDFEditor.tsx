import React, { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PDFDocument, degrees } from 'pdf-lib';
import { 
  ArrowLeft,
  Upload, 
  Download,
  FileText,
  Trash2,
  GripVertical,
  Plus,
  Merge,
  Split,
  Pen,
  Save,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface PDFPage {
  id: string;
  pageNumber: number;
  originalPageNumber: number;
  pdfIndex: number;
  selected: boolean;
  thumbnail?: string;
  rotation: number;
}

interface LoadedPDF {
  id: string;
  name: string;
  pageCount: number;
  data: Uint8Array;
}

interface PDFEditorProps { embedded?: boolean; }

export default function PDFEditor({ embedded = false }: PDFEditorProps) {
  const [loadedPDFs, setLoadedPDFs] = useState<LoadedPDF[]>([]);
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [signatureMode, setSignatureMode] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDrawingRef = useRef(false);

  // Handle PDF upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setIsLoading(true);

    try {
      for (const file of Array.from(files)) {
        if (file.type !== 'application/pdf') {
          toast.error(`${file.name} is not a PDF file`);
          continue;
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pageCount = pdfDoc.getPageCount();

        const newPdfId = crypto.randomUUID();
        const newPdf: LoadedPDF = {
          id: newPdfId,
          name: file.name,
          pageCount,
          data: new Uint8Array(arrayBuffer),
        };

        setLoadedPDFs(prev => [...prev, newPdf]);

        // Create page entries
        const existingPagesCount = pages.length;
        const newPages: PDFPage[] = [];
        
        for (let i = 0; i < pageCount; i++) {
          newPages.push({
            id: crypto.randomUUID(),
            pageNumber: existingPagesCount + i + 1,
            originalPageNumber: i + 1,
            pdfIndex: loadedPDFs.length,
            selected: false,
            rotation: 0,
          });
        }

        setPages(prev => [...prev, ...newPages]);
        toast.success(`Loaded ${file.name} (${pageCount} pages)`);
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast.error('Failed to load PDF');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [pages.length, loadedPDFs.length]);

  // Toggle page selection
  const togglePageSelection = (pageId: string) => {
    setPages(prev => prev.map(p => 
      p.id === pageId ? { ...p, selected: !p.selected } : p
    ));
  };

  // Select all pages
  const selectAllPages = () => {
    setPages(prev => prev.map(p => ({ ...p, selected: true })));
  };

  // Deselect all pages
  const deselectAllPages = () => {
    setPages(prev => prev.map(p => ({ ...p, selected: false })));
  };

  // Move page up
  const movePageUp = (index: number) => {
    if (index <= 0) return;
    setPages(prev => {
      const newPages = [...prev];
      [newPages[index - 1], newPages[index]] = [newPages[index], newPages[index - 1]];
      return newPages.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    });
  };

  // Move page down
  const movePageDown = (index: number) => {
    if (index >= pages.length - 1) return;
    setPages(prev => {
      const newPages = [...prev];
      [newPages[index], newPages[index + 1]] = [newPages[index + 1], newPages[index]];
      return newPages.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    });
  };

  // Rotate page
  const rotatePage = (pageId: string) => {
    setPages(prev => prev.map(p => 
      p.id === pageId ? { ...p, rotation: (p.rotation + 90) % 360 } : p
    ));
  };

  // Delete selected pages
  const deleteSelectedPages = () => {
    const selectedCount = pages.filter(p => p.selected).length;
    if (selectedCount === 0) {
      toast.error('No pages selected');
      return;
    }
    
    setPages(prev => prev
      .filter(p => !p.selected)
      .map((p, i) => ({ ...p, pageNumber: i + 1 }))
    );
    toast.success(`Deleted ${selectedCount} page(s)`);
  };

  // Export selected pages as new PDF
  const exportSelectedPages = async () => {
    const selectedPages = pages.filter(p => p.selected);
    if (selectedPages.length === 0) {
      toast.error('No pages selected');
      return;
    }

    setIsSaving(true);
    
    try {
      const newPdf = await PDFDocument.create();
      
      for (const page of selectedPages) {
        const sourcePdf = loadedPDFs[page.pdfIndex];
        if (!sourcePdf) continue;
        
        const srcDoc = await PDFDocument.load(sourcePdf.data);
        const [copiedPage] = await newPdf.copyPages(srcDoc, [page.originalPageNumber - 1]);
        
        if (page.rotation !== 0) {
          copiedPage.setRotation(degrees(page.rotation));
        }
        
        newPdf.addPage(copiedPage);
      }
      
      const pdfBytes = await newPdf.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `extracted-pages-${Date.now()}.pdf`;
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success(`Exported ${selectedPages.length} page(s)`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export pages');
    } finally {
      setIsSaving(false);
    }
  };

  // Export all pages as merged PDF
  const exportMergedPDF = async () => {
    if (pages.length === 0) {
      toast.error('No pages to export');
      return;
    }

    setIsSaving(true);
    
    try {
      const newPdf = await PDFDocument.create();
      
      for (const page of pages) {
        const sourcePdf = loadedPDFs[page.pdfIndex];
        if (!sourcePdf) continue;
        
        const srcDoc = await PDFDocument.load(sourcePdf.data);
        const [copiedPage] = await newPdf.copyPages(srcDoc, [page.originalPageNumber - 1]);
        
        if (page.rotation !== 0) {
          copiedPage.setRotation(degrees(page.rotation));
        }
        
        newPdf.addPage(copiedPage);
      }
      
      const pdfBytes = await newPdf.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `merged-document-${Date.now()}.pdf`;
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success('Merged PDF exported');
    } catch (error) {
      console.error('Merge error:', error);
      toast.error('Failed to merge PDF');
    } finally {
      setIsSaving(false);
    }
  };

  // Signature canvas handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!signatureCanvasRef.current) return;
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !signatureCanvasRef.current) return;
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    if (signatureCanvasRef.current) {
      setSignatureData(signatureCanvasRef.current.toDataURL());
    }
  };

  const clearSignature = () => {
    if (!signatureCanvasRef.current) return;
    const ctx = signatureCanvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, signatureCanvasRef.current.width, signatureCanvasRef.current.height);
    }
    setSignatureData(null);
  };

  const selectedCount = pages.filter(p => p.selected).length;

  return (
    <div style={{ background: "#0D0B08", minHeight: "100vh" }}>
      {/* Header - hidden when embedded in a suite tab */}
      {!embedded && (
        <header style={{ borderBottom: "1px solid rgba(201,168,76,0.18)", background: "rgba(201,168,76,0.03)" }}>
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/toolkit" className="flex items-center gap-2 transition-colors rounded-lg px-3 py-2" style={{ color: "rgba(255,255,255,0.45)", border: "1px solid rgba(201,168,76,0.2)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#fff"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"}>
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Toolkit</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isLoading}
                style={{ borderColor: "rgba(201,168,76,0.3)", color: "rgba(255,255,255,0.65)" }}>
                <Plus className="h-4 w-4 mr-2" />Add PDF
              </Button>
              <input ref={fileInputRef} type="file" accept=".pdf" multiple onChange={handleFileUpload} className="hidden" />
            </div>
          </div>
        </header>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", boxShadow: "0 0 32px rgba(201,168,76,0.15)" }}>
            <FileText className="h-8 w-8 text-gold" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">PDF Editor</h1>
          <p style={{ color: "rgba(255,255,255,0.4)" }}>Extract, reorder, merge PDFs and add signatures</p>
        </div>

        {pages.length === 0 ? (
          /* Upload Area */
          <div
            className="max-w-2xl mx-auto rounded-2xl p-12 text-center cursor-pointer transition-all duration-300"
            style={{ border: "2px dashed rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.02)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.6)"; (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.05)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.3)"; (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.02)"; }}
            onClick={() => fileInputRef.current?.click()}
          >
            {isLoading ? (
              <Loader2 className="h-12 w-12 text-gold mx-auto mb-4 animate-spin" />
            ) : (
              <Upload className="h-12 w-12 mx-auto mb-4" style={{ color: "rgba(201,168,76,0.5)" }} />
            )}
            <p className="text-white font-medium mb-2">{isLoading ? 'Loading PDF...' : 'Drop your PDF files here'}</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Upload one or more PDFs to get started</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Page Thumbnails */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.2)" }}>
                <div className="p-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(201,168,76,0.12)" }}>
                  <h3 className="text-sm font-semibold text-white">Pages ({pages.length})</h3>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={selectAllPages} className="h-7 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>All</Button>
                    <Button size="sm" variant="ghost" onClick={deselectAllPages} className="h-7 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>None</Button>
                  </div>
                </div>
                <ScrollArea className="h-[500px]">
                  <div className="p-2 space-y-2">
                    {pages.map((page, index) => (
                      <div
                        key={page.id}
                        className="p-3 rounded-xl cursor-pointer transition-all"
                        style={{
                          background: page.selected ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${page.selected ? "rgba(201,168,76,0.45)" : "rgba(255,255,255,0.08)"}`,
                        }}
                        onClick={() => togglePageSelection(page.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox checked={page.selected} className="data-[state=checked]:bg-gold data-[state=checked]:border-gold" />
                          <GripVertical className="h-4 w-4" style={{ color: "rgba(255,255,255,0.3)" }} />
                          <div className="flex-1">
                            <p className="text-sm text-white">Page {page.pageNumber}</p>
                            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                              From: {loadedPDFs[page.pdfIndex]?.name || 'Unknown'}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); movePageUp(index); }} disabled={index === 0} className="h-6 w-6 p-0" style={{ color: "rgba(255,255,255,0.4)" }}>
                              <ChevronLeft className="h-3 w-3 rotate-90" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); movePageDown(index); }} disabled={index === pages.length - 1} className="h-6 w-6 p-0" style={{ color: "rgba(255,255,255,0.4)" }}>
                              <ChevronRight className="h-3 w-3 rotate-90" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); rotatePage(page.id); }} className="h-6 w-6 p-0" style={{ color: "rgba(255,255,255,0.4)" }}>
                              <RotateCw className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {page.rotation !== 0 && <p className="text-xs text-gold mt-1">Rotated {page.rotation}°</p>}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="lg:col-span-3">
              <div className="grid gap-6">
                {/* Actions */}
                <div className="rounded-2xl p-6" style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.2)" }}>
                  <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button variant="outline" onClick={exportSelectedPages} disabled={selectedCount === 0 || isSaving}
                      style={{ borderColor: "rgba(201,168,76,0.3)", color: "rgba(255,255,255,0.65)" }}
                      className="hover:bg-gold hover:text-black hover:border-gold transition-all">
                      <Split className="h-4 w-4 mr-2" />Extract Selected ({selectedCount})
                    </Button>
                    <Button variant="outline" onClick={exportMergedPDF} disabled={pages.length === 0 || isSaving}
                      style={{ borderColor: "rgba(201,168,76,0.3)", color: "rgba(255,255,255,0.65)" }}
                      className="hover:bg-gold hover:text-black hover:border-gold transition-all">
                      <Merge className="h-4 w-4 mr-2" />Merge All Pages
                    </Button>
                    <Button variant="outline" onClick={deleteSelectedPages} disabled={selectedCount === 0}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected
                    </Button>
                    
                    <Button variant="outline" onClick={() => setSignatureMode(!signatureMode)}
                      style={{
                        borderColor: signatureMode ? "rgba(201,168,76,0.5)" : "rgba(201,168,76,0.3)",
                        color: signatureMode ? "#C9A84C" : "rgba(255,255,255,0.65)",
                        background: signatureMode ? "rgba(201,168,76,0.15)" : "transparent",
                      }}>
                      <Pen className="h-4 w-4 mr-2" />{signatureMode ? 'Close Signature' : 'Add Signature'}
                    </Button>
                  </div>
                </div>

                {/* Signature Panel */}
                {signatureMode && (
                  <div className="rounded-2xl p-6" style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.2)" }}>
                    <h3 className="text-lg font-semibold text-white mb-4">Draw Signature</h3>
                    <div className="bg-white rounded-xl p-2 mb-4">
                      <canvas ref={signatureCanvasRef} width={400} height={150}
                        className="rounded cursor-crosshair w-full border border-gray-200"
                        onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={clearSignature} style={{ borderColor: "rgba(201,168,76,0.3)", color: "rgba(255,255,255,0.65)" }}>Clear</Button>
                      <Button disabled={!signatureData} className="bg-gold text-black hover:bg-gold/90">
                        <Check className="h-4 w-4 mr-2" />Apply to Selected Pages
                      </Button>
                    </div>
                    <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.35)" }}>Draw your signature above, then apply it to selected pages.</p>
                  </div>
                )}

                {/* Loaded Files */}
                <div className="rounded-2xl p-6" style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.2)" }}>
                  <h3 className="text-lg font-semibold text-white mb-4">Loaded PDFs ({loadedPDFs.length})</h3>
                  <div className="space-y-2">
                    {loadedPDFs.map((pdf) => (
                      <div key={pdf.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <FileText className="h-5 w-5 text-gold" />
                        <div className="flex-1">
                          <p className="text-sm text-white">{pdf.name}</p>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{pdf.pageCount} pages</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 rounded-xl text-center" style={{ background: "rgba(201,168,76,0.03)", border: "1px solid rgba(201,168,76,0.12)" }}>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                    All processing is done locally in your browser · Projects are saved automatically
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
