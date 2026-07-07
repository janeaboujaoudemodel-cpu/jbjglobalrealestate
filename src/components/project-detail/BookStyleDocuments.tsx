import { lazy, Suspense, useRef, useMemo, useState } from "react";
import { Download, FileText, DollarSign, Layers, ClipboardList, Image, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { SafeImage } from "@/components/SafeImage";
import { proxyAnyDownloadUrl } from "@/utils/downloadProxy";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cleanDocumentTitle } from "@/utils/documentTitles";

const PdfCanvasViewer = lazy(() => import("@/components/project-detail/PdfCanvasViewer"));

interface BookDoc {
  id: string;
  type: string;
  url: string;
  name?: string | null;
  display_title?: string | null;
  cover_image_url?: string | null;
  is_visible?: boolean;
  allow_download?: boolean;
}

interface BookStyleDocumentsProps {
  documents: BookDoc[];
  projectName: string;
  projectImageUrl?: string;
  onDownload: (url: string, filename: string) => void;
}

// Doc type detection — order matters. Citi Buddy is checked BEFORE brochure
// because concierge PDFs sometimes include "brochure" in filename.
function detectDocType(doc: BookDoc): { label: string; kind: string } {
  const raw = `${doc.display_title || ""} ${doc.name || ""} ${doc.type || ""}`.toLowerCase();
  const cleanTitle = cleanDocumentTitle(doc.display_title || doc.name || doc.type || "Document");
  if (/citi\s*buddy|city\s*buddy|\bbuddy\b|concierge/.test(raw)) return { label: "Citi Buddy", kind: "citi_buddy" };
  if (/fact\s*sheet|factsheet/.test(raw)) return { label: "Fact Sheet", kind: "fact_sheet" };
  if (/floor\s*plan/.test(raw)) return { label: /floor\s*plan$/i.test(cleanTitle) ? "Floor Plan" : cleanTitle, kind: "floor_plan" };
  if (/payment/.test(raw)) return { label: "Payment Plan", kind: "payment_plan" };
  if (/\bspa\b/.test(raw)) return { label: "SPA", kind: "spa" };
  if (/inventory/.test(raw)) return { label: "Inventory", kind: "inventory" };
  if (/brochure/.test(raw)) return { label: "Brochure", kind: "brochure" };
  return { label: cleanTitle, kind: doc.type || "document" };
}

const typeIcon: Record<string, React.ReactNode> = {
  brochure: <FileText className="w-4 h-4" />,
  fact_sheet: <FileText className="w-4 h-4" />,
  payment_plan: <DollarSign className="w-4 h-4" />,
  floor_plan: <Layers className="w-4 h-4" />,
  inventory: <ClipboardList className="w-4 h-4" />,
  renders: <Image className="w-4 h-4" />,
  citi_buddy: <FileText className="w-4 h-4" />,
  spa: <FileText className="w-4 h-4" />,
};


