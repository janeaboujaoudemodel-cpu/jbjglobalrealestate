import { useRef, useMemo, useState } from "react";
import { Download, FileText, DollarSign, Layers, ClipboardList, Image, ChevronLeft, ChevronRight, Eye, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/SafeImage";
import { maybeProxyStorageUrl } from "@/utils/downloadProxy";
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

const typeGradient: Record<string, string> = {
  brochure: "from-gold/70 to-amber-800/80",
  fact_sheet: "from-gold/60 to-amber-700/70",
  payment_plan: "from-emerald-700/70 to-emerald-900/80",
  floor_plan: "from-sky-700/70 to-sky-900/80",
  inventory: "from-violet-700/70 to-violet-900/80",
  renders: "from-rose-700/70 to-rose-900/80",
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
    const proxiedUrl = maybeProxyStorageUrl(doc.url);
    setViewerUrl(proxiedUrl);
    setViewerTitle(title);
    setViewerFilename(filename);
  };

  return (
    <div className="relative">
      <h3 className="text-foreground text-h3 font-medium mb-4">Project Documents</h3>

      {visibleDocs.length > 3 && (
        <>
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 rounded-full p-1.5 text-white hover:bg-black/80 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 rounded-full p-1.5 text-white hover:bg-black/80 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {visibleDocs.map((doc) => {
          const title = doc.display_title || doc.name || humanizeDocTitle(doc.type);
          const coverUrl = doc.cover_image_url || projectImageUrl;
          const gradient = typeGradient[doc.type] || "from-zinc-700/70 to-zinc-900/80";
          const icon = typeIcon[doc.type] || <FileText className="w-4 h-4" />;
          const filename = `${projectName.replace(/\s+/g, "-")}-${title.replace(/\s+/g, "-")}.pdf`;

          return (
            <motion.button
              key={doc.id}
              onClick={() => handleBookClick(doc, title, filename)}
              className="snap-start flex-shrink-0 group relative rounded-lg overflow-hidden border border-gold/30 hover:border-gold/60 transition-all"
              style={{ width: 160, height: 220 }}
              whileHover={{ y: -4, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {/* Book cover image */}
              {coverUrl ? (
                <SafeImage
                  src={coverUrl}
                  alt={title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
              )}

              {/* Overlay gradient */}
              <div className={cn("absolute inset-0 bg-gradient-to-t", gradient)} />

              {/* Spine effect */}
              <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-r from-black/50 via-black/25 to-transparent" />

              {/* Top shine */}
              <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/15 to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-between p-3">
                <div className="flex items-start justify-between">
                  <span className="text-white/80">{icon}</span>
                  <Eye className="w-3.5 h-3.5 text-white/50 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-white font-semibold text-xs leading-tight line-clamp-3 mb-1">
                    {title}
                  </p>
                  <p className="text-white/60 text-[10px] uppercase tracking-wider">
                    {projectName}
                  </p>
                </div>
              </div>

              {/* Page edges effect (bottom) */}
              <div className="absolute bottom-0 left-1 right-1">
                <div className="h-[2px] bg-white/10 rounded-b mx-0.5" />
                <div className="h-[2px] bg-white/5 rounded-b mx-1 mt-[1px]" />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* PDF Viewer Modal */}
      <Dialog open={!!viewerUrl} onOpenChange={(open) => !open && setViewerUrl(null)}>
        <DialogContent className="max-w-5xl h-[85vh] p-0 bg-black border-gold/30">
          <DialogTitle className="sr-only">{viewerTitle}</DialogTitle>
          <div className="flex flex-col h-full">
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-gold/20">
              <p className="text-sm font-semibold text-foreground truncate">{viewerTitle}</p>
              <button
                onClick={() => viewerUrl && onDownload(viewerUrl, viewerFilename)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold text-black text-sm font-medium hover:bg-gold-light transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
            {/* PDF iframe */}
            <div className="flex-1">
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
