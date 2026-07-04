import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useCanEdit } from "@/hooks/useEffectiveOwner";
import { cn } from "@/lib/utils";


type FieldType = "text" | "textarea" | "number" | "date";

interface InlineEditableProps {
  /** Convenience: equivalent to recordId + table="projects" */
  projectId?: string;
  /** Generic record id (preferred when editing other tables) */
  recordId?: string;
  /** Table to update — defaults to "projects" */
  table?: string;
  field: string;
  value: string | number | null | undefined;
  type?: FieldType;
  className?: string;
  children: React.ReactNode;
  placeholder?: string;
  surface?: "light" | "dark";
  /** Visible label for the pencil tooltip and a11y */
  label?: string;
  /** Invalidation keys to refresh after save */
  invalidateKeys?: string[];
  /**
   * Permission scope. Owners always pass; delegates only see the pencil if their
   * scopes[scope] is true. Defaults to "project_text".
   * Known scopes: project_text, project_photos, project_documents,
   * developer_info, quick_facts, market_intel, crm, marketing.
   */
  scope?: string;
}

/** Strip HTML tags + decode entities → plain text with line breaks preserved. */
function htmlToPlain(raw: string): string {
  if (!raw) return "";
  let s = raw;
  // If it looks like HTML, parse via DOM
  if (/<[a-z][\s\S]*>/i.test(s)) {
    try {
      const doc = new DOMParser().parseFromString(s, "text/html");
      // Insert line breaks for block-level closes
      doc.querySelectorAll("br").forEach((b) => b.replaceWith("\n"));
      doc.querySelectorAll("p,div,li,h1,h2,h3,h4,h5,h6").forEach((el) => {
        el.append("\n");
      });
      s = doc.body.textContent || "";
    } catch {
      s = s.replace(/<[^>]+>/g, "");
    }
  }
  // Strip lightweight markdown syntax the user shouldn't have to see
  s = s
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/(^|\s)\*(?!\s)([^*\n]+?)\*(?!\w)/g, "$1$2")
    .replace(/(^|\s)_(?!\s)([^_\n]+?)_(?!\w)/g, "$1$2")
    .replace(/^\s*[-•]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return s;
}

export default function InlineEditable({
  projectId, recordId, table = "projects",
  field, value, type = "text", className, children, placeholder,
  surface = "light", label, invalidateKeys, scope = "project_text",
}: InlineEditableProps) {
  const canEdit = useCanEdit(scope);
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const id = recordId ?? projectId;
  const initial = type === "textarea" ? htmlToPlain(value == null ? "" : String(value)) : (value == null ? "" : String(value));
  const [draft, setDraft] = useState<string>(initial);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (editing) {
      setDraft(type === "textarea" ? htmlToPlain(value == null ? "" : String(value)) : (value == null ? "" : String(value)));
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [editing, value, type]);

  if (!canEdit || !id) return <>{children}</>;

  const save = async () => {
    setSaving(true);
    try {
      let payload: any = draft;
      if (type === "number") payload = draft === "" ? null : Number(draft);
      const { error } = await (supabase as any)
        .from(table)
        .update({ [field]: payload })
        .eq("id", id);
      if (error) throw error;
      toast.success("Saved");
      const keys = invalidateKeys ?? ["project", "projects", table];
      keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      setEditing(false);
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    const baseInput =
      "w-full px-3 py-2 rounded-md bg-[#FDFBF7] text-[#1A1A1A] border border-[#B89555]/60 focus:outline-none focus:ring-2 focus:ring-[#B89555]/40 text-sm leading-relaxed";
    return (
      <span className="inline-flex items-start gap-2 align-middle w-full">
        {type === "textarea" ? (
          <textarea
            ref={inputRef as any}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={8}
            className={cn(baseInput, "min-h-[160px] whitespace-pre-wrap")}
            placeholder={placeholder ?? "Write a normal paragraph. Line breaks become new paragraphs."}
          />
        ) : (
          <input
            ref={inputRef as any}
            type={type === "date" ? "date" : type === "number" ? "number" : "text"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className={baseInput}
            placeholder={placeholder}
          />
        )}
        <button
          onClick={save}
          disabled={saving}
          className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#1E5F3F] text-white hover:bg-[#194f35]"
          aria-label="Save"
          data-no-contrast-guard
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => setEditing(false)}
          disabled={saving}
          className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#e4d8c0] border border-[#B89555]/40"
          aria-label="Cancel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </span>
    );
  }

  const pencilTone =
    surface === "dark"
      ? "bg-black/40 text-[#FDE68A] hover:bg-black/60 border border-[#FDE68A]/40"
      : "bg-[#F7F2EA] text-[#1A1A1A] hover:bg-[#EFE6D6] border border-[#B89555]/40";

  return (
    <span className={cn("group/edit inline-flex items-center gap-2 align-middle", className)}>
      {children}
      <button
        onClick={() => setEditing(true)}
        className={cn(
          "opacity-60 hover:opacity-100 group-hover/edit:opacity-100 transition-opacity inline-flex items-center justify-center w-6 h-6 rounded-md",
          pencilTone,
        )}
        aria-label={label ?? `Edit ${field}`}
        title={label ?? `Edit ${field}`}
        data-no-contrast-guard
        data-owner-pencil
      >
        <Pencil className="w-3 h-3" />
      </button>
    </span>
  );
}
