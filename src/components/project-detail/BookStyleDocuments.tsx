import { useRef, useMemo, useState } from "react";
import { Download, FileText, DollarSign, Layers, ClipboardList, Image, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { SafeImage } from "@/components/SafeImage";
import { proxyAnyDownloadUrl } from "@/utils/downloadProxy";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

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

function humanizeDocTitle(rawName: string): string {
  let t = rawName
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/\(\d+\)\s*$/g, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return rawName;
  return t.replace(/\b\w/g, (c) => c.toUpperCase());
}

const typeIcon: Record<string, React.ReactNode> = {
  brochure: <FileText className="w-4 h-4" />,
  fact_sheet: <FileText className="w-4 h-4" />,
  payment_plan: <DollarSign className="w-4 h-4" />,
  floor_plan: <Layers className="w-4 h-4" />,
  inventory: <ClipboardList className="w-4 h-4" />,
  renders: <Image className="w-4 h-4" />,
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
    <div className="relative">
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/60 font-semibold mb-1">The Library</p>
        <h3 className="text-[#1A1A1A] text-2xl md:text-3xl font-semibold tracking-tight">Project Documents</h3>
        <div className="w-16 h-px bg-[#B89555] mt-3" />
      </div>

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
        {visibleDocs.map((doc) => {
          const title = doc.display_title || doc.name || humanizeDocTitle(doc.type);
          const coverUrl = doc.cover_image_url || projectImageUrl;
          const icon = typeIcon[doc.type] || <FileText className="w-3.5 h-3.5" />;
          const typeLabel = humanizeDocTitle(doc.type);
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

              {/* Top-right type chip — approved emerald label, pure white content */}
              <div data-emerald-action="true" className="jj-emerald-action absolute top-3 right-3 z-20 inline-flex items-center gap-1 px-2 py-0.5 rounded-full shadow-sm max-w-[112px]">
                <span className="text-white [&>svg]:w-3 [&>svg]:h-3">{icon}</span>
                <span className="text-[8px] uppercase tracking-[0.12em] font-bold text-white truncate">{typeLabel}</span>
              </div>

              {/* Bottom label panel — emerald fill, pure white text */}
              <div
                data-no-contrast-guard
                data-on-dark
                className="absolute inset-x-0 bottom-0 h-[40%] border-t border-black/30 px-3.5 py-3 flex flex-col justify-between allow-white"
                style={{
                  background: "linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #000000 100%)",
                  color: "#FFFFFF",
                }}
              >
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] font-bold mb-1.5 line-clamp-1 allow-white" style={{ color: "#FFFFFF" }}>
                    {projectName}
                  </p>
                  <p className="font-bold text-[14px] leading-tight line-clamp-2 allow-white" style={{ color: "#FFFFFF" }}>
                    {title}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold allow-white" style={{ color: "#FFFFFF" }}>View / Download</span>
                  <Eye className="w-3.5 h-3.5 allow-white" style={{ color: "#FFFFFF" }} />
                </div>
              </div>



              {/* Page edges effect — right side, simulates paper stack */}
              <div className="absolute right-0 top-0 bottom-0 w-[3px] z-10">
                <div className="absolute inset-y-0 right-0 w-px bg-[#1A1A1A]/40" />
                <div className="absolute inset-y-0 right-[2px] w-px bg-[#F7F2EA]/60" />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* PDF Viewer Modal */}
      <Dialog open={!!viewerUrl} onOpenChange={(open) => !open && setViewerUrl(null)}>
        <DialogContent className="max-w-5xl h-[85vh] p-0 bg-card border-[#B89555]/30 rounded-xl overflow-hidden">
          <DialogTitle className="sr-only">{viewerTitle}</DialogTitle>
          <div className="flex flex-col h-full">
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-[#B89555]/20">
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
            {/* PDF iframe */}
            <div className="flex-1 bg-[#FDFBF7] rounded-b-xl overflow-hidden">
              {viewerUrl && (
                <iframe
                  src={viewerUrl}
                  className="w-full h-full"
                  title={viewerTitle}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
