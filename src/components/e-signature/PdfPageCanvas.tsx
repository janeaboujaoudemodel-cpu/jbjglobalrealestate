import { useRef, useState, useEffect } from "react";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadPdfJs } from "./documentFieldTypes";

interface PdfPageCanvasProps {
  pdfDoc: any;
  pageNumber: number;
  pdfUrl: string;
  /** Called when this component independently loads a PDF doc (when pdfDoc prop is null) */
  onDocLoaded?: (doc: any) => void;
  /** Called whenever the rendered CSS size of the page changes */
  onSizeChange?: (size: { w: number; h: number }) => void;
}

export default function PdfPageCanvas({ pdfDoc, pageNumber, pdfUrl, onDocLoaded, onSizeChange }: PdfPageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [canvasCssSize, setCanvasCssSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      setRendering(true);
      setFailed(false);
      try {
        let doc = pdfDoc;
        if (!doc) {
          const lib = await loadPdfJs();
          doc = await lib.getDocument(pdfUrl).promise;
          if (!cancelled && onDocLoaded) onDocLoaded(doc);
        }
        const page = await doc.getPage(pageNumber);
        // HiDPI: render at device pixel ratio for crisp text/graphics
        const dpr = Math.max(window.devicePixelRatio || 1, 1.5);
        const viewport = page.getViewport({ scale: dpr });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        // CSS size = viewport at scale 1 (logical pixels)
        const cssViewport = page.getViewport({ scale: 1 });
        canvas.style.width = `${cssViewport.width}px`;
        canvas.style.height = `${cssViewport.height}px`;
        setCanvasCssSize({ w: cssViewport.width, h: cssViewport.height });
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch (err) {
        console.warn("PDF page render failed:", err);
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setRendering(false);
      }
    }
    render();
    return () => { cancelled = true; };
  }, [pdfDoc, pageNumber, pdfUrl, retryKey, onDocLoaded]);

  if (failed) {
    return (
      <div className="w-full flex flex-col items-center justify-center gap-3 py-12 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30"
           style={{ minHeight: "400px" }}>
        <AlertTriangle className="w-8 h-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Failed to render this page</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRetryKey((k) => k + 1)}
          className="gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div
      className="relative flex justify-center"
      style={{
        width: canvasCssSize ? `${canvasCssSize.w}px` : "100%",
        minHeight: canvasCssSize ? `${canvasCssSize.h}px` : "600px",
      }}
    >
      {rendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 z-10 rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--gold))]" />
        </div>
      )}
      <canvas ref={canvasRef} style={{ pointerEvents: "none", display: "block" }} />
    </div>
  );
}
