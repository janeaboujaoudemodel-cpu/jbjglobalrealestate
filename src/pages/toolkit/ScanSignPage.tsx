/**
 * Scan & Sign Tool - Camera-based document scanning with signature overlay
 * Real implementation using device camera and canvas-based PDF generation
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { PDFDocument } from 'pdf-lib';
import {
  Camera,
  Upload,
  FileText,
  Pen,
  Download,
  Trash2,
  RotateCw,
  ZoomIn,
  Loader2,
  CheckCircle2,
  Plus,
  Image as ImageIcon,
  Save
} from 'lucide-react';

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

export default function ScanSignPage() {
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [signatures, setSignatures] = useState<SignatureData[]>([]);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Could not access camera. Please use file upload instead.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    
    const newPage: ScannedPage = {
      id: crypto.randomUUID(),
      imageData,
      rotation: 0,
      brightness: 100,
      contrast: 100,
    };
    
    setPages(prev => [...prev, newPage]);
    setSelectedPageIndex(pages.length);
    toast.success('Page captured!');
  }, [pages.length]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload image files only');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const newPage: ScannedPage = {
          id: crypto.randomUUID(),
          imageData: event.target?.result as string,
          rotation: 0,
          brightness: 100,
          contrast: 100,
        };
        setPages(prev => [...prev, newPage]);
      };
      reader.readAsDataURL(file);
    });
    
    toast.success(`${files.length} page(s) added`);
  }, []);

  const rotatePage = useCallback((pageId: string, direction: 'cw' | 'ccw') => {
    setPages(prev => prev.map(page => 
      page.id === pageId 
        ? { ...page, rotation: (page.rotation + (direction === 'cw' ? 90 : -90)) % 360 }
        : page
    ));
  }, []);

  const deletePage = useCallback((pageId: string) => {
    setPages(prev => prev.filter(p => p.id !== pageId));
    setSignatures(prev => prev.filter(s => {
      const pageIndex = pages.findIndex(p => p.id === pageId);
      return s.pageIndex !== pageIndex;
    }));
    toast.success('Page removed');
  }, [pages]);

  const updatePageAdjustments = useCallback((pageId: string, brightness: number, contrast: number) => {
    setPages(prev => prev.map(page => 
      page.id === pageId 
        ? { ...page, brightness, contrast }
        : page
    ));
  }, []);

  // Signature drawing
  const startSignatureDrawing = useCallback(() => {
    setIsDrawingSignature(true);
    setTimeout(() => {
      const canvas = signatureCanvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      let isDrawing = false;
      let lastX = 0;
      let lastY = 0;
      
      const getPos = (e: MouseEvent | TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e && e.touches.length > 0) {
          return {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top
          };
        }
        const mouseEvent = e as MouseEvent;
        return {
          x: mouseEvent.clientX - rect.left,
          y: mouseEvent.clientY - rect.top
        };
      };
      
      const handleStart = (e: MouseEvent | TouchEvent) => {
        isDrawing = true;
        const pos = getPos(e);
        lastX = pos.x;
        lastY = pos.y;
      };
      
      const handleMove = (e: MouseEvent | TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastX = pos.x;
        lastY = pos.y;
      };
      
      const handleEnd = () => {
        isDrawing = false;
      };
      
      canvas.onmousedown = handleStart as (this: GlobalEventHandlers, ev: MouseEvent) => void;
      canvas.onmousemove = handleMove as (this: GlobalEventHandlers, ev: MouseEvent) => void;
      canvas.onmouseup = handleEnd;
      canvas.onmouseleave = handleEnd;
      canvas.ontouchstart = handleStart as (this: GlobalEventHandlers, ev: TouchEvent) => void;
      canvas.ontouchmove = handleMove as (this: GlobalEventHandlers, ev: TouchEvent) => void;
      canvas.ontouchend = handleEnd;
    }, 100);
  }, []);

  const saveSignature = useCallback(() => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    
    const newSignature: SignatureData = {
      dataUrl,
      position: { x: 100, y: 100 },
      pageIndex: selectedPageIndex,
      scale: 0.5
    };
    
    setSignatures(prev => [...prev, newSignature]);
    setIsDrawingSignature(false);
    toast.success('Signature added to page');
  }, [selectedPageIndex]);

  const clearSignatureCanvas = useCallback(() => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Export to PDF
  const exportToPDF = useCallback(async () => {
    if (pages.length === 0) {
      toast.error('Add at least one page first');
      return;
    }

    setProcessing(true);

    try {
      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        
        // Create an image element to load the page data
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = page.imageData;
        });

        // Create a canvas to apply transformations
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) continue;

        // Handle rotation
        const isRotated = page.rotation === 90 || page.rotation === 270;
        tempCanvas.width = isRotated ? img.height : img.width;
        tempCanvas.height = isRotated ? img.width : img.height;

        ctx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
        ctx.rotate((page.rotation * Math.PI) / 180);
        ctx.filter = `brightness(${page.brightness}%) contrast(${page.contrast}%)`;
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        // Get the transformed image
        const transformedData = tempCanvas.toDataURL('image/jpeg', 0.9);
        const imageBytes = await fetch(transformedData).then(r => r.arrayBuffer());
        const embeddedImage = await pdfDoc.embedJpg(imageBytes);

        // Add page to PDF
        const pdfPage = pdfDoc.addPage([embeddedImage.width, embeddedImage.height]);
        pdfPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: embeddedImage.width,
          height: embeddedImage.height,
        });

        // Add signatures for this page
        const pageSignatures = signatures.filter(s => s.pageIndex === i);
        for (const sig of pageSignatures) {
          try {
            const sigBytes = await fetch(sig.dataUrl).then(r => r.arrayBuffer());
            const sigImage = await pdfDoc.embedPng(sigBytes);
            const sigWidth = sigImage.width * sig.scale;
            const sigHeight = sigImage.height * sig.scale;
            
            pdfPage.drawImage(sigImage, {
              x: sig.position.x,
              y: pdfPage.getHeight() - sig.position.y - sigHeight,
              width: sigWidth,
              height: sigHeight,
            });
          } catch (sigError) {
            console.error('Error adding signature:', sigError);
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `scanned_document_${Date.now()}.pdf`;
      a.click();

      URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully!');

    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setProcessing(false);
    }
  }, [pages, signatures]);

  const selectedPage = pages[selectedPageIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30">
              <FileText className="h-6 w-6 text-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Scan & Sign
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                  FREE
                </Badge>
              </h1>
              <p className="text-slate-400 text-sm">Capture documents with camera, add signatures, export to PDF</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Capture/Upload */}
          <div className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Camera className="h-5 w-5 text-gold" />
                  Capture Pages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isCapturing ? (
                  <div className="space-y-3">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full rounded-lg border border-slate-600"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={capturePhoto}
                        className="flex-1 bg-gold text-black hover:bg-gold/90"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Capture
                      </Button>
                      <Button
                        onClick={stopCamera}
                        variant="outline"
                        className="border-slate-600"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button
                      onClick={startCamera}
                      className="w-full bg-gold text-black hover:bg-gold/90"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Open Camera
                    </Button>
                    <div className="text-center text-slate-500 text-sm">or</div>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="w-full border-slate-600 text-slate-300"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Images
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Page Thumbnails */}
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <ImageIcon className="h-5 w-5 text-gold" />
                  Pages ({pages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {pages.map((page, index) => (
                    <div
                      key={page.id}
                      onClick={() => setSelectedPageIndex(index)}
                      className={`relative cursor-pointer rounded-lg border-2 p-1 transition-all ${
                        selectedPageIndex === index
                          ? 'border-gold bg-gold/10'
                          : 'border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <img
                        src={page.imageData}
                        alt={`Page ${index + 1}`}
                        className="w-full h-16 object-cover rounded"
                        style={{
                          transform: `rotate(${page.rotation}deg)`,
                          filter: `brightness(${page.brightness}%) contrast(${page.contrast}%)`
                        }}
                      />
                      <span className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                        {index + 1}
                      </span>
                      {signatures.some(s => s.pageIndex === index) && (
                        <Pen className="absolute top-1 right-1 w-3 h-3 text-gold" />
                      )}
                    </div>
                  ))}
                  {pages.length === 0 && (
                    <div className="col-span-3 text-center text-slate-500 py-8">
                      No pages yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center - Preview */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-white text-lg">
                  {selectedPage ? `Page ${selectedPageIndex + 1}` : 'Preview'}
                </CardTitle>
                {selectedPage && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => rotatePage(selectedPage.id, 'ccw')}
                      className="text-slate-400 hover:text-white"
                    >
                      <RotateCw className="w-4 h-4 rotate-180" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => rotatePage(selectedPage.id, 'cw')}
                      className="text-slate-400 hover:text-white"
                    >
                      <RotateCw className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deletePage(selectedPage.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {selectedPage ? (
                  <div className="space-y-4">
                    <div className="relative bg-slate-800 rounded-lg p-4 flex items-center justify-center min-h-[400px]">
                      <img
                        src={selectedPage.imageData}
                        alt="Preview"
                        className="max-w-full max-h-[400px] object-contain rounded"
                        style={{
                          transform: `rotate(${selectedPage.rotation}deg)`,
                          filter: `brightness(${selectedPage.brightness}%) contrast(${selectedPage.contrast}%)`
                        }}
                      />
                    </div>

                    {/* Adjustments */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-400 text-sm">Brightness</Label>
                        <Slider
                          value={[selectedPage.brightness]}
                          min={50}
                          max={150}
                          step={5}
                          onValueChange={([val]) => updatePageAdjustments(selectedPage.id, val, selectedPage.contrast)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-400 text-sm">Contrast</Label>
                        <Slider
                          value={[selectedPage.contrast]}
                          min={50}
                          max={150}
                          step={5}
                          onValueChange={([val]) => updatePageAdjustments(selectedPage.id, selectedPage.brightness, val)}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <FileText className="h-16 w-16 mb-4 opacity-50" />
                    <p>Capture or upload pages to preview</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Signature Panel */}
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Pen className="h-5 w-5 text-gold" />
                  Signature
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isDrawingSignature ? (
                  <div className="space-y-3">
                    <canvas
                      ref={signatureCanvasRef}
                      width={400}
                      height={150}
                      className="w-full border border-slate-600 rounded-lg bg-white cursor-crosshair touch-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={saveSignature}
                        className="flex-1 bg-gold text-black hover:bg-gold/90"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Add to Page
                      </Button>
                      <Button
                        onClick={clearSignatureCanvas}
                        variant="outline"
                        className="border-slate-600"
                      >
                        Clear
                      </Button>
                      <Button
                        onClick={() => setIsDrawingSignature(false)}
                        variant="ghost"
                        className="text-slate-400"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={startSignatureDrawing}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300"
                    disabled={pages.length === 0}
                  >
                    <Pen className="w-4 h-4 mr-2" />
                    Draw Signature
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Export */}
            <Button
              onClick={exportToPDF}
              disabled={pages.length === 0 || processing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Export to PDF ({pages.length} page{pages.length !== 1 ? 's' : ''})
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden canvas for capturing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
