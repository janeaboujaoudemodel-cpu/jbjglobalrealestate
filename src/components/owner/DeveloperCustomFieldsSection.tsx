/**
 * Global custom-fields registry surface for a single developer.
 *
 * - Reads active field definitions from `developer_custom_field_defs`
 *   (populated automatically by the AI extractor when it finds a field that
 *   doesn't map to a native column, and manually via "Add field" here).
 * - Reads/writes the per-developer values on `developers.custom_fields`
 *   (JSONB keyed by the registry `key`).
 * - "Manage fields" popover lets the owner rename, reorder, hide, or delete
 *   registry entries — those changes apply globally to every developer.
 *
 * Only owner/admin roles are able to write; the RLS policies on the registry
 * enforce that server-side. Value edits go to the `developers` row, which is
 * already gated by existing developer edit permissions.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Settings2,
  Plus,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Trash2,
  Sparkles,
  Save,
} from "lucide-react";
import { fieldToText, humanizeDeveloperFieldKey } from "@/utils/developerExcelFields";
import { PROJECTS_AREAS_KEY_REGEX } from "@/utils/developerProjectsFootprint";

/**
 * Keys that must NEVER appear in the auto-inferred Extended Fields grid.
 * These are either:
 *   - contact data — belongs in the Contacts & Reps tab as structured contact
 *     rows (position dropdown + name/email/phone/whatsapp/notes/languages),
 *     not as free-form "ADMIN POSITION: Head of Sales" text fields.
 *   - system/import metadata — internal only.
 *   - already rendered elsewhere on the profile.
 */
const SUPPRESSED_INFERRED_KEYS = new Set<string>([
  // Contact — rendered in Contacts & Reps tab
  "admin_position",
  "admin_email",
  "admin_phone",
  "admin_name",
  "admin_full_name",
  "admin_whatsapp",
  "admin_contact",
  "position",
  "contact_position",
  "contact_name",
  "contact_email",
  "contact_phone",
  "office_phone",
  "office_email",
  "whatsapp",
  "whatsapp_number",
  "phone",
  "email",
  // Location — rendered on the main profile card and the Contacts tab
  "office_address",
  "headquarters",
  "google_maps_url",
  // Owner-only URLs already rendered as first-class fields
  "website_url",
  "google_drive_url",
  "instagram_url",
  "linkedin_url",
  "facebook_url",
  "whatsapp_group_url",
  "telegram_group_url",
  // Import/system metadata
  "excel_row",
  "excel_serial",
  "excel_status",
  "source_url",
  "source",
  "imported_at",
  "imported_from",
]);

type FieldType = "text" | "longtext" | "number" | "url" | "list" | "date";

interface FieldDef {
  id: string;
  key: string;
  label: string;
  field_type: FieldType;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  source: "manual" | "ai_discovered";
}

interface Props {
  developerId: string;
  canEdit: boolean;
  initialValues: Record<string, unknown> | null | undefined;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);

