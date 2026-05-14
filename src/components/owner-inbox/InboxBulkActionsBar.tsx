import { Button } from "@/components/ui/button";
import { CheckCheck, Reply, Clock, CheckCircle, X, Bell } from "lucide-react";
import type { ThreadStatus } from "@/hooks/useOwnerInbox";

interface Props {
  selectedCount: number;
  onClear: () => void;
  onMarkRead: () => void;
  onSetStatus: (status: ThreadStatus) => void;
  disabled?: boolean;
}

export default function InboxBulkActionsBar({ selectedCount, onClear, onMarkRead, onSetStatus, disabled }: Props) {
  if (selectedCount === 0) return null;
  return (
    <div className="flex items-center justify-between gap-2 mb-3 rounded-xl border border-[#B89555]/40 bg-[#EFE6D6]/60 px-3 py-2 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
        <CheckCheck className="h-4 w-4 text-[#B89555]" />
        {selectedCount} selected
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <Button size="sm" variant="outline" className="h-7 text-[11px] border-[#B89555]/40" disabled={disabled} onClick={onMarkRead}>
          <CheckCheck className="h-3 w-3 mr-1" /> Mark read
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[11px] border-blue-300 text-blue-700" disabled={disabled} onClick={() => onSetStatus("new")}>
          <Bell className="h-3 w-3 mr-1" /> New
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[11px] border-red-300 text-red-700" disabled={disabled} onClick={() => onSetStatus("needs_reply")}>
          <Reply className="h-3 w-3 mr-1" /> Needs reply
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[11px] border-orange-300 text-orange-700" disabled={disabled} onClick={() => onSetStatus("follow_up_due")}>
          <Clock className="h-3 w-3 mr-1" /> Follow-up
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[11px] border-green-300 text-green-700" disabled={disabled} onClick={() => onSetStatus("closed")}>
          <CheckCircle className="h-3 w-3 mr-1" /> Close
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-[11px] text-[#1A1A1A]/60" onClick={onClear}>
          <X className="h-3 w-3 mr-1" /> Clear
        </Button>
      </div>
    </div>
  );
}
