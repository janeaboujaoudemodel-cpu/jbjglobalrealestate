import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Globe, Upload, UserPlus } from "lucide-react";

interface LeadSourceFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const LEAD_SOURCES = [
  { value: "all", label: "All Sources", icon: Database },
  { value: "website", label: "Website Leads", icon: Globe },
  { value: "import", label: "Imported (CSV/Excel)", icon: Upload },
  { value: "manual", label: "Manual Entry", icon: UserPlus },
];

const LeadSourceFilter = ({ value, onChange }: LeadSourceFilterProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px] bg-zinc-900 border-zinc-700 text-white">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Lead Source" />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-zinc-900 border-zinc-700 z-[100]">
        {LEAD_SOURCES.map((source) => (
          <SelectItem key={source.value} value={source.value} className="text-white hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white">
            <div className="flex items-center gap-2">
              <source.icon className="h-4 w-4 text-primary" />
              <span className="font-medium">{source.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LeadSourceFilter;
