import { Check, CloudOff, Loader2, RotateCcw } from "lucide-react";
import type { AutosaveStatus } from "@/hooks/useDocumentAutosave";

interface Props {
  status: AutosaveStatus;
  dirty: boolean;
  lastSavedAt: Date | null;
  error: string | null;
  onRetry: () => void;
}

function timeLabel(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Small, always-visible autosave state: Saving… / Saved / Save failed. */
export function AutosaveStatusChip({ status, dirty, lastSavedAt, error, onRetry }: Props) {
  if (status === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        title={error || "Save failed"}
        className="h-10 inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 px-2.5 text-xs font-medium text-destructive"
      >
        <CloudOff className="w-3.5 h-3.5" />
        <span>Save failed</span>
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    );
  }
  if (status === "saving") {
    return (
      <span className="h-10 inline-flex items-center gap-1.5 rounded-md border border-[#B89555]/40 bg-[#F7F2EA] px-2.5 text-xs font-medium text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Saving…
      </span>
    );
  }
  if (status === "saved" && !dirty) {
    return (
      <span
        title={lastSavedAt ? `Draft saved at ${timeLabel(lastSavedAt)}` : "Draft saved"}
        className="h-10 inline-flex items-center gap-1.5 rounded-md border border-[#B89555]/40 bg-[#F7F2EA] px-2.5 text-xs font-medium text-muted-foreground"
      >
        <Check className="w-3.5 h-3.5" />
        Saved{lastSavedAt ? ` ${timeLabel(lastSavedAt)}` : ""}
      </span>
    );
  }
  if (dirty) {
    return (
      <span className="h-10 inline-flex items-center gap-1.5 rounded-md border border-[#B89555]/40 bg-[#F7F2EA] px-2.5 text-xs font-medium text-muted-foreground">
        Unsaved changes
      </span>
    );
  }
  return null;
}

export default AutosaveStatusChip;
