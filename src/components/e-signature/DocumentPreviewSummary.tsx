/**
 * DocumentPreviewSummary — Read-only visual preview of the document with placed fields.
 * Used in Step 4 (Review & Send) of CreateEnvelope.
 */
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import PdfPageCanvas from "./PdfPageCanvas";
import {
  type SignatureField,
  type Recipient,
  fieldTypes,
  recipientColorStyles,
  loadPdfJs,
} from "./documentFieldTypes";

interface DocumentPreviewSummaryProps {
  pdfUrl: string;
  pdfFile?: File | null;
  fields: SignatureField[];
  recipients: Recipient[];
}

export default function DocumentPreviewSummary({
  pdfUrl,
  pdfFile,
  fields,
  recipients,
}: DocumentPreviewSummaryProps) {
  const [previewPage, setPreviewPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const lib = await loadPdfJs();
        const doc = await lib.getDocument(pdfUrl).promise;
        if (!cancelled) {
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          const pageCounts: Record<number, number> = {};
          fields.forEach((f) => {
            pageCounts[f.pageNumber] = (pageCounts[f.pageNumber] || 0) + 1;
          });
          const bestPage = Object.entries(pageCounts).sort(
            (a, b) => b[1] - a[1]
          )[0];
          if (bestPage) setPreviewPage(Number(bestPage[0]));
        }
      } catch (e) {
        console.warn("Preview load failed:", e);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [pdfUrl, fields]);

  /** If PdfPageCanvas loads the doc independently, cache it here */
  const handleDocLoaded = useCallback((doc: any) => {
    setPdfDoc(doc);
    setTotalPages(doc.numPages);
  }, []);

  const pageFields = fields.filter((f) => f.pageNumber === previewPage);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Eye className="w-4 h-4 text-[hsl(var(--gold))]" />
          Document Preview
          <Badge variant="secondary" className="text-xs ml-auto">
            Page {previewPage} of {totalPages}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        {/* Page selector for multi-page docs */}
        {totalPages > 1 && (
          <div className="flex gap-1 mb-3 flex-wrap">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const count = fields.filter((f) => f.pageNumber === p).length;
              return (
                <button
                  key={p}
                  onClick={() => setPreviewPage(p)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                    previewPage === p
                      ? "bg-[hsl(var(--gold))] text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  P{p}
                  {count > 0 && ` (${count})`}
                </button>
              );
            })}
          </div>
        )}

        {/* Scaled-down preview with field overlays INSIDE the scaled container */}
        <div className="relative border rounded-lg bg-[#FDFBF7]" style={{ maxHeight: "500px", overflow: "auto" }}>
          {/* Scroll fade indicator */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/80 to-transparent z-20 rounded-b-lg" />

          <div
            className="relative"
            style={{
              transform: "scale(0.5)",
              transformOrigin: "top left",
              width: "200%",
              pointerEvents: "none",
            }}
          >
            <PdfPageCanvas
              pdfDoc={pdfDoc}
              pageNumber={previewPage}
              pdfUrl={pdfUrl}
              onDocLoaded={handleDocLoaded}
            />

            {/* Field overlays — inside scaled container so they align with PDF */}
            {pageFields.map((field) => {
              const rIndex = recipients.findIndex(
                (r) => r.id === field.recipientId
              );
              const style =
                recipientColorStyles[rIndex % recipientColorStyles.length];
              const fieldConfig = fieldTypes.find((f) => f.type === field.type);

              return (
                <div
                  key={field.id}
                  className={`absolute rounded border-2 ${style.border} ${style.light}`}
                  style={{
                    left: `${field.x}%`,
                    top: `${field.y}%`,
                    width: `${field.width}px`,
                    height: `${field.height}px`,
                    opacity: 0.9,
                  }}
                >
                  <span
                    className={`text-xs font-semibold ${style.text} block truncate px-1 leading-tight mt-0.5`}
                  >
                    {field.label || fieldConfig?.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Field summary by recipient */}
        <div className="mt-3 space-y-2">
          {recipients.map((r, i) => {
            const rFields = fields.filter((f) => f.recipientId === r.id);
            if (rFields.length === 0) return null;
            const style =
              recipientColorStyles[i % recipientColorStyles.length];
            const typeGroups = rFields.reduce<Record<string, number>>((acc, f) => {
              acc[f.type] = (acc[f.type] || 0) + 1;
              return acc;
            }, {});
            const pages = [...new Set(rFields.map((f) => f.pageNumber))].sort();

            return (
              <div key={r.id} className="flex items-start gap-2 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5"
                  style={{ background: style.hex }}
                />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-foreground">{r.name}</span>
                  <span className="text-muted-foreground ml-1">({r.email})</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(typeGroups).map(([type, count]) => (
                      <Badge
                        key={type}
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {count}× {type}
                      </Badge>
                    ))}
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      pg {pages.join(", ")}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
