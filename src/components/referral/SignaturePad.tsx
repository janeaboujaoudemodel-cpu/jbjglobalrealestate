import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Check, RotateCcw, AlertTriangle } from "lucide-react";

interface SignaturePadProps {
  onSignatureChange: (signatureDataUrl: string | null) => void;
  requiredIdMatch?: boolean;
  savedSignature?: string | null;
}

export default function SignaturePad({ 
  onSignatureChange, 
  requiredIdMatch = true,
  savedSignature 
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    
    // Set drawing style
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw saved signature if exists
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
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      onSignatureChange(canvas.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignatureChange(null);
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

      <div className="border-2 border-dashed border-gray-300 rounded-xl p-2 bg-white">
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
        <div className="border-t border-gray-200 mt-2 pt-2 text-center text-sm text-gray-400">
          Sign above this line
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={clearSignature}
          className="flex-1"
        >
          <Eraser className="w-4 h-4 mr-2" />
          Clear
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={clearSignature}
          className="flex-1"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Redo
        </Button>
        <Button
          type="button"
          onClick={confirmSignature}
          disabled={!hasSignature}
          variant="primary"
          className="flex-1"
        >
          <Check className="w-4 h-4 mr-2" />
          Confirm
        </Button>
      </div>
    </div>
  );
}
