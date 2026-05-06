import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Lock, Eye, Send, Loader2, Code2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VisualEditor } from "@/components/crm/VisualEditor";
import {
  useEmailTemplate,
  useUpsertEmailTemplate,
  useLockEmailTemplate,
  useUnlockEmailTemplate,
  useSendDeveloperRegistration,
  useSendBrokerageOutreach,
  type RegistrationVariant,
  type BrokerageVariant,
  type AnyEmailVariant,
} from "@/hooks/useCRMRelationships";

type EditorMode = "developer" | "brokerage";

const DEVELOPER_LABELS: Record<RegistrationVariant, string> = {
  developer_registration: "New registration request",
  developer_confirm_registered: "Confirm we are already registered",
};

const BROKERAGE_LABELS: Record<BrokerageVariant, string> = {
  brokerage_partnership_intro: "Partnership intro · Private breakfast",
  brokerage_breakfast_invite: "Breakfast invitation · RSVP",
};

export const TemplateEditorDialog = ({
  open,
  onOpenChange,
  mode = "developer",
  initialVariant,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode?: EditorMode;
  initialVariant?: AnyEmailVariant;
}) => {
  const isBrokerage = mode === "brokerage";
  const VARIANT_LABELS = (isBrokerage ? BROKERAGE_LABELS : DEVELOPER_LABELS) as Record<string, string>;
  const defaultVariant: AnyEmailVariant = isBrokerage
    ? "brokerage_partnership_intro"
    : "developer_registration";

  const [variant, setVariant] = useState<AnyEmailVariant>(initialVariant ?? defaultVariant);
  const { data: template } = useEmailTemplate(variant);
  const upsert = useUpsertEmailTemplate();
  const lock = useLockEmailTemplate();
  const unlock = useUnlockEmailTemplate();
  const sendDeveloperTest = useSendDeveloperRegistration();
  const sendBrokerageTest = useSendBrokerageOutreach();
  const sendTestPending = isBrokerage ? sendBrokerageTest.isPending : sendDeveloperTest.isPending;

  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [sourceMode, setSourceMode] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testSampleName, setTestSampleName] = useState("");

  const VARIABLE_CHIPS: { key: string; label: string }[] = isBrokerage
    ? [
        { key: "brokerage_name", label: "Brokerage name" },
        { key: "contact_first_name", label: "Contact first name" },
        { key: "contact_full_name", label: "Contact full name" },
        { key: "owner_first_name", label: "Owner first name" },
        { key: "project_name", label: "Project name" },
        { key: "project_url", label: "Project URL" },
        { key: "project_tagline", label: "Project tagline" },
        { key: "booking_url", label: "Booking URL" },
        
      ]
    : [
        { key: "developer_name", label: "Developer name" },
        { key: "drive_url", label: "Drive URL" },
      ];

  const insertVariable = (key: string) => {
    const token = `{{${key}}}`;
    if (sourceMode) {
      setHtml((h) => h + token);
    } else {
      // Append a paragraph carrying the token; the visual editor renders it as plain text.
      setHtml((h) => h + `<p>${token}</p>`);
    }
  };

  // Reset to a valid variant whenever the editor mode (or `open`) changes
  useEffect(() => {
    setVariant(initialVariant ?? defaultVariant);
    setTestSampleName("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialVariant, open]);

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

  const previewHtml = useMemo(() => {
    if (isBrokerage) {
      // AMRA defaults — matches the live edge function default project.
      const offerHtml = `<p style="margin:0 0 8px"><strong>AMRA</strong> is the project we are actively focused on. Brochures, floor plans, payment plans and amenity videos are all in the e-catalogue.</p><p style="margin:0">Marketing freedom: no QR required for AMRA marketing assets — videos are pre-branded and ready to use.</p>`;
      const conditional = html.replace(
        /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
        (_, k, inner) => {
          const map: Record<string, string> = {
            project_offer_html: offerHtml,
            booking_url: "#preview",
          };
          return map[k] && map[k].trim().length > 0 ? inner : "";
        },
      );
      return conditional
        .replace(/\{\{brokerage_name\}\}/g, testSampleName || "Your Brokerage")
        .replace(/\{\{brokerage_location\}\}/g, "Dubai")
        .replace(/\{\{contact_first_name\}\}/g, "")
        .replace(/\{\{contact_full_name\}\}/g, "")
        .replace(/\{\{owner_first_name\}\}/g, "Jane")
        .replace(/\{\{represented_developer_name\}\}/g, "CITI Developer")
        .replace(/\{\{group_status_line\}\}/g, "We'd love to introduce CITI Developer to your team.")
        .replace(/\{\{project_name\}\}/g, "AMRA")
        .replace(/\{\{project_url\}\}/g, "https://citideveloper.com/e-catalogue/amra")
        .replace(/\{\{project_tagline\}\}/g, "Wellness-led beachfront resort residences in Umm Al Quwain — our current launch focus.")
        .replace(/\{\{project_offer_html\}\}/g, offerHtml)
        .replace(/\{\{booking_url\}\}/g, "#preview")
        .replace(/\{\{reply_to\}\}/g, "jane@citideveloper.com")
        .replace(/\{\{reply_to_lower\}\}/g, "jane@citideveloper.com")
        .replace(/\{\{reply_to_display\}\}/g, "JANE@CITIDEVELOPER.COM")
        .replace(/\{\{cc_email\}\}/g, "");
    }
    return html
      .replace(/\{\{developer_name\}\}/g, testSampleName || "Your Company")
      .replace(/\{\{drive_url\}\}/g, "https://drive.google.com/…")
      .replace(/\{\{reply_to\}\}/g, "contact@jbj.ae")
      .replace(/\{\{cc_email\}\}/g, "infoo.jane@gmail.com");
  }, [html, testSampleName, isBrokerage]);

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
    if (isBrokerage) {
      sendBrokerageTest.mutate({
        variant: variant as BrokerageVariant,
        testRecipient: recipient,
        testBrokerageName: testSampleName || "Your Brokerage",
      });
    } else {
      sendDeveloperTest.mutate({
        variant: variant as RegistrationVariant,
        testRecipient: recipient,
        testDeveloperName: testSampleName || "Your Company",
      });
    }
  };

  const variantKeys = Object.keys(VARIANT_LABELS) as AnyEmailVariant[];
  const titleSuffix = isBrokerage ? "Brokerage outreach" : "Developer registration";
  const placeholderHint = isBrokerage ? (
    <>
      HTML body — use{" "}
      <code className="bg-[#F7F2EA] px-1">{`{{brokerage_name}}`}</code>,{" "}
      <code className="bg-[#F7F2EA] px-1">{`{{contact_first_name}}`}</code>,{" "}
      <code className="bg-[#F7F2EA] px-1">{`{{project_name}}`}</code>,{" "}
      <code className="bg-[#F7F2EA] px-1">{`{{project_url}}`}</code>,{" "}
      <code className="bg-[#F7F2EA] px-1">{`{{project_tagline}}`}</code>,{" "}
      <code className="bg-[#F7F2EA] px-1">{`{{project_offer_html}}`}</code>,{" "}
      <code className="bg-[#F7F2EA] px-1">{`{{booking_url}}`}</code> placeholders
    </>
  ) : (
    <>
      HTML body — use{" "}
      <code className="bg-[#F7F2EA] px-1">{`{{developer_name}}`}</code> and{" "}
      <code className="bg-[#F7F2EA] px-1">{`{{drive_url}}`}</code> placeholders
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <span className="text-base font-semibold">Email Template · {titleSuffix}</span>
            {isLocked && (
              <span className="text-xs font-medium text-amber-700 flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3" /> Locked {new Date(template!.locked_at!).toLocaleDateString()}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Variant + preview toggle row */}
        <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-[#1A1A1A]/10 bg-[#FDFBF7]">
          {variantKeys.map((v) => (
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

        {/* Body — two columns */}
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
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs text-[#1A1A1A]">Email body</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSourceMode((s) => !s)}
                  className="h-7 text-[11px] text-[#1A1A1A]"
                  title="Toggle between visual editing and raw HTML"
                >
                  <Code2 className="w-3 h-3 mr-1" />
                  {sourceMode ? "Visual editor" : "HTML source"}
                </Button>
              </div>

              {/* Variable chip bar */}
              <div className="flex flex-wrap gap-1.5 mb-2 p-2 rounded-lg bg-[#F7F2EA] border border-[#1A1A1A]/10">
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#1A1A1A]/70 mr-1">
                  <Sparkles className="w-3 h-3" /> Insert variable
                </span>
                {VARIABLE_CHIPS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => insertVariable(c.key)}
                    disabled={isLocked}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-[#FDFBF7] border border-[#1A1A1A]/15 text-[#1A1A1A] hover:bg-[#EFE6D6] disabled:opacity-50"
                    title={`Insert {{${c.key}}}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {sourceMode ? (
                <Textarea
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  disabled={isLocked}
                  rows={18}
                  className="font-mono text-xs bg-[#FDFBF7] text-[#1A1A1A]"
                />
              ) : (
                <VisualEditor
                  content={html}
                  onChange={setHtml}
                  disabled={isLocked}
                />
              )}

              <p className="text-[11px] text-[#1A1A1A]/70 mt-1.5">
                Tip: Click any chip above to insert the placeholder. {placeholderHint}
              </p>
            </div>

            {/* Send test panel */}
            <div className="rounded-xl border border-[#1A1A1A]/10 bg-[#F7F2EA] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-[#1A1A1A]" />
                <h4 className="text-sm font-semibold text-[#1A1A1A]">Send a test to your inbox</h4>
              </div>
              <p className="text-xs text-[#1A1A1A]/70">
                Sends the live template (placeholders filled in) to the address below. The subject is prefixed with <span className="font-mono">[TEST]</span> and nothing is logged against any {isBrokerage ? "brokerage" : "developer"} record.
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
                  <Label className="text-xs text-[#1A1A1A]">
                    {isBrokerage ? "Sample brokerage name" : "Sample developer name"}
                  </Label>
                  <Input
                    value={testSampleName}
                    onChange={(e) => setTestSampleName(e.target.value)}
                    placeholder={isBrokerage ? "Recipient brokerage name (preview only)" : "Recipient company name (preview only)"}
                    className="bg-[#FDFBF7] text-[#1A1A1A]"
                  />
                </div>
              </div>
              <div>
                <Button
                  onClick={handleSendTest}
                  disabled={sendTestPending}
                  className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]"
                >
                  {sendTestPending ? (
                    <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Sending…</>
                  ) : (
                    <><Send className="w-3 h-3 mr-1" /> Send test email</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Preview column */}
          {showPreview && (
            <div className="min-h-0 flex flex-col bg-[#FAF5EA]">
              <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/70 px-4 py-2 bg-[#FDFBF7] border-b border-[#1A1A1A]/10 truncate">
                Preview · {VARIANT_LABELS[variant]} · Subject:{" "}
                <span className="normal-case font-medium text-[#1A1A1A]">{subject || "—"}</span>
              </div>
              <iframe
                title="Email preview"
                srcDoc={`<base target="_blank" /><style>a{pointer-events:none;cursor:default}</style>` + previewHtml}
                className="flex-1 w-full bg-[#FDFBF7]"
                sandbox="allow-same-origin"
              />
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-3 border-t border-[#1A1A1A]/10 gap-2 bg-[#FDFBF7]">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-[#1A1A1A]">
            Close
          </Button>
          {isLocked ? (
            <Button
              variant="outline"
              onClick={() => unlock.mutate(variant)}
              disabled={unlock.isPending}
              className="border-amber-400 text-amber-800 hover:bg-amber-50"
            >
              <Lock className="w-3 h-3 mr-1" /> {unlock.isPending ? "Unlocking…" : "Unlock template"}
            </Button>
          ) : (
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
