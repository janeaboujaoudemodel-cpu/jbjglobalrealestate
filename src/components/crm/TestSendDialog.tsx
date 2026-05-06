import { useState, useEffect, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Loader2, Mail, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOwnerSettings } from "@/hooks/useCRMRelationships";
import { PrimarySenderEditor, CcListEditor } from "@/components/crm/EmailListEditor";

interface TestSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "developer" | "brokerage";
  variant: string;
  initialSubject?: string;
  initialHtml?: string;
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export const TestSendDialog = ({
  open,
  onOpenChange,
  mode,
  variant,
}: TestSendDialogProps) => {
  const { data: settings } = useOwnerSettings();

  // Free-text recipient (works even if user never clicks "Add")
  const [quickTo, setQuickTo] = useState("");

  // Persistent chip lists
  const [savedTo, setSavedTo] = useState<string[]>([]);
  const [activeTo, setActiveTo] = useState<string>("");
  const [savedCc, setSavedCc] = useState<string[]>([]);
  const [activeCc, setActiveCc] = useState<string[]>([]);
  const [allTo, setAllTo] = useState<boolean>(false);

  const [sampleName, setSampleName] = useState("");
  const [savedSampleNames, setSavedSampleNames] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState<"review" | "confirm">("review");
  const hydratedRef = useRef(false);

  // Hydrate ONCE per open — never re-hydrate after persist refetches
  useEffect(() => {
    if (!open) {
      hydratedRef.current = false;
      setStep("review");
      return;
    }
    if (hydratedRef.current || !settings) return;
    hydratedRef.current = true;
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
    const savedNamesKey = mode === "brokerage" ? "saved_test_brokerage_names" : "saved_test_developer_names";
    const savedNames = Array.isArray((settings as any)[savedNamesKey])
      ? (settings as any)[savedNamesKey]
      : [];
    setSavedSampleNames(savedNames);
    if (savedNames.length > 0) setSampleName(savedNames[0]);
    if (to.length === 0) {
      supabase.auth.getUser().then(({ data }) => {
        const email = data.user?.email;
        if (email) {
          setQuickTo(email);
        }
      });
    }
  }, [open, settings, mode]);

  // Silent persist (no toast, no refetch loop)
  const persist = async (next: { savedTo?: string[]; savedCc?: string[]; savedSampleNames?: string[] }) => {
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const namesKey = mode === "brokerage" ? "saved_test_brokerage_names" : "saved_test_developer_names";
      const payload: any = {
        owner_id: u.user.id,
        saved_test_to_emails: next.savedTo ?? savedTo,
        saved_test_cc_emails: next.savedCc ?? savedCc,
      };
      if (next.savedSampleNames !== undefined) payload[namesKey] = next.savedSampleNames;
      await supabase.from("crm_owner_settings").upsert(payload, { onConflict: "owner_id" });
    } catch (e) {
      console.warn("persist test recipients failed", e);
    }
  };

  const removeSampleName = (name: string) => {
    const next = savedSampleNames.filter((n) => n !== name);
    setSavedSampleNames(next);
    if (sampleName === name) setSampleName(next[0] || "");
    void persist({ savedSampleNames: next });
  };

  const recipientsForSend = useMemo(() => {
    const list: string[] = [];
    const q = quickTo.trim();
    if (isEmail(q)) list.push(q);
    if (allTo) {
      for (const e of savedTo) if (!list.includes(e)) list.push(e);
    } else if (activeTo && !list.includes(activeTo)) {
      list.push(activeTo);
    }
    return list;
  }, [quickTo, allTo, savedTo, activeTo]);

  const handleSend = async () => {
    if (recipientsForSend.length === 0) {
      toast.error("Enter or pick at least one test recipient");
      return;
    }
    setSending(true);
    try {
      // Auto-save the quick-typed email so it persists for next time
      const q = quickTo.trim();
      if (isEmail(q) && !savedTo.includes(q)) {
        const next = [...savedTo, q];
        setSavedTo(next);
        setActiveTo(q);
        void persist({ savedTo: next });
      }
      // Auto-save the sample agency/developer name
      const sn = sampleName.trim();
      if (sn && !savedSampleNames.includes(sn)) {
        const nextNames = [...savedSampleNames, sn];
        setSavedSampleNames(nextNames);
        void persist({ savedSampleNames: nextNames });
      }
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
      const failures: string[] = [];
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          failures.push(`${recipientsForSend[i]}: ${(r.reason as any)?.message || "failed"}`);
        } else {
          const v = r.value as any;
          if (v?.error) failures.push(`${recipientsForSend[i]}: ${v.error.message || "failed"}`);
          else if (v?.data?.error) failures.push(`${recipientsForSend[i]}: ${v.data.error}`);
        }
      });
      if (failures.length === 0) {
        toast.success(`Test email sent to ${recipientsForSend.length} recipient${recipientsForSend.length === 1 ? "" : "s"}`);
        onOpenChange(false);
      } else {
        console.error("Test send failures:", failures);
        toast.error(failures[0], { duration: 6000 });
      }
    } catch (err: any) {
      console.error("Test send failed:", err);
      toast.error(err.message || "Failed to send test email");
    } finally {
      setSending(false);
    }
  };

  const goToConfirm = () => {
    if (recipientsForSend.length === 0) {
      toast.error("Enter or pick at least one test recipient");
      return;
    }
    setStep("confirm");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/30 max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <Mail className="w-5 h-5 text-[#1A1A1A]" />
            {step === "review" ? "Review Test Email" : "Confirm & Send"} — {mode === "brokerage" ? "Brokerage" : "Developer"} pack
          </DialogTitle>
        </DialogHeader>

        {step === "review" ? (
          <>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">Send test to</Label>
                <Input
                  value={quickTo}
                  onChange={(e) => setQuickTo(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); goToConfirm(); } }}
                  placeholder="jane@citideveloper.com"
                  className="bg-white border-[#1A1A1A]/15 focus-visible:ring-[#B89555]"
                />
                <p className="text-[11px] text-[#1A1A1A]/70">
                  Type an email and press Continue — it will be saved below for next time.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">Saved test recipients</Label>
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
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button
                onClick={goToConfirm}
                disabled={recipientsForSend.length === 0}
                className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90"
              >
                Continue → Review &amp; Send
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-3 py-2">
              <div className="bg-[#F7F2EA] border border-[#B89555]/40 rounded-lg p-4 space-y-2 text-sm">
                <div><span className="font-semibold text-[#1A1A1A]">Template:</span> <span className="text-[#1A1A1A]">{variant}</span></div>
                <div><span className="font-semibold text-[#1A1A1A]">To:</span> <span className="text-[#1A1A1A]">{recipientsForSend.join(", ")}</span></div>
                <div><span className="font-semibold text-[#1A1A1A]">CC:</span> <span className="text-[#1A1A1A]">{activeCc.length > 0 ? activeCc.join(", ") : <em className="text-[#1A1A1A]/60">none</em>}</span></div>
                <div><span className="font-semibold text-[#1A1A1A]">Sample name:</span> <span className="text-[#1A1A1A]">{sampleName}</span></div>
                <div><span className="font-semibold text-[#1A1A1A]">From / Reply-to:</span> <span className="text-[#1A1A1A]">jane@citideveloper.com</span></div>
              </div>
              <p className="text-[11px] text-[#1A1A1A]/70 italic">
                Tagged [TEST] in the subject and never logged as real outreach.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("review")} disabled={sending}>← Back to edit</Button>
              <Button
                onClick={handleSend}
                disabled={sending}
                className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90"
              >
                {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending…</> : <><Send className="w-4 h-4 mr-2" />Send Test{recipientsForSend.length > 1 ? ` (${recipientsForSend.length})` : ""}</>}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