export default function DeveloperCustomFieldsSection({
  developerId,
  canEdit,
  initialValues,
}: Props) {
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, unknown>>(
    (initialValues as Record<string, unknown>) || {},
  );
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues((initialValues as Record<string, unknown>) || {});
    setDirty(false);
  }, [initialValues, developerId]);

  const { data: defs = [], isLoading } = useQuery({
    queryKey: ["developer-custom-field-defs"],
    queryFn: async (): Promise<FieldDef[]> => {
      const { data, error } = await supabase
        .from("developer_custom_field_defs" as any)
        .select("id, key, label, field_type, description, sort_order, is_active, source")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as any) ?? [];
    },
  });

  const active = useMemo(() => defs.filter((d) => d.is_active), [defs]);
  const renderedFields = useMemo(() => {
    const byKey = new Map(active.map((def) => [def.key, def]));
    const inferred = Object.entries(values)
      .filter(([key, value]) => {
        if (byKey.has(key)) return false;
        if (SUPPRESSED_INFERRED_KEYS.has(key)) return false;
        // *_projects_areas render via the structured Projects Footprint card
        if (PROJECTS_AREAS_KEY_REGEX.test(key)) return false;
        return !!fieldToText(value);
      })
      .map(([key, value], index): FieldDef => {
        const text = fieldToText(value);
        const isUrl = /^https?:\/\//i.test(text);
        const isNumber = typeof value === "number" || (/^-?\d+(\.\d+)?$/.test(text) && text.length < 12);
        return {
          id: `excel-${key}`,
          key,
          label: humanizeDeveloperFieldKey(key),
          field_type: isUrl ? "url" : isNumber ? "number" : text.length > 120 || text.includes("\n") ? "longtext" : "text",
          description: "Imported from the Excel database",
          sort_order: 10_000 + index,
          is_active: true,
          source: "manual",
        };
      });
    return [...active, ...inferred];
  }, [active, values]);

  const setVal = (key: string, v: unknown) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("developers")
        .update({ custom_fields: values } as any)
        .eq("id", developerId);
      if (error) throw error;
      toast.success("Custom fields saved");
      setDirty(false);
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === "dev-profile" });
      qc.invalidateQueries({ queryKey: ["admin-developer"] });
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const refreshDefs = () =>
    qc.invalidateQueries({ queryKey: ["developer-custom-field-defs"] });

  return (
    <div className="rounded-xl border border-[#B89555]/40 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] font-semibold text-[#1A1A1A]/70 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#B89555]" />
            Extended developer fields
          </p>
          <p className="text-[11px] text-[#1A1A1A]/55">
            Fields discovered by AI from company profiles become part of the
            standard form for every developer. Rename, reorder, or remove them
            from Manage fields — changes apply globally.
          </p>
        </div>
        {canEdit && (
          <ManageFieldsPopover defs={defs} onChanged={refreshDefs} />
        )}
      </div>

      {isLoading ? (
        <p className="text-xs text-[#1A1A1A]/50">Loading fields…</p>
      ) : renderedFields.length === 0 ? (
        <p className="text-xs text-[#1A1A1A]/50 italic">
          No extended fields yet — imported Excel fields and AI-extracted fields
          will appear here automatically when available.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {renderedFields.map((f) => (
            <FieldEditor
              key={f.key}
              def={f}
              value={values[f.key]}
              disabled={!canEdit}
              onChange={(v) => setVal(f.key, v)}
            />
          ))}
        </div>
      )}

      {canEdit && renderedFields.length > 0 && (
        <div className="flex items-center justify-between pt-1 border-t border-[#B89555]/20">
          <p className="text-[11px] text-[#1A1A1A]/60">
            {saving ? "Saving…" : dirty ? "Unsaved changes" : "All extended fields saved"}
          </p>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-[#064E3B] text-white hover:bg-[#064E3B]/90"
            style={{ color: "#FFFFFF" }}
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {saving ? "Saving…" : dirty ? "Save now" : "Save extended fields"}
          </Button>
        </div>
      )}
    </div>
  );
}

function FieldEditor({
  def,
  value,
  disabled,
  onChange,
}: {
  def: FieldDef;
  value: unknown;
  disabled: boolean;
  onChange: (v: unknown) => void;
}) {
  const displayValue =
    value === undefined || value === null
      ? ""
      : Array.isArray(value)
        ? value.join(", ")
        : String(value);

  const commit = (raw: string) => {
    if (def.field_type === "number") {
      const n = raw.trim() === "" ? null : Number(raw);
      onChange(Number.isFinite(n as number) ? n : null);
    } else if (def.field_type === "list") {
      onChange(
        raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      );
    } else {
      onChange(raw.trim() === "" ? null : raw);
    }
  };

  return (
    <div>
      <Label className="text-[11px] uppercase tracking-wider text-[#1A1A1A]/70 font-semibold">
        {def.label}
        {def.source === "ai_discovered" && (
          <span
            className="ml-1.5 inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded"
            style={{ backgroundColor: "#064E3B", color: "#FFFFFF" }}
          >
            <Sparkles className="w-2.5 h-2.5" /> AI
          </span>
        )}
      </Label>
      {def.field_type === "longtext" ? (
        <Textarea
          rows={3}
          disabled={disabled}
          value={displayValue}
          onChange={(e) => commit(e.target.value)}
          className="bg-[#FDFBF7] border-[#B89555]/30"
        />
      ) : (
        <Input
          disabled={disabled}
          type={
            def.field_type === "number"
              ? "number"
              : def.field_type === "url"
                ? "url"
                : def.field_type === "date"
                  ? "date"
                  : "text"
          }
          value={displayValue}
          onChange={(e) => commit(e.target.value)}
          placeholder={def.field_type === "list" ? "Comma-separated…" : ""}
          className="bg-[#FDFBF7] border-[#B89555]/30"
        />
      )}
      {def.description && (
        <p className="text-[10px] text-[#1A1A1A]/50 mt-0.5">{def.description}</p>
      )}
    </div>
  );
}

/* ---------------- Manage fields popover ---------------- */

