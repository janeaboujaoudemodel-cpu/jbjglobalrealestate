import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useEmailDeliveryStatus } from "@/hooks/useCRMRelationships";

const STATUS_STYLE: Record<string, string> = {
  sent: "bg-emerald-100 text-emerald-900 border-emerald-300",
  delivered: "bg-emerald-100 text-emerald-900 border-emerald-300",
  pending: "bg-amber-100 text-amber-900 border-amber-300",
  failed: "bg-red-100 text-red-900 border-red-300",
  dlq: "bg-red-100 text-red-900 border-red-300",
  bounced: "bg-red-100 text-red-900 border-red-300",
  complained: "bg-red-100 text-red-900 border-red-300",
  suppressed: "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/30",
};

const VARIANT_LABEL: Record<string, string> = {
  developer_registration: "New registration",
  developer_confirm_registered: "Confirm registered",
  birthday: "Birthday",
  contract_signed_sync: "Signed contract (synced)",
};

export const EmailLogDialog = ({
  open, onOpenChange, developerName, recipientEmail,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  developerName: string;
  recipientEmail: string;
}) => {
  const normalised = (recipientEmail || "").trim().toLowerCase();
  const { data, isLoading, isError, error } = useEmailDeliveryStatus(normalised ? [normalised] : []);
  const history: any[] = (data?.history.get(normalised) || []) as any[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#FDFBF7]">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A]">Email log — {developerName || "Developer"}</DialogTitle>
        </DialogHeader>
        <div className="text-xs text-[#1A1A1A]/70 mb-2">{normalised || "No email on file"}</div>
        {!normalised ? (
          <div className="text-sm text-[#1A1A1A]/70 py-4 text-center">
            This developer has no email on file yet — add one on the row to start tracking sends.
          </div>
        ) : isLoading ? (
          <div className="text-sm text-[#1A1A1A]/70 py-4 text-center">Loading…</div>
        ) : isError ? (
          <div className="text-sm text-red-700 py-4 text-center">
            Couldn't load email log: {(error as any)?.message || "unknown error"}
          </div>
        ) : history.length === 0 ? (
          <div className="text-sm text-[#1A1A1A]/70 py-4 text-center">No email log entries yet.</div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto space-y-2">
            {history.map((row, i) => {
              const variantKey = String(row.template_name || "");
              const variantLabel = VARIANT_LABEL[variantKey] || variantKey || "Email";
              return (
                <div key={i} className="border border-[#1A1A1A]/10 rounded-lg p-3 bg-[#FDFBF7]">
                  <div className="flex items-center justify-between">
                    <Badge className={`${STATUS_STYLE[row.status] || "bg-[#EFE6D6] text-[#1A1A1A]"} border font-semibold`}>
                      {row.status || "sent"}
                    </Badge>
                    <span className="text-xs text-[#1A1A1A]/70">
                      {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-[#1A1A1A]">
                    Variant: <strong>{variantLabel}</strong>
                  </div>
                  {row.subject && (
                    <div className="mt-1 text-xs text-[#1A1A1A]/80 truncate">
                      Subject: <span className="text-[#1A1A1A]">{row.subject}</span>
                    </div>
                  )}
                  {row.error_message && (
                    <div className="mt-1 text-xs text-red-700">Error: {row.error_message}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
