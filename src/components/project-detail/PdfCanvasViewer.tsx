import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

type PdfCanvasViewerProps = {
  url: string;
  title: string;
  maxPages?: number;
  className?: string;
};

async function loadPdfJs() {
  const pdfjs: any = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  return pdfjs;
}

function PdfPage({ doc, pageNumber }: { doc: any; pageNumber: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function renderPage() {
      setLoading(true);
      try {
        const page = await doc.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const maxCssWidth = 1100;
        const cssScale = Math.min(1.35, maxCssWidth / baseViewport.width);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const renderViewport = page.getViewport({ scale: cssScale * dpr });
        const cssViewport = page.getViewport({ scale: cssScale });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        canvas.width = Math.floor(renderViewport.width);
        canvas.height = Math.floor(renderViewport.height);
        canvas.style.width = `${Math.floor(cssViewport.width)}px`;
        canvas.style.height = `${Math.floor(cssViewport.height)}px`;

        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable");
        await page.render({ canvasContext: context, viewport: renderViewport }).promise;
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    renderPage().catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [doc, pageNumber]);

  return (
    <div className="relative mx-auto w-full overflow-x-auto rounded-lg bg-[#FDFBF7] p-3 shadow-inner">
      {loading && (
        <div className="absolute inset-0 z-10 grid min-h-[260px] place-items-center bg-[#FDFBF7]/85">
          <Loader2 className="h-7 w-7 animate-spin text-[#064E3B]" />
        </div>
      )}
      <canvas ref={canvasRef} className="mx-auto block max-w-full" aria-label={`Page ${pageNumber}`} />
    </div>
  );
}

export default function PdfCanvasViewer({ url, title, maxPages = 999, className = "" }: PdfCanvasViewerProps) {
  const [doc, setDoc] = useState<any | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDoc(null);
    setPageCount(0);

    async function load() {
      const pdfjs = await loadPdfJs();
      const response = await fetch(url, { credentials: "same-origin" });
      if (!response.ok) throw new Error(`Document returned ${response.status}`);
      const data = await response.arrayBuffer();
      const loadedDoc = await pdfjs.getDocument({ data: new Uint8Array(data), useWorkerFetch: false }).promise;
      if (cancelled) return;
      setDoc(loadedDoc);
      setPageCount(Math.min(loadedDoc.numPages || 1, maxPages));
    }

    load()
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Document could not be rendered");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url, maxPages]);

  if (loading) {
    return (
      <div className={`grid min-h-[420px] place-items-center bg-[#FDFBF7] ${className}`} aria-label={`Loading ${title}`}>
        <div className="flex items-center gap-3 rounded-full border border-[#B89555]/35 bg-[#F7F2EA] px-4 py-2 text-sm font-semibold text-[#1A1A1A]">
          <Loader2 className="h-4 w-4 animate-spin text-[#064E3B]" />
          Loading document…
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className={`grid min-h-[420px] place-items-center bg-[#FDFBF7] p-6 text-center ${className}`}>
        <div className="max-w-sm rounded-xl border border-[#B89555]/35 bg-[#F7F2EA] p-5 text-[#1A1A1A]">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-[#064E3B]" />
          <p className="font-semibold">Preview unavailable</p>
          <p className="mt-1 text-sm text-[#1A1A1A]/75">Use Download to open the original document.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 overflow-y-auto bg-[#FDFBF7] p-4 ${className}`} aria-label={title}>
      {Array.from({ length: pageCount }, (_, index) => (
        <PdfPage key={index + 1} doc={doc} pageNumber={index + 1} />
      ))}
      {doc.numPages > pageCount && (
        <p className="rounded-lg border border-[#B89555]/25 bg-[#F7F2EA] px-3 py-2 text-center text-xs font-semibold text-[#1A1A1A]/75">
          Showing first {pageCount} of {doc.numPages} pages. Download for the complete file.
        </p>
      )}
    </div>
  );
}