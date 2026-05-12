import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, FileSignature } from "lucide-react";
import { toast } from "sonner";
import {
  useEsignTemplates,
  useCreateEnvelopeFromTemplate,
  type EsignTemplate,
} from "@/hooks/useEsignTemplates";

interface SendAgreementDialogProps {
  open: boolean;
  onClose: () => void;
  lead: {
    id: string;
    full_name?: string | null;
    email_lower?: string | null;
    phone_e164?: string | null;
    lead_type?: string | null;
  } | null;
}

export default function SendAgreementDialog({ open, onClose, lead }: SendAgreementDialogProps) {
  const navigate = useNavigate();
  const { data: templates = [], isLoading } = useEsignTemplates("all");
  const createFromTpl = useCreateEnvelopeFromTemplate();

  // Default category guess from lead_type
  const defaultCat = useMemo<"leasing" | "selling" | "all">(() => {
    const t = (lead?.lead_type || "").toLowerCase();
    if (t.includes("tenant") || t.includes("landlord")) return "leasing";
    if (t.includes("buyer") || t.includes("seller") || t.includes("investor")) return "selling";
    return "all";
  }, [lead?.lead_type]);

  const [cat, setCat] = useState<"all" | "leasing" | "selling">(defaultCat);
  const [picked, setPicked] = useState<EsignTemplate | null>(null);

  const filtered = templates.filter(t => cat === "all" ? true : t.category === cat);

  const handleCreate = async () => {
    if (!lead || !picked) return;
    const hasEmail = !!lead.email_lower;
    try {
      const env = await createFromTpl.mutateAsync({
        template: picked,
        client: {
          name: lead.full_name || "Client",
          // Backend accepts empty email — envelope stays as draft until an
          // address is added on the envelope detail page.
          email: lead.email_lower || "",
          phone: lead.phone_e164 || undefined,
        },
        clientLeadId: lead.id,
      });
      toast.success(hasEmail ? "Draft envelope created" : "Draft saved — add the client's email before sending");
      onClose();
      navigate(`/e-signature/${env.id}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to create envelope");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#FDFBF7] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
            <FileSignature className="w-5 h-5" /> Send Agreement to {lead?.full_name || "Lead"}
          </DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Pick a template — we'll generate the PDF, pre-place fields and open the envelope for review before sending.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <Label className="text-xs">Client</Label>
              <Input value={lead?.full_name || ""} readOnly className="bg-[#F7F2EA]" />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input value={lead?.email_lower || ""} readOnly className="bg-[#F7F2EA]" />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input value={lead?.phone_e164 || ""} readOnly className="bg-[#F7F2EA]" />
            </div>
          </div>

          <div className="flex gap-2">
            {(["all", "leasing", "selling"] as const).map(c => (
              <Button
                key={c}
                size="sm"
                variant={cat === c ? "gold" : "outline"}
                onClick={() => { setCat(c); setPicked(null); }}
                className="capitalize"
              >
                {c}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto">
              {filtered.map(t => (
                <Card
                  key={t.id}
                  onClick={() => setPicked(t)}
                  className={`p-4 cursor-pointer transition border bg-[#F7F2EA] ${
                    picked?.id === t.id
                      ? "border-[#B89555] ring-1 ring-[#B89555]"
                      : "border-[#B89555]/30 hover:border-[#B89555]/60"
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">{t.category}</div>
                  <div className="font-semibold text-[#1A1A1A] mt-1">{t.name}</div>
                  <div className="text-xs text-[#1A1A1A]/60 mt-1">
                    {Array.isArray(t.field_schema) ? t.field_schema.length : 0} pre-placed fields
                  </div>
                </Card>
              ))}
              {!filtered.length && (
                <div className="col-span-2 text-sm text-[#1A1A1A]/60">No templates in this category.</div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="gold"
            disabled={!picked || !lead?.email_lower || createFromTpl.isPending}
            onClick={handleCreate}
          >
            {createFromTpl.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Envelope
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
