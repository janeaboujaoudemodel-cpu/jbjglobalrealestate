import { Download, FileText, Image, DollarSign, ClipboardList, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const handleDownload = (doc: Document) => {
    window.open(doc.file_url, "_blank");
  };

  const handleDownloadAll = () => {
    documents.forEach((doc) => {
      window.open(doc.file_url, "_blank");
    });
  };

  if (!documents || documents.length === 0) {
    return null;
  }

  // Group documents by type
  const groupedDocs = documents.reduce((acc, doc) => {
    if (!acc[doc.document_type]) {
      acc[doc.document_type] = [];
    }
    acc[doc.document_type].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#2a2a2a]">
      <div className="flex items-center justify-between mb-6">
        <h3
          className="text-white text-xl font-semibold"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Downloads
        </h3>
        {documents.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadAll}
            className="border-[#D4A017] text-[#D4A017] hover:bg-[#D4A017] hover:text-black"
          >
            <Download className="w-4 h-4 mr-2" />
            Download All
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {Object.entries(groupedDocs).map(([type, docs]) => (
          <div key={type}>
            {docs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleDownload(doc)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#0d0d0d] hover:bg-[#252525] transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#D4A017]/10 flex items-center justify-center text-[#D4A017]">
                  {getDocumentIcon(type)}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">{getDocumentLabel(type)}</p>
                  <p className="text-gray-500 text-sm truncate">{doc.file_name}</p>
                </div>
                <Download className="w-5 h-5 text-gray-500 group-hover:text-[#D4A017] transition-colors" />
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentDownloads;
