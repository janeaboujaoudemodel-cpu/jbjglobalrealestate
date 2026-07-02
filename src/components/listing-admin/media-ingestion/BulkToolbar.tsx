import {
  CheckCircle2,
  Sparkles,
  SkipForward,
  Trash2,
  Copy,
  RefreshCw,
  Download,
  X,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkToolbarProps {
  count: number;
  total: number;
  onSelectAll: () => void;
  onInvert: () => void;
  onClear: () => void;
  onAttach: () => void;
  onExtract: () => void;
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
  onAttach,
  onExtract,
  onSkip,
  onDelete,
  onDuplicate,
  onReclassify,
  onExportCsv,
  busy,
}: BulkToolbarProps) {
  const disabled = busy || count === 0;
  return (
    <div className="sticky top-[88px] z-10 rounded-xl border border-[#B89555]/40 bg-[#EFE6D6] p-3 flex flex-wrap items-center gap-2 shadow-sm">
      <div className="text-sm font-medium text-[#1A1A1A] mr-2">
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
      <div className="w-px h-6 bg-[#B89555]/30 mx-1" />
      <Button size="sm" variant="gold" onClick={onAttach} disabled={disabled}>
        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Attach to listing
      </Button>
      <Button size="sm" data-cta="dark" className="jj-cta-dark" onClick={onAttach} disabled={disabled}>
        <UploadCloud className="w-3.5 h-3.5 mr-1" /> Publish selected
      </Button>
      <Button size="sm" variant="outline" onClick={onExtract} disabled={disabled}>
        <Sparkles className="w-3.5 h-3.5 mr-1" /> Extract only
      </Button>
      <Button size="sm" variant="outline" onClick={onSkip} disabled={disabled}>
        <SkipForward className="w-3.5 h-3.5 mr-1" /> Skip
      </Button>
      <Button size="sm" variant="outline" onClick={onDuplicate} disabled={disabled}>
        <Copy className="w-3.5 h-3.5 mr-1" /> Duplicate
      </Button>
      <Button size="sm" variant="outline" onClick={onReclassify} disabled={disabled}>
        <RefreshCw className="w-3.5 h-3.5 mr-1" /> Re-run AI
      </Button>
      <Button size="sm" variant="outline" onClick={onExportCsv} disabled={disabled}>
        <Download className="w-3.5 h-3.5 mr-1" /> CSV
      </Button>
      <Button size="sm" variant="destructive" onClick={onDelete} disabled={disabled}>
        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
      </Button>
    </div>
  );
}