export default function BookStyleDocuments({
  documents,
  projectName,
  projectImageUrl,
  onDownload,
}: BookStyleDocumentsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState("");
  const [viewerFilename, setViewerFilename] = useState("");

  // Only show visible + downloadable docs
  const visibleDocs = useMemo(
    () => documents.filter((d) => (d.is_visible ?? true) && (d.allow_download ?? true)),
    [documents]
  );

  if (!visibleDocs.length) return null;

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -220 : 220, behavior: "smooth" });
  };

  const handleBookClick = (doc: BookDoc, title: string, filename: string) => {
    // Open PDF in-browser viewer
    const proxiedUrl = proxyAnyDownloadUrl(doc.url, { filename, disposition: "inline" });
    setViewerUrl(proxiedUrl);
    setViewerTitle(title);
    setViewerFilename(filename);
  };

  return (
    <details open className="relative group">
      <summary className="list-none cursor-pointer mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/60 font-semibold mb-1">The Library</p>
          <h3 className="text-[#1A1A1A] text-2xl md:text-3xl font-semibold tracking-tight">Project Documents ({visibleDocs.length})</h3>
          <div className="w-16 h-px bg-[#B89555] mt-3" />
        </div>
        <span className="text-xs font-bold text-[#064E3B] uppercase tracking-wider px-4 py-2 rounded-lg border border-[#064E3B]/30 bg-[#F7F2EA] whitespace-nowrap">
          <span className="group-open:hidden">Expand ▾</span>
          <span className="hidden group-open:inline">Collapse ▴</span>
        </span>
      </summary>
      <div className="relative">


      {visibleDocs.length > 3 && (
        <>
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            data-icon-circle="true"
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 bg-[#1A1A1A] rounded-full w-9 h-9 min-w-9 min-h-9 aspect-square p-0 inline-grid place-items-center text-[#F7F2EA] ring-1 ring-[#B89555]/60 shadow-lg hover:bg-[#1A1A1A]/90 transition-colors overflow-hidden"
            data-no-contrast-guard
          >
            <ChevronLeft className="w-4 h-4 allow-white" />
          </button>
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            data-icon-circle="true"
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-[#1A1A1A] rounded-full w-9 h-9 min-w-9 min-h-9 aspect-square p-0 inline-grid place-items-center text-[#F7F2EA] ring-1 ring-[#B89555]/60 shadow-lg hover:bg-[#1A1A1A]/90 transition-colors overflow-hidden"
            data-no-contrast-guard
          >
            <ChevronRight className="w-4 h-4 allow-white" />
          </button>
        </>
      )}

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 pt-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {(() => {
          // Precompute duplicate counts per kind so we can suffix " 1"/" 2"
          // when the same document type appears more than once (e.g. two Citi Buddy PDFs).
          const kindCounts: Record<string, number> = {};
          visibleDocs.forEach((d) => {
            const k = detectDocType(d).kind;
            kindCounts[k] = (kindCounts[k] || 0) + 1;
          });
          const kindSeen: Record<string, number> = {};
          return visibleDocs.map((doc) => {
            const detected = detectDocType(doc);
            kindSeen[detected.kind] = (kindSeen[detected.kind] || 0) + 1;
            const needsNumber = (kindCounts[detected.kind] || 0) > 1;
            const title = needsNumber ? `${detected.label} ${kindSeen[detected.kind]}` : detected.label;
            const coverUrl = doc.cover_image_url || projectImageUrl;
            const icon = typeIcon[detected.kind] || typeIcon[doc.type] || <FileText className="w-3.5 h-3.5" />;
            const filename = `${projectName.replace(/\s+/g, "-")}-${title.replace(/\s+/g, "-")}.pdf`;

          return (
            <motion.button
              key={doc.id}
              onClick={() => handleBookClick(doc, title, filename)}
              className="snap-start flex-shrink-0 group relative rounded-xl overflow-hidden ring-1 ring-[#B89555]/40 hover:ring-[#B89555] shadow-[0_12px_30px_-12px_rgba(0,0,0,0.45),0_4px_12px_-4px_rgba(0,0,0,0.25)] transition-all bg-[#1A1A1A]"
              style={{ width: 200, height: 280 }}
              whileHover={{ y: -6, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
              data-no-contrast-guard
            >
              {/* Book cover image — top portion */}
              <div className="absolute inset-x-0 top-0 h-[62%] overflow-hidden">
                {coverUrl ? (
                  <SafeImage
                    src={coverUrl}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#2a2a2a] to-[#1A1A1A]" />
                )}
                {/* Subtle vignette on image */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/32 via-transparent to-[#1A1A1A]/5" />
              </div>

              {/* Spine effect on left edge */}
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-[#0A0A0A] via-[#1A1A1A]/40 to-transparent z-10" />
              <div className="absolute left-[7px] top-3 bottom-3 w-px bg-[#B89555]/40 z-10" />

              {/* Top-right kind chip — smaller (~50%), single truthful label */}
              <div data-emerald-action="true" className="jj-emerald-action absolute top-2.5 right-2.5 z-20 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full shadow-sm min-h-[16px]">
                <span className="text-white [&>svg]:w-2.5 [&>svg]:h-2.5">{icon}</span>
                <span className="text-[6px] uppercase tracking-[0.08em] font-bold text-white leading-none">{title}</span>
              </div>

              {/* Bottom label panel — title vertically centred between photo bottom and buttons, no project name repetition */}
              <div
                data-no-contrast-guard
                data-on-dark
                className="absolute inset-x-0 bottom-0 h-[38%] border-t border-black/30 px-3 py-2.5 flex flex-col allow-white"
                style={{
                  background: "linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #000000 100%)",
                  color: "#FFFFFF",
                }}
              >
                <div className="flex-1 flex items-center justify-center">
                  <p
                    className="font-bold text-[15px] leading-tight text-center line-clamp-2 allow-white"
                    style={{ color: "#FFFFFF" }}
                  >
                    {title}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); handleBookClick(doc, title, filename); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleBookClick(doc, title, filename); } }}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-[10px] uppercase tracking-[0.16em] font-bold bg-white/15 border border-white/45 hover:bg-white/25 transition-colors allow-white"
                    style={{ color: "#FFFFFF" }}
                  >
                    <Eye className="w-3 h-3 allow-white" style={{ color: "#FFFFFF" }} />
                    View
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      const proxied = proxyAnyDownloadUrl(doc.url, { filename, disposition: "attachment" });
                      onDownload(proxied, filename);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation();
                        const proxied = proxyAnyDownloadUrl(doc.url, { filename, disposition: "attachment" });
                        onDownload(proxied, filename);
                      }
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-[10px] uppercase tracking-[0.16em] font-bold bg-white/15 border border-white/45 hover:bg-white/25 transition-colors allow-white"
                    style={{ color: "#FFFFFF" }}
                  >
                    <Download className="w-3 h-3 allow-white" style={{ color: "#FFFFFF" }} />
                    Save
                  </span>
                </div>
              </div>



              {/* Page edges effect — right side, simulates paper stack */}
              <div className="absolute right-0 top-0 bottom-0 w-[3px] z-10">
                <div className="absolute inset-y-0 right-0 w-px bg-[#1A1A1A]/40" />
                <div className="absolute inset-y-0 right-[2px] w-px bg-[#F7F2EA]/60" />
              </div>
            </motion.button>
          );
          });
        })()}
      </div>

      {/* PDF Viewer Modal */}
      <Dialog open={!!viewerUrl} onOpenChange={(open) => !open && setViewerUrl(null)}>
        <DialogContent className="!max-w-[96vw] w-[96vw] h-[94vh] p-0 bg-card border-[#B89555]/30 rounded-xl overflow-hidden">
          <DialogTitle className="sr-only">{viewerTitle}</DialogTitle>
          <div className="flex flex-col h-full min-h-0">
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-[#B89555]/20 shrink-0">
              <p className="text-sm font-semibold text-foreground truncate">{viewerTitle}</p>
              <button
                onClick={async () => {
                  if (!viewerUrl) return;
                  try {
                    const res = await fetch(viewerUrl);
                    const blob = await res.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = blobUrl;
                    link.download = viewerFilename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
                  } catch {
                    const link = document.createElement("a");
                    link.href = viewerUrl;
                    link.download = viewerFilename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
                data-surface="emerald"
                data-emerald-action="true"
                className="jj-emerald-action allow-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border shadow-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
            {/* Mobile hint */}
            <div className="md:hidden px-4 py-2 bg-[#F7F2EA] border-b border-[#B89555]/20 text-[11px] text-[#1A1A1A]/75 shrink-0">
              For the full document experience, open on desktop.
            </div>
            {/* PDF viewer — flex-1 + min-h-0 is required for the inner overflow-y-auto to scroll */}
            <div className="flex-1 min-h-0 bg-[#FDFBF7] rounded-b-xl overflow-hidden">
              {viewerUrl && (
                <Suspense fallback={<div className="grid h-full w-full place-items-center bg-[#FDFBF7]"><div data-surface="emerald" data-no-contrast-guard className="inline-flex items-center gap-3 rounded-full px-5 py-2.5 text-sm font-semibold allow-white" style={{ backgroundImage: 'linear-gradient(135deg,#064E3B 0%,#042c1c 58%,#000 100%)', color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Loading document…</div></div>}>
                  <PdfCanvasViewer url={viewerUrl} title={viewerTitle} maxPages={999} className="h-full w-full" />
                </Suspense>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </details>

  );
}
