import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileText } from "lucide-react";
import { proxyAnyDownloadUrl } from "@/utils/downloadProxy";
import { ProjectInquiryForm } from "@/components/project-detail/ProjectInquiryForm";

interface LeadCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  projectLocation?: string;
  developerName?: string;
  documentType: "brochure" | "floor_plan" | "payment_plan" | "images";
  documentUrl?: string;
  onSuccess?: () => void;
}

const DOCUMENT_LABELS: Record<string, string> = {
  brochure: "Brochure",
  floor_plan: "Floor Plans",
  payment_plan: "Payment Plan",
  images: "Gallery Images",
};

/**
 * Project-detail lead capture modal.
 * Wraps the unified ProjectInquiryForm so every "Register Interest" and
 * "Download Brochure" CTA collects the SAME detailed information
 * (bedrooms, size, developer, location, purchase timeline, preferred contact
 * time, message). On success, optional document downloads happen via a
 * same-tab anchor click — NOT window.open — to bypass Chrome's popup blocker.
 */
const LeadCaptureModal = ({
  open,
  onOpenChange,
  projectId,
  projectName,
  projectLocation,
  developerName,
  documentType,
  documentUrl,
  onSuccess,
}: LeadCaptureModalProps) => {
  const isInterestOnly = !documentUrl;
  const title = isInterestOnly
    ? "Register Your Interest"
    : `Download ${DOCUMENT_LABELS[documentType] ?? "Document"}`;
  const safeDocumentUrl = documentUrl
    ? proxyAnyDownloadUrl(documentUrl, {
        filename: `${projectName.replace(/\s+/g, "-")}-${documentType}.pdf`,
        disposition: "attachment",
      })
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/40">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EFE6D6]/40 border border-[#B89555]/40 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#1A1A1A]" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-lg text-[#1A1A1A]">{title}</DialogTitle>
              <DialogDescription className="text-xs text-[#1A1A1A]/70">{projectName}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4">
          <ProjectInquiryForm
            projectId={projectId}
            projectName={projectName}
            projectLocation={projectLocation}
            developerName={developerName}
            documentUrl={safeDocumentUrl}
            intent={isInterestOnly ? "Register interest" : `Download ${DOCUMENT_LABELS[documentType]}`}
            compact
            onSuccess={() => {
              onSuccess?.();
              // Close shortly after so the user sees the toast
              setTimeout(() => onOpenChange(false), 600);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeadCaptureModal;
