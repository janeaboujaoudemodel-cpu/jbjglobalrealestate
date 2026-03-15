/**
 * DocumentPreviewSummary — Read-only visual preview of the document with placed fields.
 * Used in Step 4 (Review & Send) of CreateEnvelope.
 */
import { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import PdfPageCanvas from "./PdfPageCanvas";
import {
  type SignatureField,
  type Recipient,
  fieldTypes,
  recipientColorStyles,
  getInitials,
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
  const pdfDocRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const lib = await loadPdfJs();
        const doc = await lib.getDocument(pdfUrl).promise;
        if (!cancelled) {
          pdfDocRef.current = doc;
          setTotalPages(doc.numPages);
          // Default to page with most fields
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

        {/* Scaled-down preview with field overlays */}
        <div
          className="relative border rounded-lg overflow-hidden bg-white"
          style={{ maxHeight: "400px", overflow: "hidden" }}
        >
          <div
            style={{
              transform: "scale(0.5)",
              transformOrigin: "top left",
              width: "200%",
              pointerEvents: "none",
            }}
          >
            <PdfPageCanvas
              pdfDoc={pdfDocRef.current}
              pageNumber={previewPage}
              pdfUrl={pdfUrl}
            />
          </div>

          {/* Field overlays at 50% scale */}
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
                className={`absolute rounded border ${style.border} ${style.light}`}
                style={{
                  left: `${field.x * 0.5}%`,
                  top: `${field.y * 0.5}%`,
                  width: `${field.width * 0.5}px`,
                  height: `${field.height * 0.5}px`,
                  opacity: 0.85,
                }}
              >
                <span
                  className={`text-[7px] font-medium ${style.text} block truncate px-0.5`}
                >
                  {field.label || fieldConfig?.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Field summary by recipient */}
        <div className="mt-3 space-y-1.5">
          {recipients.map((r, i) => {
            const rFields = fields.filter((f) => f.recipientId === r.id);
            if (rFields.length === 0) return null;
            const style =
              recipientColorStyles[i % recipientColorStyles.length];
            return (
              <div key={r.id} className="flex items-center gap-2 text-xs">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: style.hex }}
                />
                <span className="font-medium text-foreground">{r.name}</span>
                <span className="text-muted-foreground">
                  — {rFields.length} field{rFields.length !== 1 ? "s" : ""}:{" "}
                  {[...new Set(rFields.map((f) => f.type))].join(", ")}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
