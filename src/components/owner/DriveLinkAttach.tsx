/**
 * DriveLinkAttach — owner-only affordance to attach a Google Drive folder
 * link to a developer or a project card, then optionally trigger the
 * extraction engine. Never deletes the link on save; the URL is persisted
 * and shown as a chip after save.
 */
import { useState } from "react";
import { Link2, ExternalLink, Loader2, Sparkles, Save } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useEffectiveOwner } from "@/hooks/useEffectiveOwner";
import { toast } from "sonner";

type EntityType = "developer" | "project";

interface Props {
  entityType: EntityType;
  entityId: string;
  entityName: string;
  currentUrl?: string | null;
  compact?: boolean;
  onSaved?: (url: string) => void;
}

function isDriveUrl(u: string) {
  return /^https?:\/\/(drive|docs)\.google\.com\//i.test(u.trim());
}

export default function DriveLinkAttach({
  entityType,
  entityId,
  entityName,
  currentUrl,
  compact,
  onSaved,
}: Props) {
  const { effectiveOwner } = useEffectiveOwner();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(currentUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);

  if (!effectiveOwner) return null;

  const table = entityType === "developer" ? "developers" : "projects";

  const save = async () => {
    const clean = url.trim();
    if (clean && !isDriveUrl(clean)) {
      toast.error("Only Google Drive / Docs links are accepted");
      return;
    }
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from(table)
        .update({ google_drive_url: clean || null })
        .eq("id", entityId);
      if (error) throw error;
      toast.success(clean ? "Drive link saved — enriching in the background" : "Drive link cleared");
      onSaved?.(clean);
      // Auto-enrichment: any saved link immediately runs the backend
      // extraction so developer / area / project records and photos are
      // enriched from the link's contents without a second click.
      if (clean) void extract();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save link");
    } finally {
      setSaving(false);
    }
  };

  const extract = async () => {
    const clean = url.trim();
    if (!clean || !isDriveUrl(clean)) {
      toast.error("Save a valid Google Drive link first");
      return;
    }
    setExtracting(true);
    try {
      // Always persist link before extracting — never delete it.
      await (supabase as any).from(table).update({ google_drive_url: clean }).eq("id", entityId);
      const { data, error } = await supabase.functions.invoke("drive-drop-classify", {
        body: {
          folder_url: clean,
          entity_type: entityType,
          entity_names: [entityName],
          notes: `Attached to ${entityType}:${entityId}`,
        },
      });
      if (error) throw error;
      const m = data?.summary?.matched ?? 0;
      const n = data?.summary?.new ?? 0;
      toast.success(`Analyzed — ${m} matched · ${n} new`);
    } catch (e: any) {
      toast.error(e?.message || "Extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  const has = !!(currentUrl && isDriveUrl(currentUrl));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-no-contrast-guard
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          aria-label={has ? "Edit Drive link" : "Attach Drive link"}
          title={has ? "Drive link attached — click to edit or extract" : "Attach Google Drive link"}
          className={
            "allow-white inline-flex items-center gap-1.5 rounded-full border shrink-0 transition " +
            (compact ? "h-6 px-2 text-[10px]" : "h-7 px-2.5 text-[11px]") + " " +
            (has
              ? "bg-[#064E3B] text-white border-[#064E3B] hover:bg-[#042c1c]"
              : "bg-white text-[#064E3B] border-[#B89555]/60 hover:bg-[#F7F2EA]")
          }
        >
          <Link2 className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
          <span className="font-semibold tracking-wide uppercase">
            {has ? "Drive" : "+ Drive"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-80 p-3 bg-[#FDFBF7] border-[#B89555]/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2.5">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1A1A1A]">
            Attach Drive folder · {entityType}
          </div>
          <p className="text-[11px] text-[#1A1A1A]/70 leading-snug">
            Paste the Google Drive folder that holds this {entityType}'s marketing materials.
            The link is saved on the record and never deleted automatically.
          </p>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/…"
            className="bg-white border-[#B89555]/50 text-[#1A1A1A] text-xs"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex items-center justify-between gap-2 pt-0.5">
            {isDriveUrl(url) && (
              <a
                href={url.trim()}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[11px] text-[#064E3B] hover:underline"
              >
                <ExternalLink className="w-3 h-3" /> Open
              </a>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                data-no-contrast-guard
                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-white border border-[#B89555]/60 text-[#1A1A1A] text-[11px] font-semibold hover:bg-[#F7F2EA] disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save
              </button>
              <button
                type="button"
                onClick={extract}
                disabled={extracting || !isDriveUrl(url)}
                data-no-contrast-guard
                className="allow-white inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-[#064E3B] text-white border border-[#064E3B] text-[11px] font-semibold hover:bg-[#042c1c] disabled:opacity-60"
              >
                {extracting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Extract
              </button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
