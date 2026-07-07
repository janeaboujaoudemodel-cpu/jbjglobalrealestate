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
      let renderTask: any = null;
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
        renderTask = page.render({ canvasContext: context, viewport: renderViewport });
        await renderTask.promise;
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    renderPage().catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      try {
        const canvas = canvasRef.current;
        canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
      } catch {
        // no-op: cleanup best effort
      }
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
  const [renderedPages, setRenderedPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDoc(null);
    setPageCount(0);
    setRenderedPages(0);
    let loadingTask: any = null;

    async function load() {
      const pdfjs = await loadPdfJs();
      loadingTask = pdfjs.getDocument({ url, withCredentials: false, useWorkerFetch: false, rangeChunkSize: 65536 });
      const loadedDoc = await loadingTask.promise;
      if (cancelled) return;
      setDoc(loadedDoc);
      setPageCount(Math.min(loadedDoc.numPages || 1, maxPages));
      setRenderedPages(Math.min(2, loadedDoc.numPages || 1, maxPages));
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
      try { loadingTask?.destroy?.(); } catch { /* no-op */ }
    };
  }, [url, maxPages]);

  useEffect(() => {
    if (!doc || !pageCount || renderedPages >= pageCount) return;
    const id = window.setTimeout(() => {
      setRenderedPages((current) => Math.min(pageCount, current + 2));
    }, 180);
    return () => window.clearTimeout(id);
  }, [doc, pageCount, renderedPages]);

  if (loading) {
    return (
      <div className={`grid min-h-[420px] place-items-center bg-[#FDFBF7] ${className}`} aria-label={`Loading ${title}`}>
        <div
          className="flex items-center gap-3 rounded-full px-5 py-2.5 text-sm font-semibold"
          style={{
            backgroundImage: 'linear-gradient(135deg,#064E3B 0%,#042c1c 58%,#000 100%)',
            color: '#FFFFFF',
            border: '1px solid rgba(255,255,255,0.22)',
            boxShadow: '0 10px 30px -14px rgba(0,0,0,0.5)',
          }}
        >
          <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#FFFFFF' }} />
          <span style={{ color: '#FFFFFF' }}>Loading document…</span>
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
      {Array.from({ length: renderedPages }, (_, index) => (
        <PdfPage key={index + 1} doc={doc} pageNumber={index + 1} />
      ))}
      {renderedPages < pageCount && (
        <div className="grid min-h-[120px] place-items-center rounded-lg px-3 py-4 text-center text-xs font-semibold" style={{ backgroundImage: 'linear-gradient(135deg,#064E3B 0%,#042c1c 58%,#000 100%)', color: '#FFFFFF' }}>
          <span className="inline-flex items-center gap-2" style={{ color: '#FFFFFF' }}><Loader2 className="h-4 w-4 animate-spin" style={{ color: '#FFFFFF' }} /> Loading more pages…</span>
        </div>
      )}

      {doc.numPages > pageCount && (
        <p className="rounded-lg border border-[#B89555]/25 bg-[#F7F2EA] px-3 py-2 text-center text-xs font-semibold text-[#1A1A1A]/75">
          Showing first {pageCount} of {doc.numPages} pages. Download for the complete file.
        </p>
      )}
    </div>
  );
}