import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Bell, Calendar, FileText } from "lucide-react";
import QuickActivityDialog, { QuickActivityType, QuickEntity } from "./QuickActivityDialog";

interface Props {
  entityType: QuickEntity;
  entityId: string;
  entityName: string;
  brokerageId?: string;
  size?: "sm" | "icon" | "default";
  showLabels?: boolean;
}

export default function QuickActivityActions({
  entityType, entityId, entityName, brokerageId,
  size = "sm", showLabels = false,
}: Props) {
  const [open, setOpen] = useState<QuickActivityType | null>(null);

  const Btn = ({ type, icon: Icon, label }: { type: QuickActivityType; icon: any; label: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size={size === "icon" ? "icon" : "sm"}
          variant="outline"
          onClick={(e) => { e.stopPropagation(); setOpen(type); }}
          className={size === "icon" ? "h-8 w-8" : ""}
          aria-label={`Add ${label.toLowerCase()}`}
        >
          <Icon className={`w-3.5 h-3.5 ${showLabels ? "mr-1" : ""}`} />
          {showLabels && label}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Add {label.toLowerCase()}</TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="inline-flex gap-1.5 items-center">
        <Btn type="note" icon={FileText} label="Note" />
        <Btn type="calendar_event" icon={Calendar} label="Calendar" />
        <Btn type="reminder" icon={Bell} label="Reminder" />
      </div>
      {open && (
        <QuickActivityDialog
          open={!!open}
          onOpenChange={(v) => !v && setOpen(null)}
          defaultType={open}
          entityType={entityType}
          entityId={entityId}
          entityName={entityName}
          brokerageId={brokerageId}
        />
      )}
    </TooltipProvider>
  );
}
