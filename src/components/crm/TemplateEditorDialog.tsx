import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Lock, Eye } from "lucide-react";
import {
  useEmailTemplate,
  useUpsertEmailTemplate,
  useLockEmailTemplate,
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
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => { setVariant(initialVariant); }, [initialVariant, open]);
  useEffect(() => {
    if (template) { setSubject(template.subject); setHtml(template.html); }
  }, [template?.variant, template?.updated_at]);

  const isLocked = !!template?.locked_at;
  const previewHtml = html
    .replace(/\{\{developer_name\}\}/g, "Sample Developer Co.")
    .replace(/\{\{drive_url\}\}/g, "https://drive.google.com/…")
    .replace(/\{\{reply_to\}\}/g, "contact@jbj.ae")
    .replace(/\{\{cc_email\}\}/g, "infoo.jane@gmail.com");

  const handleLock = () => {
    if (!confirm("Lock this template? After locking, the subject and body cannot be edited from the app — every email will use exactly this version.")) return;
    lock.mutate(variant);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-black">
            <span>Email Template</span>
            {isLocked && (
              <span className="text-xs font-medium text-amber-700 flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3" /> Locked {new Date(template!.locked_at!).toLocaleDateString()}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-3">
          {(Object.keys(VARIANT_LABELS) as RegistrationVariant[]).map((v) => (
            <Button
              key={v}
              variant={variant === v ? "default" : "outline"}
              size="sm"
              onClick={() => setVariant(v)}
              className={variant === v ? "bg-black text-white" : ""}
            >
              {VARIANT_LABELS[v]}
            </Button>
          ))}
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={() => setShowPreview((p) => !p)}>
            <Eye className="w-3 h-3 mr-1" />{showPreview ? "Hide" : "Show"} Preview
          </Button>
        </div>

        <div className={`grid gap-4 ${showPreview ? "md:grid-cols-2" : "grid-cols-1"}`}>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-black">Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={isLocked} />
            </div>
            <div>
              <Label className="text-xs text-black">HTML body — use <code className="bg-gray-100 px-1">{`{{developer_name}}`}</code> and <code className="bg-gray-100 px-1">{`{{drive_url}}`}</code> placeholders</Label>
              <Textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                disabled={isLocked}
                rows={22}
                className="font-mono text-xs bg-white"
              />
            </div>
          </div>
          {showPreview && (
            <div className="border border-black/10 rounded-xl overflow-hidden bg-[#FAF5EA]">
              <div className="text-[10px] uppercase tracking-wider text-gray-700 px-3 py-2 bg-white border-b border-black/10">Preview</div>
              <iframe
                title="Email preview"
                srcDoc={previewHtml}
                className="w-full h-[480px] bg-white"
                sandbox=""
              />
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
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
                className="bg-black text-white hover:bg-gray-800"
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
