import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Loader2, Mail, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  initialSubject,
  initialHtml,
}: TestSendDialogProps) => {
  const [testEmail, setTestEmail] = useState("");
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [newCc, setNewCc] = useState("");
  const [sampleName, setTestSampleName] = useState(
    mode === "brokerage" ? "Sample Brokerage Group" : "Sample Developer Co.",
  );
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user?.email && !testEmail) setTestEmail(data.user.email);
      });
    }
  }, [open]);

  const addCc = () => {
    const trimmed = newCc.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    if (ccEmails.includes(trimmed)) return;
    setCcEmails([...ccEmails, trimmed]);
    setNewCc("");
  };

  const removeCc = (email: string) => {
    setCcEmails(ccEmails.filter(e => e !== email));
  };

  const handleSend = async () => {
    if (!testEmail.trim() || !testEmail.includes("@")) {
      toast.error("Please enter a valid recipient email");
      return;
    }

    setSending(true);
    try {
      const fnName = mode === "brokerage" ? "crm-send-brokerage-outreach" : "crm-send-developer-registration";
      const { error } = await supabase.functions.invoke(fnName, {
        body: {
          variant,
          testRecipient: testEmail.trim(),
          ccEmailOverride: ccEmails.join(","),
          [mode === "brokerage" ? "testBrokerageName" : "testDeveloperName"]: sampleName,
          // If we have local edits in the editor, we'd pass them here if the function supports it.
          // For now, it pulls the locked template from DB.
        }
      });

      if (error) throw error;
      toast.success("Test email enqueued successfully");
      onOpenChange(false);
    } catch (err: any) {
      console.error("Test send failed:", err);
      toast.error(err.message || "Failed to send test email");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#B89555]" />
            Send Test Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/60">Recipient (To)</Label>
            <Input 
              value={testEmail} 
              onChange={e => setTestEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="bg-white border-[#B89555]/20 focus-visible:ring-[#B89555]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/60">CC Recipients</Label>
            <div className="flex gap-2">
              <Input 
                value={newCc} 
                onChange={e => setNewCc(e.target.value)}
                placeholder="cc@example.com"
                className="bg-white border-[#B89555]/20 focus-visible:ring-[#B89555]"
                onKeyDown={e => e.key === 'Enter' && addCc()}
              />
              <Button variant="outline" size="icon" onClick={addCc} className="shrink-0 border-[#B89555]/20">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {ccEmails.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {ccEmails.map(email => (
                  <div key={email} className="bg-[#EFE6D6] text-[#1A1A1A] text-[10px] px-2 py-0.5 rounded-full border border-[#B89555]/30 flex items-center gap-1">
                    {email}
                    <button onClick={() => removeCc(email)} className="hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/60">
              {mode === "brokerage" ? "Sample Brokerage Name" : "Sample Developer Name"}
            </Label>
            <Input 
              value={sampleName} 
              onChange={e => setTestSampleName(e.target.value)}
              className="bg-white border-[#B89555]/20 focus-visible:ring-[#B89555]"
            />
          </div>

          <div className="bg-[#F7F2EA] p-3 rounded-lg border border-[#B89555]/10">
            <p className="text-[10px] leading-relaxed text-[#1A1A1A]/60 italic">
              * Test emails are sent via your connected Gmail. They are not logged as real outreach and subject is prefixed with [TEST].
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending} className="border-[#B89555]/20">
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={sending}
            className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90"
          >
            {sending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
            ) : (
              <><Send className="w-4 h-4 mr-2" /> Send Test</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};