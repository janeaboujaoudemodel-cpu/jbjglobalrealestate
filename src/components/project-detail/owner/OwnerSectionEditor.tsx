import { useEffect, useMemo, useState } from "react";
import { Pencil, Loader2, Save, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCanEdit } from "@/hooks/useEffectiveOwner";
import OwnerImageManager from "./OwnerImageManager";
import OwnerDocDropzone from "./OwnerDocDropzone";
import { SECTION_CONFIGS, type FieldDef } from "./sectionFieldConfigs";

interface Props {
  projectId: string;
  /** Developer table row id (only required for the "developer" section). */
  developerId?: string | null;
  /** Cover image, used by gallery image manager. */
  coverImageUrl?: string | null;
  /** Section id matching SECTION_CONFIGS key. */
  section: keyof typeof SECTION_CONFIGS | string;
  /** Initial values for the configured fields. Keys must match field.key. */
  initial: Record<string, any>;
  /** Visible label, falls back to config.title. */
  label?: string;
  /** Compact pill (default) vs ghost icon. */
  variant?: "pill" | "icon";
}

const listToText = (v: any) =>
  Array.isArray(v) ? v.filter(Boolean).join("\n") : "";
const textToList = (s: string) =>
  s.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);

const distancesToText = (v: any) =>
  Array.isArray(v)
    ? v.map((d) => `${d?.label ?? ""} | ${d?.time ?? ""}`).join("\n")
    : "";
const textToDistances = (s: string) =>
  s
    .split(/\r?\n/)
    .map((line) => {
      const [label, time] = line.split("|").map((x) => x?.trim());
      if (!label) return null;
      return { label, time: time || "" };
    })
    .filter(Boolean);

const faqsToText = (v: any) =>
  Array.isArray(v)
    ? v.map((f) => `${f?.question ?? ""}\n${f?.answer ?? ""}`).join("\n\n")
    : "";
const textToFaqs = (s: string) =>
  s
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
      if (lines.length < 1) return null;
      return { question: lines[0], answer: lines.slice(1).join("\n") };
    })
    .filter(Boolean);

export default function OwnerSectionEditor({
  projectId,
  developerId,
  coverImageUrl,
  section,
  initial,
  label,
  variant = "pill",
}: Props) {
  const config = SECTION_CONFIGS[section as string];
  const canEdit = useCanEdit(config?.scope);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  // Hydrate values when opening
  useEffect(() => {
    if (!open || !config) return;
    const next: Record<string, string> = {};
    for (const f of config.fields) {
      const raw = initial[f.key];
      if (f.type === "list" || f.type === "highlights") next[f.key] = listToText(raw);
      else if (f.type === "distances") next[f.key] = distancesToText(raw);
      else if (f.type === "faqs") next[f.key] = faqsToText(raw);
      else if (f.type === "date" && raw) next[f.key] = String(raw).slice(0, 10);
      else next[f.key] = raw == null ? "" : String(raw);
    }
    setValues(next);
  }, [open, config, initial]);

  const setField = (k: string, v: string) =>
    setValues((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);

    const projectPatch: Record<string, any> = {};
    const devPatch: Record<string, any> = {};

    for (const f of config.fields) {
      const raw = values[f.key];
      let parsed: any = raw;
      if (f.type === "number") parsed = raw === "" ? null : Number(raw);
      else if (f.type === "list" || f.type === "highlights") parsed = textToList(raw || "");
      else if (f.type === "distances") parsed = textToDistances(raw || "");
      else if (f.type === "faqs") parsed = textToFaqs(raw || "");
      else if (f.type === "date") parsed = raw || null;
      else if (f.type === "text" || f.type === "textarea" || f.type === "url" || f.type === "select")
        parsed = raw === "" ? null : raw;

      if (f.key.startsWith("dev_")) {
        devPatch[f.key.replace(/^dev_/, "")] = parsed;
      } else {
        projectPatch[f.key] = parsed;
      }
    }

    try {
      if (Object.keys(projectPatch).length > 0) {
        const { error } = await supabase.from("projects").update(projectPatch as any).eq("id", projectId);
        if (error) throw error;
      }
      if (Object.keys(devPatch).length > 0) {
        if (!developerId) {
          toast.error("Cannot save developer fields: no developer linked");
        } else {
          const { error } = await (supabase as any).from("developers").update(devPatch).eq("id", developerId);
          if (error) throw error;
        }
      }
      toast.success(`${config.title} saved`);
      qc.invalidateQueries({ queryKey: ["project"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["developer"] });
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!canEdit || !config) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={`Edit ${config.title}`}
          title={`Edit ${config.title}`}
          data-no-contrast-guard
          data-owner-pencil
          className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#F7F2EA] hover:bg-[#EFE6D6] border border-[#B89555]/40 text-[#1A1A1A] transition shadow-sm"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </SheetTrigger>


      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto bg-[#FDFBF7]">
        <SheetHeader>
          <SheetTitle className="text-[#1A1A1A]">{config.title}</SheetTitle>
          <SheetDescription className="text-[#1A1A1A]/70">
            Owner edit · changes save to the database and appear instantly site-wide.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {config.fields.map((f) => (
            <FieldRow key={f.key} field={f} value={values[f.key] ?? ""} onChange={(v) => setField(f.key, v)} />
          ))}

          {section === "gallery" && (
            <OwnerImageManager projectId={projectId} coverImageUrl={coverImageUrl} />
          )}

          {section === "brochure" && (
            <div className="rounded-xl border border-[#B89555]/40 bg-[#F7F2EA] p-4">
              <p className="text-xs uppercase tracking-[0.18em] font-semibold text-[#1A1A1A]/70 mb-2">
                Owner · Brochure & Documents
              </p>
              <OwnerDocDropzone projectId={projectId} />
            </div>
          )}

          {section === "floor-plans" && (
            <div className="rounded-xl border border-[#B89555]/40 bg-[#F7F2EA] p-4">
              <p className="text-xs uppercase tracking-[0.18em] font-semibold text-[#1A1A1A]/70 mb-2">
                Owner · Upload floor plan PDFs
              </p>
              <OwnerDocDropzone projectId={projectId} />
            </div>
          )}
        </div>

        <SheetFooter className="mt-8 sticky bottom-0 bg-[#FDFBF7] pt-4 pb-2 border-t border-[#B89555]/30">
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving} className="flex-1">
              <X className="w-4 h-4" /> Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save changes
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function FieldRow({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = `f_${field.key}`;
  const common = "bg-white border-[#B89555]/40 text-[#1A1A1A]";
  return (
    <div>
      <Label htmlFor={id} className="text-[#1A1A1A] text-sm font-semibold">
        {field.label}
      </Label>
      {field.type === "select" ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={id} className={`mt-1 ${common}`}>
            <SelectValue placeholder={field.placeholder || "Select"} />
          </SelectTrigger>
          <SelectContent className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A]">
            {(field.options || []).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === "textarea" || field.type === "list" || field.type === "highlights" || field.type === "distances" || field.type === "faqs" ? (
        <Textarea
          id={id}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={field.type === "faqs" ? 10 : field.type === "textarea" ? 6 : 5}
          className={`mt-1 ${common}`}
        />
      ) : (
        <Input
          id={id}
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "url" ? "url" : "text"}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`mt-1 ${common}`}
        />
      )}
      {field.help && (
        <p className="text-[11px] text-[#1A1A1A]/55 mt-1">{field.help}</p>
      )}
    </div>
  );
}
