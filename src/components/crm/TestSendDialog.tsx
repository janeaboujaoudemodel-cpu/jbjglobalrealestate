import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOwnerSettings, useUpsertOwnerSettings } from "@/hooks/useCRMRelationships";
import { PrimarySenderEditor, CcListEditor } from "@/components/crm/EmailListEditor";

interface TestSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "developer" | "brokerage";
  variant: string;
  initialSubject?: string;
  initialHtml?: string;
}

export const TestSendDialog = ({
  open,
  onOpenChange,
  mode,
  variant,
}: TestSendDialogProps) => {
  const { data: settings } = useOwnerSettings();
  const upsert = useUpsertOwnerSettings();

  // Local working copies of the persistent chip lists
  const [savedTo, setSavedTo] = useState<string[]>([]);
  const [activeTo, setActiveTo] = useState<string>("");
  const [savedCc, setSavedCc] = useState<string[]>([]);
  const [activeCc, setActiveCc] = useState<string[]>([]);
  const [allTo, setAllTo] = useState<boolean>(false);

  const [sampleName, setSampleName] = useState(
    mode === "brokerage" ? "Sample Brokerage Group" : "Sample Developer Co.",
  );
  const [sending, setSending] = useState(false);

  // Hydrate from owner settings on open
  useEffect(() => {
    if (!open || !settings) return;
    const to = Array.isArray((settings as any).saved_test_to_emails)
      ? (settings as any).saved_test_to_emails
      : [];
    const cc = Array.isArray((settings as any).saved_test_cc_emails)
      ? (settings as any).saved_test_cc_emails
      : [];
    setSavedTo(to);
    setActiveTo(to[0] || "");
    setSavedCc(cc);
    setActiveCc(cc);
    // Seed with current user's email if list is empty
    if (to.length === 0) {
      supabase.auth.getUser().then(({ data }) => {
        const email = data.user?.email;
        if (email) {
          setSavedTo([email]);
          setActiveTo(email);
        }
      });
    }
  }, [open, settings]);

  const persist = async (next: { savedTo?: string[]; savedCc?: string[] }) => {
    try {
      await upsert.mutateAsync({
        ...(settings || {}),
        saved_test_to_emails: next.savedTo ?? savedTo,
        saved_test_cc_emails: next.savedCc ?? savedCc,
      });
    } catch {
      /* surfaced by upsert toast */
    }
  };

  const recipientsForSend = useMemo(() => {
    if (allTo) return savedTo;
    return activeTo ? [activeTo] : [];
  }, [allTo, savedTo, activeTo]);

  const handleSend = async () => {
    if (recipientsForSend.length === 0) {
      toast.error("Pick at least one test recipient");
      return;
    }
    setSending(true);
    try {
      const fnName = mode === "brokerage" ? "crm-send-brokerage-outreach" : "crm-send-developer-registration";
      const results = await Promise.allSettled(
        recipientsForSend.map((to) =>
          supabase.functions.invoke(fnName, {
            body: {
              variant,
              testRecipient: to,
              testRecipients: [to],
              ccEmailOverride: activeCc.join(","),
              [mode === "brokerage" ? "testBrokerageName" : "testDeveloperName"]: sampleName,
            },
          }),
        ),
      );
      const failed = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && (r.value as any)?.error));
      if (failed.length === 0) {
        toast.success(`Test email sent to ${recipientsForSend.length} recipient${recipientsForSend.length === 1 ? "" : "s"}`);
        onOpenChange(false);
      } else {
        toast.error(`${failed.length} of ${recipientsForSend.length} test sends failed`);
      }
    } catch (err: any) {
      console.error("Test send failed:", err);
      toast.error(err.message || "Failed to send test email");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/30 max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <Mail className="w-5 h-5 text-[#1A1A1A]" />
            Send Test Email — {mode === "brokerage" ? "Brokerage" : "Developer"} pack
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">Test recipients (To)</Label>
            <PrimarySenderEditor
              saved={savedTo}
              active={activeTo}
              onChange={({ saved, active }) => {
                setSavedTo(saved);
                setActiveTo(active);
                void persist({ savedTo: saved });
              }}
            />
            <label className="flex items-center gap-2 text-xs text-[#1A1A1A] mt-1">
              <input
                type="checkbox"
                checked={allTo}
                onChange={(e) => setAllTo(e.target.checked)}
                className="accent-[#1A1A1A]"
              />
              Send to all saved test recipients ({savedTo.length})
            </label>
            <p className="text-[11px] text-[#1A1A1A]/70">
              Saved here forever. Click any chip to set as the active recipient, or tick "send to all" to blast every saved address.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">Test CC recipients</Label>
            <CcListEditor
              saved={savedCc}
              active={activeCc}
              onChange={({ saved, active }) => {
                setSavedCc(saved);
                setActiveCc(active);
                void persist({ savedCc: saved });
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
              {mode === "brokerage" ? "Sample brokerage name" : "Sample developer name"}
            </Label>
            <Input
              value={sampleName}
              onChange={(e) => setSampleName(e.target.value)}
              className="bg-white border-[#1A1A1A]/15 focus-visible:ring-[#B89555]"
            />
          </div>

          <div className="bg-[#F7F2EA] p-3 rounded-lg border border-[#B89555]/30">
            <p className="text-[11px] leading-relaxed text-[#1A1A1A]/80 italic">
              Test emails are prefixed with [TEST] and never logged as real outreach. Saved To/CC lists persist until you remove them with the trash icon.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || recipientsForSend.length === 0}
            className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90"
          >
            {sending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
            ) : (
              <><Send className="w-4 h-4 mr-2" /> Send Test{recipientsForSend.length > 1 ? ` (${recipientsForSend.length})` : ""}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
