import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type FieldKey =
  | "instagram_url" | "linkedin_url" | "office_address" | "google_maps_url"
  | "office_phone" | "whatsapp" | "website_url" | "admin_email";

const FIELDS: { key: FieldKey; label: string; description: string }[] = [
  { key: "office_address", label: "Office address", description: "Show street/area address publicly" },
  { key: "google_maps_url", label: "Google Maps link", description: "Clickable map pin on public profile" },
  { key: "office_phone", label: "Office phone", description: "Clickable tel: link, public" },
  { key: "whatsapp", label: "WhatsApp number", description: "Clickable wa.me link, public" },
  { key: "instagram_url", label: "Instagram", description: "Public Instagram link" },
  { key: "linkedin_url", label: "LinkedIn", description: "Public LinkedIn link" },
  { key: "website_url", label: "Website", description: "⚠ Lets clients bypass JBJ. Off by default." },
  { key: "admin_email", label: "Admin email", description: "⚠ Public mailto: link" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedIds: string[];
  totalVisible: number;
  onDone?: () => void;
}

export function DeveloperVisibilitySheet({ open, onOpenChange, selectedIds, totalVisible, onDone }: Props) {
  const [show, setShow] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [busy, setBusy] = useState(false);
  const [scope, setScope] = useState<"selected" | "all">("selected");

  const checkedFields = Object.entries(show).filter(([, v]) => v !== undefined);

  async function apply() {
    if (!checkedFields.length) {
      toast.error("Pick at least one field to update");
      return;
    }
    const fields: Record<string, boolean> = {};
    for (const [k, v] of checkedFields) fields[k] = !!v;

    let ids: string[] = [];
    if (scope === "selected") {
      ids = selectedIds;
      if (!ids.length) { toast.error("Select developers in the directory first"); return; }
    } else {
      const { data, error } = await supabase
        .from("developers")
        .select("id")
        .eq("is_hidden", false)
        .limit(2000);
      if (error) { toast.error(error.message); return; }
      ids = (data ?? []).map((d) => d.id);
    }

    setBusy(true);
    try {
      let updated = 0, failed = 0;
      for (let i = 0; i < ids.length; i += 500) {
        const slice = ids.slice(i, i + 500);
        const { data, error } = await supabase.functions.invoke("developer-visibility-bulk-set", {
          body: { developer_ids: slice, fields, mode: "merge" },
        });
        if (error) throw error;
        updated += (data?.updated as number) ?? 0;
        failed += (data?.failed as number) ?? 0;
      }
      toast.success(`Visibility updated on ${updated} developer${updated === 1 ? "" : "s"}${failed ? ` · ${failed} failed` : ""}`);
      setShow({});
      onDone?.();
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[#FDFBF7] border-l border-[#B89555]/30 w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <ShieldCheck className="size-4" /> Visibility access
          </SheetTitle>
          <SheetDescription className="text-[#1A1A1A]/70">
            Pick which contact fields are exposed on the public profile. Set the toggle to
            <span className="font-semibold"> Public</span> to show, or <span className="font-semibold">Owner-only</span> to hide.
            Unchecked fields stay as they are today.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-2">
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40">Scope</Badge>
            <Button
              size="sm"
              variant={scope === "selected" ? "gold" : "outline"}
              onClick={() => setScope("selected")}
            >
              {selectedIds.length} selected
            </Button>
            <Button
              size="sm"
              variant={scope === "all" ? "gold" : "outline"}
              onClick={() => setScope("all")}
            >
              All ({totalVisible})
            </Button>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {FIELDS.map((f) => {
            const v = show[f.key];
            const state: "off" | "public" | "private" =
              v === undefined ? "off" : v ? "public" : "private";
            return (
              <div
                key={f.key}
                className="flex items-start justify-between gap-3 p-3 rounded-lg border border-[#B89555]/25 bg-[#F7F2EA]"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <Checkbox
                    checked={v !== undefined}
                    onCheckedChange={(c) =>
                      setShow((s) => {
                        const next = { ...s };
                        if (c) next[f.key] = true; else delete next[f.key];
                        return next;
                      })
                    }
                    className="mt-0.5"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1A1A1A]">{f.label}</p>
                    <p className="text-xs text-[#1A1A1A]/70">{f.description}</p>
                  </div>
                </div>
                {v !== undefined && (
                  <div className="flex gap-1 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant={state === "public" ? "gold" : "outline"}
                      onClick={() => setShow((s) => ({ ...s, [f.key]: true }))}
                    >
                      <Eye className="size-3 mr-1" /> Public
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={state === "private" ? "gold" : "outline"}
                      onClick={() => setShow((s) => ({ ...s, [f.key]: false }))}
                    >
                      <EyeOff className="size-3 mr-1" /> Owner-only
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button variant="gold" onClick={apply} disabled={busy || !checkedFields.length}>
            {busy ? "Applying…" : `Apply to ${scope === "selected" ? selectedIds.length : "all"} developer${scope === "selected" && selectedIds.length === 1 ? "" : "s"}`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
