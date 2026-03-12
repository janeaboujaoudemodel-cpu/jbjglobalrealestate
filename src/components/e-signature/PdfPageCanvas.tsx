import { useRef, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { loadPdfJs } from "./documentFieldTypes";

interface PdfPageCanvasProps {
  pdfDoc: any;
  pageNumber: number;
  pdfUrl: string;
}

export default function PdfPageCanvas({ pdfDoc, pageNumber, pdfUrl }: PdfPageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(false);
  const [failed, setFailed] = useState(false);

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
        }
        const page = await doc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
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
  }, [pdfDoc, pageNumber, pdfUrl]);

  if (failed) {
    return (
      <iframe
        src={`${pdfUrl}#page=${pageNumber}&toolbar=0&navpanes=0`}
        className="w-full border-0"
        style={{ height: "1200px", pointerEvents: "none" }}
        title={`Document Preview — Page ${pageNumber}`}
      />
    );
  }

  return (
    <div className="w-full flex justify-center" style={{ minHeight: "800px" }}>
      {rendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--gold))]" />
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-auto" style={{ pointerEvents: "none" }} />
    </div>
  );
}
