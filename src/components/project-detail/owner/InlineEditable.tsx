import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useIsAppOwner } from "@/hooks/useIsAppOwner";
import { cn } from "@/lib/utils";

type FieldType = "text" | "textarea" | "number" | "date";

interface InlineEditableProps {
  projectId: string;
  field: string;            // column name in projects table
  value: string | number | null | undefined;
  type?: FieldType;
  className?: string;
  children: React.ReactNode; // current rendered display
  placeholder?: string;
  /** Optional override for the surface tone (default = dark hero overlay) */
  surface?: "light" | "dark";
}

export default function InlineEditable({
  projectId, field, value, type = "text", className, children, placeholder, surface = "light",
}: InlineEditableProps) {
  const { isOwner } = useIsAppOwner();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(value == null ? "" : String(value));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value == null ? "" : String(value));
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [editing, value]);

  if (!isOwner) return <>{children}</>;

  const save = async () => {
    setSaving(true);
    try {
      let payload: any = draft;
      if (type === "number") payload = draft === "" ? null : Number(draft);
      const { error } = await supabase
        .from("projects")
        .update({ [field]: payload })
        .eq("id", projectId);
      if (error) throw error;
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["project"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      setEditing(false);
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    const baseInput =
      "w-full px-2 py-1 rounded-md bg-[#FDFBF7] text-[#1A1A1A] border border-[#B89555]/60 focus:outline-none focus:ring-2 focus:ring-[#B89555]/40 text-sm";
    return (
      <span className="inline-flex items-start gap-2 align-middle w-full">
        {type === "textarea" ? (
          <textarea
            ref={inputRef as any}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            className={cn(baseInput, "min-h-[120px]")}
            placeholder={placeholder}
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
          "opacity-0 group-hover/edit:opacity-100 transition-opacity inline-flex items-center justify-center w-6 h-6 rounded-md",
          pencilTone,
        )}
        aria-label={`Edit ${field}`}
        data-no-contrast-guard
      >
        <Pencil className="w-3 h-3" />
      </button>
    </span>
  );
}
