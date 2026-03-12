import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Check, RotateCcw, AlertTriangle } from "lucide-react";

interface SignaturePadProps {
  onSignatureChange: (signatureDataUrl: string | null) => void;
  requiredIdMatch?: boolean;
  savedSignature?: string | null;
}

interface StrokePoint { x: number; y: number; }

export default function SignaturePad({ 
  onSignatureChange, 
  requiredIdMatch = true,
  savedSignature 
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([]);
  const lastPoint = useRef<StrokePoint | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (savedSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasSignature(true);
      };
      img.src = savedSignature;
    }
  }, [savedSignature]);

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
    setStrokeHistory(prev => [...prev.slice(-20), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
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
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const point = getCoordinates(e);
    if (lastPoint.current) {
      const mid = { x: (lastPoint.current.x + point.x) / 2, y: (lastPoint.current.y + point.y) / 2 };
      ctx.quadraticCurveTo(lastPoint.current.x, lastPoint.current.y, mid.x, mid.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mid.x, mid.y);
    }
    lastPoint.current = point;
    setHasSignature(true);
  };

  const stopDrawing = () => {
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
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setStrokeHistory([]);
    onSignatureChange(null);
  };

  const undoLastStroke = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas || strokeHistory.length === 0) return;
    ctx.putImageData(strokeHistory[strokeHistory.length - 1], 0, 0);
    setStrokeHistory(h => h.slice(0, -1));
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasContent = imageData.data.some((pixel, index) => index % 4 === 3 && pixel > 0);
    setHasSignature(hasContent);
    onSignatureChange(hasContent ? canvas.toDataURL('image/png') : null);
  };

  const confirmSignature = () => {
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      onSignatureChange(canvas.toDataURL('image/png'));
    }
  };

  return (
    <div className="space-y-4">
      {requiredIdMatch && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">Important: Signature Verification Required</p>
            <p>Your signature must match the signature on your passport/ID. If signatures don't match, your application will be rejected.</p>
          </div>
        </div>
      )}

      <div className="border-2 border-dashed border-border rounded-xl p-2 bg-background">
        <canvas
          ref={canvasRef}
          className="w-full h-48 cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <div className="border-t border-border mt-2 pt-2 text-center text-sm text-muted-foreground">
          Sign above this line
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={clearSignature} className="flex-1">
          <Eraser className="w-4 h-4 mr-2" /> Clear
        </Button>
        <Button type="button" variant="outline" onClick={undoLastStroke} className="flex-1" disabled={strokeHistory.length === 0}>
          <RotateCcw className="w-4 h-4 mr-2" /> Undo
        </Button>
        <Button type="button" onClick={confirmSignature} disabled={!hasSignature} variant="primary" className="flex-1">
          <Check className="w-4 h-4 mr-2" /> Confirm
        </Button>
      </div>
    </div>
  );
}
