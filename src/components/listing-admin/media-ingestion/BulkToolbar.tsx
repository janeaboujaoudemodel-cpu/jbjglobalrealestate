import {
  CheckCircle2,
  SkipForward,
  Trash2,
  Copy,
  RefreshCw,
  Download,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkToolbarProps {
  count: number;
  total: number;
  onSelectAll: () => void;
  onInvert: () => void;
  onClear: () => void;
  onApprove: () => void;
  onSkip: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onReclassify: () => void;
  onExportCsv: () => void;
  busy?: boolean;
}

export function BulkToolbar({
  count,
  total,
  onSelectAll,
  onInvert,
  onClear,
  onApprove,
  onSkip,
  onDelete,
  onDuplicate,
  onReclassify,
  onExportCsv,
  busy,
}: BulkToolbarProps) {
  return (
    <div className="sticky top-[88px] z-10 rounded-xl border border-gold/40 bg-[#EFE6D6] p-3 flex flex-wrap items-center gap-2 shadow-sm">
      <div className="text-sm font-medium text-foreground mr-2">
        {count} of {total} selected
      </div>
      <Button size="sm" variant="outline" onClick={onSelectAll} disabled={busy}>
        Select all
      </Button>
      <Button size="sm" variant="outline" onClick={onInvert} disabled={busy}>
        Invert
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear} disabled={busy || count === 0}>
        <X className="w-3.5 h-3.5 mr-1" /> Clear
      </Button>
      <div className="w-px h-6 bg-gold/30 mx-1" />
      <Button
        size="sm"
        variant="gold"
        onClick={onApprove}
        disabled={busy || count === 0}
      >
        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve & merge
      </Button>
      <Button size="sm" variant="outline" onClick={onSkip} disabled={busy || count === 0}>
        <SkipForward className="w-3.5 h-3.5 mr-1" /> Skip
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onDuplicate}
        disabled={busy || count === 0}
      >
        <Copy className="w-3.5 h-3.5 mr-1" /> Duplicate
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onReclassify}
        disabled={busy || count === 0}
      >
        <RefreshCw className="w-3.5 h-3.5 mr-1" /> Re-run AI
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onExportCsv}
        disabled={busy || count === 0}
      >
        <Download className="w-3.5 h-3.5 mr-1" /> CSV
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={onDelete}
        disabled={busy || count === 0}
      >
        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
      </Button>
    </div>
  );
}
