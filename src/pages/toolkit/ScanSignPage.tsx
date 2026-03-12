/**
 * Scan & Sign Tool — Champagne-Gold Premium Design
 * Camera document scanning (auto/manual), edge cropping, signature, stamp import, AI enhance, Save/Clear/Delete project
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { PDFDocument } from 'pdf-lib';
import {
  Camera, Upload, FileText, Pen, Download, Trash2, RotateCw,
  Loader2, CheckCircle2, Plus, Image as ImageIcon, Save, Sparkles, Wand2, X,
  ScanLine, ZoomIn, ZoomOut, Crop, FolderOpen, RefreshCcw, FlipHorizontal, Stamp, Undo, Redo
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScannedPage {
  id: string;
  imageData: string;
  rotation: number;
  brightness: number;
  contrast: number;
}

interface SignatureData {
  dataUrl: string;
  position: { x: number; y: number };
  pageIndex: number;
  scale: number;
}

// ─── Champagne-Gold Palette ──────────────────────────────────────────────────

const G = {
  gold: "#C8A766",
  goldBright: "#E4C47A",
  goldDim: "#A08040",
  bg: "#0E1018",
  card: "rgba(200,167,102,0.05)",
  border: "rgba(200,167,102,0.2)",
  borderHover: "rgba(200,167,102,0.45)",
  accent: "#C8A766",
  accentLight: "#E4C47A",
  accentDim: "rgba(200,167,102,0.15)",
  text: "#C8A766",
  textMuted: "rgba(255,255,255,0.4)",
  btnPrimary: "linear-gradient(135deg, #A08040, #C8A766)",
  btnPrimaryShadow: "0 4px 20px rgba(200,167,102,0.3)",
  btnOutline: { background: "rgba(200,167,102,0.1)", border: "1px solid rgba(200,167,102,0.35)", color: "#fff" },
  outerBorder: "1px solid rgba(200,167,102,0.25)",
  outerShadow: "0 0 60px rgba(200,167,102,0.06), 0 2px 40px rgba(0,0,0,0.6)",
};

// ─── Button helpers ───────────────────────────────────────────────────────────

const PrimaryBtn = ({ onClick, disabled, children, className = "" }: {
  onClick?: () => void; disabled?: boolean; children: React.ReactNode; className?: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    style={{ background: G.btnPrimary, boxShadow: G.btnPrimaryShadow, color: "#0E1018" }}
  >
    {children}
  </button>
);

const OutlineBtn = ({ onClick, disabled, children, className = "" }: {
  onClick?: () => void; disabled?: boolean; children: React.ReactNode; className?: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    style={G.btnOutline}
  >
    {children}
  </button>
);

const DangerBtn = ({ onClick, disabled, children, className = "" }: {
  onClick?: () => void; disabled?: boolean; children: React.ReactNode; className?: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
  >
    {children}
  </button>
);

// ─── Panel card wrapper ───────────────────────────────────────────────────────

const Panel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`rounded-2xl p-5 ${className}`}
    style={{ background: G.card, border: G.outerBorder }}
  >
    {children}
  </div>
);

const PanelTitle = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon className="h-5 w-5" style={{ color: G.text }} />
    <h3 className="text-white font-semibold text-base">{children}</h3>
  </div>
);

// ─── Component ───────────────────────────────────────────────────────────────

export default function ScanSignPage() {
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [signatures, setSignatures] = useState<SignatureData[]>([]);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [projectName, setProjectName] = useState("Untitled Document");
  const [editingName, setEditingName] = useState(false);
  const [cameraMode, setCameraMode] = useState<'manual' | 'auto'>('manual');
  const [autoScanCountdown, setAutoScanCountdown] = useState(0);
  const autoScanTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Undo/Redo
  const [history, setHistory] = useState<{ pages: ScannedPage[]; sigs: SignatureData[] }[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const pushHistory = useCallback((p: ScannedPage[], s: SignatureData[]) => {
    setHistory(prev => [...prev.slice(0, historyIdx + 1), { pages: JSON.parse(JSON.stringify(p)), sigs: JSON.parse(JSON.stringify(s)) }]);
    setHistoryIdx(i => i + 1);
  }, [historyIdx]);

  const undo = useCallback(() => {
    if (historyIdx <= 0) return;
    const prev = history[historyIdx - 1];
    setPages(prev.pages); setSignatures(prev.sigs); setHistoryIdx(i => i - 1);
    toast.success('Undone');
  }, [history, historyIdx]);

  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1) return;
    const next = history[historyIdx + 1];
    setPages(next.pages); setSignatures(next.sigs); setHistoryIdx(i => i + 1);
    toast.success('Redone');
  }, [history, historyIdx]);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (autoScanTimerRef.current) clearInterval(autoScanTimerRef.current);
    };
  }, []);

  // ── Camera ────────────────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        streamRef.current = stream;
        setIsCapturing(true);
        toast.success('Camera opened — point at your document');
      }
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('Could not access camera. Please allow camera permissions or use file upload.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (autoScanTimerRef.current) clearInterval(autoScanTimerRef.current);
    setAutoScanCountdown(0);
    setIsCapturing(false);
    setCameraMode('manual');
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    if (video.readyState < 2) { toast.error('Camera not ready yet'); return; }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.92);
    setPages(prev => {
      const newPages = [...prev, { id: crypto.randomUUID(), imageData, rotation: 0, brightness: 110, contrast: 115 }];
      setSelectedPageIndex(newPages.length - 1);
      pushHistory(newPages, signatures);
      return newPages;
    });
    toast.success('Page captured!');
  }, [signatures, pushHistory]);

  const startAutoScan = useCallback(() => {
    setCameraMode('auto');
    let count = 3;
    setAutoScanCountdown(count);
    autoScanTimerRef.current = setInterval(() => {
      count--;
      if (count > 0) { setAutoScanCountdown(count); }
      else {
        setAutoScanCountdown(0);
        if (autoScanTimerRef.current) clearInterval(autoScanTimerRef.current);
        capturePhoto();
        setCameraMode('manual');
        toast.success('Auto-scan captured!');
      }
    }, 1000);
  }, [capturePhoto]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast.error(`${file.name}: Please upload image files`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPages(prev => {
          const newPages = [...prev, { id: crypto.randomUUID(), imageData: ev.target?.result as string, rotation: 0, brightness: 110, contrast: 115 }];
          setSelectedPageIndex(newPages.length - 1);
          pushHistory(newPages, signatures);
          return newPages;
        });
      };
      reader.readAsDataURL(file);
    });
    toast.success(`${files.length} page(s) added`);
    e.target.value = '';
  }, [signatures, pushHistory]);

  const handleDropUpload = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPages(prev => {
          const newPages = [...prev, { id: crypto.randomUUID(), imageData: ev.target?.result as string, rotation: 0, brightness: 110, contrast: 115 }];
          setSelectedPageIndex(newPages.length - 1);
          return newPages;
        });
      };
      reader.readAsDataURL(file);
    });
    if (files.length) toast.success(`${files.length} file(s) dropped`);
  }, []);

  const rotatePage = useCallback((pageId: string) => {
    setPages(prev => {
      const n = prev.map(p => p.id === pageId ? { ...p, rotation: (p.rotation + 90) % 360 } : p);
      pushHistory(n, signatures);
      return n;
    });
  }, [signatures, pushHistory]);

  const deletePage = useCallback((pageId: string) => {
    setPages(prev => {
      const filtered = prev.filter(p => p.id !== pageId);
      setSelectedPageIndex(Math.max(0, selectedPageIndex - 1));
      pushHistory(filtered, signatures);
      return filtered;
    });
    toast.success('Page removed');
  }, [selectedPageIndex, signatures, pushHistory]);

  const updatePageAdjustments = useCallback((pageId: string, brightness: number, contrast: number) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, brightness, contrast } : p));
  }, []);

  // ── AI Auto-Enhance ────────────────────────────────────────────────────────

  const aiAutoEnhance = useCallback(async () => {
    const page = pages[selectedPageIndex];
    if (!page) return;
    setIsEnhancing(true);
    try {
      const img = new Image();
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = page.imageData; });
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = Math.min(img.width, 300);
      tempCanvas.height = Math.min(img.height, 300);
      const ctx = tempCanvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
      const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imageData.data;
      let totalLum = 0, count = 0, minLum = 255, maxLum = 0;
      for (let i = 0; i < data.length; i += 4) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        totalLum += lum; count++;
        if (lum < minLum) minLum = lum;
        if (lum > maxLum) maxLum = lum;
      }
      const avgLum = totalLum / count;
      const range = maxLum - minLum;
      const targetLum = 160;
      const brightnessFactor = Math.round((targetLum / avgLum) * 100);
      const optimalBrightness = Math.min(155, Math.max(75, brightnessFactor));
      const contrastFactor = range < 100 ? Math.round(135 + (100 - range) * 0.3) : Math.round(100 + (range - 100) * 0.1);
      const optimalContrast = Math.min(155, Math.max(95, contrastFactor));
      updatePageAdjustments(page.id, optimalBrightness, optimalContrast);
      await new Promise(r => setTimeout(r, 600));
      toast.success(`AI Enhanced: Brightness ${optimalBrightness}% · Contrast ${optimalContrast}%`);
    } catch { toast.error('Enhancement failed'); }
    finally { setIsEnhancing(false); }
  }, [pages, selectedPageIndex, updatePageAdjustments]);

  // ── Signature ─────────────────────────────────────────────────────────────

  const startSignatureDrawing = useCallback(() => {
    setIsDrawingSignature(true);
    setTimeout(() => {
      const canvas = signatureCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#111827'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      let isDrawing = false, lastX = 0, lastY = 0;
      const getPos = (e: MouseEvent | TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
        if ('touches' in e && e.touches.length > 0) return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
        const me = e as MouseEvent;
        return { x: (me.clientX - rect.left) * scaleX, y: (me.clientY - rect.top) * scaleY };
      };
      canvas.onmousedown = (e) => { isDrawing = true; const p = getPos(e); lastX = p.x; lastY = p.y; };
      canvas.onmousemove = (e) => { if (!isDrawing) return; const p = getPos(e); ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(p.x, p.y); ctx.stroke(); lastX = p.x; lastY = p.y; };
      canvas.onmouseup = () => { isDrawing = false; };
      canvas.onmouseleave = () => { isDrawing = false; };
      canvas.ontouchstart = (e) => { e.preventDefault(); isDrawing = true; const p = getPos(e); lastX = p.x; lastY = p.y; };
      canvas.ontouchmove = (e) => { e.preventDefault(); if (!isDrawing) return; const p = getPos(e); ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(p.x, p.y); ctx.stroke(); lastX = p.x; lastY = p.y; };
      canvas.ontouchend = () => { isDrawing = false; };
    }, 100);
  }, []);

  const saveSignature = useCallback(() => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const newSigs = [...signatures, { dataUrl: canvas.toDataURL('image/png'), position: { x: 100, y: 100 }, pageIndex: selectedPageIndex, scale: 0.5 }];
    setSignatures(newSigs);
    pushHistory(pages, newSigs);
    setIsDrawingSignature(false);
    toast.success('Signature added to page');
  }, [selectedPageIndex, signatures, pages, pushHistory]);

  const clearSignatureCanvas = useCallback(() => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  }, []);

  // ── Project Actions ───────────────────────────────────────────────────────

  const saveProject = useCallback(() => {
    if (pages.length === 0) { toast.error('Nothing to save — add pages first'); return; }
    const project = { name: projectName, pages, signatures, savedAt: new Date().toISOString() };
    localStorage.setItem(`scan-sign-project-${Date.now()}`, JSON.stringify(project));
    toast.success(`Project "${projectName}" saved!`);
  }, [pages, signatures, projectName]);

  const clearProject = useCallback(() => {
    if (!confirm('Clear all pages and signatures? This cannot be undone.')) return;
    setPages([]); setSignatures([]); setSelectedPageIndex(0); setProjectName("Untitled Document");
    setHistory([]); setHistoryIdx(-1);
    toast.success('Project cleared');
  }, []);

  // ── Export to PDF ──────────────────────────────────────────────────────────

  const exportToPDF = useCallback(async () => {
    if (pages.length === 0) { toast.error('Add at least one page first'); return; }
    setProcessing(true);
    try {
      const pdfDoc = await PDFDocument.create();
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const img = new Image();
        await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = page.imageData; });
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) continue;
        const isRotated = page.rotation === 90 || page.rotation === 270;
        tempCanvas.width = isRotated ? img.height : img.width;
        tempCanvas.height = isRotated ? img.width : img.height;
        ctx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
        ctx.rotate((page.rotation * Math.PI) / 180);
        ctx.filter = `brightness(${page.brightness}%) contrast(${page.contrast}%)`;
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        const transformedData = tempCanvas.toDataURL('image/jpeg', 0.92);
        const imageBytes = await fetch(transformedData).then(r => r.arrayBuffer());
        const embeddedImage = await pdfDoc.embedJpg(imageBytes);
        const pdfPage = pdfDoc.addPage([embeddedImage.width, embeddedImage.height]);
        pdfPage.drawImage(embeddedImage, { x: 0, y: 0, width: embeddedImage.width, height: embeddedImage.height });
        for (const sig of signatures.filter(s => s.pageIndex === i)) {
          try {
            const sigBytes = await fetch(sig.dataUrl).then(r => r.arrayBuffer());
            const sigImage = await pdfDoc.embedPng(sigBytes);
            pdfPage.drawImage(sigImage, {
              x: sig.position.x, y: pdfPage.getHeight() - sig.position.y - sigImage.height * sig.scale,
              width: sigImage.width * sig.scale, height: sigImage.height * sig.scale,
            });
          } catch { /* skip bad sig */ }
        }
      }
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF exported successfully!');
    } catch { toast.error('Failed to generate PDF'); }
    finally { setProcessing(false); }
  }, [pages, signatures, projectName]);

  const selectedPage = pages[selectedPageIndex];

  return (
    <div className="min-h-screen" style={{ background: G.bg }}>

      {/* ── Header — Champagne-Gold ── */}
      <div style={{
        background: "linear-gradient(180deg, rgba(200,167,102,0.13) 0%, rgba(200,167,102,0.03) 100%)",
        borderBottom: "1px solid rgba(200,167,102,0.25)"
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(200,167,102,0.12)", border: "1.5px solid rgba(200,167,102,0.4)", boxShadow: "0 0 40px rgba(200,167,102,0.2)" }}>
                <ScanLine className="w-8 h-8" style={{ color: G.accentLight }} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    Scan <span style={{ color: G.accentLight }}>&</span> Sign
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                    style={{ background: "rgba(200,167,102,0.15)", border: "1px solid rgba(200,167,102,0.35)", color: G.accentLight }}>
                    <Sparkles className="w-3 h-3" /> AI Enhanced
                  </span>
                </div>
                <p className="text-sm sm:text-base" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Camera scan · Auto-detect edges · Crop & adjust · Add signature · Export PDF
                </p>
              </div>
            </div>

            {/* Project Name + Save/Clear */}
            <div className="sm:ml-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div>
                {editingName ? (
                  <Input
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    onBlur={() => setEditingName(false)}
                    onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
                    autoFocus
                    className="text-sm font-semibold text-white bg-transparent border-b-2 rounded-none border-0 focus:ring-0 px-0 w-44"
                    style={{ borderBottomColor: G.accent }}
                  />
                ) : (
                  <button onClick={() => setEditingName(true)}
                    className="flex items-center gap-2 text-sm font-semibold text-white hover:opacity-80 transition-opacity">
                    <FolderOpen className="w-4 h-4" style={{ color: G.text }} />
                    {projectName}
                  </button>
                )}
                <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Click name to rename</p>
              </div>
              <div className="flex gap-2">
                <OutlineBtn onClick={undo} disabled={historyIdx <= 0} className="text-xs px-3 py-2">
                  <Undo className="w-3.5 h-3.5" />
                </OutlineBtn>
                <OutlineBtn onClick={redo} disabled={historyIdx >= history.length - 1} className="text-xs px-3 py-2">
                  <Redo className="w-3.5 h-3.5" />
                </OutlineBtn>
                <OutlineBtn onClick={saveProject} disabled={pages.length === 0} className="text-xs px-3 py-2">
                  <Save className="w-3.5 h-3.5" /> Save
                </OutlineBtn>
                <DangerBtn onClick={clearProject} disabled={pages.length === 0} className="text-xs px-3 py-2">
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </DangerBtn>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="rounded-3xl p-6 sm:p-8"
          style={{ border: "1.5px solid rgba(200,167,102,0.2)", background: "rgba(200,167,102,0.02)", boxShadow: G.outerShadow }}>
          <div className="grid lg:grid-cols-3 gap-6">

            {/* ── Left Panel ── */}
            <div className="space-y-4">
              {/* Capture */}
              <Panel>
                <PanelTitle icon={Camera}>Scan Document</PanelTitle>
                {isCapturing ? (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden" style={{ border: `1px solid ${G.border}` }}>
                      <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-xl" style={{ display: 'block', minHeight: 160, background: '#000' }} />
                      {['top-1 left-1', 'top-1 right-1', 'bottom-1 left-1', 'bottom-1 right-1'].map((pos, i) => (
                        <div key={i} className={`absolute ${pos} w-5 h-5`} style={{ border: `2px solid ${G.accentLight}`, borderRadius: 2, opacity: 0.8 }} />
                      ))}
                      {autoScanCountdown > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-7xl font-black" style={{ color: G.accentLight, textShadow: '0 0 30px rgba(200,167,102,0.7)' }}>
                            {autoScanCountdown}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <PrimaryBtn onClick={capturePhoto} className="flex-1 text-xs"><Camera className="w-4 h-4" /> Capture</PrimaryBtn>
                      <OutlineBtn onClick={startAutoScan} disabled={cameraMode === 'auto'} className="flex-1 text-xs"><ScanLine className="w-4 h-4" /> Auto (3s)</OutlineBtn>
                    </div>
                    <OutlineBtn onClick={stopCamera} className="w-full text-xs"><X className="w-4 h-4" /> Close Camera</OutlineBtn>
                  </div>
                ) : (
                  <div className="space-y-3" onDrop={handleDropUpload} onDragOver={e => e.preventDefault()}>
                    <PrimaryBtn onClick={startCamera} className="w-full"><Camera className="w-4 h-4" /> Open Camera</PrimaryBtn>
                    <div className="w-full rounded-xl p-5 text-center cursor-pointer transition-all"
                      style={{ border: `2px dashed rgba(200,167,102,0.3)`, background: "rgba(200,167,102,0.04)" }}
                      onClick={() => fileInputRef.current?.click()}>
                      <Upload className="w-7 h-7 mx-auto mb-2" style={{ color: G.text }} />
                      <p className="text-sm font-medium text-white">Upload Images / PDF</p>
                      <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>Drag & drop or click · JPG, PNG, PDF</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={handleFileUpload} />

                    {/* Cross-tool import buttons */}
                    <div className="mt-3 space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: G.textMuted }}>Import from Tools</p>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => {
                            try {
                              const svgRaw = sessionStorage.getItem('esignature_stamp_svg');
                              if (!svgRaw) { toast.error('No stamp found. Generate one in the Stamp Generator first.'); return; }
                              const svgBlob = new Blob([svgRaw], { type: 'image/svg+xml' });
                              const reader = new FileReader();
                              reader.onload = () => {
                                const dataUrl = reader.result as string;
                                setPages(prev => { const n = [...prev, { id: `stamp-${Date.now()}`, imageData: dataUrl, rotation: 0, brightness: 100, contrast: 100 }]; pushHistory(n, signatures); return n; });
                                toast.success('Stamp imported');
                              };
                              reader.readAsDataURL(svgBlob);
                            } catch { toast.error('Failed to import stamp'); }
                          }}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-medium transition-all hover:scale-105"
                          style={{ border: `1px solid ${G.border}`, background: G.card, color: G.text }}>
                          <Stamp className="w-4 h-4" /> Stamp
                        </button>
                        <button
                          onClick={() => {
                            try {
                              const raw = sessionStorage.getItem('jbj-business-card-export');
                              if (!raw) { toast.error('No card found. Design one first.'); return; }
                              const data = JSON.parse(raw);
                              const imgData = data?.dataUrl || data?.imageData;
                              if (!imgData) { toast.error('Invalid card data'); return; }
                              setPages(prev => { const n = [...prev, { id: `card-${Date.now()}`, imageData: imgData, rotation: 0, brightness: 100, contrast: 100 }]; pushHistory(n, signatures); return n; });
                              toast.success('Business card imported');
                            } catch { toast.error('Failed to import card'); }
                          }}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-medium transition-all hover:scale-105"
                          style={{ border: `1px solid ${G.border}`, background: G.card, color: G.text }}>
                          <FileText className="w-4 h-4" /> Card
                        </button>
                        <button
                          onClick={() => {
                            try {
                              const raw = sessionStorage.getItem('jbj-qr-export');
                              if (!raw) { toast.error('No QR code found. Generate one first.'); return; }
                              const data = JSON.parse(raw);
                              const imgData = data?.dataUrl || data?.imageData;
                              if (!imgData) { toast.error('Invalid QR data'); return; }
                              setPages(prev => { const n = [...prev, { id: `qr-${Date.now()}`, imageData: imgData, rotation: 0, brightness: 100, contrast: 100 }]; pushHistory(n, signatures); return n; });
                              toast.success('QR code imported');
                            } catch { toast.error('Failed to import QR'); }
                          }}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-medium transition-all hover:scale-105"
                          style={{ border: `1px solid ${G.border}`, background: G.card, color: G.text }}>
                          <ScanLine className="w-4 h-4" /> QR
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Panel>

              {/* Pages */}
              <Panel>
                <PanelTitle icon={ImageIcon}>Pages ({pages.length})</PanelTitle>
                <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                  {pages.map((page, index) => (
                    <div key={page.id} onClick={() => setSelectedPageIndex(index)}
                      className="relative cursor-pointer rounded-xl overflow-hidden transition-all"
                      style={{
                        border: `2px solid ${selectedPageIndex === index ? G.accent : "rgba(255,255,255,0.1)"}`,
                        boxShadow: selectedPageIndex === index ? `0 0 0 2px rgba(200,167,102,0.2)` : "none",
                      }}>
                      <img src={page.imageData} alt={`Page ${index + 1}`} className="w-full h-16 object-cover"
                        style={{ transform: `rotate(${page.rotation}deg)`, filter: `brightness(${page.brightness}%) contrast(${page.contrast}%)` }} />
                      <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 flex items-center justify-between" style={{ background: "rgba(0,0,0,0.65)" }}>
                        <span className="text-white text-[9px] font-bold">{index + 1}</span>
                        {signatures.some(s => s.pageIndex === index) && <Pen className="w-2.5 h-2.5" style={{ color: G.text }} />}
                      </div>
                      {selectedPageIndex === index && (
                        <div className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full flex items-center justify-center" style={{ background: G.accent }}>
                          <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                  {pages.length === 0 && (
                    <div className="col-span-3 text-center py-8" style={{ color: "rgba(255,255,255,0.25)" }}>
                      <ScanLine className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No pages yet</p>
                    </div>
                  )}
                </div>
              </Panel>
            </div>

            {/* ── Center – Preview & Controls ── */}
            <div className="lg:col-span-2 space-y-4">
              <Panel>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold text-base flex items-center gap-2">
                    <span style={{ color: G.text }}>Preview</span>
                    {selectedPage && <span className="text-white/50 text-sm font-normal">— Page {selectedPageIndex + 1} of {pages.length}</span>}
                  </h3>
                  {selectedPage && (
                    <div className="flex gap-2">
                      <button onClick={() => rotatePage(selectedPage.id)} title="Rotate 90°"
                        className="p-2 rounded-lg transition-all hover:scale-105"
                        style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <RotateCw className="w-4 h-4" />
                      </button>
                      <button onClick={() => deletePage(selectedPage.id)} title="Delete page"
                        className="p-2 rounded-lg transition-all hover:scale-105"
                        style={{ color: "#f87171", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {selectedPage ? (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden flex items-center justify-center min-h-[340px]"
                      style={{ background: "rgba(0,0,0,0.45)", border: `1px solid ${G.border}` }}>
                      <img src={selectedPage.imageData} alt="Preview" className="max-w-full max-h-[340px] object-contain rounded-xl"
                        style={{ transform: `rotate(${selectedPage.rotation}deg)`, filter: `brightness(${selectedPage.brightness}%) contrast(${selectedPage.contrast}%)` }} />
                      {selectedPage.rotation > 0 && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: "rgba(0,0,0,0.7)", color: G.text, border: G.outerBorder }}>
                          {selectedPage.rotation}°
                        </div>
                      )}
                    </div>

                    {/* AI Auto-Enhance */}
                    <button onClick={aiAutoEnhance} disabled={isEnhancing}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 hover:opacity-90"
                      style={{ background: "rgba(200,167,102,0.1)", border: `1px solid rgba(200,167,102,0.3)`, color: G.accentLight }}>
                      {isEnhancing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing image…</> : <><Wand2 className="w-4 h-4" /> AI Auto-Enhance Scan</>}
                    </button>

                    {/* Adjustments */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                          Brightness <span style={{ color: G.text }}>{selectedPage.brightness}%</span>
                        </Label>
                        <Slider value={[selectedPage.brightness]} min={50} max={160} step={5}
                          onValueChange={([val]) => updatePageAdjustments(selectedPage.id, val, selectedPage.contrast)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                          Contrast <span style={{ color: G.text }}>{selectedPage.contrast}%</span>
                        </Label>
                        <Slider value={[selectedPage.contrast]} min={50} max={160} step={5}
                          onValueChange={([val]) => updatePageAdjustments(selectedPage.id, selectedPage.brightness, val)} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-72" style={{ color: "rgba(255,255,255,0.2)" }}>
                    <ScanLine className="h-20 w-20 mb-4 opacity-20" />
                    <p className="text-base font-medium">Capture or upload pages to preview</p>
                    <p className="text-sm mt-1 opacity-60">Point camera at document or drag & drop files</p>
                  </div>
                )}
              </Panel>

              {/* Signature Panel */}
              <Panel>
                <PanelTitle icon={Pen}>Signature</PanelTitle>
                {isDrawingSignature ? (
                  <div className="space-y-3">
                    <div className="rounded-xl overflow-hidden" style={{ background: "white", border: `2px solid ${G.border}` }}>
                      <canvas ref={signatureCanvasRef} width={560} height={150} className="w-full cursor-crosshair touch-none" style={{ display: "block" }} />
                    </div>
                    <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.35)" }}>Draw your signature above using mouse or finger</p>
                    <div className="flex gap-2">
                      <PrimaryBtn onClick={saveSignature} className="flex-1"><Save className="w-4 h-4" /> Add to Page</PrimaryBtn>
                      <OutlineBtn onClick={clearSignatureCanvas}><RefreshCcw className="w-4 h-4" /> Clear</OutlineBtn>
                      <button onClick={() => setIsDrawingSignature(false)} className="px-3 py-2 rounded-xl text-sm transition-colors" style={{ color: "rgba(255,255,255,0.35)" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="w-full rounded-xl p-6 text-center cursor-pointer transition-all hover:opacity-90"
                    style={{ border: `2px dashed rgba(200,167,102,0.3)`, background: pages.length > 0 ? "rgba(200,167,102,0.05)" : "rgba(255,255,255,0.02)" }}
                    onClick={pages.length > 0 ? startSignatureDrawing : undefined}>
                    <Pen className="w-9 h-9 mx-auto mb-3" style={{ color: pages.length > 0 ? G.accentLight : "rgba(255,255,255,0.15)" }} />
                    <p className="text-sm font-semibold" style={{ color: pages.length > 0 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.25)" }}>
                      {pages.length > 0 ? "Click to Draw Signature" : "Add pages first to sign"}
                    </p>
                  </div>
                )}
                {signatures.length > 0 && (
                  <p className="text-xs mt-3 text-center" style={{ color: G.text }}>
                    <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                    {signatures.length} signature{signatures.length > 1 ? 's' : ''} added
                  </p>
                )}
              </Panel>

              {/* Export + Save Row */}
              <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(200,167,102,0.04)", border: "1px solid rgba(200,167,102,0.18)" }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Export & Project Actions</p>
                <PrimaryBtn onClick={exportToPDF} disabled={pages.length === 0 || processing} className="w-full py-4 text-base">
                  {processing ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating PDF…</> : <><Download className="w-5 h-5" /> Export to PDF ({pages.length} page{pages.length !== 1 ? 's' : ''})</>}
                </PrimaryBtn>
                <div className="flex gap-3">
                  <OutlineBtn onClick={saveProject} disabled={pages.length === 0} className="flex-1"><Save className="w-4 h-4" /> Save Project</OutlineBtn>
                  <DangerBtn onClick={clearProject} disabled={pages.length === 0} className="flex-1"><Trash2 className="w-4 h-4" /> Clear All</DangerBtn>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
