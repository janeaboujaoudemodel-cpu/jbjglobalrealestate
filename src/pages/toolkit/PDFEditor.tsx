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

  // Handle PDF upload from input
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    await processFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // Handle drop
  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (!files.length) { toast.error('Please drop PDF files only'); return; }
    await processFiles(files);
  }, []);

  const processFiles = async (files: File[]) => {
    setIsLoading(true);
    try {
      // Snapshot the current counts BEFORE any async work to avoid stale closure issues
      const startingPdfCount = loadedPDFs.length;
      const newPdfs: LoadedPDF[] = [];
      // Build pages fully outside setState — each page gets final pdfIndex and a stable UUID
      const allNewPages: Omit<PDFPage, 'pageNumber'>[] = [];

      for (const file of files) {
        if (file.type !== 'application/pdf') {
          toast.error(`${file.name} is not a PDF file`);
          continue;
        }
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pageCount = pdfDoc.getPageCount();
        const newPdf: LoadedPDF = {
          id: crypto.randomUUID(),
          name: file.name,
          pageCount,
          data: new Uint8Array(arrayBuffer),
        };
        const pdfIndex = startingPdfCount + newPdfs.length; // correct relative index
        newPdfs.push(newPdf);
        for (let i = 0; i < pageCount; i++) {
          allNewPages.push({
            id: crypto.randomUUID(),
            originalPageNumber: i + 1,
            pdfIndex,
            selected: false,
            rotation: 0,
          });
        }
        toast.success(`Loaded ${file.name} (${pageCount} pages)`);
      }

      if (newPdfs.length === 0) return;

      // TWO independent setState calls — never nested — React Strict Mode safe
      setLoadedPDFs(prev => [...prev, ...newPdfs]);
      setPages(prev => {
        const base = prev.length;
        return [
          ...prev,
          ...allNewPages.map((p, i) => ({ ...p, pageNumber: base + i + 1 })),
        ];
      });
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast.error('Failed to load PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePageSelection = (pageId: string) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, selected: !p.selected } : p));
  };

  const selectAllPages = () => setPages(prev => prev.map(p => ({ ...p, selected: true })));
  const deselectAllPages = () => setPages(prev => prev.map(p => ({ ...p, selected: false })));

  const movePageUp = (index: number) => {
    if (index <= 0) return;
    setPages(prev => {
      const newPages = [...prev];
      [newPages[index - 1], newPages[index]] = [newPages[index], newPages[index - 1]];
      return newPages.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    });
  };

  const movePageDown = (index: number) => {
    if (index >= pages.length - 1) return;
    setPages(prev => {
      const newPages = [...prev];
      [newPages[index], newPages[index + 1]] = [newPages[index + 1], newPages[index]];
      return newPages.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    });
  };

  const rotatePage = (pageId: string) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, rotation: (p.rotation + 90) % 360 } : p));
  };

  const deleteSelectedPages = () => {
    const selectedCount = pages.filter(p => p.selected).length;
    if (selectedCount === 0) { toast.error('No pages selected'); return; }
    setPages(prev => prev.filter(p => !p.selected).map((p, i) => ({ ...p, pageNumber: i + 1 })));
    toast.success(`Deleted ${selectedCount} page(s)`);
  };

  const exportSelectedPages = async () => {
    const selectedPages = pages.filter(p => p.selected);
    if (selectedPages.length === 0) { toast.error('No pages selected'); return; }
    setIsSaving(true);
    try {
      const newPdf = await PDFDocument.create();
      for (const page of selectedPages) {
        const sourcePdf = loadedPDFs[page.pdfIndex];
        if (!sourcePdf) continue;
        const srcDoc = await PDFDocument.load(sourcePdf.data);
        const [copiedPage] = await newPdf.copyPages(srcDoc, [page.originalPageNumber - 1]);
        if (page.rotation !== 0) copiedPage.setRotation(degrees(page.rotation));
        newPdf.addPage(copiedPage);
      }
      const pdfBytes = await newPdf.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `extracted-pages-${Date.now()}.pdf`; link.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${selectedPages.length} page(s)`);
    } catch (error) {
      toast.error('Failed to export pages');
    } finally {
      setIsSaving(false);
    }
  };

  const exportMergedPDF = async () => {
    if (pages.length === 0) { toast.error('No pages to export'); return; }
    setIsSaving(true);
    try {
      const newPdf = await PDFDocument.create();
      for (const page of pages) {
        const sourcePdf = loadedPDFs[page.pdfIndex];
        if (!sourcePdf) continue;
        const srcDoc = await PDFDocument.load(sourcePdf.data);
        const [copiedPage] = await newPdf.copyPages(srcDoc, [page.originalPageNumber - 1]);
        if (page.rotation !== 0) copiedPage.setRotation(degrees(page.rotation));
        newPdf.addPage(copiedPage);
      }
      const pdfBytes = await newPdf.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `merged-document-${Date.now()}.pdf`; link.click();
      URL.revokeObjectURL(url);
      toast.success('Merged PDF exported');
    } catch (error) {
      toast.error('Failed to merge PDF');
    } finally {
      setIsSaving(false);
    }
  };

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
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#1e1b4b';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    if (signatureCanvasRef.current) setSignatureData(signatureCanvasRef.current.toDataURL());
  };

  const clearSignature = () => {
    if (!signatureCanvasRef.current) return;
    const ctx = signatureCanvasRef.current.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, signatureCanvasRef.current.width, signatureCanvasRef.current.height);
    setSignatureData(null);
  };

  const selectedCount = pages.filter(p => p.selected).length;

  // Always render the file input so it works in embedded mode too
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept=".pdf"
      multiple
      onChange={handleFileUpload}
      className="hidden"
    />
  );

  const indigo = {
    bg: "rgba(99,102,241,0.06)",
    border: "rgba(99,102,241,0.2)",
    borderHover: "rgba(99,102,241,0.5)",
    text: "#818CF8",
    accent: "#6366F1",
  };

  return (
    <div style={{ background: "#0C0E14", minHeight: "100vh" }}>
      {/* Always-rendered file input — works in both embedded and standalone mode */}
      {fileInput}

      {/* Header - hidden when embedded in a suite tab */}
      {!embedded && (
        <header style={{ borderBottom: `1px solid ${indigo.border}`, background: indigo.bg }}>
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/toolkit" className="flex items-center gap-2 transition-colors rounded-lg px-3 py-2"
              style={{ color: "rgba(255,255,255,0.45)", border: `1px solid ${indigo.border}` }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#fff"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"}>
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Toolkit</span>
            </Link>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isLoading}
              style={{ borderColor: indigo.border, color: "rgba(255,255,255,0.65)", background: "transparent" }}>
              <Plus className="h-4 w-4 mr-2" />Add PDF
            </Button>
          </div>
        </header>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "rgba(99,102,241,0.12)", border: `1px solid ${indigo.border}`, boxShadow: "0 0 32px rgba(99,102,241,0.2)" }}>
            <FileText className="h-8 w-8" style={{ color: indigo.text }} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">PDF Editor</h1>
          <p style={{ color: "rgba(255,255,255,0.4)" }}>Upload, reorder, merge, split PDFs and add signatures</p>
        </div>

        {pages.length === 0 ? (
          /* Upload Area */
          <div
            className="max-w-2xl mx-auto rounded-2xl p-12 text-center cursor-pointer transition-all duration-300"
            style={{ border: `2px dashed ${indigo.border}`, background: indigo.bg }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = indigo.borderHover; (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.1)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = indigo.border; (e.currentTarget as HTMLElement).style.background = indigo.bg; }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {isLoading ? (
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" style={{ color: indigo.text }} />
            ) : (
              <Upload className="h-12 w-12 mx-auto mb-4" style={{ color: "rgba(99,102,241,0.55)" }} />
            )}
            <p className="text-white font-semibold text-lg mb-2">{isLoading ? 'Loading PDF...' : 'Drop your PDF files here'}</p>
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>or click to browse your files</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
              style={{ background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", boxShadow: "0 4px 16px rgba(99,102,241,0.4)" }}>
              <Upload className="h-4 w-4" />
              Browse PDF Files
            </div>
            <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.25)" }}>Supports multiple PDFs · All processing is local in your browser</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Page Thumbnails */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(99,102,241,0.04)", border: `1px solid ${indigo.border}` }}>
                <div className="p-3 flex items-center justify-between" style={{ borderBottom: `1px solid rgba(99,102,241,0.12)` }}>
                  <h3 className="text-sm font-semibold text-white">Pages ({pages.length})</h3>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={selectAllPages} className="h-7 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>All</Button>
                    <Button size="sm" variant="ghost" onClick={deselectAllPages} className="h-7 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>None</Button>
                  </div>
                </div>
                <ScrollArea className="h-[500px]">
                  <div className="p-2 space-y-2">
                    {pages.map((page, index) => (
                      <div key={page.id}
                        className="rounded-xl cursor-pointer transition-all overflow-hidden"
                        style={{
                          background: page.selected ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.03)",
                          border: `${page.selected ? "2px" : "1px"} solid ${page.selected ? "rgba(99,102,241,0.7)" : "rgba(255,255,255,0.07)"}`,
                          boxShadow: page.selected ? "0 0 16px rgba(99,102,241,0.25)" : "none",
                        }}
                        onClick={() => togglePageSelection(page.id)}>
                        <div className="p-3 flex items-center gap-2">
                          {/* stopPropagation prevents checkbox click from double-toggling via parent div */}
                          <Checkbox
                            checked={page.selected}
                            onClick={(e) => e.stopPropagation()}
                            onCheckedChange={() => togglePageSelection(page.id)}
                            className="data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                                style={{ background: page.selected ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.08)", color: page.selected ? "#A5B4FC" : "rgba(255,255,255,0.55)" }}>
                                #{page.pageNumber}
                              </span>
                              <p className="text-sm font-medium text-white">Page {page.pageNumber}</p>
                            </div>
                            <p className="text-[10px] truncate mt-0.5" style={{ color: "rgba(255,255,255,0.32)" }}>
                              {loadedPDFs[page.pdfIndex]?.name || 'Unknown'}
                            </p>
                          </div>
                          <div className="flex gap-0.5 shrink-0">
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); movePageUp(index); }} disabled={index === 0}
                              className="h-7 w-7 p-0 rounded-lg disabled:opacity-30"
                              style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.05)" }}>
                              <ChevronLeft className="h-3.5 w-3.5 rotate-90" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); movePageDown(index); }} disabled={index === pages.length - 1}
                              className="h-7 w-7 p-0 rounded-lg disabled:opacity-30"
                              style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.05)" }}>
                              <ChevronRight className="h-3.5 w-3.5 rotate-90" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); rotatePage(page.id); }}
                              className="h-7 w-7 p-0 rounded-lg"
                              style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.05)" }}>
                              <RotateCw className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        {page.rotation !== 0 && (
                          <div className="px-3 pb-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(99,102,241,0.2)", color: indigo.text }}>
                              ↻ {page.rotation}°
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="lg:col-span-3 space-y-6">
              {/* Add more button */}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isLoading}
                  style={{ borderColor: indigo.border, color: "rgba(255,255,255,0.65)", background: "transparent" }}>
                  <Plus className="h-4 w-4 mr-2" />Add More PDFs
                </Button>
              </div>

              {/* Actions */}
              <div className="rounded-2xl p-6" style={{ background: "rgba(99,102,241,0.04)", border: `1px solid ${indigo.border}` }}>
                <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button variant="outline" onClick={exportSelectedPages} disabled={selectedCount === 0 || isSaving}
                    className="transition-all hover:text-white"
                    style={{ borderColor: indigo.border, color: "rgba(255,255,255,0.65)", background: "transparent" }}>
                    <Split className="h-4 w-4 mr-2" />Extract ({selectedCount})
                  </Button>
                  <Button variant="outline" onClick={exportMergedPDF} disabled={pages.length === 0 || isSaving}
                    className="transition-all hover:text-white"
                    style={{ borderColor: indigo.border, color: "rgba(255,255,255,0.65)", background: "transparent" }}>
                    <Merge className="h-4 w-4 mr-2" />Merge All
                  </Button>
                  <Button variant="outline" onClick={deleteSelectedPages} disabled={selectedCount === 0}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500 bg-transparent">
                    <Trash2 className="h-4 w-4 mr-2" />Delete Selected
                  </Button>
                  <Button variant="outline" onClick={() => setSignatureMode(!signatureMode)}
                    style={{
                      borderColor: signatureMode ? "rgba(99,102,241,0.6)" : indigo.border,
                      color: signatureMode ? indigo.text : "rgba(255,255,255,0.65)",
                      background: signatureMode ? "rgba(99,102,241,0.12)" : "transparent",
                    }}>
                    <Pen className="h-4 w-4 mr-2" />{signatureMode ? 'Close Signature' : 'Add Signature'}
                  </Button>
                </div>
              </div>

              {/* Signature Panel */}
              {signatureMode && (
                <div className="rounded-2xl p-6" style={{ background: "rgba(99,102,241,0.04)", border: `1px solid ${indigo.border}` }}>
                  <h3 className="text-lg font-semibold text-white mb-4">Draw Signature</h3>
                  <div className="bg-white rounded-xl p-2 mb-4">
                    <canvas ref={signatureCanvasRef} width={400} height={150}
                      className="rounded cursor-crosshair w-full border border-gray-200"
                      onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={clearSignature} style={{ borderColor: indigo.border, color: "rgba(255,255,255,0.65)", background: "transparent" }}>Clear</Button>
                    <Button disabled={!signatureData} style={{ background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", color: "white" }}>
                      <Check className="h-4 w-4 mr-2" />Apply to Selected Pages
                    </Button>
                  </div>
                  <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.35)" }}>Draw your signature above, then apply it to selected pages.</p>
                </div>
              )}

              {/* Loaded Files */}
              <div className="rounded-2xl p-6" style={{ background: "rgba(99,102,241,0.04)", border: `1px solid ${indigo.border}` }}>
                <h3 className="text-lg font-semibold text-white mb-4">Loaded PDFs ({loadedPDFs.length})</h3>
                <div className="space-y-2">
                  {loadedPDFs.map((pdf) => (
                    <div key={pdf.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <FileText className="h-5 w-5" style={{ color: indigo.text }} />
                      <div className="flex-1">
                        <p className="text-sm text-white">{pdf.name}</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{pdf.pageCount} pages</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="p-4 rounded-xl text-center" style={{ background: "rgba(99,102,241,0.03)", border: "1px solid rgba(99,102,241,0.1)" }}>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                  All processing is done locally in your browser · No files are uploaded to servers
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
