/**
 * DocumentPreviewDialog
 * ---------------------
 * Read-only render of a saved crm_documents row. Opened from the global
 * DocumentActionSheet's "Preview" action. Never mutates the document.
 */
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { buildPAAHtml, JBJ_PAA_TEMPLATE_ID, type PAAFieldKey } from "@/templates/jbjPropertyAdvertisingAgreement";
import { sanitizeHtml } from "@/utils/contentSanitizer";
import type { CrmDocument } from "@/hooks/useCrmDocuments";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  doc: CrmDocument | null;
}

export default function DocumentPreviewDialog({ open, onOpenChange, doc }: Props) {
  if (!doc) return null;
  let html = doc.rendered_html || "";
  if (!html && doc.template_id === JBJ_PAA_TEMPLATE_ID) {
    html = buildPAAHtml((doc.field_values || {}) as Partial<Record<PAAFieldKey, string>>);
  }
  if (!html) {
    html = `<div style="padding:24px;font-family:Inter,sans-serif;color:#1A1A1A">
      <p style="opacity:.7;font-size:13px;">No rendered preview available for this template. Open in editor to view.</p>
      <pre style="white-space:pre-wrap;font-size:12px;background:#F7F2EA;padding:12px;border-radius:8px;border:1px solid #B89555;">${
        Object.entries(doc.field_values || {})
          .map(([k, v]) => `${k}: ${String(v ?? "")}`)
          .join("\n")
      }</pre>
    </div>`;
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 bg-[#FDFBF7] border-[#B89555]/40 overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-[#B89555]/25 bg-[#F7F2EA]">
          <DialogTitle className="text-sm font-semibold text-[#1A1A1A] truncate">
            Preview · {doc.title}
          </DialogTitle>
        </div>
        <div
          className="flex-1 overflow-auto p-6"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
        />
      </DialogContent>
    </Dialog>
  );
}