function ManageFieldsPopover({
  defs,
  onChanged,
}: {
  defs: FieldDef[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<FieldType>("text");
  const [busy, setBusy] = useState(false);

  const patch = async (id: string, changes: Partial<FieldDef>) => {
    const { error } = await supabase
      .from("developer_custom_field_defs" as any)
      .update(changes as any)
      .eq("id", id);
    if (error) toast.error(error.message);
    else onChanged();
  };

  const remove = async (d: FieldDef) => {
    if (
      !confirm(
        `Delete field "${d.label}" for ALL developers? Existing values remain in the database but won't be shown.`,
      )
    )
      return;
    const { error } = await supabase
      .from("developer_custom_field_defs" as any)
      .delete()
      .eq("id", d.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`"${d.label}" removed globally`);
      onChanged();
    }
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const a = defs[idx];
    const b = defs[idx - 1];
    patch(a.id, { sort_order: b.sort_order - 1 });
  };

  const moveDown = (idx: number) => {
    if (idx === defs.length - 1) return;
    const a = defs[idx];
    const b = defs[idx + 1];
    patch(a.id, { sort_order: b.sort_order + 1 });
  };

  const addField = async () => {
    const label = newLabel.trim();
    if (!label) return;
    const key = slugify(label);
    if (!key) return;
    setBusy(true);
    try {
      const nextOrder = Math.max(0, ...defs.map((d) => d.sort_order)) + 10;
      const { error } = await supabase.from("developer_custom_field_defs" as any).insert({
        key,
        label,
        field_type: newType,
        sort_order: nextOrder,
        source: "manual",
      } as any);
      if (error) throw error;
      toast.success(`"${label}" added to every developer form`);
      setNewLabel("");
      onChanged();
    } catch (e: any) {
      toast.error(e.message || "Add failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-8 text-xs border-[#B89555]/40 bg-white text-[#064E3B]"
          data-no-contrast-guard
          style={{ color: "#064E3B" }}
        >
          <Settings2 className="w-3.5 h-3.5 mr-1.5" />
          Manage fields
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[420px] max-h-[70vh] overflow-y-auto p-3 bg-white"
      >
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-[#1A1A1A] mb-1">
              Add a new field (global)
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Field label (e.g. Sister companies)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="text-xs h-8"
              />
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as FieldType)}
                className="text-xs h-8 rounded-md border border-input bg-background px-2"
              >
                <option value="text">Text</option>
                <option value="longtext">Long text</option>
                <option value="number">Number</option>
                <option value="url">URL</option>
                <option value="list">List</option>
                <option value="date">Date</option>
              </select>
              <Button
                size="sm"
                onClick={addField}
                disabled={busy || !newLabel.trim()}
                className="h-8 bg-[#064E3B] hover:bg-[#064E3B]/90"
                style={{ color: "#FFFFFF" }}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            <p className="text-[10px] text-[#1A1A1A]/50 mt-1">
              Adding a field here makes it appear on every developer profile.
            </p>
          </div>

          <div className="border-t border-[#B89555]/25 pt-2">
            <p className="text-xs font-semibold text-[#1A1A1A] mb-1.5">
              Existing fields ({defs.length})
            </p>
            {defs.length === 0 ? (
              <p className="text-[11px] text-[#1A1A1A]/50 italic">
                No fields yet.
              </p>
            ) : (
              <ul className="divide-y divide-[#B89555]/15 rounded border border-[#B89555]/20">
                {defs.map((d, idx) => (
                  <li key={d.id} className="p-2 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={d.label}
                        onChange={(e) =>
                          patch(d.id, { label: e.target.value })
                        }
                        onBlur={(e) => {
                          if (e.target.value.trim() && e.target.value !== d.label)
                            patch(d.id, { label: e.target.value.trim() });
                        }}
                        className="h-7 text-xs flex-1"
                      />
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold"
                        style={{
                          backgroundColor:
                            d.source === "ai_discovered" ? "#064E3B" : "#EFE6D6",
                          color:
                            d.source === "ai_discovered" ? "#FFFFFF" : "#1A1A1A",
                        }}
                      >
                        {d.source === "ai_discovered" ? "AI" : "Manual"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-[#1A1A1A]/60">
                      <span className="font-mono">{d.key}</span>
                      <span>·</span>
                      <span>{d.field_type}</span>
                      <div className="flex-1" />
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-[#EFE6D6] disabled:opacity-30"
                        title="Move up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx === defs.length - 1}
                        className="p-1 rounded hover:bg-[#EFE6D6] disabled:opacity-30"
                        title="Move down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() =>
                          patch(d.id, { is_active: !d.is_active })
                        }
                        className="p-1 rounded hover:bg-[#EFE6D6]"
                        title={d.is_active ? "Hide from form" : "Show on form"}
                      >
                        {d.is_active ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3 opacity-50" />
                        )}
                      </button>
                      <button
                        onClick={() => remove(d)}
                        className="p-1 rounded hover:bg-red-50 text-red-700"
                        title="Delete globally"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
