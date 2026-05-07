import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Send, Smartphone, Monitor, Loader2 } from "lucide-react";

export interface LockedPayload {
  id: string;
  payload_hash: string;
  subject: string;
  from_email: string;
  from_name: string;
  reply_to: string;
  recipient_email: string;
  cc_emails: string[];
  preheader?: string | null;
  html: string;
  plain_text: string;
}

interface DeliveryPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: LockedPayload | null;
  sending?: boolean;
  /** Called when user clicks "Send this exact version". */
  onConfirmSend: (payload: LockedPayload) => void | Promise<void>;
}

/**
 * Final delivery-preview gate. Renders the locked HTML in two iframes
 * (desktop 600px, mobile 375px) and shows the exact From/To/Subject the
 * recipient will see. The user MUST go through this dialog before send;
 * the iframe content IS the bytes that will be delivered.
 */
export function DeliveryPreviewDialog({
  open,
  onOpenChange,
  payload,
  sending,
  onConfirmSend,
}: DeliveryPreviewDialogProps) {
  const [tab, setTab] = useState<"desktop" | "mobile">("desktop");
  if (!payload) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl bg-[#FDFBF7] border-[#B89555]/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <Lock className="h-4 w-4 text-[#B89555]" />
            Delivery Preview — locked payload
          </DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70 text-[12px] font-mono">
            #{payload.id.slice(0, 8)} · sha256:{payload.payload_hash.slice(0, 12)}…
            <br />
            What you see below is exactly what the recipient will receive — byte for byte.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 text-[13px] bg-white border border-[#B89555]/20 p-3 rounded">
          <Row label="From" value={`${payload.from_name} <${payload.from_email}>`} />
          <Row label="Reply-To" value={payload.reply_to} />
          <Row label="To" value={payload.recipient_email} />
          <Row
            label="Cc"
            value={payload.cc_emails.length ? payload.cc_emails.join(", ") : "—"}
          />
          <div className="col-span-2">
            <Row label="Subject" value={payload.subject} mono />
          </div>
          {payload.preheader && (
            <div className="col-span-2">
              <Row label="Preheader" value={payload.preheader} />
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant={tab === "desktop" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("desktop")}
            className="gap-1.5"
          >
            <Monitor className="h-3.5 w-3.5" /> Desktop
          </Button>
          <Button
            type="button"
            variant={tab === "mobile" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("mobile")}
            className="gap-1.5"
          >
            <Smartphone className="h-3.5 w-3.5" /> Mobile
          </Button>
        </div>

        <div className="flex justify-center bg-[#F7F2EA] border border-[#B89555]/20 rounded p-3 max-h-[60vh] overflow-auto">
          <iframe
            key={tab}
            title={`Delivery preview (${tab})`}
            srcDoc={payload.html}
            sandbox=""
            style={{
              width: tab === "desktop" ? 640 : 375,
              height: "60vh",
              border: "1px solid rgba(184,149,85,0.3)",
              background: "#fff",
            }}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => onConfirmSend(payload)}
            disabled={sending}
            className="gap-2"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send this exact version
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/50">{label}</div>
      <div
        className={`text-[#1A1A1A] break-words ${mono ? "font-mono text-[12px]" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
