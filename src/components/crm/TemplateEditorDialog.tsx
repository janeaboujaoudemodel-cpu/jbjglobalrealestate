import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Lock, Eye, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  useEmailTemplate,
  useUpsertEmailTemplate,
  useLockEmailTemplate,
  useSendDeveloperRegistration,
  type RegistrationVariant,
} from "@/hooks/useCRMRelationships";

const VARIANT_LABELS: Record<RegistrationVariant, string> = {
  developer_registration: "New registration request",
  developer_confirm_registered: "Confirm we are already registered",
};

export const TemplateEditorDialog = ({
  open,
  onOpenChange,
  initialVariant = "developer_registration",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialVariant?: RegistrationVariant;
}) => {
  const [variant, setVariant] = useState<RegistrationVariant>(initialVariant);
  const { data: template } = useEmailTemplate(variant);
  const upsert = useUpsertEmailTemplate();
  const lock = useLockEmailTemplate();
  const sendTest = useSendDeveloperRegistration();

  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [testEmail, setTestEmail] = useState("");
  const [testDeveloperName, setTestDeveloperName] = useState("Sample Developer Co.");

  useEffect(() => { setVariant(initialVariant); }, [initialVariant, open]);
  useEffect(() => {
    if (template) { setSubject(template.subject); setHtml(template.html); }
  }, [template?.variant, template?.updated_at]);

  // Prefill the test email with the signed-in user's address (once per open)
  useEffect(() => {
    if (!open) return;
    if (testEmail) return;
    supabase.auth.getUser().then(({ data }) => {
      const e = data.user?.email;
      if (e) setTestEmail(e);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const isLocked = !!template?.locked_at;

  const previewHtml = useMemo(
    () =>
      html
        .replace(/\{\{developer_name\}\}/g, testDeveloperName || "Sample Developer Co.")
        .replace(/\{\{drive_url\}\}/g, "https://drive.google.com/…")
        .replace(/\{\{reply_to\}\}/g, "contact@jbj.ae")
        .replace(/\{\{cc_email\}\}/g, "infoo.jane@gmail.com"),
    [html, testDeveloperName],
  );

  const handleLock = () => {
    if (!confirm("Lock this template? After locking, the subject and body cannot be edited from the app — every email will use exactly this version.")) return;
    lock.mutate(variant);
  };

  const handleSendTest = () => {
    const recipient = testEmail.trim();
    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      alert("Enter a valid email address to receive the test.");
      return;
    }
    sendTest.mutate({
      variant,
      testRecipient: recipient,
      testDeveloperName: testDeveloperName || "Sample Developer Co.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Near-fullscreen so the email preview is fully readable without horizontal scrolling */}
      <DialogContent
        className="
          bg-[#FDFBF7] text-[#1A1A1A]
          p-0 gap-0
          w-[96vw] sm:max-w-[96vw]
          h-[94vh] max-h-[94vh]
          flex flex-col overflow-hidden
        "
      >
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-[#1A1A1A]/10">
          <DialogTitle className="flex items-center gap-3 text-[#1A1A1A]">
            <span className="text-base font-semibold">Email Template</span>
            {isLocked && (
              <span className="text-xs font-medium text-amber-700 flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3" /> Locked {new Date(template!.locked_at!).toLocaleDateString()}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Variant + preview toggle row */}
        <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-[#1A1A1A]/10 bg-[#FDFBF7]">
          {(Object.keys(VARIANT_LABELS) as RegistrationVariant[]).map((v) => (
            <Button
              key={v}
              variant={variant === v ? "default" : "outline"}
              size="sm"
              onClick={() => setVariant(v)}
              className={variant === v ? "bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]" : "text-[#1A1A1A]"}
            >
              {VARIANT_LABELS[v]}
            </Button>
          ))}
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview((p) => !p)}
            className="text-[#1A1A1A]"
          >
            <Eye className="w-3 h-3 mr-1" />{showPreview ? "Hide" : "Show"} Preview
          </Button>
        </div>

        {/* Body — two columns; each scrolls vertically only, no horizontal scroll */}
        <div
          className={`
            flex-1 min-h-0 grid gap-0
            ${showPreview ? "md:grid-cols-2" : "grid-cols-1"}
          `}
        >
          {/* Editor column */}
          <div className="min-h-0 overflow-y-auto px-6 py-4 space-y-4 border-r border-[#1A1A1A]/10">
            <div>
              <Label className="text-xs text-[#1A1A1A]">Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isLocked}
                className="bg-[#FDFBF7] text-[#1A1A1A]"
              />
            </div>
            <div>
              <Label className="text-xs text-[#1A1A1A]">
                HTML body — use{" "}
                <code className="bg-[#F7F2EA] px-1">{`{{developer_name}}`}</code> and{" "}
                <code className="bg-[#F7F2EA] px-1">{`{{drive_url}}`}</code> placeholders
              </Label>
              <Textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                disabled={isLocked}
                rows={18}
                className="font-mono text-xs bg-[#FDFBF7] text-[#1A1A1A]"
              />
            </div>

            {/* Send test panel */}
            <div className="rounded-xl border border-[#1A1A1A]/10 bg-[#F7F2EA] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-[#1A1A1A]" />
                <h4 className="text-sm font-semibold text-[#1A1A1A]">Send a test to your inbox</h4>
              </div>
              <p className="text-xs text-[#5A4A2E]">
                Sends the live template (placeholders filled in) to the address below. The subject is prefixed with <span className="font-mono">[TEST]</span> and nothing is logged against any developer record.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#1A1A1A]">Send to</Label>
                  <Input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="you@yourdomain.com"
                    className="bg-[#FDFBF7] text-[#1A1A1A]"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#1A1A1A]">Sample developer name</Label>
                  <Input
                    value={testDeveloperName}
                    onChange={(e) => setTestDeveloperName(e.target.value)}
                    placeholder="Sample Developer Co."
                    className="bg-[#FDFBF7] text-[#1A1A1A]"
                  />
                </div>
              </div>
              <div>
                <Button
                  onClick={handleSendTest}
                  disabled={sendTest.isPending}
                  className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]"
                >
                  {sendTest.isPending ? (
                    <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Sending…</>
                  ) : (
                    <><Send className="w-3 h-3 mr-1" /> Send test email</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Preview column — iframe fills remaining height */}
          {showPreview && (
            <div className="min-h-0 flex flex-col bg-[#FAF5EA]">
              <div className="text-[10px] uppercase tracking-wider text-[#5A4A2E] px-4 py-2 bg-[#FDFBF7] border-b border-[#1A1A1A]/10 truncate">
                Preview · {VARIANT_LABELS[variant]} · Subject:{" "}
                <span className="normal-case font-medium text-[#1A1A1A]">{subject || "—"}</span>
              </div>
              <iframe
                title="Email preview"
                srcDoc={previewHtml}
                className="flex-1 w-full bg-[#FDFBF7]"
                sandbox=""
              />
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-3 border-t border-[#1A1A1A]/10 gap-2 bg-[#FDFBF7]">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-[#1A1A1A]">
            Close
          </Button>
          {!isLocked && (
            <>
              <Button
                variant="outline"
                onClick={handleLock}
                disabled={lock.isPending}
                className="border-amber-400 text-amber-800 hover:bg-amber-50"
              >
                <Lock className="w-3 h-3 mr-1" /> Lock template
              </Button>
              <Button
                className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]"
                onClick={() => upsert.mutate({ variant, subject, html })}
                disabled={upsert.isPending}
              >
                {upsert.isPending ? "Saving…" : "Save changes"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
