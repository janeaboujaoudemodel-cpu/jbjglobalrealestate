import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Download, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLeadCapture } from "@/hooks/useLeadCapture";
import { z } from "zod";
import { maybeProxyStorageUrl } from "@/utils/downloadProxy";

const leadSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().optional(),
});

interface LeadCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  documentType: "brochure" | "floor_plan" | "payment_plan" | "images";
  documentUrl?: string;
  onSuccess?: () => void;
}

const LeadCaptureModal = ({
  open,
  onOpenChange,
  projectId,
  projectName,
  documentType,
  documentUrl,
  onSuccess,
}: LeadCaptureModalProps) => {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const { captureLead } = useLeadCapture();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = leadSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Use the existing captureLead function from hook
      const success = await captureLead(
        {
          email: formData.email,
          fullName: formData.name,
          phone: formData.phone || undefined,
        },
        `document_download_${documentType}_${projectId}`,
      );

      if (!success) {
        throw new Error("Failed to capture lead");
      }

      setIsSuccess(true);

      toast({
        title: "Thank you!",
        description: documentUrl ? "Your download is ready." : "Our team will share the brochure with you shortly.",
      });

      // Auto-close and trigger download after short delay
      setTimeout(() => {
        onOpenChange(false);
        setIsSuccess(false);
        setFormData({ name: "", email: "", phone: "" });
        
        if (documentUrl) {
            window.open(maybeProxyStorageUrl(documentUrl), "_blank");
        }
        
        onSuccess?.();
      }, 1500);
    } catch (err) {
      console.error("Lead capture error:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isInterestOnly = !documentUrl;

  const documentLabels: Record<string, string> = {
    brochure: "Brochure",
    floor_plan: "Floor Plans",
    payment_plan: "Payment Plan",
    images: "Gallery Images",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold shadow-[0_8px_40px_rgba(200,167,102,0.4)]">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-gold" />
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">
              {isInterestOnly ? "Thank You!" : "Download Ready!"}
            </h3>
            <p className="text-sm text-zinc-600 text-center">
              {isInterestOnly ? "Our team will contact you shortly." : "Your download will start automatically."}
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gold/20 border border-gold/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <DialogTitle className="text-lg">{isInterestOnly ? "Register Your Interest" : `Download ${documentLabels[documentType]}`}</DialogTitle>
                  <DialogDescription className="text-xs">{projectName}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  placeholder="+971 XX XXX XXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

                <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {isInterestOnly ? <FileText className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                    {isInterestOnly ? "Submit Interest" : `Get ${documentLabels[documentType]}`}
                  </>
                )}
              </Button>

              <p className="text-[10px] text-muted-foreground text-center">
                By submitting, you agree to receive communications from JBJ Global Real Estate.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LeadCaptureModal;
