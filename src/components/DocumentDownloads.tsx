import { Download, FileText, Image, DollarSign, ClipboardList, Layers, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { generateWatermarkId, logDocumentDownload } from "@/utils/pdfWatermark";
import { toast } from "sonner";

interface Document {
  id: string;
  document_type: string;
  file_url: string;
  file_name: string;
}

interface DocumentDownloadsProps {
  documents: Document[];
}

const getDocumentIcon = (type: string) => {
  switch (type) {
    case "brochure":
      return <FileText className="w-5 h-5" />;
    case "payment_plan":
      return <DollarSign className="w-5 h-5" />;
    case "floor_plan":
      return <Layers className="w-5 h-5" />;
    case "inventory":
      return <ClipboardList className="w-5 h-5" />;
    case "renders":
      return <Image className="w-5 h-5" />;
    default:
      return <FileText className="w-5 h-5" />;
  }
};

const getDocumentLabel = (type: string) => {
  switch (type) {
    case "brochure":
      return "Brochure";
    case "payment_plan":
      return "Payment Plan";
    case "floor_plan":
      return "Floor Plan";
    case "inventory":
      return "Inventory";
    case "renders":
      return "Renders";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ");
  }
};

const DocumentDownloads = ({ documents }: DocumentDownloadsProps) => {
  const { user } = useAuth();

  const handleDownload = async (doc: Document) => {
    const watermarkId = generateWatermarkId();
    
    // Log the download with watermark tracking (now writes to DB via DLP logger)
    await logDocumentDownload(
      doc.id,
      doc.document_type,
      watermarkId,
      user?.id,
      user?.email || undefined
    );

    toast.info("Document Downloaded", {
      description: `Watermark ID: ${watermarkId} - This download is tracked for IP protection.`,
      duration: 5000,
    });

    window.open(doc.file_url, "_blank");
  };

  const handleDownloadAll = async () => {
    const watermarkId = generateWatermarkId();
    
    toast.info("Downloading All Documents", {
      description: `Batch Watermark ID: ${watermarkId} - All downloads are tracked.`,
      duration: 5000,
    });

    for (const doc of documents) {
      await logDocumentDownload(
        doc.id,
        doc.document_type,
        watermarkId,
        user?.id,
        user?.email || undefined
      );
      window.open(doc.file_url, "_blank");
    }
  };

  if (!documents || documents.length === 0) {
    return null;
  }

  const groupedDocs = documents.reduce((acc, doc) => {
    if (!acc[doc.document_type]) {
      acc[doc.document_type] = [];
    }
    acc[doc.document_type].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  return (
    <div className="jj-card-inner">
      <div className="flex flex-col gap-3 mb-4">
        <h3 className="text-foreground text-h3 font-medium">
          Project Materials
        </h3>
        {documents.length > 1 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadAll}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Download All Materials
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4 p-3 bg-[#EFE6D6]/10 border border-[#B89555]/20 rounded-lg">
        <Shield className="w-4 h-4 text-[#1A1A1A] flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="text-[#1A1A1A] font-medium">Protected Content:</span> All downloads are watermarked and tracked for intellectual property protection.
        </p>
      </div>

      <div className="space-y-3">
        {Object.entries(groupedDocs).map(([type, docs]) => (
          <div key={type}>
            {docs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleDownload(doc)}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-card transition-colors group border border-[#B89555]/30 hover:border-[#B89555]/60"
              >
                <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#1A1A1A]">{getDocumentIcon(type)}</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-foreground font-medium truncate">{getDocumentLabel(type)}</p>
                  <p className="text-muted-foreground text-sm truncate max-w-[180px]">{doc.file_name}</p>
                </div>
                <Download className="w-5 h-5 text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentDownloads;
