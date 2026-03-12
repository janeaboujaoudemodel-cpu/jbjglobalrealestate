import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, RotateCcw } from "lucide-react";

interface ESignaturePadProps {
  onSignatureChange: (signatureDataUrl: string | null) => void;
  savedSignature?: string | null;
  height?: number;
}

interface StrokePoint {
  x: number;
  y: number;
}

export default function ESignaturePad({ 
  onSignatureChange, 
  savedSignature,
  height = 150
}: ESignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([]);
  const lastPoint = useRef<StrokePoint | null>(null);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${height}px`;
    
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (savedSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, height);
        setHasSignature(true);
      };
      img.src = savedSignature;
    }
  }, [height, savedSignature]);

  useEffect(() => {
    initCanvas();
    const handleResize = () => initCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initCanvas]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const saveSnapshot = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setStrokeHistory(prev => [...prev.slice(-20), snapshot]);
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    saveSnapshot();
    setIsDrawing(true);
    const point = getCoordinates(e);
    lastPoint.current = point;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const point = getCoordinates(e);
    
    // Smooth curve using quadratic bezier through midpoint
    if (lastPoint.current) {
      const mid = {
        x: (lastPoint.current.x + point.x) / 2,
        y: (lastPoint.current.y + point.y) / 2,
      };
      ctx.quadraticCurveTo(lastPoint.current.x, lastPoint.current.y, mid.x, mid.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mid.x, mid.y);
    }
    
    lastPoint.current = point;
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPoint.current = null;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasContent = imageData.data.some((pixel, index) => index % 4 === 3 && pixel > 0);
    
    if (hasContent) {
      setHasSignature(true);
      onSignatureChange(canvas.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas || !container) return;

    const rect = container.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, height);
    setHasSignature(false);
    setStrokeHistory([]);
    onSignatureChange(null);
  };

  const undoLastStroke = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas || strokeHistory.length === 0) return;

    const prev = strokeHistory[strokeHistory.length - 1];
    ctx.putImageData(prev, 0, 0);
    setStrokeHistory(h => h.slice(0, -1));

    // Check if there's still content
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasContent = imageData.data.some((pixel, index) => index % 4 === 3 && pixel > 0);
    setHasSignature(hasContent);
    onSignatureChange(hasContent ? canvas.toDataURL('image/png') : null);
  };

  return (
    <div className="space-y-3">
      <div 
        ref={containerRef}
        className="border-2 border-dashed border-border rounded-xl bg-background overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair touch-none"
          style={{ height: `${height}px` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <div className="border-t border-border py-2 text-center text-sm text-muted-foreground">
          Sign above this line
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={clearSignature}
          size="sm"
          className="flex-1"
        >
          <Eraser className="w-4 h-4 mr-2" />
          Clear
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={undoLastStroke}
          size="sm"
          className="flex-1"
          disabled={strokeHistory.length === 0}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Undo
        </Button>
      </div>
    </div>
  );
}
