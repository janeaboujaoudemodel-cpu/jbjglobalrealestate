/**
 * OutreachAttachmentsEditor — Phase 5 restoration.
 *
 * Lightweight editor for two paired collections stored on `crm_owner_settings`:
 *   • Attachments — named file links auto-attached on outreach emails
 *   • Workflow templates — reusable named registration-workflow snippets
 *
 * Both arrays are { label: string; url: string }[] persisted as jsonb.
 * Each context (brokerage / developer) has its own pair of columns.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Paperclip, Plus, Trash2, FileText, ExternalLink } from "lucide-react";

export interface NamedLink {
  label: string;
  url: string;
}

interface Props {
  context: "brokerage" | "developer";
  attachments: NamedLink[];
  workflows: NamedLink[];
  onChange: (patch: { attachments?: NamedLink[]; workflows?: NamedLink[] }) => void;
}

const isHttp = (u: string) => /^https?:\/\//i.test(u.trim());

export function OutreachAttachmentsEditor({ context, attachments, workflows, onChange }: Props) {
  const [aLabel, setALabel] = useState("");
  const [aUrl, setAUrl] = useState("");
  const [wLabel, setWLabel] = useState("");
  const [wUrl, setWUrl] = useState("");

  const addAttachment = () => {
    if (!aLabel.trim() || !isHttp(aUrl)) return;
    onChange({ attachments: [...attachments, { label: aLabel.trim(), url: aUrl.trim() }] });
    setALabel(""); setAUrl("");
  };
  const removeAttachment = (i: number) =>
    onChange({ attachments: attachments.filter((_, idx) => idx !== i) });

  const addWorkflow = () => {
    if (!wLabel.trim() || !isHttp(wUrl)) return;
    onChange({ workflows: [...workflows, { label: wLabel.trim(), url: wUrl.trim() }] });
    setWLabel(""); setWUrl("");
  };
  const removeWorkflow = (i: number) =>
    onChange({ workflows: workflows.filter((_, idx) => idx !== i) });

  return (
    <div className="md:col-span-2 grid gap-4 mt-1">
      {/* Attachment Manager */}
      <div className="rounded-xl border border-[#1A1A1A]/10 bg-[#F7F2EA]/60 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Paperclip className="w-3.5 h-3.5 text-[#1A1A1A]" />
          <Label className="text-xs font-semibold text-[#1A1A1A]">
            Attachment Manager — auto-attached to {context === "brokerage" ? "brokerage outreach" : "developer registration"} emails
          </Label>
        </div>
        {attachments.length > 0 && (
          <ul className="space-y-1.5 mb-2">
            {attachments.map((a, i) => (
              <li key={i} className="flex items-center gap-2 text-xs bg-white border border-[#B89555]/30 rounded px-2 py-1.5">
                <FileText className="w-3.5 h-3.5 text-[#B89555] shrink-0" />
                <span className="font-semibold text-[#1A1A1A] truncate flex-1">{a.label}</span>
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-[#1A1A1A]/70 hover:text-[#1A1A1A] inline-flex items-center gap-0.5">
                  Open <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="text-red-600/70 hover:text-red-600"
                  aria-label="Remove attachment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2">
          <Input placeholder="Label (e.g. Trade Licence)" value={aLabel} onChange={(e) => setALabel(e.target.value)} className="h-9 text-xs" />
          <Input placeholder="https://…" value={aUrl} onChange={(e) => setAUrl(e.target.value)} className="h-9 text-xs" />
          <Button
            type="button" size="sm" variant="outline"
            onClick={addAttachment}
            disabled={!aLabel.trim() || !isHttp(aUrl)}
            className="border-[#1A1A1A]/20"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add
          </Button>
        </div>
        <p className="text-[10px] text-[#1A1A1A]/60 mt-1.5">
          Files are referenced by URL — Drive, Dropbox, or any direct PDF link works. They appear as a short list under the body of every outreach email in this context.
        </p>
      </div>

      {/* Workflow Templates */}
      <div className="rounded-xl border border-[#1A1A1A]/10 bg-[#F7F2EA]/60 p-3">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-3.5 h-3.5 text-[#1A1A1A]" />
          <Label className="text-xs font-semibold text-[#1A1A1A]">
            Registration Workflow Templates — quick-pick snippets for {context === "brokerage" ? "brokerage" : "developer"} flows
          </Label>
        </div>
        {workflows.length > 0 && (
          <ul className="space-y-1.5 mb-2">
            {workflows.map((w, i) => (
              <li key={i} className="flex items-center gap-2 text-xs bg-white border border-[#B89555]/30 rounded px-2 py-1.5">
                <span className="font-semibold text-[#1A1A1A] truncate flex-1">{w.label}</span>
                <a href={w.url} target="_blank" rel="noopener noreferrer" className="text-[#1A1A1A]/70 hover:text-[#1A1A1A] inline-flex items-center gap-0.5">
                  Open <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => removeWorkflow(i)}
                  className="text-red-600/70 hover:text-red-600"
                  aria-label="Remove workflow"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2">
          <Input placeholder="Template name (e.g. Standard MOU flow)" value={wLabel} onChange={(e) => setWLabel(e.target.value)} className="h-9 text-xs" />
          <Input placeholder="https://docs.google.com/…" value={wUrl} onChange={(e) => setWUrl(e.target.value)} className="h-9 text-xs" />
          <Button
            type="button" size="sm" variant="outline"
            onClick={addWorkflow}
            disabled={!wLabel.trim() || !isHttp(wUrl)}
            className="border-[#1A1A1A]/20"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add
          </Button>
        </div>
      </div>
    </div>
  );
}
