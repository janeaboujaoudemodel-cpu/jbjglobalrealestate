/**
 * OutreachActionsMenu — unified dropdown card replacing the separate
 * "Email Selected", "Edit Templates", "Send Test", "Activity Log" buttons
 * on both the Brokerage and Developer tabs of CRM Relationships.
 *
 * Keeps existing handlers — no business logic change.
 */
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Send, FileEdit, FlaskConical, Bell, ChevronDown, Mail } from "lucide-react";

interface Props {
  selectedCount: number;
  onSendSelected: () => void;
  onEditTemplate: () => void;
  onSendTest: () => void;
  onActivityLog: () => void;
  sendLabel?: string;
}

export function OutreachActionsMenu({
  selectedCount,
  onSendSelected,
  onEditTemplate,
  onSendTest,
  onActivityLog,
  sendLabel = "Send to Selected",
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="gold" className="shadow-md">
          <Mail className="w-4 h-4 mr-2" />
          Outreach
          {selectedCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-[#1A1A1A]/15 text-[10px] font-bold">
              {selectedCount}
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-[#FDFBF7] border-[#B89555]/40">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/70">
          Outreach
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={onSendSelected}
          disabled={selectedCount === 0}
          className="cursor-pointer"
        >
          <Send className="w-4 h-4 mr-2" />
          {sendLabel}
          {selectedCount > 0 && <span className="ml-auto text-xs font-bold">{selectedCount}</span>}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onEditTemplate} className="cursor-pointer">
          <FileEdit className="w-4 h-4 mr-2" />
          Edit template
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSendTest} className="cursor-pointer">
          <FlaskConical className="w-4 h-4 mr-2" />
          Send test
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onActivityLog} className="cursor-pointer">
          <Bell className="w-4 h-4 mr-2" />
          Activity log
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
