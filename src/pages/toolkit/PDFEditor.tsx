import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PDFDocument, degrees } from 'pdf-lib';
import { SaveProjectBar, ToolContentWrapper } from '@/components/toolkit/SaveProjectBar';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft, Upload, Download, FileText, Trash2, Plus, Merge, Split, Pen, Save,
  Check, Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Eye,
  Sparkles, ScanLine, Wand2, Hash, Droplets, Undo, Redo,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

/* ── Champagne-Gold palette ── */
const G = {
  gold: "#C8A766",
  goldBright: "#E4C47A",
  goldDim: "#A08040",
  bg: "rgba(200,167,102,0.06)",
  bgHover: "rgba(200,167,102,0.12)",
  border: "rgba(200,167,102,0.22)",
  borderHover: "rgba(200,167,102,0.55)",
  glow: "rgba(200,167,102,0.18)",
  text: "#C8A766",
  surface: "#0E1018",
  surfaceCard: "#111520",
  btnGradient: "linear-gradient(135deg, #A08040, #C8A766)",
  btnShadow: "0 4px 20px rgba(200,167,102,0.3)",
};

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

interface HistoryEntry {
  pages: PDFPage[];
}

interface PDFEditorProps { embedded?: boolean; }

export default function PDFEditor({ embedded = false }: PDFEditorProps) {
  const [projectName, setProjectName] = useState('PDF Project');
  const [loadedPDFs, setLoadedPDFs] = useState<LoadedPDF[]>([]);
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [signatureMode, setSignatureMode] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState<PDFPage | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [watermarkText, setWatermarkText] = useState('');
  const [addPageNumbers, setAddPageNumbers] = useState(false);

  // Undo/Redo
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDrawingRef = useRef(false);
  const previewUrlRef = useRef<string | null>(null);

  const pushHistory = useCallback((newPages: PDFPage[]) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, { pages: JSON.parse(JSON.stringify(newPages)) }];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const prev = history[historyIndex - 1];
    setPages(prev.pages);
    setHistoryIndex(i => i - 1);
    toast.success('Undone');
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    setPages(next.pages);
    setHistoryIndex(i => i + 1);
    toast.success('Redone');
  }, [history, historyIndex]);

  const updatePages = useCallback((updater: (prev: PDFPage[]) => PDFPage[]) => {
    setPages(prev => {
      const newPages = updater(prev);
      pushHistory(newPages);
      return newPages;
    });
  }, [pushHistory]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    await processFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (!files.length) { toast.error('Please drop PDF files only'); return; }
    await processFiles(files);
  }, []);

  const processFiles = async (files: File[]) => {
    setIsLoading(true);
    try {
      const startingPdfCount = loadedPDFs.length;
      const newPdfs: LoadedPDF[] = [];
      const allNewPages: Omit<PDFPage, 'pageNumber'>[] = [];

      for (const file of files) {
        if (file.type !== 'application/pdf') { toast.error(`${file.name} is not a PDF file`); continue; }
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pageCount = pdfDoc.getPageCount();
        const newPdf: LoadedPDF = { id: crypto.randomUUID(), name: file.name, pageCount, data: new Uint8Array(arrayBuffer) };
        const pdfIndex = startingPdfCount + newPdfs.length;
        newPdfs.push(newPdf);
        for (let i = 0; i < pageCount; i++) {
          allNewPages.push({ id: crypto.randomUUID(), originalPageNumber: i + 1, pdfIndex, selected: false, rotation: 0 });
        }
        toast.success(`Loaded ${file.name} (${pageCount} pages)`);
      }

      if (newPdfs.length === 0) return;
      setLoadedPDFs(prev => [...prev, ...newPdfs]);
      setPages(prev => {
        const base = prev.length;
        const newP = [...prev, ...allNewPages.map((p, i) => ({ ...p, pageNumber: base + i + 1 }))];
        pushHistory(newP);
        return newP;
      });
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast.error('Failed to load PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePageSelection = (pageId: string) => updatePages(prev => prev.map(p => p.id === pageId ? { ...p, selected: !p.selected } : p));
  const selectAllPages = () => updatePages(prev => prev.map(p => ({ ...p, selected: true })));
  const deselectAllPages = () => updatePages(prev => prev.map(p => ({ ...p, selected: false })));

  const movePageUp = (index: number) => {
    if (index <= 0) return;
    updatePages(prev => {
      const n = [...prev]; [n[index - 1], n[index]] = [n[index], n[index - 1]];
      return n.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    });
  };

  const movePageDown = (index: number) => {
    if (index >= pages.length - 1) return;
    updatePages(prev => {
      const n = [...prev]; [n[index], n[index + 1]] = [n[index + 1], n[index]];
      return n.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    });
  };

  const rotatePage = (pageId: string) => updatePages(prev => prev.map(p => p.id === pageId ? { ...p, rotation: (p.rotation + 90) % 360 } : p));

  const deleteSelectedPages = () => {
    const selectedCount = pages.filter(p => p.selected).length;
    if (selectedCount === 0) { toast.error('No pages selected'); return; }
    updatePages(prev => prev.filter(p => !p.selected).map((p, i) => ({ ...p, pageNumber: i + 1 })));
    setPreviewPage(prev => { if (prev && !pages.find(p => p.id === prev.id && !p.selected)) return null; return prev; });
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
    } catch { toast.error('Failed to export pages'); }
    finally { setIsSaving(false); }
  };

  const exportMergedPDF = async () => {
    if (pages.length === 0) { toast.error('No pages to export'); return; }
    setIsSaving(true);
    try {
      const newPdf = await PDFDocument.create();
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
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
    } catch { toast.error('Failed to merge PDF'); }
    finally { setIsSaving(false); }
  };

  // ── AI OCR Extract ──
  const handleOCRExtract = async () => {
    if (!previewPage) { toast.error('Select a page first'); return; }
    setOcrLoading(true);
    setOcrText(null);
    try {
      // Render the page to an image for OCR
      const sourcePdf = loadedPDFs[previewPage.pdfIndex];
      if (!sourcePdf) throw new Error('Source PDF not found');
      const srcDoc = await PDFDocument.load(sourcePdf.data);
      const singleDoc = await PDFDocument.create();
      const [copied] = await singleDoc.copyPages(srcDoc, [previewPage.originalPageNumber - 1]);
      singleDoc.addPage(copied);
      const bytes = await singleDoc.save();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));

      const { data, error } = await supabase.functions.invoke('document-ocr', {
        body: { file_base64: base64, file_type: 'application/pdf', action: 'extract' },
      });
      if (error) throw error;
      setOcrText(data?.text || 'No text found');
      toast.success('Text extracted successfully');
    } catch (err: any) {
      toast.error(err?.message || 'OCR extraction failed');
    } finally {
      setOcrLoading(false);
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

  useEffect(() => {
    if (pages.length > 0 && !previewPage) setPreviewPage({ ...pages[0] });
  }, [pages.length]);

  useEffect(() => {
    if (!previewPage) return;
    const updated = pages.find(p => p.id === previewPage.id);
    if (updated && updated.rotation !== previewPage.rotation) setPreviewPage({ ...updated });
  }, [pages]);

  useEffect(() => {
    if (!previewPage) return;
    let cancelled = false;
    setPreviewLoading(true);
    (async () => {
      try {
        const sourcePdf = loadedPDFs[previewPage.pdfIndex];
        if (!sourcePdf) return;
        const srcDoc = await PDFDocument.load(sourcePdf.data);
        const singleDoc = await PDFDocument.create();
        const [copied] = await singleDoc.copyPages(srcDoc, [previewPage.originalPageNumber - 1]);
        if (previewPage.rotation !== 0) copied.setRotation(degrees(previewPage.rotation));
        singleDoc.addPage(copied);
        const bytes = await singleDoc.save();
        if (cancelled) return;
        const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        setPreviewUrl(url);
      } catch (e) { console.error('Preview error', e); }
      finally { if (!cancelled) setPreviewLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [previewPage]);

  const selectedCount = pages.filter(p => p.selected).length;

  const fileInput = (
    <input ref={fileInputRef} type="file" accept=".pdf" multiple onChange={handleFileUpload} className="hidden" />
  );

  return (
    <div style={{ background: G.surface, minHeight: "100vh" }}>
      {fileInput}

      {!embedded && (
        <header style={{ borderBottom: `1px solid ${G.border}`, background: G.bg }}>
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/toolkit" className="flex items-center gap-2 transition-colors rounded-lg px-3 py-2"
              style={{ color: "rgba(255,255,255,0.45)", border: `1px solid ${G.border}` }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#fff"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"}>
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Royal Tools Hub</span>
            </Link>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isLoading}
              style={{ borderColor: G.border, color: "rgba(255,255,255,0.65)", background: "transparent" }}>
              <Plus className="h-4 w-4 mr-2" />Add PDF
            </Button>
          </div>
        </header>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: G.bg, border: `1px solid ${G.border}`, boxShadow: `0 0 32px ${G.glow}` }}>
            <FileText className="h-8 w-8" style={{ color: G.gold }} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">PDF Editor</h1>
          <p style={{ color: "rgba(255,255,255,0.4)" }}>Upload, reorder, merge, split PDFs · AI OCR · Signatures</p>
        </div>

        {/* Save Project Bar */}
        <div className="mb-5">
          <SaveProjectBar
            projectName={projectName}
            onNameChange={setProjectName}
            onSave={() => {
              if (!pages.length) { toast.error('Nothing to save'); return; }
              localStorage.setItem(`pdf-project-${Date.now()}`, JSON.stringify({ name: projectName, savedAt: new Date().toISOString() }));
              toast.success(`Project "${projectName}" saved!`);
            }}
            onClear={() => {
              if (!confirm('Clear this project?')) return;
              setPages([]); setLoadedPDFs([]); setSignatureData(null);
              setPreviewPage(null); setProjectName('PDF Project'); setOcrText(null);
              setHistory([]); setHistoryIndex(-1);
              toast.success('Project cleared');
            }}
            canSave={pages.length > 0}
            accentColor={G.gold}
            accentBorder={G.border}
          />
        </div>

        <ToolContentWrapper accentColor={G.gold}>
        {pages.length === 0 ? (
          <div
            className="max-w-2xl mx-auto rounded-2xl p-12 text-center cursor-pointer transition-all duration-300"
            style={{ border: `2px dashed ${G.border}`, background: G.bg }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = G.borderHover; (e.currentTarget as HTMLElement).style.background = G.bgHover; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = G.border; (e.currentTarget as HTMLElement).style.background = G.bg; }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {isLoading ? (
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" style={{ color: G.gold }} />
            ) : (
              <Upload className="h-12 w-12 mx-auto mb-4" style={{ color: G.goldDim }} />
            )}
            <p className="text-white font-semibold text-lg mb-2">{isLoading ? 'Loading PDF...' : 'Drop your PDF files here'}</p>
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>or click to browse your files</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ background: G.btnGradient, color: "#0E1018", boxShadow: G.btnShadow }}>
              <Upload className="h-4 w-4" />
              Browse PDF Files
            </div>
            <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.25)" }}>Supports multiple PDFs · All processing is local in your browser</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[240px_1fr_320px] gap-5">

            {/* ── Column 1: Page Thumbnails ── */}
            <div>
              <div className="rounded-2xl overflow-hidden" style={{ background: G.bg, border: `1px solid ${G.border}` }}>
                <div className="p-3 flex items-center justify-between" style={{ borderBottom: `1px solid rgba(200,167,102,0.12)` }}>
                  <h3 className="text-sm font-semibold text-white">Pages ({pages.length})</h3>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={selectAllPages} className="h-7 text-xs text-white"
                      style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>All</Button>
                    <Button size="sm" variant="ghost" onClick={deselectAllPages} className="h-7 text-xs text-white"
                      style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>None</Button>
                  </div>
                </div>
                <ScrollArea className="h-[600px]">
                  <div className="p-2 space-y-2">
                    {pages.map((page, index) => {
                      const isPreviewing = previewPage?.id === page.id;
                      return (
                        <div key={page.id}
                          className="rounded-xl cursor-pointer transition-all overflow-hidden"
                          style={{
                            background: isPreviewing ? G.bgHover : page.selected ? G.bg : "rgba(255,255,255,0.03)",
                            border: `${(isPreviewing || page.selected) ? "2px" : "1px"} solid ${
                              isPreviewing ? G.borderHover : page.selected ? G.border : "rgba(255,255,255,0.07)"
                            }`,
                            boxShadow: isPreviewing ? `0 0 20px ${G.glow}` : "none",
                          }}
                          onClick={() => { togglePageSelection(page.id); setPreviewPage({ ...page }); }}>
                          <div className="p-3 flex items-center gap-2">
                            <Checkbox
                              checked={page.selected}
                              onClick={(e) => e.stopPropagation()}
                              onCheckedChange={() => togglePageSelection(page.id)}
                              className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                                  style={{ background: (isPreviewing || page.selected) ? G.bg : "rgba(255,255,255,0.08)", color: (isPreviewing || page.selected) ? G.gold : "rgba(255,255,255,0.55)" }}>
                                  #{page.pageNumber}
                                </span>
                                <p className="text-sm font-medium text-white">Page {page.pageNumber}</p>
                                {isPreviewing && <Eye className="h-3 w-3 shrink-0" style={{ color: G.gold }} />}
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
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: G.bg, color: G.gold }}>↻ {page.rotation}°</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* ── Column 2: Actions Panel ── */}
            <div className="space-y-6">
              {/* Undo/Redo + Add */}
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}
                    style={{ borderColor: G.border, color: "#fff", background: G.bg }}>
                    <Undo className="h-4 w-4 mr-1" />Undo
                  </Button>
                  <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}
                    style={{ borderColor: G.border, color: "#fff", background: G.bg }}>
                    <Redo className="h-4 w-4 mr-1" />Redo
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isLoading}
                  style={{ borderColor: G.borderHover, color: "#fff", background: G.bg }}>
                  <Plus className="h-4 w-4 mr-2" />Add More PDFs
                </Button>
              </div>

              {/* Actions */}
              <div className="rounded-2xl p-6" style={{ background: G.bg, border: `1px solid ${G.border}` }}>
                <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Button variant="outline" onClick={exportSelectedPages} disabled={selectedCount === 0 || isSaving}
                    className="text-white transition-all" style={{ borderColor: G.borderHover, background: G.bg }}>
                    <Split className="h-4 w-4 mr-2" />Extract ({selectedCount})
                  </Button>
                  <Button variant="outline" onClick={exportMergedPDF} disabled={pages.length === 0 || isSaving}
                    className="text-white transition-all" style={{ borderColor: G.borderHover, background: G.bg }}>
                    <Merge className="h-4 w-4 mr-2" />Merge All
                  </Button>
                  <Button variant="outline" onClick={deleteSelectedPages} disabled={selectedCount === 0}
                    className="text-red-300 border-red-500/60 bg-red-500/20 hover:bg-red-500/30">
                    <Trash2 className="h-4 w-4 mr-2" />Delete Selected
                  </Button>
                  <Button variant="outline" onClick={() => setSignatureMode(!signatureMode)}
                    style={{ borderColor: signatureMode ? G.borderHover : G.border, color: 'white', background: signatureMode ? G.bgHover : G.bg }}>
                    <Pen className="h-4 w-4 mr-2" />{signatureMode ? 'Close Signature' : 'Add Signature'}
                  </Button>
                </div>
              </div>

              {/* ── AI Tools Panel ── */}
              <div className="rounded-2xl p-6" style={{ background: G.bg, border: `1px solid ${G.border}` }}>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" style={{ color: G.gold }} />
                  AI Tools
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Button variant="outline" onClick={handleOCRExtract} disabled={!previewPage || ocrLoading}
                    className="text-white transition-all" style={{ borderColor: G.border, background: G.bg }}>
                    {ocrLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ScanLine className="h-4 w-4 mr-2" />}
                    AI OCR Extract
                  </Button>
                  <Button variant="outline" onClick={() => toast.info('Watermark coming soon')}
                    className="text-white transition-all" style={{ borderColor: G.border, background: G.bg }}>
                    <Droplets className="h-4 w-4 mr-2" />Add Watermark
                  </Button>
                </div>

                {/* OCR Results */}
                {ocrText && (
                  <div className="mt-4 rounded-xl p-4" style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${G.border}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold" style={{ color: G.gold }}>Extracted Text</span>
                      <button onClick={() => { navigator.clipboard.writeText(ocrText); toast.success('Copied to clipboard'); }}
                        className="text-xs px-2 py-1 rounded-lg transition-colors" style={{ background: G.bg, color: G.gold, border: `1px solid ${G.border}` }}>
                        Copy
                      </button>
                    </div>
                    <pre className="text-xs text-white whitespace-pre-wrap max-h-60 overflow-y-auto"
                      style={{ fontFamily: "monospace", lineHeight: "1.5" }}>
                      {ocrText}
                    </pre>
                  </div>
                )}
              </div>

              {/* Signature Panel */}
              {signatureMode && (
                <div className="rounded-2xl p-6" style={{ background: G.bg, border: `1px solid ${G.border}` }}>
                  <h3 className="text-lg font-semibold text-white mb-4">Draw Signature</h3>
                  <div className="bg-white rounded-xl p-2 mb-4">
                    <canvas ref={signatureCanvasRef} width={400} height={150}
                      className="rounded cursor-crosshair w-full border border-gray-200"
                      onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={clearSignature} className="text-white" style={{ borderColor: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.12)" }}>Clear</Button>
                    <Button disabled={!signatureData} style={{ background: G.btnGradient, color: "#0E1018", opacity: signatureData ? 1 : 0.4 }}>
                      <Check className="h-4 w-4 mr-2" />Apply to Selected Pages
                    </Button>
                  </div>
                </div>
              )}

              {/* Loaded Files */}
              <div className="rounded-2xl p-6" style={{ background: G.bg, border: `1px solid ${G.border}` }}>
                <h3 className="text-lg font-semibold text-white mb-4">Loaded PDFs ({loadedPDFs.length})</h3>
                <div className="space-y-2">
                  {loadedPDFs.map((pdf) => (
                    <div key={pdf.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <FileText className="h-5 w-5" style={{ color: G.gold }} />
                      <div className="flex-1">
                        <p className="text-sm text-white">{pdf.name}</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{pdf.pageCount} pages</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl text-center" style={{ background: G.bg, border: `1px solid rgba(200,167,102,0.1)` }}>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                  All processing is done locally in your browser · No files are uploaded to servers
                </p>
              </div>
            </div>

            {/* ── Column 3: Live Page Preview ── */}
            <div className="hidden lg:block">
              <div className="sticky top-6 rounded-2xl overflow-hidden" style={{ background: G.bg, border: `1px solid ${G.border}` }}>
                <div className="p-3 flex items-center justify-between" style={{ borderBottom: `1px solid rgba(200,167,102,0.12)` }}>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" style={{ color: G.gold }} />
                    <h3 className="text-sm font-semibold text-white">Live Preview</h3>
                  </div>
                  {previewPage && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: G.bg, color: G.gold }}>
                      Page {previewPage.pageNumber}
                    </span>
                  )}
                </div>

                <div className="p-3">
                  {!previewPage ? (
                    <div className="flex flex-col items-center justify-center h-80 gap-3" style={{ color: "rgba(255,255,255,0.25)" }}>
                      <Eye className="h-10 w-10 opacity-30" />
                      <p className="text-xs text-center">Click a page to preview it here</p>
                    </div>
                  ) : previewLoading ? (
                    <div className="flex flex-col items-center justify-center h-80 gap-3">
                      <Loader2 className="h-8 w-8 animate-spin" style={{ color: G.gold }} />
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Rendering preview…</p>
                    </div>
                  ) : previewUrl ? (
                    <div className="relative rounded-xl overflow-hidden" style={{ border: `1px solid rgba(200,167,102,0.15)`, background: "#fff" }}>
                      <iframe
                        key={previewUrl}
                        src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                        className="w-full"
                        style={{ height: "420px", border: "none", display: "block" }}
                        title={`Preview page ${previewPage.pageNumber}`}
                      />
                      {previewPage.rotation !== 0 && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                          style={{ background: `rgba(200,167,102,0.85)`, color: "#0E1018", backdropFilter: "blur(4px)" }}>
                          <RotateCw className="h-3 w-3" />
                          {previewPage.rotation}°
                        </div>
                      )}
                    </div>
                  ) : null}

                  {previewPage && !previewLoading && (
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                        <span>Source file</span>
                        <span className="truncate max-w-[160px] text-right" style={{ color: "rgba(255,255,255,0.65)" }}>
                          {loadedPDFs[previewPage.pdfIndex]?.name || '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                        <span>Original page</span>
                        <span style={{ color: "rgba(255,255,255,0.65)" }}>#{previewPage.originalPageNumber}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                        <span>Rotation</span>
                        <span style={{ color: previewPage.rotation !== 0 ? G.gold : "rgba(255,255,255,0.65)" }}>
                          {previewPage.rotation}°
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        </ToolContentWrapper>
      </main>
    </div>
  );
}
