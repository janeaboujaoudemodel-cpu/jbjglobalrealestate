import { Download, FileSpreadsheet, FileText as FileTextIcon, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ExportFormat = "csv" | "xlsx" | "pdf";

interface ExportMenuProps {
  onExport: (format: ExportFormat) => void;
  label?: string;
  disabled?: boolean;
  align?: "start" | "end" | "center";
  /** Hide a format if it doesn't apply (e.g. activity log without PDF) */
  formats?: ExportFormat[];
}

const FORMAT_META: Record<ExportFormat, { label: string; icon: React.ElementType }> = {
  pdf: { label: "Export as PDF", icon: FileTextIcon },
  xlsx: { label: "Export as Excel (.xlsx)", icon: FileSpreadsheet },
  csv: { label: "Export as CSV", icon: FileType },
};

export function ExportMenu({
  onExport,
  label = "Export",
  disabled,
  align = "end",
  formats = ["pdf", "xlsx", "csv"],
}: ExportMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled} title="Download the visible list">
          <Download className="w-4 h-4 mr-2" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="bg-[#FDFBF7] border border-[#B89555]/30 text-[#1A1A1A]">
        {formats.map((f) => {
          const Meta = FORMAT_META[f];
          const Icon = Meta.icon;
          return (
            <DropdownMenuItem
              key={f}
              onClick={() => onExport(f)}
              className="cursor-pointer focus:bg-[#EFE6D6] focus:text-[#1A1A1A]"
            >
              <Icon className="w-4 h-4 mr-2 text-[#1A1A1A]/70" />
              {Meta.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
