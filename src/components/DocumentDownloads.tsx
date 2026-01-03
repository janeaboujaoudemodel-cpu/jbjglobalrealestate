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
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
      <div className="flex items-center justify-between mb-6">
        <h3
          className="text-white text-xl font-semibold"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Project Materials
        </h3>
        {documents.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadAll}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white bg-transparent"
          >
            <Download className="w-4 h-4 mr-2" />
            Download All Materials
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
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 transition-colors group border border-zinc-800 hover:border-zinc-600"
              >
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
                  {getDocumentIcon(type)}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">{getDocumentLabel(type)}</p>
                  <p className="text-zinc-500 text-sm truncate">{doc.file_name}</p>
                </div>
                <Download className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentDownloads;
