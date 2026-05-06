/**
 * CRMBulkActionsBar — appears when rows are selected.
 * Send to Junk Bin · Send to Trash · Restore · Export · Clear.
 * Operates on `crm_leads`, `crm_brokerages`, or `crm_developer_registry`.
 */
import { Button } from "@/components/ui/button";
import { Archive, Trash2, RotateCcw, Download, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Table = "crm_leads" | "crm_brokerages" | "crm_developer_registry";

interface Props {
  table: Table;
  ids: string[];
  /** when true the bar is in "trash"/"junk" view so we show Restore. */
  view: "active" | "junk" | "trash" | "list";
  onClear: () => void;
  onChanged?: () => void;
  onExport?: () => void;
}

export function CRMBulkActionsBar({ table, ids, view, onClear, onChanged, onExport }: Props) {
  if (!ids.length) return null;

  const run = async (patch: Record<string, any>, label: string) => {
    const { error } = await supabase.from(table as any).update(patch).in("id", ids);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${ids.length} row${ids.length > 1 ? "s" : ""} ${label}`);
    onChanged?.();
    onClear();
  };

  const sendJunk = () => run({ is_junk: true }, "moved to Junk Bin");
  const sendTrash = () => run({ deleted_at: new Date().toISOString() }, "moved to Trash");
  const restore = () =>
    run(
      view === "junk" ? { is_junk: false } : { deleted_at: null },
      "restored",
    );

  return (
    <div className="sticky bottom-3 z-30 flex items-center gap-2 px-3 py-2 bg-[#1A1A1A] text-white rounded-xl shadow-lg border border-[#B89555]/40">
      <span className="text-sm font-semibold pr-1">{ids.length} selected</span>

      {(view === "active" || view === "list") && (
        <>
          <Button size="sm" variant="secondary" onClick={sendJunk}>
            <Archive className="w-3.5 h-3.5 mr-1.5" /> Send to Junk
          </Button>
          <Button size="sm" variant="secondary" onClick={sendTrash}>
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Send to Trash
          </Button>
        </>
      )}

      {(view === "junk" || view === "trash") && (
        <Button size="sm" variant="secondary" onClick={restore}>
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Restore
        </Button>
      )}

      {onExport && (
        <Button size="sm" variant="secondary" onClick={onExport}>
          <Download className="w-3.5 h-3.5 mr-1.5" /> Export
        </Button>
      )}

      <Button size="sm" variant="ghost" className="text-white hover:text-white/90" onClick={onClear}>
        <X className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
