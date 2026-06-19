import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMarkLeadJunk } from "@/hooks/useBrokerJunkActions";
import { AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId: string | null;
  leadName?: string | null;
}

export default function MarkJunkDialog({ open, onOpenChange, leadId, leadName }: Props) {
  const [reason, setReason] = useState("");
  const mark = useMarkLeadJunk();

  const submit = async () => {
    if (!leadId) return;
    await mark.mutateAsync({ leadId, reason: reason.trim() });
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FDFBF7] border border-[#B89555]/30 max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#B89555]" />
            <DialogTitle className="text-[#1A1A1A]">Return lead to JBJ owner</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-[#1A1A1A]/75">
            This will remove <span className="font-medium">{leadName || "the lead"}</span> from your pipeline and
            send it back to the JBJ owner as junk. The owner will decide whether to redistribute or delete it.
            Brokers cannot permanently delete leads.
          </p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why are you returning this lead? (wrong number, not interested, duplicate…)"
            className="bg-white border-[#B89555]/30 text-[#1A1A1A] min-h-[90px]"
          />
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!leadId || mark.isPending}
            className="bg-[#0A0A0A] hover:bg-[#1F1F1F] text-white allow-white"
            data-allow-dark-cta
          >
            {mark.isPending ? "Returning…" : "Return to owner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
