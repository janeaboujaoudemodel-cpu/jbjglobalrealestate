/**
 * DocumentActionSheet
 * -------------------
 * GLOBAL primitive used by every document/contract/signature/paper tool.
 *
 * When a user clicks a saved-document row in any library, this sheet pops
 * with three choices: Preview · Edit · Delete. The editor is NEVER opened
 * directly from a click.
 *
 * See mem://documents/document-action-picker-and-recently-deleted-standard
 */
import { Eye, Pencil, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface DocumentActionSheetItem {
  id: string;
  title: string;
  subtitle?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: DocumentActionSheetItem | null;
  onPreview: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function DocumentActionSheet({
  open, onOpenChange, item, onPreview, onEdit, onDelete,
}: Props) {
  if (!item) return null;
  const handle = (fn: (id: string) => void) => () => {
    fn(item.id);
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm border-[#B89555]/40 bg-[#F7F2EA] p-0 overflow-hidden"
      >
        <div className="px-5 pt-5 pb-3 border-b border-[#B89555]/25">
          <DialogTitle className="text-sm font-semibold text-[#1A1A1A] truncate">
            {item.title}
          </DialogTitle>
          {item.subtitle && (
            <DialogDescription className="text-[11px] text-[#1A1A1A]/65 font-mono mt-0.5">
              {item.subtitle}
            </DialogDescription>
          )}
        </div>
        <div className="flex flex-col">
          <Row icon={Eye}    label="Preview" onClick={handle(onPreview)} />
          <Row icon={Pencil} label="Edit"    onClick={handle(onEdit)} />
          <Row icon={Trash2} label="Delete"  onClick={handle(onDelete)} danger />
        </div>
        <div className="px-5 py-2 border-t border-[#B89555]/25 bg-[#EFE6D6]/40 text-[10px] text-[#1A1A1A]/60">
          Deleted documents can be restored from Recently Deleted within 30 days.
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  icon: Icon, label, onClick, danger,
}: { icon: any; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-5 py-3 text-left text-sm border-b border-[#B89555]/15 last:border-0 transition-colors ${
        danger
          ? "text-[#7a1f1f] hover:bg-[#fbe9e9]"
          : "text-[#1A1A1A] hover:bg-[#EFE6D6]/60"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium">{label}</span>
    </button>
  );
}
